// Utilities for turning the dialer input into a SIP request URI.
//
// Supported inputs:
//   "1000"                      -> sip:1000@<defaultDomain>
//   "1000@10.13.13.77"          -> sip:1000@10.13.13.77
//   "sip:1000@10.13.13.77"      -> sip:1000@10.13.13.77
//   "sips:1000@example.com"     -> sips:1000@example.com
//
// The parser is deliberately dependency-free so it can be unit/e2e tested.

const USER_PATTERN = /^[+*#\w.\-]+$/;
const INVALID_DOMAIN_PATTERN = /[\s/]/;

export const DIAL_ERRORS = {
  EMPTY: 'empty',
  INVALID_USER: 'invalid-user',
  MISSING_DOMAIN: 'missing-domain',
  INVALID_DOMAIN: 'invalid-domain',
} as const;

export type DialError = (typeof DIAL_ERRORS)[keyof typeof DIAL_ERRORS];

export interface DialTarget {
  valid: boolean;
  reason: string | null;
  uri: string;
  number: string;
  domain: string;
}

const failure = (reason: string, user?: string, domain?: string): DialTarget => ({
  valid: false,
  reason,
  uri: '',
  number: user || '',
  domain: domain || '',
});

/**
 * Parse raw dialer input into a SIP URI.
 *
 * @param rawInput - what the user typed (e.g. "1000@10.13.13.77").
 * @param defaultDomain - domain to append when none is given.
 */
export function parseDialTarget(
  rawInput: string,
  defaultDomain?: string,
): DialTarget {
  const input = typeof rawInput === 'string' ? rawInput.trim() : '';
  const fallbackDomain =
    typeof defaultDomain === 'string' ? defaultDomain.trim() : '';

  if (!input) {
    return failure(DIAL_ERRORS.EMPTY, '', fallbackDomain);
  }

  // Already a full SIP/SIPS URI: use it as-is.
  const fullUriMatch = input.match(/^(sips?):(.+)$/i);
  if (fullUriMatch) {
    const scheme = fullUriMatch[1].toLowerCase();
    const rest = fullUriMatch[2].trim();
    const atIndex = rest.indexOf('@');
    const number = atIndex === -1 ? '' : rest.slice(0, atIndex);
    const host = atIndex === -1 ? rest : rest.slice(atIndex + 1);
    return {
      valid: true,
      reason: null,
      uri: `${scheme}:${rest}`,
      number,
      domain: host,
    };
  }

  const atIndex = input.indexOf('@');
  const userPart = (atIndex === -1 ? input : input.slice(0, atIndex)).trim();
  const domainPart = (
    atIndex === -1 ? fallbackDomain : input.slice(atIndex + 1)
  ).trim();

  if (!userPart || !USER_PATTERN.test(userPart)) {
    return failure(DIAL_ERRORS.INVALID_USER, userPart, domainPart);
  }
  if (!domainPart) {
    return failure(DIAL_ERRORS.MISSING_DOMAIN, userPart, '');
  }
  if (INVALID_DOMAIN_PATTERN.test(domainPart)) {
    return failure(DIAL_ERRORS.INVALID_DOMAIN, userPart, domainPart);
  }

  return {
    valid: true,
    reason: null,
    uri: `sip:${userPart}@${domainPart}`,
    number: userPart,
    domain: domainPart,
  };
}

export default parseDialTarget;
