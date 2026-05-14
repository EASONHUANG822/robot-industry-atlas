"use client";

import { useSyncExternalStore, type RefObject } from "react";
import { Link } from "@/i18n/navigation";
import { robotValley } from "@/data/robotValley";
import type { AppLocale } from "@/i18n/routing";
import { useScrollProgress } from "@/hooks/useScrollProgress";

type DetailCardContent = {
  tag: string;
  title: string;
  description: string;
  linkLabel: string;
  href?: string;
};

type DetailContentProps = {
  eyebrow: string;
  title: string;
  description: string;
  addressLabel: string;
  areaLabel: string;
  cards: DetailCardContent[];
  showroomCtaLabel: string;
  showroomHref: string;
  locale: AppLocale;
};

type DetailScrollContentProps = DetailContentProps & {
  sectionRef: RefObject<HTMLElement | null>;
};

/* ------------------------------------------------------------------ */
/*  Opacity helpers                                                    */
/* ------------------------------------------------------------------ */

function fadeIn(from: number, to: number, p: number) {
  if (p <= from) return 0;
  if (p >= to) return 1;
  return (p - from) / (to - from);
}

function fadeOut(from: number, to: number, p: number) {
  if (p <= from) return 1;
  if (p >= to) return 0;
  return 1 - (p - from) / (to - from);
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/*  Phase helpers for desktop (opacity & pointer-events)               */
/* ------------------------------------------------------------------ */

function layerOpacity(p: number, phases: { fadeIn?: [number, number]; hold: [number, number]; fadeOut?: [number, number] }) {
  const { fadeIn: fi, hold, fadeOut: fo } = phases;
  if (fi && p >= fi[0] && p < fi[1]) return fadeIn(fi[0], fi[1], p);
  if (p >= hold[0] && p < hold[1]) return 1;
  if (fo && p >= fo[0] && p < fo[1]) return fadeOut(fo[0], fo[1], p);
  return 0;
}

function layerInteractive(opacity: number) {
  return opacity > 0.5 ? "auto" : "none";
}

export function DetailScrollContent({
  sectionRef,
  ...content
}: DetailScrollContentProps) {
  const {
    eyebrow,
    title,
    description,
    addressLabel,
    areaLabel,
    cards,
    showroomCtaLabel,
    showroomHref,
    locale,
  } = content;
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const shouldAnimate = isDesktop && !prefersReducedMotion;
  const progress = useScrollProgress(sectionRef, shouldAnimate);

  /* ---- mobile / reduced motion: normal flow ---- */
  if (!shouldAnimate) {
    return <NormalDetailContent {...content} />;
  }

  /* ---- desktop: scroll-driven phased animation ---- */

  // Header: 0.00-0.18 visible, 0.18-0.30 fade out
  const hOpacity = layerOpacity(progress, {
    hold: [0.00, 0.18],
    fadeOut: [0.18, 0.30],
  });

  // Card 0 (01): 0.18-0.30 fade in, 0.30-0.48 hold, 0.48-0.60 fade out
  const c0Opacity = layerOpacity(progress, {
    fadeIn: [0.18, 0.30],
    hold: [0.30, 0.48],
    fadeOut: [0.48, 0.60],
  });

  // Card 1 (02): 0.48-0.60 fade in, 0.60-0.72 hold, 0.72-0.84 fade out
  const c1Opacity = layerOpacity(progress, {
    fadeIn: [0.48, 0.60],
    hold: [0.60, 0.72],
    fadeOut: [0.72, 0.84],
  });

  // Card 2 (03): 0.72-0.84 fade in, then stay visible through progress 1.00.
  const c2Opacity = progress >= 0.84 ? 1 : fadeIn(0.72, 0.84, progress);

  return (
    <div data-scroll-progress={progress.toFixed(3)}>
      <div className="relative flex min-h-[420px] lg:h-[calc(100vh-8rem)] lg:min-h-[560px] lg:max-h-[680px]">
        {/* ---- Header layer ---- */}
        <div
          className="absolute inset-0 flex items-start justify-center pt-4 lg:pt-8"
          data-detail-layer="intro"
          style={{
            opacity: hOpacity,
            transition: "opacity 100ms linear",
            pointerEvents: layerInteractive(hOpacity),
          }}
        >
          <div className="w-full">
            <IntroContent
              addressLabel={addressLabel}
              areaLabel={areaLabel}
              description={description}
              eyebrow={eyebrow}
              locale={locale}
              showroomCtaLabel={showroomCtaLabel}
              showroomHref={showroomHref}
              title={title}
            />
          </div>
        </div>

        {/* ---- Card 01 layer ---- */}
        <div
          className="absolute inset-0 flex items-start justify-center pt-4 lg:pt-8"
          data-detail-layer="card-1"
          style={{
            opacity: c0Opacity,
            transition: "opacity 100ms linear",
            pointerEvents: layerInteractive(c0Opacity),
          }}
        >
          <div className="w-full">
            <EditorialCard {...cards[0]} />
          </div>
        </div>

        {/* ---- Card 02 layer ---- */}
        <div
          className="absolute inset-0 flex items-start justify-center pt-4 lg:pt-8"
          data-detail-layer="card-2"
          style={{
            opacity: c1Opacity,
            transition: "opacity 100ms linear",
            pointerEvents: layerInteractive(c1Opacity),
          }}
        >
          <div className="w-full">
            <EditorialCard {...cards[1]} />
          </div>
        </div>

        {/* ---- Card 03 layer ---- */}
        <div
          className="absolute inset-0 flex items-start justify-center pt-4 lg:pt-8"
          data-detail-layer="card-3"
          style={{
            opacity: c2Opacity,
            transition: "opacity 100ms linear",
            pointerEvents: layerInteractive(c2Opacity),
          }}
        >
          <div className="w-full">
            <EditorialCard {...cards[2]} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Internal sub-components                                            */
/* ------------------------------------------------------------------ */
function NormalDetailContent({
  addressLabel,
  areaLabel,
  cards,
  description,
  eyebrow,
  locale,
  showroomCtaLabel,
  showroomHref,
  title,
}: DetailContentProps) {
  return (
    <div>
      <IntroContent
        addressLabel={addressLabel}
        areaLabel={areaLabel}
        description={description}
        eyebrow={eyebrow}
        locale={locale}
        showroomCtaLabel={showroomCtaLabel}
        showroomHref={showroomHref}
        title={title}
      />
      <div className="mt-10 divide-y divide-[#9dbbff]/12">
        {cards.map((card) => (
          <EditorialCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

function IntroContent({
  addressLabel,
  areaLabel,
  description,
  eyebrow,
  locale,
  showroomCtaLabel,
  showroomHref,
  title,
}: Omit<DetailContentProps, "cards">) {
  return (
    <>
      <div>
        <p className="inline-flex border-l-2 border-[#7fb0ff] pl-3 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-[#9dbbff]">
          {eyebrow}
        </p>
        <h2 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
          {title}
        </h2>
        <p className="mt-5 text-pretty text-base leading-8 text-secondary">{description}</p>
      </div>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        <DetailMetric label={addressLabel} value={robotValley.address[locale]} />
        <DetailMetric label={areaLabel} value={robotValley.stats.showroomArea[locale]} />
      </dl>
      <Link
        href={showroomHref}
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {showroomCtaLabel}
      </Link>
    </>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#9dbbff]/18 bg-gray-50 px-3 py-3">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1e5fbb]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold text-accent">{value}</dd>
    </div>
  );
}

function EditorialCard({ tag, title, description, linkLabel, href }: DetailCardContent) {
  const body = (
    <div className="py-10 first:pt-0 last:pb-0 sm:py-14">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent">
          <span>[</span>
          <span>{tag}</span>
          <span>]</span>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <h3 className="text-balance text-3xl font-bold tracking-tight text-accent md:text-4xl lg:text-5xl">
              {title}
            </h3>
          </div>
        </div>
      </div>
      <p className="mt-10 max-w-xl text-pretty text-base leading-8 text-secondary">
        {description}
      </p>
      {href && (
        <div className="mt-8">
          <Link
            href={href}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-accent/25 bg-transparent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {linkLabel}
          </Link>
        </div>
      )}
    </div>
  );

  return body;
}
