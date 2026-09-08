import React from 'react';
import { ArrowRight, Trash2, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProcessType } from '../../types/thermo';

export const ConnectionEditor: React.FC = () => {
  const {
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    points,
    updateConnection,
    removeConnection,
  } = useProject();

  const conn = connections.find((c) => c.id === selectedConnectionId) || null;
  if (!conn) return null;

  const p1 = points.find((p) => p.id === conn.fromPointId);
  const p2 = points.find((p) => p.id === conn.toPointId);

  const handleProcessChange = (procType: ProcessType) => {
    updateConnection(conn.id, { processType: procType });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-white tracking-tight">
          Proceso Termodinámico
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
            onClick={() => removeConnection(conn.id)}
            title="Eliminar conexión"
          >
            <Trash2 size={13} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            onClick={() => setSelectedConnectionId(null)}
            title="Cerrar"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Nodes Overview Box */}
      <div className="p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
        <div className="text-left">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Inicio</div>
          <div className="text-xs font-bold text-white mt-0.5" style={{ color: p1?.color }}>
            {p1?.name || 'Punto 1'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {p1 ? `${p1.state.temperature_c.toFixed(1)} °C | ${p1.state.pressure_bar.toFixed(2)} bar` : ''}
          </div>
        </div>

        <ArrowRight size={18} className="text-cyan-400 shrink-0 mx-2" />

        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fin</div>
          <div className="text-xs font-bold text-white mt-0.5" style={{ color: p2?.color }}>
            {p2?.name || 'Punto 2'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {p2 ? `${p2.state.temperature_c.toFixed(1)} °C | ${p2.state.pressure_bar.toFixed(2)} bar` : ''}
          </div>
        </div>
      </div>

      {/* Process Type Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-slate-400">
          Tipo de Trayectoria Termodinámica
        </label>
        <select
          className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none transition-all focus:ring-1 focus:ring-cyan-500 font-mono"
          value={conn.processType}
          onChange={(e) => handleProcessChange(e.target.value as ProcessType)}
        >
          <option value="direct_line">Conexión geométrica recta</option>
          <option value="isobaric">Isobárico (P = cte, Evaporador / Condensador)</option>
          <option value="isenthalpic">Isoentálpico (h = cte, Válvula de Expansión)</option>
          <option value="isentropic">Isentrópico (s = cte, Compresión Isentrópica)</option>
          <option value="isothermal">Isotérmico (T = cte)</option>
        </select>
      </div>

      {/* Deltas & Specific Energies */}
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
        Diferencias y Magnitudes Específicas
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Diferencia de Entalpía (Δh = h₂ - h₁)</span>
          <span className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
            {conn.delta_h_kj_kg !== undefined ? `${conn.delta_h_kj_kg.toFixed(2)} kJ/kg` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            {conn.delta_h_kj_kg && conn.delta_h_kj_kg > 0
              ? 'Calor absorbido / Trabajo compresión (+q, +w)'
              : 'Calor cedido / refrigeración (-q)'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Diferencia de Temp. (ΔT)</span>
          <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
            {conn.delta_t_c !== undefined ? `${conn.delta_t_c.toFixed(2)} °C` : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Diferencia de Presión (ΔP)</span>
          <span className="text-xs font-bold font-mono text-cyan-400 mt-0.5">
            {conn.delta_p_bar !== undefined ? `${conn.delta_p_bar.toFixed(3)} bar` : 'N/A'}
          </span>
        </div>

        <div className="col-span-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Diferencia de Entropía (Δs)</span>
          <span className="text-xs font-bold font-mono text-amber-400 mt-0.5">
            {conn.delta_s_kj_kg_k !== undefined ? `${conn.delta_s_kj_kg_k.toFixed(4)} kJ/(kg·K)` : 'N/A'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
        <strong className="text-slate-200">Nota de ingeniería:</strong> Las potencias térmicas (kW) y eléctricas dependen del caudal másico de refrigerante (ṁ [kg/s]). La entalpía Δh mostrada representa el calor o trabajo específico por unidad de masa.
      </div>
    </div>
  );
};
