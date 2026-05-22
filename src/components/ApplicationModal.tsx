"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ApplicationForm } from "./ApplicationForm";
import type { AppLocale } from "@/i18n/routing";

type ApplicationModalProps = {
  triggerLabel: string;
  formTitle: string;
  formDescription: string;
  successTitle: string;
  successMessage: string;
  homeCta: string;
  children?: ReactNode;
  paymentMode?: boolean;
  locale?: AppLocale;
};

export function ApplicationModal({
  triggerLabel,
  formTitle,
  formDescription,
  successTitle,
  successMessage,
  homeCta,
  paymentMode,
  locale,
}: ApplicationModalProps) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleSuccess = useCallback(() => {
    setOpen(false);
    setSuccess(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <>
      {/* Trigger */}
      {!success && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-14 items-center justify-center rounded-xl bg-accent px-10 py-4 text-base font-bold text-white shadow-[0_6px_28px_rgba(55,89,187,0.35)] transition-all duration-300 hover:bg-mid-dark hover:shadow-[0_8px_36px_rgba(55,89,187,0.45)] hover:-translate-y-0.5"
        >
          {triggerLabel}
        </button>
      )}

      {/* Success state */}
      {success && (
        <div className="py-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
            <svg className="size-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-accent">{successTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">{successMessage}</p>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={formTitle}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative z-10 flex w-full max-w-xl flex-col rounded-lg border border-line bg-white shadow-[0_24px_72px_rgba(10,30,61,0.22)] sm:max-h-[88vh]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3 sm:px-5">
              <h2 className="text-lg font-extrabold text-accent">{formTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 16" className="w-4" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.45.22A.75.75 0 0 0 .4 1.28L7.11 8 .4 14.72a.75.75 0 0 0 1.06 1.06l6.72-6.72 6.72 6.72a.75.75 0 1 0 1.06-1.06L9.23 8l6.72-6.72A.75.75 0 0 0 14.9.22L8.17 6.94 1.45.22Z" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <p className="mb-4 text-sm leading-6 text-secondary">{formDescription}</p>
              <ApplicationForm onSuccess={handleSuccess} paymentMode={paymentMode} locale={locale} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
