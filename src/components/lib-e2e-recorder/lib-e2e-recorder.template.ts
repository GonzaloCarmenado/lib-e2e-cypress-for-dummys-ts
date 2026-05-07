export function renderRecorderWidget(rec: boolean, paused: boolean, t: (key: string) => string): string {
  return `
    <div class="widget">
      <button class="btn-action" data-n="1" data-action="config"
              data-label="${t('RECORDER.BTN_CONFIG')}">⚙️</button>
      <button class="btn-action" data-n="2" data-action="browse"
              data-label="${t('RECORDER.BTN_FILES')}">📁</button>
      <button class="btn-action" data-n="3" data-action="commands"
              data-label="${t('RECORDER.BTN_COMMANDS')}">⌨️</button>
      <button class="btn-action" data-n="4" data-action="tests"
              data-label="${t('RECORDER.BTN_TESTS')}">📋</button>
      <button class="btn-pause" data-action="pause"
              title="${paused ? t('RECORDER.RESUME_TITLE') : t('RECORDER.PAUSE_TITLE')}">
        ${paused ? '▶' : '⏸'}
      </button>
      <button class="btn-toggle" data-action="toggle"
              title="${rec ? t('RECORDER.STOP_TITLE') : t('RECORDER.START_TITLE')}">
        ${rec ? '⏹' : '⏺'}
      </button>
    </div>
    <div class="rec-badge">${paused ? t('RECORDER.BADGE_PAUSED') : t('RECORDER.BADGE_REC')}</div>`;
}
