import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export default async function CollaborationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CollaborationPage");

  return (
    <main id="main-content" className="bg-page">
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
          <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-pretty text-base leading-8 text-secondary">{t("description")}</p>
        </div>
      </section>

      {/* Key Metrics — horizontal stat bar */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10">
            {[
              { label: t("stats.universities"), value: t("stats.universitiesValue") },
              { label: t("stats.roadshows"), value: t("stats.roadshowsValue") },
              { label: t("stats.financing"), value: t("stats.financingValue") },
              { label: t("stats.projects"), value: t("stats.projectsValue") },
            ].map(({ label, value }, i) => (
              <div key={label} className="flex items-center gap-4">
                {i > 0 && (
                  <div className="hidden h-10 w-px bg-line sm:block" aria-hidden="true" />
                )}
                <div className="text-center">
                  <p className="text-2xl font-black text-accent sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#7a9bc7]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail prose */}
      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-accent">{t("detailTitle")}</h2>
          <p className="mt-4 text-base leading-8 text-secondary">{t("detailText")}</p>
        </div>
      </section>

      {/* Five Collaboration Models — numbered flow */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("models.title")}</p>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
            {t("models.description")}
          </p>
          <div className="mt-10 space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={t(`models.items.${i}.title`)}
                className="flex flex-col gap-4 rounded-xl border border-line bg-page p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
                  {`0${i + 1}`}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-accent">
                    {t(`models.items.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {t(`models.items.${i}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Ecosystem — card grid on light background */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("partners.title")}</p>
            <p className="mt-3 text-pretty text-base leading-8 text-secondary">
              {t("partners.description")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`partners.items.${i}.label`)}
                className="flex flex-col rounded-xl border border-line bg-page p-5"
              >
                <span className="text-xs font-black tabular-nums text-[#7a9bc7]">{`0${i + 1}`}</span>
                <h4 className="mt-2 text-base font-bold text-accent">
                  {t(`partners.items.${i}.label`)}
                </h4>
                <p className="mt-1 text-sm leading-6 text-secondary">
                  {t(`partners.items.${i}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
