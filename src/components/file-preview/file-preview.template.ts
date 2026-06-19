import { escHtml } from '../../utils/html.utils';

export type DiffEntry = { type: 'same' | 'added' | 'removed'; line: string };

export function computeDiff(original: string, modified: string): DiffEntry[] {
  const MAX_LINES = 600;
  const a = original.split('\n').slice(0, MAX_LINES);
  const b = modified.split('\n').slice(0, MAX_LINES);
  const m = a.length, n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: DiffEntry[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'same', line: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', line: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', line: a[i - 1] });
      i--;
    }
  }
  return result;
}

export function buildDiffHtml(original: string, current: string, t: (key: string) => string): string {
  if (original === current) return `<div class="diff-empty">${t('FILE_PREVIEW.NO_CHANGES')}</div>`;

  const diff = computeDiff(original, current);
  if (!diff.length) return `<div class="diff-empty">${t('FILE_PREVIEW.NO_CHANGES_SHORT')}</div>`;

  const CONTEXT = 2;
  const compressed: DiffEntry[] = [];
  let sameRun = 0;
  for (let idx = 0; idx < diff.length; idx++) {
    if (diff[idx].type === 'same') {
      sameRun++;
      if (sameRun <= CONTEXT) compressed.push(diff[idx]);
      else if (idx + 1 < diff.length && diff[idx + 1].type !== 'same') {
        if (sameRun > CONTEXT * 2) compressed.push({ type: 'same', line: '…' });
        compressed.push(diff[idx]);
      }
    } else {
      sameRun = 0;
      compressed.push(diff[idx]);
    }
  }

  return compressed.map(({ type, line }) => {
    const sign = type === 'added' ? '+' : type === 'removed' ? '−' : ' ';
    return `<div class="diff-line ${type}"><span class="diff-sign">${sign}</span><span>${escHtml(line)}</span></div>`;
  }).join('');
}

export type RunState = 'idle' | 'running' | 'passed' | 'failed' | 'error';

export interface FilePreviewState {
  fileName: string | null;
  showDiff: boolean;
  fileContent: string | null;
  originalContent: string | null;
  currentContent: string;
  itBlock: string;
  interceptorsBlock: string;
  closeLabel: string;
  isLocal: boolean;
  runState: RunState;
  runOutput: string;
}

const RUN_STATUS_KEY: Record<Exclude<RunState, 'idle'>, string> = {
  running: 'FILE_PREVIEW.LAUNCH_RUNNING',
  passed: 'FILE_PREVIEW.LAUNCH_PASSED',
  failed: 'FILE_PREVIEW.LAUNCH_FAILED',
  error: 'FILE_PREVIEW.LAUNCH_NO_RUNNER',
};

export function renderFilePreview(state: FilePreviewState, t: (key: string) => string): string {
  const { fileName, showDiff, fileContent, originalContent, currentContent, itBlock, interceptorsBlock, closeLabel, isLocal, runState, runOutput } = state;

  const blocksPanelHtml = (itBlock || interceptorsBlock) ? `
    <div class="blocks-panel">
      ${itBlock ? `
      <div class="block-section">
        <div class="block-row">
          <span class="block-label">${t('FILE_PREVIEW.BLOCK_IT')}</span>
          <button id="btn-copy-it" class="btn-copy-sm">${t('FILE_PREVIEW.COPY_BTN')}</button>
        </div>
        <pre class="block-pre">${escHtml(itBlock.slice(0, 2000))}</pre>
      </div>` : ''}
      ${interceptorsBlock ? `
      <div class="block-section">
        <div class="block-row">
          <span class="block-label">${t('FILE_PREVIEW.BLOCK_BEFORE_EACH')}</span>
          <button id="btn-copy-icp" class="btn-copy-sm">${t('FILE_PREVIEW.COPY_BTN')}</button>
        </div>
        <pre class="block-pre" style="color:#3fb950">${escHtml(interceptorsBlock.slice(0, 2000))}</pre>
      </div>` : ''}
    </div>` : '';

  const hasChanges = originalContent !== null && originalContent !== (fileContent ?? '');
  const hasBlocks = !!(itBlock || interceptorsBlock);

  const launchBtnHtml = isLocal
    ? `<button id="btn-launch" class="btn-launch" ${runState === 'running' ? 'disabled' : ''}>${runState === 'running' ? t('FILE_PREVIEW.LAUNCH_RUNNING') : t('FILE_PREVIEW.LAUNCH_BTN')}</button>`
    : `<button class="btn-launch" disabled title="${t('FILE_PREVIEW.LAUNCH_LOCAL_ONLY')}">${t('FILE_PREVIEW.LAUNCH_BTN')}</button>
       <span class="launch-hint">${t('FILE_PREVIEW.LAUNCH_LOCAL_ONLY')}</span>`;

  const runResultHtml = runState !== 'idle'
    ? `<div class="run-result run-${runState}">
         <span class="run-status">${t(RUN_STATUS_KEY[runState])}</span>
         ${runOutput ? `<pre class="run-output">${escHtml(runOutput.slice(0, 8000))}</pre>` : ''}
       </div>`
    : '';

  return `
    <div class="container">
      <div class="header">
        <span class="file-name">📄 ${fileName ? escHtml(fileName) : t('FILE_PREVIEW.NO_FILE')}</span>
        <button id="btn-copy" title="${t('FILE_PREVIEW.COPY_TITLE')}">📋</button>
      </div>
      <div class="body">
        ${showDiff
          ? `<div class="diff-panel" id="diff-panel">${buildDiffHtml(originalContent ?? '', currentContent, t)}</div>`
          : `<textarea class="editor" id="editor" spellcheck="false">${escHtml(fileContent ?? '')}</textarea>`}
        ${blocksPanelHtml}
      </div>
      ${runResultHtml}
      <div class="footer">
        ${launchBtnHtml}
        ${hasChanges ? `<button id="btn-diff" class="${showDiff ? 'btn-diff-active' : ''}">${t('FILE_PREVIEW.DIFF_BTN')}</button>` : ''}
        ${hasBlocks && !showDiff ? `<button id="btn-insert" class="btn-insert" title="${t('FILE_PREVIEW.INSERT_TITLE')}">${t('FILE_PREVIEW.INSERT_BTN')}</button>` : ''}
        <button id="btn-save" class="btn-save">${t('FILE_PREVIEW.SAVE_BTN')}</button>
        <button id="btn-close">${escHtml(closeLabel || t('FILE_PREVIEW.CLOSE_BTN'))}</button>
      </div>
    </div>`;
}
