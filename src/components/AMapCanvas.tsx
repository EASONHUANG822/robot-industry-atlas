"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CategoryLegend } from "@/components/CategoryLegend";
import { getCategoryStyle, localizeCompany, type CompanyCategoryKey, type RobotCompany } from "@/data/companies";
import { robotValley } from "@/data/robotValley";
import { configureAMapSecurity, loadAMap } from "@/lib/amap";
import type { AppLocale } from "@/i18n/routing";

type AMapCanvasProps = {
  companies: RobotCompany[];
  visibleCategoryKeys?: CompanyCategoryKey[];
  selectedCompany?: RobotCompany;
  highlightedCompany?: RobotCompany;
  emptyMessageKey: "empty" | "nanshanEmpty";
  focusRequestKey: number;
  onClearSelection: () => void;
  onSelectCompany: (company: RobotCompany) => void;
};

type MarkerHandlers = {
  click: (event: Event) => void;
  mouseenter: () => void;
  mouseleave: () => void;
  touchstart: (event: Event) => void;
};

type MarkerEntry = {
  company: RobotCompany;
  coordinates: [number, number];
  element: HTMLButtonElement;
  handlers: MarkerHandlers;
  label: string;
  marker: AMap.Marker;
  selected: boolean;
};

const MAX_RENDERED_MARKERS = 450;
const POPUP_HIDE_DELAY_MS = 160;
const NANSHAN_CENTER: [number, number] = robotValley.coordinates;
const NANSHAN_ZOOM = 14;
const ROBOT_VALLEY_ZOOM = 15;
const SELECTED_COMPANY_ZOOM = 16;
const NANSHAN_BOUNDS_SOUTH_WEST: [number, number] = [113.86, 22.46];
const NANSHAN_BOUNDS_NORTH_EAST: [number, number] = [114.02, 22.62];

