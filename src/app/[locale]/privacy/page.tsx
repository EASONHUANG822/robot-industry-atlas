import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PrivacyPage");

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
        <div className="text-base leading-8 text-secondary">
          <p>
            {t("underConstruction")}
          </p>
        </div>
      </section>
    </main>
  );
}
