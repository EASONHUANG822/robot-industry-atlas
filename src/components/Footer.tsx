"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

type FooterColumn = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

export function Footer() {
  const t = useTranslations("Footer");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const columns: FooterColumn[] = [
    {
      title: t("colExplore"),
      links: [
        { label: t("showroom"), href: "/showroom" },
        { label: t("robotValley"), href: "/#robot-valley-detail" },
        { label: t("applyToVisit"), href: "/apply" },
      ],
    },
    {
      title: t("colVisit"),
      links: [
        { label: t("visitPlan"), href: "/visit" },
        { label: t("partners"), href: "/partners" },
      ],
    },
    {
      title: t("colRobotValley"),
      links: [
        { label: t("about"), href: "/showroom" },
        { label: t("partners"), href: "/partners" },
      ],
    },
    {
      title: t("colInfo"),
      links: [
        { label: t("contact"), href: "mailto:contact@robotvalley.cn", external: true },
        { label: t("mediaInquiry"), href: "/showroom" },
        { label: t("terms"), href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="inline-block" aria-label="Home">
          <img src="/images/brand-logo.png" alt="" className="h-14 w-auto" />
        </Link>

        {/* Accordion columns */}
        <div className="mt-8 md:grid md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {columns.map((col) => {
            const id = col.title;
            const isOpen = openSection === id;

            return (
              <div key={id} className="border-t border-white/10 md:border-t-0">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="flex w-full items-center justify-between py-3 text-left md:cursor-default md:py-0"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-200">{col.title}</span>
                  <span className="relative size-4 shrink-0 md:hidden">
                    <svg
                      className={`absolute inset-0 size-4 text-slate-400 transition-opacity ${isOpen ? "opacity-0" : "opacity-100"}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <svg
                      className={`absolute inset-0 size-4 text-slate-400 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M15 12.5L10 7.5L5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                <ul className={`overflow-hidden transition-all duration-300 md:!h-auto md:!opacity-100 ${isOpen ? "mb-4" : "mb-0 h-0 opacity-0 md:mb-0"}`}>
                  {col.links.map((link) => {
                    const cls = "block py-1 text-sm text-slate-400 hover:text-white transition";
                    return (
                      <li key={link.label}>
                        {link.external ? (
                          <a href={link.href} className={cls}>{link.label}</a>
                        ) : (
                          <Link href={link.href} className={cls}>{link.label}</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col-reverse items-start gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs text-slate-400 hover:text-white transition">
              {t("terms")}
            </Link>
            <Link href="/privacy" className="text-xs text-slate-400 hover:text-white transition">
              {t("privacy")}
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 {t("brand")}
          </p>
        </div>
      </div>
    </footer>
  );
}
