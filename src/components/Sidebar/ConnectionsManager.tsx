import React, { useState } from 'react';
import { ArrowRight, Plus, Share2, Trash2, Repeat, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProcessType } from '../../types/thermo';

export const ConnectionsManager: React.FC = () => {
  const {
    points,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    addConnection,
    updateConnection,
    removeConnection,
    closeCycle,
    showToast,
    layers,
    activeLayerId,
  } = useProject();

  const [fromPointId, setFromPointId] = useState<string>('');
  const [toPointId, setToPointId] = useState<string>('');
  const [processType, setProcessType] = useState<ProcessType>('direct_line');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [isListOpen, setIsListOpen] = useState(true);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  // Auto set defaults if not selected yet
  const defaultFrom = fromPointId || (points.length >= 1 ? points[0].id : '');
  const defaultTo = toPointId || (points.length >= 2 ? points[1].id : '');

  const handleCreateConnection = async () => {
    const srcId = fromPointId || defaultFrom;
    const dstId = toPointId || defaultTo;

    if (!srcId || !dstId) {
      showToast('Seleccione el punto de origen y de destino');
      return;
    }
    if (srcId === dstId) {
      showToast('Seleccione dos puntos distintos');
      return;
    }

    setIsSubmitting(true);
    try {
      await addConnection(srcId, dstId, processType);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Componente Superior: Trazar / Agregar Unión */}
      <div className="bg-white dark:bg-[#181a20] border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400 shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Agregar Unión
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            <span className="text-[10px] font-medium">{isFormOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isFormOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </div>

        {isFormOpen && (
          <div className="flex flex-col gap-2.5 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-100">
            {points.length < 2 ? (
              <div className="p-3 bg-slate-100/50 dark:bg-[#121419] border border-slate-200 dark:border-slate-800 rounded-md text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono">
                Se necesitan al menos 2 puntos para trazar una unión termodinámica.
              </div>
            ) : (
              <>
                {/* Point Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Desde (Origen):</label>
                    <select
                      value={defaultFrom}
                      onChange={(e) => setFromPointId(e.target.value)}
                      className="w-full bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-750 focus:border-sky-500 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
                    >
                      {points.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Hasta (Destino):</label>
                    <select
                      value={defaultTo}
                      onChange={(e) => setToPointId(e.target.value)}
                      className="w-full bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-750 focus:border-sky-500 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
                    >
                      {points.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Process Type Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Tipo de Proceso Termodinámico:
                  </label>
                  <select
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value as ProcessType)}
                    className="w-full bg-white dark:bg-[#121419] border border-slate-300 dark:border-slate-750 focus:border-sky-500 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none font-sans"
                  >
                    <option value="direct_line">Línea recta geométrica</option>
                    <option value="isobaric">Isobárico (P = cte, Evaporador / Condensador)</option>
                    <option value="isentropic">Isentrópico (s = cte, Compresión)</option>
                    <option value="isenthalpic">Isoentálpico (h = cte, Válvula Expansión)</option>
                    <option value="isothermal">Isotérmico (T = cte)</option>
                  </select>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleCreateConnection}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-medium rounded-md shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Unir Puntos y Calcular Proceso</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Header de la Lista de Uniones */}
      <div
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white dark:bg-[#181b22] hover:bg-slate-100/80 dark:hover:bg-[#1e222a] border border-slate-200 dark:border-slate-800 cursor-pointer select-none transition-colors mt-0.5 shadow-2xs"
      >
        <div className="flex items-center gap-1.5">
          <Share2 size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Uniones de Proceso
          </span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
            {connections.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {points.length >= 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeCycle();
              }}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
              title="Conectar automáticamente el último punto con el primero"
            >
              <Repeat size={11} />
              <span>Cerrar Ciclo</span>
            </button>
          )}
          <div className="flex items-center gap-1 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 ml-1">
            <span className="text-[10px] font-medium">{isListOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isListOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </div>
      </div>

      {/* Lista de Uniones */}
      {isListOpen && (
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1 animate-in fade-in duration-100">
        {connections.length === 0 ? (
          <div className="p-4 bg-white dark:bg-[#14161b] border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-center gap-1 text-slate-400 dark:text-slate-500 font-mono shadow-2xs">
            <span className="text-xs">No hay uniones trazadas</span>
            <span className="text-[10px]">
              Seleccione origen y destino arriba para unir estados
            </span>
          </div>
        ) : (
          connections.map((conn) => {
            const isSelected = conn.id === selectedConnectionId;
            const p1 = points.find((p) => p.id === conn.fromPointId);
            const p2 = points.find((p) => p.id === conn.toPointId);

            return (
              <div
                key={conn.id}
                onClick={() => setSelectedConnectionId(isSelected ? null : conn.id)}
                className={`p-2 rounded-lg border transition-all duration-100 flex flex-col gap-1.5 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600/70 ring-1 ring-sky-400/20'
                    : 'bg-white dark:bg-[#181a20] hover:bg-slate-50/90 dark:hover:bg-[#1e222a] border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/10 dark:ring-white/20"
                      style={{ background: conn.color || p1?.color || activeLayer.color }}
                    />
                    <span>{p1?.name || 'Origen'}</span>
                    <ArrowRight size={11} className="text-slate-400 shrink-0" />
                    <span>{p2?.name || 'Destino'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(conn.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Eliminar unión"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <select
                    value={conn.processType}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateConnection(conn.id, { processType: e.target.value as ProcessType })}
                    className="px-1.5 py-0.5 rounded bg-white dark:bg-[#121419] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 text-[10px] font-mono outline-none cursor-pointer"
                  >
                    <option value="direct_line">Línea recta</option>
                    <option value="isobaric">Isobárico (P = cte)</option>
                    <option value="isentropic">Isentrópico (s = cte)</option>
                    <option value="isenthalpic">Isoentálpico (h = cte)</option>
                    <option value="isothermal">Isotérmico (T = cte)</option>
                  </select>

                  {conn.delta_h_kj_kg !== undefined && (
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Activity size={11} className="text-sky-600 dark:text-sky-400" />
                      Δh: {conn.delta_h_kj_kg.toFixed(1)} kJ/kg
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
};
