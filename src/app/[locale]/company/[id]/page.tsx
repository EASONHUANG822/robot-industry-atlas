import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CompanyDetails } from "@/components/CompanyDetails";
import { Link } from "@/i18n/navigation";
import { companies, getCompanyById, localizeCompany } from "@/data/companies";
import { routing, type AppLocale } from "@/i18n/routing";

type CompanyPageProps = {
  params: Promise<{
    locale: AppLocale;
    id: string;
  }>;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    companies.map((company) => ({
      locale,
      id: company.id,
    })),
  );
}

export async function generateMetadata({ params }: CompanyPageProps) {
  const { locale, id } = await params;
  const company = getCompanyById(id);
  const localizedCompany = company ? localizeCompany(company, locale) : undefined;
  const t = await getTranslations({ locale, namespace: "CompanyPage" });

  return {
    title: localizedCompany ? `${localizedCompany.name} | ${t("titleSuffix")}` : t("notFoundTitle"),
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CompanyPage");
  const company = getCompanyById(id);

  if (!company) {
    notFound();
  }

  const nearbyCompanies = companies
    .filter((item) => item.province === company.province && item.id !== company.id)
    .slice(0, 4);

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
        {t("backToMap")}
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <CompanyDetails company={company} />

        <aside className="space-y-4">
          <section className="rounded border border-line bg-white p-5">
            <h2 className="text-sm font-semibold text-accent">{t("sameProvince")}</h2>
            <div className="mt-4 space-y-3">
              {nearbyCompanies.length > 0 ? (
                nearbyCompanies.map((item) => {
                  const localizedItem = localizeCompany(item, locale);

                  return (
                    <Link
                      href={`/company/${item.id}`}
                      key={item.id}
                      className="block rounded border border-line p-3 text-sm hover:border-accent hover:bg-blue-50"
                    >
                      <span className="font-semibold text-accent">{localizedItem.name}</span>
                      <span className="mt-1 block text-xs text-[#7a9bc7]">{localizedItem.category}</span>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm leading-6 text-[#7a9bc7]">{t("sameProvinceEmpty")}</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
