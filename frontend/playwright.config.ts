import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const browser = process.env.PLAYWRIGHT_CHANNEL
  ? { channel: process.env.PLAYWRIGHT_CHANNEL }
  : process.platform === 'win32'
    ? { channel: 'msedge' }
    : devices['Desktop Chrome']

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: browser }],
  webServer: [
    {
      command: 'npm run start',
      cwd: fileURLToPath(new URL('../backend', import.meta.url)),
      url: 'http://127.0.0.1:5000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --strictPort',
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
