import { DiagramDomain, ThermoPoint } from '../types/thermoContract';

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PhysicalBounds {
  hMinJkg: number;
  hMaxJkg: number;
  pMinPa: number;
  pMaxPa: number;
}

/**
 * DiagramTransform: Immutable, rigorous coordinate mapping between
 * physical states (h in J/kg, p in Pa) and screen coordinates (x, y in px).
 *
 * Direct:
 *   x = left + width * (h - hMin) / (hMax - hMin)
 *   y = top + height * [1 - ln(p / pMin) / ln(pMax / pMin)]
 *
 * Inverse:
 *   h = hMin + ((x - left) / width) * (hMax - hMin)
 *   p = pMin * exp([1 - (y - top) / height] * ln(pMax / pMin))
 */
export class DiagramTransform {
  readonly rect: ViewportRect;
  readonly baseBounds: PhysicalBounds;
  readonly viewBounds: PhysicalBounds;

  private readonly _lnPRatio: number;
  private readonly _hSpan: number;

  constructor(rect: ViewportRect, baseBounds: PhysicalBounds, viewBounds?: PhysicalBounds) {
    if (rect.width <= 0 || rect.height <= 0) {
      throw new Error(`DiagramTransform: Invalid screen dimensions (${rect.width}x${rect.height})`);
    }
    if (baseBounds.pMaxPa <= baseBounds.pMinPa || baseBounds.pMinPa <= 0) {
      throw new Error(
        `DiagramTransform: Invalid base pressure bounds (pMin=${baseBounds.pMinPa}, pMax=${baseBounds.pMaxPa})`
      );
    }
    if (baseBounds.hMaxJkg <= baseBounds.hMinJkg) {
      throw new Error(
        `DiagramTransform: Invalid base enthalpy bounds (hMin=${baseBounds.hMinJkg}, hMax=${baseBounds.hMaxJkg})`
      );
    }

    this.rect = { ...rect };
    this.baseBounds = { ...baseBounds };
    this.viewBounds = viewBounds ? { ...viewBounds } : { ...baseBounds };

    if (this.viewBounds.pMaxPa <= this.viewBounds.pMinPa || this.viewBounds.pMinPa <= 0) {
      throw new Error(
        `DiagramTransform: Invalid view pressure bounds (pMin=${this.viewBounds.pMinPa}, pMax=${this.viewBounds.pMaxPa})`
      );
    }
    if (this.viewBounds.hMaxJkg <= this.viewBounds.hMinJkg) {
      throw new Error(
        `DiagramTransform: Invalid view enthalpy bounds (hMin=${this.viewBounds.hMinJkg}, hMax=${this.viewBounds.hMaxJkg})`
      );
    }

    this._hSpan = this.viewBounds.hMaxJkg - this.viewBounds.hMinJkg;
    this._lnPRatio = Math.log(this.viewBounds.pMaxPa / this.viewBounds.pMinPa);
  }

  static fromDomain(rect: ViewportRect, domain: DiagramDomain): DiagramTransform {
    const baseBounds: PhysicalBounds = {
      hMinJkg: domain.hMinJkg,
      hMaxJkg: domain.hMaxJkg,
      pMinPa: domain.pMinPa,
      pMaxPa: domain.pMaxPa,
    };
    return new DiagramTransform(rect, baseBounds);
  }

  /**
   * Transforms physical coordinates (h in J/kg, p in Pa) to screen pixels (x, y)
   */
  project(hJkg: number, pPa: number): { x: number; y: number } {
    if (pPa <= 0) {
      pPa = 1e-12;
    }
    const x = this.rect.left + this.rect.width * ((hJkg - this.viewBounds.hMinJkg) / this._hSpan);
    const y =
      this.rect.top +
      this.rect.height * (1 - Math.log(pPa / this.viewBounds.pMinPa) / this._lnPRatio);

    return { x, y };
  }

  projectPoint(pt: ThermoPoint): { x: number; y: number } {
    return this.project(pt.hJkg, pt.pPa);
  }

  /**
   * Inverts screen pixels (x, y) back to exact physical state (h in J/kg, p in Pa)
   */
  unproject(x: number, y: number): { hJkg: number; pPa: number } {
    const fracX = (x - this.rect.left) / this.rect.width;
    const fracY = (y - this.rect.top) / this.rect.height;

    const hJkg = this.viewBounds.hMinJkg + fracX * this._hSpan;
    const pPa = this.viewBounds.pMinPa * Math.exp((1 - fracY) * this._lnPRatio);

    return { hJkg, pPa };
  }

  /**
   * Resizes screen rectangle without altering physical coordinates/view
   */
  withDimensions(newRect: ViewportRect): DiagramTransform {
    return new DiagramTransform(newRect, this.baseBounds, this.viewBounds);
  }

  /**
   * Resets viewport back to base bounds
   */
  resetView(): DiagramTransform {
    return new DiagramTransform(this.rect, this.baseBounds, this.baseBounds);
  }

