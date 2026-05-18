"use client";

import { useSyncExternalStore, type RefObject } from "react";
import { Link } from "@/i18n/navigation";
import { robotValley } from "@/data/robotValley";
import type { AppLocale } from "@/i18n/routing";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import {
  DETAIL_SCROLL_STEP_THRESHOLDS,
  getActiveDetailStepIndex,
} from "./detailScrollSteps";

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
  variant?: "desktop" | "static";
};

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

export function DetailScrollContent({
  sectionRef,
  variant = "desktop",
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
  const shouldAnimate = variant === "desktop" && isDesktop && !prefersReducedMotion;
  const progress = useScrollProgress(sectionRef, shouldAnimate);

  /* ---- mobile / reduced motion: normal flow ---- */
  if (!shouldAnimate) {
    return <NormalDetailContent {...content} />;
  }

  /* ---- desktop: scroll-driven phased animation ---- */

  const steps = [
    {
      id: "intro",
      content: (
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
      ),
    },
    ...cards.map((card, index) => ({
      id: `card-${index + 1}`,
      content: <EditorialCard {...card} />,
    })),
  ];
  const activeIndex = Math.min(
    getActiveDetailStepIndex(progress, DETAIL_SCROLL_STEP_THRESHOLDS),
    steps.length - 1,
  );

  return (
    <div data-active-step={activeIndex} data-scroll-progress={progress.toFixed(3)}>
      <div className="relative flex min-h-[420px] lg:h-[calc(100vh-8rem)] lg:min-h-[560px] lg:max-h-[680px]">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;

          return (
            <div
              key={step.id}
              aria-hidden={!isActive}
              className="absolute inset-0 flex items-start justify-center pt-4 lg:pt-8"
              data-active={isActive ? "true" : "false"}
              data-detail-layer={step.id}
              style={{
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? "auto" : "none",
                zIndex: isActive ? 10 : 0,
              }}
            >
              <div className="w-full">{step.content}</div>
            </div>
          );
        })}
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
