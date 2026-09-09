import React from 'react';
import {
  Activity,
  CheckCircle2,
  FilePlus2,
  Flame,
  LayoutGrid,
  Repeat,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { SCHEMATIC_PRESETS } from './templates/schematicTemplates';

interface NewSchematicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string) => void;
  onSelectBlank: () => void;
}

export const NewSchematicModal: React.FC<NewSchematicModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onSelectBlank,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="text-amber-500" size={20} />;
      case 'Flame':
        return <Flame className="text-emerald-500" size={20} />;
      case 'Repeat':
        return <Repeat className="text-purple-500" size={20} />;
      case 'Activity':
      default:
        return <Activity className="text-sky-500" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#181c26]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Crear Nuevo Esquema Frigorífico
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccione qué esquema básico desea crear o comience con un lienzo en blanco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Presets Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section: Plantillas Básicas y Recomendadas */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              <LayoutGrid size={14} />
              <span>Esquemas Básicos e Instalaciones</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Blank Canvas */}
              <div
                onClick={() => {
                  onSelectBlank();
                  onClose();
                }}
                className="group relative p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-[#1a1e2a]/50 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="p-2 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <FilePlus2 size={18} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Lienzo Limpio
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                    Lienzo en Blanco (Desde Cero)
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Comience con el espacio de trabajo completamente vacío para diseñar su propio circuito arrastrando componentes libremente.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <span>Crear esquema vacío</span>
                  <CheckCircle2 size={15} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Presets List */}
              {SCHEMATIC_PRESETS.map((preset) => {
                const isDanfoss = preset.id === 'preset_danfoss_basic';
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset.id);
                      onClose();
                    }}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isDanfoss
                        ? 'border-sky-500/50 dark:border-sky-500/40 bg-sky-500/[0.03] dark:bg-sky-500/[0.06] hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-[#1a1e2a] hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-500 group-hover:scale-105 transition-transform">
                          {getIcon(preset.iconName)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isDanfoss && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-xs">
                              Clásico Danfoss
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {preset.refrigerant}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                        {preset.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {preset.description}
                      </p>

                      {/* Component count badge preview */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {preset.nodes.slice(0, 5).map((node) => (
                          <span
                            key={node.id}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400"
                          >
                            {node.data.label}
                          </span>
                        ))}
                        {preset.nodes.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                            +{preset.nodes.length - 5} más
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                      <span>Cargar este esquema</span>
                      <CheckCircle2 size={15} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#181c26]/50 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
