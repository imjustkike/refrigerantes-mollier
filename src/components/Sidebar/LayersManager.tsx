import React, { useState } from 'react';
import { Eye, EyeOff, Layers, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const LAYER_PALETTE = [
  '#0284c7', // Sky Blue
  '#e11d48', // Crimson Red
  '#10b981', // Emerald Green
  '#d97706', // Industrial Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#4f46e5', // Indigo
  '#0d9488', // Deep Teal
  '#ca8a04', // Yellow
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Capas del Ciclo
          </span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
            {layers.length}
          </span>
        </div>
        <button
          onClick={() => addLayer()}
          className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-[#181b22] hover:bg-slate-200/80 dark:hover:bg-[#222630] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          title="Crear nueva capa"
        >
          <Plus size={12} />
          <span>Nueva Capa</span>
        </button>
      </div>

      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
        La capa activa define el color de los puntos y uniones que se agreguen.
      </div>

      {/* Layers List */}
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const layerPointsCount = points.filter((p) => p.layerId === layer.id).length;
          const layerConnsCount = connections.filter((c) => c.layerId === layer.id).length;

          return (
            <div
              key={layer.id}
              className={`p-2 rounded-lg border transition-all duration-100 flex flex-col gap-1.5 shadow-xs ${
                isActive
                  ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600/60 ring-1 ring-sky-400/20'
                  : 'bg-white dark:bg-[#181a20] hover:bg-slate-50/90 dark:hover:bg-[#1e222a] border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Active Radio & Color Badge */}
                <div
                  className="flex items-center gap-2 flex-1 cursor-pointer select-none"
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-transform ${
                      isActive
                        ? 'border-sky-600 dark:border-sky-400 bg-sky-100 dark:bg-sky-950'
                        : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-[#121419]'
                    }`}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />}
                  </div>

                  {/* Color button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setColorPickerLayerId(colorPickerLayerId === layer.id ? null : layer.id);
                    }}
                    className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/40 shrink-0 hover:scale-110 transition-transform cursor-pointer shadow-2xs"
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
                      className="bg-white dark:bg-slate-950 border border-sky-500 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-xs font-medium outline-none w-36"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`text-xs font-semibold tracking-tight truncate max-w-[140px] ${
                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
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
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Renombrar capa"
                    >
                      <Edit2 size={11} />
                    </button>
                  )}

                  <button
                    onClick={() => updateLayer(layer.id, { isVisible: !layer.isVisible })}
                    className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={layer.isVisible ? 'Ocultar capa' : 'Mostrar capa'}
                  >
                    {layer.isVisible ? <Eye size={12} className="text-sky-600 dark:text-sky-400" /> : <EyeOff size={12} className="text-slate-400" />}
                  </button>

                  {layers.length > 1 && (
                    <button
                      onClick={() => removeLayer(layer.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Eliminar capa"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-info: Point & connection count */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono px-0.5">
                <span>
                  {layerPointsCount} {layerPointsCount === 1 ? 'punto' : 'puntos'} • {layerConnsCount} {layerConnsCount === 1 ? 'unión' : 'uniones'}
                </span>
                {isActive && (
                  <span className="text-sky-700 dark:text-sky-300 font-sans font-semibold text-[9px] uppercase tracking-wider bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-300 dark:border-sky-800/60">
                    Activa
                  </span>
                )}
              </div>

              {/* Color Picker Palette */}
              {colorPickerLayerId === layer.id && (
                <div className="p-2 bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-750 rounded-lg flex items-center justify-between gap-1 mt-1 animate-in fade-in duration-100 shadow-sm">
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
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          layer.color === c ? 'scale-115 ring-2 ring-sky-500 shadow-xs' : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setColorPickerLayerId(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <Check size={12} />
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
