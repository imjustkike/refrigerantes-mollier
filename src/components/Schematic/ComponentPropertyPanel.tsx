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
import { PipeStateCategory, SchematicComponentType, SchematicEdgeData, SchematicNodeData } from '../../types/schematic';
import { COMPONENT_DEFINITIONS } from './symbols/componentDefinitions';

interface ComponentPropertyPanelProps {
  selectedNode: Node<SchematicNodeData> | null;
  selectedEdge: Edge<SchematicEdgeData> | null;
  onUpdateNodeData: (nodeId: string, updates: Partial<SchematicNodeData>) => void;
  onUpdateEdgeData: (edgeId: string, updates: Partial<SchematicEdgeData>) => void;
  onSplitEdge?: (edgeId: string, junctionType: SchematicComponentType) => void;
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
  onSplitEdge,
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
                placeholder="ej. Bitzer 4CES-9Y, Danfoss T2, Copeland ZB45"
                className="w-full px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Direct Technical & Thermodynamic Specs */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Parámetros de Operación Directos
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
