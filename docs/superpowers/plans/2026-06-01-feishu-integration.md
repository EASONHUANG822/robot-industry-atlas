# 飞书集成实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将参观申请和用户评价数据同步到飞书多维表格，并通过群机器人发送通知。

**Architecture:** 新增三个 `server-only` 模块（larkConfig、larkBitable、larkNotify），改造三个现有 API 路由，新增一个 webhook 回调路由。Airtable 写入成功后异步同步到飞书，失败静默处理不阻断主流程。飞书多维表格通过自动化 webhook 回写 Airtable 实现双向审批。

**Tech Stack:** Next.js 15、飞书 Open API (REST)、飞书 Incoming Webhook、飞书多维表格

---

## 文件结构

```
新增:
  src/server/larkConfig.ts          — 配置读取 + tenant access token 缓存
  src/server/larkBitable.ts         — 多维表格 CRUD 操作
  src/server/larkNotify.ts          — 群消息通知
  src/app/api/lark/bitable-webhook/route.ts  — 飞书自动化 webhook 回调

修改:
  src/app/api/applications/route.ts           — 新增飞书双写 + 通知
  src/app/api/feedback/route.ts               — 新增飞书双写 + 通知
  src/app/api/admin/feedback/[id]/route.ts    — 新增飞书状态同步
  .env.local                                  — 新增飞书 env vars
```

---

### Task 1: 飞书配置模块 `larkConfig.ts`

**Files:**
- Create: `src/server/larkConfig.ts`

- [ ] **Step 1: 创建 larkConfig.ts**

```ts
import "server-only";

export type LarkConfig = {
  appId: string;
  appSecret: string;
  botWebhook: string;
  bitableAppToken: string;
  tableIdApplications: string;
  tableIdFeedback: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

let cachedToken: TokenCache | null = null;

export function getLarkConfig() {
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const botWebhook = process.env.LARK_BOT_WEBHOOK;
  const bitableAppToken = process.env.LARK_BITABLE_APP_TOKEN;
  const tableIdApplications = process.env.LARK_BITABLE_TABLE_ID_APPLICATIONS;
  const tableIdFeedback = process.env.LARK_BITABLE_TABLE_ID_FEEDBACK;

  const missing: string[] = [];
  if (!appId) missing.push("LARK_APP_ID");
  if (!appSecret) missing.push("LARK_APP_SECRET");
  if (!botWebhook) missing.push("LARK_BOT_WEBHOOK");
  if (!bitableAppToken) missing.push("LARK_BITABLE_APP_TOKEN");
  if (!tableIdApplications) missing.push("LARK_BITABLE_TABLE_ID_APPLICATIONS");
  if (!tableIdFeedback) missing.push("LARK_BITABLE_TABLE_ID_FEEDBACK");

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
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/server/larkConfig.ts
git commit -m "feat: add Feishu config module with tenant access token caching"
```

---

### Task 2: 飞书多维表格模块 `larkBitable.ts`

**Files:**
- Create: `src/server/larkBitable.ts`

- [ ] **Step 1: 创建 larkBitable.ts**

```ts
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
```

- [ ] **Step 2: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。如果 `FEEDBACK_FIELD_KEYS` 和 `FeedbackPayload` 类型导入有问题，检查 `airtableFeedback.ts` 的导出。

- [ ] **Step 3: Commit**

```bash
git add src/server/larkBitable.ts
git commit -m "feat: add Feishu Bitable CRUD module"
```

---

### Task 3: 飞书通知模块 `larkNotify.ts`

**Files:**
- Create: `src/server/larkNotify.ts`

- [ ] **Step 1: 创建 larkNotify.ts**

