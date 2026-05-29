# Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded testimonials with a dynamic user-submitted feedback system: public submission page, admin moderation dashboard, and approved feedback displayed on the landing page carousel.

**Architecture:** Follows the existing Airtable pattern (`src/server/airtableApplications.ts` → API routes → client components). New `Feedback` table in Airtable. Server-only module handles CRUD, admin auth uses httpOnly session cookie. Public and admin API routes are separate. Feedback page at `/feedback`, admin SPA at `/admin`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Airtable REST API, Tailwind CSS, next-intl (public pages only), server-only cookies for admin session.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/server/airtableFeedback.ts` | Airtable CRUD: create, list approved, list all, update feedback records |
| `src/server/adminAuth.ts` | Session cookie creation + validation for admin routes |
| `src/app/api/feedback/route.ts` | Public POST (submit) + GET (list approved) |
| `src/app/api/admin/login/route.ts` | POST: validate credentials, set session cookie |
| `src/app/api/admin/logout/route.ts` | POST: clear session cookie |
| `src/app/api/admin/feedback/route.ts` | GET: list all feedback (auth required) |
| `src/app/api/admin/feedback/[id]/route.ts` | PATCH: update feedback status/message/featured (auth required) |
| `src/components/feedback/FeedbackForm.tsx` | Client form component: name, role, message fields + submit |
| `src/app/[locale]/feedback/page.tsx` | Server page wrapping FeedbackForm with i18n |
| `src/components/admin/AdminLogin.tsx` | Login form (username + password) |
| `src/components/admin/AdminDashboard.tsx` | Tabbed feedback list with action buttons |
| `src/app/admin/page.tsx` | Admin page: shows login or dashboard based on auth state |
| `src/components/landing/LandingFeedbackCTA.tsx` | Inline row CTA linking to /feedback |
| `src/components/landing/LandingTestimonials.tsx` | Modify: fetch dynamic data from API |
| `src/app/[locale]/page.tsx` | Modify: add CTA component |
| `messages/en.json` | Modify: add FeedbackPage + feedbackCTA keys, remove t1-t8 |
| `messages/zh.json` | Modify: same |
| `.env.local` | Modify: add new env vars |

---

### Task 1: Airtable Feedback Server Module

**Files:**
- Create: `src/server/airtableFeedback.ts`

- [ ] **Step 1: Create the server module**

Write `src/server/airtableFeedback.ts`:

```typescript
import "server-only";

export const FEEDBACK_FIELD_KEYS = ["name", "role", "message"] as const;
export type FeedbackFieldKey = (typeof FEEDBACK_FIELD_KEYS)[number];
export type FeedbackPayload = Partial<Record<FeedbackFieldKey, string>>;

export const REQUIRED_FEEDBACK_FIELD_KEYS: readonly FeedbackFieldKey[] = FEEDBACK_FIELD_KEYS;

const AIRTABLE_FIELD_MAP = {
  name: "Name",
  role: "Role",
  message: "Message",
} satisfies Record<FeedbackFieldKey, string>;

const AIRTABLE_SYSTEM_FIELD_MAP = {
  status: "Status",
  featured: "Featured",
  submittedAt: "SubmittedAt",
} as const;

export type FeedbackStatus = "Pending" | "Approved" | "Rejected";

export type FeedbackRecord = {
  id: string;
  name: string;
  role: string;
  message: string;
  status: FeedbackStatus;
  featured: boolean;
  submittedAt: string;
};

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records?: AirtableRecord[];
  offset?: string;
  error?: { message?: string; type?: string };
};

type AirtableCreateResponse = {
  records?: Array<{ id?: string }>;
  error?: { message?: string; type?: string };
};

function getAirtableConfig() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_FEEDBACK_TABLE_NAME;

  if (!token || !baseId || !tableName) {
    return {
      ok: false as const,
      status: 500,
      error: "Missing Airtable config. Check AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_FEEDBACK_TABLE_NAME.",
    };
  }

  return { ok: true as const, token, baseId, tableName };
}

