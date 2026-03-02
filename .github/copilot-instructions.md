# Copilot instructions (project-specific)

## Stack
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui (Radix).
- Routing: `react-router-dom`.
- Data backends (selected in `src/lib/api.ts`):
  - Offline Admin (localStorage) via `VITE_OFFLINE_ADMIN`.
  - Supabase via `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  - Local API server (Express + MySQL) via Vite dev proxy and/or `VITE_API_BASE`.

## Local dev (preferred)
- Frontend: `npm run dev` (Vite on port `8080`).
- API server (optional): `npm run dev:api` (Express on port `5050`).
- Lint/build: `npm run lint`, `npm run build`, `npm run preview`.

## Environment variables
- See `.env.example` for all keys.
- Deployed/static hosting (e.g. Vercel):
  - Recommended: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  - Optional uploads bucket: `VITE_SUPABASE_STORAGE_BUCKET` (default `uploads`).
  - Alternative: set `VITE_API_BASE` to a reachable API server URL.
  - Do **not** enable `VITE_OFFLINE_ADMIN` for public deployments.
- Local API server requires MySQL env vars (`MYSQL_*`) and `API_PORT`.
- Admin seeding for local API server: `ADMIN_EMAIL` + `ADMIN_PASSWORD`, then run `npm run create-admin`.

## Key codebase conventions
- **Do not bypass the API wrapper**: use `apiFetch` / `apiUpload` from `src/lib/api.ts` for app data.
  - This preserves the Offline/Supabase/API-server switching behavior.
- **Auth**
  - Frontend token is stored in localStorage key `portfolio_token`.
  - Prefer using `src/hooks/useAuth.tsx` rather than rolling new auth state.
- **Multi-page build**
  - Vite builds multiple HTML entrypoints: `index.html`, `projects.html`, `education.html`, `experience.html`, `contact.html`, `certificates.html`.
  - Keep page metadata consistent across these files when asked to change titles/meta.
- **UI**
  - Prefer existing components in `src/components/ui/*` and utilities in `src/lib/utils.ts`.
  - Keep Tailwind usage consistent; do not introduce new design tokens/colors unless explicitly requested.

## Supabase notes
- Supabase enablement is controlled by env vars; avoid direct Supabase calls outside `src/integrations/supabase/*` and `src/lib/api.ts`.
- For schema changes, add a new SQL file under `supabase/migrations/` (do not edit already-applied migrations).

## Scripts
- Offline → Supabase import: `node scripts/import-offline-to-supabase.mjs <offline-export.json>`.
  - Requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ADMIN_EMAIL`, `SUPABASE_ADMIN_PASSWORD`.

## What *not* to do
- Don’t add new pages, redesign the UI, or introduce new global styling unless explicitly asked.
- Don’t commit secrets (never commit `.env`).
