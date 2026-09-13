import { DiagramCurvesResponse, CurvePoint, CurveSeries } from '../types/thermo';

export interface SaturationTableRow {
  temperatureC: number;
  pressureBar: number;
  hLiquidKjKg: number;
  hVaporKjKg: number;
  deltaHvaporKjKg: number;
  sLiquidKjKgK?: number;
  sVaporKjKgK?: number;
  vLiquidM3Kg?: number;
  vVaporM3Kg?: number;
  densityLiquidKgM3?: number;
  densityVaporKgM3?: number;
}

export interface IsothermSummaryRow {
  temperatureC: number;
  name: string;
  pointsCount: number;
  pMinBar: number;
  pMaxBar: number;
  hMinKjKg: number;
  hMaxKjKg: number;
  points: CurvePoint[];
}

/**
 * Genera la lista de filas de saturación emparejando los puntos de líquido y vapor saturado
 * por temperatura ascendente.
 */
export function buildSaturationTableFromCurves(
  curves: DiagramCurvesResponse | null
): SaturationTableRow[] {
  if (!curves || !curves.saturation_liquid || !curves.saturation_vapor) {
    return [];
  }

  const liqPts = curves.saturation_liquid.points || [];
  const vapPts = curves.saturation_vapor.points || [];

  if (liqPts.length === 0 || vapPts.length === 0) {
    return [];
  }

  const rows: SaturationTableRow[] = [];
  const minLen = Math.min(liqPts.length, vapPts.length);

  for (let i = 0; i < minLen; i++) {
    const l = liqPts[i];
    const v = vapPts[i];

    const tempC = l.t_c ?? v.t_c;
    if (tempC === undefined) continue;

    const pBar = l.p_bar ?? v.p_bar;
    const hLiq = l.h_kj_kg;
    const hVap = v.h_kj_kg;
    const deltaH = Math.max(0, hVap - hLiq);

    // Volúmenes y densidades
    const vLiq = l.v_m3_kg;
    const vVap = v.v_m3_kg;
    const rhoLiq = vLiq && vLiq > 0 ? 1 / vLiq : undefined;
    const rhoVap = vVap && vVap > 0 ? 1 / vVap : undefined;

    rows.push({
      temperatureC: Number(tempC.toFixed(2)),
      pressureBar: Number(pBar.toFixed(4)),
      hLiquidKjKg: Number(hLiq.toFixed(2)),
      hVaporKjKg: Number(hVap.toFixed(2)),
      deltaHvaporKjKg: Number(deltaH.toFixed(2)),
      sLiquidKjKgK: l.s_kj_kg_k !== undefined ? Number(l.s_kj_kg_k.toFixed(4)) : undefined,
      sVaporKjKgK: v.s_kj_kg_k !== undefined ? Number(v.s_kj_kg_k.toFixed(4)) : undefined,
      vLiquidM3Kg: vLiq !== undefined ? Number(vLiq.toFixed(6)) : undefined,
      vVaporM3Kg: vVap !== undefined ? Number(vVap.toFixed(5)) : undefined,
      densityLiquidKgM3: rhoLiq !== undefined ? Number(rhoLiq.toFixed(2)) : undefined,
      densityVaporKgM3: rhoVap !== undefined ? Number(rhoVap.toFixed(3)) : undefined,
    });
  }

  // Ordenar por temperatura ascendente
  rows.sort((a, b) => a.temperatureC - b.temperatureC);

  // Filtrar duplicados exactos si los hubiera
  return rows.filter((r, idx, arr) => {
    if (idx === 0) return true;
    return Math.abs(r.temperatureC - arr[idx - 1].temperatureC) > 0.05;
  });
}

/**
 * Resume las isotermas graficadas en el diagrama de Mollier
 */
export function buildIsothermsSummary(
  curves: DiagramCurvesResponse | null
): IsothermSummaryRow[] {
  if (!curves || !curves.isotherms) return [];

  return curves.isotherms
    .map((iso: CurveSeries) => {
      const pts = iso.points || [];
      if (pts.length === 0) return null;

      let pMin = Infinity;
      let pMax = -Infinity;
      let hMin = Infinity;
      let hMax = -Infinity;

      pts.forEach((p) => {
        if (p.p_bar < pMin) pMin = p.p_bar;
        if (p.p_bar > pMax) pMax = p.p_bar;
        if (p.h_kj_kg < hMin) hMin = p.h_kj_kg;
        if (p.h_kj_kg > hMax) hMax = p.h_kj_kg;
      });

      return {
        temperatureC: iso.parameter_value,
        name: iso.name || `T = ${iso.parameter_value} °C`,
        pointsCount: pts.length,
        pMinBar: Number(pMin.toFixed(3)),
        pMaxBar: Number(pMax.toFixed(3)),
        hMinKjKg: Number(hMin.toFixed(1)),
        hMaxKjKg: Number(hMax.toFixed(1)),
        points: pts,
      };
    })
    .filter((row): row is IsothermSummaryRow => row !== null)
    .sort((a, b) => a.temperatureC - b.temperatureC);
}

/**
 * Exporta las filas de saturación a un archivo CSV estructurado
 */
export function exportSaturationTableToCsv(
  rows: SaturationTableRow[],
  fluidName: string
): void {
  const headers = [
    'Temperatura [°C]',
    'Presion Sat [bar]',
    'h_liq [kJ/kg]',
    'h_vap [kJ/kg]',
    'delta_h [kJ/kg]',
    's_liq [kJ/(kg·K)]',
    's_vap [kJ/(kg·K)]',
    'v_liq [m3/kg]',
    'v_vap [m3/kg]',
    'rho_liq [kg/m3]',
    'rho_vap [kg/m3]',
  ];

  const lines = [headers.join(';')];

  rows.forEach((r) => {
    const line = [
      r.temperatureC.toFixed(2),
      r.pressureBar.toFixed(4),
      r.hLiquidKjKg.toFixed(2),
      r.hVaporKjKg.toFixed(2),
      r.deltaHvaporKjKg.toFixed(2),
      r.sLiquidKjKgK !== undefined ? r.sLiquidKjKgK.toFixed(4) : '',
      r.sVaporKjKgK !== undefined ? r.sVaporKjKgK.toFixed(4) : '',
      r.vLiquidM3Kg !== undefined ? r.vLiquidM3Kg.toFixed(6) : '',
      r.vVaporM3Kg !== undefined ? r.vVaporM3Kg.toFixed(5) : '',
      r.densityLiquidKgM3 !== undefined ? r.densityLiquidKgM3.toFixed(2) : '',
      r.densityVaporKgM3 !== undefined ? r.densityVaporKgM3.toFixed(3) : '',
    ];
    lines.push(line.join(';'));
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanFluid = fluidName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `tabla_saturacion_${cleanFluid}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