function buildTableUrl(baseId: string, tableName: string) {
  return `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
}

function mapAirtableRecordToFeedback(record: AirtableRecord): FeedbackRecord {
  const f = record.fields;
  return {
    id: record.id,
    name: String(f["Name"] ?? ""),
    role: String(f["Role"] ?? ""),
    message: String(f["Message"] ?? ""),
    status: (f["Status"] as FeedbackStatus) ?? "Pending",
    featured: Boolean(f["Featured"]),
    submittedAt: String(f["SubmittedAt"] ?? ""),
  };
}

export function validateFeedbackPayload(value: unknown) {
  if (!isRecord(value)) {
    return { ok: false as const, error: "Request body must be a JSON object." };
  }

  const unsupported = Object.keys(value).filter((k) => !FEEDBACK_FIELD_KEYS.includes(k as FeedbackFieldKey));
  if (unsupported.length > 0) {
    return { ok: false as const, error: `Unsupported field(s): ${unsupported.join(", ")}.` };
  }

  const payload: FeedbackPayload = {};
  for (const key of FEEDBACK_FIELD_KEYS) {
    const raw = value[key];
    if (typeof raw === "string") {
      payload[key] = raw.trim();
    }
  }

  const missing = REQUIRED_FEEDBACK_FIELD_KEYS.filter((k) => !payload[k]);
  if (missing.length > 0) {
    return { ok: false as const, error: `Missing required field(s): ${missing.join(", ")}.` };
  }

  if (payload.message && payload.message.length > 1000) {
    return { ok: false as const, error: "Message must be 1000 characters or fewer." };
  }

  return { ok: true as const, payload };
}

export async function createFeedback(payload: FeedbackPayload) {
  const config = getAirtableConfig();
  if (!config.ok) return config;

  const fields: Record<string, string | boolean> = {};
  for (const key of FEEDBACK_FIELD_KEYS) {
    const name = AIRTABLE_FIELD_MAP[key];
    if (payload[key]) fields[name] = payload[key]!;
  }
  fields[AIRTABLE_SYSTEM_FIELD_MAP.status] = "Pending";
  fields[AIRTABLE_SYSTEM_FIELD_MAP.featured] = false;
  fields[AIRTABLE_SYSTEM_FIELD_MAP.submittedAt] = new Date().toISOString();

  const url = buildTableUrl(config.baseId, config.tableName);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });

  const body = await safeReadJson<AirtableCreateResponse>(response);
  if (!response.ok) {
    return {
      ok: false as const,
      status: normalizeStatus(response.status),
      error: getErrorMessage(response.status, body),
    };
  }

  return { ok: true as const, recordId: body?.records?.[0]?.id };
}

export async function getApprovedFeedback(): Promise<{ ok: true; feedback: FeedbackRecord[] } | { ok: false; status: number; error: string }> {
  const config = getAirtableConfig();
  if (!config.ok) return config;

  const all = await fetchAllFeedback(config.token, config.baseId, config.tableName, '{Status} = "Approved"');
  if (!all.ok) return all;

  const sorted = all.records
    .map(mapAirtableRecordToFeedback)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.submittedAt.localeCompare(a.submittedAt);
    });

  return { ok: true, feedback: sorted };
}

export async function getAllFeedback(statusFilter?: FeedbackStatus): Promise<{ ok: true; feedback: FeedbackRecord[] } | { ok: false; status: number; error: string }> {
  const config = getAirtableConfig();
  if (!config.ok) return config;

  const formula = statusFilter
    ? `{Status} = "${statusFilter}"`
    : "";

  const all = await fetchAllFeedback(config.token, config.baseId, config.tableName, formula);
  if (!all.ok) return all;

  const records = all.records
    .map(mapAirtableRecordToFeedback)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return { ok: true, feedback: records };
}

export async function updateFeedback(id: string, updates: { status?: FeedbackStatus; message?: string; featured?: boolean }) {
  const config = getAirtableConfig();
  if (!config.ok) return config;

  const fields: Record<string, unknown> = {};
  if (updates.status !== undefined) fields[AIRTABLE_SYSTEM_FIELD_MAP.status] = updates.status;
  if (updates.message !== undefined) fields[AIRTABLE_FIELD_MAP.message] = updates.message;
  if (updates.featured !== undefined) fields[AIRTABLE_SYSTEM_FIELD_MAP.featured] = updates.featured;

  if (Object.keys(fields).length === 0) {
    return { ok: false as const, status: 400, error: "No fields to update." };
  }

  const url = `${buildTableUrl(config.baseId, config.tableName)}/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
  });

  const body = await safeReadJson<AirtableCreateResponse>(response);
  if (!response.ok) {
    return {
      ok: false as const,
      status: normalizeStatus(response.status),
      error: getErrorMessage(response.status, body),
    };
  }

  return { ok: true as const };
}

