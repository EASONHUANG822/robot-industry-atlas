import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingAerialView } from "@/components/landing/LandingAerialView";
import { LandingDetailSection } from "@/components/landing/LandingDetailSection";
import { LandingExperienceBooking } from "@/components/landing/LandingExperienceBooking";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingFeedbackCTA } from "@/components/landing/LandingFeedbackCTA";
import { PAYMENT_BENEFIT_KEYS, TRIAL_PAYMENT_PRICE_CNY } from "@/config/email";
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
      <LandingExperienceBooking
        eyebrow={t("experienceBooking.eyebrow")}
        title={t("experienceBooking.title")}
        description={t("experienceBooking.description")}
        priceLabel={t("experienceBooking.priceLabel")}
        price={TRIAL_PAYMENT_PRICE_CNY}
        priceUnit={t("experienceBooking.priceUnit")}
        priceNote={t("experienceBooking.priceNote")}
        ctaLabel={t("experienceBooking.cta")}
        stats={[
          {
            value: t("experienceBooking.stats.globalLocations.value"),
            label: t("experienceBooking.stats.globalLocations.label"),
            text: t("experienceBooking.stats.globalLocations.text"),
          },
          {
            value: t("experienceBooking.stats.enterpriseVisits.value"),
            label: t("experienceBooking.stats.enterpriseVisits.label"),
            text: t("experienceBooking.stats.enterpriseVisits.text"),
          },
        ]}
        benefits={PAYMENT_BENEFIT_KEYS.map((benefitKey) => ({
          title: t(`experienceBooking.benefits.${benefitKey}.title`),
          text: t(`experienceBooking.benefits.${benefitKey}.text`),
        }))}
      />
      <LandingTestimonials />
      <LandingFeedbackCTA />
      <LandingDetailSection
        locale={locale}
        eyebrow={t("detail.eyebrow")}
        title={t("detail.title")}
        description={t("detail.description")}
        addressLabel={t("detail.addressLabel")}
        areaLabel={t("detail.areaLabel")}
        globeAriaLabel={t("detail.globeAriaLabel")}
        globeHubLabel={t("detail.globeHubLabel")}
        showroomCtaLabel={t("detail.showroomCta")}
        showroomHref="/showroom"
        cards={[
          { tag: t("detail.cards.showroom.tag"), title: t("detail.cards.showroom.title"), description: t("detail.cards.showroom.description"), linkLabel: t("detail.cards.showroom.link"), href: "/foundation" },
          { tag: t("detail.cards.ecosystem.tag"), title: t("detail.cards.ecosystem.title"), description: t("detail.cards.ecosystem.description"), linkLabel: t("detail.cards.ecosystem.link"), href: "/showroom" },
          { tag: t("detail.cards.visit.tag"), title: t("detail.cards.visit.title"), description: t("detail.cards.visit.description"), linkLabel: t("detail.cards.visit.link"), href: "/showroom" },
        ]}
      />
      <LandingAerialView
        eyebrow={t("aerialView.eyebrow")}
        title={t("aerialView.title")}
        description={t("aerialView.description")}
        ctaLabel={t("aerialView.cta")}
        ctaHref="/showroom"
      />
    </main>
  );
}
