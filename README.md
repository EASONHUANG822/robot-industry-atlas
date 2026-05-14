# 深圳机器人谷 / Shenzhen Robot Valley

深圳机器人谷产业展示平台，依托南山智谷大厦，面向机器人展示、技术体验与产业交流。

A bilingual showcase platform for Shenzhen's robotics industry, centered on Nanshan Zhigu Industrial Park.

## 技术栈 / Tech Stack

- **框架**: [Next.js 15](https://nextjs.org/) + [React 19](https://react.dev/)
- **语言**: TypeScript
- **样式**: [Tailwind CSS 3](https://tailwindcss.com/)
- **国际化**: [next-intl](https://next-intl.dev/) (中文 / English)

## 路由 / Routes

应用使用 locale 前缀路由，中文为默认语言：

- `/` → 重定向到 `/zh`
- `/zh` / `/en` — 首页
- `/zh/apply` / `/en/apply` — 参观申请
- `/zh/company/[id]` / `/en/company/[id]` — 企业详情

## 本地开发 / Local Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## 导入企业数据 / Importing Company Data

导入器为追加模式，读取已有生成数据后，从 Excel 中只添加 `工商全称` 尚不存在的企业。

```bash
npm run import:companies
```

默认查找顺序：

1. `COMPANY_IMPORT_FILE` 环境变量
2. `D:/桌面/机器人公司.xlsx`
3. `data/raw/company-list.xlsx`

也可显式传入路径：

```bash
npm run import:companies -- "D:/桌面/机器人公司.xlsx"
```

导入器读取第一个包含 `工商全称` 表头的工作表，写入 `src/data/companies.generated.ts`。以 `工商全称` 去重，已存在的企业不会更新或覆盖。`公司ID` 为空时自动生成。

### Excel 列映射

| Excel 列 | 字段 |
|----------|------|
| `公司ID` | `id` |
| `公司简称` | `nameZh` |
| `工商全称` | `legalNameZh` |
| `英文名` | `nameEn` |
| `官网` | `website` |
| `一句话简介` | `taglineZh` |
| `公司简介` | `descriptionZh` |
| `行业` | `industryZh` |
| `子行业` | `subIndustryZh`, `productsZh`, `categoryKey` |
| `省` | `province` |
| `市` | `city` |
| `地址` | `addressZh` |
| `成立时间` | `foundedAt`, `foundedYear` |
| `运营状态` | `statusZh` |
| `融资总额（万人民币）` | `financingTotalCnyWan` |
| `估值（万人民币）` | `valuationCnyWan` |
| `估值（估算-万人民币）` | `estimatedValuationCnyWan` |
| `融资时间`, `轮次`, `金额`, `币种`, `等值人民币（万）`, `投资机构` | `latestFunding` |
| `团队姓名`, `职位` | `team`（可选） |

## 地理编码 / Geocoding

地理编码为 Node.js 预部署脚本，浏览器端不做地址编码。

在 AMap 开发者控制台创建 Web Service Key，配置 `.env.local`：

```env
AMAP_WEB_SERVICE_KEY=your_web_service_key
```

```bash
npm run geocode:companies
```

大量数据时建议降低请求频率：

```bash
GEOCODE_DELAY_MS=500 npm run geocode:companies
```

脚本读取 `src/data/companies.generated.ts`，缓存结果至 `data/geocode-cache.json`，写入 `src/data/company-coordinates.generated.json`。

地址编码优先级：`省+市+地址` → `市+地址` → `地址` → `省+市+公司简称` → `市+公司简称`。成功后 `geocodeStatus` 为 `exact`，回落至城市级则为 `cityFallback`。

脚本支持断点续传，已缓存的成功结果会被复用。已有精确坐标跳过，除非设置 `REFRESH_EXACT=1`。

本地演示时可不调用外部接口：

```bash
LOCAL_GEOCODE_FALLBACK=1 npm run geocode:companies
```

## 英文展示逻辑 / English Display Logic

英文页面优先使用 `data/company-overrides.json` 中的内容，其次使用 Excel `英文名` 列，最后自动生成英文描述。

## 手动覆盖 / Manual Overrides

在 `data/company-overrides.json` 中添加经过审核的英文内容或精确坐标。

## 国际化 / Internationalization

翻译文件位于：

```
messages/zh.json
messages/en.json
```

新增 UI 文本时需同时添加到两个文件。

## 企业分类 / Company Categories

企业筛选和样式使用稳定的 `categoryKey`，导入脚本通过 `src/data/categoryTranslations.ts` 中的映射将 `行业` 和 `子行业` 转换为分类键值。
