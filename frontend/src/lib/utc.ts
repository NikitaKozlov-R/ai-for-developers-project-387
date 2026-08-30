import type { PlainDate, UtcDateTime } from "@/api/types";

// Единственное место в приложении, где разрешено работать с датами.
// Контракт хранит время только в UTC, поэтому все форматтеры жёстко привязаны к timeZone: 'UTC'.

const time = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
});

const dayMonthYear = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const weekday = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  weekday: "short",
});
const dayNumber = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  day: "numeric",
});
const monthShort = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  month: "short",
});

function plainDateToDate(date: PlainDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function startOfDayIso(date: PlainDate): UtcDateTime {
  return `${date}T00:00:00Z`;
}

export function todayUtc(): PlainDate {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysUtc(date: PlainDate, days: number): PlainDate {
  const shifted = plainDateToDate(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function isPast(moment: UtcDateTime): boolean {
  return new Date(moment).getTime() <= Date.now();
}

export function formatTime(moment: UtcDateTime): string {
  return time.format(new Date(moment));
}

export function formatTimeRange(from: UtcDateTime, to: UtcDateTime): string {
  return `${formatTime(from)} – ${formatTime(to)}`;
}

export function formatDate(date: PlainDate): string {
  return dayMonthYear.format(plainDateToDate(date));
}

export function formatDateTime(moment: UtcDateTime): string {
  const value = new Date(moment);
  return `${dayMonthYear.format(value)}, ${time.format(value)}`;
}

export function formatDayShort(date: PlainDate): {
  weekday: string;
  day: string;
  month: string;
} {
  const value = plainDateToDate(date);
  return {
    weekday: weekday.format(value),
    day: dayNumber.format(value),
    month: monthShort.format(value).replace(".", ""),
  };
}

/** Ключ для группировки моментов по календарным суткам UTC. */
export function dayKey(moment: UtcDateTime): PlainDate {
  return new Date(moment).toISOString().slice(0, 10);
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}
