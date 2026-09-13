import React from 'react';
import {
  DoorClosed,
  DoorOpen,
  Flame,
  Snowflake,
  Thermometer,
} from 'lucide-react';
import { SimChamber } from '../../../types/pidSimulation';

interface ChamberMonitorCardProps {
  chamber: SimChamber;
  coolingKw: number;
  onIntervene: (action: string, targetId: string, value?: number) => void;
}

export const ChamberMonitorCard: React.FC<ChamberMonitorCardProps> = ({
  chamber,
  coolingKw,
  onIntervene,
}) => {
  const isTooWarm =
    chamber.current_air_temp_c > chamber.setpoint_temp_c + chamber.hysteresis_k / 2;

  return (
    <div className="absolute bottom-6 right-3 z-20 w-72 rounded-xl bg-white/95 dark:bg-[#12151c]/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md p-3 select-none font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded bg-sky-500/10 text-sky-500">
            <Snowflake size={14} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {chamber.name}
          </span>
        </div>

        {chamber.is_defrost_active ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white animate-pulse">
            DESESCARCHE
          </span>
        ) : isTooWarm ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
            DEMANDA FRÍO
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            EN CONSIGNA
          </span>
        )}
      </div>

      {/* Temperature Gauges */}
      <div className="grid grid-cols-2 gap-2 my-2.5 font-mono">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#181b24] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-0.5">
            <Thermometer size={11} className="text-sky-400" />
            <span>Temp. Aire</span>
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-sky-400">
            {chamber.current_air_temp_c.toFixed(1)}°C
          </span>
          <span className="text-[9px] text-slate-500 block">
            Set: {chamber.setpoint_temp_c.toFixed(1)}°C (±{(chamber.hysteresis_k / 2).toFixed(1)})
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#181b24] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-0.5">
            <Thermometer size={11} className="text-emerald-400" />
            <span>Temp. Producto</span>
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-emerald-400">
            {chamber.product_temp_c.toFixed(1)}°C
          </span>
          <span className="text-[9px] text-slate-500 block">
            Masa: {(chamber.product_mass_kg / 1000).toFixed(1)} t
          </span>
        </div>
      </div>

      {/* Heat Extraction Rate */}
      <div className="flex justify-between items-center text-[10px] font-mono p-1.5 rounded bg-slate-100 dark:bg-[#181b24] mb-2.5">
        <span className="text-slate-500">Frío Extraído:</span>
        <span className="font-bold text-slate-900 dark:text-sky-300">
          {coolingKw.toFixed(1)} kW
        </span>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
        {/* Door Toggle */}
        <button
          onClick={() => onIntervene('toggle_chamber_door', chamber.id)}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            chamber.is_door_open
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title={chamber.is_door_open ? 'Cerrar la puerta de la cámara' : 'Abrir la puerta de la cámara'}
        >
          {chamber.is_door_open ? (
            <>
              <DoorOpen size={13} />
              <span>Puerta Abierta</span>
            </>
          ) : (
            <>
              <DoorClosed size={13} />
              <span>Puerta Cerrada</span>
            </>
          )}
        </button>

        {/* Defrost Force Button */}
        <button
          onClick={() => onIntervene('trigger_defrost', chamber.id, 45.0)}
          disabled={chamber.is_defrost_active}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            chamber.is_defrost_active
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Iniciar ciclo de desescarche forzado de 45 segundos"
        >
          <Flame size={13} />
          <span>{chamber.is_defrost_active ? 'Desescarchando' : 'Desescarche'}</span>
        </button>
      </div>
    </div>
  );
};
