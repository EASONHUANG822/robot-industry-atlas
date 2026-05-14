"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FILENAMES = [
  "GXL_5538.JPG", "GXL_5567.JPG", "GXL_5577.JPG", "GXL_5587.JPG",
  "GXL_5592.JPG", "GXL_5598.JPG", "GXL_5599.JPG", "GXL_5601.JPG",
  "GXL_5602.JPG", "GXL_5611.JPG", "GXL_5619.JPG", "GXL_5624.JPG",
  "GXL_5628.JPG", "GXL_5634.JPG", "GXL_5655.JPG", "GXL_5671.JPG",
  "GXL_5679.JPG", "GXL_5681.JPG",
];

const PHOTOS = FILENAMES.map((f) => `/images/show/${f}`);

function useSlidesPerView() {
  const [n, setN] = useState(3);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setN(1);
      else if (w < 1024) setN(2);
      else setN(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return n;
}

interface CarouselTranslations {
  title: string;
  prev: string;
  next: string;
}

export default function PhotoGallery({ t }: { t: CarouselTranslations }) {
  const slidesPerView = useSlidesPerView();
  const totalSlides = PHOTOS.length;
  // We clone a full set at head and tail for seamless looping
  const [current, setCurrent] = useState(totalSlides);
  const [transitioning, setTransitioning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build the triple-length slide list for seamless wrap
  const slides = [...PHOTOS, ...PHOTOS, ...PHOTOS];

  const goTo = useCallback((index: number) => {
    setTransitioning(true);
    setCurrent(index);
  }, []);

  const goNext = useCallback(() => {
    setTransitioning(true);
    setCurrent((c) => c + 1);
  }, []);

  const goPrev = useCallback(() => {
    setTransitioning(true);
    setCurrent((c) => c - 1);
  }, []);

  // When we reach a cloned boundary, snap back invisibly
  useEffect(() => {
    if (current >= totalSlides * 2) {
      const id = setTimeout(() => {
        setTransitioning(false);
        setCurrent(current - totalSlides);
      }, 400);
      return () => clearTimeout(id);
    }
    if (current < totalSlides) {
      const id = setTimeout(() => {
        setTransitioning(false);
        setCurrent(current + totalSlides);
      }, 400);
      return () => clearTimeout(id);
    }
  }, [current, totalSlides]);

  // Autoplay
  useEffect(() => {
    intervalRef.current = setInterval(goNext, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  }, [goPrev, goNext]);

  // The displayed index (0-based, in terms of real photos)
  const realIndex = ((current - totalSlides) % totalSlides + totalSlides) % totalSlides;

  const translateX = -(current * (100 / slidesPerView));

  return (
    <section className="bg-dark py-14" onKeyDown={onKey}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">{t.title}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={t.prev}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={t.next}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg">
          <div
            className="flex"
            style={{
              transform: `translateX(${translateX}%)`,
              transition: transitioning ? "transform 400ms ease" : "none",
            }}
          >
            {slides.map((src, i) => {
              const isClone = i < totalSlides || i >= totalSlides * 2;
              return (
                <div
                  key={`${src}-${i}`}
                  className="flex-shrink-0 px-1.5"
                  style={{ width: `${100 / slidesPerView}%` }}
                  aria-hidden={isClone || undefined}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-lg">
                    <img
                      src={src}
                      alt={`${t.title} ${(i % totalSlides) + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i + totalSlides)}
              className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                i === realIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`${t.title} ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
