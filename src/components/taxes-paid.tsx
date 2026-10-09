import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DividendMetrics, Grouping, RangeKey } from "../lib/calc";
import { buildReceivedSeries, incomeByHoldingForRange } from "../lib/calc";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "../lib/format";
import { COLORS } from "../lib/palette";
import { ReceivedTooltip } from "./chart-bits";
import { EmptyState, Panel } from "./primitives";
import { RangeGroupingControls, SeriesTotal } from "./series-controls";

export function TaxesPaid({ metrics }: { metrics: DividendMetrics }) {
  const [range, setRange] = useState<RangeKey>("12m");
  const [grouping, setGrouping] = useState<Grouping>("monthly");

  const series = useMemo(
    () => buildReceivedSeries(metrics.monthlyTax, range, grouping),
    [metrics.monthlyTax, range, grouping],
  );
  const tax = useMemo(
    () => incomeByHoldingForRange(metrics.monthlyTax, range).total,
    [metrics.monthlyTax, range],
  );
  const gross = useMemo(
    () => incomeByHoldingForRange(metrics.monthlyBreakdown, range).total,
    [metrics.monthlyBreakdown, range],
  );
  const net = gross - tax;
  const rate = gross > 0 ? tax / gross : 0;
  const rotate = series.length > 12;

  return (
    <Panel
      title="Taxes paid"
      tip="Withholding tax booked on dividends (the separate TAX activities), in your base currency. Hover a bar for the per-holding breakdown. The effective rate is tax divided by gross dividends."
      actions={
        <RangeGroupingControls
          range={range}
          onRangeChange={setRange}
          grouping={grouping}
          onGroupingChange={setGrouping}
        />
      }
    >
      <SeriesTotal value={formatCurrency(tax, metrics.baseCurrency)} color={COLORS.amber} />
      {series.length === 0 ? (
        <EmptyState message="No tax recorded for this period." />
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
              <Bar dataKey="value" name="Tax" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {series.map((_, i) => (
                  <Cell key={i} fill={COLORS.amber} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="text-muted-foreground mt-2 text-right text-xs">
        {formatPercent(rate)} effective rate · {formatCurrency(net, metrics.baseCurrency)} net
      </div>
    </Panel>
  );
}
