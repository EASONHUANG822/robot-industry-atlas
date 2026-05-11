const AMAP_SCRIPT_ID = "amap-js-api";

export const CHINA_CENTER: [number, number] = [105.5, 35.8];

export function configureAMapSecurity() {
  if (typeof window === "undefined") {
    return;
  }

  const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;

  if (securityCode) {
    window._AMapSecurityConfig = {
      securityJsCode: securityCode,
    };
  }
}

export function loadAMap() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("AMap can only be loaded in the browser"));
  }

  const key = process.env.NEXT_PUBLIC_AMAP_KEY;

  if (!key) {
    return Promise.reject(new Error("Missing AMap key"));
  }

  if (window.AMap) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("AMap failed to load")), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      v: "2.0",
      key,
      plugin: "AMap.Scale,AMap.ToolBar,AMap.MarkerCluster,AMap.DistrictSearch",
    });

    script.id = AMAP_SCRIPT_ID;
    script.async = true;
    script.src = `https://webapi.amap.com/maps?${params.toString()}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("AMap failed to load"));
    document.head.appendChild(script);
  });
}
