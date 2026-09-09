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
      className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={() => setIsAvailabilityModalOpen(false)}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#16181e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111319] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center">
              <HelpCircle size={14} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Matriz de Cobertura y Disponibilidad en CoolProp 8.0
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Verificación de refrigerantes prioritarios con modelos de Helmholtz y mezclas
              </div>
            </div>
          </div>
          <button
            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            onClick={() => setIsAvailabilityModalOpen(false)}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar por nombre, grupo o identificador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-750 focus:border-sky-500 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-colors"
              />
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              CoolProp v{catalog?.engine_version || '8.0'}
            </span>
          </div>

          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121419]">
            <table className="w-full border-collapse text-[11px] font-mono text-left">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#15171d] border-b border-slate-200 dark:border-slate-800 z-10">
                <tr className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="py-2 px-3">Grupo</th>
                  <th className="py-2 px-3">Refrigerante</th>
                  <th className="py-2 px-3">ID Motor</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">ASHRAE</th>
                  <th className="py-2 px-3">GWP</th>
                  <th className="py-2 px-3">Notas Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {items.map((item) => (
                  <tr
                    key={item.display_name}
                    className={`transition-colors ${
                      item.is_available
                        ? 'hover:bg-sky-50 dark:hover:bg-sky-950/20 cursor-pointer text-slate-800 dark:text-slate-200'
                        : 'opacity-50 text-slate-400'
                    }`}
                    onClick={() => {
                      if (item.is_available) {
                        setSelectedFluidId(item.coolprop_id);
                        setIsAvailabilityModalOpen(false);
                      }
                    }}
                  >
                    <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{item.group}</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.display_name}
                    </td>
                    <td className="py-2 px-3 text-sky-700 dark:text-sky-400">
                      <code>{item.coolprop_id}</code>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                          item.is_available
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        {item.is_available ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        <span>{item.is_available ? 'Disponible' : 'No soportado'}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{item.fluid_type}</td>
                    <td className="py-2 px-3 font-bold text-amber-700 dark:text-amber-400">{item.ashrae_safety || '-'}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{item.gwp !== undefined ? item.gwp : '-'}</td>
                    <td className="py-2 px-3 font-sans text-[10px] text-slate-500 dark:text-slate-400 max-w-[220px]">
                      {item.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111319] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Haga clic sobre cualquier refrigerante disponible para cargarlo en el diagrama.
          </div>
          <button
            className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer"
            onClick={() => setIsAvailabilityModalOpen(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
