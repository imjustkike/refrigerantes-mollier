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
      className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={() => setIsSampleCyclesModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#16181e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111319] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Proyectos de Ejemplo: Ciclos Frigoríficos
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Seleccione un ciclo de 4 puntos calculado termodinámicamente
              </div>
            </div>
          </div>
          <button
            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            onClick={() => setIsSampleCyclesModalOpen(false)}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2.5">
            {/* R134a Standard */}
            <div
              className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#1c1f27] hover:bg-slate-100/80 dark:hover:bg-[#222631] border border-slate-200 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 cursor-pointer transition-colors flex flex-col gap-1.5 shadow-2xs"
              onClick={() => handleSelect('r134a_standard')}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center">
                  <Activity size={13} className="text-sky-600 dark:text-sky-400" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Ciclo Estándar R134a
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Compresión simple clásica: Evap -10°C (Rec. 5K), Cond 40°C (Sub. 5K), expansión isoentálpica.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-sky-700 dark:text-sky-400 font-mono mt-0.5">
                <span>4 Puntos</span> • <span>Compresión + Cond + Exp + Evap</span>
              </div>
            </div>

            {/* R744 Transcritical */}
            <div
              className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#1c1f27] hover:bg-slate-100/80 dark:hover:bg-[#222631] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 cursor-pointer transition-colors flex flex-col gap-1.5 shadow-2xs"
              onClick={() => handleSelect('r744_transcritical')}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center">
                  <Zap size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  CO₂ Transcrítico (R744)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Ciclo transcrítico con gas cooler a 90 bar (supercrítico) y evaporación a 30 bar.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                <span>Gas Cooler</span> • <span>Transcrítico</span> • <span>GWP = 1</span>
              </div>
            </div>

            {/* R717 Industrial */}
            <div
              className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#1c1f27] hover:bg-slate-100/80 dark:hover:bg-[#222631] border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 dark:hover:border-amber-500/60 cursor-pointer transition-colors flex flex-col gap-1.5 shadow-2xs"
              onClick={() => handleSelect('r717_industrial')}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center">
                  <Wind size={13} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Amoníaco Industrial (R717)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Planta frigorífica industrial de amoníaco a -10°C / 30°C con alta eficiencia termodinámica.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                <span>Natural</span> • <span>GWP = 0</span> • <span>ODP = 0</span>
              </div>
            </div>

            {/* R407C Glide */}
            <div
              className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#1c1f27] hover:bg-slate-100/80 dark:hover:bg-[#222631] border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 cursor-pointer transition-colors flex flex-col gap-1.5 shadow-2xs"
              onClick={() => handleSelect('r407c_glide')}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/30 flex items-center justify-center">
                  <Flame size={13} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  R407C con Glide
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Mezcla zeotrópica mostrando el deslizamiento de temperatura (glide ~6 K) en cambio de fase.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-purple-700 dark:text-purple-400 font-mono mt-0.5">
                <span>Zeotrópico</span> • <span>Glide ~6 K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111319] flex justify-end">
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            onClick={() => setIsSampleCyclesModalOpen(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
