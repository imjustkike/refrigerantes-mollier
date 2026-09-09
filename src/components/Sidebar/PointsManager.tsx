import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { InputPairType } from '../../types/thermo';
import { formatSpecificVolume } from '../../utils/formatters';

interface PairConfig {
  isSingle: boolean;
  l1: string;
  l2?: string;
  t1: string;
  t2: string;
  fixedVal2?: number;
  fixedLabel?: string;
  placeholder1: string;
  placeholder2?: string;
}

function getPairConfig(type: InputPairType): PairConfig {
  switch (type) {
    case 'P-T':
      return {
        isSingle: false,
        l1: 'Presión P [bar]',
        l2: 'Temperatura T [°C]',
        t1: 'P',
        t2: 'T',
        placeholder1: '2.5',
        placeholder2: '25.0',
      };
    case 'P-h':
      return {
        isSingle: false,
        l1: 'Presión P [bar]',
        l2: 'Entalpía h [kJ/kg]',
        t1: 'P',
        t2: 'H',
        placeholder1: '2.5',
        placeholder2: '400.0',
      };
    case 'P-s':
      return {
        isSingle: false,
        l1: 'Presión P [bar]',
        l2: 'Entropía s [kJ/(kg·K)]',
        t1: 'P',
        t2: 'S',
        placeholder1: '2.5',
        placeholder2: '1.75',
      };
    case 'P-Q':
      return {
        isSingle: false,
        l1: 'Presión P [bar]',
        l2: 'Calidad x [0..1]',
        t1: 'P',
        t2: 'Q',
        placeholder1: '2.5',
        placeholder2: '0.5',
      };
    case 'T-Q':
      return {
        isSingle: false,
        l1: 'Temperatura T [°C]',
        l2: 'Calidad x [0..1]',
        t1: 'T',
        t2: 'Q',
        placeholder1: '10.0',
        placeholder2: '0.5',
      };
    case 'P-sat_vap':
      return {
        isSingle: true,
        l1: 'Presión P [bar]',
        t1: 'P',
        t2: 'Q',
        fixedVal2: 1.0,
        fixedLabel: 'Vapor Sat. (x = 1.0)',
        placeholder1: '2.5',
      };
    case 'P-sat_liq':
      return {
        isSingle: true,
        l1: 'Presión P [bar]',
        t1: 'P',
        t2: 'Q',
        fixedVal2: 0.0,
        fixedLabel: 'Líquido Sat. (x = 0.0)',
        placeholder1: '2.5',
      };
    case 'T-sat_vap':
      return {
        isSingle: true,
        l1: 'Temperatura T [°C]',
        t1: 'T',
        t2: 'Q',
        fixedVal2: 1.0,
        fixedLabel: 'Vapor Sat. (x = 1.0)',
        placeholder1: '10.0',
      };
    case 'T-sat_liq':
      return {
        isSingle: true,
        l1: 'Temperatura T [°C]',
        t1: 'T',
        t2: 'Q',
        fixedVal2: 0.0,
        fixedLabel: 'Líquido Sat. (x = 0.0)',
        placeholder1: '10.0',
      };
    case 'h-T':
      return {
        isSingle: false,
        l1: 'Entalpía h [kJ/kg]',
        l2: 'Temperatura T [°C]',
        t1: 'H',
        t2: 'T',
        placeholder1: '400.0',
        placeholder2: '25.0',
      };
    case 'h-P':
      return {
        isSingle: false,
        l1: 'Entalpía h [kJ/kg]',
        l2: 'Presión P [bar]',
        t1: 'H',
        t2: 'P',
        placeholder1: '400.0',
        placeholder2: '2.5',
      };
    case 'P-v':
      return {
        isSingle: false,
        l1: 'Presión P [bar]',
        l2: 'Volumen esp. v [m³/kg]',
        t1: 'P',
        t2: 'V',
        placeholder1: '2.5',
        placeholder2: '0.08',
      };
    default:
      return {
        isSingle: false,
        l1: 'Presión P [bar]',
        l2: 'Entalpía h [kJ/kg]',
        t1: 'P',
        t2: 'H',
        placeholder1: '2.5',
        placeholder2: '400.0',
      };
  }
}

