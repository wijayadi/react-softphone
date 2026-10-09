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

test.describe('keypad and call controls', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeSip(page);
  });

  test('disables call controls when idle', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.getByRole('button', { name: 'mute' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'hold' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'transfer-call' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'attended-transfer' })).toBeDisabled();
    await expect(callButton(page)).toBeVisible();
  });

  test('clears the dial input', async ({ page }) => {
    await gotoHarness(page);

    const input = dialInput(page);
    await input.fill('12345');
    await expect(input).toHaveValue('12345');

    await page.getByRole('button', { name: 'clear number' }).click();
    await expect(input).toHaveValue('');
  });

  test('places a call with the Enter key', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    const input = dialInput(page);
    await input.fill('1000@10.13.13.77');
    await input.press('Enter');

    await waitForLog(page, logs, 'Placing call to sip:1000@10.13.13.77');
  });

  test('rejects invalid dial input with a snackbar', async ({ page }) => {
    await gotoHarness(page);

    await dialInput(page).fill('bad user');
    await callButton(page).click();

    await expect(page.getByText('Invalid number: invalid-user')).toBeVisible();
  });

  test('rejects an empty dial input', async ({ page }) => {
    await gotoHarness(page);

    await callButton(page).click();

    await expect(page.getByText('Invalid number: empty')).toBeVisible();
  });

  test('rejects an invalid domain', async ({ page }) => {
    await gotoHarness(page);

    await dialInput(page).fill('1000@bad domain');
    await callButton(page).click();

    await expect(page.getByText('Invalid number: invalid-domain')).toBeVisible();
  });

  test('shows a message when placing a second concurrent call', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await dialInput(page).fill('1000');
    await callButton(page).click();
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    // The Make Call button becomes End Call while in a call, but the dial input
    // is still active and Enter routes through the same call handler.
    await dialInput(page).fill('2000');
    await dialInput(page).press('Enter');

    await expect(page.getByText('Active call already exists')).toBeVisible();
  });

  test('enables mute during an outgoing call', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await dialInput(page).fill('1000');
    await callButton(page).click();
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');

    await expect(page.getByRole('button', { name: 'mute' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'hold' })).toBeDisabled();

    await page.getByRole('button', { name: 'mute' }).click();
    await expect(page.getByRole('button', { name: 'unmute' })).toBeVisible();
  });

  test('records a call in history after hanging up', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await dialInput(page).fill('1000@10.13.13.77');
    await callButton(page).click();
    await waitForLog(page, logs, 'Placing call to sip:1000@10.13.13.77');

    await page.getByRole('button', { name: 'End Call' }).click();

    await page.getByRole('tab', { name: 'History' }).click();
    await expect(page.locator('.listSection')).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator('.listSection')).toContainText('1000');
  });

  test('prompts to connect when the phone is offline', async ({ page }) => {
    await gotoHarness(page, { connectOnStart: 0 });

    await dialInput(page).fill('1000');
    await callButton(page).click();

    await expect(page.getByText('Please connect to VoIP server first')).toBeVisible();
  });

  test('shows the softphone as online once connected', async ({ page }) => {
    const logs = collectLogs(page);
    await gotoHarness(page);
    await waitForConnected(page, logs);

    await expect(page.getByText('Online').first()).toBeVisible();
  });

  test('shows the softphone as offline when not connected', async ({ page }) => {
    await gotoHarness(page, { connectOnStart: 0 });

    await expect(page.getByText('Offline')).toBeVisible();
  });
});
