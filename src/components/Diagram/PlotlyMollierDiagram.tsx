import React, { useEffect, useRef, useMemo, useState } from 'react';
import type * as Plotly from 'plotly.js-dist-min';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Units } from '../../engine/types/thermoContract';

interface PlotlyMollierDiagramProps {
  theme?: 'danfoss' | 'dark';
}

let plotlyLoaderPromise: Promise<any> | null = null;

function loadPlotly(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).Plotly?.react) {
    return Promise.resolve((window as any).Plotly);
  }
  if (!plotlyLoaderPromise) {
    plotlyLoaderPromise = new Promise((resolve, reject) => {
      let script = document.querySelector('script[src="/plotly.min.js"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.src = '/plotly.min.js';
        script.async = true;
        document.head.appendChild(script);
      }

      if ((window as any).Plotly?.react) {
        resolve((window as any).Plotly);
        return;
      }

      const onScriptLoad = () => {
        if ((window as any).Plotly?.react) {
          resolve((window as any).Plotly);
        } else {
          reject(new Error('Plotly script cargado pero window.Plotly no está disponible'));
        }
      };

      const onScriptError = () => {
        plotlyLoaderPromise = null;
        reject(new Error('No se pudo cargar el script de Plotly (/plotly.min.js)'));
      };

      script.addEventListener('load', onScriptLoad, { once: true });
      script.addEventListener('error', onScriptError, { once: true });
    });
  }
  return plotlyLoaderPromise;
}

