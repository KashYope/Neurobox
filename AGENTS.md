# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NeuroSooth (codename Neurobox) is a somatic exercise toolkit for neurodivergent users. It is a full-stack app with a React 19 + Vite frontend, an Express + PostgreSQL backend, and offline-first PWA capabilities via IndexedDB and Workbox service workers.

The primary language is French -- UI strings, exercise content, code comments, and documentation are predominantly in French with i18n support for EN/DE/ES/NL.

## Build & Run Commands

```bash
# Frontend dev server (port 3000)
npm run dev

# Backend dev server (TypeScript watch mode, port 4000)
npm run server:dev

# Build frontend (outputs to dist/)
npm run build

# Build backend (outputs to server/dist/)
npm run server:build

# Run tests (compiles TS then runs node:test on dist-test/)
npm test

# Run database migrations
npm run server:migrate

# Seed initial data
npm run server:seed

# Generate a JWT token (partner or moderator)
npm run server:token <role> [subject]

# Docker full stack (Postgres + app)
docker compose up
```

There is no separate lint or typecheck command configured in package.json. TypeScript compilation (`tsc`) via `npm run server:build` or `npm run test:build` serves as the type checker.

## Testing

Tests use Node.js built-in `node:test` runner (not Jest/Vitest). The test pipeline:

1. `npm run test:build` compiles TS files (via `tsconfig.test.json`) to `dist-test/`
2. `scripts/fix-test-imports.mjs` patches import paths in the compiled output
3. `node --test dist-test` runs the tests

Test files live in `tests/` and currently focus on `syncService` (offline hydration, mutation queue replay, conflict resolution). Server-side tests are in `server/tests/`.

To run a single test file after building: `node --test dist-test/<test-file>.js`

## Architecture

### Dual entry points

- `src/main.tsx` -- browser entry point, renders `<I18nProvider><App /></I18nProvider>`, registers service worker
- `index.tsx` -- re-exports `App` (used as an alternative entry for Capacitor/embedding)

### Frontend data flow

The frontend uses a custom offline-first sync architecture (no Redux/Zustand):

1. **`services/storage/offlineDb.ts`** -- IndexedDB adapter (lightweight Dexie-compatible shim in `dexieShim.ts`) storing exercises, user profile, attachments, translations, and pending mutations
2. **`services/syncService.ts`** -- singleton `SyncService` class that holds an in-memory exercise cache, a pending mutation queue, and pub/sub notifications (`subscribe`/`subscribeStatus`). Hydrates from IndexedDB on init, reconciles with server when online, replays queued mutations on reconnect
3. **`services/dataService.ts`** -- high-level helpers consumed by components: `getExercises`, `getRecommendedExercises` (scoring algorithm using neurotype matching + thanksCount), `saveExercise`, `incrementThanks`, `moderateExercise`. Delegates persistence to `syncService`
4. **`services/apiClient.ts`** -- `ApiClient` class wrapping `fetch` with JWT auth injection (partner/moderator tokens from `tokenStore`). Base URL from `VITE_API_BASE_URL` env var, falls back to `/api`

Components read exercises via `syncService.subscribe()` and trigger mutations through `dataService` helpers, which enqueue in `syncService` for eventual server sync.

### i18n (important quirk)

The app uses a **custom React context** (`src/i18nContext.tsx`) wrapping `i18next` instead of `react-i18next`'s built-in provider. This is intentional -- it works around a React 19 event system bug in `initReactI18next`. Always import `useTranslation` from `../src/i18nContext` (not from `react-i18next`).

Translation namespaces: `common`, `onboarding`, `exercise`, `partner`, `moderation` -- JSON files in `public/locales/{lang}/`.

### Backend (server/)

Express app in `server/src/index.ts`. Key structure:

- **Routes**: `routes/exercises.ts`, `routes/moderation.ts`, `routes/strings.ts`, `routes/auth.ts`, `routes/admin.ts`
- **Auth**: JWT via `server/src/auth.ts` -- `optionalAuth` middleware on all API routes, `requireRole('moderator'|'partner'|'admin')` for protected endpoints. Role hierarchy: admin > moderator > partner
- **DB**: PostgreSQL via `pg` Pool (`server/src/db.ts`). Migrations are raw SQL files in `server/migrations/` run sequentially by `server/scripts/runMigrations.ts`
- **Validation**: Zod schemas in `server/src/utils/validation.ts`
- **CSP**: Content Security Policy configured via `helmet` in `server/src/index.ts` (`buildContentSecurityPolicy` function). Modify directive arrays there to allow new external sources
- **Env**: `server/src/env.ts` loads and validates environment variables. Falls back to dev defaults for `DATABASE_URL` and `JWT_SECRET` outside production

### Shared types

Types are defined in `server/src/shared/types.ts` and re-exported from the root `types.ts`. Both frontend and backend import from this single source of truth. Key types: `Exercise`, `UserProfile`, `NeuroType` (enum), `Situation` (enum), `ModerationStatus`.

### Translation system (database-backed)

Exercise content translation uses a two-table system (`exercise_strings` + `exercise_translations`) with string IDs like `exercise.resp_478.title`. The `Exercise` type has both legacy content fields (`title`, `description`, `steps`) and optional string ID fields (`titleStringId`, etc.). `services/contentResolver.ts` falls back to legacy fields when string IDs are absent. This is a phased migration -- do not remove legacy fields.

### Path alias

`@/*` maps to the project root (configured in `tsconfig.json` and `vite.config.ts`). Example: `import { Exercise } from '@/types'`.

### PWA / Service Worker

`src/sw.ts` is a Workbox service worker with caching strategies per resource type (StaleWhileRevalidate for app shell, NetworkFirst for API, CacheFirst for images). Background sync replays mutations queued while offline. Configuration in both `src/sw.ts` and `vite.config.ts` (VitePWA plugin).

## Environment Variables

Copy `.env.example` to `.env`. Required vars:
- `DATABASE_URL` -- PostgreSQL connection string
- `JWT_SECRET` -- signing key for JWT tokens
- `PORT` -- backend port (default 4000)
- `VITE_API_BASE_URL` -- API URL used by the frontend client
- `CORS_ORIGINS` -- comma-separated allowed origins (required in production)
- `GOOGLE_TRANSLATE_API_KEY` -- optional, for batch translation feature
