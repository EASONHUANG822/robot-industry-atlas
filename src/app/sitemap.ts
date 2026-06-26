import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { companies } from "@/data/companies";

const BASE_URL = "https://www.szrobotvalley.com";

const staticRoutes = [
  { path: "", priority: 1 },
  { path: "/showroom", priority: 0.9 },
  { path: "/visit", priority: 0.8 },
  { path: "/foundation", priority: 0.8 },
  { path: "/payment", priority: 0.9 },
  { path: "/feedback", priority: 0.6 },
  { path: "/privacy", priority: 0.4 },
  { path: "/terms", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route.priority,
      });
    }

    for (const company of companies) {
      entries.push({
        url: `${BASE_URL}/${locale}/company/${company.id}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  }

  return entries;
}
