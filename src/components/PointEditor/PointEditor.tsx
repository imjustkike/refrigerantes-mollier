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
    layers,
    activeLayerId,
  } = useProject();

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
  const selectedPoint = points.find((p) => p.id === selectedPointId) || null;

  const [name, setName] = useState('');
  const [color, setColor] = useState(activeLayer?.color || COLOR_OPTIONS[0]);
  const [pairType, setPairType] = useState<InputPairType>('P-T');
  const [val1Str, setVal1Str] = useState<string>('2.0');
  const [val2Str, setVal2Str] = useState<string>('20.0');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Helper to parse localized decimal inputs (accepts both comma and dot)
  const parseInputValue = (str: string): number => {
    if (!str) return NaN;
    const normalized = str.trim().replace(',', '.');
    return parseFloat(normalized);
  };

  // Helper to sanitize decimal input allowing numbers, negative sign, and both '.' and ','
  const sanitizeDecimalInput = (raw: string): string => {
    return raw.replace(/[^0-9.,-]/g, '');
  };

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
        setVal1Str(String(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val));
        setVal2Str(String(t1 === 'H' ? selectedPoint.input1_val : selectedPoint.input2_val));
      } else if ((t1 === 'P' && t2 === 'T') || (t1 === 'T' && t2 === 'P')) {
        setPairType('P-T');
        setVal1Str(String(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val));
        setVal2Str(String(t1 === 'T' ? selectedPoint.input1_val : selectedPoint.input2_val));
      } else if ((t1 === 'P' && t2 === 'Q') || (t1 === 'Q' && t2 === 'P')) {
        setPairType('P-Q');
        setVal1Str(String(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val));
        setVal2Str(String(t1 === 'Q' ? selectedPoint.input1_val : selectedPoint.input2_val));
      } else if ((t1 === 'T' && t2 === 'Q') || (t1 === 'Q' && t2 === 'T')) {
        setPairType('T-Q');
        setVal1Str(String(t1 === 'T' ? selectedPoint.input1_val : selectedPoint.input2_val));
        setVal2Str(String(t1 === 'Q' ? selectedPoint.input1_val : selectedPoint.input2_val));
      } else if ((t1 === 'P' && t2 === 'S') || (t1 === 'S' && t2 === 'P')) {
        setPairType('P-s');
        setVal1Str(String(t1 === 'P' ? selectedPoint.input1_val : selectedPoint.input2_val));
        setVal2Str(String(t1 === 'S' ? selectedPoint.input1_val : selectedPoint.input2_val));
      } else {
        setPairType('P-h');
        setVal1Str(String(selectedPoint.state.pressure_bar));
        setVal2Str(String(selectedPoint.state.enthalpy_kj_kg));
      }
      setValidationError(null);
    } else {
      setName(`Punto ${points.length + 1}`);
      setColor(activeLayer?.color || COLOR_OPTIONS[points.length % COLOR_OPTIONS.length]);
      setPairType('P-T');
      setVal1Str('2.0');
      setVal2Str('20.0');
      setValidationError(null);
    }
  }, [selectedPointId, selectedPoint, points.length, activeLayer?.color]);

  const getInputConfig = () => {
    switch (pairType) {
      case 'P-T':
        return {
          isSingle: false,
          l1: 'Presión P [bar(a)]',
          l2: 'Temperatura T [°C]',
          t1: 'P',
          t2: 'T',
          help: 'Punto fijado por presión y temperatura.',
        };
      case 'P-h':
        return {
          isSingle: false,
          l1: 'Presión P [bar(a)]',
          l2: 'Entalpía h [kJ/kg]',
          t1: 'P',
          t2: 'H',
          help: 'Punto fijado por presión y entalpía.',
        };
      case 'h-P':
        return {
          isSingle: false,
          l1: 'Entalpía h [kJ/kg]',
          l2: 'Presión P [bar(a)]',
          t1: 'H',
          t2: 'P',
          help: 'Punto fijado por entalpía y presión.',
        };
      case 'h-T':
        return {
          isSingle: false,
          l1: 'Entalpía h [kJ/kg]',
          l2: 'Temperatura T [°C]',
          t1: 'H',
          t2: 'T',
          help: 'Punto fijado por entalpía y temperatura.',
        };
      case 'P-sat_vap':
        return {
          isSingle: true,
          l1: 'Presión de Saturación P [bar(a)]',
          t1: 'P',
          t2: 'Q',
          fixedVal2: 1.0,
          fixedLabel: 'Vapor Saturado Seco (x = 1.0 / 100%)',
          help: 'Punto sobre la curva de saturación de vapor seco (x = 1).',
        };
      case 'P-sat_liq':
        return {
          isSingle: true,
          l1: 'Presión de Saturación P [bar(a)]',
          t1: 'P',
          t2: 'Q',
          fixedVal2: 0.0,
          fixedLabel: 'Líquido Saturado (x = 0.0 / 0%)',
          help: 'Punto sobre la curva de saturación de líquido (x = 0).',
        };
      case 'P-Q':
        return {
          isSingle: false,
          l1: 'Presión P [bar(a)]',
          l2: 'Título de vapor x [0..1]',
          t1: 'P',
          t2: 'Q',
          help: 'Punto en campana bifásica con título de vapor.',
        };
      case 'T-sat_vap':
        return {
          isSingle: true,
          l1: 'Temperatura de Saturación T [°C]',
          t1: 'T',
          t2: 'Q',
          fixedVal2: 1.0,
          fixedLabel: 'Vapor Saturado Seco (x = 1.0 / 100%)',
          help: 'Punto sobre la curva de vapor saturado a temp. dada.',
        };
      case 'T-sat_liq':
        return {
          isSingle: true,
          l1: 'Temperatura de Saturación T [°C]',
          t1: 'T',
          t2: 'Q',
          fixedVal2: 0.0,
          fixedLabel: 'Líquido Saturado (x = 0.0 / 0%)',
          help: 'Punto sobre la curva de líquido saturado a temp. dada.',
        };
      case 'T-Q':
        return {
          isSingle: false,
          l1: 'Temperatura T [°C]',
          l2: 'Título de vapor x [0..1]',
          t1: 'T',
          t2: 'Q',
          help: 'Punto bifásico fijado por temperatura y título.',
        };
      case 'P-s':
        return {
          isSingle: false,
          l1: 'Presión P [bar(a)]',
          l2: 'Entropía s [kJ/(kg·K)]',
          t1: 'P',
          t2: 'S',
          help: 'Punto fijado por presión y entropía.',
        };
      case 'P-v':
        return {
          isSingle: false,
          l1: 'Presión P [bar(a)]',
          l2: 'Volumen esp. v [m³/kg]',
          t1: 'P',
          t2: 'V',
          help: 'Punto fijado por presión y volumen específico.',
        };
      default:
        return {
          isSingle: false,
          l1: 'Presión P [bar]',
          l2: 'Entalpía h [kJ/kg]',
          t1: 'P',
          t2: 'H',
          help: '',
        };
    }
  };

  const config = getInputConfig();

  const handlePairTypeChange = (newType: InputPairType) => {
    setPairType(newType);
    if (newType === 'h-T') {
      setVal1Str(String(selectedPoint?.state.enthalpy_kj_kg ?? 400.0));
      setVal2Str(String(selectedPoint?.state.temperature_c ?? 20.0));
    } else if (newType === 'h-P') {
      setVal1Str(String(selectedPoint?.state.enthalpy_kj_kg ?? 400.0));
      setVal2Str(String(selectedPoint?.state.pressure_bar ?? 2.0));
    } else if (newType === 'T-sat_vap' || newType === 'T-sat_liq') {
      setVal1Str(String(selectedPoint?.state.temperature_c ?? 10.0));
    } else if (newType === 'T-Q') {
      setVal1Str(String(selectedPoint?.state.temperature_c ?? 10.0));
      setVal2Str('0.5');
    } else if (newType === 'P-sat_vap' || newType === 'P-sat_liq') {
      setVal1Str(String(selectedPoint?.state.pressure_bar ?? 2.0));
    } else if (newType === 'P-Q') {
      setVal1Str(String(selectedPoint?.state.pressure_bar ?? 2.0));
      setVal2Str('0.5');
    } else if (newType === 'P-s') {
      setVal1Str(String(selectedPoint?.state.pressure_bar ?? 2.0));
      setVal2Str(String(selectedPoint?.state.entropy_kj_kg_k ?? 1.75));
    } else if (newType === 'P-h') {
      setVal1Str(String(selectedPoint?.state.pressure_bar ?? 2.0));
      setVal2Str(String(selectedPoint?.state.enthalpy_kj_kg ?? 400.0));
    } else if (newType === 'P-T') {
      setVal1Str(String(selectedPoint?.state.pressure_bar ?? 2.0));
      setVal2Str(String(selectedPoint?.state.temperature_c ?? 20.0));
    }
  };

  const handleApply = async () => {
    setIsCalculating(true);
    setValidationError(null);
    try {
      const v1 = parseInputValue(val1Str);
      const v2 = config.isSingle ? config.fixedVal2! : parseInputValue(val2Str);

      if (isNaN(v1) || (!config.isSingle && isNaN(v2))) {
        setValidationError('Por favor introduzca números válidos en los campos (admite punto o coma decimal).');
        setIsCalculating(false);
        return;
      }

      const res = await addOrUpdatePointFromInput(
        selectedPointId,
        name,
        color,
        config.t1,
        v1,
        config.t2,
        v2
      );
      if (res && !selectedPointId) {
        setName(`Punto ${points.length + 2}`);
        setColor(activeLayer?.color || COLOR_OPTIONS[(points.length + 1) % COLOR_OPTIONS.length]);
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
              title="Deseleccionar y crear nuevo"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Point Selector Dropdown: Seleccionar punto existente o nuevo mediante inputs */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-slate-400">Punto a Seleccionar / Modificar</label>
        <select
          className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium outline-none transition-all focus:ring-1 focus:ring-cyan-500 font-sans"
          value={selectedPointId || '__new__'}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setSelectedPointId(null);
            } else {
              setSelectedPointId(e.target.value);
            }
          }}
        >
          <option value="__new__">+ Crear Nuevo Punto (por valores de entrada)</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.state.pressure_bar.toFixed(2)} bar | {p.state.enthalpy_kj_kg.toFixed(1)} kJ/kg ({p.state.phase})
            </option>
          ))}
        </select>
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
          className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none transition-all focus:ring-1 focus:ring-cyan-500 font-sans"
          value={pairType}
          onChange={(e) => handlePairTypeChange(e.target.value as InputPairType)}
        >
          <optgroup label="Entalpía & Variables">
            <option value="h-T">Entalpía (h) - Temperatura (T)</option>
            <option value="h-P">Entalpía (h) - Presión (P)</option>
          </optgroup>
          <optgroup label="Presión & Saturación / Título">
            <option value="P-sat_vap">Presión (P) - Saturación Vapor (x = 1.0)</option>
            <option value="P-sat_liq">Presión (P) - Saturación Líquido (x = 0.0)</option>
            <option value="P-Q">Presión (P) - Título de vapor (x)</option>
          </optgroup>
          <optgroup label="Presión & Otras Variables">
            <option value="P-T">Presión (P) - Temperatura (T)</option>
            <option value="P-h">Presión (P) - Entalpía (h)</option>
            <option value="P-s">Presión (P) - Entropía (s)</option>
            <option value="P-v">Presión (P) - Volumen específico (v)</option>
          </optgroup>
          <optgroup label="Temperatura & Saturación / Título">
            <option value="T-sat_vap">Temperatura (T) - Saturación Vapor (x = 1.0)</option>
            <option value="T-sat_liq">Temperatura (T) - Saturación Líquido (x = 0.0)</option>
            <option value="T-Q">Temperatura (T) - Título de vapor (x)</option>
          </optgroup>
        </select>
      </div>

      {/* Numerical Inputs / Checkbox Depending on Selected Mode */}
      {pairType === 'P-sat_vap' || pairType === 'P-sat_liq' ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400">Presión de Saturación P [bar(a)]</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
              value={val1Str}
              onChange={(e) => setVal1Str(sanitizeDecimalInput(e.target.value))}
              placeholder="Ej: 2.50 ó 2,50"
            />
          </div>

          {/* Interactive Checkbox for Liquid/Vapor Saturation Selection */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/80 border border-cyan-500/30 rounded-xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Estado de Saturación
            </div>
            <div className="flex items-center gap-2">
              <label
                className={`flex-1 flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  pairType === 'P-sat_liq'
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pairType === 'P-sat_liq'}
                  onChange={() => handlePairTypeChange(pairType === 'P-sat_liq' ? 'P-sat_vap' : 'P-sat_liq')}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-xs">Líquido Saturado (x = 0.0)</span>
              </label>

              <label
                className={`flex-1 flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  pairType === 'P-sat_vap'
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pairType === 'P-sat_vap'}
                  onChange={() => handlePairTypeChange(pairType === 'P-sat_vap' ? 'P-sat_liq' : 'P-sat_vap')}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-xs">Vapor Saturado (x = 1.0)</span>
              </label>
            </div>
          </div>
        </div>
      ) : pairType === 'T-sat_vap' || pairType === 'T-sat_liq' ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400">Temperatura de Saturación T [°C]</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
              value={val1Str}
              onChange={(e) => setVal1Str(sanitizeDecimalInput(e.target.value))}
              placeholder="Ej: -10.5 ó -10,5"
            />
          </div>

          {/* Interactive Checkbox for Liquid/Vapor Saturation Selection */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/80 border border-cyan-500/30 rounded-xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Estado de Saturación
            </div>
            <div className="flex items-center gap-2">
              <label
                className={`flex-1 flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  pairType === 'T-sat_liq'
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pairType === 'T-sat_liq'}
                  onChange={() => handlePairTypeChange(pairType === 'T-sat_liq' ? 'T-sat_vap' : 'T-sat_liq')}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-xs">Líquido Saturado (x = 0.0)</span>
              </label>

              <label
                className={`flex-1 flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  pairType === 'T-sat_vap'
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pairType === 'T-sat_vap'}
                  onChange={() => handlePairTypeChange(pairType === 'T-sat_vap' ? 'T-sat_liq' : 'T-sat_vap')}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-xs">Vapor Saturado (x = 1.0)</span>
              </label>
            </div>
          </div>
        </div>
      ) : pairType === 'P-Q' || pairType === 'T-Q' ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 truncate">{config.l1}</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                value={val1Str}
                onChange={(e) => setVal1Str(sanitizeDecimalInput(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 truncate">Título x [0..1]</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
                value={val2Str}
                onChange={(e) => setVal2Str(sanitizeDecimalInput(e.target.value))}
                placeholder="0.0 a 1.0"
              />
            </div>
          </div>

          {/* Vapor Quality Slider & Quick Presets */}
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>
                Fracción de vapor:{' '}
                <strong className="text-cyan-300 font-bold">
                  {isNaN(parseInputValue(val2Str)) ? '0.0' : (parseInputValue(val2Str) * 100).toFixed(1)}%
                </strong>
              </span>
              <span className="text-cyan-400 font-medium">
                {parseInputValue(val2Str) === 0
                  ? 'Líquido saturado'
                  : parseInputValue(val2Str) === 1
                  ? 'Vapor saturado'
                  : 'Mezcla bifásica'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isNaN(parseInputValue(val2Str)) ? 0 : Math.max(0, Math.min(1, parseInputValue(val2Str)))}
              onChange={(e) => setVal2Str(parseFloat(e.target.value).toFixed(2))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1">
              {[
                { label: '0% Líq', val: 0.0 },
                { label: '25%', val: 0.25 },
                { label: '50%', val: 0.5 },
                { label: '75%', val: 0.75 },
                { label: '100% Vap', val: 1.0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setVal2Str(preset.val.toString())}
                  className={`flex-1 py-1 text-[9px] rounded font-mono border transition-all ${
                    !isNaN(parseInputValue(val2Str)) && Math.abs(parseInputValue(val2Str) - preset.val) < 0.01
                      ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400 truncate">{config.l1}</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
              value={val1Str}
              onChange={(e) => setVal1Str(sanitizeDecimalInput(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400 truncate">{config.l2}</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono outline-none transition-all focus:ring-1 focus:ring-cyan-500"
              value={val2Str}
              onChange={(e) => setVal2Str(sanitizeDecimalInput(e.target.value))}
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {config.help && (
        <div className="text-[10px] text-slate-400 leading-tight italic">
          {config.help}
        </div>
      )}

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
