import { defineConfig, devices } from '@playwright/test'

// ทดสอบบน build จริง (vite preview) ขนาดจอ iPhone 12–15 (390×844)
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['iPhone 13'],
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
