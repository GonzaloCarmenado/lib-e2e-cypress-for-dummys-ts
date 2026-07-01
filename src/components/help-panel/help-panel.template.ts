import { escHtml } from '../../utils/html.utils';

/**
 * Pure render function for the in-app Help panel (spec 011). All text comes from
 * the HELP.* i18n section and is escaped (some values contain literal `<select>`
 * etc. that would otherwise be parsed as HTML).
 */

const SECTIONS: Array<{ title: string; items: string[] }> = [
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

export function renderHelpPanel(t: (key: string) => string): string {
  const section = (title: string, items: string[]): string => `
    <section class="help-sec">
      <h3 class="help-sec-hd">${escHtml(t(title))}</h3>
      <ul class="help-list">${items.map((k) => `<li>${escHtml(t(k))}</li>`).join('')}</ul>
    </section>`;

  return `
    <div class="help-panel">
      <p class="help-intro">${escHtml(t('HELP.INTRO'))}</p>
      ${SECTIONS.map((s) => section(s.title, s.items)).join('')}
    </div>`;
}
