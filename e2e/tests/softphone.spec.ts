import { test, expect } from '@playwright/test';
import { parseDialTarget } from '../../src/utils/dial';
import {
  callButton,
  collectLogs,
  setupFakeSip,
  waitForLog,
} from './helpers';

// ---------------------------------------------------------------------------
// Pure parsing unit tests (also used by the component at runtime)
// ---------------------------------------------------------------------------
test.describe('parseDialTarget', () => {
  test('plain extension uses the default domain', () => {
    expect(parseDialTarget('1000', '10.13.13.77')).toMatchObject({
      valid: true,
      uri: 'sip:1000@10.13.13.77',
      domain: '10.13.13.77',
    });
  });

  test('extension with an explicit domain is not double-suffixed', () => {
    expect(parseDialTarget('1000@10.13.13.77', '10.13.13.77')).toMatchObject({
      valid: true,
      uri: 'sip:1000@10.13.13.77',
      number: '1000',
      domain: '10.13.13.77',
    });
  });

  test('a full sip: URI passes through unchanged', () => {
    expect(parseDialTarget('sip:1000@10.13.13.77', 'other.example')).toMatchObject({
      valid: true,
      uri: 'sip:1000@10.13.13.77',
    });
  });

  test('rejects invalid input', () => {
    expect(parseDialTarget('', '10.13.13.77').valid).toBe(false);
    expect(parseDialTarget('1000@10.13.13.77/x', '10.13.13.77').valid).toBe(false);
    expect(parseDialTarget('bad user', '10.13.13.77').valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// End-to-end tests against the real component (fake SIP WebSocket)
// ---------------------------------------------------------------------------
test.describe('softphone dialing', () => {
  test('dials "1000@10.13.13.77" and sends an INVITE to the correct URI', async ({ page }) => {
    const logs = collectLogs(page);
    await setupFakeSip(page);
    await page.goto('/');

    await expect(page.locator('#phone-input')).toBeVisible();
    await waitForLog(page, logs, 'SIP transport connected');

    await page.fill('#phone-input', '1000@10.13.13.77');
    await callButton(page).click();

    // The fix: the explicit domain is accepted and NOT double-suffixed.
    await waitForLog(page, logs, 'Placing call to sip:1000@10.13.13.77');
    expect(logs.join('\n')).not.toContain('10.13.13.77@');

    // And the outgoing INVITE really targets the parsed URI.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const sent = (window as unknown as { __sipSent?: string[] }).__sipSent || [];
            return sent
              .filter((m) => m.startsWith('INVITE '))
              .map((m) => m.split('\r\n')[0]);
          }),
        { timeout: 25_000 },
      )
      .toContain('INVITE sip:1000@10.13.13.77 SIP/2.0');
  });

  test('dials a plain extension using the configured default domain', async ({ page }) => {
    const logs = collectLogs(page);
    await setupFakeSip(page);
    await page.goto('/');

    await waitForLog(page, logs, 'SIP transport connected');
    await page.fill('#phone-input', '1000');
    await callButton(page).click();

    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');
  });

  test('surfaces microphone failure to the console and UI instead of failing silently', async ({ page }) => {
    const logs = collectLogs(page);
    await setupFakeSip(page, { failMedia: true });
    await page.goto('/');

    await waitForLog(page, logs, 'SIP transport connected');
    await page.fill('#phone-input', '1000');
    await callButton(page).click();

    // The call is attempted...
    await waitForLog(page, logs, 'Placing call to sip:1000@127.0.0.1');
    // ...and the real reason is logged to the console.
    await waitForLog(page, logs, 'getUserMedia failed');
    expect(logs.join('\n')).toContain('FAILED');

    // ...and shown to the user, and the UI recovers (no silent flash).
    await expect(page.getByText(/Microphone access failed/i)).toBeVisible();
    await expect(callButton(page)).toBeVisible();
  });

  test('surfaces a SIP 488 rejection with an actionable message', async ({ page }) => {
    const logs = collectLogs(page);
    await setupFakeSip(page, { inviteStatus: '488 Not Acceptable Here' });
    await page.goto('/');

    await waitForLog(page, logs, 'SIP transport connected');
    await page.fill('#phone-input', '1000');
    await callButton(page).click();

    await waitForLog(page, logs, 'FAILED');
    await waitForLog(page, logs, '488 Not Acceptable Here');
    await expect(page.getByText(/488 Not Acceptable Here/i)).toBeVisible();
    await expect(page.getByText(/WebRTC\/DTLS/i)).toBeVisible();
  });
});
