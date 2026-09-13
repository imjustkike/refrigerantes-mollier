import React, { useState } from 'react';
import {
  Box,
  Download,
  LineChart,
  Maximize2,
  Moon,
  MousePointer,
  Repeat,
  Share2,
  Sun,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { CurvesDropdown } from './CurvesDropdown';

interface HeaderProps {
  onExportPng?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportPng: _onExportPng }) => {
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
    mainViewMode,
    setMainViewMode,
    setIsExportModalOpen,
  } = useProject();

  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="h-[52px] bg-white dark:bg-[#111319] border-b border-slate-200 dark:border-slate-800/90 px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 transition-colors duration-200 shadow-2xs select-none">
      {/* Left: Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-xs">
            <span className="text-sm tracking-tighter">M</span>
          </div>
          <div>
            <div className="text-xs font-bold leading-tight flex items-center gap-1 text-slate-900 dark:text-white">
              <span>CoolMollier</span>
              <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
              <span>Danfoss Style log(p)-h • v{catalog?.engine_version || '8.0'}</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Project Name Editable */}
        <div className="hidden md:flex items-center gap-1 text-xs">
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-slate-100 dark:bg-[#181b22] px-2 py-0.5 rounded border border-sky-500 text-slate-900 dark:text-slate-100 font-medium outline-none text-xs"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Clic para renombrar proyecto"
            >
              {projectName}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: View Switcher, Refrigerant, Curves, Tools & Engine */}
      <div className="flex items-center gap-2">
        {/* Main View Mode Selector (Diagram, Schematic, 3D) */}
        <div className="flex items-center bg-slate-100 dark:bg-[#0f1115] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mainViewMode === 'diagram'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setMainViewMode('diagram')}
            title="Diagrama de Mollier log(p)-h"
          >
            <LineChart size={13} />
            <span className="hidden sm:inline">Mollier</span>
          </button>

          <button
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mainViewMode === 'schematic'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setMainViewMode('schematic')}
            title="Esquema Interactivo de Principio P&ID"
          >
            <Workflow size={13} />
            <span className="hidden sm:inline">Esquema P&ID</span>
          </button>

          <button
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mainViewMode === '3d'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setMainViewMode('3d')}
            title="Circuito Físico 3D Interactivo"
          >
            <Box size={13} />
            <span className="hidden sm:inline">Ciclo 3D</span>
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

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

        {/* Export / Download Diagram */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="Descargar diagrama (Guardar como PDF o PNG)"
        >
          <Download size={13} />
        </button>

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
