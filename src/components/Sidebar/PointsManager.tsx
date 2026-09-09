import React from 'react';
import { MapPin, Plus, MousePointer, Trash2, Crosshair, ChevronRight, Sliders } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const PointsManager: React.FC = () => {
  const {
    points,
    selectedPointId,
    setSelectedPointId,
    toolMode,
    setToolMode,
    removePoint,
    layers,
    activeLayerId,
    setSidebarTab,
  } = useProject();

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={14} className="text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate">
            Puntos
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold shrink-0">
            {points.length}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setSelectedPointId(null);
              setSidebarTab('editor');
            }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all hover:scale-[1.02]"
            title="Crear punto mediante pares de variables (P, h, T, x, etc.)"
          >
            <Sliders size={12} />
            <span>+ Inputs</span>
          </button>

          <button
            onClick={() => setToolMode(toolMode === 'add_point' ? 'select' : 'add_point')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
              toolMode === 'add_point'
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/30 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700/80 hover:border-cyan-500/50'
            }`}
            title={
              toolMode === 'add_point'
                ? 'Modo colocar activo: Haga clic en la gráfica para colocar un punto'
                : 'Activar modo clic en gráfica para colocar puntos'
            }
          >
            {toolMode === 'add_point' ? <Crosshair size={12} /> : <Plus size={12} />}
            <span>{toolMode === 'add_point' ? 'Colocando...' : '+ En Gráfica'}</span>
          </button>
        </div>
      </div>

      {toolMode === 'add_point' && (
        <div className="p-2 bg-cyan-950/60 border border-cyan-500/50 rounded-xl text-[11px] text-cyan-300 flex items-center justify-between animate-in fade-in duration-150">
          <span>Haga clic en cualquier zona de la gráfica para fijar el punto</span>
          <button
            onClick={() => setToolMode('select')}
            className="text-[10px] underline font-bold text-white hover:text-cyan-200"
          >
            Listo
          </button>
        </div>
      )}

      {/* Points List */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
        {points.length === 0 ? (
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <MousePointer size={20} className="text-slate-600" />
            <div className="text-xs text-slate-400 font-medium">No hay puntos en el diagrama</div>
            <button
              onClick={() => setToolMode('add_point')}
              className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              Hacer clic en la gráfica para añadir
            </button>
          </div>
        ) : (
          points.map((pt) => {
            const isSelected = pt.id === selectedPointId;
            const ptLayer = layers.find((l) => l.id === pt.layerId) || activeLayer;

            return (
              <div
                key={pt.id}
                onClick={() => setSelectedPointId(isSelected ? null : pt.id)}
                className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-850 border-cyan-400/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/50 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Point Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ background: pt.color }}
                    />
                    <span className="text-xs font-bold text-white tracking-tight truncate">
                      {pt.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-sans shrink-0">
                      {pt.state.phase}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePoint(pt.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                      title="Eliminar punto"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight
                      size={13}
                      className={`text-slate-500 transition-transform ${
                        isSelected ? 'rotate-90 text-cyan-400' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Thermodynamic Properties Grid: Enthalpy, Volume, Temp, Pressure */}
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                  <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">h (entalpía):</span>
                    <span className="text-slate-100 font-bold">
                      {pt.state.enthalpy_kj_kg.toFixed(1)} kJ/kg
                    </span>
                  </div>

                  <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">v (volumen):</span>
                    <span className="text-purple-400 font-bold">
                      {pt.state.specific_volume_m3_kg < 0.01
                        ? pt.state.specific_volume_m3_kg.toExponential(2)
                        : pt.state.specific_volume_m3_kg.toFixed(4)}{' '}
                      m³/kg
                    </span>
                  </div>

                  <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">T (temp):</span>
                    <span className="text-emerald-400 font-bold">
                      {pt.state.temperature_c.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">P (presión):</span>
                    <span className="text-cyan-400 font-bold">
                      {pt.state.pressure_bar.toFixed(2)} bar
                    </span>
                  </div>

                  {/* Isentropic entropy */}
                  <div className="col-span-2 p-1.5 bg-slate-900/80 rounded-lg border border-slate-800/60 flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">s (isentrópica):</span>
                    <span className="text-amber-300 font-bold">
                      {pt.state.entropy_kj_kg_k.toFixed(4)} kJ/(kg·K)
                    </span>
                  </div>
                </div>

                {/* Sub-label: Layer belonging */}
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-0.5">
                  <span className="flex items-center gap-1">
                    <span>Capa:</span>
                    <strong style={{ color: ptLayer?.color }}>{ptLayer?.name}</strong>
                  </span>
                  {isSelected && (
                    <span className="text-cyan-400 font-semibold font-sans">
                      Seleccionado en gráfica
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
