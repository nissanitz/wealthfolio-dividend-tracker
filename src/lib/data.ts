import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { AddonContext, ActivityDetails, ExchangeRateDateResult } from "@wealthfolio/addon-sdk";
import { QueryKeys } from "@wealthfolio/addon-sdk";
import type { Account, HoldingLike, IncomeSummary } from "./types";
import {
  buildMetrics,
  buildMonthlyBreakdown,
  buildTaxBreakdown,
  summarizeProvider,
  type DividendActivity,
  type DividendMetrics,
  type ProviderDividendInfo,
  type TaxActivity,
} from "./calc";

export interface DividendData {
  accounts: Account[];
  income: IncomeSummary[];
  holdings: HoldingLike[];
  metrics: DividendMetrics;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

async function fetchAllDividends(ctx: AddonContext): Promise<DividendActivity[]> {
  const pageSize = 1000;
  const out: DividendActivity[] = [];
  for (let page = 0; page < 25; page++) {
    const res = await ctx.api.activities.search(
      page,
      pageSize,
      { activityTypes: ["DIVIDEND"] },
      "",
      { id: "date", desc: false },
    );
    for (const a of res.data as ActivityDetails[]) {
      if (a.activityType !== "DIVIDEND") continue;
      out.push({
        assetId: a.assetId ?? "",
        assetSymbol: a.assetSymbol ?? undefined,
        accountId: a.accountId,
        currency: a.currency,
        amount: a.amount,
        date: a.date,
      });
    }
    if (res.data.length === 0 || out.length >= res.meta.totalRowCount) break;
  }
  return out;
}

/** Withholding tax rows carry the symbol in the comment (e.g. "HDIV(...) ... TAX"). */
function symbolFromComment(comment: string | undefined, assetSymbol: string | undefined): string | undefined {
  if (assetSymbol) return assetSymbol;
  const m = /^([A-Z][A-Z0-9.\-]{0,9})\(/.exec(comment ?? "");
  return m ? m[1] : undefined;
}

async function fetchAllTaxes(ctx: AddonContext): Promise<TaxActivity[]> {
  const pageSize = 1000;
  const out: TaxActivity[] = [];
  for (let page = 0; page < 25; page++) {
    const res = await ctx.api.activities.search(
      page,
      pageSize,
      { activityTypes: ["TAX"] },
      "",
      { id: "date", desc: false },
    );
    for (const a of res.data as ActivityDetails[]) {
      if (a.activityType !== "TAX") continue;
      out.push({
        symbol: symbolFromComment(a.comment, a.assetSymbol),
        currency: a.currency,
        amount: a.amount,
        date: a.date,
      });
    }
    if (res.data.length === 0 || out.length >= res.meta.totalRowCount) break;
  }
  return out;
}

interface YahooDividend {
  amount: number;
  date: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolve the exact Yahoo ticker, honouring the asset's provider overrides. */
function resolveYahooSymbol(
  symbol: string,
  mic: string | null | undefined,
  providerConfig: Record<string, unknown> | null | undefined,
): string {
  const override = (providerConfig as { overrides?: { YAHOO?: { symbol?: unknown } } } | null)
    ?.overrides?.YAHOO?.symbol;
  if (typeof override === "string" && override) return override;
  const m = (mic ?? "").toUpperCase();
  if (m === "XTSE" || m === "TSX") return `${symbol}.TO`;
  if (m === "XNEO" || m === "NEOE") return `${symbol}.NE`;
  if (m === "XTSX") return `${symbol}.V`;
  return symbol;
}

async function fetchOneYahoo(ctx: AddonContext, symbol: string): Promise<YahooDividend[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=2y&interval=1d&events=div`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await ctx.api.network.request({
        url,
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      });
      if (res.status === 429) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      if (res.status < 200 || res.status >= 300) return [];
      const json = JSON.parse(res.body) as {
        chart?: { result?: Array<{ events?: { dividends?: Record<string, YahooDividend> } }> };
      };
      const divs = json.chart?.result?.[0]?.events?.dividends ?? {};
      return Object.values(divs).map((d) => ({ amount: d.amount, date: d.date }));
    } catch {
      await sleep(600 * (attempt + 1));
    }
  }
  return [];
}

/**
 * Fetch per-share dividend history for every holding from Yahoo. Requests are
 * paced sequentially (Yahoo rate-limits bursts with HTTP 429) and cached by
 * react-query for 30 minutes.
 */
async function fetchAllYahooDividends(
  ctx: AddonContext,
  targets: { assetId: string; symbol: string }[],
): Promise<Record<string, YahooDividend[]>> {
  const out: Record<string, YahooDividend[]> = {};
  for (const t of targets) {
    out[t.assetId] = await fetchOneYahoo(ctx, t.symbol);
    await sleep(150);
  }
  return out;
}

export function useDividendData(ctx: AddonContext): DividendData {
  const accountsQuery = useQuery({
    queryKey: [QueryKeys.ACCOUNTS],
    queryFn: () => ctx.api.accounts.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const incomeQuery = useQuery({
    queryKey: [QueryKeys.INCOME_SUMMARY],
    queryFn: () => ctx.api.portfolio.getIncomeSummary() as Promise<IncomeSummary[]>,
    staleTime: 5 * 60 * 1000,
  });

  const dividendsQuery = useQuery({
    queryKey: [QueryKeys.ACTIVITIES, "dividends-ttm"],
    queryFn: () => fetchAllDividends(ctx),
    staleTime: 5 * 60 * 1000,
  });

  const taxesQuery = useQuery({
    queryKey: [QueryKeys.ACTIVITIES, "taxes"],
    queryFn: () => fetchAllTaxes(ctx),
    staleTime: 5 * 60 * 1000,
  });

  const accounts = accountsQuery.data ?? [];
  const income = incomeQuery.data ?? [];
  const dividends = dividendsQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];

  const holdingQueries = useQueries({
    queries: useMemo(
      () =>
        accounts.map((account) => ({
          queryKey: [QueryKeys.HOLDINGS, account.id],
          queryFn: () => ctx.api.portfolio.getHoldings(account.id) as Promise<HoldingLike[]>,
          staleTime: 5 * 60 * 1000,
        })),
      [accounts, ctx.api.portfolio],
    ),
  });

  const holdingsLoading = accounts.length > 0 && holdingQueries.some((q) => q.isLoading);
  const holdingsKey = holdingQueries.map((q) => q.dataUpdatedAt).join(",");

  const holdings = useMemo(
    () => holdingQueries.flatMap((q) => q.data ?? []).filter((h) => h && h.holdingType === "security"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [holdingsLoading, accounts.length, holdingsKey],
  );

  // Unique income-eligible instruments, used to fetch external dividend history.
  const instruments = useMemo(() => {
    const map = new Map<
      string,
      { assetId: string; symbol: string; exchangeMic?: string; instrumentType?: string; quoteCcy?: string }
    >();
    for (const h of holdings) {
      const inst = h.instrument;
      if (!inst || !inst.symbol) continue;
      if (inst.quoteMode === "MANUAL") continue;
      if (map.has(inst.id)) continue;
      map.set(inst.id, {
        assetId: inst.id,
        symbol: inst.symbol,
        exchangeMic: inst.exchangeMic ?? undefined,
        instrumentType: inst.instrumentType ?? undefined,
        quoteCcy: inst.currency ?? undefined,
      });
    }
    return Array.from(map.values());
  }, [holdings]);

  // Asset profiles give the provider overrides (e.g. EMCL -> EMCL.NE).
  const profileQueries = useQueries({
    queries: useMemo(
      () =>
        instruments.map((inst) => ({
          queryKey: [QueryKeys.ASSET_DATA, inst.assetId],
          queryFn: () => ctx.api.assets.getProfile(inst.assetId),
          staleTime: 30 * 60 * 1000,
        })),
      [instruments, ctx.api.assets],
    ),
  });

  const profileKey = profileQueries.map((q) => q.dataUpdatedAt).join(",");
  const yahooSymbols = useMemo(() => {
    const map = new Map<string, string>();
    instruments.forEach((inst, i) => {
      const profile = profileQueries[i]?.data;
      map.set(inst.assetId, resolveYahooSymbol(inst.symbol, inst.exchangeMic, profile?.providerConfig));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments, profileKey]);

  // External per-share dividend history from Yahoo (brokered by the host,
  // fetched sequentially to avoid provider rate limiting).
  const providerTargets = useMemo(
    () =>
      instruments.map((inst) => ({
        assetId: inst.assetId,
        symbol: yahooSymbols.get(inst.assetId) ?? inst.symbol,
      })),
    [instruments, yahooSymbols],
  );
  const providerSignature = providerTargets.map((t) => `${t.assetId}:${t.symbol}`).join(",");

  const providerQuery = useQuery({
    queryKey: ["yahoo-dividends-all", providerSignature],
    queryFn: () => fetchAllYahooDividends(ctx, providerTargets),
    enabled: providerTargets.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });

  const providerByAsset = useMemo(() => {
    const map = new Map<string, ProviderDividendInfo>();
    for (const [assetId, events] of Object.entries(providerQuery.data ?? {})) {
      if (events.length > 0) map.set(assetId, summarizeProvider(events));
    }
    return map;
  }, [providerQuery.data]);

  const baseCurrency = useMemo(() => {
    const all = income.find((e) => e.period === "ALL") ?? income[0];
    return all?.currency ?? holdings[0]?.baseCurrency ?? "USD";
  }, [income, holdings]);

  // Unique (currency, date) pairs for every non-base dividend or tax row, so
  // any range (12m/24m/YTD/all) can be converted at its own payment dates.
  const fxPairs = useMemo(() => {
    const seen = new Set<string>();
    const pairs: { fromCurrency: string; toCurrency: string; date: string }[] = [];
    const add = (currency: string, date: string | Date) => {
      if (!currency || currency === baseCurrency) return;
      const dt = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(dt.getTime())) return;
      const day = dt.toISOString().slice(0, 10);
      const key = `${currency}|${day}`;
      if (seen.has(key)) return;
      seen.add(key);
      pairs.push({ fromCurrency: currency, toCurrency: baseCurrency, date: day });
    };
    for (const d of dividends) add(d.currency, d.date);
    for (const t of taxes) add(t.currency, t.date);
    return pairs;
  }, [dividends, taxes, baseCurrency]);

  const fxSignature = useMemo(
    () => fxPairs.map((p) => `${p.fromCurrency}|${p.date}`).sort().join(","),
    [fxPairs],
  );

  const fxQuery = useQuery({
    queryKey: [QueryKeys.EXCHANGE_RATES, "dividend-fx", baseCurrency, fxSignature],
    queryFn: () => ctx.api.exchangeRates.getRatesForDates(fxPairs) as Promise<ExchangeRateDateResult[]>,
    enabled: fxPairs.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  const fxByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of fxQuery.data ?? []) {
      if (r.rate !== null && r.rate !== undefined) map.set(`${r.fromCurrency}|${r.date}`, r.rate);
    }
    return map;
  }, [fxQuery.data]);

  const monthly = useMemo(
    () => buildMonthlyBreakdown(dividends, holdings, baseCurrency, fxByKey),
    [dividends, holdings, baseCurrency, fxByKey],
  );

  const monthlyTax = useMemo(
    () => buildTaxBreakdown(taxes, baseCurrency, fxByKey),
    [taxes, baseCurrency, fxByKey],
  );

  const metrics = useMemo(
    () => buildMetrics(income, holdings, monthly, monthlyTax, providerByAsset),
    [income, holdings, monthly, monthlyTax, providerByAsset],
  );

  const isLoading =
    accountsQuery.isLoading ||
    incomeQuery.isLoading ||
    dividendsQuery.isLoading ||
    taxesQuery.isLoading ||
    holdingsLoading ||
    (fxPairs.length > 0 && fxQuery.isLoading);

  const isError =
    accountsQuery.isError || incomeQuery.isError || dividendsQuery.isError || taxesQuery.isError;

  const refetch = () => {
    void accountsQuery.refetch();
    void incomeQuery.refetch();
    void dividendsQuery.refetch();
    void taxesQuery.refetch();
    holdingQueries.forEach((q) => void q.refetch());
    profileQueries.forEach((q) => void q.refetch());
    if (fxPairs.length > 0) void fxQuery.refetch();
    void providerQuery.refetch();
  };

  return {
    accounts,
    income,
    holdings,
    metrics,
    isLoading,
    isError,
    refetch,
  };
}
