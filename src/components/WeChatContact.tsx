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

  const boxSize = size === "sm" ? "size-8" : "size-10";
  const iconSize = size === "sm" ? "size-4" : "size-5";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <>
      <button
        type="button"
        onClick={qrCodeSrc ? handleOpen : undefined}
        className={`inline-flex items-center gap-3 transition-opacity ${qrCodeSrc ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      >
        <div className={`${boxSize} shrink-0 flex items-center justify-center rounded-lg bg-green-50`}>
          <svg className={`${iconSize} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 2C6.48 2 2 5.92 2 10.68c0 2.66 1.4 5.04 3.6 6.6l-1.05 3.15a.3.3 0 0 0 .42.36l3.67-1.84c.97.27 2.01.41 3.11.4l.25-.01c5.52 0 10-3.92 10-8.68S17.52 2 12 2Z" className="text-[#07c160]" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
          <span className={`${textSize} font-bold text-accent`}>{wechatId}</span>
        </div>
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
