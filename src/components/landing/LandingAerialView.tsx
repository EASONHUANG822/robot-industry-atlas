"use client";

import { Link } from "@/i18n/navigation";
import { ImageLightbox } from "@/components/ImageLightbox";

type LandingAerialViewProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function LandingAerialView({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
}: LandingAerialViewProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f9fd] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
          {/* Left: Text + Map */}
          <div className="flex-1 text-center lg:text-left">
            <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              <span className="inline-block h-3 w-0.5 rounded-full bg-accent" aria-hidden="true" />
              {eyebrow}
            </p>
            <h2 className="mt-4 text-balance text-3xl font-bold leading-tight text-accent sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base leading-8 text-secondary mx-auto lg:mx-0">
              {description}
            </p>
            <div className="mt-8">
              <Link
                href={ctaHref}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
              >
                {ctaLabel}
              </Link>
            </div>
            <div className="mt-8">
              <ImageLightbox
                src="/images/robot-valley-static-map.png"
                alt="深圳机器人谷产业生态地图"
                className="w-full max-h-[400px] bg-contain bg-center bg-no-repeat rounded-lg shadow-[0_18px_52px_rgba(45,74,138,0.15)]"
                style={{ backgroundImage: "url('/images/robot-valley-static-map.png')" }}
              />
            </div>
          </div>

          {/* Right: Aerial Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <ImageLightbox
                src="/images/show/机器人谷地理位置空中实拍图.png"
                alt="深圳机器人谷空中实拍图"
                className="w-full h-auto rounded-lg shadow-[0_18px_52px_rgba(45,74,138,0.15)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
