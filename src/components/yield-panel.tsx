import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@wealthfolio/ui";
import type { DividendMetrics } from "../lib/calc";
import { COLORS } from "../lib/palette";
import { MoneyTooltip } from "./chart-bits";
import { EmptyState, Panel } from "./primitives";

type Mode = "realized" | "indicated";

export function YieldPanel({ metrics }: { metrics: DividendMetrics }) {
  const [mode, setMode] = useState<Mode>("realized");

  const data = useMemo(
    () =>
      metrics.holdings
        .filter((h) => h.income > 0 || h.indicatedYield > 0)
        .map((h) => ({
          label: h.symbol,
          realized: Number((h.yieldOnValue * 100).toFixed(2)),
          cost: Number((h.yieldOnCost * 100).toFixed(2)),
          indicated: Number((h.indicatedYield * 100).toFixed(2)),
          indicatedCost:
            h.costBasis > 0
              ? Number(((h.indicatedYield * h.marketValue) / h.costBasis * 100).toFixed(2))
              : 0,
        }))
        .sort((a, b) => (mode === "realized" ? b.realized - a.realized : b.indicated - a.indicated))
        .slice(0, 16),
    [metrics.holdings, mode],
  );

  const valueKey = mode === "realized" ? "realized" : "indicated";
  const costKey = mode === "realized" ? "cost" : "indicatedCost";

  return (
    <Panel
      title="Yield / yield on cost"
      tip={
        mode === "realized"
          ? "Realized: dividends actually received in the last 12 months, over market value and over cost basis."
          : "Indicated: the market-data provider's most recent per-share rate x payment frequency, over market value and over cost basis."
      }
      actions={
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as Mode)}
        >
          <ToggleGroupItem value="realized" className="h-8 px-2 text-xs">
            Realized
          </ToggleGroupItem>
          <ToggleGroupItem value="indicated" className="h-8 px-2 text-xs">
            Indicated
          </ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {data.length === 0 ? (
        <EmptyState message="No income-producing holdings." />
      ) : (
        <>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 44 }}>
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
                  width={44}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={
                    <MoneyTooltip
                      currency={metrics.baseCurrency}
                      valueFormatter={(v) => `${v.toFixed(2)}%`}
                    />
                  }
                />
                <Bar dataKey={costKey} name="Yield on cost" fill={COLORS.teal} radius={[3, 3, 0, 0]} maxBarSize={16} />
                <Bar dataKey={valueKey} name="Yield" fill={COLORS.purple} radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS.purple }} />
              Yield
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS.teal }} />
              Yield on cost
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}
