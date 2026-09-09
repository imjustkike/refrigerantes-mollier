import React, { useState } from 'react';
import {
  Download,
  Maximize2,
  Moon,
  MousePointer,
  Repeat,
  Share2,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { RefrigerantSelectorDropdown } from './RefrigerantSelectorDropdown';
import { CurvesDropdown } from './CurvesDropdown';

interface HeaderProps {
  onExportPng?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportPng }) => {
  const {
    projectName,
    setProjectName,
    catalog,
    toolMode,
    setToolMode,
    points,
    closeCycle,
    zoomIn,
    zoomOut,
    resetView,
    themeMode,
    toggleThemeMode,
    engineMode,
    setEngineMode,
  } = useProject();

  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="h-13 px-4 bg-white/95 dark:bg-[#14161c]/95 border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between gap-3 z-30 transition-colors duration-150 shadow-xs">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          <img src="/icon.png" alt="CoolMollier" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-100 select-none">
              CoolMollier
            </span>
            <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
            {isEditingName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="bg-white dark:bg-slate-950 border border-sky-500 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-xs font-mono font-medium outline-none"
              />
            ) : (
              <span
                className="text-xs font-medium text-slate-700 dark:text-slate-300 tracking-tight cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                onClick={() => setIsEditingName(true)}
                title="Haga clic para editar el nombre del proyecto"
              >
                {projectName}
              </span>
            )}
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-slate-100 dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              log(p)–h
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            CoolProp v{catalog?.engine_version || '8.0'} • bar(a), °C, kJ/kg, m³/kg
          </span>
        </div>
      </div>

      {/* Right Controls: Refrigerant, Curves, Tools & Engine */}
      <div className="flex items-center gap-2">
        {/* Refrigerant Selector */}
        <RefrigerantSelectorDropdown />

        {/* Curves Toggles */}
        <CurvesDropdown />

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Diagram Interactive Tools */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#0f1115] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              toolMode === 'select'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
            onClick={() => setToolMode('select')}
            title="Modo Selección: Seleccionar y arrastrar puntos o etiquetas"
          >
            <MousePointer size={13} />
          </button>

          <button
            className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              toolMode === 'connect'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
            onClick={() => setToolMode('connect')}
            title="Modo Conectar: Haga clic sucesivamente en dos puntos para unirlos"
          >
            <Share2 size={13} />
          </button>

          {points.length >= 3 && (
            <button
              className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 transition-colors cursor-pointer"
              onClick={closeCycle}
              title="Cerrar Ciclo Termodinámico (conectar último punto con el primero)"
            >
              <Repeat size={13} />
            </button>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#0f1115] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
            onClick={zoomIn}
            title="Acercar (Zoom +)"
          >
            <ZoomIn size={13} />
          </button>

          <button
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
            onClick={zoomOut}
            title="Alejar (Zoom -)"
          >
            <ZoomOut size={13} />
          </button>

          <button
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
            onClick={resetView}
            title="Restablecer Vista (Ajustar a límites del refrigerante)"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Export PNG if provided */}
        {onExportPng && (
          <button
            onClick={onExportPng}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            title="Exportar imagen PNG del diagrama"
          >
            <Download size={13} />
          </button>
        )}

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Dark / Light Mode Toggle */}
        <button
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-[#181b22] text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
          onClick={toggleThemeMode}
          title={themeMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {themeMode === 'dark' ? (
            <Sun size={13} className="text-amber-400" />
          ) : (
            <Moon size={13} className="text-slate-600" />
          )}
          <span className="text-[11px] font-sans hidden sm:inline">
            {themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>

        {/* Motor Gráfico: Selector Segmentado SVG / Plotly */}
        <div
          className="flex items-center bg-slate-100 dark:bg-[#0f1115] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium"
          title="Seleccionar motor de renderizado del diagrama"
        >
          <button
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              engineMode === 'svg'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setEngineMode('svg')}
            title="Motor SVG Nativo"
          >
            SVG
          </button>
          <button
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              engineMode === 'plotly'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setEngineMode('plotly')}
            title="Motor Plotly.js"
          >
            Plotly
          </button>
        </div>
      </div>
    </header>
  );
};
