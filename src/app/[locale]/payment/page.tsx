import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import type { AppLocale } from "@/i18n/routing";

type PaymentPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

const QR_PATTERN_CELLS = [
  "111010111",
  "101101101",
  "111010111",
  "010110010",
  "100110101",
  "001011010",
  "111010111",
  "101001101",
  "111010111",
].join("");

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PaymentPage");

  const benefits = PAYMENT_BENEFIT_KEYS.map((benefitKey) => ({
    title: t(`benefits.${benefitKey}.title`),
    text: t(`benefits.${benefitKey}.text`),
  }));

  return (
    <main
      id="main-content"
      className="bg-[linear-gradient(180deg,#eef3fb_0%,#f7f9fd_46%,#ffffff_100%)]"
    >
      <section className="relative isolate mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 overflow-hidden px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
        <div
          className="pointer-events-none absolute right-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full bg-mid-light/[0.15] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-secondary">{t("description")}</p>

          <div className="mt-8 rounded-lg border border-white/70 bg-white/[0.78] p-5 shadow-[0_18px_52px_rgba(45,74,138,0.10)] backdrop-blur sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("priceLabel")}</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-mono text-6xl font-black leading-none text-accent">{TRIAL_PAYMENT_PRICE_CNY}</span>
              <span className="pb-1 text-xl font-bold text-secondary">{t("priceUnit")}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-secondary">{t("priceNote")}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-lg border border-line bg-white/[0.86] p-4 shadow-sm">
                <h2 className="text-base font-bold leading-tight text-accent">{benefit.title}</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="relative z-10 rounded-lg border border-white/70 bg-white/[0.84] p-5 shadow-soft backdrop-blur sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="mx-auto w-full max-w-[280px] shrink-0">
              <div className="aspect-square rounded-lg border border-line bg-panel p-5">
                <div className="grid h-full grid-cols-9 grid-rows-9 gap-1" aria-hidden="true">
                  {Array.from(QR_PATTERN_CELLS, (cell, index) => (
                    <span
                      key={index}
                      className={`rounded-[2px] ${cell === "1" ? "bg-accent" : "bg-white"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-sm font-bold text-accent">{t("qrPlaceholder")}</p>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("qrEyebrow")}</p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-accent">{t("qrTitle")}</h2>
              <p className="mt-3 text-sm leading-7 text-secondary">{t("qrDescription")}</p>

              <div className="mt-6 rounded-lg border border-line bg-panel p-4">
                <h3 className="text-base font-bold leading-tight text-accent">{t("remarkTitle")}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{t("remarkText")}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/apply"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-mid-dark hover:shadow-[0_14px_28px_rgba(45,74,138,0.20)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0"
                >
                  {t("applyCta")}
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-accent/[0.45] bg-white px-5 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:-translate-y-px hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0"
                >
                  {t("homeCta")}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
