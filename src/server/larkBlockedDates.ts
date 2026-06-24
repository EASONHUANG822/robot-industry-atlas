import "server-only";
import { getLarkConfig, getTenantAccessToken, type LarkConfig } from "./larkConfig";

const BLOCKED_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BITABLE_API_BASE = "https://open.feishu.cn/open-apis/bitable/v1";

type LarkApiResponse<T = unknown> = {
  code: number;
  msg?: string;
  data?: T;
};

type LarkListResponse = {
  items?: Array<{
    record_id?: string;
    fields?: Record<string, unknown>;
  }>;
  has_more?: boolean;
  page_token?: string;
};

function getConfig() {
  const larkConfig = getLarkConfig();
  if (!larkConfig.ok) {
    return { ok: false as const, status: 500 as const, error: larkConfig.error };
  }

  const tableId = process.env.LARK_BITABLE_TABLE_ID_BLOCKED_DATES;
  if (!tableId) {
    return {
      ok: false as const,
      status: 500 as const,
      error: "Missing LARK_BITABLE_TABLE_ID_BLOCKED_DATES env var.",
    };
  }

  return { ok: true as const, config: larkConfig.config, tableId };
}

async function getToken(config: LarkConfig) {
  const result = await getTenantAccessToken(config);
  if (!result.ok) {
    return { ok: false as const, status: 500 as const, error: result.error };
  }
  return { ok: true as const, token: result.token };
}

function buildTableUrl(appToken: string, tableId: string) {
  return `${BITABLE_API_BASE}/apps/${appToken}/tables/${tableId}/records`;
}

export async function getBlockedDates(): Promise<{ ok: true; blockedDates: string[] } | { ok: false; status: number; error: string }> {
  const config = getConfig();
  if (!config.ok) return config;
  const tokenResult = await getToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  const blockedDates: string[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(buildTableUrl(config.config.bitableAppToken, config.tableId));
    url.searchParams.set("page_size", "100");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenResult.token}` },
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as LarkApiResponse<LarkListResponse> | null;

    if (!body || body.code !== 0) {
      const err = `[getBlockedDates] Feishu error: code=${body?.code ?? "null"}, msg=${body?.msg ?? "none"}, HTTP=${response.status}`;
      console.error(err);
      return { ok: false, status: 502, error: err };
    }

    for (const item of body.data?.items || []) {
      const date = typeof item.fields?.Date === "string" ? item.fields.Date.trim() : "";
      if (BLOCKED_DATE_PATTERN.test(date)) {
        blockedDates.push(date);
      }
    }

    pageToken = body.data?.has_more ? body.data?.page_token : undefined;
  } while (pageToken);

  blockedDates.sort();

  return { ok: true, blockedDates };
}

export async function addBlockedDate(date: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!BLOCKED_DATE_PATTERN.test(date)) {
    return { ok: false, status: 400, error: "Date must be in YYYY-MM-DD format." };
  }

  const config = getConfig();
  if (!config.ok) return config;
  const tokenResult = await getToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  // Check if already blocked
  const existingResult = await getBlockedDates();
  if (existingResult.ok && existingResult.blockedDates.includes(date)) {
    return { ok: true }; // idempotent
  }

  const url = buildTableUrl(config.config.bitableAppToken, config.tableId);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: { Date: date } }),
  });

  const body = (await response.json().catch(() => null)) as LarkApiResponse | null;

  if (!body || body.code !== 0) {
    const err = `[addBlockedDate] Feishu error: code=${body?.code ?? "null"}, msg=${body?.msg ?? "none"}, HTTP=${response.status}`;
    console.error(err);
    return { ok: false, status: 502, error: err };
  }

  return { ok: true };
}

export async function removeBlockedDate(date: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!BLOCKED_DATE_PATTERN.test(date)) {
    return { ok: false, status: 400, error: "Date must be in YYYY-MM-DD format." };
  }

  const config = getConfig();
  if (!config.ok) return config;
  const tokenResult = await getToken(config.config);
  if (!tokenResult.ok) return tokenResult;

  // Find the record ID by the Date field
  const recordId = await findRecordIdByDate(config.config.bitableAppToken, config.tableId, tokenResult.token, date);
  if (!recordId) {
    return { ok: true }; // already removed
  }

  const deleteUrl = `${buildTableUrl(config.config.bitableAppToken, config.tableId)}/${encodeURIComponent(recordId)}`;
  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  });

  const body = (await response.json().catch(() => null)) as LarkApiResponse | null;

  if (!body || body.code !== 0) {
    const err = `[removeBlockedDate] Feishu error: code=${body?.code ?? "null"}, msg=${body?.msg ?? "none"}, HTTP=${response.status}`;
    console.error(err);
    return { ok: false, status: 502, error: err };
  }

  return { ok: true };
}

async function findRecordIdByDate(appToken: string, tableId: string, token: string, date: string): Promise<string | null> {
  const url = new URL(buildTableUrl(appToken, tableId));
  url.searchParams.set("filter", `CurrentValue.[Date]="${date}"`);
  url.searchParams.set("page_size", "1");

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as LarkApiResponse<LarkListResponse> | null;

  if (!body || body.code !== 0) return null;
  return body.data?.items?.[0]?.record_id ?? null;
}
