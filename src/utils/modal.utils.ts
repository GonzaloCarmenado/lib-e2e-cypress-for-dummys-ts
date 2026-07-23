/**
 * Makes a modal element user-resizable by switching it to `position: fixed`,
 * applying `resize: both`, and injecting a visible resize handle in the
 * bottom-right corner. Attaches `mousemove`/`mouseup` listeners on `window`
 * to support dragging the handle.
 *
 * @param modal - The modal root element to make resizable.
 * @param options - Optional minimum dimensions in pixels.
 * @param options.minWidth - Minimum width (default `320`).
 * @param options.minHeight - Minimum height (default `180`).
 * @returns A cleanup function that removes the resize handle and all listeners.
 *          Returns a no-op if the element is falsy or already has a resizer.
 */
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
  modal.style.overflow = 'hidden';
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

/**
 * Makes the topmost visible SweetAlert2 popup draggable by attaching a
 * mousedown handler to its header or title element.
 *
 * Scans all `.swal2-popup` elements in the document and targets the last one
 * (the one rendered on top). Does nothing if no popup or drag area is found.
 */
export function makeSwalDraggable(): void {
  const popups = document.querySelectorAll('.swal2-popup');
  if (!popups.length) return;
  const swal = popups[popups.length - 1] as HTMLElement;
  const dragArea = resolveDragArea(swal);
  if (!dragArea) return;
  applyDraggable(swal, dragArea);
}

/**
 * Makes the SweetAlert2 popup that contains a given content element draggable.
 *
 * Looks up the element by `contentId`, traverses to its `.swal2-popup` ancestor,
 * and attaches a drag handler to the popup's header or title. Falls back to
 * {@link makeSwalDraggable} when the element is not found.
 *
 * @param contentId - The `id` of an element inside the target SweetAlert2 popup.
 */
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

/**
 * Sets a `data-cy` attribute on the SweetAlert2 container, HTML container, and
 * title elements so Cypress can target them reliably in tests.
 *
 * @param dataCy - The attribute value to set (default `'lib-e2e-cypress-for-dummys'`).
 */
export function setSwal2DataCyAttribute(dataCy = 'lib-e2e-cypress-for-dummys'): void {
  document.querySelector('.swal2-container')?.setAttribute('data-cy', dataCy);
  document.querySelector('.swal2-html-container')?.setAttribute('data-cy', dataCy);
  document.querySelector('.swal2-title')?.setAttribute('data-cy', dataCy);
}

/**
 * Fixes a SweetAlert2 popup to an exact pixel height and makes its
 * `.swal2-html-container` fill the remaining space as a flex column, preventing
 * content overflow when the popup hosts a tall custom element.
 *
 * @param popup - The `.swal2-popup` element to resize, or `null` (no-op).
 * @param heightPx - The target height in pixels.
 */
export function ensurePopupDimensions(popup: HTMLElement | null, heightPx: number): void {
  if (!popup) return;
  popup.style.height = `${heightPx}px`;
  const htmlContainer = popup.querySelector('.swal2-html-container') as HTMLElement | null;
  if (!htmlContainer) return;
  htmlContainer.style.flex = '1';
  htmlContainer.style.minHeight = '0';
  htmlContainer.style.overflow = 'hidden';
  htmlContainer.style.padding = '0';
  htmlContainer.style.margin = '0';
  htmlContainer.style.display = 'flex';
  htmlContainer.style.flexDirection = 'column';
}
