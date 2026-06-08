# Turnstile Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cloudflare Turnstile (invisible mode) to the visit application form and feedback form to prevent automated abuse.

**Architecture:** A shared `verifyTurnstileToken()` server utility validates tokens with Cloudflare's API. A shared `<TurnstileWidget>` client component renders the invisible widget. Both forms embed the widget and include the token in their POST body. Both API routes verify the token before processing.

**Tech Stack:** Next.js 15 App Router, `@marsidev/react-turnstile`, Cloudflare Turnstile API

---

## File Map

| File | Create/Modify | Responsibility |
|---|---|---|
| `src/server/turnstile.ts` | Create | Single `verifyTurnstileToken()` function — POSTs to Cloudflare siteverify |
| `src/components/TurnstileWidget.tsx` | Create | Client wrapper around `@marsidev/react-turnstile`, invisible mode |
| `src/app/api/applications/route.ts` | Modify | Extract `turnstileToken` from body, verify before business logic |
| `src/app/api/feedback/route.ts` | Modify | Same as above |
| `src/components/ApplicationForm.tsx` | Modify | Embed widget, include token in POST, reset on error |
| `src/components/feedback/FeedbackForm.tsx` | Modify | Same as above |
| `messages/zh.json` | Modify | Add verification i18n keys to `ApplicationForm` and `FeedbackPage` |
| `messages/en.json` | Modify | Same |
| `.env.example` | Create | Document `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` |
| `package.json` | Modify | Add `@marsidev/react-turnstile` dependency |

---

### Task 1: Install Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `@marsidev/react-turnstile`**

```bash
npm install @marsidev/react-turnstile
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('@marsidev/react-turnstile/package.json').version"
```

Expected: prints version number (e.g., `4.1.0`)

---

### Task 2: Server Verification Utility

**Files:**
- Create: `src/server/turnstile.ts`

- [ ] **Step 1: Write the module**

Create `src/server/turnstile.ts`:

```ts
export async function verifyTurnstileToken(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[TURNSTILE] TURNSTILE_SECRET_KEY is not set");
    return { ok: false, error: "Verification is not configured." };
  }

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData },
    );

    if (!response.ok) {
      console.error("[TURNSTILE] Siteverify HTTP error:", response.status);
      return { ok: false, error: "Verification failed. Please try again." };
    }

    const data = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return { ok: true };
    }

    console.error("[TURNSTILE] Verification failed:", data["error-codes"]);
    return { ok: false, error: "Verification failed. Please try again." };
  } catch (e) {
    console.error(
      "[TURNSTILE] Siteverify request failed:",
      e instanceof Error ? e.message : e,
    );
    return { ok: false, error: "Verification failed. Please try again." };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/server/turnstile.ts
```

Expected: no errors

---

### Task 3: Client Widget Component

**Files:**
- Create: `src/components/TurnstileWidget.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/TurnstileWidget.tsx`:

```tsx
"use client";

import { Turnstile } from "@marsidev/react-turnstile";

type Props = {
  onToken: (token: string) => void;
  resetKey: number;
};

export function TurnstileWidget({ onToken, resetKey }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <Turnstile
      key={resetKey}
      siteKey={siteKey}
      options={{ theme: "light", size: "invisible" }}
      onSuccess={onToken}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/TurnstileWidget.tsx
```

Expected: no errors

---

### Task 4: i18n Keys

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add keys to `messages/zh.json` — ApplicationForm section**

In `messages/zh.json`, inside `"ApplicationForm"` (after `"errors"` block), add:

```json
"verification": {
  "wait": "请稍候，正在验证您不是机器人。",
  "failed": "验证失败，请重试。"
}
```

The full `ApplicationForm` should look like this at the relevant section:

```json
"errors": {
  "generic": "提交失败，请稍后重试。",
  "network": "网络连接失败，请检查网络后重试。"
},
"verification": {
  "wait": "请稍候，正在验证您不是机器人。",
  "failed": "验证失败，请重试。"
},
```

- [ ] **Step 2: Add keys to `messages/zh.json` — FeedbackPage form section**

In `messages/zh.json`, inside `"FeedbackPage"` → `"form"` (after `"validation"` block), add:

```json
"verification": {
  "wait": "请稍候，正在验证您不是机器人。",
  "failed": "验证失败，请重试。"
}
```

- [ ] **Step 3: Add keys to `messages/en.json` — ApplicationForm section**

In `messages/en.json`, inside `"ApplicationForm"` (after `"errors"` block), add:

```json
"verification": {
  "wait": "Please wait, verifying you are human.",
  "failed": "Verification failed. Please try again."
}
```

- [ ] **Step 4: Add keys to `messages/en.json` — FeedbackPage form section**

In `messages/en.json`, inside `"FeedbackPage"` → `"form"` (after `"validation"` block), add:

