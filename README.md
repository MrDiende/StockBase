# StockBase

StockBase is an inventory management app for products, categories, and stock
movements. It includes a Shopee-inspired interface, physical-store tracking,
user accounts, and a simulated Shopee synchronization workflow.

## Features

- Dashboard with inventory totals, low-stock alerts, and recent activity.
- Product creation, editing, searching, sorting, images, and SKU generation.
- Category management.
- Stock-in, stock-out, and adjustment transactions.
- Physical-store stock tracking.
- Manual Shopee synchronization.
- Account creation, sign-in, and sign-out.
- Settings page with editable full name, address, and contact number.
- Profile information stored per user in Supabase with row-level security.
- Password reset emails through Supabase Authentication.
- Live inventory updates across open sessions.

## Built with

- [React 19](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [lucide-react](https://lucide.dev/)

## Backend and database

StockBase uses [Supabase](https://supabase.com/) as its backend service.
Supabase provides:

- Email and password authentication.
- PostgreSQL database tables for profiles, products, categories, and transactions.
- Row-level security so each account can access only its own inventory.
- Realtime updates when inventory data changes.
- Secure client access through Supabase's publishable frontend connection.

The frontend communicates with Supabase through the client in
`src/lib/supabase.js`. Inventory operations are handled through
`src/hooks/useInventory.js`.

### Supabase setup

Run the complete contents of `supabase/schema.sql` in the Supabase SQL Editor
when setting up the project or after schema changes. This creates the inventory
tables, the `profiles` table, indexes, realtime configuration, and
row-level-security policies.

The `profiles` table stores:

- `full_name`
- `address`
- `contact_number`

Each profile is keyed by the authenticated user's ID and can only be read or
updated by that user.

### Password reset

Password changes use Supabase's password-reset email flow:

1. Open **Settings** in StockBase.
2. Click **Send reset link**.
3. Open the reset email and click **Reset password**.
4. Enter and confirm the new password in StockBase.

Add the local and production application URLs under
**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:5173
https://stock-base-mauve.vercel.app
```

The **Reset password** email template is managed under
**Authentication → Emails → Reset password**. Configure custom SMTP if you
need to edit the default template or send mail through your own provider.

## Run locally

You need [Node.js](https://nodejs.org/) 18 or newer.

Install the project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local address printed by Vite, usually:

```text
http://localhost:5173
```

## Build the app

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The generated files are placed in `dist/`. This folder is created
automatically and should not be committed.

## Deploy with Vercel

Vercel normally detects this Vite project automatically. Use these settings if
they are requested:

```text
Framework preset: Vite
Build command: npm run build
Output directory: dist
Install command: npm install
```

After changing project settings, create a new deployment so the latest build is
used.

Set these environment variables in the Vercel project before deploying:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Use the Supabase project URL and publishable key only. Never expose a
`service_role` key or JWT signing secret in frontend environment variables.

## Deploy with GitHub Pages

The project includes a deployment script:

```bash
npm run deploy
```

This builds the app and publishes the contents of `dist/` to the `gh-pages`
branch.

## Troubleshooting

### The account page does not appear

An existing session may still be saved in the browser. Sign out using the
sidebar button, refresh the page, or open the app in a private/incognito window.

### A stale session or token error appears

Sign out and sign in again. If the problem continues, clear the browser site
data for the application and reload it.

### Vite is not recognized

Install the dependencies again:

```bash
npm install
npm run dev
```

## Project structure

```text
src/
  components/   Shared UI, authentication, forms, and dialogs
  pages/        Dashboard, Products, Categories, and Transactions
  hooks/        Inventory state and synchronization
  lib/          External service client
  data/         Seed data and warehouse definitions
  utils/        SKU, placeholder, and class-name helpers
  styles/       Base, theme, layout, and component styles
public/
  logo.png      StockBase logo
```
