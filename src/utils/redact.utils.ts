// Substrings that unambiguously mark a key as sensitive. Matched against the
// normalized key (lowercased, non-alphanumerics stripped), so `access_token`,
// `X-Api-Key` and `refreshToken` all collapse to a form these can catch. These
// are safe as substrings — none appears inside a common non-sensitive key.
const SENSITIVE_SUBSTRINGS = [
  'password',
  'passwd',
  'passphrase',
  'secret',
  'token',        // access_token, refresh_token, id_token, csrf_token…
  'apikey',       // api_key, x-api-key — NOT bare "key" (avoids "normalKey")
  'authorization',
  'cookie',
  'credential',
  'privatekey',
  'sessionid',
  'creditcard',
  'cardnumber',
  'cvv',
];

// Short / ambiguous names that would over-match as substrings (e.g. "auth" ⊂
// "author", "pin" ⊂ "shipping"), so they are matched only as the WHOLE key.
const SENSITIVE_EXACT = new Set([
  'auth',
  'pwd',
  'pin',
  'otp',
  'ssn',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  if (SENSITIVE_EXACT.has(normalized)) return true;
  return SENSITIVE_SUBSTRINGS.some((s) => normalized.includes(s));
}

/**
 * Recursively replaces values for sensitive keys with the literal string
 * "[REDACTED]". A key is sensitive if, once normalized (lowercased, separators
 * stripped), it contains a known credential substring (password, secret, token,
 * apikey, authorization, cookie, credential, privatekey, sessionid, card data)
 * or exactly equals a short marker (auth, pwd, pin, otp, ssn). Case-insensitive
 * and separator-insensitive so `access_token`, `X-Api-Key`, `clientSecret` and
 * `refreshToken` are all caught.
 *
 * Safe for use before writing fixtures or generating cy.wait validations —
 * credentials never reach generated test code. Returns a new object/array; the
 * original is never mutated.
 */
export function redactSensitiveFields(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveFields);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? '[REDACTED]' : redactSensitiveFields(value);
    }
    return result;
  }
  return obj;
}