```json
"verification": {
  "wait": "Please wait, verifying you are human.",
  "failed": "Verification failed. Please try again."
}
```

- [ ] **Step 5: Validate JSON files**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/zh.json','utf8')); console.log('zh: valid')"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('en: valid')"
```

Expected: prints `zh: valid` and `en: valid`

---

### Task 5: Integrate Turnstile into ApplicationForm

**Files:**
- Modify: `src/components/ApplicationForm.tsx`

- [ ] **Step 1: Add imports**

Change the import line:

```tsx
import { useState } from "react";
```

to:

```tsx
import { useRef, useState } from "react";
```

Add TurnstileWidget import after the BookingCalendar import:

```tsx
import { BookingCalendar } from "./BookingCalendar";
import { TurnstileWidget } from "./TurnstileWidget";
```

- [ ] **Step 2: Add state and refs in the component body**

After `const [errorMessage, setErrorMessage] = useState("");` (line 30), add:

```tsx
const [turnstileToken, setTurnstileToken] = useState("");
const [turnstileResetKey, setTurnstileResetKey] = useState(0);
const [turnstileReady, setTurnstileReady] = useState(false);
```

- [ ] **Step 3: Add Turnstile guard in handleSubmit**

Inside `handleSubmit`, after `setErrorMessage("");` and before the `const form = ...` line, add:

```tsx
if (!turnstileToken) {
  setErrorMessage(t("verification.wait"));
  setSubmitState("error");
  return;
}
```

- [ ] **Step 4: Include turnstileToken in the POST body**

Change the `body` object construction (lines 49-55). Replace:

```tsx
const body: Record<string, unknown> = { ...payload };
if (paymentMode) {
  body.applicationType = "trial";
}
if (locale) {
  body.locale = locale;
}
```

with:

```tsx
const body: Record<string, unknown> = { ...payload, turnstileToken };
if (paymentMode) {
  body.applicationType = "trial";
}
if (locale) {
  body.locale = locale;
}
```

- [ ] **Step 5: Detect verification failure and reset widget**

In the error handling block (after `if (!response.ok || !data.ok)`), check for verification error and reset the widget. Replace:

```tsx
if (!response.ok || !data.ok) {
  setErrorMessage(data.error || t("errors.generic"));
  setSubmitState("error");
  return;
}
```

with:

```tsx
if (!response.ok || !data.ok) {
  const msg = data.error || t("errors.generic");
  setErrorMessage(msg);
  setSubmitState("error");
  if (msg === t("verification.failed") || msg === "Verification failed. Please try again.") {
    setTurnstileToken("");
    setTurnstileResetKey((k) => k + 1);
  }
  return;
}
```

- [ ] **Step 6: Add TurnstileWidget to the JSX**

Insert the TurnstileWidget just before the submit button. Find:

```tsx
<button
  type="submit"
```

Insert before it:

```tsx
<TurnstileWidget
  onToken={(token) => { setTurnstileToken(token); setTurnstileReady(true); }}
  resetKey={turnstileResetKey}
/>
```

- [ ] **Step 7: Verify with type check**

```bash
npx tsc --noEmit
```

Expected: no errors

---

### Task 6: Integrate Turnstile into FeedbackForm

**Files:**
- Modify: `src/components/feedback/FeedbackForm.tsx`

- [ ] **Step 1: Add imports**

Change the import line:

```tsx
import { useState } from "react";
```

to:

```tsx
import { useRef, useState } from "react";
```

Add TurnstileWidget import:

```tsx
import { TurnstileWidget } from "../TurnstileWidget";
```

- [ ] **Step 2: Add state and refs**

After `const [status, setStatus] = useState<...>("idle");` (line 14), add:

```tsx
const [turnstileToken, setTurnstileToken] = useState("");
const [turnstileResetKey, setTurnstileResetKey] = useState(0);
```

- [ ] **Step 3: Add Turnstile guard in handleSubmit**

Inside `handleSubmit`, after `if (!validate()) return;` and before `setStatus("submitting")`, add:

```tsx
if (!turnstileToken) {
  setErrors({ message: translations["form.verification.wait"] ?? "Please wait, verifying you are human." });
  return;
}
```

- [ ] **Step 4: Include turnstileToken in the POST body**

Change the fetch body (lines 43-46). Replace:

```tsx
body: JSON.stringify({ name: form.name.trim(), role: form.role.trim(), message: form.message.trim() }),
```

with:

```tsx
body: JSON.stringify({ name: form.name.trim(), role: form.role.trim(), message: form.message.trim(), turnstileToken }),
```

- [ ] **Step 5: Detect verification failure and reset widget**

In the error handling block, replace:

```tsx
if (!res.ok) {
  const data = await res.json().catch(() => ({}));
  setErrors({ message: data?.error ?? (translations["form.error"] ?? "Submission failed.") });
  setStatus("error");
  return;
}
```

with:

```tsx
if (!res.ok) {
  const data = await res.json().catch(() => ({}));
  const msg = data?.error ?? (translations["form.error"] ?? "Submission failed.");
  setErrors({ message: msg });
  setStatus("error");
  const failedMsg = translations["form.verification.failed"] ?? "Verification failed. Please try again.";
  if (msg === failedMsg) {
    setTurnstileToken("");
    setTurnstileResetKey((k) => k + 1);
  }
  return;
}
```

- [ ] **Step 6: Add TurnstileWidget to the JSX**

Insert before the submit button. Find:

```tsx
<button
  type="submit"
