"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ApplicationFieldKey, ApplicationPayload } from "@/config/applicationForm";
import { type PaymentMethod } from "@/content/paymentOffer";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { BookingCalendar } from "./BookingCalendar";

type SubmitState = "idle" | "submitting" | "error";
type WechatPayState = {
  codeUrl: string;
  outTradeNo: string;
  amount: number;
} | null;

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
  const [wechatPay, setWechatPay] = useState<WechatPayState>(null);
  const [wechatPayPaid, setWechatPayPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const pendingPayloadRef = useRef<ApplicationPayload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (outTradeNo: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/payment/wechatpay/query?outTradeNo=${encodeURIComponent(outTradeNo)}`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as {
            tradeState?: string;
          };
          if (data.tradeState === "SUCCESS") {
            setWechatPayPaid(true);
            stopPolling();
            setTimeout(() => {
              setWechatPay(null);
              if (onSuccess) {
                onSuccess();
              } else {
                router.push(successHref);
              }
            }, 1500);
          }
        } catch {
          // 轮询失败静默处理，下次继续
        }
      }, 2000);
    },
    [stopPolling, onSuccess, router, successHref],
  );

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

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

    if (!paymentMode) {
      setSubmitState("submitting");
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
        if (!response.ok) {
          setErrorMessage(result?.error || t("errors.generic"));
          setSubmitState("error");
          return;
        }
        form.reset();
        if (onSuccess) onSuccess();
        else router.push(successHref);
      } catch {
        setErrorMessage(t("errors.network"));
        setSubmitState("error");
      }
      return;
    }

    pendingPayloadRef.current = payload;
    setShowPaymentModal(true);
  }

  async function handlePaymentSelect(method: PaymentMethod) {
    setShowPaymentModal(false);
    setSubmitState("submitting");
    setErrorMessage("");

    const payload = pendingPayloadRef.current;
    if (!payload) return;

    try {
      const body: Record<string, unknown> = { ...payload };
      if (locale) body.locale = locale;
      body.paymentMethod = method;

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => undefined)) as
        | { error?: string; url?: string; codeUrl?: string; outTradeNo?: string; amount?: number }
        | undefined;

      if (!response.ok) {
        setErrorMessage(result?.error || t("errors.generic"));
        setSubmitState("error");
        return;
      }

      if (result?.codeUrl) {
        setSubmitState("idle");
        setWechatPay({
          codeUrl: result.codeUrl,
          outTradeNo: result.outTradeNo ?? "",
          amount: result.amount ?? 0,
        });
        startPolling(result.outTradeNo ?? "");
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
        return;
      }
    } catch {
      setErrorMessage(t("errors.network"));
      setSubmitState("error");
    }
  }

  function handleCancelPaymentModal() {
    setShowPaymentModal(false);
    pendingPayloadRef.current = null;
    setSubmitState("idle");
  }

  function handleCancelWechatPay() {
    stopPolling();
    setWechatPay(null);
    setWechatPayPaid(false);
    setSubmitState("idle");
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? t("submitting") : paymentMode ? t("payNow") : t("submit")}
      </button>

      {showPaymentModal && (
        <PaymentMethodModal
          onSelect={handlePaymentSelect}
          onCancel={handleCancelPaymentModal}
        />
      )}

      {wechatPay && !wechatPayPaid && (
        <WechatPayQrModal
          codeUrl={wechatPay.codeUrl}
          outTradeNo={wechatPay.outTradeNo}
          amount={wechatPay.amount}
          onCancel={handleCancelWechatPay}
        />
      )}

      {wechatPayPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-accent">{t("wechatpayQr.paid")}</h3>
            <p className="mt-1 text-sm text-secondary">{t("wechatpayQr.paySuccessRedirect")}</p>
          </div>
        </div>
      )}
    </form>
  );
}

function WechatPayQrModal({
  codeUrl,
  outTradeNo,
  amount,
  onCancel,
}: {
  codeUrl: string;
  outTradeNo: string;
  amount: number;
  onCancel: () => void;
}) {
  const t = useTranslations("ApplicationForm");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    async function generateQr() {
      try {
        const QRCode = (await import("qrcode")).default;
        if (cancelled) return;
        await QRCode.toCanvas(canvas, codeUrl, {
          width: 220,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
      } catch {
        if (!cancelled && canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("QR code generation failed", 110, 110);
          }
        }
      }
    }

    generateQr();
    return () => {
      cancelled = true;
    };
  }, [codeUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-center text-lg font-bold text-accent">{t("wechatpayQr.title")}</h3>

        <div className="mt-4 flex justify-center">
          <canvas ref={canvasRef} width={220} height={220} className="rounded-lg border" />
        </div>

        <p className="mt-2 text-center text-xs text-secondary">{t("wechatpayQr.scanTip")}</p>

        <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-secondary">
          <div className="flex justify-between">
            <span>{t("wechatpayQr.amount")}</span>
            <span className="font-semibold text-accent">&yen;{amount}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("wechatpayQr.orderNo")}</span>
            <span className="font-mono text-[11px] text-secondary">{outTradeNo}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("wechatpayQr.pending")}</span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              {t("wechatpayQr.checking")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm text-secondary transition hover:bg-slate-50"
          >
            {t("wechatpayQr.cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              const c = canvasRef.current;
              if (!c) return;
              import("qrcode").then((QRCode) => {
                QRCode.default.toCanvas(c, codeUrl, {
                  width: 220,
                  margin: 1,
                  color: { dark: "#0f172a", light: "#ffffff" },
                });
              }).catch(() => {});
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-accent transition hover:bg-slate-50"
          >
            {t("wechatpayQr.refresh")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodModal({
  onSelect,
  onCancel,
}: {
  onSelect: (method: PaymentMethod) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("ApplicationForm");

  const methods: { method: PaymentMethod; label: string; text: string; defaultChecked?: boolean }[] = [
    { method: "stripe", label: t("paymentMethods.stripe"), text: t("paymentMethods.stripeText"), defaultChecked: true },
    { method: "paypal", label: t("paymentMethods.paypal"), text: t("paymentMethods.paypalText") },
    { method: "alipay", label: t("paymentMethods.alipay"), text: t("paymentMethods.alipayText") },
    { method: "wechatpay", label: t("paymentMethods.wechatpay"), text: t("paymentMethods.wechatpayText") },
    { method: "unionpay", label: t("paymentMethods.unionpay"), text: t("paymentMethods.unionpayText") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-accent">{t("paymentMethods.legend")}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {methods.map((m) => (
            <button
              key={m.method}
              type="button"
              onClick={() => onSelect(m.method)}
              className="flex h-full flex-col rounded-lg border border-line bg-white p-4 text-left transition hover:border-accent hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="block text-sm font-bold text-accent">{m.label}</span>
              <span className="mt-auto block text-xs leading-4 text-secondary">{m.text}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-lg border border-line px-4 py-2 text-sm text-secondary transition hover:bg-slate-50"
        >
          {t("wechatpayQr.cancel")}
        </button>
      </div>
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
