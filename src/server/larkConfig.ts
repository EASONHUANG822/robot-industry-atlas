import "server-only";

export type LarkConfig = {
  appId: string;
  appSecret: string;
  botWebhook: string;
  botWebhookSecret: string;
  bitableAppToken: string;
  tableIdApplications: string;
  tableIdFeedback: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

let cachedToken: TokenCache | null = null;

let pendingTokenPromise: Promise<{ ok: true; token: string } | { ok: false; error: string }> | null = null;

export function getLarkConfig() {
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const botWebhook = process.env.LARK_BOT_WEBHOOK;
  const botWebhookSecret = process.env.LARK_BOT_WEBHOOK_SECRET;
  const bitableAppToken = process.env.LARK_BITABLE_APP_TOKEN;
  const tableIdApplications = process.env.LARK_BITABLE_TABLE_ID_APPLICATIONS;
  const tableIdFeedback = process.env.LARK_BITABLE_TABLE_ID_FEEDBACK;

  const missing: string[] = [];
  if (!appId) missing.push("LARK_APP_ID");
  if (!appSecret) missing.push("LARK_APP_SECRET");
  if (!botWebhook) missing.push("LARK_BOT_WEBHOOK");
  if (!botWebhookSecret) missing.push("LARK_BOT_WEBHOOK_SECRET");
  if (!bitableAppToken) missing.push("LARK_BITABLE_APP_TOKEN");
  if (!tableIdApplications) missing.push("LARK_BITABLE_TABLE_ID_APPLICATIONS");
  if (!tableIdFeedback) missing.push("LARK_BITABLE_TABLE_ID_FEEDBACK");
  // LARK_BITABLE_TABLE_ID_BLOCKED_DATES is optional — only required if using date blocking

  if (missing.length > 0) {
    return {
      ok: false as const,
      error: `Missing Feishu config: ${missing.join(", ")}.`,
    };
  }

  return {
    ok: true as const,
    config: {
      appId,
      appSecret,
      botWebhook,
      botWebhookSecret,
      bitableAppToken,
      tableIdApplications,
      tableIdFeedback,
    } as LarkConfig,
  };
}

export async function getTenantAccessToken(config: LarkConfig) {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { ok: true as const, token: cachedToken.token };
  }

  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const response = await fetch(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
        }
      );

      const body = (await response.json()) as {
        code: number;
        msg?: string;
        tenant_access_token?: string;
        expire?: number;
      };

      if (body.code !== 0 || !body.tenant_access_token) {
        return {
          ok: false as const,
          error: `Failed to get tenant access token: ${body.msg ?? "unknown error"}`,
        };
      }

      cachedToken = {
        token: body.tenant_access_token,
        expiresAt: Date.now() + ((body.expire ?? 7200) - 300) * 1000,
      };

      return { ok: true as const, token: cachedToken.token };
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}
