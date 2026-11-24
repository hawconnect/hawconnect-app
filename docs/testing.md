# Testing

## Unit tests

`bun test` in each repository. App tests live in `src/utils/tests`; backend tests next to the code in `src/**/tests`.

Backend database suites run only with throwaway PostgreSQL databases on `localhost`, with exactly these names (the tests refuse anything else):

```bash
HAWCONNECT_TEST_DATABASE_URL=postgres://localhost/hawconnect_test
HAWCONNECT_ADMIN_TEST_DATABASE_URL=postgres://localhost/hawconnect_console_test
HAWCONNECT_MIGRATION_TEST_URL=postgres://localhost/hawconnect_migration_test
```

CI creates them in a PostgreSQL service container. Never point these variables at staging or production.

## End-to-end tests (Maestro)

Maestro flows live in `.maestro/flows`; every flow uses `appId: ${APP_ID}`.

| Command | Runs |
| --- | --- |
| `bun e2e` / `bun e2e:ios` / `bun e2e:android` | guest suite on a development build (`config/run-maestro-suite.ts`) |
| `bun e2e:web` | web-tagged flows against `http://localhost:8081` |
| `bun e2e:authenticated`, `bun e2e:logout`, `bun e2e:lecture` | flows that sign in with a staging test account |

`APP_ID=dev.hawconnect.app.beta` runs the suite against the HAWConnect Beta build.

Covered flows: launch and onboarding, guest navigation, food, map (location allowed/denied), settings persistence, public content and links, native controls and share, dashboard context menu, quick actions, universal links, sign-in, lecture content and logout.

Not yet covered by automated flows: creating/editing marketplace listings with image upload and their form validation — check these by hand on staging (see the [staging checklist](staging.md#staging-checklist)).

## Rules

- End-to-end tests run against **staging** endpoints with test accounts only, never production data.
- Authenticated flows need a staging test account; keep its credentials in the local environment or CI secrets, never in the repository.

## CI

| Workflow | Trigger |
| --- | --- |
| `ci.yml` (types, Biome, i18n, unit tests + coverage, Expo Doctor) | PRs and pushes to `dev`/`main` |
| `android-pr-check.yml` (prebuild + `assembleDebug`) | PRs touching Android |
| `maestro-web.yml` | PRs touching the app |
| `maestro-android.yml` (guest suite on emulator, Beta build) | pushes to `dev` once `GRAPHQL_ENDPOINT_DEV` is set |
