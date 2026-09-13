import React, { useMemo, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  LineChart,
  Table as TableIcon,
  Layers,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  buildSaturationTableFromCurves,
  buildIsothermsSummary,
  exportSaturationTableToCsv,
  SaturationTableRow,
  IsothermSummaryRow,
} from '../../utils/saturationTableUtils';
import { RefrigerantSelectorDropdown } from '../Header/RefrigerantSelectorDropdown';

export const MollierTableView: React.FC = () => {
  const {
    diagramCurves,
    isLoadingCurves,
    curvesError,
    selectedFluidId,
    selectedFluidItem,
    diagramTheme,
    mollierViewMode,
    setMollierViewMode,
    showToast,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'saturation' | 'isotherms'>('saturation');
  const [searchTerm, setSearchTerm] = useState('');
  const [stepFilter, setStepFilter] = useState<'all' | '1' | '5' | '10' | 'isotherms_only'>('5');
  const [copied, setCopied] = useState(false);
  const [expandedIsothermTemp, setExpandedIsothermTemp] = useState<number | null>(null);

  // Procesar filas de saturación
  const allSaturationRows: SaturationTableRow[] = useMemo(() => {
    return buildSaturationTableFromCurves(diagramCurves);
  }, [diagramCurves]);

  // Procesar resumen de isotermas
  const isothermsSummary: IsothermSummaryRow[] = useMemo(() => {
    return buildIsothermsSummary(diagramCurves);
  }, [diagramCurves]);

  const isothermTempsSet = useMemo(() => {
    return new Set(isothermsSummary.map((iso) => Math.round(iso.temperatureC)));
  }, [isothermsSummary]);

  // Filtrado de filas de saturación
  const filteredSaturationRows = useMemo(() => {
    let rows = allSaturationRows;

    // Filtro por paso de temperatura
    if (stepFilter === '1') {
      rows = rows.filter((r) => Math.abs(r.temperatureC - Math.round(r.temperatureC)) < 0.25);
    } else if (stepFilter === '5') {
      rows = rows.filter((r) => {
        const rounded = Math.round(r.temperatureC);
        return rounded % 5 === 0 && Math.abs(r.temperatureC - rounded) < 0.35;
      });
    } else if (stepFilter === '10') {
      rows = rows.filter((r) => {
        const rounded = Math.round(r.temperatureC);
        return rounded % 10 === 0 && Math.abs(r.temperatureC - rounded) < 0.45;
      });
    } else if (stepFilter === 'isotherms_only') {
      rows = rows.filter((r) => {
        return isothermTempsSet.has(Math.round(r.temperatureC));
      });
    }

    // Búsqueda por texto (ej. número de temperatura)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((r) => {
        return (
          r.temperatureC.toString().includes(term) ||
          r.pressureBar.toString().includes(term) ||
          r.hLiquidKjKg.toString().includes(term) ||
          r.hVaporKjKg.toString().includes(term)
        );
      });
    }

    return rows;
  }, [allSaturationRows, stepFilter, searchTerm, isothermTempsSet]);

  const handleCopyCsv = () => {
    if (allSaturationRows.length === 0) return;

    const headers = [
      'T [°C]',
      'Psat [bar]',
      'h_liq [kJ/kg]',
      'h_vap [kJ/kg]',
      'delta_h [kJ/kg]',
      's_liq [kJ/kg·K]',
      's_vap [kJ/kg·K]',
      'v_liq [m3/kg]',
      'v_vap [m3/kg]',
    ];
    const lines = [headers.join('\t')];
    filteredSaturationRows.forEach((r) => {
      lines.push(
        [
          r.temperatureC.toFixed(2),
          r.pressureBar.toFixed(4),
          r.hLiquidKjKg.toFixed(2),
          r.hVaporKjKg.toFixed(2),
          r.deltaHvaporKjKg.toFixed(2),
          r.sLiquidKjKgK !== undefined ? r.sLiquidKjKgK.toFixed(4) : '',
          r.sVaporKjKgK !== undefined ? r.sVaporKjKgK.toFixed(4) : '',
          r.vLiquidM3Kg !== undefined ? r.vLiquidM3Kg.toFixed(6) : '',
          r.vVaporM3Kg !== undefined ? r.vVaporM3Kg.toFixed(5) : '',
        ].join('\t')
      );
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      showToast('Tabla copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = () => {
    if (allSaturationRows.length === 0) return;
    exportSaturationTableToCsv(
      filteredSaturationRows.length > 0 ? filteredSaturationRows : allSaturationRows,
      selectedFluidItem?.display_name || selectedFluidId
    );
    showToast('Tabla descargada como CSV');
  };

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden select-none font-sans ${
        diagramTheme === 'danfoss' ? 'bg-slate-100 text-slate-800' : 'bg-[#0e1015] text-slate-100'
      }`}
    >
      {/* Top Controls Toolbar */}
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 ${
          diagramTheme === 'danfoss'
            ? 'bg-white border-slate-200 shadow-xs'
            : 'bg-[#15171e] border-slate-800/80 shadow-xs'
        }`}
      >
        {/* Left Side: View Toggle [Gráfica | Tabla] + Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main Toggle between Diagram Graphic and Table */}
          <div className="flex items-center bg-slate-200/80 dark:bg-[#0b0d11] p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 text-xs font-semibold shadow-inner">
            <button
              onClick={() => setMollierViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                mollierViewMode === 'chart'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Volver a la vista gráfica interactiva"
            >
              <LineChart size={14} />
              <span>Gráfica</span>
            </button>

            <button
              onClick={() => setMollierViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                mollierViewMode === 'table'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Vista de tabla termodinámica"
            >
              <TableIcon size={14} />
              <span>Tabla de Datos (T)</span>
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-800 hidden sm:block" />

          {/* Sub-tabs: Saturación vs Isotermas */}
          <div className="flex items-center bg-slate-100 dark:bg-[#12141a] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('saturation')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'saturation'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles size={12} />
              <span>Propiedades de Saturación</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {allSaturationRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('isotherms')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'isotherms'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers size={12} />
              <span>Isotermas Graficadas</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {isothermsSummary.length}
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Fluid Selector + Step + Search + Export */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Fluid Selector */}
          <div className="relative z-30">
            <RefrigerantSelectorDropdown size="sm" />
          </div>

          {activeTab === 'saturation' && (
            <>
              {/* Step Filter Dropdown */}
              <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-[#12141a] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <SlidersHorizontal size={12} className="text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400 hidden md:inline text-[11px]">Paso T:</span>
                <select
                  value={stepFilter}
                  onChange={(e) => setStepFilter(e.target.value as any)}
                  aria-label="Paso de temperatura"
                  className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-900">Todas ({allSaturationRows.length})</option>
                  <option value="1" className="dark:bg-slate-900">Cada 1 °C</option>
                  <option value="5" className="dark:bg-slate-900">Cada 5 °C</option>
                  <option value="10" className="dark:bg-slate-900">Cada 10 °C</option>
                  <option value="isotherms_only" className="dark:bg-slate-900">Solo Isotermas ({isothermsSummary.length})</option>
                </select>
              </div>

              {/* Search input */}
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar T o P..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#12141a] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 w-28 sm:w-36 font-mono"
                />
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyCsv}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#12141a] hover:bg-slate-200/80 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                title="Copiar datos tabulares al portapapeles"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer"
                title="Descargar tabla completa en formato CSV"
              >
                <Download size={12} />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto relative">
        {isLoadingCurves && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
            <span className="text-sm font-semibold text-white">
              Cargando puntos de saturación para {selectedFluidItem?.display_name || selectedFluidId}...
            </span>
          </div>
        )}

        {curvesError && (
          <div className="p-4 m-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs">
            <strong>Error al calcular datos termodinámicos:</strong> {curvesError}
          </div>
        )}

        {/* TAB 1: Tabla de Saturación por Temperatura */}
        {activeTab === 'saturation' && (
          <div className="min-w-max pb-12">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead className="sticky top-0 z-10 shadow-xs">
                <tr
                  className={`border-b text-[11px] font-bold tracking-wider ${
                    diagramTheme === 'danfoss'
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-[#151821] text-slate-300 border-slate-800'
                  }`}
                >
                  <th className="py-2.5 px-3 whitespace-nowrap bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-r border-slate-300/60 dark:border-slate-800">
                    T [°C]
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap bg-sky-500/10 text-sky-600 dark:text-sky-400 border-r border-slate-300/60 dark:border-slate-800">
                    P_sat [bar]
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">h_liq [kJ/kg]</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">h_vap [kJ/kg]</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-amber-600 dark:text-amber-400 border-r border-slate-300/60 dark:border-slate-800">
                    Δh_evap [kJ/kg]
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">s_liq [kJ/(kg·K)]</th>
                  <th className="py-2.5 px-3 whitespace-nowrap border-r border-slate-300/60 dark:border-slate-800">
                    s_vap [kJ/(kg·K)]
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">v_liq [m³/kg]</th>
                  <th className="py-2.5 px-3 whitespace-nowrap border-r border-slate-300/60 dark:border-slate-800">
                    v_vap [m³/kg]
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ρ_liq [kg/m³]</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ρ_vap [kg/m³]</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {filteredSaturationRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No hay filas que coincidan con el filtro actual ({searchTerm}).
                    </td>
                  </tr>
                ) : (
                  filteredSaturationRows.map((row, idx) => {
                    const isZeroCross = Math.abs(row.temperatureC) < 0.2;
                    const isEvenTen = Math.round(row.temperatureC) % 10 === 0;

                    return (
                      <tr
                        key={`${row.temperatureC}_${idx}`}
                        className={`transition-colors cursor-pointer ${
                          isZeroCross
                            ? 'bg-sky-500/10 font-bold'
                            : isEvenTen
                            ? diagramTheme === 'danfoss'
                              ? 'bg-slate-50 hover:bg-sky-50/60'
                              : 'bg-slate-900/40 hover:bg-slate-800/60'
                            : diagramTheme === 'danfoss'
                            ? 'hover:bg-slate-100/80'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-r border-slate-300/50 dark:border-slate-800/60 whitespace-nowrap">
                          {row.temperatureC > 0 ? `+${row.temperatureC.toFixed(2)}` : row.temperatureC.toFixed(2)}
                        </td>

                        <td className="py-2 px-3 font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/5 border-r border-slate-300/50 dark:border-slate-800/60 whitespace-nowrap">
                          {row.pressureBar.toFixed(3)}
                        </td>

                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {row.hLiquidKjKg.toFixed(1)}
                        </td>

                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {row.hVaporKjKg.toFixed(1)}
                        </td>

                        <td className="py-2 px-3 font-medium text-amber-600 dark:text-amber-400 border-r border-slate-300/50 dark:border-slate-800/60 whitespace-nowrap">
                          {row.deltaHvaporKjKg.toFixed(1)}
                        </td>

                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {row.sLiquidKjKgK !== undefined ? row.sLiquidKjKgK.toFixed(4) : '—'}
                        </td>

                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-300/50 dark:border-slate-800/60 whitespace-nowrap">
                          {row.sVaporKjKgK !== undefined ? row.sVaporKjKgK.toFixed(4) : '—'}
                        </td>

                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {row.vLiquidM3Kg !== undefined ? row.vLiquidM3Kg.toFixed(5) : '—'}
                        </td>

                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-300/50 dark:border-slate-800/60 whitespace-nowrap">
                          {row.vVaporM3Kg !== undefined ? row.vVaporM3Kg.toFixed(4) : '—'}
                        </td>

                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.densityLiquidKgM3 !== undefined ? row.densityLiquidKgM3.toFixed(1) : '—'}
                        </td>

                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.densityVaporKgM3 !== undefined ? row.densityVaporKgM3.toFixed(2) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Desglose de Isotermas Graficadas */}
        {activeTab === 'isotherms' && (
          <div className="p-4 flex flex-col gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Curvas isotérmicas trazadas en el diagrama de Mollier ({isothermsSummary.length} líneas de temperatura fija). Haz clic en una fila para inspeccionar los puntos calculados de su trayectoria.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {isothermsSummary.map((iso) => {
                const isExpanded = expandedIsothermTemp === iso.temperatureC;
                return (
                  <div
                    key={iso.temperatureC}
                    className={`rounded-xl border transition-all cursor-pointer p-3.5 ${
                      isExpanded
                        ? 'border-sky-500 bg-sky-500/5 shadow-md'
                        : diagramTheme === 'danfoss'
                        ? 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                        : 'border-slate-800 bg-[#141720] hover:border-slate-700 shadow-2xs'
                    }`}
                    onClick={() =>
                      setExpandedIsothermTemp(isExpanded ? null : iso.temperatureC)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {iso.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <span>{iso.pointsCount} pts</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Rango Presión:</span>
                        <span className="font-semibold text-sky-600 dark:text-sky-400">
                          {iso.pMinBar} - {iso.pMaxBar} bar
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Rango Entalpía:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {iso.hMinKjKg} - {iso.hMaxKjKg} kJ/kg
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                        <table className="w-full text-[11px] font-mono">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                              <th className="pb-1 text-left">P [bar]</th>
                              <th className="pb-1 text-left">h [kJ/kg]</th>
                              <th className="pb-1 text-left">Título (x)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                            {iso.points.slice(0, 20).map((pt, pIdx) => (
                              <tr key={pIdx} className="hover:bg-sky-500/10">
                                <td className="py-1 text-sky-600 dark:text-sky-400">
                                  {pt.p_bar.toFixed(3)}
                                </td>
                                <td className="py-1 text-slate-700 dark:text-slate-300">
                                  {pt.h_kj_kg.toFixed(1)}
                                </td>
                                <td className="py-1 text-slate-400">
                                  {pt.q !== undefined ? pt.q.toFixed(2) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {iso.points.length > 20 && (
                          <div className="text-[10px] text-slate-400 text-center mt-1">
                            ... y {iso.points.length - 20} puntos más calculados
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div
        className={`px-3 py-1.5 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
          diagramTheme === 'danfoss'
            ? 'bg-slate-200/80 border-slate-300 text-slate-600'
            : 'bg-[#111319] border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>
            Fluido: <strong className="text-sky-600 dark:text-sky-400">{selectedFluidItem?.display_name || selectedFluidId}</strong>
          </span>
          <span>•</span>
          <span>
            Mostrando <strong>{activeTab === 'saturation' ? filteredSaturationRows.length : isothermsSummary.length}</strong> registros
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMollierViewMode('chart')}
            className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-sans text-xs"
          >
            <LineChart size={12} />
            <span>Volver a ver gráfica de Mollier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
