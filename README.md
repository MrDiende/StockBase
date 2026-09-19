# StockBase

StockBase is an inventory management app for products, categories, and stock
movements. It includes a Shopee-inspired interface, physical-store tracking,
admin authentication, and a simulated Shopee synchronization workflow.

## Features

- Dashboard with inventory totals, low-stock alerts, and recent activity.
- Product creation, editing, searching, sorting, images, and SKU generation.
- SKUs are generated automatically from the selected category and kept unique.
- Category management.
- Stock-in, stock-out, and adjustment transactions.
- Physical-store availability is enabled automatically for every product.
- Optional Shopee synchronization controlled by the product's Shopee setting.
- Admin sign-in, password reset, and sign-out.
- Settings page with editable full name, address, and contact number.
- Profile information stored per user in Supabase with row-level security.
- Password reset emails through Supabase Authentication.
- Live inventory updates across open sessions.
- Optional Operation Security requiring admin authorization for inventory changes.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 |
| Build tool | Vite |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Charts | Recharts |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime |
| Hosting | Vercel or GitHub Pages |

## Backend and database

StockBase uses [Supabase](https://supabase.com/) as its backend service.
Supabase provides:

- Email and password authentication for the administrator.
- PostgreSQL database tables for profiles, products, categories, and transactions.
- Row-level security so the authenticated administrator can access the inventory.
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

The `profiles` table stores the administrator's:

- `role` (always `admin`)
- `full_name`
- `address`
- `contact_number`

Each profile is keyed by the authenticated user's ID and can only be read or
updated by that user.

The `products` table includes:

- `physical_store` (`boolean`, default `true`) for automatic Physical Store availability.
- `shopee` (`boolean`, default `false`) for optional Shopee synchronization.
- `created_at` (`timestamptz`, default `now()`) for the product creation time.

If an older database still has `warehouse_id` or
`synced_to_shopee`, the schema migration renames those columns and converts
existing values to the current boolean fields.

### Operation Security

Operation Security can be enabled from **Settings**. When it is enabled,
StockBase requires the administrator's current password before applying
inventory changes. This protects the following actions:

- Adding, editing, or deleting products.
- Adding, editing, or deleting categories.
- Recording stock-in, stock-out, or adjustment transactions.
- Resetting the inventory.

The authorization token issued by Supabase is single-use, tied to the
requested operation, and expires after two minutes. Disabling Operation
Security also requires administrator authorization. Turning it off allows
inventory changes without an additional password prompt.

Operation Security depends on the `operation_security` and
`operation_authorizations` tables and the `authorize_operation`,
`set_operation_security`, and `inventory_mutation` database functions. Always
run the complete `supabase/schema.sql` in the Supabase SQL Editor after
installing or updating this feature. If the schema is missing, the Settings
page displays an Operation Security error and inventory mutations cannot be
authorized.

### Admin email and password

There is no public account-creation page. Create the administrator account once
from **Supabase Dashboard → Authentication → Users → Add user**, then use that
email address to sign in to StockBase. The `profiles` schema defaults every
profile to the `admin` role.

Users can change their password directly from **Settings** by entering:

1. Current password.
2. New password.
3. Confirm new password.

The Settings password fields include visibility controls and require a new
password of at least 12 characters. Users who cannot remember their password
can select **Forgot password?** on the sign-in page to request a Supabase
password-reset email.

Add the local and production application URLs under
**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:5173
https://stock-base-mauve.vercel.app
```

The **Reset password** email template is managed under
**Authentication → Emails → Reset password**. Configure custom SMTP if you
need to edit the default template or send mail through your own provider.

### Supabase authentication rate limits

Supabase protects authentication email actions with rate limits. These limits
can affect:

- Sending password-reset emails.
- Using **Forgot password?** and sending reset emails.
- Repeated sign-in attempts from the same account or IP address.

Avoid repeatedly clicking password-reset buttons. Wait for the interval in the
error message before trying again.

Review the limits in **Supabase Dashboard → Authentication → Rate Limits**.
Custom SMTP can increase email delivery capacity, but Supabase authentication
rate limits and provider limits still apply. For production use, configure a
verified sender and a supported SMTP provider rather than relying on the
default email service.

If testing locally, use the administrator account and avoid repeated requests
to the same address. Never bypass rate limits by exposing service-role keys in
the frontend.

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

## Publish changes to GitHub

The repository uses the `main` branch. After making changes, run:

```bash
git add .
git commit -m "Update StockBase"
git push origin main
```

Only commit source files and configuration that are safe to share. Keep local
environment files such as `.env.local` out of GitHub. The Supabase URL and
publishable key must be configured separately in the deployment platform.

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

### The sign-in page does not appear

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

## Project Structure

```text
StockBase/
├── public/
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── Auth.jsx
│   │   ├── Badge.jsx
│   │   ├── CategoryModal.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── Modal.jsx
│   │   ├── ProductModal.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   ├── StockModal.jsx
│   │   └── Topbar.jsx
│   ├── data/
│   │   ├── seed.js
│   │   └── Physical Store.js
│   ├── hooks/
│   │   ├── useInventory.js
│   │   └── useShopeeSync.js
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Categories.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── Settings.jsx
│   │   └── Transactions.jsx
│   ├── styles/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   └── theme.css
│   ├── utils/
│   │   ├── classNames.js
│   │   ├── placeholderImage.js
│   │   └── skuGenerator.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/
│   └── schema.sql
├── index.html
├── package.json
└── vite.config.js
```
