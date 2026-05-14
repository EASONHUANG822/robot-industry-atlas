import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export default async function InnovationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("InnovationPage");

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

      {/* Image Showcase + Key Metrics */}
      <section className="relative overflow-hidden bg-dark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/images/AI生态社区.jpg')" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 lg:grid-cols-4">
            {[
              { label: t("stats.platforms"), value: t("stats.platformsValue") },
              { label: t("stats.aiCommunity"), value: t("stats.aiCommunityValue") },
              { label: t("stats.university"), value: t("stats.universityValue") },
              { label: t("stats.annualEvents"), value: t("stats.annualEventsValue") },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-4xl font-black text-white sm:text-5xl">{value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail prose */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-accent">{t("detailTitle")}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-secondary">{t("detailText")}</p>
          </div>
        </div>
      </section>

      {/* Core Platforms */}
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

      {/* Frontier Research */}
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
    </main>
  );
}
