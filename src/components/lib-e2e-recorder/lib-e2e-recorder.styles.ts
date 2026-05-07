export function getRecorderStyles(rec: boolean, paused: boolean): string {
  return `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }

    /*
     * Invisible 190×190 hit area anchored at bottom-right.
     * Keeps :hover alive while the cursor travels from the
     * toggle to any of the radial action buttons.
     */
    .widget {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 190px;
      height: 190px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Toggle ──────────────────────────────────────── */
    .btn-toggle {
      position: absolute;
      bottom: 24px;
      right: 24px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 19px;
      background: ${rec
        ? 'linear-gradient(135deg,#f85149 0%,#da3633 100%)'
        : 'linear-gradient(135deg,#2f81f7 0%,#1f6feb 100%)'};
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
    .btn-toggle:active { transform: scale(0.93); }

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
        ? 'linear-gradient(135deg,#2f81f7 0%,#1f6feb 100%)'
        : 'rgba(13,17,23,0.85)'};
      color: ${paused ? '#fff' : '#e3b341'};
      box-shadow: 0 2px 12px rgba(0,0,0,.4), 0 0 0 1px rgba(48,54,61,.8);
      transition: transform .15s, background .2s, color .2s;
      z-index: 2;
    }
    .btn-pause:hover { transform: scale(1.12); }
    .btn-pause:active { transform: scale(0.93); }

    /* ── Action buttons ──────────────────────────────── */
    /*
     * All three start centered on the toggle button
     * (toggle center = bottom:46px right:46px from widget edge;
     *  button half = 18px → bottom:28px right:28px).
     */
    .btn-action {
      position: absolute;
      bottom: 28px;
      right: 28px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(13,17,23,.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: #8b949e;
      box-shadow: 0 4px 18px rgba(0,0,0,.45), 0 0 0 1px rgba(48,54,61,.75);
      opacity: 0;
      transform: scale(0.35);
      pointer-events: none;
      /* Collapse: fast, no spring */
      transition: opacity .15s, transform .18s ease-in,
                  background .15s, color .12s, box-shadow .15s;
    }

    /* Label to the left of each button */
    .btn-action::after {
      content: attr(data-label);
      position: absolute;
      right: calc(100% + 9px);
      top: 50%;
      transform: translateY(-50%);
      background: rgba(13,17,23,.95);
      color: #e6edf3;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 9px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s .05s;
      border: 1px solid rgba(48,54,61,.8);
      box-shadow: 0 2px 8px rgba(0,0,0,.35);
    }
    /* Button 1 (top) — label above instead of left to avoid overlap with btn 2 */
    .btn-action[data-n="1"]::after {
      right: auto;
      left: 50%;
      top: auto;
      bottom: calc(100% + 9px);
      transform: translateX(-50%);
    }
    .btn-action:hover::after   { opacity: 1; }
    .btn-action:hover          { background: #21262d; color: #e6edf3; }
    .btn-action:active         { background: #30363d !important; }

    /* Expand: spring + stagger */
    .widget:hover .btn-action {
      opacity: 1;
      pointer-events: all;
      transition: opacity .2s, transform .32s cubic-bezier(.34,1.56,.64,1),
                  background .15s, color .12s, box-shadow .15s;
    }

    /* Arc positions — 4 buttons, 30° spacing, radius 90px */
    .widget:hover .btn-action[data-n="1"] {   /* 0°  — straight up   */
      transform: translateY(-90px) scale(1);
      transition-delay: .03s;
    }
    .widget:hover .btn-action[data-n="2"] {   /* 30° — upper-left    */
      transform: translate(-45px,-78px) scale(1);
      transition-delay: .07s;
    }
    .widget:hover .btn-action[data-n="3"] {   /* 60° — left-upper    */
      transform: translate(-78px,-45px) scale(1);
      transition-delay: .11s;
    }
    .widget:hover .btn-action[data-n="4"] {   /* 90° — straight left */
      transform: translateX(-90px) scale(1);
      transition-delay: .15s;
    }
    /* Button 4 (pure left) — label above to avoid going off-screen */
    .btn-action[data-n="4"]::after {
      right: auto;
      left: 50%;
      top: auto;
      bottom: calc(100% + 9px);
      transform: translateX(-50%);
    }

    /* ── REC / PAUSED badge ──────────────────────────── */
    .rec-badge {
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: ${paused
        ? 'linear-gradient(90deg,#e3b341,#d29922)'
        : 'linear-gradient(90deg,#f85149,#da3633)'};
      color: #fff;
      padding: 3px 16px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      z-index: 2147483647;
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