function parseVal(str: string): number {
  if (!str) return NaN;
  return parseFloat(str.trim().replace(',', '.'));
}

export const PointsManager: React.FC = () => {
  const {
    points,
    selectedPointId,
    setSelectedPointId,
    removePoint,
    addOrUpdatePointFromInput,
    layers,
    activeLayerId,
    showToast,
  } = useProject();

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  // Form state: Add Point (top component)
  const [isAddFormOpen, setIsAddFormOpen] = useState(true);
  const [addName, setAddName] = useState(`Punto ${points.length + 1}`);
  const [addPairType, setAddPairType] = useState<InputPairType>('P-T');
  const [addVal1, setAddVal1] = useState('2.5');
  const [addVal2, setAddVal2] = useState('25.0');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Inline editing state for a point in the list
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPairType, setEditPairType] = useState<InputPairType>('P-T');
  const [editVal1, setEditVal1] = useState('');
  const [editVal2, setEditVal2] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // List collapse/expand state
  const [isListOpen, setIsListOpen] = useState(true);

  const addConfig = getPairConfig(addPairType);

  // Add Point Handler
  const handleCreatePoint = async () => {
    const v1 = parseVal(addVal1);
    const v2 = addConfig.isSingle ? (addConfig.fixedVal2 ?? 0) : parseVal(addVal2);

    if (isNaN(v1) || (!addConfig.isSingle && isNaN(v2))) {
      setAddError('Introduzca números válidos en los campos');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      const created = await addOrUpdatePointFromInput(
        null,
        addName.trim() || `Punto ${points.length + 1}`,
        activeLayer.color,
        addConfig.t1,
        v1,
        addConfig.t2,
        v2
      );
      if (created) {
        showToast(`Punto ${created.name} añadido con éxito`);
        setAddName(`Punto ${points.length + 2}`);
      }
    } catch (err) {
      setAddError(String(err));
    } finally {
      setAddLoading(false);
    }
  };

  // Start inline edit for a specific point
  const handleStartEdit = (ptId: string) => {
    const pt = points.find((p) => p.id === ptId);
    if (!pt) return;

    setEditingPointId(ptId);
    setEditName(pt.name);

    // Derive initial pair from inputs or state
    const t1 = pt.input1_type.toUpperCase();
    const t2 = pt.input2_type.toUpperCase();
    if ((t1 === 'P' && t2 === 'T') || (t1 === 'T' && t2 === 'P')) {
      setEditPairType('P-T');
      setEditVal1(String(t1 === 'P' ? pt.input1_val : pt.input2_val));
      setEditVal2(String(t1 === 'T' ? pt.input1_val : pt.input2_val));
    } else if ((t1 === 'P' && t2 === 'H') || (t1 === 'H' && t2 === 'P')) {
      setEditPairType('P-h');
      setEditVal1(String(t1 === 'P' ? pt.input1_val : pt.input2_val));
      setEditVal2(String(t1 === 'H' ? pt.input1_val : pt.input2_val));
    } else if ((t1 === 'P' && t2 === 'S') || (t1 === 'S' && t2 === 'P')) {
      setEditPairType('P-s');
      setEditVal1(String(t1 === 'P' ? pt.input1_val : pt.input2_val));
      setEditVal2(String(t1 === 'S' ? pt.input1_val : pt.input2_val));
    } else if ((t1 === 'P' && t2 === 'Q') || (t1 === 'Q' && t2 === 'P')) {
      setEditPairType('P-Q');
      setEditVal1(String(t1 === 'P' ? pt.input1_val : pt.input2_val));
      setEditVal2(String(t1 === 'Q' ? pt.input1_val : pt.input2_val));
    } else {
      setEditPairType('P-h');
      setEditVal1(String(pt.state.pressure_bar));
      setEditVal2(String(pt.state.enthalpy_kj_kg));
    }

    setEditError(null);
  };

  // Save inline edit
  const handleSaveEdit = async (ptId: string) => {
    const editConfig = getPairConfig(editPairType);
    const v1 = parseVal(editVal1);
    const v2 = editConfig.isSingle ? (editConfig.fixedVal2 ?? 0) : parseVal(editVal2);

    if (isNaN(v1) || (!editConfig.isSingle && isNaN(v2))) {
      setEditError('Introduzca valores numéricos válidos');
      return;
    }

    const pt = points.find((p) => p.id === ptId);
    const ptLayer = layers.find((l) => l.id === pt?.layerId) || activeLayer;

    setEditLoading(true);
    setEditError(null);
    try {
      await addOrUpdatePointFromInput(
        ptId,
        editName.trim(),
        ptLayer.color,
        editConfig.t1,
        v1,
        editConfig.t2,
        v2
      );
      setEditingPointId(null);
      showToast('Punto actualizado');
    } catch (err) {
      setEditError(String(err));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Componente Superior: Agregar Punto con sus opciones */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 shadow-md">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Agregar Punto
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors">
            <span className="text-[10px] font-semibold">{isAddFormOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isAddFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {isAddFormOpen && (
          <div className="flex flex-col gap-2.5 mt-3 pt-2.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            {/* Name & Layer Color Info */}
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Nombre del punto"
                className="w-full bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-medium placeholder:text-slate-500 transition-colors"
              />

              <div className="flex items-center justify-between text-[11px] bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1">
                <span className="text-slate-400">Color (asignado por capa activa):</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/30"
                    style={{ background: activeLayer.color }}
                  />
                  <span>{activeLayer.name}</span>
                </span>
              </div>
            </div>

            {/* Pair Type Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400">Variables de Entrada</label>
              <select
                value={addPairType}
                onChange={(e) => {
                  const nt = e.target.value as InputPairType;
                  setAddPairType(nt);
                  const cfg = getPairConfig(nt);
                  setAddVal1(cfg.placeholder1);
                  if (cfg.placeholder2) setAddVal2(cfg.placeholder2);
                }}
                className="w-full bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none font-sans"
              >
                <option value="P-T">Presión (P) y Temperatura (T)</option>
                <option value="P-h">Presión (P) y Entalpía (h)</option>
                <option value="P-s">Presión (P) y Entropía (s)</option>
                <option value="P-Q">Presión (P) y Título de Vapor (x)</option>
                <option value="T-Q">Temperatura (T) y Título de Vapor (x)</option>
                <option value="P-sat_vap">Presión Sat. Vapor Seco (x = 1.0)</option>
                <option value="P-sat_liq">Presión Sat. Líquido (x = 0.0)</option>
                <option value="T-sat_vap">Temp. Sat. Vapor Seco (x = 1.0)</option>
                <option value="T-sat_liq">Temp. Sat. Líquido (x = 0.0)</option>
                <option value="h-T">Entalpía (h) y Temperatura (T)</option>
                <option value="h-P">Entalpía (h) y Presión (P)</option>
                <option value="P-v">Presión (P) y Volumen Específico (v)</option>
              </select>
            </div>

            {/* Inputs Values */}
            <div className={`grid ${addConfig.isSingle ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-400 truncate">{addConfig.l1}</label>
                <input
                  type="text"
                  value={addVal1}
                  onChange={(e) => setAddVal1(e.target.value.replace(/[^0-9.,-]/g, ''))}
                  placeholder={addConfig.placeholder1}
                  className="bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
                />
              </div>

              {!addConfig.isSingle ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-slate-400 truncate">{addConfig.l2}</label>
                  <input
                    type="text"
                    value={addVal2}
                    onChange={(e) => setAddVal2(e.target.value.replace(/[^0-9.,-]/g, ''))}
                    placeholder={addConfig.placeholder2}
                    className="bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
                  />
                </div>
              ) : (
                <div className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/40 border border-cyan-800/40 rounded-lg px-2 py-1 flex items-center">
                  {addConfig.fixedLabel}
                </div>
              )}
            </div>

            {addError && (
              <div className="p-2 bg-rose-950/80 border border-rose-800/80 rounded-lg text-[11px] text-rose-300 flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0 text-rose-400" />
                <span className="truncate">{addError}</span>
              </div>
            )}

            <button
              onClick={handleCreatePoint}
              disabled={addLoading}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {addLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              <span>Añadir Punto</span>
            </button>
          </div>
        )}
      </div>

      {/* Header de la Lista de Puntos (Plegable / Desplegable) */}
      <div
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-900/70 border border-slate-800/80 cursor-pointer select-none transition-colors mt-1"
      >
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Lista de Puntos
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
            {points.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 hover:text-cyan-400">
          <span className="text-[10px] font-semibold">{isListOpen ? 'Ocultar' : 'Mostrar'}</span>
          {isListOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      {/* Lista de Puntos con Max Height y Scroll Interno */}
      {isListOpen && (
        <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar animate-in fade-in duration-150">
        {points.length === 0 ? (
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 text-slate-500">
            <span className="text-xs">No hay puntos en el ciclo aún</span>
            <span className="text-[10px] text-slate-600">
              Use el formulario superior para añadir estados
            </span>
          </div>
        ) : (
          points.map((pt) => {
            const isSelected = pt.id === selectedPointId;
            const isEditing = editingPointId === pt.id;
            const ptLayer = layers.find((l) => l.id === pt.layerId) || activeLayer;
            const volInfo = formatSpecificVolume(pt.state.specific_volume_m3_kg);

            if (isEditing) {
              const editConfig = getPairConfig(editPairType);

              return (
                <div
                  key={pt.id}
                  className="p-3 bg-slate-900 border border-cyan-500/70 rounded-xl flex flex-col gap-2.5 shadow-lg ring-1 ring-cyan-500/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">Editar {pt.name}</span>
                    <button
                      onClick={() => setEditingPointId(null)}
                      className="text-slate-400 hover:text-white p-0.5 rounded"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Edit Name & Layer Info */}
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
                    />

                    <div className="flex items-center justify-between text-[10px] bg-slate-950/60 border border-slate-800/80 rounded px-2 py-1">
                      <span className="text-slate-400">Color (definido por capa):</span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/30"
                          style={{ background: ptLayer?.color }}
                        />
                        <span>{ptLayer?.name}</span>
                      </span>
                    </div>
                  </div>

                  {/* Pair selector */}
                  <select
                    value={editPairType}
                    onChange={(e) => setEditPairType(e.target.value as InputPairType)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none font-sans"
                  >
                    <option value="P-T">Presión (P) y Temperatura (T)</option>
                    <option value="P-h">Presión (P) y Entalpía (h)</option>
                    <option value="P-s">Presión (P) y Entropía (s)</option>
                    <option value="P-Q">Presión (P) y Título de Vapor (x)</option>
                    <option value="T-Q">Temperatura (T) y Título de Vapor (x)</option>
                    <option value="P-sat_vap">Presión Sat. Vapor Seco (x = 1.0)</option>
                    <option value="P-sat_liq">Presión Sat. Líquido (x = 0.0)</option>
                    <option value="T-sat_vap">Temp. Sat. Vapor Seco (x = 1.0)</option>
                    <option value="T-sat_liq">Temp. Sat. Líquido (x = 0.0)</option>
                    <option value="h-T">Entalpía (h) y Temperatura (T)</option>
                    <option value="h-P">Entalpía (h) y Presión (P)</option>
                    <option value="P-v">Presión (P) y Volumen Específico (v)</option>
                  </select>

                  {/* Edit Inputs */}
                  <div className={`grid ${editConfig.isSingle ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] text-slate-400">{editConfig.l1}</label>
                      <input
                        type="text"
                        value={editVal1}
                        onChange={(e) => setEditVal1(e.target.value.replace(/[^0-9.,-]/g, ''))}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    {!editConfig.isSingle ? (
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-slate-400">{editConfig.l2}</label>
                        <input
                          type="text"
                          value={editVal2}
                          onChange={(e) => setEditVal2(e.target.value.replace(/[^0-9.,-]/g, ''))}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono outline-none"
                        />
                      </div>
                    ) : (
                      <div className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/40 rounded px-2 py-1 flex items-center">
                        {editConfig.fixedLabel}
                      </div>
                    )}
                  </div>

                  {editError && (
                    <div className="text-[10px] text-rose-400 truncate">{editError}</div>
                  )}

                  {/* Save / Cancel buttons */}
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setEditingPointId(null)}
                      className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(pt.id)}
                      disabled={editLoading}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm disabled:opacity-50"
                    >
                      {editLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={pt.id}
                onClick={() => setSelectedPointId(isSelected ? null : pt.id)}
                className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-850 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ background: pt.color }}
                    />
                    <span className="text-xs font-bold text-white tracking-tight truncate">
                      {pt.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-sans shrink-0">
                      {pt.state.phase}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(pt.id);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-cyan-500/10 transition-colors"
                      title="Editar propiedades de este punto en su componente"
                    >
                      <Edit2 size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePoint(pt.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                      title="Eliminar punto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Thermodynamic Properties Grid: Enthalpy, Volume, Temp, Pressure */}
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                  <div className="p-1.5 bg-slate-900/90 rounded-lg border border-slate-800/70 flex items-center justify-between">
                    <span className="text-slate-400">P:</span>
                    <span className="text-cyan-400 font-bold">
                      {pt.state.pressure_bar.toFixed(2)} bar
                    </span>
                  </div>

                  <div className="p-1.5 bg-slate-900/90 rounded-lg border border-slate-800/70 flex items-center justify-between">
                    <span className="text-slate-400">T:</span>
                    <span className="text-emerald-400 font-bold">
                      {pt.state.temperature_c.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="p-1.5 bg-slate-900/90 rounded-lg border border-slate-800/70 flex items-center justify-between">
                    <span className="text-slate-400">h:</span>
                    <span className="text-slate-100 font-bold">
                      {pt.state.enthalpy_kj_kg.toFixed(1)} kJ/kg
                    </span>
                  </div>

                  <div
                    title={volInfo.tooltip}
                    className="p-1.5 bg-slate-900/90 rounded-lg border border-slate-800/70 flex items-center justify-between cursor-help"
                  >
                    <span className="text-slate-400">v:</span>
                    <span className={`font-bold ${volInfo.isSci ? 'text-purple-300' : 'text-purple-400'}`}>
                      {volInfo.display}
                    </span>
                  </div>

                  {/* Isentropic entropy */}
                  <div className="col-span-2 p-1.5 bg-slate-900/90 rounded-lg border border-slate-800/70 flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">s:</span>
                    <span className="text-amber-300 font-bold">
                      {pt.state.entropy_kj_kg_k.toFixed(4)} kJ/(kg·K)
                    </span>
                  </div>
                </div>

                {/* Sub-label: Layer belonging */}
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-0.5">
                  <span className="flex items-center gap-1">
                    <span>Capa:</span>
                    <strong style={{ color: ptLayer?.color }}>{ptLayer?.name}</strong>
                  </span>
                  {isSelected && (
                    <span className="text-cyan-400 font-semibold font-sans">
                      Seleccionado
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
};
