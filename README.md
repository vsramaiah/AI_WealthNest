# WealthNest

WealthNest is a mobile-first personal finance and investment tracking app built with React + Vite.

It supports:
- portfolio tracking
- transaction entry and review
- mutual fund SIP reminders
- local backup/restore
- installable PWA behavior
- GitHub Pages deployment
- PWABuilder packaging for Android

## Tech Stack

- React
- Vite
- React Router
- Tailwind CSS
- `vite-plugin-pwa`

## Main Folders

- [`src`](./src): app source code
- [`public`](./public): icons and static assets
- [`.github`](./.github): GitHub Actions workflow for Pages deployment

## Main Files

- [`package.json`](./package.json): dependencies and scripts
- [`vite.config.js`](./vite.config.js): Vite build config, GitHub Pages base, PWA manifest
- [`index.html`](./index.html): HTML entry and mobile install metadata
- [`src/main.jsx`](./src/main.jsx): React entry point
- [`src/App.jsx`](./src/App.jsx): app routes
- [`src/components/AppLayout.jsx`](./src/components/AppLayout.jsx): global shell with header, content, bottom navigation
- [`src/styles.css`](./src/styles.css): global styles and theme utilities

## Main Pages

- [`src/pages/Home.jsx`](./src/pages/Home.jsx)
- [`src/pages/Portfolio.jsx`](./src/pages/Portfolio.jsx)
- [`src/pages/AddTransaction.jsx`](./src/pages/AddTransaction.jsx)
- [`src/pages/Transactions.jsx`](./src/pages/Transactions.jsx)
- [`src/pages/TransactionDetails.jsx`](./src/pages/TransactionDetails.jsx)
- [`src/pages/Settings.jsx`](./src/pages/Settings.jsx)

## Main Logic Files

- [`src/utils/transactionEngine.js`](./src/utils/transactionEngine.js)
- [`src/utils/storage.js`](./src/utils/storage.js)
- [`src/utils/portfolioSummary.js`](./src/utils/portfolioSummary.js)
- [`src/utils/transactionSchemas.js`](./src/utils/transactionSchemas.js)
- [`src/utils/otherInvestments.js`](./src/utils/otherInvestments.js)
- [`src/utils/mutualFunds.js`](./src/utils/mutualFunds.js)
- [`src/utils/reminders.js`](./src/utils/reminders.js)
- [`src/utils/calendarEvents.js`](./src/utils/calendarEvents.js)

## App Flow

If you want to understand the app quickly, start here:

1. [`src/main.jsx`](./src/main.jsx)
2. [`src/App.jsx`](./src/App.jsx)
3. [`src/components/AppLayout.jsx`](./src/components/AppLayout.jsx)

That gives you:
- app entry
- route setup
- layout structure

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build production output:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Deployment to GitHub Pages

This project is configured for GitHub Pages using:

- relative Vite base
- `HashRouter`
- GitHub Actions workflow

Workflow file:

- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

### Files/Folders to Upload to GitHub

Upload these:

- `.github`
- `public`
- `src`
- `.gitignore`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `README.md`

Do not upload:

- `node_modules`
- `dist`

### GitHub Pages Steps

1. Push the project to a GitHub repository
2. Make sure the branch is `main`
3. Open `Settings -> Pages`
4. Set `Source` to `GitHub Actions`
5. The workflow will deploy automatically on push
6. After it succeeds, GitHub will provide the live Pages URL

Example URL:

```text
https://yourusername.github.io/AI_WealthNest/
```

## PWA / Installable App

This app is already configured as a PWA.

PWA-related setup is in:

- [`vite.config.js`](./vite.config.js)
- [`public/pwa-192.png`](./public/pwa-192.png)
- [`public/pwa-512.png`](./public/pwa-512.png)
- [`public/apple-touch-icon.png`](./public/apple-touch-icon.png)

### Install on Mobile

After the app is deployed to HTTPS:

- Android Chrome: choose `Install app` or `Add to Home screen`
- iPhone Safari: choose `Share -> Add to Home Screen`

## PWABuilder to Generate Android Package

If you want an Android package:

1. Deploy the app to GitHub Pages
2. Open the live URL
3. Go to [PWABuilder](https://www.pwabuilder.com/)
4. Paste the deployed app URL
5. Click `Download Test Package`
6. Choose Android output

Note:
- PWABuilder uses the live hosted PWA
- it does not package the local folder directly

## Data Storage

The app uses browser `localStorage`.

Important behavior:
- data is stored per browser/device
- installed PWA data is still local to that device
- there is no cloud sync by default
- clearing browser/site data removes local records unless backed up

## Backup and Restore

Main files:

- [`src/utils/dataPortability.js`](./src/utils/dataPortability.js)
- [`src/pages/Settings.jsx`](./src/pages/Settings.jsx)

Features:
- export JSON backup
- restore valid WealthNest backup
- export transactions CSV

## Notes About Current UX/Data Model

- `FD`, `RD`, and `LIC` are stored as master records, so they do not appear in the Transactions page
- those master records are surfaced in Portfolio, reminders, and calendar-related views
- `PPF` portfolio summary uses latest balance per account rather than summing all running balances

## Bottom Navigation

Bottom navigation is fixed to the bottom of the app shell.

Relevant files:

- [`src/components/BottomNav.jsx`](./src/components/BottomNav.jsx)
- [`src/components/AppLayout.jsx`](./src/components/AppLayout.jsx)

## Branding / Icons

Main branding files:

- [`src/components/BrandMark.jsx`](./src/components/BrandMark.jsx)
- [`public/favicon.svg`](./public/favicon.svg)

Category icon system:

- [`src/components/CategoryVisuals.jsx`](./src/components/CategoryVisuals.jsx)

Custom SVG-based categories currently kept:
- `stocks`
- `mf`
- `goldSilver`
- `crypto`

## Ignore Rules

Git ignore file:

- [`.gitignore`](./.gitignore)

Ignored by default:
- `node_modules/`
- `dist/`
- `.env*`
- editor folders
- OS junk files
