import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { PipeStateCategory, SchematicEdgeData } from '../../../types/schematic';

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

export const RefrigerantPipeEdge: React.FC<EdgeProps> = ({
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

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
  });

  const isAnimated = edgeData.isAnimated !== false;

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
        className="transition-all duration-200"
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
          {/* Secondary pulsating inner fluid layer */}
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
          {/* Glowing particle pulses */}
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
        /* Flow OFF: Static muted indicator */
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

      {/* Telemetry Badge on Edge center */}
      {(edgeData.pressureBar !== undefined || edgeData.temperatureC !== undefined || edgeData.customLabel) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`nodrag nopan flex items-center gap-1.5 px-2 py-0.5 rounded-md border shadow-md text-[10px] font-mono select-none hover:scale-105 transition-all backdrop-blur-xs ${
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
        </EdgeLabelRenderer>
      )}
    </>
  );
};
