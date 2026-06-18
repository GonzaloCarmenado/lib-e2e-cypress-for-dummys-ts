import type { TestWithDetails } from '../services/persistence.service';

/** How the user chose which tests to export. */
export type ExportMode = 'all' | 'manual' | 'tags';

export interface ExportSelectionOptions {
  /** Test ids to include in `manual` mode. */
  ids?: Iterable<number>;
  /** Tags to match in `tags` mode. */
  tags?: Iterable<string>;
}

/**
 * Returns the subset of tests to export for a given selection mode.
 *
 * - `all`    → every test (a shallow copy).
 * - `manual` → tests whose id is in `opts.ids`. Empty/absent ids → none.
 * - `tags`   → tests carrying at least one of `opts.tags` (OR semantics).
 *              Empty/absent tags → none.
 *
 * Pure: never mutates its inputs.
 */
export function selectTestsForExport(
  tests: TestWithDetails[],
  mode: ExportMode,
  opts: ExportSelectionOptions = {},
): TestWithDetails[] {
  if (mode === 'all') return [...tests];

  if (mode === 'manual') {
    const ids = new Set(opts.ids ?? []);
    return tests.filter((t) => ids.has(t.id));
  }

  // 'tags' — include a test if it carries ANY of the selected tags (OR).
  const tags = new Set(opts.tags ?? []);
  if (tags.size === 0) return [];
  return tests.filter((t) => (t.tags ?? []).some((tag) => tags.has(tag)));
}
