import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Table as TableIcon, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const PointsTable: React.FC = () => {
  const { points, selectedPointId, setSelectedPointId, removePoint } = useProject();
  const [isExpanded, setIsExpanded] = useState(true);

  if (points.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-0 left-80 right-80 bg-slate-900/95 border-t border-slate-800/90 flex flex-col z-25 backdrop-blur-xl shadow-2xl transition-all duration-200"
      style={{
        height: isExpanded ? 210 : 36,
      }}
    >
      {/* Header / Collapse Bar */}
      <div
        className="h-9 px-4 flex items-center justify-between bg-slate-950/80 border-b border-slate-800/80 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <TableIcon size={14} className="text-cyan-400" />
          <span>
            Tabla de Puntos Termodinámicos ({points.length} {points.length === 1 ? 'punto' : 'puntos'})
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
          <span>{isExpanded ? 'Plegar tabla' : 'Expandir tabla'}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Table Grid */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto bg-slate-950/50">
          <table className="w-full border-collapse text-[11px] font-mono text-left">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10 shadow-sm">
              <tr className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                <th className="py-2 px-3 w-8"></th>
                <th className="py-2 px-3">Nombre</th>
                <th className="py-2 px-3">Fase Termodinámica</th>
                <th className="py-2 px-3">P [bar(a)]</th>
                <th className="py-2 px-3">T [°C]</th>
                <th className="py-2 px-3">h [kJ/kg]</th>
                <th className="py-2 px-3">s [kJ/(kg·K)]</th>
                <th className="py-2 px-3">v [m³/kg]</th>
                <th className="py-2 px-3">ρ [kg/m³]</th>
                <th className="py-2 px-3">x (Título)</th>
                <th className="py-2 px-3 w-10 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {points.map((pt) => {
                const isSelected = pt.id === selectedPointId;
                return (
                  <tr
                    key={pt.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 text-white font-bold border-l-2 border-cyan-400'
                        : 'hover:bg-slate-850/60 text-slate-300'
                    }`}
                    onClick={() => setSelectedPointId(pt.id)}
                  >
                    <td className="py-2 px-3 text-center">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ background: pt.color }}
                      />
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-white whitespace-nowrap">
                      {pt.name}
                    </td>
                    <td className="py-2 px-3 text-cyan-400 whitespace-nowrap font-sans">
                      {pt.state.phase}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-100">
                      {pt.state.pressure_bar.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-emerald-400">
                      {pt.state.temperature_c.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      {pt.state.enthalpy_kj_kg.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-amber-400">
                      {pt.state.entropy_kj_kg_k.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-purple-400">
                      {pt.state.specific_volume_m3_kg < 0.01
                        ? pt.state.specific_volume_m3_kg.toExponential(4)
                        : pt.state.specific_volume_m3_kg.toFixed(5)}
                    </td>
                    <td className="py-2 px-3">
                      {pt.state.density_kg_m3.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-blue-400">
                      {pt.state.vapor_quality !== null && pt.state.vapor_quality !== undefined
                        ? (pt.state.vapor_quality * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePoint(pt.id);
                        }}
                        title="Eliminar punto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
