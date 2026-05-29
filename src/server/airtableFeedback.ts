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
