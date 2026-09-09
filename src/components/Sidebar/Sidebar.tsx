import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { LayersManager } from './LayersManager';
import { PointsManager } from './PointsManager';
import { ConnectionsManager } from './ConnectionsManager';
import { useProject } from '../../context/ProjectContext';

export const Sidebar: React.FC = () => {
  const { selectedFluidItem, selectedFluidId } = useProject();

  return (
    <aside className="w-88 sm:w-92 md:w-96 h-full bg-slate-50/80 dark:bg-[#15171e] border-r border-slate-200 dark:border-slate-800/90 flex flex-col z-20 shrink-0 transition-colors duration-150 shadow-xs">
      {/* Sidebar Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111319] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Panel del Ciclo
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-200/70 dark:bg-[#1c2029] text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700/80">
          {selectedFluidItem?.display_name || selectedFluidId}
        </span>
      </div>

      {/* Content Panel */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3.5">
        {/* Sección 1: Capas del Ciclo */}
        <section>
          <LayersManager />
        </section>

        <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800/80" />

        {/* Sección 2: Puntos Termodinámicos */}
        <section>
          <PointsManager />
        </section>

        <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800/80" />

        {/* Sección 3: Uniones de Proceso */}
        <section>
          <ConnectionsManager />
        </section>
      </div>
    </aside>
  );
};
