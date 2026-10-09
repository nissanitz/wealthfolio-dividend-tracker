import type { ReactNode } from "react";
import { formatCurrency } from "../lib/format";
import type { ReceivedPoint } from "../lib/calc";

export interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  currency: string;
  labelSuffix?: string;
  valueFormatter?: (value: number, item: TooltipPayloadItem) => string;
}

export function MoneyTooltip({
  active,
  payload,
  label,
  currency,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-2.5 text-xs shadow-md">
      {label !== undefined ? (
        <div className="text-muted-foreground mb-1.5 font-medium">{label}</div>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => {
          const numeric = typeof item.value === "number" ? item.value : Number(item.value ?? 0);
          const formatted = valueFormatter
            ? valueFormatter(numeric, item)
            : formatCurrency(numeric, currency);
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color ?? "currentColor" }}
                />
                {item.name}
              </span>
              <span className="tabular-nums font-medium">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartFrame({ children, height = 280 }: { children: ReactNode; height?: number }) {
  return (
    <div style={{ width: "100%", height }}>
      {children}
    </div>
  );
}

/** Dark tooltip showing the per-asset breakdown of a "Dividends received" bar. */
export function ReceivedTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ReceivedPoint | undefined;
  if (!point) return null;
  const breakdown = point.breakdown ?? [];
  const shown = breakdown.slice(0, 12);
  const rest = breakdown.length - shown.length;

  return (
    <div
      className="rounded-lg border border-white/10 p-3 text-xs shadow-lg"
      style={{ backgroundColor: "rgba(24, 24, 27, 0.96)", color: "#fafafa", minWidth: 220 }}
    >
      <div className="mb-2 font-medium">
        {label ?? point.label}: {formatCurrency(point.value, currency)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16, rowGap: 4 }}>
        {shown.map((b) => (
          <div key={b.symbol} className="flex items-center justify-between gap-2">
            <span className="truncate opacity-90">{b.symbol}:</span>
            <span className="tabular-nums">{formatCurrency(b.amount, currency)}</span>
          </div>
        ))}
      </div>
      {rest > 0 ? <div className="mt-2 opacity-70">{rest} more items…</div> : null}
    </div>
  );
}
