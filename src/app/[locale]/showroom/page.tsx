import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import type { AppLocale } from "@/i18n/routing";
import PhotoGallery from "@/components/PhotoGallery";

type ShowroomPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function ShowroomPage({ params }: ShowroomPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ShowroomPage");

  return (
    <main id="main-content" className="bg-page">
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t("eyebrow")}</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-8 text-secondary">{t("description")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/apply"
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
          <div
            className="min-h-[360px] rounded border border-line bg-cover bg-center shadow-soft"
            style={{ backgroundImage: "url('/images/robot-valley-hero.png')" }}
            aria-hidden="true"
          />
        </div>
      </section>

      <section className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ul className="columns-1 gap-6 lg:columns-2" role="list">
            <li className="break-inside-avoid mb-6" role="listitem">
              <MasonryCard
                image="/images/show/GXL_5538.JPG"
                tag={t("what.tag")}
                title={t("what.title")}
                description={t("what.description")}
                linkHref="/apply"
                linkLabel={t("what.link")}
                tall
              />
            </li>
            <li className="break-inside-avoid mb-6" role="listitem">
              <MasonryCard
                image="/images/show/GXL_5611.JPG"
                tag={t("see.tag")}
                title={t("see.title")}
                description={t("see.description")}
                linkHref="/visit"
                linkLabel={t("see.link")}
              />
            </li>
            <li className="break-inside-avoid mb-6" role="listitem">
              <MasonryCard
                image="/images/show/GXL_5681.JPG"
                tag={t("audience.tag")}
                title={t("audience.title")}
                description={t("audience.description")}
                linkHref="/partners"
                linkLabel={t("audience.link")}
                tall
              />
            </li>
            <li className="break-inside-avoid mb-6" role="listitem">
              <MasonryCard
                image="/images/show/GXL_5567.JPG"
                tag={t("collaboration.tag")}
                title={t("collaboration.title")}
                description={t("collaboration.description")}
                linkHref="/collaboration"
                linkLabel={t("collaboration.link")}
              />
            </li>
          </ul>
        </div>
      </section>

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

function MasonryCard({
  image,
  tag,
  title,
  description,
  linkHref,
  linkLabel,
  tall = false,
}: {
  image: string;
  tag: string;
  title: string;
  description: string;
  linkHref: string;
  linkLabel: string;
  tall?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg sm:rounded-xl">
      <div className={tall ? "aspect-[3/4] lg:aspect-[2/3]" : "aspect-[4/5] lg:aspect-[3/4]"}>
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <span className="pointer-events-none absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center lg:p-10">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/80">
          <span>[</span>
          <span>{tag}</span>
          <span>]</span>
        </div>
        <h3 className="mt-3 max-w-md text-balance text-2xl font-bold text-white lg:text-3xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-pretty text-sm leading-7 text-white/75 lg:text-base">
          {description}
        </p>
        <Link
          href={linkHref}
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}
