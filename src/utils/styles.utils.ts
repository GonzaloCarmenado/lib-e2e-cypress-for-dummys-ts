export const SCROLLBAR_STYLES = `
.swal2-popup::-webkit-scrollbar,
.swal2-html-container::-webkit-scrollbar,
.swal2-content::-webkit-scrollbar,
.swal2-container::-webkit-scrollbar {
  width: 5px;
  height: 5px;
  background: transparent;
}
.swal2-popup::-webkit-scrollbar-thumb,
.swal2-html-container::-webkit-scrollbar-thumb,
.swal2-content::-webkit-scrollbar-thumb,
.swal2-container::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}
.swal2-popup::-webkit-scrollbar-thumb:hover,
.swal2-html-container::-webkit-scrollbar-thumb:hover,
.swal2-content::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}
.swal2-popup::-webkit-scrollbar-track,
.swal2-html-container::-webkit-scrollbar-track,
.swal2-content::-webkit-scrollbar-track,
.swal2-container::-webkit-scrollbar-track {
  background: transparent;
}
.swal2-popup, .swal2-html-container, .swal2-content, .swal2-container {
  scrollbar-width: thin;
  scrollbar-color: #30363d transparent;
}
`;

export const LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES = `
.swal2-container, .swal2-popup {
  z-index: 99999 !important;
}
.swal2-container {
  padding: 0 !important;
  align-items: center !important;
  justify-content: center !important;
}
.swal2-popup {
  background: #161b22 !important;
  color: #e6edf3 !important;
  border-radius: 12px !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.72), 0 0 0 1px #30363d !important;
  border: none !important;
  padding: 0 !important;
  min-width: 400px;
  max-width: 90vw;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
}
.swal2-header {
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
}
.swal2-title {
  color: #e6edf3 !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  background: #161b22;
  padding: 14px 48px 13px 18px !important;
  margin: 0 !important;
  border-bottom: 1px solid #21262d;
  text-align: left !important;
  letter-spacing: 0.1px;
}
.swal2-close {
  color: #8b949e !important;
  font-size: 1.1rem !important;
  top: 10px !important;
  right: 12px !important;
  z-index: 1 !important;
  border-radius: 6px !important;
  width: 28px !important;
  height: 28px !important;
  line-height: 28px !important;
  transition: background 0.15s, color 0.15s !important;
}
.swal2-close:hover {
  background: #21262d !important;
  color: #e6edf3 !important;
}
.swal2-content {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}
.swal2-html-container {
  flex: 1 !important;
  min-height: 0 !important;
  background: #161b22;
  padding: 0 !important;
  margin: 0 !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  overflow: auto;
}
.swal2-actions, .swal2-footer {
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
}
`;

export function injectStyles(css: string, id: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
}
