import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown, Check, Search, AlertCircle, Database } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { RefrigerantGroup } from '../../types/thermo';

interface RefrigerantSelectorDropdownProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const RefrigerantSelectorDropdown: React.FC<RefrigerantSelectorDropdownProps> = ({
  className = '',
  size = 'md',
}) => {
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

  const isSm = size === 'sm';

  const shortDisplayName = useMemo(() => {
    const full = selectedFluidItem?.display_name || selectedFluidId;
    if (isSm) {
      // In compact mode, show short refrigerant code e.g. "R744", "R134a", "R290"
      return selectedFluidItem?.coolprop_id || full.split(' (')[0] || full;
    }
    return full;
  }, [selectedFluidItem, selectedFluidId, isSm]);

  return (
    <div className={`relative shrink-0 ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded-lg transition-colors shadow-2xs group cursor-pointer font-medium whitespace-nowrap ${
          isSm
            ? 'px-2 py-0.5 text-[11px] bg-white dark:bg-[#121419] hover:bg-slate-50 dark:hover:bg-[#1a1d24] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
            : 'px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-[#181b22] hover:bg-slate-200/80 dark:hover:bg-[#20242e] border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={`Refrigerante: ${selectedFluidItem?.display_name || selectedFluidId}${selectedFluidItem?.fluid_type ? ` (${selectedFluidItem.fluid_type})` : ''}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        <span className={`font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate ${
          isSm ? 'max-w-[90px] sm:max-w-[130px]' : 'max-w-[140px] sm:max-w-[180px]'
        }`}>
          {shortDisplayName}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-84 bg-white dark:bg-[#16181e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Database size={13} className="text-sky-500" />
              <span>Catálogo de Fluidos</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsAvailabilityModalOpen(true);
              }}
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
            >
              Matriz completa ({catalog?.other_available_fluids.length || 0})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar (R134a, R744, R717...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-750 focus:border-sky-500 dark:focus:border-sky-500 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {groups.map((grp) => (
              <button
                key={grp}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-all cursor-pointer ${
                  activeGroup === grp
                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                    : 'bg-slate-100 dark:bg-[#1f232b] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750 hover:text-slate-900 dark:hover:text-slate-200'
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
                  className={`p-2 rounded-lg border transition-all duration-100 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600/70 shadow-2xs'
                      : item.is_available
                      ? 'bg-slate-50/60 dark:bg-[#191c23] hover:bg-slate-100 dark:hover:bg-[#20242e] border-slate-200/80 dark:border-slate-800'
                      : 'bg-slate-50/30 dark:bg-[#14161b] border-slate-200/40 dark:border-slate-850 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {item.display_name}
                      </span>
                      {item.ashrae_safety && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono">
                          {item.ashrae_safety}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.fluid_type}
                      {item.info?.t_crit_c !== undefined && (
                        <> • Tc: {item.info.t_crit_c.toFixed(1)}°C</>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected && <Check size={14} className="text-sky-600 dark:text-sky-400" />}
                    {!item.is_available && (
                      <span title={item.notes || 'No disponible'}>
                        <AlertCircle size={13} className="text-rose-500" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">
                No se encontraron refrigerantes coincidentes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