export function AMapCanvas({
  companies,
  emptyMessageKey,
  focusRequestKey,
  highlightedCompany,
  selectedCompany,
  visibleCategoryKeys,
  onClearSelection,
  onSelectCompany,
}: AMapCanvasProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Map");
  const activePopupCompanyIdRef = useRef<string | null>(null);
  const containerClickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hidePopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoWindowRef = useRef<AMap.InfoWindow | null>(null);
  const lastCenteredSelectedIdRef = useRef(selectedCompany?.id);
  const lastFocusRequestKeyRef = useRef(focusRequestKey);
  const mapClickHandlerRef = useRef<(() => void) | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const markerEntriesRef = useRef<MarkerEntry[]>([]);
  const markerRefs = useRef<AMap.Marker[]>([]);
  const nanshanBoundaryRef = useRef<AMap.Polygon | null>(null);
  const nanshanMaskRef = useRef<AMap.Polygon | null>(null);
  const popupContentCleanupRef = useRef<(() => void) | null>(null);
  const robotValleyMarkerRef = useRef<AMap.Marker | null>(null);
  const robotValleyZoneRef = useRef<AMap.Polygon | null>(null);
  const lastMarkerTouchAtRef = useRef(0);
  const suppressMapClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextMapClickRef = useRef(false);
  const unmountedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    unmountedRef.current = false;

    async function bootMap() {
      if (typeof window === "undefined") {
        return;
      }

      const key = process.env.NEXT_PUBLIC_AMAP_KEY;

      if (!key) {
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
          center: NANSHAN_CENTER,
          zoom: NANSHAN_ZOOM,
          viewMode: "2D",
          mapStyle: "amap://styles/darkblue",
        });
        mapRef.current.add(new window.AMap.Scale());
        mapRef.current.add(new window.AMap.ToolBar({ position: "RT" }));
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
          label: t("robotValleyMarkerLabel"),
          onClick: () => {
            preventNextMapClick();
            closePopup();
            onClearSelection();
            focusMapOnCoordinates(robotValley.coordinates, ROBOT_VALLEY_ZOOM);
            showRobotValleyPopup();
          },
        });
        infoWindowRef.current = new window.AMap.InfoWindow({
          anchor: "middle-left",
          isCustom: true,
          offset: new window.AMap.Pixel(16, 0),
        });

        const handleMapClick = () => {
          if (suppressNextMapClickRef.current) {
            suppressNextMapClickRef.current = false;
            clearSuppressMapClickTimer();
            return;
          }

          closePopup();
          onClearSelection();
        };

        mapClickHandlerRef.current = handleMapClick;
        mapRef.current.on("click", handleMapClick);

        const handleContainerClick = () => {
          if (suppressNextMapClickRef.current) {
            suppressNextMapClickRef.current = false;
            clearSuppressMapClickTimer();
            return;
          }

          closePopup();
          onClearSelection();
        };

        containerClickHandlerRef.current = handleContainerClick;
        containerRef.current.addEventListener("click", handleContainerClick);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }

    bootMap();

    return () => {
      cancelled = true;
      unmountedRef.current = true;
      clearHidePopupTimer();
      clearSuppressMapClickTimer();
      closePopup();
      cleanupMarkerEntries(markerEntriesRef.current);
      markerEntriesRef.current = [];
      markerRefs.current = [];

      nanshanBoundaryRef.current?.setMap(null);
      nanshanBoundaryRef.current = null;
      nanshanMaskRef.current?.setMap(null);
      nanshanMaskRef.current = null;
      robotValleyMarkerRef.current?.setMap(null);
      robotValleyMarkerRef.current = null;
      robotValleyZoneRef.current?.setMap(null);
      robotValleyZoneRef.current = null;

      if (mapRef.current && mapClickHandlerRef.current) {
        mapRef.current.off?.("click", mapClickHandlerRef.current);
      }
      mapClickHandlerRef.current = null;

      if (containerRef.current && containerClickHandlerRef.current) {
        containerRef.current.removeEventListener("click", containerClickHandlerRef.current);
      }
      containerClickHandlerRef.current = null;

      destroyMap(mapRef.current);
      mapRef.current = null;
      infoWindowRef.current = null;
    };
  }, [onClearSelection]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !window.AMap || status !== "ready") {
      return;
    }

    let markerEntries: MarkerEntry[] = [];

    try {
      cleanupMarkerEntries(markerEntriesRef.current);
      const selectedCompanyInList = selectedCompany && companies.some((company) => company.id === selectedCompany.id);
      const renderQueue = companies.slice(0, MAX_RENDERED_MARKERS);

      if (
        selectedCompanyInList &&
        selectedCompany &&
        !renderQueue.some((company) => company.id === selectedCompany.id)
      ) {
        renderQueue.push(selectedCompany);
      }

      if (
        highlightedCompany &&
        companies.some((company) => company.id === highlightedCompany.id) &&
        !renderQueue.some((company) => company.id === highlightedCompany.id)
      ) {
        renderQueue.push(highlightedCompany);
      }

      markerEntries = renderQueue.flatMap((company) => {
        const localizedCompany = localizeCompany(company, locale);
        const coordinates = localizedCompany.coordinates;
        if (!coordinates || company.geocodeStatus === "missing") {
          return [];
        }

        const selected = company.id === selectedCompany?.id;
        const highlighted = company.id === highlightedCompany?.id;
        const handlers: MarkerHandlers = {
          click: (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (Date.now() - lastMarkerTouchAtRef.current < 500) {
              return;
            }

            activateMarker(company, coordinates);
          },
          mouseenter: () => {
            if (!markerEntriesRef.current.some((item) => item.marker === marker)) {
              return;
            }

            clearHidePopupTimer();
            showPopup(company, coordinates);
          },
          mouseleave: () => {
            if (markerEntriesRef.current.some((item) => item.marker === marker)) {
              scheduleClosePopup();
            }
          },
          touchstart: (event) => {
            event.preventDefault();
            event.stopPropagation();
            lastMarkerTouchAtRef.current = Date.now();
            activateMarker(company, coordinates);
          },
        };
        const element = createMarkerElement({
          categoryKey: company.categoryKey,
          geocodeStatus: company.geocodeStatus,
          handlers,
          label: localizedCompany.name,
          selected: selected || highlighted,
        });
        const marker = new window.AMap!.Marker({
          content: element,
          offset: new window.AMap!.Pixel(0, 0),
          position: coordinates,
          title: localizedCompany.name,
          zIndex: selected ? 1000 : 100,
        });

        const entry: MarkerEntry = {
          company,
          coordinates,
          element,
          handlers,
          label: localizedCompany.name,
          marker,
          selected: selected || highlighted,
        };
        return [entry];
      });

      markerEntriesRef.current = markerEntries;
      markerRefs.current = markerEntries.map((entry) => entry.marker);

      markerEntries.forEach((entry) => {
        if (entry.company.id === activePopupCompanyIdRef.current || entry.company.id === highlightedCompany?.id) {
          setMarkerVisual(entry, true);
        }
        mapRef.current?.add(entry.marker);
      });

      const activePopupStillVisible =
        activePopupCompanyIdRef.current &&
        markerEntries.some((entry) => entry.company.id === activePopupCompanyIdRef.current);

      if (!activePopupStillVisible) {
        closePopup();
      }

    } catch (error) {
      console.error("AMap marker rendering failed", error);
      cleanupMarkerEntries(markerEntriesRef.current);
      markerEntriesRef.current = [];
      markerRefs.current = [];
      setStatus("error");
    }

    return () => {
      cleanupMarkerEntries(markerEntries);
      if (markerEntriesRef.current === markerEntries) {
        markerEntriesRef.current = [];
        markerRefs.current = [];
      }
    };
  }, [
    companies,
    highlightedCompany,
    highlightedCompany?.id,
    locale,
    onClearSelection,
    onSelectCompany,
    selectedCompany,
    selectedCompany?.id,
    status,
  ]);

  useEffect(() => {
    const localizedCompany = selectedCompany ? localizeCompany(selectedCompany, locale) : undefined;
    if (!selectedCompany) {
      lastCenteredSelectedIdRef.current = undefined;
      lastFocusRequestKeyRef.current = focusRequestKey;
    }

    if (
      localizedCompany?.coordinates &&
      selectedCompany?.id &&
      (selectedCompany.id !== lastCenteredSelectedIdRef.current ||
        focusRequestKey !== lastFocusRequestKeyRef.current) &&
      mapRef.current
    ) {
      lastCenteredSelectedIdRef.current = selectedCompany.id;
      lastFocusRequestKeyRef.current = focusRequestKey;
      focusMapOnCoordinates(localizedCompany.coordinates, SELECTED_COMPANY_ZOOM);
    }
  }, [focusRequestKey, locale, selectedCompany]);

  function clearHidePopupTimer() {
    if (hidePopupTimerRef.current) {
      clearTimeout(hidePopupTimerRef.current);
      hidePopupTimerRef.current = null;
    }
  }

  function clearSuppressMapClickTimer() {
    if (suppressMapClickTimerRef.current) {
      clearTimeout(suppressMapClickTimerRef.current);
      suppressMapClickTimerRef.current = null;
    }
  }

  function preventNextMapClick() {
    suppressNextMapClickRef.current = true;
    clearSuppressMapClickTimer();
    suppressMapClickTimerRef.current = setTimeout(() => {
      suppressNextMapClickRef.current = false;
      suppressMapClickTimerRef.current = null;
    }, 250);
  }

  function activateMarker(company: RobotCompany, coordinates: [number, number]) {
    preventNextMapClick();
    clearHidePopupTimer();
    focusMapOnCoordinates(coordinates, SELECTED_COMPANY_ZOOM);
    showPopup(company, coordinates);
    onSelectCompany(company);
  }

  function focusMapOnCoordinates(coordinates: [number, number], zoom: number) {
    if (!mapRef.current) {
      return;
    }

    try {
      mapRef.current.setZoomAndCenter(zoom, coordinates);
    } catch {
      // AMap can reject camera changes while it is still settling after route or filter changes.
    }
  }

  function scheduleClosePopup() {
    clearHidePopupTimer();
    hidePopupTimerRef.current = setTimeout(() => {
      hidePopupTimerRef.current = null;
      closePopup();
    }, POPUP_HIDE_DELAY_MS);
  }

  function showPopup(company: RobotCompany | undefined, coordinates: [number, number] | undefined) {
    if (
      unmountedRef.current ||
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      !company ||
      !coordinates ||
      !mapRef.current ||
      !window.AMap
    ) {
      return;
    }

    try {
      const infoWindow =
        infoWindowRef.current ??
        new window.AMap.InfoWindow({
          anchor: "middle-left",
          isCustom: true,
          offset: new window.AMap.Pixel(16, 0),
        });
      infoWindowRef.current = infoWindow;

      const previousEntry = markerEntriesRef.current.find(
        (entry) => entry.company.id === activePopupCompanyIdRef.current && entry.company.id !== company.id,
      );
      if (previousEntry) {
        setMarkerVisual(previousEntry, false);
      }

      activePopupCompanyIdRef.current = company.id;
      const activeEntry = markerEntriesRef.current.find((entry) => entry.company.id === company.id);
      if (activeEntry) {
        setMarkerVisual(activeEntry, true);
      }

      cleanupPopupContent();
      const popupContent = createPopupContent(company, locale, {
        onEnter: () => {
          clearHidePopupTimer();
          if (activeEntry) {
            setMarkerVisual(activeEntry, true);
          }
        },
        onLeave: scheduleClosePopup,
      });
      popupContentCleanupRef.current = popupContent.cleanup;
      infoWindow.setContent(popupContent.element);
      infoWindow.open(mapRef.current, coordinates);
    } catch (error) {
      console.error("AMap popup rendering failed", error);
    }
  }

  function showRobotValleyPopup() {
    if (
      unmountedRef.current ||
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      !mapRef.current ||
      !window.AMap
    ) {
      return;
    }

    try {
      const infoWindow =
        infoWindowRef.current ??
        new window.AMap.InfoWindow({
          anchor: "middle-left",
          isCustom: true,
          offset: new window.AMap.Pixel(16, 0),
        });
      infoWindowRef.current = infoWindow;
      activePopupCompanyIdRef.current = null;
      cleanupPopupContent();

      const element = document.createElement("div");
      element.className = "map-info-window";
      element.style.setProperty("--tooltip-color", "#3759bb");
      element.innerHTML = [
        `<div class="map-info-window__pills">`,
        `<span class="map-info-window__category">${escapeHtml(t("robotValleyPopupLabel"))}</span>`,
        `</div>`,
        `<h3 class="map-info-window__title">${escapeHtml(t("robotValleyName"))}</h3>`,
        `<p class="map-info-window__meta">${escapeHtml(robotValley.address[locale])}</p>`,
        `<p class="map-info-window__meta">${escapeHtml(t("robotValleyDescription"))}</p>`,
      ].join("");

      infoWindow.setContent(element);
      infoWindow.open(mapRef.current, robotValley.coordinates);
    } catch (error) {
      console.error("Robot Valley popup rendering failed", error);
    }
  }

  function closePopup() {
    clearHidePopupTimer();
    cleanupPopupContent();

    const activeEntry = markerEntriesRef.current.find((entry) => entry.company.id === activePopupCompanyIdRef.current);
    if (activeEntry) {
      setMarkerVisual(activeEntry, false);
    }

    activePopupCompanyIdRef.current = null;

    try {
      infoWindowRef.current?.close();
    } catch {
      // AMap can dispose an info window while the map is changing routes.
    }
  }

  function cleanupPopupContent() {
    popupContentCleanupRef.current?.();
    popupContentCleanupRef.current = null;
  }

  function setMarkerVisual(entry: MarkerEntry, hovered: boolean) {
    try {
      entry.element.dataset.active = String(entry.selected);
      entry.element.dataset.hovered = String(hovered);
      setMarkerZIndex(entry.marker, hovered ? 1500 : entry.selected ? 1000 : 100);
    } catch {
      // Marker may have been disposed by AMap during a fast filter or route change.
    }
  }

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-[#06101d]">
      <div ref={containerRef} className="h-full min-h-[420px] w-full" />
      {status === "ready" ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 lg:inset-x-auto lg:right-4">
          <CategoryLegend visibleCategoryKeys={visibleCategoryKeys} />
        </div>
      ) : null}
      {status === "ready" && companies.length === 0 ? <MapEmpty messageKey={emptyMessageKey} /> : null}
      {status !== "ready" ? <MapStatus status={status} /> : null}
    </div>
  );
}

