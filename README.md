# StockBase

A simple, frontend-only **inventory management** app built with React, Vite and
Tailwind CSS. It lets you manage products, categories and stock movements, with a
Shopee-inspired design, a simulated "Sync to Shopee" feature and a physical-store
capacity overview. All data is stored locally in your browser (`localStorage`).

## Features

- **Dashboard** – key stats, Shopee sync status, physical-store capacity and a
  "stock by category" chart, plus low-stock and recent-activity lists.
- **Products** – add / edit / delete products with an image upload, auto-generated
  SKU, search, filtering and sorting.
- **Categories** – group products and see totals per category.
- **Transactions** – full history of stock-in / stock-out / adjustments.
- **Shopee sync (simulated)** – mark products to sync and keep stock aligned.

## Tech stack

- [React 19](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + custom CSS design system (`src/styles/`)
- [Recharts](https://recharts.org/) for the dashboard chart
- [lucide-react](https://lucide.dev/) for icons

## Getting started

You need [Node.js](https://nodejs.org/) (version 18 or newer) installed. Then open
the project folder in VS Code and use the built-in terminal.

```bash
# 1. Install ALL dependencies (run this first — do NOT run "npm install vite")
npm install

# 2. Start the dev server, then open the http://localhost:5173 link it prints
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview
```

### Troubleshooting

**`'vite' is not recognized ...`**
This means dependencies aren't installed yet. Run `npm install` (the full command,
not `npm install vite`) in the project folder, then `npm run dev`.

**npm says a package "has install scripts not yet covered" / esbuild errors**
Newer npm versions can block build scripts. This project ships an `.npmrc` with
`allow-scripts=true` to fix that automatically. If you still hit it, run:

```bash
npm install --foreground-scripts
```

**Still stuck? Do a clean reinstall (Windows PowerShell):**

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the app and publishes it to GitHub Pages automatically.

1. Push the project to a GitHub repository (default branch: `main`).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Every push to `main` will build and deploy the site. The live URL appears in the
   **Actions** run summary and under **Settings → Pages**.

The Vite config uses `base: "./"`, so the app works whether it's served from a
project subpath (e.g. `username.github.io/stockbase/`) or a custom domain.

## Project structure

```
src/
  components/   Reusable UI pieces (Modal, Badge, Sidebar, forms, ...)
  pages/        Dashboard, Products, Categories, Transactions
  hooks/        useInventory, useShopeeSync (state + localStorage)
  data/         Seed data and the physical-store definition
  utils/        Small helpers (classnames, SKU, placeholder image)
  styles/       CSS design system (theme, base, layout, components)
```
