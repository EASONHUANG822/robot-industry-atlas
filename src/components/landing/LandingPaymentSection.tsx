import { Link } from "@/i18n/navigation";

type PaymentBenefit = {
  title: string;
  text: string;
};

type LandingPaymentSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  priceLabel: string;
  price: number;
  priceUnit: string;
  ctaLabel: string;
  supportLabel: string;
  benefits: PaymentBenefit[];
};

export function LandingPaymentSection({
  benefits,
  ctaLabel,
  description,
  eyebrow,
  price,
  priceLabel,
  priceUnit,
  supportLabel,
  title,
}: LandingPaymentSectionProps) {
  return (
    <section id="payment" className="scroll-mt-24 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-accent sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-8 text-secondary">{description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/payment"
              className="inline-flex min-h-12 items-center justify-center rounded bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {ctaLabel}
            </Link>
            <Link
              href="/apply"
              className="inline-flex min-h-12 items-center justify-center rounded border border-line bg-white px-6 py-3 text-base font-semibold text-accent transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {supportLabel}
            </Link>
          </div>
        </div>

        <div className="rounded border border-line bg-panel p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{priceLabel}</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-5xl font-black leading-none text-accent sm:text-6xl">{price}</span>
            <span className="pb-1 text-lg font-bold text-secondary">{priceUnit}</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="rounded border border-line bg-white p-4">
                <h3 className="text-base font-bold leading-tight text-accent">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
