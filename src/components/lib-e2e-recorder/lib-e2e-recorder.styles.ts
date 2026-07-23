import type { ExpandDirection } from '../../utils/widget-position.utils';
import { THEME } from '../../utils/theme';

const DIRECTIONS: ExpandDirection[] = ['up-left', 'up-right', 'down-left', 'down-right'];

/**
 * Per-direction anchors for the toggle/pause buttons and the action-menu popover.
 * The menu opens on the side of the FAB that faces the viewport interior, so it
 * stays on-screen wherever the (draggable) widget is dropped (spec 007 + 012).
 */
function directionBlocks(): string {
  return DIRECTIONS.map((dir) => {
    const tv = dir.startsWith('up') ? 'bottom' : 'top';   // FAB vertical side
    const th = dir.endsWith('left') ? 'right' : 'left';    // FAB horizontal side
    const ov = tv === 'bottom' ? 'top' : 'bottom';
    const oh = th === 'right' ? 'left' : 'right';
    const sel = `.widget[data-expand="${dir}"]`;
    return `
      ${sel} .btn-toggle  { ${tv}: 24px; ${th}: 24px; ${ov}: auto; ${oh}: auto; }
      ${sel} .btn-pause   { ${tv}: 78px; ${th}: 24px; ${ov}: auto; ${oh}: auto; }
      ${sel} .action-menu { ${tv}: 118px; ${th}: 8px; ${ov}: auto; ${oh}: auto; transform-origin: ${tv} ${th}; }
    `;
  }).join('\n');
}

export function getRecorderStyles(rec: boolean, paused: boolean): string {
  return `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }

    /*
     * Hit area. Position (left/top) is set from JS so the widget can be dragged;
     * data-expand orients the action-menu popover toward the viewport interior.
     * The menu is a DOM child, so hovering it keeps :host(.widget):hover alive even
     * though it visually overflows this box. Defaults to bottom-right.
     */
    .widget {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 190px;
      height: 190px;
      z-index: ${THEME.zIndex.overlay};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Toggle (FAB) ─────────────────────────────────── */
    .btn-toggle {
      position: absolute;
      bottom: 24px;
      right: 24px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      cursor: grab;
      touch-action: none;
      font-size: 19px;
      background: ${rec
        ? `linear-gradient(135deg,${THEME.color.red} 0%,${THEME.color.redDark} 100%)`
        : `linear-gradient(135deg,${THEME.color.blue} 0%,${THEME.color.blueDark} 100%)`};
      color: #fff;
      box-shadow: ${rec
        ? '0 4px 20px rgba(248,81,73,.55),0 0 0 4px rgba(248,81,73,.13)'
        : '0 4px 20px rgba(47,129,247,.45),0 0 0 4px rgba(47,129,247,.11)'};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .18s, box-shadow .2s;
      z-index: 2;
      ${rec ? 'animation: toggle-pulse 2s ease-in-out infinite;' : ''}
    }
    .btn-toggle:hover  { transform: scale(1.1); }
    .btn-toggle:active { transform: scale(0.93); cursor: grabbing; }

    @keyframes toggle-pulse {
      0%,100% { box-shadow: 0 4px 20px rgba(248,81,73,.55),0 0 0 4px rgba(248,81,73,.13); }
      50%      { box-shadow: 0 6px 28px rgba(248,81,73,.75),0 0 0 8px rgba(248,81,73,.06); }
    }

    /* ── Pause button ────────────────────────────────── */
    .btn-pause {
      position: absolute;
      bottom: 78px;
      right: 24px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 15px;
      display: ${rec ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      background: ${paused
        ? `linear-gradient(135deg,${THEME.color.blue} 0%,${THEME.color.blueDark} 100%)`
        : 'rgba(13,17,23,0.85)'};
      color: ${paused ? '#fff' : THEME.color.yellowLight};
      box-shadow: 0 2px 12px rgba(0,0,0,.4), 0 0 0 1px rgba(48,54,61,.8);
      transition: transform .15s, background .2s, color .2s;
      z-index: 2;
    }
    .btn-pause:hover { transform: scale(1.12); }
    .btn-pause:active { transform: scale(0.93); }

    /* ── Action menu (labelled grid popover) ─────────── */
    .action-menu {
      position: absolute;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      padding: 8px;
      width: 174px;
      background: rgba(13,17,23,.97);
      border: 1px solid rgba(48,54,61,.9);
      border-radius: 12px;
      box-shadow: 0 8px 28px rgba(0,0,0,.5);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      opacity: 0;
      transform: scale(0.9);
      pointer-events: none;
      transition: opacity .16s, transform .2s cubic-bezier(.34,1.56,.64,1);
      z-index: 3;
    }
    .widget:hover .action-menu {
      opacity: 1;
      transform: scale(1);
      pointer-events: all;
    }

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 3px;
      padding: 8px 4px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: transparent;
      color: ${THEME.color.textBody};
      font-size: 18px;
      line-height: 1;
      transition: background .12s;
    }
    .action-item:hover { background: ${THEME.color.border}; }
    .action-item .label {
      font-size: 9px;
      font-weight: 500;
      color: ${THEME.color.textSecondary};
      white-space: nowrap;
    }
    .action-item:hover .label { color: ${THEME.color.textPrimary}; }

    /* Per-direction anchors */
    ${directionBlocks()}

    /* ── REC / PAUSED badge ──────────────────────────── */
    .rec-badge {
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: ${paused
        ? `linear-gradient(90deg,${THEME.color.yellowLight},${THEME.color.yellow})`
        : `linear-gradient(90deg,${THEME.color.red},${THEME.color.redDark})`};
      color: #fff;
      padding: 3px 16px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      z-index: ${THEME.zIndex.overlay};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: ${paused
        ? '0 4px 16px rgba(227,179,65,.4)'
        : '0 4px 16px rgba(248,81,73,.4)'};
      display: ${rec ? 'block' : 'none'};
      ${!paused ? 'animation: rec-pulse 1.8s ease-in-out infinite;' : ''}
    }
    @keyframes rec-pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.6; }
    }
  `;
}