```ts
import "server-only";
import { getLarkConfig } from "./larkConfig";
import type { ApplicationPayload } from "@/config/applicationForm";
import type { FeedbackPayload } from "./airtableFeedback";

const MULTI_TABLE_URL = "https://xcnxydjnox4j.feishu.cn/wiki/JHxnwP8DciEvKukoEyFcHWO5nLe";

function sendWebhook(payload: Record<string, unknown>) {
  const config = getLarkConfig();
  if (!config.ok) return Promise.resolve();

  return fetch(config.config.botWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function notifyNewApplication(
  payload: ApplicationPayload,
  _airtableRecordId: string
) {
  const name = payload.name ?? "—";
  const org = payload.organization ?? "—";
  const email = payload.email ?? "—";
  const date = payload.preferredVisitDate ?? "—";
  const count = payload.visitorCount ?? "—";

  await sendWebhook({
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: "📝 新的参观申请" },
        template: "blue",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: `**👤 ${name}** | ${org}\n📧 ${email}\n📅 ${date}\n👥 ${count}人` },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "查看多维表格" },
              type: "default",
              url: MULTI_TABLE_URL,
            },
          ],
        },
      ],
    },
  });
}

export async function notifyNewFeedback(payload: FeedbackPayload, _airtableRecordId: string) {
  const name = payload.name ?? "—";
  const role = payload.role ?? "—";
  const message = (payload.message ?? "—").slice(0, 200) + ((payload.message?.length ?? 0) > 200 ? "..." : "");

  await sendWebhook({
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: "📨 新的用户评价" },
        template: "green",
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: `**👤 ${name}** | ${role}\n💬 ${message}` },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "审核处理" },
              type: "default",
              url: MULTI_TABLE_URL,
            },
          ],
        },
      ],
    },
  });
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/server/larkNotify.ts
git commit -m "feat: add Feishu bot notification module"
```

---

### Task 4: 改造参观申请 API `applications/route.ts`

**Files:**
- Modify: `src/app/api/applications/route.ts`

- [ ] **Step 1: 在 Airtable 写入成功后加入飞书双写和通知**

找到 `src/app/api/applications/route.ts` 第 32-37 行，替换为：

```ts
    const result = await createAirtableApplication(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Fire-and-forget: sync to Feishu Bitable + notify (don't block response)
    if (result.recordId) {
      import("@/server/larkBitable").then(({ syncApplicationToBitable }) =>
        syncApplicationToBitable(validation.payload, result.recordId!).catch(() => {})
      );
      import("@/server/larkNotify").then(({ notifyNewApplication }) =>
        notifyNewApplication(validation.payload, result.recordId!).catch(() => {})
      );
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
```

