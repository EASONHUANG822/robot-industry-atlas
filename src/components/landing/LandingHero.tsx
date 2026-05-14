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
      <div className="hero-bg-cycle__matrix" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(139,173,230,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(139,173,230,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="hero-rail hero-rail--top pointer-events-none absolute inset-x-0 top-28 h-px" />
      <div className="hero-rail hero-rail--bottom pointer-events-none absolute bottom-24 left-0 h-px w-2/3" />

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
              className="hero-primary-cta inline-flex min-h-12 items-center justify-center rounded bg-white px-5 py-3 text-sm font-semibold text-[#173e8f] transition-colors hover:bg-[#e6efff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {applyLabel}
            </Link>
            <Link
              href={learnMoreHref}
              className="inline-flex min-h-12 items-center justify-center rounded border border-[#9dbbff]/45 bg-[#8fb4ff]/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-[#8fb4ff]/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {learnMoreLabel}
            </Link>
          </div>
        </div>

      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-page to-transparent" />
    </section>
  );
}
