import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { companies as existingCompanies } from "../src/data/companies.generated";
import {
  deriveEnglishDescription,
  deriveEnglishProducts,
  mapCategoryKeyFromText,
  translateFundingRound,
} from "../src/data/categoryTranslations";
import type { CompanyCategoryKey, FundingInfo, GeocodeStatus, RobotCompany, TeamMember } from "../src/data/companies";

type RawRow = Record<string, unknown>;

type CompanyOverride = Partial<
  Pick<
    RobotCompany,
    | "nameEn"
    | "taglineEn"
    | "descriptionEn"
    | "productsEn"
    | "employeeRange"
    | "longitude"
    | "latitude"
    | "geocodeStatus"
    | "geocodeQuery"
  >
>;

type ImportStats = {
  existingCompanies: number;
  newExcelRows: number;
  addedCompanies: number;
  skippedExistingDuplicates: number;
  skippedNewDuplicates: number;
  skippedMissingLegalName: number;
};

const rootDir = process.cwd();
const defaultInputPath = path.join(rootDir, "data/raw/company-list.xlsx");
const desktopInputPath = "D:/桌面/机器人公司.xlsx";
const overridesPath = path.join(rootDir, "data/company-overrides.json");
const outputPath = path.join(rootDir, "src/data/companies.generated.ts");

const headers = [
  "公司ID",
  "公司简称",
  "工商全称",
  "英文名",
  "官网",
  "一句话简介",
  "公司简介",
  "行业",
  "子行业",
  "省",
  "市",
  "成立时间",
  "运营状态",
  "融资总额（万人民币）",
  "估值（万人民币）",
  "估值（估算-万人民币）",
  "融资时间",
  "轮次",
  "金额",
  "币种",
  "等值人民币（万）",
  "投资机构",
  "地址",
  "团队姓名",
  "职位",
] as const;

async function main() {
  const inputPath = await resolveInputPath();
  if (!inputPath) {
    console.warn(`[import-companies] Missing Excel file: ${defaultInputPath}`);
    console.warn(`[import-companies] Missing Excel file: ${desktopInputPath}`);
    console.warn("[import-companies] Existing generated data was left unchanged.");
    return;
  }

  const rows = readWorkbookRows(inputPath);
  const overrides = await readOverrides();
  const existingLegalNames = new Set(existingCompanies.map((company) => normalizeLegalName(company.legalNameZh)));
  const seenNewLegalNames = new Set<string>();
  const usedIds = new Set(existingCompanies.map((company) => company.id));
  const stats: ImportStats = {
    existingCompanies: existingCompanies.length,
    newExcelRows: rows.length,
    addedCompanies: 0,
    skippedExistingDuplicates: 0,
    skippedNewDuplicates: 0,
    skippedMissingLegalName: 0,
  };

  const additions: RobotCompany[] = [];

  rows.forEach((row, index) => {
    const legalName = readText(row, "工商全称");
    const normalizedLegalName = normalizeLegalName(legalName);

    if (!normalizedLegalName) {
      stats.skippedMissingLegalName += 1;
      return;
    }

    if (existingLegalNames.has(normalizedLegalName)) {
      stats.skippedExistingDuplicates += 1;
      return;
    }

    if (seenNewLegalNames.has(normalizedLegalName)) {
      stats.skippedNewDuplicates += 1;
      return;
    }

    seenNewLegalNames.add(normalizedLegalName);
    const company = createCompany(row, index, usedIds);
    additions.push(applyOverride(company, overrides[company.id]));
    stats.addedCompanies += 1;
  });

  const finalCompanies = [...existingCompanies, ...additions];
  await fs.writeFile(outputPath, renderCompanies(finalCompanies), "utf8");

  console.log(`[import-companies] Input workbook: ${inputPath}`);
  console.log(`[import-companies] Existing companies count: ${stats.existingCompanies}`);
  console.log(`[import-companies] New Excel row count: ${stats.newExcelRows}`);
  console.log(`[import-companies] Added companies count: ${stats.addedCompanies}`);
  console.log(`[import-companies] Skipped existing duplicate count: ${stats.skippedExistingDuplicates}`);
  console.log(`[import-companies] Skipped duplicate rows inside new Excel count: ${stats.skippedNewDuplicates}`);
  console.log(`[import-companies] Skipped rows missing 工商全称 count: ${stats.skippedMissingLegalName}`);
  console.log(`[import-companies] Final companies count: ${finalCompanies.length}`);
  console.log(`[import-companies] Wrote ${path.relative(rootDir, outputPath)}.`);
}

