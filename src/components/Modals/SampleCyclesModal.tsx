import React from 'react';
import { Activity, Flame, Sparkles, Wind, X, Zap } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const SampleCyclesModal: React.FC = () => {
  const { isSampleCyclesModalOpen, setIsSampleCyclesModalOpen, loadSampleCycle } = useProject();

  if (!isSampleCyclesModalOpen) return null;

  const handleSelect = async (
    cycle: 'r134a_standard' | 'r744_transcritical' | 'r717_industrial' | 'r407c_glide'
  ) => {
    setIsSampleCyclesModalOpen(false);
    await loadSampleCycle(cycle);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={() => setIsSampleCyclesModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">
                Proyectos de Ejemplo: Ciclos Frigoríficos
              </div>
              <div className="text-[11px] text-slate-400">
                Seleccione un ciclo de 4 puntos calculado termodinámicamente
              </div>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsSampleCyclesModalOpen(false)}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* R134a Standard */}
            <div
              className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition-all duration-150 flex flex-col gap-2 group shadow-sm hover:shadow-cyan-500/10"
              onClick={() => handleSelect('r134a_standard')}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                  <Activity size={15} className="text-sky-400" />
                </div>
                <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">
                  Ciclo Estándar R134a
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Compresión simple clásica: Evap -10°C (Rec. 5K), Cond 40°C (Sub. 5K), expansión isoentálpica.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono mt-1">
                <span>4 Puntos</span> • <span>Compresión + Cond + Exp + Evap</span>
              </div>
            </div>

            {/* R744 Transcritical */}
            <div
              className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/60 cursor-pointer transition-all duration-150 flex flex-col gap-2 group shadow-sm hover:shadow-emerald-500/10"
              onClick={() => handleSelect('r744_transcritical')}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Zap size={15} className="text-emerald-400" />
                </div>
                <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                  CO₂ Transcrítico (R744)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Ciclo transcrítico con gas cooler a 90 bar (supercrítico) y evaporación a 30 bar.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono mt-1">
                <span>Gas Cooler</span> • <span>Transcrítico</span> • <span>GWP = 1</span>
              </div>
            </div>

            {/* R717 Industrial */}
            <div
              className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/60 cursor-pointer transition-all duration-150 flex flex-col gap-2 group shadow-sm hover:shadow-amber-500/10"
              onClick={() => handleSelect('r717_industrial')}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Wind size={15} className="text-amber-400" />
                </div>
                <span className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                  Amoníaco Industrial (R717)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Planta frigorífica industrial de amoníaco a -10°C / 30°C con alta eficiencia termodinámica.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono mt-1">
                <span>Natural</span> • <span>GWP = 0</span> • <span>ODP = 0</span>
              </div>
            </div>

            {/* R407C Glide */}
            <div
              className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/60 cursor-pointer transition-all duration-150 flex flex-col gap-2 group shadow-sm hover:shadow-purple-500/10"
              onClick={() => handleSelect('r407c_glide')}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Flame size={15} className="text-purple-400" />
                </div>
                <span className="font-bold text-xs text-white group-hover:text-purple-400 transition-colors">
                  R407C con Glide
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Mezcla zeotrópica mostrando el deslizamiento de temperatura (glide ~6 K) en cambio de fase.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-purple-400 font-mono mt-1">
                <span>Zeotrópico</span> • <span>Glide ~6 K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            onClick={() => setIsSampleCyclesModalOpen(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
