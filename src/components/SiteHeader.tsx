import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SiteHeader() {
  const t = useTranslations("Header");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/88 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 shrink-0 place-items-center rounded bg-accent text-sm font-black text-white">
            RV
          </span>
          <span className="truncate text-accent">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium text-[#4a6fa5]">
          <Link href="/" className="hidden rounded px-3 py-2 hover:bg-blue-50 hover:text-accent sm:inline-flex">
            {t("overview")}
          </Link>
          <Link href="/#robot-valley-detail" className="rounded bg-accent px-3 py-2 text-white hover:bg-blue-800">
            {t("map")}
          </Link>
          <Link href="/#robot-valley-detail" className="hidden rounded px-3 py-2 hover:bg-blue-50 hover:text-accent lg:inline-flex">
            {t("about")}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
