"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ApplicationForm } from "@/components/ApplicationForm";
import { WeChatContact } from "@/components/WeChatContact";

/* ---- Types ---- */

type TicketTier = {
  id: string;
  name: string;
  price: number;
};

type GalleryImage = {
  src: string;
  alt: string;
};

export type CheckoutLabels = {
  title: string;
  close: string;
  from: string;
  bookingFee: string;
  selectDate: string;
  selectTime: string;
  today: string;
  tomorrow: string;
  otherDates: string;
  noSlots: string;
  continueToPayment: string;
  total: string;
  perPerson: string;
  weekdays: string[];
  months: string[];
  formTitle: string;
  formBack: string;
  formDescription: string;
  visitorCount: string;
  referenceNotice: string;
  feeNotice: string;
  contactNotice: string;
};

type CheckoutModalProps = {
  triggerLabel: string;
  triggerClassName?: string;
  productName: string;
  productDescription: string;
  tiers?: TicketTier[];
  bookingFee?: number;
  galleryImages?: GalleryImage[];
  productImages?: GalleryImage[];
  labels: CheckoutLabels;
  locale?: AppLocale;
  price: number;
  hidePrice?: boolean;
};

/* ---- Calendar Helpers ---- */

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getTodayString() {
  return isoDateFormatter.format(new Date());
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return isoDateFormatter.format(date);
}

