import { describe, it, expect } from 'vitest';
import { redactSensitiveFields, isSensitiveKey } from '../../src/utils/redact.utils';

describe('redact.utils', () => {
  // ── isSensitiveKey ───────────────────────────────────────────────────────────

  describe('isSensitiveKey', () => {
    it.each([
      'password', 'token', 'secret', 'authorization',
      'cookie', 'access_token', 'refresh_token',
    ])('"%s" is sensitive', (key) => {
      expect(isSensitiveKey(key)).toBe(true);
    });

    it('is case-insensitive (PASSWORD, Token, SECRET)', () => {
      expect(isSensitiveKey('PASSWORD')).toBe(true);
      expect(isSensitiveKey('Token')).toBe(true);
      expect(isSensitiveKey('SECRET')).toBe(true);
    });

    it.each(['name', 'email', 'userId', 'price', 'normalKey'])(
      '"%s" is not sensitive',
      (key) => { expect(isSensitiveKey(key)).toBe(false); }
    );

    it.each([
      'apiKey', 'api_key', 'X-Api-Key', 'pwd', 'passwd', 'passphrase',
      'sessionId', 'session_token', 'idToken', 'id_token', 'clientSecret',
      'privateKey', 'pin', 'otp', 'ssn', 'cardNumber', 'creditCard', 'cvv',
      'X-Auth-Token', 'csrfToken',
    ])('broadened: "%s" is sensitive', (key) => {
      expect(isSensitiveKey(key)).toBe(true);
    });

    it.each(['author', 'spinner', 'shipping', 'description', 'monkey', 'pinboard'])(
      'no false positive: "%s" is not sensitive',
      (key) => { expect(isSensitiveKey(key)).toBe(false); }
    );
  });

  // ── redactSensitiveFields ────────────────────────────────────────────────────

  describe('redactSensitiveFields', () => {
    it('redacts a top-level password key', () => {
      expect(redactSensitiveFields({ password: 'hunter2', name: 'Alice' }))
        .toEqual({ password: '[REDACTED]', name: 'Alice' });
    });

    it('redacts all seven sensitive keys at the top level', () => {
      const input = {
        password: 'p', token: 't', secret: 's',
        authorization: 'a', cookie: 'c',
        access_token: 'at', refresh_token: 'rt',
      };
      const result = redactSensitiveFields(input) as Record<string, unknown>;
      for (const key of Object.keys(input)) {
        expect(result[key]).toBe('[REDACTED]');
      }
    });

    it('redacts case-insensitively', () => {
      expect(redactSensitiveFields({ PASSWORD: 'x', Token: 'y', SECRET: 'z' }))
        .toEqual({ PASSWORD: '[REDACTED]', Token: '[REDACTED]', SECRET: '[REDACTED]' });
    });

    it('does not alter non-sensitive keys', () => {
      expect(redactSensitiveFields({ name: 'Alice', email: 'a@b.com', age: 30 }))
        .toEqual({ name: 'Alice', email: 'a@b.com', age: 30 });
    });

    it('redacts sensitive keys nested inside an object', () => {
      const r = redactSensitiveFields({
        user: { name: 'Alice', password: 'secret' },
        meta: { token: 'xyz' },
      });
      expect(r).toEqual({
        user: { name: 'Alice', password: '[REDACTED]' },
        meta: { token: '[REDACTED]' },
      });
    });

    it('redacts sensitive keys inside an array of objects', () => {
      const r = redactSensitiveFields([
        { id: 1, password: 'p1' },
        { id: 2, password: 'p2' },
      ]);
      expect(r).toEqual([
        { id: 1, password: '[REDACTED]' },
        { id: 2, password: '[REDACTED]' },
      ]);
    });

    it('redacts deeply nested sensitive keys', () => {
      const r = redactSensitiveFields({ a: { b: { c: { secret: 'deep' } } } });
      expect(r).toEqual({ a: { b: { c: { secret: '[REDACTED]' } } } });
    });

    it('passes through primitives unchanged', () => {
      expect(redactSensitiveFields('hello')).toBe('hello');
      expect(redactSensitiveFields(42)).toBe(42);
      expect(redactSensitiveFields(true)).toBe(true);
    });

    it('passes through null unchanged', () => {
      expect(redactSensitiveFields(null)).toBeNull();
    });

    it('does not mutate the original object', () => {
      const original = { password: 'secret', name: 'Alice' };
      redactSensitiveFields(original);
      expect(original.password).toBe('secret');
    });
  });
});
