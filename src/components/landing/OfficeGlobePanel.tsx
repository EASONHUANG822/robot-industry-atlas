"use client";

import dynamic from "next/dynamic";

const Globe3D = dynamic(() => import("@/components/Globe3D"), {
  ssr: false,
  loading: () => (
    <div
      className="office-globe office-globe--loading aspect-square w-full"
      aria-hidden="true"
    />
  ),
});

export function OfficeGlobePanel() {
  return (
    <div className="aspect-square w-full">
      <Globe3D />
    </div>
  );
}
