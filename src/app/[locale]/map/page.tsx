import { setRequestLocale } from "next-intl/server";
import { AtlasDashboard } from "@/components/AtlasDashboard";
import { companies, isNanshanShenzhenCompany } from "@/data/companies";
import type { AppLocale } from "@/i18n/routing";

type MapPageProps = {
  params: Promise<{
    locale: AppLocale;
  }>;
};

export default async function MapPage({ params }: MapPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const nanshanCompanies = companies.filter(isNanshanShenzhenCompany);

  return <AtlasDashboard companies={nanshanCompanies} />;
}
