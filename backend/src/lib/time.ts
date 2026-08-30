// Единственное место, где разбираются и собираются даты. Контракт хранит только UTC:
// моменты — `utcDateTime`, календарные дни — `plainDate`. Часового пояса нет.

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** RFC 3339 со смещением: без него строка читалась бы как локальное время. */
const UTC_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function parsePlainDate(value: unknown): string | null {
  if (typeof value !== "string" || !PLAIN_DATE_PATTERN.test(value)) return null;

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (toPlainDate(parsed) !== value) return null;

  return value;
}

export function parseUtcDateTime(value: unknown): Date | null {
  if (typeof value !== "string" || !UTC_DATE_TIME_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Момент времени без миллисекунд: `2026-09-01T09:00:00Z`. */
export function toUtcDateTime(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function toPlainDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function startOfPlainDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function addDaysToPlainDate(date: string, days: number): string {
  return toPlainDate(
    new Date(startOfPlainDate(date).getTime() + days * DAY_MS),
  );
}

export function daysBetweenPlainDates(from: string, to: string): number {
  return Math.round(
    (startOfPlainDate(to).getTime() - startOfPlainDate(from).getTime()) /
      DAY_MS,
  );
}

export function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * MINUTE_MS);
}

export function minutesSinceMidnightUtc(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export function weekdayUtc(value: Date): number {
  return value.getUTCDay();
}

/** Пересечение полуинтервалов [start, end): касание границами конфликтом не считается. */
export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}
