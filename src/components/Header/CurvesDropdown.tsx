import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Eye, EyeOff, Layers, Sliders } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const CurvesDropdown: React.FC = () => {
  const { curveVisibility, setCurveVisibility, diagramCurves } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggle = (key: keyof typeof curveVisibility) => {
    setCurveVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const curveItems = [
    {
      key: 'saturation' as const,
      label: 'Campana de Saturación',
      desc: 'Líquido y Vapor saturado',
      color: '#38bdf8',
      count: 2,
    },
    {
      key: 'isotherms' as const,
      label: 'Isotermas (T = cte)',
      desc: 'Temperatura constante (°C)',
      color: '#f87171',
      count: diagramCurves?.isotherms.length || 0,
    },
    {
      key: 'isentropics' as const,
      label: 'Isentrópicas (s = cte)',
      desc: 'Entropía constante (kJ/(kg·K))',
      color: '#fbbf24',
      count: diagramCurves?.isentropics.length || 0,
    },
    {
      key: 'isochores' as const,
      label: 'Isócoras (v = cte)',
      desc: 'Volumen específico (m³/kg)',
      color: '#c084fc',
      count: diagramCurves?.isochores.length || 0,
    },
    {
      key: 'qualityLines' as const,
      label: 'Título de Vapor (x)',
      desc: 'Líneas bifásicas x = 0.1 a 0.9',
      color: '#34d399',
      count: diagramCurves?.quality_lines.length || 0,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/60 rounded-xl transition-all duration-200 shadow-sm text-xs font-semibold text-slate-200 hover:text-white"
        title="Visualización de curvas termodinámicas"
      >
        <Layers size={14} className="text-cyan-400" />
        <span>Curvas</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 z-50 backdrop-blur-2xl p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders size={13} className="text-cyan-400" />
              <span>Curvas Termodinámicas</span>
            </span>
            <button
              onClick={() => toggle('showCurveLabels')}
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border transition-colors ${
                curveVisibility.showCurveLabels
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/40'
                  : 'bg-slate-950/60 text-slate-500 border-slate-800'
              }`}
            >
              Rótulos: {curveVisibility.showCurveLabels ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {curveItems.map((item) => {
              const isActive = curveVisibility[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                      : 'bg-slate-950/40 border-slate-850 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ background: item.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <Eye size={14} className="text-cyan-400 shrink-0" />
                  ) : (
                    <EyeOff size={14} className="text-slate-500 shrink-0" />
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
