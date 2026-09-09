import React, { useState } from 'react';
import { ArrowRight, Plus, Share2, Trash2, Repeat, Activity } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProcessType } from '../../types/thermo';

export const ConnectionsManager: React.FC = () => {
  const {
    points,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    addConnection,
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

  const getProcessLabel = (type: ProcessType) => {
    switch (type) {
      case 'isobaric':
        return 'Isobárico (P = cte)';
      case 'isenthalpic':
        return 'Isoentálpico (h = cte)';
      case 'isentropic':
        return 'Isentrópico (s = cte)';
      case 'isothermal':
        return 'Isotérmico (T = cte)';
      default:
        return 'Línea recta';
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Uniones de Proceso
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
            {connections.length}
          </span>
        </div>

        {points.length >= 3 && (
          <button
            onClick={closeCycle}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
            title="Conectar automáticamente el último punto con el primero"
          >
            <Repeat size={12} />
            <span>Cerrar Ciclo</span>
          </button>
        )}
      </div>

      {/* Creation Card */}
      {points.length < 2 ? (
        <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 text-center">
          Se necesitan al menos 2 puntos para crear una unión termodinámica.
        </div>
      ) : (
        <div className="p-3 bg-slate-900/90 border border-slate-700/70 rounded-2xl flex flex-col gap-2.5 shadow-md">
          <div className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
            <span>Trazar Nueva Unión</span>
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <span>Capa:</span>
              <strong style={{ color: activeLayer?.color }}>{activeLayer?.name}</strong>
            </span>
          </div>

          {/* Point Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-semibold">Desde (Origen):</label>
              <select
                value={defaultFrom}
                onChange={(e) => setFromPointId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500"
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
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500"
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
              Tipo de Trayectoria Termodinámica:
            </label>
            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value as ProcessType)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono"
            >
              <option value="direct_line">Línea recta geométrica</option>
              <option value="isobaric">Isobárico (P = cte, Evaporación / Condensación)</option>
              <option value="isentropic">Isentrópico (s = cte, Compresión Isentrópica)</option>
              <option value="isenthalpic">Isoentálpico (h = cte, Válvula Expansión)</option>
              <option value="isothermal">Isotérmico (T = cte)</option>
            </select>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleCreateConnection}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Plus size={13} />
            <span>Unir Puntos y Calcular Proceso</span>
          </button>
        </div>
      )}

      {/* Connections List */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
        {connections.map((conn) => {
          const isSelected = conn.id === selectedConnectionId;
          const p1 = points.find((p) => p.id === conn.fromPointId);
          const p2 = points.find((p) => p.id === conn.toPointId);

          return (
            <div
              key={conn.id}
              onClick={() => setSelectedConnectionId(isSelected ? null : conn.id)}
              className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-850 border-cyan-400/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/50 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ background: conn.color || p1?.color }}
                  />
                  <span>{p1?.name || 'Origen'}</span>
                  <ArrowRight size={13} className="text-cyan-400 shrink-0" />
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
                <span className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-800 font-mono">
                  {getProcessLabel(conn.processType)}
                </span>
                {conn.delta_h_kj_kg !== undefined && (
                  <span className="font-mono font-bold text-slate-100 flex items-center gap-1">
                    <Activity size={11} className="text-cyan-400" />
                    Δh: {conn.delta_h_kj_kg.toFixed(1)} kJ/kg
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
