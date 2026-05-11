import fs from "node:fs/promises";
import path from "node:path";
import { companies } from "../src/data/companies.generated";
import type { GeocodeStatus, RobotCompany } from "../src/data/companies";

type CachedResult = {
  longitude?: number;
  latitude?: number;
  geocodeStatus: GeocodeStatus;
  geocodeQuery?: string;
};

type GeocodeStats = {
  total: number;
  processed: number;
  exact: number;
  cityFallback: number;
  missing: number;
  cached: number;
  overridden: number;
  failed: number;
  retried: number;
  rateLimited: number;
  skipped: number;
  addressMissing: number;
};

type CompanyOverride = Partial<
  Pick<RobotCompany, "longitude" | "latitude" | "geocodeStatus" | "geocodeQuery">
>;

type AMapGeocodeResponse = {
  status: string;
  info?: string;
  infocode?: string;
  geocodes?: Array<{
    location?: string;
  }>;
};

const rootDir = process.cwd();
const cachePath = path.join(rootDir, "data/geocode-cache.json");
const overridesPath = path.join(rootDir, "data/company-overrides.json");
const outputPath = path.join(rootDir, "src/data/company-coordinates.generated.json");
const defaultGeocodeDelayMs = 500;
const retryBackoffMs = [2000, 5000, 10000] as const;
const maxRetriesPerCompany = retryBackoffMs.length;

const localCenters: Record<string, [number, number]> = {
  北京: [116.4074, 39.9042],
  上海: [121.4737, 31.2304],
  天津: [117.2009, 39.0842],
  重庆: [106.5516, 29.563],
  河北: [114.5149, 38.0428],
  石家庄: [114.5149, 38.0428],
  山西: [112.5492, 37.8706],
  太原: [112.5492, 37.8706],
  内蒙古: [111.7492, 40.8426],
  呼和浩特: [111.7492, 40.8426],
  辽宁: [123.4291, 41.8057],
  沈阳: [123.4291, 41.8057],
  大连: [121.6147, 38.914],
  吉林: [125.3245, 43.8868],
  长春: [125.3245, 43.8868],
  黑龙江: [126.5349, 45.8038],
  哈尔滨: [126.5349, 45.8038],
  江苏: [118.7969, 32.0603],
  南京: [118.7969, 32.0603],
  苏州: [120.5853, 31.2989],
  无锡: [120.3124, 31.4909],
  常州: [119.9741, 31.8112],
  浙江: [120.1551, 30.2741],
  杭州: [120.1551, 30.2741],
  宁波: [121.5504, 29.8746],
  安徽: [117.2272, 31.8206],
  合肥: [117.2272, 31.8206],
  芜湖: [118.4331, 31.3525],
  福建: [119.2965, 26.0745],
  福州: [119.2965, 26.0745],
  厦门: [118.0894, 24.4798],
  江西: [115.8582, 28.6829],
  南昌: [115.8582, 28.6829],
  山东: [117.1201, 36.6512],
  济南: [117.1201, 36.6512],
  青岛: [120.3826, 36.0671],
  河南: [113.6254, 34.7466],
  郑州: [113.6254, 34.7466],
  湖北: [114.3054, 30.5931],
  武汉: [114.3054, 30.5931],
  湖南: [112.9388, 28.2282],
  长沙: [112.9388, 28.2282],
  广东: [113.2644, 23.1291],
  广州: [113.2644, 23.1291],
  深圳: [114.0579, 22.5431],
  东莞: [113.7518, 23.0207],
  佛山: [113.1214, 23.0215],
  珠海: [113.5767, 22.2707],
  广西: [108.3669, 22.817],
  南宁: [108.3669, 22.817],
  海南: [110.1983, 20.044],
  海口: [110.1983, 20.044],
  四川: [104.0665, 30.5728],
  成都: [104.0665, 30.5728],
  贵州: [106.6302, 26.647],
  贵阳: [106.6302, 26.647],
  云南: [102.8329, 24.8801],
  昆明: [102.8329, 24.8801],
  西藏: [91.1172, 29.6469],
  拉萨: [91.1172, 29.6469],
  陕西: [108.9398, 34.3416],
  西安: [108.9398, 34.3416],
  甘肃: [103.8343, 36.0611],
  兰州: [103.8343, 36.0611],
  青海: [101.7782, 36.6171],
  西宁: [101.7782, 36.6171],
  宁夏: [106.2309, 38.4872],
  银川: [106.2309, 38.4872],
  新疆: [87.6168, 43.8256],
  乌鲁木齐: [87.6168, 43.8256],
  香港: [114.1694, 22.3193],
  澳门: [113.5439, 22.1987],
  台湾: [121.5654, 25.033],
  台北: [121.5654, 25.033],
};

