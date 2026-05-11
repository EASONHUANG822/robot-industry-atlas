"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { categoryKeys, categoryStyles, getCategoryLabel } from "@/data/companies";
import type { CompanyCategoryKey } from "@/data/companies";
import type { AppLocale } from "@/i18n/routing";

export function CategoryLegend({ visibleCategoryKeys = categoryKeys }: { visibleCategoryKeys?: CompanyCategoryKey[] }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("CategoryLegend");

  return (
    <div className="pointer-events-auto rounded border border-white/10 bg-slate-950/70 p-3 shadow-2xl backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("title")}</p>
      <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto lg:max-h-none lg:flex-col">
        {visibleCategoryKeys.map((categoryKey) => {
          const style = categoryStyles[categoryKey];

          return (
            <div key={categoryKey} className="flex items-center gap-2 rounded px-1 py-0.5">
              <span
                className="legend-marker"
                style={{
                  "--marker-color": style.color,
                } as CSSProperties}
              />
              <span className="whitespace-nowrap text-xs font-medium text-slate-200">
                {getCategoryLabel(categoryKey, locale)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
