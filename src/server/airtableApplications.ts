import "server-only";
import {
  APPLICATION_FIELD_KEYS,
  REQUIRED_APPLICATION_FIELD_KEYS,
  type ApplicationFieldKey,
  type ApplicationPayload,
} from "@/config/applicationForm";

type AirtableCreateResponse = {
  records?: Array<{
    id?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

const AIRTABLE_FIELD_MAP = {
  name: "Name",
  organization: "organization",
  email: "email",
  phone: "phone",
  preferredVisitDate: "preferredVisitDate",
  visitorCount: "visitorCount",
  message: "message",
} satisfies Record<ApplicationFieldKey, string>;

const AIRTABLE_SYSTEM_FIELD_MAP = {
  status: "Status",
  submittedAt: "Submitted At",
} as const;

export function validateApplicationPayload(value: unknown) {
  if (!isRecord(value)) {
    return {
      ok: false as const,
      error: "Request body must be a JSON object.",
    };
  }

  const unsupportedFields = Object.keys(value).filter((key) => !APPLICATION_FIELD_KEYS.includes(key as ApplicationFieldKey));
  if (unsupportedFields.length > 0) {
    return {
      ok: false as const,
      error: `Unsupported field(s): ${unsupportedFields.join(", ")}.`,
    };
  }

  const payload: ApplicationPayload = {};

  for (const key of APPLICATION_FIELD_KEYS) {
    const rawValue = value[key];
    if (typeof rawValue === "string") {
      payload[key] = rawValue.trim();
      continue;
    }

    if (typeof rawValue === "number" || typeof rawValue === "boolean") {
      payload[key] = String(rawValue).trim();
    }
  }

  const missingFields = REQUIRED_APPLICATION_FIELD_KEYS.filter((key) => !payload[key]);
  if (missingFields.length > 0) {
    return {
      ok: false as const,
      error: `Missing required field(s): ${missingFields.join(", ")}.`,
    };
  }

  return {
    ok: true as const,
    payload,
  };
}

export async function createAirtableApplication(payload: ApplicationPayload) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!token || !baseId || !tableName) {
    return {
      ok: false as const,
      status: 500,
      error:
        "Missing Airtable server configuration. Check AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_NAME.",
    };
  }

  if (!baseId.startsWith("app")) {
    return {
      ok: false as const,
      status: 500,
      error: "AIRTABLE_BASE_ID must be an Airtable Base ID that starts with app.",
    };
  }

  const fieldsResult = buildAirtableFields(payload);
  if (!fieldsResult.ok) {
    return {
      ok: false as const,
      status: 400,
      error: fieldsResult.error,
    };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: fieldsResult.fields,
        },
      ],
      typecast: true,
    }),
  });

  const responseBody = (await safeReadAirtableResponse(response)) as AirtableCreateResponse | string | undefined;

  if (!response.ok) {
    return {
      ok: false as const,
      status: normalizeAirtableErrorStatus(response.status),
      error: getAirtableErrorMessage(response.status, responseBody),
    };
  }

  return {
    ok: true as const,
    recordId: typeof responseBody === "object" ? responseBody?.records?.[0]?.id : undefined,
  };
}

function buildAirtableFields(payload: ApplicationPayload) {
  const fields: Record<string, string> = {};

  for (const key of APPLICATION_FIELD_KEYS) {
    const airtableFieldName = AIRTABLE_FIELD_MAP[key];
    if (!airtableFieldName) {
      return {
        ok: false as const,
        error: `Missing Airtable field mapping for "${key}".`,
      };
    }

    const value = payload[key];
    if (value) {
      fields[airtableFieldName] = value;
    }
  }

  fields[AIRTABLE_SYSTEM_FIELD_MAP.status] = "New";
  fields[AIRTABLE_SYSTEM_FIELD_MAP.submittedAt] = new Date().toISOString();

  return {
    ok: true as const,
    fields,
  };
}

async function safeReadAirtableResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as AirtableCreateResponse;
  } catch {
    return text;
  }
}

function getAirtableErrorMessage(status: number, body: AirtableCreateResponse | string | undefined) {
  const airtableMessage =
    typeof body === "string" ? body : body?.error?.message || body?.error?.type || "Airtable request failed.";

  if (status === 401 || status === 403) {
    return `Airtable rejected the request. Check AIRTABLE_TOKEN and ensure it has data.records:write permission. (${airtableMessage})`;
  }

  if (status === 404) {
    return `Airtable base or table was not found. Check AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME (table name or table ID), and token access to the Base. (${airtableMessage})`;
  }

  if (status === 422 || /field|fields|unknown/i.test(airtableMessage)) {
    return `Airtable field error. Check the field mapping and Airtable table structure. (${airtableMessage})`;
  }

  return `Airtable request failed. (${airtableMessage})`;
}

function normalizeAirtableErrorStatus(status: number) {
  if (status === 401 || status === 403 || status === 404 || status === 422) {
    return status;
  }

  return 502;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
