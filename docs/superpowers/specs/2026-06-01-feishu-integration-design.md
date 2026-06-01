# 飞书集成设计文档

> **For agentic workers:** 使用 superpowers:writing-plans 创建实现计划，然后使用 superpowers:subagent-driven-development 执行。

**目标：** 将官网收集的参观申请和用户评价数据同步到飞书，实现实时通知、数据双写、团队协作、双向审批。

**架构：** 方案 A——渐进式两步走。Phase 1-3 实现通知+双写+双向同步代码，Phase 4 在飞书侧配置自动化规则。Airtable 保持为主存储，飞书多维表格为镜像。官网 API 写入成功后异步同步到飞书；飞书审批通过自动化 webhook 回调官网 API 同步回 Airtable。

**技术栈：** Next.js 15 server-side modules (`"server-only"`)、飞书 Open API (REST)、飞书 Incoming Webhook (群机器人)、飞书多维表格自动化

---

## 新增文件

### `src/server/larkConfig.ts`

飞书配置读取模块。从环境变量读取 App ID、App Secret、Bot Webhook、多维表格 app token 和 table ID。返回 discriminated union `{ ok: true, ...config } | { ok: false, error: string }`。

环境变量列表：
- `LARK_APP_ID` — 飞书自建应用 App ID (`cli_aa96473a77395cd8`)
- `LARK_APP_SECRET` — 飞书自建应用 App Secret
- `LARK_BOT_WEBHOOK` — 群机器人 Incoming Webhook URL
- `LARK_BITABLE_APP_TOKEN` — 多维表格文档 ID (`JHxnwP8DciEvKukoEyFcHWO5nLe`)，两表在同一文档
- `LARK_BITABLE_TABLE_ID_APPLICATIONS` — 申请表 table ID (`tblveWXKFCxpbNcr`)
- `LARK_BITABLE_TABLE_ID_FEEDBACK` — 评价表 table ID (`tblUw5hlw4vtBLxp`)
- `LARK_BOT_WEBHOOK` — 群机器人 webhook (`https://open.feishu.cn/open-apis/bot/v2/hook/548c260b-4262-4a0f-839e-7aed39ceb9ad`)

提供 `getLarkConfig()` 和 tenant access token 缓存（内存缓存，TTL 为飞书默认的 2 小时减去 5 分钟缓冲）。

### `src/server/larkBitable.ts`

多维表格 CRUD 操作模块。提供两个核心函数：

- `syncApplicationToBitable(payload)` — 将申请记录写入飞书多维表格
- `syncFeedbackToBitable(payload)` — 将评价记录写入飞书多维表格
- `updateFeedbackInBitable(recordId, updates)` — 根据 Airtable Record ID 查找飞书行并更新 Status/Featured 字段

写入时使用飞书 Bitable API `POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records`。
更新时先通过 `GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records?filter=CurrentValue.[Record ID]="xxx"` 查找行，再 `PUT` 更新。

所有函数返回 `{ ok: true, recordId } | { ok: false, error }`。失败时静默处理（不抛异常），因为飞书是辅助存储，不应该阻断主流程。

### `src/server/larkNotify.ts`

群消息通知模块。发送飞书群机器人 Incoming Webhook 消息。

- `notifyNewApplication(payload)` — 新申请通知
- `notifyNewFeedback(payload)` — 新评价通知

消息格式：Markdown 卡片，包含关键字段摘要 + 飞书多维表格链接。
失败时静默处理。

### `src/app/api/lark/bitable-webhook/route.ts`

接收飞书多维表格自动化的 webhook 回调。

- 验证请求来源（飞书签名校验）
- 解析 webhook body：提取 Airtable Record ID 和变更的 Status
- 调用 `updateFeedback()` 更新 Airtable 中的 Status
- 返回 200 给飞书（飞书自动化要求快速响应）

## 修改文件

### `src/app/api/applications/route.ts`

在 `createAirtableApplication()` 成功后，增加异步调用（不 await，不阻断响应）：
1. `syncApplicationToBitable()` — 写入飞书多维表格
2. `notifyNewApplication()` — 发飞书群通知

两个调用各自 try/catch，失败不影响主响应。

### `src/app/api/feedback/route.ts`

在 `createFeedback()` 成功后，增加异步调用：
1. `syncFeedbackToBitable()` — 写入飞书多维表格
2. `notifyNewFeedback()` — 发飞书群通知

### `src/app/api/admin/feedback/[id]/route.ts`

在 `updateFeedback()` 成功后，增加异步调用：
1. `updateFeedbackInBitable()` — 同步 Status/Featured 到飞书

## 飞书多维表格字段结构

### 申请表（Applications）

| 字段名 | 类型 |
|---|---|
| Name | 文本 |
| Organization | 文本 |
| Email | 文本 |
| Phone | 文本 |
| Preferred Visit Date | 文本 |
| Visitor Count | 文本 |
| Message | 多行文本 |
| Status | 单选 (New / Done) |
| Submitted At | 文本 |
| Record ID | 文本 |

### 评价表（Feedback）

| 字段名 | 类型 |
|---|---|
| Name | 文本 |
| Role | 文本 |
| Message | 多行文本 |
| Status | 单选 (Pending / Approved / Rejected) |
| Featured | 复选框 |
| Submitted At | 文本 |
| Record ID | 文本 |

`Record ID` 字段存储 Airtable 记录 ID，是双向同步的关联键。

## 双向审批同步逻辑

**官网审批 → 飞书：** 官网 PATCH 更新 Airtable 后，异步调 `updateFeedbackInBitable()` 同步 Status 到飞书多维表格。

**飞书审批 → 官网：** 飞书自动化检测 Status 字段变更 → webhook 回调官网 API → 官网更新 Airtable。

**死循环防止：** 飞书自动化规则配置为仅当「修改人为团队成员手动修改」时触发，排除 API 程序修改。这样官网同步到飞书的 API 写入不会触发自动化回调。

## 飞书侧设置步骤

1. 创建企业自建应用（已完成，App ID: `cli_aa96473a77395cd8`）
2. 在应用中开通 Bitable 权限 + 机器人消息权限
3. 发布应用，管理员审批通过
4. 添加群机器人，获取 webhook 地址
5. 创建两个多维表格，按字段结构建列，授权应用编辑权限
6. 配置自动化规则（Phase 4）

## 开发阶段

| 阶段 | 内容 |
|---|---|
| Phase 1 | `larkConfig.ts` + `larkBitable.ts` + `larkNotify.ts` 三个 server 模块 |
| Phase 2 | 改造 `applications/route.ts`、`feedback/route.ts`、`admin/feedback/[id]/route.ts` |
| Phase 3 | `bitable-webhook` 回调路由 |
| Phase 4 | 飞书侧配置自动化规则（需 Phase 3 上线后有可访问的 URL） |

## 关键原则

- Airtable 为主存储，飞书为镜像。Airtable 写入必须先成功。
- 飞书所有操作异步执行，失败静默处理，不影响用户请求。
- 飞书 API 调用使用内存缓存 tenant access token，过期自动刷新。
- Record ID 关联是整个系统的基石，确保两端数据可追溯。
