# EatHub / AK47

A restaurant operations app with connected admin, waiter, kitchen, customer and platform workspaces. This checkout pins matching frontend and backend versions so the app and API work together.

## Get the updated app

Use Node 20 or later and Git. For a new checkout:

```sh
git clone --recurse-submodules https://github.com/mohanreddytm/AK47.git
cd AK47
npm run setup
npm run demo
```

Open `http://localhost:3000`. In demo mode, all data is fictional and resets when the server stops. No Neon credentials are needed.

| Sign-in role | Email | Demo password |
|---|---|---|
| Admin | admin@demo.invalid | EatHubDemo123! |
| Waiter | waiter@demo.invalid | EatHubDemo123! |
| Kitchen | kitchen@demo.invalid | EatHubDemo123! |
| Platform admin (`/superAdminLogin`) | super@demo.invalid | EatHubDemo123! |

The customer entrance is `http://localhost:3000/tables/demo`. Choose a table to open its menu, cart and order tracker.

### If setup stops with ECONNRESET

This means a dependency download was interrupted. A subsequent `react-scripts is not recognized` message means the frontend installation did not finish. The deprecation and audit notices are separate from that network failure; they do not mean the install succeeded.

Stop old app servers first. In PowerShell, run the following commands **one at a time** from AK47:

```powershell
npm run setup
```

Wait for **Dependencies ready** before starting `npm run demo`. For a single PowerShell block that starts the app only when setup succeeds:

```powershell
npm run setup
if ($LASTEXITCODE -eq 0) { npm run demo }
```

Setup uses the pinned lockfiles and five npm download retries, preserves existing environment files, and records an interrupted setup so the launcher can refuse a partial installation. If network resets persist, retry on a stable connection; no lockfile deletion, global react-scripts installation or forced audit upgrade is needed. See [npm retry settings](https://docs.npmjs.com/cli/v11/using-npm/config/#fetch-retries).

On Windows, the launcher invokes the npm CLI through Node without shell argument concatenation. If either app exits, it stops the process trees it started, including the API child. It does not terminate unrelated Node processes. Test this behavior with `npm run test:scripts`; CI covers Linux and Windows on Node 24.

### Update an existing clone

Commit or safely stash your own source changes first; keep your local environment files. Then, from AK47:

```sh
git switch main
git pull --ff-only
git submodule sync --recursive
git submodule update --init --recursive
npm run setup
```

Do not use `git submodule update --remote`: this checkout deliberately pins a compatible pair. Checking out a parent branch alone does not update the files inside already-cloned submodules; the submodule update command is required. Earlier fixes stayed in draft branches while the parent still referenced old code, which is why the original UI continued to appear.

## Run with your restaurant data

1. Stop demo mode. In `backend/eathubbackend/.env`, set `DATABASE_URL` to your Neon connection string. Setup generates a JWT secret only if the file is missing; an existing JWT secret must still be at least 32 random bytes. Keep credentials private.
2. Back up your database and run the backend's `migrations/preflight.sql` in the SQL console. Resolve any invalid amounts or duplicate successful payments it reports.
3. From AK47, run:

```sh
npm run db:migrate
npm run db:check
npm run dev
```

The repeatable migration upgrades both the original schema and the previous audit schema. It fixes integer order numbers that cannot store `MMDD-counter`, adds billing/KOT/table-status fields and creates daily counters. Invalid historical data causes a rollback and an actionable terminal error; nothing is silently marked paid.

The API runs on port 8000 and the UI on 3000. `http://localhost:8000/health` should report `ready` with version `2.0.0`. Sign in again after updating. Restart the React server after changing `frontend/eathubfrontone/.env`.

## What changed

- **Real dashboard URLs:** every admin section has a path. Clicking an order opens `/restaurantDashboard/pos/:orderId`; refresh and browser Back/Forward use that same persisted order ID.
- **Redesigned workspaces:** consistent light/dark styling, desktop and mobile navigation, menu cards, bill panel, kitchen columns, readable order/payment tables, inline errors and keyboard-friendly forms.
- **Connected order flow:** POS → assigned waiter/kitchen → Ready → verified payment/completion. Extra KOTs preserve old prices and contain the correct new kitchen batch. Prepaid food stays in the kitchen queue.
- **Admin operations:** menu/category and table/area management, staff accounts, restaurant setup/settings, reservations with table conflict checks, service requests, payments and messaging.
- **Waiter operations:** own assigned orders and payments, table navigation, availability/break status, customer and admin requests, and messages.
- **Customer operations:** QR entrance table grid, menu search, cart, favourites, profile, own-order tracking, waiter requests and counter-payment requests.
- **Platform operations:** restaurant search/details, activity summaries and confirmed activate/deactivate/suspend actions.
- **Backend repairs:** repeatable schema checks, server pricing, scoped authorization, legacy item-name recovery, idempotent order/payment handling, safe errors and test-only verified Razorpay checkout when configured.

This is a code release. It does not change your local database, hosting settings or merchant account automatically. See [backend operations](backend/eathubbackend/OPERATIONS.md) for Neon migration, credential rotation, provider configuration and deployment steps. Refunds, live multi-restaurant payment settlement, historical reconciliation and recovery of expired guest sessions are not enabled.

## Validation

```sh
npm run test:backend
npm run test:frontend
npm run build
```

The automated suite covers 19 backend and 7 frontend checks using disposable data. The browser smoke workflow starts the matching demo API, exercises all roles, and records screenshots:

```sh
cd frontend/eathubfrontone
npx playwright install chromium
cd ../..
npm run test:e2e
```

Keep ports 3000 and 8000 free while the browser tests run. Your full historical Neon database, live hosting, printer and real merchant test account still need checks in your environment. For deployment, apply the database migration first and deploy the pinned backend/frontend together. The frontend includes SPA fallback configuration for Vercel and compatible static hosts.
