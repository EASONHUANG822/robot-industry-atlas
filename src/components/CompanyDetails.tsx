"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localizeCompany, type RobotCompany } from "@/data/companies";
import type { AppLocale } from "@/i18n/routing";

type CompanyDetailsProps = {
  company: RobotCompany;
  compact?: boolean;
};

export function CompanyDetails({ company, compact = false }: CompanyDetailsProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("CompanyDetails");
  const localizedCompany = localizeCompany(company, locale);
  const primaryName = localizedCompany.name;
  const showChineseName = locale === "en" && company.nameEn && company.nameZh !== company.nameEn;
  const secondaryStat =
    localizedCompany.employeeRange ||
    localizedCompany.latestFunding?.roundEn ||
    localizedCompany.latestFunding?.roundZh ||
    localizedCompany.status ||
    t("unknown");

  if (compact) {
    return (
      <article className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <span>{localizedCompany.category}</span>
            <span className="text-slate-300">/</span>
            <span>{[localizedCompany.city, localizedCompany.province].filter(Boolean).join(", ")}</span>
          </div>
          <h1 className="text-2xl font-bold text-accent">{primaryName}</h1>
          {localizedCompany.tagline ? <p className="text-sm font-medium text-subtle">{localizedCompany.tagline}</p> : null}
          {localizedCompany.description ? (
            <p className="line-clamp-3 text-sm leading-6 text-secondary">{localizedCompany.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {localizedCompany.products.slice(0, 4).map((product) => (
            <span key={product} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-subtle">
              {product}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {localizedCompany.website ? (
            <a
              href={localizedCompany.website}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {t("visitWebsite")}
            </a>
          ) : null}
          <Link
            href={`/company/${company.id}`}
            className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            {t("detailPage")}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="space-y-8">
      <section className="rounded border border-line bg-white p-6 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-accent">
            {localizedCompany.category}
          </span>
          {localizedCompany.foundedYear ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-subtle">
              {t("founded")} {localizedCompany.foundedYear}
            </span>
          ) : null}
          {localizedCompany.status ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-subtle">
              {localizedCompany.status}
            </span>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          <h1 className="text-4xl font-bold tracking-normal text-accent sm:text-5xl">{primaryName}</h1>
          {showChineseName ? <p className="text-xl font-semibold text-muted">{company.nameZh}</p> : null}
          {localizedCompany.legalNameZh ? <p className="text-sm text-muted">{localizedCompany.legalNameZh}</p> : null}
          <p className="text-sm font-semibold text-accent">{t("area")}</p>
          {localizedCompany.tagline ? <p className="text-lg font-medium text-subtle">{localizedCompany.tagline}</p> : null}
          {localizedCompany.description ? (
            <p className="max-w-4xl text-base leading-8 text-secondary">{localizedCompany.description}</p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard label={t("location")} value={[localizedCompany.city, localizedCompany.province].filter(Boolean).join(" / ") || t("unknown")} />
          <StatCard label={t("foundedYear")} value={localizedCompany.foundedYear || t("unknown")} />
          <StatCard label={localizedCompany.employeeRange ? t("employees") : t("statusOrFunding")} value={secondaryStat} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {localizedCompany.website ? (
            <a
              href={localizedCompany.website}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {t("visitWebsite")}
            </a>
          ) : null}
          <Link
            href="/"
            className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            {t("backToMap")}
          </Link>
        </div>
      </section>

      {localizedCompany.products.length > 0 ? (
        <section className="rounded border border-line bg-white p-6">
          <h2 className="text-lg font-bold text-accent">{t("products")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {localizedCompany.products.map((product) => (
              <span key={product} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-subtle">
                {product}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {localizedCompany.latestFunding ? (
        <section className="rounded border border-line bg-white p-6">
          <h2 className="text-lg font-bold text-accent">{t("funding")}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label={t("fundingDate")} value={localizedCompany.latestFunding.date || t("unknown")} />
            <StatCard label={t("fundingRound")} value={locale === "zh" ? localizedCompany.latestFunding.roundZh || t("unknown") : localizedCompany.latestFunding.roundEn || localizedCompany.latestFunding.roundZh || t("unknown")} />
            <StatCard label={t("fundingAmount")} value={localizedCompany.latestFunding.amount || formatCnyWan(localizedCompany.latestFunding.amountCnyWan, t("cnyWan")) || t("unknown")} />
            <StatCard
              label={t("investors")}
              value={localizedCompany.latestFunding.investors?.length ? localizedCompany.latestFunding.investors.join(", ") : t("unknown")}
            />
          </dl>
        </section>
      ) : null}

      {localizedCompany.team?.length ? (
        <section className="rounded border border-line bg-white p-6">
          <h2 className="text-lg font-bold text-accent">{t("team")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {localizedCompany.team.map((member) => (
              <div key={`${member.name}-${member.title}`} className="rounded border border-line p-4">
                <p className="font-semibold text-accent">{member.name}</p>
                <p className="mt-1 text-sm text-muted">{member.title}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-panel p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-2 text-base font-bold text-accent">{value}</dd>
    </div>
  );
}

function formatCnyWan(value: number | undefined, unit: string) {
  if (typeof value !== "number") {
    return undefined;
  }

  return `${value.toLocaleString()} ${unit}`;
}
