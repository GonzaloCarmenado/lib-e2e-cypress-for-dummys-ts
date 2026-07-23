export interface LoginSetupConfig {
  enabled: boolean;
  filePath: string;
  fileContent: string;
  detectedFunctions: string[];
  beforeFn: string | null;
  beforeEachFn: string | null;
}

export const DEFAULT_LOGIN_SETUP_CONFIG: LoginSetupConfig = {
  enabled: false,
  filePath: '',
  fileContent: '',
  detectedFunctions: [],
  beforeFn: null,
  beforeEachFn: null,
};

/**
 * Type guard for {@link LoginSetupConfig}.
 *
 * Validates that an `unknown` value (e.g. from `JSON.parse`) has the required
 * shape before casting. Returns `false` for `null`, non-objects, or objects
 * missing any required property.
 *
 * @param value - Value to validate.
 * @returns `true` when `value` satisfies {@link LoginSetupConfig}.
 */
export function isLoginSetupConfig(value: unknown): value is LoginSetupConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['enabled'] === 'boolean' &&
    typeof v['filePath'] === 'string' &&
    typeof v['fileContent'] === 'string' &&
    Array.isArray(v['detectedFunctions']) &&
    (v['beforeFn'] === null || typeof v['beforeFn'] === 'string') &&
    (v['beforeEachFn'] === null || typeof v['beforeEachFn'] === 'string')
  );
}
