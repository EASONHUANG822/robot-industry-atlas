import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });
  const brandName = locale === "zh" ? "深圳机器人谷" : "Shenzhen Robot Valley";

  return {
    title: `${t("title")} | ${brandName}`,
    description: t("underConstruction"),
    alternates: { canonical: `/${locale}/terms` },
    openGraph: {
      title: `${t("title")} | ${brandName}`,
      description: t("underConstruction"),
      siteName: brandName,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("TermsPage");

  return (
    <main id="main-content">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
            {t("title")}
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-slate max-w-none text-base leading-8 text-secondary">
          <p>
            {t("underConstruction")}
          </p>
        </div>
      </section>
    </main>
  );
}
