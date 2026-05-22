import { getTranslations, setRequestLocale } from "next-intl/server";
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/content/paymentOffer";
import { Link } from "@/i18n/navigation";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
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
    <main id="main-content">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-[#9dbbff]/12">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.82)_44%,rgba(255,255,255,0.55)_100%),url('/images/robot-valley-hero.png')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-8rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-mid-light/[0.12] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-mid-dark">
              <span className="inline-block h-3 w-0.5 rounded-full bg-accent" aria-hidden="true" />
              {t("eyebrow")}
            </p>
            <h1 className="mt-5 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("description")}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-[1.15fr_0.85fr] sm:items-center">
            <div className="flex flex-col gap-4 rounded-xl border border-white/70 bg-white/[0.78] p-6 shadow-[0_18px_52px_rgba(45,74,138,0.10)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{t("priceLabel")}</p>
                <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="font-mono text-6xl font-black leading-none text-accent">{TRIAL_PAYMENT_PRICE_CNY}</span>
                  <span className="pb-1 text-xl font-bold text-secondary">{t("priceUnit")}</span>
                </div>
              </div>
              <Link
                href="/payment/register"
                className="inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-xl bg-accent px-10 py-4 text-base font-bold text-white shadow-[0_6px_28px_rgba(55,89,187,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-mid-dark hover:shadow-[0_8px_36px_rgba(55,89,187,0.45)]"
              >
                {t("applyCta")}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {benefits.map((benefit, i) => (
              <ScrollReveal key={benefit.title} staggerIndex={i}>
                <article className="group rounded-xl border border-line bg-white/[0.86] p-5 shadow-[0_12px_36px_rgba(45,74,138,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_20px_48px_rgba(45,74,138,0.13)]">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/8">
                      <span className="font-mono text-xs font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold leading-tight text-accent">{benefit.title}</h2>
                      <p className="mt-1.5 text-sm leading-6 text-secondary">{benefit.text}</p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_48%,#eef3fb_100%)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-[-8rem] top-1/4 h-[24rem] w-[24rem] rounded-full bg-mid-light/[0.12] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <ScrollReveal>
            <div className="max-w-3xl">
              <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
                {t("steps.eyebrow")}
              </p>
              <h2 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
                {t("steps.title")}
              </h2>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-secondary">
                {t("steps.description")}
              </p>
            </div>
          </ScrollReveal>

          <div className="relative mt-14">
            <div className="pointer-events-none absolute left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] top-6 hidden h-px bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 sm:block" aria-hidden="true" />

            <div className="grid gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <ScrollReveal key={i} staggerIndex={i}>
                  <article className="group relative overflow-hidden rounded-xl border border-line bg-white/[0.86] p-7 shadow-[0_18px_52px_rgba(45,74,138,0.09)] backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-[0_28px_64px_rgba(45,74,138,0.16)]">
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-accent to-mid-light opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex size-14 items-center justify-center rounded-xl bg-accent/10 transition-colors duration-300 group-hover:bg-accent/15">
                      <span className="font-mono text-xl font-black text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-black leading-tight text-accent">
                      {t(`steps.items.${i}.title`)}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-secondary">
                      {t(`steps.items.${i}.text`)}
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Section */}
      <section className="relative isolate overflow-hidden border-t border-[#9dbbff]/12">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-8rem] top-1/3 h-[24rem] w-[24rem] rounded-full bg-mid-light/[0.12] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <ScrollReveal>
              <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
                {t("showroom.eyebrow")}
              </p>
              <h2 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
                {t("showroom.title")}
              </h2>
              <p className="mt-5 text-pretty text-base leading-8 text-secondary">
                {t("showroom.description")}
              </p>
              <div className="mt-8">
                <Link
                  href="/payment/register"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-mid-dark hover:shadow-lg"
                >
                  {t("applyCta")}
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal staggerIndex={1}>
              <div className="group relative">
                <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-accent/5 to-mid-light/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative overflow-hidden rounded-xl border border-line shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_rgba(45,74,138,0.18)]">
                  <div
                    className="aspect-[16/10] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: "url('/images/show/GXL_5655.JPG')" }}
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_48%,#eef3fb_100%)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-[-8rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-warm-light/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <ScrollReveal>
            <div className="max-w-3xl">
              <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
                {t("faq.eyebrow")}
              </p>
              <h2 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
                {t("faq.title")}
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <ScrollReveal key={i} staggerIndex={i}>
                <article className="group rounded-xl border border-line bg-white/[0.86] p-6 shadow-[0_18px_52px_rgba(45,74,138,0.09)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_rgba(45,74,138,0.15)]">
                  <div className="flex items-start gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 transition-colors duration-300 group-hover:bg-accent/15">
                      <span className="font-mono text-sm font-bold text-accent">Q{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold leading-tight text-accent">
                        {t(`faq.items.${i}.q`)}
                      </h3>
                      <p className="mt-2.5 text-sm leading-7 text-secondary">
                        {t(`faq.items.${i}.a`)}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden border-t border-[#9dbbff]/12">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-6rem] bottom-0 h-[20rem] w-[20rem] rounded-full bg-mid-light/[0.10] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <ScrollReveal>
            <h2 className="text-balance text-3xl font-black leading-tight text-accent sm:text-4xl">
              {t("steps.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-8 text-secondary">
              {t("description")}
            </p>
            <div className="mt-8">
              <Link
                href="/payment/register"
                className="inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-xl bg-accent px-10 py-4 text-base font-bold text-white shadow-[0_6px_28px_rgba(55,89,187,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-mid-dark hover:shadow-[0_8px_36px_rgba(55,89,187,0.45)]"
              >
                {t("applyCta")}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
