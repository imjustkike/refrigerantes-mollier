import React from 'react';
import {
  Copy,
  FlipHorizontal,
  FlipVertical,
  Power,
  RotateCw,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import { Edge, Node } from '@xyflow/react';
import { PipeStateCategory, SchematicEdgeData, SchematicNodeData } from '../../types/schematic';
import { COMPONENT_DEFINITIONS } from './symbols/componentDefinitions';

interface ComponentPropertyPanelProps {
  selectedNode: Node<SchematicNodeData> | null;
  selectedEdge: Edge<SchematicEdgeData> | null;
  onUpdateNodeData: (nodeId: string, updates: Partial<SchematicNodeData>) => void;
  onUpdateEdgeData: (edgeId: string, updates: Partial<SchematicEdgeData>) => void;
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

export const ComponentPropertyPanel: React.FC<ComponentPropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNodeData,
  onUpdateEdgeData,
  onDeleteSelected,
  onDuplicateSelected,
  onClose,
}) => {
  if (!selectedNode && !selectedEdge) return null;

  // Node Inspector
  if (selectedNode) {
    const nodeData = selectedNode.data;
    const def = COMPONENT_DEFINITIONS[nodeData.componentType];

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
              title="Rotar 90° en sentido horario"
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
              title="Volteo Horizontal"
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
              title="Volteo Vertical"
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
              title="Duplicar Componente"
            >
              <Copy size={13} />
            </button>

            <button
              onClick={onDeleteSelected}
              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
              title="Eliminar Componente"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Identification Section */}
          <div className="space-y-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#161922] border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Identificación P&ID
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Tag Técnico</label>
                <input
                  type="text"
                  value={nodeData.tag || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { tag: e.target.value })}
                  placeholder={def?.defaultTagPrefix || 'TAG-01'}
                  className="w-full px-2 py-1 bg-white dark:bg-[#1c202a] border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-sky-600 dark:text-sky-400 outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Modelo Comercial</label>
                <input
                  type="text"
                  value={nodeData.modelNumber || ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { modelNumber: e.target.value })}
                  placeholder={def?.defaultModel || 'Marca / Modelo'}
                  className="w-full px-2 py-1 bg-white dark:bg-[#1c202a] border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Nombre / Descripción Personalizada</label>
              <input
                type="text"
                value={nodeData.customName || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { customName: e.target.value })}
                placeholder={def?.defaultLabel || 'Nombre del equipo'}
                className="w-full px-2 py-1 bg-white dark:bg-[#1c202a] border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Technical Specs: Compressors */}
          {def?.category === 'compressors' && (
            <div className="space-y-2.5 p-2.5 rounded-lg bg-sky-50/50 dark:bg-[#121a28] border border-sky-200/60 dark:border-sky-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono">
                Parámetros Termodinámicos y Eléctricos
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Potencia Eléctrica (kW)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.powerKw ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { powerKw: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="7.5"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Desplazamiento (m³/h)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.displacementM3h ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { displacementM3h: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="17.2"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-rose-500 font-medium">P. Descarga (bar)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.pressureOutBar ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { pressureOutBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="14.5"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-rose-300 dark:border-rose-900/60 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-blue-500 font-medium">P. Aspiración (bar)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.pressureInBar ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { pressureInBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="2.1"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-blue-300 dark:border-blue-900/60 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-rose-500">T. Descarga (°C)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.tempOutC ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { tempOutC: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="68.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-blue-500">T. Aspiración (°C)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.tempInC ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { tempInC: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="-5.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Frecuencia (Hz)</span>
                  <input
                    type="number"
                    value={nodeData.frequencyHz ?? 50}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { frequencyHz: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">COP Estimado</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.cop ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { cop: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="3.8"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182030] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Technical Specs: Heat Exchangers */}
          {def?.category === 'heat_exchangers' && (
            <div className="space-y-2.5 p-2.5 rounded-lg bg-amber-50/50 dark:bg-[#1e1c14] border border-amber-200/60 dark:border-amber-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                Parámetros del Intercambiador
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Capacidad Térmica (kW)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.capacityKw ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { capacityKw: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="25.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#252219] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">T. Trabajo / Setpoint (°C)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.setpointTempC ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { setpointTempC: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="45.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#252219] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-amber-600 font-medium">Subenfriamiento ΔTsc (K)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.subcoolingK ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { subcoolingK: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="4.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#252219] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-sky-600 font-medium">Recalentamiento ΔTsh (K)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.superheatK ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { superheatK: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="6.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#252219] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Technical Specs: Expansion */}
          {def?.category === 'expansion' && (
            <div className="space-y-2.5 p-2.5 rounded-lg bg-teal-50/50 dark:bg-[#121f1d] border border-teal-200/60 dark:border-teal-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 font-mono">
                Regulación & Expansión
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Recalentamiento Útil (K)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.superheatK ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { superheatK: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="5.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182825] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Consigna Presión (bar)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.setpointBar ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { setpointBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="3.2"
                    className="w-full px-2 py-1 bg-white dark:bg-[#182825] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500">Apertura Válvula (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={nodeData.openingPercent ?? ''}
                  onChange={(e) => onUpdateNodeData(selectedNode.id, { openingPercent: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="65"
                  className="w-full px-2 py-1 bg-white dark:bg-[#182825] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Technical Specs: Vessels & Accessories */}
          {def?.category === 'vessels' && (
            <div className="space-y-2.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-[#121c16] border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                Capacidad y Almacenamiento
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Volumen (Litros)</span>
                  <input
                    type="number"
                    step="1"
                    value={nodeData.volumeL ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { volumeL: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="25"
                    className="w-full px-2 py-1 bg-white dark:bg-[#16241c] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Presión Diseño (bar)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={nodeData.pressureOutBar ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { pressureOutBar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="28.0"
                    className="w-full px-2 py-1 bg-white dark:bg-[#16241c] border border-slate-200 dark:border-slate-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Technical Specs: Instruments */}
          {def?.category === 'instruments' && (
            <div className="space-y-2.5 p-2.5 rounded-lg bg-purple-50/50 dark:bg-[#1c1424] border border-purple-200/60 dark:border-purple-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                Valor Medido en Vivo
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Lectura / Valor</span>
                  <input
                    type="number"
                    step="0.1"
                    value={nodeData.measuredValue ?? ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { measuredValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="14.8"
                    className="w-full px-2 py-1 bg-white dark:bg-[#251b30] border border-purple-300 dark:border-purple-700 rounded font-mono text-xs font-bold text-amber-500 dark:text-amber-400"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Unidad</span>
                  <input
                    type="text"
                    value={nodeData.measuredUnit || ''}
                    onChange={(e) => onUpdateNodeData(selectedNode.id, { measuredUnit: e.target.value })}
                    placeholder="bar / °C / kW"
                    className="w-full px-2 py-1 bg-white dark:bg-[#251b30] border border-purple-300 dark:border-purple-700 rounded font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ports & Connection Guide */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Puntos de Conexión ({def?.ports.length || 0})
            </span>
            <div className="space-y-1.5">
              {def?.ports.map((p) => (
                <div key={p.id} className="p-2 rounded bg-slate-50 dark:bg-[#171a22] border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono font-bold text-[9px]">
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

  // Edge / Pipe Inspector
  if (selectedEdge) {
    const edgeData = (selectedEdge.data || {}) as SchematicEdgeData;

    return (
      <div className="w-88 h-full bg-white/95 dark:bg-[#13151b]/95 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xl select-none">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#101217]">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-sky-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Ficha de Tubería
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
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
          {/* Delete Edge Button */}
          <div className="flex justify-end">
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-medium transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Eliminar Tubería</span>
            </button>
          </div>

          {/* Pipe State / Color Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Estado Termodinámico / Fase del Fluido
            </label>
            <div className="space-y-1">
              {PIPE_STATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateEdgeData(selectedEdge.id, { pipeState: opt.id })}
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
