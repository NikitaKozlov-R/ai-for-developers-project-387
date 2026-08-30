import { defineConfig, devices } from "@playwright/test";

const CI = Boolean(process.env.CI);

// webServer сам поднимает backend и frontend — отдельно их запускать не нужно.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      url: "http://localhost:3000/api/owner",
      reuseExistingServer: !CI,
      timeout: 30_000,
      // Только для процесса, который поднимает сам Playwright — открывает POST /internal/reset.
      env: { ENABLE_TEST_RESET: "1" },
    },
    {
      command: "npm run dev",
      cwd: "../frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !CI,
      timeout: 30_000,
    },
  ],
});
