import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SiteHeader() {
  const t = useTranslations("Header");
  const visitT = useTranslations("VisitApplication");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <img src="/images/logo.png" alt="" className="size-9 shrink-0 rounded bg-accent object-contain" />
          <span className="truncate text-accent">{t("brand")}</span>
        </Link>
        <div className="flex min-w-0 items-center gap-1 text-sm font-medium text-[#4a6fa5] sm:gap-2">
          <Link
            href="/"
            className="hidden rounded px-3 py-2 transition-colors hover:bg-blue-50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex"
          >
            {t("overview")}
          </Link>
          <Link
            href="/showroom"
            className="hidden rounded px-3 py-2 transition-colors hover:bg-blue-50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex"
          >
            {t("showroom")}
          </Link>
          <Link
            href="/visit"
            className="hidden rounded px-3 py-2 transition-colors hover:bg-blue-50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:inline-flex"
          >
            {t("visit")}
          </Link>
          <Link
            href="/partners"
            className="hidden rounded px-3 py-2 transition-colors hover:bg-blue-50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent xl:inline-flex"
          >
            {t("partners")}
          </Link>
          <Link
            href="/apply"
            className="rounded bg-accent px-3 py-2 text-white transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {visitT("button")}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
