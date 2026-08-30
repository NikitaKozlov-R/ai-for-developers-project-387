import { resetStore } from "../domain/store.ts";
import { notFound } from "../lib/errors.ts";
import { sendNoContent } from "../lib/http.ts";
import { route, type Route } from "../router.ts";

// Не часть публичного контракта (нет в specs/openapi): хук для e2e-тестов,
// включается явно через ENABLE_TEST_RESET, иначе неотличим от несуществующего пути.
export const internalRoutes: Route[] = [
  route("POST", "/internal/reset", ({ res }) => {
    if (process.env.ENABLE_TEST_RESET !== "1") {
      throw notFound("Такого эндпоинта нет.");
    }

    resetStore();
    sendNoContent(res);
  }),
];
