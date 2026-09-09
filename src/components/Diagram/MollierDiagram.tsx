import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { formatSpecificVolume } from '../../utils/formatters';
import { DiagramRenderer } from '../../engine/renderer/DiagramRenderer';
import { DiagramTransform, ViewportRect } from '../../engine/transform/DiagramTransform';
import { DiagramInteraction, DraggingState } from '../../engine/interaction/DiagramInteraction';
import { DiagramPoint } from '../../types/thermo';
import { ThermoProvider } from '../../engine/provider/ThermoProvider';
import { Units } from '../../engine/types/thermoContract';
import { ErrorBoundary } from '../common/ErrorBoundary';

const PlotlyMollierDiagram = React.lazy(() =>
  import('./PlotlyMollierDiagram').then((m) => ({ default: m.PlotlyMollierDiagram }))
);

interface MollierDiagramProps {
  canvasExportRef?: React.MutableRefObject<(() => Promise<string | null>) | null>;
}

export const MollierDiagram: React.FC<MollierDiagramProps> = ({ canvasExportRef }) => {
  const {
    dataset,
    isLoadingCurves,
    curvesError,
    curveVisibility,
    toolMode,
    addPointFromCoordinates,
    selectedFluidId,
    selectedFluidItem,
    points,
    layers,
    selectedPointId,
    setSelectedPointId,
    movePoint,
    updatePointLabelOffset,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    connectSourcePointId,
    setConnectSourcePointId,
    addConnection,
    showToast,
    diagramTheme,
    engineMode,
    setEngineMode,
    registerDiagramActions,
  } = useProject();

  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 600,
  });

  // Margins around plot interior (34px top for top isochore labels, 65px right for isochoric v-scale)
  const margin = useMemo(() => ({ top: 34, right: 65, bottom: 45, left: 65 }), []);

  const viewportRect: ViewportRect = useMemo(() => {
    const width = Math.max(dimensions.width - margin.left - margin.right, 200);
    const height = Math.max(dimensions.height - margin.top - margin.bottom, 200);
    return {
      left: margin.left,
      top: margin.top,
      width,
      height,
    };
  }, [dimensions, margin]);

  // Transform instance initialized from dataset domain
  const [transform, setTransform] = useState<DiagramTransform>(() => {
    return new DiagramTransform(
      { left: 65, top: 30, width: 800, height: 500 },
      { hMinJkg: 100000, hMaxJkg: 650000, pMinPa: 10000, pMaxPa: 5000000 }
    );
  });

  // Keep transform dimensions updated when window / container resizes
  useEffect(() => {
    setTransform((prev) => prev.withDimensions(viewportRect));
  }, [viewportRect]);

  // Update base domain when new fluid dataset arrives
  useEffect(() => {
    if (dataset) {
      setTransform(DiagramTransform.fromDomain(viewportRect, dataset.domain));
    }
  }, [dataset, viewportRect]);

  // ResizeObserver for Container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Live Cursor Hover Inspector State
  const [cursorState, setCursorState] = useState<{
    hJkg: number;
    pPa: number;
    tC?: number;
    sKjkgk?: number;
    vM3kg?: number;
    phase?: string;
  } | null>(null);

  const lastHoverLookupRef = useRef<number>(0);

  // Dragging State Reference
  const dragRef = useRef<DraggingState | null>(null);

  // Helper to reliably retrieve the actual Diagram SVG (excluding toolbar icons)
  const getChartSvg = useCallback((): SVGSVGElement | null => {
    return containerRef.current?.querySelector<SVGSVGElement>('svg.chart-svg') || null;
  }, []);

  // Pointer / Mouse Event Handlers
  const handleWheel = (e: React.WheelEvent) => {
    const svg = getChartSvg();
    if (!svg) return;
    const newTransform = DiagramInteraction.handleWheelZoom(e, transform, svg);
    setTransform(newTransform);
  };

  const handleZoomIn = useCallback(() => {
    setTransform((prev) => DiagramInteraction.zoomCenter(prev, 1.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => DiagramInteraction.zoomCenter(prev, 1 / 1.25));
  }, []);

  const handleResetView = useCallback(() => {
    setTransform((prev) => prev.resetView());
  }, []);

  useEffect(() => {
    registerDiagramActions({
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      resetView: handleResetView,
    });
  }, [registerDiagramActions, handleZoomIn, handleZoomOut, handleResetView]);

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const svg = getChartSvg();
    if (!svg) return;

    const phys = DiagramInteraction.getPhysicalPointFromEvent(e.clientX, e.clientY, svg, transform);

    if (toolMode === 'add_point') {
      if (phys.isInsidePlot && phys.pPa > 1000) {
        addPointFromCoordinates(Units.jkgToKjkg(phys.hJkg), Units.paToBar(phys.pPa));
      }
      return;
    }

    // Default: Pan mode
    dragRef.current = {
      type: 'pan',
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialTransform: transform,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'pan' || !dragRef.current.initialTransform)
        return;
      const dx = ev.clientX - dragRef.current.startClientX;
      const dy = ev.clientY - dragRef.current.startClientY;
      setTransform(dragRef.current.initialTransform.pan(dx, dy));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Canvas Mouse Move (Inspector)
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const svg = getChartSvg();
    if (!svg) return;

    const phys = DiagramInteraction.getPhysicalPointFromEvent(e.clientX, e.clientY, svg, transform);

    if (!phys.isInsidePlot) {
      setCursorState(null);
      return;
    }

    setCursorState((prev) => ({
      hJkg: phys.hJkg,
      pPa: phys.pPa,
      tC: prev?.tC,
      sKjkgk: prev?.sKjkgk,
      vM3kg: prev?.vM3kg,
      phase: prev?.phase,
    }));

    // Throttled thermodynamic state resolution (every 100ms)
    const now = Date.now();
    if (now - lastHoverLookupRef.current > 100 && phys.pPa > 5000) {
      lastHoverLookupRef.current = now;
      ThermoProvider.calculateState(
        selectedFluidId,
        'H',
        Units.jkgToKjkg(phys.hJkg),
        'P',
        Units.paToBar(phys.pPa)
      )
        .then((st) => {
          setCursorState({
            hJkg: Units.kjkgToJkg(st.enthalpy_kj_kg),
            pPa: Units.barToPa(st.pressure_bar),
            tC: st.temperature_c,
            sKjkgk: st.entropy_kj_kg_k,
            vM3kg: st.specific_volume_m3_kg,
            phase: st.phase,
          });
        })
        .catch(() => {});
    }
  };

  const isDraggingPointRef = useRef<boolean>(false);

  // Point Selection / Connect Tool Mode
  const handlePointSelect = (pointId: string) => {
    if (isDraggingPointRef.current) {
      isDraggingPointRef.current = false;
      return;
    }
    if (toolMode === 'connect') {
      if (!connectSourcePointId) {
        setConnectSourcePointId(pointId);
        showToast('Seleccione el punto de destino para trazar el proceso');
      } else {
        addConnection(connectSourcePointId, pointId);
        setConnectSourcePointId(null);
      }
    } else {
      // Toggle point selection on click: click to deploy, click again to hide
      setSelectedPointId(selectedPointId === pointId ? null : pointId);
      setSelectedConnectionId(null);
    }
  };

  // Point Dragging
  const handlePointMouseDown = (e: React.MouseEvent, pointId: string) => {
    if (toolMode === 'connect') return;
    e.stopPropagation();
    isDraggingPointRef.current = false;

    const svg = getChartSvg();
    if (!svg) return;

    dragRef.current = {
      type: 'point',
      id: pointId,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current || dragRef.current.type !== 'point' || !dragRef.current.id) return;
      const currentSvg = getChartSvg();
      if (!currentSvg) return;

      const dist = Math.hypot(
        moveEvent.clientX - dragRef.current.startClientX,
        moveEvent.clientY - dragRef.current.startClientY
      );

      if (dist > 4) {
        isDraggingPointRef.current = true;
      }

      if (isDraggingPointRef.current) {
        const phys = DiagramInteraction.getPhysicalPointFromEvent(
          moveEvent.clientX,
          moveEvent.clientY,
          currentSvg,
          transform
        );

        if (phys.pPa > 1000) {
          movePoint(dragRef.current.id, Units.jkgToKjkg(phys.hJkg), Units.paToBar(phys.pPa));
        }
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // Reset isDraggingPointRef slightly after click event completes
      setTimeout(() => {
        isDraggingPointRef.current = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Point Label Dragging
  const handleLabelMouseDown = (e: React.MouseEvent, point: DiagramPoint) => {
    e.stopPropagation();
    setSelectedPointId(point.id);

    dragRef.current = {
      type: 'label',
      id: point.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialLabelOffset: { ...point.labelOffset },
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (
        !dragRef.current ||
        dragRef.current.type !== 'label' ||
        !dragRef.current.id ||
        !dragRef.current.initialLabelOffset
      )
        return;

      const dx = moveEvent.clientX - dragRef.current.startClientX;
      const dy = moveEvent.clientY - dragRef.current.startClientY;

      updatePointLabelOffset(
        dragRef.current.id,
        dragRef.current.initialLabelOffset.x + dx,
        dragRef.current.initialLabelOffset.y + dy
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // High-Resolution PNG Export Handler
  const exportPngFunction = useCallback(async (): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const scaleFactor = 2; // 2x Retina resolution
    canvas.width = dimensions.width * scaleFactor;
    canvas.height = dimensions.height * scaleFactor;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scaleFactor, scaleFactor);

    // 1. Background
    const isDanf = diagramTheme === 'danfoss';
    ctx.fillStyle = isDanf ? '#ffffff' : '#030712';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 2. Title Header
    ctx.fillStyle = isDanf ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(
      `Diagrama log(p)–h: ${selectedFluidItem?.display_name || selectedFluidId}`,
      margin.left,
      20
    );
    ctx.fillStyle = isDanf ? '#64748b' : '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(
      `CoolProp 8.0 • P [bar(a)], h [kJ/kg], v [m³/kg], T [°C]`,
      dimensions.width - margin.right - 280,
      20
    );

    // 3. Inner Plot Area with Clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewportRect.left, viewportRect.top, viewportRect.width, viewportRect.height);
    ctx.clip();

    // Draw Saturation Curves
    if (dataset && curveVisibility.saturation) {
      ctx.strokeStyle = isDanf ? '#0284c7' : '#38bdf8';
      ctx.lineWidth = 2.4;

      // Liquid branch
      ctx.beginPath();
      dataset.saturationLiquid.segments.forEach((seg) => {
        seg.forEach((pt, i) => {
          const { x, y } = transform.projectPoint(pt);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.stroke();

      // Vapor branch
      ctx.beginPath();
      dataset.saturationVapor.segments.forEach((seg) => {
        seg.forEach((pt, i) => {
          const { x, y } = transform.projectPoint(pt);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.stroke();

      // Critical Point
      const critProj = transform.projectPoint(dataset.criticalPoint);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(critProj.x, critProj.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw Isotherms
    if (dataset && curveVisibility.isotherms) {
      ctx.strokeStyle = isDanf ? '#dc2626' : '#f87171';
      ctx.lineWidth = 1.2;
      for (const iso of dataset.isotherms) {
        ctx.beginPath();
        iso.segments.forEach((seg) => {
          seg.forEach((pt, i) => {
            const { x, y } = transform.projectPoint(pt);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
        });
        ctx.stroke();
      }
    }

    // Draw Connections
    for (const conn of connections) {
      const p1 = points.find((p) => p.id === conn.fromPointId);
      const p2 = points.find((p) => p.id === conn.toPointId);
      if (p1 && p2) {
        ctx.strokeStyle = conn.color || '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (conn.pathPoints && conn.pathPoints.length >= 2) {
          conn.pathPoints.forEach((pt, i) => {
            const { x, y } = transform.project(
              Units.kjkgToJkg(pt.h_kj_kg),
              Units.barToPa(pt.p_bar)
            );
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
        } else {
          const pt1 = transform.project(
            Units.kjkgToJkg(p1.state.enthalpy_kj_kg),
            Units.barToPa(p1.state.pressure_bar)
          );
          const pt2 = transform.project(
            Units.kjkgToJkg(p2.state.enthalpy_kj_kg),
            Units.barToPa(p2.state.pressure_bar)
          );
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
        }
        ctx.stroke();
      }
    }

    // Draw Points
    for (const pt of points) {
      const { x, y } = transform.project(
        Units.kjkgToJkg(pt.state.enthalpy_kj_kg),
        Units.barToPa(pt.state.pressure_bar)
      );

      ctx.fillStyle = pt.color || '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();

    // 4. Draw Outer Box Border
    ctx.strokeStyle = isDanf ? '#94a3b8' : '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(viewportRect.left, viewportRect.top, viewportRect.width, viewportRect.height);

    return canvas.toDataURL('image/png');
  }, [
    dimensions,
    margin,
    viewportRect,
    diagramTheme,
    selectedFluidItem,
    selectedFluidId,
    dataset,
    curveVisibility,
    transform,
    points,
    connections,
  ]);

  if (canvasExportRef) {
    canvasExportRef.current = exportPngFunction;
  }

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden select-none ${
        diagramTheme === 'danfoss' ? 'theme-danfoss bg-slate-100' : 'theme-dark bg-slate-950'
      }`}
    >
      {/* Top Inspector Status Bar - Fixed at top-left, never overlaps the diagram */}
      <div
        className={`h-10 px-3 py-1 border-b flex items-center justify-between gap-2 shrink-0 z-20 transition-colors ${
          diagramTheme === 'danfoss'
            ? 'bg-slate-200/90 border-slate-300 text-slate-800'
            : 'bg-slate-900/90 border-slate-800/80 text-slate-200'
        }`}
      >
        {/* Pinned to top-left: compact square tiles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tile P */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-xs shadow-sm ${
              diagramTheme === 'danfoss'
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-950/80 border-slate-800/90 text-slate-100'
            }`}
          >
            <span className="font-bold text-cyan-400 text-[10px]">P</span>
            <span className="font-semibold text-[11px]">
              {cursorState ? `${Units.paToBar(cursorState.pPa).toFixed(2)} bar` : '— bar'}
            </span>
          </div>

          {/* Tile T */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-xs shadow-sm ${
              diagramTheme === 'danfoss'
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-950/80 border-slate-800/90 text-slate-100'
            }`}
          >
            <span className="font-bold text-emerald-400 text-[10px]">T</span>
            <span className="font-semibold text-[11px]">
              {cursorState?.tC !== undefined ? `${cursorState.tC.toFixed(1)} °C` : '— °C'}
            </span>
          </div>

          {/* Tile h */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-xs shadow-sm ${
              diagramTheme === 'danfoss'
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-950/80 border-slate-800/90 text-slate-100'
            }`}
          >
            <span className="font-bold text-sky-400 text-[10px]">h</span>
            <span className="font-semibold text-[11px]">
              {cursorState ? `${Units.jkgToKjkg(cursorState.hJkg).toFixed(1)} kJ/kg` : '— kJ/kg'}
            </span>
          </div>

          {/* Tile s */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-xs shadow-sm ${
              diagramTheme === 'danfoss'
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-950/80 border-slate-800/90 text-slate-100'
            }`}
          >
            <span className="font-bold text-amber-400 text-[10px]">s</span>
            <span className="font-semibold text-[11px]">
              {cursorState?.sKjkgk !== undefined ? `${cursorState.sKjkgk.toFixed(4)} kJ/(kg·K)` : '— kJ/(kg·K)'}
            </span>
          </div>

          {/* Tile v with logarithmic format when small */}
          {(() => {
            const vFmt = formatSpecificVolume(cursorState?.vM3kg);
            return (
              <div
                title={vFmt.tooltip}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-xs shadow-sm cursor-help ${
                  diagramTheme === 'danfoss'
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-950/80 border-slate-800/90 text-slate-100'
                }`}
              >
                <span className="font-bold text-purple-400 text-[10px]">v</span>
                <span className={`font-semibold text-[11px] ${vFmt.isSci ? 'text-purple-300 font-bold' : ''}`}>
                  {cursorState?.vM3kg !== undefined ? vFmt.display : '— m³/kg'}
                </span>
              </div>
            );
          })()}

          {/* Tile Fase */}
          {cursorState?.phase && (
            <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 text-[10px] font-bold shadow-sm">
              {cursorState.phase}
            </span>
          )}
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden md:block select-none">
          {cursorState ? 'Inspección activa' : 'Pase el cursor por el diagrama'}
        </div>
      </div>

      {/* Main Diagram Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        style={{
          cursor:
            toolMode === 'add_point'
              ? 'crosshair'
              : toolMode === 'connect'
              ? 'pointer'
              : 'default',
        }}
      >
        {/* Loading Overlay */}
        {isLoadingCurves && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-40">
            <Loader2 className="animate-spin text-cyan-400" size={36} />
            <div className="text-sm font-bold text-white tracking-tight">
              Calculando malla termodinámica de {selectedFluidItem?.display_name || selectedFluidId}...
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Resolviendo ecuaciones de estado Helmholtz en CoolProp
            </div>
          </div>
        )}

        {/* Error Banner */}
        {curvesError && (
          <div className="absolute top-4 left-4 right-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs z-35 backdrop-blur-md">
            <strong className="text-white">Error de cálculo termodinámico:</strong> {curvesError}
          </div>
        )}

        {/* Diagram Rendering: Plotly or Native SVG */}
        {engineMode === 'plotly' ? (
          <ErrorBoundary
            fallback={(error, reset) => (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-950/90 backdrop-blur-md">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle size={24} />
                </div>
                <div className="text-sm font-bold text-white tracking-tight">
                  No se pudo cargar el motor gráfico Plotly.js
                </div>
                <div className="text-xs text-slate-400 max-w-md font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {error.message || 'Error inesperado al inicializar Plotly'}
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    onClick={() => {
                      reset();
                      setEngineMode('svg');
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                  >
                    Volver a Motor SVG Nativo
                  </button>
                  <button
                    onClick={reset}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          >
            <React.Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Loader2 className="animate-spin text-emerald-400 mr-2" size={28} />
                  <span>Cargando motor Plotly.js...</span>
                </div>
              }
            >
              <PlotlyMollierDiagram theme={diagramTheme} />
            </React.Suspense>
          </ErrorBoundary>
        ) : (
          <DiagramRenderer
            transform={transform}
            dataset={dataset}
            visibility={curveVisibility}
            theme={diagramTheme}
            layers={layers}
            points={points}
            connections={connections}
            selectedPointId={selectedPointId}
            selectedConnectionId={selectedConnectionId}
            onPointSelect={handlePointSelect}
            onPointMouseDown={handlePointMouseDown}
            onLabelMouseDown={handleLabelMouseDown}
          />
        )}
      </div>
    </div>
  );
};
