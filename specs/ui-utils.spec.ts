import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  injectStyles,
  SCROLLBAR_STYLES,
  LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES,
} from '../src/utils/styles.utils';
import {
  makeModalResizable,
  makeSwalDraggable,
  makeSwalDraggableByContentId,
  setSwal2DataCyAttribute,
} from '../src/utils/modal.utils';
import { showToast } from '../src/utils/toast.utils';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeSwalPopup(header = true): HTMLElement {
  const popup = document.createElement('div');
  popup.className = 'swal2-popup';
  if (header) {
    const h = document.createElement('div');
    h.className = 'swal2-header';
    popup.appendChild(h);
  } else {
    const t = document.createElement('div');
    t.className = 'swal2-title';
    popup.appendChild(t);
  }
  document.body.appendChild(popup);
  return popup;
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('Phase 7 — UI Utilities', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  // ── injectStyles ─────────────────────────────────────────────────────────

  describe('injectStyles', () => {
    it('injects a <style> element with the given id into <head>', () => {
      injectStyles('body { color: red; }', 'test-style');
      const el = document.getElementById('test-style');
      expect(el).not.toBeNull();
      expect(el!.tagName.toLowerCase()).toBe('style');
    });

    it('the style element contains the provided CSS', () => {
      injectStyles('body { color: red; }', 'test-style');
      expect(document.getElementById('test-style')!.innerHTML).toContain('color: red');
    });

    it('calling twice with same id does NOT create a second element', () => {
      injectStyles('a {}', 'dup-style');
      injectStyles('b {}', 'dup-style');
      expect(document.querySelectorAll('#dup-style').length).toBe(1);
    });

    it('calling with different ids creates two separate elements', () => {
      injectStyles('a {}', 'style-one');
      injectStyles('b {}', 'style-two');
      expect(document.getElementById('style-one')).not.toBeNull();
      expect(document.getElementById('style-two')).not.toBeNull();
    });
  });

  // ── constants ─────────────────────────────────────────────────────────────

  describe('style constants', () => {
    it('SCROLLBAR_STYLES is a non-empty string', () => {
      expect(typeof SCROLLBAR_STYLES).toBe('string');
      expect(SCROLLBAR_STYLES.length).toBeGreaterThan(0);
    });

    it('LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES is a non-empty string', () => {
      expect(typeof LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES).toBe('string');
      expect(LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES.length).toBeGreaterThan(0);
    });

    it('SCROLLBAR_STYLES references swal2-popup', () => {
      expect(SCROLLBAR_STYLES).toContain('swal2-popup');
    });

    it('LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES references swal2-container', () => {
      expect(LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES).toContain('swal2-container');
    });
  });

  // ── makeModalResizable ────────────────────────────────────────────────────

  describe('makeModalResizable', () => {
    it('adds a .modal-resizer child to the element', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      expect(el.querySelector('.modal-resizer')).not.toBeNull();
    });

    it('sets resize: both and overflow: hidden on the element', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      expect(el.style.resize).toBe('both');
      expect(el.style.overflow).toBe('hidden');
    });

    it('applies default minWidth of 320px and minHeight of 180px', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      expect(el.style.minWidth).toBe('320px');
      expect(el.style.minHeight).toBe('180px');
    });

    it('applies custom minWidth and minHeight from options', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el, { minWidth: 500, minHeight: 300 });
      expect(el.style.minWidth).toBe('500px');
      expect(el.style.minHeight).toBe('300px');
    });

    it('returns a cleanup function that removes the resizer element', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const cleanup = makeModalResizable(el);
      cleanup();
      expect(el.querySelector('.modal-resizer')).toBeNull();
    });

    it('cleanup function does not throw', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const cleanup = makeModalResizable(el);
      expect(() => cleanup()).not.toThrow();
    });

    it('if .modal-resizer already exists, returns a no-op without adding another', () => {
      const el = document.createElement('div');
      const existing = document.createElement('div');
      existing.className = 'modal-resizer';
      el.appendChild(existing);
      document.body.appendChild(el);
      makeModalResizable(el);
      expect(el.querySelectorAll('.modal-resizer').length).toBe(1);
    });

    it('mousedown on resizer sets userSelect to none', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      const resizer = el.querySelector('.modal-resizer') as HTMLElement;
      resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true, cancelable: true }));
      expect(document.body.style.userSelect).toBe('none');
    });

    it('mousemove on window after mousedown adjusts modal dimensions', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      const resizer = el.querySelector('.modal-resizer') as HTMLElement;
      // Start at (100, 100), move to (150, 160): dx=50, dy=60
      resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 160 }));
      // jsdom getBoundingClientRect() returns 0; result = 0 + delta
      expect(el.style.width).toBe('50px');
      expect(el.style.height).toBe('60px');
    });

    it('mouseup on window stops resizing and restores userSelect', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      const resizer = el.querySelector('.modal-resizer') as HTMLElement;
      resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      expect(document.body.style.userSelect).toBe('none');
      window.dispatchEvent(new MouseEvent('mouseup'));
      expect(document.body.style.userSelect).toBe('');
    });

    it('mousemove after mouseup does not resize (isResizing reset)', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      makeModalResizable(el);
      const resizer = el.querySelector('.modal-resizer') as HTMLElement;
      resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
      const widthAfterStop = el.style.width;
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
      expect(el.style.width).toBe(widthAfterStop);
    });

    it('cleanup removes mousemove and mouseup listeners from window', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const cleanup = makeModalResizable(el);
      const resizer = el.querySelector('.modal-resizer') as HTMLElement;
      resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }));
      cleanup();
      // After cleanup, mouse events should not affect the (now-removed) resizer
      expect(() => window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))).not.toThrow();
    });
  });

  // ── makeSwalDraggable ─────────────────────────────────────────────────────

  describe('makeSwalDraggable', () => {
    it('does nothing when no .swal2-popup exists', () => {
      expect(() => makeSwalDraggable()).not.toThrow();
    });

    it('sets cursor: move on .swal2-header inside the last popup', () => {
      makeSwalPopup(true);
      makeSwalDraggable();
      const header = document.querySelector('.swal2-header') as HTMLElement;
      expect(header.style.cursor).toBe('move');
    });

    it('falls back to .swal2-title when no .swal2-header is present', () => {
      makeSwalPopup(false);
      makeSwalDraggable();
      const title = document.querySelector('.swal2-title') as HTMLElement;
      expect(title.style.cursor).toBe('move');
    });

    it('acts on the LAST popup when multiple exist', () => {
      makeSwalPopup(true);
      makeSwalPopup(true);
      makeSwalDraggable();
      const headers = document.querySelectorAll('.swal2-header') as NodeListOf<HTMLElement>;
      expect(headers[1].style.cursor).toBe('move');
      expect(headers[0].style.cursor).not.toBe('move');
    });

    it('mousedown on drag area positions popup as fixed and sets up move/up handlers', () => {
      const popup = makeSwalPopup(true);
      makeSwalDraggable();
      const header = popup.querySelector('.swal2-header') as HTMLElement;
      header.onmousedown!(new MouseEvent('mousedown', { clientX: 50, clientY: 60 }));
      expect(document.onmousemove).not.toBeNull();
      expect(document.onmouseup).not.toBeNull();
    });

    it('mousemove after mousedown moves the popup', () => {
      const popup = makeSwalPopup(true);
      makeSwalDraggable();
      const header = popup.querySelector('.swal2-header') as HTMLElement;
      header.onmousedown!(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
      document.onmousemove!(new MouseEvent('mousemove', { clientX: 40, clientY: 80 }));
      expect(popup.style.position).toBe('fixed');
      expect(popup.style.left).toBe('40px');
      expect(popup.style.top).toBe('80px');
    });

    it('mouseup after drag resets isDragging and clears document handlers', () => {
      const popup = makeSwalPopup(true);
      makeSwalDraggable();
      const header = popup.querySelector('.swal2-header') as HTMLElement;
      header.onmousedown!(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
      document.onmouseup!();
      expect(document.onmousemove).toBeNull();
      expect(document.onmouseup).toBeNull();
    });

    it('does nothing if the popup has no valid drag area (.swal2-header or .swal2-title)', () => {
      const popup = document.createElement('div');
      popup.className = 'swal2-popup';
      document.body.appendChild(popup);
      expect(() => makeSwalDraggable()).not.toThrow();
    });
  });

  // ── makeSwalDraggableByContentId ──────────────────────────────────────────

  describe('makeSwalDraggableByContentId', () => {
    it('does not throw when contentId element does not exist', () => {
      expect(() => makeSwalDraggableByContentId('nonexistent')).not.toThrow();
    });

    it('falls back to makeSwalDraggable when contentId not found (sets cursor on popup header)', () => {
      makeSwalPopup(true);
      makeSwalDraggableByContentId('nonexistent');
      const header = document.querySelector('.swal2-header') as HTMLElement;
      expect(header.style.cursor).toBe('move');
    });

    it('finds the popup containing the contentId element', () => {
      const popup = document.createElement('div');
      popup.className = 'swal2-popup';
      const header = document.createElement('div');
      header.className = 'swal2-header';
      popup.appendChild(header);
      const content = document.createElement('div');
      content.id = 'my-content';
      popup.appendChild(content);
      document.body.appendChild(popup);

      makeSwalDraggableByContentId('my-content');
      expect(header.style.cursor).toBe('move');
    });

    it('falls back to document.querySelector when content exists but has no .swal2-popup ancestor', () => {
      // popup exists in DOM but content is NOT inside it
      const popup = makeSwalPopup(true);
      const orphan = document.createElement('div');
      orphan.id = 'orphan-content';
      document.body.appendChild(orphan);

      makeSwalDraggableByContentId('orphan-content');
      const header = popup.querySelector('.swal2-header') as HTMLElement;
      expect(header.style.cursor).toBe('move');
    });
  });

  // ── setSwal2DataCyAttribute ───────────────────────────────────────────────

  describe('setSwal2DataCyAttribute', () => {
    beforeEach(() => {
      const container = document.createElement('div');
      container.className = 'swal2-container';
      const htmlContainer = document.createElement('div');
      htmlContainer.className = 'swal2-html-container';
      const title = document.createElement('div');
      title.className = 'swal2-title';
      document.body.appendChild(container);
      document.body.appendChild(htmlContainer);
      document.body.appendChild(title);
    });

    it('sets data-cy on .swal2-container', () => {
      setSwal2DataCyAttribute('my-test');
      expect(document.querySelector('.swal2-container')!.getAttribute('data-cy')).toBe('my-test');
    });

    it('sets data-cy on .swal2-html-container', () => {
      setSwal2DataCyAttribute('my-test');
      expect(document.querySelector('.swal2-html-container')!.getAttribute('data-cy')).toBe('my-test');
    });

    it('sets data-cy on .swal2-title', () => {
      setSwal2DataCyAttribute('my-test');
      expect(document.querySelector('.swal2-title')!.getAttribute('data-cy')).toBe('my-test');
    });

    it('defaults to "lib-e2e-cypress-for-dummys" when called with no args', () => {
      setSwal2DataCyAttribute();
      expect(document.querySelector('.swal2-container')!.getAttribute('data-cy')).toBe(
        'lib-e2e-cypress-for-dummys'
      );
    });
  });

  // ── showToast ─────────────────────────────────────────────────────────────

  describe('showToast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('creates an element in the DOM with the message text', () => {
      showToast('Hello World');
      expect(document.body.textContent).toContain('Hello World');
    });

    it('uses green background for success (default)', () => {
      showToast('ok');
      const toast = document.body.lastElementChild as HTMLElement;
      // jsdom normalises hex to rgb
      expect(toast.style.background).toMatch(/#4caf50|rgb\(76,\s*175,\s*80\)/);
    });

    it('uses red background when isSuccess is false', () => {
      showToast('error', false);
      const toast = document.body.lastElementChild as HTMLElement;
      expect(toast.style.background).toMatch(/#f44336|rgb\(244,\s*67,\s*54\)/);
    });

    it('removes the toast element after 3000ms', () => {
      showToast('Bye');
      expect(document.body.textContent).toContain('Bye');
      vi.advanceTimersByTime(3000);
      expect(document.body.textContent).not.toContain('Bye');
    });

    it('toast is still present before 3000ms', () => {
      showToast('Still here');
      vi.advanceTimersByTime(2999);
      expect(document.body.textContent).toContain('Still here');
    });
  });
});
