"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type VisitApplicationButtonProps = {
  className?: string;
  label?: string;
};

export function VisitApplicationButton({ className, label }: VisitApplicationButtonProps) {
  const t = useTranslations("VisitApplication");

  return (
    <Link
      href="/apply"
      className={
        className ??
        "rounded bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
      }
    >
      {label ?? t("button")}
    </Link>
  );
}
