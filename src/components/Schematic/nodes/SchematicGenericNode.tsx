import React, { memo, useEffect, useState } from 'react';
import { Handle, NodeProps, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { SchematicNodeData, PortDirection } from '../../../types/schematic';
import { COMPONENT_DEFINITIONS } from '../symbols/componentDefinitions';
import { SvgSymbol } from '../symbols/SvgSymbols';
import { useProject } from '../../../context/ProjectContext';

export const getTransformedPortPosition = (
  originalPos: PortDirection,
  rotation: number = 0,
  flippedHorizontal: boolean = false,
  flippedVertical: boolean = false
): PortDirection => {
  let pos = originalPos;

  // 1. Flip Horizontal (mirror across Y axis: left <-> right)
  if (flippedHorizontal) {
    if (pos === 'left') pos = 'right';
    else if (pos === 'right') pos = 'left';
  }

  // 2. Flip Vertical (mirror across X axis: top <-> bottom)
  if (flippedVertical) {
    if (pos === 'top') pos = 'bottom';
    else if (pos === 'bottom') pos = 'top';
  }

  // 3. Rotation clockwise (0, 90, 180, 270)
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const rotSteps = Math.round(normalizedRotation / 90) % 4;

  const clockwiseOrder: PortDirection[] = ['top', 'right', 'bottom', 'left'];
  if (rotSteps > 0) {
    const currentIndex = clockwiseOrder.indexOf(pos);
    const newIndex = (currentIndex + rotSteps) % 4;
    pos = clockwiseOrder[newIndex];
  }

  return pos;
};

const mapPortPosition = (pos: PortDirection): Position => {
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
    case 'electric_power':
      return '#b45309'; // Brown (Power Phase L1/L2/L3)
    case 'electric_neutral':
      return '#2563eb'; // Blue (Neutral N)
    case 'electric_ground':
      return '#65a30d'; // Lime Green (Earth PE)
    case 'electric_control':
      return '#dc2626'; // Red (Control Circuit / Coil / Auxiliary)
    case 'electric_signal':
      return '#9333ea'; // Purple (Signal 0-10V / Sensor)
    default:
      return '#94a3b8'; // Slate
  }
};

