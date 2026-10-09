import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@wealthfolio/ui";
import type { DividendMetrics } from "../lib/calc";
import { formatCurrency, formatPercent } from "../lib/format";
import { seriesColor } from "../lib/palette";
import { EmptyState, Panel } from "./primitives";

interface SliceDatum {
  name: string;
  value: number;
  share: number;
  full: string;
}

export function Diversification({ metrics }: { metrics: DividendMetrics }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const data = useMemo<SliceDatum[]>(() => {
    const items = metrics.holdings
      .filter((h) => h.income > 0)
      .map((h) => ({ name: h.symbol, value: h.income, share: h.incomeShare, full: h.name }));
    if (items.length <= 12) return items;
    const top = items.slice(0, 11);
    const rest = items.slice(11);
    const restValue = rest.reduce((s, i) => s + i.value, 0);
    top.push({
      name: "Other",
      value: restValue,
      share: restValue / metrics.annualIncome,
      full: `${rest.length} more holdings`,
    });
    return top;
  }, [metrics.holdings, metrics.annualIncome]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const active = activeIndex >= 0 ? data[activeIndex] : undefined;

  return (
    <Panel
      title="Passive income diversification"
      tip="How your trailing 12-month dividend income is distributed across holdings. Hover a slice or a row to highlight it."
    >
      {data.length === 0 ? (
        <EmptyState message="No income-producing holdings." />
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2">
          <div className="relative" style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="90%"
                  paddingAngle={1}
                  stroke="var(--card)"
                  strokeWidth={2}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={seriesColor(i)}
                      opacity={activeIndex === -1 || activeIndex === i ? 1 : 0.35}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
              style={{ textAlign: "center" }}
            >
              {active ? (
                <>
                  <div className="text-sm font-semibold">{active.name}</div>
                  <div className="text-xl font-semibold tabular-nums">{formatPercent(active.share)}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatCurrency(active.value, metrics.baseCurrency)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-muted-foreground text-xs">Income</div>
                  <div className="text-xl font-semibold tabular-nums">
                    {formatCurrency(total, metrics.baseCurrency)}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
            {data.map((item, i) => (
              <div
                key={item.name}
                className={cn(
                  "flex flex-col gap-1 rounded-md px-1.5 py-1 transition-colors",
                  activeIndex === i && "bg-muted/60",
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: seriesColor(i) }}
                    />
                    <span className="w-12 shrink-0 truncate font-medium">{item.name}</span>
                    <span className="text-muted-foreground truncate">{item.full}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatPercent(item.share)}{" "}
                    <span className="text-muted-foreground">
                      ({formatCurrency(item.value, metrics.baseCurrency)})
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, item.share * 100)}%`, backgroundColor: seriesColor(i) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
