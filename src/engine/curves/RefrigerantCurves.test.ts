import { describe, it, expect } from 'vitest';
import { ThermoProvider } from '../provider/ThermoProvider';
import { Units } from '../types/thermoContract';

describe('Refrigerant Fluid Distinctness and Physical Accuracy Tests', () => {
  it('generates distinct physical datasets for R134a, R744 (CO2), R717 (NH3), and R290', async () => {
    const r134a = await ThermoProvider.fetchDiagramDataset('R134a', 1);
    const r744 = await ThermoProvider.fetchDiagramDataset('R744', 2);
    const r717 = await ThermoProvider.fetchDiagramDataset('R717', 3);
    const r290 = await ThermoProvider.fetchDiagramDataset('R290', 4);

    // 1. Verify critical pressures are strictly distinct and match thermodynamic reality
    const pCritR134a = Units.paToBar(r134a.domain.pCritPa);
    const pCritR744 = Units.paToBar(r744.domain.pCritPa);
    const pCritR717 = Units.paToBar(r717.domain.pCritPa);
    const pCritR290 = Units.paToBar(r290.domain.pCritPa);

    expect(pCritR134a).toBeCloseTo(40.59, 1);
    expect(pCritR744).toBeCloseTo(73.77, 1);
    expect(pCritR717).toBeCloseTo(113.33, 1);
    expect(pCritR290).toBeCloseTo(42.51, 1);

    expect(pCritR744).not.toEqual(pCritR134a);
    expect(pCritR717).not.toEqual(pCritR134a);

    // 2. Verify critical temperatures are strictly distinct
    const tCritR134a = Units.kToC(r134a.domain.tCritK);
    const tCritR744 = Units.kToC(r744.domain.tCritK);
    const tCritR717 = Units.kToC(r717.domain.tCritK);

    expect(tCritR134a).toBeCloseTo(101.06, 1);
    expect(tCritR744).toBeCloseTo(30.98, 1);
    expect(tCritR717).toBeCloseTo(132.25, 1);

    // 3. Verify specific enthalpy of ammonia (R717) is vastly higher due to high latent heat
    const hCritR134a = Units.jkgToKjkg(r134a.domain.hCritJkg);
    const hCritR717 = Units.jkgToKjkg(r717.domain.hCritJkg);

    expect(hCritR717).toBeGreaterThan(1200); // NH3 latent heat is huge (~1450 kJ/kg)
    expect(hCritR134a).toBeLessThan(500);

    // 4. Verify all fluids contain full isolines (isotherms, isentropes, isochores, quality lines)
    for (const dataset of [r134a, r744, r717, r290]) {
      expect(dataset.saturationLiquid.segments.length).toBeGreaterThan(0);
      expect(dataset.saturationVapor.segments.length).toBeGreaterThan(0);
      expect(dataset.isotherms.length).toBeGreaterThan(0);
      expect(dataset.qualityLines.length).toBeGreaterThan(0);
      expect(dataset.isochores.length).toBeGreaterThan(0);
      expect(dataset.isentropes.length).toBeGreaterThan(0);

      // Verify domain spans
      expect(dataset.domain.hMaxJkg).toBeGreaterThan(dataset.domain.hMinJkg);
      expect(dataset.domain.pMaxPa).toBeGreaterThan(dataset.domain.pMinPa);
    }
  });
});
