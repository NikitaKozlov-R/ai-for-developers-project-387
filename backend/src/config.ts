import path from "node:path";

// Настройки сервера. Рабочих часов и шага сетки нет в контракте — это решение бэкенда.

export const PORT = readPort();

/** Собранная статика фронтенда, кладётся сюда Dockerfile при сборке образа. */
export const PUBLIC_DIR = path.join(import.meta.dirname, "../public");

/** Откуда браузеру разрешено ходить напрямую, минуя прокси Vite. */
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

/** Рабочий день владельца в минутах от полуночи UTC: 09:00–18:00. */
export const WORK_DAY_START_MINUTES = 9 * 60;
export const WORK_DAY_END_MINUTES = 18 * 60;

/** Дни недели по `Date#getUTCDay`: понедельник–пятница. */
export const WORK_DAYS: ReadonlySet<number> = new Set([1, 2, 3, 4, 5]);

export const SLOT_STEP_MINUTES = 30;

export const BOOKING_WINDOW_DAYS = 14;

export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 240;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const GUEST_NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;

function readPort(): number {
  const raw = process.env.PORT;
  if (raw === undefined) return 3000;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Некорректный PORT: ${raw}`);
  }

  return parsed;
}
