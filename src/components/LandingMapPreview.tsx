"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { VisitApplicationButton } from "@/components/VisitApplicationButton";
import { localizeCompany, type RobotCompany } from "@/data/companies";
import { robotValley } from "@/data/robotValley";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { configureAMapSecurity, loadAMap } from "@/lib/amap";
import { getMarkerContent } from "@/lib/markers";

type LandingMapPreviewProps = {
  companies: RobotCompany[];
};

type MapStatus = "loading" | "ready" | "missing-key" | "error";

const ROBOT_VALLEY_ZOOM = 14;
const NANSHAN_BOUNDS_SOUTH_WEST: [number, number] = [113.86, 22.46];
const NANSHAN_BOUNDS_NORTH_EAST: [number, number] = [114.02, 22.62];

export function LandingMapPreview({ companies }: LandingMapPreviewProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LandingMap");
  const robotValleyMarkerLabel = t("robotValleyMarkerLabel");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nanshanBoundaryRef = useRef<AMap.Polygon | null>(null);
  const nanshanMaskRef = useRef<AMap.Polygon | null>(null);
  const robotValleyMarkerRef = useRef<AMap.Marker | null>(null);
  const robotValleyZoneRef = useRef<AMap.Polygon | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const markerRefs = useRef<AMap.Marker[]>([]);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCompany = useMemo(
    () => (selectedId ? companies.find((company) => company.id === selectedId) : undefined),
    [companies, selectedId],
  );
  const localizedSelectedCompany = selectedCompany ? localizeCompany(selectedCompany, locale) : undefined;

  useEffect(() => {
    let cancelled = false;

    async function bootMap() {
      if (typeof window === "undefined") {
        return;
      }

      if (!process.env.NEXT_PUBLIC_AMAP_KEY) {
        setStatus("missing-key");
        return;
      }

      configureAMapSecurity();

      try {
        await loadAMap();

        if (cancelled || !containerRef.current || !window.AMap) {
          return;
        }

        mapRef.current = new window.AMap.Map(containerRef.current, {
          center: robotValley.coordinates,
          zoom: ROBOT_VALLEY_ZOOM,
          viewMode: "2D",
          mapStyle: "amap://styles/whitesmoke",
        });
        mapRef.current.add(new window.AMap.Scale());
        applyNanshanLimitBounds(mapRef.current);
        drawNanshanBoundary(mapRef.current, {
          onBoundaryReady: (polygon) => {
            nanshanBoundaryRef.current = polygon;
          },
          onMaskReady: (polygon) => {
            nanshanMaskRef.current = polygon;
          },
        });
        robotValleyZoneRef.current = drawRobotValleyZone(mapRef.current);
        robotValleyMarkerRef.current = drawRobotValleyMarker(mapRef.current, {
          label: robotValleyMarkerLabel,
          onClick: () => {
            setSelectedId(null);
            try {
              mapRef.current?.setZoomAndCenter(ROBOT_VALLEY_ZOOM, robotValley.coordinates);
            } catch {
              // Camera movement is decorative for this preview.
            }
          },
        });
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }

    bootMap();

    return () => {
      cancelled = true;
      removeMarkers(markerRefs.current);
      markerRefs.current = [];
      robotValleyMarkerRef.current?.setMap(null);
      robotValleyMarkerRef.current = null;
      robotValleyZoneRef.current?.setMap(null);
      robotValleyZoneRef.current = null;
      nanshanBoundaryRef.current?.setMap(null);
      nanshanBoundaryRef.current = null;
      nanshanMaskRef.current?.setMap(null);
      nanshanMaskRef.current = null;
      destroyMap(mapRef.current);
      mapRef.current = null;
    };
  }, [robotValleyMarkerLabel]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !window.AMap || status !== "ready") {
      return;
    }

    try {
      removeMarkers(markerRefs.current);
      markerRefs.current = companies.flatMap((company) => {
        const localizedCompany = localizeCompany(company, locale);
        if (!localizedCompany.coordinates) {
          return [];
        }

        const selected = company.id === selectedId;
        const marker = new window.AMap!.Marker({
          position: localizedCompany.coordinates,
          title: localizedCompany.name,
          offset: new window.AMap!.Pixel(0, 0),
          zIndex: selected ? 1000 : 100,
          content: getMarkerContent({
            categoryKey: company.categoryKey,
            label: localizedCompany.name,
            selected,
          }),
        });

        marker.on("click", () => setSelectedId(company.id));
        return [marker];
      });

      markerRefs.current.forEach((marker) => mapRef.current?.add(marker));
    } catch (error) {
      console.error("Landing map marker rendering failed", error);
      removeMarkers(markerRefs.current);
      markerRefs.current = [];
      setStatus("error");
    }
  }, [companies, locale, selectedId, status]);

  return (
    <div className="w-full overflow-hidden rounded border border-line bg-white shadow-soft">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-slate-50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-accent">{t("title")}</p>
          <p className="mt-1 text-xs text-[#7a9bc7]">{t("subtitle", { count: companies.length })}</p>
        </div>
        <Link href="/map" className="rounded bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
          {t("openFullMap")}
        </Link>
      </div>

      <div className="grid h-[680px] min-h-0 grid-rows-[minmax(0,1fr)_240px] gap-0 lg:h-[460px] lg:grid-cols-[minmax(0,1fr)_230px] lg:grid-rows-1">
        <MapErrorBoundary fallback={<LandingMapStatus status="error" />}>
          <div className="relative min-h-0 bg-slate-200">
            <div ref={containerRef} className="h-full min-h-0 w-full" />
            {status !== "ready" ? <LandingMapStatus status={status} /> : null}
          </div>
        </MapErrorBoundary>

        <aside className="flex min-h-0 flex-col overflow-hidden border-t border-line bg-white p-4 lg:border-l lg:border-t-0">
          <div className="scrollbar-hidden min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {selectedCompany && localizedSelectedCompany ? (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("selectedCompany")}</p>
                  <h2 className="mt-2 line-clamp-3 break-words text-lg font-bold text-accent">
                    {localizedSelectedCompany.name}
                  </h2>
                  <p className="mt-1 break-words text-sm font-medium text-[#7a9bc7]">
                    {localizedSelectedCompany.address}
                  </p>
                </div>
                <p className="break-words text-sm leading-6 text-[#4a6fa5]">{localizedSelectedCompany.description}</p>
                <div className="flex flex-wrap gap-2">
                  {localizedSelectedCompany.products.slice(0, 3).map((area) => (
                    <span
                      key={area}
                      className="max-w-full break-words rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-[#3a5a8a]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/company/${selectedCompany.id}`}
                  className="inline-flex rounded border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
                >
                  {t("viewProfile")}
                </Link>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("showroomEyebrow")}</p>
                  <h2 className="mt-2 break-words text-lg font-bold text-accent">{t("showroomName")}</h2>
                  <p className="mt-1 break-words text-sm font-medium text-[#7a9bc7]">{robotValley.address[locale]}</p>
                </div>
                <p className="break-words text-sm leading-6 text-[#4a6fa5]">{t("showroomDescription")}</p>
                <VisitApplicationButton
                  label={t("applyToVisit")}
                  className="inline-flex rounded bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function drawRobotValleyMarker(
  map: AMap.Map,
  { label, onClick }: { label: string; onClick: () => void },
) {
  if (typeof window === "undefined" || typeof document === "undefined" || !window.AMap) {
    return null;
  }

  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = "robot-valley-marker";
  markerElement.setAttribute("aria-label", label);
  markerElement.innerHTML = `<span class="robot-valley-marker__core"></span><span class="robot-valley-marker__label">${escapeHtml(label)}</span>`;
  markerElement.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });

  const marker = new window.AMap.Marker({
    content: markerElement,
    offset: new window.AMap.Pixel(0, 0),
    position: robotValley.coordinates,
    title: label,
    zIndex: 1800,
  });
  map.add(marker);

  return marker;
}

