import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type PaymentCancelPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function PaymentCancelPage({ params }: PaymentCancelPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PaymentPage");

  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] items-center justify-center bg-[linear-gradient(180deg,#eef3fb_0%,#f7f9fd_46%,#ffffff_100%)]"
    >
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-lg border border-line bg-white p-8 shadow-soft">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="size-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-accent">{t("cancelTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">{t("cancelMessage")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/payment"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-mid-dark hover:shadow-lg"
            >
              {t("retryPayment")}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-blue-50"
            >
              {t("homeCta")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
