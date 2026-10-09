# Privacy

The Dividend Dashboard addon reads your portfolio data from Wealthfolio and
stores nothing of its own. It does not create accounts, trackers, or analytics.

## What leaves your device

To show the **indicated yield** and the **forward-payment projection**, the addon
fetches per-share dividend history from **Yahoo Finance**
(`https://query1.finance.yahoo.com`). Each request includes only the **ticker
symbol** of a security (for example `SCHD`) in the URL. No account numbers,
balances, quantities, transactions, or other personal data are sent.

- Requests are **read-only** (`GET`), over HTTPS.
- Results are cached locally for 30 minutes.
- Yahoo's own privacy policy applies to those requests.

No other network requests are made. If you decline the network permission, the
addon still works — it falls back to a trailing-12-month estimate and never
contacts Yahoo.

## Permissions

The addon requests only the permissions it uses; see the install dialog for the
authoritative list. It never writes to your portfolio data.

## Contact

Questions or concerns: open an issue in this repository.
