import React, { useCallback, useMemo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  useReactFlow,
} from '@xyflow/react';
import { PipeStateCategory, SchematicEdgeData } from '../../../types/schematic';
import { useSchematicActions } from '../SchematicActionsContext';
import {
  getDefaultWaypoints,
  makePointsStrictlyOrthogonal,
  createPipeSvgPath,
  snapToGrid,
} from './RefrigerantPipeEdge';
import {
  CircleDot,
  MoveHorizontal,
  MoveVertical,
  Plus,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

export const getWireColor = (state: PipeStateCategory): string => {
  switch (state) {
    case 'electric_phase':
      return '#b45309'; // Marrón (Fase L1 / Positivo DC)
    case 'electric_neutral':
      return '#2563eb'; // Azul eléctrico (Neutro N / Masa)
    case 'electric_ground':
      return '#65a30d'; // Verde lima tierra (PE)
    case 'electric_control':
      return '#dc2626'; // Rojo maniobra / 24V
    case 'electric_signal':
      return '#9333ea'; // Púrpura señal analógica
    default:
      return '#d97706'; // Ámbar cobrizo por defecto
  }
};

export const ElectricWireEdge: React.FC<EdgeProps> = ({
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
  const pipeState = edgeData.pipeState || 'electric_phase';
  const color = getWireColor(pipeState);
  const isAnimated = !!edgeData.isAnimated;
  const { onUpdateEdgeWaypoints, onDeleteEdge } = useSchematicActions();
  const { getZoom, setEdges, setNodes } = useReactFlow();
  const [showWireMenu, setShowWireMenu] = useState(false);

  const isHorizontalSource = sourcePosition === 'left' || sourcePosition === 'right';

  // Base raw waypoints (user custom waypoints or default orthogonal clearance bends)
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

  // Smooth wire SVG path with rounded corners
  const edgePath = useMemo(() => {
    return createPipeSvgPath(orthogonalPoints, 8);
  }, [orthogonalPoints]);

  // Center point for main action bar and badge
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
          if (startBendPoints.length > 0) {
            const newWaypoints = startBendPoints.map((pt, idx) => {
              if (idx === segmentIdx - 1 || idx === segmentIdx) {
                return { ...pt, y: newY };
              }
              return pt;
            });
            onUpdateEdgeWaypoints(id, newWaypoints);
          } else {
            const midX = snapToGrid((sourceX + targetX) / 2);
            onUpdateEdgeWaypoints(id, [
              { x: midX, y: newY },
              { x: targetX, y: newY },
            ]);
          }
        } else {
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

  // Insert an orthogonal jog / detour on a segment (+ button)
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

  // Insert electrical junction dot (punto de unión / regleta)
  const handleInsertJunction = () => {
    const junctionId = `junc_${Date.now()}`;
    const newNode = {
      id: junctionId,
      type: 'schematicNode',
      position: { x: snapToGrid(centerPoint.x - 20), y: snapToGrid(centerPoint.y - 20) },
      data: {
        componentType: 'junction_dot_electric' as const,
        label: 'Punto de Unión',
        tag: 'NOD-01',
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowWireMenu(false);
  };

  const handleChangeWireFunction = (newPipeState: PipeStateCategory) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            data: {
              ...e.data,
              pipeState: newPipeState,
            },
          };
        }
        return e;
      })
    );
    setShowWireMenu(false);
  };

  const handleChangeSection = (section: number) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            data: {
              ...e.data,
              wireSectionMm2: section,
            },
          };
        }
        return e;
      })
    );
    setShowWireMenu(false);
  };

  return (
    <>
      {/* Outer Selection Aura */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? '#38bdf8' : color}
        strokeWidth={selected ? 7 : isAnimated ? 5 : 3}
        strokeOpacity={selected ? 0.9 : isAnimated ? 0.4 : 0.15}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-150 cursor-pointer"
        onClick={() => setShowWireMenu(!showWireMenu)}
      />

      {/* Main Solid Electrical Wire Core */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2.5,
          stroke: color,
          strokeOpacity: 1,
          transition: 'stroke 0.2s ease',
        }}
      />

      {/* Earth PE Green-Yellow Striping */}
      {pipeState === 'electric_ground' && (
        <path
          d={edgePath}
          fill="none"
          stroke="#eab308"
          strokeWidth={2.5}
          strokeDasharray="6 6"
          className="pointer-events-none"
        />
      )}

      {/* Live Current Flow Animation */}
      {isAnimated && (
        <>
          {/* Moving luminous electron pulses */}
          <path
            d={edgePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="4 14"
            strokeLinecap="round"
            className="refrigerant-flow-animation pointer-events-none"
            style={{
              strokeOpacity: 0.95,
              filter: 'drop-shadow(0 0 4px #ffffff)',
            }}
          />
          <path
            d={edgePath}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeDasharray="2 18"
            strokeLinecap="round"
            className="refrigerant-flow-animation pointer-events-none"
            style={{
              strokeOpacity: 1,
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))',
            }}
          />
        </>
      )}

      {/* Interactive Controls, Waypoint Knobs, Sliders & Wire Context Menu */}
      <EdgeLabelRenderer>
        {/* 1. Draggable Corner Waypoint Knobs (Snaps to 15px grid, strictly 90-degree lines) */}
        {selected &&
          bendPoints.map((pt, idx) => (
            <div
              key={`wire-corner-${idx}`}
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
                className="w-5.5 h-5.5 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-135 transition-transform ring-4 ring-amber-400/40"
                title={`Vértice de cable #${idx + 1} (${pt.x}, ${pt.y}) - Arrastra para alinear`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>

              {bendPoints.length > 1 && (
                <button
                  onClick={(e) => handleDeleteCorner(e, idx)}
                  className="absolute -top-2.5 -right-2.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover/corner:opacity-100 transition-opacity shadow-md cursor-pointer text-[8px] border border-white/50"
                  title="Eliminar este punto"
                >
                  <X size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}

        {/* 2. Draggable Segment Midpoint Sliders & '+' Buttons to add bends */}
        {selected &&
          orthogonalPoints.slice(0, -1).map((p1, sIdx) => {
            const p2 = orthogonalPoints[sIdx + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const isHorizontal = Math.abs(p1.y - p2.y) < 1;

            if (dist < 30) return null;

            return (
              <div
                key={`wire-segment-ctrl-${sIdx}`}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
                  pointerEvents: 'auto',
                  zIndex: 99998,
                }}
                className="nodrag nopan flex items-center gap-1 isolate"
              >
                {/* Segment Line Drag Handle */}
                <div
                  onPointerDown={(e) => handleSegmentPointerDown(e, sIdx)}
                  className="w-6 h-6 rounded-lg bg-slate-950 dark:bg-black border-2 border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-white hover:border-white shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-120 transition-all ring-3 ring-amber-400/40"
                  title={
                    isHorizontal
                      ? 'Arrastrar tramo horizontal (Mover arriba/abajo)'
                      : 'Arrastrar tramo vertical (Mover izquierda/derecha)'
                  }
                >
                  {isHorizontal ? <MoveVertical size={11} strokeWidth={2.5} /> : <MoveHorizontal size={11} strokeWidth={2.5} />}
                </div>

                {/* Add Orthogonal Jog Button */}
                <button
                  onClick={() => handleInsertJog(sIdx)}
                  className="w-4.5 h-4.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center hover:scale-130 transition-transform cursor-pointer border border-white/40 ring-2 ring-amber-400/40"
                  title="Agregar punto / doblez en este tramo"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
              </div>
            );
          })}

        {/* 3. Wire Badge Pill and Popover Menu (Above the line at center point) */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -100%) translate(${centerPoint.x}px, ${centerPoint.y - 10}px)`,
            pointerEvents: 'auto',
            zIndex: 99999,
          }}
          className="nodrag nopan flex flex-col items-center gap-1 isolate"
        >
          {/* Wire Badge Pill */}
          <button
            type="button"
            onClick={() => setShowWireMenu(!showWireMenu)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shadow-xs transition-all cursor-pointer flex items-center gap-1 ${
              isAnimated
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-amber-400'
            }`}
            title="Opciones de cable eléctrico"
          >
            <Zap size={10} className={isAnimated ? 'text-amber-400 drop-shadow-[0_0_4px_#f59e0b]' : 'text-slate-400'} />
            <span>
              {edgeData.wireTag || (edgeData.wireSectionMm2 ? `${edgeData.wireSectionMm2}mm²` : 'Cable')}
            </span>
          </button>

          {/* Wire Context Popover Menu */}
          {showWireMenu && (
            <div className="w-56 p-2.5 rounded-xl bg-slate-900/98 dark:bg-black/95 text-white border border-amber-500/70 shadow-2xl backdrop-blur-md flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap size={11} /> Cable Eléctrico
                </span>
                <button
                  type="button"
                  onClick={() => setShowWireMenu(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Function / Color selection */}
              <div>
                <span className="text-[9px] text-slate-400 block mb-1">Tipo de Conductor:</span>
                <div className="grid grid-cols-2 gap-1 text-[8px]">
                  <button
                    type="button"
                    onClick={() => handleChangeWireFunction('electric_phase')}
                    className="px-1.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-700/60 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#b45309]" /> Fase / (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeWireFunction('electric_neutral')}
                    className="px-1.5 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border border-blue-700/60 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#2563eb]" /> Neutro / (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeWireFunction('electric_ground')}
                    className="px-1.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#65a30d]" /> Tierra PE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeWireFunction('electric_control')}
                    className="px-1.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-700/60 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#dc2626]" /> Maniobra
                  </button>
                </div>
              </div>

              {/* Wire section */}
              <div>
                <span className="text-[9px] text-slate-400 block mb-1">Sección del Cable:</span>
                <div className="flex gap-1">
                  {[1.0, 1.5, 2.5, 4.0, 6.0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChangeSection(s)}
                      className={`flex-1 py-0.5 rounded text-[8px] font-mono border cursor-pointer ${
                        edgeData.wireSectionMm2 === s
                          ? 'bg-amber-600 text-white border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={handleInsertJunction}
                  className="px-2 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CircleDot size={10} /> Punto Unión
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEdge && onDeleteEdge(id)}
                  className="p-1 rounded text-rose-400 hover:bg-rose-950/80 border border-rose-800/60 cursor-pointer"
                  title="Eliminar cable"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
