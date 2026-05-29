"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ScrollReveal } from "./ScrollReveal";

type Testimonial = {
  name: string;
  role: string;
  text: string;
};

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="size-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  ];
  const colorIndex = name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length;

  return (
    <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${colors[colorIndex]} text-sm font-bold text-white`}>
      {initials}
    </div>
  );
}

function Track({ testimonials, direction }: { testimonials: Testimonial[]; direction: "left" | "right" }) {
  const duplicated = [...testimonials, ...testimonials, ...testimonials];

  return (
    <div className="relative overflow-hidden py-2">
      <div
        className="flex gap-5"
        style={{
          width: "max-content",
          animation: `${direction === "left" ? "scrollLeft" : "scrollRight"} 60s linear infinite`,
        }}
      >
        {duplicated.map((item, i) => (
          <div
            key={i}
            className="w-[340px] shrink-0 rounded-xl border border-line bg-white p-5 shadow-sm"
          >
            <StarRating />
            <p className="mt-3 text-sm leading-6 text-secondary line-clamp-4">{item.text}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
              <Avatar name={item.name} />
              <div>
                <p className="text-sm font-semibold text-accent">{item.name}</p>
                <p className="text-xs text-secondary">{item.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingTestimonials() {
  const t = useTranslations("Landing");
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        if (data.feedback && data.feedback.length > 0) {
          setTestimonials(
            data.feedback.map((f: { name: string; role: string; message: string }) => ({
              name: f.name,
              role: f.role,
              text: f.message,
            }))
          );
        } else {
          setTestimonials([]);
        }
      })
      .catch(() => {
        setTestimonials([]);
      });
  }, []);

  const displayTestimonials: Testimonial[] = testimonials && testimonials.length > 0
    ? testimonials
    : [
        { name: "Dr. Sarah Chen", role: "CTO, Robotics Innovation Lab", text: t("testimonials.t1") },
        { name: "James Mitchell", role: "VP Engineering, AutoMotion Corp", text: t("testimonials.t2") },
        { name: "Emily Wang", role: "Research Director, AI Future Institute", text: t("testimonials.t3") },
        { name: "Michael Torres", role: "CEO, Precision Robotics Inc", text: t("testimonials.t4") },
        { name: "Lisa Nakamura", role: "Head of Innovation, TechBridge Ventures", text: t("testimonials.t5") },
        { name: "David Park", role: "Managing Partner, Future Factory Fund", text: t("testimonials.t6") },
        { name: "Anna Johansson", role: "Director, Nordic Automation Alliance", text: t("testimonials.t7") },
        { name: "Robert Kim", role: "Chief Scientist, Smart Manufacturing Lab", text: t("testimonials.t8") },
      ];

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#f7f9fd_0%,#ffffff_48%,#eef3fb_100%)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-8rem] top-1/3 h-[20rem] w-[20rem] rounded-full bg-mid-light/[0.08] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <ScrollReveal>
          <div className="max-w-3xl">
            <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
              {t("testimonials.eyebrow")}
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
              {t("testimonials.title")}
            </h2>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-secondary">
              {t("testimonials.description")}
            </p>
          </div>
        </ScrollReveal>
      </div>

      <div className="relative z-10 pb-12 lg:pb-16">
        <Track testimonials={displayTestimonials.slice(0, 4)} direction="left" />
        <Track testimonials={displayTestimonials.slice(4, 8)} direction="right" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-8 sm:flex-row sm:justify-between sm:px-10">
          <div>
            <p className="text-lg font-bold text-accent">{t("feedbackCTA.heading")}</p>
            <p className="mt-1 text-sm text-secondary">{t("feedbackCTA.subtext")}</p>
          </div>
          <Link
            href="/feedback"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            {t("feedbackCTA.button")}
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
