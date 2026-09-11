# EatHub / AK47

This repository pins the EatHub backend and frontend as Git submodules.

## Audit repair release

Review the coordinated changes:
- [Backend PR #1](https://github.com/mohanreddytm/eathubbackend/pull/1)
- [Frontend PR #1](https://github.com/mohanreddytm/eathubfrontone/pull/1)

The repair adds API authentication and restaurant isolation, removes embedded credentials, validates order pricing on the server, makes payment settlement transactional, completes billing/KOT controls, and checks reservation conflicts.

These source changes have not been deployed. Before release, follow the backend [operations guide](https://github.com/mohanreddytm/eathubbackend/blob/8e826cbb945ae144d200b8ce443554b7c2a61351/OPERATIONS.md): rotate exposed Neon/JWT credentials, reset default admin credentials, reconcile historic payment records, run preflight and migration, and deploy both applications together. Razorpay integration remains pending merchant/product configuration.

## Checkout

```sh
git clone --recurse-submodules --branch codex/audit-security-integrity https://github.com/mohanreddytm/AK47.git
cd AK47
```

For an existing checkout after switching to this branch:

```sh
git submodule sync --recursive
git submodule update --init --recursive
```

## Validation

Use Node.js 20 or newer. Configure environment variables from each application's example before running either service.

```sh
cd backend/eathubbackend
npm ci
npm test
```

```sh
cd frontend/eathubfrontone
npm ci
CI=true npm test -- --watchAll=false --runInBand --testPathPattern=OrderActions.test.js
npm run build
```

Verified for these pinned revisions: 9 backend regression tests and 4 focused UI tests pass; frontend production build succeeds with existing lint warnings. Backend tests use fictional data with serialized PGlite transactions. Staging still needs real multi-connection PostgreSQL, browser workflow and physical print verification.
