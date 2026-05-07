import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/selector-picker/selector-picker';
import type { SelectorPickerElement } from '../../src/components/selector-picker/selector-picker';
import { RecordingService } from '../../src/services/recording.service';
import { TranslationService } from '../../src/services/translation.service';

function makeAncestor(tag: string, attrs: Record<string, string> = {}, cls = ''): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (cls) e.className = cls;
  return e;
}

function buildPicker(): SelectorPickerElement {
  return document.createElement('selector-picker') as SelectorPickerElement;
}

describe('Phase 10 — SelectorPickerElement', () => {
  let picker: SelectorPickerElement;
  let recording: RecordingService;
  let translation: TranslationService;
  let target: HTMLElement;

  beforeEach(() => {
    recording = new RecordingService();
    translation = new TranslationService();
    // A deeply-nested target with no testable selector
    target = makeAncestor('span');
    document.body.appendChild(target);
  });

  afterEach(() => {
    picker?.remove();
    target?.remove();
    recording.destroy();
    vi.restoreAllMocks();
  });

  it('registers as <selector-picker> custom element', () => {
    expect(customElements.get('selector-picker')).toBeDefined();
  });

  // ── AC-04: ancestor chain ──────────────────────────────────────────────────

  describe('ancestor chain', () => {
    it('builds ancestors from target up to body (not html)', () => {
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect(ancestors.length).toBeGreaterThan(0);
      expect(ancestors.some((a) => a.tagName.toLowerCase() === 'html')).toBe(false);
    });

    it('caps ancestor chain at 10', () => {
      // Build a deeply nested structure (15 levels)
      let parent = document.body;
      for (let i = 0; i < 15; i++) {
        const d = document.createElement('div');
        parent.appendChild(d);
        parent = d;
      }
      const deepTarget = document.createElement('span');
      parent.appendChild(deepTarget);

      picker = buildPicker();
      picker.targetElement = deepTarget;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect(ancestors.length).toBeLessThanOrEqual(10);

      // cleanup
      deepTarget.remove();
      // parents are inside body so body.innerHTML cleanup not needed here — picker.remove() in afterEach
    });

    it('excludes elements with data-cy="lib-e2e-cypress-for-dummys" (own host)', () => {
      const host = document.createElement('div');
      host.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
      document.body.appendChild(host);
      const child = document.createElement('span');
      host.appendChild(child);

      picker = buildPicker();
      picker.targetElement = child;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect(ancestors.some((a) => a.getAttribute('data-cy') === 'lib-e2e-cypress-for-dummys')).toBe(false);

      host.remove();
    });
  });

  // ── AC-07: auto-select best ancestor on open ───────────────────────────────

  describe('auto-selection on open', () => {
    it('pre-selects first ancestor with quality >= acceptable', () => {
      const wrapper = makeAncestor('div', {}, 'wrapper-class');
      const inner = makeAncestor('span');
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);

      picker = buildPicker();
      picker.targetElement = inner;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      const idx = (picker as any).selectedIndex as number;
      const ancestors = (picker as any).ancestors as HTMLElement[];
      // the wrapper (with class) should be selected, not the span (poor)
      expect(ancestors[idx]?.className).toBe('wrapper-class');

      wrapper.remove();
    });

    it('starts at index 0 when every ancestor is poor', () => {
      // target with no styled ancestors
      const plain = makeAncestor('div');
      const child = makeAncestor('span');
      plain.appendChild(child);
      document.body.appendChild(plain);

      picker = buildPicker();
      picker.targetElement = child;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      expect((picker as any).selectedIndex).toBe(0);

      plain.remove();
    });
  });

  // ── AC-06 / AC-05: quality classification rendered ────────────────────────

  describe('rendering', () => {
    it('renders a row for each ancestor', () => {
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      const rows = picker.shadowRoot!.querySelectorAll('[data-idx]');
      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect(rows.length).toBe(ancestors.length);
    });

    it('renders quality badge per row', () => {
      const wrapper = makeAncestor('div', { 'data-cy': 'parent' });
      const child = makeAncestor('span');
      wrapper.appendChild(child);
      document.body.appendChild(wrapper);

      picker = buildPicker();
      picker.targetElement = child;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      const badges = picker.shadowRoot!.querySelectorAll('.quality-badge');
      expect(badges.length).toBeGreaterThan(0);

      wrapper.remove();
    });
  });

  // ── AC-07: keyboard navigation ─────────────────────────────────────────────

  describe('keyboard navigation', () => {
    beforeEach(() => {
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);
    });

    it('moves selectedIndex down on ArrowDown', () => {
      const before = (picker as any).selectedIndex as number;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const after = (picker as any).selectedIndex as number;
      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect(after).toBe((before + 1) % ancestors.length);
    });

    it('moves selectedIndex up on ArrowUp', () => {
      (picker as any).selectedIndex = 0;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect((picker as any).selectedIndex).toBe(ancestors.length - 1);
    });

    it('wraps from last to first on ArrowDown', () => {
      const ancestors = (picker as any).ancestors as HTMLElement[];
      (picker as any).selectedIndex = ancestors.length - 1;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect((picker as any).selectedIndex).toBe(0);
    });

    it('wraps from first to last on ArrowUp', () => {
      (picker as any).selectedIndex = 0;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const ancestors = (picker as any).ancestors as HTMLElement[];
      expect((picker as any).selectedIndex).toBe(ancestors.length - 1);
    });
  });

  // ── AC-08: confirm ─────────────────────────────────────────────────────────

  describe('confirm (Enter / row click)', () => {
    beforeEach(() => {
      recording.startRecording();
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);
    });

    it('dispatches selectorchosen on Enter', () => {
      let detail: string | null = null;
      picker.addEventListener('selectorchosen', (e) => { detail = (e as CustomEvent).detail; });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(detail).not.toBeNull();
      expect(detail).toContain('cy.get(');
    });

    it('appends cy.get().click() command to recording on Enter', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const cmds = recording.getCommandsSnapshot();
      expect(cmds.some((c) => c.includes('.click()'))).toBe(true);
    });

    it('removes picker from DOM on Enter', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(document.body.contains(picker)).toBe(false);
    });

    it('dispatches selectorchosen on row click', () => {
      let fired = false;
      picker.addEventListener('selectorchosen', () => { fired = true; });
      const row = picker.shadowRoot!.querySelector('[data-idx]') as HTMLElement;
      row?.click();
      expect(fired).toBe(true);
    });

    it('removes picker from DOM on row click', () => {
      const row = picker.shadowRoot!.querySelector('[data-idx]') as HTMLElement;
      row?.click();
      expect(document.body.contains(picker)).toBe(false);
    });
  });

  // ── AC-09: cancel ──────────────────────────────────────────────────────────

  describe('cancel (Escape / outside click)', () => {
    beforeEach(() => {
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);
    });

    it('dispatches pickercancelled on Escape', () => {
      let fired = false;
      picker.addEventListener('pickercancelled', () => { fired = true; });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(fired).toBe(true);
    });

    it('removes picker from DOM on Escape', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(document.body.contains(picker)).toBe(false);
    });

    it('does not add any command on Escape', () => {
      recording.startRecording();
      const before = recording.getCommandsSnapshot().length;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(recording.getCommandsSnapshot().length).toBe(before);
    });

    it('removes keyboard listener after close (no double-fire)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Re-attach a new picker to measure only the old one is gone
      let fired = false;
      picker.addEventListener('pickercancelled', () => { fired = true; });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(fired).toBe(false); // picker already removed, event should not re-fire
    });
  });

  // ── AC-10: auto-close on recording stop / pause ───────────────────────────

  describe('auto-close on recording change', () => {
    it('closes silently when recording stops', () => {
      recording.startRecording();
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      let cancelFired = false;
      picker.addEventListener('pickercancelled', () => { cancelFired = true; });

      recording.stopRecording();

      expect(document.body.contains(picker)).toBe(false);
      expect(cancelFired).toBe(false);
    });

    it('closes silently when recording pauses', () => {
      recording.startRecording();
      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      recording.pauseRecording();

      expect(document.body.contains(picker)).toBe(false);
    });

    it('does not add a command when auto-closing on stop', () => {
      recording.startRecording();
      const before = recording.getCommandsSnapshot().length;

      picker = buildPicker();
      picker.targetElement = target;
      picker.recording = recording;
      picker.translation = translation;
      document.body.appendChild(picker);

      recording.stopRecording();

      expect(recording.getCommandsSnapshot().length).toBe(before);
    });
  });
});
