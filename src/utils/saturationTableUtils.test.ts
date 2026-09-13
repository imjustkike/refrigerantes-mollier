import { describe, it, expect } from 'vitest';
import {
  buildSaturationTableFromCurves,
  buildIsothermsSummary,
} from './saturationTableUtils';
import { DiagramCurvesResponse } from '../types/thermo';

describe('saturationTableUtils', () => {
  it('handles null curves gracefully', () => {
    expect(buildSaturationTableFromCurves(null)).toEqual([]);
    expect(buildIsothermsSummary(null)).toEqual([]);
  });

  it('builds saturation rows from liquid and vapor curve points', () => {
    const mockCurves: Partial<DiagramCurvesResponse> = {
      saturation_liquid: {
        id: 'sat_liq',
        name: 'Líquido saturado',
        curve_type: 'saturation_liquid',
        parameter_value: 0,
        parameter_unit: '-',
        points: [
          { t_c: -10, p_bar: 2.0, h_kj_kg: 180, s_kj_kg_k: 0.95, v_m3_kg: 0.0008, q: 0 },
          { t_c: 20, p_bar: 5.7, h_kj_kg: 227, s_kj_kg_k: 1.10, v_m3_kg: 0.00085, q: 0 },
        ],
      },
      saturation_vapor: {
        id: 'sat_vap',
        name: 'Vapor saturado',
        curve_type: 'saturation_vapor',
        parameter_value: 1,
        parameter_unit: '-',
        points: [
          { t_c: -10, p_bar: 2.0, h_kj_kg: 390, s_kj_kg_k: 1.73, v_m3_kg: 0.10, q: 1 },
          { t_c: 20, p_bar: 5.7, h_kj_kg: 410, s_kj_kg_k: 1.71, v_m3_kg: 0.035, q: 1 },
        ],
      },
      isotherms: [
        {
          id: 'iso_20',
          name: 'T = 20 °C',
          curve_type: 'isotherm',
          parameter_value: 20,
          parameter_unit: '°C',
          points: [
            { t_c: 20, p_bar: 1.0, h_kj_kg: 420 },
            { t_c: 20, p_bar: 5.7, h_kj_kg: 410 },
            { t_c: 20, p_bar: 10.0, h_kj_kg: 225 },
          ],
        },
      ],
    };

    const satRows = buildSaturationTableFromCurves(mockCurves as DiagramCurvesResponse);
    expect(satRows.length).toBe(2);
    expect(satRows[0].temperatureC).toBe(-10);
    expect(satRows[0].pressureBar).toBe(2.0);
    expect(satRows[0].hLiquidKjKg).toBe(180);
    expect(satRows[0].hVaporKjKg).toBe(390);
    expect(satRows[0].deltaHvaporKjKg).toBe(210);
    expect(satRows[0].densityLiquidKgM3).toBeCloseTo(1 / 0.0008, 1);
    expect(satRows[0].densityVaporKgM3).toBeCloseTo(1 / 0.10, 1);

    const isoRows = buildIsothermsSummary(mockCurves as DiagramCurvesResponse);
    expect(isoRows.length).toBe(1);
    expect(isoRows[0].temperatureC).toBe(20);
    expect(isoRows[0].pointsCount).toBe(3);
    expect(isoRows[0].pMinBar).toBe(1.0);
    expect(isoRows[0].pMaxBar).toBe(10.0);
  });
});