async function fetchAllFeedback(token: string, baseId: string, tableName: string, formula: string) {
  const baseUrl = buildTableUrl(baseId, tableName);
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(baseUrl);
    url.searchParams.set("pageSize", "100");
    if (formula) url.searchParams.set("filterByFormula", formula);
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await safeReadJson<AirtableListResponse>(response);
    if (!response.ok) {
      return {
        ok: false as const,
        status: normalizeStatus(response.status),
        error: getErrorMessage(response.status, body),
        records: [] as AirtableRecord[],
      };
    }

    if (body?.records) allRecords.push(...body.records);
    offset = body?.offset;
  } while (offset);

  return { ok: true as const, records: allRecords };
}

async function safeReadJson<T>(response: Response): Promise<T | undefined> {
  const text = await response.text();
  if (!text) return undefined;
  try { return JSON.parse(text) as T; } catch { return undefined; }
}

function getErrorMessage(status: number, body: unknown): string {
  const msg = typeof body === "object" && body !== null && "error" in body
    ? (body as { error?: { message?: string; type?: string } }).error?.message || (body as { error?: { message?: string; type?: string } }).error?.type
    : "Airtable request failed.";
  if (status === 401 || status === 403) return `Airtable rejected request. Check AIRTABLE_TOKEN. (${msg})`;
  if (status === 404) return `Airtable table not found. Check AIRTABLE_FEEDBACK_TABLE_NAME. (${msg})`;
  return `Airtable request failed. (${msg})`;
}

