"use client";

import dynamic from "next/dynamic";

const OfficeGlobe = dynamic(() => import("@/components/OfficeGlobe"), {
  ssr: false,
  loading: () => <div className="office-globe office-globe--loading" aria-hidden="true" />,
});

export function OfficeGlobePanel() {
  return <OfficeGlobe />;
}
