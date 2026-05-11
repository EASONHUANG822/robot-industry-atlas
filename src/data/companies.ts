import coordinates from "./company-coordinates.generated.json";
import { companies as generatedCompanies } from "./companies.generated";
import {
  deriveEnglishDescription,
  deriveEnglishProducts,
  translateFundingRound,
  translateIndustryLabel,
  translateStatus,
} from "./categoryTranslations";
import { translateCity, translateProvince } from "./locationTranslations";

export type CompanyCategoryKey =
  | "industrial"
  | "humanoid"
  | "service"
  | "medical"
  | "logistics"
  | "special"
  | "research"
  | "components"
  | "ai"
  | "other";

export type GeocodeStatus = "exact" | "cityFallback" | "missing";

export type CategoryStyle = {
  key: CompanyCategoryKey;
  labelZh: string;
  labelEn: string;
  color: string;
  background: string;
  symbol: string;
  shape: "circle" | "diamond" | "square";
};

export type FundingInfo = {
  date?: string;
  roundZh?: string;
  roundEn?: string;
  amount?: string;
  currency?: string;
  amountCnyWan?: number;
  investors?: string[];
};

export type TeamMember = {
  name: string;
  title: string;
};

export type RobotCompany = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  legalNameZh?: string;
  website?: string;
  taglineZh?: string;
  taglineEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  industryZh?: string;
  subIndustryZh?: string;
  categoryKey: CompanyCategoryKey;
  province: string;
  city: string;
  addressZh?: string;
  addressEn?: string;
  foundedAt?: string;
  foundedYear?: string;
  statusZh?: string;
  statusEn?: string;
  financingTotalCnyWan?: number;
  valuationCnyWan?: number | string;
  estimatedValuationCnyWan?: number;
  latestFunding?: FundingInfo;
  team?: TeamMember[];
  productsZh: string[];
  productsEn?: string[];
  employeeRange?: string;
  longitude?: number;
  latitude?: number;
  geocodeStatus?: GeocodeStatus;
  geocodeQuery?: string;
};

export type LocalizedCompany = {
  id: string;
  slug: string;
  name: string;
  nameZh: string;
  legalNameZh?: string;
  category: string;
  categoryKey: CompanyCategoryKey;
  province: string;
  city: string;
  address?: string;
  coordinates?: [number, number];
  foundedAt?: string;
  foundedYear?: string;
  status?: string;
  website?: string;
  tagline?: string;
  description?: string;
  industry?: string;
  subIndustry?: string;
  financingTotalCnyWan?: number;
  valuationCnyWan?: number | string;
  estimatedValuationCnyWan?: number;
  latestFunding?: FundingInfo;
  team?: TeamMember[];
  products: string[];
  employeeRange?: string;
  geocodeStatus?: GeocodeStatus;
  geocodeQuery?: string;
};

export const categoryStyles = {
  industrial: {
    key: "industrial",
    labelZh: "工业机器人",
    labelEn: "Industrial Robots",
    color: "#2563eb",
    background: "#dbeafe",
    symbol: "I",
    shape: "square",
  },
  humanoid: {
    key: "humanoid",
    labelZh: "人形机器人",
    labelEn: "Humanoid Robots",
    color: "#7c3aed",
    background: "#ede9fe",
    symbol: "H",
    shape: "circle",
  },
  service: {
    key: "service",
    labelZh: "服务机器人",
    labelEn: "Service Robots",
    color: "#16a34a",
    background: "#ccfbf1",
    symbol: "S",
    shape: "circle",
  },
  medical: {
    key: "medical",
    labelZh: "医疗机器人",
    labelEn: "Medical Robots",
    color: "#dc2626",
    background: "#fee2e2",
    symbol: "+",
    shape: "circle",
  },
  logistics: {
    key: "logistics",
    labelZh: "物流机器人",
    labelEn: "Logistics Robots",
    color: "#f97316",
    background: "#ffedd5",
    symbol: "L",
    shape: "diamond",
  },
  special: {
    key: "special",
    labelZh: "特种机器人",
    labelEn: "Special Robots",
    color: "#ca8a04",
    background: "#ffe4e6",
    symbol: "X",
    shape: "diamond",
  },
  research: {
    key: "research",
    labelZh: "研究机构",
    labelEn: "Research Institutes",
    color: "#4f46e5",
    background: "#cffafe",
    symbol: "R",
    shape: "square",
  },
  components: {
    key: "components",
    labelZh: "零部件与供应链",
    labelEn: "Components / Supply Chain",
    color: "#6b7280",
    background: "#ecfccb",
    symbol: "C",
    shape: "diamond",
  },
  ai: {
    key: "ai",
    labelZh: "人工智能",
    labelEn: "AI",
    color: "#06b6d4",
    background: "#f3e8ff",
    symbol: "A",
    shape: "square",
  },
  other: {
    key: "other",
    labelZh: "其他",
    labelEn: "Other",
    color: "#475569",
    background: "#e2e8f0",
    symbol: "O",
    shape: "circle",
  },
} satisfies Record<CompanyCategoryKey, CategoryStyle>;

export const categoryKeys = Object.keys(categoryStyles) as CompanyCategoryKey[];
export const categories = categoryKeys;

export function isCompanyCategoryKey(value: unknown): value is CompanyCategoryKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(categoryStyles, value);
}

export function normalizeCategoryKey(value: unknown): CompanyCategoryKey {
  return isCompanyCategoryKey(value) ? value : "other";
}

export function getCategoryStyle(categoryKey: unknown): CategoryStyle {
  return categoryStyles[normalizeCategoryKey(categoryKey)];
}

