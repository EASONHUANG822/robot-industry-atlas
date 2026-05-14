"use client";

import { useEffect, useMemo, useState } from "react";

type VisitDatePickerProps = {
  disabled?: boolean;
  labels: {
    loading: string;
    loadError: string;
    previousMonth: string;
    nextMonth: string;
    selectedDate: string;
    fullyBooked: string;
    pastDate: string;
    noDateSelected: string;
    weekdays: string[];
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

export function VisitDatePicker({ disabled = false, labels }: VisitDatePickerProps) {
  const fallbackToday = getTodayString();
  const [today, setToday] = useState(fallbackToday);
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => fallbackToday.slice(0, 7));
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(() => new Set());
  const [availabilityState, setAvailabilityState] = useState<"loading" | "ready" | "error">("loading");

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
        if (isMounted) {
          setAvailabilityState("error");
        }
      }
    }

    loadUnavailableDates();

    return () => {
      isMounted = false;
    };
  }, [fallbackToday]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(() => formatMonthLabel(visibleMonth), [visibleMonth]);
  const canGoPrevious = visibleMonth > today.slice(0, 7);

  return (
    <div>
      <input id="preferredVisitDate" type="hidden" name="preferredVisitDate" value={selectedDate} />
      <div className="rounded border border-line bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={disabled || !canGoPrevious}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-line text-sm font-bold text-accent transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={labels.previousMonth}
          >
            {"<"}
          </button>
          <p className="text-sm font-black text-accent">{monthLabel}</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-line text-sm font-bold text-accent transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={labels.nextMonth}
          >
            {">"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {labels.weekdays.map((weekday) => (
            <div key={weekday} className="py-1 text-[11px] font-bold text-[#6b86b3]">
              {weekday}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-10" aria-hidden="true" />;
            }

            const isPast = day < today;
            const isFullyBooked = unavailableDates.has(day);
            const isUnavailable = isPast || isFullyBooked || availabilityState === "loading";
            const isSelected = selectedDate === day;

            return (
              <button
                key={day}
                type="button"
                disabled={disabled || isUnavailable}
                onClick={() => setSelectedDate(day)}
                title={isPast ? labels.pastDate : isFullyBooked ? labels.fullyBooked : undefined}
                className={[
                  "h-10 rounded text-sm font-bold transition-colors",
                  isSelected ? "bg-accent text-white" : "border border-transparent text-accent hover:border-blue-200 hover:bg-blue-50",
                  isUnavailable ? "cursor-not-allowed bg-slate-100 text-slate-400 line-through hover:border-transparent hover:bg-slate-100" : "",
                ].join(" ")}
              >
                {Number(day.slice(8, 10))}
              </button>
            );
          })}
        </div>

        <div className="mt-3 min-h-5 text-xs font-medium text-[#4a6fa5]">
          {availabilityState === "loading" ? labels.loading : null}
          {availabilityState === "error" ? labels.loadError : null}
          {availabilityState === "ready" ? (
            selectedDate ? (
              <span>
                {labels.selectedDate}
                {selectedDate}
              </span>
            ) : (
              labels.noDateSelected
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getTodayString() {
  return isoDateFormatter.format(new Date());
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

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year} / ${String(monthNumber).padStart(2, "0")}`;
}
