# 网站精简与支付接入设计

日期: 2026-05-18

## 定位

网站的核心作用是：展示展厅供应链优势 → 引导用户预约体验 → 完成在线支付。

## 页面结构

| 页面 | 路由 | 作用 |
|---|---|---|
| 首页 | `/` | 展厅供应链优势总览，引导进入预约 |
| 展厅介绍 | `/showroom` | 展厅详情 + 照片 |
| 产业基础 | `/foundation` | 供应链优势（合并被删页面的精华内容） |
| 参观流程 | `/visit` | 三步流程说明 |
| 体验预约 | `/payment` | 价格说明 + 报名表单 + 第三方支付 |
| 企业详情 | `/company/[id]` | 企业信息（保留，不改动） |
| 使用条款 | `/terms` | 合规页（保留） |
| 隐私政策 | `/privacy` | 合规页（保留） |

## 删除

### 页面

- `src/app/[locale]/innovation/page.tsx`
- `src/app/[locale]/collaboration/page.tsx`
- `src/app/[locale]/partners/page.tsx`
- `src/app/[locale]/apply/page.tsx`
- `src/app/[locale]/apply/success/page.tsx`

### 翻译命名空间

`messages/{zh,en}.json` 中移除：
- `InnovationPage`
- `CollaborationPage`
- `PartnersPage`
- `ApplyPage`
- `ApplySuccessPage`

## Foundation 页面扩充

从被删页面中选取精华内容移入，结构：

```
产业基础 Foundation
├── Hero + 关键数据 (200+企业 / 90%本地 / 3km / 1000+专利)
├── 完整产业链 (4项编号卡片)           ← 已有
├── 创新平台 (3项卡片)                 ← 来自 Innovation
├── 协同模式 (5项编号卡片)             ← 来自 Collaboration
├── 合作伙伴生态 (6项网格卡片)         ← 来自 Partners
└── CTA 底部：预约体验 → /payment
```

翻译文件处理：将这些模块对应的翻译从 `InnovationPage`/`CollaborationPage`/`PartnersPage` 命名空间移入 `FoundationPage` 下，保持 key 结构一一对应。

## 导航栏精简

```
首页 | 展厅介绍 | 参观流程 | [CTA: 预约体验] [语言切换]
```

Footer 改为三列：

```
探索              参观              信息
├─ 展厅介绍        ├─ 参观流程        ├─ 关于我们 → /foundation
└─ 关于我们        └─ 体验预约        ├─ 使用条款 → /terms
                                      ├─ 隐私政策 → /privacy
                                      └─ 联系我们 → mailto:contact@robotvalley.cn
```

## 体验预约页合并

`/payment` 页面整合原 `/apply` 的报名表单：

```
体验预约 /payment
├── Hero: 价格说明 (100元/人) + 体验内容 (3项权益)
├── 报名表单: 姓名、机构、邮箱、电话、参观日期、参观人数、留言
├── 确认付款区: 提交表单后调用第三方支付 API
└── 支付结果处理: 成功 → 确认页面 / 失败 → 错误提示
```

### 支付流程

1. 用户填写报名表单并提交
2. 后端验证字段
3. 调用第三方支付 API 创建订单（payment API 的具体集成方式待确定支付服务商后再实现）
4. 前端根据支付结果展示（支付中/成功/失败）
5. 同步提交报名信息至 Airtable（复用现有 `src/server/airtableApplications.ts`）

### 支付 API 预留

新增 `src/app/api/payment/route.ts`，预留以下端点结构：

```
POST /api/payment/create   → 创建支付订单，返回支付参数
POST /api/payment/notify   → 支付回调 webhook
```

具体实现依赖选择的支付服务商（微信支付/支付宝/Stripe 等），本次先保留接口骨架和占位。

## 翻译精简

合并后的翻译命名空间：

| 命名空间 | 说明 |
|---|---|
| `Metadata` | SEO 元数据 |
| `Header` | 导航栏 |
| `LanguageSwitcher` | 语言切换 |
| `Landing` | 首页 |
| `ShowroomPage` | 展厅页 |
| `FoundationPage` | 产业基础（含被删页面移入的模块） |
| `VisitPage` | 参观流程 |
| `PaymentPage` | 体验预约（含原 ApplyPage 内容） |
| `ApplicationForm` | 表单字段与状态 |
| `CompanyDetails` | 企业详情卡片 |
| `CompanyPage` | 企业详情页 |
| `Footer` | 页脚 |

## 不做

- 不改变设计系统（颜色、字体、间距沿用现有 Tailwind 配置）
- 不改变 i18n 架构（仍用 next-intl）
- 不改变企业数据管道
- 不删除 Company/Showroom/Visit 页面的现有内容
