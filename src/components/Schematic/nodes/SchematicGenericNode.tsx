import React, { memo, useState } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { SchematicNodeData } from '../../../types/schematic';
import { COMPONENT_DEFINITIONS } from '../symbols/componentDefinitions';
import { SvgSymbol } from '../symbols/SvgSymbols';
import { useProject } from '../../../context/ProjectContext';

const mapPortPosition = (pos: 'left' | 'right' | 'top' | 'bottom'): Position => {
  switch (pos) {
    case 'left':
      return Position.Left;
    case 'right':
      return Position.Right;
    case 'top':
      return Position.Top;
    case 'bottom':
      return Position.Bottom;
  }
};

const getPortHandleColor = (kind: string): string => {
  switch (kind) {
    case 'discharge':
      return '#ef4444'; // Red
    case 'condensed':
      return '#f97316'; // Orange
    case 'subcooled':
      return '#eab308'; // Amber
    case 'expansion_out':
      return '#06b6d4'; // Cyan
    case 'evaporated':
      return '#38bdf8'; // Sky blue
    case 'suction':
      return '#2563eb'; // Deep blue
    case 'intermediate':
      return '#8b5cf6'; // Purple
    case 'oil':
      return '#84cc16'; // Lime
    case 'water_in':
    case 'water_out':
      return '#10b981'; // Emerald
    case 'equalization':
      return '#f43f5e'; // Rose
    case 'bulb':
      return '#eab308'; // Yellow
    default:
      return '#94a3b8'; // Slate
  }
};

const getPortOffsetClass = (pos: 'left' | 'right' | 'top' | 'bottom') => {
  switch (pos) {
    case 'left':
      return '-left-1 -translate-x-full';
    case 'right':
      return '-right-1 translate-x-full';
    case 'top':
      return '-top-1 -translate-y-full';
    case 'bottom':
      return '-bottom-1 translate-y-full';
  }
};

