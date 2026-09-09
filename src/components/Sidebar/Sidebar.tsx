import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { LayersManager } from './LayersManager';
import { PointsManager } from './PointsManager';
import { ConnectionsManager } from './ConnectionsManager';
import { useProject } from '../../context/ProjectContext';

export const Sidebar: React.FC = () => {
  const { selectedFluidItem, selectedFluidId } = useProject();

  return (
    <aside className="w-88 sm:w-92 md:w-96 h-full bg-slate-900/95 border-r border-slate-800/80 flex flex-col z-20 backdrop-blur-xl shadow-2xl shrink-0">
      {/* Sidebar Header */}
      <div className="px-4 py-2.5 border-b border-slate-800/90 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Panel del Ciclo
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-slate-800">
          {selectedFluidItem?.display_name || selectedFluidId}
        </span>
      </div>

      {/* Unified Content Panel */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 custom-scrollbar">
        {/* Sección 1: Capas del Ciclo */}
        <section>
          <LayersManager />
        </section>

        <div className="w-full h-[1px] bg-slate-800/90" />

        {/* Sección 2: Puntos Termodinámicos (Formulario arriba + lista con edición inline) */}
        <section>
          <PointsManager />
        </section>

        <div className="w-full h-[1px] bg-slate-800/90" />

        {/* Sección 3: Uniones de Proceso (Formulario arriba + lista) */}
        <section>
          <ConnectionsManager />
        </section>
      </div>
    </aside>
  );
};
