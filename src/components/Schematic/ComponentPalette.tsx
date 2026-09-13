import React, { useState } from 'react';
import {
  Activity,
  Box,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Eye,
  Flame,
  Gauge,
  GitFork,
  GripVertical,
  Lightbulb,
  Pause,
  Play,
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
import { SimulationControlsBar } from './simulation/SimulationControlsBar';
import { SimulationStateResponse, ValidationReport } from '../../types/pidSimulation';

export interface ComponentPaletteProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddComponent?: (componentType: SchematicComponentType) => void;
  onStartPointerDrag?: (e: React.PointerEvent, componentType: SchematicComponentType) => void;

  // Dynamic Physical Simulation Props
  simState?: SimulationStateResponse | null;
  validationReport?: ValidationReport | null;
  simSpeed?: number;
  onStartSim?: () => void;
  onPauseSim?: () => void;
  onStepSim?: () => void;
  onResetSim?: () => void;
  onSetSpeed?: (speed: number) => void;
  onIntervene?: (action: string, targetId: string, value?: number) => void;
  onToggleCharts?: () => void;
  onToggleElectrical?: () => void;
  isElectricalOpen?: boolean;
  onSaveProject?: () => void;
  onLoadProject?: () => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Lightbulb':
      return <Lightbulb size={14} className="text-yellow-400" />;
    case 'Box':
      return <Box size={14} className="text-sky-500" />;
    case 'Cpu':
      return <Cpu size={14} className="text-amber-500" />;
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
    case 'GitFork':
      return <GitFork size={14} className="text-cyan-500" />;
    case 'Eye':
      return <Eye size={14} className="text-teal-500" />;
    case 'Activity':
    default:
      return <Activity size={14} className="text-blue-500" />;
  }
};

