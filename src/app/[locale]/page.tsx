import { getTranslations, setRequestLocale } from "next-intl/server";
import { VisitApplicationButton } from "@/components/VisitApplicationButton";
import { robotValley } from "@/data/robotValley";
import type { AppLocale } from "@/i18n/routing";

type LandingPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  return (
    <main>
      <section
        className="relative isolate overflow-hidden bg-ink text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.86) 0%, rgba(15, 23, 42, 0.62) 36%, rgba(15, 23, 42, 0.16) 74%), url('/images/robot-valley-hero.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">{t("eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-normal text-white sm:text-7xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100">{t("description")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#robot-valley-detail"
                className="rounded border border-white/25 bg-white px-5 py-3 text-sm font-semibold text-accent transition hover:bg-slate-100"
              >
                {t("learnMore")}
              </a>
              <VisitApplicationButton
                label={t("applyToVisit")}
                className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="robot-valley-detail" className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 pb-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("detail.eyebrow")}</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-accent">{t("detail.title")}</h2>
            <p className="mt-5 text-base leading-8 text-[#4a6fa5]">{t("detail.description")}</p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <DetailMetric label={t("detail.addressLabel")} value={robotValley.address[locale]} />
              <DetailMetric label={t("detail.areaLabel")} value={robotValley.stats.showroomArea[locale]} />
            </dl>
          </div>

          <div className="grid gap-2 md:grid-cols-3 lg:self-center">
            <DetailCard title={t("detail.cards.showroom.title")} text={t("detail.cards.showroom.text")} />
            <DetailCard title={t("detail.cards.ecosystem.title")} text={t("detail.cards.ecosystem.text")} />
            <DetailCard title={t("detail.cards.visit.title")} text={t("detail.cards.visit.text")} />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded border border-line bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("showroom.eyebrow")}</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-accent">{t("showroom.title")}</h2>
              <p className="mt-4 text-base leading-7 text-[#4a6fa5]">{t("showroom.description")}</p>
              <div className="mt-6">
                <VisitApplicationButton
                  label={t("showroom.apply")}
                  className="rounded bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800"
                />
              </div>
            </div>
            <div
              className="min-h-[280px] bg-cover bg-center"
              style={{ backgroundImage: "url('/images/robot-valley-hero.png')" }}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-panel px-2.5 py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#7a9bc7]">{label}</dt>
      <dd className="text-sm font-bold text-accent">{value}</dd>
    </div>
  );
}

function DetailCard({ text, title }: { text: string; title: string }) {
  return (
    <article className="rounded border border-line bg-white px-2.5 py-1 shadow-sm">
      <h3 className="text-lg font-bold text-accent">{title}</h3>
      <p className="mt-0.5 text-sm leading-snug text-[#4a6fa5]">{text}</p>
    </article>
  );
}
