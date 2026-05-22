"use client";

import { useState, useCallback, useEffect } from "react";

type ImageLightboxProps = {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
};

export function ImageLightbox({ src, alt, className, style }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openLightbox = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeLightbox]);

  return (
    <>
      <div
        className={`cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_24px_60px_rgba(45,74,138,0.2)] ${className || ""}`}
        style={style}
        onClick={openLightbox}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            openLightbox();
          }
        }}
        aria-label={`${alt} - 点击放大查看`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
        />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
            onClick={closeLightbox}
            aria-label="关闭"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] w-auto rounded-lg object-contain shadow-2xl"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            按 ESC 或点击空白处关闭
          </div>
        </div>
      )}
    </>
  );
}
