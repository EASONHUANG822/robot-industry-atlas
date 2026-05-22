"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationFieldKey, ApplicationPayload } from "@/config/applicationForm";
import { PAYMENT_METHOD_KEYS, type PaymentMethod } from "@/content/paymentOffer";
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
};

export function ApplicationForm({ successHref = "/payment?success=1", onSuccess, paymentMode, locale }: ApplicationFormProps) {
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
      const endpoint = paymentMode ? "/api/payment/create" : "/api/applications";

      const body: Record<string, unknown> = { ...payload };
      if (paymentMode && locale) {
        body.locale = locale;
      }
      if (paymentMode) {
        body.paymentMethod = getPaymentMethod(formData);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => undefined)) as
        | { error?: string; url?: string }
        | undefined;

      if (!response.ok) {
        setErrorMessage(result?.error || t("errors.generic"));
        setSubmitState("error");
        return;
      }

      if (paymentMode && result?.url) {
        window.location.href = result.url;
        return;
      }

      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(successHref);
      }
    } catch {
      setErrorMessage(t("errors.network"));
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
        <Field label={t("fields.visitorCount")} name="visitorCount">
          <input id="visitorCount" type="number" name="visitorCount" min="1" inputMode="numeric" disabled={isSubmitting} className={inputClassName} />
        </Field>
      </div>

      <Field label={t("fields.message")} name="message">
        <textarea id="message" name="message" rows={2} disabled={isSubmitting} className={`${inputClassName} resize-none`} />
      </Field>

      {paymentMode ? <PaymentMethodSelector disabled={isSubmitting} /> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? t("submitting") : paymentMode ? t("payNow") : t("submit")}
      </button>
    </form>
  );
}

function PaymentMethodSelector({ disabled }: { disabled: boolean }) {
  const t = useTranslations("ApplicationForm");

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-accent">{t("paymentMethods.legend")}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <PaymentMethodOption
          defaultChecked
          disabled={disabled}
          label={t("paymentMethods.stripe")}
          name="stripe"
          text={t("paymentMethods.stripeText")}
        />
        <PaymentMethodOption
          disabled={disabled}
          label={t("paymentMethods.paypal")}
          name="paypal"
          text={t("paymentMethods.paypalText")}
        />
      </div>
    </fieldset>
  );
}

function PaymentMethodOption({
  defaultChecked = false,
  disabled,
  label,
  name,
  text,
}: {
  defaultChecked?: boolean;
  disabled: boolean;
  label: string;
  name: PaymentMethod;
  text: string;
}) {
  return (
    <label className="block">
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        disabled={disabled}
        name="paymentMethod"
        type="radio"
        value={name}
      />
      <span className="block rounded-lg border border-line bg-white p-2.5 transition peer-checked:border-accent peer-checked:bg-blue-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
        <span className="block text-sm font-bold text-accent">{label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-secondary">{text}</span>
      </span>
    </label>
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

function getPaymentMethod(formData: FormData): PaymentMethod {
  const value = formData.get("paymentMethod");
  return PAYMENT_METHOD_KEYS.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : "stripe";
}
