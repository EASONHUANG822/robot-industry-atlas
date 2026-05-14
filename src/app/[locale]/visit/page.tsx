import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type VisitPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function VisitPage({ params }: VisitPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("VisitPage");

  return (
    <main id="main-content" className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
          <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-pretty text-base leading-8 text-secondary">{t("description")}</p>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          <StepCard number="01" title={t("steps.request.title")} text={t("steps.request.text")} />
          <StepCard number="02" title={t("steps.confirm.title")} text={t("steps.confirm.text")} />
          <StepCard number="03" title={t("steps.visit.title")} text={t("steps.visit.text")} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold leading-tight text-accent">{t("audience.title")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AudienceItem text={t("audience.government")} />
            <AudienceItem text={t("audience.enterprise")} />
            <AudienceItem text={t("audience.investor")} />
            <AudienceItem text={t("audience.research")} />
          </div>
        </div>
        <div className="rounded border border-line bg-accent p-5 text-white shadow-soft">
          <h2 className="text-2xl font-bold leading-tight">{t("prepare.title")}</h2>
          <p className="mt-3 text-sm leading-7 text-blue-50">{t("prepare.text")}</p>
          <Link
            href="/apply"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded bg-white px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("apply")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function StepCard({ number, text, title }: { number: string; text: string; title: string }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black tabular-nums text-muted">{number}</p>
      <h2 className="mt-3 text-xl font-bold leading-tight text-accent">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-secondary">{text}</p>
    </article>
  );
}

function AudienceItem({ text }: { text: string }) {
  return (
    <p className="rounded border border-line bg-panel px-3 py-2 text-sm font-semibold text-subtle">{text}</p>
  );
}
