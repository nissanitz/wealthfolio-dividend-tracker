const LOCALE =
  typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact ? "c" : "n"}`;
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: currency || "USD",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    });
    currencyFormatters.set(key, fmt);
  }
  return fmt;
}

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  try {
    return currencyFormatter(currency, false).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}

export function formatCurrencyCompact(value: number | null | undefined, currency = "USD"): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  try {
    return currencyFormatter(currency, true).format(v);
  } catch {
    return `${currency} ${v.toFixed(0)}`;
  }
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
}

/** value is a fraction (0.0949 -> "9.49%"). */
export function formatPercent(value: number | null | undefined, digits = 2): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${(v * 100).toFixed(digits)}%`;
}

/** Signed percent for growth figures (+12.4%). */
export function formatSignedPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

export function formatShares(value: number | null | undefined): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const digits = Number.isInteger(v) ? 0 : v < 1 ? 4 : 2;
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(v);
}