const ELECTRICAL_GROUPS = [
  {
    id: 'alimentacion',
    label: 'Alimentación',
    icon: '⚡',
    types: ['dc_power_source', 'power_source_ac', 'power_source_ac_3p', 'cell_dc_simple', 'battery_dc_cell'],
  },
  {
    id: 'conexiones',
    label: 'Conexiones',
    icon: '🔌',
    types: ['junction_dot_electric', 'terminal_block_electric', 'connector_plug_socket', 'neutral_terminal', 'ground_earth'],
  },
  {
    id: 'interruptores',
    label: 'Interruptores y Mandos',
    icon: '🔘',
    types: ['switch_spst', 'switch_spdt', 'pushbutton_simple', 'pushbutton_no', 'pushbutton_nc_simple', 'pushbutton_nc', 'selector_switch_rotary', 'emergency_stop_button'],
  },
  {
    id: 'protecciones',
    label: 'Protecciones',
    icon: '🛡️',
    types: ['fuse_disconnect', 'circuit_breaker_mcb', 'residual_current_device', 'switch_disconnector', 'motor_protection_switch'],
  },
  {
    id: 'reles',
    label: 'Relés y Contactores',
    icon: '🔄',
    types: ['relay_coil_auxiliary', 'contact_aux_no', 'contact_aux_nc', 'contactor_relay', 'timer_delay_on'],
  },
  {
    id: 'receptores',
    label: 'Receptores y Motores',
    icon: '💡',
    types: ['light_bulb', 'audio_speaker', 'buzzer_siren', 'electric_motor_dc', 'electric_motor_1p', 'electric_motor_3p', 'electric_heater', 'solenoid_coil'],
  },
  {
    id: 'semiconductores',
    label: 'Transistores y Electrónica',
    icon: '🎛️',
    types: ['transistor_bjt_npn', 'transistor_bjt_pnp', 'diode_led', 'resistor_fixed', 'potentiometer', 'capacitor_fixed'],
  },
  {
    id: 'transformacion',
    label: 'Transformación',
    icon: '⚙️',
    types: ['control_transformer', 'power_supply_dc_24v'],
  },
  {
    id: 'medicion',
    label: 'Medición',
    icon: '📟',
    types: ['voltmeter_basic', 'ammeter_basic', 'ohmmeter_basic', 'wattmeter_basic'],
  },
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  isOpen,
  onToggle,
  onAddComponent,
  onStartPointerDrag,
  simState = null,
  validationReport = null,
  simSpeed = 1.0,
  onStartSim,
  onPauseSim,
  onStepSim,
  onResetSim,
  onSetSpeed,
  onIntervene,
  onToggleCharts,
  onToggleElectrical,
  isElectricalOpen = true,
  onSaveProject,
  onLoadProject,
}) => {
  const { themeMode } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElectricalGroup, setSelectedElectricalGroup] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const isRunning = simState?.is_running ?? false;

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
      event.dataTransfer.setData('text', componentType);
      event.dataTransfer.effectAllowed = 'copy';
    } catch (e) {}
    // Global ref fallback for Tauri / WebKit environments
    (window as any).__draggedSchematicComponent = componentType;
  };

  const handleDragEnd = () => {
    // Keep reference briefly so onDrop has time to process in WebKit / Tauri
    setTimeout(() => {
      (window as any).__draggedSchematicComponent = null;
    }, 1000);
  };

  const allDefinitions = Object.values(COMPONENT_DEFINITIONS);

  const filteredComponents = searchQuery.trim()
    ? allDefinitions.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.defaultTagPrefix.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedElectricalGroup
    ? allDefinitions.filter((c) => {
        const group = ELECTRICAL_GROUPS.find((g) => g.id === selectedElectricalGroup);
        return group ? group.types.includes(c.type) : false;
      })
    : null;

  return (
    <div
      className={`h-full bg-white/95 dark:bg-[#13151b]/95 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 z-20 shadow-md ${
        isOpen ? 'w-[380px]' : 'w-12'
      }`}
    >
      {/* Sidepanel Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Sliders size={13} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Esquema P&ID & Simulación
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {allDefinitions.length} elementos • Motor Físico CoolProp
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Expandir panel lateral"
            >
              <ChevronRight size={15} />
            </button>
            {/* Quick Play / Pause when collapsed */}
            <button
              onClick={isRunning ? onPauseSim : onStartSim}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 animate-pulse'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
              title={isRunning ? 'Pausar simulación' : 'Iniciar simulación'}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        )}

        {isOpen && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title="Contraer panel"
          >
            <ChevronDown size={14} className="-rotate-90" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          {/* Integrated Simulation Controls Section */}
          <SimulationControlsBar
            simState={simState}
            validationReport={validationReport}
            speed={simSpeed}
            onStart={onStartSim ?? (() => {})}
            onPause={onPauseSim ?? (() => {})}
            onStep={onStepSim ?? (() => {})}
            onReset={onResetSim ?? (() => {})}
            onSetSpeed={onSetSpeed ?? (() => {})}
            onIntervene={onIntervene ?? (() => {})}
            onToggleCharts={onToggleCharts ?? (() => {})}
            onToggleElectrical={onToggleElectrical ?? (() => {})}
            isElectricalOpen={isElectricalOpen}
            onSaveProject={onSaveProject ?? (() => {})}
            onLoadProject={onLoadProject ?? (() => {})}
          />

          {/* Search Bar & Group Filter Pills */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar componente (ej. Scroll, Bombilla, Voltímetro)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-750 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Quick Filter Pills for Electrical Groups */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[9.5px]">
              <button
                type="button"
                onClick={() => setSelectedElectricalGroup(null)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer font-medium ${
                  selectedElectricalGroup === null && !searchQuery
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos
              </button>
              {ELECTRICAL_GROUPS.map((grp) => {
                const isSel = selectedElectricalGroup === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      setSelectedElectricalGroup(isSel ? null : grp.id);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer flex items-center gap-1 font-medium ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{grp.icon}</span>
                    <span>{grp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 select-none">
            {filteredComponents ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-slate-500 px-1">
                  {searchQuery
                    ? `${filteredComponents.length} resultados para "${searchQuery}"`
                    : `Grupo: ${
                        ELECTRICAL_GROUPS.find((g) => g.id === selectedElectricalGroup)?.label
                      } (${filteredComponents.length} componentes)`}
                </div>
                {filteredComponents.map((def) => (
                  <div
                    key={def.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onDragEnd={handleDragEnd}
                    onPointerDown={(e) => onStartPointerDrag?.(e, def.type)}
                    onClick={() => onAddComponent?.(def.type)}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#1a1d24] hover:bg-slate-100 dark:hover:bg-[#222630] border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 cursor-grab active:cursor-grabbing transition-all flex items-center gap-3 group shadow-2xs touch-none"
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
                            onPointerDown={(e) => onStartPointerDrag?.(e, def.type)}
                            onClick={() => onAddComponent?.(def.type)}
                            className="p-2 rounded-lg bg-slate-50/70 dark:bg-[#181b22] hover:bg-slate-100 dark:hover:bg-[#20242e] border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2.5 group shadow-2xs touch-none"
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
