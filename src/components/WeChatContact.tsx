"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

type WeChatContactProps = {
  label: string;
  wechatId: string;
  qrCodeSrc?: string;
  qrCodeAlt?: string;
  size?: "sm" | "base";
};

export function WeChatContact({
  label,
  wechatId,
  qrCodeSrc,
  qrCodeAlt = "WeChat QR Code",
  size = "base",
}: WeChatContactProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const iconSize = size === "sm" ? "size-4" : "size-5";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <>
      <button
        type="button"
        onClick={qrCodeSrc ? handleOpen : undefined}
        className={`inline-flex items-center gap-1.5 transition-opacity ${qrCodeSrc ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      >
        <svg className={`${iconSize} shrink-0 text-green-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className={`${textSize} font-bold text-accent`}>{wechatId}</span>
      </button>

      {open && qrCodeSrc && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={qrCodeAlt}
            className="relative z-10 mx-4 w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-[0_24px_72px_rgba(10,30,61,0.26)]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-extrabold text-accent">{label}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex size-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-slate-100 hover:text-ink"
                aria-label="Close"
              >
                <svg fill="none" viewBox="0 0 17 16" className="size-4" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.45.22A.75.75 0 0 0 .4 1.28L7.11 8 .4 14.72a.75.75 0 0 0 1.06 1.06l6.72-6.72 6.72 6.72a.75.75 0 1 0 1.06-1.06L9.23 8l6.72-6.72A.75.75 0 0 0 14.9.22L8.17 6.94 1.45.22Z" fill="currentColor" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 px-6 py-8">
              <img
                src={qrCodeSrc}
                alt={qrCodeAlt}
                className="size-56 rounded-lg border border-line object-contain"
              />
              <p className="text-center text-sm text-secondary">
                {label}：<span className="font-bold text-accent">{wechatId}</span>
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
