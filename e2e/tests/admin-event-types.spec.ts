import { expect, test, type Page } from "@playwright/test";
import { uniqueTitle } from "./helpers/slots";

// Названия типов уникальны (uniqueTitle) — seed-типы "Знакомство"/"Консультация"/
// "Ревью проекта" не редактируются и не удаляются.

async function createEventType(
  page: Page,
  title: string,
  durationLabel?: string,
): Promise<void> {
  await page.goto("/admin/event-types/new");
  await page.locator("#event-title").fill(title);
  await page.locator("#event-description").fill("Тестовое описание");

  if (durationLabel) {
    await page.locator("#event-duration").click();
    await page
      .getByRole("option", { name: durationLabel, exact: true })
      .click();
  }

  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page).toHaveURL(/\/admin\/event-types$/);
}

test.describe("Типы событий", () => {
  test("TC-T1: создание типа события", async ({ page }) => {
    const title = uniqueTitle("E2E Тип Создание");
    await createEventType(page, title, "1 ч");

    const row = page.locator("tr", { hasText: title });
    await expect(row).toBeVisible();
    await expect(row).toContainText("1 ч");

    await page.goto("/");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("TC-T2: редактирование типа события", async ({ page }) => {
    const title = uniqueTitle("E2E Тип Правка");
    await createEventType(page, title);

    await page.getByRole("link", { name: `Изменить ${title}` }).click();

    const newTitle = uniqueTitle("E2E Тип Изменённый");
    await page.locator("#event-title").fill(newTitle);
    await page.locator("#event-duration").click();
    await page.getByRole("option", { name: "1 ч 30 мин", exact: true }).click();
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/admin\/event-types$/);

    const row = page.locator("tr", { hasText: newTitle });
    await expect(row).toContainText("1 ч 30 мин");
    await expect(page.locator("tr", { hasText: title })).toHaveCount(0);

    await page.goto("/");
    await expect(page.getByRole("link", { name: newTitle })).toBeVisible();
  });

  test("TC-T3: удаление типа события без броней", async ({ page }) => {
    const title = uniqueTitle("E2E Тип Удаление");
    await createEventType(page, title);

    await page.getByRole("button", { name: `Удалить ${title}` }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Удалить" })
      .click();

    await expect(page.locator("tr", { hasText: title })).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  });

  test("TC-T4: валидация формы создания", async ({ page }) => {
    const description = uniqueTitle("Только описание без названия");
    await page.goto("/admin/event-types/new");
    await page.locator("#event-description").fill(description);
    await page.getByRole("button", { name: "Создать" }).click();

    await expect(page.locator("#event-title-error")).toHaveText(
      "Укажите название",
    );
    await expect(page).toHaveURL(/\/admin\/event-types\/new$/);

    await page.goto("/admin/event-types");
    await expect(page.locator("tr", { hasText: description })).toHaveCount(0);
  });
});
