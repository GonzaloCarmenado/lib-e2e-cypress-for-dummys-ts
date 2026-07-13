export function mountFilesystemSetupContent(
  container: HTMLElement,
  t: (key: string) => string,
  onSkip: () => Promise<void>,
  onSelect: () => Promise<void>,
): void {
  container.innerHTML = `
    <div style="padding:16px 20px 20px;color:#8b949e;font-size:13px;line-height:1.7">
      <p>${t('RECORDER.FS_INTRO_HTML')}</p>
      <p style="margin-top:10px;margin-bottom:6px;font-size:11px;color:#8b949e">
        ${t('RECORDER.FS_STRUCTURE_HINT_HTML')}
      </p>
      <pre style="margin:0;padding:10px 14px;background:#0d1117;border:1px solid #21262d;
                  border-radius:8px;font-size:11px;color:#c9d1d9;line-height:1.8;
                  font-family:'Cascadia Code','Fira Code','Consolas',monospace">
cypress/         <span style="color:#484f58">${t('RECORDER.FS_TREE_PICK_HINT')}</span>
└── e2e/         <span style="color:#484f58">${t('RECORDER.FS_TREE_READ_HINT')}</span>
    └── *.cy.ts</pre>
      <p style="margin-top:8px;font-size:11px;color:#484f58">
        ${t('RECORDER.FS_PERMISSION_NOTE')}
      </p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
        <button id="fs-skip"
          style="padding:7px 16px;border:1px solid #30363d;border-radius:6px;cursor:pointer;
                 font-size:12px;font-weight:500;background:transparent;color:#8b949e">
          ${t('RECORDER.FS_LATER_BTN')}
        </button>
        <button id="fs-select"
          style="padding:7px 16px;border:none;border-radius:6px;cursor:pointer;
                 font-size:12px;font-weight:500;background:#2f81f7;color:#fff">
          ${t('RECORDER.FS_SELECT_BTN')}
        </button>
      </div>
    </div>`;

  document.getElementById('fs-skip')?.addEventListener('click', () => { void onSkip(); });
  document.getElementById('fs-select')?.addEventListener('click', () => { void onSelect(); });
}