function createPopupContent(
  company: RobotCompany,
  locale: AppLocale,
  handlers: { onEnter: () => void; onLeave: () => void },
) {
  const localizedCompany = localizeCompany(company, locale);
  const categoryStyle = getCategoryStyle(localizedCompany.categoryKey);
  const element = document.createElement("div");
  const meta = [localizedCompany.city, localizedCompany.province].filter(Boolean).join(" / ");
  const secondaryName =
    localizedCompany.nameZh && localizedCompany.nameZh !== localizedCompany.name ? localizedCompany.nameZh : "";
  const compactStatus = localizedCompany.status || (localizedCompany.foundedYear ? `Founded ${localizedCompany.foundedYear}` : "");
  const tags = localizedCompany.products.slice(0, 3);

  element.className = "map-info-window";
  element.style.setProperty("--tooltip-color", categoryStyle.color);
  element.innerHTML = [
    `<div class="map-info-window__pills">`,
    `<span class="map-info-window__category">${escapeHtml(localizedCompany.category)}</span>`,
    compactStatus ? `<span class="map-info-window__status">${escapeHtml(compactStatus)}</span>` : "",
    `</div>`,
    `<h3 class="map-info-window__title">${escapeHtml(localizedCompany.name)}</h3>`,
    secondaryName ? `<p class="map-info-window__subtitle">${escapeHtml(secondaryName)}</p>` : "",
    meta ? `<p class="map-info-window__meta">${escapeHtml(meta)}</p>` : "",
    tags.length > 0
      ? `<div class="map-info-window__tags">${tags
          .map((tag) => `<span class="map-info-window__tag">${escapeHtml(tag)}</span>`)
          .join("")}</div>`
      : "",
  ].join("");

  element.addEventListener("mouseenter", handlers.onEnter);
  element.addEventListener("mouseleave", handlers.onLeave);

  return {
    cleanup: () => {
      element.removeEventListener("mouseenter", handlers.onEnter);
      element.removeEventListener("mouseleave", handlers.onLeave);
    },
    element,
  };
}

