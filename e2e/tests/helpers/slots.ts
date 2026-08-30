import type { Locator, Page } from "@playwright/test";

/** Данные брони, которые возвращает POST /api/bookings — минимум, нужный тестам. */
export interface Booking {
  id: string;
  startsAt: string;
  endsAt: string;
  eventType: { id: string; title: string; durationMinutes: number };
  guest: { name: string; email: string };
}

export interface Guest {
  name: string;
  email: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function uniqueTitle(prefix: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix} ${suffix}`;
}

/**
 * Кнопки дней, у которых есть свободные слоты (без класса opacity-60 — см. SlotPicker.tsx).
 * Выходные и уже полностью занятые дни не участвуют в нумерации, поэтому тесты не зависят
 * от текущей даты запуска.
 */
export function availableDayButtons(page: Page): Locator {
  return page.locator('[aria-label="Выбор дня"] button:not(.opacity-60)');
}

export function slotButtons(page: Page): Locator {
  return page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
}

/** n — 0-based индекс среди доступных дней, см. availableDayButtons. */
export async function selectAvailableDay(page: Page, n: number): Promise<void> {
  await availableDayButtons(page).nth(n).click();
}

export async function selectSlot(page: Page, slotIndex: number): Promise<void> {
  await slotButtons(page).nth(slotIndex).click();
}

export async function openEventType(page: Page, title: string): Promise<void> {
  await page.goto("/");
  await page
    .getByRole("link", { name: new RegExp(escapeRegExp(title)) })
    .click();
}

/** Доводит гостевой флоу бронирования до конца и возвращает бронь из ответа API. */
export async function createBookingViaUi(
  page: Page,
  options: {
    eventTypeName: string;
    dayIndex: number;
    slotIndex: number;
    guest: Guest;
  },
): Promise<Booking> {
  await openEventType(page, options.eventTypeName);
  await selectAvailableDay(page, options.dayIndex);
  await selectSlot(page, options.slotIndex);

  await page.getByLabel("Ваше имя").fill(options.guest.name);
  await page.getByLabel("Email").fill(options.guest.email);

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().includes("/api/bookings"),
    ),
    page.getByRole("button", { name: "Записаться" }).click(),
  ]);
  await page.getByText("Встреча забронирована").waitFor();

  return (await response.json()) as Booking;
}
