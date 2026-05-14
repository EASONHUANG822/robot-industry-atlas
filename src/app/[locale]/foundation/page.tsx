import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export default async function FoundationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("FoundationPage");

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

      {/* Key Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { label: t("stats.companies"), value: t("stats.companiesValue") },
            { label: t("stats.components"), value: t("stats.componentsValue") },
            { label: t("stats.radius"), value: t("stats.radiusValue") },
            { label: t("stats.patents"), value: t("stats.patentsValue") },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-line bg-white p-5 text-center shadow-sm sm:p-6"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-2 text-3xl font-black text-accent sm:text-4xl">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Full Industry Chain Detail */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-accent">{t("detailTitle")}</h2>
          <p className="mt-4 text-base leading-8 text-secondary">{t("detailText")}</p>
        </div>
      </section>

      {/* Industry Chain Grid */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("chain.title")}</p>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
            {t("chain.description")}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={t(`chain.items.${i}.title`)}
                className="rounded-xl border border-line bg-page p-5 sm:p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                  {`0${i + 1}`}
                </div>
                <h3 className="mt-4 text-lg font-bold text-accent">
                  {t(`chain.items.${i}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-7 text-secondary">
                  {t(`chain.items.${i}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supply Chain Radius */}
      <section className="bg-accent px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("supply.title")}</h2>
          <p className="mt-5 text-pretty text-base leading-8 text-white/80">
            {t("supply.description")}
          </p>
        </div>
      </section>

      {/* Enterprise Ecosystem */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("ecosystem.title")}</p>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
            {t("ecosystem.description")}
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`ecosystem.items.${i}.label`)}
                className="flex items-start gap-4 rounded-lg border border-line p-4"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-accent text-[10px] font-bold text-white">
                  {`0${i + 1}`}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-accent">
                    {t(`ecosystem.items.${i}.label`)}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {t(`ecosystem.items.${i}.value`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
