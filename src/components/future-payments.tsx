import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DividendMetrics } from "../lib/calc";
import { formatCurrency, formatCurrencyCompact } from "../lib/format";
import { COLORS } from "../lib/palette";
import { MoneyTooltip } from "./chart-bits";
import { EmptyState, Panel } from "./primitives";

export function FuturePayments({ metrics }: { metrics: DividendMetrics }) {
  const data = metrics.forward;
  const monthlyAvg = data.length ? metrics.forwardTotal / 12 : 0;

  return (
    <Panel
      title="Future payments"
      tip={
        metrics.forwardSource === "provider"
          ? "Projected dividend income for the next twelve months, built from the market-data provider's per-share dividend history scaled to your current share counts."
          : "Projected dividend income for the next twelve months, replaying the trailing twelve-month seasonal pattern (provider data unavailable)."
      }
    >
      {data.length === 0 ? (
        <EmptyState message="Not enough history to project payments." />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-6">
            <div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ backgroundColor: COLORS.blue }}
                />
                Next 12m
              </div>
              <div className="text-xl font-semibold tabular-nums">
                {formatCurrency(metrics.forwardTotal, metrics.baseCurrency)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ backgroundColor: COLORS.teal }}
                />
                Monthly
              </div>
              <div className="text-xl font-semibold tabular-nums">
                {formatCurrency(monthlyAvg, metrics.baseCurrency)}
              </div>
            </div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="forwardFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.blueSoft} />
                    <stop offset="100%" stopColor={COLORS.blue} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrencyCompact(v, metrics.baseCurrency)}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={<MoneyTooltip currency={metrics.baseCurrency} />}
                />
                <Bar dataKey="value" name="Projected" fill="url(#forwardFill)" radius={[4, 4, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-muted-foreground mt-2 text-right text-xs">
            {metrics.forwardSource === "provider"
              ? "Source: market-data provider (per-share history × current shares)"
              : "Source: trailing-12m estimate"}
          </div>
        </>
      )}
    </Panel>
  );
}
