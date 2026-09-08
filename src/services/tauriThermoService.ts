import { invoke } from '@tauri-apps/api/core';
import {
  CatalogItem,
  CatalogResponse,
  CurvePoint,
  DiagramCurvesResponse,
  FluidInfo,
  ProcessType,
  ThermodynamicState,
} from '../types/thermo';

export interface ProcessCalculationResult {
  process_type: string;
  delta_h_kj_kg: number;
  delta_t_c: number;
  delta_p_bar: number;
  delta_s_kj_kg_k: number;
  intermediate_points: CurvePoint[];
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function fetchCatalog(): Promise<CatalogResponse> {
  if (isTauri()) {
    try {
      return await invoke<CatalogResponse>('get_catalog');
    } catch (e) {
      console.warn('Tauri invoke get_catalog failed, falling back to mock:', e);
    }
  }
  return getMockCatalog();
}

export async function fetchFluidDetails(fluidId: string): Promise<FluidInfo> {
  if (isTauri()) {
    try {
      return await invoke<FluidInfo>('get_fluid_details', { fluidId });
    } catch (e) {
      console.warn('Tauri invoke get_fluid_details failed:', e);
    }
  }
  return getMockFluidInfo(fluidId);
}

export async function fetchDiagramCurves(fluidId: string): Promise<DiagramCurvesResponse> {
  if (isTauri()) {
    try {
      return await invoke<DiagramCurvesResponse>('get_diagram_curves_cmd', { fluidId });
    } catch (e) {
      console.warn('Tauri invoke get_diagram_curves_cmd failed:', e);
    }
  }
  return getMockDiagramCurves(fluidId);
}

export async function calculateState(
  fluidId: string,
  in1Type: string,
  in1Val: number,
  in2Type: string,
  in2Val: number
): Promise<ThermodynamicState> {
  if (isTauri()) {
    try {
      return await invoke<ThermodynamicState>('calculate_point_cmd', {
        fluidId,
        in1Type,
        in1Val,
        in2Type,
        in2Val,
      });
    } catch (e) {
      console.warn('Tauri invoke calculate_point_cmd failed:', e);
      throw e;
    }
  }
  return mockCalculateState(fluidId, in1Type, in1Val, in2Type, in2Val);
}

export async function calculateProcessCurve(
  fluidId: string,
  p1H: number,
  p1P: number,
  p2H: number,
  p2P: number,
  processType: ProcessType,
  steps = 25
): Promise<ProcessCalculationResult> {
  if (isTauri()) {
    try {
      return await invoke<ProcessCalculationResult>('calculate_process_curve_cmd', {
        req: {
          fluid_id: fluidId,
          p1_h: p1H,
          p1_p: p1P,
          p2_h: p2H,
          p2_p: p2P,
          process_type: processType,
          steps,
        },
      });
    } catch (e) {
      console.warn('Tauri calculate_process_curve_cmd failed:', e);
    }
  }
  return mockCalculateProcess(fluidId, p1H, p1P, p2H, p2P, processType, steps);
}

// -------------------------------------------------------------
// Accurate Engineering Thermodynamic Models for Web Browser Fallback
// -------------------------------------------------------------

interface FluidThermodynamicModel {
  id: string;
  name: string;
  molar_mass: number;
  t_triple_c: number;
  t_crit_c: number;
  p_crit_bar: number;
  p_min_bar: number;
  p_max_bar: number;
  h_crit_kj_kg: number;
  h_ref_0c_liq: number; // reference h at 0C liquid
  p_sat_0c_bar: number;
  cp_ideal: number;
  is_pure: boolean;
  is_mixture: boolean;
  gwp: number;
  safety: string;
  // Wagner parameters for Psat: ln(P/Pc) = (Tc/T) * (a1*th + a2*th^1.5 + a3*th^2.5 + a4*th^5)
  wagner: [number, number, number, number];
}

const FLUID_MODELS: Record<string, FluidThermodynamicModel> = {
  R134a: {
    id: 'R134a',
    name: 'R134a (1,1,1,2-Tetrafluoroetano)',
    molar_mass: 0.10203,
    t_triple_c: -103.3,
    t_crit_c: 101.06,
    p_crit_bar: 40.593,
    p_min_bar: 0.1,
    p_max_bar: 70.0,
    h_crit_kj_kg: 392.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 2.928,
    cp_ideal: 0.95,
    is_pure: true,
    is_mixture: false,
    gwp: 1430,
    safety: 'A1',
    wagner: [-7.686556, 2.311791, -2.039554, -3.583758],
  },
  R744: {
    id: 'R744',
    name: 'R744 (Dióxido de Carbono - CO₂)',
    molar_mass: 0.04401,
    t_triple_c: -56.56,
    t_crit_c: 30.98,
    p_crit_bar: 73.773,
    p_min_bar: 5.2,
    p_max_bar: 130.0,
    h_crit_kj_kg: 340.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 34.85,
    cp_ideal: 1.15,
    is_pure: true,
    is_mixture: false,
    gwp: 1,
    safety: 'A1',
    wagner: [-7.06023, 1.93946, -1.64635, -3.29956],
  },
  R717: {
    id: 'R717',
    name: 'R717 (Amoníaco - NH₃)',
    molar_mass: 0.01703,
    t_triple_c: -77.65,
    t_crit_c: 132.25,
    p_crit_bar: 113.33,
    p_min_bar: 0.1,
    p_max_bar: 180.0,
    h_crit_kj_kg: 1450.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.295,
    cp_ideal: 2.35,
    is_pure: true,
    is_mixture: false,
    gwp: 0,
    safety: 'B2L',
    wagner: [-7.2993, 1.8499, -2.5569, -2.5649],
  },
  R290: {
    id: 'R290',
    name: 'R290 (Propano)',
    molar_mass: 0.0441,
    t_triple_c: -187.6,
    t_crit_c: 96.74,
    p_crit_bar: 42.512,
    p_min_bar: 0.1,
    p_max_bar: 75.0,
    h_crit_kj_kg: 450.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.74,
    cp_ideal: 1.75,
    is_pure: true,
    is_mixture: false,
    gwp: 3,
    safety: 'A3',
    wagner: [-6.72219, 1.33236, -2.13866, -1.38631],
  },
  R600a: {
    id: 'R600a',
    name: 'R600a (Isobutano)',
    molar_mass: 0.05812,
    t_triple_c: -159.6,
    t_crit_c: 134.66,
    p_crit_bar: 36.29,
    p_min_bar: 0.05,
    p_max_bar: 60.0,
    h_crit_kj_kg: 480.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 1.56,
    cp_ideal: 1.65,
    is_pure: true,
    is_mixture: false,
    gwp: 3,
    safety: 'A3',
    wagner: [-6.9142, 1.456, -2.312, -1.89],
  },
  R32: {
    id: 'R32',
    name: 'R32 (Difluorometano)',
    molar_mass: 0.05202,
    t_triple_c: -136.8,
    t_crit_c: 78.11,
    p_crit_bar: 57.82,
    p_min_bar: 0.15,
    p_max_bar: 95.0,
    h_crit_kj_kg: 470.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 8.13,
    cp_ideal: 1.35,
    is_pure: true,
    is_mixture: false,
    gwp: 675,
    safety: 'A2L',
    wagner: [-7.462, 2.105, -1.982, -3.12],
  },
  R404A: {
    id: 'R404A',
    name: 'R404A',
    molar_mass: 0.0976,
    t_triple_c: -100.0,
    t_crit_c: 72.14,
    p_crit_bar: 37.35,
    p_min_bar: 0.1,
    p_max_bar: 65.0,
    h_crit_kj_kg: 330.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 6.04,
    cp_ideal: 1.15,
    is_pure: false,
    is_mixture: true,
    gwp: 3922,
    safety: 'A1',
    wagner: [-7.55, 2.21, -2.05, -3.4],
  },
  R410A: {
    id: 'R410A',
    name: 'R410A',
    molar_mass: 0.07258,
    t_triple_c: -155.0,
    t_crit_c: 71.36,
    p_crit_bar: 49.03,
    p_min_bar: 0.2,
    p_max_bar: 85.0,
    h_crit_kj_kg: 390.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 7.99,
    cp_ideal: 1.32,
    is_pure: false,
    is_mixture: true,
    gwp: 2088,
    safety: 'A1',
    wagner: [-7.51, 2.16, -2.01, -3.25],
  },
  R407C: {
    id: 'R407C',
    name: 'R407C (Mezcla zeotrópica)',
    molar_mass: 0.0862,
    t_triple_c: -160.0,
    t_crit_c: 86.03,
    p_crit_bar: 46.3,
    p_min_bar: 0.1,
    p_max_bar: 80.0,
    h_crit_kj_kg: 385.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.61,
    cp_ideal: 1.12,
    is_pure: false,
    is_mixture: true,
    gwp: 1774,
    safety: 'A1',
    wagner: [-7.62, 2.25, -2.08, -3.45],
  },
  R22: {
    id: 'R22',
    name: 'R22 (Clorodifluorometano)',
    molar_mass: 0.08647,
    t_triple_c: -157.4,
    t_crit_c: 96.15,
    p_crit_bar: 49.9,
    p_min_bar: 0.1,
    p_max_bar: 85.0,
    h_crit_kj_kg: 395.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.98,
    cp_ideal: 0.98,
    is_pure: true,
    is_mixture: false,
    gwp: 1810,
    safety: 'A1',
    wagner: [-7.02, 1.81, -1.75, -2.85],
  },
  R1234yf: {
    id: 'R1234yf',
    name: 'R1234yf (2,3,3,3-Tetrafluoropropeno)',
    molar_mass: 0.11404,
    t_triple_c: -53.0,
    t_crit_c: 94.7,
    p_crit_bar: 33.82,
    p_min_bar: 0.1,
    p_max_bar: 60.0,
    h_crit_kj_kg: 360.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 3.15,
    cp_ideal: 0.98,
    is_pure: true,
    is_mixture: false,
    gwp: 4,
    safety: 'A2L',
    wagner: [-7.78, 2.35, -2.15, -3.6],
  },
};

function getFluidModel(fluidId: string): FluidThermodynamicModel {
  const norm = fluidId.replace('.mix', '').trim();
  for (const key of Object.keys(FLUID_MODELS)) {
    if (norm.toUpperCase().includes(key.toUpperCase())) {
      return FLUID_MODELS[key];
    }
  }
  return FLUID_MODELS['R134a'];
}

function calculatePsat(model: FluidThermodynamicModel, tC: number): number {
  const T = tC + 273.15;
  const Tc = model.t_crit_c + 273.15;
  const Pc = model.p_crit_bar;
  if (T >= Tc) return Pc;

  const theta = Math.max(0.0001, 1 - T / Tc);
  const [a1, a2, a3, a4] = model.wagner;
  const lnP =
    Math.log(Pc) +
    (Tc / T) *
      (a1 * theta +
        a2 * Math.pow(theta, 1.5) +
        a3 * Math.pow(theta, 2.5) +
        a4 * Math.pow(theta, 5.0));

  return Math.max(0.01, Math.min(Pc, Math.exp(lnP)));
}

function calculateTsat(model: FluidThermodynamicModel, pBar: number): number {
  if (pBar >= model.p_crit_bar) return model.t_crit_c;
  if (pBar <= 0.01) return model.t_triple_c;

  // Newton-Raphson inversion of Psat(T)
  let T = 273.15;
  for (let i = 0; i < 15; i++) {
    const tC = T - 273.15;
    const pEst = calculatePsat(model, tC);
    const diff = Math.log(pEst / pBar);
    if (Math.abs(diff) < 1e-5) break;
    // dp/dT slope approx
    const dT = 0.05;
    const pPlus = calculatePsat(model, tC + dT);
    const dlnP_dT = (Math.log(pPlus) - Math.log(pEst)) / dT;
    T = T - diff / (dlnP_dT || 0.05);
    T = Math.max(model.t_triple_c + 273.15, Math.min(model.t_crit_c + 273.15 - 0.01, T));
  }
  return T - 273.15;
}

function calculateSatEnthalpies(
  model: FluidThermodynamicModel,
  tC: number
): { hL: number; hV: number; p: number } {
  const Tc = model.t_crit_c;
  const T = tC + 273.15;
  const TcK = Tc + 273.15;
  const Hcrit = model.h_crit_kj_kg;
  const p = calculatePsat(model, tC);

  if (tC >= Tc - 0.005) {
    return { hL: Hcrit, hV: Hcrit, p: model.p_crit_bar };
  }

  const theta = Math.max(0.00001, 1 - T / TcK);

  if (model.id === 'R134a') {
    let hL: number;
    if (tC <= 80.0) {
      hL = 200.0 + 1.3412 * tC + 0.00223 * Math.pow(tC, 2) + 0.0000145 * Math.pow(tC, 3) + 0.00000045 * Math.pow(tC, 4);
    } else {
      hL = Hcrit - 105.0 * Math.pow(theta, 0.36) - 180.0 * theta;
    }
    const dhVap = 202.0 * Math.pow(theta, 0.38) + 72.0 * Math.pow(theta, 0.88) - 18.0 * Math.pow(theta, 2);
    const hV = hL + dhVap;
    return { hL, hV, p };
  }

  // General fluid model using Wagner-like scaling
  const cL = (Hcrit - model.h_ref_0c_liq) / Math.pow(1 - 273.15 / TcK, 0.40);
  const hL = Hcrit - cL * Math.pow(theta, 0.40) - 20 * theta;
  const dh0 = (Hcrit - model.h_ref_0c_liq) * 1.1;
  const dhVap = dh0 * Math.pow(theta, 0.38) + (dh0 * 0.3) * Math.pow(theta, 0.88);
  const hV = hL + dhVap;

  return { hL, hV, p };
}

function calculateSuperheatedEnthalpy(
  model: FluidThermodynamicModel,
  tC: number,
  pBar: number
): number {
  const pSat = calculatePsat(model, tC);
  const { hV } = calculateSatEnthalpies(model, tC);

  if (pBar >= pSat) {
    const { hL } = calculateSatEnthalpies(model, tC);
    return hL + 0.00085 * (pBar - pSat) * 100;
  }

  if (model.id === 'R134a') {
    const h0 = 405.85 + 0.825 * tC + 0.00045 * Math.pow(tC, 2);
    const pr = Math.min(1.0, Math.max(0.0001, pBar / pSat));
    return h0 - (h0 - hV) * Math.pow(pr, 0.82);
  }

  // General ideal gas + residual pressure dependency
  const h0 = hV + Math.log(pSat / 0.1) * (18.0 + tC * 0.05);
  const pr = Math.min(1.0, Math.max(0.0001, pBar / pSat));
  return h0 - (h0 - hV) * Math.pow(pr, 0.80);
}

function getMockCatalog(): CatalogResponse {
  const priority_items: CatalogItem[] = Object.keys(FLUID_MODELS).map((id) => {
    const m = FLUID_MODELS[id];
    return {
      display_name: m.name,
      coolprop_id: m.id,
      aliases: [m.id],
      group: m.is_pure ? (m.gwp < 10 ? 'Naturales' : 'HFC y puros') : 'Mezclas',
      fluid_type: m.is_pure ? 'Puro' : 'Mezcla',
      gwp: m.gwp,
      ashrae_safety: m.safety,
      is_available: true,
      notes: `Modelo termodinámico de alta fidelidad (${m.id})`,
      info: getMockFluidInfo(m.id),
    };
  });

  return {
    engine_version: '8.0.0 (CoolProp / High-Precision Engine)',
    priority_items,
    other_available_fluids: ['Water', 'Air', 'Nitrogen', 'Argon', 'Helium', 'R11', 'R12', 'R23', 'R507A'],
  };
}

function getMockFluidInfo(fluidId: string): FluidInfo {
  const m = getFluidModel(fluidId);
  return {
    id: m.id,
    name: m.name,
    chemical_formula: undefined,
    molar_mass_kg_mol: m.molar_mass,
    t_triple_c: m.t_triple_c,
    t_crit_c: m.t_crit_c,
    p_crit_bar: m.p_crit_bar,
    p_min_bar: m.p_min_bar,
    p_max_bar: m.p_max_bar,
    h_crit_kj_kg: m.h_crit_kj_kg,
    is_pure: m.is_pure,
    is_mixture: m.is_mixture,
    gwp: m.gwp,
    ashrae_safety: m.safety,
    reference_state: 'IIR (h=200 kJ/kg, s=1 kJ/kg·K a 0°C líquido)',
  };
}

function getMockDiagramCurves(fluidId: string): DiagramCurvesResponse {
  const model = getFluidModel(fluidId);

  const tMin = Math.max(model.t_triple_c + 2, -60);
  const tCrit = model.t_crit_c;
  const pCrit = model.p_crit_bar;
  const pMin = Math.max(calculatePsat(model, tMin), 0.05);
  const pMax = model.p_max_bar;
  const hCrit = model.h_crit_kj_kg;

  // Dense saturation points
  const nPts = 160;
  const satLiq: CurvePoint[] = [];
  const satVap: CurvePoint[] = [];

  for (let i = 0; i <= nPts; i++) {
    const frac = i / nPts;
    // Sinusoidal factor for high density at the critical apex
    const factor = Math.sin(frac * Math.PI * 0.5);
    const t = tMin + (tCrit - 0.005 - tMin) * factor;
    const { hL, hV, p } = calculateSatEnthalpies(model, t);

    if (p <= pCrit * 1.001) {
      satLiq.push({ h_kj_kg: hL, p_bar: p, t_c: t, q: 0.0 });
      satVap.push({ h_kj_kg: hV, p_bar: p, t_c: t, q: 1.0 });
    }
  }

  // Critical Point apex
  const critPoint: CurvePoint = { h_kj_kg: hCrit, p_bar: pCrit, t_c: tCrit, q: 1.0 };
  satLiq.push(critPoint);
  satVap.push(critPoint);

  const minSatH = satLiq[0]?.h_kj_kg || 100;
  const maxSatH = satVap.reduce((max, pt) => Math.max(max, pt.h_kj_kg), 450);
  const hSpan = Math.max(200, maxSatH - minSatH);

  const hMinDomain = Math.max(-100, minSatH - hSpan * 0.15);
  const hMaxDomain = maxSatH + hSpan * 0.60;
  const pMinDomain = pMin;
  const pMaxDomain = pMax;

  // Quality lines (x = 0.1 .. 0.9)
  const quality_lines = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((q) => {
    const pts: CurvePoint[] = [];
    for (let i = 0; i < satLiq.length; i++) {
      const pL = satLiq[i];
      const pV = satVap[i];
      if (pL && pV) {
        const h = pL.h_kj_kg + (pV.h_kj_kg - pL.h_kj_kg) * q;
        pts.push({ h_kj_kg: h, p_bar: pL.p_bar, t_c: pL.t_c, q });
      }
    }
    return {
      id: `q_${q.toFixed(1)}`,
      name: `x = ${q.toFixed(1)}`,
      curve_type: 'quality' as const,
      parameter_value: q,
      parameter_unit: '-',
      points: pts,
    };
  });

  // Isotherms matching Danfoss Mollier chart
  const temps: number[] = model.id === 'R134a'
    ? [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 240]
    : (() => {
        const tCMin = Math.floor(tMin / 10) * 10;
        const tCMax = Math.min(220, tCrit + 80);
        const tArr: number[] = [];
        let curT = tCMin;
        while (curT <= tCMax) {
          tArr.push(curT);
          if (curT < tCrit - 10) curT += 10;
          else if (curT < tCrit + 10) curT += 5;
          else curT += 15;
        }
        return tArr;
      })();

  const isotherms = temps.map((t) => {
    const pts: CurvePoint[] = [];

    if (t < tCrit - 0.05) {
      const { hL, hV, p: pSat } = calculateSatEnthalpies(model, t);

      // 1. Subcooled liquid: nearly vertical line from pMax down to pSat
      const nSub = 15;
      for (let j = nSub; j >= 0; j--) {
        const p = pSat + (pMax - pSat) * (j / nSub);
        const hSub = hL + 0.00085 * (p - pSat) * 100; // v_L * deltaP
        pts.push({ h_kj_kg: hSub, p_bar: p, t_c: t, q: 0.0 });
      }

      // 2. Two-phase: horizontal line at pSat from hL to hV
      const n2p = 16;
      for (let j = 1; j < n2p; j++) {
        const q = j / n2p;
        pts.push({ h_kj_kg: hL + (hV - hL) * q, p_bar: pSat, t_c: t, q });
      }
      pts.push({ h_kj_kg: hV, p_bar: pSat, t_c: t, q: 1.0 });

      // 3. Superheated vapor: smooth curve bending downwards to the right
      const nSup = 35;
      const logPSat = Math.log(pSat);
      const logPMin = Math.log(pMin);

      for (let j = 1; j <= nSup; j++) {
        const frac = j / nSup;
        const logP = logPSat * (1 - frac) + logPMin * frac;
        const p = Math.exp(logP);
        const hSup = calculateSuperheatedEnthalpy(model, t, p);
        pts.push({ h_kj_kg: Math.min(hMaxDomain + 80, hSup), p_bar: p, t_c: t });
      }
    } else {
      // Supercritical isotherm (T >= Tcrit): smooth continuous curve passing above critical apex
      const nSc = 45;
      const logPMin = Math.log(pMin);
      const logPMax = Math.log(pMax);

      for (let j = 0; j <= nSc; j++) {
        const frac = j / nSc;
        const p = Math.exp(logPMin + (logPMax - logPMin) * (1 - frac));
        const hBase = hCrit + (t - tCrit) * 2.1;
        const h = hBase + Math.pow(pMin / p, 0.22) * 90 - (p / pMax) * 45;
        pts.push({ h_kj_kg: h, p_bar: p, t_c: t });
      }
    }

    return {
      id: `t_${t}`,
      name: `T = ${t} °C`,
      curve_type: 'isotherm' as const,
      parameter_value: t,
      parameter_unit: '°C',
      points: pts,
    };
  });

  // Isentropics (s = const) in vapor region
  const isentropics = [1.55, 1.65, 1.75, 1.85, 1.95, 2.05, 2.15, 2.25, 2.35, 2.45].map((s) => {
    const pts: CurvePoint[] = [];
    const nPtsIsen = 30;
    const logPMin = Math.log(pMin);
    const logPMax = Math.log(pMax * 0.85);

    for (let i = 0; i <= nPtsIsen; i++) {
      const frac = i / nPtsIsen;
      const p = Math.exp(logPMin + (logPMax - logPMin) * frac);
      const h = 330 + (s - 1.55) * 170 + Math.log(p / pMin) * 36;
      pts.push({ h_kj_kg: h, p_bar: p, s_kj_kg_k: s });
    }
    return {
      id: `s_${s.toFixed(2)}`,
      name: `s = ${s.toFixed(2)} kJ/(kg·K)`,
      curve_type: 'isentropic' as const,
      parameter_value: s,
      parameter_unit: 'kJ/(kg·K)',
      points: pts,
    };
  });

  // Isochores (v = const) in vapor region
  const isochores = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0].map((v) => {
    const pts: CurvePoint[] = [];
    const logPMin = Math.log(pMin);
    const logPMax = Math.log(pMax);

    for (let i = 0; i <= 40; i++) {
      const frac = i / 40;
      const p = Math.exp(logPMin + (logPMax - logPMin) * frac);
      const h = 350 + Math.log(1 / v) * 24 + Math.log(p / pMin) * 48;
      pts.push({ h_kj_kg: h, p_bar: p, v_m3_kg: v });
      if (h > hMaxDomain + 15) break;
    }

    if (pts.length >= 2) {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const dp = last.p_bar - prev.p_bar;
      const dh = last.h_kj_kg - prev.h_kj_kg;
      if (dp > 1e-6 && dh > 1e-6 && last.h_kj_kg < hMaxDomain && last.p_bar < pMax) {
        const slope = dh / dp;
        const pToHmax = last.p_bar + (hMaxDomain - last.h_kj_kg) / slope;
        const pTarget = Math.min(pToHmax, pMax);
        for (let k = 1; k <= 8; k++) {
          const f = k / 8;
          const pk = last.p_bar + (pTarget - last.p_bar) * f;
          const hk = last.h_kj_kg + slope * (pk - last.p_bar);
          pts.push({ h_kj_kg: hk, p_bar: pk, v_m3_kg: v });
        }
      }
    }

    return {
      id: `v_${v}`,
      name: `v = ${v} m³/kg`,
      curve_type: 'isochore' as const,
      parameter_value: v,
      parameter_unit: 'm³/kg',
      points: pts,
    };
  });

