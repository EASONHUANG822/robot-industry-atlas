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
      className="relative lg:min-h-[350vh] isolate scroll-mt-24 border-t border-[#9dbbff]/12 bg-white text-gray-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(157,187,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(157,187,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#7fb0ff]/8 to-transparent" />
      <div className="relative lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-hidden motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 sm:px-6 lg:h-full lg:grid-cols-[minmax(380px,520px)_minmax(480px,620px)] lg:items-center lg:gap-12 lg:px-8 lg:py-0 xl:gap-16 motion-reduce:lg:h-auto motion-reduce:lg:items-start motion-reduce:lg:py-16">
          {/* Left column: scroll-driven stack inside the shared sticky viewport */}
          <div className="flex w-full items-center lg:h-full">
            <div className="w-full max-w-[520px]">
              <DetailScrollContent {...props} sectionRef={sectionRef} />
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
