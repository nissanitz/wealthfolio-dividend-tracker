import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wealthfolio/ui";
import type { DividendMetrics, RangeKey } from "../lib/calc";
import { incomeByHoldingForRange } from "../lib/calc";
import { formatCurrency, formatCurrencyCompact } from "../lib/format";
import { COLORS } from "../lib/palette";
import { MoneyTooltip } from "./chart-bits";
import { EmptyState, Panel } from "./primitives";
import { RANGE_OPTIONS } from "./series-controls";

export function IncomeByHolding({ metrics }: { metrics: DividendMetrics }) {
  const [range, setRange] = useState<RangeKey>("12m");

  const { series, total } = useMemo(
    () => incomeByHoldingForRange(metrics.monthlyBreakdown, range),
    [metrics.monthlyBreakdown, range],
  );

  return (
    <Panel
      title="Income by holding"
      tip="Dividend income contributed by each holding for the selected period, in your base currency."
      actions={
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {series.length === 0 ? (
        <EmptyState message="No income-producing holdings." />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 44 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
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
              <Bar dataKey="value" name="Income" fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="text-muted-foreground mt-2 text-right text-xs">
        Total {formatCurrency(total, metrics.baseCurrency)}
      </div>
    </Panel>
  );
}
