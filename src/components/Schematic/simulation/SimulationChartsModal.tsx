import React from 'react';
import { X, Activity } from 'lucide-react';
import { SimulationHistoryPoint } from '../../../types/pidSimulation';

interface SimulationChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SimulationHistoryPoint[];
}

export const SimulationChartsModal: React.FC<SimulationChartsModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  if (!isOpen) return null;

  const width = 580;
  const height = 110;
  const padding = 25;

  const renderSvgLine = (
    data: { x: number; y: number }[],
    minY: number,
    maxY: number,
    color: string
  ) => {
    if (data.length < 2) return null;
    const minX = data[0].x;
    const maxX = data[data.length - 1].x || minX + 1;
    const rangeY = (maxY - minY) || 1;

    const points = data
      .map((d) => {
        const px = padding + ((d.x - minX) / (maxX - minX)) * (width - 2 * padding);
        const py = height - padding - ((d.y - minY) / rangeY) * (height - 2 * padding);
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(' ');

    return (
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    );
  };

  // 1. Datos de Presiones
  const pSuction = history.map((h) => ({ x: h.time_s, y: h.suction_pressure_bar }));
  const pDischarge = history.map((h) => ({ x: h.time_s, y: h.discharge_pressure_bar }));

  // 2. Datos de Temperaturas
  const tAir = history.map((h) => ({ x: h.time_s, y: h.chamber_air_temp_c }));
  const tProd = history.map((h) => ({ x: h.time_s, y: h.chamber_product_temp_c }));

  // 3. Datos de Potencias
  const pElec = history.map((h) => ({ x: h.time_s, y: h.total_power_kw }));
  const qCool = history.map((h) => ({ x: h.time_s, y: h.cooling_capacity_kw }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none font-sans">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161a24]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-sky-500/10 text-sky-500">
              <Activity size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Evolución Dinámica en Tiempo Real
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                Presiones, Temperaturas, Potencia y Demanda
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Charts Body */}
        <div className="p-4 space-y-4 overflow-y-auto font-mono text-xs">
          {history.length < 2 ? (
            <div className="p-8 text-center text-slate-400 font-sans">
              Inicie la simulación para acumular datos y visualizar curvas temporales.
            </div>
          ) : (
            <>
              {/* Chart 1: Presiones */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161922] border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Presiones del Circuito (bar)
                  </span>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-rose-500 font-bold">
                      Descarga: {history[history.length - 1].discharge_pressure_bar.toFixed(2)} bar
                    </span>
                    <span className="text-sky-500 font-bold">
                      Aspiración: {history[history.length - 1].suction_pressure_bar.toFixed(2)} bar
                    </span>
                  </div>
                </div>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                  {renderSvgLine(pDischarge, 0, 25, '#ef4444')}
                  {renderSvgLine(pSuction, 0, 25, '#0284c7')}
                </svg>
              </div>

              {/* Chart 2: Temperaturas */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161922] border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Temperaturas de Cámara (°C)
                  </span>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-sky-400 font-bold">
                      Aire: {history[history.length - 1].chamber_air_temp_c.toFixed(1)}°C
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Producto: {history[history.length - 1].chamber_product_temp_c.toFixed(1)}°C
                    </span>
                  </div>
                </div>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                  {renderSvgLine(tAir, -10, 25, '#38bdf8')}
                  {renderSvgLine(tProd, -10, 25, '#10b981')}
                </svg>
              </div>

              {/* Chart 3: Potencias */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161922] border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Potencias (kW)
                  </span>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-amber-500 font-bold">
                      Eléctrica: {history[history.length - 1].total_power_kw.toFixed(2)} kW
                    </span>
                    <span className="text-sky-500 font-bold">
                      Frigorífica: {history[history.length - 1].cooling_capacity_kw.toFixed(2)} kW
                    </span>
                  </div>
                </div>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                  {renderSvgLine(pElec, 0, 25, '#f59e0b')}
                  {renderSvgLine(qCool, 0, 25, '#0284c7')}
                </svg>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
