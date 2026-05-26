# Email Review Flow — Replace Third-Party Payment with Admin Review + Email Notification

**Date**: 2026-05-26  
**Status**: Design approved, pending implementation plan

## 1. Motivation

Remove all five third-party payment integrations (Stripe, PayPal, Alipay, WeChat, UnionPay). Replace the instant-payment flow with a two-stage email notification system:

1. **Application received** — auto-email on submission, telling the user to expect review within 1–2 business days
2. **Approval + payment instructions** — triggered by an Airtable automation webhook when an admin sets `Status = Approved`, containing bank transfer details

## 2. User Flow

### Before (current)
```
Fill form → Select payment method → Redirect to Stripe/PayPal/etc. → Pay → Return → Airtable record created → Success page
```

### After (new)
```
Fill form → Submit → Airtable record (Status=New) + auto-email "received" → Success page
                                                    ↓
                                Admin reviews in Airtable → Status=Approved
                                                    ↓
                                Airtable automation → POST /api/email/approval-notify
                                                    ↓
                                Email "approved" with bank transfer instructions sent to user
```

## 3. Email Provider

**Resend** (`resend` npm package). React-based email templates rendered to HTML server-side. The same templates can be previewed via Resend's dashboard.

## 4. Architecture

### 4.1 New files

| File | Purpose |
|---|---|
| `src/server/resend.ts` | Resend client singleton + `sendApplicationReceived()` + `sendApprovalNotification()` |
| `src/emails/ApplicationReceived.tsx` | React email template — "application received, under review" |
| `src/emails/ApprovalNotification.tsx` | React email template — "approved, here's how to pay" |
| `src/app/api/email/approval-notify/route.ts` | Webhook endpoint called by Airtable automation when Status changes to Approved |
| `src/config/email.ts` | Bank account info, sender email, and other email constants |

### 4.2 Files to delete (all payment-related code)

- `src/server/stripe.ts`
- `src/server/paypal.ts`
- `src/server/alipay.ts`
- `src/server/wechatpay.ts`
- `src/server/unionpay.ts`
- `src/server/paymentState.ts`
- `src/app/api/payment/create/route.ts`
- `src/app/api/payment/webhook/route.ts`
- `src/app/api/payment/paypal/capture/route.ts`
- `src/app/api/payment/alipay/return/route.ts`
- `src/app/api/payment/alipay/notify/route.ts`
- `src/app/api/payment/wechatpay/notify/route.ts`
- `src/app/api/payment/wechatpay/query/route.ts`
- `src/app/api/payment/unionpay/submit/route.ts`
- `src/app/api/payment/unionpay/return/route.ts`
- `src/app/api/payment/unionpay/notify/route.ts`
- `src/content/paymentOffer.ts`

### 4.3 Files to modify

| File | Change |
|---|---|
| `src/components/ApplicationForm.tsx` | Remove PaymentMethodModal overlay, WeChat QR flow, and all payment-method state. When `paymentMode` is true, POST to `/api/applications` (same as free path). |
| `src/components/CheckoutModal.tsx` | Remove payment-related labels/props; the modal now submits the form directly. |
| `src/app/[locale]/payment/page.tsx` | Remove price/benefit sections tied to `TRIAL_PAYMENT_PRICE_CNY`. Keep the page as a product landing page. |
| `src/app/[locale]/payment/success/page.tsx` | Update copy to reflect "we'll email you" instead of "payment confirmed". |
| `src/app/[locale]/payment/cancel/page.tsx` | Delete this page (no payment flow to cancel). |
| `src/app/[locale]/payment/register/page.tsx` | Simplify — remove payment-related props from CheckoutModal. |
| `src/app/api/applications/route.ts` | After creating the Airtable record, send the "application received" email if the request includes `applicationType: "trial"`. |
| `src/server/airtableApplications.ts` | Add `APPROVED_STATUS = "Approved"` constant. Expose a function to look up an application by record ID (for the webhook). |
| `messages/zh.json` | Add email-related keys. Remove unused payment-method keys. |
| `messages/en.json` | Same. |
| `package.json` | Remove: `stripe`, `@paypal/checkout-server-sdk`, `alipay-sdk`, `qrcode`. Add: `resend`. |
| `.env.example` | Remove payment env vars. Add: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `WEBHOOK_SECRET`. |

