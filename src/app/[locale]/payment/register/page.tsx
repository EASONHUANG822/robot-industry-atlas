import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type RegisterPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export async function generateMetadata({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PaymentPage" });
  const brandName = locale === "zh" ? "深圳机器人谷" : "Shenzhen Robot Valley";

  return {
    title: `${t("formTitle")} | ${brandName}`,
    description: t("formDescription"),
    alternates: { canonical: `/${locale}/payment/register` },
    robots: { index: false },
  };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PaymentPage");

  return (
    <main id="main-content" className="flex min-h-[calc(100svh-4rem)] flex-col">
      <section className="relative isolate flex flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(45,74,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,74,138,0.025)_1px,transparent_1px)] bg-[size:56px_56px]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/payment"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition-colors hover:text-accent"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t("homeCta")}
            </Link>
          </div>

          <div className="mt-4 flex flex-1 flex-col rounded-xl border border-line bg-white/[0.86] p-5 shadow-[0_18px_52px_rgba(45,74,138,0.09)] backdrop-blur sm:p-6">
            <h1 className="text-xl font-black leading-tight text-accent sm:text-2xl">
              {t("formTitle")}
            </h1>
            <p className="mt-1.5 text-xs leading-5 text-secondary">
              {t("formDescription")}
            </p>

            <div className="mt-4 flex-1">
              <ApplicationForm
                paymentMode
                locale={locale}
                successHref="/payment/success"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
