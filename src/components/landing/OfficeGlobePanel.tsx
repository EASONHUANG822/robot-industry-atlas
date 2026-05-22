"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";

const Globe3D = dynamic(() => import("@/components/Globe3D"), {
  ssr: false,
  loading: () => (
    <div
      className="office-globe office-globe--loading aspect-square w-full"
      aria-hidden="true"
    />
  ),
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
    <div className="aspect-square w-full">
      <Globe3D />
    </div>
  );
}