export const PlotlyMollierDiagram: React.FC<PlotlyMollierDiagramProps> = ({ theme = 'danfoss' }) => {
  const {
    dataset,
    curveVisibility,
    selectedFluidId,
    selectedFluidItem,
    points,
    connections,
    addPointFromCoordinates,
    toolMode,
  } = useProject();

  const plotContainerRef = useRef<HTMLDivElement>(null);
  const isDanfoss = theme === 'danfoss';

  const [isPlotlyReady, setIsPlotlyReady] = useState<boolean>(() =>
    Boolean(typeof window !== 'undefined' && (window as any).Plotly?.react)
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadPlotly()
      .then(() => {
        if (isMounted) setIsPlotlyReady(true);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err?.message || 'Error cargando motor Plotly');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Build Plotly Traces from thermodynamic dataset safely
  const plotData = useMemo<Plotly.Data[]>(() => {
    if (!dataset) return [];

    const traces: Plotly.Data[] = [];

    // 1. Saturation Curves
    if (curveVisibility.saturation) {
      // Liquid branch
      const liqPts = (dataset.saturationLiquid?.segments || [])
        .flat()
        .filter((p) => Number.isFinite(p.hJkg) && Number.isFinite(p.pPa) && p.pPa > 0);

      if (liqPts.length > 0) {
        traces.push({
          type: 'scatter',
          mode: 'lines',
          name: 'Líquido saturado (Q=0)',
          x: liqPts.map((p) => Units.jkgToKjkg(p.hJkg)),
          y: liqPts.map((p) => Units.paToBar(p.pPa)),
          line: { color: isDanfoss ? '#0284c7' : '#38bdf8', width: 2.5 },
          connectgaps: false,
          hoverinfo: 'x+y+name',
        });
      }

      // Vapor branch
      const vapPts = (dataset.saturationVapor?.segments || [])
        .flat()
        .filter((p) => Number.isFinite(p.hJkg) && Number.isFinite(p.pPa) && p.pPa > 0);

      if (vapPts.length > 0) {
        traces.push({
          type: 'scatter',
          mode: 'lines',
          name: 'Vapor saturado seco (Q=1)',
          x: vapPts.map((p) => Units.jkgToKjkg(p.hJkg)),
          y: vapPts.map((p) => Units.paToBar(p.pPa)),
          line: { color: isDanfoss ? '#0284c7' : '#38bdf8', width: 2.5 },
          connectgaps: false,
          hoverinfo: 'x+y+name',
        });
      }

      // Critical Point Apex
      if (
        dataset.criticalPoint &&
        Number.isFinite(dataset.criticalPoint.hJkg) &&
        Number.isFinite(dataset.criticalPoint.pPa) &&
        dataset.criticalPoint.pPa > 0
      ) {
        traces.push({
          type: 'scatter',
          mode: 'markers+text',
          name: 'Punto Crítico',
          x: [Units.jkgToKjkg(dataset.criticalPoint.hJkg)],
          y: [Units.paToBar(dataset.criticalPoint.pPa)],
          marker: { color: '#f43f5e', size: 9, symbol: 'cross' },
          text: [
            `Crítico (${Units.kToC(dataset.criticalPoint.tK || 300).toFixed(1)}°C, ${Units.paToBar(
              dataset.criticalPoint.pPa
            ).toFixed(1)} bar)`,
          ],
          textposition: 'top right',
          textfont: { size: 10, color: '#f43f5e', family: 'monospace' },
          hoverinfo: 'text',
        });
      }
    }

    // 2. Quality Lines (x = 0.1 .. 0.9)
    if (curveVisibility.qualityLines && dataset.qualityLines) {
      dataset.qualityLines.forEach((q) => {
        const pts = (q.segments || [])
          .flat()
          .filter((p) => Number.isFinite(p.hJkg) && Number.isFinite(p.pPa) && p.pPa > 0);

        if (pts.length > 0) {
          traces.push({
            type: 'scatter',
            mode: 'lines',
            name: q.parameterValue !== undefined ? `x = ${q.parameterValue.toFixed(1)}` : 'Título x',
            x: pts.map((p) => Units.jkgToKjkg(p.hJkg)),
            y: pts.map((p) => Units.paToBar(p.pPa)),
            line: {
              color: isDanfoss ? 'rgba(5, 150, 105, 0.7)' : 'rgba(52, 211, 153, 0.75)',
              width: 1.0,
              dash: 'dash',
            },
            connectgaps: false,
            showlegend: false,
            hoverinfo: 'name+x+y',
          });
        }
      });
    }

    // 3. Isochores (v = const)
    if (curveVisibility.isochores && dataset.isochores) {
      dataset.isochores.forEach((iso) => {
        const pts = (iso.segments || [])
          .flat()
          .filter((p) => Number.isFinite(p.hJkg) && Number.isFinite(p.pPa) && p.pPa > 0);

        if (pts.length > 0) {
          traces.push({
            type: 'scatter',
            mode: 'lines',
            name: iso.parameterValue ? `v = ${iso.parameterValue} m³/kg` : 'Isócora',
            x: pts.map((p) => Units.jkgToKjkg(p.hJkg)),
            y: pts.map((p) => Units.paToBar(p.pPa)),
            line: {
              color: isDanfoss ? 'rgba(147, 51, 234, 0.65)' : 'rgba(192, 132, 252, 0.7)',
              width: 1.0,
              dash: 'dot',
            },
            connectgaps: false,
            showlegend: false,
            hoverinfo: 'name+x+y',
          });
        }
      });
    }

    // 4. Isentropes (s = const)
    if (curveVisibility.isentropics && dataset.isentropes) {
      dataset.isentropes.forEach((isen) => {
        const pts = (isen.segments || [])
          .flat()
          .filter((p) => Number.isFinite(p.hJkg) && Number.isFinite(p.pPa) && p.pPa > 0);

        if (pts.length > 0) {
          traces.push({
            type: 'scatter',
            mode: 'lines',
            name: isen.parameterValue ? `s = ${isen.parameterValue.toFixed(2)} kJ/(kg·K)` : 'Isentrópica',
            x: pts.map((p) => Units.jkgToKjkg(p.hJkg)),
            y: pts.map((p) => Units.paToBar(p.pPa)),
            line: {
              color: isDanfoss ? 'rgba(8, 145, 178, 0.75)' : 'rgba(34, 211, 238, 0.8)',
              width: 1.1,
              dash: 'dashdot',
            },
            connectgaps: false,
            showlegend: false,
            hoverinfo: 'name+x+y',
          });
        }
      });
    }

    // 5. Isotherms (T = const)
    if (curveVisibility.isotherms && dataset.isotherms) {
      dataset.isotherms.forEach((t) => {
        const pts = (t.segments || [])
          .flat()
          .filter((p) => Number.isFinite(p.hJkg) && Number.isFinite(p.pPa) && p.pPa > 0);

        if (pts.length > 0) {
          const val = t.parameterValue ?? 20;
          const tC = t.parameterUnit === 'K' ? Units.kToC(val) : val;
          traces.push({
            type: 'scatter',
            mode: 'lines',
            name: `T = ${tC.toFixed(0)} °C`,
            x: pts.map((p) => Units.jkgToKjkg(p.hJkg)),
            y: pts.map((p) => Units.paToBar(p.pPa)),
            line: {
              color: isDanfoss ? 'rgba(220, 38, 38, 0.85)' : 'rgba(248, 113, 113, 0.85)',
              width: 1.2,
            },
            connectgaps: false,
            showlegend: false,
            hoverinfo: 'name+x+y',
          });
        }
      });
    }

    // 6. User Cycle Connections
    for (const conn of connections) {
      const p1 = points.find((p) => p.id === conn.fromPointId);
      const p2 = points.find((p) => p.id === conn.toPointId);
      if (p1 && p2) {
        let xs: number[] = [];
        let ys: number[] = [];

        if (conn.pathPoints && conn.pathPoints.length >= 2) {
          const valid = conn.pathPoints.filter(
            (pt) => Number.isFinite(pt.h_kj_kg) && Number.isFinite(pt.p_bar) && pt.p_bar > 0
          );
          xs = valid.map((pt) => pt.h_kj_kg);
          ys = valid.map((pt) => pt.p_bar);
        } else {
          xs = [p1.state.enthalpy_kj_kg, p2.state.enthalpy_kj_kg];
          ys = [p1.state.pressure_bar, p2.state.pressure_bar];
        }

        if (xs.length >= 2) {
          traces.push({
            type: 'scatter',
            mode: 'lines',
            name: conn.name || 'Proceso',
            x: xs,
            y: ys,
            line: { color: conn.color || '#38bdf8', width: 3.5 },
            connectgaps: false,
            hoverinfo: 'name+x+y',
          });
        }
      }
    }

    // 7. User State Points
    const validPoints = points.filter(
      (p) =>
        Number.isFinite(p.state.enthalpy_kj_kg) &&
        Number.isFinite(p.state.pressure_bar) &&
        p.state.pressure_bar > 0
    );

    if (validPoints.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'markers+text',
        name: 'Estados del Ciclo',
        x: validPoints.map((p) => p.state.enthalpy_kj_kg),
        y: validPoints.map((p) => p.state.pressure_bar),
        marker: {
          color: validPoints.map((p) => p.color || '#38bdf8'),
          size: 11,
          line: { color: '#ffffff', width: 2 },
        },
        text: validPoints.map((p) => p.name),
        textposition: 'top right',
        textfont: {
          family: 'monospace',
          size: 11,
          color: isDanfoss ? '#0f172a' : '#f8fafc',
        },
        hovertext: validPoints.map(
          (p) =>
            `<b>${p.name}</b><br>` +
            `P: ${p.state.pressure_bar.toFixed(2)} bar(a)<br>` +
            `h: ${p.state.enthalpy_kj_kg.toFixed(1)} kJ/kg<br>` +
            `T: ${p.state.temperature_c.toFixed(1)} °C<br>` +
            `v: ${p.state.specific_volume_m3_kg.toFixed(4)} m³/kg`
        ),
        hoverinfo: 'text',
      });
    }

    return traces;
  }, [dataset, curveVisibility, isDanfoss, connections, points]);

  // Render & Update Plotly
  useEffect(() => {
    if (!isPlotlyReady || !plotContainerRef.current || !dataset) return;
    const Plotly = (window as any).Plotly;
    if (!Plotly || typeof Plotly.react !== 'function') {
      console.warn('Plotly.react is not available on window');
      return;
    }

    const pMinBar = Math.max(0.01, Units.paToBar(dataset.domain.pMinPa || 10000));
    const pMaxBar = Math.max(pMinBar * 1.5, Units.paToBar(dataset.domain.pMaxPa || 5000000));
    const hMinKj = Units.jkgToKjkg(dataset.domain.hMinJkg || 0);
    const hMaxKj = Units.jkgToKjkg(dataset.domain.hMaxJkg || 600000);

    const layout: Partial<Plotly.Layout> = {
      title: {
        text: `Diagrama log(p)–h: ${selectedFluidItem?.display_name || selectedFluidId} (CoolProp + Plotly)`,
        font: {
          family: 'sans-serif',
          size: 14,
          color: isDanfoss ? '#0f172a' : '#f8fafc',
        },
      },
      paper_bgcolor: isDanfoss ? '#ffffff' : '#0f1116',
      plot_bgcolor: isDanfoss ? '#ffffff' : '#0f1116',
      margin: { l: 70, r: 40, t: 45, b: 50 },
      xaxis: {
        title: {
          text: 'Entalpía específica, h [kJ/kg]',
          font: { size: 11, color: isDanfoss ? '#0f172a' : '#94a3b8' },
        },
        gridcolor: isDanfoss ? '#e2e8f0' : '#1e293b',
        zerolinecolor: isDanfoss ? '#cbd5e1' : '#334155',
        tickfont: { family: 'monospace', size: 10, color: isDanfoss ? '#334155' : '#94a3b8' },
        range: [hMinKj, hMaxKj],
      },
      yaxis: {
        title: {
          text: 'Presión absoluta, P [bar(a)] (escala logarítmica)',
          font: { size: 11, color: isDanfoss ? '#0f172a' : '#94a3b8' },
        },
        type: 'log',
        gridcolor: isDanfoss ? '#e2e8f0' : '#1e293b',
        zerolinecolor: isDanfoss ? '#cbd5e1' : '#334155',
        tickfont: { family: 'monospace', size: 10, color: isDanfoss ? '#334155' : '#94a3b8' },
        range: [Math.log10(pMinBar), Math.log10(pMaxBar)],
      },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: isDanfoss ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
        bordercolor: isDanfoss ? '#cbd5e1' : '#334155',
        borderwidth: 1,
        font: { size: 10, color: isDanfoss ? '#0f172a' : '#f8fafc' },
      },
      hovermode: 'closest',
      autosize: true,
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      scrollZoom: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `mollier_${selectedFluidId}`,
        height: 900,
        width: 1400,
        scale: 2,
      },
    };

    let isSubscribed = true;
    Plotly.react(plotContainerRef.current, plotData, layout, config)
      .then((elem: any) => {
        if (!isSubscribed || !elem || !elem.on) return;
        elem.removeAllListeners?.('plotly_click');
        elem.on('plotly_click', (data: any) => {
          if (toolMode === 'add_point' && data?.points?.[0]) {
            const pt = data.points[0];
            const h = pt.x;
            const p = pt.y;
            if (p > 0.01 && h > -500 && h < 2500) {
              addPointFromCoordinates(h, p);
            }
          }
        });
      })
      .catch((err: any) => {
        console.error('Error rendering Plotly diagram:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [
    isPlotlyReady,
    dataset,
    plotData,
    isDanfoss,
    selectedFluidId,
    selectedFluidItem,
    toolMode,
    addPointFromCoordinates,
  ]);

  // Clean up on unmount
  useEffect(() => {
    const container = plotContainerRef.current;
    return () => {
      const Plotly = (window as any).Plotly;
      if (container && Plotly && typeof Plotly.purge === 'function') {
        try {
          Plotly.purge(container);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-rose-400">
        <AlertTriangle size={28} />
        <span className="text-xs font-mono">{loadError}</span>
      </div>
    );
  }

  if (!isPlotlyReady) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin text-sky-400" size={24} />
        <span className="text-xs font-mono">Cargando motor Plotly.js...</span>
      </div>
    );
  }

  return <div ref={plotContainerRef} className="w-full h-full block" />;
};
