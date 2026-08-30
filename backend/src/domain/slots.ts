import {
  BOOKING_WINDOW_DAYS,
  SLOT_STEP_MINUTES,
  WORK_DAY_END_MINUTES,
  WORK_DAY_START_MINUTES,
  WORK_DAYS,
} from "../config.ts";
import { outOfWindow, validationFailed } from "../lib/errors.ts";
import {
  addDaysToPlainDate,
  addMinutes,
  daysBetweenPlainDates,
  minutesSinceMidnightUtc,
  overlaps,
  parsePlainDate,
  startOfPlainDate,
  toPlainDate,
  toUtcDateTime,
  weekdayUtc,
} from "../lib/time.ts";
import type { Booking } from "./store.ts";

export interface DaySlots {
  date: string;
  slots: { startsAt: string; endsAt: string }[];
}

export function windowStart(now: Date): string {
  return toPlainDate(now);
}

export function windowEnd(now: Date): string {
  return addDaysToPlainDate(windowStart(now), BOOKING_WINDOW_DAYS - 1);
}

export function resolveRange(
  query: URLSearchParams,
  now: Date,
): { from: string; to: string } {
  const start = windowStart(now);
  const end = windowEnd(now);

  const rawFrom = query.get("from");
  const rawTo = query.get("to");
  const from = rawFrom === null ? start : parsePlainDate(rawFrom);
  const to = rawTo === null ? end : parsePlainDate(rawTo);

  const details: Record<string, string> = {};
  if (from === null) details.from = "Ожидается дата в формате ГГГГ-ММ-ДД.";
  if (to === null) details.to = "Ожидается дата в формате ГГГГ-ММ-ДД.";
  if (from === null || to === null) throw validationFailed(details);

  if (from > to) {
    throw outOfWindow("Начало диапазона позже его конца.");
  }
  if (from < start || to > end) {
    throw outOfWindow(
      `Записаться можно на ${BOOKING_WINDOW_DAYS} дней вперёд: с ${start} по ${end}.`,
    );
  }

  return { from, to };
}

export function buildDays(
  durationMinutes: number,
  from: string,
  to: string,
  now: Date,
  bookings: readonly Booking[],
): DaySlots[] {
  const days: DaySlots[] = [];

  for (let offset = 0; offset <= daysBetweenPlainDates(from, to); offset += 1) {
    const date = addDaysToPlainDate(from, offset);
    days.push({
      date,
      slots: slotsForDay(date, durationMinutes, now, bookings),
    });
  }

  return days;
}

export function isTaken(
  startsAt: Date,
  endsAt: Date,
  bookings: readonly Booking[],
): boolean {
  return bookings.some((booking) =>
    overlaps(startsAt, endsAt, booking.startsAt, booking.endsAt),
  );
}

/** Те же правила, что и при построении сетки: клиент мог прислать что угодно. */
export function assertBookableStart(
  startsAt: Date,
  durationMinutes: number,
  now: Date,
): void {
  const isOnGrid =
    startsAt.getUTCSeconds() === 0 &&
    startsAt.getUTCMilliseconds() === 0 &&
    minutesSinceMidnightUtc(startsAt) % SLOT_STEP_MINUTES === 0;

  if (!isOnGrid) {
    throw outOfWindow(
      `Начало встречи должно попадать на сетку в ${SLOT_STEP_MINUTES} минут.`,
    );
  }

  if (startsAt.getTime() < now.getTime()) {
    throw outOfWindow("Это время уже прошло.");
  }

  const date = toPlainDate(startsAt);
  if (date < windowStart(now) || date > windowEnd(now)) {
    throw outOfWindow(
      `Записаться можно на ${BOOKING_WINDOW_DAYS} дней вперёд: с ${windowStart(now)} по ${windowEnd(now)}.`,
    );
  }

  if (!isWorkingDay(startsAt)) {
    throw outOfWindow("В этот день владелец не принимает встречи.");
  }

  const startMinutes = minutesSinceMidnightUtc(startsAt);
  if (
    startMinutes < WORK_DAY_START_MINUTES ||
    startMinutes + durationMinutes > WORK_DAY_END_MINUTES
  ) {
    throw outOfWindow("Встреча не укладывается в рабочие часы владельца.");
  }
}

function slotsForDay(
  date: string,
  durationMinutes: number,
  now: Date,
  bookings: readonly Booking[],
): DaySlots["slots"] {
  const dayStart = startOfPlainDate(date);
  if (!isWorkingDay(dayStart)) return [];

  const slots: DaySlots["slots"] = [];

  for (
    let minutes = WORK_DAY_START_MINUTES;
    minutes + durationMinutes <= WORK_DAY_END_MINUTES;
    minutes += SLOT_STEP_MINUTES
  ) {
    const startsAt = addMinutes(dayStart, minutes);
    if (startsAt.getTime() < now.getTime()) continue;

    const endsAt = addMinutes(startsAt, durationMinutes);
    if (isTaken(startsAt, endsAt, bookings)) continue;

    slots.push({
      startsAt: toUtcDateTime(startsAt),
      endsAt: toUtcDateTime(endsAt),
    });
  }

  return slots;
}

function isWorkingDay(value: Date): boolean {
  return WORK_DAYS.has(weekdayUtc(value));
}
