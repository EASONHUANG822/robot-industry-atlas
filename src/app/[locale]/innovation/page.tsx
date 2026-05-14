import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export default async function InnovationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("InnovationPage");

  return (
    <main id="main-content" className="bg-[#f7f9fd]">
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
          <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-pretty text-base leading-8 text-[#4a6fa5]">{t("description")}</p>
        </div>
      </section>

      {/* Key Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { label: t("stats.platforms"), value: t("stats.platformsValue") },
            { label: t("stats.aiCommunity"), value: t("stats.aiCommunityValue") },
            { label: t("stats.university"), value: t("stats.universityValue") },
            { label: t("stats.annualEvents"), value: t("stats.annualEventsValue") },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-line bg-white p-5 text-center shadow-sm sm:p-6"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a9bc7]">{label}</dt>
              <dd className="mt-2 text-3xl font-black text-accent sm:text-4xl">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Detail prose */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-accent">{t("detailTitle")}</h2>
          <p className="mt-4 text-base leading-8 text-[#4a6fa5]">{t("detailText")}</p>
        </div>
      </section>

      {/* Core Platforms */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("platforms.title")}</p>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-8 text-[#4a6fa5]">
            {t("platforms.description")}
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={t(`platforms.items.${i}.title`)}
                className="rounded-xl border border-line bg-white p-6 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                  {`0${i + 1}`}
                </div>
                <h3 className="mt-4 text-lg font-bold text-accent">
                  {t(`platforms.items.${i}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#4a6fa5]">
                  {t(`platforms.items.${i}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frontier Research */}
      <section className="bg-accent px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70">{t("research.title")}</p>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-8 text-white/80">
              {t("research.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={t(`research.items.${i}.label`)}
                className="flex items-start gap-4 rounded-lg bg-white/10 p-4"
              >
                <div className="mt-0.5 size-2 shrink-0 rounded-full bg-white/70" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {t(`research.items.${i}.label`)}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-white/65">
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
