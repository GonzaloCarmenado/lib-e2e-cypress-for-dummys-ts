export const SCROLLBAR_STYLES = `
.swal2-popup, .modal-resizer, .swal2-html-container, .swal2-content, .swal2-container, .modal {
  scrollbar-width: thin;
  scrollbar-color: #1976d2 #e0e0e0;
}
.swal2-popup::-webkit-scrollbar, .modal-resizer::-webkit-scrollbar, .swal2-html-container::-webkit-scrollbar, .swal2-content::-webkit-scrollbar, .swal2-container::-webkit-scrollbar, .modal::-webkit-scrollbar {
  width: 8px;
  background: #e0e0e0;
  border-radius: 8px;
}
.swal2-popup::-webkit-scrollbar-thumb, .modal-resizer::-webkit-scrollbar-thumb, .swal2-html-container::-webkit-scrollbar-thumb, .swal2-content::-webkit-scrollbar-thumb, .swal2-container::-webkit-scrollbar-thumb, .modal::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1976d2 60%, #42a5f5 100%);
  border-radius: 8px;
  min-height: 24px;
}
.swal2-popup::-webkit-scrollbar-thumb:hover, .modal-resizer::-webkit-scrollbar-thumb:hover, .swal2-html-container::-webkit-scrollbar-thumb:hover, .swal2-content::-webkit-scrollbar-thumb:hover, .swal2-container::-webkit-scrollbar-thumb:hover, .modal::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #1565c0 60%, #1976d2 100%);
}
.swal2-popup::-webkit-scrollbar-track, .modal-resizer::-webkit-scrollbar-track, .swal2-html-container::-webkit-scrollbar-track, .swal2-content::-webkit-scrollbar-track, .swal2-container::-webkit-scrollbar-track, .modal::-webkit-scrollbar-track {
  background: #e0e0e0;
  border-radius: 8px;
}
`;

export const LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES = `
.swal2-container, .swal2-popup {
  z-index: 99999 !important;
}
.swal2-popup {
  background: #181c24 !important;
  color: #fff !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid #232a3a !important;
  padding: 0 !important;
  min-width: 400px;
  max-width: 90vw;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.swal2-title {
  color: #2196f3 !important;
  font-weight: bold;
  font-size: 1.05rem;
  background: #181c24;
  border-radius: 12px 12px 0 0;
  padding: 10px 18px 6px 18px;
  margin-bottom: 0 !important;
  border-bottom: 1px solid #181c24;
}
.swal2-close {
  color: #fff !important;
  font-size: 1.5rem !important;
  top: 12px !important;
  right: 16px !important;
  z-index: 1!important;
}
.swal2-html-container {
  background: #181c24;
  border-radius: 0 0 12px 12px;
  padding: 0 12px 12px 12px !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  overflow: auto;
}
`;

export function injectStyles(css: string, id: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
}
