const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
]);

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Recursively replaces values for sensitive keys (password, token, secret,
 * authorization, cookie, access_token, refresh_token — case-insensitive) with
 * the literal string "[REDACTED]". Safe for use before writing fixtures or
 * generating cy.wait validations — credentials never reach generated test code.
 * Returns a new object/array; the original is never mutated.
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
