import {
  DESCRIPTION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  GUEST_NAME_MAX_LENGTH,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  SLOT_STEP_MINUTES,
  TITLE_MAX_LENGTH,
} from "../config.ts";
import { ApiError, validationFailed } from "../lib/errors.ts";
import { parseUtcDateTime } from "../lib/time.ts";
import type { Guest } from "./store.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EventTypeInput {
  title: string;
  description?: string;
  durationMinutes: number;
}

/** `null` в `description` — явная очистка поля, `undefined` — поле не передавали. */
export interface EventTypePatch {
  title?: string;
  description?: string | null;
  durationMinutes?: number;
}

export interface BookingDetails {
  startsAt: Date;
  guest: Guest;
}

export function parseEventTypeCreate(body: unknown): EventTypeInput {
  const source = asObject(body);
  const details: Record<string, string> = {};

  const title = readTitle(source.title, details);
  const description = readDescription(source.description, details);
  const durationMinutes = readDuration(source.durationMinutes, details);

  if (title === undefined || durationMinutes === undefined) {
    throw validationFailed(details);
  }
  throwIfInvalid(details);

  return { title, description: description ?? undefined, durationMinutes };
}

export function parseEventTypeUpdate(body: unknown): EventTypePatch {
  const source = asObject(body);
  const details: Record<string, string> = {};
  const patch: EventTypePatch = {};

  if (Object.hasOwn(source, "title")) {
    patch.title = readTitle(source.title, details);
  }
  if (Object.hasOwn(source, "description")) {
    patch.description = readDescription(source.description, details);
  }
  if (Object.hasOwn(source, "durationMinutes")) {
    patch.durationMinutes = readDuration(source.durationMinutes, details);
  }

  throwIfInvalid(details);

  return patch;
}

/**
 * Читается отдельно от остального тела: неизвестный тип события — это 404,
 * и проверить его надо раньше, чем валидировать поля гостя.
 */
export function readEventTypeId(body: unknown): string {
  const source = asObject(body);
  const value = source.eventTypeId;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw validationFailed({ eventTypeId: "Выберите тип встречи." });
  }

  return value;
}

export function parseBookingDetails(body: unknown): BookingDetails {
  const source = asObject(body);
  const details: Record<string, string> = {};

  const startsAt = parseUtcDateTime(source.startsAt);
  if (startsAt === null) {
    details.startsAt = "Некорректное время начала встречи.";
  }

  const guest = readGuest(source.guest, details);

  if (startsAt === null || guest === undefined) {
    throw validationFailed(details);
  }
  throwIfInvalid(details);

  return { startsAt, guest };
}

function readTitle(
  value: unknown,
  details: Record<string, string>,
): string | undefined {
  if (typeof value !== "string") {
    details.title = "Название должно быть строкой.";
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    details.title = "Введите название встречи.";
    return undefined;
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    details.title = `Название не длиннее ${TITLE_MAX_LENGTH} символов.`;
    return undefined;
  }

  return trimmed;
}

function readDescription(
  value: unknown,
  details: Record<string, string>,
): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== "string") {
    details.description = "Описание должно быть строкой.";
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) return null;
  if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
    details.description = `Описание не длиннее ${DESCRIPTION_MAX_LENGTH} символов.`;
    return null;
  }

  return trimmed;
}

function readDuration(
  value: unknown,
  details: Record<string, string>,
): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    details.durationMinutes = "Длительность — целое число минут.";
    return undefined;
  }
  if (value < MIN_DURATION_MINUTES || value > MAX_DURATION_MINUTES) {
    details.durationMinutes = `Длительность от ${MIN_DURATION_MINUTES} до ${MAX_DURATION_MINUTES} минут.`;
    return undefined;
  }
  if (value % SLOT_STEP_MINUTES !== 0) {
    details.durationMinutes = `Длительность кратна ${SLOT_STEP_MINUTES} минутам.`;
    return undefined;
  }

  return value;
}

function readGuest(
  value: unknown,
  details: Record<string, string>,
): Guest | undefined {
  if (!isPlainObject(value)) {
    details.guest = "Укажите имя и email гостя.";
    return undefined;
  }

  const name = readGuestName(value.name, details);
  const email = readEmail(value.email, details);

  if (name === undefined || email === undefined) return undefined;

  return { name, email };
}

function readGuestName(
  value: unknown,
  details: Record<string, string>,
): string | undefined {
  if (typeof value !== "string") {
    details["guest.name"] = "Имя должно быть строкой.";
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    details["guest.name"] = "Введите имя.";
    return undefined;
  }
  if (trimmed.length > GUEST_NAME_MAX_LENGTH) {
    details["guest.name"] = `Имя не длиннее ${GUEST_NAME_MAX_LENGTH} символов.`;
    return undefined;
  }

  return trimmed;
}

function readEmail(
  value: unknown,
  details: Record<string, string>,
): string | undefined {
  if (typeof value !== "string") {
    details["guest.email"] = "Email должен быть строкой.";
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmed)) {
    details["guest.email"] = "Введите корректный email.";
    return undefined;
  }

  return trimmed;
}

function throwIfInvalid(details: Record<string, string>): void {
  if (Object.keys(details).length > 0) throw validationFailed(details);
}

function asObject(body: unknown): Record<string, unknown> {
  if (!isPlainObject(body)) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Тело запроса должно быть JSON-объектом.",
    );
  }

  return body;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
