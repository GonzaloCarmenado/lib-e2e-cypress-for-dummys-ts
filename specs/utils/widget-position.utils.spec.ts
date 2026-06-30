import { describe, it, expect } from 'vitest';
import {
  clampTogglePosition,
  resolveExpandDirection,
  defaultTogglePosition,
  boxOffsetForDirection,
  boxTopLeftFor,
  TOGGLE_MARGIN,
  DRAG_THRESHOLD,
} from '../../src/utils/widget-position.utils';

describe('widget-position.utils (spec 007)', () => {
  describe('clampTogglePosition', () => {
    it('leaves an interior point unchanged', () => {
      expect(clampTogglePosition(500, 400, 1000, 800)).toEqual({ x: 500, y: 400 });
    });

    it('clamps a point past the right/bottom edges inward by the margin', () => {
      const p = clampTogglePosition(2000, 2000, 1000, 800);
      expect(p).toEqual({ x: 1000 - TOGGLE_MARGIN, y: 800 - TOGGLE_MARGIN });
    });

    it('clamps a negative point to the margin', () => {
      expect(clampTogglePosition(-50, -10, 1000, 800)).toEqual({ x: TOGGLE_MARGIN, y: TOGGLE_MARGIN });
    });
  });

  describe('resolveExpandDirection', () => {
    const vw = 1000;
    const vh = 800;
    it('bottom-right quadrant expands up-left', () => {
      expect(resolveExpandDirection(900, 700, vw, vh)).toBe('up-left');
    });
    it('bottom-left quadrant expands up-right', () => {
      expect(resolveExpandDirection(100, 700, vw, vh)).toBe('up-right');
    });
    it('top-right quadrant expands down-left', () => {
      expect(resolveExpandDirection(900, 100, vw, vh)).toBe('down-left');
    });
    it('top-left quadrant expands down-right', () => {
      expect(resolveExpandDirection(100, 100, vw, vh)).toBe('down-right');
    });
  });

  describe('defaultTogglePosition', () => {
    it('is anchored near the bottom-right corner', () => {
      expect(defaultTogglePosition(1000, 800)).toEqual({ x: 954, y: 754 });
    });

    it('resolves to up-left expansion (matches the original arc)', () => {
      const p = defaultTogglePosition(1000, 800);
      expect(resolveExpandDirection(p.x, p.y, 1000, 800)).toBe('up-left');
    });
  });

  describe('boxOffsetForDirection', () => {
    it('puts the toggle at the bottom-right of the box for up-left', () => {
      expect(boxOffsetForDirection('up-left')).toEqual({ x: 144, y: 144 });
    });
    it('puts the toggle at the top-left of the box for down-right', () => {
      expect(boxOffsetForDirection('down-right')).toEqual({ x: 46, y: 46 });
    });
    it('mixes axes for up-right / down-left', () => {
      expect(boxOffsetForDirection('up-right')).toEqual({ x: 46, y: 144 });
      expect(boxOffsetForDirection('down-left')).toEqual({ x: 144, y: 46 });
    });
  });

  describe('boxTopLeftFor', () => {
    it('subtracts the direction offset from the toggle centre', () => {
      expect(boxTopLeftFor({ x: 200, y: 200 }, 'up-left')).toEqual({ x: 56, y: 56 });
      expect(boxTopLeftFor({ x: 200, y: 200 }, 'down-right')).toEqual({ x: 154, y: 154 });
    });
  });

  describe('constants', () => {
    it('exposes a sensible drag threshold and margin', () => {
      expect(DRAG_THRESHOLD).toBeGreaterThan(0);
      expect(TOGGLE_MARGIN).toBeGreaterThan(0);
    });
  });
});
