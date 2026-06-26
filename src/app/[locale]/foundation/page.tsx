import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FoundationPage" });
  const brandName = locale === "zh" ? "深圳机器人谷" : "Shenzhen Robot Valley";

  return {
    title: `${t("title")} | ${brandName}`,
    description: t("description"),
    alternates: { canonical: `/${locale}/foundation` },
    openGraph: {
      title: `${t("title")} | ${brandName}`,
      description: t("description"),
      siteName: brandName,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

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

      {/* Innovation Platforms — migrated from InnovationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("platforms.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("platforms.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={t(`platforms.items.${i}.title`)}
                className="group relative overflow-hidden rounded-xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-soft"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 select-none text-8xl font-black text-[#f0f4fc]" aria-hidden="true">
                  {`0${i + 1}`}
                </div>
                <div className="relative">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
                    {`0${i + 1}`}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-accent">
                    {t(`platforms.items.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {t(`platforms.items.${i}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frontier Research — migrated from InnovationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("research.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("research.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`research.items.${i}.label`)}
                className="flex items-start gap-5 rounded-xl border border-line bg-page p-5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
                  {`0${i + 1}`}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-accent">
                    {t(`research.items.${i}.label`)}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {t(`research.items.${i}.value`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration Models — migrated from CollaborationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("models.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("models.description")}
            </p>
          </div>
          <div className="mt-10 max-w-4xl space-y-5">
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

      {/* Partner Ecosystem — migrated from CollaborationPage */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("partnerEcosystem.title")}</p>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("partnerEcosystem.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`partnerEcosystem.items.${i}.label`)}
                className="flex flex-col rounded-xl border border-line bg-page p-5"
              >
                <span className="text-xs font-black tabular-nums text-muted">{`0${i + 1}`}</span>
                <h4 className="mt-2 text-base font-bold text-accent">
                  {t(`partnerEcosystem.items.${i}.label`)}
                </h4>
                <p className="mt-1 text-sm leading-6 text-secondary">
                  {t(`partnerEcosystem.items.${i}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-accent">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold leading-tight text-white">{t("detailTitle")}</h2>
            <p className="mt-3 text-pretty text-base leading-7 text-white/85">{t("detailText")}</p>
          </div>
          <Link
            href="/payment"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded bg-white px-6 py-3 text-base font-semibold text-accent shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
