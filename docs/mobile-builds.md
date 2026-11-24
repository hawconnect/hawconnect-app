# Mobile builds and beta distribution

## Variants

| | Production | Staging (Beta) |
| --- | --- | --- |
| App name | HAWConnect | HAWConnect Beta |
| iOS bundle ID / Android package | `dev.hawconnect.app` | `dev.hawconnect.app.beta` |
| URL scheme | `hawconnect` | `hawconnect-beta` |
| EAS build profile | `production` | `staging` |
| EAS environment (variables) | `production` | `preview` |
| Distribution | App Store / Google Play (manual) | TestFlight internal / Play internal testing |

`APP_VARIANT` (set by the EAS profile) selects the variant in `config/app-variant.js`; `app.config.ts` reads name, identifiers and scheme from it. Because the identifiers differ, both apps install side by side and keep separate data. Both variants use the same icons; the name distinguishes them.

## Environment variables

Set per EAS environment (expo.dev → project → Environment variables), never in the repository:

| Variable | `preview` (staging) | `production` |
| --- | --- | --- |
| `EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT` | `https://dev-api.hawconnect.de/graphql` | `https://api.hawconnect.de/graphql` |
| `EXPO_PUBLIC_HAWCONNECT_AUTH_URL` | `https://dev-api.hawconnect.de/api/accounts` | `https://api.hawconnect.de/api/accounts` |
| `EXPO_PUBLIC_HAWCONNECT_LOGIN_URL` | `https://dev-account.hawconnect.de` | `https://account.hawconnect.de` |
| `EAS_PROJECT_ID` | club-owned Expo project ID | same |

Builds with the `staging`/`testflight` profile also refuse local (`localhost`, LAN) endpoints (`config/testflight-config.js`).

## Versioning

- **App version** (`version` in `package.json`, shown to users) is managed by Release Please on `main` (see [releases](releases.md)); staging and production share it.
- **Build numbers** (iOS `CFBundleVersion`, Android `versionCode`) are managed remotely by EAS (`appVersionSource: remote`, `autoIncrement: true`). EAS keeps a separate counter per application identifier, so Beta builds never consume or replace production build numbers. The `buildNumber` in `app.config.ts` is ignored while remote versioning is on.

## CI

| Workflow | When | What |
| --- | --- | --- |
| `ci.yml`, `android-pr-check.yml`, `maestro-web.yml`, … | pull requests and pushes to `dev`/`main` | lint, types, tests, Android compile, Maestro web |
| `mobile-staging.yml` | push to `dev`, manual | `eas build --profile staging --platform all` on EAS cloud (no macOS runner); skipped until `EXPO_TOKEN` exists; submits only if `STAGING_AUTO_SUBMIT=true` |
| `maestro-android.yml` | push to `dev`, manual | guest Maestro suite on an Android emulator against the Beta debug build; skipped until `GRAPHQL_ENDPOINT_DEV` is set |

## Manual setup (once)

**Expo / EAS**
1. Create or use the club-owned Expo project; set `EAS_PROJECT_ID` in both EAS environments.
2. Create an Expo access token for CI and store it as the GitHub secret `EXPO_TOKEN`.
3. Fill the EAS `preview` and `production` environment variables above.

**iOS / TestFlight**
1. In App Store Connect, create a second app record for `dev.hawconnect.app.beta` ("HAWConnect Beta").
2. Run `eas credentials` (or the first `eas build --profile staging --platform ios`) to create its signing certificate and provisioning profile; upload an App Store Connect API key to EAS for submissions.
3. Add internal testers in TestFlight. Set `STAGING_AUTO_SUBMIT=true` (repository variable) only after this works manually with `eas submit --profile staging --platform ios`.

**Android / Play internal testing**
1. In Google Play Console, create a second app for `dev.hawconnect.app.beta`.
2. Upload the first AAB by hand (Play requires it), then add a Google service account key to EAS for `eas submit`.
3. Create the internal testing track and tester list. Submissions go to the `internal` track as drafts (`eas.json` → `submit.staging`). Firebase App Distribution is an alternative if Play internal testing is not wanted.

Production store submissions stay manual (`eas build --profile production`, then `eas submit` after review); nothing in CI publishes to the public stores.
