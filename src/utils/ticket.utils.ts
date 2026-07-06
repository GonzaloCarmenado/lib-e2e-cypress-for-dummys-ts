import { ISSUE_TRACKER_PRESETS, type IssueTrackerConfig, type IssueTrackerProvider } from '../models/issue-tracker.model';

export function buildTicketUrl(ticketId: string, config: IssueTrackerConfig): string | null {
  if (!config.enabled || !ticketId.trim() || !config.baseUrl.trim()) return null;
  const preset  = ISSUE_TRACKER_PRESETS[config.provider];
  const base    = config.baseUrl.replace(/\/+$/, '');
  return preset.urlPattern.replace('{baseUrl}', base).replace('{id}', encodeURIComponent(ticketId.trim()));
}

export function buildTicketComment(ticketId: string): string {
  return `// Ticket: ${ticketId.trim()}`;
}

export function isValidTicketId(ticketId: string, provider: IssueTrackerProvider): boolean {
  if (!ticketId.trim()) return false;
  return ISSUE_TRACKER_PRESETS[provider].idPattern.test(ticketId.trim());
}
