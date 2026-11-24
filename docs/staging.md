# Staging and production

Two fully separate environments. Staging follows `dev`, production follows `main`. They share no database, storage, secrets or accounts.

| | Staging | Production |
| --- | --- | --- |
| Git branch | `dev` | `main` |
| Web app | `https://dev-app.hawconnect.de` | `https://app.hawconnect.de` |
| Landing page | `https://dev.hawconnect.de` | `https://hawconnect.de` |
| API (GraphQL/REST) | `https://dev-api.hawconnect.de` | `https://api.hawconnect.de` |
| Sign-in site | `https://dev-account.hawconnect.de` | `https://account.hawconnect.de` |
| Console | `https://dev-console.hawconnect.de` | `https://console.hawconnect.de` |
| PostgreSQL | own staging database | production database |
| Snapshot storage (`/var/lib/hawconnect`) | own staging volume | production volume |
| Backend secrets (`HAWCONNECT_ACCOUNT_SECRET`, `HAWCONNECT_SYNC_ENCRYPTION_KEY`, `HAWCONNECT_MARKETPLACE_BLOCK_SECRET`, SMTP) | generated for staging | production values |
| Mobile app | "HAWConnect Beta", `dev.hawconnect.app.beta` | "HAWConnect", `dev.hawconnect.app` |
| EAS environment | `preview` (profile `staging`) | `production` (profile `production`) |
| Data | test data only | real users |

The staging hostnames are the conventions used throughout these repositories; create the DNS records before the first staging deployment.

## Guard rails

- **Never reuse production secrets in staging.** Generate new values for every secret. A staging database URL must point at the staging database, never production.
- The app refuses to build a staging variant that points at `api.hawconnect.de` / `account.hawconnect.de`, and a production variant that points at `dev-api` / `dev-account` (`config/app-variant.js`). This covers web (Docker build arg `APP_VARIANT`) and EAS builds.
- Backend database migrations are run by hand (see the backend README); run them on staging first, then production.
- Automated end-to-end tests only run against staging endpoints with test accounts.

## Staging checklist

After each deployment to staging, before opening `dev` → `main`:

- [ ] `https://dev-app.hawconnect.de` loads.
- [ ] `https://dev-api.hawconnect.de/graphql` answers a simple query (e.g. `{ canteens { id } }`).
- [ ] Sign-in on `dev-account.hawconnect.de` with a staging test account works; sign-out works.
- [ ] Account sync works after sign-in on web and on the Beta app.
- [ ] Database: a write with the test account (e.g. a marketplace draft) persists after a reload.
- [ ] Food, map, timetable, events and marketplace screens load with data.
- [ ] Marketplace image upload works with a small test image.
- [ ] With the API unreachable, the app shows its error view, not a blank screen.
- [ ] HAWConnect Beta (TestFlight / Play internal testing) installs next to the store app and talks to `dev-api`.
- [ ] Console on `dev-console.hawconnect.de` signs in with a staging admin.
- [ ] CI on `dev` is green; Maestro runs (web, Android) passed or failures are understood.

Promotion to production needs a reviewed `dev` → `main` pull request; nothing promotes automatically.
