"use client";

import { useEffect, useMemo, useState } from "react";

type DateStatusResponse = {
  dateCounts?: Record<string, number>;
  maxPerDate?: number;
  blockedDates?: string[];
  today?: string;
  error?: string;
};

function getTodayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function buildCalendarDays(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: string[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push("");
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const yyyy = String(year).padStart(4, "0");
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

type DateStatus = "past" | "available" | "partial" | "full" | "blocked";

export function AdminDateManager() {
  const fallbackToday = getTodayString();
  const [today, setToday] = useState(fallbackToday);
  const [visibleMonth, setVisibleMonth] = useState(() => fallbackToday.slice(0, 7));
  const [dateCounts, setDateCounts] = useState<Record<string, number>>({});
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [maxPerDate, setMaxPerDate] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/date-status");
        if (ignore) return;

        if (res.status === 401) {
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Unknown" })) as { error?: string };
          if (!ignore) {
            setError(body?.error || `Failed to load date status (${res.status}).`);
            setLoading(false);
          }
          return;
        }

        const data: DateStatusResponse = await res.json();
        if (ignore) return;

        setError("");
        setToday(data.today || fallbackToday);
        setDateCounts(data.dateCounts || {});
        setBlockedDates(new Set(data.blockedDates || []));
        setMaxPerDate(data.maxPerDate || 4);
        setLoading(false);
      } catch {
        if (!ignore) {
          setError("Network error.");
          setLoading(false);
        }
      }
    }

    load();

    return () => { ignore = true; };
  }, [fallbackToday]);

  async function toggleBlock(date: string) {
    if (date < today) return;
    setToggling(date);
    setError("");
    try {
      if (blockedDates.has(date)) {
        const res = await fetch(`/api/admin/blocked-dates?date=${date}`, { method: "DELETE" });
        if (res.ok) {
          setBlockedDates((prev) => { const next = new Set(prev); next.delete(date); return next; });
        } else {
          const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
          setError(body?.error || "Failed to unblock date.");
        }
      } else {
        const res = await fetch("/api/admin/blocked-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
        if (res.ok) {
          setBlockedDates((prev) => new Set(prev).add(date));
        } else {
          const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
          setError(body?.error || "Failed to block date.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setToggling(null);
    }
  }

  function getDateStatus(date: string): DateStatus {
    if (date < today) return "past";
    if (blockedDates.has(date)) return "blocked";
    const count = dateCounts[date] || 0;
    if (count >= maxPerDate) return "full";
    if (count > 0) return "partial";
    return "available";
  }

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(() => {
    const [y, m] = visibleMonth.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  }, [visibleMonth]);

  function goToPrevMonth() {
    const [y, m] = visibleMonth.split("-").map(Number);
    if (m === 1) setVisibleMonth(`${y - 1}-12`);
    else setVisibleMonth(`${y}-${String(m - 1).padStart(2, "0")}`);
  }

  function goToNextMonth() {
    const [y, m] = visibleMonth.split("-").map(Number);
    if (m === 12) setVisibleMonth(`${y + 1}-01`);
    else setVisibleMonth(`${y}-${String(m + 1).padStart(2, "0")}`);
  }

  const statusStyle: Record<DateStatus, string> = {
    past: "text-gray-300 cursor-default",
    available: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer",
    partial: "text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer",
    full: "text-red-600 bg-red-50 cursor-pointer",
    blocked: "text-white bg-slate-700 hover:bg-slate-800 cursor-pointer",
  };

  const totalBlocked = blockedDates.size;
  const totalFull = Object.entries(dateCounts).filter(([, c]) => c >= maxPerDate).length;
  const totalPartial = Object.entries(dateCounts).filter(([, c]) => c > 0 && c < maxPerDate).length;

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted">Loading...</p>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-line bg-white p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{totalBlocked}</div>
          <div className="text-xs text-muted">已屏蔽日期</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{totalFull}</div>
          <div className="text-xs text-muted">已约满日期</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{totalPartial}</div>
          <div className="text-xs text-muted">部分预约日期</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-accent"
          >
            &#8592; 上月
          </button>
          <span className="text-lg font-bold text-accent">{monthLabel}</span>
          <button
            onClick={goToNextMonth}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-accent"
          >
            下月 &#8594;
          </button>
        </div>

        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-1 text-center text-xs font-semibold text-muted">
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const status = getDateStatus(date);
            const day = parseInt(date.slice(8), 10);
            const count = dateCounts[date] || 0;
            const isToggling = toggling === date;

            return (
              <button
                key={date}
                disabled={status === "past" || isToggling}
                onClick={() => toggleBlock(date)}
                title={
                  status === "blocked"
                    ? `已屏蔽 — 点击取消屏蔽`
                    : status === "full"
                      ? `已约满 (${count}/${maxPerDate}) — 点击屏蔽`
                      : status === "partial"
                        ? `已预约 ${count}/${maxPerDate} — 点击屏蔽`
                        : `可预约 — 点击屏蔽`
                }
                className={`relative flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition ${statusStyle[status]} ${isToggling ? "opacity-50" : ""}`}
              >
                {day}
                {isToggling && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
                    <span className="h-3 w-3 animate-ping rounded-full bg-accent" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-4 border-t border-line pt-4">
          <LegendItem color="bg-emerald-100 text-emerald-700" label="可预约" />
          <LegendItem color="bg-amber-100 text-amber-700" label={`部分预约 (1-${maxPerDate - 1}/${maxPerDate})`} />
          <LegendItem color="bg-red-100 text-red-600" label={`已约满 (${maxPerDate}/${maxPerDate})`} />
          <LegendItem color="bg-slate-700 text-white" label="已屏蔽" />
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block h-3 w-3 rounded bg-gray-300" />
            已过期
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        点击日期可以切换屏蔽/取消屏蔽。未来日期的屏蔽优先于预约计数。
      </p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
