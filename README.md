# Shenzhen Nanshan Robotics Company Atlas

A bilingual company directory and map focused on robotics-related companies located in Nanshan District, Shenzhen. The project uses Excel company data, address geocoding, category-based markers, Next.js App Router, TypeScript, Tailwind CSS, next-intl, and the AMap JavaScript API.

Chinese positioning: 深圳南山机器人公司图谱.

English positioning: Shenzhen Nanshan Robotics Company Atlas.

## Routes

The app uses locale-prefixed routes. Chinese is the default locale. The public map and homepage focus on companies whose city is 深圳 / 深圳市 and whose address contains 南山区.

- `/` redirects to `/zh`
- `/zh` and `/en`
- `/zh/map` and `/en/map`
- `/zh/company/[id]` and `/en/company/[id]`

## Local Development

```bash
npm install
npm run dev
npm run build
```

## Importing Company Data

The importer is append-only. It reads the existing generated dataset first, then reads a new Excel workbook and adds only companies whose `工商全称` does not already exist.

Run with the default source lookup:

```bash
npm run import:companies
```

Default lookup order:

1. `COMPANY_IMPORT_FILE`
2. `D:/桌面/机器人公司.xlsx`
3. `data/raw/company-list.xlsx`

You can also pass a workbook path explicitly:

```bash
npm run import:companies -- "D:/桌面/机器人公司.xlsx"
```

The importer reads the first worksheet with a `工商全称` header and writes:

```text
src/data/companies.generated.ts
```

Duplicate detection uses `工商全称` only. Before comparison, the legal name is normalized by trimming whitespace, collapsing repeated spaces, normalizing full-width/half-width spaces, and normalizing Chinese/English parentheses.

Append behavior:

- If `工商全称` already exists in the generated dataset, the row is skipped completely.
- Existing companies are never merged, updated, or overwritten.
- `英文名`, `官网`, `地址`, funding, team, and all other fields on existing companies remain unchanged.
- If multiple rows in the new Excel have the same `工商全称`, only the first new row is added; later duplicate rows are skipped.
- Rows with empty `工商全称` are skipped.
- If `公司ID` is empty for a new company, the importer creates a stable generated id from `工商全称`.

The public generated data intentionally does not include `统一信用代码`, `电话`, or `邮箱`.

After importing new companies, run geocoding so new rows can receive coordinates:

```bash
npm run geocode:companies
```

The geocoder skips existing exact coordinates unless `REFRESH_EXACT=1` is set.

## Actual Excel Column Mapping

The import workbook uses these headers:

- `公司ID` -> `id`
- `公司简称` -> `nameZh`
- `工商全称` -> `legalNameZh`
- `英文名` -> `nameEn`
- `官网` -> `website`
- `一句话简介` -> `taglineZh`
- `公司简介` -> `descriptionZh`
- `行业` -> `industryZh`
- `子行业` -> `subIndustryZh`, `productsZh`, `categoryKey`
- `省` -> `province`
- `市` -> `city`
- `地址` -> `addressZh`
- `成立时间` -> `foundedAt`, `foundedYear`
- `运营状态` -> `statusZh`
- `融资总额（万人民币）` -> `financingTotalCnyWan`
- `估值（万人民币）` -> `valuationCnyWan`
- `估值（估算-万人民币）` -> `estimatedValuationCnyWan`
- `融资时间`, `轮次`, `金额`, `币种`, `等值人民币（万）`, `投资机构` -> `latestFunding`
- `团队姓名`, `职位` -> optional `team`

## English Display Logic

Company-specific English names come from the Excel `英文名` column. On English pages, the UI uses:

- `nameEn` first, then `nameZh` as fallback
- `descriptionEn` from `data/company-overrides.json` when present
- Otherwise, a safe generated English description based on company name, province/city, and industry/category
- English province/city labels from `src/data/locationTranslations.ts`
- English industry/category/status/funding round labels from `src/data/categoryTranslations.ts`
- English products from manual overrides first, then category/subindustry fallback tags

