import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  Flame,
  Gauge,
  GripVertical,
  Plus,
  Search,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_DEFINITIONS,
} from './symbols/componentDefinitions';
import { SvgSymbol } from './symbols/SvgSymbols';
import { SchematicComponentType } from '../../types/schematic';
import { useProject } from '../../context/ProjectContext';

interface ComponentPaletteProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddComponent?: (componentType: SchematicComponentType) => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Zap':
      return <Zap size={14} className="text-amber-500" />;
    case 'Flame':
      return <Flame size={14} className="text-rose-500" />;
    case 'Gauge':
      return <Gauge size={14} className="text-sky-500" />;
    case 'Database':
      return <Database size={14} className="text-emerald-500" />;
    case 'Sliders':
      return <Sliders size={14} className="text-purple-500" />;
    case 'Eye':
      return <Eye size={14} className="text-teal-500" />;
    case 'Activity':
    default:
      return <Activity size={14} className="text-blue-500" />;
  }
};

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  isOpen,
  onToggle,
  onAddComponent,
}) => {
  const { themeMode } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleDragStart = (event: React.DragEvent, componentType: SchematicComponentType) => {
    try {
      event.dataTransfer.setData('application/reactflow-component-type', componentType);
      event.dataTransfer.setData('text/plain', componentType);
      event.dataTransfer.effectAllowed = 'copy';
    } catch (e) {}
    // Global ref fallback for Tauri / WebKit environments
    (window as any).__draggedSchematicComponent = componentType;
  };

  const handleDragEnd = () => {
    (window as any).__draggedSchematicComponent = null;
  };

  const allDefinitions = Object.values(COMPONENT_DEFINITIONS);

  const filteredComponents = searchQuery.trim()
    ? allDefinitions.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.defaultTagPrefix.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div
      className={`h-full bg-white/95 dark:bg-[#13151b]/95 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 z-20 shadow-md ${
        isOpen ? 'w-80' : 'w-10'
      }`}
    >
      {/* Palette Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Sliders size={13} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Componentes P&ID
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {allDefinitions.length} elementos HVAC/R
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          title={isOpen ? 'Contraer paleta' : 'Expandir paleta de componentes'}
        >
          {isOpen ? <ChevronDown size={14} className="-rotate-90" /> : <ChevronRight size={14} />}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar componente (ej. Scroll, TXV, Flash)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 select-none">
            {filteredComponents ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-slate-500 px-1">
                  {filteredComponents.length} resultados para &quot;{searchQuery}&quot;
                </div>
                {filteredComponents.map((def) => (
                  <div
                    key={def.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onAddComponent?.(def.type)}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#1a1d24] hover:bg-slate-100 dark:hover:bg-[#222630] border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 cursor-grab active:cursor-grabbing transition-all flex items-center gap-3 group shadow-2xs"
                    title="Arrastre al lienzo o haga clic para agregar"
                  >
                    <GripVertical size={13} className="text-slate-400 group-hover:text-sky-400 shrink-0" />
                    <div className="w-10 h-10 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-750 flex items-center justify-center p-1 shrink-0">
                      <SvgSymbol type={def.type} width={34} height={34} themeMode={themeMode} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {def.name}
                        </span>
                        <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-mono text-slate-600 dark:text-slate-400 shrink-0">
                          {def.defaultTagPrefix}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {def.description}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddComponent?.(def.type);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 transition-opacity"
                      title="Agregar al centro del lienzo"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              COMPONENT_CATEGORIES.map((cat) => {
                const isCollapsed = collapsedCategories[cat.id];
                const componentsInCat = allDefinitions.filter((c) => c.category === cat.id);

                return (
                  <div key={cat.id} className="space-y-1">
                    {/* Category Accordion Header */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.icon)}
                        <span>{cat.label}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-mono text-slate-500">
                          {componentsInCat.length}
                        </span>
                      </div>
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {/* Category Items */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 gap-1.5 pl-1.5">
                        {componentsInCat.map((def) => (
                          <div
                            key={def.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, def.type)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onAddComponent?.(def.type)}
                            className="p-2 rounded-lg bg-slate-50/70 dark:bg-[#181b22] hover:bg-slate-100 dark:hover:bg-[#20242e] border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2.5 group shadow-2xs"
                            title="Arrastre al lienzo o haga clic para agregar"
                          >
                            <GripVertical size={13} className="text-slate-400 group-hover:text-sky-400 shrink-0" />
                            <div className="w-10 h-10 rounded bg-white dark:bg-[#121419] border border-slate-200 dark:border-slate-750 flex items-center justify-center p-1 shrink-0">
                              <SvgSymbol type={def.type} width={34} height={34} themeMode={themeMode} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {def.name}
                                </span>
                                <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[8px] font-mono text-slate-600 dark:text-slate-400 shrink-0">
                                  {def.defaultTagPrefix}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {def.description}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddComponent?.(def.type);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 transition-opacity"
                              title="Agregar al centro del lienzo"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
