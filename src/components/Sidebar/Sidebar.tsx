import React, { useEffect } from 'react';
import { Layers, Share2, Sliders } from 'lucide-react';
import { LayersManager } from './LayersManager';
import { PointsManager } from './PointsManager';
import { ConnectionsManager } from './ConnectionsManager';
import { PointEditor } from '../PointEditor/PointEditor';
import { ConnectionEditor } from '../ConnectionEditor/ConnectionEditor';
import { useProject } from '../../context/ProjectContext';

export const Sidebar: React.FC = () => {
  const { selectedPointId, selectedConnectionId, sidebarTab, setSidebarTab } = useProject();

  // When a user selects a connection, switch to editor
  useEffect(() => {
    if (selectedConnectionId) {
      setSidebarTab('editor');
    }
  }, [selectedConnectionId, setSidebarTab]);

  return (
    <aside className="w-88 sm:w-92 md:w-96 h-full bg-slate-900/95 border-r border-slate-800/80 flex flex-col z-20 backdrop-blur-xl shadow-2xl shrink-0">
      {/* Top Tab Bar */}
      <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            sidebarTab === 'layers_points'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80 ring-1 ring-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          onClick={() => setSidebarTab('layers_points')}
        >
          <Layers size={14} />
          <span>Capas y Puntos</span>
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            sidebarTab === 'connections'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80 ring-1 ring-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          onClick={() => setSidebarTab('connections')}
        >
          <Share2 size={14} />
          <span>Uniones</span>
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            sidebarTab === 'editor'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/80 ring-1 ring-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          onClick={() => setSidebarTab('editor')}
        >
          <Sliders size={14} />
          <span>Editor / Inputs</span>
          {(selectedPointId || selectedConnectionId) && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4 custom-scrollbar">
        {sidebarTab === 'layers_points' && (
          <>
            <LayersManager />
            <div className="w-full h-[1px] bg-slate-800/90 my-1" />
            <PointsManager />
          </>
        )}

        {sidebarTab === 'connections' && <ConnectionsManager />}

        {sidebarTab === 'editor' && (
          <div className="flex-1 -m-3.5">
            {selectedConnectionId ? <ConnectionEditor /> : <PointEditor />}
          </div>
        )}
      </div>
    </aside>
  );
};
