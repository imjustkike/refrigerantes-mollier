import React from 'react';
import { X, Activity, Flame, Snowflake, Gauge, Wind } from 'lucide-react';

export interface ComponentInfo {
  id: string;
  name: string;
  category: 'compression' | 'condensation' | 'expansion' | 'evaporation' | 'storage';
  description: string;
  thermoProcess: string;
  inputStateName?: string;
  outputStateName?: string;
  parameters: { label: string; value: string; unit?: string }[];
}

interface ComponentDetailsCardProps {
  component: ComponentInfo | null;
  onClose: () => void;
  fluidName?: string;
}

export const ComponentDetailsCard: React.FC<ComponentDetailsCardProps> = ({
  component,
  onClose,
  fluidName = 'R134a',
}) => {
  if (!component) return null;

  const getIcon = () => {
    switch (component.category) {
      case 'compression':
        return <Activity className="w-5 h-5 text-amber-500" />;
      case 'condensation':
        return <Flame className="w-5 h-5 text-rose-500" />;
      case 'expansion':
        return <Gauge className="w-5 h-5 text-amber-400" />;
      case 'evaporation':
        return <Snowflake className="w-5 h-5 text-cyan-400" />;
      case 'storage':
        return <Wind className="w-5 h-5 text-orange-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (component.category) {
      case 'compression':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'condensation':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'expansion':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'evaporation':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'storage':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
    }
  };

  return (
    <div className="absolute top-16 left-3 z-40 w-84 bg-white/95 dark:bg-[#14171f]/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 text-slate-800 dark:text-slate-100 transition-all animate-in fade-in slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {component.name}
            </h3>
            <span
              className={`inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-mono uppercase tracking-wider font-semibold rounded border ${getBadgeColor()}`}
            >
              {component.thermoProcess}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
        {component.description}
      </p>

      {/* Fluid indicator */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-[#0c0e12]/80 border border-slate-200 dark:border-slate-800">
        <span className="text-slate-500 dark:text-slate-400">Refrigerante:</span>
        <span className="font-semibold text-sky-600 dark:text-sky-400">{fluidName}</span>
      </div>

      {/* Parameters list */}
      <div className="mt-3 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Variables Termodinámicas
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {component.parameters.map((param, index) => (
            <div
              key={index}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#181c24] border border-slate-200/80 dark:border-slate-800/80 flex flex-col"
            >
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                {param.label}
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-1">
                {param.value} {param.unit && <span className="text-[10px] font-normal text-slate-400">{param.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
