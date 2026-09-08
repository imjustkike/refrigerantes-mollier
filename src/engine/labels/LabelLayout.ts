import { DiagramTransform } from '../transform/DiagramTransform';
import { ThermoCurve } from '../types/thermoContract';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  angleRad: number;
  box: BoundingBox;
  priority: number; // Higher numbers = higher priority
  color?: string;
  bgColor?: string;
}

export class LabelLayout {
  /**
   * Checks if two 2D Axis-Aligned Bounding Boxes collide (with an optional padding)
   */
  static collides(boxA: BoundingBox, boxB: BoundingBox, padding = 4): boolean {
    return !(
      boxA.x + boxA.width + padding < boxB.x ||
      boxA.x > boxB.x + boxB.width + padding ||
      boxA.y + boxA.height + padding < boxB.y ||
      boxA.y > boxB.y + boxB.height + padding
    );
  }

  /**
   * Calculates arc lengths and local tangent along a projected ThermoCurve segment
   */
  static findOptimalCurveLabelPosition(
    curve: ThermoCurve,
    transform: DiagramTransform,
    labelText: string,
    targetArcFraction = 0.65, // Position around 65% of arc length
    approxCharWidth = 6.5,
    labelHeight = 14
  ): PlacedLabel | null {
    const pts = curve.segments.flat();
    if (pts.length < 3) return null;

    // Project points to screen coordinates
    const screenPts: { x: number; y: number }[] = pts.map((p) => transform.projectPoint(p));

    // Compute cumulative arc lengths along visible screen area
    const arcLengths: number[] = [0];
    let totalLength = 0;

    for (let i = 1; i < screenPts.length; i++) {
      const dx = screenPts[i].x - screenPts[i - 1].x;
      const dy = screenPts[i].y - screenPts[i - 1].y;
      const dist = Math.hypot(dx, dy);
      totalLength += dist;
      arcLengths.push(totalLength);
    }

    if (totalLength < 40) return null; // Too short to label

    const targetLength = totalLength * targetArcFraction;

    // Find segment containing targetLength
    let targetIdx = 1;
    for (let i = 1; i < arcLengths.length; i++) {
      if (arcLengths[i] >= targetLength) {
        targetIdx = i;
        break;
      }
    }

    const p0 = screenPts[Math.max(0, targetIdx - 1)];
    const p1 = screenPts[targetIdx];
    const p2 = screenPts[Math.min(screenPts.length - 1, targetIdx + 1)];

    // Interpolation factor within segment
    const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const fraction = segLen > 0 ? (targetLength - arcLengths[targetIdx - 1]) / segLen : 0;

    const posX = p0.x + (p1.x - p0.x) * fraction;
    const posY = p0.y + (p1.y - p0.y) * fraction;

    // Check if inside plot rect with safe margin
    const r = transform.rect;
    if (
      posX < r.left + 25 ||
      posX > r.left + r.width - 25 ||
      posY < r.top + 15 ||
      posY > r.top + r.height - 15
    ) {
      return null;
    }

    // Tangent angle
    const angleRad = Math.atan2(p2.y - p0.y, p2.x - p0.x);

    const labelWidth = Math.max(30, labelText.length * approxCharWidth + 10);
    const box: BoundingBox = {
      x: posX - labelWidth / 2,
      y: posY - labelHeight / 2,
      width: labelWidth,
      height: labelHeight,
    };

    return {
      id: `lbl_${curve.id}`,
      text: labelText,
      x: posX,
      y: posY,
      angleRad,
      box,
      priority: curve.family === 'isotherm' ? 2 : 1,
    };
  }

  /**
   * Filters and resolves a collection of label candidates using collision detection
   */
  static resolveCollisions(
    candidates: PlacedLabel[],
    fixedObstacles: BoundingBox[] = []
  ): PlacedLabel[] {
    // Sort descending by priority
    const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
    const accepted: PlacedLabel[] = [];
    const occupiedBoxes: BoundingBox[] = [...fixedObstacles];

    for (const candidate of sorted) {
      const collides = occupiedBoxes.some((box) => this.collides(candidate.box, box));
      if (!collides) {
        accepted.push(candidate);
        occupiedBoxes.push(candidate.box);
      }
    }

    return accepted;
  }
}