function drawRobotValleyZone(map: AMap.Map) {
  if (typeof window === "undefined" || !window.AMap?.Polygon) {
    return null;
  }

  try {
    const polygon = new window.AMap.Polygon({
      bubble: true,
      fillColor: "#3759bb",
      fillOpacity: 0.14,
      path: robotValley.zonePath,
      strokeColor: "#3759bb",
      strokeOpacity: 0.72,
      strokeWeight: 2,
    });
    polygon.setMap(map);
    return polygon;
  } catch {
    return null;
  }
}

function removeMarkers(markers: AMap.Marker[]) {
  markers.forEach((marker) => {
    try {
      marker.setMap(null);
    } catch {
      // AMap may already have disposed the marker during route changes.
    }
  });
}

function applyNanshanLimitBounds(map: AMap.Map) {
  if (typeof window === "undefined" || !window.AMap?.Bounds || typeof map.setLimitBounds !== "function") {
    return;
  }

  try {
    map.setLimitBounds(new window.AMap.Bounds(NANSHAN_BOUNDS_SOUTH_WEST, NANSHAN_BOUNDS_NORTH_EAST));
  } catch {
    // The filtered company dataset still keeps the landing map Nanshan-only.
  }
}

function drawNanshanBoundary(
  map: AMap.Map,
  handlers: {
    onBoundaryReady: (polygon: AMap.Polygon) => void;
    onMaskReady: (polygon: AMap.Polygon) => void;
  },
) {
  if (typeof window === "undefined" || !window.AMap?.DistrictSearch || !window.AMap.Polygon) {
    return;
  }

  try {
    const districtSearch = new window.AMap.DistrictSearch({
      extensions: "all",
      level: "district",
      subdistrict: 0,
    });

    districtSearch.search("深圳市南山区", (searchStatus, result) => {
      if (searchStatus !== "complete" || !result.districtList?.length || !window.AMap?.Polygon) {
        return;
      }

      const boundaries = result.districtList[0]?.boundaries ?? [];
      const firstBoundary = boundaries.find(Array.isArray);
      if (!firstBoundary) {
        return;
      }

      try {
        const mask = createNanshanOutsideMask(firstBoundary as AMap.PolygonRing);
        if (mask) {
          mask.setMap(map);
          handlers.onMaskReady(mask);
        }

        const polygon = new window.AMap.Polygon({
          bubble: true,
          fillColor: "#3759bb",
          fillOpacity: 0.04,
          path: firstBoundary as AMap.PolygonRing,
          strokeColor: "#3759bb",
          strokeOpacity: 0.65,
          strokeWeight: 2,
        });
        polygon.setMap(map);
        handlers.onBoundaryReady(polygon);
      } catch {
        // Boundary styling is a visual enhancement only.
      }
    });
  } catch {
    // Some AMap key/plugin configurations may not expose DistrictSearch.
  }
}

