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
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 shadow-md">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Agregar Unión
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors">
            <span className="text-[10px] font-semibold">{isFormOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {isFormOpen && (
          <div className="flex flex-col gap-2.5 mt-3 pt-2.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            {points.length < 2 ? (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 text-center">
                Se necesitan al menos 2 puntos para trazar una unión termodinámica.
              </div>
            ) : (
              <>
                {/* Point Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-semibold">Desde (Origen):</label>
                    <select
                      value={defaultFrom}
                      onChange={(e) => setFromPointId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none transition-colors"
                    >
                      {points.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-semibold">Hasta (Destino):</label>
                    <select
                      value={defaultTo}
                      onChange={(e) => setToPointId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none transition-colors"
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
                  <label className="text-[10px] text-slate-400 font-semibold">
                    Tipo de Proceso Termodinámico:
                  </label>
                  <select
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value as ProcessType)}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-cyan-500 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none font-sans"
                  >
                    <option value="direct_line">Línea recta geométrica</option>
                    <option value="isobaric">Isobárico (P = cte, Evaporador / Condensador)</option>
                    <option value="isentropic">Isentrópico (s = cte, Compresión Isentrópica)</option>
                    <option value="isenthalpic">Isoentálpico (h = cte, Válvula Expansión)</option>
                    <option value="isothermal">Isotérmico (T = cte)</option>
                  </select>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleCreateConnection}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  <Plus size={13} />
                  <span>Unir Puntos y Calcular Proceso</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Header de la Lista de Uniones (Plegable / Desplegable) */}
      <div
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-900/70 border border-slate-800/80 cursor-pointer select-none transition-colors mt-1"
      >
        <div className="flex items-center gap-1.5">
          <Share2 size={13} className="text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Uniones de Proceso
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
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
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-semibold transition-all hover:shadow-sm"
              title="Conectar automáticamente el último punto con el primero"
            >
              <Repeat size={11} />
              <span>Cerrar Ciclo</span>
            </button>
          )}
          <div className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 ml-1">
            <span className="text-[10px] font-semibold">{isListOpen ? 'Ocultar' : 'Mostrar'}</span>
            {isListOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </div>
      </div>

      {/* Lista de Uniones con Max Height y Scroll Interno */}
      {isListOpen && (
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar animate-in fade-in duration-150">
        {connections.length === 0 ? (
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 text-slate-500">
            <span className="text-xs">No hay uniones trazadas</span>
            <span className="text-[10px] text-slate-600">
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
                className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-850 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ background: conn.color || p1?.color || activeLayer.color }}
                    />
                    <span>{p1?.name || 'Origen'}</span>
                    <ArrowRight size={12} className="text-cyan-400 shrink-0" />
                    <span>{p2?.name || 'Destino'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(conn.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                    title="Eliminar unión"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <select
                    value={conn.processType}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateConnection(conn.id, { processType: e.target.value as ProcessType })}
                    className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 text-[10px] font-mono outline-none cursor-pointer"
                  >
                    <option value="direct_line">Línea recta</option>
                    <option value="isobaric">Isobárico (P = cte)</option>
                    <option value="isentropic">Isentrópico (s = cte)</option>
                    <option value="isenthalpic">Isoentálpico (h = cte)</option>
                    <option value="isothermal">Isotérmico (T = cte)</option>
                  </select>

                  {conn.delta_h_kj_kg !== undefined && (
                    <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                      <Activity size={11} className="text-cyan-400" />
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