function normalizeStatus(status: number) {
  return [401, 403, 404, 422].includes(status) ? status : 502;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
```

- [ ] **Step 2: Type-check**

Run: `npm run test`
Expected: PASS (no type errors in new file)

- [ ] **Step 3: Commit**

```bash
git add src/server/airtableFeedback.ts
git commit -m "feat: add Airtable feedback server module"
```

---

### Task 2: Admin Auth Module

**Files:**
- Create: `src/server/adminAuth.ts`

- [ ] **Step 1: Create admin auth module**

Write `src/server/adminAuth.ts`:

```typescript
import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_VALUE = "authenticated";

export function validateCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return { ok: false as const, error: "Admin credentials not configured." };
  }

  if (username !== expectedUser || password !== expectedPass) {
    return { ok: false as const, error: "Invalid username or password." };
  }

  return { ok: true as const };
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function validateAdminSession(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (!session || session.value !== SESSION_VALUE) {
    return { ok: false as const, error: "Unauthorized." };
  }

  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/server/adminAuth.ts
git commit -m "feat: add admin auth module with session cookie"
```

---

### Task 3: Public API Routes (POST + GET /api/feedback)

**Files:**
- Create: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Create public feedback API route**

Write `src/app/api/feedback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createFeedback, getApprovedFeedback, validateFeedbackPayload } from "@/server/airtableFeedback";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const validation = validateFeedbackPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const result = await createFeedback(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, recordId: result.recordId });
  } catch {
    return NextResponse.json({ error: "Submission failed. Please try again later." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getApprovedFeedback();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ feedback: result.feedback });
  } catch {
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/feedback/route.ts
git commit -m "feat: add public feedback API routes (POST + GET)"
```

---

### Task 4: Admin API Routes

**Files:**
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Create: `src/app/api/admin/feedback/route.ts`
- Create: `src/app/api/admin/feedback/[id]/route.ts`

- [ ] **Step 1: Create admin login route**

Write `src/app/api/admin/login/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { setAdminSession, validateCredentials } from "@/server/adminAuth";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const result = validateCredentials(username, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create admin logout route**

Write `src/app/api/admin/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { clearAdminSession } from "@/server/adminAuth";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create admin feedback list route**

Write `src/app/api/admin/feedback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { validateAdminSession } from "@/server/adminAuth";
import { getAllFeedback, type FeedbackStatus } from "@/server/airtableFeedback";

export async function GET(request: Request) {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const validStatuses: FeedbackStatus[] = ["Pending", "Approved", "Rejected"];
  const statusFilter = validStatuses.includes(statusParam as FeedbackStatus)
    ? (statusParam as FeedbackStatus)
    : undefined;

  try {
    const result = await getAllFeedback(statusFilter);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ feedback: result.feedback });
  } catch {
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create admin feedback update route**

Write `src/app/api/admin/feedback/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { validateAdminSession } from "@/server/adminAuth";
import { updateFeedback, type FeedbackStatus } from "@/server/airtableFeedback";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const updates: { status?: FeedbackStatus; message?: string; featured?: boolean } = {};

  if (typeof body.status === "string" && ["Pending", "Approved", "Rejected"].includes(body.status)) {
    updates.status = body.status as FeedbackStatus;
  }
  if (typeof body.message === "string" && body.message.trim()) {
    updates.message = body.message.trim();
  }
  if (typeof body.featured === "boolean") {
    updates.featured = body.featured;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const result = await updateFeedback(id, updates);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed. Please try again later." }, { status: 500 });
  }
}
```

- [ ] **Step 5: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/login/route.ts src/app/api/admin/logout/route.ts src/app/api/admin/feedback/route.ts src/app/api/admin/feedback/[id]/route.ts
git commit -m "feat: add admin API routes (login, logout, feedback CRUD)"
```

---

### Task 5: Feedback Form Component & Page

**Files:**
- Create: `src/components/feedback/FeedbackForm.tsx`
- Create: `src/app/[locale]/feedback/page.tsx`

- [ ] **Step 1: Create FeedbackForm client component**

Write `src/components/feedback/FeedbackForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type FeedbackFieldKey = "name" | "role" | "message";

export function FeedbackForm({
  translations,
}: {
  translations: Record<string, string>;
}) {
  const [form, setForm] = useState({ name: "", role: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<FeedbackFieldKey, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function handleChange(field: FeedbackFieldKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<FeedbackFieldKey, string>> = {};
    if (!form.name.trim()) newErrors.name = translations["form.validation.nameRequired"] ?? "Name is required.";
    if (!form.role.trim()) newErrors.role = translations["form.validation.roleRequired"] ?? "Role is required.";
    if (!form.message.trim()) newErrors.message = translations["form.validation.messageRequired"] ?? "Feedback is required.";
    if (form.message.length > 1000) newErrors.message = translations["form.validation.messageTooLong"] ?? "Message must be 1000 characters or fewer.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), role: form.role.trim(), message: form.message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ message: data?.error ?? (translations["form.error"] ?? "Submission failed.") });
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({ name: "", role: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  function renderInput(field: FeedbackFieldKey, label: string, placeholder: string, type: "text" | "textarea" = "text") {
    const shared = "w-full rounded-lg border px-4 py-3 text-sm text-accent placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mid-light";
    const errorRing = errors[field] ? " border-red-400 focus:ring-red-300" : " border-line";
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-accent">{label} *</label>
        {type === "textarea" ? (
          <textarea
            className={shared + errorRing + " min-h-[120px] resize-y"}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            maxLength={1000}
          />
        ) : (
          <input
            type="text"
            className={shared + errorRing}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        )}
        {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100">
          <svg className="size-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-emerald-800">{translations["form.success"] ?? "Thank you!"}</p>
        <p className="mt-1 text-sm text-emerald-600">{translations["moderationNotice"] ?? "Your review will be published after moderation."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-5">
        {renderInput("name", translations["form.name.label"] ?? "Name", translations["form.name.placeholder"] ?? "Your name")}
        {renderInput("role", translations["form.role.label"] ?? "Role & Company", translations["form.role.placeholder"] ?? "e.g. CTO, Robotics Innovation Lab")}
        {renderInput("message", translations["form.message.label"] ?? "Your Feedback", translations["form.message.placeholder"] ?? "Share your thoughts about the visit...", "textarea")}
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (translations["form.submitting"] ?? "Submitting...") : (translations["form.submit"] ?? "Submit Review")}
      </button>
      {status === "error" && !errors.message && (
        <p className="mt-3 text-center text-sm text-red-500">{translations["form.error"] ?? "Something went wrong. Please try again."}</p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Create the feedback page**

Write `src/app/[locale]/feedback/page.tsx`:

```typescript
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function FeedbackPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("FeedbackPage");

  const translations = {
    "form.name.label": t("form.name.label"),
    "form.name.placeholder": t("form.name.placeholder"),
    "form.role.label": t("form.role.label"),
    "form.role.placeholder": t("form.role.placeholder"),
    "form.message.label": t("form.message.label"),
    "form.message.placeholder": t("form.message.placeholder"),
    "form.submit": t("form.submit"),
    "form.submitting": t("form.submitting"),
    "form.success": t("form.success"),
    "form.error": t("form.error"),
    "form.validation.nameRequired": t("form.validation.nameRequired"),
    "form.validation.roleRequired": t("form.validation.roleRequired"),
    "form.validation.messageRequired": t("form.validation.messageRequired"),
    "form.validation.messageTooLong": t("form.validation.messageTooLong"),
    moderationNotice: t("moderationNotice"),
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent transition-colors">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("backToHome")}
        </Link>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="lg:w-5/12">
            <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-md text-pretty text-base leading-8 text-secondary">
              {t("description")}
            </p>
            <p className="mt-6 text-sm text-muted">{t("moderationNotice")}</p>
          </div>
          <div className="lg:w-7/12">
            <FeedbackForm translations={translations} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/FeedbackForm.tsx src/app/\[locale\]/feedback/page.tsx
git commit -m "feat: add feedback form component and /feedback page"
```

---

### Task 6: Admin Page (Login + Dashboard)

**Files:**
- Create: `src/components/admin/AdminLogin.tsx`
- Create: `src/components/admin/AdminDashboard.tsx`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create AdminLogin component**

Write `src/components/admin/AdminLogin.tsx`:

```typescript
"use client";

import { useState } from "react";

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Login failed.");
        return;
      }
      onLogin();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-xl text-white">&#x1F512;</div>
          <h1 className="text-xl font-bold text-accent">Staff Access</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage feedback</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-line bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-accent">Username</label>
              <input
                type="text"
                className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-accent placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mid-light"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-accent placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mid-light"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AdminDashboard component**

Write `src/components/admin/AdminDashboard.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

type FeedbackItem = {
  id: string;
  name: string;
  role: string;
  message: string;
  status: "Pending" | "Approved" | "Rejected";
  featured: boolean;
  submittedAt: string;
};

type Tab = "All" | "Pending" | "Approved" | "Rejected";

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchFeedback = useCallback(async (tab: Tab) => {
    setLoading(true);
    try {
      const statusParam = tab === "All" ? "" : `?status=${tab}`;
      const res = await fetch(`/api/admin/feedback${statusParam}`);
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchFeedback(activeTab);
  }, [activeTab, fetchFeedback]);

  async function handleAction(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchFeedback(activeTab);
      }
      if (res.status === 401) onLogout();
    } catch {
      // silently fail
    }
  }

  function startEdit(item: FeedbackItem) {
    setEditingId(item.id);
    setEditText(item.message);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit(id: string) {
    if (editText.trim()) {
      handleAction(id, { message: editText.trim() });
    }
    cancelEdit();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  const tabs: Tab[] = ["All", "Pending", "Approved", "Rejected"];
  const counts = {
    All: feedback.length,
    Pending: feedback.filter((f) => f.status === "Pending").length,
    Approved: feedback.filter((f) => f.status === "Approved").length,
    Rejected: feedback.filter((f) => f.status === "Rejected").length,
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-amber-100 text-amber-800",
      Approved: "bg-emerald-100 text-emerald-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent">Feedback Moderation</h1>
          <button onClick={handleLogout} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-muted transition hover:text-accent">
            Sign Out
          </button>
        </div>

        <div className="mt-6 flex gap-2 border-b border-line pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-accent text-white"
                  : "text-muted hover:text-accent"
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted">Loading...</p>
          ) : feedback.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No feedback found.</p>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className={`rounded-xl border bg-white p-5 shadow-sm ${item.featured ? "border-violet-300 ring-1 ring-violet-200" : "border-line"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-accent text-sm">{item.name}</span>
                      <span className="text-xs text-muted">{item.role}</span>
                      {statusBadge(item.status)}
                      {item.featured && (
                        <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                          &#x2605; Featured
                        </span>
                      )}
                    </div>
                    {editingId === item.id ? (
                      <div>
                        <textarea
                          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm text-accent focus:outline-none focus:ring-2 focus:ring-mid-light"
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => saveEdit(item.id)} className="rounded bg-accent px-3 py-1 text-xs font-semibold text-white">Save</button>
                          <button onClick={cancelEdit} className="rounded border border-line px-3 py-1 text-xs font-medium text-muted">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm leading-6 text-secondary">{item.message}</p>
                    )}
                    <p className="mt-2 text-xs text-muted">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {item.status === "Pending" && (
                      <>
                        <button onClick={() => handleAction(item.id, { status: "Approved" })} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          Approve
                        </button>
                        <button onClick={() => startEdit(item)} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          Edit
                        </button>
                        <button onClick={() => handleAction(item.id, { status: "Rejected" })} className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Reject
                        </button>
                      </>
                    )}
                    {item.status === "Approved" && (
                      <>
                        <button onClick={() => handleAction(item.id, { featured: !item.featured })} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          {item.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button onClick={() => startEdit(item)} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          Edit
                        </button>
                        <button onClick={() => handleAction(item.id, { status: "Rejected" })} className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </>
                    )}
                    {item.status === "Rejected" && (
                      <>
                        <button onClick={() => handleAction(item.id, { status: "Pending" })} className="rounded border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-accent">
                          Restore
                        </button>
                        <button onClick={() => handleAction(item.id, { status: "Rejected" })} className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create admin page (auth gate)**

Write `src/app/admin/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then((res) => {
        if (res.ok) setAuthenticated(true);
        else setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={() => setAuthenticated(false)} />;
}
```

- [ ] **Step 4: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminLogin.tsx src/components/admin/AdminDashboard.tsx src/app/admin/page.tsx
git commit -m "feat: add admin page with login and feedback moderation dashboard"
```

---

### Task 7: Landing Feedback CTA & Update LandingTestimonials

**Files:**
- Create: `src/components/landing/LandingFeedbackCTA.tsx`
- Modify: `src/components/landing/LandingTestimonials.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Create LandingFeedbackCTA component**

Write `src/components/landing/LandingFeedbackCTA.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingFeedbackCTA() {
  const t = useTranslations("Landing");

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-8 sm:flex-row sm:justify-between sm:px-10">
          <div>
            <p className="text-lg font-bold text-accent">{t("feedbackCTA.heading")}</p>
            <p className="mt-1 text-sm text-secondary">{t("feedbackCTA.subtext")}</p>
          </div>
          <Link
            href="/feedback"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            {t("feedbackCTA.button")}
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update LandingTestimonials to fetch dynamic data**

Replace the hardcoded testimonials array in `src/components/landing/LandingTestimonials.tsx`. Read the current file and make these changes:

**Remove** lines 80-88 (the hardcoded `testimonials` array assigned from `t("testimonials.t1")` etc.)

**Add** fetch logic — replace the body of `LandingTestimonials` with:

```typescript
export function LandingTestimonials() {
  const t = useTranslations("Landing");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        if (data.feedback) {
          setTestimonials(
            data.feedback.map((f: { name: string; role: string; message: string }) => ({
              name: f.name,
              role: f.role,
              text: f.message,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || testimonials.length === 0) {
    return null;
  }

  // ... rest of the JSX stays the same (section, header, Track components)
```

Also add `useState` and `useEffect` to the react import on line 1. The react import is not currently there since the component doesn't use hooks yet — add it:

```typescript
import { useState, useEffect } from "react";
```

**Note:** The existing JSX section with ScrollReveal, eyebrow, title, description, and the two Track rows stays exactly as-is. Only the data source changes.

- [ ] **Step 3: Add CTA to landing page**

In `src/app/[locale]/page.tsx`, the import and component usage are already present from the existing uncommitted changes. Verify the import and usage:

Import (already added):
```typescript
import { LandingFeedbackCTA } from "@/components/landing/LandingFeedbackCTA";
```

Usage — add right below `<LandingTestimonials />`:
```typescript
<LandingTestimonials />
<LandingFeedbackCTA />
```

- [ ] **Step 4: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/LandingFeedbackCTA.tsx src/components/landing/LandingTestimonials.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add feedback CTA, make testimonials dynamic"
```

---

### Task 8: i18n Updates

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Update English messages**

In `messages/en.json`, add the `FeedbackPage` namespace and `feedbackCTA` keys under `Landing`, and remove `testimonials.t1` through `testimonials.t8`:

Add to top level (after existing namespaces):

```json
"FeedbackPage": {
  "backToHome": "Back to Home",
  "eyebrow": "Share Your Experience",
  "title": "Your Voice Matters",
  "description": "Tell us about your visit to Shenzhen Robot Valley. Your feedback helps others discover what makes our ecosystem special.",
  "moderationNotice": "Your review will be reviewed by our team before being published.",
  "form": {
    "name": {
      "label": "Name",
      "placeholder": "Your name"
    },
    "role": {
      "label": "Role & Company",
      "placeholder": "e.g. CTO, Robotics Innovation Lab"
    },
    "message": {
      "label": "Your Feedback",
      "placeholder": "Share your thoughts about the visit..."
    },
    "submit": "Submit Review",
    "submitting": "Submitting...",
    "success": "Thank you for your review!",
    "error": "Something went wrong. Please try again.",
    "validation": {
      "nameRequired": "Name is required.",
      "roleRequired": "Role & company is required.",
      "messageRequired": "Feedback is required.",
      "messageTooLong": "Message must be 1000 characters or fewer."
    }
  }
}
```

Under `Landing`, add `feedbackCTA`:

```json
"feedbackCTA": {
  "heading": "Loved your visit?",
  "subtext": "Your review helps others discover Robot Valley",
  "button": "Write a Review"
}
```

Under `Landing.testimonials`, remove keys `t1` through `t8`.

- [ ] **Step 2: Update Chinese messages**

In `messages/zh.json`, add the same structure with Chinese translations:

```json
"FeedbackPage": {
  "backToHome": "返回首页",
  "eyebrow": "分享您的体验",
  "title": "您的声音，我们的动力",
  "description": "分享您参观深圳机器人山谷的体验，帮助更多人了解我们的生态系统。",
  "moderationNotice": "您的评价将在审核后发布。",
  "form": {
    "name": {
      "label": "姓名",
      "placeholder": "请输入您的姓名"
    },
    "role": {
      "label": "职位与公司",
      "placeholder": "例如：CTO，机器人创新实验室"
    },
    "message": {
      "label": "您的反馈",
      "placeholder": "分享您的参观感受..."
    },
    "submit": "提交评价",
    "submitting": "提交中...",
    "success": "感谢您的评价！",
    "error": "提交失败，请稍后重试。",
    "validation": {
      "nameRequired": "请输入姓名。",
      "roleRequired": "请输入职位与公司。",
      "messageRequired": "请输入反馈内容。",
      "messageTooLong": "反馈内容不能超过1000个字符。"
    }
  }
}
```

Under `Landing`, add `feedbackCTA`:

```json
"feedbackCTA": {
  "heading": "喜欢这次参观吗？",
  "subtext": "您的评价将帮助更多人了解机器人山谷",
  "button": "写评价"
}
```

Under `Landing.testimonials`, remove keys `t1` through `t8`.

- [ ] **Step 3: Type-check**

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/zh.json
git commit -m "feat: add FeedbackPage and feedbackCTA i18n keys, remove hardcoded testimonials"
```

---

### Task 9: Environment Variables

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add new env vars to .env.local**

Add to the end of `.env.local`:

```
AIRTABLE_FEEDBACK_TABLE_NAME=tblFeedback
ADMIN_USERNAME=admin
ADMIN_PASSWORD=robotvalley2026
```

**Note:** `AIRTABLE_FEEDBACK_TABLE_NAME` must match the actual table name/id in Airtable. Create the `Feedback` table in the same Airtable base with fields: `Name` (single line text), `Role` (single line text), `Message` (long text), `Status` (single select: Pending/Approved/Rejected), `Featured` (checkbox), `SubmittedAt` (date time).

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add feedback system env vars"
```

---

### Task 10: Final Integration Check

- [ ] **Step 1: Run full type-check**

Run: `npm run test`
Expected: PASS with zero errors

- [ ] **Step 2: Run dev server and smoke test**

Run: `npm run dev`

Verify:
- `http://localhost:3000` — landing page loads, testimonials section hidden (no approved feedback yet), CTA visible
- `http://localhost:3000/feedback` — feedback form page loads, can fill and submit
- `http://localhost:3000/admin` — shows login form
- Login with the credentials from `.env.local`
- Admin dashboard shows the submitted feedback as "Pending"
- Approve it, then check landing page shows it in carousel

- [ ] **Step 3: Commit any fixes**

If smoke test reveals issues, fix and commit them.
