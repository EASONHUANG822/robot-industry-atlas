import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingDetailSection } from "@/components/landing/LandingDetailSection";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingShowroomSection } from "@/components/landing/LandingShowroomSection";
import type { AppLocale } from "@/i18n/routing";

type LandingPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  return (
    <main id="main-content">
      <LandingHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        learnMoreLabel={t("learnMore")}
        learnMoreHref="/showroom"
        applyLabel={t("applyToVisit")}
      />
      <LandingDetailSection
        locale={locale}
        eyebrow={t("detail.eyebrow")}
        title={t("detail.title")}
        description={t("detail.description")}
        addressLabel={t("detail.addressLabel")}
        areaLabel={t("detail.areaLabel")}
        showroomCtaLabel={t("detail.showroomCta")}
        showroomHref="/showroom"
        cards={[
          { tag: t("detail.cards.showroom.tag"), title: t("detail.cards.showroom.title"), description: t("detail.cards.showroom.description"), linkLabel: t("detail.cards.showroom.link"), href: "/foundation" },
          { tag: t("detail.cards.ecosystem.tag"), title: t("detail.cards.ecosystem.title"), description: t("detail.cards.ecosystem.description"), linkLabel: t("detail.cards.ecosystem.link"), href: "/innovation" },
          { tag: t("detail.cards.visit.tag"), title: t("detail.cards.visit.title"), description: t("detail.cards.visit.description"), linkLabel: t("detail.cards.visit.link"), href: "/collaboration" },
        ]}
      />
      <LandingShowroomSection
        eyebrow={t("showroom.eyebrow")}
        title={t("showroom.title")}
        description={t("showroom.description")}
        applyLabel={t("showroom.apply")}
      />
    </main>
  );
}
