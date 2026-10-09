# Contributing

Thanks for your interest in improving the Dividend Tracker addon!

## Reporting issues

Open an issue with:

- Wealthfolio version and OS.
- What you expected vs. what happened.
- Steps to reproduce, and any console errors from the addon.

**Never attach personal financial data** (exports, screenshots with balances,
account numbers). Describe the shape of the data instead.

## Development

```bash
npm install
npm run dev        # rebuild on change (vite build --watch)
npm run type-check # tsc --noEmit
npm run build      # bundle -> dist/addon.js
npm run bundle     # clean + build + zip -> dividend-tracker-addon.zip
```

To try a build inside Wealthfolio, install the generated zip via
**Settings → Addons → Install from file**.

## Pull requests

- Open an issue before starting significant work.
- Keep changes focused and match the existing code style.
- Run `npm run type-check` and `npm run build` before submitting.
- Add a `CHANGELOG.md` entry under an `Unreleased` heading when relevant.

## Coding notes

- The addon runs inside the Wealthfolio sandbox. Host modules (`react`,
  `@wealthfolio/ui`, `@wealthfolio/addon-sdk`, `recharts`, …) are **external**
  and must not be bundled — see `vite.config.ts`.
- Prefer the host's `@wealthfolio/ui` components and CSS variables so the
  addon matches the Wealthfolio design language.
- Currency amounts must be converted to the base currency at each payment
  date; do not add different currencies together directly.