function formatDateLabel(dateStr: string, months: string[], weekdays: string[]) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = weekdays[date.getDay()];
  return `${months[m - 1]} ${d}日 ${weekday}`;
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const dayCount = new Date(year, monthNumber, 0).getDate();
  const days: Array<string | null> = Array.from({ length: firstDay.getDay() }, () => null);
  for (let day = 1; day <= dayCount; day += 1) {
    days.push(
      `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  return days;
}

function addMonths(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/* ---- Component ---- */

export function CheckoutModal({
  triggerLabel,
  triggerClassName,
  productName,
  productDescription,
  tiers,
  bookingFee = 0,
  galleryImages,
  productImages,
  labels,
  locale,
  price,
  hidePrice = false,
}: CheckoutModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"tickets" | "form">("tickets");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [productSlide, setProductSlide] = useState(0);
  const MAX_DATES = 5;
  const fallbackToday = getTodayString();
  const [today] = useState(fallbackToday);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const minBookableDate = useMemo(() => addDays(today, 2), [today]);
  const [visibleMonth, setVisibleMonth] = useState(fallbackToday.slice(0, 7));

  const calendarRef = useRef<HTMLDivElement>(null);

  const defaultTiers: TicketTier[] = useMemo(
    () => tiers || [{ id: "adult", name: "", price }],
    [tiers, price],
  );

  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    defaultTiers.forEach((tier) => {
      initial[tier.id] = tier.id === "adult" ? 1 : 0;
    });
    return initial;
  });

  const handleOpen = useCallback(() => {
    const initial: Record<string, number> = {};
    defaultTiers.forEach((tier) => {
      initial[tier.id] = tier.id === "adult" ? 1 : 0;
    });
    setTicketCounts(initial);
    setSelectedDates([minBookableDate]);
    setCurrentSlide(0);
    setCalendarOpen(false);
    setProductSlide(0);
    setVisibleMonth(today.slice(0, 7));
    setStep("tickets");
    setOpen(true);
  }, [today, minBookableDate, defaultTiers]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Click outside to close calendar and time picker
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [calendarOpen]);

  const updateCount = useCallback((tierId: string, delta: number) => {
    setTicketCounts((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [tierId]: next };
    });
  }, []);

  const totalTickets = useMemo(
    () => Object.values(ticketCounts).reduce((sum, c) => sum + c, 0),
    [ticketCounts],
  );

  const totalPrice = useMemo(() => {
    let sum = 0;
    defaultTiers.forEach((tier) => {
      sum += (ticketCounts[tier.id] || 0) * tier.price;
    });
    if (totalTickets > 0) sum += bookingFee;
    return sum;
  }, [ticketCounts, defaultTiers, bookingFee, totalTickets]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const monthLabel = useMemo(() => {
    const [y, m] = visibleMonth.split("-").map(Number);
    return `${labels.months[m - 1]} ${y}`;
  }, [visibleMonth, labels.months]);

  const canGoPrevious = visibleMonth > today.slice(0, 7);

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(date)) {
        return prev.filter((d) => d !== date);
      }
      if (prev.length >= MAX_DATES) return prev; // max reached, ignore
      return [...prev, date].sort();
    });
  }, []);

  const handleCheckout = useCallback(() => {
    if (selectedDates.length === 0 || totalTickets === 0) return;
    setStep("form");
  }, [selectedDates, totalTickets]);

  const handleFormSuccess = useCallback(() => {
    setOpen(false);
    router.push("/payment/success");
  }, [router]);

  const showGallery = galleryImages && galleryImages.length > 0;
  const canGoNext = showGallery && currentSlide < galleryImages!.length - 1;
  const canGoPrev = showGallery && currentSlide > 0;

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {/* Modal */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="relative z-10 flex h-full w-full flex-col bg-white md:h-[96vh] md:max-w-[960px] md:rounded-xl md:shadow-[0_24px_72px_rgba(10,30,61,0.26)]"
          >
            {/* Header */}
            <nav className="relative flex max-h-16 shrink-0 items-center justify-end border-b border-line px-4 py-4">
              {step === "form" && (
                <button
                  type="button"
                  onClick={() => setStep("tickets")}
                  className="mr-3 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition-colors hover:text-accent"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  {labels.formBack}
                </button>
              )}
              <h1
                tabIndex={-1}
                className="pointer-events-none mr-auto ml-2.5 text-center text-lg font-extrabold capitalize text-accent"
              >
                {step === "form" ? labels.formTitle : labels.title}
              </h1>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <svg
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 17 16"
                  className="w-5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.45.22A.75.75 0 0 0 .4 1.28L7.11 8 .4 14.72a.75.75 0 0 0 1.06 1.06l6.72-6.72 6.72 6.72a.75.75 0 1 0 1.06-1.06L9.23 8l6.72-6.72A.75.75 0 0 0 14.9.22L8.17 6.94 1.45.22Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </nav>

            {/* Body */}
            <main className="min-h-0 flex-1 overflow-y-auto">
              {step === "tickets" ? (
                <div className="grid h-full md:grid-cols-2">
                {/* Left Column: Gallery + Tiers */}
                <section className="flex h-full flex-col justify-between">
                  <div className="grid h-max gap-6 px-2 py-6 md:sticky md:top-0">
                    {/* Gallery */}
                    {showGallery && (
                      <div className="flex items-center justify-center px-4">
                        <section
                          className="relative w-full overflow-hidden rounded-lg"
                          aria-label={`Gallery images, slide count: ${galleryImages!.length}`}
                        >
                          <div
                            className="relative aspect-[3/2] w-full"
                          >
                            {galleryImages!.map((img, i) => (
                              <div
                                key={i}
                                aria-hidden={i !== currentSlide}
                                className="absolute inset-0 transition-opacity duration-300"
                                style={{ opacity: i === currentSlide ? 1 : 0 }}
                              >
                                <img
                                  alt={img.alt}
                                  className="h-full w-full rounded-lg object-cover"
                                  src={img.src}
                                />
                              </div>
                            ))}

                            {/* Arrow navigation */}
                            {canGoPrev && (
                              <button
                                type="button"
                                onClick={() => setCurrentSlide((s) => s - 1)}
                                className="group absolute left-0 top-1/2 -translate-y-1/2 ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-80 transition-opacity hover:opacity-100"
                                aria-label="Previous slide"
                              >
                                <svg
                                  width="8"
                                  height="14"
                                  viewBox="0 0 8 14"
                                  fill="none"
                                  className="w-4 rotate-180 text-ink"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M7.18473 7.05029L1.66602 12.9998"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            )}
                            {canGoNext && (
                              <button
                                type="button"
                                onClick={() => setCurrentSlide((s) => s + 1)}
                                className="group absolute right-0 top-1/2 -translate-y-1/2 mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-80 transition-opacity hover:opacity-100"
                                aria-label="Next slide"
                              >
                                <svg
                                  width="8"
                                  height="14"
                                  viewBox="0 0 8 14"
                                  fill="none"
                                  className="w-4 text-ink"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M7.18473 7.05029L1.66602 12.9998"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            )}

                            {/* Dots */}
                            <ul className="absolute bottom-0 left-0 right-0 m-2 flex justify-center gap-2">
                              {galleryImages!.map((_, i) => (
                                <li key={i}>
                                  <button
                                    type="button"
                                    onClick={() => setCurrentSlide(i)}
                                    className={`block h-2.5 w-2.5 rounded-full border border-white transition-colors ${
                                      i === currentSlide ? "bg-white" : "bg-white/40 hover:bg-white/70"
                                    }`}
                                    aria-label={`Slide number ${i + 1}`}
                                    aria-current={i === currentSlide}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex flex-col gap-3 px-4">
                      <h2 className="text-base font-bold leading-6 text-ink">
                        {productName}
                      </h2>
                      <p
                        className="text-sm leading-6 text-secondary"
                        dangerouslySetInnerHTML={{ __html: productDescription.replace(/\n/g, "<br>") }}
                      />
                      {productImages && productImages.length > 0 && (
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
                          {productImages.map((img, i) => (
                            <img
                              key={img.src}
                              src={img.src}
                              alt={img.alt}
                              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                                i === productSlide ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          ))}
                          {productImages.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setProductSlide((s) => (s === 0 ? productImages.length - 1 : s - 1))}
                                className="group absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-80 transition-opacity hover:opacity-100"
                              >
                                <svg width="16" height="16" viewBox="0 0 8 14" fill="none" className="rotate-180">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M7.18473 7.05029L1.66602 12.9998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductSlide((s) => (s === productImages.length - 1 ? 0 : s + 1))}
                                className="group absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-80 transition-opacity hover:opacity-100"
                              >
                                <svg width="16" height="16" viewBox="0 0 8 14" fill="none">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M7.18473 7.05029L1.66602 12.9998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                                {productImages.map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setProductSlide(i)}
                                    className={`h-2 w-2 rounded-full border border-white transition-colors ${
                                      i === productSlide ? "bg-white" : "bg-white/40 hover:bg-white/70"
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ticket Tiers */}
                    <div className="flex flex-col py-2">
                      {defaultTiers.map((tier) => (
                        <div key={tier.id} className="border-t border-line">
                          <div className="py-4 pr-2 pl-4 transition-all">
                            <div className="flex items-center justify-between">
                              <div>
                                {tier.name ? (
                                  <div className="text-base leading-6 font-bold text-ink">
                                    {tier.name}
                                  </div>
                                ) : (
                                  <div className="text-base leading-6 font-bold text-ink">
                                    {labels.visitorCount}
                                  </div>
                                )}
                              </div>

                              {/* Quantity Selector */}
                              <label className="flex items-center justify-center">
                                <button
                                  type="button"
                                  title={`Decrease ${tier.name} count`}
                                  disabled={(ticketCounts[tier.id] || 0) <= 1}
                                  onClick={() => updateCount(tier.id, -1)}
                                  className="group touch-manipulation px-2 py-1 focus:outline-0 disabled:cursor-not-allowed"
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-white text-accent transition-colors group-hover:border-blue-600 group-hover:text-blue-600 group-disabled:border-slate-200 group-disabled:text-slate-200">
                                    <svg className="w-5" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="-1.5 -1.5 21 4">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M.15 1.1C.15.7.5.37.9.37H17.5a.75.75 0 0 1 0 1.5H.9a.75.75 0 0 1-.75-.75Z" fill="currentColor" />
                                    </svg>
                                  </span>
                                </button>

                                <output
                                  aria-atomic="true"
                                  aria-live="polite"
                                  className="w-8 text-center text-base leading-6 font-bold text-ink"
                                >
                                  {ticketCounts[tier.id] || 0}
                                </output>

                                <button
                                  type="button"
                                  title={`Increase ${tier.name} count`}
                                  onClick={() => updateCount(tier.id, 1)}
                                  className="group touch-manipulation px-2 py-1 focus:outline-0"
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-white text-accent transition-colors group-hover:border-blue-600 group-hover:text-blue-600">
                                    <svg className="w-5" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 20 20">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M9.95.82a.75.75 0 1 0-1.5 0v7.54H.9a.75.75 0 0 0 0 1.5h7.55v7.54a.75.75 0 0 0 1.5 0V9.86h7.54a.75.75 0 0 0 0-1.5H9.95V.82Z" fill="currentColor" />
                                    </svg>
                                  </span>
                                </button>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Booking Extras */}
                    {!hidePrice && bookingFee > 0 && (
                      <div className="mx-2 mb-2 flex flex-col gap-y-6 rounded-md border border-line bg-slate-50 py-4 pr-2 pl-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-base leading-6 font-bold text-ink">
                              {labels.bookingFee}
                            </div>
                            <span className="text-sm font-normal text-secondary">¥{bookingFee}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Email */}
                    <div className="px-4 pb-2">
                      <a
                        href="mailto:info@robotuo.com"
                        className="text-xs text-muted transition hover:text-accent"
                      >
                        info@robotuo.com
                      </a>
                    </div>
                  </div>
                </section>

                {/* Right Column: Date + Time Selection */}
                <section className="relative flex h-full flex-col gap-6 border-l border-line py-6">
                  {/* Reference-only notice */}
                  <div className="px-6">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-semibold text-amber-800">{labels.referenceNotice}</p>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3.5">
                      <h2 className="px-6 text-sm font-normal text-secondary">
                        {labels.selectDate}
                      </h2>

                      <div className="relative" ref={calendarRef}>
                        <div role="menubar" tabIndex={0} className="px-6" aria-label={labels.selectDate}>
                          <button
                            type="button"
                            onClick={() => setCalendarOpen((v) => !v)}
                            aria-expanded={calendarOpen}
                            aria-controls="calendar-modal"
                            aria-haspopup="dialog"
                            className={[
                              "inline-flex w-full flex-col items-center justify-center rounded-lg px-1 py-5 ring-1 transition-colors",
                              calendarOpen ? "ring-accent ring-2" : "ring-line hover:ring-accent",
                            ].join(" ")}
                          >
                            <span className="flex h-6 items-center text-accent">
                              <svg width="17" height="19" viewBox="0 0 17 19" fill="none" className="w-4">
                                <path d="M15.5626 2.42371H1.98363C1.60866 2.42371 1.30469 2.73122 1.30469 3.11055V16.8474C1.30469 17.2267 1.60866 17.5342 1.98363 17.5342H15.5626C15.9376 17.5342 16.2415 17.2267 16.2415 16.8474V3.11055C16.2415 2.73122 15.9376 2.42371 15.5626 2.42371Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12.6211 1.05005V3.79742" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4.47266 1.05005V3.79742" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.20898 6.3158L15.7879 6.31579" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="text-sm leading-5 text-secondary">{labels.selectDate}</span>
                          </button>
                        </div>

                        {/* Calendar Dropdown */}
                        {calendarOpen && (
                          <div
                            id="calendar-modal"
                            className="absolute inset-x-0 top-full z-20 mt-4 md:max-w-md"
                          >
                            <div className="w-full overflow-hidden rounded-md bg-white px-1 pb-2 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                              <div className="pt-6">
                                {/* Month Navigation */}
                                <nav className="flex items-center justify-between px-6">
                                  <button
                                    type="button"
                                    disabled={!canGoPrevious}
                                    onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 ${!canGoPrevious ? "invisible" : ""}`}
                                    title="Previous month"
                                  >
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="w-4 rotate-180 text-ink">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M7.18473 7.05029L1.66602 12.9998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                  <div className="text-lg font-extrabold capitalize text-ink">{monthLabel}</div>
                                  <button
                                    type="button"
                                    onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                                    title="Next month"
                                  >
                                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="w-4 text-ink">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M7.18473 7.05029L1.66602 12.9998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </nav>

                                {/* Day of week headers */}
                                <div className="mt-7 grid grid-cols-7 text-center text-xs uppercase text-secondary">
                                  {labels.weekdays.map((d) => (
                                    <div key={d}>{d}</div>
                                  ))}
                                </div>

                                {/* Day grid */}
                                <div className="mt-4 grid grid-cols-7 justify-items-center gap-1">
                                  {calendarDays.map((day, index) => {
                                    if (!day) {
                                      return <div key={`empty-${index}`} aria-hidden="true" />;
                                    }
                                    const dayNumber = parseInt(day.slice(8, 10), 10);
                                    const isPast = day < minBookableDate;
                                    const isSelected = selectedDates.includes(day);
                                    const isFull = !isSelected && selectedDates.length >= MAX_DATES;

                                    if (isPast) {
                                      return (
                                        <button
                                          key={day}
                                          type="button"
                                          disabled
                                          className="inline-flex aspect-square w-full flex-col items-center justify-center rounded-lg text-slate-300"
                                        >
                                          <span className="text-lg leading-6 font-bold">{dayNumber}</span>
                                          {!hidePrice && <span className="invisible mt-px text-[11px]">¥{price}</span>}
                                        </button>
                                      );
                                    }

                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDate(day)}
                                        disabled={isFull}
                                        className={[
                                          "inline-flex aspect-square w-full flex-col items-center justify-center rounded-lg transition-colors",
                                          isSelected
                                            ? "bg-accent text-white"
                                            : isFull
                                              ? "cursor-not-allowed text-slate-300"
                                              : "hover:ring-1 hover:ring-accent",
                                        ].join(" ")}
                                      >
                                        <span className="text-lg leading-6 font-bold">{dayNumber}</span>
                                        {!hidePrice && (
                                          <span className={`mt-px text-[11px] ${isSelected ? "text-white/70" : "text-secondary"}`}>
                                            ¥{price}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected dates summary */}
                    {selectedDates.length > 0 && (
                      <div className="px-6">
                        <div className="flex flex-wrap gap-2">
                          {selectedDates.map((d) => (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                            >
                              {formatDateLabel(d, labels.months, labels.weekdays)}
                              <button
                                type="button"
                                onClick={() => toggleDate(d)}
                                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-accent/60 hover:bg-accent/20 hover:text-accent"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          {labels.referenceNotice}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Footer: Contact + Fee notice + Continue */}
                  <div className="mt-auto flex flex-col gap-3 border-t border-line px-6 pt-6">
                    {/* Fee notice */}
                    <div className="rounded-lg bg-accent/[0.04] px-4 py-3 text-center">
                      <p className="text-xs font-medium text-secondary">{labels.feeNotice}</p>
                    </div>

                    {/* Contact info — always visible */}
                    <div className="flex items-center justify-center gap-4 text-xs text-secondary">
                      <a href="mailto:info@robotuo.com" className="inline-flex items-center gap-2 transition-opacity cursor-pointer hover:opacity-80">
                        <div className="size-7 shrink-0 flex items-center justify-center rounded-lg bg-accent/10">
                          <svg className="size-3.5 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-accent">info@robotuo.com</span>
                      </a>
                      <span className="text-muted">/</span>
                      <WeChatContact
                        label="WeChat"
                        wechatId="robotuo2026"
                        qrCodeSrc="/images/wechat_code.jpg"
                        size="sm"
                      />
                    </div>
                    <p className="text-center text-xs text-muted">{labels.contactNotice}</p>

                    {!hidePrice && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-secondary">{labels.total}</span>
                          <span className="text-lg font-extrabold text-accent">¥{totalPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-secondary">
                          <span>
                            {totalTickets} {labels.perPerson} × ¥{price}
                          </span>
                          {bookingFee > 0 && (
                            <span>+ ¥{bookingFee} {labels.bookingFee.toLowerCase()}</span>
                          )}
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={selectedDates.length === 0 || totalTickets < 1}
                      onClick={handleCheckout}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-bold text-white shadow-[0_6px_28px_rgba(55,89,187,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-mid-dark hover:shadow-[0_8px_36px_rgba(55,89,187,0.45)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
                    >
                      {labels.continueToPayment}
                    </button>
                  </div>
                </section>
              </div>
              ) : (
                <div className="flex h-full flex-col px-4 py-6 sm:px-6">
                  <h2 className="text-xl font-black leading-tight text-accent sm:text-2xl">
                    {labels.formTitle}
                  </h2>
                  <p className="mt-1.5 text-xs leading-5 text-secondary">
                    {labels.formDescription}
                  </p>
                  <div className="mt-4 flex-1">
                    <ApplicationForm
                      paymentMode
                      locale={locale}
                      onSuccess={handleFormSuccess}
                      preSelectedDate={selectedDates[0] || ""}
                      preSelectedDates={selectedDates}
                      preSelectedVisitorCount={totalTickets}
                    />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
