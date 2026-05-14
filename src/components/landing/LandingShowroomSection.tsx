import { Link } from "@/i18n/navigation";

type Stat = { label: string; value: string };

type LandingShowroomSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  applyLabel: string;
  stats: Stat[];
};

export function LandingShowroomSection({
  applyLabel,
  description,
  eyebrow,
  stats,
  title,
}: LandingShowroomSectionProps) {
  return (
    <section id="showroom" className="scroll-mt-24 border-t border-line bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
        <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-accent sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-8 text-secondary">{description}</p>

        {stats.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-6 sm:gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-accent sm:text-4xl">{stat.value}</span>
                <span className="text-sm font-semibold uppercase tracking-wide text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/apply"
            className="inline-flex min-h-12 items-center rounded bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {applyLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