- [ ] **Step 2: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。`import()` 动态导入可能产生 `Floating promise` 警告 — 如果 ESLint 报错，添加 `void` 前缀。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/applications/route.ts
git commit -m "feat: add Feishu sync and notification to application submission"
```

---

### Task 5: 改造评价 API `feedback/route.ts`

**Files:**
- Modify: `src/app/api/feedback/route.ts`

- [ ] **Step 1: 在 Airtable 写入成功后加入飞书双写和通知**

找到 `src/app/api/feedback/route.ts` 第 18-21 行，替换为：

```ts
    const result = await createFeedback(validation.payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Fire-and-forget: sync to Feishu Bitable + notify
    if (result.recordId) {
      import("@/server/larkBitable").then(({ syncFeedbackToBitable }) =>
        syncFeedbackToBitable(validation.payload, result.recordId!).catch(() => {})
      );
      import("@/server/larkNotify").then(({ notifyNewFeedback }) =>
        notifyNewFeedback(validation.payload, result.recordId!).catch(() => {})
      );
    }

    return NextResponse.json({ ok: true, recordId: result.recordId });
```

- [ ] **Step 2: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/feedback/route.ts
git commit -m "feat: add Feishu sync and notification to feedback submission"
```

---

### Task 6: 改造管理后台反馈 API `admin/feedback/[id]/route.ts`

**Files:**
- Modify: `src/app/api/admin/feedback/[id]/route.ts`

- [ ] **Step 1: 在 Airtable 更新成功后加入飞书状态同步**

找到 `src/app/api/admin/feedback/[id]/route.ts` 第 40-43 行，替换为：

```ts
    const result = await updateFeedback(id, updates);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Fire-and-forget: sync status update to Feishu Bitable
    import("@/server/larkBitable").then(({ updateFeedbackInBitable }) =>
      updateFeedbackInBitable(id, updates).catch(() => {})
    );

    return NextResponse.json({ ok: true });
```

- [ ] **Step 2: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/feedback/[id]/route.ts
git commit -m "feat: add Feishu Bitable status sync on admin feedback update"
```

---

### Task 7: 飞书自动化 Webhook 回调 `bitable-webhook/route.ts`

**Files:**
- Create: `src/app/api/lark/bitable-webhook/route.ts`

- [ ] **Step 1: 确保目录存在并创建路由文件**

```bash
New-Item -ItemType Directory -Force -Path "src/app/api/lark/bitable-webhook"
```

- [ ] **Step 2: 创建 webhook route.ts**

```ts
import { NextResponse } from "next/server";
import { updateFeedback, type FeedbackStatus } from "@/server/airtableFeedback";

const VALID_STATUSES = new Set<string>(["Pending", "Approved", "Rejected"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Feishu automation webhook sends record data in different shapes.
  // Extract the Airtable Record ID and new Status from the payload.
  const recordId = extractRecordId(body);
  const status = extractStatus(body);

  if (!recordId) {
    return NextResponse.json({ error: "Missing Record ID" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Missing or invalid Status" }, { status: 400 });
  }

  try {
    const result = await updateFeedback(recordId, { status: status as FeedbackStatus });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

function extractRecordId(body: Record<string, unknown>): string | null {
  // Try common Feishu automation webhook payload shapes
  const record = body.record as Record<string, unknown> | undefined;
  const fields = (record?.fields ?? body.fields ?? body) as Record<string, unknown>;
  const recordId = fields["Record ID"] ?? fields["recordId"] ?? body.recordId;
  return typeof recordId === "string" ? recordId : null;
}

function extractStatus(body: Record<string, unknown>): string | null {
  const record = body.record as Record<string, unknown> | undefined;
  const fields = (record?.fields ?? body.fields ?? body) as Record<string, unknown>;
  const status = fields["Status"] ?? fields["status"] ?? body.status;
  return typeof status === "string" ? status : null;
}
```

- [ ] **Step 3: 类型检查**

Run: `npm run test`
Expected: 无新增类型错误。

- [ ] **Step 4: Commit**

```bash
git add src/app/api/lark/bitable-webhook/route.ts
git commit -m "feat: add Feishu automation webhook callback endpoint"
```

---

### Task 8: 添加飞书环境变量到 `.env.local`

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: 在 `.env.local` 末尾添加飞书配置**

```env
# Feishu / Lark
LARK_APP_ID=cli_aa96473a77395cd8
LARK_APP_SECRET=7u7JZAe85yULafhRlOomLd3JwnvQ8tsi
LARK_BOT_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/548c260b-4262-4a0f-839e-7aed39ceb9ad
LARK_BITABLE_APP_TOKEN=JHxnwP8DciEvKukoEyFcHWO5nLe
LARK_BITABLE_TABLE_ID_APPLICATIONS=tblveWXKFCxpbNcr
LARK_BITABLE_TABLE_ID_FEEDBACK=tblUw5hlw4vtBLxp
```

- [ ] **Step 2: Commit 或不 commit `.env.local`**

`.env.local` 在 `.gitignore` 中，不应提交。仅本地更新即可。

---

### Task 9: 验证构建

- [ ] **Step 1: 运行完整构建**

Run: `npm run build`
Expected: 构建成功，无新增错误。

- [ ] **Step 2: 提交最终验证**

```bash
git status
git log --oneline -10
```

所有新增和修改文件已提交（Task 1-7），无未提交变更。

---

## 测试方法

由于项目无运行时测试套件，验证通过以下方式进行：

1. **类型检查:** `npm run test` (即 `tsc --noEmit`) — 每个 Task 后运行
2. **构建检查:** `npm run build` — Task 9 最终验证
3. **手动端到端测试（Phase 1-3 开发完成后）:**
   - 提交一条参观申请 → 检查飞书多维表格是否有新记录 + 群内是否收到消息卡片
   - 提交一条评价 → 检查飞书多维表格是否有新记录 + 群内是否收到消息卡片
   - 在管理后台审批一条评价 → 检查飞书多维表格 Status 字段是否同步更新
4. **Webhook 测试（Phase 3 上线后）:**
   - 在飞书多维表格手动修改一条评价的 Status → 检查 Airtable 是否同步更新

---

## 飞书侧配置（Phase 4，需代码上线后才能操作）

1. 确保飞书自建应用已发布，Bitable 权限已开通
2. 确保多维表格已授权给自建应用（编辑权限）
3. 在评价表配置自动化规则：
   - 触发条件：`Status 字段变更 AND 修改人为团队成员`
   - 执行动作：`发送 Webhook`
   - URL：`https://你的域名/api/lark/bitable-webhook`
   - 避免循环：规则不监听 API 程序修改（仅手动修改触发）
