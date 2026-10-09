import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DividendMetrics, Grouping, RangeKey } from "../lib/calc";
import { buildReceivedSeries } from "../lib/calc";
import { formatCurrency, formatCurrencyCompact } from "../lib/format";
import { COLORS } from "../lib/palette";
import { ReceivedTooltip } from "./chart-bits";
import { EmptyState, Panel } from "./primitives";
import { RangeGroupingControls, SeriesTotal } from "./series-controls";

export function DividendsReceived({ metrics }: { metrics: DividendMetrics }) {
  const [range, setRange] = useState<RangeKey>("12m");
  const [grouping, setGrouping] = useState<Grouping>("monthly");

  const series = useMemo(
    () => buildReceivedSeries(metrics.monthlyBreakdown, range, grouping),
    [metrics.monthlyBreakdown, range, grouping],
  );
  const total = useMemo(() => series.reduce((s, p) => s + p.value, 0), [series]);
  const rotate = series.length > 12;

  return (
    <Panel
      title="Dividends received"
      tip="Dividend cash received per period, converted to your base currency. Hover a bar to see the per-holding breakdown."
      actions={
        <RangeGroupingControls
          range={range}
          onRangeChange={setRange}
          grouping={grouping}
          onGroupingChange={setGrouping}
        />
      }
    >
      <SeriesTotal value={formatCurrency(total, metrics.baseCurrency)} color={COLORS.purple} />
      {series.length === 0 ? (
        <EmptyState message="No dividend history yet." />
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: rotate ? 24 : 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={rotate ? -35 : 0}
                textAnchor={rotate ? "end" : "middle"}
                height={rotate ? 48 : 30}
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
                content={<ReceivedTooltip currency={metrics.baseCurrency} />}
              />
              <Bar dataKey="value" name="Dividends" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {series.map((_, i) => (
                  <Cell key={i} fill={COLORS.purple} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
