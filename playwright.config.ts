import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const shouldStartWebServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] }
    }
  ],
  webServer: shouldStartWebServer
    ? {
        command: "npm run start",
        env: {
          ...process.env,
          NEXT_PUBLIC_SITE_URL: baseURL
        },
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000
      }
    : undefined
});
