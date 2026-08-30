// Ручное отражение openapi/openapi.yaml. Источник правды — specs/*.tsp, менять типы только следом за спекой.

export type Uuid = string;
export type Email = string;

/** Момент времени в UTC, ISO 8601: `2026-09-01T09:00:00Z`. */
export type UtcDateTime = string;

/** Календарный день в UTC: `2026-09-01`. */
export type PlainDate = string;

export type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SLOT_UNAVAILABLE"
  | "SLOT_OUT_OF_WINDOW"
  | "EVENT_TYPE_IN_USE";

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: Record<string, string>;
}

export interface Owner {
  id: Uuid;
  name: string;
  bio?: string;
}

export interface EventType {
  id: Uuid;
  title: string;
  description?: string;
  durationMinutes: number;
  createdAt: UtcDateTime;
  updatedAt: UtcDateTime;
}

export interface EventTypeSummary {
  id: Uuid;
  title: string;
  durationMinutes: number;
}

export interface EventTypeCreate {
  title: string;
  description?: string;
  durationMinutes: number;
}

export interface EventTypeUpdate {
  title?: string;
  description?: string;
  durationMinutes?: number;
}

export interface Guest {
  name: string;
  email: Email;
}

export interface Slot {
  startsAt: UtcDateTime;
  endsAt: UtcDateTime;
}

export interface DaySlots {
  date: PlainDate;
  slots: Slot[];
}

export interface SlotsResponse {
  eventTypeId: Uuid;
  durationMinutes: number;
  rangeStart: PlainDate;
  rangeEnd: PlainDate;
  days: DaySlots[];
}

export interface Booking {
  id: Uuid;
  eventType: EventTypeSummary;
  startsAt: UtcDateTime;
  endsAt: UtcDateTime;
  guest: Guest;
  createdAt: UtcDateTime;
}

export interface BookingCreate {
  eventTypeId: Uuid;
  startsAt: UtcDateTime;
  guest: Guest;
}

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const GUEST_NAME_MAX_LENGTH = 100;

/** Длительность кратна 30 минутам — правило домена из main.tsp, в схеме OpenAPI его нет. */
export const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240] as const;
