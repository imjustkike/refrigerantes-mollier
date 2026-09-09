import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown, Check, Search, AlertCircle, Database } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { RefrigerantGroup } from '../../types/thermo';

export const RefrigerantSelectorDropdown: React.FC = () => {
  const {
    catalog,
    selectedFluidId,
    selectedFluidItem,
    setSelectedFluidId,
    showToast,
    setIsAvailabilityModalOpen,
  } = useProject();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<RefrigerantGroup>('Todos');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groups: RefrigerantGroup[] = [
    'Todos',
    'Naturales',
    'HFC y mezclas',
    'HFO y bajo GWP',
    'Históricos y existentes',
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!catalog) return [];
    return catalog.priority_items.filter((item) => {
      const matchesGroup = activeGroup === 'Todos' || item.group === activeGroup;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.display_name.toLowerCase().includes(q) ||
        item.coolprop_id.toLowerCase().includes(q) ||
        item.aliases.some((a) => a.toLowerCase().includes(q));
      return matchesGroup && matchesSearch;
    });
  }, [catalog, activeGroup, search]);

  const handleSelect = (coolpropId: string, isAvailable: boolean, notes?: string) => {
    if (!isAvailable) {
      showToast(notes || 'Refrigerante no disponible en CoolProp');
      return;
    }
    setSelectedFluidId(coolpropId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/60 rounded-xl transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 group"
        title="Seleccionar refrigerante"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors leading-none">
            {selectedFluidItem?.display_name || selectedFluidId}
          </span>
          <span className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
            {selectedFluidItem?.fluid_type || 'Refrigerante'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 z-50 backdrop-blur-2xl p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Database size={13} className="text-cyan-400" />
              <span>Catálogo de Refrigerantes</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsAvailabilityModalOpen(true);
              }}
              className="text-[10px] text-cyan-400 hover:underline font-semibold"
            >
              Matriz completa ({catalog?.other_available_fluids.length || 0})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar (R134a, R744, R717...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {groups.map((grp) => (
              <button
                key={grp}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all ${
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

          {/* Refrigerant Cards List */}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected = item.coolprop_id === selectedFluidId;
              return (
                <div
                  key={item.display_name}
                  onClick={() => handleSelect(item.coolprop_id, item.is_available, item.notes)}
                  className={`p-2 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                      : item.is_available
                      ? 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/20 border-slate-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">
                        {item.display_name}
                      </span>
                      {item.ashrae_safety && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 font-mono">
                          {item.ashrae_safety}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.fluid_type}
                      {item.info?.t_crit_c !== undefined && (
                        <> • Tc: {item.info.t_crit_c.toFixed(1)}°C</>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected && <Check size={14} className="text-cyan-400" />}
                    {!item.is_available && (
                      <span title={item.notes || 'No disponible'}>
                        <AlertCircle size={13} className="text-rose-400" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500">
                No se encontraron refrigerantes coincidentes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
