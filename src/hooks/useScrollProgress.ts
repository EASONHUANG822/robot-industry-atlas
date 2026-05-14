"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function useScrollProgress(sectionRef: RefObject<HTMLElement | null>, enabled = true) {
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const currentSection = sectionRef.current;
    if (!currentSection) return;

    const section = currentSection;

    let resizeObserver: ResizeObserver | null = null;

    function updateProgress(nextProgress: number) {
      setProgress((currentProgress) =>
        Math.abs(currentProgress - nextProgress) < 0.001 ? currentProgress : nextProgress,
      );
    }

    function compute() {
      const rect = section.getBoundingClientRect();
      const sectionHeight = rect.height;
      const viewportHeight = window.innerHeight;

      if (sectionHeight <= viewportHeight) {
        updateProgress(1);
        return;
      }

      const scrolled = -rect.top;
      const scrollable = sectionHeight - viewportHeight;
      updateProgress(clampProgress(scrolled / scrollable));
    }

    function requestCompute() {
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        compute();
        ticking.current = false;
      });
    }

    resizeObserver = new ResizeObserver(() => requestCompute());
    resizeObserver.observe(section);

    window.addEventListener("scroll", requestCompute, { passive: true });
    window.addEventListener("resize", requestCompute);
    requestCompute();

    return () => {
      window.removeEventListener("scroll", requestCompute);
      window.removeEventListener("resize", requestCompute);
      resizeObserver?.disconnect();
      ticking.current = false;
    };
  }, [enabled, sectionRef]);

  return enabled ? progress : 0;
}
