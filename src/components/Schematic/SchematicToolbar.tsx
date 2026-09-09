import React, { useState } from 'react';
import {
  Activity,
  Download,
  FilePlus,
  Flame,
  Maximize,
  Pause,
  Play,
  Repeat,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { SCHEMATIC_PRESETS } from './templates/schematicTemplates';

interface SchematicToolbarProps {
  onLoadPreset: (presetId: string) => void;
  onClearCanvas: () => void;
  onNewSchematic: () => void;
  onFitView: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  isAnimationRunning: boolean;
  onToggleAnimation: () => void;
}

const getPresetIcon = (iconName: string) => {
  switch (iconName) {
    case 'Zap':
      return <Zap size={13} className="text-amber-500" />;
    case 'Flame':
      return <Flame size={13} className="text-emerald-500" />;
    case 'Repeat':
      return <Repeat size={13} className="text-purple-500" />;
    case 'Activity':
    default:
      return <Activity size={13} className="text-sky-500" />;
  }
};

export const SchematicToolbar: React.FC<SchematicToolbarProps> = ({
  onLoadPreset,
  onClearCanvas,
  onNewSchematic,
  onFitView,
  onExportPng,
  onExportSvg,
  isAnimationRunning,
  onToggleAnimation,
}) => {
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-[#15181f]/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md select-none">
      {/* New Schematic Button */}
      <button
        onClick={onNewSchematic}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        title="Crear un nuevo esquema en blanco"
      >
        <FilePlus size={13} className="text-sky-500" />
        <span>Nuevo Esquema</span>
      </button>

      {/* Presets / Templates Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsPresetsOpen(!isPresetsOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white font-semibold text-xs shadow-xs hover:bg-sky-500 transition-colors cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Plantillas de Circuitos</span>
        </button>

        {isPresetsOpen && (
          <div
            className="absolute top-full mt-1.5 left-0 w-80 rounded-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            onClick={() => setIsPresetsOpen(false)}
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Circuitos e Instalaciones Preconfiguradas
            </div>
            {SCHEMATIC_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onLoadPreset(preset.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#222631] transition-colors flex items-start gap-2.5 cursor-pointer group"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  {getPresetIcon(preset.iconName)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {preset.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Flow Animation Toggle */}
      <button
        onClick={onToggleAnimation}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
          isAnimationRunning
            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/50 shadow-emerald-500/10'
            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
        }`}
        title={isAnimationRunning ? 'Haga clic para detener el flujo de refrigerante' : 'Haga clic para iniciar la circulación del flujo'}
      >
        {isAnimationRunning ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Pause size={12} />
            <span>Flujo Activo</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            <Play size={12} />
            <span>Flujo Detenido</span>
          </>
        )}
      </button>

      {/* Fit View */}
      <button
        onClick={onFitView}
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Centrar y ajustar vista completa"
      >
        <Maximize size={14} />
      </button>

      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Export PNG */}
      <button
        onClick={onExportPng}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Exportar imagen PNG de alta resolución"
      >
        <Download size={13} />
        <span>PNG</span>
      </button>

      {/* Export SVG */}
      <button
        onClick={onExportSvg}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Exportar archivo vectorial SVG"
      >
        <Download size={13} />
        <span>SVG</span>
      </button>

      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Clear Canvas */}
      <button
        onClick={onClearCanvas}
        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
        title="Limpiar todo el esquema"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
