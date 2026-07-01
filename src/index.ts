// Public API — populated as migration phases are completed
// Keep in sync with package.json "version" (asserted in specs/public-api.spec.ts).
export const VERSION = '0.7.0';

// Phase 1 — Models
export * from './models/lang.model';
export * from './models/input-types.model';
export * from './models/db-schema.model';
export * from './models/active-session.model';

// Phase 2 — TranslationService
export * from './services/translation.service';

// Phase 3 — Transformation Services
export * from './services/transformation.service';
export * from './services/advanced-test.transformation.service';

// Phase 4 — RecordingService
export * from './utils/subject';
export * from './services/recording.service';

// Phase 5 — PersistenceService
export * from './services/persistence.service';

// Phase 6 — HttpMonitor
export * from './services/http-monitor';

// Phase 7 — UI Utilities
export * from './utils/styles.utils';
export * from './utils/modal.utils';
export * from './utils/toast.utils';
export * from './utils/export-selection.utils';
export * from './utils/host.utils';
export * from './utils/widget-position.utils';
export * from './utils/assertion.utils';

// Phase 8 — Web Components
export * from './components/selector-picker/selector-picker';
export * from './components/test-previsualizer/test-previsualizer';
export * from './components/save-test/save-test';
export * from './components/test-editor/test-editor';
export * from './components/configuration/configuration';
export * from './components/advanced-test-editor/advanced-test-editor';
export * from './components/file-preview/file-preview';
export * from './components/lib-e2e-recorder/lib-e2e-recorder';
