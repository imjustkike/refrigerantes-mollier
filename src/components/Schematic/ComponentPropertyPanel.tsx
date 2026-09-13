import React from 'react';
import {
  ArrowLeftRight,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Power,
  RotateCw,
  Sliders,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { Edge, Node } from '@xyflow/react';
import { PipeStateCategory, SchematicComponentType, SchematicEdgeData, SchematicNodeData } from '../../types/schematic';
import { COMPONENT_DEFINITIONS } from './symbols/componentDefinitions';

interface ComponentPropertyPanelProps {
  selectedNode: Node<SchematicNodeData> | null;
  selectedEdge: Edge<SchematicEdgeData> | null;
  onUpdateNodeData: (nodeId: string, updates: Partial<SchematicNodeData>) => void;
  onUpdateEdgeData: (edgeId: string, updates: Partial<SchematicEdgeData>) => void;
  onSplitEdge?: (edgeId: string, junctionType: SchematicComponentType) => void;
  onConvertEdgeType?: (edgeId: string, newType: 'refrigerantPipe' | 'electricWire') => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onClose: () => void;
}

const PIPE_STATE_OPTIONS: { id: PipeStateCategory; label: string; color: string }[] = [
  { id: 'discharge_superheated', label: 'Vapor Recalentado Alta (Descarga)', color: '#ef4444' },
  { id: 'condensing_liquid', label: 'Líquido Saturado (Condensación)', color: '#f97316' },
  { id: 'subcooled_liquid', label: 'Líquido Subenfriado Alta', color: '#eab308' },
  { id: 'two_phase_flashing', label: 'Mezcla Bifásica (Post-Expansión)', color: '#06b6d4' },
  { id: 'evaporating_vapor', label: 'Vapor Saturado (Evaporación)', color: '#38bdf8' },
  { id: 'suction_superheated', label: 'Vapor Recalentado Baja (Aspiración)', color: '#2563eb' },
  { id: 'intermediate_pressure', label: 'Presión Intermedia / Economizador', color: '#8b5cf6' },
  { id: 'oil_line', label: 'Línea de Aceite', color: '#84cc16' },
  { id: 'hot_gas_defrost', label: 'Desescarche / Gas Caliente', color: '#a855f7' },
  { id: 'secondary_fluid', label: 'Fluido Secundario (Agua / Glicol)', color: '#10b981' },
];

const STANDARD_PIPE_DIAMETERS = [
  '1/4"', '3/8"', '1/2"', '5/8"', '3/4"', '7/8"', '1-1/8"', '1-3/8"', '1-5/8"', '2-1/8"', '2-5/8"', 'DN50', 'DN80', 'DN100'
];

const ELECTRIC_WIRE_OPTIONS: {
  id: PipeStateCategory;
  label: string;
  sublabel: string;
  color: string;
}[] = [
  {
    id: 'electric_phase',
    label: 'Fase de Potencia (L1 / L2 / L3)',
    sublabel: 'Conductor activo bajo tensión o +DC (Marrón)',
    color: '#b45309',
  },
  {
    id: 'electric_neutral',
    label: 'Neutro de Retorno (N)',
    sublabel: 'Retorno de neutro o común de masa -DC (Azul eléctrico)',
    color: '#2563eb',
  },
  {
    id: 'electric_ground',
    label: 'Tierra de Protección (PE)',
    sublabel: 'Conductor de equipotencialidad (Verde/Amarillo)',
    color: '#65a30d',
  },
  {
    id: 'electric_control',
    label: 'Línea de Maniobra y Control',
    sublabel: 'Termostatos, presostatos, pulsadores y relés (Rojo)',
    color: '#dc2626',
  },
  {
    id: 'electric_signal',
    label: 'Señal Analógica / Sonda',
    sublabel: 'Sondas de temperatura, 0-10V, 4-20mA (Púrpura)',
    color: '#9333ea',
  },
];

const STANDARD_WIRE_SECTIONS = [0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0];

export const ComponentPropertyPanel: React.FC<ComponentPropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNodeData,
  onUpdateEdgeData,
  onSplitEdge,
  onConvertEdgeType,
  onDeleteSelected,
  onDuplicateSelected,
  onClose,
}) => {
  if (!selectedNode && !selectedEdge) return null;

  // Node Inspector
  if (selectedNode) {
    const nodeData = selectedNode.data;
    const def = COMPONENT_DEFINITIONS[nodeData.componentType];
    const category = def?.category || '';

    const isRefrigerantComponent = [
      'compressors',
      'heat_exchangers',
      'expansion',
      'vessels',
      'valves',
      'piping',
    ].includes(category);

    const isElectricalOnly = [
      'basic_electrical',
      'electrical',
    ].includes(category) && !selectedNode.data.componentType.includes('compressor');

    const rotateClockwise = () => {
      const current = nodeData.rotation || 0;
      const next = ((current + 90) % 360) as 0 | 90 | 180 | 270;
      onUpdateNodeData(selectedNode.id, { rotation: next });
    };

    const toggleFlipH = () => {
      onUpdateNodeData(selectedNode.id, { flippedHorizontal: !nodeData.flippedHorizontal });
    };

    const toggleFlipV = () => {
      onUpdateNodeData(selectedNode.id, { flippedVertical: !nodeData.flippedVertical });
    };

    const toggleEnergized = () => {
      onUpdateNodeData(selectedNode.id, { isEnergized: !nodeData.isEnergized });
    };

    return (
      <div className="w-88 h-full bg-white/95 dark:bg-[#13151b]/95 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xl select-none">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#101217]">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-sky-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Ficha Técnica del Equipo
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {def?.name || 'Componente'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
          {/* Quick Actions Toolbar */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-800">
            <button
              onClick={rotateClockwise}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#121418] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Rotar 90° en sentido horario (Tecla R)"
            >
              <RotateCw size={13} />
              <span className="font-mono text-[10px]">{nodeData.rotation || 0}°</span>
            </button>

            <button
              onClick={toggleFlipH}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                nodeData.flippedHorizontal
                  ? 'bg-sky-600 text-white'
                  : 'bg-white dark:bg-[#121418] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title="Volteo Horizontal (Tecla H)"
            >
              <FlipHorizontal size={13} />
            </button>

            <button
              onClick={toggleFlipV}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                nodeData.flippedVertical
                  ? 'bg-sky-600 text-white'
                  : 'bg-white dark:bg-[#121418] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title="Volteo Vertical (Tecla V)"
            >
              <FlipVertical size={13} />
            </button>

            <button
              onClick={toggleEnergized}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                nodeData.isEnergized
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#121418] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title="Activar / Desactivar Estado Operativo"
            >
              <Power size={13} />
            </button>

            <button
              onClick={onDuplicateSelected}
              className="p-1.5 rounded bg-white dark:bg-[#121418] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Duplicar componente (Ctrl+D)"
            >
              <Copy size={13} />
            </button>

            <button
              onClick={onDeleteSelected}
              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
              title="Eliminar del circuito (Supr)"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* General Identification */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Identificación y Modelo
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Tag / Código</label>
                <input
                  type="text"
                  value={nodeData.tag || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { tag: e.target.value })}
                  placeholder="ej. CMP-01"
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono font-bold text-sky-600 dark:text-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Nombre de Circuito</label>
                <input
                  type="text"
                  value={nodeData.customName || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { customName: e.target.value })}
                  placeholder={def?.defaultLabel || 'Etiqueta'}
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Modelo / Referencia Comercial</label>
              <input
                type="text"
                value={nodeData.modelNumber || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { modelNumber: e.target.value })}
                placeholder={
                  isRefrigerantComponent
                    ? 'ej. Bitzer 4CES-9Y, Danfoss T2, Copeland ZB45'
                    : isElectricalOnly
                    ? 'ej. Philips E27 60W, Osram LED, Schneider iC60N'
                    : 'ej. Referencia de catálogo / modelo'
                }
                className="w-full px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Direct Technical & Thermodynamic Specs (Only for Refrigerant Components) */}
          {isRefrigerantComponent && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Parámetros Termodinámicos y de Operación
              </span>

              {/* Pressure & Temperature Limits */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Presión Salida / HP (bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.pressureOutBar ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { pressureOutBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="14.5"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Presión Entrada / LP (bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.pressureInBar ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { pressureInBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="2.1"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Temperatura Salida (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.tempOutC ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { tempOutC: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="65.0"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Temperatura Entrada (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.tempInC ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { tempInC: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="-5.0"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Performance, Capacity & Power */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Potencia / Capacidad (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.capacityKw ?? nodeData.powerKw ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                      onUpdateNodeData(selectedNode.id, { capacityKw: val, powerKw: val });
                    }}
                    placeholder="8.5"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Caudal Volumétrico (m³/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.displacementM3h ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { displacementM3h: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="24.5"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Specific Settings (SH, SC, Opening, Setpoint) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Recalentamiento SH (K)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.superheatK ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { superheatK: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="5.0"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Subenfriamiento SC (K)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.subcoolingK ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { subcoolingK: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="3.0"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Direct Electrical Parameters (Only for pure electrical components like bulbs, resistors, batteries) */}
          {isElectricalOnly && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Tarjeta Interactiva de la Ley de Ohm & Telemetría en Vivo */}
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-sky-500/10 via-amber-500/5 to-emerald-500/10 border border-sky-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tight flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-500" />
                    Ley de Ohm & Telemetría en Vivo
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      nodeData.isEnergized
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    {nodeData.isEnergized ? `ON (${nodeData.powerPercent ?? 100}%)` : 'OFF (0%)'}
                  </span>
                </div>

                {/* 4 Métricas de la Ley de Ohm: V, I, R, P */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                    <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Tensión</div>
                    <div className="text-[11px] font-mono font-bold text-amber-500">
                      {nodeData.voltageV !== undefined ? `${nodeData.voltageV}V` : '0V'}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                    <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Corriente</div>
                    <div className="text-[11px] font-mono font-bold text-sky-400">
                      {nodeData.currentA !== undefined ? `${nodeData.currentA}A` : '0A'}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                    <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Resistencia</div>
                    <div className="text-[11px] font-mono font-bold text-indigo-400">
                      {nodeData.resistanceOhm !== undefined ? `${nodeData.resistanceOhm}Ω` : '—'}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                    <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Potencia</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-400">
                      {nodeData.powerWatts !== undefined ? `${nodeData.powerWatts}W` : '0W'}
                    </div>
                  </div>
                </div>

                {/* Barra de Porcentaje de Potencia de Trabajo */}
                <div>
                  <div className="flex justify-between items-center text-[9px] mb-1">
                    <span className="text-slate-400 font-medium">Potencia de Trabajo:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {nodeData.powerPercent ?? (nodeData.isEnergized ? 100 : 0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (nodeData.powerPercent || 0) > 80
                          ? 'bg-emerald-500'
                          : (nodeData.powerPercent || 0) > 30
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${nodeData.powerPercent ?? (nodeData.isEnergized ? 100 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Fuente de Corriente Continua (DC) Regulable */}
              {(selectedNode.data.componentType === 'dc_power_source' ||
                selectedNode.data.componentType === 'battery_dc_cell' ||
                selectedNode.data.componentType === 'cell_dc_simple' ||
                selectedNode.data.componentType === 'power_supply_dc_24v') && (
                <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tight flex items-center gap-1.5">
                      <Zap size={14} className="text-sky-500" />
                      Regulación de Fuente DC & Amperaje
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateNodeData(selectedNode.id, { isEnergized: !nodeData.isEnergized })}
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        nodeData.isEnergized
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${nodeData.isEnergized ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {nodeData.isEnergized ? 'SALIDA ON' : 'SALIDA OFF'}
                    </button>
                  </div>

                  {/* Tensión de Salida Regulable (V) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-slate-400 font-medium">Tensión de Salida (V):</span>
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {(nodeData.voltageV ?? 12.0).toFixed(1)} V
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={Math.max(60, Math.ceil((nodeData.voltageV || 12) / 10) * 10)}
                        step="0.5"
                        value={nodeData.voltageV ?? 12.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { voltageV: parseFloat(e.target.value) })}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.1"
                        value={nodeData.voltageV ?? 12.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { voltageV: e.target.value ? parseFloat(e.target.value) : 0 })}
                        className="w-18 px-2 py-1 bg-white dark:bg-[#121419] border border-sky-500/40 rounded text-xs font-mono font-bold text-sky-400 text-right"
                      />
                    </div>
                    {/* Botones de Ajuste Rápido de Voltaje */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[8.5px] text-slate-500 mr-0.5">Preajustes:</span>
                      {[1.5, 3.3, 5.0, 9.0, 12.0, 24.0, 48.0].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onUpdateNodeData(selectedNode.id, { voltageV: v })}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono cursor-pointer transition-colors ${
                            nodeData.voltageV === v
                              ? 'bg-sky-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-500/20'
                          }`}
                        >
                          {v}V
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Límite de Corriente / Amperaje Máximo Regulable (A) */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-slate-400 font-medium">Límite de Corriente / Amperaje (A):</span>
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {(nodeData.maxCurrentA ?? 10.0).toFixed(1)} A
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max={Math.max(30, Math.ceil((nodeData.maxCurrentA || 10) / 5) * 5)}
                        step="0.1"
                        value={nodeData.maxCurrentA ?? 10.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { maxCurrentA: parseFloat(e.target.value), ratedCurrentA: parseFloat(e.target.value) })}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0.05"
                        max="1000"
                        step="0.1"
                        value={nodeData.maxCurrentA ?? 10.0}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : 0.1;
                          onUpdateNodeData(selectedNode.id, { maxCurrentA: val, ratedCurrentA: val });
                        }}
                        className="w-18 px-2 py-1 bg-white dark:bg-[#121419] border border-amber-500/40 rounded text-xs font-mono font-bold text-amber-400 text-right"
                      />
                    </div>
                    {/* Botones de Ajuste Rápido de Amperaje */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[8.5px] text-slate-500 mr-0.5">Límites:</span>
                      {[0.5, 1.0, 2.0, 5.0, 10.0, 16.0, 25.0].map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => onUpdateNodeData(selectedNode.id, { maxCurrentA: a, ratedCurrentA: a })}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono cursor-pointer transition-colors ${
                            nodeData.maxCurrentA === a
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500/20'
                          }`}
                        >
                          {a}A
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Telemetría en Vivo de la Fuente DC */}
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Tensión Salida</div>
                      <div className="text-[11px] font-mono font-bold text-sky-400">
                        {(nodeData.voltageV ?? 12).toFixed(1)} V
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Corriente Entregada</div>
                      <div className={`text-[11px] font-mono font-bold ${(nodeData.currentA || 0) > (nodeData.maxCurrentA || 10) ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {(nodeData.currentA ?? 0).toFixed(2)} A
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Potencia Salida</div>
                      <div className="text-[11px] font-mono font-bold text-amber-400">
                        {(nodeData.powerWatts ?? 0).toFixed(1)} W
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Límite de Corriente Excedido (CC) */}
                  {nodeData.currentLimitWarning && (
                    <div className="p-2 rounded bg-rose-500/15 border border-rose-500/40 text-[9px] text-rose-300 font-semibold flex items-center gap-1.5 leading-tight animate-pulse">
                      <span>⚠️</span>
                      <span>{nodeData.currentLimitWarning}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Fuente de Corriente Alterna (AC) Completamente Regulable */}
              {(selectedNode.data.componentType === 'power_source_ac' ||
                selectedNode.data.componentType === 'power_source_ac_3p') && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-tight flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" />
                      Fuente de Corriente AC Regulable
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateNodeData(selectedNode.id, { isEnergized: !nodeData.isEnergized })}
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        nodeData.isEnergized
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${nodeData.isEnergized ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {nodeData.isEnergized ? 'RED ACTIVA' : 'RED APAGADA'}
                    </button>
                  </div>

                  {/* Tensión Eficaz RMS Regulable (V) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-slate-400 font-medium">Tensión Eficaz RMS (V):</span>
                      <span className="font-mono font-bold text-indigo-400 text-xs">
                        {(nodeData.voltageV ?? (selectedNode.data.componentType === 'power_source_ac_3p' ? 400.0 : 230.0)).toFixed(1)} V AC
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="480"
                        step="1"
                        value={nodeData.voltageV ?? (selectedNode.data.componentType === 'power_source_ac_3p' ? 400.0 : 230.0)}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { voltageV: parseFloat(e.target.value) })}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        value={nodeData.voltageV ?? (selectedNode.data.componentType === 'power_source_ac_3p' ? 400.0 : 230.0)}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { voltageV: e.target.value ? parseFloat(e.target.value) : 0 })}
                        className="w-18 px-2 py-1 bg-white dark:bg-[#121419] border border-indigo-500/40 rounded text-xs font-mono font-bold text-indigo-400 text-right"
                      />
                    </div>
                    {/* Presets de Tensión AC */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[8.5px] text-slate-500 mr-0.5">Tensiones:</span>
                      {[12, 24, 110, 120, 230, 400].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onUpdateNodeData(selectedNode.id, { voltageV: v })}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono cursor-pointer transition-colors ${
                            nodeData.voltageV === v
                              ? 'bg-indigo-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-500/20'
                          }`}
                        >
                          {v}V
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frecuencia (Hz) Regulable */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-slate-400 font-medium">Frecuencia de Red (Hz):</span>
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {nodeData.frequencyHz ?? 50.0} Hz
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="400"
                        step="1"
                        value={nodeData.frequencyHz ?? 50.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { frequencyHz: parseFloat(e.target.value) })}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        value={nodeData.frequencyHz ?? 50.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { frequencyHz: e.target.value ? parseFloat(e.target.value) : 50 })}
                        className="w-18 px-2 py-1 bg-white dark:bg-[#121419] border border-amber-500/40 rounded text-xs font-mono font-bold text-amber-400 text-right"
                      />
                    </div>
                    {/* Presets Frecuencia */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[8.5px] text-slate-500 mr-0.5">Red:</span>
                      {[
                        { label: '50 Hz (EU)', val: 50 },
                        { label: '60 Hz (US/Mx)', val: 60 },
                        { label: '400 Hz (Aero)', val: 400 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => onUpdateNodeData(selectedNode.id, { frequencyHz: item.val })}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono cursor-pointer transition-colors ${
                            nodeData.frequencyHz === item.val
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500/20'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Límite de Corriente / Amperaje Máximo AC (A) */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="text-slate-400 font-medium">Límite Amperaje Máximo (A):</span>
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {(nodeData.maxCurrentA ?? 16.0).toFixed(1)} A
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.5"
                        max="63"
                        step="0.5"
                        value={nodeData.maxCurrentA ?? 16.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { maxCurrentA: parseFloat(e.target.value), ratedCurrentA: parseFloat(e.target.value) })}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0.1"
                        max="500"
                        step="0.5"
                        value={nodeData.maxCurrentA ?? 16.0}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : 1;
                          onUpdateNodeData(selectedNode.id, { maxCurrentA: val, ratedCurrentA: val });
                        }}
                        className="w-18 px-2 py-1 bg-white dark:bg-[#121419] border border-sky-500/40 rounded text-xs font-mono font-bold text-sky-400 text-right"
                      />
                    </div>
                    {/* Botones de Calibre / Amperaje Estándar */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[8.5px] text-slate-500 mr-0.5">Calibre:</span>
                      {[6, 10, 16, 20, 25, 32, 40, 63].map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => onUpdateNodeData(selectedNode.id, { maxCurrentA: a, ratedCurrentA: a })}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono cursor-pointer transition-colors ${
                            nodeData.maxCurrentA === a
                              ? 'bg-sky-500 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-500/20'
                          }`}
                        >
                          {a}A
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forma de Onda AC (Waveform) */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <label className="block text-[9.5px] text-slate-400 font-medium">Forma de Onda AC:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'sine', label: '〰️ Senoidal', desc: 'Red convencional' },
                        { id: 'square', label: '⎍ Cuadrada', desc: 'Inversor / SAI' },
                        { id: 'triangle', label: '⋀ Triangular', desc: 'Modulada' },
                      ].map((wf) => (
                        <button
                          key={wf.id}
                          type="button"
                          onClick={() => onUpdateNodeData(selectedNode.id, { acWaveform: wf.id as any })}
                          className={`p-1.5 rounded text-center border cursor-pointer transition-all ${
                            (nodeData.acWaveform || 'sine') === wf.id
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold shadow-xs'
                              : 'bg-slate-100 dark:bg-[#121419] border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[10px] font-bold">{wf.label}</div>
                          <div className="text-[7.5px] opacity-75">{wf.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Telemetría en Vivo AC */}
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Tensión RMS</div>
                      <div className="text-[11px] font-mono font-bold text-indigo-400">
                        {(nodeData.voltageV ?? (selectedNode.data.componentType === 'power_source_ac_3p' ? 400.0 : 230.0)).toFixed(0)} V
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Corriente RMS</div>
                      <div className={`text-[11px] font-mono font-bold ${(nodeData.currentA || 0) > (nodeData.maxCurrentA || 16) ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {(nodeData.currentA ?? 0).toFixed(2)} A
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-800">
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">Potencia Activa</div>
                      <div className="text-[11px] font-mono font-bold text-amber-400">
                        {(nodeData.powerWatts ?? 0).toFixed(1)} W
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Límite de Corriente AC */}
                  {nodeData.currentLimitWarning && (
                    <div className="p-2 rounded bg-rose-500/15 border border-rose-500/40 text-[9px] text-rose-300 font-semibold flex items-center gap-1.5 leading-tight animate-pulse">
                      <span>⚠️</span>
                      <span>{nodeData.currentLimitWarning}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ajustes Específicos para Bombillas (Regulación de Tensión Mínima de Funcionamiento) */}
              {selectedNode.data.componentType === 'light_bulb' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                      Regulación de Bombilla & Umbrales
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                      {nodeData.isEnergized ? `${nodeData.powerPercent || 100}% Potencia` : 'Apagada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Nominal (V)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={nodeData.ratedVoltageV ?? nodeData.voltageV ?? 12.0}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          onUpdateNodeData(selectedNode.id, { ratedVoltageV: val, voltageV: val });
                        }}
                        placeholder="12.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Mín. Encendido (V)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={nodeData.minOperatingVoltageV ?? 6.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { minOperatingVoltageV: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="6.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Resistencia Filamento (Ω)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={nodeData.resistanceOhm ?? 24.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { resistanceOhm: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="24.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Potencia Nominal (W)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={nodeData.powerWatts ?? 6.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { powerWatts: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="6.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {nodeData.voltageWarning && (
                    <div className="p-1.5 rounded bg-amber-500/20 border border-amber-500/50 text-[8.5px] text-amber-300 font-medium leading-tight">
                      ⚠️ {nodeData.voltageWarning}
                    </div>
                  )}
                </div>
              )}

              {/* Potenciómetros: Resistencia y Deslizador Cursor */}
              {selectedNode.data.componentType === 'potentiometer' && (
                <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tight">
                      Control de Cursor & Resistencia
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                      {nodeData.openingPercent ?? 50}% Regulado
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[9px] mb-1">
                      <span className="text-slate-400">Posición del Cursor (Wiper):</span>
                      <span className="font-mono font-bold text-purple-400">{nodeData.openingPercent ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="99"
                      step="1"
                      value={nodeData.openingPercent ?? 50}
                      onChange={(e) => onUpdateNodeData(selectedNode.id, { openingPercent: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Resistencia Total (Ω)</label>
                      <input
                        type="number"
                        step="100"
                        value={nodeData.resistanceOhm ?? 10000}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { resistanceOhm: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="10000"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">R Efectiva Salida (Ω)</label>
                      <div className="w-full px-2 py-1 bg-slate-200 dark:bg-black/40 border border-slate-300 dark:border-slate-800 rounded text-xs font-mono font-bold text-purple-400">
                        {Math.round(((nodeData.resistanceOhm ?? 10000) * ((nodeData.openingPercent ?? 50) / 100)) * 10) / 10} Ω
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Motores: Tensión Nominal, Mínima de Arranque y RPM */}
              {(selectedNode.data.componentType === 'electric_motor_dc' ||
                selectedNode.data.componentType === 'electric_motor_1p' ||
                selectedNode.data.componentType === 'electric_motor_3p') && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                      Configuración de Motor & Umbrales
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {nodeData.isEnergized ? `${nodeData.powerPercent || 100}% Potencia` : 'Detenido'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Nominal (V)</label>
                      <input
                        type="number"
                        step="1"
                        value={nodeData.ratedVoltageV ?? nodeData.voltageV ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          onUpdateNodeData(selectedNode.id, { ratedVoltageV: val, voltageV: val });
                        }}
                        placeholder="12.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Mín. Arranque (V)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={nodeData.minOperatingVoltageV ?? ''}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { minOperatingVoltageV: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="7.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Resistencia Devanado (Ω)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={nodeData.resistanceOhm ?? 6.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { resistanceOhm: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="6.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Potencia Nominal (W)</label>
                      <input
                        type="number"
                        step="1"
                        value={nodeData.powerWatts ?? 24.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { powerWatts: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="24.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">RPM Nominales</label>
                      <input
                        type="number"
                        step="100"
                        value={nodeData.ratedRpm ?? ''}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { ratedRpm: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="3000"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">RPM Reales en Vivo</label>
                      <div className="w-full px-2 py-1 bg-slate-200 dark:bg-black/40 border border-slate-300 dark:border-slate-800 rounded text-xs font-mono font-bold text-emerald-500">
                        {nodeData.actualRpm ?? 0} RPM
                      </div>
                    </div>
                  </div>

                  {nodeData.motorVoltageWarning && (
                    <div className="p-1.5 rounded bg-amber-500/20 border border-amber-500/50 text-[8.5px] text-amber-300 font-medium leading-tight">
                      ⚠️ {nodeData.motorVoltageWarning}
                    </div>
                  )}
                </div>
              )}

              {/* Altavoz Dinámico / Salida de Audio */}
              {selectedNode.data.componentType === 'audio_speaker' && (
                <div className="mt-3 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 space-y-2">
                  <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-tight">
                    Parámetros Acústicos & Audio
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Impedancia (Ω)</label>
                      <select
                        value={nodeData.impedanceOhm ?? 8}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { impedanceOhm: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      >
                        <option value="4">4 Ω</option>
                        <option value="8">8 Ω</option>
                        <option value="16">16 Ω</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Frecuencia (Hz)</label>
                      <input
                        type="number"
                        step="10"
                        value={nodeData.audioFrequencyHz ?? 440}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { audioFrequencyHz: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="440"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Mínima (V)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={nodeData.minOperatingVoltageV ?? 1.0}
                        onChange={(e) => onUpdateNodeData(selectedNode.id, { minOperatingVoltageV: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="1.0"
                        className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Potencia Disipada (W)</label>
                      <div className="w-full px-2 py-1 bg-slate-200 dark:bg-black/40 border border-slate-300 dark:border-slate-800 rounded text-xs font-mono font-bold text-sky-400">
                        {nodeData.powerWatts ?? 0} W
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transistores BJT */}
              {(selectedNode.data.componentType === 'transistor_bjt_npn' ||
                selectedNode.data.componentType === 'transistor_bjt_pnp') && (
                <div className="mt-3 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tight">
                      Estado del Transistor BJT
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        nodeData.isEnergized
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700/40 text-slate-400'
                      }`}
                    >
                      {nodeData.isEnergized ? 'SATURACIÓN (ON)' : 'CORTE (OFF)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Vbe Medida</label>
                      <div className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white">
                        {nodeData.vBe ?? 0} V
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 mb-0.5">Tensión Vce Medida</label>
                      <div className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white">
                        {nodeData.vCe ?? 0} V
                      </div>
                    </div>
                  </div>

                  <p className="text-[8.5px] text-slate-400 leading-tight">
                    {selectedNode.data.componentType === 'transistor_bjt_npn'
                      ? 'NPN conmuta Colector a Emisor cuando Vbe ≥ 0.7V.'
                      : 'PNP conmuta Emisor a Colector cuando Veb ≥ 0.7V.'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5">

            {/* Instrument Measured Value */}
            {(def?.category === 'instruments' || nodeData.measuredValue !== undefined) && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase">
                  Valor de Medición en Vivo
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500">Valor Medido</label>
                    <input
                      type="number"
                      step="0.1"
                      value={nodeData.measuredValue ?? ''}
                      onChange={(e) => onUpdateNodeData(selectedNode.id, { measuredValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="18.5"
                      className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-amber-500/40 rounded text-xs font-mono font-bold text-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Unidad</label>
                    <input
                      type="text"
                      value={nodeData.measuredUnit || 'bar'}
                      onChange={(e) => onUpdateNodeData(selectedNode.id, { measuredUnit: e.target.value })}
                      placeholder="bar, °C, kW..."
                      className="w-full px-2 py-1 bg-white dark:bg-[#121419] border border-amber-500/40 rounded text-xs font-mono text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Comments */}
          <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-[10px] text-slate-500 font-medium">Notas Técnicas de Montaje</label>
            <textarea
              rows={2}
              value={nodeData.notes || ''}
              onChange={(e) => onUpdateNodeData(selectedNode.id, { notes: e.target.value })}
              placeholder="Anotaciones de tubería, cableado o consignas especiales..."
              className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {/* Connection Ports Reference */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Tomas y Puertos de Conexión ({def?.ports.length || 0})
            </span>
            <div className="space-y-1">
              {def?.ports.map((p) => (
                <div
                  key={p.id}
                  className="p-1.5 rounded-md bg-slate-50 dark:bg-[#181b22] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-0.5 text-[10px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 font-mono font-bold text-[9px]">
                        {p.shortCode}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{p.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono capitalize">Pos: {p.position}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {p.hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edge / Pipe & Wire Inspector
  if (selectedEdge) {
    const edgeData = (selectedEdge.data || {}) as SchematicEdgeData;
    const isElectricWire =
      selectedEdge.type === 'electricWire' ||
      edgeData.edgeType === 'electricWire' ||
      Boolean(edgeData.pipeState?.startsWith('electric_'));

    // --- 1. FICHA DE CONEXIÓN ELÉCTRICA (CABLES Y CONDUCTORES) ---
    if (isElectricWire) {
      return (
        <div className="w-88 h-full bg-white/95 dark:bg-[#13151b]/95 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xl select-none">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/5 dark:bg-[#151410]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-xs">
                <Zap size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Ficha de Cableado Eléctrico
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                  Línea / Conexión Eléctrica
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* Quick Actions (Convert or Delete) */}
            <div className="flex items-center justify-between gap-2">
              {onConvertEdgeType && (
                <button
                  type="button"
                  onClick={() => onConvertEdgeType(selectedEdge.id, 'refrigerantPipe')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Cambiar esta línea a tubería frigorífica"
                >
                  <ArrowLeftRight size={12} />
                  <span>Pasar a Tubería ❄️</span>
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-[11px] transition-colors cursor-pointer ml-auto"
                title="Eliminar este cable"
              >
                <Trash2 size={12} />
                <span>Eliminar Cable</span>
              </button>
            </div>

            {/* Trazado y Puntos de Curvatura */}
            <div className="space-y-2 p-2.5 rounded-lg bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Puntos de Doblez y Enrutamiento
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {edgeData.waypoints && edgeData.waypoints.length > 0
                    ? `${edgeData.waypoints.length} puntos manuales`
                    : 'Automático'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Arrastra los tiradores del cable o pulsa &quot;+&quot; en los tramos para agregar quiebres ortogonales.
              </p>
              {edgeData.waypoints && edgeData.waypoints.length > 0 && (
                <button
                  onClick={() => onUpdateEdgeData(selectedEdge.id, { waypoints: undefined })}
                  className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] transition-colors cursor-pointer"
                >
                  Restablecer a Trazado Automático
                </button>
              )}
            </div>

            {/* Función del Conductor */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Función / Tipo de Conductor
              </label>
              <div className="space-y-1">
                {ELECTRIC_WIRE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdateEdgeData(selectedEdge.id, {
                        pipeState: opt.id,
                        edgeType: 'electricWire',
                      })
                    }
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      edgeData.pipeState === opt.id
                        ? 'bg-slate-100 dark:bg-[#1a1d24] border-amber-500 text-slate-900 dark:text-white font-semibold'
                        : 'bg-transparent border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] leading-tight truncate">{opt.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight truncate">{opt.sublabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sección del Conductor */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-500 font-medium">Sección Normalizada (mm²)</label>
                <span className="font-mono text-amber-500 font-bold text-xs">
                  {edgeData.wireSectionMm2 || 1.5} mm²
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {STANDARD_WIRE_SECTIONS.map((sec) => {
                  const isCurrent = (edgeData.wireSectionMm2 || 1.5) === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateEdgeData(selectedEdge.id, { wireSectionMm2: sec })}
                      className={`py-1 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs font-bold'
                          : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750'
                      }`}
                    >
                      {sec} mm²
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Etiqueta del Conductor */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">
                Etiqueta / Identificador de Conductor
              </label>
              <input
                type="text"
                value={edgeData.wireTag || edgeData.customLabel || ''}
                onChange={(e) =>
                  onUpdateEdgeData(selectedEdge.id, {
                    wireTag: e.target.value,
                    customLabel: e.target.value,
                  })
                }
                placeholder="ej. L1-KM1, N-EVAP, CTRL-TERMOSTATO..."
                className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Parámetros Eléctricos de la Línea */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Magnitudes Eléctricas de la Línea
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Tensión Nominal (V)</span>
                  <input
                    type="number"
                    step="1"
                    value={edgeData.voltageV ?? ''}
                    onChange={(e) =>
                      onUpdateEdgeData(selectedEdge.id, {
                        voltageV: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="230 / 400"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Intensidad (A)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={edgeData.wireCurrentA ?? ''}
                    onChange={(e) =>
                      onUpdateEdgeData(selectedEdge.id, {
                        wireCurrentA: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="5.0"
                    className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- 2. FICHA DE TUBERÍA FRIGORÍFICA ---
    return (
      <div className="w-88 h-full bg-white/95 dark:bg-[#13151b]/95 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xl select-none">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-500/5 dark:bg-[#0f1418]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/30 shadow-xs">
              <Sliders size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Ficha de Tubería Frigorífica
              </span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                Tramo de Circuito Frigorífico
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
          {/* Quick Actions Bar (Convert to wire or delete) */}
          <div className="flex items-center justify-between gap-2">
            {onConvertEdgeType && (
              <button
                type="button"
                onClick={() => onConvertEdgeType(selectedEdge.id, 'electricWire')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                title="Cambiar esta tubería a conexión eléctrica"
              >
                <ArrowLeftRight size={12} />
                <span>Pasar a Cable ⚡</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-[11px] transition-colors cursor-pointer ml-auto"
              title="Eliminar esta tubería del circuito"
            >
              <Trash2 size={12} />
              <span>Eliminar Tubería</span>
            </button>
          </div>

          {/* Trazado y Puntos de Curvatura */}
          <div className="space-y-2 p-2.5 rounded-lg bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                Puntos de Doblez y Enrutamiento
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {edgeData.waypoints && edgeData.waypoints.length > 0
                  ? `${edgeData.waypoints.length} puntos manuales`
                  : 'Automático'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Arrastra los círculos de quiebre en la tubería o pulsa &quot;+&quot; en los tramos para agregar nuevos puntos.
            </p>
            {edgeData.waypoints && edgeData.waypoints.length > 0 && (
              <button
                onClick={() => onUpdateEdgeData(selectedEdge.id, { waypoints: undefined })}
                className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] transition-colors cursor-pointer"
              >
                Restablecer a Trazado Automático
              </button>
            )}
          </div>

          {/* Insert Union / Fitting on this pipe */}
          {onSplitEdge && (
            <div className="space-y-2 p-2.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30">
              <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Insertar Unión en esta Tubería
              </span>
              <p className="text-[10px] text-slate-500 leading-tight">
                Divide este tramo e inserta un racor o accesorio para ramificar el circuito:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => onSplitEdge(selectedEdge.id, 'pipe_union_tee')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white dark:bg-[#151820] hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <span>Te (3 vías)</span>
                </button>
                <button
                  onClick={() => onSplitEdge(selectedEdge.id, 'pipe_union_elbow')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white dark:bg-[#151820] hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <span>Codo a 90°</span>
                </button>
                <button
                  onClick={() => onSplitEdge(selectedEdge.id, 'pipe_union_cross')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white dark:bg-[#151820] hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <span>Cruz (4 vías)</span>
                </button>
                <button
                  onClick={() => onSplitEdge(selectedEdge.id, 'pipe_union_straight')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white dark:bg-[#151820] hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <span>Unión Recta</span>
                </button>
                <button
                  onClick={() => onSplitEdge(selectedEdge.id, 'pipe_junction_dot')}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-white dark:bg-[#151820] hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <span>Punto de Empalme Rápido</span>
                </button>
              </div>
            </div>
          )}

          {/* Pipe State / Color Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Estado Termodinámico / Fase del Fluido
            </label>
            <div className="space-y-1">
              {PIPE_STATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    onUpdateEdgeData(selectedEdge.id, {
                      pipeState: opt.id,
                      edgeType: 'refrigerantPipe',
                    })
                  }
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    edgeData.pipeState === opt.id
                      ? 'bg-slate-100 dark:bg-[#1a1d24] border-sky-500 text-slate-900 dark:text-white font-semibold'
                      : 'bg-transparent border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                  <span className="text-[11px] leading-tight truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pipe Diameter & Custom Tag */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Diámetro Comercial de Tubería</label>
              <select
                value={edgeData.diameterInch || '1/2"'}
                onChange={(e) => onUpdateEdgeData(selectedEdge.id, { diameterInch: e.target.value })}
                className="w-full px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white outline-none"
              >
                {STANDARD_PIPE_DIAMETERS.map((d) => (
                  <option key={d} value={d}>
                    Cobre {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Etiqueta del Tramo</label>
              <input
                type="text"
                value={edgeData.customLabel || ''}
                onChange={(e) => onUpdateEdgeData(selectedEdge.id, { customLabel: e.target.value })}
                placeholder="ej. Línea de Descarga HP, Retorno Aceite..."
                className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Thermodynamic Values (Directly Entered) */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Condiciones de Operación del Tramo
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500">Presión (bar)</span>
                <input
                  type="number"
                  step="0.1"
                  value={edgeData.pressureBar ?? ''}
                  onChange={(e) => onUpdateEdgeData(selectedEdge.id, { pressureBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="14.5"
                  className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Temperatura (°C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={edgeData.temperatureC ?? ''}
                  onChange={(e) => onUpdateEdgeData(selectedEdge.id, { temperatureC: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="40.0"
                  className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500">Caudal Másico (kg/s)</span>
              <input
                type="number"
                step="0.005"
                value={edgeData.massFlowKgS ?? ''}
                onChange={(e) => onUpdateEdgeData(selectedEdge.id, { massFlowKgS: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.050"
                className="w-full px-2 py-1 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
