import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Info, Search } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { RefrigerantGroup } from '../../types/thermo';

export const CatalogTab: React.FC = () => {
  const { catalog, selectedFluidId, setSelectedFluidId, showToast, setIsAvailabilityModalOpen } = useProject();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<RefrigerantGroup>('Todos');

  const groups: RefrigerantGroup[] = [
    'Todos',
    'Naturales',
    'HFC y mezclas',
    'HFO y bajo GWP',
    'Históricos y existentes',
  ];

  const filteredItems = useMemo(() => {
    if (!catalog) return [];
    return catalog.priority_items.filter((item) => {
      const matchesGroup = activeGroup === 'Todos' || item.group === activeGroup;
      const q = search.toLowerCase();
      const matchesSearch =
        item.display_name.toLowerCase().includes(q) ||
        item.coolprop_id.toLowerCase().includes(q) ||
        item.aliases.some((a) => a.toLowerCase().includes(q));
      return matchesGroup && matchesSearch;
    });
  }, [catalog, activeGroup, search]);

  const handleSelect = (coolpropId: string, isAvailable: boolean, notes?: string) => {
    if (!isAvailable) {
      showToast(notes || 'Refrigerante no disponible en CoolProp estándar');
      return;
    }
    setSelectedFluidId(coolpropId);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search Box */}
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar (R134a, CO2, R717...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-700/60 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Filter Category Pills */}
      <div className="flex flex-wrap gap-1">
        {groups.map((grp) => (
          <button
            key={grp}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-all ${
              activeGroup === grp
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
            onClick={() => setActiveGroup(grp)}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-1.5 mt-1">
        {filteredItems.map((item) => {
          const isSelected = item.coolprop_id === selectedFluidId;
          return (
            <div
              key={item.display_name}
              className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-1 ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : item.is_available
                  ? 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700 cursor-pointer'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-60 cursor-not-allowed border-dashed'
              }`}
              onClick={() => handleSelect(item.coolprop_id, item.is_available, item.notes)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100 tracking-tight">
                  {item.display_name}
                </span>
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
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800/60">
                  {item.fluid_type}
                </span>
                <div className="flex items-center gap-2 font-mono">
                  {item.ashrae_safety && (
                    <span className="text-amber-400 font-bold">ASHRAE: {item.ashrae_safety}</span>
                  )}
                  {item.gwp !== undefined && (
                    <span className="text-slate-500">GWP: {item.gwp}</span>
                  )}
                </div>
              </div>

              {item.info && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>Tc: {item.info.t_crit_c?.toFixed(1)} °C</span>
                  <span>•</span>
                  <span>Pc: {item.info.p_crit_bar?.toFixed(1)} bar</span>
                </div>
              )}

              {!item.is_available && (
                <div className="text-[10px] text-rose-400 mt-1 flex items-start gap-1 bg-rose-950/20 p-1.5 rounded border border-rose-900/30">
                  <Info size={12} className="shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-tight">{item.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Catalog Matrix CTA */}
      <div className="mt-2 p-2.5 bg-gradient-to-r from-sky-950/40 to-cyan-950/40 border border-cyan-800/30 rounded-xl flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-300">
          <strong>{catalog?.other_available_fluids.length || 0}</strong> fluidos disponibles en CoolProp.
        </div>
        <button
          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors shrink-0"
          onClick={() => setIsAvailabilityModalOpen(true)}
        >
          Ver Matriz
        </button>
      </div>
    </div>
  );
};
