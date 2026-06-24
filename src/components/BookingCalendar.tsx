"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";

type TimeSlot = {
  iso: string;
  label: string;
};

type BookingCalendarProps = {
  disabled?: boolean;
  price: number;
  labels: {
    loading: string;
    loadError: string;
    previousMonth: string;
    nextMonth: string;
    selectDate: string;
    selectTime: string;
    selectedDate: string;
    fullyBooked: string;
    pastDate: string;
    noDateSelected: string;
    today: string;
    tomorrow: string;
    pickDate: string;
    noSlots: string;
    feeNotice: string;
    weekdays: string[];
    months: string[];
  };
};

type AvailabilityResponse = {
  unavailableDates?: string[];
  today?: string;
  error?: string;
};

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const MORNING_SLOTS: TimeSlot[] = [
  { iso: "09:00", label: "9:00 AM" },
  { iso: "10:30", label: "10:30 AM" },
];
const AFTERNOON_SLOTS: TimeSlot[] = [
  { iso: "14:00", label: "2:00 PM" },
  { iso: "15:30", label: "3:30 PM" },
];
const ALL_SLOTS: TimeSlot[] = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

export function BookingCalendar({ disabled = false, price, labels }: BookingCalendarProps) {
  const fallbackToday = getTodayString();
  const [today, setToday] = useState(fallbackToday);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => fallbackToday.slice(0, 7));
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(() => new Set());
  const [availabilityState, setAvailabilityState] = useState<"loading" | "ready" | "error">("loading");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
        setTimeOpen(false);
      }
    }
    if (calendarOpen || timeOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [calendarOpen, timeOpen]);

  useEffect(() => {
    let isMounted = true;

    async function loadUnavailableDates() {
      try {
        const response = await fetch("/api/applications/unavailable-dates", { cache: "no-store" });
        const result = (await response.json().catch(() => undefined)) as AvailabilityResponse | undefined;

        if (!isMounted) return;

        if (!response.ok) {
          setAvailabilityState("error");
          return;
        }

        const nextToday = result?.today || fallbackToday;
        setToday(nextToday);
        setVisibleMonth((current) => (current < nextToday.slice(0, 7) ? nextToday.slice(0, 7) : current));
        setUnavailableDates(new Set(result?.unavailableDates || []));
        setAvailabilityState("ready");
      } catch {
        if (isMounted) setAvailabilityState("error");
      }
    }

    loadUnavailableDates();
    return () => { isMounted = false; };
  }, [fallbackToday]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(() => {
    const [y, m] = visibleMonth.split("-").map(Number);
    return `${labels.months[m - 1]} ${y}`;
  }, [visibleMonth, labels.months]);
  const canGoPrevious = visibleMonth > today.slice(0, 7);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedSlot("");
    setCalendarOpen(false);
  }, []);

  const todayStr = today;
  const tomorrowStr = useMemo(() => addDays(todayStr, 1), [todayStr]);

  const isTodayAvailable = !unavailableDates.has(todayStr) && todayStr >= today;
  const isTomorrowAvailable = !unavailableDates.has(tomorrowStr);

  const formValue = selectedSlot ? `${selectedDate}T${selectedSlot}:00+08:00` : selectedDate;

  return (
    <div className="space-y-4">
      <input id="preferredVisitDate" type="hidden" name="preferredVisitDate" value={formValue} />

      {/* Select Date */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-normal text-secondary">{labels.selectDate}</h2>

        {/* Quick date buttons + calendar trigger */}
        <div className="relative">
          <div role="menubar" tabIndex={0} className="grid grid-cols-3 gap-x-3" aria-label={labels.selectDate}>
            {availabilityState === "ready" && !isTodayAvailable && !isTomorrowAvailable ? (
              <span className="col-span-2 inline-flex items-center rounded-lg bg-slate-50 px-4 text-sm text-slate-400 ring-1 ring-slate-200">
                {labels.fullyBooked}
              </span>
            ) : (
              <>
                {isTodayAvailable && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(todayStr)}
                    className={[
                      "inline-flex w-full flex-col items-center justify-center rounded-lg px-1 py-2 ring-1 transition-colors",
                      selectedDate === todayStr
                        ? "ring-accent ring-2"
                        : "hover:ring-accent",
                    ].join(" ")}
                  >
                    <span className="text-base leading-5 font-bold">{todayStr.slice(8, 10)}</span>
                    <span className="text-xs leading-4 text-secondary">{labels.today}</span>
                    <span className="mx-auto mt-px block h-px w-3 rounded-full bg-line" />
                    <span className="mt-0.5 text-[11px] text-secondary">¥{price}</span>
                  </button>
                )}
                {isTomorrowAvailable && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(tomorrowStr)}
                    className={[
                      "inline-flex w-full flex-col items-center justify-center rounded-lg px-1 py-2.5 ring-1 transition-colors",
                      selectedDate === tomorrowStr
                        ? "ring-accent ring-2"
                        : "hover:ring-accent",
                    ].join(" ")}
                  >
                    <span className="text-lg leading-6 font-bold">{tomorrowStr.slice(8, 10)}</span>
                    <span className="text-sm leading-5 text-secondary">{labels.tomorrow}</span>
                    <span className="mx-auto mt-0.5 block h-px w-4 rounded-full bg-line" />
                    <span className="mt-1 text-xs text-secondary">¥{price}</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() => setCalendarOpen((v) => !v)}
              aria-expanded={calendarOpen}
              aria-haspopup="dialog"
              className={[
                "inline-flex w-full flex-col items-center justify-center rounded-lg px-1 py-2 ring-1 transition-colors",
                calendarOpen || (selectedDate && selectedDate !== todayStr && selectedDate !== tomorrowStr)
                  ? "ring-accent ring-2"
                  : "hover:ring-accent",
              ].join(" ")}
            >
              <span className="text-base leading-5 font-bold">
                {selectedDate && selectedDate !== todayStr && selectedDate !== tomorrowStr
                  ? selectedDate.slice(8, 10)
                  : calendarOpen
                    ? selectedDate.slice(8, 10) || todayStr.slice(8, 10)
                    : "..."}
              </span>
              <span className="text-xs leading-4 text-secondary">
                {selectedDate && selectedDate !== todayStr && selectedDate !== tomorrowStr
                  ? labels.months[parseInt(selectedDate.slice(5, 7), 10) - 1]
                  : labels.pickDate}
              </span>
              <span className="mx-auto mt-px block h-px w-3 rounded-full bg-line" />
              <span className="mt-0.5 text-[11px] text-secondary">¥{price}</span>
            </button>
          </div>

          {/* Calendar dropdown - right side panel */}
          {calendarOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm" onClick={() => setCalendarOpen(false)} aria-hidden="true" />
              <div ref={calendarRef} className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.15)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h3 className="text-lg font-extrabold capitalize text-ink">{monthLabel}</h3>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="inline-flex size-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-slate-100 hover:text-ink"
                  >
                    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 16" className="w-4">
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.45.22A.75.75 0 0 0 .4 1.28L7.11 8 .4 14.72a.75.75 0 0 0 1.06 1.06l6.72-6.72 6.72 6.72a.75.75 0 1 0 1.06-1.06L9.23 8l6.72-6.72A.75.75 0 0 0 14.9.22L8.17 6.94 1.45.22Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>

                {/* Month navigation */}
                <nav className="flex items-center justify-between px-5 py-3">
                  <button
                    type="button"
                    disabled={!canGoPrevious}
                    onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                    title={labels.previousMonth}
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100",
                      canGoPrevious ? "" : "invisible",
                    ].join(" ")}
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                    title={labels.nextMonth}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
                  >
                    <ChevronRight />
                  </button>
                </nav>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 px-5 text-center text-xs uppercase text-secondary">
                  {labels.weekdays.map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 justify-items-center gap-1 px-5 pb-5">
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} aria-hidden="true" />;
                    }

                    const dayNumber = parseInt(day.slice(8, 10), 10);
                    const isPast = day < today;
                    const isFullyBooked = unavailableDates.has(day);
                    const isUnavailable = isPast || isFullyBooked;
                    const isSelected = selectedDate === day;

                    if (isUnavailable) {
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled
                          className="inline-flex aspect-square w-full flex-col items-center justify-center rounded-lg text-slate-300"
                          title={isPast ? labels.pastDate : labels.fullyBooked}
                        >
                          <span className="text-base leading-5 font-bold">{dayNumber}</span>
                          <span className="invisible mt-px text-[11px]">¥{price}</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectDate(day)}
                        className={[
                          "inline-flex aspect-square w-full flex-col items-center justify-center rounded-lg transition-colors",
                          isSelected
                            ? "bg-accent text-white"
                            : "hover:ring-1 hover:ring-accent focus-within:ring-1 focus-within:ring-accent",
                        ].join(" ")}
                      >
                        <span className="text-base leading-5 font-bold">{dayNumber}</span>
                        <span className="mt-px text-[11px]">¥{price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Select Time */}
      {selectedDate && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-normal text-secondary">{labels.selectTime}</h2>

          <div className="relative">
            <fieldset className="relative w-full flex-col gap-4">
              <legend className="sr-only">{labels.selectTime}</legend>

              <button
                type="button"
                disabled={disabled}
                onClick={() => setTimeOpen((v) => !v)}
                className="group relative flex h-12 w-full rounded-lg border border-line bg-white py-0 pr-6 transition-colors hover:border-accent"
              >
                <div className="flex h-full grow items-center">
                  <span className="flex grow flex-col px-3.5 py-2.5">
                    <span className="flex items-center justify-between">
                      <span className="flex grow gap-2">
                        <span className="text-right font-medium whitespace-nowrap text-ink">
                          {selectedSlot
                            ? ALL_SLOTS.find((s) => s.iso === selectedSlot)?.label
                            : labels.noDateSelected}
                        </span>
                      </span>
                      <span className="flex w-auto items-center justify-end">
                        <span className="relative w-12 text-right md:w-14">
                          <span className="text-sm leading-normal text-ink">¥{price}</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </div>
                <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 rotate-90 cursor-pointer py-2 text-secondary">
                  <ChevronRight />
                </div>
              </button>

              {timeOpen && (
                <div ref={timeRef} className="absolute z-10 mt-2.5 w-full overflow-hidden rounded-lg border border-line bg-white shadow-lg">
                  <div className="max-h-80 w-full overflow-y-auto">
                    {ALL_SLOTS.map((slot) => (
                      <label
                        key={slot.iso}
                        className={[
                          "group relative block w-full cursor-pointer pr-4 text-secondary hover:bg-slate-50",
                          selectedSlot === slot.iso ? "bg-slate-50" : "",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="preferredVisitTime"
                          className="sr-only"
                          value={slot.iso}
                          checked={selectedSlot === slot.iso}
                          onChange={() => {
                            setSelectedSlot(slot.iso);
                            setTimeOpen(false);
                          }}
                          disabled={disabled}
                        />
                        <span className="flex grow flex-col px-3.5 py-2.5">
                          <span className="flex items-center justify-between">
                            <span className="flex grow gap-2">
                              <span className="text-right font-medium whitespace-nowrap text-ink">
                                {slot.label}
                              </span>
                            </span>
                            <span className="flex w-auto items-center justify-end">
                              <span className="relative w-12 text-right md:w-14">
                                <span className="text-sm leading-normal text-ink">¥{price}</span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>
          </div>
        </section>
      )}

      {/* Status text */}
      <div className="min-h-4 text-xs font-medium text-secondary">
        {availabilityState === "loading" && labels.loading}
        {availabilityState === "error" && labels.loadError}
        {availabilityState === "ready" && selectedDate && (
          <span>
            {labels.selectedDate}: {selectedDate}
            {selectedSlot ? ` ${ALL_SLOTS.find((s) => s.iso === selectedSlot)?.label}` : ""}
          </span>
        )}
        {availabilityState === "ready" && !selectedDate && labels.noDateSelected}
      </div>

      {/* Fee / contact notice */}
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800 ring-1 ring-amber-200">
        {labels.feeNotice}
      </p>
    </div>
  );
}

/* ---- Helpers ---- */

function ChevronLeft() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 text-ink rotate-180">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.18473 7.05029L1.66602 12.9998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 text-current">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.18564 7.05047L1.65625 1L7.18564 7.05047V7.05047Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.18473 7.05029L1.66602 12.9998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getTodayString() {
  return isoDateFormatter.format(new Date());
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return isoDateFormatter.format(date);
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const dayCount = new Date(year, monthNumber, 0).getDate();
  const days: Array<string | null> = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= dayCount; day += 1) {
    days.push(`${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }

  return days;
}

function addMonths(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
