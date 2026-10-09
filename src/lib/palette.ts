// Color palette tuned to the Wealthfolio / Flexoki theme while matching the
// reference dividend dashboards (violet primary, teal secondary, blue tertiary).
export const COLORS = {
  purple: "#7c5cf0",
  purpleSoft: "#b6a2f7",
  blue: "#4c9aff",
  blueSoft: "#a7c8fb",
  teal: "#2fc4b2",
  tealSoft: "#8fdcd4",
  green: "#4fbf7a",
  amber: "#d8a534",
  rose: "#e5688a",
  slate: "#8a8f98",
};

// Distinct hues for donut / multi-series charts.
export const SERIES_COLORS = [
  "#6d4bf0",
  "#2fc4b2",
  "#4c9aff",
  "#5bbf6a",
  "#a06bf0",
  "#3aa6d8",
  "#8bd0a0",
  "#b98cff",
  "#6fc7c0",
  "#7f9bff",
  "#c9a0e8",
  "#4bc0e0",
];

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}
