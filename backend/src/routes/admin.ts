import { listBookingsInRange } from "../domain/bookings.ts";
import {
  createEventType,
  deleteEventType,
  requireEventType,
  updateEventType,
} from "../domain/eventTypes.ts";
import {
  listEventTypes,
  toBookingDto,
  toEventTypeDto,
} from "../domain/store.ts";
import { readJsonBody, sendJson, sendNoContent } from "../lib/http.ts";
import { route, type Route } from "../router.ts";

export const adminRoutes: Route[] = [
  route("GET", "/admin/event-types", ({ res }) => {
    sendJson(res, 200, listEventTypes().map(toEventTypeDto));
  }),

  route("POST", "/admin/event-types", async ({ req, res }) => {
    const body = await readJsonBody(req);
    sendJson(res, 201, toEventTypeDto(createEventType(body, new Date())));
  }),

  route("GET", "/admin/event-types/:eventTypeId", ({ res, params }) => {
    sendJson(res, 200, toEventTypeDto(requireEventType(params.eventTypeId)));
  }),

  route(
    "PATCH",
    "/admin/event-types/:eventTypeId",
    async ({ req, res, params }) => {
      const body = await readJsonBody(req);
      const updated = updateEventType(params.eventTypeId, body, new Date());
      sendJson(res, 200, toEventTypeDto(updated));
    },
  ),

  route("DELETE", "/admin/event-types/:eventTypeId", ({ res, params }) => {
    deleteEventType(params.eventTypeId, new Date());
    sendNoContent(res);
  }),

  route("GET", "/admin/bookings", ({ res, query }) => {
    const bookings = listBookingsInRange(query, new Date());
    sendJson(res, 200, bookings.map(toBookingDto));
  }),
];
