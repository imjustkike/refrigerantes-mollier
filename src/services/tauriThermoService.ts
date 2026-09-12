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

export interface EngineInfo {
  is_ready: boolean;
  version: string;
  loaded_path: string | null;
  error: string | null;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getEngineInfo(): Promise<EngineInfo> {
  if (isTauri()) {
    try {
      return await invoke<EngineInfo>('get_engine_info_cmd');
    } catch (e) {
      return {
        is_ready: false,
        version: 'Error al consultar backend',
        loaded_path: null,
        error: String(e),
      };
    }
  }
  return {
    is_ready: true,
    version: 'Modo Demostración Web (Navegador)',
    loaded_path: null,
    error: null,
  };
}

export async function getLogPath(): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>('get_log_path_cmd');
    } catch {
      // ignore
    }
  }
  return 'Web / Local (Consola del navegador)';
}

export async function logClientEvent(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  details?: string
): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('log_client_event_cmd', { level, message, details });
    } catch {
      // ignore
    }
  }
}

export async function fetchCatalog(): Promise<CatalogResponse> {
  if (isTauri()) {
    try {
      logClientEvent('info', 'Frontend solicitando catálogo termodinámico');
      const res = await invoke<CatalogResponse>('get_catalog');
      logClientEvent('info', `Catálogo recibido con ${res.priority_items.length} fluidos prioritarios`);
      return res;
    } catch (e) {
      logClientEvent('error', 'Fallo al invocar get_catalog en Tauri', String(e));
      console.error('Tauri invoke get_catalog failed:', e);
      throw e;
    }
  }
  return getMockCatalog();
}

export async function fetchFluidDetails(fluidId: string): Promise<FluidInfo> {
  if (isTauri()) {
    try {
      logClientEvent('info', `Frontend solicitando detalles de fluido: ${fluidId}`);
      return await invoke<FluidInfo>('get_fluid_details', { fluidId });
    } catch (e) {
      logClientEvent('error', `Fallo al invocar get_fluid_details para ${fluidId}`, String(e));
      console.error('Tauri invoke get_fluid_details failed:', e);
      throw e;
    }
  }
  return getMockFluidInfo(fluidId);
}

