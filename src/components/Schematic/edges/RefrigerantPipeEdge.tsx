import React, { useCallback, useMemo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  useReactFlow,
} from '@xyflow/react';
import { PipeStateCategory, SchematicComponentType, SchematicEdgeData } from '../../../types/schematic';
import { useSchematicActions } from '../SchematicActionsContext';
import {
  GitFork,
  MoveHorizontal,
  MoveVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

const GRID_SIZE = 15;

export const snapToGrid = (val: number, grid = GRID_SIZE): number => {
  return Math.round(val / grid) * grid;
};

export const getPipeColor = (state: PipeStateCategory): string => {
  switch (state) {
    case 'discharge_superheated':
      return '#ef4444'; // Rojo descarga
    case 'condensing_liquid':
      return '#f97316'; // Naranja condensación
    case 'subcooled_liquid':
      return '#eab308'; // Ámbar subenfriado
    case 'two_phase_flashing':
      return '#06b6d4'; // Cian mezcla bifásica
    case 'evaporating_vapor':
      return '#38bdf8'; // Azul cielo evaporación
    case 'suction_superheated':
      return '#2563eb'; // Azul cobalto aspiración
    case 'intermediate_pressure':
      return '#8b5cf6'; // Violeta economizador
    case 'oil_line':
      return '#84cc16'; // Verde oliva aceite
    case 'hot_gas_defrost':
      return '#a855f7'; // Púrpura desescarche
    case 'secondary_fluid':
      return '#10b981'; // Esmeralda agua
    case 'control_line':
    default:
      return '#94a3b8'; // Gris
  }
};

/**
 * Calculates initial orthogonal bend waypoints between two ports, avoiding routing
 * behind or through component bodies. Guarantees safe departure clearance out of the source
 * port and proper arrival clearance into the target port.
 */
export function getDefaultWaypoints(
  sourceX: number,
  sourceY: number,
  sourcePosition: string,
  targetX: number,
  targetY: number,
  targetPosition: string
): { x: number; y: number }[] {
  const CLEARANCE = 30; // Minimum clearance distance (px) away from component ports

  // Departure vector from source port (pointing outward away from component)
  const dirS = {
    x: sourcePosition === 'right' ? 1 : sourcePosition === 'left' ? -1 : 0,
    y: sourcePosition === 'bottom' ? 1 : sourcePosition === 'top' ? -1 : 0,
  };

  // Approach vector to target port (pointing outward from target port)
  const dirT = {
    x: targetPosition === 'right' ? 1 : targetPosition === 'left' ? -1 : 0,
    y: targetPosition === 'bottom' ? 1 : targetPosition === 'top' ? -1 : 0,
  };

  const isHorizontalSource = dirS.x !== 0;
  const isHorizontalTarget = dirT.x !== 0;

  // Clearance stub positions
  const pS = {
    x: snapToGrid(sourceX + dirS.x * CLEARANCE),
    y: snapToGrid(sourceY + dirS.y * CLEARANCE),
  };
  const pT = {
    x: snapToGrid(targetX + dirT.x * CLEARANCE),
    y: snapToGrid(targetY + dirT.y * CLEARANCE),
  };

  // Case A: Both Ports Horizontal ('left' or 'right')
  if (isHorizontalSource && isHorizontalTarget) {
    if (sourcePosition === 'right' && targetPosition === 'left') {
      if (sourceX + CLEARANCE <= targetX - CLEARANCE) {
        // Direct forward routing with mid vertical segment
        const midX = snapToGrid((sourceX + targetX) / 2);
        return [
          { x: midX, y: sourceY },
          { x: midX, y: targetY },
        ];
      } else {
        // Target is behind or overlapping: detour around top or bottom
        const detourY =
          Math.abs(sourceY - targetY) < 15
            ? snapToGrid(sourceY - 60)
            : sourceY < targetY
            ? snapToGrid(Math.min(sourceY, targetY) - 45)
            : snapToGrid(Math.max(sourceY, targetY) + 45);
        return [
          { x: pS.x, y: sourceY },
          { x: pS.x, y: detourY },
          { x: pT.x, y: detourY },
          { x: pT.x, y: targetY },
        ];
      }
    } else if (sourcePosition === 'left' && targetPosition === 'right') {
      if (sourceX - CLEARANCE >= targetX + CLEARANCE) {
        // Direct forward routing
        const midX = snapToGrid((sourceX + targetX) / 2);
        return [
          { x: midX, y: sourceY },
          { x: midX, y: targetY },
        ];
      } else {
        // Detour around
        const detourY =
          Math.abs(sourceY - targetY) < 15
            ? snapToGrid(sourceY - 60)
            : sourceY < targetY
            ? snapToGrid(Math.min(sourceY, targetY) - 45)
            : snapToGrid(Math.max(sourceY, targetY) + 45);
        return [
          { x: pS.x, y: sourceY },
          { x: pS.x, y: detourY },
          { x: pT.x, y: detourY },
          { x: pT.x, y: targetY },
        ];
      }
    } else if (sourcePosition === 'right' && targetPosition === 'right') {
      // Both face right: loop to the right of both
      const maxX = snapToGrid(Math.max(sourceX, targetX) + 45);
      return [
        { x: maxX, y: sourceY },
        { x: maxX, y: targetY },
      ];
    } else {
      // Both face left: loop to the left of both
      const minX = snapToGrid(Math.min(sourceX, targetX) - 45);
      return [
        { x: minX, y: sourceY },
        { x: minX, y: targetY },
      ];
    }
  }

  // Case B: Both Ports Vertical ('top' or 'bottom')
  if (!isHorizontalSource && !isHorizontalTarget) {
    if (sourcePosition === 'bottom' && targetPosition === 'top') {
      if (sourceY + CLEARANCE <= targetY - CLEARANCE) {
        // Direct downward routing with mid horizontal segment
        const midY = snapToGrid((sourceY + targetY) / 2);
        return [
          { x: sourceX, y: midY },
          { x: targetX, y: midY },
        ];
      } else {
        // Target is above or overlapping: detour around left or right
        const detourX =
          Math.abs(sourceX - targetX) < 15
            ? snapToGrid(sourceX + 60)
            : sourceX < targetX
            ? snapToGrid(Math.min(sourceX, targetX) - 45)
            : snapToGrid(Math.max(sourceX, targetX) + 45);
        return [
          { x: sourceX, y: pS.y },
          { x: detourX, y: pS.y },
          { x: detourX, y: pT.y },
          { x: targetX, y: pT.y },
        ];
      }
    } else if (sourcePosition === 'top' && targetPosition === 'bottom') {
      if (sourceY - CLEARANCE >= targetY + CLEARANCE) {
        // Direct upward routing
        const midY = snapToGrid((sourceY + targetY) / 2);
        return [
          { x: sourceX, y: midY },
          { x: targetX, y: midY },
        ];
      } else {
        // Detour around
        const detourX =
          Math.abs(sourceX - targetX) < 15
            ? snapToGrid(sourceX + 60)
            : sourceX < targetX
            ? snapToGrid(Math.min(sourceX, targetX) - 45)
            : snapToGrid(Math.max(sourceX, targetX) + 45);
        return [
          { x: sourceX, y: pS.y },
          { x: detourX, y: pS.y },
          { x: detourX, y: pT.y },
          { x: targetX, y: pT.y },
        ];
      }
    } else if (sourcePosition === 'top' && targetPosition === 'top') {
      // Both face top: loop above both
      const minY = snapToGrid(Math.min(sourceY, targetY) - 45);
      return [
        { x: sourceX, y: minY },
        { x: targetX, y: minY },
      ];
    } else {
      // Both face bottom: loop below both
      const maxY = snapToGrid(Math.max(sourceY, targetY) + 45);
      return [
        { x: sourceX, y: maxY },
        { x: targetX, y: maxY },
      ];
    }
  }

  // Case C: Mixed - Horizontal Source ('left'/'right') and Vertical Target ('top'/'bottom')
  if (isHorizontalSource && !isHorizontalTarget) {
    // Valid single-corner condition:
    const validHorizontal =
      sourcePosition === 'right' ? targetX >= sourceX + 20 : targetX <= sourceX - 20;
    const validVertical =
      targetPosition === 'top' ? sourceY <= targetY - 20 : sourceY >= targetY + 20;

    if (validHorizontal && validVertical) {
      return [{ x: targetX, y: sourceY }];
    }

    // Otherwise detour with clearance stubs so it never cuts into component bodies
    return [
      { x: pS.x, y: sourceY },
      { x: pS.x, y: pT.y },
      { x: targetX, y: pT.y },
    ];
  }

  // Case D: Mixed - Vertical Source ('top'/'bottom') and Horizontal Target ('left'/'right')
  if (!isHorizontalSource && isHorizontalTarget) {
    // Valid single-corner condition:
    const validVertical =
      sourcePosition === 'bottom' ? targetY >= sourceY + 20 : targetY <= sourceY - 20;
    const validHorizontal =
      targetPosition === 'left' ? sourceX <= targetX - 20 : sourceX >= targetX + 20;

    if (validVertical && validHorizontal) {
      return [{ x: sourceX, y: targetY }];
    }

    // Otherwise detour with clearance stubs
    return [
      { x: sourceX, y: pS.y },
      { x: pT.x, y: pS.y },
      { x: pT.x, y: targetY },
    ];
  }

  return [];
}

/**
 * Ensures ANY sequence of points is converted to strictly horizontal and vertical 90-degree orthogonal segments.
 * Eliminates all diagonals and removes redundant collinear points.
 */
export function makePointsStrictlyOrthogonal(
  points: { x: number; y: number }[],
  initialHorizontal = true
): { x: number; y: number }[] {
  if (points.length <= 1) return points;

  const result: { x: number; y: number }[] = [{ ...points[0] }];
  let isHorizontal = initialHorizontal;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = result[result.length - 1];
    const next = points[i + 1];

    const dx = next.x - curr.x;
    const dy = next.y - curr.y;

    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      continue;
    }

    if (Math.abs(dx) < 0.1 || Math.abs(dy) < 0.1) {
      // Already strictly horizontal or vertical
      result.push({ ...next });
      isHorizontal = Math.abs(dy) < 0.1;
    } else {
      // Diagonal: insert orthogonal 90-degree elbow corner
      if (isHorizontal) {
        result.push({ x: next.x, y: curr.y });
        result.push({ x: next.x, y: next.y });
        isHorizontal = false;
      } else {
        result.push({ x: curr.x, y: next.y });
        result.push({ x: next.x, y: next.y });
        isHorizontal = true;
      }
    }
  }

  // Clean redundant collinear points
  const cleaned: { x: number; y: number }[] = [];
  for (let i = 0; i < result.length; i++) {
    if (i === 0 || i === result.length - 1) {
      cleaned.push(result[i]);
      continue;
    }
    const prev = cleaned[cleaned.length - 1];
    const curr = result[i];
    const next = result[i + 1];

    const isCollinearX = Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1;
    const isCollinearY = Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1;

    if (!isCollinearX && !isCollinearY) {
      cleaned.push(curr);
    }
  }

  return cleaned;
}

