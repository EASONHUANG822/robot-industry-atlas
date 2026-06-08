# Turnstile Integration Design

**Date:** 2026-06-08
**Status:** Approved

## Goal

Add Cloudflare Turnstile (invisible mode) to the visit application form and feedback form to prevent automated abuse.

## Architecture

```
[TurnstileWidget]  ← shared client component, embedded in both forms
        |
        |  token included in POST body
        v
POST /api/applications  →  verifyTurnstileToken()  →  (existing validation + Airtable)
POST /api/feedback       →  verifyTurnstileToken()  →  (existing validation + Airtable)
```

## New Files

| File | Role |
|---|---|
| `src/server/turnstile.ts` | Server-side token verification via Cloudflare API |
| `src/components/TurnstileWidget.tsx` | Client-side invisible widget wrapper |

## Changed Files

| File | Change |
|---|---|
| `src/components/ApplicationForm.tsx` | Embed widget, include token in POST |
| `src/components/feedback/FeedbackForm.tsx` | Embed widget, include token in POST |
| `src/app/api/applications/route.ts` | Verify token before validation |
| `src/app/api/feedback/route.ts` | Verify token before validation |
| `messages/zh.json` | Add error message keys |
| `messages/en.json` | Add error message keys |
| `.env.example` | Document new env vars |

## New Dependency

- `@marsidev/react-turnstile` — lightweight (~3KB) React wrapper for Cloudflare Turnstile

## Environment Variables

| Variable | Where Used |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client (widget) |
| `TURNSTILE_SECRET_KEY` | Server (verification) |

## Server Verification — `src/server/turnstile.ts`

Single exported function:

```ts
verifyTurnstileToken(token: string): Promise<{ ok: true } | { ok: false; error: string }>
```

- POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` + `token`
- Returns `{ ok: true }` or `{ ok: false, error: "Verification failed. Please try again." }`

## Client Widget — `src/components/TurnstileWidget.tsx`

- Renders an invisible Turnstile widget via `@marsidev/react-turnstile`
- Props: `onToken(token: string): void`
- Exposes a `ref` so parent forms can call `.reset()` on error — re-renders the widget for a fresh challenge
- Uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY` env var

## Form Changes (both forms)

Same pattern for both:

1. Add `<TurnstileWidget>` in the form, store token in a ref
2. On submit: if token is empty (widget hasn't finished its background check), block submit with a message
3. Include `turnstileToken` in the POST body
4. On API 400 from verification failure, reset the widget and display the error

## API Route Changes (both routes)

At the top of the handler, before any business logic:

1. Extract `turnstileToken` from the parsed body
2. If missing, return 400 `{ error: "Verification required." }`
3. Call `verifyTurnstileToken(token)`; if it fails, return 400 with the error message
4. If it passes, continue to existing validation

## i18n Keys

| Key | en | zh |
|---|---|---|
| `form.verification.wait` | Please wait — verifying you are human. | 请稍候，正在验证您不是机器人。 |
| `form.verification.required` | Verification required. Please refresh the page and try again. | 需要验证。请刷新页面后重试。 |
| `form.verification.failed` | Verification failed. Please try again. | 验证失败，请重试。 |

## Error Handling

- Widget fails to load: submit button shows "please wait" state (no token produced → guard prevents submit)
- Token verification fails: API returns 400, form resets widget, shows error message, user can retry
- Cloudflare API unreachable: returns error, treated as verification failure — safe fail (no bypass)
