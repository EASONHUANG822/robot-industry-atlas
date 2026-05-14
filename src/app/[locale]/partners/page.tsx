import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type PartnersPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function PartnersPage({ params }: PartnersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PartnersPage");

  return (
    <main id="main-content" className="bg-page">
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-8 text-secondary">{t("description")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/apply"
                className="inline-flex min-h-12 items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t("apply")}
              </Link>
              <Link
                href="/visit"
                className="inline-flex min-h-12 items-center justify-center rounded border border-line bg-white px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t("visit")}
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SignalCard index={0} label={t("signals.reception.label")} value={t("signals.reception.value")} />
            <SignalCard index={1} label={t("signals.enterprise.label")} value={t("signals.enterprise.value")} />
            <SignalCard index={2} label={t("signals.project.label")} value={t("signals.project.value")} />
            <SignalCard index={3} label={t("signals.exchange.label")} value={t("signals.exchange.value")} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("modelsEyebrow")}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-accent">{t("modelsTitle")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModelCard title={t("models.reception.title")} text={t("models.reception.text")} />
          <ModelCard title={t("models.showcase.title")} text={t("models.showcase.text")} />
          <ModelCard title={t("models.matchmaking.title")} text={t("models.matchmaking.text")} />
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("flowEyebrow")}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-accent">{t("flowTitle")}</h2>
            <p className="mt-4 text-pretty text-sm leading-7 text-secondary">{t("flowDescription")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StepCard number="01" title={t("flow.brief.title")} text={t("flow.brief.text")} />
            <StepCard number="02" title={t("flow.plan.title")} text={t("flow.plan.text")} />
            <StepCard number="03" title={t("flow.host.title")} text={t("flow.host.text")} />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold leading-tight text-accent">{t("cta.title")}</h2>
          <p className="mt-3 text-pretty text-base leading-7 text-secondary">{t("cta.text")}</p>
        </div>
        <Link
          href="/apply"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("cta.button")}
        </Link>
      </section>
    </main>
  );
}

const signalAccents = [
  "bg-blue-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-violet-400",
];

function SignalCard({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div className="rounded border border-line bg-panel p-4">
      <div className="flex items-center gap-2.5">
        <span className={`inline-block size-2 shrink-0 rounded-sm ${signalAccents[index % signalAccents.length]}`} aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-2 text-xl font-black leading-tight text-accent">{value}</p>
    </div>
  );
}

function ModelCard({ text, title }: { text: string; title: string }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold leading-tight text-accent">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-secondary">{text}</p>
    </article>
  );
}

function StepCard({ number, text, title }: { number: string; text: string; title: string }) {
  return (
    <article className="rounded border border-line bg-panel p-4">
      <p className="text-xs font-black tabular-nums text-muted">{number}</p>
      <h3 className="mt-3 text-lg font-bold leading-tight text-accent">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-secondary">{text}</p>
    </article>
  );
}
