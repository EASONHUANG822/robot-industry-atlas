import type { CompanyCategoryKey } from "./companies";
import { translateCity, translateProvince } from "./locationTranslations";

const categoryKeywords: Array<{ key: CompanyCategoryKey; patterns: string[] }> = [
  { key: "humanoid", patterns: ["人形机器人"] },
  { key: "service", patterns: ["服务机器人"] },
  { key: "industrial", patterns: ["工业机器人"] },
  { key: "medical", patterns: ["医疗机器人"] },
  { key: "logistics", patterns: ["物流机器人", "仓储", "AMR", "AGV"] },
  { key: "special", patterns: ["特种机器人"] },
  { key: "research", patterns: ["研究", "高校", "实验室"] },
  { key: "components", patterns: ["机器人零部件", "核心零部件", "零部件与供应链", "供应链"] },
  { key: "ai", patterns: ["人工智能", "AI基础层", "AI 基础层"] },
];

const labelTranslations: Record<string, string> = {
  机器人: "Robotics",
  机器人本体: "Robot Makers",
  核心零部件: "Key Components",
  系统与软件: "Systems & Software",
  工业机器人: "Industrial Robots",
  人形机器人: "Humanoid Robots",
  服务机器人: "Service Robots",
  医疗机器人: "Medical Robots",
  物流机器人: "Logistics Robots",
  特种机器人: "Special Robots",
  机器人零部件: "Robot Components",
  零部件与供应链: "Components & Supply Chain",
  人工智能: "Artificial Intelligence",
  智能制造: "Intelligent Manufacturing",
  AI基础层: "AI Infrastructure",
  "AI 基础层": "AI Infrastructure",
};

const statusTranslations: Record<string, string> = {
  存续: "Active",
  在业: "Active",
  开业: "Active",
  运营中: "Active",
  注销: "Deregistered",
  吊销: "Revoked",
  迁出: "Moved Out",
  Established: "Established",
};

const fundingRoundTranslations: Record<string, string> = {
  天使轮: "Angel Round",
  "Pre-A轮": "Pre-A",
  "Pre-A": "Pre-A",
  A轮: "Series A",
  B轮: "Series B",
  C轮: "Series C",
  D轮: "Series D",
  战略融资: "Strategic Financing",
  股权融资: "Equity Financing",
  种子轮: "Seed Round",
  未披露: "Undisclosed",
};

const categoryFallbackProducts: Record<CompanyCategoryKey, string[]> = {
  industrial: ["Industrial Robots"],
  humanoid: ["Humanoid Robots"],
  service: ["Service Robots"],
  medical: ["Medical Robots"],
  logistics: ["Logistics Robots"],
  special: ["Special-Purpose Robots"],
  research: ["Robotics Research"],
  components: ["Core Components"],
  ai: ["Artificial Intelligence"],
  other: ["Robotics Solutions"],
};

export function mapCategoryKeyFromText(text: string): CompanyCategoryKey {
  const normalized = text.toLowerCase();
  const match = categoryKeywords.find(({ patterns }) =>
    patterns.some((pattern) => normalized.includes(pattern.toLowerCase())),
  );

  return match?.key ?? "other";
}

export function translateIndustryLabel(value: string | undefined, locale: "zh" | "en") {
  if (!value || locale === "zh") {
    return value;
  }

  return labelTranslations[value] ?? value;
}

export function translateStatus(value: string | undefined, locale: "zh" | "en") {
  if (!value || locale === "zh") {
    return value;
  }

  return statusTranslations[value] ?? value;
}

export function translateFundingRound(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return fundingRoundTranslations[value] ?? value.replace(/轮$/u, " Round");
}

export function deriveEnglishProducts({
  categoryKey,
  industryZh,
  productsZh,
  subIndustryZh,
}: {
  categoryKey: CompanyCategoryKey;
  industryZh?: string;
  productsZh?: string[];
  subIndustryZh?: string;
}) {
  const translated = (productsZh ?? [])
    .map((product) => labelTranslations[product])
    .filter((product): product is string => Boolean(product));
  const subIndustry = subIndustryZh ? labelTranslations[subIndustryZh] : undefined;
  const industry = industryZh ? labelTranslations[industryZh] : undefined;

  return uniqueValues([
    ...translated,
    ...(subIndustry ? [subIndustry] : []),
    ...(industry ? [industry] : []),
    ...categoryFallbackProducts[categoryKey],
  ]);
}

export function deriveEnglishDescription({
  categoryKey,
  city,
  companyName,
  industryZh,
  province,
  subIndustryZh,
}: {
  categoryKey: CompanyCategoryKey;
  city?: string;
  companyName: string;
  industryZh?: string;
  province?: string;
  subIndustryZh?: string;
}) {
  const cityEn = translateCity(city, "en");
  const provinceEn = translateProvince(province, "en");
  const sector =
    translateIndustryLabel(subIndustryZh, "en") ??
    translateIndustryLabel(industryZh, "en") ??
    categoryFallbackProducts[categoryKey][0] ??
    "robotics";
  const location = [cityEn, provinceEn].filter(Boolean).join(", ");

  return `${companyName} is a robotics-related company${location ? ` based in ${location}` : ""}, operating in the ${sector} sector.`;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
