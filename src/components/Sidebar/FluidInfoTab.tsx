import React from 'react';
import { useProject } from '../../context/ProjectContext';

export const FluidInfoTab: React.FC = () => {
  const { selectedFluidItem, fluidInfo, selectedFluidId } = useProject();

  return (
    <div className="flex flex-col gap-3.5">
      {/* Fluid Header Card */}
      <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-md">
        <div className="text-sm font-bold text-white tracking-tight">
          {selectedFluidItem?.display_name || selectedFluidId}
        </div>
        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
          ID CoolProp: <span className="text-cyan-400">{selectedFluidId}</span>
        </div>
        <div className="text-[11px] text-cyan-400 font-medium mt-1">
          {selectedFluidItem?.fluid_type}
        </div>
      </div>

      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        Límites y Parámetros Termodinámicos
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Temp. Crítica (Tc)</span>
          <span className="text-xs font-bold font-mono text-cyan-400 mt-0.5">
            {fluidInfo?.t_crit_c !== undefined && fluidInfo?.t_crit_c !== null
              ? `${fluidInfo.t_crit_c.toFixed(2)} °C`
              : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Presión Crítica (Pc)</span>
          <span className="text-xs font-bold font-mono text-cyan-400 mt-0.5">
            {fluidInfo?.p_crit_bar !== undefined && fluidInfo?.p_crit_bar !== null
              ? `${fluidInfo.p_crit_bar.toFixed(2)} bar(a)`
              : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Entalpía Crítica (hc)</span>
          <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
            {fluidInfo?.h_crit_kj_kg !== undefined && fluidInfo?.h_crit_kj_kg !== null
              ? `${fluidInfo.h_crit_kj_kg.toFixed(1)} kJ/kg`
              : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Punto Triple / Tmin</span>
          <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
            {fluidInfo?.t_triple_c !== undefined && fluidInfo?.t_triple_c !== null
              ? `${fluidInfo.t_triple_c.toFixed(1)} °C`
              : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Masa Molar</span>
          <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
            {fluidInfo?.molar_mass_kg_mol
              ? `${(fluidInfo.molar_mass_kg_mol * 1000).toFixed(2)} g/mol`
              : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Presión Mínima</span>
          <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
            {fluidInfo?.p_min_bar !== undefined && fluidInfo?.p_min_bar !== null
              ? `${fluidInfo.p_min_bar.toFixed(3)} bar(a)`
              : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Seguridad ASHRAE</span>
          <span className="text-xs font-bold font-mono text-amber-400 mt-0.5">
            {selectedFluidItem?.ashrae_safety || 'No clasificado'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col">
          <span className="text-[10px] text-slate-400">Potencial Calent. (GWP)</span>
          <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
            {selectedFluidItem?.gwp !== undefined && selectedFluidItem?.gwp !== null
              ? selectedFluidItem.gwp
              : 'N/A'}
          </span>
        </div>
      </div>

      <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
        <strong className="text-slate-200">Estado de Referencia:</strong> {fluidInfo?.reference_state || 'IIR (h=200 kJ/kg, s=1.0 kJ/(kg·K) a 0°C saturado)'}
      </div>
    </div>
  );
};