On Chinese pages, the original Chinese fields remain the primary display.

## Manual Overrides

Add reviewed English content or exact coordinates in:

```text
data/company-overrides.json
```

Example:

```json
{
  "71075": {
    "nameEn": "Sevnce Robotics Co., Ltd.",
    "descriptionEn": "Sevnce Robotics is a special-purpose robotics company based in Chongqing, focusing on inspection and emergency-response robots for petrochemical, power, and hazardous environments.",
    "productsEn": [
      "Explosion-Proof Wheeled Inspection Robots",
      "Quadruped Inspection Robots"
    ],
    "employeeRange": "200-499",
    "longitude": 113.9304,
    "latitude": 22.5333,
    "geocodeStatus": "exact"
  }
}
```

Manual coordinates take priority over geocoding results. Re-run `npm run import:companies` after changing English text overrides for new records.

## Geocoding

Geocoding is a Node.js pre-deployment workflow only. The browser never geocodes company addresses.

Create an AMap Web Service key in the AMap developer console, keep it server-only, and add it to `.env.local`:

```env
AMAP_WEB_SERVICE_KEY=your_web_service_key
```

Then run:

```bash
npm run geocode:companies
```

For large datasets, run geocoding slowly so the AMap Web Service API does not reject requests with QPS errors:

```bash
GEOCODE_DELAY_MS=500 npm run geocode:companies
```

`GEOCODE_DELAY_MS` controls the delay between AMap requests. The default is `500` milliseconds. If you still see `10021 CUQPS_HAS_EXCEEDED_THE_LIMIT`, increase it, for example:

```bash
GEOCODE_DELAY_MS=1000 npm run geocode:companies
```

The script reads `src/data/companies.generated.ts`, caches responses in `data/geocode-cache.json`, and writes:

```text
src/data/company-coordinates.generated.json
```

Address geocoding is attempted before city fallback, in this order:

1. `省 + 市 + 地址`
2. `市 + 地址`
3. `地址`
4. `省 + 市 + 公司简称`
5. `市 + 公司简称`

If address geocoding succeeds, `geocodeStatus` is `exact`. If address queries fail but city-level geocoding succeeds, status is `cityFallback`. If no coordinate is found, status is `missing`.

The geocoding script is resumable:

- Successful coordinate results are written to `data/geocode-cache.json` during the run.
- If the script stops halfway, run `npm run geocode:companies` again and cached successful results will be reused.
- Existing generated exact coordinates are skipped unless `REFRESH_EXACT=1` is set.
- Existing city-level fallback coordinates are skipped unless `REFRESH_CITY_FALLBACK=1` is set.
- QPS/rate-limit errors are not cached as permanent failures.

To retry only entries that are currently city-level fallbacks:

```bash
REFRESH_CITY_FALLBACK=1 GEOCODE_DELAY_MS=1000 npm run geocode:companies
```

For local demos where external geocoding is not allowed, you can generate approximate city/province fallback coordinates without calling AMap:

```bash
LOCAL_GEOCODE_FALLBACK=1 npm run geocode:companies
```

## AMap JavaScript API

Create `.env.local`:

```env
NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key
NEXT_PUBLIC_AMAP_SECURITY_CODE=your_amap_security_code
```

Only `NEXT_PUBLIC_*` values are exposed to the frontend. `AMAP_WEB_SERVICE_KEY` is used only by the Node geocoding script.

The map components are client-only and the app still builds without AMap variables. If a key is missing, the UI shows a localized fallback.

## Internationalization

Translations live in:

```text
messages/zh.json
messages/en.json
```

When adding UI text, add keys to both files and use `next-intl` from the localized App Router pages/components.

## Company Categories

Company filtering and marker styling use stable `categoryKey` values, not translated labels. The import script maps `行业` and `子行业` into category keys using helpers in `src/data/categoryTranslations.ts`.
