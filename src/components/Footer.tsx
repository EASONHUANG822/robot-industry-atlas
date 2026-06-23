"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { CreatorBadge } from "@/components/CreatorBadge";

type FooterColumn = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

const CONTACT_EMAIL = "info@robotuo.com";

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Footer");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-slate-400 transition hover:text-slate-600"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-accent">{t("contactModalTitle")}</h3>
        <p className="mt-2 text-sm leading-6 text-secondary">{t("contactModalDescription")}</p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-slate-50 p-3">
          <span className="flex-1 text-sm font-medium text-accent break-all">{CONTACT_EMAIL}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("Footer");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const toggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const columns: FooterColumn[] = [
    {
      title: t("colExplore"),
      links: [
        { label: t("showroom"), href: "/showroom" },
        { label: t("about"), href: "/foundation" },
      ],
    },
    {
      title: t("colVisit"),
      links: [
        { label: t("visitPlan"), href: "/visit" },
        { label: t("payment"), href: "/payment" },
      ],
    },
    {
      title: t("colInfo"),
      links: [
        { label: t("contact"), href: "#contact", external: true },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-block" aria-label="Home">
          <img src="/images/logo.png" alt="" className="h-6 w-auto" />
        </Link>

        <div className="mt-8 md:grid md:grid-cols-3 md:gap-8">
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
                    if (link.href === "#contact") {
                      return (
                        <li key="contact">
                          <button type="button" onClick={() => setContactOpen(true)} className={cls}>{link.label}</button>
                        </li>
                      );
                    }
                    return (
                      <li key={link.href}>
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

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              &copy; 2026 {t("brand")}
            </p>
            <CreatorBadge />
          </div>
        </div>
      </div>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </footer>
  );
}
