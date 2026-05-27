"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationFieldKey, ApplicationPayload } from "@/config/applicationForm";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { BookingCalendar } from "./BookingCalendar";

type SubmitState = "idle" | "submitting" | "error";

const inputClassName =
  "w-full rounded border border-line bg-white px-3 py-2 text-sm font-medium text-accent outline-none ring-blue-100 transition placeholder:text-[#9ab0d4] focus:border-accent focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-[#9ab0d4]";

type ApplicationFormProps = {
  successHref?: string;
  onSuccess?: () => void;
  paymentMode?: boolean;
  locale?: AppLocale;
  preSelectedDate?: string;
  preSelectedTime?: string;
  preSelectedVisitorCount?: number;
};

export function ApplicationForm({ successHref = "/payment?success=1", onSuccess, paymentMode, locale, preSelectedDate, preSelectedTime, preSelectedVisitorCount }: ApplicationFormProps) {
  const router = useRouter();
  const t = useTranslations("ApplicationForm");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = buildPayload(formData);

    if (!payload.name || !payload.email) {
      setErrorMessage(t("errors.generic"));
      setSubmitState("error");
      return;
    }

    setSubmitState("submitting");

    try {
      const body: Record<string, unknown> = { ...payload };
      if (paymentMode) {
        body.applicationType = "trial";
      }
      if (locale) {
        body.locale = locale;
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setErrorMessage(data.error || t("errors.generic"));
        setSubmitState("error");
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(successHref);
      }
    } catch {
      setErrorMessage(t("errors.generic"));
      setSubmitState("error");
    }
  }

  const isSubmitting = submitState === "submitting";

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {submitState === "error" ? (
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900">{t("errorTitle")}</p>
          <p className="mt-1 text-sm leading-6 text-red-700">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2">
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
        {preSelectedDate ? (
          <ReadOnlyDateField
            label={t("fields.preferredVisitDate")}
            date={preSelectedDate}
            time={preSelectedTime}
          />
        ) : (
          <DateField label={t("fields.preferredVisitDate")}>
            <BookingCalendar
              disabled={isSubmitting}
              price={100}
              labels={{
                loading: t("datePicker.loading"),
                loadError: t("datePicker.loadError"),
                previousMonth: t("datePicker.previousMonth"),
                nextMonth: t("datePicker.nextMonth"),
                selectDate: t("bookingCalendar.selectDate"),
                selectTime: t("bookingCalendar.selectTime"),
                selectedDate: t("datePicker.selectedDate"),
                fullyBooked: t("datePicker.fullyBooked"),
                pastDate: t("datePicker.pastDate"),
                noDateSelected: t("datePicker.noDateSelected"),
                today: t("bookingCalendar.today"),
                tomorrow: t("bookingCalendar.tomorrow"),
                pickDate: t("bookingCalendar.pickDate"),
                noSlots: t("bookingCalendar.noSlots"),
                weekdays: [
                  t("bookingCalendar.weekdays.0"),
                  t("bookingCalendar.weekdays.1"),
                  t("bookingCalendar.weekdays.2"),
                  t("bookingCalendar.weekdays.3"),
                  t("bookingCalendar.weekdays.4"),
                  t("bookingCalendar.weekdays.5"),
                  t("bookingCalendar.weekdays.6"),
                ],
                months: [
                  t("bookingCalendar.months.0"),
                  t("bookingCalendar.months.1"),
                  t("bookingCalendar.months.2"),
                  t("bookingCalendar.months.3"),
                  t("bookingCalendar.months.4"),
                  t("bookingCalendar.months.5"),
                  t("bookingCalendar.months.6"),
                  t("bookingCalendar.months.7"),
                  t("bookingCalendar.months.8"),
                  t("bookingCalendar.months.9"),
                  t("bookingCalendar.months.10"),
                  t("bookingCalendar.months.11"),
                ],
              }}
            />
          </DateField>
        )}
        {preSelectedVisitorCount != null ? (
          <ReadOnlyField label={t("fields.visitorCount")} value={String(preSelectedVisitorCount)}>
            <input type="hidden" name="visitorCount" value={preSelectedVisitorCount} />
          </ReadOnlyField>
        ) : (
          <Field label={t("fields.visitorCount")} name="visitorCount">
            <input id="visitorCount" type="number" name="visitorCount" min="5" inputMode="numeric" disabled={isSubmitting} className={inputClassName} />
          </Field>
        )}
      </div>

      <Field label={t("fields.message")} name="message">
        <textarea id="message" name="message" rows={2} disabled={isSubmitting} className={`${inputClassName} resize-none`} />
      </Field>

      {paymentMode ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">{t("trialNotice")}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>

    </form>
  );
}

function ReadOnlyField({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="block text-sm font-semibold text-accent">
      <span>{label}</span>
      <span className="mt-1 block">
        {children}
        <div className="w-full rounded border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-accent">
          {value}
        </div>
      </span>
    </div>
  );
}

function ReadOnlyDateField({
  label,
  date,
  time,
}: {
  label: string;
  date: string;
  time?: string;
}) {
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const displayText = time ? `${formattedDate} ${time}` : formattedDate;

  return (
    <div className="block text-sm font-semibold text-accent">
      <span>{label}</span>
      <span className="mt-1 block">
        <input type="hidden" name="preferredVisitDate" value={time ? `${date}T${time}:00+08:00` : date} />
        <div className="w-full rounded border border-line bg-slate-50 px-3 py-2 text-sm font-medium text-accent">
          {displayText}
        </div>
      </span>
    </div>
  );
}

function DateField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="block text-sm font-semibold text-accent">
      <span>{label}</span>
      <span className="mt-1 block">{children}</span>
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
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function buildPayload(formData: FormData): ApplicationPayload {
  const rawDate = getFormValue(formData, "preferredVisitDate");
  const dateOnly = rawDate ? rawDate.slice(0, 10) : "";

  return {
    name: getFormValue(formData, "name"),
    organization: getFormValue(formData, "organization"),
    email: getFormValue(formData, "email"),
    phone: getFormValue(formData, "phone"),
    preferredVisitDate: dateOnly,
    visitorCount: getFormValue(formData, "visitorCount"),
    message: getFormValue(formData, "message"),
  };
}

function getFormValue(formData: FormData, key: ApplicationFieldKey) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
