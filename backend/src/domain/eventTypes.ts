import { ApiError, notFound } from "../lib/errors.ts";
import {
  findEventType,
  listBookings,
  newId,
  removeEventType,
  saveEventType,
  type EventType,
} from "./store.ts";
import { parseEventTypeCreate, parseEventTypeUpdate } from "./validation.ts";

export function requireEventType(id: string): EventType {
  const found = findEventType(id);
  if (found === undefined) throw notFound("Тип события не найден.");

  return found;
}

export function createEventType(body: unknown, now: Date): EventType {
  const input = parseEventTypeCreate(body);

  const eventType: EventType = {
    id: newId(),
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    createdAt: now,
    updatedAt: now,
  };

  saveEventType(eventType);

  return eventType;
}

/** Уже созданные брони не пересчитываются: они хранят снимок длительности. */
export function updateEventType(
  id: string,
  body: unknown,
  now: Date,
): EventType {
  const current = requireEventType(id);
  const patch = parseEventTypeUpdate(body);

  const updated: EventType = { ...current, updatedAt: now };
  if (patch.title !== undefined) updated.title = patch.title;
  if (patch.durationMinutes !== undefined) {
    updated.durationMinutes = patch.durationMinutes;
  }
  if (patch.description !== undefined) {
    updated.description = patch.description ?? undefined;
  }

  saveEventType(updated);

  return updated;
}

/** Прошедшие встречи удалению не мешают и каскадно не удаляются. */
export function deleteEventType(id: string, now: Date): void {
  const eventType = requireEventType(id);

  const hasUpcoming = listBookings().some(
    (booking) =>
      booking.eventTypeId === eventType.id &&
      booking.startsAt.getTime() >= now.getTime(),
  );

  if (hasUpcoming) {
    throw new ApiError(
      "EVENT_TYPE_IN_USE",
      "У типа события есть предстоящие встречи, поэтому удалить его нельзя.",
    );
  }

  removeEventType(eventType.id);
}