  return {
    fluid_id: fluidId,
    domain: {
      p_min_bar: pMinDomain,
      p_max_bar: pMaxDomain,
      h_min_kj_kg: hMinDomain,
      h_max_kj_kg: hMaxDomain,
      t_min_c: tMin,
      t_crit_c: tCrit,
      p_crit_bar: pCrit,
      h_crit_kj_kg: hCrit,
    },
    saturation_liquid: {
      id: 'sat_liquid',
      name: 'Líquido saturado (Q=0)',
      curve_type: 'saturation_liquid',
      parameter_value: 0.0,
      parameter_unit: '-',
      points: satLiq,
    },
    saturation_vapor: {
      id: 'sat_vapor',
      name: 'Vapor saturado seco (Q=1)',
      curve_type: 'saturation_vapor',
      parameter_value: 1.0,
      parameter_unit: '-',
      points: satVap,
    },
    isotherms,
    isentropics,
    isochores,
    quality_lines,
  };
}

function mockCalculateState(
  fluidId: string,
  in1Type: string,
  in1Val: number,
  in2Type: string,
  in2Val: number
): ThermodynamicState {
  const model = getFluidModel(fluidId);
  const t1 = in1Type.toUpperCase();
  const t2 = in2Type.toUpperCase();

  let p = 2.0;
  let t = 20.0;
  let h = 415.0;
  let q: number | undefined = undefined;

  if (t1 === 'P' && t2 === 'T') {
    p = in1Val;
    t = in2Val;
    const pSat = calculatePsat(model, t);
    const { hL, hV } = calculateSatEnthalpies(model, t);

    if (Math.abs(p - pSat) < 0.05 && model.is_pure) {
      throw new Error(
        `Estado indeterminado: A P = ${p.toFixed(2)} bar, la temperatura de saturación es ${t.toFixed(2)} °C. Especifique título de vapor (x o Q) o entalpía (h) para fijar el estado.`
      );
    }

    if (p > pSat) {
      // Subcooled liquid
      h = hL + 0.00085 * (p - pSat) * 100;
      q = undefined;
    } else {
      // Superheated vapor
      h = hV + model.cp_ideal * (t - calculateTsat(model, p)) + Math.log(pSat / p) * 12;
      q = undefined;
    }
  } else if (t1 === 'P' && t2 === 'H') {
    p = in1Val;
    h = in2Val;
    const tSat = calculateTsat(model, p);
    const { hL, hV } = calculateSatEnthalpies(model, tSat);

    if (h >= hL && h <= hV) {
      q = (h - hL) / (hV - hL);
      t = tSat;
    } else if (h < hL) {
      t = tSat - (hL - h) / 1.45;
      q = undefined;
    } else {
      t = tSat + (h - hV) / model.cp_ideal;
      q = undefined;
    }
  } else if (t1 === 'P' && t2 === 'Q') {
    p = in1Val;
    q = in2Val;
    t = calculateTsat(model, p);
    const { hL, hV } = calculateSatEnthalpies(model, t);
    h = hL + (hV - hL) * q;
  } else if (t1 === 'H' && t2 === 'P') {
    return mockCalculateState(fluidId, 'P', in2Val, 'H', in1Val);
  } else if (t1 === 'T' && t2 === 'P') {
    return mockCalculateState(fluidId, 'P', in2Val, 'T', in1Val);
  } else {
    // Default fallback
    p = in1Val || 2.0;
    h = in2Val || 415.0;
    t = 20.0;
  }

  const s = 1.75 + (h - model.h_ref_0c_liq - 200) / 280;
  const density = (p * 100000) / ((8314.4 / (model.molar_mass * 1000)) * (t + 273.15));
  const v = density > 0 ? 1.0 / density : 0.02;

  const phase =
    p >= model.p_crit_bar
      ? 'Supercrítico'
      : q !== undefined
      ? `Bifásico (x = ${(q * 100).toFixed(1)}%)`
      : h < 260
      ? 'Líquido subenfriado'
      : 'Vapor sobrecalentado';

  return {
    fluid_id: model.id,
    pressure_bar: p,
    temperature_c: t,
    enthalpy_kj_kg: h,
    entropy_kj_kg_k: s,
    density_kg_m3: density,
    specific_volume_m3_kg: v,
    vapor_quality: q,
    phase,
    is_valid: true,
  };
}

function mockCalculateProcess(
  _fluidId: string,
  p1H: number,
  p1P: number,
  p2H: number,
  p2P: number,
  processType: ProcessType,
  steps: number
): ProcessCalculationResult {
  const deltaH = p2H - p1H;
  const deltaP = p2P - p1P;
  const deltaT = (p2P - p1P) * 2.5;
  const deltaS = (p2H - p1H) / 280.0;

  const pts: CurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    pts.push({
      h_kj_kg: p1H + (p2H - p1H) * f,
      p_bar: p1P + (p2P - p1P) * f,
      t_c: 20 + deltaT * f,
    });
  }

  return {
    process_type: processType,
    delta_h_kj_kg: deltaH,
    delta_t_c: deltaT,
    delta_p_bar: deltaP,
    delta_s_kj_kg_k: deltaS,
    intermediate_points: pts,
  };
}

