"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  type CompanyCategoryKey,
  getCategoryLabel,
  getProvinceLabel,
  localizeCompany,
  type RobotCompany,
} from "@/data/companies";
import type { AppLocale } from "@/i18n/routing";

type AtlasSidebarProps = {
  companies: RobotCompany[];
  categories: CompanyCategoryKey[];
  provinces: string[];
  selectedId: string;
  search: string;
  category: CompanyCategoryKey | "all";
  province: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CompanyCategoryKey | "all") => void;
  onProvinceChange: (value: string) => void;
  onSelectCompany: (company: RobotCompany) => void;
};

export function AtlasSidebar({
  companies,
  categories,
  provinces,
  selectedId,
  search,
  category,
  province,
  onSearchChange,
  onCategoryChange,
  onProvinceChange,
  onSelectCompany,
}: AtlasSidebarProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Sidebar");

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-white">
      <div className="space-y-4 border-b border-line p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-bold text-accent">{t("title")}</h1>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[#3a5a8a]">{t("search")}</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="mt-2 w-full rounded border border-line bg-panel px-3 py-2 text-sm outline-none ring-accent/20 focus:border-accent focus:ring-4"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label={t("category")}
            value={category}
            options={categories.map((option) => ({
              value: option,
              label: getCategoryLabel(option, locale),
            }))}
            allLabel={t("all")}
            onChange={onCategoryChange}
          />
          <FilterSelect
            label={t("province")}
            value={province}
            options={provinces.map((option) => ({
              value: option,
              label: getProvinceLabel(option),
            }))}
            allLabel={t("all")}
            onChange={onProvinceChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="px-1 pb-3 text-sm text-[#7a9bc7]">{t("resultCount", { count: companies.length })}</p>
        <div className="space-y-2">
          {companies.map((company) => {
            const selected = company.id === selectedId;
            const localizedCompany = localizeCompany(company, locale);

            return (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className={`w-full rounded border p-3 text-left transition ${
                  selected
                    ? "border-accent bg-blue-50 shadow-sm"
                    : "border-line bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-accent">{localizedCompany.name}</h2>
                    <p className="mt-1 text-xs font-medium text-[#7a9bc7]">
                      {localizedCompany.address}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-[#4a6fa5]">
                    {localizedCompany.category}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#4a6fa5]">
                  {localizedCompany.description}
                </p>
                {!localizedCompany.coordinates ? (
                  <p className="mt-3 text-xs font-semibold text-amber-700">{t("coordinatesUnavailable")}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
  onChange: (value: CompanyCategoryKey | "all") => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#3a5a8a]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CompanyCategoryKey | "all")}
        className="mt-2 w-full rounded border border-line bg-panel px-3 py-2 text-sm outline-none ring-accent/20 focus:border-accent focus:ring-4"
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
