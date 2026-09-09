import React, { useState } from 'react';
import {
  Activity,
  Flame,
  Gauge,
  Scale,
  Snowflake,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { CycleCalculationResult } from '../../utils/cycleCalculations';
import { formatSpecificVolume } from '../../utils/formatters';

interface CycleEnergyBalanceCardProps {
  metrics: CycleCalculationResult;
  fluidName: string;
}

export const CycleEnergyBalanceCard: React.FC<CycleEnergyBalanceCardProps> = ({
  metrics,
  fluidName,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formattedV3 = formatSpecificVolume(metrics.v3_suction_m3_kg);
  const formattedV4 = formatSpecificVolume(metrics.v4_discharge_m3_kg);
  const formattedDeltaV = formatSpecificVolume(metrics.delta_v_m3_kg);

  // Percentages for the stacked energy bar
  const totalBar = Math.max(0.1, metrics.energy_in_kj_kg, metrics.energy_out_kj_kg);
  const qEvapPercent = (metrics.q_evap_kj_kg / totalBar) * 100;
  const wCompPercent = (metrics.w_comp_kj_kg / totalBar) * 100;

  return (
    <div className="absolute top-3 right-3 z-30 w-84 sm:w-96 bg-white/95 dark:bg-[#13161f]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-200 select-none">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-slate-50/90 dark:bg-[#171a24]/90 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Scale size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Balance Energético y Ciclo</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {fluidName}
              </span>
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5 font-mono">
              P₀ (P₃) = {metrics.p_evap_bar.toFixed(2)} bar • Pₖ (P₄) = {metrics.p_cond_bar.toFixed(2)} bar
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isExpanded ? 'Minimizar tarjeta' : 'Expandir balance completo'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Main KPIs Bar (Always Visible) */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-[#13161f] border-b border-slate-200 dark:border-slate-800/80">
        {/* COP */}
        <div className="p-2.5 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              COP
            </span>
            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded">
              Frío
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.cop.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              (H: {metrics.cop_heat.toFixed(2)})
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
            (h₃-h₁) / (h₄-h₃)
          </span>
        </div>

        {/* Relación de Compresión */}
        <div className="p-2.5 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Relación r_c
            </span>
            <Gauge size={11} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.compression_ratio.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">: 1</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
            P₄ / P₃
          </span>
        </div>

        {/* Variación de Volumen Específico */}
        <div className="p-2.5 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Δv Compresión
            </span>
            <TrendingDown size={11} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold font-mono text-sky-600 dark:text-sky-400 truncate" title={formattedDeltaV.tooltip}>
              {formattedDeltaV.display}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5">
            |v₃ - v₄| ({metrics.v_ratio.toFixed(2)}×)
          </span>
        </div>
      </div>

      {/* Expanded Content: Enthalpies & Global Energy Balance */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 bg-slate-50/50 dark:bg-[#13161f]/50">
          {/* Thermal Energies Grid (q_evap, w_comp, q_cond) */}
          <div className="grid grid-cols-3 gap-2">
            {/* q_evap */}
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col">
              <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 mb-0.5">
                <Snowflake size={11} />
                <span className="text-[10px] font-bold uppercase">q_evap</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                {metrics.q_evap_kj_kg.toFixed(1)}{' '}
                <span className="text-[9px] font-normal text-slate-500">kJ/kg</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                h₃ - h₁
              </span>
            </div>

            {/* w_comp */}
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5">
                <Activity size={11} />
                <span className="text-[10px] font-bold uppercase">w_comp</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                {metrics.w_comp_kj_kg.toFixed(1)}{' '}
                <span className="text-[9px] font-normal text-slate-500">kJ/kg</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                h₄ - h₃
              </span>
            </div>

            {/* q_cond */}
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col">
              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-0.5">
                <Flame size={11} />
                <span className="text-[10px] font-bold uppercase">q_cond</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                {metrics.q_cond_kj_kg.toFixed(1)}{' '}
                <span className="text-[9px] font-normal text-slate-500">kJ/kg</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                h₄ - h₆
              </span>
            </div>
          </div>

          {/* Specific Volume Transition Detail (v3 -> v4) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#171a24] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Variación de Volumen Específico (v)
              </span>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                Δv = {formattedDeltaV.display}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono gap-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400">v₃ (Aspiración):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200" title={formattedV3.tooltip}>
                  {formattedV3.display}
                </span>
              </div>
              <ArrowRight size={13} className="text-slate-400 shrink-0 mx-1" />
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-slate-400">v₄ (Descarga):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200" title={formattedV4.tooltip}>
                  {formattedV4.display}
                </span>
              </div>
            </div>
          </div>

          {/* Global Energy Balance Card */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#171a24] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Zap size={11} className="text-amber-500" />
                Balance Energético Global
              </span>
              {metrics.is_balanced ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                  <CheckCircle2 size={10} /> 100% Equilibrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                  <AlertTriangle size={10} /> Δ = {metrics.energy_balance_err_kj_kg.toFixed(2)} kJ/kg
                </span>
              )}
            </div>

            {/* Balance Equation Representation: (h3-h1) + (h4-h3) = (h4-h6) */}
            <div className="p-2 rounded-lg bg-slate-100/80 dark:bg-[#0f1118]/80 text-[11px] font-mono flex items-center justify-between border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-1">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold" title="q_evap = h3 - h1">
                  {metrics.q_evap_kj_kg.toFixed(1)}
                </span>
                <span className="text-slate-400">+</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold" title="w_comp = h4 - h3">
                  {metrics.w_comp_kj_kg.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-400 font-bold">=</span>
              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold" title="q_cond = h4 - h6">
                <span>{metrics.q_cond_kj_kg.toFixed(1)}</span>
                <span className="text-[9px] font-normal text-slate-500">kJ/kg</span>
              </div>
            </div>

            {/* Visual Dual Energy Comparison Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Energía Entrante (q_evap + w_comp): {metrics.energy_in_kj_kg.toFixed(1)}</span>
                <span>Calor Disipado (q_cond): {metrics.energy_out_kj_kg.toFixed(1)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${qEvapPercent}%` }}
                  title={`q_evap (h3 - h1): ${metrics.q_evap_kj_kg.toFixed(1)} kJ/kg`}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${wCompPercent}%` }}
                  title={`w_comp (h4 - h3): ${metrics.w_comp_kj_kg.toFixed(1)} kJ/kg`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
