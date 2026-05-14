import { setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isZh = locale === "zh";

  return (
    <main id="main-content" className="bg-[#f7f9fd]">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="text-balance text-4xl font-bold leading-tight text-accent sm:text-5xl">
            {isZh ? "隐私政策" : "Privacy Policy"}
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-base leading-8 text-[#4a6fa5]">
          <p>
            {isZh
              ? "本页面内容正在完善中。如有疑问，请联系 contact@robotvalley.cn。"
              : "This page is under construction. For inquiries, please contact contact@robotvalley.cn."}
          </p>
        </div>
      </section>
    </main>
  );
}
