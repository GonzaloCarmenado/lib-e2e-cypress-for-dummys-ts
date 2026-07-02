export function renderRecorderWidget(rec: boolean, paused: boolean, t: (key: string) => string): string {
  return `
    <div class="widget">
      <div class="action-menu">
        <button class="action-item" data-action="config">
          <span class="ico">⚙️</span><span class="label">${t('RECORDER.BTN_CONFIG')}</span></button>
        <button class="action-item" data-action="browse">
          <span class="ico">📁</span><span class="label">${t('RECORDER.BTN_FILES')}</span></button>
        <button class="action-item" data-action="commands">
          <span class="ico">⌨️</span><span class="label">${t('RECORDER.BTN_COMMANDS')}</span></button>
        <button class="action-item" data-action="tests">
          <span class="ico">📋</span><span class="label">${t('RECORDER.BTN_TESTS')}</span></button>
        <button class="action-item" data-action="help">
          <span class="ico">❓</span><span class="label">${t('RECORDER.BTN_HELP')}</span></button>
      </div>
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
