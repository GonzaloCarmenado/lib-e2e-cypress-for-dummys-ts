import { describe, it, expect } from 'vitest';
import { isLocalHost } from '../../src/utils/host.utils';

describe('isLocalHost', () => {
  it('treats localhost as local', () => {
    expect(isLocalHost('localhost')).toBe(true);
  });

  it('treats 127.0.0.1, ::1 and 0.0.0.0 as local', () => {
    expect(isLocalHost('127.0.0.1')).toBe(true);
    expect(isLocalHost('::1')).toBe(true);
    expect(isLocalHost('0.0.0.0')).toBe(true);
  });

  it('treats an empty hostname (file://) as local', () => {
    expect(isLocalHost('')).toBe(true);
  });

  it('treats *.localhost subdomains as local', () => {
    expect(isLocalHost('app.localhost')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isLocalHost('LOCALHOST')).toBe(true);
  });

  it('treats deployed hostnames as non-local', () => {
    expect(isLocalHost('example.com')).toBe(false);
    expect(isLocalHost('staging.miapp.com')).toBe(false);
    expect(isLocalHost('miapp.com')).toBe(false);
  });

  it('treats a LAN IP as non-local', () => {
    expect(isLocalHost('192.168.1.10')).toBe(false);
  });
});
