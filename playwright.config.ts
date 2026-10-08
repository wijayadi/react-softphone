import { defineConfig } from '@playwright/test';

// e2e tests for react-softphone.
//
// A tiny Vite dev server (e2e/vite.config.mjs) serves e2e/harness, which mounts
// the component from src/ directly. A fake SIP-over-WebSocket (e2e/fake-sip.js)
// is injected into the page so no real SIP server is required.
//
// Uses the locally installed Google Chrome (channel: 'chrome') so no Playwright
// browser download is needed.
// Uses the locally installed Google Chrome by default (no Playwright browser
// download). In CI set PLAYWRIGHT_CHANNEL=chromium after `playwright install`.
const channel = process.env.PLAYWRIGHT_CHANNEL ?? 'chrome';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5199',
    channel,
    permissions: ['microphone'],
    launchOptions: {
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
      ],
    },
  },
  webServer: {
    command: 'vite --config e2e/vite.config.mjs',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
