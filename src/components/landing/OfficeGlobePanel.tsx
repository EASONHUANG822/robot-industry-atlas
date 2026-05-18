"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";

const OfficeGlobe = dynamic(() => import("@/components/OfficeGlobe"), {
  ssr: false,
  loading: () => <div className="office-globe office-globe--loading" aria-hidden="true" />,
});

type OfficeGlobePanelProps = {
  ariaLabel: string;
  hubLabel: string;
  scrollContainerRef: RefObject<HTMLElement | null>;
};

export function OfficeGlobePanel({
  ariaLabel,
  hubLabel,
  scrollContainerRef,
}: OfficeGlobePanelProps) {
  return (
    <OfficeGlobe
      ariaLabel={ariaLabel}
      hubLabel={hubLabel}
      scrollContainerRef={scrollContainerRef}
    />
  );
}
