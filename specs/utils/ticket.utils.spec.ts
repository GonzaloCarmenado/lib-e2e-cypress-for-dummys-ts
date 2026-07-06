import { describe, it, expect } from 'vitest';
import { buildTicketUrl, buildTicketComment, isValidTicketId } from '../../src/utils/ticket.utils';
import { DEFAULT_ISSUE_TRACKER_CONFIG, type IssueTrackerConfig } from '../../src/models/issue-tracker.model';

const enabledJira: IssueTrackerConfig = { enabled: true, provider: 'jira', baseUrl: 'https://company.atlassian.net' };
const enabledGitHub: IssueTrackerConfig = { enabled: true, provider: 'github', baseUrl: 'https://github.com/org/repo' };
const enabledGitLab: IssueTrackerConfig = { enabled: true, provider: 'gitlab', baseUrl: 'https://gitlab.com/org/repo' };
const enabledAzure: IssueTrackerConfig = { enabled: true, provider: 'azure', baseUrl: 'https://dev.azure.com/org/project' };
const enabledBitbucket: IssueTrackerConfig = { enabled: true, provider: 'bitbucket', baseUrl: 'https://bitbucket.org/org/repo' };
const enabledCustom: IssueTrackerConfig = { enabled: true, provider: 'custom', baseUrl: 'https://tracker.internal' };

describe('buildTicketUrl', () => {
  it('returns null when disabled', () => {
    expect(buildTicketUrl('PROJ-1', DEFAULT_ISSUE_TRACKER_CONFIG)).toBeNull();
  });

  it('returns null for empty ticketId', () => {
    expect(buildTicketUrl('', enabledJira)).toBeNull();
    expect(buildTicketUrl('  ', enabledJira)).toBeNull();
  });

  it('returns null when baseUrl is empty', () => {
    expect(buildTicketUrl('PROJ-1', { ...enabledJira, baseUrl: '' })).toBeNull();
    expect(buildTicketUrl('PROJ-1', { ...enabledJira, baseUrl: '   ' })).toBeNull();
  });

  it('builds Jira URL', () => {
    expect(buildTicketUrl('PROJ-123', enabledJira))
      .toBe('https://company.atlassian.net/browse/PROJ-123');
  });

  it('strips trailing slash from baseUrl', () => {
    expect(buildTicketUrl('PROJ-1', { ...enabledJira, baseUrl: 'https://company.atlassian.net/' }))
      .toBe('https://company.atlassian.net/browse/PROJ-1');
  });

  it('builds GitHub Issues URL', () => {
    expect(buildTicketUrl('42', enabledGitHub))
      .toBe('https://github.com/org/repo/issues/42');
  });

  it('builds GitLab Issues URL', () => {
    expect(buildTicketUrl('7', enabledGitLab))
      .toBe('https://gitlab.com/org/repo/-/issues/7');
  });

  it('builds Azure DevOps URL', () => {
    expect(buildTicketUrl('99', enabledAzure))
      .toBe('https://dev.azure.com/org/project/_workitems/edit/99');
  });

  it('builds Bitbucket Issues URL', () => {
    expect(buildTicketUrl('5', enabledBitbucket))
      .toBe('https://bitbucket.org/org/repo/issues/5');
  });

  it('builds Custom URL', () => {
    expect(buildTicketUrl('XYZ', enabledCustom))
      .toBe('https://tracker.internal/XYZ');
  });

  it('URL-encodes ticketId with special characters', () => {
    expect(buildTicketUrl('PROJ 1', enabledJira))
      .toBe('https://company.atlassian.net/browse/PROJ%201');
  });

  it('trims ticketId whitespace', () => {
    expect(buildTicketUrl('  PROJ-1  ', enabledJira))
      .toBe('https://company.atlassian.net/browse/PROJ-1');
  });
});

describe('buildTicketComment', () => {
  it('produces a line comment', () => {
    expect(buildTicketComment('PROJ-123')).toBe('// Ticket: PROJ-123');
  });

  it('trims surrounding whitespace', () => {
    expect(buildTicketComment('  PROJ-5  ')).toBe('// Ticket: PROJ-5');
  });

  it('works for numeric IDs', () => {
    expect(buildTicketComment('42')).toBe('// Ticket: 42');
  });
});

describe('isValidTicketId', () => {
  it('validates Jira format (PROJ-123)', () => {
    expect(isValidTicketId('PROJ-123', 'jira')).toBe(true);
    expect(isValidTicketId('AB-1', 'jira')).toBe(true);
    expect(isValidTicketId('MYPROJECT-999', 'jira')).toBe(true);
  });

  it('rejects invalid Jira format', () => {
    expect(isValidTicketId('proj-123', 'jira')).toBe(false);
    expect(isValidTicketId('123', 'jira')).toBe(false);
    expect(isValidTicketId('PROJ-', 'jira')).toBe(false);
    expect(isValidTicketId('-123', 'jira')).toBe(false);
  });

  it('validates GitHub/GitLab/Azure/Bitbucket (numeric)', () => {
    for (const provider of ['github', 'gitlab', 'azure', 'bitbucket'] as const) {
      expect(isValidTicketId('42', provider)).toBe(true);
      expect(isValidTicketId('1', provider)).toBe(true);
    }
  });

  it('rejects non-numeric for GitHub/GitLab/Azure/Bitbucket', () => {
    for (const provider of ['github', 'gitlab', 'azure', 'bitbucket'] as const) {
      expect(isValidTicketId('PROJ-1', provider)).toBe(false);
      expect(isValidTicketId('abc', provider)).toBe(false);
    }
  });

  it('accepts any non-empty string for custom provider', () => {
    expect(isValidTicketId('anything', 'custom')).toBe(true);
    expect(isValidTicketId('PROJ-1', 'custom')).toBe(true);
    expect(isValidTicketId('42', 'custom')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidTicketId('', 'jira')).toBe(false);
    expect(isValidTicketId('  ', 'jira')).toBe(false);
  });
});
