import { describe, it, expect } from 'vitest';
import { getTransformedPortPosition, calculatePortLayout } from './SchematicGenericNode';
import { ComponentPort } from '../../../types/schematic';

describe('calculatePortLayout', () => {
  const createPorts = (count: number, position: 'top' | 'bottom' | 'left' | 'right'): ComponentPort[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p_${i + 1}`,
      name: `Port ${i + 1}`,
      shortCode: `P${i + 1}`,
      kind: 'electric_power',
      position,
      hint: '',
    }));
  };

  it('distributes 1 port at 50% center', () => {
    const ports = createPorts(1, 'top');
    const layout = calculatePortLayout(ports, 0, 'top', 0, false, false);
    expect(layout.effectivePosition).toBe('top');
    expect(layout.offsetPercent).toBe(50);
  });

  it('distributes 3-phase generator ports evenly (L1, L2, L3 at 25%, 50%, 75% on top)', () => {
    const topPorts = createPorts(3, 'top'); // L1, L2, L3
    const l1 = calculatePortLayout(topPorts, 0, 'top', 0, false, false);
    const l2 = calculatePortLayout(topPorts, 1, 'top', 0, false, false);
    const l3 = calculatePortLayout(topPorts, 2, 'top', 0, false, false);

    expect(l1).toEqual({ effectivePosition: 'top', offsetPercent: 25 });
    expect(l2).toEqual({ effectivePosition: 'top', offsetPercent: 50 });
    expect(l3).toEqual({ effectivePosition: 'top', offsetPercent: 75 });
  });

  it('distributes neutral and ground ports on bottom (N at 33.33%, PE at 66.67%)', () => {
    const bottomPorts = createPorts(2, 'bottom'); // N, PE
    const n = calculatePortLayout(bottomPorts, 0, 'bottom', 0, false, false);
    const pe = calculatePortLayout(bottomPorts, 1, 'bottom', 0, false, false);

    expect(n).toEqual({ effectivePosition: 'bottom', offsetPercent: 33.33 });
    expect(pe).toEqual({ effectivePosition: 'bottom', offsetPercent: 66.67 });
  });

  it('distributes 4 ports on an edge at 20%, 40%, 60%, 80%', () => {
    const ports = createPorts(4, 'top');
    expect(calculatePortLayout(ports, 0, 'top').offsetPercent).toBe(20);
    expect(calculatePortLayout(ports, 1, 'top').offsetPercent).toBe(40);
    expect(calculatePortLayout(ports, 2, 'top').offsetPercent).toBe(60);
    expect(calculatePortLayout(ports, 3, 'top').offsetPercent).toBe(80);
  });

  it('correctly shifts distributed ports during 90-degree CW rotation', () => {
    const topPorts = createPorts(3, 'top');
    // On 90 deg rotation, top border becomes right border, indices from top to bottom
    const p1 = calculatePortLayout(topPorts, 0, 'top', 90, false, false);
    const p2 = calculatePortLayout(topPorts, 1, 'top', 90, false, false);
    const p3 = calculatePortLayout(topPorts, 2, 'top', 90, false, false);

    expect(p1).toEqual({ effectivePosition: 'right', offsetPercent: 25 });
    expect(p2).toEqual({ effectivePosition: 'right', offsetPercent: 50 });
    expect(p3).toEqual({ effectivePosition: 'right', offsetPercent: 75 });
  });

  it('correctly inverts port order when horizontally flipped', () => {
    const topPorts = createPorts(3, 'top');
    const p1 = calculatePortLayout(topPorts, 0, 'top', 0, true, false);
    const p3 = calculatePortLayout(topPorts, 2, 'top', 0, true, false);

    expect(p1).toEqual({ effectivePosition: 'top', offsetPercent: 75 });
    expect(p3).toEqual({ effectivePosition: 'top', offsetPercent: 25 });
  });
});

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

    it('flips vertically then rotates 90 deg', () => {
      // 'left' -> flippedV -> 'left' -> rotated 90deg -> 'top'
      expect(getTransformedPortPosition('left', 90, false, true)).toBe('top');
      // 'right' -> flippedV -> 'right' -> rotated 90deg -> 'bottom'
      expect(getTransformedPortPosition('right', 90, false, true)).toBe('bottom');
      // 'top' -> flippedV -> 'bottom' -> rotated 90deg -> 'left'
      expect(getTransformedPortPosition('top', 90, false, true)).toBe('left');
      // 'bottom' -> flippedV -> 'top' -> rotated 90deg -> 'right'
      expect(getTransformedPortPosition('bottom', 90, false, true)).toBe('right');
    });

    it('flips both axes and rotates 180 deg', () => {
      // 'left' -> flipH(right) -> flipV(right) -> rot180 -> 'left'
      expect(getTransformedPortPosition('left', 180, true, true)).toBe('left');
      // 'right' -> flipH(left) -> flipV(left) -> rot180 -> 'right'
      expect(getTransformedPortPosition('right', 180, true, true)).toBe('right');
      // 'top' -> flipH(top) -> flipV(bottom) -> rot180 -> 'top'
      expect(getTransformedPortPosition('top', 180, true, true)).toBe('top');
      // 'bottom' -> flipH(bottom) -> flipV(top) -> rot180 -> 'bottom'
      expect(getTransformedPortPosition('bottom', 180, true, true)).toBe('bottom');
    });

    it('handles rotated elbow pipe union ports across all 4 quadrants', () => {
      // Elbow original: port_1 = left, port_2 = bottom
      // Quadrant 0 (0 deg): left, bottom
      expect(getTransformedPortPosition('left', 0)).toBe('left');
      expect(getTransformedPortPosition('bottom', 0)).toBe('bottom');

      // Quadrant 1 (90 deg): top, left
      expect(getTransformedPortPosition('left', 90)).toBe('top');
      expect(getTransformedPortPosition('bottom', 90)).toBe('left');

      // Quadrant 2 (180 deg): right, top
      expect(getTransformedPortPosition('left', 180)).toBe('right');
      expect(getTransformedPortPosition('bottom', 180)).toBe('top');

      // Quadrant 3 (270 deg): bottom, right
      expect(getTransformedPortPosition('left', 270)).toBe('bottom');
      expect(getTransformedPortPosition('bottom', 270)).toBe('right');
    });
  });

  describe('Node Orientation & Dimensions', () => {
    it('swaps width and height for 90 and 270 deg rotations', () => {
      const originalWidth = 140;
      const originalHeight = 80;

      const getDimensions = (rotation: number) => {
        const isRotated = rotation === 90 || rotation === 270;
        return {
          cardWidth: isRotated ? originalHeight + 10 : originalWidth + 10,
          cardMinHeight: isRotated ? originalWidth + 15 : originalHeight + 15,
        };
      };

      // 0 deg: original orientation
      expect(getDimensions(0)).toEqual({ cardWidth: 150, cardMinHeight: 95 });

      // 90 deg: swapped orientation (horizontal becomes vertical)
      expect(getDimensions(90)).toEqual({ cardWidth: 90, cardMinHeight: 155 });

      // 180 deg: same card aspect ratio
      expect(getDimensions(180)).toEqual({ cardWidth: 150, cardMinHeight: 95 });

      // 270 deg: swapped orientation
      expect(getDimensions(270)).toEqual({ cardWidth: 90, cardMinHeight: 155 });
    });

    it('generates correct CSS transform for rotation and flips', () => {
      const getTransform = (rotation: number, flipH: boolean, flipV: boolean) => {
        const flippedH = flipH ? -1 : 1;
        const flippedV = flipV ? -1 : 1;
        const isTransformed = rotation !== 0 || flipH || flipV;
        return isTransformed ? `rotate(${rotation}deg) scale(${flippedH}, ${flippedV})` : undefined;
      };

      expect(getTransform(0, false, false)).toBeUndefined();
      expect(getTransform(90, false, false)).toBe('rotate(90deg) scale(1, 1)');
      expect(getTransform(0, true, false)).toBe('rotate(0deg) scale(-1, 1)');
      expect(getTransform(0, false, true)).toBe('rotate(0deg) scale(1, -1)');
      expect(getTransform(180, true, false)).toBe('rotate(180deg) scale(-1, 1)');
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
      expect(snapToGrid(46)).toBe(45);
    });
  });
});
