import React, { useState } from 'react';
import {
  Activity,
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

export const Header: React.FC<HeaderProps> = () => {
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
    diagramTheme,
    setDiagramTheme,
    engineMode,
    setEngineMode,
  } = useProject();

  const [isEditingName, setIsEditingName] = useState(false);

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

      {/* Right Controls: Refrigerant, Curves & Diagram Controls */}
      <div className="flex items-center gap-2">
        {/* Refrigerant Selector */}
        <RefrigerantSelectorDropdown />

        {/* Curves Toggles */}
        <CurvesDropdown />

        <div className="w-[1px] h-6 bg-slate-800 mx-1" />

        {/* Diagram Interactive Tools */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              toolMode === 'select'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            onClick={() => setToolMode('select')}
            title="Modo Selección: Seleccionar y arrastrar puntos o etiquetas"
          >
            <MousePointer size={14} />
          </button>

          <button
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              toolMode === 'connect'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            onClick={() => setToolMode('connect')}
            title="Modo Conectar: Haga clic sucesivamente en dos puntos para unirlos"
          >
            <Share2 size={14} />
          </button>

          {points.length >= 3 && (
            <button
              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 transition-colors"
              onClick={closeCycle}
              title="Cerrar Ciclo Termodinámico (conectar último punto con el primero)"
            >
              <Repeat size={14} />
            </button>
          )}
        </div>

        <div className="w-[1px] h-6 bg-slate-800 mx-1" />

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            onClick={zoomIn}
            title="Acercar (Zoom +)"
          >
            <ZoomIn size={14} />
          </button>

          <button
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            onClick={zoomOut}
            title="Alejar (Zoom -)"
          >
            <ZoomOut size={14} />
          </button>

          <button
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 rounded-lg transition-colors"
            onClick={resetView}
            title="Restablecer Vista (Ajustar a límites del refrigerante)"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-slate-800 mx-1" />

        {/* Theme & Engine Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              diagramTheme === 'danfoss'
                ? 'bg-blue-900/30 border-blue-500/40 text-blue-300 hover:bg-blue-900/50'
                : 'bg-slate-800/80 border-slate-700/60 text-amber-300 hover:bg-slate-750'
            }`}
            onClick={() => setDiagramTheme((t) => (t === 'danfoss' ? 'dark' : 'danfoss'))}
            title={diagramTheme === 'danfoss' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Carta Técnica Danfoss'}
          >
            {diagramTheme === 'danfoss' ? <Moon size={13} /> : <Sun size={13} />}
            <span className="text-[11px] font-medium hidden sm:inline">
              {diagramTheme === 'danfoss' ? 'Oscuro' : 'Carta Técnica'}
            </span>
          </button>

          <button
            className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
              engineMode === 'plotly'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-750'
            }`}
            onClick={() => setEngineMode((m) => (m === 'svg' ? 'plotly' : 'svg'))}
            title={engineMode === 'plotly' ? 'Motor actual: Plotly.js (Clic para cambiar a SVG)' : 'Motor actual: SVG Nativo (Clic para cambiar a Plotly.js)'}
          >
            <span>{engineMode === 'plotly' ? '📊 Plotly' : '📐 SVG'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
