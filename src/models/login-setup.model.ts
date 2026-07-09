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
