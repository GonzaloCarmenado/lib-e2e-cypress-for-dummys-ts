import { escHtml } from '../../utils/html.utils';

/**
 * Pure render function for the in-app Help panel (spec 011). Two tabs — a quick
 * reference (cheat-sheet) and a verbose usage guide (workflow + coverage). All
 * text comes from the HELP.* i18n section and is escaped (values contain literal
 * `<select>` etc. that would otherwise be parsed as HTML).
 */

export type HelpTab = 'reference' | 'guide';

interface Section { title: string; items: string[] }

const REFERENCE_SECTIONS: Section[] = [
  { title: 'HELP.SEC_RECORDING', items: ['HELP.RECORDING_1', 'HELP.RECORDING_2'] },
  {
    title: 'HELP.SEC_SHORTCUTS',
    items: ['HELP.SC_RECORD', 'HELP.SC_PAUSE', 'HELP.SC_TESTS', 'HELP.SC_COMMANDS', 'HELP.SC_CONFIG', 'HELP.SC_VISIBILITY', 'HELP.SC_HELP'],
  },
  {
    title: 'HELP.SEC_CAPTURED',
    items: ['HELP.CAP_CLICK', 'HELP.CAP_DBLCLICK', 'HELP.CAP_RIGHTCLICK', 'HELP.CAP_TYPE', 'HELP.CAP_CHECK', 'HELP.CAP_SELECT', 'HELP.CAP_KEYS', 'HELP.CAP_ROUTE', 'HELP.CAP_HTTP'],
  },
  { title: 'HELP.SEC_ASSERT', items: ['HELP.ASSERT_1', 'HELP.ASSERT_2'] },
  { title: 'HELP.SEC_PANELS', items: ['HELP.PANEL_TESTS', 'HELP.PANEL_COMMANDS', 'HELP.PANEL_CONFIG', 'HELP.PANEL_FILES'] },
  { title: 'HELP.SEC_SELECTOR', items: ['HELP.SELECTOR_1', 'HELP.SELECTOR_2'] },
  { title: 'HELP.SEC_DATA', items: ['HELP.DATA_1', 'HELP.DATA_2'] },
  { title: 'HELP.SEC_ADVANCED', items: ['HELP.ADV_INVISIBLE', 'HELP.ADV_RUNNER', 'HELP.ADV_CROSSAPP', 'HELP.ADV_DRAG'] },
];

const GUIDE_SECTIONS: Section[] = [
  { title: 'HELP.G_SEC_WORKFLOW', items: ['HELP.G_WF_1', 'HELP.G_WF_2', 'HELP.G_WF_3', 'HELP.G_WF_4', 'HELP.G_WF_5'] },
  { title: 'HELP.G_SEC_COVERED', items: ['HELP.G_COV_1', 'HELP.G_COV_2', 'HELP.G_COV_3', 'HELP.G_COV_4', 'HELP.G_COV_5', 'HELP.G_COV_6'] },
  { title: 'HELP.G_SEC_NOTCOVERED', items: ['HELP.G_NC_1', 'HELP.G_NC_2', 'HELP.G_NC_3', 'HELP.G_NC_4', 'HELP.G_NC_5', 'HELP.G_NC_6'] },
];

function sectionsHtml(sections: Section[], t: (key: string) => string): string {
  return sections
    .map(
      (s) => `
        <section class="help-sec">
          <h3 class="help-sec-hd">${escHtml(t(s.title))}</h3>
          <ul class="help-list">${s.items.map((k) => `<li>${escHtml(t(k))}</li>`).join('')}</ul>
        </section>`,
    )
    .join('');
}

export function renderHelpPanel(t: (key: string) => string, activeTab: HelpTab = 'reference'): string {
  const tab = (id: HelpTab, key: string): string =>
    `<button class="help-tab ${activeTab === id ? 'active' : ''}" data-tab="${id}">${escHtml(t(key))}</button>`;

  const body =
    activeTab === 'guide'
      ? `<p class="help-intro">${escHtml(t('HELP.GUIDE_INTRO'))}</p>${sectionsHtml(GUIDE_SECTIONS, t)}`
      : `<p class="help-intro">${escHtml(t('HELP.INTRO'))}</p>${sectionsHtml(REFERENCE_SECTIONS, t)}`;

  return `
    <div class="help-root">
      <div class="help-tabs" role="tablist">
        ${tab('reference', 'HELP.TAB_REFERENCE')}
        ${tab('guide', 'HELP.TAB_GUIDE')}
      </div>
      <div class="help-panel" data-tab-panel="${activeTab}">${body}</div>
    </div>`;
}