async function main() {
  await loadEnvLocal();
  const stats = createStats(companies.length);
  const hasWebServiceKey = Boolean(process.env.AMAP_WEB_SERVICE_KEY);
  const useLocalFallbackOnly = process.env.LOCAL_GEOCODE_FALLBACK === "1";
  const refreshExact = process.env.REFRESH_EXACT === "1";
  const refreshCityFallback = process.env.REFRESH_CITY_FALLBACK === "1";
  const delayMs = readPositiveIntegerEnv("GEOCODE_DELAY_MS", defaultGeocodeDelayMs);

  console.log(`[geocode-companies] AMAP_WEB_SERVICE_KEY exists: ${hasWebServiceKey ? "yes" : "no"}`);
  console.log(`[geocode-companies] LOCAL_GEOCODE_FALLBACK enabled: ${useLocalFallbackOnly ? "yes" : "no"}`);
  console.log(`[geocode-companies] GEOCODE_DELAY_MS: ${delayMs}`);
  console.log(`[geocode-companies] REFRESH_EXACT enabled: ${refreshExact ? "yes" : "no"}`);
  console.log(`[geocode-companies] REFRESH_CITY_FALLBACK enabled: ${refreshCityFallback ? "yes" : "no"}`);
  console.log(`[geocode-companies] Total companies: ${companies.length}`);
  console.log(
    `[geocode-companies] Companies with addressZh: ${companies.filter((company) => Boolean(company.addressZh)).length}`,
  );

  if (useLocalFallbackOnly) {
    await writeLocalFallbackCoordinates(stats);
    return;
  }

  const key = process.env.AMAP_WEB_SERVICE_KEY;
  if (!key) {
    throw new Error("Missing AMAP_WEB_SERVICE_KEY. Add it before running geocode:companies.");
  }

  const cache = await readCache();
  const overrides = await readOverrides();
  const existingCoordinates = await readExistingCoordinates();
  const coordinates: Record<string, CachedResult> = { ...existingCoordinates };
  let lastRequestAt = 0;

  for (const company of companies) {
    stats.processed += 1;
    const override = normalizeCoordinateOverride(overrides[company.id]);
    if (override) {
      coordinates[company.id] = override;
      stats.overridden += 1;
      recordFinalStatus(stats, override);
      logProgress(stats);
      continue;
    }

    const previous = existingCoordinates[company.id];
    const reusablePrevious = getReusablePreviousCoordinate(previous, company, {
      refreshCityFallback,
      refreshExact,
    });
    if (reusablePrevious) {
      coordinates[company.id] = reusablePrevious;
      stats.skipped += 1;
      stats.cached += 1;
      recordFinalStatus(stats, reusablePrevious);
      logProgress(stats);
      continue;
    }

    if (refreshCityFallback && previous?.geocodeStatus !== "cityFallback") {
      const skipped = findReusableExactCache(cache, company, refreshExact) ?? previous;
      if (skipped) {
        coordinates[company.id] = skipped;
        stats.skipped += 1;
        stats.cached += 1;
        recordFinalStatus(stats, skipped);
        logProgress(stats);
        continue;
      }
    }

    const exactQueries = buildExactQueries(company);
    const cityQuery = buildCityQuery(company);
    const retryState = createRetryState();
    if (!company.addressZh) {
      stats.addressMissing += 1;
    }

    const exact = await geocodeFirstAvailable(cache, stats, company, exactQueries, "exact", {
      delayMs,
      refreshExact,
      refreshCityFallback,
      retryState,
      getLastRequestAt: () => lastRequestAt,
      setLastRequestAt: (value) => {
        lastRequestAt = value;
      },
    });

    if (exact) {
      coordinates[company.id] = exact;
      recordFinalStatus(stats, exact);
      logProgress(stats);
      continue;
    }

    const city = cityQuery
      ? await geocodeWithCache(cache, stats, company.id, cityQuery, company.city, "cityFallback", {
          delayMs,
          refreshExact,
          refreshCityFallback,
          retryState,
          getLastRequestAt: () => lastRequestAt,
          setLastRequestAt: (value) => {
            lastRequestAt = value;
          },
        })
      : undefined;
    const result = city ?? {
      geocodeStatus: "missing",
      geocodeQuery: exactQueries[0] || cityQuery || company.nameZh,
    };
    coordinates[company.id] = result;
    recordFinalStatus(stats, result);
    logProgress(stats);
  }

  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
  await fs.writeFile(outputPath, JSON.stringify(coordinates, null, 2), "utf8");
  logSummary(stats);
  console.log(`[geocode-companies] Wrote ${path.relative(rootDir, outputPath)}.`);
}

