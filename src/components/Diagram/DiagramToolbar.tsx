import React from 'react';
import {
  Download,
  Maximize2,
  MousePointer,
  PlusCircle,
  Repeat,
  Share2,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface DiagramToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  diagramTheme: 'danfoss' | 'dark';
  onToggleTheme: () => void;
  engineMode?: 'svg' | 'plotly';
  onToggleEngine?: () => void;
}

export const DiagramToolbar: React.FC<DiagramToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  diagramTheme,
  onToggleTheme,
  engineMode = 'svg',
  onToggleEngine,
}) => {
  const { toolMode, setToolMode, closeCycle, points, setIsExportModalOpen } = useProject();

  return (
    <div className="absolute top-3 left-4 flex items-center gap-0.5 p-1 rounded-lg border shadow-md z-15 bg-white/95 dark:bg-[#16181f]/95 border-slate-200 dark:border-slate-800/90 transition-colors duration-150">
      <button
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          toolMode === 'select'
            ? 'bg-sky-600 text-white shadow-2xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        onClick={() => setToolMode('select')}
        title="Modo Selección y Arrastre de Puntos / Etiquetas"
      >
        <MousePointer size={14} />
      </button>

      <button
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          toolMode === 'add_point'
            ? 'bg-sky-600 text-white shadow-2xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        onClick={() => setToolMode('add_point')}
        title="Modo Añadir Punto: Haga clic en la gráfica para crear un estado"
      >
        <PlusCircle size={14} />
      </button>

      <button
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          toolMode === 'connect'
            ? 'bg-sky-600 text-white shadow-2xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        onClick={() => setToolMode('connect')}
        title="Modo Conectar: Haga clic sucesivamente en dos puntos para unirlos"
      >
        <Share2 size={14} />
      </button>

      {points.length >= 3 && (
        <button
          className="p-1.5 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors cursor-pointer"
          onClick={closeCycle}
          title="Cerrar Ciclo Termodinámico (conectar último punto con el primero)"
        >
          <Repeat size={14} />
        </button>
      )}

      <div className="w-[1px] h-4 mx-1 bg-slate-200 dark:bg-slate-800" />

      <button
        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={onZoomIn}
        title="Acercar (Zoom +)"
      >
        <ZoomIn size={14} />
      </button>

      <button
        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={onZoomOut}
        title="Alejar (Zoom -)"
      >
        <ZoomOut size={14} />
      </button>

      <button
        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={onResetView}
        title="Restablecer Vista (Ajustar a límites del refrigerante)"
      >
        <Maximize2 size={14} />
      </button>

      <div className="w-[1px] h-4 mx-1 bg-slate-200 dark:bg-slate-800" />

      {/* Diagram Background Theme Toggle */}
      <button
        className="p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        onClick={onToggleTheme}
        title={diagramTheme === 'danfoss' ? 'Cambiar a Fondo Oscuro' : 'Cambiar a Fondo Carta Técnica (Danfoss)'}
      >
        {diagramTheme === 'danfoss' ? (
          <>
            <Moon size={13} className="text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline text-[11px]">Diagrama Oscuro</span>
          </>
        ) : (
          <>
            <Sun size={13} className="text-amber-500" />
            <span className="hidden md:inline text-[11px]">Diagrama Claro</span>
          </>
        )}
      </button>

      <div className="w-[1px] h-4 mx-1 bg-slate-200 dark:bg-slate-800" />

      {/* Export / Download Modal Trigger */}
      <button
        className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={() => setIsExportModalOpen(true)}
        title="Descargar Diagrama (PDF / PNG - Guardar como...)"
      >
        <Download size={13} />
      </button>

      {onToggleEngine && (
        <>
          <div className="w-[1px] h-4 mx-1 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center rounded-md p-0.5 text-xs font-mono font-medium bg-slate-100 dark:bg-[#101217]">
            <button
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                engineMode === 'svg'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              onClick={() => engineMode !== 'svg' && onToggleEngine()}
              title="Motor SVG Nativo"
            >
              SVG
            </button>
            <button
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                engineMode === 'plotly'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              onClick={() => engineMode !== 'plotly' && onToggleEngine()}
              title="Motor Plotly.js"
            >
              Plotly
            </button>
          </div>
        </>
      )}
    </div>
  );
};
