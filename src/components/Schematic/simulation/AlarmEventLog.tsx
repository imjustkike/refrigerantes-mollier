import React, { useState } from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { SimEventLogItem } from '../../../types/pidSimulation';

interface AlarmEventLogProps {
  alarms: SimEventLogItem[];
  onIntervene: (action: string, targetId: string, value?: number) => void;
}

export const AlarmEventLog: React.FC<AlarmEventLogProps> = ({
  alarms,
  onIntervene,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (alarms.length === 0) return null;

  const latest = alarms[alarms.length - 1];

  return (
    <div className="absolute bottom-6 left-3 z-30 font-sans select-none">
      {/* Collapsed Warning Toast */}
      {!isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white shadow-xl backdrop-blur-md cursor-pointer transition-all animate-bounce"
        >
          <AlertCircle size={15} />
          <span className="text-xs font-bold font-mono">
            {alarms.length} {alarms.length === 1 ? 'ALERTA ACTIVA' : 'ALERTAS ACTIVAS'}
          </span>
          <span className="text-[11px] opacity-90 truncate max-w-[200px]">
            {latest.message}
          </span>
        </div>
      ) : (
        /* Expanded Alarms Drawer */
        <div className="w-96 rounded-2xl bg-white/95 dark:bg-[#12151d]/95 border border-rose-500/40 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between p-2.5 px-3 bg-rose-500/10 border-b border-rose-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-rose-500 text-white">
                <AlertCircle size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-500">
                  Registro de Alarmas & Eventos
                </h4>
                <span className="text-[9px] text-slate-400 font-mono">
                  {alarms.length} eventos registrados
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-2 space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
            {alarms.slice(-5).reverse().map((alarm, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#181b24] border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-rose-500">
                    [{alarm.source_tag}] {alarm.level}
                  </span>
                  <span className="text-slate-400">{alarm.formatted_time}</span>
                </div>
                <p className="text-[11px] text-slate-800 dark:text-slate-200 font-sans leading-tight">
                  {alarm.message}
                </p>
                {alarm.reset_condition && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-750 text-[10px]">
                    <span className="text-slate-400 truncate max-w-[220px]">
                      {alarm.reset_condition}
                    </span>
                    {alarm.source_tag === 'HP-01' && (
                      <button
                        onClick={() => onIntervene('reset_hp_switch', 'ps_hp')}
                        className="px-1.5 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-bold text-[9px] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        <span>REARMAR</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
