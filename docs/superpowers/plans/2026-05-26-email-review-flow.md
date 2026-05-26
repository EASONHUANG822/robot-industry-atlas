# Email Review Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all five third-party payment integrations with a two-stage email notification system powered by Resend.

**Architecture:** When a trial application is submitted, the backend creates an Airtable record and sends a "received" email via Resend. An Airtable automation webhook triggers when an admin sets Status=Approved, calling a new endpoint that sends a "payment instructions" email with bank transfer details.

**Tech Stack:** Resend (email delivery), React (email templates via JSX), Next.js API routes (webhook endpoint)

---

### Task 1: Install Resend and create bank/pricing config

**Files:**
- Modify: `package.json`
- Create: `src/config/email.ts`
- Delete: `src/content/paymentOffer.ts`
- Delete: `src/content/paymentOffer.test.ts`

- [ ] **Step 1: Install resend package**

Run: `npm install resend`
Expected: package.json updated with `resend` dependency.

- [ ] **Step 2: Create `src/config/email.ts` with bank account info and migrated pricing constants**

```typescript
export const TRIAL_PAYMENT_PRICE_CNY = 100;

export const PAYMENT_BENEFIT_KEYS = [
  "robotOperation",
  "printedGift",
  "refreshments",
] as const;

export type PaymentBenefitKey = (typeof PAYMENT_BENEFIT_KEYS)[number];

export function getBankAccountInfo() {
  return {
    bankName: process.env.BANK_NAME || "",
    bankBranch: process.env.BANK_BRANCH || "",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    accountName: process.env.BANK_ACCOUNT_NAME || "",
  };
}
```

- [ ] **Step 3: Delete `src/content/paymentOffer.ts` and `src/content/paymentOffer.test.ts`**

Run:
```
Remove-Item "src/content/paymentOffer.ts"
Remove-Item "src/content/paymentOffer.test.ts"
```

- [ ] **Step 4: Update all imports from `@/content/paymentOffer` to `@/config/email`**

Files to update:
- `src/app/[locale]/page.tsx:6` — change `@/content/paymentOffer` → `@/config/email`
- `src/app/[locale]/payment/page.tsx:2` — change `@/content/paymentOffer` → `@/config/email`

In both files, replace:
```typescript
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
```
with:
```typescript
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/config/email";
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/config/email.ts src/app/[locale]/page.tsx src/app/[locale]/payment/page.tsx
git add -u src/content/paymentOffer.ts src/content/paymentOffer.test.ts
git commit -m "feat: add Resend dependency and bank/pricing config"
```

---

### Task 2: Create Resend server client

**Files:**
- Create: `src/server/resend.ts`

- [ ] **Step 1: Create `src/server/resend.ts`**

```typescript
import "server-only";
import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendApplicationReceivedEmail(params: {
  to: string;
  name: string;
  preferredVisitDate?: string;
  visitorCount?: string;
  locale: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, name, preferredVisitDate, visitorCount, locale } = params;

  const subject =
    locale === "en"
      ? "Application Received — Robot Valley Visit"
      : "参观申请已收到 — 机器人谷";

  const dateStr = preferredVisitDate || "-";
  const countStr = visitorCount || "-";

  const html =
    locale === "en"
      ? `<p>Hi ${name},</p><p>We've received your visit application. We will review it within 1–2 business days and notify you of the result by email.</p><p><strong>Preferred visit date:</strong> ${dateStr}<br><strong>Visitor count:</strong> ${countStr}</p><p>— Robot Valley Team</p>`
      : `<p>${name}，您好：</p><p>我们已收到您的参观申请。我们将在 1–2 个工作日内完成审核，并以邮件形式通知您审核结果，请留意邮箱。</p><p><strong>期望参观日期：</strong>${dateStr}<br><strong>参观人数：</strong>${countStr}</p><p>—— 机器人谷团队</p>`;

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@robotvalley.cn",
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Failed to send application received email:", message);
    return { ok: false, error: message };
  }
}

