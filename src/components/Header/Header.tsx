import React, { useRef, useState } from 'react';
import {
  Activity,
  ChevronDown,
  FileCode,
  FilePlus,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  Save,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface HeaderProps {
  onExportPng: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportPng }) => {
  const {
    projectName,
    setProjectName,
    selectedFluidId,
    selectedFluidItem,
    catalog,
    newProject,
    saveProjectJson,
    loadProjectJson,
    exportPointsCsv,
    showToast,
    setIsAvailabilityModalOpen,
    setIsSampleCyclesModalOpen,
  } = useProject();

  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveJson = () => {
    const json = saveProjectJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${selectedFluidId}.mollier.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Proyecto guardado como JSON');
  };

  const handleOpenJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await loadProjectJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCsv = () => {
    const csv = exportPointsCsv();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_puntos.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Puntos exportados a CSV con unidades');
  };

  return (
    <header className="h-14 px-4 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between gap-4 z-30 backdrop-blur-xl shadow-lg shadow-black/20">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-teal-400 p-[1px] shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
            <Activity size={18} className="text-cyan-400" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="bg-slate-950 border border-cyan-500 text-white rounded px-1.5 py-0.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-cyan-400"
              />
            ) : (
              <span
                className="text-sm font-bold text-slate-100 tracking-tight cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={() => setIsEditingName(true)}
                title="Haga clic para editar el nombre del proyecto"
              >
                {projectName}
              </span>
            )}
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/40">
              log(p)–h
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            CoolProp v{catalog?.engine_version || '8.0'} • bar(a), °C, kJ/kg, m³/kg
          </span>
        </div>
      </div>

      {/* Refrigerant Selector Pill */}
      <div className="flex items-center">
        <button
          className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/60 rounded-full transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 group"
          onClick={() => setIsAvailabilityModalOpen(true)}
          title="Ver matriz de disponibilidad y cambiar refrigerante"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
            {selectedFluidItem?.display_name || selectedFluidId}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-medium">
            {selectedFluidItem?.fluid_type || 'Refrigerante'}
          </span>
          <ChevronDown size={13} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all hover:shadow-lg hover:shadow-amber-500/10"
          onClick={() => setIsSampleCyclesModalOpen(true)}
          title="Cargar ciclos frigoríficos típicos (R134a, R744, R717, R407C)"
        >
          <Sparkles size={13} className="text-amber-400" />
          <span>Ejemplos</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
          onClick={newProject}
          title="Nuevo proyecto"
        >
          <FilePlus size={13} />
          <span>Nuevo</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json,.mollier.json"
          onChange={handleOpenJson}
        />
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          title="Abrir archivo JSON"
        >
          <FolderOpen size={13} />
          <span>Abrir</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
          onClick={handleSaveJson}
          title="Guardar proyecto en JSON"
        >
          <Save size={13} />
          <span>Guardar</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
          onClick={handleExportCsv}
          title="Exportar tabla de puntos a CSV"
        >
          <FileCode size={13} />
          <span>CSV</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={onExportPng}
          title="Exportar gráfica a imagen PNG de alta resolución"
        >
          <ImageIcon size={13} />
          <span>Exportar PNG</span>
        </button>

        <button
          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors ml-1"
          onClick={() => setIsAvailabilityModalOpen(true)}
          title="Matriz de refrigerantes e información de CoolProp"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
