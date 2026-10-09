import type { ReactNode } from "react";
import { Card, Icons } from "@wealthfolio/ui";
import type { DividendMetrics } from "../lib/calc";
import { formatCurrency, formatPercent, formatSignedPercent } from "../lib/format";
import { COLORS } from "../lib/palette";
import { InfoTip } from "./primitives";

interface KpiProps {
  icon: ReactNode;
  accent: string;
  label: string;
  tip: string;
  value: string;
  sub: ReactNode;
}

function Kpi({ icon, accent, label, tip, value, sub }: KpiProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          {icon}
        </span>
        <span className="text-muted-foreground text-sm">{label}</span>
        <InfoTip text={tip} />
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground mt-1 text-xs">{sub}</div>
    </Card>
  );
}

export function KpiCards({ metrics }: { metrics: DividendMetrics }) {
  const { baseCurrency } = metrics;
  const growth = metrics.incomeGrowth;
  const growthColor = growth === null ? COLORS.slate : growth >= 0 ? COLORS.green : COLORS.rose;
  const ttmTax = metrics.monthlyTax.slice(-12).reduce((s, b) => s + b.value, 0);
  const effectiveRate = metrics.annualIncome > 0 ? ttmTax / metrics.annualIncome : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi
        icon={<Icons.HandCoins size={16} />}
        accent={COLORS.teal}
        label="Passive income"
        tip="Trailing 12-month dividend income across all holdings, annualised. The monthly figure is this amount divided by twelve."
        value={formatCurrency(metrics.annualIncome, baseCurrency)}
        sub={`${formatCurrency(metrics.monthlyAverage, baseCurrency)} monthly`}
      />
      <Kpi
        icon={<Icons.Receipt size={16} />}
        accent={COLORS.amber}
        label="Taxes paid"
        tip="Withholding tax on dividends over the trailing 12 months, and the effective rate (tax divided by gross dividends)."
        value={formatCurrency(ttmTax, baseCurrency)}
        sub={`${formatPercent(effectiveRate)} effective rate`}
      />
      <Kpi
        icon={<Icons.Percent size={16} />}
        accent={COLORS.blue}
        label="Dividend yield"
        tip="Trailing (realized) yield = dividends actually received in the last 12 months divided by current market value. Indicated (forward) yield = the provider's most recent per-share rate x payment frequency divided by price. Yield on cost uses the original cost basis."
        value={formatPercent(metrics.yieldOnValue)}
        sub={`${formatPercent(metrics.yieldOnCost)} on cost · ${formatPercent(metrics.indicatedYield)} indicated`}
      />
      <Kpi
        icon={<Icons.Coins size={16} />}
        accent={COLORS.purple}
        label="Total dividends"
        tip="All dividend income ever recorded in this portfolio, and the portion received over the trailing twelve months."
        value={formatCurrency(metrics.totalAllTime, baseCurrency)}
        sub={`${formatCurrency(metrics.ttmIncome, baseCurrency)} last 12 months`}
      />
      <Kpi
        icon={growth !== null && growth < 0 ? <Icons.TrendingDown size={16} /> : <Icons.TrendingUp size={16} />}
        accent={growthColor}
        label="Income growth"
        tip="Change in trailing 12-month income versus the previous 12 months."
        value={growth === null ? "—" : formatSignedPercent(growth)}
        sub={growth === null ? "needs 2+ years of history" : "trailing 12m vs prior 12m"}
      />
    </div>
  );
}
