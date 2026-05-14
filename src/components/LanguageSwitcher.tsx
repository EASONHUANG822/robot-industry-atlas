"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div className="flex items-center rounded border border-line bg-white p-1 text-sm font-semibold">
      {routing.locales.map((item) => {
        const active = item === locale;

        return (
          <Link
            key={item}
            href={pathname}
            locale={item}
            className={`rounded px-2.5 py-1.5 transition ${
              active ? "bg-accent text-white" : "text-secondary hover:bg-blue-50 hover:text-accent"
            }`}
          >
            {t(item)}
          </Link>
        );
      })}
    </div>
  );
}
