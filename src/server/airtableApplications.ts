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

type AirtableListResponse = {
  records?: Array<{
    id?: string;
    fields?: Record<string, unknown>;
  }>;
  offset?: string;
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

const MAX_DONE_APPLICATIONS_PER_VISIT_DATE = 4;
const VISIT_DATE_TIME_ZONE = "Asia/Shanghai";
const AIRTABLE_NEW_STATUS = "New";
const AIRTABLE_DONE_STATUS = "Done";

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
  const configResult = getAirtableConfig();
  if (!configResult.ok) {
    return configResult;
  }

  const fieldsResult = buildAirtableFields(payload);
  if (!fieldsResult.ok) {
    return {
      ok: false as const,
      status: 400,
      error: fieldsResult.error,
    };
  }

  const url = buildAirtableTableUrl(configResult.baseId, configResult.tableName);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${configResult.token}`,
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

export async function getUnavailableVisitDates() {
  const configResult = getAirtableConfig();
  if (!configResult.ok) {
    return configResult;
  }

  const dateCounts = new Map<string, number>();
  let offset: string | undefined;

  do {
    const url = new URL(buildAirtableTableUrl(configResult.baseId, configResult.tableName));
    url.searchParams.set(
      "filterByFormula",
      `AND({${AIRTABLE_SYSTEM_FIELD_MAP.status}} = "${AIRTABLE_DONE_STATUS}", {${AIRTABLE_FIELD_MAP.preferredVisitDate}})`,
    );
    url.searchParams.set("pageSize", "100");
    url.searchParams.append("fields[]", AIRTABLE_FIELD_MAP.preferredVisitDate);
    url.searchParams.append("fields[]", AIRTABLE_SYSTEM_FIELD_MAP.status);

    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${configResult.token}`,
      },
      cache: "no-store",
    });
    const responseBody = (await safeReadAirtableResponse(response)) as AirtableListResponse | string | undefined;

    if (!response.ok) {
      return {
        ok: false as const,
        status: normalizeAirtableErrorStatus(response.status),
        error: getAirtableErrorMessage(response.status, responseBody),
      };
    }

    if (typeof responseBody === "object") {
      for (const record of responseBody?.records || []) {
        const dateValue = normalizeVisitDateValue(record.fields?.[AIRTABLE_FIELD_MAP.preferredVisitDate]);
        if (dateValue) {
          dateCounts.set(dateValue, (dateCounts.get(dateValue) || 0) + 1);
        }
      }

      offset = responseBody?.offset;
    } else {
      offset = undefined;
    }
  } while (offset);

  const unavailableDates = [...dateCounts.entries()]
    .filter(([, count]) => count >= MAX_DONE_APPLICATIONS_PER_VISIT_DATE)
    .map(([date]) => date)
    .sort();

  return {
    ok: true as const,
    unavailableDates,
  };
}

export async function validatePreferredVisitDateAvailability(preferredVisitDate: string | undefined) {
  if (!preferredVisitDate) {
    return { ok: true as const };
  }

  if (!isIsoDateString(preferredVisitDate)) {
    return {
      ok: false as const,
      status: 400,
      error: "Preferred visit date must use YYYY-MM-DD format.",
    };
  }

  if (preferredVisitDate < getTodayVisitDateString()) {
    return {
      ok: false as const,
      status: 400,
      error: "Preferred visit date cannot be earlier than today.",
    };
  }

  const unavailableResult = await getUnavailableVisitDates();
  if (!unavailableResult.ok) {
    return unavailableResult;
  }

  if (unavailableResult.unavailableDates.includes(preferredVisitDate)) {
    return {
      ok: false as const,
      status: 409,
      error: "The selected visit date is fully booked. Please choose another date.",
    };
  }

  return { ok: true as const };
}

export function getTodayVisitDateString(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VISIT_DATE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
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

  fields[AIRTABLE_SYSTEM_FIELD_MAP.status] = AIRTABLE_NEW_STATUS;
  fields[AIRTABLE_SYSTEM_FIELD_MAP.submittedAt] = new Date().toISOString();

  return {
    ok: true as const,
    fields,
  };
}

function getAirtableConfig() {
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

  return {
    ok: true as const,
    token,
    baseId,
    tableName,
  };
}

function buildAirtableTableUrl(baseId: string, tableName: string) {
  return `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
}

function normalizeVisitDateValue(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0];
}

function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