async function resolveInputPath() {
  const candidates = [process.argv[2], process.env.COMPANY_IMPORT_FILE, desktopInputPath, defaultInputPath].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (await fileExists(resolved)) {
      return resolved;
    }
  }

  return undefined;
}

function readWorkbookRows(inputPath: string) {
  const workbook = XLSX.readFile(inputPath, { cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => {
    const firstRow = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
      header: 1,
      defval: "",
      raw: false,
    })[0];
    return Array.isArray(firstRow) && firstRow.map((value) => String(value ?? "").trim()).includes("工商全称");
  });

  if (!sheetName) {
    throw new Error("The workbook does not contain a worksheet with the 工商全称 header.");
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });

  return normalizeRows(matrix);
}

function normalizeRows(matrix: unknown[][]) {
  const headerRow = matrix[0]?.map((value) => String(value ?? "").trim()) ?? [];
  const columnIndex = new Map<string, number>();

  headers.forEach((header) => {
    const index = headerRow.indexOf(header);
    if (index !== -1) {
      columnIndex.set(header, index);
    }
  });

  return matrix.slice(1).map((row) => {
    const normalized: RawRow = {};

    headers.forEach((header) => {
      const index = columnIndex.get(header);
      normalized[header] = index === undefined ? "" : row[index] ?? "";
    });

    return normalized;
  });
}

function createCompany(row: RawRow, index: number, usedIds: Set<string>): RobotCompany {
  const legalName = readText(row, "工商全称");
  const shortName = readText(row, "公司简称") || legalName;
  const nameEn = readText(row, "英文名");
  const industryZh = readText(row, "行业");
  const subIndustryZh = readText(row, "子行业");
  const taglineZh = readText(row, "一句话简介");
  const descriptionZh = readText(row, "公司简介");
  const province = readText(row, "省");
  const city = readText(row, "市");
  const foundedAt = readDateText(row, "成立时间");
  const categoryKey = mapCategoryKey(industryZh, subIndustryZh);
  const latestFunding = buildFunding(row);
  const valuationNumber = readNumber(row, "估值（万人民币）");
  const valuationText = readText(row, "估值（万人民币）");
  const estimatedValuation = readNumber(row, "估值（估算-万人民币）");
  const productsZh = deriveProductsZh(industryZh, subIndustryZh, taglineZh, descriptionZh);
  const productsEn = deriveEnglishProducts({
    categoryKey,
    industryZh,
    productsZh,
    subIndustryZh,
  });
  const id = resolveCompanyId(readText(row, "公司ID"), legalName, index, usedIds);
  const displayNameEn = nameEn || undefined;
  const descriptionEn = deriveEnglishDescription({
    categoryKey,
    city,
    companyName: displayNameEn || shortName,
    industryZh,
    province,
    subIndustryZh,
  });
  const team = buildTeam(row);

  return {
    id,
    slug: slugify(displayNameEn || shortName || id),
    nameZh: shortName,
    nameEn: displayNameEn,
    legalNameZh: legalName,
    website: normalizeWebsite(readText(row, "官网")),
    taglineZh: taglineZh || undefined,
    descriptionZh: descriptionZh || taglineZh || undefined,
    descriptionEn,
    industryZh: industryZh || undefined,
    subIndustryZh: subIndustryZh || undefined,
    categoryKey,
    province,
    city,
    addressZh: readText(row, "地址") || undefined,
    foundedAt: foundedAt || undefined,
    foundedYear: extractYear(foundedAt),
    statusZh: readText(row, "运营状态") || undefined,
    financingTotalCnyWan: readNumber(row, "融资总额（万人民币）"),
    valuationCnyWan: valuationNumber ?? (valuationText || undefined),
    estimatedValuationCnyWan: estimatedValuation,
    latestFunding,
    team,
    productsZh,
    productsEn,
    geocodeStatus: "missing",
  };
}

