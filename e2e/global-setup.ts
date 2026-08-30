/** Сбрасывает in-memory store backend перед прогоном — иначе фиксированные dayIndex/slotIndex
 * в тестах накапливают брони между повторными локальными запусками `npm test`. */
export default async function globalSetup(): Promise<void> {
  const response = await fetch("http://localhost:3000/api/internal/reset", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      "Не удалось сбросить backend перед e2e-прогоном (POST /api/internal/reset " +
        `вернул ${response.status}). Возможно, на :3000 уже работает backend, ` +
        "запущенный не через playwright.config.ts (без ENABLE_TEST_RESET) — " +
        "остановите его и запустите тесты заново.",
    );
  }
}
