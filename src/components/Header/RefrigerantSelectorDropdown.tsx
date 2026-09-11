import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown, Check, Search, AlertCircle, Database, X, RotateCcw } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { RefrigerantGroup } from '../../types/thermo';

interface RefrigerantSelectorDropdownProps {
  className?: string;
  size?: 'sm' | 'md';
}

const normalizeText = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s_]/g, '');
};

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

  // Close dropdown on click outside or on escape
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const items = catalog?.priority_items || [];
    if (items.length === 0) return [];

    const normQuery = normalizeText(search);

    return items.filter((item) => {
      const matchesGroup = activeGroup === 'Todos' || item.group === activeGroup;
      if (!matchesGroup) return false;
      if (!normQuery) return true;

      const normName = normalizeText(item.display_name || '');
      const normId = normalizeText(item.coolprop_id || '');
      const aliases = Array.isArray(item.aliases) ? item.aliases : [];
      const matchesAlias = aliases.some((a) => normalizeText(a).includes(normQuery));

      return normName.includes(normQuery) || normId.includes(normQuery) || matchesAlias;
    });
  }, [catalog, activeGroup, search]);

  const handleSelect = (coolpropId: string, isAvailable: boolean, notes?: string) => {
    if (!isAvailable) {
      showToast(notes || 'Refrigerante no disponible en CoolProp');
      return;
    }
    setSelectedFluidId(coolpropId);
    setIsOpen(false);
    setSearch('');
  };

  const isSm = size === 'sm';

  const shortDisplayName = useMemo(() => {
    const full = selectedFluidItem?.display_name || selectedFluidId;
    if (isSm) {
      return selectedFluidItem?.coolprop_id || full.split(' (')[0] || full;
    }
    return full;
  }, [selectedFluidItem, selectedFluidId, isSm]);

  return (
    <div className={`relative shrink-0 ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded-lg transition-colors shadow-2xs group cursor-pointer font-medium whitespace-nowrap ${
          isSm
            ? 'px-2 py-0.5 text-[11px] bg-white dark:bg-[#121419] hover:bg-slate-50 dark:hover:bg-[#1a1d24] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
            : 'px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-[#181b22] hover:bg-slate-200/80 dark:hover:bg-[#20242e] border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={`Refrigerante: ${selectedFluidItem?.display_name || selectedFluidId}${selectedFluidItem?.fluid_type ? ` (${selectedFluidItem.fluid_type})` : ''}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        <span
          className={`font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate ${
            isSm ? 'max-w-[90px] sm:max-w-[130px]' : 'max-w-[140px] sm:max-w-[180px]'
          }`}
        >
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
        <div className="absolute right-0 top-full mt-1.5 w-88 max-w-[90vw] bg-white dark:bg-[#16181e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Database size={13} className="text-sky-500" />
              <span>Catálogo de Fluidos</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({filteredItems.length}/{catalog?.priority_items.length || 0})
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAvailabilityModalOpen(true);
              }}
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
            >
              Matriz ({catalog?.other_available_fluids.length || 0})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar (R134a, R744, R717, Amoníaco...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-750 focus:border-sky-500 dark:focus:border-sky-500 rounded-md pl-8 pr-7 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {groups.map((grp) => (
              <button
                key={grp}
                type="button"
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
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {item.display_name}
                      </span>
                      {item.ashrae_safety && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono shrink-0">
                          {item.ashrae_safety}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {item.fluid_type}
                      {item.info?.t_crit_c !== undefined && (
                        <> • Tc: {item.info.t_crit_c.toFixed(1)}°C</>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <span className="text-xs text-slate-500 font-mono">
                  No se encontraron refrigerantes coincidentes
                </span>
                {(search || activeGroup !== 'Todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setActiveGroup('Todos');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Mostrar todos</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