```

Insert before it:

```tsx
<TurnstileWidget
  onToken={setTurnstileToken}
  resetKey={turnstileResetKey}
/>
```

- [ ] **Step 7: Update feedback page translation map**

In `src/app/[locale]/feedback/page.tsx`, inside the `translations` object (after the `moderationNotice` line), add:

```tsx
"form.verification.wait": t("form.verification.wait"),
"form.verification.failed": t("form.verification.failed"),
```

- [ ] **Step 8: Verify with type check**

```bash
npx tsc --noEmit
```

Expected: no errors

---

### Task 7: Add Turnstile Verification to /api/applications

**Files:**
- Modify: `src/app/api/applications/route.ts`

- [ ] **Step 1: Add import**

Add after existing imports:

```ts
import { verifyTurnstileToken } from "@/server/turnstile";
```

- [ ] **Step 2: Add verification at top of handler**

After the JSON parse block (after the closing `}` of `catch`) and before `const { applicationType: _type, locale: _locale, ...fields } = body;`, add:

```ts
const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
if (!turnstileToken) {
  return NextResponse.json({ error: "Verification required." }, { status: 400 });
}

const turnstileResult = await verifyTurnstileToken(turnstileToken);
if (!turnstileResult.ok) {
  return NextResponse.json({ error: turnstileResult.error }, { status: 400 });
}
```

The resulting handler should look like this in the relevant section:

```ts
export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!turnstileToken) {
    return NextResponse.json({ error: "Verification required." }, { status: 400 });
  }

  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.ok) {
    return NextResponse.json({ error: turnstileResult.error }, { status: 400 });
  }

  const { applicationType: _type, locale: _locale, ...fields } = body;

  const validation = validateApplicationPayload(fields);
  // ... rest unchanged
```

- [ ] **Step 3: Verify with type check**

```bash
npx tsc --noEmit
```

Expected: no errors

---

### Task 8: Add Turnstile Verification to /api/feedback

**Files:**
- Modify: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Add import**

Add after existing imports:

```ts
import { verifyTurnstileToken } from "@/server/turnstile";
```

- [ ] **Step 2: Add verification at top of handler**

After the JSON parse block and before `const validation = validateFeedbackPayload(body);`, add:

```ts
const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
if (!turnstileToken) {
  return NextResponse.json({ error: "Verification required." }, { status: 400 });
}

const turnstileResult = await verifyTurnstileToken(turnstileToken);
if (!turnstileResult.ok) {
  return NextResponse.json({ error: turnstileResult.error }, { status: 400 });
}
```

The resulting handler should look like:

```ts
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!turnstileToken) {
    return NextResponse.json({ error: "Verification required." }, { status: 400 });
  }

  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.ok) {
    return NextResponse.json({ error: turnstileResult.error }, { status: 400 });
  }

  const validation = validateFeedbackPayload(body);
  // ... rest unchanged
```

- [ ] **Step 3: Verify with type check**

```bash
npx tsc --noEmit
```

Expected: no errors

---

### Task 9: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Write the file**

Create `.env.example`:

```
# Cloudflare Turnstile (CAPTCHA)
# Get your keys at https://dash.cloudflare.com/ → Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

- [ ] **Step 2: Verify file created**

```bash
ls -la .env.example
```

---

### Task 10: Full Type-Check and Commit

- [ ] **Step 1: Run full type check**

```bash
npm run test
```

Expected: no TypeScript errors

- [ ] **Step 2: Stage all changed files and commit**

```bash
git add package.json package-lock.json .env.example src/server/turnstile.ts src/components/TurnstileWidget.tsx src/components/ApplicationForm.tsx src/components/feedback/FeedbackForm.tsx src/app/api/applications/route.ts src/app/api/feedback/route.ts src/app/[locale]/feedback/page.tsx messages/zh.json messages/en.json
```

```bash
git commit -m "feat: add Cloudflare Turnstile verification to application and feedback forms"
```

- [ ] **Step 3: Verify git status is clean**

```bash
git status
```

Expected: `nothing to commit, working tree clean`
