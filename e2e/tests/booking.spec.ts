import { expect, test } from "@playwright/test";
import {
  openEventType,
  selectAvailableDay,
  selectSlot,
  slotButtons,
} from "./helpers/slots";

// n-й доступный день не пересекается с admin-bookings.spec.ts (n=3–8) и admin-event-types.spec.ts
// (дни не использует) — см. "Конвенция изоляции данных" в /memories/session/plan.md.

test.describe("Запись", () => {
  test("TC-B1: успешное бронирование слота", async ({ page }) => {
    await openEventType(page, "Знакомство");
    await selectAvailableDay(page, 0);
    await selectSlot(page, 0);

    await page.getByLabel("Ваше имя").fill("Иван Тестов");
    await page.getByLabel("Email").fill("ivan.test@example.com");
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.getByText("Встреча забронирована")).toBeVisible();
    const details = page.locator("dl");
    await expect(details).toContainText("Знакомство");
    await expect(details).toContainText("30 мин");
    await expect(details).toContainText("Иван Тестов, ivan.test@example.com");
    await expect(page.getByText(/Номер брони: \S+/)).toBeVisible();
  });

  test("TC-B2: валидация формы бронирования", async ({ page }) => {
    await openEventType(page, "Знакомство");
    await selectAvailableDay(page, 0);
    await selectSlot(page, 1);

    await page.getByLabel("Email").fill("not-an-email");
    // Клик по кнопке без предварительного blur сдвигает разметку (появляется ошибка email
    // между mousedown и mouseup) и промахивается мимо кнопки — блюрим явно через Tab.
    await page.getByLabel("Email").press("Tab");
    await page.getByRole("button", { name: "Записаться" }).click();

    await expect(page.locator("#guest-name-error")).toHaveText("Укажите имя");
    await expect(page.locator("#guest-email-error")).toHaveText(
      "Проверьте формат адреса",
    );
    await expect(page.getByLabel("Ваше имя")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText("Встреча забронирована")).toHaveCount(0);
  });

  test("TC-B3: слот недоступен под другим типом события после бронирования", async ({
    page,
  }) => {
    await openEventType(page, "Знакомство");
    await selectAvailableDay(page, 1);

    const slot = slotButtons(page).nth(0);
    const bookedTime = (await slot.textContent())?.trim();
    await slot.click();

    await page.getByLabel("Ваше имя").fill("Пётр Коллизия");
    await page.getByLabel("Email").fill("petr.collision@example.com");
    await page.getByRole("button", { name: "Записаться" }).click();
    await expect(page.getByText("Встреча забронирована")).toBeVisible();

    await openEventType(page, "Консультация");
    await selectAvailableDay(page, 1);

    // Инвариант домена: брони не пересекаются по времени, даже если тип события другой.
    await expect(
      page.getByRole("button", { name: bookedTime, exact: true }),
    ).toHaveCount(0);
  });

  test("TC-B4: 'Выбрать другое время' сбрасывает выбор", async ({ page }) => {
    await openEventType(page, "Знакомство");
    await selectAvailableDay(page, 0);

    const slot = slotButtons(page).nth(2);
    await slot.click();
    // Выбор слота подменяет грид формой (SlotPicker размонтирован) — кнопки с
    // aria-pressed в DOM больше нет, поэтому проверяем сам факт перехода к форме.
    await expect(page.getByText("Выберите время")).toHaveCount(0);
    await expect(page.getByLabel("Ваше имя")).toBeVisible();

    await page.getByRole("button", { name: "Выбрать другое время" }).click();

    await expect(page.getByLabel("Ваше имя")).toHaveCount(0);
    await expect(slot).toHaveAttribute("aria-pressed", "false");
    expect(page.url()).not.toContain("startsAt");
  });
});
