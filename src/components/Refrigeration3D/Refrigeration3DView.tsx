import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Layers,
  Thermometer,
  Compass,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  RefrigerationSceneManager,
  SceneOptions,
  CycleThermodynamics,
} from './RefrigerationScene';
import { ComponentDetailsCard, ComponentInfo } from './ComponentDetailsCard';

export const Refrigeration3DView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<RefrigerationSceneManager | null>(null);

  const {
    themeMode,
    selectedFluidId,
    selectedFluidItem,
    points,
  } = useProject();

  // 3D Scene Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [flowSpeed, setFlowSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<'standard' | 'thermal' | 'xray'>('standard');
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);

  // Compute thermodynamic values from project points or defaults
  const thermoData: CycleThermodynamics = useMemo(() => {
    // Find min and max pressure points if available
    let p_min = 2.0;
    let p_max = 12.0;
    let t_min = -10.0;
    let t_max = 45.0;

    if (points.length >= 2) {
      const pressures = points.map((p) => p.state?.pressure_bar).filter((v) => typeof v === 'number' && !isNaN(v));
      const temperatures = points.map((p) => p.state?.temperature_c).filter((v) => typeof v === 'number' && !isNaN(v));

      if (pressures.length >= 2) {
        p_min = Math.min(...pressures);
        p_max = Math.max(...pressures);
      }
      if (temperatures.length >= 2) {
        t_min = Math.min(...temperatures);
        t_max = Math.max(...temperatures);
      }
    }

    return {
      fluid: selectedFluidItem?.display_name || selectedFluidId || 'R134a',
      p_evap: p_min,
      t_evap: t_min,
      p_cond: p_max,
      t_cond: t_max,
      t_discharge: t_max + 28,
      t_subcooling: 3.5,
      t_superheat: 5.0,
      cop: 3.8,
      q_evap_kj: 155.0,
      w_comp_kj: 40.8,
    };
  }, [points, selectedFluidId, selectedFluidItem]);

  // Initialize and mount Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const options: SceneOptions = {
      theme: themeMode,
      viewMode,
      isFlowing: isPlaying,
      flowSpeed,
    };

    const manager = new RefrigerationSceneManager(
      containerRef.current,
      options,
      thermoData,
      (info) => setSelectedComponent(info)
    );

    sceneManagerRef.current = manager;

    return () => {
      manager.destroy();
      sceneManagerRef.current = null;
    };
  }, [themeMode, viewMode]);

  // Update dynamic properties without recreating scene
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setOptions({
        isFlowing: isPlaying,
        flowSpeed,
      });
      sceneManagerRef.current.setThermoData(thermoData);
    }
  }, [isPlaying, flowSpeed, thermoData]);

  const handleCameraPreset = (view: 'iso' | 'front' | 'top') => {
    sceneManagerRef.current?.resetCamera(view);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100 dark:bg-[#0c0e12] select-none flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Top Floating Action Bar: Views, Cameras & Presets */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        {/* Render View Modes */}
        <div className="flex items-center bg-white/90 dark:bg-[#14171f]/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            onClick={() => setViewMode('standard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'standard'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Vista Estándar Realista"
          >
            <Eye size={13} />
            <span>Física</span>
          </button>

          <button
            onClick={() => setViewMode('thermal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'thermal'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Mapa Térmico de Temperatura"
          >
            <Thermometer size={13} />
            <span>Térmica</span>
          </button>

          <button
            onClick={() => setViewMode('xray')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              viewMode === 'xray'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Modo Rayos X / Transparencia"
          >
            <Layers size={13} />
            <span>Rayos X</span>
          </button>
        </div>

        {/* Camera Views Preset */}
        <div className="flex items-center bg-white/90 dark:bg-[#14171f]/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            onClick={() => handleCameraPreset('iso')}
            className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
            title="Perspectiva Isométrica"
          >
            <Compass size={13} className="inline mr-1" />
            3D
          </button>
          <button
            onClick={() => handleCameraPreset('front')}
            className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
            title="Vista Frontal (Esquemática)"
          >
            Frontal
          </button>
          <button
            onClick={() => handleCameraPreset('top')}
            className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
            title="Vista Superior / Planta"
          >
            Planta
          </button>
        </div>
      </div>

      {/* Bottom Floating Control Bar: Flow Playback & Speed */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/90 dark:bg-[#14171f]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
            isPlaying
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title={isPlaying ? 'Pausar Simulación de Flujo' : 'Reanudar Simulación de Flujo'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Flujo Activo' : 'Pausado'}</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="text-[11px] text-slate-400">Velocidad:</span>
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              onClick={() => setFlowSpeed(spd)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                flowSpeed === spd
                  ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800" />

        <button
          onClick={() => handleCameraPreset('iso')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Restablecer Posición de Cámara"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Circuit States Color Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-3 z-30 hidden md:flex flex-col gap-1.5 p-3 rounded-xl bg-white/90 dark:bg-[#14171f]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-[11px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
          Estados del Refrigerante
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-2xs" />
          <span className="text-slate-700 dark:text-slate-300">Vapor Alta Presión / Temp (Descarga)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
          <span className="text-slate-700 dark:text-slate-300">Líquido Subenfriado Alta Presión</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-2xs" />
          <span className="text-slate-700 dark:text-slate-300">Mezcla Líquido-Vapor Baja Presión (Inyección)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-2xs" />
          <span className="text-slate-700 dark:text-slate-300">Vapor Sobrecalentado Baja Presión (Aspiración)</span>
        </div>
      </div>

      {/* Selected Component Floating Details Inspector */}
      <ComponentDetailsCard
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
        fluidName={thermoData.fluid}
      />
    </div>
  );
};
