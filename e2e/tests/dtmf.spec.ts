import { test, expect } from '@playwright/test';
import {
  callButton,
  collectLogs,
  dialInput,
  gotoHarness,
  setupFakeSip,
  waitForConnected,
  waitForLog,
} from './helpers';

const dtmfGroup = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: 'DTMF keypad' });

test.describe('DTMF dialer keypad', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeSip(page);
  });

  test('is hidden when idle and shown during a call', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await expect(dtmfGroup(page)).toHaveCount(0);

    await dialInput(page).fill('1000');
    await callButton(page).click();
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    await expect(dtmfGroup(page)).toBeVisible();
    // Full 3x4 layout.
    for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']) {
      await expect(page.getByRole('button', { name: key, exact: true })).toBeVisible();
    }
  });

  test('sends the pressed DTMF keys', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await dialInput(page).fill('1000');
    await callButton(page).click();
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    await page.getByRole('button', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: '#', exact: true }).click();
    await page.getByRole('button', { name: '*', exact: true }).click();

    await expect
      .poll(() => page.evaluate(() => (window as any).__test.dtmf))
      .toEqual(['5', '0', '#', '*']);
  });

  test('disappears after the call ends', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await dialInput(page).fill('1000');
    await callButton(page).click();
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');
    await expect(dtmfGroup(page)).toBeVisible();

    await page.getByRole('button', { name: 'End Call' }).click();

    await expect(dtmfGroup(page)).toHaveCount(0);
  });

  test('mirrors DTMF across shared panels', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page, { mirror: 1 });
    await waitForConnected(page, logs);

    await page.locator('#phone-input-a').fill('1000');
    await page.locator('#phone-input-a').press('Enter');
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    await expect(dtmfGroup(page)).toHaveCount(2);
    await page.getByRole('button', { name: '7', exact: true }).first().click();

    await expect
      .poll(() => page.evaluate(() => (window as any).__test.dtmf))
      .toEqual(['7']);
  });
});