const coordinateMap = coordinates as Record<
  string,
  {
    longitude?: number;
    latitude?: number;
    geocodeStatus?: GeocodeStatus;
    geocodeQuery?: string;
  }
>;

export const companies: RobotCompany[] = generatedCompanies.map((company) => {
  const coordinate = coordinateMap[company.id];
  const companyHasExactOverride =
    company.geocodeStatus === "exact" && typeof company.longitude === "number" && typeof company.latitude === "number";

  return {
    ...company,
    longitude: companyHasExactOverride ? company.longitude : coordinate?.longitude ?? company.longitude,
    latitude: companyHasExactOverride ? company.latitude : coordinate?.latitude ?? company.latitude,
    geocodeStatus: companyHasExactOverride ? company.geocodeStatus : coordinate?.geocodeStatus ?? company.geocodeStatus,
    geocodeQuery: companyHasExactOverride ? company.geocodeQuery : coordinate?.geocodeQuery ?? company.geocodeQuery,
  };
});

export const provinces = Array.from(new Set(companies.map((company) => company.province).filter(Boolean))).sort();

export function getCompanyById(id: string) {
  return companies.find((company) => company.id === id || company.slug === id);
}

export function localizeCompany(company: RobotCompany, locale: "zh" | "en"): LocalizedCompany {
  const isZh = locale === "zh";
  const categoryKey = normalizeCategoryKey(company.categoryKey);
  const category = getCategoryLabel(categoryKey, locale);
  const name = isZh ? company.nameZh : company.nameEn || company.nameZh;
  const description = isZh
    ? company.descriptionZh
    : company.descriptionEn ||
      deriveEnglishDescription({
        categoryKey,
        city: company.city,
        companyName: company.nameEn || company.nameZh,
        industryZh: company.industryZh,
        province: company.province,
        subIndustryZh: company.subIndustryZh,
      }) ||
      company.descriptionZh;
  const tagline = isZh ? company.taglineZh : company.taglineEn || company.taglineZh;
  const products = isZh
    ? company.productsZh
    : company.productsEn?.length
      ? company.productsEn
      : deriveEnglishProducts({
          categoryKey,
          industryZh: company.industryZh,
          productsZh: company.productsZh,
          subIndustryZh: company.subIndustryZh,
        }) || company.productsZh;
  const status = isZh ? company.statusZh : company.statusEn || translateStatus(company.statusZh, locale);
  const address = isZh ? company.addressZh : company.addressEn || company.addressZh;
  const latestFunding = localizeFunding(company.latestFunding, locale);
  const coordinates =
    company.geocodeStatus !== "missing" && typeof company.longitude === "number" && typeof company.latitude === "number"
      ? ([company.longitude, company.latitude] as [number, number])
      : undefined;

  return {
    id: company.id,
    slug: company.slug,
    name,
    nameZh: company.nameZh,
    legalNameZh: company.legalNameZh,
    category,
    categoryKey,
    province: translateProvince(company.province, locale),
    city: translateCity(company.city, locale),
    address,
    coordinates,
    foundedAt: company.foundedAt,
    foundedYear: company.foundedYear,
    status,
    website: company.website,
    tagline,
    description,
    industry: translateIndustryLabel(company.industryZh, locale),
    subIndustry: translateIndustryLabel(company.subIndustryZh, locale),
    financingTotalCnyWan: company.financingTotalCnyWan,
    valuationCnyWan: company.valuationCnyWan,
    estimatedValuationCnyWan: company.estimatedValuationCnyWan,
    latestFunding,
    team: company.team,
    products,
    employeeRange: company.employeeRange,
    geocodeStatus: company.geocodeStatus,
    geocodeQuery: company.geocodeQuery,
  };
}

export function getCategoryLabel(categoryKey: unknown, locale: "zh" | "en") {
  const normalizedCategoryKey = normalizeCategoryKey(categoryKey);
  const labels: Record<CompanyCategoryKey, { zh: string; en: string }> = {
    industrial: { zh: "智能制造", en: "Intelligent Manufacturing" },
    humanoid: { zh: "机器人本体", en: "Robot Makers" },
    service: { zh: "服务机器人", en: "Service Robots" },
    medical: { zh: "医疗机器人", en: "Medical Robots" },
    logistics: { zh: "物流与移动机器人", en: "Logistics & Mobile Robots" },
    special: { zh: "特种机器人", en: "Special-Purpose Robots" },
    research: { zh: "系统与软件", en: "Systems & Software" },
    components: { zh: "核心零部件", en: "Core Components" },
    ai: { zh: "AI 与算法", en: "AI & Algorithms" },
    other: { zh: "其他机器人相关企业", en: "Other Robotics Companies" },
  };

  return labels[normalizedCategoryKey][locale];
}

export function getProvinceLabel(province: string, locale: "zh" | "en" = "zh") {
  return translateProvince(province, locale);
}

export function isNanshanShenzhenCompany(company: Pick<RobotCompany, "addressZh" | "city">) {
  const city = normalizeLocationText(company.city);
  const address = company.addressZh?.trim() ?? "";

  if (!address.includes("南山区")) {
    return false;
  }

  const cityMatches = city === "深圳" || city === "深圳市";

  return cityMatches;
}

function normalizeLocationText(value: string | undefined) {
  return value?.trim() ?? "";
}

function localizeFunding(funding: FundingInfo | undefined, locale: "zh" | "en"): FundingInfo | undefined {
  if (!funding || locale === "zh") {
    return funding;
  }

  return {
    ...funding,
    roundEn: funding.roundEn || translateFundingRound(funding.roundZh),
  };
}
