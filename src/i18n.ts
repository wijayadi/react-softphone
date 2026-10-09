import { getLocale, setLocale, locales } from './paraglide/runtime.js';
import type { Locale } from './paraglide/runtime.js';
import { m } from './paraglide/messages.js';

export type { Locale };

/** Locales that ship with the softphone. */
export const SUPPORTED_LOCALES = locales as readonly Locale[];

/** Default locale when none is provided or an unknown one is passed. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Human readable labels for language switchers. */
export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  jp: '日本語',
};

export function normalizeLocale(value?: string): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Set the active softphone locale. Uses the in-memory `globalVariable`
 * strategy, so it never navigates, writes cookies, or touches localStorage.
 */
export function setSoftphoneLocale(locale?: string): Locale {
  const next = normalizeLocale(locale);
  try {
    void setLocale(next, { reload: false });
  } catch {
    // Ignore environments where the runtime is not available (e.g. SSR).
  }
  return next;
}

export function getSoftphoneLocale(): Locale {
  try {
    return normalizeLocale(getLocale());
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Translate the stored English `callInfo` values for display. */
export function translateCallInfo(value: string): string {
  switch (value) {
    case 'Ready':
      return m.ready();
    case 'Ringing':
      return m.ringing();
    case 'Answered':
      return m.answered();
    case 'Transferring...':
      return m.transferring();
    case 'Attended Transfer':
      return m.attended_transfer();
    case 'On Hold':
      return m.on_hold();
    case 'In Transfer':
      return m.in_transfer();
    default:
      return value;
  }
}

/** Translate a call direction value (`outgoing` / `incoming`). */
export function translateDirection(value?: string): string {
  if (value === 'outgoing') return m.outgoing();
  if (value === 'incoming') return m.incoming();
  return value ?? '';
}

/** Translate a `parseDialTarget` failure reason into a human phrase. */
export function translateDialReason(reason?: string | null): string {
  switch (reason) {
    case 'empty':
      return m.dial_error_empty();
    case 'invalid-user':
      return m.dial_error_invalid_user();
    case 'missing-domain':
      return m.dial_error_missing_domain();
    case 'invalid-domain':
      return m.dial_error_invalid_domain();
    default:
      return reason ?? '';
  }
}

export { m };