function createMarkerElement({
  categoryKey,
  geocodeStatus,
  handlers,
  label,
  selected,
}: {
  categoryKey?: CompanyCategoryKey | string | null;
  geocodeStatus?: string | null;
  handlers: MarkerHandlers;
  label: string;
  selected: boolean;
}) {
  const style = getCategoryStyle(categoryKey);
  const element = document.createElement("button");

  element.type = "button";
  element.className = "marker-pin";
  element.dataset.active = String(selected);
  element.dataset.geocodeStatus = geocodeStatus ?? "missing";
  element.dataset.hovered = "false";
  element.setAttribute("aria-label", label);
  element.style.setProperty("--marker-color", style.color);
  element.addEventListener("mouseenter", handlers.mouseenter);
  element.addEventListener("mouseleave", handlers.mouseleave);
  element.addEventListener("click", handlers.click);
  element.addEventListener("touchstart", handlers.touchstart);

  return element;
}

function cleanupMarkerEntries(entries: MarkerEntry[]) {
  entries.forEach((entry) => {
    try {
      entry.element.removeEventListener("mouseenter", entry.handlers.mouseenter);
      entry.element.removeEventListener("mouseleave", entry.handlers.mouseleave);
      entry.element.removeEventListener("click", entry.handlers.click);
      entry.element.removeEventListener("touchstart", entry.handlers.touchstart);
      entry.marker.setMap(null);
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
    // Boundary limiting is a visual aid only. The filtered data still controls displayed companies.
  }
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
  markerElement.className = "robot-valley-marker robot-valley-marker--dark";
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
      fillColor: "#14b8a6",
      fillOpacity: 0.16,
      path: robotValley.zonePath,
      strokeColor: "#5eead4",
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
    polygon.setMap(map);
    return polygon;
  } catch {
    return null;
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
          fillColor: "#22d3ee",
          fillOpacity: 0.05,
          path: firstBoundary as AMap.PolygonPath,
          strokeColor: "#67e8f9",
          strokeOpacity: 0.7,
          strokeWeight: 2,
        });
        polygon.setMap(map);
        handlers.onBoundaryReady(polygon);
      } catch {
        // Drawing a district outline should never block the usable map.
      }
    });
  } catch {
    // DistrictSearch may be unavailable for a given key/plugin configuration.
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
      fillColor: "#020617",
      fillOpacity: 0.58,
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
    // Route transitions can race with AMap's own disposal.
  }
}

function setMarkerZIndex(marker: AMap.Marker, zIndex: number) {
  const markerWithZIndex = marker as AMap.Marker & {
    setzIndex?: (value: number) => void;
    setZIndex?: (value: number) => void;
  };

  if (typeof markerWithZIndex.setzIndex === "function") {
    markerWithZIndex.setzIndex(zIndex);
    return;
  }

  markerWithZIndex.setZIndex?.(zIndex);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function MapEmpty({ messageKey }: { messageKey: "empty" | "nanshanEmpty" }) {
  const t = useTranslations("Map");

  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-6 text-center">
      <div className="max-w-sm rounded border border-white/10 bg-slate-950/75 px-5 py-4 text-sm font-semibold text-slate-100 shadow-2xl backdrop-blur">
        {t(messageKey)}
      </div>
    </div>
  );
}

function MapStatus({ status }: { status: "loading" | "missing-key" | "error" }) {
  const t = useTranslations("Map");
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
