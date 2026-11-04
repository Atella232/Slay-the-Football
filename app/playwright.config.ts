import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 720 } }, testIgnore: /mobile|portrait/ },
    { name: 'wide', use: { viewport: { width: 1600, height: 720 } }, testMatch: /smoke/ },
    { name: 'portrait', use: { ...devices['Pixel 7'] }, testMatch: /portrait/ },
    { name: 'mobile', use: { ...devices['Pixel 7 landscape'] }, testMatch: /mobile|smoke/ },
  ],
})
