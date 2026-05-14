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
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-secondary">{t("description")}</p>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="relative overflow-hidden bg-dark">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(157,187,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(157,187,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 lg:grid-cols-4">
            {[
              { label: t("stats.companies"), value: t("stats.companiesValue") },
              { label: t("stats.components"), value: t("stats.componentsValue") },
              { label: t("stats.radius"), value: t("stats.radiusValue") },
              { label: t("stats.patents"), value: t("stats.patentsValue") },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-4xl font-black text-white sm:text-5xl">{value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Industry Chain Detail */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-accent">{t("detailTitle")}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-secondary">{t("detailText")}</p>
          </div>
        </div>
      </section>

      {/* Industry Chain */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("chain.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("chain.description")}
            </p>
          </div>
          <div className="mt-10 max-w-4xl space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={t(`chain.items.${i}.title`)}
                className="group relative overflow-hidden rounded-xl border border-line bg-page p-5 sm:flex sm:items-start sm:gap-6 sm:p-6"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 select-none text-8xl font-black text-[#f0f4fc]" aria-hidden="true">
                  {`0${i + 1}`}
                </div>
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
                  {`0${i + 1}`}
                </div>
                <div className="relative mt-4 sm:mt-0">
                  <h3 className="text-lg font-bold text-accent">
                    {t(`chain.items.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {t(`chain.items.${i}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supply Chain Radius */}
      <section className="bg-accent">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("supply.title")}</h2>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-white/85">
              {t("supply.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Enterprise Ecosystem */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("ecosystem.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("ecosystem.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`ecosystem.items.${i}.label`)}
                className="flex items-start gap-4 rounded-lg border border-line bg-page p-4"
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
