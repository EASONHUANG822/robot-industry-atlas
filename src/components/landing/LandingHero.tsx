import { Link } from "@/i18n/navigation";

type LandingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  learnMoreLabel: string;
  learnMoreHref: string;
  applyLabel: string;
};

export function LandingHero({
  applyLabel,
  description,
  eyebrow,
  learnMoreHref,
  learnMoreLabel,
  title,
}: LandingHeroProps) {
  return (
    <section className="hero-bg-cycle relative isolate overflow-hidden bg-[#06101d] text-white">
      <div className="hero-bg-cycle__layer hero-bg-cycle__layer--photo" aria-hidden="true" />
      <div className="hero-bg-cycle__layer hero-bg-cycle__layer--bg1" aria-hidden="true" />
      <div className="hero-bg-cycle__layer hero-bg-cycle__layer--bg2" aria-hidden="true" />
      <div className="hero-bg-cycle__layer hero-bg-cycle__layer--robot1" aria-hidden="true" />
      <div className="hero-bg-cycle__layer hero-bg-cycle__layer--robot2" aria-hidden="true" />


      <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-7xl items-center gap-12 px-4 py-16 pb-24 sm:px-6 lg:grid-cols-[1fr_0.76fr] lg:px-8">
        <div className="hero-copy-reveal max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-[#b8ccff]">
            <span className="inline-block h-3 w-0.5 rounded-full bg-[#7fb0ff]" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-5 text-balance text-5xl font-black leading-[0.94] text-white sm:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#d8e3f6]">{description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/apply"
              className="hero-primary-cta inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:-translate-y-px hover:bg-[#edf3ff] hover:shadow-[0_16px_34px_rgba(127,176,255,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0"
            >
              {applyLabel}
            </Link>
            <Link
              href={learnMoreHref}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/[0.45] bg-white/[0.08] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:border-white/75 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0"
            >
              {learnMoreLabel}
            </Link>
          </div>
        </div>

      </div>
      <div className="hero-scanline-effect" aria-hidden="true" />
    </section>
  );
}
