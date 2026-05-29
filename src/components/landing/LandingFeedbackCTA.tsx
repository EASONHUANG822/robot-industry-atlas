"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingFeedbackCTA() {
  const t = useTranslations("Landing");

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
    </section>
  );
}
