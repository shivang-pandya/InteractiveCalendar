"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
};

const STORAGE_KEY = "wall-calendar-notes";
const IMAGE_STORAGE_KEY = "wall-calendar-hero-image";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const HERO_IMAGES = [
  {
    id: "canyon",
    label: "Canyon",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "forest",
    label: "Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "lake",
    label: "Lake",
    url: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "city",
    label: "City",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
  },
];
const INDIA_FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "01-14": "Makar Sankranti / Pongal",
  "01-26": "Republic Day",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
  "12-25": "Christmas Day",
};
const INDIA_DYNAMIC_FESTIVALS: Record<string, string> = {
  // 2026 major India festival dates.
  "2026-02-15": "Maha Shivaratri",
  "2026-03-04": "Holi",
  "2026-03-20": "Ugadi / Gudi Padwa",
  "2026-03-31": "Ram Navami",
  "2026-04-03": "Mahavir Jayanti",
  "2026-05-01": "Buddha Purnima",
  "2026-09-17": "Ganesh Chaturthi",
  "2026-10-19": "Dussehra (Vijayadashami)",
  "2026-10-31": "Diwali (Deepavali)",
  "2026-11-02": "Govardhan Puja",
  "2026-11-03": "Bhai Dooj",
  "2026-11-24": "Guru Nanak Jayanti",
};

const toDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toRangeKey = (start: Date | null, end: Date | null) => {
  if (!start || !end) {
    return "month";
  }

  const [safeStart, safeEnd] = start <= end ? [start, end] : [end, start];
  return `${toDayKey(safeStart)}_${toDayKey(safeEnd)}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const inRange = (target: Date, start: Date, end: Date) => {
  const [safeStart, safeEnd] = start <= end ? [start, end] : [end, start];
  const startStamp = new Date(
    safeStart.getFullYear(),
    safeStart.getMonth(),
    safeStart.getDate(),
  ).getTime();
  const endStamp = new Date(
    safeEnd.getFullYear(),
    safeEnd.getMonth(),
    safeEnd.getDate(),
  ).getTime();
  const targetStamp = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  ).getTime();

  return targetStamp >= startStamp && targetStamp <= endStamp;
};

const buildMonthGrid = (year: number, month: number): CalendarDay[] => {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadPadding = firstOfMonth.getDay();
  const totalCells = 42;
  const days: CalendarDay[] = [];

  for (let i = leadPadding; i > 0; i -= 1) {
    const date = new Date(year, month, 1 - i);
    days.push({ date, inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, month, day),
      inCurrentMonth: true,
    });
  }

  while (days.length < totalCells) {
    const offset = days.length - (leadPadding + daysInMonth) + 1;
    const date = new Date(year, month + 1, offset);
    days.push({ date, inCurrentMonth: false });
  }

  return days;
};

const getHolidayLabel = (date: Date) => {
  const dayKey = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const fixedHoliday = INDIA_FIXED_HOLIDAYS[dayKey];
  if (fixedHoliday) {
    return fixedHoliday;
  }

  const fullKey = toDayKey(date);
  const dynamicFestival = INDIA_DYNAMIC_FESTIVALS[fullKey];
  if (dynamicFestival) {
    return dynamicFestival;
  }

  return null;
};

export default function Home() {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [isRangeNotePopupOpen, setIsRangeNotePopupOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return HERO_IMAGES[0].id;
    }

    return localStorage.getItem(IMAGE_STORAGE_KEY) ?? HERO_IMAGES[0].id;
  });
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {};
    }

    try {
      return JSON.parse(saved) as Record<string, string>;
    } catch {
      return {};
    }
  });

  const monthGrid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesMap));
  }, [notesMap]);

  useEffect(() => {
    localStorage.setItem(IMAGE_STORAGE_KEY, selectedImageId);
  }, [selectedImageId]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
      return;
    }
    setViewMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
      return;
    }
    setViewMonth((m) => m + 1);
  };

  const onSelectDay = (selected: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(selected);
      setRangeEnd(null);
      setIsRangeNotePopupOpen(false);
      return;
    }

    if (sameDay(rangeStart, selected)) {
      setRangeEnd(selected);
      setIsRangeNotePopupOpen(true);
      return;
    }

    if (selected < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(selected);
      setIsRangeNotePopupOpen(true);
      return;
    }

    setRangeEnd(selected);
    setIsRangeNotePopupOpen(true);
  };

  const selectedRangeKey = toRangeKey(rangeStart, rangeEnd);
  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthNoteKey = `${monthKey}-month`;
  const monthRangeNoteKey = `${monthKey}-${selectedRangeKey}`;
  const activeNoteKey = selectedRangeKey === "month" ? monthNoteKey : monthRangeNoteKey;
  const noteValue = notesMap[activeNoteKey] ?? "";
  const heroImage =
    HERO_IMAGES.find((image) => image.id === selectedImageId) ?? HERO_IMAGES[0];
  const holidaysInView = useMemo(
    () =>
      monthGrid
        .filter((item) => item.inCurrentMonth)
        .map((item) => ({
          key: toDayKey(item.date),
          day: item.date.getDate(),
          label: getHolidayLabel(item.date),
        }))
        .filter((item) => item.label),
    [monthGrid],
  );
  const notedDateKeys = useMemo(() => {
    const keys = new Set<string>();
    const monthPrefix = `${monthKey}-`;

    Object.entries(notesMap).forEach(([key, value]) => {
      if (!value.trim() || !key.startsWith(monthPrefix)) {
        return;
      }

      const rangePart = key.slice(monthPrefix.length);
      if (rangePart === "month") {
        return;
      }

      const [startKey, endKey] = rangePart.split("_");
      if (!startKey || !endKey) {
        return;
      }

      const startDate = new Date(`${startKey}T00:00:00`);
      const endDate = new Date(`${endKey}T00:00:00`);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return;
      }

      const [safeStart, safeEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
      const cursor = new Date(safeStart);
      while (cursor <= safeEnd) {
        if (cursor.getFullYear() === viewYear && cursor.getMonth() === viewMonth) {
          keys.add(toDayKey(cursor));
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return keys;
  }, [monthKey, notesMap, viewMonth, viewYear]);

  const selectedCount =
    rangeStart && rangeEnd
      ? Math.ceil(
          (new Date(
            rangeEnd.getFullYear(),
            rangeEnd.getMonth(),
            rangeEnd.getDate(),
          ).getTime() -
            new Date(
              rangeStart.getFullYear(),
              rangeStart.getMonth(),
              rangeStart.getDate(),
            ).getTime()) /
            86400000,
        ) + 1
      : rangeStart
        ? 1
        : 0;

  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-6 text-[#2f2821] sm:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#d8cdbf] bg-[#fffef8] shadow-[0_18px_60px_-20px_rgba(107,78,52,0.5)] lg:flex-row">
        <aside className="relative min-h-[320px] p-6 text-[#fff8ec] lg:min-h-full lg:w-[38%]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${heroImage.url}")` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,22,15,0.35),rgba(31,22,15,0.6)),radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_52%),radial-gradient(circle_at_bottom_left,rgba(255,225,169,0.2),transparent_40%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#fce5c8]">Wall Planner</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                {HERO_IMAGES.map((image) => (
                  <button
                    key={image.id}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      image.id === heroImage.id
                        ? "border-[#ffe7c8] bg-[#ffe7c8] text-[#352719]"
                        : "border-white/40 bg-black/20 text-[#fff6eb] hover:bg-black/30"
                    }`}
                    onClick={() => setSelectedImageId(image.id)}
                    type="button"
                  >
                    {image.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-white/25 bg-black/15 p-4 backdrop-blur-sm">
              <p className="text-sm text-[#ffe9cb]">Selected Range</p>
              <p className="mt-1 text-lg font-medium">
                {rangeStart ? toDayKey(rangeStart) : "Pick a start date"}
                {rangeStart && rangeEnd ? ` to ${toDayKey(rangeEnd)}` : ""}
              </p>
              <p className="mt-2 text-sm text-[#ffe9cb]">{selectedCount} day(s) selected</p>
              {rangeStart && rangeEnd ? (
                <div className="mt-3 border-t border-white/20 pt-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#ffdfb3]">
                    Range Note
                  </p>
                  <p className="mt-1 line-clamp-4 text-sm text-[#fff2df]">
                    {noteValue.trim() || "No note added for this selected range yet."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <p className="text-sm text-[#685647]">Tap two dates to define a range.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-[#ccb8a3] bg-[#f9f3e7] px-3 py-2 text-sm font-medium transition hover:bg-[#efe4d2]"
                onClick={goToPrevMonth}
                type="button"
              >
                Prev
              </button>
              <button
                className="rounded-lg border border-[#ccb8a3] bg-[#f9f3e7] px-3 py-2 text-sm font-medium transition hover:bg-[#efe4d2]"
                onClick={goToNextMonth}
                type="button"
              >
                Next
              </button>
              <button
                className="rounded-lg border border-[#ccb8a3] bg-white px-3 py-2 text-sm font-medium transition hover:bg-[#faf5ec]"
                onClick={() => {
                  setRangeStart(null);
                  setRangeEnd(null);
                }}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#dfcfbf] bg-white p-3 shadow-sm">
            <div className="mb-2 grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((day) => (
                <p
                  key={day}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7a6554]"
                >
                  {day}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthGrid.map(({ date, inCurrentMonth }) => {
                const isStart = rangeStart ? sameDay(date, rangeStart) : false;
                const isEnd = rangeEnd ? sameDay(date, rangeEnd) : false;
                const isInSelectedRange =
                  rangeStart && rangeEnd ? inRange(date, rangeStart, rangeEnd) : false;
                const isToday = sameDay(date, now);
                const holidayLabel = getHolidayLabel(date);
                const hasNote = notedDateKeys.has(toDayKey(date));
                const baseClass = [
                  "h-12 rounded-lg border text-sm transition sm:h-14",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8b5d33]",
                ].join(" ");

                let toneClass =
                  "border-[#e9ded2] bg-[#fffdfa] text-[#443429] hover:bg-[#f8f0e4]";

                if (!inCurrentMonth) {
                  toneClass = "border-[#eee6db] bg-[#fbf8f3] text-[#b19f8d]";
                }

                if (isInSelectedRange) {
                  toneClass = "border-[#d2b18f] bg-[#f5dcc0] text-[#3d2a1c]";
                }

                if (isStart || isEnd) {
                  toneClass = "border-[#9a6231] bg-[#9a6231] text-[#fff8ee]";
                }

                return (
                  <button
                    key={`${toDayKey(date)}-${inCurrentMonth ? "m" : "x"}`}
                    className={`${baseClass} ${toneClass} relative`}
                    onClick={() => onSelectDay(date)}
                    title={holidayLabel ? `${holidayLabel} (${toDayKey(date)})` : toDayKey(date)}
                    type="button"
                  >
                    <span>{date.getDate()}</span>
                    {holidayLabel ? (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#c24734]" />
                    ) : null}
                    {hasNote ? (
                      <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#27a857]" />
                    ) : null}
                    {isToday ? (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {holidaysInView.length > 0 ? (
              <div className="mt-3 rounded-lg border border-[#ead8c3] bg-[#fff7ea] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b5f43]">
                  India Festivals & Holidays
                </p>
                <p className="mt-1 text-sm text-[#5f4632]">
                  {holidaysInView
                    .map((holiday) => `${holiday.day}: ${holiday.label}`)
                    .join(" • ")}
                </p>
              </div>
            ) : null}
          </div>

          <section className="rounded-xl border border-[#dfcfbf] bg-[#fffbf4] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notes</h3>
              <p className="text-xs text-[#7f6a58]">
                {selectedRangeKey === "month"
                  ? "Editing month memo"
                  : "Editing selected range memo"}
              </p>
            </div>
            <textarea
              aria-label="Calendar notes"
              className="h-28 w-full resize-y rounded-lg border border-[#ddccb8] bg-white p-3 text-sm outline-none transition focus:border-[#9a6231] focus:ring-2 focus:ring-[#ebd4b8]"
              onChange={(event) =>
                setNotesMap((previous) => ({
                  ...previous,
                  [activeNoteKey]: event.target.value,
                }))
              }
              placeholder="Write a reminder, plan, or note for this month/range..."
              value={noteValue}
            />
            <p className="mt-2 text-xs text-[#8a7462]">Auto-saved in local storage.</p>
          </section>
        </div>
      </section>
      {isRangeNotePopupOpen && rangeStart && rangeEnd ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#decab2] bg-[#fff9ef] p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-[#3c2c1e]">Range Notes</h4>
                <p className="text-xs text-[#7c6552]">
                  {toDayKey(rangeStart)} to {toDayKey(rangeEnd)}
                </p>
              </div>
              <button
                className="rounded-md border border-[#d3b99d] bg-white px-2 py-1 text-sm text-[#4a3928] hover:bg-[#f7efe3]"
                onClick={() => setIsRangeNotePopupOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <textarea
              aria-label="Selected range note"
              className="h-32 w-full resize-y rounded-lg border border-[#ddccb8] bg-white p-3 text-sm outline-none transition focus:border-[#9a6231] focus:ring-2 focus:ring-[#ebd4b8]"
              onChange={(event) =>
                setNotesMap((previous) => ({
                  ...previous,
                  [activeNoteKey]: event.target.value,
                }))
              }
              placeholder="Write notes for this selected date range..."
              value={noteValue}
            />
            <p className="mt-2 text-xs text-[#8a7462]">Saved automatically to local storage.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
