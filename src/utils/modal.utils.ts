export function makeModalResizable(
  modal: HTMLElement,
  options?: { minWidth?: number; minHeight?: number }
): () => void {
  if (!modal || modal.querySelector('.modal-resizer')) return () => { /* no-op */ };

  const rect = modal.getBoundingClientRect();
  modal.style.position = 'fixed';
  modal.style.top = `${rect.top}px`;
  modal.style.left = `${rect.left}px`;
  modal.style.width = `${rect.width}px`;
  modal.style.margin = '0';
  modal.style.resize = 'both';
  modal.style.overflow = 'auto';
  modal.style.minWidth = (options?.minWidth ?? 320) + 'px';
  modal.style.minHeight = (options?.minHeight ?? 180) + 'px';

  const resizer = document.createElement('div');
  resizer.className = 'modal-resizer';
  resizer.style.position = 'absolute';
  resizer.style.width = '16px';
  resizer.style.height = '16px';
  resizer.style.right = '2px';
  resizer.style.bottom = '2px';
  resizer.style.cursor = 'nwse-resize';
  resizer.style.background = 'rgba(0,0,0,0.1)';
  resizer.style.zIndex = '10';
  modal.appendChild(resizer);

  let isResizing = false;
  let lastX = 0;
  let lastY = 0;

  const mouseMove = (e: MouseEvent): void => {
    if (!isResizing) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const rect = modal.getBoundingClientRect();
    modal.style.width = rect.width + dx + 'px';
    modal.style.height = rect.height + dy + 'px';
  };

  const mouseUp = (): void => {
    isResizing = false;
    document.body.style.userSelect = '';
  };

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
    lastX = e.clientX;
    lastY = e.clientY;
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mouseup', mouseUp);

  return () => {
    window.removeEventListener('mousemove', mouseMove);
    window.removeEventListener('mouseup', mouseUp);
    if (resizer.parentNode) resizer.parentNode.removeChild(resizer);
  };
}

function applyDraggable(swal: HTMLElement, dragArea: HTMLElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  dragArea.style.cursor = 'move';
  dragArea.onmousedown = (e: MouseEvent) => {
    isDragging = true;
    const rect = swal.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.onmousemove = (ev: MouseEvent) => {
      if (isDragging) {
        swal.style.position = 'fixed';
        swal.style.margin = '0';
        swal.style.left = `${ev.clientX - offsetX}px`;
        swal.style.top = `${ev.clientY - offsetY}px`;
      }
    };
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}

function resolveDragArea(swal: HTMLElement): HTMLElement | null {
  return (swal.querySelector('.swal2-header') as HTMLElement | null)
    ?? (swal.querySelector('.swal2-title') as HTMLElement | null);
}

export function makeSwalDraggable(): void {
  const popups = document.querySelectorAll('.swal2-popup');
  if (!popups.length) return;
  const swal = popups[popups.length - 1] as HTMLElement;
  const dragArea = resolveDragArea(swal);
  if (!dragArea) return;
  applyDraggable(swal, dragArea);
}

export function makeSwalDraggableByContentId(contentId: string): void {
  const content = document.getElementById(contentId);
  if (!content) {
    makeSwalDraggable();
    return;
  }
  const swal = (content.closest('.swal2-popup') as HTMLElement | null)
    ?? (document.querySelector('.swal2-popup') as HTMLElement | null);
  if (!swal) return;
  const dragArea = resolveDragArea(swal);
  if (!dragArea) return;
  applyDraggable(swal, dragArea);
}

export function setSwal2DataCyAttribute(dataCy = 'lib-e2e-cypress-for-dummys'): void {
  document.querySelector('.swal2-container')?.setAttribute('data-cy', dataCy);
  document.querySelector('.swal2-html-container')?.setAttribute('data-cy', dataCy);
  document.querySelector('.swal2-title')?.setAttribute('data-cy', dataCy);
}
