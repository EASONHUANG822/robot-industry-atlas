"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationFieldKey, ApplicationPayload } from "@/config/applicationForm";
import { useRouter } from "@/i18n/navigation";
import { VisitDatePicker } from "./VisitDatePicker";

type SubmitState = "idle" | "submitting" | "error";

const inputClassName =
  "w-full rounded border border-line bg-white px-3 py-2 text-sm font-medium text-accent outline-none ring-blue-100 transition placeholder:text-[#9ab0d4] focus:border-accent focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-[#9ab0d4]";

export function ApplicationForm() {
  const router = useRouter();
  const t = useTranslations("ApplicationForm");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = buildPayload(formData);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => undefined)) as { error?: string } | undefined;

      if (!response.ok) {
        setErrorMessage(result?.error || t("errors.generic"));
        setSubmitState("error");
        return;
      }

      form.reset();
      router.push("/apply/success");
    } catch {
      setErrorMessage(t("errors.network"));
      setSubmitState("error");
    }
  }

  const isSubmitting = submitState === "submitting";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitState === "error" ? (
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900">{t("errorTitle")}</p>
          <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fields.name")} name="name" required>
          <input id="name" required type="text" name="name" autoComplete="name" disabled={isSubmitting} className={inputClassName} />
        </Field>
        <Field label={t("fields.organization")} name="organization">
          <input id="organization" type="text" name="organization" autoComplete="organization" disabled={isSubmitting} className={inputClassName} />
        </Field>
        <Field label={t("fields.email")} name="email" required>
          <input id="email" required type="email" name="email" autoComplete="email" disabled={isSubmitting} className={inputClassName} />
        </Field>
        <Field label={t("fields.phone")} name="phone">
          <input id="phone" type="tel" name="phone" autoComplete="tel" disabled={isSubmitting} className={inputClassName} />
        </Field>
        <DateField label={t("fields.preferredVisitDate")}>
          <VisitDatePicker
            disabled={isSubmitting}
            labels={{
              loading: t("datePicker.loading"),
              loadError: t("datePicker.loadError"),
              previousMonth: t("datePicker.previousMonth"),
              nextMonth: t("datePicker.nextMonth"),
              selectedDate: t("datePicker.selectedDate"),
              fullyBooked: t("datePicker.fullyBooked"),
              pastDate: t("datePicker.pastDate"),
              noDateSelected: t("datePicker.noDateSelected"),
              weekdays: [
                t("datePicker.weekdays.sun"),
                t("datePicker.weekdays.mon"),
                t("datePicker.weekdays.tue"),
                t("datePicker.weekdays.wed"),
                t("datePicker.weekdays.thu"),
                t("datePicker.weekdays.fri"),
                t("datePicker.weekdays.sat"),
              ],
            }}
          />
        </DateField>
        <Field label={t("fields.visitorCount")} name="visitorCount">
          <input id="visitorCount" type="number" name="visitorCount" min="1" inputMode="numeric" disabled={isSubmitting} className={inputClassName} />
        </Field>
      </div>

      <Field label={t("fields.message")} name="message">
        <textarea id="message" name="message" rows={5} disabled={isSubmitting} className={`${inputClassName} resize-none`} />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function DateField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="block text-sm font-semibold text-accent">
      <span>{label}</span>
      <span className="mt-2 block">{children}</span>
    </div>
  );
}

function Field({
  children,
  label,
  name,
  required = false,
}: {
  children: ReactNode;
  label: string;
  name: ApplicationFieldKey;
  required?: boolean;
}) {
  const t = useTranslations("ApplicationForm");

  return (
    <label htmlFor={name} className="block text-sm font-semibold text-accent">
      <span>
        {label}
        {required ? <span className="text-accent"> {t("required")}</span> : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function buildPayload(formData: FormData): ApplicationPayload {
  return {
    name: getFormValue(formData, "name"),
    organization: getFormValue(formData, "organization"),
    email: getFormValue(formData, "email"),
    phone: getFormValue(formData, "phone"),
    preferredVisitDate: getFormValue(formData, "preferredVisitDate"),
    visitorCount: getFormValue(formData, "visitorCount"),
    message: getFormValue(formData, "message"),
  };
}

function getFormValue(formData: FormData, key: ApplicationFieldKey) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
