import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  ChevronDown,
  Droplet,
  FolderOpen,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  SkipForward,
  Zap,
} from 'lucide-react';
import { SimulationStateResponse, ValidationReport } from '../../../types/pidSimulation';

export interface SimulationControlsBarProps {
  simState: SimulationStateResponse | null;
  validationReport: ValidationReport | null;
  speed: number;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onIntervene: (action: string, targetId: string, value?: number) => void;
  onToggleCharts: () => void;
  onToggleElectrical: () => void;
  isElectricalOpen?: boolean;
  onSaveProject: () => void;
  onLoadProject: () => void;
}

export const SimulationControlsBar: React.FC<SimulationControlsBarProps> = ({
  simState,
  validationReport,
  speed,
  onStart,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
  onIntervene,
  onToggleCharts,
  onToggleElectrical,
  isElectricalOpen = true,
  onSaveProject,
  onLoadProject,
}) => {
  const [isLeakExpanded, setIsLeakExpanded] = useState(false);

  const formatSimTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRunning = simState?.is_running ?? false;
  const timeFormatted = formatSimTime(simState?.sim_time_s ?? 0);
  const currentCharge = simState?.current_charge_kg ?? 18.0;
  const leakRate = simState?.leak_rate_kg_h ?? 0.0;
  const activeAlarmsCount = simState?.active_alarms?.length ?? 0;

  return (
    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#151820]/90 space-y-2.5 font-sans select-none">
      {/* Section Header & Clock / Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          <span className="text-sky-500">⏱</span>
          <span>{timeFormatted}</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold">
            {speed}x
          </span>
        </div>

        {/* State Badge */}
        {activeAlarmsCount > 0 ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-500 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {activeAlarmsCount} ALARMAS
          </span>
        ) : isRunning ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            SIMULACIÓN ACTIVA
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
            EN REPOSO
          </span>
        )}
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Play / Pause Toggle */}
        <button
          onClick={isRunning ? onPause : onStart}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
          }`}
          title={isRunning ? 'Pausar simulación física' : 'Iniciar simulación física'}
        >
          {isRunning ? (
            <>
              <Pause size={14} />
              <span>Pausar Simulación</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Simular Instalación</span>
            </>
          )}
        </button>

        {/* Step Button */}
        <button
          onClick={onStep}
          disabled={isRunning}
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Paso único de simulación (0.5 s)"
        >
          <SkipForward size={14} />
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-colors cursor-pointer"
          title="Reiniciar simulación a condiciones iniciales"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center justify-between gap-1 p-1 bg-white/70 dark:bg-[#111318]/70 rounded-lg border border-slate-200 dark:border-slate-800">
        <span className="text-[10px] text-slate-400 font-medium px-1">Velocidad:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 5, 10, 30].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                speed === spd
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* View Quick Toggles (Electrical Panel & Live Charts) */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={onToggleElectrical}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isElectricalOpen
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'bg-white dark:bg-[#14161d] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Mostrar u ocultar el panel del cuadro eléctrico"
        >
          <Zap size={13} className={isElectricalOpen ? 'text-amber-500' : 'text-slate-400'} />
          <span>Cuadro Eléctrico</span>
        </button>

        <button
          onClick={onToggleCharts}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#14161d] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="Abrir gráficas de evolución temporal"
        >
          <BarChart2 size={13} className="text-sky-500" />
          <span>Gráficas en Vivo</span>
        </button>
      </div>

      {/* Collapsible Refrigerant Charge & Leak Controls */}
      <div className="rounded-lg bg-white dark:bg-[#14161d] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsLeakExpanded(!isLeakExpanded)}
          className="w-full flex items-center justify-between p-2 text-xs font-mono transition-colors hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Droplet size={13} className={leakRate > 0 ? 'text-rose-500 animate-bounce' : 'text-sky-500'} />
            <span className="text-slate-700 dark:text-slate-300">Carga: {currentCharge.toFixed(1)} kg</span>
          </div>
          <div className="flex items-center gap-1">
            {leakRate > 0 && (
              <span className="text-[9px] font-bold text-rose-500 bg-rose-500/15 px-1 rounded">
                -{leakRate} kg/h
              </span>
            )}
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${isLeakExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isLeakExpanded && (
          <div className="p-2 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            {/* Service Bottle */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-medium">Botella de Servicio:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onIntervene('add_refrigerant_charge', 'circuit', 1.0)}
                  className="flex items-center justify-center gap-1 p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-[11px] font-bold cursor-pointer"
                >
                  <Plus size={11} />
                  <span>+1.0 kg Recarga</span>
                </button>
                <button
                  type="button"
                  onClick={() => onIntervene('add_refrigerant_charge', 'circuit', -1.0)}
                  className="flex items-center justify-center gap-1 p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold cursor-pointer"
                >
                  <Minus size={11} />
                  <span>-1.0 kg Purga</span>
                </button>
              </div>
            </div>

            {/* Leak Injection */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-medium">Simular Fuga Activa:</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: '0 (Estanca)', val: 0.0 },
                  { label: '1.2 kg/h', val: 1.2 },
                  { label: '4.5 kg/h', val: 4.5 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onIntervene('set_leak_rate', 'circuit', item.val)}
                    className={`p-1 rounded text-[10px] font-mono font-bold cursor-pointer border transition-colors ${
                      leakRate === item.val
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project File Storage Actions */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={onSaveProject}
          className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          title="Guardar esquema y simulación en archivo (.pid.json)"
        >
          <Save size={12} />
          <span>Guardar .pid</span>
        </button>

        <button
          type="button"
          onClick={onLoadProject}
          className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          title="Cargar esquema desde archivo (.pid.json)"
        >
          <FolderOpen size={12} />
          <span>Cargar .pid</span>
        </button>
      </div>

      {/* Pre-start Validation Report Notice */}
      {validationReport && !validationReport.is_valid && (
        <div
          className="flex items-start gap-1.5 p-2 rounded-lg text-xs bg-rose-500/10 text-rose-500 border border-rose-500/30"
          title={validationReport.issues.map((i) => i.message).join('\n')}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold block">No se puede arrancar:</span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-2">
              {validationReport.issues[0]?.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
