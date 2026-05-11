export {};

declare global {
  interface Window {
    AMap?: typeof AMap;
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
  }

  namespace AMap {
    type LngLatLike = [number, number];

    class Map {
      constructor(container: string | HTMLElement, options: MapOptions);
      add(overlay: Marker | Control | Polygon): void;
      remove(overlay: Marker | Polygon): void;
      setFitView(overlays?: Marker[]): void;
      setLimitBounds?(bounds: Bounds): void;
      setZoomAndCenter(zoom: number, center: LngLatLike): void;
      on(eventName: "click", handler: () => void): void;
      off?(eventName: "click", handler: () => void): void;
      destroy(): void;
    }

    type MapOptions = {
      center: LngLatLike;
      zoom: number;
      viewMode?: "2D" | "3D";
      mapStyle?: string;
    };

    class Marker {
      constructor(options: MarkerOptions);
      on(eventName: "click" | "mouseover" | "mouseout" | "touchstart", handler: () => void): void;
      off?(eventName: "click" | "mouseover" | "mouseout" | "touchstart", handler: () => void): void;
      setMap(map: Map | null): void;
      setContent(content: string | HTMLElement): void;
      setzIndex(zIndex: number): void;
    }

    type MarkerOptions = {
      position: LngLatLike;
      title?: string;
      content?: string | HTMLElement;
      offset?: Pixel;
      zIndex?: number;
    };

    class Pixel {
      constructor(x: number, y: number);
    }

    type Control = Scale | ToolBar;

    class Scale {
      constructor(options?: Record<string, unknown>);
    }

    class ToolBar {
      constructor(options?: Record<string, unknown>);
    }

    class MarkerCluster {
      constructor(map: Map, markers: Marker[], options?: Record<string, unknown>);
      setMap(map: Map | null): void;
    }

    class Bounds {
      constructor(southWest: LngLatLike, northEast: LngLatLike);
    }

    class DistrictSearch {
      constructor(options?: Record<string, unknown>);
      search(keyword: string, callback: (status: string, result: DistrictSearchResult) => void): void;
    }

    type DistrictSearchResult = {
      districtList?: Array<{
        boundaries?: unknown[];
      }>;
    };

    type PolygonRing = Array<LngLatLike | { lng: number; lat: number }>;
    type PolygonPath = PolygonRing | PolygonRing[];

    class Polygon {
      constructor(options: PolygonOptions);
      setMap(map: Map | null): void;
    }

    type PolygonOptions = {
      bubble?: boolean;
      fillColor?: string;
      fillOpacity?: number;
      path: PolygonPath;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    };

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map: Map, position: LngLatLike): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
    }

    type InfoWindowOptions = {
      content?: string | HTMLElement;
      isCustom?: boolean;
      offset?: Pixel;
      anchor?: string;
    };
  }
}
