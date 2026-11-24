# HAWConnect

<img src="src/assets/hawconnect/mark.svg" alt="HAWConnect logo" width="88" />

[![CI](https://github.com/hawconnect/hawconnect-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hawconnect/hawconnect-app/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/hawconnect/hawconnect-app/main?label=version)](package.json)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-40296C.svg)](#getting-started)

**HAWConnect is the campus app for students of HAW Hamburg — built by students, for students.** One app for your timetable, the canteen menus, campus maps, events and more, on iOS, Android and the web ([app.hawconnect.de](https://app.hawconnect.de)).

> HAWConnect is an independent, student-maintained project. It is not an official service of HAW Hamburg.

## Contents

- [Features](#features)
- [How the project is organised](#how-the-project-is-organised)
- [Getting started](#getting-started)
- [Everyday commands](#everyday-commands)
- [Testing](#testing)
- [Builds, staging and releases](#builds-staging-and-releases)
- [Getting help](#getting-help)
- [Contributing and maintainers](#contributing-and-maintainers)
- [Contributors](#contributors)
- [License](#license)

## Features

| Area | What you get |
| --- | --- |
| **Timetable** | Import your myHAW calendar (export link or `.ics` file), preview it, refresh it and see today's lectures on the dashboard. No university login needed. |
| **Food** | Studierendenwerk Hamburg menus in German and English with prices, allergens, additives and food symbols; filters and personal preferences; a list of the cafés and mensas on HAW campuses with opening hours. |
| **Campus map** | HAW buildings and campuses (Berliner Tor, Bergedorf, Finkenau, Armgartstraße) with building codes, details and directions. |
| **Campus life** | Official HAW events and news, Campus Life events from student organisers, clubs and initiatives, quick links. |
| **Marketplace** | Offers and requests between students (books, housing, jobs, …) with images and reporting. |
| **Semester dates** | Upcoming lecture periods and holidays. |
| **Accounts (optional)** | Use everything as a guest, or create an account (email, password and confirmation code) to sync calendars and preferences across devices. |
| **Personalisation** | Light/dark theme, accent colours, interface font, German and English. |

Privacy policy, imprint and terms are published at [hawconnect.de](https://hawconnect.de/en/legal/privacy); the app links there.

Not part of the app: authenticated HAW systems (grades, library accounts, printer balance) and live room availability.

## How the project is organised

HAWConnect is split into four repositories. This one is the app.

| Repository | Folder | What it is |
| --- | --- | --- |
| [hawconnect/hawconnect-app](https://github.com/hawconnect/hawconnect-app) | `hawconnect` | **This repository** — Expo app for iOS, Android and web |
| [hawconnect/hawconnect-backend](https://github.com/hawconnect/hawconnect-backend) | `hawconnect-backend` | GraphQL/REST API, accounts and sign-in site, PostgreSQL, public-source ingestion |
| [hawconnect/hawconnect-console](https://github.com/hawconnect/hawconnect-console) | `hawconnect-console` | Admin console for staff and organisers |
| [hawconnect/hawconnect-docs](https://github.com/hawconnect/hawconnect-docs) | `hawconnect-website` | Landing page, documentation and legal pages ([hawconnect.de](https://hawconnect.de)) |

**Tech stack:** [Expo](https://expo.dev) / React Native with Expo Router, [Uniwind](https://uniwind.dev) (Tailwind), React Query, Zustand, i18next, MapLibre, GraphQL Codegen, [Bun](https://bun.sh), Biome.

```text
src/
├── app/            # Routes (Expo Router): tabs and screens
├── components/     # Reusable UI
├── hooks/          # Queries and state
├── api/            # Network clients
├── utils/          # Helpers and HAW adapters (unit tests in utils/tests)
├── data/           # Static data (campuses, buildings, …)
└── localization/   # German and English strings
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) **1.4.1** (see [`.bun-version`](.bun-version))
- The backend checked out next to this repository (`../hawconnect-backend`) — GraphQL types are generated from it
- For native apps: Xcode (iOS) or Android Studio (Android). HAWConnect needs a **development build**; it does not run in Expo Go.

### 1. Clone and install

```bash
mkdir HAWConnect && cd HAWConnect
git clone https://github.com/hawconnect/hawconnect-app.git hawconnect
git clone https://github.com/hawconnect/hawconnect-backend.git
cd hawconnect
bun install --frozen-lockfile
```

### 2. Configure

```bash
cp .env.local.example .env.local
```

Point the app at your local backend (see the backend README to start it):

```dotenv
EXPO_PUBLIC_HAWCONNECT_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
EXPO_PUBLIC_HAWCONNECT_AUTH_URL=http://localhost:4000/api/accounts
EXPO_PUBLIC_HAWCONNECT_LOGIN_URL=http://account.localhost:4000
```

`EXPO_PUBLIC_*` values are embedded in the app — never put secrets in them.

### 3. Run

```bash
bun run codegen   # generate GraphQL types from ../hawconnect-backend
bun dev           # Expo dev server; press w for web, i for iOS, a for Android
```

Native development builds:

```bash
bun ios           # build and run on a connected device / simulator
bun android
```

`APP_VARIANT=staging` builds **HAWConnect Beta** (`dev.hawconnect.app.beta`) instead of the production app, so both can be installed side by side.

## Everyday commands

| Command | What it does |
| --- | --- |
| `bun dev` | Start the Expo development server |
| `bun start` | Serve a production-like web build on port 3000 |
| `bun run codegen` | Regenerate GraphQL types from the backend schema |
| `bunx tsc --noEmit` | Type-check |
| `bun run lint` | Biome (formatting and lint) |
| `bun test` | Unit tests |
| `bun run i18n:check` | Check German/English translation keys |
| `bun e2e` / `bun e2e:web` | Maestro end-to-end flows (native / web) |

## Testing

Unit tests live in `src/utils/tests` and run with `bun test`. End-to-end flows use [Maestro](https://maestro.mobile.dev) (`.maestro/flows`) for onboarding, navigation, food, map, settings, sign-in and more; they run against staging, never production data. Details: [docs/testing.md](docs/testing.md).

## Builds, staging and releases

| Topic | Read |
| --- | --- |
| Branches (`dev` → staging, `main` → production) and pull requests | [docs/development.md](docs/development.md) |
| Staging vs. production, staging checklist | [docs/staging.md](docs/staging.md) |
| Web deployment (Coolify) | [docs/deployment.md](docs/deployment.md) |
| iOS/Android builds, HAWConnect Beta, TestFlight, Play internal testing | [docs/mobile-builds.md](docs/mobile-builds.md) |
| Versioning and Release Please | [docs/releases.md](docs/releases.md) |

## Getting help

- **Using the app:** the student guides in [docs/students](docs/students) and the documentation on [hawconnect.de](https://hawconnect.de/en/docs).
- **Bugs and ideas:** open an issue in [GitHub Issues](https://github.com/hawconnect/hawconnect-app/issues).
- **Security problems:** please report privately as described in [.github/SECURITY.md](.github/SECURITY.md).
- **Contact:** contact@hawconnect.de

## Contributing and maintainers

HAWConnect is maintained by students at HAW Hamburg, and contributions are welcome — code, translations, bug reports and ideas.

1. Read [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) and the project conventions in [AGENTS.md](AGENTS.md).
2. Branch from `dev` (`feature/…`, `fix/…`), use [Conventional Commits](https://www.conventionalcommits.org/), and open a pull request into `dev`.
3. Please follow the [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Contributors

HAWConnect is built by many contributors. GitHub keeps the current list for each repository:

- [App](https://github.com/hawconnect/hawconnect-app/graphs/contributors)
- [Backend](https://github.com/hawconnect/hawconnect-backend/graphs/contributors)
- [Console](https://github.com/hawconnect/hawconnect-console/graphs/contributors)
- [Docs](https://github.com/hawconnect/hawconnect-docs/graphs/contributors)

Want to join? See [Contribute](https://hawconnect.de/en/docs/contribute/contribute).

## License

HAWConnect is free software under the [GNU Affero General Public License v3.0](LICENSE).

### Source attribution

HAWConnect contains code adapted from the Neuland Next application and related upstream components, maintained by Neuland Ingolstadt e.V. Original copyright and licence notices in the incorporated source remain applicable. HAWConnect is independently maintained and does not claim upstream endorsement.
