export type IssueTrackerProvider = 'jira' | 'github' | 'gitlab' | 'azure' | 'bitbucket' | 'custom';

export interface IssueTrackerPreset {
  id: IssueTrackerProvider;
  label: string;
  urlPattern: string;
  idPattern: RegExp;
}

export const ISSUE_TRACKER_PRESETS: Record<IssueTrackerProvider, IssueTrackerPreset> = {
  jira:      { id: 'jira',      label: 'Jira',            urlPattern: '{baseUrl}/browse/{id}',          idPattern: /^[A-Z][A-Z0-9]+-\d+$/ },
  github:    { id: 'github',    label: 'GitHub Issues',   urlPattern: '{baseUrl}/issues/{id}',          idPattern: /^\d+$/ },
  gitlab:    { id: 'gitlab',    label: 'GitLab Issues',   urlPattern: '{baseUrl}/-/issues/{id}',        idPattern: /^\d+$/ },
  azure:     { id: 'azure',     label: 'Azure DevOps',    urlPattern: '{baseUrl}/_workitems/edit/{id}', idPattern: /^\d+$/ },
  bitbucket: { id: 'bitbucket', label: 'Bitbucket Issues',urlPattern: '{baseUrl}/issues/{id}',          idPattern: /^\d+$/ },
  custom:    { id: 'custom',    label: 'Custom',          urlPattern: '{baseUrl}/{id}',                 idPattern: /.+/ },
};

export interface IssueTrackerConfig {
  enabled: boolean;
  provider: IssueTrackerProvider;
  baseUrl: string;
}

export const DEFAULT_ISSUE_TRACKER_CONFIG: IssueTrackerConfig = {
  enabled:  false,
  provider: 'jira',
  baseUrl:  '',
};
