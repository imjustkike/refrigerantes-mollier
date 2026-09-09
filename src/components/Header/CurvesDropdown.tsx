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
      color: '#0284c7',
      count: 2,
    },
    {
      key: 'isotherms' as const,
      label: 'Isotermas (T = cte)',
      desc: 'Temperatura constante (°C)',
      color: '#ef4444',
      count: diagramCurves?.isotherms.length || 0,
    },
    {
      key: 'isentropics' as const,
      label: 'Isentrópicas (s = cte)',
      desc: 'Entropía constante (kJ/(kg·K))',
      color: '#06b6d4',
      count: diagramCurves?.isentropics.length || 0,
    },
    {
      key: 'isochores' as const,
      label: 'Isócoras (v = cte)',
      desc: 'Volumen específico (m³/kg)',
      color: '#a855f7',
      count: diagramCurves?.isochores.length || 0,
    },
    {
      key: 'qualityLines' as const,
      label: 'Título de Vapor (x)',
      desc: 'Líneas bifásicas x = 0.1 a 0.9',
      color: '#10b981',
      count: diagramCurves?.quality_lines.length || 0,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-[#181b22] hover:bg-slate-200/80 dark:hover:bg-[#20242e] border border-slate-300 dark:border-slate-700/80 rounded-lg transition-colors shadow-2xs text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        title="Visualización de curvas termodinámicas"
      >
        <Layers size={13} className="text-sky-600 dark:text-sky-400" />
        <span>Curvas</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-[#16181e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders size={13} className="text-sky-500" />
              <span>Curvas de Estado</span>
            </span>
            <button
              onClick={() => toggle('showCurveLabels')}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border transition-colors cursor-pointer ${
                curveVisibility.showCurveLabels
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700/50'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800'
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
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-slate-50 dark:bg-[#1f232c] border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-[#252a35]'
                      : 'bg-white dark:bg-[#14161b] border-slate-100 dark:border-slate-850 opacity-50 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <Eye size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />
                  ) : (
                    <EyeOff size={13} className="text-slate-400 shrink-0" />
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