const getPortOffsetClass = (pos: PortDirection) => {
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

export const SchematicGenericNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as unknown as SchematicNodeData;
  const { themeMode } = useProject();
  const { setNodes } = useReactFlow();
  const def = COMPONENT_DEFINITIONS[nodeData.componentType];
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const updateNodeInternals = useUpdateNodeInternals();

  const rotation = nodeData.rotation || 0;
  const flippedHorizontal = !!nodeData.flippedHorizontal;
  const flippedVertical = !!nodeData.flippedVertical;

  useEffect(() => {
    updateNodeInternals(id);
    const frame = requestAnimationFrame(() => {
      updateNodeInternals(id);
    });
    return () => cancelAnimationFrame(frame);
  }, [id, rotation, flippedHorizontal, flippedVertical, updateNodeInternals]);

  const isInteractiveSwitch = [
    'switch_spst',
    'switch_spdt',
    'switch_disconnector',
    'selector_switch_rotary',
    'pushbutton_simple',
    'pushbutton_nc_simple',
    'pushbutton_no',
    'pushbutton_nc',
    'circuit_breaker_mcb',
    'motor_protection_switch',
    'emergency_stop_button',
  ].includes(nodeData.componentType);

  const handleToggleState = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          const prevClosed = !!n.data.isSwitchClosed;
          const nextClosed = !prevClosed;

          let nextSelectorPos = n.data.selectorPosition;
          if (n.data.componentType === 'selector_switch_rotary') {
            nextSelectorPos =
              n.data.selectorPosition === 'man'
                ? 'off'
                : n.data.selectorPosition === 'off'
                ? 'auto'
                : 'man';
          }

          return {
            ...n,
            data: {
              ...n.data,
              isSwitchClosed: nextClosed,
              isPushButtonPressed: !n.data.isPushButtonPressed,
              isBreakerClosed: nextClosed,
              selectorPosition: nextSelectorPos,
            },
          };
        }
        return n;
      })
    );
  };

  if (!def) {
    return (
      <div className="p-3 bg-red-500/20 border border-red-500 text-red-400 rounded text-xs font-mono">
        Componente desconocido: {nodeData.componentType}
      </div>
    );
  }

  const flippedH = flippedHorizontal ? -1 : 1;
  const flippedV = flippedVertical ? -1 : 1;
  const isTransformed = rotation !== 0 || flippedHorizontal || flippedVertical;
  const transform = isTransformed ? `rotate(${rotation}deg) scale(${flippedH}, ${flippedV})` : undefined;

  // Summary Specs text to display on node footer
  const renderSpecsSnippet = () => {
    // Basic Electrical Loads & Sources
    if (nodeData.componentType === 'light_bulb') {
      return nodeData.isEnergized ? (
        <span className="font-bold text-amber-500 dark:text-yellow-300 text-[10px] flex items-center justify-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" />
          ENCENDIDA (LUZ)
        </span>
      ) : (
        <span className="text-slate-400 text-[9px]">Apagada</span>
      );
    }

    if (nodeData.componentType === 'diode_led') {
      return nodeData.isEnergized ? (
        <span className="font-bold text-emerald-500 dark:text-emerald-400 text-[10px]">ILUMINADO (ON)</span>
      ) : (
        <span className="text-slate-400 text-[9px]">Apagado</span>
      );
    }

    if (nodeData.componentType === 'battery_dc_cell') {
      return (
        <span className="font-bold text-sky-500 dark:text-sky-400 text-[10px]">
          DC {nodeData.voltageV || 12}V
        </span>
      );
    }

    if (nodeData.componentType === 'cell_dc_simple') {
      return (
        <span className="font-bold text-amber-500 dark:text-amber-400 text-[10px]">
          DC {nodeData.voltageV || 1.5}V (Pila AA)
        </span>
      );
    }

    if (nodeData.componentType === 'dc_power_source') {
      return (
        <span className="font-bold text-sky-500 dark:text-sky-400 text-[10px]">
          DC {nodeData.voltageV || 12}V (Regulable)
        </span>
      );
    }

    if (nodeData.componentType === 'power_source_ac_3p') {
      return (
        <span className="font-bold text-amber-500 dark:text-amber-400 text-[10px]">
          3~ 400V 50Hz (Trifásica)
        </span>
      );
    }

    if (nodeData.componentType === 'resistor_fixed') {
      return (
        <span className="font-mono text-amber-500 dark:text-amber-400 text-[10px]">
          {nodeData.resistanceOhm || 100} Ω
        </span>
      );
    }

    if (nodeData.componentType === 'switch_disconnector') {
      return (
        <span className={`font-bold text-[9px] ${nodeData.isSwitchClosed ? 'text-emerald-500' : 'text-rose-500'}`}>
          {nodeData.isSwitchClosed ? 'CERRADO (I)' : 'SECCIONADO (0)'}
        </span>
      );
    }

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
      className={`group relative flex flex-col items-center justify-start p-2 rounded-xl transition-[border-color,box-shadow] duration-150 select-none bg-white dark:bg-[#141720] border shadow-md ${
        selected
          ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 border-sky-400 shadow-sky-500/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-sky-400/70 hover:shadow-lg'
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
            <span className="flex h-2 w-2 relative items-center justify-center" title="En servicio / Activo">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" title="Detenido" />
          )}
        </div>
      </div>

      {/* Main SVG Symbol Body */}
      <div
        className={`relative flex items-center justify-center p-1 rounded-lg my-auto ${
          isInteractiveSwitch ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
        style={isTransformed ? { transform, transformOrigin: 'center center' } : undefined}
        onClick={isInteractiveSwitch ? handleToggleState : undefined}
        title={isInteractiveSwitch ? 'Haz clic para alternar estado' : undefined}
      >
        <SvgSymbol
          type={nodeData.componentType}
          width={def.dimensions.width - 24}
          height={def.dimensions.height - 42}
          isSelected={selected}
          isEnergized={nodeData.isEnergized}
          isSwitchClosed={nodeData.isSwitchClosed}
          measuredValue={nodeData.measuredValue}
          measuredUnit={nodeData.measuredUnit}
          resistanceOhm={nodeData.resistanceOhm}
          isSeriesWarning={nodeData.isSeriesWarning}
          isSeriesPassThrough={nodeData.isSeriesPassThrough}
          themeMode={themeMode}
        />
      </div>

      {/* Voltmeter Series Warning & Didactic Bypass Toggle */}
      {nodeData.componentType === 'voltmeter_basic' && (
        <div className="flex flex-col items-center gap-1 my-1 w-full px-1 z-30">
          {nodeData.isSeriesWarning && !nodeData.isSeriesPassThrough && (
            <div className="w-full p-1 bg-amber-500/20 border border-amber-500/60 rounded text-[8px] text-amber-300 text-center leading-tight">
              ⚠️ <b>En serie:</b> R interna 10MΩ no deja pasar corriente a la bombilla.
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === id
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          isSeriesPassThrough: !n.data.isSeriesPassThrough,
                        },
                      }
                    : n
                )
              );
            }}
            className={`nodrag px-2 py-0.5 rounded text-[8px] font-bold tracking-tight shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1 ${
              nodeData.isSeriesPassThrough
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                : 'bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400'
            }`}
            title="Activar paso de corriente en serie para prácticas didácticas"
          >
            <span>
              {nodeData.isSeriesPassThrough
                ? '✓ Bypass Activo (Conduce)'
                : '⚡ Activar Bypass Serie'}
            </span>
          </button>
        </div>
      )}

      {/* Direct One-Click Toggle Control for Switches & Pushbuttons */}
      {/* Interactive Toggle Switch Button */}
      {isInteractiveSwitch && (
        <button
          type="button"
          onClick={handleToggleState}
          className={`nodrag my-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1 z-30 ${
            nodeData.componentType === 'switch_spdt'
              ? nodeData.isSwitchClosed
                ? 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400 shadow-sky-500/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-amber-500/30'
              : nodeData.componentType === 'emergency_stop_button'
              ? nodeData.isPushButtonPressed
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_#f43f5e]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
              : nodeData.componentType === 'selector_switch_rotary'
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600'
              : nodeData.isSwitchClosed
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
              : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
          }`}
          title="Haz clic para conmutar estado"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              nodeData.componentType === 'switch_spdt'
                ? 'bg-white'
                : nodeData.isSwitchClosed
                ? 'bg-white shadow-[0_0_6px_#ffffff]'
                : 'bg-rose-200'
            }`}
          />
          <span>
            {nodeData.componentType === 'switch_spdt'
              ? nodeData.isSwitchClosed
                ? 'POSICIÓN 2 (L2)'
                : 'POSICIÓN 1 (L1)'
              : nodeData.componentType === 'emergency_stop_button'
              ? nodeData.isPushButtonPressed
                ? 'DISPARADA (PARO)'
                : 'REARMADA (OK)'
              : nodeData.componentType === 'selector_switch_rotary'
              ? nodeData.selectorPosition === 'man'
                ? 'MANUAL'
                : nodeData.selectorPosition === 'off'
                ? 'PARO (0)'
                : 'AUTOMÁTICO'
              : nodeData.isSwitchClosed
              ? 'CERRADO (ON)'
              : 'ABIERTO (OFF)'}
          </span>
        </button>
      )}

      {/* Port Handles & Visual Badges */}
      {def.ports.map((port) => {
        const effectivePosition = getTransformedPortPosition(
          port.position,
          rotation,
          flippedHorizontal,
          flippedVertical
        );
        const handlePosition = mapPortPosition(effectivePosition);
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
              className="w-4! h-4! rounded-full border-2 border-white dark:border-slate-950 transition-[transform,background-color,border-color,box-shadow] duration-150 hover:scale-140! z-30 cursor-crosshair shadow-md hover:ring-2 hover:ring-sky-400"
              style={{
                backgroundColor: handleColor,
              }}
            />

            {/* Port Short Code Label Pin */}
            <div
              className={`absolute pointer-events-none z-20 flex items-center px-1 py-0.2 rounded font-mono font-bold text-[8px] border shadow-xs transition-opacity duration-150 ${
                effectivePosition === 'left'
                  ? 'left-0 -translate-x-full mr-1 top-1/2 -translate-y-1/2'
                  : effectivePosition === 'right'
                  ? 'right-0 translate-x-full ml-1 top-1/2 -translate-y-1/2'
                  : effectivePosition === 'top'
                  ? 'top-0 -translate-y-full mb-1 left-1/2 -translate-x-1/2'
                  : 'bottom-0 translate-y-full mt-1 left-1/2 -translate-x-1/2'
              } ${
                isHovered
                  ? 'bg-sky-600 text-white border-sky-400 opacity-100 z-40 scale-105'
                  : 'bg-slate-900/90 dark:bg-black/90 text-slate-200 border-slate-700/80 opacity-80'
              }`}
              style={{
                borderLeftColor: effectivePosition === 'left' ? handleColor : undefined,
                borderRightColor: effectivePosition === 'right' ? handleColor : undefined,
                borderTopColor: effectivePosition === 'top' ? handleColor : undefined,
                borderBottomColor: effectivePosition === 'bottom' ? handleColor : undefined,
              }}
            >
              <span>{port.shortCode}</span>
            </div>

            {/* Floating Rich Tooltip on Handle Hover */}
            {isHovered && (
              <div
                className={`absolute z-50 pointer-events-none nodrag nopan w-48 p-2 rounded-lg bg-slate-900/95 dark:bg-black/95 text-white border border-sky-500/60 shadow-xl backdrop-blur-md flex flex-col gap-1 text-left animate-in fade-in zoom-in-95 duration-100 ${getPortOffsetClass(
                  effectivePosition
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
