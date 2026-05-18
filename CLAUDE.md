# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server at http://localhost:3000
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint (flat config)
npm run test          # Type-check via tsc --noEmit (no runtime test suite)
npm run import:companies    # Import companies from Excel into src/data/companies.generated.ts
npm run geocode:companies   # Geocode company addresses via AMap Web Service API
```

## Architecture

- **Framework**: Next.js 15 App Router with locale-prefixed routing (`/zh`, `/en`). Default locale is `zh`, always in prefix.
- **i18n**: `next-intl` v4. Translation files live in `messages/{zh,en}.json`. Keys must exist in both files. Server components use `getTranslations()` + `setRequestLocale()`, client components use `useTranslations()`. Navigation uses the custom `Link` from `src/i18n/navigation.ts` (wraps next-intl's `createNavigation`), never `next/link`.
- **Rendering**: Pages are server components by default. Only interactive widgets (SiteHeader, LanguageSwitcher, OfficeGlobe, PhotoGallery, VisitDatePicker, ApplicationForm, ScrollReveal) use `"use client"`.
- **Styling**: Tailwind CSS 3 with a custom color palette defined in `tailwind.config.ts` (ink, accent, secondary, muted, panel, line, page, etc.). Base CSS in `src/app/globals.css` sets a radial gradient background.
- **Data pipeline for companies**: Excel → `scripts/import-companies.ts` → `src/data/companies.generated.ts` → hydrated + merged with geocoded coordinates in `src/data/companies.ts` (also reads `data/company-overrides.json` and `src/data/company-coordinates.generated.json`). `localizeCompany()` produces the locale-aware shape used by components.
- **Visit applications**: Form data POSTs to `/api/applications`, which validates fields, checks date availability (max 4 "Done" applications per date), and creates records in Airtable. Unavailable dates are served via `GET /api/applications/unavailable-dates`.
- **Server-only modules**: Files that must only run server-side are marked with `import "server-only"` (e.g., `src/server/airtableApplications.ts`). These read environment variables directly (`process.env.AIRTABLE_*`).
- **Three.js**: Used in `OfficeGlobe.tsx` and `OfficeGlobePanel.tsx` for a decorative globe visualization on the landing page.

## Environment

Required env vars (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_AMAP_KEY` | AMap JS API key (client-side, for map components) |
| `NEXT_PUBLIC_AMAP_SECURITY_CODE` | AMap security code |
| `AIRTABLE_TOKEN` | Airtable PAT for form submission API |
| `AIRTABLE_BASE_ID` | Airtable base ID (starts with `app`) |
| `AIRTABLE_TABLE_NAME` | Airtable table name or ID |

For geocoding scripts: `AMAP_WEB_SERVICE_KEY`, `GEOCODE_DELAY_MS`, `LOCAL_GEOCODE_FALLBACK`.

## Key conventions

- All new UI text must be added to both `messages/zh.json` and `messages/en.json` with identical key structure.
- Page components call `setRequestLocale(locale)` before rendering — missing this breaks the i18n context for the entire subtree.
- The `Link` component from `src/i18n/navigation.ts` auto-prefixes paths with the current locale. Use it instead of `next/link`.
- `src/data/companies.generated.ts` is auto-generated — do not hand-edit. Manual English overrides or coordinate fixes go in `data/company-overrides.json`.
- Commit messages are concise and descriptive (see `git log --oneline` for examples).
