import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FeedbackPage" });
  const brandName = locale === "zh" ? "深圳机器人谷" : "Shenzhen Robot Valley";

  return {
    title: `${t("title")} | ${brandName}`,
    description: t("description"),
    alternates: { canonical: `/${locale}/feedback` },
    openGraph: {
      title: `${t("title")} | ${brandName}`,
      description: t("description"),
      siteName: brandName,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function FeedbackPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("FeedbackPage");

  const translations = {
    "form.name.label": t("form.name.label"),
    "form.name.placeholder": t("form.name.placeholder"),
    "form.role.label": t("form.role.label"),
    "form.role.placeholder": t("form.role.placeholder"),
    "form.message.label": t("form.message.label"),
    "form.message.placeholder": t("form.message.placeholder"),
    "form.submit": t("form.submit"),
    "form.submitting": t("form.submitting"),
    "form.success": t("form.success"),
    "form.error": t("form.error"),
    "form.validation.nameRequired": t("form.validation.nameRequired"),
    "form.validation.roleRequired": t("form.validation.roleRequired"),
    "form.validation.messageRequired": t("form.validation.messageRequired"),
    "form.validation.messageTooLong": t("form.validation.messageTooLong"),
    moderationNotice: t("moderationNotice"),
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent transition-colors">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("backToHome")}
        </Link>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="lg:w-5/12">
            <p className="inline-flex border-l-2 border-mid-light pl-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-mid-dark">
              {t("eyebrow")}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-accent sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-md text-pretty text-base leading-8 text-secondary">
              {t("description")}
            </p>
            <p className="mt-6 text-sm text-muted">{t("moderationNotice")}</p>
          </div>
          <div className="lg:w-7/12">
            <FeedbackForm translations={translations} />
          </div>
        </div>
      </div>
    </div>
  );
}
