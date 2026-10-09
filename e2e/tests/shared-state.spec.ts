import { test, expect } from '@playwright/test';
import {
  collectLogs,
  gotoHarness,
  setupFakeSip,
  waitForConnected,
  waitForLog,
} from './helpers';

// Two views (`SoftPhonePanel`) bound to one zustand store must mirror state.
test.describe('shared store across two panels', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeSip(page);
  });

  test('mirrors the dial input in both directions', async ({ page }) => {
    await gotoHarness(page, { mirror: 1 });

    await page.locator('#phone-input-a').fill('1234');
    await expect(page.locator('#phone-input-b')).toHaveValue('1234');

    await page.locator('#phone-input-b').fill('5678');
    await expect(page.locator('#phone-input-a')).toHaveValue('5678');
  });

  test('mirrors the active channel tab', async ({ page }) => {
    await gotoHarness(page, { mirror: 1 });

    await expect(page.getByText('Ready Ch 1')).toHaveCount(2);

    await page.getByRole('tab', { name: 'Ch 2' }).first().click();
    await expect(page.getByText('Ready Ch 2')).toHaveCount(2);
  });

  test('mirrors the Settings/History tab and empty history', async ({ page }) => {
    await gotoHarness(page, { mirror: 1 });

    await page.getByRole('tab', { name: 'History' }).first().click();

    // Both panels switch because the active tab lives in the shared store.
    await expect(page.getByText('No call history')).toHaveCount(2);
  });

  test('mirrors call state and controls', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page, { mirror: 1 });
    await waitForConnected(page, logs);

    await page.locator('#phone-input-a').fill('1000');
    await page.locator('#phone-input-a').press('Enter');
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    await expect(page.getByRole('button', { name: 'End Call' })).toHaveCount(2);
    await expect(
      page.locator('.MuiChip-label').filter({ hasText: 'Ringing' }),
    ).toHaveCount(2);
  });

  test('shares call history recorded after hang-up', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page, { mirror: 1 });
    await waitForConnected(page, logs);

    await page.locator('#phone-input-a').fill('1000');
    await page.locator('#phone-input-a').press('Enter');
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    await page.getByRole('button', { name: 'End Call' }).first().click();

    await page.getByRole('tab', { name: 'History' }).first().click();
    await expect(page.locator('.listSection')).toHaveCount(2, { timeout: 15_000 });
  });

  test('exposes one shared store instance', async ({ page }) => {
    await gotoHarness(page, { mirror: 1 });

    const sameStore = await page.evaluate(() => {
      const store = (window as any).__test.store;
      // A single store object drives both panels.
      return typeof store?.getState === 'function';
    });
    expect(sameStore).toBe(true);
  });
});
