import { Link } from "@/i18n/navigation";

type ExperienceStat = {
  value: string;
  label: string;
  text: string;
};

type ExperienceBenefit = {
  title: string;
  text: string;
};

type LandingExperienceBookingProps = {
  eyebrow: string;
  title: string;
  description: string;
  priceLabel: string;
  price: number;
  priceUnit: string;
  priceNote: string;
  ctaLabel: string;
  stats: ExperienceStat[];
  benefits: ExperienceBenefit[];
};

export function LandingExperienceBooking({
  benefits,
  ctaLabel,
  description,
  eyebrow,
  price,
  priceLabel,
  priceNote,
  priceUnit,
  stats,
  title,
}: LandingExperienceBookingProps) {
  const [featuredBenefit, ...secondaryBenefits] = benefits;

  return (
    <section
      id="payment"
      className="relative isolate scroll-mt-24 overflow-hidden border-t border-[#9dbbff]/12 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbfd_48%,#eef3fb_100%)] text-ink"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.035)_1px,transparent_1px)] bg-[size:56px_56px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[-12rem] top-20 h-[28rem] w-[28rem] rounded-full bg-mid-light/[0.15] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-warm-light/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
              {eyebrow}
            </p>
            <h2 className="mt-4 max-w-3xl text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-lg border border-white/70 bg-white/[0.72] p-5 shadow-[0_18px_48px_rgba(45,74,138,0.10)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(45,74,138,0.16)]"
              >
                <div className="flex items-end gap-2">
                  <span className="font-mono text-5xl font-black leading-none text-accent">
                    {stat.value}
                  </span>
                  <span className="pb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-secondary">{stat.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="group relative min-h-[360px] overflow-hidden rounded-lg bg-dark p-6 text-white shadow-[0_24px_72px_rgba(10,30,61,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(10,30,61,0.30)] sm:p-8">
            <div
              className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,16,29,0.92)_0%,rgba(6,16,29,0.68)_48%,rgba(6,16,29,0.30)_100%),url('/images/hero-robot-1.JPG')] bg-cover bg-center"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(rgba(157,187,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(157,187,255,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-55"
              aria-hidden="true"
            />
            <div className="relative flex h-full max-w-xl flex-col justify-end pt-28">
              {featuredBenefit && (
                <>
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#b8ccff]">
                    01
                  </p>
                  <h3 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
                    {featuredBenefit.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[#d8e3f6]">
                    {featuredBenefit.text}
                  </p>
                </>
              )}
            </div>
          </article>

          <div className="grid gap-5">
            {secondaryBenefits.map((benefit, index) => (
              <article
                key={benefit.title}
                className="group rounded-lg border border-line bg-white/[0.86] p-6 shadow-[0_18px_52px_rgba(45,74,138,0.09)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_rgba(45,74,138,0.15)]"
              >
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-mid-light">
                  {String(index + 2).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-accent">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-secondary">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 rounded-lg border border-white/70 bg-white/[0.78] p-4 shadow-[0_24px_72px_rgba(45,74,138,0.12)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_rgba(45,74,138,0.18)] sm:p-5 lg:grid-cols-[0.72fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{priceLabel}</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-mono text-6xl font-black leading-none text-accent">{price}</span>
              <span className="pb-1 text-lg font-bold text-secondary">{priceUnit}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-secondary">{priceNote}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/payment"
              className="inline-flex min-h-16 items-center justify-center rounded-xl bg-accent px-10 py-5 text-lg font-bold text-white shadow-[0_8px_32px_rgba(55,89,187,0.35)] transition-all duration-300 hover:-translate-y-1 hover:bg-mid-dark hover:shadow-[0_12px_40px_rgba(55,89,187,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
