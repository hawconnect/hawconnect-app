# Deployment (Coolify)

All web services deploy with Coolify's own Git integration: each Coolify application tracks one branch and rebuilds on push. No custom deploy scripts and no extra registry are needed. Create **two Coolify applications per service** — one for staging (`dev`), one for production (`main`) — with separate environment variables, databases and volumes. See [staging](staging.md) for hostnames.

| Service | Repository | Build | Port | Staging (`dev`) | Production (`main`) |
| --- | --- | --- | --- | --- | --- |
| Web app | `hawconnect-app` | Dockerfile `config/Dockerfile`, context = repo root | 3000 | `dev-app.hawconnect.de` | `app.hawconnect.de` |
| Backend + sign-in | `hawconnect-backend` | `/Dockerfile` | 4000 | `dev-api.` + `dev-account.hawconnect.de` | `api.` + `account.hawconnect.de` |
| Console | `hawconnect-console` | `/Dockerfile` | 3000 | `dev-console.hawconnect.de` | `console.hawconnect.de` |
| Landing page | `hawconnect-docs` | `/Dockerfile` | 3000 | `dev.hawconnect.de` | `hawconnect.de` |

## Web app build arguments

Public values are baked in at **build time** — set them as Coolify build variables and redeploy after changing them.

| Build arg | Staging | Production |
| --- | --- | --- |
| `APP_VARIANT` | `staging` | `production` |
| `EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT` | `https://dev-api.hawconnect.de/graphql` | `https://api.hawconnect.de/graphql` |
| `EXPO_PUBLIC_HAWCONNECT_AUTH_URL` | `https://dev-api.hawconnect.de/api/accounts` | `https://api.hawconnect.de/api/accounts` |
| `EXPO_PUBLIC_HAWCONNECT_LOGIN_URL` | `https://dev-account.hawconnect.de` | `https://account.hawconnect.de` |
| `EXPO_PUBLIC_WEBSITE_URL` | `https://dev-app.hawconnect.de` | `https://app.hawconnect.de` |

A staging build with production endpoints fails on purpose (`config/app-variant.js`).

## Backend

Runtime variables and the PostgreSQL / storage requirements are documented in the backend repository (`docs/deployment.md` there). Per environment: its own PostgreSQL database, its own persistent volume at `/var/lib/hawconnect`, its own generated secrets. Run database migrations by hand, staging first.

## Rules

- Do not point a staging application at a production database, volume or secret.
- Production deploys only from `main`; never trigger a production deployment by hand while reorganising.
- Health checks: backend and console images include health checks; enable them in Coolify.
