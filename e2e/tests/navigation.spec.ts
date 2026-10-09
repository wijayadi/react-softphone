import { test, expect } from '@playwright/test';
import { gotoHarness, setupFakeSip } from './helpers';

test.describe('softphone navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeSip(page);
  });

  test('closes the drawer via the header button', async ({ page }) => {
    await gotoHarness(page);
    await expect(page.getByText('Softphone', { exact: true })).toBeVisible();

    await page.getByTestId('hide-soft-phone-button').click();

    await expect
      .poll(() => page.evaluate(() => (window as any).__test.softPhoneOpen))
      .toBe(false);
    await expect(page.getByText('Softphone', { exact: true })).toBeHidden();
  });

  test('opens via the built-in launcher and closes via the header', async ({ page }) => {
    await gotoHarness(page, { softPhoneOpen: 0, builtInLauncher: 1 });

    const launcher = page.getByRole('button', { name: 'Toggle Softphone' });
    await expect(launcher).toBeVisible();
    await expect(page.getByText('Softphone', { exact: true })).toBeHidden();

    await launcher.click();
    await expect
      .poll(() => page.evaluate(() => (window as any).__test.softPhoneOpen))
      .toBe(true);
    await expect(page.getByText('Softphone', { exact: true })).toBeVisible();

    // Once open, the drawer covers the launcher, so it is closed from the header.
    await page.getByTestId('hide-soft-phone-button').click();
    await expect(page.getByText('Softphone', { exact: true })).toBeHidden();
  });

  test('does not render the built-in launcher by default', async ({ page }) => {
    await gotoHarness(page);
    await expect(page.getByRole('button', { name: 'Toggle Softphone' })).toHaveCount(0);
  });

  test('switches channel tabs', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.getByText('Ready Ch 1')).toBeVisible();

    await page.getByRole('tab', { name: 'Ch 2' }).click();
    await expect(page.getByRole('tab', { name: 'Ch 2' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Ready Ch 2')).toBeVisible();

    await page.getByRole('tab', { name: 'Ch 3' }).click();
    await expect(page.getByText('Ready Ch 3')).toBeVisible();
  });

  test('switches between Settings and History tabs', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.getByText('SIP Account')).toBeVisible();

    await page.getByRole('tab', { name: 'History' }).click();
    await expect(page.getByText('No call history')).toBeVisible();

    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByText('SIP Account')).toBeVisible();
  });
});
