"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

const partners = [
  { name: "Emirates", url: "https://www.emirates.com/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/6c2460e2-f0b7-4c41-b270-6b2cc2648677/logo-emirates-colour11.png", width: 58 },
  { name: "RTA", url: "https://www.rta.ae/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/41f16f0e-c460-4125-9aa2-23c6df87f096/logo-rta-colour11.png", width: 89 },
  { name: "Dubai Municipality", url: "https://www.dm.gov.ae/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/da9c9b29-9070-45b3-86e7-9a6bcdc4d636/logo-dubai-municipality-colour11.png", width: 79 },
  { name: "Dubai Holdings", url: "https://www.dubaiholding.com/en", logoUrl: "https://motf-p-16570672ab7e.imgix.net/d3d0ed7e-982a-4189-bb2f-9b4598fc4705/logo-dubai-holding-colour11.png", width: 58 },
  { name: "SAP", url: "https://www.sap.com/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/817daf81-c407-473f-89d6-ffc2c0f7dfb9/logo-sap-colour11.png", width: 49 },
  { name: "VISA", url: "https://ae.visamiddleeast.com/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/b8b1c7d4-faf5-4047-b483-b0d3f62915b4/logo-visa-colour11.png", width: 50 },
  { name: "Pepsico", url: "https://www.pepsico.com/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/7c2fd173-f85e-47b3-9c58-bdc24f3002cd/logo-pepsico-colour11.png", width: 105 },
  { name: "Mohammed Bin Rashid Space Centre", url: "https://www.mbrsc.ae/", logoUrl: "https://motf-p-16570672ab7e.imgix.net/84a0d774-69de-44a8-b6b6-7a022ab29c8e/logo-mbrsc-colour11.png", width: 83 },
  { name: "Gems Education", url: "https://www.gemseducation.com/en", logoUrl: "https://motf-p-16570672ab7e.imgix.net/90d7e96f-950f-4961-98e0-8762ac5ee886/logo-gems-colour11.png", width: 62 },
];

type FooterColumn = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-grid size-12 place-items-center rounded-full bg-white/10 text-slate-300 backdrop-blur transition hover:bg-white/20 hover:text-white"
      aria-label={label}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
        {children}
      </svg>
    </a>
  );
}

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

        {/* Social media */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <span className="text-sm font-semibold text-slate-200">{t("followUs")}</span>
          <div className="flex flex-wrap justify-around gap-3 w-full max-w-xs">
          <SocialIcon href="https://www.linkedin.com/in/tuoliu/" label="LinkedIn">
            <path d="M5.417 4.167a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM5.417 7.083h2.5v6.667h-2.5V7.083zm4.166 0h2.5v.917h.034a2.73 2.73 0 0 1 2.466-1.084c2.633 0 3.117 1.733 3.117 3.984v3.85h-2.5v-3.75c0-.934-.017-2.134-1.3-2.134-1.3 0-1.484 1.017-1.484 2.067v3.817h-2.5V7.083z" />
          </SocialIcon>
          <SocialIcon href="https://x.com/Robo_Tuo" label="Twitter">
            <path d="M11.687 8.925L17.163 2.5h-1.298l-4.754 5.579L7.313 2.5H2.5l5.743 8.419L2.5 17.5h1.298l5.021-5.878 4.011 5.878h4.813l-5.956-8.575zm-1.778 2.08l-.582-.837L4.266 3.475h1.994l3.736 5.377.582.838 4.856 6.992h-1.994l-3.962-5.702-.582-.838z" />
          </SocialIcon>
          <SocialIcon href="https://mp.weixin.qq.com/s/11myTbva0ytGThtrKTcelg" label="WeChat">
            <path d="M8.691 2.188C4.892 2.188 1.875 4.636 1.875 7.656c0 1.705.918 3.232 2.3 4.286l-.584 1.755 2.006-1.003c.949.263 1.941.404 2.984.404.23 0 .459-.009.686-.026a4.9 4.9 0 0 1-.07-.89c0-2.58 2.443-4.672 5.456-4.672.165 0 .329.005.49.015C14.99 5.33 13.008 4.06 10.625 3.5a8.34 8.34 0 0 0-1.934-.187zM7.031 5.469a.781.781 0 1 1 0 1.562.781.781 0 0 1 0-1.562zm4.219.781a.781.781 0 1 1-1.562 0 .781.781 0 0 1 1.562 0zm3.845 1.563c-2.629 0-4.76 1.786-4.76 3.987 0 2.202 2.131 3.988 4.76 3.988.727 0 1.422-.121 2.065-.344l1.466.733-.426-1.284a3.38 3.38 0 0 0 1.655-2.703v-.39c0-2.202-2.131-3.988-4.76-3.988zm-1.427 1.875a.625.625 0 1 1 0 1.25.625.625 0 0 1 0-1.25zm3.333.625a.625.625 0 1 1-1.25 0 .625.625 0 0 1 1.25 0z" />
          </SocialIcon>
          </div>
        </div>

        {/* Partners */}
        <div className="mt-10 border-t border-white/10 pt-10">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t("partnersTitle")}
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-8">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noreferrer"
                className="group relative flex h-10 items-center justify-center"
                style={{ width: partner.width }}
              >
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="h-10 w-full object-contain grayscale brightness-0 invert opacity-60 transition-all duration-300 group-hover:grayscale-0 group-hover:brightness-100 group-hover:invert-0 group-hover:opacity-100"
                />
              </a>
            ))}
          </div>
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
