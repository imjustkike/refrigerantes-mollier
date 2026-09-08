import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const CurvesTab: React.FC = () => {
  const { curveVisibility, setCurveVisibility, diagramCurves } = useProject();

  const toggle = (key: keyof typeof curveVisibility) => {
    setCurveVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setLabelMode = (mode: 'full' | 'compact' | 'hidden') => {
    setCurveVisibility((prev) => ({
      ...prev,
      pointLabelMode: mode,
      showPointLabels: mode !== 'hidden',
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Curves Families */}
      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
          Familias de Curvas Mollier
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Campana de Saturación */}
          <div
            className="flex items-center justify-between p-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-colors"
            onClick={() => toggle('saturation')}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <div>
                <div className="text-xs font-bold text-slate-100">Campana de Saturación</div>
                <div className="text-[10px] text-slate-400">Líquido (Q=0) y Vapor seco (Q=1)</div>
              </div>
            </div>
            {curveVisibility.saturation ? (
              <Eye size={15} className="text-cyan-400" />
            ) : (
              <EyeOff size={15} className="text-slate-500" />
            )}
          </div>

          {/* Isotermas */}
          <div
            className="flex items-center justify-between p-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-colors"
            onClick={() => toggle('isotherms')}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <div>
                <div className="text-xs font-bold text-slate-100">Isotermas (T = const)</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {diagramCurves?.isotherms.length || 0} curvas calculadas (°C)
                </div>
              </div>
            </div>
            {curveVisibility.isotherms ? (
              <Eye size={15} className="text-emerald-400" />
            ) : (
              <EyeOff size={15} className="text-slate-500" />
            )}
          </div>

          {/* Isentrópicas */}
          <div
            className="flex items-center justify-between p-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-colors"
            onClick={() => toggle('isentropics')}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              <div>
                <div className="text-xs font-bold text-slate-100">Isentrópicas (s = const)</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {diagramCurves?.isentropics.length || 0} curvas (kJ/(kg·K))
                </div>
              </div>
            </div>
            {curveVisibility.isentropics ? (
              <Eye size={15} className="text-amber-400" />
            ) : (
              <EyeOff size={15} className="text-slate-500" />
            )}
          </div>

          {/* Isócoras */}
          <div
            className="flex items-center justify-between p-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-colors"
            onClick={() => toggle('isochores')}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
              <div>
                <div className="text-xs font-bold text-slate-100">Isócoras (v = const)</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {diagramCurves?.isochores.length || 0} curvas (m³/kg)
                </div>
              </div>
            </div>
            {curveVisibility.isochores ? (
              <Eye size={15} className="text-purple-400" />
            ) : (
              <EyeOff size={15} className="text-slate-500" />
            )}
          </div>

          {/* Líneas de Título */}
          <div
            className="flex items-center justify-between p-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-colors"
            onClick={() => toggle('qualityLines')}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
              <div>
                <div className="text-xs font-bold text-slate-100">Título de Vapor (x)</div>
                <div className="text-[10px] text-slate-400">Líneas de x = 10% a 90%</div>
              </div>
            </div>
            {curveVisibility.qualityLines ? (
              <Eye size={15} className="text-blue-400" />
            ) : (
              <EyeOff size={15} className="text-slate-500" />
            )}
          </div>
        </div>
      </div>

      {/* Point Labels Options */}
      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
          Etiquetas en Gráfica
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                curveVisibility.pointLabelMode === 'full'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setLabelMode('full')}
            >
              Completas
            </button>
            <button
              className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                curveVisibility.pointLabelMode === 'compact'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setLabelMode('compact')}
            >
              Compactas
            </button>
            <button
              className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                curveVisibility.pointLabelMode === 'hidden'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setLabelMode('hidden')}
            >
              Ocultas
            </button>
          </div>

          <div
            className="flex items-center justify-between p-2 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-colors"
            onClick={() => toggle('showCurveLabels')}
          >
            <span className="text-xs text-slate-300">Rótulos numéricos en curvas</span>
            {curveVisibility.showCurveLabels ? (
              <Eye size={14} className="text-cyan-400" />
            ) : (
              <EyeOff size={14} className="text-slate-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
