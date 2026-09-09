import React from 'react';
import {
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
  const { toolMode, setToolMode, closeCycle, points } = useProject();

  return (
    <div className={`absolute top-3 left-4 flex items-center gap-1 p-1.5 rounded-xl border shadow-xl z-15 backdrop-blur-xl ${
      diagramTheme === 'danfoss'
        ? 'bg-white/95 border-slate-300/80 shadow-slate-400/20'
        : 'bg-slate-900/90 border-slate-700/60 shadow-black/40'
    }`}>
      <button
        className={`p-2 rounded-lg transition-all ${
          toolMode === 'select'
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
            : diagramTheme === 'danfoss'
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        onClick={() => setToolMode('select')}
        title="Modo Selección y Arrastre de Puntos / Etiquetas"
      >
        <MousePointer size={15} />
      </button>

      <button
        className={`p-2 rounded-lg transition-all ${
          toolMode === 'add_point'
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
            : diagramTheme === 'danfoss'
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        onClick={() => setToolMode('add_point')}
        title="Modo Añadir Punto: Haga clic en la gráfica para crear un estado"
      >
        <PlusCircle size={15} />
      </button>

      <button
        className={`p-2 rounded-lg transition-all ${
          toolMode === 'connect'
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
            : diagramTheme === 'danfoss'
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        onClick={() => setToolMode('connect')}
        title="Modo Conectar: Haga clic sucesivamente en dos puntos para unirlos"
      >
        <Share2 size={15} />
      </button>

      {points.length >= 3 && (
        <button
          className={`p-2 rounded-lg transition-colors ${
            diagramTheme === 'danfoss'
              ? 'text-amber-600 hover:bg-amber-50'
              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
          }`}
          onClick={closeCycle}
          title="Cerrar Ciclo Termodinámico (conectar último punto con el primero)"
        >
          <Repeat size={15} />
        </button>
      )}

      <div className={`w-[1px] h-5 mx-1 ${
        diagramTheme === 'danfoss' ? 'bg-slate-300' : 'bg-slate-700/60'
      }`} />

      <button
        className={`p-2 rounded-lg transition-colors ${
          diagramTheme === 'danfoss'
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        onClick={onZoomIn}
        title="Acercar (Zoom +)"
      >
        <ZoomIn size={15} />
      </button>

      <button
        className={`p-2 rounded-lg transition-colors ${
          diagramTheme === 'danfoss'
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        onClick={onZoomOut}
        title="Alejar (Zoom -)"
      >
        <ZoomOut size={15} />
      </button>

      <button
        className={`p-2 rounded-lg transition-colors ${
          diagramTheme === 'danfoss'
            ? 'text-slate-600 hover:text-cyan-600 hover:bg-slate-100'
            : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
        }`}
        onClick={onResetView}
        title="Restablecer Vista (Ajustar a límites del refrigerante)"
      >
        <Maximize2 size={15} />
      </button>

      <div className={`w-[1px] h-5 mx-1 ${
        diagramTheme === 'danfoss' ? 'bg-slate-300' : 'bg-slate-700/60'
      }`} />

      <button
        className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
          diagramTheme === 'danfoss'
            ? 'text-blue-700 hover:bg-blue-50'
            : 'text-amber-300 hover:bg-slate-800'
        }`}
        onClick={onToggleTheme}
        title={diagramTheme === 'danfoss' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Carta Técnica (Fondo Blanco Danfoss)'}
      >
        {diagramTheme === 'danfoss' ? (
          <>
            <Moon size={15} />
            <span className="hidden sm:inline">Modo Oscuro</span>
          </>
        ) : (
          <>
            <Sun size={15} />
            <span className="hidden sm:inline">Carta Técnica</span>
          </>
        )}
      </button>

      {onToggleEngine && (
        <>
          <div className={`w-[1px] h-5 mx-1 ${
            diagramTheme === 'danfoss' ? 'bg-slate-300' : 'bg-slate-700/60'
          }`} />
          <div className="flex items-center rounded-lg p-0.5 text-xs font-mono font-bold">
            <button
              className={`px-2 py-0.5 rounded transition-colors ${
                engineMode === 'svg'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : diagramTheme === 'danfoss'
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              onClick={() => engineMode !== 'svg' && onToggleEngine()}
              title="Motor SVG Nativo"
            >
              📐 SVG
            </button>
            <button
              className={`px-2 py-0.5 rounded transition-colors ${
                engineMode === 'plotly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : diagramTheme === 'danfoss'
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              onClick={() => engineMode !== 'plotly' && onToggleEngine()}
              title="Motor Plotly.js"
            >
              📊 Plotly
            </button>
          </div>
        </>
      )}
    </div>
  );
};

