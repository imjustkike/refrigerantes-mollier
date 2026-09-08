import React, { useState } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, Search, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const AvailabilityMatrixModal: React.FC = () => {
  const { isAvailabilityModalOpen, setIsAvailabilityModalOpen, catalog, setSelectedFluidId } = useProject();
  const [search, setSearch] = useState('');

  if (!isAvailabilityModalOpen) return null;

  const items = catalog?.priority_items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.display_name.toLowerCase().includes(q) ||
      item.coolprop_id.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={() => setIsAvailabilityModalOpen(false)}
    >
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <HelpCircle size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">
                Matriz de Cobertura y Disponibilidad en CoolProp 8.0
              </div>
              <div className="text-[11px] text-slate-400">
                Verificación de refrigerantes prioritarios con modelos de Helmholtz y mezclas
              </div>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsAvailabilityModalOpen(false)}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre, grupo o identificador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/60 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <span className="text-xs font-mono text-slate-400">
              CoolProp v{catalog?.engine_version || '8.0'}
            </span>
          </div>

          <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full border-collapse text-[11px] font-mono text-left">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                <tr className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Grupo</th>
                  <th className="py-2.5 px-3">Refrigerante</th>
                  <th className="py-2.5 px-3">ID Motor</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">ASHRAE</th>
                  <th className="py-2.5 px-3">GWP</th>
                  <th className="py-2.5 px-3">Notas Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {items.map((item) => (
                  <tr
                    key={item.display_name}
                    className={`transition-colors ${
                      item.is_available
                        ? 'hover:bg-cyan-950/20 cursor-pointer text-slate-200'
                        : 'opacity-60 text-slate-400'
                    }`}
                    onClick={() => {
                      if (item.is_available) {
                        setSelectedFluidId(item.coolprop_id);
                        setIsAvailabilityModalOpen(false);
                      }
                    }}
                  >
                    <td className="py-2 px-3 font-sans text-slate-400">{item.group}</td>
                    <td className="py-2 px-3 font-sans font-bold text-white whitespace-nowrap">
                      {item.display_name}
                    </td>
                    <td className="py-2 px-3 text-cyan-400">
                      <code>{item.coolprop_id}</code>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                          item.is_available
                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                            : 'bg-rose-950/50 text-rose-400 border-rose-800/40'
                        }`}
                      >
                        {item.is_available ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        <span>{item.is_available ? 'Disponible' : 'No soportado'}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans">{item.fluid_type}</td>
                    <td className="py-2 px-3 font-bold text-amber-400">{item.ashrae_safety || '-'}</td>
                    <td className="py-2 px-3 text-slate-400">{item.gwp !== undefined ? item.gwp : '-'}</td>
                    <td className="py-2 px-3 font-sans text-[10px] text-slate-400 max-w-[220px]">
                      {item.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Haga clic sobre cualquier refrigerante disponible para cargarlo directamente en el diagrama.
          </div>
          <button
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20"
            onClick={() => setIsAvailabilityModalOpen(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
