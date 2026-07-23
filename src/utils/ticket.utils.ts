import { ISSUE_TRACKER_PRESETS, type IssueTrackerConfig, type IssueTrackerProvider } from '../models/issue-tracker.model';

/**
 * Builds the full URL for a ticket in the configured issue tracker.
 *
 * Returns `null` when tracking is disabled, the ticket ID is blank, or the base
 * URL is not configured.
 *
 * @param ticketId - The raw ticket identifier entered by the user (e.g. `"PROJ-123"`).
 * @param config - The active issue tracker configuration.
 * @returns The resolved ticket URL, or `null` if any required value is missing.
 */
export function buildTicketUrl(ticketId: string, config: IssueTrackerConfig): string | null {
  if (!config.enabled || !ticketId.trim() || !config.baseUrl.trim()) return null;
  const preset  = ISSUE_TRACKER_PRESETS[config.provider];
  const base    = config.baseUrl.replace(/\/+$/, '');
  return preset.urlPattern.replace('{baseUrl}', base).replace('{id}', encodeURIComponent(ticketId.trim()));
}

/**
 * Builds a single-line JS comment that references a ticket ID, e.g.
 * `// Ticket: PROJ-123`. Intended to be prepended to a generated test block.
 *
 * @param ticketId - The raw ticket identifier (leading/trailing whitespace is trimmed).
 * @returns A comment string of the form `// Ticket: <id>`.
 */
export function buildTicketComment(ticketId: string): string {
  return `// Ticket: ${ticketId.trim()}`;
}

/**
 * Returns `true` when `ticketId` matches the ID format required by the given
 * issue tracker provider (e.g. `PROJ-123` for Jira).
 *
 * @param ticketId - The ticket identifier to validate.
 * @param provider - The issue tracker provider whose pattern to apply.
 * @returns `true` if the ID is non-empty and matches the provider's pattern.
 */
export function isValidTicketId(ticketId: string, provider: IssueTrackerProvider): boolean {
  if (!ticketId.trim()) return false;
  return ISSUE_TRACKER_PRESETS[provider].idPattern.test(ticketId.trim());
}
