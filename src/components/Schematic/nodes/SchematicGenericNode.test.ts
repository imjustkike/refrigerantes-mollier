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

  describe('Pipe Fittings Definitions', () => {
    it('has valid component definitions for all 5 union and fitting types', async () => {
      const { COMPONENT_DEFINITIONS, COMPONENT_CATEGORIES } = await import('../symbols/componentDefinitions');

      const fittingsCategory = COMPONENT_CATEGORIES.find((c) => c.id === 'fittings');
      expect(fittingsCategory).toBeDefined();
      expect(fittingsCategory?.label).toBe('Uniones & Derivaciones');

      // Straight union (2 ports)
      const straight = COMPONENT_DEFINITIONS.pipe_union_straight;
      expect(straight).toBeDefined();
      expect(straight.ports).toHaveLength(2);
      expect(straight.category).toBe('fittings');

      // Elbow (2 ports at 90 deg)
      const elbow = COMPONENT_DEFINITIONS.pipe_union_elbow;
      expect(elbow).toBeDefined();
      expect(elbow.ports).toHaveLength(2);
      expect(elbow.ports.map((p) => p.position)).toEqual(['left', 'bottom']);

      // Tee (3 ports)
      const tee = COMPONENT_DEFINITIONS.pipe_union_tee;
      expect(tee).toBeDefined();
      expect(tee.ports).toHaveLength(3);
      expect(tee.ports.map((p) => p.position)).toEqual(['left', 'right', 'bottom']);

      // Cross (4 ports)
      const cross = COMPONENT_DEFINITIONS.pipe_union_cross;
      expect(cross).toBeDefined();
      expect(cross.ports).toHaveLength(4);
      expect(cross.ports.map((p) => p.position)).toEqual(['left', 'right', 'top', 'bottom']);

      // Junction Dot (4 ports)
      const dot = COMPONENT_DEFINITIONS.pipe_junction_dot;
      expect(dot).toBeDefined();
      expect(dot.ports).toHaveLength(4);
    });
  });

  describe('Pipe Waypoint Path Algorithms', () => {
    it('calculates default orthogonal waypoints between horizontal ports', async () => {
      const { getDefaultWaypoints } = await import('../edges/RefrigerantPipeEdge');
      const waypoints = getDefaultWaypoints(90, 90, 'right', 300, 195, 'left');
      expect(waypoints).toHaveLength(2);
      expect(waypoints[0]).toEqual({ x: 195, y: 90 });
      expect(waypoints[1]).toEqual({ x: 195, y: 195 });
    });

    it('routes around components when target is behind source port (obstacle avoidance)', async () => {
      const { getDefaultWaypoints } = await import('../edges/RefrigerantPipeEdge');
      // Source faces right at (300, 105), Target faces left at (105, 105) -> Target is behind source
      const waypoints = getDefaultWaypoints(300, 105, 'right', 105, 105, 'left');
      expect(waypoints).toHaveLength(4);
      // Departs right from source (x=330)
      expect(waypoints[0].x).toBe(330);
      expect(waypoints[0].y).toBe(105);
      // Loops above with 15px grid snap (detourY = 45)
      expect(waypoints[1].x).toBe(330);
      expect(waypoints[1].y).toBe(45);
      // Arrives left of target (x=75)
      expect(waypoints[2].x).toBe(75);
      expect(waypoints[2].y).toBe(45);
      expect(waypoints[3].x).toBe(75);
      expect(waypoints[3].y).toBe(105);
    });

    it('routes mixed port orientations with clearance when entering from inverted side', async () => {
      const { getDefaultWaypoints } = await import('../edges/RefrigerantPipeEdge');
      // Source right at (195, 195), Target top at (105, 150) -> Target is to the left and above
      const waypoints = getDefaultWaypoints(195, 195, 'right', 105, 150, 'top');
      expect(waypoints).toHaveLength(3);
      expect(waypoints[0]).toEqual({ x: 225, y: 195 }); // Outward right clearance snapped to grid
      expect(waypoints[1]).toEqual({ x: 225, y: 120 }); // Vertical clearance above target top port
      expect(waypoints[2]).toEqual({ x: 105, y: 120 }); // Horizontal alignment with target top
    });

    it('creates smooth SVG path with rounded fillets through arbitrary waypoints', async () => {
      const { createPipeSvgPath } = await import('../edges/RefrigerantPipeEdge');
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      const path = createPipeSvgPath(points, 10);
      expect(path).toContain('M 0 0');
      expect(path).toContain('Q 100 0');
      expect(path).toContain('100 100');
    });

    it('enforces strict 90-degree orthogonality and eliminates diagonals', async () => {
      const { makePointsStrictlyOrthogonal } = await import('../edges/RefrigerantPipeEdge');
      const diagonalInput = [
        { x: 0, y: 0 },
        { x: 150, y: 90 }, // Diagonal from (0,0) to (150,90)
      ];
      const orthogonalOutput = makePointsStrictlyOrthogonal(diagonalInput, true);
      // Inserts elbow at (150, 0)
      expect(orthogonalOutput).toHaveLength(3);
      expect(orthogonalOutput[0]).toEqual({ x: 0, y: 0 });
      expect(orthogonalOutput[1]).toEqual({ x: 150, y: 0 });
      expect(orthogonalOutput[2]).toEqual({ x: 150, y: 90 });
    });

    it('snaps coordinates to the 15px grid', async () => {
      const { snapToGrid } = await import('../edges/RefrigerantPipeEdge');
      expect(snapToGrid(14)).toBe(15);
      expect(snapToGrid(22)).toBe(15);
      expect(snapToGrid(23)).toBe(30);
      expect(snapToGrid(46)).toBe(45);
    });
  });
});
