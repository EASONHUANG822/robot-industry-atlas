import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import type { AppLocale } from "@/i18n/routing";
import PhotoGallery from "@/components/PhotoGallery";

type ShowroomPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export async function generateMetadata({ params }: ShowroomPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ShowroomPage" });
  const brandName = locale === "zh" ? "深圳机器人谷" : "Shenzhen Robot Valley";

  return {
    title: `${t("title")} | ${brandName}`,
    description: t("description"),
    alternates: { canonical: `/${locale}/showroom` },
    openGraph: {
      title: `${t("title")} | ${brandName}`,
      description: t("description"),
      siteName: brandName,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function ShowroomPage({ params }: ShowroomPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ShowroomPage");

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-line bg-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.82)_44%,rgba(255,255,255,0.55)_100%),url('/images/robot-valley-hero.png')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-8 text-secondary">{t("description")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/payment"
                className="inline-flex min-h-12 items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t("apply")}
              </Link>
              <Link
                href="/visit"
                className="inline-flex min-h-12 items-center justify-center rounded border border-line bg-white px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t("visit")}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <StatCard value={t("stats.area.value")} unit={t("stats.area.unit")} label={t("stats.area.label")} />
            <StatCard value={t("stats.enterprises.value")} unit={t("stats.enterprises.unit")} label={t("stats.enterprises.label")} />
            <StatCard value={t("stats.corridor.value")} unit={t("stats.corridor.unit")} label={t("stats.corridor.label")} />
          </div>
        </div>
      </section>

      {/* Exhibition Areas */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("areas.eyebrow")}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-accent sm:text-4xl">
              {t("areas.title")}
            </h2>
            <p className="mt-4 text-pretty text-base leading-8 text-secondary">{t("areas.description")}</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <AreaCard
              title={t("areas.humanoid.name")}
              description={t("areas.humanoid.description")}
              companies={t("areas.humanoid.companies")}
              image="/images/show/page2_img1.jpeg"
            />
            <AreaCard
              title={t("areas.application.name")}
              description={t("areas.application.description")}
              companies={t("areas.application.companies")}
              image="/images/show/page2_img3.jpeg"
            />
            <AreaCard
              title={t("areas.components.name")}
              description={t("areas.components.description")}
              companies={t("areas.components.companies")}
              image="/images/show/page3_img2.jpeg"
            />
          </div>
        </div>
      </section>

      {/* Industry Corridor */}
      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("corridor.eyebrow")}</p>
              <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-accent sm:text-4xl">
                {t("corridor.title")}
              </h2>
              <p className="mt-4 text-pretty text-base leading-8 text-secondary">{t("corridor.description")}</p>
              <p className="mt-4 text-pretty text-sm leading-7 text-secondary">{t("corridor.balcony")}</p>
            </div>
            <div
              className="min-h-[320px] rounded-lg border border-line bg-cover bg-center shadow-soft"
              style={{ backgroundImage: "url('/images/show/GXL_5681.JPG')" }}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <PhotoGallery
        t={{
          title: t("gallery.title"),
          prev: t("gallery.prev"),
          next: t("gallery.next"),
        }}
      />
    </main>
  );
}

function StatCard({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-accent">{value}</span>
        <span className="text-lg font-semibold text-secondary">{unit}</span>
      </div>
      <p className="mt-2 text-sm text-secondary">{label}</p>
    </div>
  );
}

function AreaCard({
  title,
  description,
  companies,
  image,
}: {
  title: string;
  description: string;
  companies: string;
  image: string;
}) {
  return (
    <div className="group overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-accent">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-secondary">{description}</p>
        <p className="mt-3 text-xs text-muted">{companies}</p>
      </div>
    </div>
  );
}