  /**
   * Zoom centered at a given cursor screen coordinate (cursorX, cursorY) by factor (> 1 zooms in, < 1 zooms out).
   * Invariant: The physical state (h, p) under the cursor does NOT move on screen.
   */
  zoomAt(cursorX: number, cursorY: number, factor: number): DiagramTransform {
    if (factor <= 0 || !Number.isFinite(factor)) return this;

    // 1. Find physical invariant point under cursor
    const { hJkg: pivotH, pPa: pivotP } = this.unproject(cursorX, cursorY);

    // 2. Compute relative fractions in current viewport
    const fracX = (cursorX - this.rect.left) / this.rect.width;
    const fracY = (cursorY - this.rect.top) / this.rect.height;

    // 3. New spans in physical space (h is linear, p is logarithmic)
    const newHSpan = this._hSpan / factor;
    const newLnPSpan = this._lnPRatio / factor;

    // Clamp zoom levels: max 50x zoom in, 1.0x zoom out (minimum zoom is full diagram, preventing diagram from shrinking)
    const baseHSpan = this.baseBounds.hMaxJkg - this.baseBounds.hMinJkg;
    const baseLnPSpan = Math.log(this.baseBounds.pMaxPa / this.baseBounds.pMinPa);

    const minHSpan = baseHSpan / 50;
    const maxHSpan = baseHSpan;
    const clampedHSpan = Math.max(minHSpan, Math.min(maxHSpan, newHSpan));

    const minLnPSpan = baseLnPSpan / 50;
    const maxLnPSpan = baseLnPSpan;
    const clampedLnPSpan = Math.max(minLnPSpan, Math.min(maxLnPSpan, newLnPSpan));

    // 4. Calculate new view bounds maintaining the pivot at (fracX, fracY)
    let newHMin = pivotH - fracX * clampedHSpan;
    let newHMax = newHMin + clampedHSpan;

    if (newHMin < this.baseBounds.hMinJkg) {
      newHMin = this.baseBounds.hMinJkg;
      newHMax = newHMin + clampedHSpan;
    } else if (newHMax > this.baseBounds.hMaxJkg) {
      newHMax = this.baseBounds.hMaxJkg;
      newHMin = newHMax - clampedHSpan;
    }

    const lnPivotP = Math.log(pivotP);
    let newLnPMin = lnPivotP - (1 - fracY) * clampedLnPSpan;
    let newLnPMax = newLnPMin + clampedLnPSpan;

    const baseLnPMin = Math.log(this.baseBounds.pMinPa);
    const baseLnPMax = Math.log(this.baseBounds.pMaxPa);

    // Clamp pressure so minimum zoom/view pressure never drops below base minimum (~0.1 bar / ~0 bar)
    if (newLnPMin < baseLnPMin) {
      newLnPMin = baseLnPMin;
      newLnPMax = newLnPMin + clampedLnPSpan;
    } else if (newLnPMax > baseLnPMax) {
      newLnPMax = baseLnPMax;
      newLnPMin = newLnPMax - clampedLnPSpan;
    }

    const newViewBounds: PhysicalBounds = {
      hMinJkg: newHMin,
      hMaxJkg: newHMax,
      pMinPa: Math.exp(newLnPMin),
      pMaxPa: Math.exp(newLnPMax),
    };

    return new DiagramTransform(this.rect, this.baseBounds, newViewBounds);
  }

  /**
   * Pan viewport by screen delta (dx, dy) in pixels
   */
  pan(dx: number, dy: number): DiagramTransform {
    if (dx === 0 && dy === 0) return this;

    // Convert pixel delta to physical delta
    const deltaH = -(dx / this.rect.width) * this._hSpan;
    const deltaLnP = (dy / this.rect.height) * this._lnPRatio;

    let newHMin = this.viewBounds.hMinJkg + deltaH;
    let newHMax = this.viewBounds.hMaxJkg + deltaH;

    const baseHSpan = this.baseBounds.hMaxJkg - this.baseBounds.hMinJkg;
    if (this._hSpan <= baseHSpan) {
      if (newHMin < this.baseBounds.hMinJkg) {
        newHMin = this.baseBounds.hMinJkg;
        newHMax = newHMin + this._hSpan;
      } else if (newHMax > this.baseBounds.hMaxJkg) {
        newHMax = this.baseBounds.hMaxJkg;
        newHMin = newHMax - this._hSpan;
      }
    }

    let lnPMin = Math.log(this.viewBounds.pMinPa) + deltaLnP;
    let lnPMax = Math.log(this.viewBounds.pMaxPa) + deltaLnP;

    const baseLnPMin = Math.log(this.baseBounds.pMinPa);
    const baseLnPMax = Math.log(this.baseBounds.pMaxPa);
    const baseLnPSpan = baseLnPMax - baseLnPMin;

    // Prevent dragging below base bounds (pMin) or above top bounds (pMax)
    if (this._lnPRatio <= baseLnPSpan) {
      if (lnPMin < baseLnPMin) {
        lnPMin = baseLnPMin;
        lnPMax = lnPMin + this._lnPRatio;
      } else if (lnPMax > baseLnPMax) {
        lnPMax = baseLnPMax;
        lnPMin = lnPMax - this._lnPRatio;
      }
    }

    const newViewBounds: PhysicalBounds = {
      hMinJkg: newHMin,
      hMaxJkg: newHMax,
      pMinPa: Math.exp(lnPMin),
      pMaxPa: Math.exp(lnPMax),
    };

    return new DiagramTransform(this.rect, this.baseBounds, newViewBounds);
  }

  /**
   * Helper to convert a mouse/touch Client event to exact local SVG coordinates
   * accounting for SVG transform matrix, CSS scaling and bounding rect.
   */
  static screenToSvgLocal(
    clientX: number,
    clientY: number,
    svgElement: SVGSVGElement
  ): { x: number; y: number } {
    const pt = svgElement.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgElement.getScreenCTM();
    if (ctm) {
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }
    const rect = svgElement.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
}
