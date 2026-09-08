import { describe, it, expect } from 'vitest';
import { CurveGenerator } from './CurveGenerator';
import { ThermoCurve, ThermoPoint } from '../types/thermoContract';
import { DiagramTransform } from '../transform/DiagramTransform';
import { LabelLayout } from '../labels/LabelLayout';

describe('CurveGenerator and LabelLayout Unit Tests', () => {
  const transform = new DiagramTransform(
    { left: 50, top: 50, width: 800, height: 600 },
    { hMinJkg: 100_000, hMaxJkg: 600_000, pMinPa: 10_000, pMaxPa: 5_000_000 }
  );

  it('splits invalid points or calculation errors into disjoint segments without bridging', () => {
    const rawPoints: (ThermoPoint | null)[] = [
      { pPa: 100_000, hJkg: 200_000 },
      { pPa: 200_000, hJkg: 220_000 },
      null, // Injected engine failure
      { pPa: 400_000, hJkg: 260_000 },
      { pPa: 500_000, hJkg: 280_000 },
    ];

    const segments = CurveGenerator.sanitizeSegments(rawPoints);
    expect(segments.length).toBe(2);
    expect(segments[0].length).toBe(2);
    expect(segments[1].length).toBe(2);
    expect(segments[0][1].pPa).toBe(200_000);
    expect(segments[1][0].pPa).toBe(400_000);

    const curve: ThermoCurve = {
      id: 'test_curve',
      family: 'isotherm',
      segments,
    };

    const svgPath = CurveGenerator.curveToSvgPath(curve, transform);
    // Should have two 'M' commands representing two separate polylines
    const moveCount = (svgPath.match(/M/g) || []).length;
    expect(moveCount).toBe(2);
  });

  it('correctly constructs closed saturation dome fill polygon without floor line', () => {
    const satLiquid: ThermoCurve = {
      id: 'liq',
      family: 'sat-liquid',
      segments: [
        [
          { pPa: 50_000, hJkg: 150_000 },
          { pPa: 100_000, hJkg: 180_000 },
          { pPa: 4_000_000, hJkg: 400_000 }, // apex
        ],
      ],
    };

    const satVapor: ThermoCurve = {
      id: 'vap',
      family: 'sat-vapor',
      segments: [
        [
          { pPa: 50_000, hJkg: 500_000 },
          { pPa: 100_000, hJkg: 480_000 },
          { pPa: 4_000_000, hJkg: 400_000 }, // apex
        ],
      ],
    };

    const domePath = CurveGenerator.buildDomeFillPath(satLiquid, satVapor, transform);
    expect(domePath).toContain('M ');
    expect(domePath).toContain(' Z');
    expect(domePath.startsWith('M')).toBe(true);
  });

  it('detects collisions between bounding boxes and accepts non-colliding labels', () => {
    const box1 = { x: 100, y: 100, width: 40, height: 20 };
    const box2 = { x: 110, y: 105, width: 40, height: 20 }; // Overlaps box1
    const box3 = { x: 300, y: 300, width: 40, height: 20 }; // Disjoint

    expect(LabelLayout.collides(box1, box2)).toBe(true);
    expect(LabelLayout.collides(box1, box3)).toBe(false);

    const candidates = [
      { id: '1', text: 'T=20°C', x: 120, y: 110, angleRad: 0, box: box1, priority: 2 },
      { id: '2', text: 'T=25°C', x: 130, y: 115, angleRad: 0, box: box2, priority: 1 },
      { id: '3', text: 'T=40°C', x: 320, y: 310, angleRad: 0, box: box3, priority: 2 },
    ];

    const resolved = LabelLayout.resolveCollisions(candidates);
    expect(resolved.length).toBe(2);
    expect(resolved.map((l) => l.id)).toEqual(['1', '3']); // '2' was dropped due to collision with higher priority '1'
  });
});
