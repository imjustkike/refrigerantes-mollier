import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Power,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { ElectricalPanelState } from '../../../types/pidSimulation';

interface ElectricalPanelProps {
  panelState: ElectricalPanelState | null;
  onIntervene: (action: string, targetId: string, value?: number) => void;
}

export const ElectricalPanel: React.FC<ElectricalPanelProps> = ({
  panelState,
  onIntervene,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!panelState) return null;

  const maxPower = 25.0; // kW límite
  const powerPercent = Math.min((panelState.total_active_power_kw / maxPower) * 100, 100);

  return (
    <div className="absolute top-16 right-3 z-20 w-80 rounded-xl bg-white/95 dark:bg-[#12151c]/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden select-none transition-all duration-200 font-sans">
      {/* Header */}
      <div
        className="flex items-center justify-between p-2.5 px-3 bg-slate-100/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Zap size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Cuadro Eléctrico & Demanda
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              3~ 400V • 50 Hz
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {panelState.is_demand_limit_exceeded && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white animate-pulse">
              kW LÍMITE
            </span>
          )}
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Main Power Metrics */}
          <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#181b24] border border-slate-200 dark:border-slate-800 font-mono">
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-tight block">Potencia Activa</span>
              <span className="text-base font-black text-slate-900 dark:text-sky-400">
                {panelState.total_active_power_kw.toFixed(2)} <span className="text-[10px] text-slate-400 font-sans">kW</span>
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-tight block">Energía Total</span>
              <span className="text-base font-black text-slate-900 dark:text-emerald-400">
                {panelState.total_energy_kwh.toFixed(3)} <span className="text-[10px] text-slate-400 font-sans">kWh</span>
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200 dark:border-slate-750">
              <span className="text-[9px] text-slate-400 uppercase tracking-tight block">Demanda Pico</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {panelState.peak_demand_kw.toFixed(2)} kW
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200 dark:border-slate-750">
              <span className="text-[9px] text-slate-400 uppercase tracking-tight block">Factor Potencia</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                cos φ {panelState.power_factor.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Demand Limit Bar */}
          <div>
            <div className="flex justify-between items-center text-[10px] mb-1 font-mono">
              <span className="text-slate-500">Demanda / Límite Contratado:</span>
              <span className={panelState.is_demand_limit_exceeded ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                {panelState.total_active_power_kw.toFixed(1)} / 20.0 kW
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  panelState.is_demand_limit_exceeded
                    ? 'bg-rose-500'
                    : powerPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                }`}
                style={{ width: `${powerPercent}%` }}
              />
            </div>
          </div>

          {/* Phase Currents */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#181b24] border border-slate-200 dark:border-slate-800 font-mono text-center">
            <span className="text-[9px] text-slate-400 uppercase tracking-tight block mb-1">
              Intensidad Trifásica por Fase
            </span>
            <div className="grid grid-cols-3 gap-1">
              <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                <span className="text-[9px] text-slate-400 block">Fase R</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {panelState.current_phase_r_a.toFixed(1)} A
                </span>
              </div>
              <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                <span className="text-[9px] text-slate-400 block">Fase S</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {panelState.current_phase_s_a.toFixed(1)} A
                </span>
              </div>
              <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                <span className="text-[9px] text-slate-400 block">Fase T</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {panelState.current_phase_t_a.toFixed(1)} A
                </span>
              </div>
            </div>
          </div>

          {/* Breakers & Protections List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono px-1">
              <span>Disyuntores y Protecciones</span>
              <span>Memoria I²t</span>
            </div>

            {panelState.breakers.map((breaker) => {
              const thermalPercent = Math.round(breaker.thermal_memory * 100);
              const isLocked = breaker.thermal_memory >= 0.7 && !breaker.is_closed;

              return (
                <div
                  key={breaker.id}
                  className={`p-2 rounded-lg border transition-all ${
                    !breaker.is_closed
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      : 'bg-white dark:bg-[#151821] border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {breaker.tag}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {breaker.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        {breaker.rated_current_a}A
                      </span>

                      {/* Manual Toggle / Reset Button */}
                      <button
                        onClick={() => onIntervene('toggle_breaker', breaker.id)}
                        disabled={isLocked}
                        className={`p-1 px-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          breaker.is_closed
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30'
                            : isLocked
                            ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                        }`}
                        title={
                          isLocked
                            ? 'Bloqueo térmico: espere enfriamiento antes de rearmar'
                            : breaker.is_closed
                            ? 'Haga clic para abrir el disyuntor manualmente'
                            : 'Haga clic para rearmar el disyuntor'
                        }
                      >
                        {breaker.is_closed ? (
                          <>
                            <Power size={11} />
                            <span>ON</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw size={11} />
                            <span>REARME</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Thermal Memory Gauge */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${
                          thermalPercent >= 90
                            ? 'bg-rose-500'
                            : thermalPercent >= 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(thermalPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">
                      {thermalPercent}%
                    </span>
                  </div>

                  {/* Trip reason warning */}
                  {breaker.trip_reason && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-rose-500 font-mono">
                      <AlertTriangle size={10} className="shrink-0" />
                      <span className="truncate">{breaker.trip_reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
