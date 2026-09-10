import { describe, it, expect } from 'vitest';
import { DiagramTransform, PhysicalBounds, ViewportRect } from './DiagramTransform';

describe('DiagramTransform Mathematical Verifications', () => {
  const rect: ViewportRect = { left: 60, top: 40, width: 800, height: 500 };
  const bounds: PhysicalBounds = {
    hMinJkg: 100_000,    // 100 kJ/kg
    hMaxJkg: 600_000,    // 600 kJ/kg
    pMinPa: 10_000,      // 0.1 bar (10 kPa)
    pMaxPa: 10_000_000,  // 100 bar (10 MPa) -> exactly 3 decades
  };

  const transform = new DiagramTransform(rect, bounds);

  it('projects (hMin, pMin) exactly to lower-left corner', () => {
    const { x, y } = transform.project(bounds.hMinJkg, bounds.pMinPa);
    expect(x).toBeCloseTo(rect.left, 10);
    expect(y).toBeCloseTo(rect.top + rect.height, 10);
  });

  it('projects (hMax, pMax) exactly to upper-right corner', () => {
    const { x, y } = transform.project(bounds.hMaxJkg, bounds.pMaxPa);
    expect(x).toBeCloseTo(rect.left + rect.width, 10);
    expect(y).toBeCloseTo(rect.top, 10);
  });

  it('projects arithmetic mean of enthalpy to horizontal center', () => {
    const hMid = (bounds.hMinJkg + bounds.hMaxJkg) / 2;
    const { x } = transform.project(hMid, bounds.pMinPa);
    expect(x).toBeCloseTo(rect.left + rect.width / 2, 10);
  });

  it('projects geometric mean of pressure to vertical center', () => {
    const pGeomMid = Math.sqrt(bounds.pMinPa * bounds.pMaxPa);
    const { y } = transform.project(bounds.hMinJkg, pGeomMid);
    expect(y).toBeCloseTo(rect.top + rect.height / 2, 10);
  });

  it('ensures each pressure decade spans the exact same pixel height', () => {
    // Decades: 10^4 -> 10^5, 10^5 -> 10^6, 10^6 -> 10^7
    const y0 = transform.project(bounds.hMinJkg, 10_000).y;
    const y1 = transform.project(bounds.hMinJkg, 100_000).y;
    const y2 = transform.project(bounds.hMinJkg, 1_000_000).y;
    const y3 = transform.project(bounds.hMinJkg, 10_000_000).y;

    const decade1Height = Math.abs(y1 - y0);
    const decade2Height = Math.abs(y2 - y1);
    const decade3Height = Math.abs(y3 - y2);

    expect(decade1Height).toBeCloseTo(rect.height / 3, 10);
    expect(decade2Height).toBeCloseTo(rect.height / 3, 10);
    expect(decade3Height).toBeCloseTo(rect.height / 3, 10);
    expect(decade1Height).toBeCloseTo(decade2Height, 10);
    expect(decade2Height).toBeCloseTo(decade3Height, 10);
  });

  it('recovers exact physical state on unproject (bijective roundtrip within floating tolerance)', () => {
    const testCases = [
      { h: 150_000, p: 25_000 },
      { h: 275_432.1, p: 483_210 },
      { h: 520_999, p: 8_765_432 },
      { h: 400_000, p: 100_000 },
    ];

    for (const tc of testCases) {
      const { x, y } = transform.project(tc.h, tc.p);
      const recovered = transform.unproject(x, y);

      expect(recovered.hJkg).toBeCloseTo(tc.h, 6);
      expect(recovered.pPa / tc.p).toBeCloseTo(1, 10); // Relative pressure error < 1e-10
    }
  });

  it('preserves the physical invariant under cursor when zooming', () => {
    const cursorX = rect.left + 234;
    const cursorY = rect.top + 178;

    // Physical state before zoom
    const stateUnderCursor = transform.unproject(cursorX, cursorY);

    // Apply 2x zoom centered at cursor
    const zoomed = transform.zoomAt(cursorX, cursorY, 2.0);

    // Project the state in the zoomed transform
    const projectedAfterZoom = zoomed.project(stateUnderCursor.hJkg, stateUnderCursor.pPa);

    expect(projectedAfterZoom.x).toBeCloseTo(cursorX, 9);
    expect(projectedAfterZoom.y).toBeCloseTo(cursorY, 9);
  });

  it('correctly shifts viewport when panning within bounds', () => {
    // Zoom in 2x first so the viewport has room to pan without hitting the base boundary
    const zoomed = transform.zoomAt(rect.left + 400, rect.top + 250, 2.0);
    const dx = 20;
    const dy = -20;
    const panned = zoomed.pan(dx, dy);

    const testH = 300_000;
    const testP = 500_000;

    const originalPos = zoomed.project(testH, testP);
    const pannedPos = panned.project(testH, testP);

    expect(pannedPos.x).toBeCloseTo(originalPos.x + dx, 9);
    expect(pannedPos.y).toBeCloseTo(originalPos.y + dy, 9);
  });

  it('prevents dragging beyond base bounds vertically (cannot pan below pMin or above pMax)', () => {
    // Attempting to pan down by 500px at base zoom must remain clamped to baseBounds
    const pannedDown = transform.pan(0, -500);
    expect(pannedDown.viewBounds.pMinPa).toBeCloseTo(bounds.pMinPa, 5);
    expect(pannedDown.viewBounds.pMaxPa).toBeCloseTo(bounds.pMaxPa, 5);

    // Attempting to pan up by 500px at base zoom must remain clamped to baseBounds
    const pannedUp = transform.pan(0, 500);
    expect(pannedUp.viewBounds.pMinPa).toBeCloseTo(bounds.pMinPa, 5);
    expect(pannedUp.viewBounds.pMaxPa).toBeCloseTo(bounds.pMaxPa, 5);
  });

  it('resizing screen maintains physical domain unchanged', () => {
    const newRect: ViewportRect = { left: 80, top: 50, width: 1200, height: 800 };
    const resized = transform.withDimensions(newRect);

    expect(resized.viewBounds.hMinJkg).toBe(transform.viewBounds.hMinJkg);
    expect(resized.viewBounds.hMaxJkg).toBe(transform.viewBounds.hMaxJkg);
    expect(resized.viewBounds.pMinPa).toBe(transform.viewBounds.pMinPa);
    expect(resized.viewBounds.pMaxPa).toBe(transform.viewBounds.pMaxPa);
  });

  it('allows shrinking diagram when zooming out while keeping base pinned at the bottom and showing higher pressure', () => {
    // Zoom out by 0.5x from base bounds
    const zoomedOut = transform.zoomAt(rect.left + 400, rect.top + 250, 0.5);

    // Minimum pressure must remain anchored to the base
    expect(zoomedOut.viewBounds.pMinPa).toBeCloseTo(bounds.pMinPa, 5);

    // Maximum pressure must expand upwards (revealing more high pressure)
    expect(zoomedOut.viewBounds.pMaxPa).toBeGreaterThan(bounds.pMaxPa);

    // Enthalpy span expands
    expect(zoomedOut.viewBounds.hMaxJkg - zoomedOut.viewBounds.hMinJkg).toBeGreaterThan(
      bounds.hMaxJkg - bounds.hMinJkg
    );
  });

  it('clamps minimum pressure strictly to base bounds (preventing sub-base vacuum and pinning base)', () => {
    // Zoom in first, then zoom out aggressively
    const zoomedIn = transform.zoomAt(rect.left + 400, rect.top + 450, 3.0);
    const zoomedOutAggressive = zoomedIn.zoomAt(rect.left + 400, rect.top + 450, 0.1);

    expect(zoomedOutAggressive.viewBounds.pMinPa).toBeGreaterThanOrEqual(bounds.pMinPa - 1e-6);
    expect(zoomedOutAggressive.viewBounds.pMaxPa).toBeGreaterThan(bounds.pMaxPa);
  });
});
