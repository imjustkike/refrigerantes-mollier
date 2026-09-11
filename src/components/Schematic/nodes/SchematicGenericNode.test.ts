import { describe, it, expect } from 'vitest';
import { getTransformedPortPosition } from './SchematicGenericNode';

describe('getTransformedPortPosition', () => {
  it('returns original position when no flip or rotation is applied', () => {
    expect(getTransformedPortPosition('left', 0, false, false)).toBe('left');
    expect(getTransformedPortPosition('right', 0, false, false)).toBe('right');
    expect(getTransformedPortPosition('top', 0, false, false)).toBe('top');
    expect(getTransformedPortPosition('bottom', 0, false, false)).toBe('bottom');
  });

  describe('Horizontal Flip', () => {
    it('swaps left and right, preserves top and bottom', () => {
      expect(getTransformedPortPosition('left', 0, true, false)).toBe('right');
      expect(getTransformedPortPosition('right', 0, true, false)).toBe('left');
      expect(getTransformedPortPosition('top', 0, true, false)).toBe('top');
      expect(getTransformedPortPosition('bottom', 0, true, false)).toBe('bottom');
    });
  });

  describe('Vertical Flip', () => {
    it('swaps top and bottom, preserves left and right', () => {
      expect(getTransformedPortPosition('left', 0, false, true)).toBe('left');
      expect(getTransformedPortPosition('right', 0, false, true)).toBe('right');
      expect(getTransformedPortPosition('top', 0, false, true)).toBe('bottom');
      expect(getTransformedPortPosition('bottom', 0, false, true)).toBe('top');
    });
  });

  describe('Both Horizontal and Vertical Flip', () => {
    it('swaps both axes', () => {
      expect(getTransformedPortPosition('left', 0, true, true)).toBe('right');
      expect(getTransformedPortPosition('right', 0, true, true)).toBe('left');
      expect(getTransformedPortPosition('top', 0, true, true)).toBe('bottom');
      expect(getTransformedPortPosition('bottom', 0, true, true)).toBe('top');
    });
  });

  describe('Rotation and Flip Combinations', () => {
    it('rotates 90 deg clockwise without flip', () => {
      expect(getTransformedPortPosition('top', 90, false, false)).toBe('right');
      expect(getTransformedPortPosition('right', 90, false, false)).toBe('bottom');
      expect(getTransformedPortPosition('bottom', 90, false, false)).toBe('left');
      expect(getTransformedPortPosition('left', 90, false, false)).toBe('top');
    });

    it('rotates 180 deg clockwise without flip', () => {
      expect(getTransformedPortPosition('top', 180, false, false)).toBe('bottom');
      expect(getTransformedPortPosition('bottom', 180, false, false)).toBe('top');
      expect(getTransformedPortPosition('left', 180, false, false)).toBe('right');
      expect(getTransformedPortPosition('right', 180, false, false)).toBe('left');
    });

    it('rotates 270 deg clockwise without flip', () => {
      expect(getTransformedPortPosition('top', 270, false, false)).toBe('left');
      expect(getTransformedPortPosition('right', 270, false, false)).toBe('top');
      expect(getTransformedPortPosition('bottom', 270, false, false)).toBe('right');
      expect(getTransformedPortPosition('left', 270, false, false)).toBe('bottom');
    });

    it('flips horizontally then rotates 90 deg', () => {
      // 'left' -> flippedH -> 'right' -> rotated 90deg -> 'bottom'
      expect(getTransformedPortPosition('left', 90, true, false)).toBe('bottom');
      // 'right' -> flippedH -> 'left' -> rotated 90deg -> 'top'
      expect(getTransformedPortPosition('right', 90, true, false)).toBe('top');
      // 'top' -> flippedH -> 'top' -> rotated 90deg -> 'right'
      expect(getTransformedPortPosition('top', 90, true, false)).toBe('right');
      // 'bottom' -> flippedH -> 'bottom' -> rotated 90deg -> 'left'
      expect(getTransformedPortPosition('bottom', 90, true, false)).toBe('left');
    });
  });
});
