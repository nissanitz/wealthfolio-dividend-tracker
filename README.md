# Dividend Dashboard for Wealthfolio

A [Wealthfolio](https://wealthfolio.app) addon that turns your portfolio into a
dividend-income dashboard: what you receive, what it yields, how it is growing,
what is coming next, and what the taxman takes.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Wealthfolio](https://img.shields.io/badge/Wealthfolio-3.9.0%2B-7c5cf0)
![SDK](https://img.shields.io/badge/SDK-3.9.0-informational)

---

## Features

- **KPI cards** — passive income (annualised + monthly), taxes paid and effective
  rate, dividend yield / yield on cost / indicated yield, all-time dividends and
  trailing income growth.
- **Dividends received** — monthly / quarterly / yearly bars with a
  12m / 24m / YTD / all-time range switch. Hover a bar for the per-holding
  breakdown of that period.
- **Taxes paid** — the same controls and layout as Dividends received, with the
  effective tax rate and net income.
- **Income by holding** — income per holding for the selected range.
- **Dividend growth** — calendar months compared across years.
- **Future payments** — next-12-month projection built from an external
  market-data provider (Yahoo), scaled to your current share counts.
- **Passive income diversification** — donut with a synced, highlighted legend.
- **Yield / yield on cost** — per-holding comparison with a Realized / Indicated
  toggle.
- **Holdings income table** — sortable shares, price, cost basis, current value,
  dividends, dividend yield, indicated yield, yield on cost and portfolio weight.

All values are converted to your portfolio's base currency, in the Wealthfolio
design language.

---

## Installation

Requires **Wealthfolio 3.9.0 or newer**.

1. Download the latest `dividend-dashboard.zip` from
   [Releases](../../releases/latest).
2. Open Wealthfolio → **Settings → Addons → Install from file**.
3. Select the downloaded zip and approve the permissions.

Because the addon fetches per-share dividend history from Yahoo, you also need to
approve `query1.finance.yahoo.com` when prompted. If you decline, the addon still
works and falls back to a trailing-12-month estimate.

---

## Usage

Open **Dividend Dashboard** in the Wealthfolio sidebar. Each panel has its own
range and grouping controls; hovering a bar or donut slice shows a per-holding
breakdown.

---

## Permissions

| Permission | Why |
|---|---|
| `accounts.getAll` | List accounts so holdings can be grouped and valued. |
| `portfolio.getHoldings`, `portfolio.getIncomeSummary` | Read holdings, values and the base-currency income summary. |
| `activities.search` | Read dividend and tax activities for accurate per-holding income. |
| `currency.getRatesForDates` | Convert non-base-currency dividends/taxes at each payment date. |
| `assets.getProfile` | Read asset provider config to resolve the exact Yahoo ticker (e.g. `EMCL.NE`). |
| `market-data.searchTicker` | Provider symbol resolution. |
| `network.request` (`query1.finance.yahoo.com`) | Fetch external per-share dividend history for the indicated yield and forward projection. |

The addon stores no data of its own and sends nothing anywhere except the
read-only Yahoo requests above.

---

## How the numbers are computed

- **Trailing-12-month income** is summed from actual `DIVIDEND` activities over
  the last 12 months. It is **not** `Holding.income`, which Wealthfolio reports as
  *all-time* income.
- **Currency:** every dividend and tax in a non-base currency is converted at the
  exchange rate on its **own payment date** (the actual base-currency amount
  received). This is applied consistently to dividends and taxes, so totals may
  differ slightly (≈0.4% in the reference portfolio) from Wealthfolio's income
  summary, which converts all foreign income at the *current* rate.
- **Realized yield** = trailing-12m income ÷ current market value.
  **Yield on cost** = trailing-12m income ÷ cost basis.
- **Indicated (forward) yield** comes from an external source: per-share dividend
  history is fetched from Yahoo Finance (`v8/finance/chart`, `events=div`), the
  payment frequency is detected from the gaps between recent payments, and the
  indicated annual rate = most recent payment × frequency ÷ current price.
- **Future payments** are projected from that external per-share history scaled to
  your current share counts (falling back to the trailing-12m seasonal pattern if
  the provider is unavailable).
- **Taxes** are the withholding booked as separate `TAX` activities; the effective
  rate is tax ÷ gross dividends.
- **Income growth** is only shown once two complete trailing-12m windows exist.

### External data notes

- Yahoo requests are paced sequentially with retries (Yahoo rate-limits bursts
  with HTTP 429) and cached for 30 minutes.
- A browser `User-Agent` is required; the host network broker forwards it.

---

## Building from source

```bash
npm install
npm run build      # bundle -> dist/addon.js
npm run type-check # tsc --noEmit
npm run bundle     # clean + build + zip -> dividend-dashboard.zip
```

Install the generated zip via **Settings → Addons → Install from file**.

---

## Contributing

Bug reports and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
Please never attach personal financial data.

---

## License

[MIT](LICENSE)
