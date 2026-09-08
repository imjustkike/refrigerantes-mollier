import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Plus, Trash2, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { InputPairType } from '../../types/thermo';

const COLOR_OPTIONS = [
  '#38bdf8', // sky
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
];

export const PointEditor: React.FC = () => {
  const {
    points,
    selectedPointId,
    setSelectedPointId,
    addOrUpdatePointFromInput,
    removePoint,
  } = useProject();

  const selectedPoint = points.find((p) => p.id === selectedPointId) || null;

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [pairType, setPairType] = useState<InputPairType>('P-T');
  const [val1, setVal1] = useState<number>(2.0);
  const [val2, setVal2] = useState<number>(20.0);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Sync with selected point
  useEffect(() => {
    if (selectedPoint) {
      setName(selectedPoint.name);
      setColor(selectedPoint.color);
      // Map input types to pairType
      const t1 = selectedPoint.input1_type.toUpperCase();
      const t2 = selectedPoint.input2_type.toUpperCase();
      if ((t1 === 'P' && t2 === 'H') || (t1 === 'H' && t2 === 'P')) {
        setPairType('P-h');
        setVal1(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val);
        setVal2(t1 === 'H' ? selectedPoint.input1_val : selectedPoint.input2_val);
      } else if ((t1 === 'P' && t2 === 'T') || (t1 === 'T' && t2 === 'P')) {
        setPairType('P-T');
        setVal1(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val);
        setVal2(t1 === 'T' ? selectedPoint.input1_val : selectedPoint.input2_val);
      } else if ((t1 === 'P' && t2 === 'Q') || (t1 === 'Q' && t2 === 'P')) {
        setPairType('P-Q');
        setVal1(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val);
        setVal2(t1 === 'Q' ? selectedPoint.input1_val : selectedPoint.input2_val);
      } else if ((t1 === 'T' && t2 === 'Q') || (t1 === 'Q' && t2 === 'T')) {
        setPairType('T-Q');
        setVal1(t1 === 'T' ? selectedPoint.input1_val : selectedPoint.input2_val);
        setVal2(t1 === 'Q' ? selectedPoint.input1_val : selectedPoint.input2_val);
      } else if ((t1 === 'P' && t2 === 'S') || (t1 === 'S' && t2 === 'P')) {
        setPairType('P-s');
        setVal1(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val);
        setVal2(t1 === 'S' ? selectedPoint.input1_val : selectedPoint.input2_val);
      } else {
        setPairType('P-h');
        setVal1(selectedPoint.state.pressure_bar);
        setVal2(selectedPoint.state.enthalpy_kj_kg);
      }
      setValidationError(null);
    } else {
      setName(`Punto ${points.length + 1}`);
      setColor(COLOR_OPTIONS[points.length % COLOR_OPTIONS.length]);
      setPairType('P-T');
      setVal1(2.0);
      setVal2(20.0);
      setValidationError(null);
    }
  }, [selectedPointId, selectedPoint, points.length]);

  const getInputLabels = () => {
    switch (pairType) {
      case 'P-h':
        return { l1: 'Presión P [bar(a)]', l2: 'Entalpía h [kJ/kg]', t1: 'P', t2: 'H' };
      case 'P-T':
        return { l1: 'Presión P [bar(a)]', l2: 'Temperatura T [°C]', t1: 'P', t2: 'T' };
      case 'P-s':
        return { l1: 'Presión P [bar(a)]', l2: 'Entropía s [kJ/(kg·K)]', t1: 'P', t2: 'S' };
      case 'P-Q':
        return { l1: 'Presión P [bar(a)]', l2: 'Título vapor x [0..1]', t1: 'P', t2: 'Q' };
      case 'T-Q':
        return { l1: 'Temperatura T [°C]', l2: 'Título vapor x [0..1]', t1: 'T', t2: 'Q' };
      case 'P-v':
        return { l1: 'Presión P [bar(a)]', l2: 'Volumen esp. v [m³/kg]', t1: 'P', t2: 'V' };
      default:
        return { l1: 'P [bar]', l2: 'h [kJ/kg]', t1: 'P', t2: 'H' };
    }
  };

  const labels = getInputLabels();

  const handleApply = async () => {
    setIsCalculating(true);
    setValidationError(null);
    try {
      const res = await addOrUpdatePointFromInput(
        selectedPointId,
        name,
        color,
        labels.t1,
        val1,
        labels.t2,
        val2
      );
      if (res && !selectedPointId) {
        setName(`Punto ${points.length + 2}`);
        setColor(COLOR_OPTIONS[(points.length + 1) % COLOR_OPTIONS.length]);
      }
    } catch (err) {
      setValidationError(String(err));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white tracking-tight">
          {selectedPoint ? `Editar ${selectedPoint.name}` : 'Crear Nuevo Punto'}
        </div>
        {selectedPoint && (
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              onClick={() => removePoint(selectedPoint.id)}
              title="Eliminar punto"
            >
              <Trash2 size={13} />
            </button>
            <button
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              onClick={() => setSelectedPointId(null)}
              title="Deseleccionar"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Point Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-slate-400">Nombre del Punto</label>
        <input
          type="text"
          className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium outline-none transition-all focus:ring-1 focus:ring-cyan-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: 1 - Aspiración compresor"
        />
      </div>

      {/* Color Picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-slate-400">Color del Marcador</label>
        <div className="flex items-center gap-1.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              style={{ background: c }}
              className={`w-6 h-6 rounded-full transition-transform ${
                color === c ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-105 opacity-80'
              }`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Input Pair Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-slate-400">Par de Variables de Entrada</label>
        <select
          className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none transition-all focus:ring-1 focus:ring-cyan-500 font-mono"
          value={pairType}
          onChange={(e) => setPairType(e.target.value as InputPairType)}
        >
          <option value="P-T">Presión (P) y Temperatura (T)</option>
          <option value="P-h">Presión (P) y Entalpía (h)</option>
          <option value="P-Q">Presión (P) y Título de vapor (x)</option>
          <option value="T-Q">Temperatura (T) y Título de vapor (x)</option>
          <option value="P-s">Presión (P) y Entropía (s)</option>
          <option value="P-v">Presión (P) y Volumen específico (v)</option>
        </select>
      </div>

      {/* Numerical Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400">{labels.l1}</label>
          <input
            type="number"
            step="any"
            className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
            value={val1}
            onChange={(e) => setVal1(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400">{labels.l2}</label>
          <input
            type="number"
            step="any"
            className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
            value={val2}
            onChange={(e) => setVal2(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
          <span className="leading-tight">{validationError}</span>
        </div>
      )}

      {/* Calculate Button */}
      <button
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        onClick={handleApply}
        disabled={isCalculating}
      >
        {selectedPoint ? <Check size={14} /> : <Plus size={14} />}
        <span>{selectedPoint ? 'Actualizar Propiedades' : 'Crear y Calcular Punto'}</span>
      </button>

      {/* Calculated Properties Grid */}
      {selectedPoint && (
        <div className="flex flex-col gap-2 mt-1 border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Estado Calculado
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 text-[10px] font-bold">
              {selectedPoint.state.phase}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Presión Absoluta (P)</span>
              <span className="text-xs font-bold font-mono text-cyan-400 mt-0.5">
                {selectedPoint.state.pressure_bar.toFixed(4)} bar(a)
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Temperatura (T)</span>
              <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                {selectedPoint.state.temperature_c.toFixed(2)} °C
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Entalpía (h)</span>
              <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                {selectedPoint.state.enthalpy_kj_kg.toFixed(2)} kJ/kg
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Entropía (s)</span>
              <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                {selectedPoint.state.entropy_kj_kg_k.toFixed(4)} kJ/(kg·K)
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Volumen Esp. (v)</span>
              <span className="text-xs font-bold font-mono text-purple-400 mt-0.5">
                {selectedPoint.state.specific_volume_m3_kg < 0.01
                  ? selectedPoint.state.specific_volume_m3_kg.toExponential(4)
                  : selectedPoint.state.specific_volume_m3_kg.toFixed(5)}{' '}
                m³/kg
              </span>
            </div>

            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Densidad (ρ)</span>
              <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                {selectedPoint.state.density_kg_m3.toFixed(2)} kg/m³
              </span>
            </div>

            <div className="col-span-2 p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">Título de Vapor (x)</span>
              <span className="text-xs font-bold font-mono text-blue-400 mt-0.5">
                {selectedPoint.state.vapor_quality !== null && selectedPoint.state.vapor_quality !== undefined
                  ? `${(selectedPoint.state.vapor_quality * 100).toFixed(1)} % (${selectedPoint.state.vapor_quality.toFixed(4)})`
                  : 'No aplicable (Monofásico)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
