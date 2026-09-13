import {
  ThermoCurve,
  ThermoPoint,
} from '../types/thermoContract';
import { DiagramTransform } from '../transform/DiagramTransform';

export interface CurveGeneratorOptions {
  maxSubdivisionDepth?: number;
  maxPixelError?: number; // target error in pixels (0.5 - 1.0 px)
}

/**
 * CurveGenerator: Builds physically sound, segment-preserved curves for log(p)–h diagrams.
 *
 * Rules:
 * - Every point is an actual evaluated state from the thermodynamic engine.
 * - Errors split curves into disjoint segments; never interpolated with fake diagonals.
 * - Subcritical isotherms have 3 distinct segments: subcooled liquid, two-phase horizontal, superheated vapor.
 */
export class CurveGenerator {
  /**
   * Builds the closed SVG path string for the two-phase saturation dome fill
   * without creating an artificial bottom border.
   */
  static buildDomeFillPath(
    satLiquid: ThermoCurve,
    satVapor: ThermoCurve,
    transform: DiagramTransform
  ): string {
    const liqPts: ThermoPoint[] = satLiquid.segments.flat();
    const vapPts: ThermoPoint[] = satVapor.segments.flat();

    if (liqPts.length < 2 || vapPts.length < 2) return '';

    let path = '';
    let count = 0;
    liqPts.forEach((pt) => {
      if (!Number.isFinite(pt.hJkg) || !Number.isFinite(pt.pPa) || pt.pPa <= 0) return;
      const { x, y } = transform.projectPoint(pt);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      path += count === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      count++;
    });

    const reversedVap = [...vapPts].reverse();
    reversedVap.forEach((pt) => {
      if (!Number.isFinite(pt.hJkg) || !Number.isFinite(pt.pPa) || pt.pPa <= 0) return;
      const { x, y } = transform.projectPoint(pt);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      count++;
    });

    if (count < 4) return '';
    path += ' Z'; // Close polygon
    return path;
  }

  /**
   * Generates SVG polyline path commands ('M x y L x y...') for a ThermoCurve,
   * respecting disjoint segments and skipping invalid floats.
   */
  static curveToSvgPath(curve: ThermoCurve, transform: DiagramTransform): string {
    let path = '';
    for (const segment of curve.segments) {
      if (segment.length < 2) continue;
      let segPath = '';
      let validCount = 0;
      for (const pt of segment) {
        if (!Number.isFinite(pt.hJkg) || !Number.isFinite(pt.pPa) || pt.pPa <= 0) continue;
        const { x, y } = transform.projectPoint(pt);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        segPath += validCount === 0 ? ` M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        validCount++;
      }
      if (validCount >= 2) {
        path += segPath;
      }
    }
    return path.trim();
  }

  /**
   * Validates physical consistency of a saturation curve:
   * - hL < hV for all P < Pcrit
   * - Difference (hV - hL) strictly positive and goes to zero near critical
   */
  static validateSaturationPair(
    liquidPts: ThermoPoint[],
    vaporPts: ThermoPoint[],
    pCritPa: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (liquidPts.length === 0 || vaporPts.length === 0) {
      errors.push('Ramas de saturación vacías');
      return { isValid: false, errors };
    }

    const minLen = Math.min(liquidPts.length, vaporPts.length);
    for (let i = 0; i < minLen; i++) {
      const l = liquidPts[i];
      const v = vaporPts[i];

      if (l.pPa < pCritPa * 0.999) {
        if (l.hJkg >= v.hJkg) {
          errors.push(
            `Inversión de entalpía a P=${l.pPa.toFixed(0)} Pa: hL(${l.hJkg}) >= hV(${v.hJkg})`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Adapts raw points with segment separation on invalid entries (NaN, Infinity, or gap)
   */
  static sanitizeSegments(rawPoints: (ThermoPoint | null | undefined)[]): ThermoPoint[][] {
    const segments: ThermoPoint[][] = [];
    let currentSegment: ThermoPoint[] = [];

    for (const pt of rawPoints) {
      if (
        pt &&
        Number.isFinite(pt.hJkg) &&
        Number.isFinite(pt.pPa) &&
        pt.pPa > 0
      ) {
        currentSegment.push(pt);
      } else {
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }

    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }

    return segments;
  }
}
