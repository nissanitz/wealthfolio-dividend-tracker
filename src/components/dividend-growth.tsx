import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DividendMetrics } from "../lib/calc";
import { formatCurrencyCompact } from "../lib/format";
import { COLORS } from "../lib/palette";
import { MoneyTooltip } from "./chart-bits";
import { EmptyState, Panel } from "./primitives";

function yearColor(indexFromNewest: number): string {
  // newest year = purple, previous = teal, older = blue
  const order = [COLORS.purple, COLORS.teal, COLORS.blue];
  return order[indexFromNewest] ?? COLORS.slate;
}

export function DividendGrowth({ metrics }: { metrics: DividendMetrics }) {
  const years = metrics.growthYears;
  const hasAny = metrics.growth.some((p) => years.some((y) => Number(p[String(y)] ?? 0) > 0));

  return (
    <Panel
      title="Dividend growth"
      tip="Dividend income by calendar month, one series per year, so seasonal patterns and year-over-year growth are easy to compare."
    >
      {!hasAny ? (
        <EmptyState message="Not enough history to compare years yet." />
      ) : (
        <>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.growth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
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
                {years.map((year, i) => (
                  <Bar
                    key={year}
                    dataKey={String(year)}
                    name={String(year)}
                    fill={yearColor(years.length - 1 - i)}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            {years.map((year, i) => (
              <span key={year} className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: yearColor(years.length - 1 - i) }}
                />
                {year}
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
