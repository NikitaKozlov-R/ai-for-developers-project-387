import { expect, test } from "@playwright/test";
import { createBookingViaUi } from "./helpers/slots";

// n-й доступный день не пересекается с booking.spec.ts (n=0–1) — см. "Конвенция изоляции
// данных" в /memories/session/plan.md. Пустое состояние и сброс фильтра нарочно проверяются
// на дате в прошлом, а не на "свободном" n, чтобы не зависеть от порядка запуска файлов.
const PAST_DATE = "2020-01-01";

test.describe("Встречи", () => {
  test("TC-M1: новая бронь видна в списке с корректными данными", async ({
    page,
  }) => {
    const booking = await createBookingViaUi(page, {
      eventTypeName: "Ревью проекта",
      dayIndex: 3,
      slotIndex: 0,
      guest: { name: "Мария Гостева", email: "maria@example.com" },
    });
    const date = booking.startsAt.slice(0, 10);

    await page.goto("/admin/bookings");
    await page.getByLabel("С даты").fill(date);
    await page.getByLabel("По дату включительно").fill(date);
    await page.getByRole("button", { name: "Применить" }).click();

    const item = page.locator("li", { hasText: "Ревью проекта" });
    await expect(item).toBeVisible();
    await expect(item).toContainText("1 ч 30 мин");
    await expect(item).toContainText("Мария Гостева · maria@example.com");
  });

  test("TC-M2: фильтр по диапазону дат сужает список", async ({ page }) => {
    const bookingA = await createBookingViaUi(page, {
      eventTypeName: "Знакомство",
      dayIndex: 4,
      slotIndex: 0,
      guest: { name: "Алексей Ранний", email: "alexey@example.com" },
    });
    const bookingB = await createBookingViaUi(page, {
      eventTypeName: "Консультация",
      dayIndex: 5,
      slotIndex: 0,
      guest: { name: "Ольга Поздняя", email: "olga@example.com" },
    });
    const dateA = bookingA.startsAt.slice(0, 10);

    await page.goto("/admin/bookings");
    await page.getByLabel("С даты").fill(dateA);
    await page.getByLabel("По дату включительно").fill(dateA);
    await page.getByRole("button", { name: "Применить" }).click();

    await expect(
      page.locator("li", { hasText: "Алексей Ранний" }),
    ).toBeVisible();
    await expect(page.locator("li", { hasText: "Ольга Поздняя" })).toHaveCount(
      0,
    );
    void bookingB;
  });

  test("TC-M3: пустое состояние при отсутствии броней в диапазоне", async ({
    page,
  }) => {
    await page.goto("/admin/bookings");
    await page.getByLabel("С даты").fill(PAST_DATE);
    await page.getByLabel("По дату включительно").fill(PAST_DATE);
    await page.getByRole("button", { name: "Применить" }).click();

    await expect(page.getByText("Предстоящих встреч нет")).toBeVisible();
    await expect(page.locator("ul li")).toHaveCount(0);
  });

  test("TC-M4: кнопка 'Сбросить' возвращает к дефолтному списку", async ({
    page,
  }) => {
    const booking = await createBookingViaUi(page, {
      eventTypeName: "Знакомство",
      dayIndex: 7,
      slotIndex: 0,
      guest: { name: "Сергей Сбросов", email: "sergey@example.com" },
    });
    void booking;

    await page.goto("/admin/bookings");
    await page.getByLabel("С даты").fill(PAST_DATE);
    await page.getByLabel("По дату включительно").fill(PAST_DATE);
    await page.getByRole("button", { name: "Применить" }).click();
    await expect(page.locator("li", { hasText: "Сергей Сбросов" })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Сбросить" }).click();

    await expect(page.getByLabel("С даты")).toHaveValue("");
    await expect(page.getByLabel("По дату включительно")).toHaveValue("");
    await expect(
      page.locator("li", { hasText: "Сергей Сбросов" }),
    ).toBeVisible();
  });
});
