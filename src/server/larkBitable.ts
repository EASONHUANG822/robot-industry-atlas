import "server-only";
import { getLarkConfig, getTenantAccessToken } from "./larkConfig";
import { APPLICATION_FIELD_KEYS, type ApplicationPayload } from "@/config/applicationForm";
import { FEEDBACK_FIELD_KEYS, type FeedbackPayload, type FeedbackStatus } from "./airtableFeedback";

type LarkApiResponse<T = unknown> = {
  code: number;
  msg?: string;
  data?: T;
};

type LarkRecordResponse = {
  record?: {
    record_id?: string;
    fields?: Record<string, unknown>;
  };
};

type LarkListResponse = {
  items?: Array<{
    record_id?: string;
    fields?: Record<string, unknown>;
  }>;
  has_more?: boolean;
  page_token?: string;
};

const BITABLE_API_BASE = "https://open.feishu.cn/open-apis/bitable/v1";

const APPLICATION_FIELD_MAP: Record<string, string> = {
  name: "Name",
  organization: "Organization",
  email: "Email",
  phone: "Phone",
  preferredVisitDate: "Preferred Visit Date",
  visitorCount: "Visitor Count",
  message: "Message",
  status: "Status",
  submittedAt: "Submitted At",
  recordId: "Record ID",
};

const FEEDBACK_FIELD_MAP: Record<string, string> = {
  name: "Name",
  role: "Role",
  message: "Message",
  status: "Status",
  featured: "Featured",
  submittedAt: "Submitted At",
  recordId: "Record ID",
};

export async function syncApplicationToBitable(
  payload: ApplicationPayload,
  airtableRecordId: string
): Promise<{ ok: true; recordId: string } | { ok: false; error: string }> {
  const config = getLarkConfig();
  if (!config.ok) return config;

  const tokenResult = await getTenantAccessToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  const fields: Record<string, unknown> = {};

  for (const key of APPLICATION_FIELD_KEYS) {
    const larkField = APPLICATION_FIELD_MAP[key];
    if (larkField && payload[key]) {
      fields[larkField] = payload[key];
    }
  }
  fields[APPLICATION_FIELD_MAP.status] = "New";
  fields[APPLICATION_FIELD_MAP.submittedAt] = new Date().toISOString();
  fields[APPLICATION_FIELD_MAP.recordId] = airtableRecordId ?? "";

  const url = `${BITABLE_API_BASE}/apps/${config.config.bitableAppToken}/tables/${config.config.tableIdApplications}/records`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  const body = (await response.json()) as LarkApiResponse<LarkRecordResponse>;
  if (body.code !== 0) {
    return { ok: false as const, error: `Bitable create failed: ${body.msg ?? "unknown"}` };
  }

  return { ok: true as const, recordId: body.data?.record?.record_id ?? "" };
}

export async function syncFeedbackToBitable(
  payload: FeedbackPayload,
  airtableRecordId: string
): Promise<{ ok: true; recordId: string } | { ok: false; error: string }> {
  const config = getLarkConfig();
  if (!config.ok) return config;

  const tokenResult = await getTenantAccessToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  const fields: Record<string, unknown> = {};

  for (const key of FEEDBACK_FIELD_KEYS) {
    const larkField = FEEDBACK_FIELD_MAP[key];
    if (larkField && payload[key]) {
      fields[larkField] = payload[key];
    }
  }
  fields[FEEDBACK_FIELD_MAP.status] = "Pending";
  fields[FEEDBACK_FIELD_MAP.featured] = false;
  fields[FEEDBACK_FIELD_MAP.submittedAt] = new Date().toISOString();
  fields[FEEDBACK_FIELD_MAP.recordId] = airtableRecordId ?? "";

  const url = `${BITABLE_API_BASE}/apps/${config.config.bitableAppToken}/tables/${config.config.tableIdFeedback}/records`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  const body = (await response.json()) as LarkApiResponse<LarkRecordResponse>;
  if (body.code !== 0) {
    return { ok: false as const, error: `Bitable create failed: ${body.msg ?? "unknown"}` };
  }

  return { ok: true as const, recordId: body.data?.record?.record_id ?? "" };
}

export async function updateFeedbackInBitable(
  airtableRecordId: string,
  updates: { status?: FeedbackStatus; featured?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getLarkConfig();
  if (!config.ok) return config;

  const tokenResult = await getTenantAccessToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  // Find the record in Feishu by Airtable Record ID
  const filter = encodeURIComponent(
    `CurrentValue.[${FEEDBACK_FIELD_MAP.recordId}]="${airtableRecordId}"`
  );
  const searchUrl = `${BITABLE_API_BASE}/apps/${config.config.bitableAppToken}/tables/${config.config.tableIdFeedback}/records?filter=${filter}`;

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
  });

  const searchBody = (await searchResponse.json()) as LarkApiResponse<LarkListResponse>;
  if (searchBody.code !== 0) {
    return { ok: false as const, error: `Bitable search failed: ${searchBody.msg ?? "unknown"}` };
  }

  const larkRecordId = searchBody.data?.items?.[0]?.record_id;
  if (!larkRecordId) {
    return { ok: false as const, error: "Feedback record not found in Feishu Bitable." };
  }

  // Update the record
  const updateFields: Record<string, unknown> = {};
  if (updates.status !== undefined) {
    updateFields[FEEDBACK_FIELD_MAP.status] = updates.status;
  }
  if (updates.featured !== undefined) {
    updateFields[FEEDBACK_FIELD_MAP.featured] = updates.featured;
  }

  if (Object.keys(updateFields).length === 0) {
    return { ok: true as const };
  }

  const updateUrl = `${BITABLE_API_BASE}/apps/${config.config.bitableAppToken}/tables/${config.config.tableIdFeedback}/records/${larkRecordId}`;
  const updateResponse = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: updateFields }),
  });

  const updateBody = (await updateResponse.json()) as LarkApiResponse;
  if (updateBody.code !== 0) {
    return { ok: false as const, error: `Bitable update failed: ${updateBody.msg ?? "unknown"}` };
  }

  return { ok: true as const };
}