### 4.4 Data flow

```
ApplicationForm (paymentMode=true)
  │
  ▼
POST /api/applications  { ..., applicationType: "trial" }
  │
  ├─ validateApplicationPayload()
  ├─ validatePreferredVisitDateAvailability()
  ├─ createAirtableApplication()  → recordId
  ├─ sendApplicationReceivedEmail({ to, name, preferredVisitDate, visitorCount })
  │
  ▼
{ ok: true, recordId }


Airtable Automation (trigger: Status = "Approved")
  │
  ▼
POST /api/email/approval-notify  { recordId, fields: { Name, email, visitorCount, ... } }
  │
  ├─ verify WEBHOOK_SECRET header
  ├─ compute amount = visitorCount × 100
  ├─ sendApprovalNotificationEmail({ to, name, amount, bankInfo })
  │
  ▼
{ ok: true }
```

## 5. Email Templates

### ApplicationReceived
- **To**: user's email from form
- **Content** (zh): 您好 {name}，我们已收到您的参观申请。我们将在 1–2 个工作日内完成审核，并以邮件形式通知您审核结果，请留意邮箱。
- **Content** (en): Hi {name}, we've received your visit application. We'll review it within 1–2 business days and notify you of the result by email.

### ApprovalNotification
- **To**: user's email from Airtable record
- **Content** (zh): 您好 {name}，您的参观申请已通过审核。请按以下银行信息完成转账：银行：{bankName}，账号：{bankAccount}，金额：¥{amount}（{visitorCount}人 × ¥100/人）。
- **Content** (en): Hi {name}, your visit application has been approved. Please complete payment via bank transfer: Bank: {bankName}, Account: {bankAccount}, Amount: ¥{amount} ({visitorCount} persons × ¥100/person).

Bank account details live in `src/config/email.ts` and can be overridden via env vars.

## 6. Airtable Webhook Setup (manual, one-time)

In Airtable:
1. Create an automation triggered by "When record matches conditions"
2. Condition: `Status = "Approved"`
3. Action: "Run a script" to fetch record fields, then POST to `{SITE_URL}/api/email/approval-notify` with `{ recordId, fields: { Name, email, visitorCount, preferredVisitDate } }` and header `x-webhook-secret: {WEBHOOK_SECRET}`

## 7. Environment Variables

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key (`re_...`) |
| `RESEND_FROM_EMAIL` | Sender email address (must be verified in Resend) |
| `WEBHOOK_SECRET` | Shared secret for Airtable webhook auth |
| `BANK_ACCOUNT_NAME` | Bank account holder name |
| `BANK_ACCOUNT_NUMBER` | Bank account number |
| `BANK_NAME` | Bank name (e.g., 中国银行) |
| `BANK_BRANCH` | Bank branch name |

**Removed** (from `.env.example` and usage):
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_ENVIRONMENT`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `PAYMENT_STATE_SECRET`

## 8. Migration Steps

1. Add Resend dependency and bank account config
2. Create email templates and `src/server/resend.ts`
3. Create webhook route `/api/email/approval-notify`
4. Modify `src/app/api/applications/route.ts` to send email on `applicationType: "trial"`
5. Update ApplicationForm — strip payment method selection, simplify submit
6. Update CheckoutModal — remove payment labels
7. Simplify payment pages
8. Delete all payment server modules and API routes
9. Remove payment dependencies from `package.json`
10. Update `.env.example`
11. Update i18n keys
12. Set up Airtable automation manually
