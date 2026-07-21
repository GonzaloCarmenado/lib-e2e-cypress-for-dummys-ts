// Public API for lib-e2e-cypress-for-dummys-ts.
//
// This is an EXPLICIT allowlist — everything exported here is part of the
// semver-stable public contract. Internal singletons, magic-key constants,
// low-level drag/geometry helpers and test-only utilities are intentionally
// NOT re-exported (import them from their module path for internal use).
//
// Keep VERSION in sync with package.json "version" (asserted in
// specs/public-api.spec.ts).
export const VERSION = '1.0.1';

// ── Models (public types & stable constants) ────────────────────────────────
export { SUPPORTED_LANGS, isLang, LOCALE_BY_LANG, localeForLang } from './models/lang.model';
export type { Lang } from './models/lang.model';
export { INPUT_TYPES } from './models/input-types.model';
export type { InputType } from './models/input-types.model';
export { DB_SCHEMA, DB_STORE_NAMES } from './models/db-schema.model';
export type { DBSchema, DBStore, DBStoreIndex } from './models/db-schema.model';
export type { ActiveSessionState } from './models/active-session.model';
// Internal (not exported): ACTIVE_SESSION_BREADCRUMB_KEY, RESUME_TTL_CONFIG_KEY,
// DEFAULT_RESUME_TTL_MINUTES.

// ── Services ────────────────────────────────────────────────────────────────
export { TranslationService } from './services/translation.service';
export { TransformationService } from './services/transformation.service';
export { AdvancedTestTransformationService } from './services/advanced-test.transformation.service';
export type { DirectoryNode, FileNode } from './services/advanced-test.transformation.service';
export { RecordingService } from './services/recording.service';
export type { SelectorStrategy } from './services/recording.service';
export { PersistenceService } from './services/persistence.service';
export type { TestWithDetails, TestDetail } from './services/persistence.service';
export { HttpMonitor, generateAlias } from './services/http-monitor';
// Internal (not exported): translationService / transformationService /
// advancedTestTransformationService singletons, _resetHttpMonitorState.

// ── UI utilities (public) ────────────────────────────────────────────────────
export { SCROLLBAR_STYLES, LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES, injectStyles } from './utils/styles.utils';
export { makeModalResizable, makeSwalDraggable } from './utils/modal.utils';
export { showToast } from './utils/toast.utils';
export { selectTestsForExport } from './utils/export-selection.utils';
export type { ExportMode, ExportSelectionOptions } from './utils/export-selection.utils';
export { isLocalHost } from './utils/host.utils';
export { inferAssertionCommand } from './utils/assertion.utils';
// Internal (not exported): makeSwalDraggableByContentId, setSwal2DataCyAttribute,
// ensurePopupDimensions, and the widget-position geometry helpers.

// ── Web Components (registers the custom elements as an import side effect) ──
export { SelectorPickerElement } from './components/selector-picker/selector-picker';
export { TestPrevisualizerElement } from './components/test-previsualizer/test-previsualizer';
export { SaveTestElement } from './components/save-test/save-test';
export { TestEditorElement } from './components/test-editor/test-editor';
export { ConfigurationElement } from './components/configuration/configuration';
export { AdvancedTestEditorElement } from './components/advanced-test-editor/advanced-test-editor';
export { FilePreviewElement } from './components/file-preview/file-preview';
export { HelpPanelElement } from './components/help-panel/help-panel';
export { LibE2eRecorderElement } from './components/lib-e2e-recorder/lib-e2e-recorder';