function createNanshanOutsideMask(innerBoundary: AMap.PolygonRing) {
  if (typeof window === "undefined" || !window.AMap?.Polygon) {
    return undefined;
  }

  try {
    const outerBounds: AMap.PolygonRing = [
      [113.75, 22.38],
      [114.13, 22.38],
      [114.13, 22.72],
      [113.75, 22.72],
    ];

    return new window.AMap.Polygon({
      bubble: true,
      fillColor: "#f8fafc",
      fillOpacity: 0.62,
      path: [outerBounds, innerBoundary],
      strokeOpacity: 0,
      strokeWeight: 0,
    });
  } catch {
    return undefined;
  }
}

function destroyMap(map: AMap.Map | null) {
  try {
    map?.destroy();
  } catch {
    // AMap can already be disposed while React is unmounting.
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function LandingMapStatus({ status }: { status: Exclude<MapStatus, "ready"> }) {
  const t = useTranslations("LandingMap");
  const messageKey = status === "missing-key" ? "missingKey" : status;

  return (
    <div className="absolute inset-0 grid place-items-center bg-panel/92 p-6 text-center">
      <div className="max-w-sm rounded border border-line bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold text-accent">{t(messageKey)}</p>
        <p className="mt-2 text-xs leading-5 text-[#7a9bc7]">{t("fallback")}</p>
      </div>
    </div>
  );
}