/**
 * Creates a smooth SVG path with rounded 90-degree corners through strictly orthogonal points
 */
export function createPipeSvgPath(points: { x: number; y: number }[], radius = 12): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);

    const r = Math.min(radius, d1 / 2, d2 / 2);

    if (r < 1) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const startX = curr.x - ((curr.x - prev.x) / (d1 || 1)) * r;
    const startY = curr.y - ((curr.y - prev.y) / (d1 || 1)) * r;

    const endX = curr.x + ((next.x - curr.x) / (d2 || 1)) * r;
    const endY = curr.y + ((next.y - curr.y) / (d2 || 1)) * r;

    path += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`;
  }

  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return path;
}

export const RefrigerantPipeEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const edgeData = (data || {}) as SchematicEdgeData;
  const pipeState = edgeData.pipeState || 'discharge_superheated';
  const color = getPipeColor(pipeState);
  const { onUpdateEdgeWaypoints, onSplitEdge, onDeleteEdge } = useSchematicActions();
  const { getZoom } = useReactFlow();
  const [showFittingMenu, setShowFittingMenu] = useState(false);

  const isHorizontalSource = sourcePosition === 'left' || sourcePosition === 'right';

  // Base raw waypoints (user custom waypoints or default orthogonal bends)
  const rawWaypoints = useMemo(() => {
    if (edgeData.waypoints && edgeData.waypoints.length > 0) {
      return edgeData.waypoints;
    }
    return getDefaultWaypoints(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition);
  }, [edgeData.waypoints, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]);

  // Strictly orthogonal full points [Source, ...Waypoints, Target] (0 diagonals guaranteed)
  const orthogonalPoints = useMemo(() => {
    const raw = [{ x: sourceX, y: sourceY }, ...rawWaypoints, { x: targetX, y: targetY }];
    return makePointsStrictlyOrthogonal(raw, isHorizontalSource);
  }, [sourceX, sourceY, rawWaypoints, targetX, targetY, isHorizontalSource]);

  // Intermediate bend corners (excluding source & target)
  const bendPoints = useMemo(() => {
    if (orthogonalPoints.length <= 2) return [];
    return orthogonalPoints.slice(1, -1);
  }, [orthogonalPoints]);

  // Generate SVG Path
  const edgePath = useMemo(() => {
    return createPipeSvgPath(orthogonalPoints, 14);
  }, [orthogonalPoints]);

  // Center point for main action bar and telemetry
  const centerPoint = useMemo(() => {
    if (orthogonalPoints.length < 2) return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
    const midIdx = Math.floor(orthogonalPoints.length / 2);
    const p1 = orthogonalPoints[midIdx - 1];
    const p2 = orthogonalPoints[midIdx];
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }, [orthogonalPoints, sourceX, sourceY, targetX, targetY]);

  const isAnimated = edgeData.isAnimated !== false;

  // Handle dragging a specific corner point (snapped to 15px grid)
  const handleCornerPointerDown = useCallback(
    (e: React.PointerEvent, cornerIdx: number) => {
      e.stopPropagation();
      e.preventDefault();

      const zoom = getZoom() || 1;
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startPoints = [...orthogonalPoints.slice(1, -1)];
      const initialCorner = { ...startPoints[cornerIdx] };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!onUpdateEdgeWaypoints) return;
        const dx = (moveEvent.clientX - startClientX) / zoom;
        const dy = (moveEvent.clientY - startClientY) / zoom;

        const snappedX = snapToGrid(initialCorner.x + dx);
        const snappedY = snapToGrid(initialCorner.y + dy);

        const newPoints = startPoints.map((pt, idx) => {
          if (idx === cornerIdx) {
            return { x: snappedX, y: snappedY };
          }
          return pt;
        });

        onUpdateEdgeWaypoints(id, newPoints);
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [orthogonalPoints, getZoom, onUpdateEdgeWaypoints, id]
  );

  // Handle dragging an entire segment (shifts horizontal line in Y, or vertical line in X)
  const handleSegmentPointerDown = useCallback(
    (e: React.PointerEvent, segmentIdx: number) => {
      e.stopPropagation();
      e.preventDefault();

      const p1 = orthogonalPoints[segmentIdx];
      const p2 = orthogonalPoints[segmentIdx + 1];
      const isHorizontalSegment = Math.abs(p1.y - p2.y) < 1;

      const zoom = getZoom() || 1;
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startBendPoints = orthogonalPoints.slice(1, -1);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!onUpdateEdgeWaypoints) return;
        const dx = (moveEvent.clientX - startClientX) / zoom;
        const dy = (moveEvent.clientY - startClientY) / zoom;

        if (isHorizontalSegment) {
          const newY = snapToGrid(p1.y + dy);
          // If segment connects corners, shift them
          if (startBendPoints.length > 0) {
            const newWaypoints = startBendPoints.map((pt, idx) => {
              if (idx === segmentIdx - 1 || idx === segmentIdx) {
                return { ...pt, y: newY };
              }
              return pt;
            });
            onUpdateEdgeWaypoints(id, newWaypoints);
          } else {
            // Create waypoints to jog the line
            const midX = snapToGrid((sourceX + targetX) / 2);
            onUpdateEdgeWaypoints(id, [
              { x: midX, y: newY },
              { x: targetX, y: newY },
            ]);
          }
        } else {
          // Vertical segment: shift X
          const newX = snapToGrid(p1.x + dx);
          if (startBendPoints.length > 0) {
            const newWaypoints = startBendPoints.map((pt, idx) => {
              if (idx === segmentIdx - 1 || idx === segmentIdx) {
                return { ...pt, x: newX };
              }
              return pt;
            });
            onUpdateEdgeWaypoints(id, newWaypoints);
          } else {
            const midY = snapToGrid((sourceY + targetY) / 2);
            onUpdateEdgeWaypoints(id, [
              { x: newX, y: midY },
              { x: newX, y: targetY },
            ]);
          }
        }
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [orthogonalPoints, getZoom, onUpdateEdgeWaypoints, id, sourceX, targetX, sourceY, targetY]
  );

  // Insert an orthogonal jog / detour on a segment
  const handleInsertJog = useCallback(
    (segmentIdx: number) => {
      if (!onUpdateEdgeWaypoints) return;
      const p1 = orthogonalPoints[segmentIdx];
      const p2 = orthogonalPoints[segmentIdx + 1];
      const isHorizontalSegment = Math.abs(p1.y - p2.y) < 1;

      const currentBends = orthogonalPoints.slice(1, -1);

      if (isHorizontalSegment) {
        const midX = snapToGrid((p1.x + p2.x) / 2);
        const jogY = snapToGrid(p1.y + 45);
        const newBends = [...currentBends];
        newBends.splice(segmentIdx, 0, { x: midX, y: p1.y }, { x: midX, y: jogY });
        onUpdateEdgeWaypoints(id, newBends);
      } else {
        const midY = snapToGrid((p1.y + p2.y) / 2);
        const jogX = snapToGrid(p1.x + 45);
        const newBends = [...currentBends];
        newBends.splice(segmentIdx, 0, { x: p1.x, y: midY }, { x: jogX, y: midY });
        onUpdateEdgeWaypoints(id, newBends);
      }
    },
    [orthogonalPoints, onUpdateEdgeWaypoints, id]
  );

  // Delete a specific corner bend
  const handleDeleteCorner = useCallback(
    (e: React.MouseEvent, cornerIdx: number) => {
      e.stopPropagation();
      if (!onUpdateEdgeWaypoints || bendPoints.length <= 1) return;
      const newBends = bendPoints.filter((_, i) => i !== cornerIdx);
      onUpdateEdgeWaypoints(id, newBends);
    },
    [bendPoints, id, onUpdateEdgeWaypoints]
  );

  // Insert fitting at center position
  const handleInsertFitting = useCallback(
    (type: SchematicComponentType) => {
      if (!onSplitEdge) return;
      onSplitEdge(id, type, { x: snapToGrid(centerPoint.x), y: snapToGrid(centerPoint.y) });
      setShowFittingMenu(false);
    },
    [centerPoint, id, onSplitEdge]
  );

  return (
    <>
      {/* Outer Glow / Base Pipe Outline */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? '#38bdf8' : color}
        strokeWidth={selected ? 8 : isAnimated ? 6 : 4}
        strokeOpacity={selected ? 0.95 : isAnimated ? 0.45 : 0.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200 cursor-pointer"
      />

      {/* Main Solid Inner Pipe Core */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isAnimated ? 3.5 : 2.5,
          stroke: color,
          strokeOpacity: isAnimated ? 1 : 0.65,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Flow Active: Dynamic Moving Fluid Stream */}
      {isAnimated ? (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="7 12"
            strokeLinecap="round"
            className="refrigerant-flow-animation pointer-events-none"
            style={{
              strokeOpacity: 0.95,
            }}
          />
          <path
            d={edgePath}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeDasharray="3 16"
            strokeLinecap="round"
            className="refrigerant-flow-animation pointer-events-none"
            style={{
              strokeOpacity: 1,
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))',
            }}
          />
        </>
      ) : (
        <path
          d={edgePath}
          fill="none"
          stroke="#64748b"
          strokeWidth={1}
          strokeDasharray="2 6"
          strokeOpacity={0.4}
          className="pointer-events-none"
        />
      )}

      {/* Interactive Controls & Action Bar */}
      <EdgeLabelRenderer>
        {/* 1. Draggable Corner Waypoint Knobs (Snaps to 15px grid, strictly 90-degree lines) */}
        {selected &&
          bendPoints.map((pt, idx) => (
            <div
              key={`corner-${idx}`}
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${pt.x}px,${pt.y}px)`,
                pointerEvents: 'auto',
                zIndex: 99999,
              }}
              className="nodrag nopan group/corner isolate"
            >
              <div
                onPointerDown={(e) => handleCornerPointerDown(e, idx)}
                className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-400 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-130 transition-transform ring-4 ring-sky-400/40"
                title={`Vértice #${idx + 1} (${pt.x}, ${pt.y}) - Arrastra para alinear en cuadrícula`}
              >
                <div className="w-2 h-2 rounded-full bg-sky-500" />
              </div>

              {bendPoints.length > 1 && (
                <button
                  onClick={(e) => handleDeleteCorner(e, idx)}
                  className="absolute -top-3 -right-3 w-4.5 h-4.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover/corner:opacity-100 transition-opacity shadow-md cursor-pointer text-[9px] border border-white/50"
                  title="Eliminar este vértice"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}

        {/* 2. Draggable Segment Midpoint Sliders (Drag line up/down or left/right) & '+' Buttons */}
        {selected &&
          orthogonalPoints.slice(0, -1).map((p1, sIdx) => {
            const p2 = orthogonalPoints[sIdx + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const isHorizontal = Math.abs(p1.y - p2.y) < 1;

            if (dist < 35) return null;

            return (
              <div
                key={`segment-ctrl-${sIdx}`}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
                  pointerEvents: 'auto',
                  zIndex: 99998,
                }}
                className="nodrag nopan flex items-center gap-1.5 isolate"
              >
                {/* Segment Line Drag Handle */}
                <div
                  onPointerDown={(e) => handleSegmentPointerDown(e, sIdx)}
                  className="w-7 h-7 rounded-lg bg-slate-950 dark:bg-black border-2 border-sky-400 text-sky-300 hover:bg-sky-500 hover:text-white hover:border-white shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-125 transition-all ring-4 ring-sky-400/50"
                  title={
                    isHorizontal
                      ? 'Arrastrar tramo horizontal (Mover arriba/abajo)'
                      : 'Arrastrar tramo vertical (Mover izquierda/derecha)'
                  }
                >
                  {isHorizontal ? <MoveVertical size={13} strokeWidth={2.5} /> : <MoveHorizontal size={13} strokeWidth={2.5} />}
                </div>

                {/* Add Orthogonal Jog Button */}
                <button
                  onClick={() => handleInsertJog(sIdx)}
                  className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:scale-130 transition-transform cursor-pointer border border-white/40 ring-2 ring-emerald-400/40"
                  title="Agregar doblez en cuadrícula aquí"
                >
                  <Plus size={11} strokeWidth={3} />
                </button>
              </div>
            );
          })}

        {/* 3. Floating Bar & Telemetry: Positioned ABOVE the line so it never overlaps the pipe or segment handles */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -100%) translate(${centerPoint.x}px,${centerPoint.y - 12}px)`,
            pointerEvents: 'auto',
            zIndex: 99999,
          }}
          className="nodrag nopan flex flex-col items-center gap-1 isolate"
        >
          {/* Fitting Picker Dropdown (Renders on top when active) */}
          {selected && showFittingMenu && (
            <div className="flex items-center gap-1 p-1 bg-slate-950/95 border border-emerald-500/70 rounded-lg shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150 mb-0.5">
              <button
                onClick={() => handleInsertFitting('pipe_union_tee')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                title="Insertar Te de derivación (3 vías)"
              >
                <span>Te (T)</span>
              </button>
              <button
                onClick={() => handleInsertFitting('pipe_union_elbow')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                title="Insertar Codo a 90°"
              >
                <span>Codo 90°</span>
              </button>
              <button
                onClick={() => handleInsertFitting('pipe_union_cross')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                title="Insertar Cruz de 4 vías"
              >
                <span>Cruz 4 Vías</span>
              </button>
              <button
                onClick={() => handleInsertFitting('pipe_union_straight')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                title="Insertar Unión bilateral recta"
              >
                <span>Recta</span>
              </button>
              <button
                onClick={() => handleInsertFitting('pipe_junction_dot')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                title="Insertar Punto de empalme compacto"
              >
                <span>Empalme</span>
              </button>
            </div>
          )}

          {/* Action Toolbar on Selection */}
          {selected && (
            <div className="flex items-center gap-1.5 bg-slate-900/95 dark:bg-black/95 border border-sky-500/60 shadow-xl rounded-lg px-2 py-1 text-white text-[10px] font-sans backdrop-blur-md animate-in fade-in zoom-in-90 duration-150">
              {/* Insert Fitting Button */}
              <button
                onClick={() => setShowFittingMenu(!showFittingMenu)}
                className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  showFittingMenu
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                }`}
                title="Insertar componente de unión (Te, Codo, Cruz, Empalme) en este punto"
              >
                <GitFork size={12} />
                <span>Unión...</span>
              </button>

              <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

              {/* Delete Edge */}
              {onDeleteEdge && (
                <button
                  onClick={() => onDeleteEdge(id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Eliminar esta tubería"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}

          {/* Telemetry Badge (Displayed above the line) */}
          {(edgeData.pressureBar !== undefined || edgeData.temperatureC !== undefined || edgeData.customLabel) && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border shadow-md text-[10px] font-mono select-none hover:scale-105 transition-all backdrop-blur-xs ${
                isAnimated
                  ? 'bg-slate-900/95 dark:bg-black/95 border-slate-700/80 text-slate-200 ring-1 ring-white/10'
                  : 'bg-slate-800/80 dark:bg-slate-900/80 border-slate-700/40 text-slate-400 opacity-75'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isAnimated ? 'animate-ping' : ''}`}
                style={{ backgroundColor: color }}
              />
              {edgeData.customLabel && (
                <span className="font-semibold text-slate-300">{edgeData.customLabel}</span>
              )}
              {edgeData.pressureBar !== undefined && (
                <span className="text-sky-400 font-bold">{edgeData.pressureBar.toFixed(1)} bar</span>
              )}
              {edgeData.temperatureC !== undefined && (
                <span className="text-amber-400">{edgeData.temperatureC.toFixed(1)}°C</span>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};



