/**
 * True when a hostname refers to the local machine — used to gate dev-only
 * features (e.g. launching a Cypress run via the local runner) so they are
 * offered only when the app is served locally, not from a deployed environment.
 *
 * Treats as local: localhost, *.localhost, 127.0.0.1, ::1, 0.0.0.0, and the
 * empty hostname (e.g. file:// URLs). Case-insensitive.
 */
export function isLocalHost(hostname: string): boolean {
  if (!hostname) return true;
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '0.0.0.0'
  );
}
