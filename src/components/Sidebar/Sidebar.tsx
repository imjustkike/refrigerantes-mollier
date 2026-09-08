import React, { useState } from 'react';
import { Database, Info, Layers } from 'lucide-react';
import { CatalogTab } from './CatalogTab';
import { CurvesTab } from './CurvesTab';
import { FluidInfoTab } from './FluidInfoTab';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'curves' | 'fluid_info'>('catalog');

  return (
    <aside className="w-80 h-full bg-slate-900/90 border-r border-slate-800/80 flex flex-col z-20 backdrop-blur-md shadow-2xl">
      {/* Top Tab Bar */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'catalog'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          onClick={() => setActiveTab('catalog')}
        >
          <Database size={13} />
          <span>Catálogo</span>
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'curves'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          onClick={() => setActiveTab('curves')}
        >
          <Layers size={13} />
          <span>Curvas</span>
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'fluid_info'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          onClick={() => setActiveTab('fluid_info')}
        >
          <Info size={13} />
          <span>Fluido</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeTab === 'catalog' && <CatalogTab />}
        {activeTab === 'curves' && <CurvesTab />}
        {activeTab === 'fluid_info' && <FluidInfoTab />}
      </div>
    </aside>
  );
};
