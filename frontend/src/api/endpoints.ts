import { request } from "./client";
import type {
  Booking,
  BookingCreate,
  EventType,
  EventTypeCreate,
  EventTypeUpdate,
  Owner,
  PlainDate,
  SlotsResponse,
  UtcDateTime,
  Uuid,
} from "./types";

const id = encodeURIComponent;

export function getOwner(signal?: AbortSignal): Promise<Owner> {
  return request<Owner>("/owner", { signal });
}

export function listEventTypes(signal?: AbortSignal): Promise<EventType[]> {
  return request<EventType[]>("/event-types", { signal });
}

export function getEventType(
  eventTypeId: Uuid,
  signal?: AbortSignal,
): Promise<EventType> {
  return request<EventType>(`/event-types/${id(eventTypeId)}`, { signal });
}

export function getSlots(
  eventTypeId: Uuid,
  range: { from?: PlainDate; to?: PlainDate } = {},
  signal?: AbortSignal,
): Promise<SlotsResponse> {
  return request<SlotsResponse>(`/event-types/${id(eventTypeId)}/slots`, {
    query: { from: range.from, to: range.to },
    signal,
  });
}

export function createBooking(input: BookingCreate): Promise<Booking> {
  return request<Booking>("/bookings", { method: "POST", body: input });
}

export function adminListEventTypes(
  signal?: AbortSignal,
): Promise<EventType[]> {
  return request<EventType[]>("/admin/event-types", { signal });
}

export function adminGetEventType(
  eventTypeId: Uuid,
  signal?: AbortSignal,
): Promise<EventType> {
  return request<EventType>(`/admin/event-types/${id(eventTypeId)}`, {
    signal,
  });
}

export function adminCreateEventType(
  input: EventTypeCreate,
): Promise<EventType> {
  return request<EventType>("/admin/event-types", {
    method: "POST",
    body: input,
  });
}

export function adminUpdateEventType(
  eventTypeId: Uuid,
  input: EventTypeUpdate,
): Promise<EventType> {
  return request<EventType>(`/admin/event-types/${id(eventTypeId)}`, {
    method: "PATCH",
    body: input,
  });
}

export function adminDeleteEventType(eventTypeId: Uuid): Promise<void> {
  return request<void>(`/admin/event-types/${id(eventTypeId)}`, {
    method: "DELETE",
  });
}

export function adminListBookings(
  range: { from?: UtcDateTime; to?: UtcDateTime } = {},
  signal?: AbortSignal,
): Promise<Booking[]> {
  return request<Booking[]>("/admin/bookings", {
    query: { from: range.from, to: range.to },
    signal,
  });
}
