"use client";

import { useState, useCallback } from "react";

type SlideImage = {
  src: string;
  alt: string;
};

type ImageCarouselProps = {
  images: SlideImage[];
  labels: {
    previousSlide: string;
    nextSlide: string;
    slideNumberTemplate: string;
  };
};

export function ImageCarousel({ images, labels }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }, [images.length]);

  const slideLabel = (n: number) => labels.slideNumberTemplate.replace("%n%", String(n));

  if (images.length === 0) return null;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
      {images.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 m-5">
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="group absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-80 transition-opacity hover:opacity-100 focus:opacity-100 active:opacity-100"
              aria-label={labels.previousSlide}
              title={labels.previousSlide}
              type="button"
            >
              <span aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 8 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rotate-180 opacity-80 transition-opacity group-hover:opacity-100"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.18473 7.05029L1.66602 12.9998"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <button
              onClick={next}
              className="group absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-80 transition-opacity hover:opacity-100 focus:opacity-100 active:opacity-100"
              aria-label={labels.nextSlide}
              title={labels.nextSlide}
              type="button"
            >
              <span aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 8 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-80 transition-opacity group-hover:opacity-100"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.18473 7.05029L1.66602 12.9998"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </>
        )}

        {images.length > 1 && (
          <ul
            className="absolute bottom-0 m-2 flex gap-2 sm:m-5"
            aria-label="Slide navigation"
          >
            {images.map((_, i) => (
              <li key={i}>
                <button
                  data-active={i === current}
                  aria-label={slideLabel(i + 1)}
                  aria-current={i === current ? "true" : undefined}
                  tabIndex={i === current ? 0 : -1}
                  onClick={() => goTo(i)}
                  title={slideLabel(i + 1)}
                  className={`block h-2.5 w-2.5 rounded-full border border-white transition-colors hover:bg-gray-background-secondary focus:bg-gray-background-secondary active:bg-theme ${
                    i === current ? "bg-theme" : ""
                  }`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
