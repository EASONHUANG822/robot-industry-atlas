import { getTranslations, setRequestLocale } from "next-intl/server";
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import { ApplicationModal } from "@/components/ApplicationModal";
import type { AppLocale } from "@/i18n/routing";

type PaymentPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

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
      {/* Hero Section */}
      <section className="relative isolate mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div
          className="pointer-events-none absolute right-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full bg-mid-light/[0.15] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl">
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
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <ApplicationModal
            triggerLabel={t("applyCta")}
            formTitle={t("formTitle")}
            formDescription={t("formDescription")}
            successTitle={t("successTitle")}
            successMessage={t("successMessage")}
            homeCta={t("homeCta")}
            paymentMode={true}
            locale={locale}
          />
        </div>
      </section>
    </main>
  );
}
