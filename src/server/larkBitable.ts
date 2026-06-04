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

const APPLICATION_FIELD_MAP = {
  name: "Name",
  organization: "organization",
  email: "email",
  phone: "phone",
  preferredVisitDate: "preferredVisitDate",
  visitorCount: "visitorCount",
  message: "message",
  status: "Status",
  submittedAt: "Submitted At",
  recordId: "Record ID",
} satisfies Record<string, string>;

const FEEDBACK_FIELD_MAP = {
  name: "Name",
  role: "Role",
  message: "Message",
  status: "Status",
  featured: "Featured",
  submittedAt: "SubmittedAt",
  recordId: "Record ID",
} satisfies Record<string, string>;

export async function syncApplicationToBitable(
  payload: ApplicationPayload,
  airtableRecordId: string
): Promise<{ ok: true; recordId: string } | { ok: false; error: string }> {
  const config = getLarkConfig();
  if (!config.ok) return config;

  const tokenResult = await getTenantAccessToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  const fields: Record<string, unknown> = {};

  const DATE_FIELDS_APPS = new Set(["preferredVisitDate"]);
  const NUMBER_FIELDS_APPS = new Set(["visitorCount", "phone"]);

  for (const key of APPLICATION_FIELD_KEYS) {
    const larkField = APPLICATION_FIELD_MAP[key];
    if (larkField && payload[key]) {
      if (DATE_FIELDS_APPS.has(key) && typeof payload[key] === "string") {
        const ms = Date.parse(payload[key]);
        if (!Number.isNaN(ms)) {
          fields[larkField] = ms;
        }
      } else if (NUMBER_FIELDS_APPS.has(key)) {
        const num = Number(payload[key]);
        if (!Number.isNaN(num)) {
          fields[larkField] = num;
        }
      } else {
        fields[larkField] = payload[key];
      }
    }
  }
  fields[APPLICATION_FIELD_MAP.status] = "New";
  fields[APPLICATION_FIELD_MAP.submittedAt] = Date.now();
  fields[APPLICATION_FIELD_MAP.recordId] = airtableRecordId;

  const url = `${BITABLE_API_BASE}/apps/${config.config.bitableAppToken}/tables/${config.config.tableIdApplications}/records`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      const err = `Bitable request failed: HTTP ${response.status} — ${responseBody.slice(0, 300)}`;
      console.error("[FEISHU APP SYNC]", err);
      return { ok: false as const, error: err };
    }

    const body = JSON.parse(responseBody) as LarkApiResponse<LarkRecordResponse>;
    if (body.code !== 0) {
      const err = `Bitable create failed: ${body.msg ?? "unknown"} (code ${body.code})`;
      console.error("[FEISHU APP SYNC]", err);
      return { ok: false as const, error: err };
    }

    console.log("[FEISHU APP SYNC] OK", body.data?.record?.record_id);
    return { ok: true as const, recordId: body.data?.record?.record_id ?? "" };
  } catch (e) {
    const err = `Bitable request failed: ${e instanceof Error ? e.message : "unknown"}`;
    console.error("[FEISHU APP SYNC]", err);
    return { ok: false as const, error: err };
  }
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
  fields[FEEDBACK_FIELD_MAP.submittedAt] = Date.now();
  fields[FEEDBACK_FIELD_MAP.recordId] = airtableRecordId;

  const url = `${BITABLE_API_BASE}/apps/${config.config.bitableAppToken}/tables/${config.config.tableIdFeedback}/records`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) {
      return { ok: false as const, error: `Bitable request failed: HTTP ${response.status}` };
    }

    const body = (await response.json()) as LarkApiResponse<LarkRecordResponse>;
    if (body.code !== 0) {
      return { ok: false as const, error: `Bitable create failed: ${body.msg ?? "unknown"}` };
    }

    return { ok: true as const, recordId: body.data?.record?.record_id ?? "" };
  } catch (e) {
    return { ok: false as const, error: `Bitable request failed: ${e instanceof Error ? e.message : "unknown"}` };
  }
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

  let searchBody: LarkApiResponse<LarkListResponse>;
  try {
    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": "application/json",
      },
    });
    if (!searchResponse.ok) {
      return { ok: false as const, error: `Bitable request failed: HTTP ${searchResponse.status}` };
    }

    searchBody = (await searchResponse.json()) as LarkApiResponse<LarkListResponse>;
  } catch (e) {
    return { ok: false as const, error: `Bitable request failed: ${e instanceof Error ? e.message : "unknown"}` };
  }
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
  let updateBody: LarkApiResponse;
  try {
    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: updateFields }),
    });
    if (!updateResponse.ok) {
      return { ok: false as const, error: `Bitable request failed: HTTP ${updateResponse.status}` };
    }

    updateBody = (await updateResponse.json()) as LarkApiResponse;
  } catch (e) {
    return { ok: false as const, error: `Bitable request failed: ${e instanceof Error ? e.message : "unknown"}` };
  }
  if (updateBody.code !== 0) {
    return { ok: false as const, error: `Bitable update failed: ${updateBody.msg ?? "unknown"}` };
  }

  return { ok: true as const };
}
