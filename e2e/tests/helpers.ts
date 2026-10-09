import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const fakeSipPath = path.join(here, '..', 'fake-sip.js');

export function collectLogs(page: Page): string[] {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  return logs;
}

export interface FakeSipOptions {
  failMedia?: boolean;
  inviteStatus?: string;
}

export async function setupFakeSip(page: Page, opts: FakeSipOptions = {}) {
  await page.addInitScript((flags: { failMedia?: boolean; inviteStatus?: string }) => {
    (window as unknown as { __SOFTPHONE_TEST_FAIL_MEDIA__: boolean }).__SOFTPHONE_TEST_FAIL_MEDIA__ =
      !!flags.failMedia;
    if (flags.inviteStatus) {
      (window as unknown as { __SOFTPHONE_TEST_INVITE_STATUS__: string }).__SOFTPHONE_TEST_INVITE_STATUS__ =
        flags.inviteStatus;
    }
  }, opts);
  await page.addInitScript({ path: fakeSipPath });
}

/**
 * Navigate to the harness with optional query-string switches, e.g.
 * `gotoHarness(page, { connectOnStart: 0, builtInLauncher: 1 })`.
 */
export async function gotoHarness(
  page: Page,
  params: Record<string, string | number | boolean> = {},
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value));
  }
  const suffix = query.toString() ? `/?${query.toString()}` : '/';
  await page.goto(suffix);
}

export async function waitForLog(page: Page, logs: string[], needle: string) {
  await expect
    .poll(() => logs.join('\n'), { timeout: 20_000, message: `waiting for log: ${needle}` })
    .toContain(needle);
}

export async function waitForConnected(page: Page, logs: string[]) {
  await waitForLog(page, logs, 'SIP transport connected');
}

export async function waitForLogTimes(
  page: Page,
  logs: string[],
  needle: string,
  times: number,
) {
  await expect
    .poll(() => logs.filter((line) => line.includes(needle)).length, {
      timeout: 20_000,
      message: `waiting for log "${needle}" x${times}`,
    })
    .toBeGreaterThanOrEqual(times);
}

export const callButton = (page: Page) =>
  page.getByRole('button', { name: 'Make Call' }).first();

export const dialInput = (page: Page) => page.locator('#phone-input');
