import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/help-panel/help-panel';
import type { HelpPanelElement } from '../../src/components/help-panel/help-panel';
import { TranslationService } from '../../src/services/translation.service';

describe('Phase 8.8 — HelpPanelElement (spec 011)', () => {
  let el: HelpPanelElement;
  let translation: TranslationService;

  beforeEach(() => {
    translation = new TranslationService();
    el = document.createElement('help-panel') as HelpPanelElement;
    el.translation = translation;
    document.body.appendChild(el);
  });

  afterEach(() => { el.remove(); });

  it('registers as <help-panel> custom element', () => {
    expect(customElements.get('help-panel')).toBeDefined();
  });

  it('renders the 8 categorised sections', () => {
    expect(el.shadowRoot!.querySelectorAll('.help-sec-hd').length).toBe(8);
  });

  it('renders the intro and a good number of items', () => {
    expect(el.shadowRoot!.querySelector('.help-intro')).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll('.help-list li').length).toBeGreaterThan(10);
  });

  it('includes the keyboard shortcuts (Ctrl+R, Ctrl+Shift+H)', () => {
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Ctrl+R');
    expect(text).toContain('Ctrl+Shift+H');
  });

  it('mentions the Alt+click assertion tip', () => {
    expect(el.shadowRoot!.textContent ?? '').toContain('Alt+click');
  });

  it('falls back to a default translation service when none is injected', () => {
    const el2 = document.createElement('help-panel') as HelpPanelElement;
    document.body.appendChild(el2);
    expect(el2.shadowRoot!.querySelectorAll('.help-sec').length).toBe(8);
    el2.remove();
  });

  // ── tabs: reference + usage guide ─────────────────────────────────────────

  it('renders two tabs with reference active by default', () => {
    const tabs = el.shadowRoot!.querySelectorAll('.help-tab');
    expect(tabs.length).toBe(2);
    expect(el.shadowRoot!.querySelector('.help-tab.active')?.getAttribute('data-tab')).toBe('reference');
  });

  it('switching to the Guide tab shows the usage guide (workflow + coverage)', () => {
    (el.shadowRoot!.querySelector('[data-tab="guide"]') as HTMLElement).click();
    // guide has 3 sections (workflow / covered / not-covered)
    expect(el.shadowRoot!.querySelectorAll('.help-sec-hd').length).toBe(3);
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Workflow');
    expect(text).toContain('NOT cover');
    expect(el.shadowRoot!.querySelector('.help-tab.active')?.getAttribute('data-tab')).toBe('guide');
  });

  it('switching back to Reference restores the cheat-sheet', () => {
    (el.shadowRoot!.querySelector('[data-tab="guide"]') as HTMLElement).click();
    (el.shadowRoot!.querySelector('[data-tab="reference"]') as HTMLElement).click();
    expect(el.shadowRoot!.querySelectorAll('.help-sec-hd').length).toBe(8);
  });
});
