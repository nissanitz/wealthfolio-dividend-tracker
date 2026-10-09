import type { HoldingLike, IncomeSummary } from "./types";

export interface HoldingIncome {
  assetId: string;
  symbol: string;
  name: string;
  currency: string;
  exchangeMic?: string | null;
  instrumentType?: string | null;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  fxRatio: number;
  income: number;
  providerTtmPerShare: number;
  indicatedYield: number;
  yieldOnValue: number;
  yieldOnCost: number;
  weight: number;
  incomeShare: number;
}

export interface MonthPoint {
  key: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  value: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface GrowthPoint {
  month: string;
  [year: string]: number | string;
}

export interface ForwardPoint {
  key: string; // YYYY-MM
  label: string;
  value: number;
}

export interface DividendMetrics {
  baseCurrency: string;
  hasData: boolean;
  annualIncome: number;
  monthlyAverage: number;
  totalAllTime: number;
  ttmIncome: number;
  priorTtmIncome: number;
  incomeGrowth: number | null;
  portfolioValue: number;
  portfolioCost: number;
  yieldOnValue: number;
  yieldOnCost: number;
  indicatedYield: number;
  forwardSource: "provider" | "estimated";
  months: MonthPoint[];
  monthlyBreakdown: MonthlyBucket[];
  monthlyTax: MonthlyBucket[];
  growth: GrowthPoint[];
  growthYears: number[];
  forward: ForwardPoint[];
  forwardTotal: number;
  holdings: HoldingIncome[];
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseMonth(key: string): { year: number; month: number } {
  const [y, m] = key.split("-");
  return { year: Number(y), month: Number(m) };
}

export interface DividendActivity {
  assetId: string;
  assetSymbol?: string;
  accountId: string;
  currency: string;
  amount: string | number | null;
  date: string | Date;
}

export interface TaxActivity {
  symbol?: string;
  currency: string;
  amount: string | number | null;
  date: string | Date;
}

export interface MonthlyPart {
  assetId: string;
  symbol: string;
  amount: number;
}

export interface MonthlyBucket {
  key: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  value: number; // base currency, from the income summary
  parts: MonthlyPart[]; // per-asset split of `value`
}

export interface ReceivedPoint {
  label: string;
  value: number;
  breakdown: { symbol: string; amount: number }[];
}

export interface ProviderDividendInfo {
  events: { amount: number; date: number }[];
  ttmPerShare: number;
  lastPerShare: number;
  frequency: number; // payments per year
  indicatedPerShare: number;
}

/**
 * Build a per-month, per-asset dividend breakdown in base currency. Each
 * non-base dividend is converted at the exchange rate on its own payment date
 * (the actual base-currency amount received), so totals are date-specific.
 */
export function buildMonthlyBreakdown(
  dividends: DividendActivity[],
  holdings: HoldingLike[],
  baseCurrency: string,
  fxByKey: Map<string, number>,
): MonthlyBucket[] {
  const symbolByAsset = new Map<string, string>();
  const ratioByAsset = new Map<string, number>();
  const ratioBySymbol = new Map<string, number>();
  for (const h of holdings) {
    const inst = h.instrument;
    if (!inst) continue;
    symbolByAsset.set(inst.id, inst.symbol);
    const local = h.marketValue?.local ?? 0;
    const base = h.marketValue?.base ?? 0;
    const ratio = local > 0 ? base / local : 1;
    ratioByAsset.set(inst.id, ratio);
    ratioBySymbol.set(inst.symbol.toUpperCase(), ratio);
  }

  const raw = new Map<string, Map<string, MonthlyPart>>();
  for (const d of dividends) {
    const dt = d.date instanceof Date ? d.date : new Date(d.date);
    if (Number.isNaN(dt.getTime())) continue;
    const amount = Number(d.amount ?? 0);
    if (!Number.isFinite(amount) || amount === 0) continue;
    const key = monthKey(dt.getFullYear(), dt.getMonth() + 1);

    let base = amount;
    if (d.currency && d.currency !== baseCurrency) {
      const day = dt.toISOString().slice(0, 10);
      const rate =
        fxByKey.get(`${d.currency}|${day}`) ??
        ratioByAsset.get(d.assetId) ??
        ratioBySymbol.get((d.assetSymbol ?? "").toUpperCase());
      base = amount * (rate ?? 1);
    }

    const symbol = d.assetSymbol || symbolByAsset.get(d.assetId) || d.assetId || "UNKNOWN";
    const bucket = raw.get(key) ?? new Map<string, MonthlyPart>();
    const part = bucket.get(symbol) ?? { assetId: d.assetId, symbol, amount: 0 };
    part.amount += base;
    bucket.set(symbol, part);
    raw.set(key, bucket);
  }

  return Array.from(raw.keys())
    .sort()
    .map((key) => {
      const parts = Array.from(raw.get(key)!.values()).sort((a, b) => b.amount - a.amount);
      const value = parts.reduce((s, p) => s + p.amount, 0);
      const { year, month } = parseMonth(key);
      return { key, year, month, value, parts };
    });
}

/**
 * Build a per-month, per-holding tax breakdown in base currency from the
 * `TAX` activities (withholding tax booked alongside dividends). The symbol is
 * taken from the activity comment when the asset link is absent.
 */
export function buildTaxBreakdown(
  taxes: TaxActivity[],
  baseCurrency: string,
  fxByKey: Map<string, number>,
): MonthlyBucket[] {
  const raw = new Map<string, Map<string, MonthlyPart>>();
  for (const t of taxes) {
    const dt = t.date instanceof Date ? t.date : new Date(t.date);
    if (Number.isNaN(dt.getTime())) continue;
    const amount = Number(t.amount ?? 0);
    if (!Number.isFinite(amount) || amount === 0) continue;
    const key = monthKey(dt.getFullYear(), dt.getMonth() + 1);

    let base = amount;
    if (t.currency && t.currency !== baseCurrency) {
      const day = dt.toISOString().slice(0, 10);
      base = amount * (fxByKey.get(`${t.currency}|${day}`) ?? 1);
    }

    const symbol = t.symbol || "Other";
    const bucket = raw.get(key) ?? new Map<string, MonthlyPart>();
    const part = bucket.get(symbol) ?? { assetId: "", symbol, amount: 0 };
    part.amount += base;
    bucket.set(symbol, part);
    raw.set(key, bucket);
  }

  return Array.from(raw.keys())
    .sort()
    .map((key) => {
      const parts = Array.from(raw.get(key)!.values()).sort((a, b) => b.amount - a.amount);
      const value = parts.reduce((s, p) => s + p.amount, 0);
      const { year, month } = parseMonth(key);
      return { key, year, month, value, parts };
    });
}

/**
 * Summarise per-share dividend history from an external market-data provider
 * (Yahoo via the host). "Indicated" = most recent payment x detected frequency.
 */
export function summarizeProvider(events: { amount: number; date: number }[]): ProviderDividendInfo {
  const clean = events
    .filter((e) => Number.isFinite(e.amount) && e.amount > 0 && Number.isFinite(e.date))
    .sort((a, b) => a.date - b.date);
  if (clean.length === 0) {
    return { events: [], ttmPerShare: 0, lastPerShare: 0, frequency: 0, indicatedPerShare: 0 };
  }
  const cutoff = Date.now() / 1000 - 366 * 86400;
  const ttmPerShare = clean.filter((e) => e.date >= cutoff).reduce((s, e) => s + e.amount, 0);
  const last = clean[clean.length - 1];

  const recent = clean.slice(-6);
  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) gaps.push((recent[i].date - recent[i - 1].date) / 86400);
  gaps.sort((a, b) => a - b);
  const medianGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 365;
  let frequency = medianGap > 0 ? Math.round(365 / medianGap) : 1;
  frequency = Math.max(1, Math.min(12, frequency));

