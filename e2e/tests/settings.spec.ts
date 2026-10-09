import { test, expect } from '@playwright/test';
import {
  collectLogs,
  dialInput,
  gotoHarness,
  setupFakeSip,
  waitForConnected,
  waitForLog,
  waitForLogTimes,
} from './helpers';

test.describe('settings & SIP account editor', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeSip(page);
  });

  test('shows the SIP account editor with the current config', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.getByText('SIP Account')).toBeVisible();
    await expect(page.getByLabel('Domain')).toHaveValue('127.0.0.1');
    await expect(page.getByLabel('SIP URI')).toHaveValue('sip:1000@127.0.0.1');
    await expect(page.getByLabel('WebSocket Server')).toHaveValue('wss://127.0.0.1:8089/ws');
    await expect(page.getByLabel('Display Name')).toHaveValue('1000');
    await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible();
  });

  test('hides the SIP account editor when showConfigEditor is false', async ({ page }) => {
    await gotoHarness(page, { showConfigEditor: 0 });

    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByText('SIP Account')).toHaveCount(0);
    // Other settings remain available.
    await expect(page.getByText('Auto-Connect')).toBeVisible();
  });

  test('applies edited config on reconnect and calls onConfigChange', async ({ page }) => {
    await gotoHarness(page);

    await page.getByLabel('Domain').fill('10.0.0.9');
    await page.getByRole('button', { name: 'Reconnect' }).click();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const changes = (window as any).__test.configChanges as Array<{ domain: string }>;
          return changes.length ? changes[changes.length - 1].domain : null;
        }),
      )
      .toBe('10.0.0.9');
  });

  test('reports missing required fields on reconnect', async ({ page }) => {
    await gotoHarness(page);

    await page.getByLabel('Domain').fill('');
    await page.getByRole('button', { name: 'Reconnect' }).click();

    await expect(page.getByText('Missing config: domain')).toBeVisible();
    expect(
      await page.evaluate(() => (window as any).__test.configChanges.length),
    ).toBe(0);
  });

  test('reports a missing WebSocket server on reconnect', async ({ page }) => {
    await gotoHarness(page);

    await page.getByLabel('WebSocket Server').fill('');
    await page.getByRole('button', { name: 'Reconnect' }).click();

    await expect(page.getByText('Missing config: WebSocket server')).toBeVisible();
  });

  test('uses the reconnected domain for dialing', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await page.getByLabel('Domain').fill('10.0.0.9');
    await page.getByRole('button', { name: 'Reconnect' }).click();
    await waitForLogTimes(page, logs, 'SIP transport connected', 2);

    await dialInput(page).fill('3000');
    await dialInput(page).press('Enter');

    await waitForLog(page, logs, 'Placing call to sip:3000@10.0.0.9');
  });

  test('toggles auto-connect and persists it', async ({ page }) => {
    await gotoHarness(page);

    const autoConnect = page.getByRole('checkbox', { name: 'Auto-Connect' });
    await expect(autoConnect).toBeChecked();

    await autoConnect.click();

    await expect(autoConnect).not.toBeChecked();
    await expect
      .poll(() => page.evaluate(() => (window as any).__test.connectOnStart))
      .toBe(false);
  });

  test('toggles notifications', async ({ page }) => {
    await gotoHarness(page);

    const notifications = page.getByRole('checkbox', { name: 'Notifications' });
    await expect(notifications).not.toBeChecked();

    await notifications.click();

    await expect(notifications).toBeChecked();
    await expect
      .poll(() => page.evaluate(() => (window as any).__test.notifications))
      .toBe(true);
  });

  test('disconnects via the connection switch', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await expect(page.getByRole('checkbox', { name: 'Connected' })).toBeChecked();

    await page.getByRole('checkbox', { name: 'Connected' }).click();

    await expect(page.getByRole('checkbox', { name: 'Disconnected' })).not.toBeChecked();
  });

  test('adjusts the call volume slider', async ({ page }) => {
    await gotoHarness(page);

    const callSlider = page.getByRole('slider').nth(0);
    await callSlider.focus();
    await callSlider.press('ArrowRight');

    await expect
      .poll(() => page.evaluate(() => (window as any).__test.callVolume))
      .toBeGreaterThan(0.5);
  });

  test('adjusts the ringtone volume slider', async ({ page }) => {
    await gotoHarness(page);

    const ringSlider = page.getByRole('slider').nth(1);
    await ringSlider.focus();
    await ringSlider.press('ArrowLeft');

    await expect
      .poll(() => page.evaluate(() => (window as any).__test.ringVolume))
      .toBeLessThan(0.5);
  });
});