async function writeLocalFallbackCoordinates(stats: GeocodeStats) {
  const overrides = await readOverrides();
  const coordinates: Record<string, CachedResult> = {};
  let matched = 0;

  companies.forEach((company) => {
    stats.processed += 1;
    const override = normalizeCoordinateOverride(overrides[company.id]);
    if (override) {
      coordinates[company.id] = override;
      stats.overridden += 1;
      recordFinalStatus(stats, override);
      matched += 1;
      logProgress(stats);
      return;
    }

    const center = findLocalCenter(company.city) ?? findLocalCenter(company.province);
    if (!center) {
      const result: CachedResult = {
        geocodeStatus: "missing",
        geocodeQuery: buildExactQueries(company)[0] || buildCityQuery(company),
      };
      coordinates[company.id] = result;
      recordFinalStatus(stats, result);
      logProgress(stats);
      return;
    }

    const [longitude, latitude] = center;
    const result: CachedResult = {
      longitude: roundCoord(longitude),
      latitude: roundCoord(latitude),
      geocodeStatus: "cityFallback",
      geocodeQuery: buildExactQueries(company)[0] || buildCityQuery(company),
    };
    coordinates[company.id] = result;
    recordFinalStatus(stats, result);
    matched += 1;
    logProgress(stats);
  });

  await fs.writeFile(outputPath, JSON.stringify(coordinates, null, 2), "utf8");
  logSummary(stats);
  console.log(`[geocode-companies] Local fallback wrote ${matched}/${companies.length} coordinate records.`);
  console.log(`[geocode-companies] Wrote ${path.relative(rootDir, outputPath)}.`);
}

function findLocalCenter(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/[省市区县自治区壮族回族维吾尔特别行政]/g, "");
  const exact = localCenters[value] ?? localCenters[normalized];
  if (exact) {
    return exact;
  }

  const match = Object.entries(localCenters).find(([name]) => value.includes(name) || normalized.includes(name));
  return match?.[1];
}

function roundCoord(value: number) {
  return Number(value.toFixed(6));
}

