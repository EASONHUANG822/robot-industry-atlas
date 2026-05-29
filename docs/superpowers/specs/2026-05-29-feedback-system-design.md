# Feedback System Design

**Date:** 2026-05-29
**Status:** Approved

## Overview

Replace hardcoded testimonials in `LandingTestimonials` with a dynamic user-submitted feedback system. Users submit testimonials via a dedicated page; staff moderate submissions through an admin backend. Approved feedback displays on the landing page carousel.

## Data Model

### Airtable Table: `Feedback`

| Field | Type | Purpose |
|---|---|---|
| `Name` | Single line text | Submitter's name |
| `Role` | Single line text | Company / title (e.g. "CTO, Robotics Innovation Lab") |
| `Message` | Long text | Feedback content |
| `Status` | Single select: `Pending`, `Approved`, `Rejected` | Moderation state. Default: `Pending` |
| `Featured` | Checkbox | Highlight/pin this entry. Featured entries sort first in carousel. Default: unchecked |
| `SubmittedAt` | Date time | ISO 8601 submission timestamp |

### Environment Variables

| Variable | Purpose |
|---|---|
| `AIRTABLE_FEEDBACK_TABLE_NAME` | Airtable table name for feedback (reuses existing `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID`) |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |

## API Design

### Public Endpoints

**`POST /api/feedback`** — Submit feedback (no auth)
- Body: `{ name: string, role: string, message: string }`
- Server sets `Status = "Pending"`, `Featured = false`, `SubmittedAt = now`
- Returns: `{ ok: true, recordId: string }` or `{ error: string }`
- Validates: all fields required, message max 1000 chars

**`GET /api/feedback`** — List approved feedback (no auth)
- Returns feedback where `Status = "Approved"`
- Featured entries sorted first, then by `SubmittedAt` descending
- Returns: `{ feedback: [{ id, name, role, message, featured, submittedAt }] }`

### Admin Endpoints

All admin endpoints require a valid session cookie (set by login).

**`POST /api/admin/login`** — Authenticate
- Body: `{ username: string, password: string }`
- Validates against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Sets httpOnly session cookie on success
- Returns: `{ ok: true }` or `{ error: string }` (401)

**`POST /api/admin/logout`** — Clear session
- Clears the session cookie

**`GET /api/admin/feedback`** — List all feedback (auth required)
- Query params: `?status=Pending|Approved|Rejected` (optional filter)
- Returns: `{ feedback: [{ id, name, role, message, status, featured, submittedAt }] }`

**`PATCH /api/admin/feedback/[id]`** — Update feedback (auth required)
- Body: `{ status?, message?, featured? }` — partial update, only changed fields
- `status`: set to `"Approved"`, `"Rejected"`, or `"Pending"`
- `message`: edit the feedback text
- `featured`: toggle featured flag
- Delete is a soft delete: sets status to `"Rejected"`. Records are never hard-deleted via the admin UI

### Admin Session

- Session token: random UUID stored in an httpOnly cookie (`admin_session`)
- Server-side validation via a shared helper in `src/server/adminAuth.ts`
- `validateAdminSession(request: Request)` → `{ ok: true }` or `{ ok: false, error: string }`

## Pages & Components

### 1. `/feedback` — Feedback Submission Page

- **Route:** `src/app/[locale]/feedback/page.tsx`
- **Layout:** Split hero + form (Layout B from mockup)
  - Left: headline + description + note about moderation
  - Right: form card with Name, Role & Company, Feedback textarea, Submit button
- **States:** idle → submitting → success toast / error toast
- **After submit:** show success message "Thank you! Your review will be published after moderation."
- **i18n:** new namespace `FeedbackPage` in `messages/{en,zh}.json`

### 2. `/admin` — Admin Dashboard

