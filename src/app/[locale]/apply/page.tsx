import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApplicationForm } from "@/components/ApplicationForm";
import { robotValley } from "@/data/robotValley";
import type { AppLocale } from "@/i18n/routing";

type ApplyPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ApplyPage");

  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-accent sm:text-5xl">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#4a6fa5]">{t("description")}</p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard label={t("addressLabel")} value={robotValley.address[locale]} />
            <InfoCard label={t("areaLabel")} value={robotValley.stats.showroomArea[locale]} />
          </dl>
        </div>

        <section className="rounded border border-line bg-white p-5 shadow-soft sm:p-6">
          <ApplicationForm />
        </section>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-white p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a9bc7]">{label}</dt>
      <dd className="mt-2 text-base font-bold text-accent">{value}</dd>
    </div>
  );
}
