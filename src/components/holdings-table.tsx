import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TickerAvatar,
  Icons,
  cn,
  useBalancePrivacy,
} from "@wealthfolio/ui";
import type { DividendMetrics, HoldingIncome } from "../lib/calc";
import { formatCurrency, formatPercent, formatShares } from "../lib/format";
import { COLORS } from "../lib/palette";
import { EmptyState, Panel } from "./primitives";

type SortKey =
  | "symbol"
  | "quantity"
  | "price"
  | "costBasis"
  | "marketValue"
  | "income"
  | "yieldOnValue"
  | "indicatedYield"
  | "yieldOnCost"
  | "weight";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "symbol", label: "Holding" },
  { key: "quantity", label: "Shares", numeric: true },
  { key: "price", label: "Price", numeric: true },
  { key: "costBasis", label: "Cost basis", numeric: true },
  { key: "marketValue", label: "Current value", numeric: true },
  { key: "income", label: "Dividends (12m)", numeric: true },
  { key: "yieldOnValue", label: "Div yield", numeric: true },
  { key: "indicatedYield", label: "Ind. yield", numeric: true },
  { key: "yieldOnCost", label: "Yield on cost", numeric: true },
  { key: "weight", label: "Share", numeric: true },
];

function SortHeader({
  label,
  active,
  dir,
  numeric,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  numeric?: boolean;
  onClick: () => void;
}) {
  return (
    <TableHead className={cn(numeric && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium",
          numeric && "ml-auto",
        )}
      >
        {label}
        {active ? (
          dir === "desc" ? (
            <Icons.ChevronDown size={12} />
          ) : (
            <Icons.ChevronUp size={12} />
          )
        ) : null}
      </button>
    </TableHead>
  );
}

export function HoldingsTable({ metrics }: { metrics: DividendMetrics }) {
  const { isBalanceHidden } = useBalancePrivacy();
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "income",
    dir: "desc",
  });

  const rows = useMemo(() => {
    const data = metrics.holdings.filter((h) => h.income > 0);
    data.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "symbol") return a.symbol.localeCompare(b.symbol) * dir;
      const av = a[sort.key] as number;
      const bv = b[sort.key] as number;
      return (av - bv) * dir;
    });
    return data;
  }, [metrics.holdings, sort]);

  const toggle = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );

  const money = (value: number) =>
    isBalanceHidden ? "••••" : formatCurrency(value, metrics.baseCurrency);

  const label = (h: HoldingIncome) =>
    isBalanceHidden ? "••••" : formatCurrency(h.marketValue, metrics.baseCurrency);

  return (
    <Panel
      title="Holdings income"
      tip="Per-holding dividend income (trailing 12 months), yields and portfolio weight. Click a column to sort."
      contentClassName="p-0 pt-0"
    >
      {rows.length === 0 ? (
        <EmptyState message="No holdings to display." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((c) => (
                  <SortHeader
                    key={c.key}
                    label={c.label}
                    numeric={c.numeric}
                    active={sort.key === c.key}
                    dir={sort.dir}
                    onClick={() => toggle(c.key)}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((h) => (
                <TableRow key={h.assetId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TickerAvatar
                        symbol={h.symbol}
                        exchangeMic={h.exchangeMic}
                        instrumentType={h.instrumentType}
                        className="h-8 w-8"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{h.symbol}</div>
                        <div className="text-muted-foreground max-w-[240px] truncate text-xs">
                          {h.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatShares(h.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {isBalanceHidden ? "••••" : formatCurrency(h.price, h.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {money(h.costBasis)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{label(h)}</TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums" style={{ color: COLORS.purple }}>
                    {money(h.income)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatPercent(h.yieldOnValue)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums" style={{ color: COLORS.blue }}>
                    {h.indicatedYield > 0 ? formatPercent(h.indicatedYield) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums" style={{ color: COLORS.teal }}>
                    {formatPercent(h.yieldOnCost)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatPercent(h.weight)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  );
}
