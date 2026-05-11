"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AMapCanvas } from "@/components/AMapCanvas";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { VisitApplicationButton } from "@/components/VisitApplicationButton";
import { Link } from "@/i18n/navigation";
import {
  categoryKeys,
  type CompanyCategoryKey,
  getCategoryLabel,
  localizeCompany,
  type RobotCompany,
} from "@/data/companies";
import type { AppLocale } from "@/i18n/routing";

type AtlasDashboardProps = {
  companies: RobotCompany[];
};

type CategoryFilterValue = "all" | CompanyCategoryKey;

export function AtlasDashboard({ companies }: AtlasDashboardProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Map");
  const [search, setSearch] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryFilterValue>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequestKey, setFocusRequestKey] = useState(0);
  const [highlightedId, setHighlightedId] = useState("");
  const emptyMessageKey = companies.length === 0 ? "nanshanEmpty" : "empty";
  const categoryCounts = useMemo(() => {
    const counts = new Map<CompanyCategoryKey, number>();
    companies.forEach((company) => {
      counts.set(company.categoryKey, (counts.get(company.categoryKey) ?? 0) + 1);
    });
    return counts;
  }, [companies]);
  const availableCategoryKeys = useMemo(
    () => categoryKeys.filter((key) => (categoryCounts.get(key) ?? 0) > 0),
    [categoryCounts],
  );
  const categoryOptions = useMemo(
    () =>
      availableCategoryKeys.map((key) => ({
        key,
        count: categoryCounts.get(key) ?? 0,
        label: getCategoryLabel(key, locale),
      })),
    [availableCategoryKeys, categoryCounts, locale],
  );

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      const localizedCompany = localizeCompany(company, locale);
      const searchableText = [
        localizedCompany.name,
        company.nameZh,
        localizedCompany.city,
        localizedCompany.province,
        localizedCompany.category,
        localizedCompany.address,
        localizedCompany.description,
        ...localizedCompany.products,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = query.length === 0 || searchableText.includes(query);
      const matchesCategory = selectedCategoryKey === "all" || company.categoryKey === selectedCategoryKey;

      return matchesSearch && matchesCategory;
    });
  }, [companies, locale, search, selectedCategoryKey]);

  const selectedCompany = selectedId ? filteredCompanies.find((company) => company.id === selectedId) : undefined;
  const highlightedCompany = highlightedId ? filteredCompanies.find((company) => company.id === highlightedId) : undefined;
  const currentViewText =
    selectedCategoryKey === "all"
      ? t("currentViewAll")
      : t("currentViewCategory", { category: getCategoryLabel(selectedCategoryKey, locale) });

  useEffect(() => {
    if (selectedId && !filteredCompanies.some((company) => company.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredCompanies, selectedId]);

  useEffect(() => {
    if (highlightedId && !filteredCompanies.some((company) => company.id === highlightedId)) {
      setHighlightedId("");
    }
  }, [filteredCompanies, highlightedId]);

  const handleSelectCompany = useCallback((company: RobotCompany) => {
    setSelectedId(company.id);
    setFocusRequestKey((value) => value + 1);
    setHighlightedId("");
  }, []);

  const handleHighlightCompany = useCallback((company: RobotCompany | undefined) => {
    setHighlightedId(company?.id ?? "");
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedId(null);
    setHighlightedId("");
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#07111f] text-white">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden lg:flex-row">
        <AllCompaniesPanel
          categoryOptions={categoryOptions}
          companies={filteredCompanies}
          currentViewText={currentViewText}
          search={search}
          selectedCategoryKey={selectedCategoryKey}
          totalCompaniesCount={companies.length}
          selectedId={selectedCompany?.id}
          emptyMessageKey={emptyMessageKey}
          onCategoryChange={setSelectedCategoryKey}
          onHighlightCompany={handleHighlightCompany}
          onSearchChange={setSearch}
          onSelectCompany={handleSelectCompany}
        />

        {selectedCompany ? (
          <CompanyDetailWindow company={selectedCompany} onClose={handleClearSelection} />
        ) : null}

        <section className="relative min-h-[560px] flex-1 overflow-hidden border-t border-white/10 bg-[#06101d] lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="absolute right-4 top-4 z-20">
            <VisitApplicationButton
              label={t("applyToVisit")}
              className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 shadow-2xl transition hover:bg-cyan-200"
            />
          </div>
          <CurrentCompanyCount count={filteredCompanies.length} />
          <MapErrorBoundary fallback={<MapBoundaryFallback />}>
            <AMapCanvas
              companies={filteredCompanies}
              emptyMessageKey={emptyMessageKey}
              focusRequestKey={focusRequestKey}
              highlightedCompany={highlightedCompany}
              selectedCompany={selectedCompany}
              visibleCategoryKeys={availableCategoryKeys}
              onClearSelection={handleClearSelection}
              onSelectCompany={handleSelectCompany}
            />
          </MapErrorBoundary>
        </section>
      </div>
    </main>
  );
}

function AllCompaniesPanel({
  categoryOptions,
  companies,
  currentViewText,
  search,
  selectedCategoryKey,
  totalCompaniesCount,
  selectedId,
  emptyMessageKey,
  onCategoryChange,
  onHighlightCompany,
  onSearchChange,
  onSelectCompany,
}: {
  categoryOptions: { key: CompanyCategoryKey; count: number; label: string }[];
  companies: RobotCompany[];
  currentViewText: string;
  search: string;
  selectedCategoryKey: CategoryFilterValue;
  totalCompaniesCount: number;
  selectedId?: string;
  emptyMessageKey: "empty" | "nanshanEmpty";
  onCategoryChange: (value: CategoryFilterValue) => void;
  onHighlightCompany: (company: RobotCompany | undefined) => void;
  onSearchChange: (value: string) => void;
  onSelectCompany: (company: RobotCompany) => void;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Map");
  const sidebarT = useTranslations("Sidebar");

  return (
    <aside className="flex max-h-none w-full flex-col border-white/10 bg-[#081321] shadow-2xl lg:h-[calc(100vh-4rem)] lg:w-[360px] lg:shrink-0">
      <div className="space-y-4 border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{sidebarT("eyebrow")}</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-white">{currentViewText}</h1>
            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">{sidebarT("subtitle")}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{sidebarT("resultCount", { count: companies.length })}</p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
          >
            {t("home")}
          </Link>
        </div>
      </div>

      <div className="space-y-3 border-b border-white/10 p-4">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={sidebarT("searchPlaceholder")}
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none ring-cyan-300/20 placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-4"
        />
        <select
          value={selectedCategoryKey}
          onChange={(event) => onCategoryChange(event.target.value as CategoryFilterValue)}
          className="w-full rounded-full border border-white/10 bg-[#0f1d30] px-4 py-2 text-sm text-white outline-none ring-cyan-300/20 focus:border-cyan-300/40 focus:ring-4"
        >
          <option value="all">
            {t("allCategories")} ({totalCompaniesCount})
          </option>
          {categoryOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label} ({option.count})
            </option>
          ))}
        </select>
      </div>

      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("companyList")}</p>
          <p className="text-xs font-semibold text-slate-400">{companies.length}</p>
        </div>
        <div className="space-y-2">
          {companies.length === 0 ? (
            <div className="rounded border border-white/10 bg-white/[0.035] p-5 text-sm font-semibold text-slate-300">
              {t(emptyMessageKey)}
            </div>
          ) : null}
          {companies.slice(0, 180).map((item) => {
            const localizedItem = localizeCompany(item, locale);
            const selected = item.id === selectedId;

            return (
              <button
                key={item.id}
                onClick={() => onSelectCompany(item)}
                onMouseEnter={() => onHighlightCompany(item)}
                onMouseLeave={() => onHighlightCompany(undefined)}
                className={`w-full rounded border p-3 text-left transition ${
                  selected
                    ? "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.14)]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{localizedItem.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[localizedItem.city, localizedItem.province].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-slate-300">
                    {localizedItem.category}
                  </span>
                </div>
                {!localizedItem.coordinates ? (
                  <p className="mt-2 text-xs font-semibold text-amber-300">{sidebarT("coordinatesUnavailable")}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function CompanyDetailWindow({ company, onClose }: { company: RobotCompany; onClose: () => void }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Map");
  const detailsT = useTranslations("CompanyDetails");
  const localizedCompany = localizeCompany(company, locale);
  const secondaryStat =
    localizedCompany.foundedYear ||
    localizedCompany.status ||
    localizedCompany.latestFunding?.roundEn ||
    localizedCompany.latestFunding?.roundZh ||
    detailsT("unknown");

  return (
    <aside className="scrollbar-hidden w-full overflow-y-auto border-t border-white/10 bg-[#0a1728] p-5 shadow-2xl lg:h-[calc(100vh-4rem)] lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
            {localizedCompany.category}
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-white">{localizedCompany.name}</h2>
          {localizedCompany.nameZh && localizedCompany.nameZh !== localizedCompany.name ? (
            <p className="mt-2 text-sm font-semibold text-slate-400">{localizedCompany.nameZh}</p>
          ) : null}
          <p className="mt-3 text-sm font-medium text-slate-400">
            {[localizedCompany.city, localizedCompany.province].filter(Boolean).join(" / ")}
          </p>
          <p className="mt-2 text-xs font-semibold text-cyan-200">{detailsT("area")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-lg leading-none text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {localizedCompany.foundedYear ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
            {detailsT("founded")} {localizedCompany.foundedYear}
          </span>
        ) : null}
        {localizedCompany.status ? (
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            {localizedCompany.status}
          </span>
        ) : null}
      </div>

      {localizedCompany.description ? (
        <p className="scrollbar-hidden mt-5 max-h-32 overflow-y-auto text-sm leading-6 text-slate-300">
          {localizedCompany.description}
        </p>
      ) : null}

      {localizedCompany.geocodeStatus === "cityFallback" ? (
        <p className="mt-4 rounded border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
          {t("cityFallbackNote")}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <DarkStat label={detailsT("location")} value={[localizedCompany.city, localizedCompany.province].filter(Boolean).join(" / ") || detailsT("unknown")} />
        <DarkStat label={detailsT("foundedYear")} value={localizedCompany.foundedYear || detailsT("unknown")} />
        <DarkStat label={localizedCompany.employeeRange ? detailsT("employees") : detailsT("statusOrFunding")} value={localizedCompany.employeeRange || secondaryStat} />
      </div>

      {localizedCompany.products.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{detailsT("products")}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {localizedCompany.products.slice(0, 8).map((product) => (
              <span key={product} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                {product}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {localizedCompany.website ? (
          <a
            href={localizedCompany.website}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            {detailsT("visitWebsite")}
          </a>
        ) : null}
        <Link
          href={`/company/${company.id}`}
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:border-cyan-300/40"
        >
          {detailsT("detailPage")}
        </Link>
      </div>
    </aside>
  );
}

function CurrentCompanyCount({ count }: { count: number }) {
  const t = useTranslations("Map");

  return (
    <div className="pointer-events-none absolute right-4 top-20 z-20 rounded border border-white/10 bg-slate-950/70 px-4 py-3 text-right shadow-2xl backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t("currentCompanies")}</p>
      <p className="mt-1 text-2xl font-black text-white">{count.toLocaleString()}</p>
    </div>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 line-clamp-2 text-xs font-bold text-slate-100">{value}</p>
    </div>
  );
}

function MapBoundaryFallback() {
  const t = useTranslations("Map");

  return (
    <div className="relative h-full min-h-[560px] bg-[#06101d]">
      <div className="absolute inset-0 grid place-items-center bg-slate-950/80 p-6 text-center">
        <div className="max-w-sm rounded border border-white/10 bg-[#081321] p-5 shadow-2xl">
          <p className="text-sm font-semibold text-white">{t("error")}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{t("fallback")}</p>
        </div>
      </div>
    </div>
  );
}
