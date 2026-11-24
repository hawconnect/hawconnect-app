# Releases and versioning

Releases are created with [Release Please](https://github.com/googleapis/release-please) from Conventional Commits, **only on `main`** (`.github/workflows/release-please.yml`). `dev` never produces releases.

| Commit | Version bump |
| --- | --- |
| `fix: …` | PATCH |
| `feat: …` | MINOR |
| `feat!: …` or `BREAKING CHANGE:` footer | MAJOR |
| `docs:`, `chore:`, `refactor:`, `test:` … | none (listed under hidden or refactoring sections) |

## Flow

1. Changes reach `main` through a `dev` → `main` pull request.
2. Release Please opens or updates a **release pull request** that bumps `package.json`, updates `CHANGELOG.md` and `.release-please-manifest.json`.
3. Merging the release pull request creates the Git tag (`v<version>`) and the GitHub Release.
4. Mobile: build the production apps for that version (`eas build --profile production`) and submit them manually after review ([mobile builds](mobile-builds.md)). The in-app "What's new" list (`src/data/changelog.json`) is updated in the release pull request by hand; `bun changelog:check` warns when it is missing.

Each repository (app, backend, console, website) has its own Release Please configuration and version line. Release Please needs the repository setting "Allow GitHub Actions to create and approve pull requests".

`bun run changelog` (git-cliff) remains available for local previews; `CHANGELOG.md` itself is owned by Release Please.