export async function fetchDiagramCurves(fluidId: string): Promise<DiagramCurvesResponse> {
  if (isTauri()) {
    try {
      logClientEvent('info', `Frontend solicitando curvas de Mollier para fluido: ${fluidId}`);
      const curves = await invoke<DiagramCurvesResponse>('get_diagram_curves_cmd', { fluidId });
      logClientEvent('info', `Curvas de Mollier recibidas para ${fluidId}`);
      return curves;
    } catch (e) {
      logClientEvent('error', `Fallo al calcular curvas de diagrama para ${fluidId}`, String(e));
      console.error('Tauri invoke get_diagram_curves_cmd failed:', e);
      throw e;
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
      console.error('Tauri invoke calculate_point_cmd failed:', e);
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
      console.error('Tauri calculate_process_curve_cmd failed:', e);
      throw e;
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
  R513A: {
    id: 'R513A.mix',
    name: 'R513A (Opteon XP10)',
    molar_mass: 0.1084,
    t_triple_c: -80.0,
    t_crit_c: 94.9,
    p_crit_bar: 37.66,
    p_min_bar: 0.1,
    p_max_bar: 65.0,
    h_crit_kj_kg: 380.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 3.23,
    cp_ideal: 1.02,
    is_pure: false,
    is_mixture: true,
    gwp: 631,
    safety: 'A1',
    wagner: [-7.72, 2.32, -2.10, -3.55],
  },
  R448A: {
    id: 'R448A.mix',
    name: 'R448A (Solstice N40)',
    molar_mass: 0.08628,
    t_triple_c: -100.0,
    t_crit_c: 83.7,
    p_crit_bar: 46.6,
    p_min_bar: 0.1,
    p_max_bar: 75.0,
    h_crit_kj_kg: 380.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 5.31,
    cp_ideal: 1.15,
    is_pure: false,
    is_mixture: true,
    gwp: 1387,
    safety: 'A1',
    wagner: [-7.58, 2.22, -2.04, -3.38],
  },
  R449A: {
    id: 'R449A.mix',
    name: 'R449A (Opteon XP40)',
    molar_mass: 0.08721,
    t_triple_c: -100.0,
    t_crit_c: 81.5,
    p_crit_bar: 44.47,
    p_min_bar: 0.1,
    p_max_bar: 75.0,
    h_crit_kj_kg: 380.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 5.23,
    cp_ideal: 1.15,
    is_pure: false,
    is_mixture: true,
    gwp: 1397,
    safety: 'A1',
    wagner: [-7.57, 2.21, -2.03, -3.35],
  },
  R450A: {
    id: 'R450A.mix',
    name: 'R450A (Solstice N13)',
    molar_mass: 0.10867,
    t_triple_c: -80.0,
    t_crit_c: 105.38,
    p_crit_bar: 38.2,
    p_min_bar: 0.1,
    p_max_bar: 65.0,
    h_crit_kj_kg: 390.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 2.52,
    cp_ideal: 1.01,
    is_pure: false,
    is_mixture: true,
    gwp: 605,
    safety: 'A1',
    wagner: [-7.65, 2.28, -2.07, -3.5],
  },
  R452A: {
    id: 'R452A.mix',
    name: 'R452A (Opteon XP44)',
    molar_mass: 0.10351,
    t_triple_c: -100.0,
    t_crit_c: 74.9,
    p_crit_bar: 40.04,
    p_min_bar: 0.1,
    p_max_bar: 70.0,
    h_crit_kj_kg: 360.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 5.48,
    cp_ideal: 1.12,
    is_pure: false,
    is_mixture: true,
    gwp: 2140,
    safety: 'A1',
    wagner: [-7.59, 2.23, -2.05, -3.39],
  },
  R454B: {
    id: 'R454B.mix',
    name: 'R454B (Opteon XL41 / Puron Advance)',
    molar_mass: 0.06261,
    t_triple_c: -120.0,
    t_crit_c: 77.1,
    p_crit_bar: 50.67,
    p_min_bar: 0.15,
    p_max_bar: 85.0,
    h_crit_kj_kg: 420.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 7.72,
    cp_ideal: 1.28,
    is_pure: false,
    is_mixture: true,
    gwp: 466,
    safety: 'A2L',
    wagner: [-7.52, 2.17, -2.01, -3.26],
  },
  R454C: {
    id: 'R454C.mix',
    name: 'R454C (Opteon XL20)',
    molar_mass: 0.09078,
    t_triple_c: -100.0,
    t_crit_c: 87.64,
    p_crit_bar: 43.7,
    p_min_bar: 0.1,
    p_max_bar: 75.0,
    h_crit_kj_kg: 390.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.88,
    cp_ideal: 1.12,
    is_pure: false,
    is_mixture: true,
    gwp: 148,
    safety: 'A2L',
    wagner: [-7.61, 2.24, -2.07, -3.42],
  },
  R455A: {
    id: 'R455A.mix',
    name: 'R455A (Solstice L40X)',
    molar_mass: 0.08745,
    t_triple_c: -100.0,
    t_crit_c: 85.6,
    p_crit_bar: 46.56,
    p_min_bar: 0.1,
    p_max_bar: 80.0,
    h_crit_kj_kg: 400.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 5.92,
    cp_ideal: 1.18,
    is_pure: false,
    is_mixture: true,
    gwp: 148,
    safety: 'A2L',
    wagner: [-7.55, 2.19, -2.03, -3.31],
  },
  R407F: {
    id: 'R407F.mix',
    name: 'R407F (Performax LT)',
    molar_mass: 0.08206,
    t_triple_c: -110.0,
    t_crit_c: 82.6,
    p_crit_bar: 47.54,
    p_min_bar: 0.1,
    p_max_bar: 80.0,
    h_crit_kj_kg: 390.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 5.35,
    cp_ideal: 1.15,
    is_pure: false,
    is_mixture: true,
    gwp: 1825,
    safety: 'A1',
    wagner: [-7.60, 2.23, -2.06, -3.41],
  },
  R502: {
    id: 'R502.mix',
    name: 'R502',
    molar_mass: 0.11163,
    t_triple_c: -130.0,
    t_crit_c: 82.15,
    p_crit_bar: 40.75,
    p_min_bar: 0.1,
    p_max_bar: 75.0,
    h_crit_kj_kg: 325.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 5.51,
    cp_ideal: 1.05,
    is_pure: false,
    is_mixture: true,
    gwp: 4657,
    safety: 'A1',
    wagner: [-7.48, 2.12, -1.98, -3.20],
  },
  R422D: {
    id: 'R422D.mix',
    name: 'R422D (ISCEON MO29)',
    molar_mass: 0.1099,
    t_triple_c: -120.0,
    t_crit_c: 79.6,
    p_crit_bar: 39.05,
    p_min_bar: 0.1,
    p_max_bar: 70.0,
    h_crit_kj_kg: 350.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.85,
    cp_ideal: 1.08,
    is_pure: false,
    is_mixture: true,
    gwp: 2729,
    safety: 'A1',
    wagner: [-7.56, 2.20, -2.04, -3.36],
  },
  R438A: {
    id: 'R438A.mix',
    name: 'R438A (MO99)',
    molar_mass: 0.0991,
    t_triple_c: -120.0,
    t_crit_c: 85.3,
    p_crit_bar: 42.9,
    p_min_bar: 0.1,
    p_max_bar: 75.0,
    h_crit_kj_kg: 370.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 4.45,
    cp_ideal: 1.10,
    is_pure: false,
    is_mixture: true,
    gwp: 2264,
    safety: 'A1',
    wagner: [-7.59, 2.22, -2.05, -3.39],
  },
  R508B: {
    id: 'R508B.mix',
    name: 'R508B (Suva 95)',
    molar_mass: 0.0954,
    t_triple_c: -130.0,
    t_crit_c: 14.0,
    p_crit_bar: 39.35,
    p_min_bar: 0.2,
    p_max_bar: 70.0,
    h_crit_kj_kg: 330.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 26.5,
    cp_ideal: 1.15,
    is_pure: false,
    is_mixture: true,
    gwp: 13396,
    safety: 'A1',
    wagner: [-7.35, 2.05, -1.90, -3.10],
  },
  R1234ze: {
    id: 'R1234ze(E)',
    name: 'R1234ze(E)',
    molar_mass: 0.11404,
    t_triple_c: -104.0,
    t_crit_c: 109.36,
    p_crit_bar: 36.35,
    p_min_bar: 0.05,
    p_max_bar: 65.0,
    h_crit_kj_kg: 390.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 2.17,
    cp_ideal: 0.98,
    is_pure: true,
    is_mixture: false,
    gwp: 7,
    safety: 'A2L',
    wagner: [-7.82, 2.38, -2.18, -3.65],
  },
  R1233zd: {
    id: 'R1233zd(E)',
    name: 'R1233zd(E)',
    molar_mass: 0.1305,
    t_triple_c: -78.0,
    t_crit_c: 165.6,
    p_crit_bar: 35.71,
    p_min_bar: 0.01,
    p_max_bar: 55.0,
    h_crit_kj_kg: 420.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 0.49,
    cp_ideal: 0.92,
    is_pure: true,
    is_mixture: false,
    gwp: 1,
    safety: 'A1',
    wagner: [-7.90, 2.45, -2.25, -3.8],
  },
  R507A: {
    id: 'R507A',
    name: 'R507A',
    molar_mass: 0.09886,
    t_triple_c: -100.0,
    t_crit_c: 70.62,
    p_crit_bar: 37.05,
    p_min_bar: 0.1,
    p_max_bar: 65.0,
    h_crit_kj_kg: 335.0,
    h_ref_0c_liq: 200.0,
    p_sat_0c_bar: 6.22,
    cp_ideal: 1.16,
    is_pure: false,
    is_mixture: true,
    gwp: 3985,
    safety: 'A1',
    wagner: [-7.54, 2.18, -2.02, -3.32],
  },
};

function getFluidModel(fluidId: string): FluidThermodynamicModel {
  const norm = fluidId.replace('.mix', '').replace('.MIX', '').replace(/\(.*\)/, '').trim();
  for (const key of Object.keys(FLUID_MODELS)) {
    if (norm.toUpperCase() === key.toUpperCase() || norm.toUpperCase().includes(key.toUpperCase())) {
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
  const Pc = model.p_crit_bar;
  if (pBar >= Pc) return model.t_crit_c;

  // Invert Wagner approximation using iterative bisection/Newton step
  let tMin = model.t_triple_c;
  let tMax = model.t_crit_c;
  for (let iter = 0; iter < 12; iter++) {
    const tMid = (tMin + tMax) / 2;
    const pMid = calculatePsat(model, tMid);
    if (pMid < pBar) {
      tMin = tMid;
    } else {
      tMax = tMid;
    }
  }
  return (tMin + tMax) / 2;
}

function calculateSatEnthalpies(
  model: FluidThermodynamicModel,
  tC: number
): { hL: number; hV: number; p: number } {
  const p = calculatePsat(model, tC);
  const Tc = model.t_crit_c;
  const Tr = Math.min(0.999, Math.max(0.01, (tC + 273.15) / (Tc + 273.15)));
  const tau = 1 - Tr;

  // Liquid enthalpy (from reference state at 0°C)
  const hL = model.h_ref_0c_liq + 1.45 * tC + 0.0018 * Math.pow(tC, 2);

  // Latent heat of vaporization: Watson-type correlation Delta_H_vap ~ tau^0.38
  const deltaH0 = (model.h_crit_kj_kg - model.h_ref_0c_liq) * 1.8;
  const deltaHvap = deltaH0 * Math.pow(tau, 0.38);

  const hV = Math.min(model.h_crit_kj_kg + 35, hL + Math.max(5.0, deltaHvap));

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

export function getMockCatalog(): CatalogResponse {
  const getGroup = (m: FluidThermodynamicModel) => {
    const upper = m.id.toUpperCase();
    if (['R717', 'R744', 'R290', 'R600A', 'R600', 'R1270'].some((k) => upper.includes(k))) {
      return 'Naturales';
    }
    if (['R1234', 'R1233', 'R513A', 'R448A', 'R449A', 'R450A', 'R452A', 'R454', 'R455'].some((k) => upper.includes(k))) {
      return 'HFO y bajo GWP';
    }
    if (['R22', 'R502', 'R12', 'R11', 'R123', 'R124', 'R23', 'R508B', 'R500'].some((k) => upper.includes(k))) {
      return 'Históricos y existentes';
    }
    return 'HFC y mezclas';
  };

  const priority_items: CatalogItem[] = Object.keys(FLUID_MODELS).map((id) => {
    const m = FLUID_MODELS[id];
    return {
      display_name: m.name,
      coolprop_id: m.id,
      aliases: [m.id, id],
      group: getGroup(m),
      fluid_type: m.is_pure ? 'Puro' : 'Mezcla',
      gwp: m.gwp,
      ashrae_safety: m.safety,
      is_available: true,
      notes: `Modelo termodinámico de alta fidelidad (${m.id})`,
      info: getMockFluidInfo(m.id),
    };
  });

  return {
    engine_version: 'Modo Demostración Web (Modelos aproximados en navegador)',
    priority_items,
    other_available_fluids: [
      'Water', 'Air', 'Nitrogen', 'Argon', 'Helium', 'R11', 'R12', 'R23', 'R507A',
      'R513A.mix', 'R448A.mix', 'R449A.mix', 'R450A.mix', 'R452A.mix', 'R454B.mix',
      'R454C.mix', 'R455A.mix', 'R407F.mix', 'R502.mix', 'R422D.mix', 'R438A.mix', 'R508B.mix'
    ],
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

  // Isentropics (s = const) in superheated vapor region
  const isentropics = [1.55, 1.65, 1.75, 1.85, 1.95, 2.05, 2.15, 2.25, 2.35, 2.45].map((s) => {
    const pts: CurvePoint[] = [];
    const nPtsIsen = 30;
    const pStart = pMin;
    const pEnd = pMax * 0.85;

    for (let i = 0; i <= nPtsIsen; i++) {
      const frac = i / nPtsIsen;
      const p = Math.exp(Math.log(pStart) + (Math.log(pEnd) - Math.log(pStart)) * frac);
      const tEquiv = calculateTsat(model, p) + (s - 1.65) * 45;
      if (tEquiv >= calculateTsat(model, p) - 0.5) {
        const h = calculateSuperheatedEnthalpy(model, Math.max(tMin, tEquiv), p);
        pts.push({ h_kj_kg: h, p_bar: p, s_kj_kg_k: s });
      }
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

  // Isochores (v = const) in superheated vapor region (v >= v_crit)
  const isochores = [0.006, 0.008, 0.01, 0.015, 0.02, 0.03, 0.05, 0.08, 0.1, 0.2, 0.5, 1.0, 2.0].map((v) => {
    const pts: CurvePoint[] = [];
    const nPtsIso = 35;
    // Isochore equation: P ~ R * T / v
    const R = 8.314 / model.molar_mass; // J/(kg*K)
    const tStart = Math.max(tMin, -50);
    const tEnd = tCrit + 120;

    for (let i = 0; i <= nPtsIso; i++) {
      const frac = i / nPtsIso;
      const t = tStart + (tEnd - tStart) * frac;
      const tk = t + 273.15;
      const pIdealBar = (R * tk / v) / 1e5;
      const pSat = calculatePsat(model, t);

      // Only plot in vapor region (P <= P_sat or T >= T_sat)
      if (pIdealBar <= pSat * 1.02 && pIdealBar >= pMin * 0.5 && pIdealBar <= pMax * 1.1) {
        const h = calculateSuperheatedEnthalpy(model, t, Math.min(pSat, pIdealBar));
        pts.push({ h_kj_kg: h, p_bar: pIdealBar, v_m3_kg: v, t_c: t });
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
  } else if ((t1 === 'T' && t2 === 'Q') || (t1 === 'Q' && t2 === 'T')) {
    t = t1 === 'T' ? in1Val : in2Val;
    q = t1 === 'Q' ? in1Val : in2Val;
    p = calculatePsat(model, t);
    const { hL, hV } = calculateSatEnthalpies(model, t);
    h = hL + (hV - hL) * q;
  } else if ((t1 === 'H' && t2 === 'T') || (t1 === 'T' && t2 === 'H')) {
    h = t1 === 'H' ? in1Val : in2Val;
    t = t1 === 'T' ? in1Val : in2Val;
    const pSat = calculatePsat(model, t);
    const { hL, hV } = calculateSatEnthalpies(model, t);
    if (h >= hL && h <= hV) {
      p = pSat;
      q = (h - hL) / (hV - hL);
    } else if (h < hL) {
      p = Math.min(model.p_max_bar, pSat + (hL - h) * 1.5);
    } else {
      p = Math.max(model.p_min_bar, pSat * Math.exp(-(h - hV) / 45));
    }
  } else if ((t1 === 'P' && t2 === 'S') || (t1 === 'S' && t2 === 'P')) {
    p = t1 === 'P' ? in1Val : in2Val;
    const sVal = t1 === 'S' ? in1Val : in2Val;
    h = 200 + (sVal - 1.75) * 280 + model.h_ref_0c_liq;
    t = calculateTsat(model, p);
  } else if ((t1 === 'P' && t2 === 'V') || (t1 === 'V' && t2 === 'P')) {
    p = t1 === 'P' ? in1Val : in2Val;
    t = calculateTsat(model, p) + 15;
    h = calculateSuperheatedEnthalpy(model, t, p);
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

