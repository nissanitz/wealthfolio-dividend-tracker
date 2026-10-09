# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-09

### Added

- Dividend income dashboard with KPI cards: passive income, taxes paid,
  dividend yield / yield on cost / indicated yield, total dividends and
  trailing income growth.
- **Dividends received** panel: monthly / quarterly / yearly bars with a
  12m / 24m / YTD / all-time range switch and a per-holding hover breakdown.
- **Taxes paid** panel with the same controls and layout, plus effective tax
  rate and net income.
- **Income by holding** panel with the same range switch.
- **Dividend growth** panel comparing calendar months across years.
- **Future payments** panel projecting the next 12 months from an external
  market-data provider (Yahoo), scaled to current share counts.
- **Passive income diversification** donut with a synced, highlighted legend.
- **Yield / yield on cost** panel with a Realized / Indicated toggle.
- **Holdings income** table with sortable shares, price, cost basis, value,
  dividends, yields and portfolio weight.
- Date-specific currency conversion for every non-base dividend and tax
  (actual base-currency amount received at each payment date).