export async function sendApprovalNotificationEmail(params: {
  to: string;
  name: string;
  amount: number;
  visitorCount: number;
  preferredVisitDate?: string;
  locale: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, name, amount, visitorCount, preferredVisitDate, locale } = params;

  const bank = {
    bankName: process.env.BANK_NAME || "",
    bankBranch: process.env.BANK_BRANCH || "",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    accountName: process.env.BANK_ACCOUNT_NAME || "",
  };

  const subject =
    locale === "en"
      ? "Visit Approved — Payment Instructions"
      : "参观申请已通过 — 支付指引";

  const dateStr = preferredVisitDate || "-";

  const html =
    locale === "en"
      ? `<p>Hi ${name},</p><p>Your visit application has been approved. Please complete payment via bank transfer:</p><p><strong>Bank:</strong> ${bank.bankName} ${bank.bankBranch}<br><strong>Account Name:</strong> ${bank.accountName}<br><strong>Account Number:</strong> ${bank.accountNumber}<br><strong>Amount:</strong> ¥${amount} (${visitorCount} persons × ¥${amount / visitorCount}/person)</p><p><strong>Preferred visit date:</strong> ${dateStr}</p><p>After the transfer is confirmed, we will finalize your visit arrangements.</p><p>— Robot Valley Team</p>`
      : `<p>${name}，您好：</p><p>您的参观申请已通过审核。请按以下银行信息完成转账：</p><p><strong>银行：</strong>${bank.bankName} ${bank.bankBranch}<br><strong>户名：</strong>${bank.accountName}<br><strong>账号：</strong>${bank.accountNumber}<br><strong>金额：</strong>¥${amount}（${visitorCount}人 × ¥${amount / visitorCount}/人）</p><p><strong>期望参观日期：</strong>${dateStr}</p><p>转账确认后，我们将为您最终安排参观事宜。</p><p>—— 机器人谷团队</p>`;

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@robotvalley.cn",
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Failed to send approval notification email:", message);
    return { ok: false, error: message };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/resend.ts
git commit -m "feat: add Resend email client with send functions"
```

---

### Task 3: Create Airtable webhook route for approval notifications

**Files:**
- Create: `src/app/api/email/approval-notify/route.ts`

- [ ] **Step 1: Create `src/app/api/email/approval-notify/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { sendApprovalNotificationEmail } from "@/server/resend";
import { TRIAL_PAYMENT_PRICE_CNY } from "@/config/email";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = (body.fields || {}) as Record<string, unknown>;
  const email = String(fields.email || "");
  const name = String(fields.Name || "");
  const visitorCountRaw = fields.visitorCount;
  const preferredVisitDate = String(fields.preferredVisitDate || "");

  if (!email || !name) {
    return NextResponse.json({ error: "Missing required fields: email, Name" }, { status: 400 });
  }

  const visitorCount = Math.max(1, parseInt(String(visitorCountRaw || "1"), 10) || 1);
  const amount = visitorCount * TRIAL_PAYMENT_PRICE_CNY;

  const locale = String(body.locale || (body.fields as Record<string, unknown>)?.locale || "zh");

  const result = await sendApprovalNotificationEmail({
    to: email,
    name,
    amount,
    visitorCount,
    preferredVisitDate,
    locale: locale.startsWith("en") ? "en" : "zh",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/email/approval-notify/route.ts
git commit -m "feat: add Airtable webhook endpoint for approval notification emails"
```

---

### Task 4: Modify /api/applications route to send confirmation email

**Files:**
- Modify: `src/app/api/applications/route.ts`

- [ ] **Step 1: Update `src/app/api/applications/route.ts` to send email for trial applications**

Replace the entire file content with:

```typescript
import { NextResponse } from "next/server";
import {
  createAirtableApplication,
  validateApplicationPayload,
  validatePreferredVisitDateAvailability,
} from "@/server/airtableApplications";
import { sendApplicationReceivedEmail } from "@/server/resend";

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const applicationType = String(body.applicationType || "visit");
  const locale = String(body.locale || "zh");

  const validation = validateApplicationPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const availability = await validatePreferredVisitDateAvailability(
      validation.payload.preferredVisitDate,
    );
    if (!availability.ok) {
      return NextResponse.json({ error: availability.error }, { status: availability.status });
    }

    const result = await createAirtableApplication(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (applicationType === "trial") {
      const payload = validation.payload;
      sendApplicationReceivedEmail({
        to: payload.email || "",
        name: payload.name || "",
        preferredVisitDate: payload.preferredVisitDate,
        visitorCount: payload.visitorCount,
        locale,
      }).catch((err) => {
        console.error("Failed to send application received email:", err);
      });
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json(
      { error: "Application submission failed. Please try again later." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/applications/route.ts
git commit -m "feat: send confirmation email on trial application submission"
```

---

### Task 5: Strip payment logic from ApplicationForm

**Files:**
- Modify: `src/components/ApplicationForm.tsx`

- [ ] **Step 1: Remove payment-related imports and state**

Remove the import on line 7:
```typescript
// REMOVE this line:
import { type PaymentMethod } from "@/content/paymentOffer";
```

Remove the import of `useRef` and `useCallback` — they were only used for payment polling. Keep `useState`, `useEffect` (if still used), and `FormEvent`, `ReactNode`.

Actually, check: `useCallback` is only used by `startPolling` which is payment-only. `useRef` is only used by `pendingPayloadRef` and `pollRef` which are both payment-only. Remove both from the React import:

```typescript
// BEFORE:
import { useState, useEffect, useRef, useCallback } from "react";
// AFTER:
import { useState } from "react";
```

- [ ] **Step 2: Remove payment-related types and state variables**

Remove these type definitions (lines ~12-17 in original):
```typescript
// REMOVE:
type SubmitState = "idle" | "submitting" | "error";
type WechatPayState = {
  codeUrl: string;
  outTradeNo: string;
  amount: number;
} | null;
```

Replace with:
```typescript
type SubmitState = "idle" | "submitting" | "error";
```

Remove these state variables and refs from inside the component:
```typescript
// REMOVE all of these:
const [wechatPay, setWechatPay] = useState<WechatPayState>(null);
const [wechatPayPaid, setWechatPayPaid] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const pendingPayloadRef = useRef<ApplicationPayload | null>(null);
const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

- [ ] **Step 3: Rewrite handleSubmit for the new flow**

Replace the entire `handleSubmit` function body with:

```typescript
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setErrorMessage("");

  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = buildPayload(formData);

  if (!payload.name || !payload.email) {
    setErrorMessage(t("errors.generic"));
    setSubmitState("error");
    return;
  }

  setSubmitState("submitting");

  try {
    const body: Record<string, unknown> = { ...payload };
    if (paymentMode) {
      body.applicationType = "trial";
    }
    if (locale) {
      body.locale = locale;
    }

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !data.ok) {
      setErrorMessage(data.error || t("errors.generic"));
      setSubmitState("error");
      return;
    }

    if (onSuccess) {
      onSuccess();
    } else {
      router.push(successHref);
    }
  } catch {
    setErrorMessage(t("errors.generic"));
    setSubmitState("error");
  }
}
```

- [ ] **Step 4: Remove payment-related helper functions**

Remove these functions entirely:
- `handlePaymentSelect`
- `startPolling`
- `stopPolling`
- `handleCancelPaymentModal`
- `renderQrCode`

Also remove the `useEffect` cleanup that calls `stopPolling` on unmount.

Also remove the `useEffect` for lazy-loading QRCode from `"qrcode"`:
```typescript
// REMOVE this entire useEffect block:
useEffect(() => {
  // lazy init QRCode
  ...
}, []);
```

- [ ] **Step 5: Remove the PaymentMethodModal JSX section**

Find and remove the section that renders `showPaymentModal && (...)` — the full-screen overlay with payment method buttons (approximately lines 431-475 in the original file).

- [ ] **Step 6: Remove the WechatPayQrModal JSX section**

Find and remove the sections that render:
- `wechatPay && !wechatPayPaid && (...)` — the QR code modal (approximately lines 323-429)
- `wechatPayPaid && (...)` — the paid success overlay (approximately lines 306-318)

- [ ] **Step 7: Update the submit button**

Find the submit button. Currently it shows different text based on `paymentMode`. Replace:
```tsx
// BEFORE (approximate):
<button type="submit" disabled={submitState === "submitting"}>
  {submitState === "submitting"
    ? t("submitting")
    : paymentMode
      ? t("payNow")
      : t("submit")}
</button>

// AFTER:
<button type="submit" disabled={submitState === "submitting"}>
  {submitState === "submitting" ? t("submitting") : t("submit")}
</button>
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in ApplicationForm.tsx.

- [ ] **Step 9: Commit**

```bash
git add src/components/ApplicationForm.tsx
git commit -m "refactor: strip payment method selection and QR code from ApplicationForm"
```

---

### Task 6: Update CheckoutModal — remove payment labels, simplify success

**Files:**
- Modify: `src/components/CheckoutModal.tsx`

- [ ] **Step 1: Update the CheckoutLabels type**

Find the `CheckoutLabels` interface. Remove the `continueToPayment` field if it exists, and rename the form step labels to remove payment references.

Look for the label key `continueToPayment` and replace references with a form-appropriate label. In the checkout modal, the button that says "继续填写信息" (currently `continueToPayment`) should stay — the label text still makes sense. No type change needed.

The actual change: update the label references in the i18n files in Task 9, not here. `CheckoutModal` just renders whatever labels are passed in.

- [ ] **Step 2: Remove the `payNow` reference from any ApplicationForm usage inside CheckoutModal**

No change needed here — `payNow` is used inside `ApplicationForm`, which was already cleaned up in Task 5.

- [ ] **Step 3: Commit**

No code changes to CheckoutModal.tsx are needed. Skip commit.

---

### Task 7: Clean up payment-related pages

**Files:**
- Delete: `src/app/[locale]/payment/cancel/page.tsx`
- No changes needed: `src/app/[locale]/payment/success/page.tsx` (uses `successTitle`/`successMessage` keys — values updated in Task 9)
- No changes needed: `src/app/[locale]/payment/register/page.tsx` (`paymentMode={true}` now just means `applicationType: "trial"`)
- Already done in Task 1: `src/app/[locale]/payment/page.tsx` (import path updated)

- [ ] **Step 1: Delete the cancel page and its directory**

Run:
```
Get-ChildItem "src/app/[locale]/payment/cancel"
```

If the directory only contains `page.tsx`:
```
Remove-Item "src/app/[locale]/payment/cancel" -Recurse -Force
```

If there are other files, only remove `page.tsx`:
```
Remove-Item "src/app/[locale]/payment/cancel/page.tsx"
```

- [ ] **Step 2: Commit**

```bash
git add -u src/app/[locale]/payment/cancel
git commit -m "refactor: remove payment cancel page"
```

---

### Task 8: Delete all payment server modules and API routes

**Files:**
- Delete: 6 server modules + 10 API route files/directories

- [ ] **Step 1: Delete payment server modules**

Run:
```
Remove-Item "src/server/stripe.ts"
Remove-Item "src/server/paypal.ts"
Remove-Item "src/server/alipay.ts"
Remove-Item "src/server/wechatpay.ts"
Remove-Item "src/server/unionpay.ts"
Remove-Item "src/server/paymentState.ts"
```

- [ ] **Step 2: Delete payment API routes**

Run:
```
Remove-Item "src/app/api/payment" -Recurse -Force
```

- [ ] **Step 3: Type-check to ensure no broken imports**

Run: `npx tsc --noEmit`

If there are import errors from deleted files, fix them. Expected sources of errors:
- Any files that still import from `@/server/stripe`, `@/server/paypal`, etc.
- Any files that still import from `@/content/paymentOffer` (should have been fixed in Task 1)

Grep for remaining references (PowerShell):
```
Select-String -Path "src\**\*.ts" -Pattern "from.*paymentOffer" -SimpleMatch
Select-String -Path "src\**\*.ts" -Pattern "stripe|paypal|alipay|wechatpay|unionpay|paymentState" -SimpleMatch
```

If any matches remain, fix the stale imports.

- [ ] **Step 4: Commit**

```bash
git add -u src/server/stripe.ts src/server/paypal.ts src/server/alipay.ts src/server/wechatpay.ts src/server/unionpay.ts src/server/paymentState.ts
git add -u src/app/api/payment
git commit -m "refactor: remove all third-party payment integration code"
```

---

### Task 9: Update i18n keys — add email keys, remove payment keys

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Update `messages/zh.json`**

**Remove** these sections from `ApplicationForm`:
- `payNow` key
- `paymentMethods` object (entire: `legend`, `stripe`, `stripeText`, `paypal`, `paypalText`, `alipay`, `alipayText`, `wechatpay`, `wechatpayText`, `unionpay`, `unionpayText`)
- `wechatpayQr` object (entire: `title`, `scanTip`, `amount`, `orderNo`, `checking`, `paid`, `pending`, `refresh`, `cancel`, `paySuccessRedirect`)

**Remove** from `PaymentPage`:
- `cancelTitle`, `cancelMessage`, `retryPayment` keys
- `qrEyebrow`, `qrTitle`, `qrDescription`, `qrPlaceholder`, `remarkTitle`, `remarkText` keys
- In `steps.items[1]`, change:
  ```json
  { "title": "在线支付", "text": "支持银行卡（Stripe）和 PayPal 在线支付，安全便捷地完成体验费用缴纳。" }
  ```
  to:
  ```json
  { "title": "等待审核", "text": "提交申请后，我们会在 1–2 个工作日内审核，并通过邮件通知审核结果。" }
  ```
- In `steps.items[2]`, change:
  ```json
  { "title": "确认参观", "text": "支付成功后即确认体验名额，我们将根据您选择的日期安排展厅参观。" }
  ```
  to:
  ```json
  { "title": "确认参观", "text": "审核通过后，按邮件指引完成转账即可确认参观名额，我们会根据您选择的日期安排展厅参观。" }
  ```

**Update** `PaymentPage` existing keys with new values:
- `successTitle`: `"支付成功，体验已确认"` → `"申请已提交"`
- `successMessage`: `"您的付款已完成，体验名额已确认。我们将根据您填写的日期安排参观。"` → `"您的参观申请已成功提交。我们将在 1–2 个工作日内完成审核，审核结果将以邮件形式通知您，请留意邮箱。"`

**Update** `PaymentPage.checkoutModal.formDescription`:
- `"请填写以下信息，提交后将进入付款环节。"` → `"请填写以下信息，提交后我们将通过邮件与您联系。"`

**Update** `PaymentPage.steps.description`:
- `"从提交申请到确认参观，整个流程简单快捷，线上即可完成全部操作。"` → `"从提交申请到确认参观，整个流程简单快捷。"`

- [ ] **Step 2: Update `messages/en.json`** with equivalent changes

**Remove** these sections from `ApplicationForm`:
- `payNow` key
- `paymentMethods` object (entire)
- `wechatpayQr` object (entire)

**Remove** from `PaymentPage`:
- `cancelTitle`, `cancelMessage`, `retryPayment` keys
- `qrEyebrow`, `qrTitle`, `qrDescription`, `qrPlaceholder`, `remarkTitle`, `remarkText` keys
- In `steps.items[1]`, change:
  ```json
  { "title": "Online Payment", "text": "Pay securely via bank card (Stripe) or PayPal to complete the experience fee payment." }
  ```
  to:
  ```json
  { "title": "Under Review", "text": "After submission, we will review your application within 1–2 business days and notify you of the result by email." }
  ```
- In `steps.items[2]`, change:
  ```json
  { "title": "Visit Confirmed", "text": "Once payment is confirmed, your experience slot is reserved. We will arrange your showroom visit based on your selected date." }
  ```
  to:
  ```json
  { "title": "Visit Confirmed", "text": "Once approved, follow the payment instructions in the email to confirm your visit slot. We will arrange your showroom visit based on your selected date." }
  ```

**Update** `PaymentPage` existing keys with new values:
- `successTitle`: `"Payment Confirmed"` → `"Application Submitted"`
- `successMessage`: `"Your payment has been completed and your experience slot is confirmed. We will arrange your visit based on your selected date."` → `"Your visit application has been submitted. We will review it within 1–2 business days and notify you of the result by email."`

**Update** `PaymentPage.checkoutModal.formDescription`:
- `"Please fill in the information below to proceed to payment."` → `"Please fill in the information below. We will contact you by email after submission."`

**Update** `PaymentPage.formDescription`:
- `"Please fill in your information below. You will proceed to payment after submission."` → `"Please fill in your information below. We will contact you by email after submission."`

- [ ] **Step 3: Commit**

```bash
git add messages/zh.json messages/en.json
git commit -m "feat: update i18n keys for email review flow"
```
```

---

### Task 10: Update .env.example and package.json

**Files:**
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Update `.env.example`**

Replace the payment section with:

```
# Resend (email delivery)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@robotvalley.cn
WEBHOOK_SECRET=change_me_to_a_long_random_secret

# Bank account for payment instructions
BANK_NAME=中国银行
BANK_BRANCH=深圳分行
BANK_ACCOUNT_NUMBER=0000000000000000000
BANK_ACCOUNT_NAME=公司全称
```

Remove all payment-related entries:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `PAYPAL_ENVIRONMENT`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYMENT_STATE_SECRET`
- `ALIPAY_SANDBOX`
- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`
- `UNIONPAY_SANDBOX`
- `UNIONPAY_MER_ID`
- `UNIONPAY_SIGN_PRIVATE_KEY`
- `UNIONPAY_SIGN_CERT`
- `UNIONPAY_ROOT_CERT`

- [ ] **Step 2: Remove payment dependencies from package.json**

Run:
```
npm uninstall stripe alipay-sdk qrcode
npm uninstall @types/qrcode
```

Expected: package.json updated, `node_modules` cleaned.

- [ ] **Step 3: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "chore: update env vars and remove payment SDK dependencies"
```

---

### Task 11: Final type-check, lint, and cleanup

**Files:**
- Potentially modify any file with remaining payment references

- [ ] **Step 1: Run full type check**

Run: `npm run test` (which runs `tsc --noEmit`)
Expected: No type errors.

Fix any remaining type errors from stale imports.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors (or only pre-existing ones unrelated to this change).

- [ ] **Step 3: Verify no remaining payment references in source**

Run (PowerShell):
```
Select-String -Path "src\**\*.ts", "src\**\*.tsx" -Pattern "stripe|paypal|alipay|wechatpay|unionpay|paymentOffer|paymentState" -CaseSensitive:$false
```

Expected: No output (all payment references gone).

- [ ] **Step 4: Commit any cleanup fixes**

```bash
git add -A
git commit -m "chore: final cleanup of payment references"
```
