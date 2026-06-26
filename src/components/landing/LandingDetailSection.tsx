"use client";

import { useRef } from "react";
import type { AppLocale } from "@/i18n/routing";
import { DetailScrollContent } from "./DetailScrollContent";
import { OfficeGlobePanel } from "./OfficeGlobePanel";

type DetailCardContent = {
  tag: string;
  title: string;
  description: string;
  linkLabel: string;
  href?: string;
};

type LandingDetailSectionProps = {
  locale: AppLocale;
  eyebrow: string;
  title: string;
  description: string;
  addressLabel: string;
  areaLabel: string;
  cards: DetailCardContent[];
  showroomCtaLabel: string;
  showroomHref: string;
};

export function LandingDetailSection(props: LandingDetailSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionRef}
      id="robot-valley-detail"
      className="relative isolate scroll-mt-24 border-t border-white bg-[linear-gradient(180deg,#eef3fb_0%,#f7f9fd_42%,#ffffff_100%)] text-gray-900 lg:min-h-[260vh] motion-reduce:lg:min-h-0"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(31,95,187,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(31,95,187,0.035)_1px,transparent_1px)] bg-[size:48px_48px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-10%] top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-[#7fb0ff] opacity-[0.05] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[max(2rem,calc((100vw-80rem)/2))] top-16 hidden h-[calc(100%-8rem)] w-px bg-gradient-to-b from-transparent via-[#7fb0ff]/10 to-transparent lg:block"
        aria-hidden="true"
      />
      <div className="relative z-10 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-hidden motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 sm:px-6 lg:h-full lg:grid-cols-[minmax(380px,520px)_minmax(480px,620px)] lg:items-center lg:gap-12 lg:px-8 lg:py-0 xl:gap-16 motion-reduce:lg:h-auto motion-reduce:lg:items-start motion-reduce:lg:py-16">
          {/* Left column: scroll-driven stack inside the shared sticky viewport */}
          <div className="flex w-full items-center lg:h-full">
            <div className="w-full max-w-[520px]">
              <div className="block lg:hidden">
                <DetailScrollContent {...props} sectionRef={sectionRef} variant="static" />
              </div>
              <div className="hidden lg:block">
                <DetailScrollContent {...props} sectionRef={sectionRef} variant="desktop" />
              </div>
            </div>
          </div>

          {/* Right column: globe shares the same sticky viewport as the left stack */}
          <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden lg:h-full lg:overflow-visible">
            <div className="w-full max-w-[560px] xl:max-w-[620px] xl:translate-x-6">
              <OfficeGlobePanel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
