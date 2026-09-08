import React, { useMemo } from 'react';
import { DiagramTransform } from '../transform/DiagramTransform';
import {
  CurveVisibilityConfig,
  DiagramConnection,
  DiagramPoint,
} from '../../types/thermo';
import { FullDiagramDataset, Units } from '../types/thermoContract';
import { CurveGenerator } from '../curves/CurveGenerator';
import { LabelLayout, PlacedLabel } from '../labels/LabelLayout';

export interface DiagramRendererProps {
  transform: DiagramTransform;
  dataset: FullDiagramDataset | null;
  visibility: CurveVisibilityConfig;
  theme: 'danfoss' | 'dark';
  points: DiagramPoint[];
  connections: DiagramConnection[];
  selectedPointId: string | null;
  selectedConnectionId: string | null;
  onPointSelect?: (pointId: string) => void;
  onPointMouseDown?: (e: React.MouseEvent, pointId: string) => void;
  onLabelMouseDown?: (e: React.MouseEvent, point: DiagramPoint) => void;
  hoverPreviewPoint?: { hJkg: number; pPa: number } | null;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  transform,
  dataset,
  visibility,
  theme,
  points,
  connections,
  selectedPointId,
  selectedConnectionId,
  onPointSelect,
  onPointMouseDown,
  onLabelMouseDown,
  hoverPreviewPoint,
}) => {
  const { rect, viewBounds } = transform;
  const isDanfoss = theme === 'danfoss';

  // 1. Compute Grid Ticks based on current view bounds
  const hTicks = useMemo(() => {
    const hMinKj = Units.jkgToKjkg(viewBounds.hMinJkg);
    const hMaxKj = Units.jkgToKjkg(viewBounds.hMaxJkg);
    const spanKj = hMaxKj - hMinKj;

    let stepKj = 50;
    if (spanKj > 800) stepKj = 100;
    else if (spanKj > 400) stepKj = 50;
    else if (spanKj > 150) stepKj = 25;
    else if (spanKj > 60) stepKj = 10;
    else stepKj = 5;

    const start = Math.ceil(hMinKj / stepKj) * stepKj;
    const ticks: number[] = [];
    for (let h = start; h <= hMaxKj; h += stepKj) {
      ticks.push(Units.kjkgToJkg(h));
    }
    return ticks;
  }, [viewBounds.hMinJkg, viewBounds.hMaxJkg]);

  const pTicks = useMemo(() => {
    const pMinBar = Units.paToBar(viewBounds.pMinPa);
    const pMaxBar = Units.paToBar(viewBounds.pMaxPa);

    const standardTicksBar = [
      0.01, 0.02, 0.03, 0.05, 0.07, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
      1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9,
      10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300,
    ];

    const visible = standardTicksBar.filter((p) => p >= pMinBar * 0.99 && p <= pMaxBar * 1.01);
    return visible.map((p) => Units.barToPa(p));
  }, [viewBounds.pMinPa, viewBounds.pMaxPa]);

  // 1b. Compute Isochore (v = const) labels on Right and Top Boundaries
  const { isochoreRightLabels, isochoreTopLabels } = useMemo(() => {
    if (!dataset || !visibility.isochores) {
      return { isochoreRightLabels: [], isochoreTopLabels: [] };
    }

    const rightResults: { id: string; v: number; text: string; y: number }[] = [];
    const topResults: { id: string; v: number; text: string; x: number }[] = [];
    const rightH = viewBounds.hMaxJkg;
    const topP = viewBounds.pMaxPa;
    const lnTopP = Math.log(topP);

    for (const curve of dataset.isochores) {
      const v = curve.parameterValue;
      if (v === undefined) continue;

      const pts = curve.segments.flat();
      if (pts.length < 2) continue;

      const formatted =
        v >= 1
          ? v.toFixed(v % 1 === 0 ? 0 : 1)
          : v >= 0.1
          ? v.toFixed(2)
          : v >= 0.01
          ? v.toFixed(2)
          : v.toFixed(3);

      let foundRight = false;
      let intersectP: number | null = null;

      // 1. Check intersection with right boundary (h = rightH)
      for (let i = 1; i < pts.length; i++) {
        const pA = pts[i - 1];
        const pB = pts[i];
        const minH = Math.min(pA.hJkg, pB.hJkg);
        const maxH = Math.max(pA.hJkg, pB.hJkg);

        if (rightH >= minH && rightH <= maxH && maxH > minH) {
          const t = (rightH - pA.hJkg) / (pB.hJkg - pA.hJkg);
          const lnP = Math.log(pA.pPa) + t * (Math.log(pB.pPa) - Math.log(pA.pPa));
          const p = Math.exp(lnP);
          if (p >= viewBounds.pMinPa && p <= viewBounds.pMaxPa) {
            intersectP = p;
            break;
          }
        }
      }

      if (intersectP === null && pts.length > 0) {
        const lastPt = pts[pts.length - 1];
        const proj = transform.project(lastPt.hJkg, lastPt.pPa);
        const rightPx = rect.left + rect.width;
        if (
          Math.abs(proj.x - rightPx) <= 18 &&
          lastPt.pPa >= viewBounds.pMinPa &&
          lastPt.pPa <= viewBounds.pMaxPa
        ) {
          intersectP = lastPt.pPa;
        }
      }

      if (intersectP !== null) {
        const { y } = transform.project(rightH, intersectP);
        if (y >= rect.top + 6 && y <= rect.top + rect.height - 2) {
          rightResults.push({
            id: curve.id,
            v,
            text: formatted,
            y,
          });
          foundRight = true;
        }
      }

      // 2. If it did not cross the right boundary, check if it crosses the top boundary (P = topP)
      if (!foundRight) {
        let intersectH: number | null = null;

        for (let i = 1; i < pts.length; i++) {
          const pA = pts[i - 1];
          const pB = pts[i];
          const minP = Math.min(pA.pPa, pB.pPa);
          const maxP = Math.max(pA.pPa, pB.pPa);

          if (topP >= minP && topP <= maxP && maxP > minP) {
            const lnPA = Math.log(pA.pPa);
            const lnPB = Math.log(pB.pPa);
            const t = (lnTopP - lnPA) / (lnPB - lnPA);
            const h = pA.hJkg + t * (pB.hJkg - pA.hJkg);
            if (h >= viewBounds.hMinJkg && h <= viewBounds.hMaxJkg) {
              intersectH = h;
              break;
            }
          }
        }

        if (intersectH === null && pts.length > 0) {
          const lastPt = pts[pts.length - 1];
          const proj = transform.project(lastPt.hJkg, lastPt.pPa);
          if (
            Math.abs(proj.y - rect.top) <= 18 &&
            lastPt.hJkg >= viewBounds.hMinJkg &&
            lastPt.hJkg <= viewBounds.hMaxJkg
          ) {
            intersectH = lastPt.hJkg;
          }
        }

        if (intersectH !== null) {
          const { x } = transform.project(intersectH, topP);
          // Keep away from left and right corners
          if (x >= rect.left + 15 && x <= rect.left + rect.width - 15) {
            topResults.push({
              id: curve.id,
              v,
              text: formatted,
              x,
            });
          }
        }
      }
    }

    // Sort right results top to bottom (ascending y)
    rightResults.sort((a, b) => a.y - b.y);
    const filteredRight: typeof rightResults = [];
    for (const item of rightResults) {
      if (filteredRight.length === 0) {
        filteredRight.push(item);
      } else {
        const prev = filteredRight[filteredRight.length - 1];
        if (Math.abs(item.y - prev.y) >= 13) {
          filteredRight.push(item);
        }
      }
    }

    // Sort top results left to right (ascending x)
    topResults.sort((a, b) => a.x - b.x);
    const filteredTop: typeof topResults = [];
    for (const item of topResults) {
      if (filteredTop.length === 0) {
        filteredTop.push(item);
      } else {
        const prev = filteredTop[filteredTop.length - 1];
        if (Math.abs(item.x - prev.x) >= 22) {
          filteredTop.push(item);
        }
      }
    }

    return { isochoreRightLabels: filteredRight, isochoreTopLabels: filteredTop };
  }, [dataset, visibility.isochores, viewBounds, transform, rect]);

  // 2. Compute Saturation Dome Fill Path
  const domeFillPath = useMemo(() => {
    if (!dataset || !visibility.saturation) return '';
    return CurveGenerator.buildDomeFillPath(
      dataset.saturationLiquid,
      dataset.saturationVapor,
      transform
    );
  }, [dataset, visibility.saturation, transform]);

  // 3. Compute Dynamic Labels with Collision Avoidance
  const placedCurveLabels = useMemo(() => {
    if (!dataset || !visibility.showCurveLabels) return [];

    const candidates: PlacedLabel[] = [];

    // Isotherm labels
    if (visibility.isotherms) {
      for (const iso of dataset.isotherms) {
        const val = iso.parameterValue ?? 0;
        const tC = iso.parameterUnit === 'K' ? Units.kToC(val) : val;
        const text = `${tC.toFixed(0)}°C`;
        const candidate = LabelLayout.findOptimalCurveLabelPosition(iso, transform, text, 0.72);
        if (candidate) candidates.push(candidate);
      }
    }

    // Quality labels
    if (visibility.qualityLines) {
      for (const q of dataset.qualityLines) {
        if (q.parameterValue !== undefined && Math.round(q.parameterValue * 10) % 2 === 0) {
          const text = `x=${q.parameterValue.toFixed(1)}`;
          const candidate = LabelLayout.findOptimalCurveLabelPosition(q, transform, text, 0.28);
          if (candidate) candidates.push(candidate);
        }
      }
    }

    // Point label obstacle boxes to avoid covering user points
    const pointObstacles = points.map((p) => {
      const proj = transform.project(
        Units.kjkgToJkg(p.state.enthalpy_kj_kg),
        Units.barToPa(p.state.pressure_bar)
      );
      return {
        x: proj.x + p.labelOffset.x,
        y: proj.y + p.labelOffset.y,
        width: 130,
        height: 75,
      };
    });

    return LabelLayout.resolveCollisions(candidates, pointObstacles);
  }, [dataset, visibility, transform, points]);

  // Color Tokens
  const colors = {
    bg: isDanfoss ? '#ffffff' : '#030712',
    border: isDanfoss ? '#94a3b8' : '#1e293b',
    grid: isDanfoss ? 'rgba(148, 163, 184, 0.35)' : 'rgba(30, 41, 59, 0.65)',
    gridMajor: isDanfoss ? 'rgba(100, 116, 139, 0.5)' : 'rgba(51, 65, 85, 0.8)',
    domeFill: isDanfoss ? 'rgba(2, 132, 199, 0.05)' : 'rgba(14, 165, 233, 0.06)',
    satCurve: isDanfoss ? '#0284c7' : '#38bdf8',
    isotherm: isDanfoss ? '#dc2626' : '#f87171',
    isentrope: isDanfoss ? '#0891b2' : '#22d3ee',
    isochore: isDanfoss ? '#9333ea' : '#c084fc',
    quality: isDanfoss ? '#059669' : '#34d399',
    axisText: isDanfoss ? '#334155' : '#94a3b8',
  };

  return (
    <svg className="w-full h-full block chart-svg">
      <defs>
        <clipPath id="diagram-plot-clip">
          <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} />
        </clipPath>
      </defs>

      {/* Outer Border & Background */}
      <rect
        x={rect.left}
        y={rect.top}
        width={rect.width}
        height={rect.height}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={1.2}
      />

      {/* CLIPPED PLOT CONTENT */}
      <g clipPath="url(#diagram-plot-clip)">
        {/* Horizontal Pressure Grid Lines */}
        {pTicks.map((pPa) => {
          const { y } = transform.project(viewBounds.hMinJkg, pPa);
          const pBar = Units.paToBar(pPa);
          const isDecade = [0.01, 0.1, 1, 10, 100].includes(pBar);
          return (
            <line
              key={`gy_${pPa}`}
              x1={rect.left}
              y1={y}
              x2={rect.left + rect.width}
              y2={y}
              stroke={isDecade ? colors.gridMajor : colors.grid}
              strokeWidth={isDecade ? 1.0 : 0.6}
              strokeDasharray={isDecade ? undefined : '2,2'}
            />
          );
        })}

        {/* Vertical Enthalpy Grid Lines */}
        {hTicks.map((hJkg) => {
          const { x } = transform.project(hJkg, viewBounds.pMinPa);
          const hKj = Units.jkgToKjkg(hJkg);
          const isMajor = hKj % 100 === 0;
          return (
            <line
              key={`gx_${hJkg}`}
              x1={x}
              y1={rect.top}
              x2={x}
              y2={rect.top + rect.height}
              stroke={isMajor ? colors.gridMajor : colors.grid}
              strokeWidth={isMajor ? 1.0 : 0.6}
              strokeDasharray={isMajor ? undefined : '2,2'}
            />
          );
        })}

        {/* Saturation Dome Interior Fill */}
        {domeFillPath && (
          <path d={domeFillPath} fill={colors.domeFill} stroke="none" />
        )}

        {/* Quality Lines (x = const) */}
        {visibility.qualityLines &&
          dataset?.qualityLines.map((curve) => (
            <path
              key={curve.id}
              d={CurveGenerator.curveToSvgPath(curve, transform)}
              fill="none"
              stroke={colors.quality}
              strokeWidth={1.0}
              strokeDasharray="3,2"
              opacity={0.75}
            />
          ))}

        {/* Isochores (v = const) */}
        {visibility.isochores &&
          dataset?.isochores.map((curve) => (
            <path
              key={curve.id}
              d={CurveGenerator.curveToSvgPath(curve, transform)}
              fill="none"
              stroke={colors.isochore}
              strokeWidth={1.0}
              strokeDasharray="4,3"
              opacity={0.65}
            />
          ))}

        {/* Isentropes (s = const) */}
        {visibility.isentropics &&
          dataset?.isentropes.map((curve) => (
            <path
              key={curve.id}
              d={CurveGenerator.curveToSvgPath(curve, transform)}
              fill="none"
              stroke={colors.isentrope}
              strokeWidth={1.1}
              strokeDasharray="4,3"
              opacity={0.75}
            />
          ))}

        {/* Isotherms (T = const) */}
        {visibility.isotherms &&
          dataset?.isotherms.map((curve) => (
            <path
              key={curve.id}
              d={CurveGenerator.curveToSvgPath(curve, transform)}
              fill="none"
              stroke={colors.isotherm}
              strokeWidth={1.2}
              opacity={0.85}
            />
          ))}

        {/* Saturation Curves (Liquid & Vapor) */}
        {visibility.saturation && dataset && (
          <>
            <path
              d={CurveGenerator.curveToSvgPath(dataset.saturationLiquid, transform)}
              fill="none"
              stroke={colors.satCurve}
              strokeWidth={2.4}
            />
            <path
              d={CurveGenerator.curveToSvgPath(dataset.saturationVapor, transform)}
              fill="none"
              stroke={colors.satCurve}
              strokeWidth={2.4}
            />

            {/* Critical Point Apex Marker */}
            {(() => {
              const { x, y } = transform.projectPoint(dataset.criticalPoint);
              return (
                <g key="crit_point" transform={`translate(${x}, ${y})`}>
                  <circle
                    r={5}
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    filter="drop-shadow(0 0 6px rgba(244,63,94,0.8))"
                  />
                  <line x1={-6} y1={-6} x2={6} y2={6} stroke="#ffffff" strokeWidth={1.5} />
                  <line x1={-6} y1={6} x2={6} y2={-6} stroke="#ffffff" strokeWidth={1.5} />
                  <text
                    x={8}
                    y={-6}
                    fill="#f43f5e"
                    fontSize={10}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Crítico ({Units.kToC(dataset.domain.tCritK).toFixed(1)}°C,{' '}
                    {Units.paToBar(dataset.domain.pCritPa).toFixed(1)} bar)
                  </text>
                </g>
              );
            })()}
          </>
        )}

        {/* Dynamic Collision-Resolved Curve Labels */}
        {placedCurveLabels.map((lbl) => (
          <g key={lbl.id} transform={`translate(${lbl.x}, ${lbl.y})`}>
            <rect
              x={-lbl.box.width / 2}
              y={-lbl.box.height / 2}
              width={lbl.box.width}
              height={lbl.box.height}
              rx={3}
              fill={isDanfoss ? 'rgba(255,255,255,0.92)' : 'rgba(3,7,18,0.88)'}
              stroke={isDanfoss ? '#94a3b8' : '#334155'}
              strokeWidth={0.8}
            />
            <text
              fill={lbl.id.startsWith('lbl_t_') ? colors.isotherm : colors.quality}
              fontSize={8.5}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dy={3}
            >
              {lbl.text}
            </text>
          </g>
        ))}

        {/* User Connections / Processes */}
        {connections.map((conn) => {
          const p1 = points.find((p) => p.id === conn.fromPointId);
          const p2 = points.find((p) => p.id === conn.toPointId);
          if (!p1 || !p2) return null;

          const isSelected = conn.id === selectedConnectionId;

          let pathD = '';
          if (conn.pathPoints && conn.pathPoints.length >= 2) {
            conn.pathPoints.forEach((pt, i) => {
              const { x, y } = transform.project(
                Units.kjkgToJkg(pt.h_kj_kg),
                Units.barToPa(pt.p_bar)
              );
              pathD += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
            });
          } else {
            const pt1 = transform.project(
              Units.kjkgToJkg(p1.state.enthalpy_kj_kg),
              Units.barToPa(p1.state.pressure_bar)
            );
            const pt2 = transform.project(
              Units.kjkgToJkg(p2.state.enthalpy_kj_kg),
              Units.barToPa(p2.state.pressure_bar)
            );
            pathD = `M ${pt1.x.toFixed(2)} ${pt1.y.toFixed(2)} L ${pt2.x.toFixed(2)} ${pt2.y.toFixed(2)}`;
          }

          return (
            <g key={conn.id}>
              {/* Process line stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={conn.color || '#38bdf8'}
                strokeWidth={isSelected ? 3.5 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={isSelected ? 'drop-shadow(0 0 4px #38bdf8)' : undefined}
              />
            </g>
          );
        })}

        {/* User Points and Labels */}
        {points.map((pt) => {
          const { x, y } = transform.project(
            Units.kjkgToJkg(pt.state.enthalpy_kj_kg),
            Units.barToPa(pt.state.pressure_bar)
          );
          const isSelected = pt.id === selectedPointId;

          return (
            <g key={pt.id}>
              {/* Point Circle Marker */}
              <g
                transform={`translate(${x}, ${y})`}
                className="cursor-grab active:cursor-grabbing"
                onClick={(e) => {
                  e.stopPropagation();
                  onPointSelect?.(pt.id);
                }}
                onMouseDown={(e) => onPointMouseDown?.(e, pt.id)}
              >
                <circle
                  r={isSelected ? 7.5 : 5.5}
                  fill={pt.color || '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  filter={isSelected ? 'drop-shadow(0 0 6px #38bdf8)' : undefined}
                />
              </g>

              {/* Point Label Card */}
              {visibility.showPointLabels && visibility.pointLabelMode !== 'hidden' && (
                <g
                  transform={`translate(${x + pt.labelOffset.x}, ${y + pt.labelOffset.y})`}
                  className="cursor-move select-none"
                  onMouseDown={(e) => onLabelMouseDown?.(e, pt)}
                >
                  <rect
                    x={0}
                    y={0}
                    width={130}
                    height={75}
                    rx={6}
                    fill={isDanfoss ? 'rgba(255,255,255,0.94)' : 'rgba(11,17,32,0.92)'}
                    stroke={pt.color || '#38bdf8'}
                    strokeWidth={isSelected ? 1.8 : 1.2}
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                  />
                  <text
                    x={8}
                    y={16}
                    fill={pt.color || '#38bdf8'}
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pt.name}
                  </text>
                  <text
                    x={8}
                    y={30}
                    fill={isDanfoss ? '#0f172a' : '#f8fafc'}
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    T = {pt.state.temperature_c.toFixed(1)} °C
                  </text>
                  <text
                    x={8}
                    y={44}
                    fill={isDanfoss ? '#0f172a' : '#f8fafc'}
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    h = {pt.state.enthalpy_kj_kg.toFixed(1)} kJ/kg
                  </text>
                  <text
                    x={8}
                    y={58}
                    fill={isDanfoss ? '#0f172a' : '#f8fafc'}
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    v = {pt.state.specific_volume_m3_kg.toFixed(4)} m³/kg
                  </text>
                  <text
                    x={8}
                    y={70}
                    fill="#0284c7"
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    P = {pt.state.pressure_bar.toFixed(2)} bar(a)
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Hover / Point Creation Preview Marker */}
        {hoverPreviewPoint && (
          <g
            transform={`translate(${transform.project(hoverPreviewPoint.hJkg, hoverPreviewPoint.pPa).x}, ${
              transform.project(hoverPreviewPoint.hJkg, hoverPreviewPoint.pPa).y
            })`}
          >
            <circle r={6} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3,2" />
            <circle r={2} fill="#38bdf8" />
          </g>
        )}
      </g>

      {/* AXES (OUTSIDE CLIP PATH) */}
      {/* Bottom Axis (Enthalpy h) */}
      <line
        x1={rect.left}
        y1={rect.top + rect.height}
        x2={rect.left + rect.width}
        y2={rect.top + rect.height}
        stroke={colors.border}
        strokeWidth={1.2}
      />
      {hTicks.map((hJkg) => {
        const { x } = transform.project(hJkg, viewBounds.pMinPa);
        return (
          <g key={`ax_${hJkg}`} transform={`translate(${x}, ${rect.top + rect.height})`}>
            <line x1={0} y1={0} x2={0} y2={5} stroke={colors.border} strokeWidth={1} />
            <text
              y={16}
              textAnchor="middle"
              fill={colors.axisText}
              fontSize={10}
              fontFamily="monospace"
            >
              {Units.jkgToKjkg(hJkg)}
            </text>
          </g>
        );
      })}
      <text
        x={rect.left + rect.width / 2}
        y={rect.top + rect.height + 34}
        textAnchor="middle"
        fill={colors.axisText}
        fontWeight="bold"
        fontSize={11}
      >
        Entalpía específica, h [kJ/kg]
      </text>

      {/* Left Axis (Pressure P logarithmic) */}
      <line
        x1={rect.left}
        y1={rect.top}
        x2={rect.left}
        y2={rect.top + rect.height}
        stroke={colors.border}
        strokeWidth={1.2}
      />
      {pTicks.map((pPa) => {
        const { y } = transform.project(viewBounds.hMinJkg, pPa);
        const pBar = Units.paToBar(pPa);
        return (
          <g key={`ay_${pPa}`} transform={`translate(${rect.left}, ${y})`}>
            <line x1={-5} y1={0} x2={0} y2={0} stroke={colors.border} strokeWidth={1} />
            <text
              x={-8}
              y={3}
              textAnchor="end"
              fill={colors.axisText}
              fontSize={10}
              fontFamily="monospace"
            >
              {pBar >= 1 ? (pBar % 1 === 0 ? pBar.toFixed(0) : pBar.toFixed(1)) : pBar.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text
        transform="rotate(-90)"
        x={-(rect.top + rect.height / 2)}
        y={rect.left - 44}
        textAnchor="middle"
        fill={colors.axisText}
        fontWeight="bold"
        fontSize={11}
      >
        Presión absoluta, P [bar(a)] (escala logarítmica)
      </text>

      {/* Right Axis: Isochores v [m³/kg] */}
      {visibility.isochores && isochoreRightLabels.length > 0 && (
        <g className="isochore-right-axis">
          {isochoreRightLabels.map((item) => (
            <g key={`right_v_${item.id}`} transform={`translate(${rect.left + rect.width}, ${item.y})`}>
              <line x1={0} y1={0} x2={4} y2={0} stroke={colors.isochore} strokeWidth={1.2} />
              <text
                x={7}
                y={3}
                textAnchor="start"
                fill={colors.isochore}
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {item.text}
              </text>
            </g>
          ))}
          <text
            transform="rotate(90)"
            x={rect.top + rect.height / 2}
            y={-(rect.left + rect.width + 46)}
            textAnchor="middle"
            fill={colors.isochore}
            fontWeight="bold"
            fontSize={11}
          >
            Volumen específico, v [m³/kg]
          </text>
        </g>
      )}

      {/* Top Axis: Isochores v [m³/kg] that exit through the top boundary */}
      {visibility.isochores && isochoreTopLabels.length > 0 && (
        <g className="isochore-top-axis">
          {isochoreTopLabels.map((item) => (
            <g key={`top_v_${item.id}`} transform={`translate(${item.x}, ${rect.top})`}>
              <line x1={0} y1={0} x2={0} y2={-4} stroke={colors.isochore} strokeWidth={1.2} />
              <text
                x={0}
                y={-7}
                textAnchor="middle"
                fill={colors.isochore}
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {item.text}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};