async function geocodeWithCache(
  cache: Record<string, CachedResult>,
  stats: GeocodeStats,
  companyId: string,
  address: string,
  city: string | undefined,
  status: Extract<GeocodeStatus, "exact" | "cityFallback">,
  options: GeocodeRequestOptions,
) {
  const cacheKey = `${companyId}::${address}`;
  const cached = cache[cacheKey];
  if (cached && shouldUseCachedResult(cached, status, options)) {
    stats.cached += 1;
    return hasCoordinates(cached) ? cached : undefined;
  }

  const params = new URLSearchParams({
    key: process.env.AMAP_WEB_SERVICE_KEY ?? "",
    address,
  });
  if (city) params.set("city", city);

  let data: AMapGeocodeResponse;

  while (true) {
    await waitForRateLimit(options);
    options.setLastRequestAt(Date.now());

    try {
      const response = await fetch(`https://restapi.amap.com/v3/geocode/geo?${params.toString()}`);
      data = (await response.json()) as AMapGeocodeResponse;
    } catch (error) {
      stats.failed += 1;
      console.warn(
        `[geocode-companies] API request failed for company ${companyId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
      return undefined;
    }

    if (!isRateLimitResponse(data)) {
      break;
    }

    stats.rateLimited += 1;
    if (options.retryState.used >= maxRetriesPerCompany) {
      stats.failed += 1;
      console.warn(`[geocode-companies] AMap QPS limit hit for company ${companyId}. Retry limit reached; continuing.`);
      return undefined;
    }

    const backoffMs = retryBackoffMs[options.retryState.used] ?? retryBackoffMs[retryBackoffMs.length - 1];
    options.retryState.used += 1;
    stats.retried += 1;
    console.warn(
      `[geocode-companies] AMap QPS limit hit. Waiting before retry... company=${companyId} retry=${options.retryState.used}/${maxRetriesPerCompany} waitMs=${backoffMs}`,
    );
    await sleep(backoffMs);
  }

  if (data.status !== "1") {
    stats.failed += 1;
    console.warn(`[geocode-companies] AMap API error for company ${companyId}: ${data.infocode ?? "unknown"} ${data.info ?? ""}`);
    return undefined;
  }

  const location = data.status === "1" ? data.geocodes?.[0]?.location : undefined;
  const [longitude, latitude] = location?.split(",").map(Number) ?? [];

  const result: CachedResult =
    Number.isFinite(longitude) && Number.isFinite(latitude)
      ? { longitude, latitude, geocodeStatus: status, geocodeQuery: address }
      : { geocodeStatus: "missing", geocodeQuery: address };

  if (hasCoordinates(result)) {
    cache[cacheKey] = result;
    await writeCache(cache);
  }
  return hasCoordinates(result) ? result : undefined;
}

async function geocodeFirstAvailable(
  cache: Record<string, CachedResult>,
  stats: GeocodeStats,
  company: Pick<RobotCompany, "id" | "city">,
  queries: string[],
  status: Extract<GeocodeStatus, "exact" | "cityFallback">,
  options: GeocodeRequestOptions,
) {
  for (const query of queries) {
    const result = await geocodeWithCache(cache, stats, company.id, query, company.city, status, options);
    if (result) {
      return result;
    }
  }

  return undefined;
}

function buildExactQueries(company: { province: string; city: string; addressZh?: string; nameZh: string }) {
  const { province, city, addressZh, nameZh } = company;
  const queries = addressZh
    ? [
        [province, city, addressZh].filter(Boolean).join(""),
        [city, addressZh].filter(Boolean).join(""),
        addressZh,
      ]
    : [];

  return uniqueValues([
    ...queries,
    [province, city, nameZh].filter(Boolean).join(""),
    [city, nameZh].filter(Boolean).join(""),
  ]);
}

function buildCityQuery(company: { province: string; city: string; nameZh: string }) {
  return [company.province, company.city].filter(Boolean).join("") || company.nameZh;
}

async function loadEnvLocal() {
  const envPath = path.join(rootDir, ".env.local");

  try {
    const raw = await fs.readFile(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const name = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      process.env[name] ??= value;
    });
  } catch {
    // .env.local is optional for CI; shell environment variables still work.
  }
}

function hasCoordinates(value: CachedResult) {
  return typeof value.longitude === "number" && typeof value.latitude === "number";
}

async function readCache() {
  try {
    return JSON.parse(await fs.readFile(cachePath, "utf8")) as Record<string, CachedResult>;
  } catch {
    return {};
  }
}

async function writeCache(cache: Record<string, CachedResult>) {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
}

async function readExistingCoordinates() {
  try {
    return JSON.parse(await fs.readFile(outputPath, "utf8")) as Record<string, CachedResult>;
  } catch {
    return {};
  }
}

async function readOverrides() {
  try {
    return JSON.parse(await fs.readFile(overridesPath, "utf8")) as Record<string, CompanyOverride>;
  } catch {
    return {};
  }
}

function normalizeCoordinateOverride(override: CompanyOverride | undefined): CachedResult | undefined {
  if (
    !override ||
    typeof override.longitude !== "number" ||
    typeof override.latitude !== "number" ||
    !Number.isFinite(override.longitude) ||
    !Number.isFinite(override.latitude)
  ) {
    return undefined;
  }

  return {
    longitude: override.longitude,
    latitude: override.latitude,
    geocodeStatus: override.geocodeStatus ?? "exact",
    geocodeQuery: override.geocodeQuery ?? "manual override",
  };
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function createStats(total: number): GeocodeStats {
  return {
    total,
    processed: 0,
    exact: 0,
    cityFallback: 0,
    missing: 0,
    cached: 0,
    overridden: 0,
    failed: 0,
    retried: 0,
    rateLimited: 0,
    skipped: 0,
    addressMissing: 0,
  };
}

function recordFinalStatus(stats: GeocodeStats, result: CachedResult) {
  if (result.geocodeStatus === "exact") {
    stats.exact += 1;
  } else if (result.geocodeStatus === "cityFallback") {
    stats.cityFallback += 1;
  } else {
    stats.missing += 1;
  }
}

function logProgress(stats: GeocodeStats) {
  if (stats.processed % 50 !== 0 && stats.processed !== stats.total) {
    return;
  }

  console.log(
    `[geocode-companies] Progress ${stats.processed}/${stats.total} | exact=${stats.exact} cityFallback=${stats.cityFallback} missing=${stats.missing} cached=${stats.cached} overridden=${stats.overridden} failed=${stats.failed} retried=${stats.retried} rateLimited=${stats.rateLimited} skipped=${stats.skipped}`,
  );
}

function logSummary(stats: GeocodeStats) {
  console.log(
    `[geocode-companies] Summary | total=${stats.total} exact=${stats.exact} cityFallback=${stats.cityFallback} missing=${stats.missing} cached=${stats.cached} overridden=${stats.overridden} failed=${stats.failed} retried=${stats.retried} rateLimited=${stats.rateLimited} skipped=${stats.skipped} addressMissing=${stats.addressMissing}`,
  );
}

type RetryState = {
  used: number;
};

type GeocodeRequestOptions = {
  delayMs: number;
  refreshExact: boolean;
  refreshCityFallback: boolean;
  retryState: RetryState;
  getLastRequestAt: () => number;
  setLastRequestAt: (value: number) => void;
};

function createRetryState(): RetryState {
  return { used: 0 };
}

function shouldUseCachedResult(
  cached: CachedResult,
  requestedStatus: Extract<GeocodeStatus, "exact" | "cityFallback">,
  options: Pick<GeocodeRequestOptions, "refreshExact" | "refreshCityFallback">,
) {
  if (cached.geocodeStatus === "exact" && requestedStatus === "exact") {
    return !options.refreshExact;
  }

  if (cached.geocodeStatus === "cityFallback" && requestedStatus === "cityFallback") {
    return !options.refreshCityFallback;
  }

  return false;
}

function findReusableExactCache(
  cache: Record<string, CachedResult>,
  company: Pick<RobotCompany, "id" | "province" | "city" | "addressZh" | "nameZh">,
  refreshExact: boolean,
) {
  if (refreshExact) {
    return undefined;
  }

  return buildExactQueries(company)
    .map((query) => cache[`${company.id}::${query}`])
    .find((cached): cached is CachedResult => cached?.geocodeStatus === "exact" && hasCoordinates(cached));
}

function getReusablePreviousCoordinate(
  previous: CachedResult | undefined,
  company: Pick<RobotCompany, "province" | "city" | "addressZh" | "nameZh">,
  options: Pick<GeocodeRequestOptions, "refreshExact" | "refreshCityFallback">,
) {
  if (!previous || !hasCoordinates(previous)) {
    return undefined;
  }

  if (previous.geocodeStatus === "exact") {
    if (options.refreshExact) {
      return undefined;
    }

    const currentQueries = buildExactQueries(company);
    return !previous.geocodeQuery || currentQueries.includes(previous.geocodeQuery) ? previous : undefined;
  }

  if (previous.geocodeStatus === "cityFallback") {
    return options.refreshCityFallback ? undefined : previous;
  }

  return undefined;
}

function isRateLimitResponse(data: AMapGeocodeResponse) {
  const text = `${data.infocode ?? ""} ${data.info ?? ""}`.toUpperCase();
  return data.infocode === "10021" || text.includes("QPS") || text.includes("RATE") || text.includes("LIMIT");
}

async function waitForRateLimit(options: Pick<GeocodeRequestOptions, "delayMs" | "getLastRequestAt">) {
  const elapsedMs = Date.now() - options.getLastRequestAt();
  const waitMs = options.delayMs - elapsedMs;
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPositiveIntegerEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
