import { createBooking } from "../domain/bookings.ts";
import { requireEventType } from "../domain/eventTypes.ts";
import { buildDays, resolveRange } from "../domain/slots.ts";
import {
  getOwner,
  listBookings,
  listEventTypes,
  toBookingDto,
  toEventTypeDto,
} from "../domain/store.ts";
import { readJsonBody, sendJson } from "../lib/http.ts";
import { route, type Route } from "../router.ts";

export const publicRoutes: Route[] = [
  route("GET", "/owner", ({ res }) => {
    sendJson(res, 200, getOwner());
  }),

  route("GET", "/event-types", ({ res }) => {
    sendJson(res, 200, listEventTypes().map(toEventTypeDto));
  }),

  route("GET", "/event-types/:eventTypeId", ({ res, params }) => {
    sendJson(res, 200, toEventTypeDto(requireEventType(params.eventTypeId)));
  }),

  route("GET", "/event-types/:eventTypeId/slots", ({ res, params, query }) => {
    const now = new Date();
    const eventType = requireEventType(params.eventTypeId);
    const { from, to } = resolveRange(query, now);

    sendJson(res, 200, {
      eventTypeId: eventType.id,
      durationMinutes: eventType.durationMinutes,
      rangeStart: from,
      rangeEnd: to,
      days: buildDays(eventType.durationMinutes, from, to, now, listBookings()),
    });
  }),

  route("POST", "/bookings", async ({ req, res }) => {
    const body = await readJsonBody(req);
    sendJson(res, 201, toBookingDto(createBooking(body, new Date())));
  }),
];
