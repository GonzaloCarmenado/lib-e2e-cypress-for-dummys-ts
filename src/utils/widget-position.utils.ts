/**
 * Geometry helpers for the draggable recording widget (spec 007).
 * Pure functions — no DOM — so the drag/clamp/expansion logic is unit-testable
 * without real layout (jsdom returns 0-sized rects).
 */

export type ExpandDirection = 'up-left' | 'up-right' | 'down-left' | 'down-right';

export interface Point {
  x: number;
  y: number;
}

/** Toggle radius (44/2) + small gap, so the toggle never touches the edge. */
export const TOGGLE_MARGIN = 30;

/** Pixels the pointer must travel before a press becomes a drag (vs a click). */
export const DRAG_THRESHOLD = 5;

/** Distance, in px, from the bottom-right edges of the original (default) anchor. */
const DEFAULT_EDGE_OFFSET = 46;

/**
 * Toggle-centre offset inside the 190×190 widget box, per expansion direction.
 * The toggle sits at the box corner nearest the screen edge so the arc always
 * expands toward the viewport interior (and stays inside the box / on screen).
 */
export function boxOffsetForDirection(dir: ExpandDirection): Point {
  return {
    x: dir.endsWith('left') ? 144 : 46,
    y: dir.startsWith('up') ? 144 : 46,
  };
}

/** Clamps the toggle-centre so the toggle button stays fully on screen. */
export function clampTogglePosition(
  x: number,
  y: number,
  vw: number,
  vh: number,
  margin: number = TOGGLE_MARGIN,
): Point {
  const maxX = Math.max(margin, vw - margin);
  const maxY = Math.max(margin, vh - margin);
  return {
    x: Math.min(Math.max(x, margin), maxX),
    y: Math.min(Math.max(y, margin), maxY),
  };
}

/**
 * Chooses the radial expansion direction so the menu opens toward the centre of
 * the viewport (top half → expand down; left half → expand right).
 */
export function resolveExpandDirection(x: number, y: number, vw: number, vh: number): ExpandDirection {
  const vertical = y < vh / 2 ? 'down' : 'up';
  const horizontal = x < vw / 2 ? 'right' : 'left';
  return `${vertical}-${horizontal}` as ExpandDirection;
}

/** Default toggle-centre (bottom-right corner), matching the original CSS anchor. */
export function defaultTogglePosition(vw: number, vh: number): Point {
  return { x: vw - DEFAULT_EDGE_OFFSET, y: vh - DEFAULT_EDGE_OFFSET };
}

/** Box top-left for a given (clamped) toggle-centre and direction. */
export function boxTopLeftFor(toggleCentre: Point, dir: ExpandDirection): Point {
  const off = boxOffsetForDirection(dir);
  return { x: toggleCentre.x - off.x, y: toggleCentre.y - off.y };
}
