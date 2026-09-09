import React, { useState } from 'react';
import { Eye, EyeOff, Layers, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const LAYER_PALETTE = [
  '#38bdf8', // Sky / Cyan
  '#f43f5e', // Rose / Red
  '#10b981', // Emerald / Green
  '#f59e0b', // Amber / Orange
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

export const LayersManager: React.FC = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    updateLayer,
    removeLayer,
    points,
    connections,
  } = useProject();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [colorPickerLayerId, setColorPickerLayerId] = useState<string | null>(null);

  const handleStartRename = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      updateLayer(id, { name: editingName.trim() });
    }
    setEditingLayerId(null);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Capas del Ciclo
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
            {layers.length}
          </span>
        </div>
        <button
          onClick={() => addLayer()}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all hover:shadow-sm hover:shadow-cyan-500/20"
          title="Crear nueva capa"
        >
          <Plus size={13} />
          <span>Nueva Capa</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-400 leading-tight">
        La capa activa define el color de los puntos y uniones que se agreguen.
      </div>

      {/* Layers List */}
      <div className="flex flex-col gap-1.5">
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const layerPointsCount = points.filter((p) => p.layerId === layer.id).length;
          const layerConnsCount = connections.filter((c) => c.layerId === layer.id).length;

          return (
            <div
              key={layer.id}
              className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-2 ${
                isActive
                  ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/40 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Active Radio & Color Badge */}
                <div
                  className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-transform ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-950 shadow-[0_0_8px_#22d3ee]'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </div>

                  {/* Color button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setColorPickerLayerId(colorPickerLayerId === layer.id ? null : layer.id);
                    }}
                    className="w-4 h-4 rounded-full border border-white/40 shadow-sm shrink-0 hover:scale-110 transition-transform"
                    style={{ background: layer.color }}
                    title="Cambiar color de la capa"
                  />

                  {/* Layer Name / Edit */}
                  {editingLayerId === layer.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveRename(layer.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(layer.id)}
                      autoFocus
                      className="bg-slate-950 border border-cyan-500 text-white rounded px-1.5 py-0.5 text-xs font-semibold outline-none w-36"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`text-xs font-bold tracking-tight truncate max-w-[140px] ${
                        isActive ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Right actions: rename, visibility, delete */}
                <div className="flex items-center gap-1">
                  {editingLayerId !== layer.id && (
                    <button
                      onClick={() => handleStartRename(layer.id, layer.name)}
                      className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                      title="Renombrar capa"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}

                  <button
                    onClick={() => updateLayer(layer.id, { isVisible: !layer.isVisible })}
                    className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
                    title={layer.isVisible ? 'Ocultar capa' : 'Mostrar capa'}
                  >
                    {layer.isVisible ? <Eye size={13} className="text-cyan-400" /> : <EyeOff size={13} />}
                  </button>

                  {layers.length > 1 && (
                    <button
                      onClick={() => removeLayer(layer.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                      title="Eliminar capa"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-info: Point & connection count */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>
                  {layerPointsCount} {layerPointsCount === 1 ? 'punto' : 'puntos'} • {layerConnsCount} {layerConnsCount === 1 ? 'unión' : 'uniones'}
                </span>
                {isActive && (
                  <span className="text-cyan-400 font-sans font-bold text-[9px] uppercase tracking-wider bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
                    Activa
                  </span>
                )}
              </div>

              {/* Color Picker Palette popover */}
              {colorPickerLayerId === layer.id && (
                <div className="p-2 bg-slate-950 border border-slate-700/80 rounded-xl flex items-center justify-between gap-1 mt-1 animate-in fade-in duration-100">
                  <div className="flex flex-wrap gap-1.5">
                    {LAYER_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        style={{ background: c }}
                        onClick={() => {
                          updateLayer(layer.id, { color: c });
                          setColorPickerLayerId(null);
                        }}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          layer.color === c ? 'scale-110 ring-2 ring-white shadow-md' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setColorPickerLayerId(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <Check size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
