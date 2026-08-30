import { randomUUID } from "node:crypto";

import { toUtcDateTime } from "../lib/time.ts";

export interface Owner {
  id: string;
  name: string;
  bio?: string;
}

export interface EventType {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guest {
  name: string;
  email: string;
}

/**
 * Тип события внутри брони — снимок на момент создания: сам тип могут переименовать
 * или удалить, а уже созданная встреча обязана оставаться читаемой.
 */
export interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  durationMinutes: number;
  startsAt: Date;
  endsAt: Date;
  guest: Guest;
  createdAt: Date;
}

const owner: Owner = {
  id: "1f0a6b4e-6f4a-4d2b-9c1e-3a5d7b8e0c21",
  name: "Никита Морозов",
  bio: "Помогаю командам довести продукт до релиза. Пишите — подберём формат встречи.",
};

const eventTypes = new Map<string, EventType>();
const bookings = new Map<string, Booking>();

seed();

export function getOwner(): Owner {
  return owner;
}

export function listEventTypes(): EventType[] {
  return [...eventTypes.values()].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
}

export function findEventType(id: string): EventType | undefined {
  return eventTypes.get(id);
}

export function saveEventType(eventType: EventType): void {
  eventTypes.set(eventType.id, eventType);
}

export function removeEventType(id: string): void {
  eventTypes.delete(id);
}

export function listBookings(): Booking[] {
  return [...bookings.values()];
}

export function saveBooking(booking: Booking): void {
  bookings.set(booking.id, booking);
}

export function toEventTypeDto(eventType: EventType) {
  return {
    id: eventType.id,
    title: eventType.title,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    createdAt: toUtcDateTime(eventType.createdAt),
    updatedAt: toUtcDateTime(eventType.updatedAt),
  };
}

export function toBookingDto(booking: Booking) {
  const current = eventTypes.get(booking.eventTypeId);

  return {
    id: booking.id,
    eventType: {
      id: booking.eventTypeId,
      title: current?.title ?? booking.eventTypeTitle,
      durationMinutes: booking.durationMinutes,
    },
    startsAt: toUtcDateTime(booking.startsAt),
    endsAt: toUtcDateTime(booking.endsAt),
    guest: { name: booking.guest.name, email: booking.guest.email },
    createdAt: toUtcDateTime(booking.createdAt),
  };
}

export function newId(): string {
  return randomUUID();
}

/** Только для e2e: возвращает стор к стартовым данным без рестарта процесса. */
export function resetStore(): void {
  eventTypes.clear();
  bookings.clear();
  seed();
}

// Хранилище живёт только в памяти процесса: рестарт возвращает эти данные.
function seed(): void {
  const now = new Date();

  const presets: ReadonlyArray<Omit<EventType, "createdAt" | "updatedAt">> = [
    {
      id: "a3d1c5b7-2e94-4f60-8b31-6c0a9d2e4f18",
      title: "Знакомство",
      description:
        "Короткий созвон: обсуждаем задачу и решаем, чем я могу быть полезен.",
      durationMinutes: 30,
    },
    {
      id: "b7e2f409-8c15-4a73-9d26-1e5b3c8a7d40",
      title: "Консультация",
      description:
        "Разбираем вопрос предметно: код, архитектура, процессы в команде.",
      durationMinutes: 60,
    },
    {
      id: "c9f38a21-4b6d-4e58-a0c7-2d81f6e3b950",
      title: "Ревью проекта",
      description:
        "Смотрим репозиторий вместе и составляем список улучшений с приоритетами.",
      durationMinutes: 90,
    },
  ];

  for (const preset of presets) {
    eventTypes.set(preset.id, { ...preset, createdAt: now, updatedAt: now });
  }
}