- **Route:** `src/app/admin/page.tsx` (outside `[locale]` — exempted from i18n middleware via matcher config so it doesn't redirect to a locale prefix)
- **Unauthenticated:** shows login form (username + password + Sign In button)
- **Authenticated:** shows feedback moderation dashboard
  - Tab bar: All / Pending / Approved / Rejected (with counts)
  - Feedback cards list showing: name, role, message, status badge, date
  - Per-card actions:
    - **Pending cards:** Approve, Edit, Reject
    - **Approved cards:** Unfeature/Feature toggle, Edit, Delete (set to Rejected)
    - **Rejected cards:** Re-approve (set back to Pending), Delete
  - Edit flow: inline text editing or simple modal
- **Auth check:** on page load, try `GET /api/admin/feedback` — if 401, show login form

### 3. Landing Page CTA

- New component `src/components/landing/LandingFeedbackCTA.tsx`
- Inline row layout: headline "Loved your visit?" + subtext + "Write a Review →" button
- Links to `/feedback`
- Placed in `page.tsx` below `<LandingTestimonials />`
- **i18n:** keys under `Landing.feedbackCTA` in messages

### 4. Updated `LandingTestimonials`

- Remove hardcoded `testimonials` array from i18n
- Fetch from `GET /api/feedback` on mount (client-side, already `"use client"`)
- Featured entries sort first, then by `submittedAt` descending
- **Loading state:** show skeleton cards while fetching
- **Empty state:** if no approved feedback, hide the testimonials section entirely (including CTA)
- **Error state:** silently fall back to empty (don't block the page)
- Remove i18n keys `testimonials.t1` through `testimonials.t8`

## i18n

### New keys in `messages/en.json` and `messages/zh.json`

**`FeedbackPage` namespace:**
- `title` — page title
- `eyebrow` — small label above title
- `description` — hero text
- `moderationNotice` — "reviewed before publishing" note
- `form.name.label` / `form.name.placeholder`
- `form.role.label` / `form.role.placeholder`
- `form.message.label` / `form.message.placeholder`
- `form.submit` — button text
- `form.success` — toast message after submit
- `form.error` — generic error toast

**`Landing` namespace (additions):**
- `feedbackCTA.heading` — "Loved your visit?"
- `feedbackCTA.subtext` — "Your review helps others discover Robot Valley"
- `feedbackCTA.button` — "Write a Review"

**`Landing` namespace (removals):**
- `testimonials.t1` through `testimonials.t8`

## Files Changed / Created

| File | Action |
|---|---|
| `src/server/airtableFeedback.ts` | **New** — Airtable CRUD for feedback |
| `src/server/adminAuth.ts` | **New** — session validation helper |
| `src/app/api/feedback/route.ts` | **New** — public POST + GET |
| `src/app/api/admin/login/route.ts` | **New** — login endpoint |
| `src/app/api/admin/logout/route.ts` | **New** — logout endpoint |
| `src/app/api/admin/feedback/route.ts` | **New** — admin GET (list) |
| `src/app/api/admin/feedback/[id]/route.ts` | **New** — admin PATCH |
| `src/app/[locale]/feedback/page.tsx` | **New** — feedback form page |
| `src/app/admin/page.tsx` | **New** — admin SPA (login + dashboard) |
| `src/components/landing/LandingFeedbackCTA.tsx` | **New** — CTA component |
| `src/components/landing/LandingTestimonials.tsx` | **Modify** — dynamic data fetching |
| `src/app/[locale]/page.tsx` | **Modify** — add CTA, already has LandingTestimonials |
| `messages/en.json` | **Modify** — add FeedbackPage + feedbackCTA keys, remove t1-t8 |
| `messages/zh.json` | **Modify** — same |
| `.env.example` | **Modify** — add new env vars |

## Error Handling

- Airtable failures: return 502 with generic message, log details server-side
- Admin auth failures: return 401, redirect to login
- Form validation failures: return 400 with field-level error messages
- Client fetch failures: silent fallback (carousel shows empty, form shows error toast)
