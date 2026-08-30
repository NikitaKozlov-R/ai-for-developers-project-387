import { ApiError } from "../lib/errors.ts";
import { addMinutes, parseUtcDateTime } from "../lib/time.ts";
import { requireEventType } from "./eventTypes.ts";
import { assertBookableStart, isTaken } from "./slots.ts";
import { listBookings, newId, saveBooking, type Booking } from "./store.ts";
import { parseBookingDetails, readEventTypeId } from "./validation.ts";

export function createBooking(body: unknown, now: Date): Booking {
  const eventType = requireEventType(readEventTypeId(body));
  const { startsAt, guest } = parseBookingDetails(body);

  assertBookableStart(startsAt, eventType.durationMinutes, now);

  const endsAt = addMinutes(startsAt, eventType.durationMinutes);

  // Календарь у владельца один, поэтому занятость считается по всем типам событий.
  if (isTaken(startsAt, endsAt, listBookings())) {
    throw new ApiError(
      "SLOT_UNAVAILABLE",
      "Это время уже заняли. Выберите другой слот.",
    );
  }

  const booking: Booking = {
    id: newId(),
    eventTypeId: eventType.id,
    eventTypeTitle: eventType.title,
    durationMinutes: eventType.durationMinutes,
    startsAt,
    endsAt,
    guest,
    createdAt: now,
  };

  saveBooking(booking);

  return booking;
}

/**
 * Контракт не описывает ошибку для этой операции, поэтому неразбираемая граница
 * считается непереданной, а не поводом для 422.
 */
export function listBookingsInRange(
  query: URLSearchParams,
  now: Date,
): Booking[] {
  const from = parseUtcDateTime(query.get("from")) ?? now;
  const to = parseUtcDateTime(query.get("to"));

  return listBookings()
    .filter(
      (booking) =>
        booking.startsAt.getTime() >= from.getTime() &&
        (to === null || booking.startsAt.getTime() < to.getTime()),
    )
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}
