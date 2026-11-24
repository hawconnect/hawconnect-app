# Development workflow

HAWConnect is four sibling repositories, each with its own Bun lockfile:

| Repository | Folder | What it is |
| --- | --- | --- |
| `hawconnect/hawconnect-app` | `hawconnect` | Expo app: web (`app.hawconnect.de`), iOS, Android |
| `hawconnect/hawconnect-backend` | `hawconnect-backend` | GraphQL + REST API, sign-in site, PostgreSQL |
| `hawconnect/hawconnect-console` | `hawconnect-console` | Admin console |
| `hawconnect/hawconnect-docs` | `hawconnect-website` | Landing page and docs `hawconnect.de` |

## Branches

| Branch | Purpose | Deploys to |
| --- | --- | --- |
| `main` | Production-ready code; releases are cut here | production |
| `dev` | Integration and staging | staging |
| `feature/*` | New features, from `dev` | — |
| `fix/*` | Bug fixes, from `dev` | — |
| `refactor/*` | Refactoring, from `dev` | — |
| `hotfix/*` | Urgent production fixes, from `main`, merged back into `main` **and** `dev` | — |

1. Branch from `dev` (`git switch -c feature/<topic> dev`).
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`; `feat!:` or a `BREAKING CHANGE:` footer for breaking changes). The PR title check enforces this for squash merges.
3. Open a pull request into `dev`; CI must pass.
4. Merging into `dev` deploys staging (web through Coolify, mobile through EAS — see [staging](staging.md)).
5. Verify staging with the [staging checklist](staging.md#staging-checklist).
6. Open a pull request `dev` → `main`; CI runs again.
7. Merging into `main` deploys production web and updates the Release Please pull request ([releases](releases.md)). Mobile store releases are prepared separately ([mobile builds](mobile-builds.md)).

Never push directly to `main` or `dev`, never force-push them, and never commit `.env.local`, signing material or build output.

## Local setup

```bash
bun install --frozen-lockfile        # in each repository
cp .env.local.example .env.local     # fill in local values only
bun run codegen                      # app: reads ../hawconnect-backend/src/schema
```

The app needs a development build (not Expo Go). `APP_VARIANT=staging` builds the "HAWConnect Beta" app locally; leaving it unset builds the production app.

## Checks before a pull request

| Repository | Commands |
| --- | --- |
| App | `bunx tsc --noEmit`, `bun run lint`, `bun test`, `bun run i18n:check`, `bunx expo export --platform web --output-dir dist-hawconnect` |
| Backend | `bun run codegen`, `bun run lint`, `bun test` (database suites need the URLs in [testing](testing.md)) |
| Console | `bunx biome ci .`, `bunx tsc --noEmit`, `bun test`, `bun run build` |
| Website | `bun tsc --noEmit`, `bun biome ci .`, `bun test`, `bun run build` |
