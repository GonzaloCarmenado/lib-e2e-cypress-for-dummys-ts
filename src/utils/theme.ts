/**
 * Design tokens for the lib-e2e recorder widget.
 *
 * Import from here instead of hard-coding hex values in *.styles.ts files.
 * A single change here propagates to every component automatically.
 */

/** GitHub dark-mode colour palette. */
export const THEME = {
  color: {
    // ── Backgrounds ─────────────────────────────────────────────────────────
    /** Darkest surface: inputs, code blocks, sidebar. */
    bgInput: '#0d1117',
    /** Panel / card surface. */
    bgCard: '#161b22',

    // ── Borders ─────────────────────────────────────────────────────────────
    /** Subtle border (default, non-interactive). */
    border: '#21262d',
    /** Muted border on hover, also used as scrollbar thumb colour. */
    borderHover: '#30363d',

    // ── Text ────────────────────────────────────────────────────────────────
    /** Dimmed text: placeholders, empty states, timestamps. */
    textMuted: '#484f58',
    /** Secondary labels, icon buttons, helper text. */
    textSecondary: '#8b949e',
    /** Body text, code. */
    textBody: '#c9d1d9',
    /** Primary headings and prominent text. */
    textPrimary: '#e6edf3',

    // ── Accents — blue ──────────────────────────────────────────────────────
    /** Primary interactive accent. */
    blue: '#2f81f7',
    /** Darker blue for hover / gradient end. */
    blueDark: '#1f6feb',
    /** Lighter blue for selection outlines. */
    blueLight: '#388bfd',

    // ── Accents — green ─────────────────────────────────────────────────────
    /** Success / "new file" button. */
    green: '#238636',
    /** Green hover state. */
    greenHover: '#2ea043',
    /** Lighter green for save buttons and diff additions. */
    greenLight: '#3fb950',

    // ── Accents — red ───────────────────────────────────────────────────────
    /** Danger / error. */
    red: '#f85149',
    /** Darker red for gradient end (recording button). */
    redDark: '#da3633',

    // ── Accents — yellow / amber ────────────────────────────────────────────
    /** Ticket badges, paused state. */
    yellow: '#d29922',
    /** Lighter amber (paused badge, launch button). */
    yellowLight: '#e3b341',
    /** Darker amber (folder-button border/hover). */
    yellowDark: '#9e6a03',

    // ── Accents — purple ────────────────────────────────────────────────────
    /** Insert / special action button. */
    purple: '#a371f7',

    // ── Syntax highlighting ─────────────────────────────────────────────────
    shKeyword: '#ff7b72',
    shBuiltin: '#d2a8ff',
    shString: '#a5d6ff',
    /** Alternate string colour (interceptor code blocks). */
    shStringAlt: '#85e89d',
    shNumber: '#79c0ff',
    /** Selector preview in the picker. */
    shSelector: '#58a6ff',
  },

  zIndex: {
    /** Full-viewport overlay: selector-picker host, recorder FAB, REC badge. */
    overlay: 2147483647,
    /** In-widget modal (export panel, login-setup panel). */
    modal: 100000,
    /** SweetAlert2 container override. */
    swal2: 99999,
  },
} as const;

/**
 * Generates CSS rules that apply the standard thin scrollbar style to a selector.
 * Use this as a tagged-template interpolation inside any Shadow DOM stylesheet.
 *
 * @param selector - CSS selector to apply scrollbar styles to (e.g. `'.list'`).
 * @param size - Track width/height in pixels (default `4`).
 * @returns Multi-line CSS string with both standard and WebKit rules.
 *
 * @example
 * ```ts
 * const STYLES = `
 *   .list { overflow-y: auto; }
 *   ${scrollbar('.list')}
 * `;
 * ```
 */
export function scrollbar(selector: string, size = 4): string {
  const c = THEME.color.borderHover;
  return `
  ${selector} { scrollbar-width: thin; scrollbar-color: ${c} transparent; }
  ${selector}::-webkit-scrollbar { width: ${size}px; height: ${size}px; }
  ${selector}::-webkit-scrollbar-thumb { background: ${c}; border-radius: 2px; }`;
}

/**
 * Inline scrollbar CSS properties (no selector wrapper).
 * Embed inside an existing rule when only the standard (non-WebKit) scrollbar
 * properties are needed or when the WebKit rule is authored separately.
 *
 * @example
 * ```ts
 * const STYLES = `
 *   :host { overflow-y: auto; ${SCROLLBAR_INLINE} }
 * `;
 * ```
 */
export const SCROLLBAR_INLINE = `scrollbar-width: thin; scrollbar-color: ${THEME.color.borderHover} transparent;` as const;