export const SchematicGenericNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SchematicNodeData;
  const { themeMode } = useProject();
  const def = COMPONENT_DEFINITIONS[nodeData.componentType];
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);

  if (!def) {
    return (
      <div className="p-3 bg-red-500/20 border border-red-500 text-red-400 rounded text-xs font-mono">
        Componente desconocido: {nodeData.componentType}
      </div>
    );
  }

  const rotation = nodeData.rotation || 0;
  const flippedH = nodeData.flippedHorizontal ? -1 : 1;
  const flippedV = nodeData.flippedVertical ? -1 : 1;
  const transform = `rotate(${rotation}deg) scale(${flippedH}, ${flippedV})`;

  // Summary Specs text to display on node footer
  const renderSpecsSnippet = () => {
    // Instruments (Gauges, Sensors, Meters)
    if (nodeData.measuredValue !== undefined) {
      return (
        <span className="font-bold text-amber-400 dark:text-amber-300 text-[11px]">
          {nodeData.measuredValue} {nodeData.measuredUnit || ''}
        </span>
      );
    }

    // Compressors
    if (def.category === 'compressors') {
      const parts: string[] = [];
      if (nodeData.powerKw) parts.push(`${nodeData.powerKw} kW`);
      if (nodeData.pressureOutBar && nodeData.pressureInBar) {
        parts.push(`${nodeData.pressureOutBar}/${nodeData.pressureInBar} bar`);
      } else if (nodeData.displacementM3h) {
        parts.push(`${nodeData.displacementM3h} m³/h`);
      }
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    // Heat Exchangers
    if (def.category === 'heat_exchangers') {
      const parts: string[] = [];
      if (nodeData.capacityKw) parts.push(`${nodeData.capacityKw} kW`);
      if (nodeData.setpointTempC !== undefined) parts.push(`${nodeData.setpointTempC}°C`);
      if (nodeData.superheatK) parts.push(`SH: ${nodeData.superheatK}K`);
      if (nodeData.subcoolingK) parts.push(`SC: ${nodeData.subcoolingK}K`);
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    // Expansion Devices
    if (def.category === 'expansion') {
      const parts: string[] = [];
      if (nodeData.superheatK) parts.push(`SH: ${nodeData.superheatK}K`);
      if (nodeData.setpointBar) parts.push(`Set: ${nodeData.setpointBar} bar`);
      if (nodeData.openingPercent !== undefined) parts.push(`${nodeData.openingPercent}%`);
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    // Vessels
    if (def.category === 'vessels') {
      if (nodeData.volumeL) return `Vol: ${nodeData.volumeL} L`;
      if (nodeData.pressureOutBar) return `${nodeData.pressureOutBar} bar`;
    }

    // Valves
    if (nodeData.voltageV) return `${nodeData.voltageV} V`;
    if (nodeData.setpointBar) return `Set: ${nodeData.setpointBar} bar`;

    return null;
  };

  const specsText = renderSpecsSnippet();

  return (
    <div
      className={`group relative flex flex-col items-center justify-start p-2 rounded-xl transition-all duration-150 select-none bg-white/95 dark:bg-[#141720]/95 border shadow-md ${
        selected
          ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 border-sky-400 shadow-sky-500/20'
          : 'border-slate-300/80 dark:border-slate-750/90 hover:border-sky-400/70 hover:shadow-lg'
      }`}
      style={{
        width: `${def.dimensions.width + 10}px`,
        minHeight: `${def.dimensions.height + 15}px`,
      }}
    >
      {/* Top Header: Tag & Model */}
      <div className="w-full flex items-center justify-between gap-1 pb-1 mb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 truncate">
            {nodeData.tag || def.defaultTagPrefix}
          </span>
          {nodeData.modelNumber && (
            <span className="text-[8px] font-mono text-slate-400 truncate max-w-[65px]" title={nodeData.modelNumber}>
              {nodeData.modelNumber}
            </span>
          )}
        </div>

        {/* Operating Status Indicator */}
        <div className="flex items-center gap-1 shrink-0">
          {nodeData.isEnergized ? (
            <span className="flex h-2 w-2 relative" title="En servicio / Activo">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" title="Detenido" />
          )}
        </div>
      </div>

      {/* Main SVG Symbol Body */}
      <div
        className="relative flex items-center justify-center p-1 rounded-lg transition-transform duration-100 my-auto"
        style={{ transform }}
      >
        <SvgSymbol
          type={nodeData.componentType}
          width={def.dimensions.width - 24}
          height={def.dimensions.height - 42}
          isSelected={selected}
          isEnergized={nodeData.isEnergized}
          themeMode={themeMode}
        />
      </div>

      {/* Port Handles & Visual Badges */}
      {def.ports.map((port) => {
        const handlePosition = mapPortPosition(port.position);
        const handleColor = getPortHandleColor(port.kind);
        const isHovered = hoveredPortId === port.id;

        return (
          <React.Fragment key={port.id}>
            {/* React Flow Connection Handle */}
            <Handle
              id={port.id}
              type="source"
              position={handlePosition}
              isConnectable={true}
              onMouseEnter={() => setHoveredPortId(port.id)}
              onMouseLeave={() => setHoveredPortId(null)}
              className="w-4! h-4! rounded-full border-2 border-white dark:border-slate-950 transition-all duration-150 hover:scale-140! z-30 cursor-crosshair shadow-md hover:ring-2 hover:ring-sky-400"
              style={{
                backgroundColor: handleColor,
              }}
            />

            {/* Port Short Code Label Pin */}
            <div
              className={`absolute pointer-events-none z-20 flex items-center px-1 py-0.2 rounded font-mono font-bold text-[8px] border shadow-xs transition-opacity duration-150 ${
                port.position === 'left'
                  ? 'left-0 -translate-x-full mr-1'
                  : port.position === 'right'
                  ? 'right-0 translate-x-full ml-1'
                  : port.position === 'top'
                  ? 'top-0 -translate-y-full mb-1'
                  : 'bottom-0 translate-y-full mt-1'
              } ${
                isHovered
                  ? 'bg-sky-600 text-white border-sky-400 opacity-100 z-40 scale-105'
                  : 'bg-slate-900/90 dark:bg-black/90 text-slate-200 border-slate-700/80 opacity-80'
              }`}
              style={{
                borderLeftColor: port.position === 'left' ? handleColor : undefined,
                borderRightColor: port.position === 'right' ? handleColor : undefined,
                borderTopColor: port.position === 'top' ? handleColor : undefined,
                borderBottomColor: port.position === 'bottom' ? handleColor : undefined,
              }}
            >
              <span>{port.shortCode}</span>
            </div>

            {/* Floating Rich Tooltip on Handle Hover */}
            {isHovered && (
              <div
                className={`absolute z-50 pointer-events-none nodrag nopan w-48 p-2 rounded-lg bg-slate-900/95 dark:bg-black/95 text-white border border-sky-500/60 shadow-xl backdrop-blur-md flex flex-col gap-1 text-left animate-in fade-in zoom-in-95 duration-100 ${getPortOffsetClass(
                  port.position
                )}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: handleColor }} />
                  <span className="font-bold text-[10px] text-sky-400 uppercase tracking-tight">
                    {port.name} ({port.shortCode})
                  </span>
                </div>
                <p className="text-[9px] text-slate-300 leading-tight">
                  {port.hint}
                </p>
                <div className="text-[8px] font-mono text-slate-400 mt-0.5 pt-0.5 border-t border-slate-800 flex justify-between">
                  <span>Tipo: {port.kind}</span>
                  <span className="text-sky-300">Arrastra para conectar</span>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Bottom Label & User Title */}
      <div className="w-full flex flex-col items-center mt-1 pt-1 border-t border-slate-200/80 dark:border-slate-800">
        <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 text-center leading-tight truncate w-full">
          {nodeData.customName || nodeData.label || def.defaultLabel}
        </span>

        {/* Engineering Specs Chip */}
        {specsText && (
          <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1c202a] border border-slate-200 dark:border-slate-700/80 text-[9px] font-mono text-slate-700 dark:text-slate-300 text-center w-full truncate shadow-2xs">
            {specsText}
          </div>
        )}
      </div>
    </div>
  );
});

SchematicGenericNode.displayName = 'SchematicGenericNode';