function buildFunding(row: RawRow): FundingInfo | undefined {
  const date = readDateText(row, "融资时间");
  const roundZh = readText(row, "轮次");
  const amount = readText(row, "金额");
  const currency = readText(row, "币种");
  const investors = splitValues(readText(row, "投资机构"));
  const amountCnyWan = readNumber(row, "等值人民币（万）") ?? parseCnyAmount(amount, currency);

  if (!date && !roundZh && !amount && !currency && investors.length === 0 && typeof amountCnyWan !== "number") {
    return undefined;
  }

  return {
    date: date || undefined,
    roundZh: roundZh || undefined,
    roundEn: roundZh ? translateFundingRound(roundZh) : undefined,
    amount: amount || undefined,
    currency: currency || undefined,
    amountCnyWan,
    investors,
  };
}

function buildTeam(row: RawRow): TeamMember[] | undefined {
  const name = readText(row, "团队姓名");
  const title = readText(row, "职位");
  if (!name && !title) {
    return undefined;
  }

  return [
    {
      name: name || "未知",
      title: title || "团队成员",
    },
  ];
}

function mapCategoryKey(industryZh: string, subIndustryZh: string): CompanyCategoryKey {
  return mapCategoryKeyFromText(`${industryZh} ${subIndustryZh}`);
}

function deriveProductsZh(industryZh: string, subIndustryZh: string, taglineZh: string, descriptionZh: string) {
  const values = splitValues(subIndustryZh || industryZh);
  const text = `${industryZh} ${subIndustryZh} ${taglineZh} ${descriptionZh}`;
  const inferred = [
    "工业机器人",
    "人形机器人",
    "服务机器人",
    "医疗机器人",
    "物流机器人",
    "特种机器人",
    "核心零部件",
    "零部件与供应链",
    "系统与软件",
    "智能制造",
    "人工智能",
  ].filter((tag) => text.includes(tag));

  return uniqueValues([...values, ...inferred]);
}

function applyOverride(company: RobotCompany, override: CompanyOverride | undefined): RobotCompany {
  if (!override) {
    return company;
  }

  return {
    ...company,
    ...override,
    descriptionEn: override.descriptionEn ?? company.descriptionEn,
    productsEn: override.productsEn ?? company.productsEn,
  };
}

async function readOverrides() {
  if (!(await fileExists(overridesPath))) {
    return {} as Record<string, CompanyOverride>;
  }

  return JSON.parse(await fs.readFile(overridesPath, "utf8")) as Record<string, CompanyOverride>;
}

function renderCompanies(companies: RobotCompany[]) {
  const serializedCompanies = JSON.stringify(JSON.stringify(companies, null, 2));
  return `import type { RobotCompany } from "./companies";\n\nexport const companies = JSON.parse(${serializedCompanies}) as RobotCompany[];\n`;
}

function resolveCompanyId(explicitId: string, legalName: string, index: number, usedIds: Set<string>) {
  const fallbackId = `import-${hashString(normalizeLegalName(legalName) || `row-${index + 1}`)}`;
  const baseId = explicitId || fallbackId;
  let candidate = baseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function normalizeLegalName(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/\u3000/g, " ")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

function readText(row: RawRow, key: string) {
  const value = row[key];
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text === "-" ? "" : text;
}

function readDateText(row: RawRow, key: string) {
  const value = row[key];
  return value instanceof Date ? value.toISOString().slice(0, 10) : readText(row, key);
}

function readNumber(row: RawRow, key: string) {
  return parseNumber(readText(row, key));
}

function parseCnyAmount(amount: string, currency: string) {
  return currency.includes("人民币") || currency.toUpperCase() === "CNY" ? parseNumber(amount) : undefined;
}

function parseNumber(value: string) {
  const normalized = value.replaceAll(",", "").replace(/[^\d.-]/g, "");
  if (!normalized) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function extractYear(value: string) {
  return value.match(/\d{4}/)?.[0];
}

function splitValues(value: string) {
  return uniqueValues(
    value
      .split(/[、，,;；]/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeWebsite(value: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function slugify(value: string) {
  const ascii = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || encodeURIComponent(value.trim()).replace(/%/g, "").toLowerCase();
}

function hashString(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