  const indicatedPerShare = last.amount > 0 ? last.amount * frequency : ttmPerShare;
  return { events: clean, ttmPerShare, lastPerShare: last.amount, frequency, indicatedPerShare };
}

export function buildMetrics(
  income: IncomeSummary[],
  holdingsInput: HoldingLike[],
  monthly: MonthlyBucket[],
  monthlyTax: MonthlyBucket[],
  providerByAsset?: Map<string, ProviderDividendInfo>,
): DividendMetrics {
  const all =
    income.find((e) => e.period === "ALL") ?? income.find((e) => e.period === "YTD") ?? income[0];

  const baseCurrency = all?.currency ?? holdingsInput[0]?.baseCurrency ?? "USD";

  // Monthly series is the date-specific base-currency breakdown (actual amounts
  // received), kept independent of Wealthfolio's latest-rate income summary.
  const months: MonthPoint[] = monthly.map((b) => ({
    key: b.key,
    year: b.year,
    month: b.month,
    value: b.value,
  }));

  const hasData = months.length > 0;
  const lastMonth = months.length ? months[months.length - 1] : undefined;

  const ttmBuckets = monthly.slice(-12);
  const ttmIncome = ttmBuckets.reduce((s, b) => s + b.value, 0);
  const priorBuckets = monthly.slice(Math.max(0, monthly.length - 24), Math.max(0, monthly.length - 12));
  const priorTtmIncome = priorBuckets.reduce((s, b) => s + b.value, 0);
  const firstMonth = months[0];
  const spanMonths =
    firstMonth && lastMonth
      ? (lastMonth.year - firstMonth.year) * 12 + (lastMonth.month - firstMonth.month) + 1
      : 0;
  // Only compare two complete trailing-12-month windows; a partial prior window
  // would overstate growth for young portfolios.
  const incomeGrowth =
    spanMonths >= 24 && priorTtmIncome > 0 && ttmBuckets.length === 12
      ? ttmIncome / priorTtmIncome - 1
      : null;

  // Aggregate holdings by asset id (a symbol can appear in multiple accounts).
  const map = new Map<string, HoldingIncome>();
  for (const h of holdingsInput) {
    const inst = h.instrument;
    if (!inst || !inst.symbol) continue;
    const assetId = inst.id || `${h.accountId}:${inst.symbol}`;
    const existing = map.get(assetId);
    const mv = h.marketValue?.base ?? 0;
    const cb = h.costBasis?.base ?? 0;
    const local = h.marketValue?.local ?? 0;
    const fxRatio = local > 0 ? mv / local : 1;
    if (existing) {
      existing.quantity += h.quantity ?? 0;
      existing.marketValue += mv;
      existing.costBasis += cb;
    } else {
      map.set(assetId, {
        assetId,
        symbol: inst.symbol,
        name: inst.name ?? inst.symbol,
        currency: inst.currency ?? h.localCurrency ?? baseCurrency,
        exchangeMic: inst.exchangeMic ?? null,
        instrumentType: inst.instrumentType ?? null,
        quantity: h.quantity ?? 0,
        price: h.price ?? 0,
        marketValue: mv,
        costBasis: cb,
        fxRatio,
        income: 0,
        providerTtmPerShare: 0,
        indicatedYield: 0,
        yieldOnValue: 0,
        yieldOnCost: 0,
        weight: 0,
        incomeShare: 0,
      });
    }
  }

  // Trailing-12-month income per asset comes from the per-asset monthly
  // breakdown (real cash received), never from Holding.income (all-time).
  const ttmKeys = new Set(ttmBuckets.map((b) => b.key));
  const byAsset12 = new Map<string, number>();
  const bySymbol12 = new Map<string, number>();
  for (const b of monthly) {
    if (!ttmKeys.has(b.key)) continue;
    for (const p of b.parts) {
      byAsset12.set(p.assetId, (byAsset12.get(p.assetId) ?? 0) + p.amount);
      bySymbol12.set(p.symbol.toUpperCase(), (bySymbol12.get(p.symbol.toUpperCase()) ?? 0) + p.amount);
    }
  }

  const holdings = Array.from(map.values());
  for (const h of holdings) {
    h.income = byAsset12.get(h.assetId) ?? bySymbol12.get(h.symbol.toUpperCase()) ?? 0;
    const provider = providerByAsset?.get(h.assetId);
    if (provider) {
      h.providerTtmPerShare = provider.ttmPerShare;
      h.indicatedYield = h.price > 0 ? provider.indicatedPerShare / h.price : 0;
    }
  }

  const annualIncome = holdings.reduce((s, h) => s + h.income, 0);
  const portfolioValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const portfolioCost = holdings.reduce((s, h) => s + h.costBasis, 0);

  for (const h of holdings) {
    h.yieldOnValue = h.marketValue > 0 ? h.income / h.marketValue : 0;
    h.yieldOnCost = h.costBasis > 0 ? h.income / h.costBasis : 0;
    h.weight = portfolioValue > 0 ? h.marketValue / portfolioValue : 0;
    h.incomeShare = annualIncome > 0 ? h.income / annualIncome : 0;
  }
  holdings.sort((a, b) => b.income - a.income);

  const totalAllTime = monthly.reduce((s, b) => s + b.value, 0);

  // Growth: grouped by calendar month across years.
  const years = Array.from(new Set(months.map((m) => m.year))).sort();
  const growthYears = years.slice(-3);
  const growth: GrowthPoint[] = MONTH_LABELS.map((label, idx) => {
    const point: GrowthPoint = { month: label };
    for (const y of growthYears) {
      const found = months.find((m) => m.year === y && m.month === idx + 1);
      point[String(y)] = found ? Number(found.value.toFixed(2)) : 0;
    }
    return point;
  });

  // Forward 12 months. Preferred source: the external provider's per-share
  // dividend history, scaled to current share counts and FX. Fallback: replay
  // the portfolio's trailing-12-month seasonal pattern from the income summary.
  const hasProvider = !!providerByAsset && providerByAsset.size > 0;
  const forward: ForwardPoint[] = [];
  let forwardSource: "provider" | "estimated" = "estimated";

  if (hasProvider && lastMonth) {
    const cutoff = Date.now() / 1000 - 366 * 86400;
    const providerByCal = new Map<number, number>();
    for (const h of holdings) {
      const p = providerByAsset!.get(h.assetId);
      if (!p || p.events.length === 0) continue;
      for (const e of p.events) {
        if (e.date < cutoff) continue;
        const month = new Date(e.date * 1000).getMonth() + 1;
        const cash = e.amount * h.quantity * h.fxRatio;
        providerByCal.set(month, (providerByCal.get(month) ?? 0) + cash);
      }
    }
    if (providerByCal.size > 0) {
      forwardSource = "provider";
      let y = lastMonth.year;
      let mo = lastMonth.month;
      for (let i = 0; i < 12; i++) {
        mo += 1;
        if (mo > 12) {
          mo = 1;
          y += 1;
        }
        forward.push({
          key: monthKey(y, mo),
          label: `${MONTH_LABELS[mo - 1]} ${String(y).slice(2)}`,
          value: Number((providerByCal.get(mo) ?? 0).toFixed(2)),
        });
      }
    }
  }

  if (forward.length === 0 && lastMonth) {
    const ttmByCalMonth = new Map<number, number>();
    for (const m of months.slice(-12)) {
      ttmByCalMonth.set(m.month, (ttmByCalMonth.get(m.month) ?? 0) + m.value);
    }
    let y = lastMonth.year;
    let mo = lastMonth.month;
    for (let i = 0; i < 12; i++) {
      mo += 1;
      if (mo > 12) {
        mo = 1;
        y += 1;
      }
      forward.push({
        key: monthKey(y, mo),
        label: `${MONTH_LABELS[mo - 1]} ${String(y).slice(2)}`,
        value: Number((ttmByCalMonth.get(mo) ?? 0).toFixed(2)),
      });
    }
  }
  const forwardTotal = forward.reduce((s, f) => s + f.value, 0);

  // Provider "indicated" annual income = most recent per-share rate x detected
  // frequency x current shares, converted to base.
  let indicatedAnnualCash = 0;
  if (hasProvider) {
    for (const h of holdings) {
      const p = providerByAsset!.get(h.assetId);
      if (p) indicatedAnnualCash += p.indicatedPerShare * h.quantity * h.fxRatio;
    }
  }
  const indicatedYield =
    portfolioValue > 0
      ? hasProvider
        ? indicatedAnnualCash / portfolioValue
        : annualIncome / portfolioValue
      : 0;

  return {
    baseCurrency,
    hasData,
    annualIncome,
    monthlyAverage: annualIncome / 12,
    totalAllTime,
    ttmIncome,
    priorTtmIncome,
    incomeGrowth,
    portfolioValue,
    portfolioCost,
    yieldOnValue: portfolioValue > 0 ? annualIncome / portfolioValue : 0,
    yieldOnCost: portfolioCost > 0 ? annualIncome / portfolioCost : 0,
    indicatedYield,
    forwardSource,
    months,
    monthlyBreakdown: monthly,
    monthlyTax,
    growth,
    growthYears,
    forward,
    forwardTotal,
    holdings,
  };
}

export type RangeKey = "12m" | "24m" | "ytd" | "all";
export type Grouping = "monthly" | "quarterly" | "annual";

function selectBuckets(monthly: MonthlyBucket[], range: RangeKey): MonthlyBucket[] {
  if (range === "12m") return monthly.slice(-12);
  if (range === "24m") return monthly.slice(-24);
  if (range === "ytd") {
    const year = monthly.length ? monthly[monthly.length - 1].year : new Date().getFullYear();
    return monthly.filter((b) => b.year === year);
  }
  return monthly;
}

function mergeParts(parts: MonthlyPart[]): { symbol: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const p of parts) map.set(p.symbol, (map.get(p.symbol) ?? 0) + p.amount);
  return Array.from(map.entries())
    .map(([symbol, amount]) => ({ symbol, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Series for the "Dividends received" chart, with a per-asset breakdown per bucket. */
export function buildReceivedSeries(
  monthly: MonthlyBucket[],
  range: RangeKey,
  grouping: Grouping,
): ReceivedPoint[] {
  const selected = selectBuckets(monthly, range);
  if (selected.length === 0) return [];

  if (grouping === "monthly") {
    return selected.map((b) => ({
      label: `${MONTH_LABELS[b.month - 1]} ${String(b.year).slice(2)}`,
      value: Number(b.value.toFixed(2)),
      breakdown: b.parts.map((p) => ({ symbol: p.symbol, amount: Number(p.amount.toFixed(2)) })),
    }));
  }

  const buckets = new Map<string, { label: string; value: number; parts: MonthlyPart[]; order: string }>();
  for (const b of selected) {
    let key: string;
    let label: string;
    let order: string;
    if (grouping === "quarterly") {
      const q = Math.floor((b.month - 1) / 3) + 1;
      key = `${b.year}-Q${q}`;
      label = `Q${q} ${String(b.year).slice(2)}`;
      order = `${b.year}-${q}`;
    } else {
      key = String(b.year);
      label = String(b.year);
      order = String(b.year);
    }
    const entry = buckets.get(key);
    if (entry) {
      entry.value += b.value;
      entry.parts.push(...b.parts);
    } else {
      buckets.set(key, { label, value: b.value, parts: [...b.parts], order });
    }
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.order.localeCompare(b.order))
    .map((b) => ({
      label: b.label,
      value: Number(b.value.toFixed(2)),
      breakdown: mergeParts(b.parts).map((p) => ({ symbol: p.symbol, amount: Number(p.amount.toFixed(2)) })),
    }));
}

/** Income by holding for a selected range, derived from the monthly breakdown. */
export function incomeByHoldingForRange(
  monthly: MonthlyBucket[],
  range: RangeKey,
  topN = 16,
): { series: SeriesPoint[]; total: number } {
  const selected = selectBuckets(monthly, range);
  const merged = mergeParts(selected.flatMap((b) => b.parts));
  const total = merged.reduce((s, p) => s + p.amount, 0);
  const series = merged
    .slice(0, topN)
    .map((p) => ({ label: p.symbol, value: Number(p.amount.toFixed(2)) }));
  return { series, total };
}

export { MONTH_LABELS };
