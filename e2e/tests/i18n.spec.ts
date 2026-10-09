import { test, expect } from '@playwright/test';
import { gotoHarness, setupFakeSip } from './helpers';

test.describe('localization', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeSip(page);
  });

  test('renders English by default', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.getByText('SIP Account')).toBeVisible();
    await expect(page.getByText('Auto-Connect')).toBeVisible();
  });

  test('renders Indonesian when lang=id', async ({ page }) => {
    await gotoHarness(page, { lang: 'id' });

    await expect(page.getByText('Akun SIP')).toBeVisible();
    await expect(page.getByText('Sambung Otomatis')).toBeVisible();
    await expect(page.getByText('Pengaturan').first()).toBeVisible();
  });

  test('renders Japanese when lang=jp', async ({ page }) => {
    await gotoHarness(page, { lang: 'jp' });

    await expect(page.getByText('SIPアカウント')).toBeVisible();
    await expect(page.getByText('自動接続')).toBeVisible();
    await expect(page.getByText('設定').first()).toBeVisible();
  });

  test('falls back to English for an unknown language', async ({ page }) => {
    await gotoHarness(page, { lang: 'fr' });

    await expect(page.getByText('SIP Account')).toBeVisible();
  });
});
