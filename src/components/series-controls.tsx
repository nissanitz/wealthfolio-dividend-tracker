import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from "@wealthfolio/ui";
import type { Grouping, RangeKey } from "../lib/calc";

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "12m", label: "12 trailing months" },
  { value: "24m", label: "24 months" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

const GROUPINGS: { value: Grouping; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Yearly" },
];

/** Shared range + grouping controls, so paired panels stay identical. */
export function RangeGroupingControls({
  range,
  onRangeChange,
  grouping,
  onGroupingChange,
}: {
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  grouping: Grouping;
  onGroupingChange: (grouping: Grouping) => void;
}) {
  return (
    <>
      <Select value={range} onValueChange={(v) => onRangeChange(v as RangeKey)}>
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
      <ToggleGroup
        type="single"
        value={grouping}
        onValueChange={(v) => v && onGroupingChange(v as Grouping)}
        className="hidden sm:flex"
      >
        {GROUPINGS.map((g) => (
          <ToggleGroupItem key={g.value} value={g.value} className="h-8 px-2 text-xs">
            {g.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  );
}

/** The "Total" headline shared by the paired panels. */
export function SeriesTotal({ value, color }: { value: string; color: string }) {
  return (
    <div className="mb-2">
      <div className="text-muted-foreground text-xs">Total</div>
      <div className="flex items-baseline gap-2">
        <span className="inline-block h-4 w-1 rounded-full align-middle" style={{ backgroundColor: color }} />
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  );
}
