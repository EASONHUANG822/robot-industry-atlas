import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type ApplySuccessPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function ApplySuccessPage({ params }: ApplySuccessPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ApplySuccessPage");

  return (
    <main id="main-content" className="grid min-h-[calc(100vh-4rem)] place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-2xl rounded border border-line bg-white p-6 text-center shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
        <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-8 text-[#4a6fa5]">{t("description")}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded border border-line bg-white px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("home")}
          </Link>
          <Link
            href="/showroom"
            className="inline-flex min-h-12 items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("showroom")}
          </Link>
        </div>
      </section>
    </main>
  );
}
