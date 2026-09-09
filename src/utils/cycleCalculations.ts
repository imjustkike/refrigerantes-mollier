import { DiagramPoint, DiagramConnection } from '../types/thermo';

export interface CycleCalculationResult {
  fluid: string;
  p_evap_bar: number;
  t_evap_c: number;
  p_cond_bar: number;
  t_cond_c: number;
  t_discharge_c: number;
  t_subcooling_k: number;
  t_superheat_k: number;

  // Exact enthalpy states according to user notation:
  // 1: Entrada evaporador (salida válvula)
  // 3: Salida evaporador / Aspiración compresor
  // 4: Descarga compresor / Entrada condensador
  // 6: Salida condensador / Entrada válvula
  h1_kj_kg: number;
  h3_kj_kg: number;
  h4_kj_kg: number;
  h6_kj_kg: number;

  // Specific volumes at key states
  v1_m3_kg: number;
  v3_suction_m3_kg: number;
  v4_discharge_m3_kg: number;
  v6_m3_kg: number;
  delta_v_m3_kg: number; // |v3 - v4| (variación en compresión)
  v_ratio: number;       // v3 / v4
  v_min_m3_kg: number;
  v_max_m3_kg: number;

  // Required thermodynamic metrics:
  // qevap = h3 - h1
  // wcomp = h4 - h3
  // qcond = h4 - h6 (o |h6 - h4|)
  q_evap_kj_kg: number;
  w_comp_kj_kg: number;
  q_cond_kj_kg: number;
  cop: number;           // qevap / wcomp = (h3 - h1) / (h4 - h3)
  cop_heat: number;      // qcond / wcomp = (h4 - h6) / (h4 - h3)
  compression_ratio: number; // P4 / P3 = P_cond / P_evap

  // Energy balance
  energy_in_kj_kg: number;          // qevap + wcomp = (h3 - h1) + (h4 - h3)
  energy_out_kj_kg: number;         // qcond = h4 - h6
  energy_balance_err_kj_kg: number; // |energy_in - energy_out|
  energy_balance_percent: number;
  is_balanced: boolean;

  // Point assignments
  has_valid_cycle: boolean;
  point1_id?: string;
  point3_id?: string;
  point4_id?: string;
  point6_id?: string;
}

/**
 * Calculates complete thermodynamic cycle parameters from diagram points and connections
 * according to the standard refrigeration numbering:
 * - Point 1: Entrada evaporador (h1)
 * - Point 3: Salida evaporador / Aspiración compresor (h3)
 * - Point 4: Descarga compresor / Entrada condensador (h4)
 * - Point 6: Salida condensador / Entrada válvula expansión (h6)
 *
 * Formulas:
 *   qevap = h3 - h1
 *   wcomp = h4 - h3
 *   qcond = h4 - h6
 */
export function calculateCycleThermodynamics(
  points: DiagramPoint[],
  _connections: DiagramConnection[] = [],
  fluidName = 'R134a'
): CycleCalculationResult {
  // Default values for standard fallback (R134a -10°C / +40°C)
  const defaultH1 = 250.0;
  const defaultH3 = 403.2;
  const defaultH4 = 441.6;
  const defaultH6 = 250.0;
  const defaultQEvap = defaultH3 - defaultH1; // 153.2
  const defaultWComp = defaultH4 - defaultH3; // 38.4
  const defaultQCond = defaultH4 - defaultH6; // 191.6

  const fallbackResult: CycleCalculationResult = {
    fluid: fluidName,
    p_evap_bar: 2.01,
    t_evap_c: -10.0,
    p_cond_bar: 10.16,
    t_cond_c: 40.0,
    t_discharge_c: 55.0,
    t_subcooling_k: 5.0,
    t_superheat_k: 5.0,
    h1_kj_kg: defaultH1,
    h3_kj_kg: defaultH3,
    h4_kj_kg: defaultH4,
    h6_kj_kg: defaultH6,
    v1_m3_kg: 0.025,
    v3_suction_m3_kg: 0.0994,
    v4_discharge_m3_kg: 0.0211,
    v6_m3_kg: 0.00087,
    delta_v_m3_kg: 0.0783,
    v_ratio: 4.71,
    v_min_m3_kg: 0.00087,
    v_max_m3_kg: 0.0994,
    q_evap_kj_kg: defaultQEvap,
    w_comp_kj_kg: defaultWComp,
    q_cond_kj_kg: defaultQCond,
    cop: defaultQEvap / defaultWComp,
    cop_heat: defaultQCond / defaultWComp,
    compression_ratio: 5.05,
    energy_in_kj_kg: defaultQEvap + defaultWComp,
    energy_out_kj_kg: defaultQCond,
    energy_balance_err_kj_kg: 0.0,
    energy_balance_percent: 100.0,
    is_balanced: true,
    has_valid_cycle: false,
  };

  const validPoints = points.filter(
    (p) =>
      p.state &&
      typeof p.state.pressure_bar === 'number' &&
      !isNaN(p.state.pressure_bar) &&
      typeof p.state.enthalpy_kj_kg === 'number' &&
      !isNaN(p.state.enthalpy_kj_kg)
  );

  if (validPoints.length < 2) {
    return fallbackResult;
  }

  // Find min and max pressure
  const pressures = validPoints.map((p) => p.state.pressure_bar);
  const p_min = Math.min(...pressures);
  const p_max = Math.max(...pressures);

  if (Math.abs(p_max - p_min) < 0.001) {
    return {
      ...fallbackResult,
      p_evap_bar: p_min,
      p_cond_bar: p_min,
      compression_ratio: 1.0,
    };
  }

  // Low and high pressure points
  const lowPressurePoints = validPoints.filter((p) => p.state.pressure_bar <= p_min * 1.25);
  const highPressurePoints = validPoints.filter((p) => p.state.pressure_bar >= p_max * 0.75);

  let pt1: DiagramPoint | undefined; // 1: Entrada evaporador (Low P, Low H)
  let pt3: DiagramPoint | undefined; // 3: Salida evaporador / Aspiración (Low P, High H)
  let pt4: DiagramPoint | undefined; // 4: Descarga compresor (High P, High H)
  let pt6: DiagramPoint | undefined; // 6: Salida condensador (High P, Low H)

  // Search by exact name/tag patterns
  const findByName = (patterns: string[]) =>
    validPoints.find((p) =>
      patterns.some((pattern) => {
        const lowerName = p.name.toLowerCase();
        return lowerName.startsWith(pattern) || lowerName.includes(pattern) || p.id === pattern;
      })
    );

  const namedPt1 = findByName(['1 -', '1:', 'p1', 'punto 1', '4 - entrada evap', 'inyecc']);
  const namedPt3 = findByName(['3 -', '3:', 'p3', 'punto 3', '1 - aspirac', 'suction']);
  const namedPt4 = findByName(['4 -', '4:', 'p4', 'punto 4', '2 - descarg', 'discharge']);
  const namedPt6 = findByName(['6 -', '6:', 'p6', 'punto 6', '3 - líquid', 'subenfri', 'condens']);

  // If explicit points 1, 3, 4, 6 exist
  if (namedPt1 && namedPt3 && namedPt4 && namedPt6) {
    pt1 = namedPt1;
    pt3 = namedPt3;
    pt4 = namedPt4;
    pt6 = namedPt6;
  } else {
    // Sort low pressure points by enthalpy: lower is pt1 (inlet), higher is pt3 (suction)
    if (lowPressurePoints.length >= 2) {
      const sortedLow = [...lowPressurePoints].sort((a, b) => a.state.enthalpy_kj_kg - b.state.enthalpy_kj_kg);
      pt1 = sortedLow[0];                         // 1: Entrada evaporador (menor h)
      pt3 = sortedLow[sortedLow.length - 1];       // 3: Salida evaporador / Aspiración (mayor h)
    } else if (lowPressurePoints.length === 1) {
      pt3 = lowPressurePoints[0];
    }

    // Sort high pressure points by enthalpy: lower is pt6 (condenser exit), higher is pt4 (discharge)
    if (highPressurePoints.length >= 2) {
      const sortedHigh = [...highPressurePoints].sort((a, b) => a.state.enthalpy_kj_kg - b.state.enthalpy_kj_kg);
      pt6 = sortedHigh[0];                        // 6: Salida condensador (menor h)
      pt4 = sortedHigh[sortedHigh.length - 1];      // 4: Descarga compresor (mayor h)
    } else if (highPressurePoints.length === 1) {
      pt4 = highPressurePoints[0];
    }
  }

  // Enthalpies
  const h3 = pt3 ? pt3.state.enthalpy_kj_kg : defaultH3;
  const h4 = pt4 ? pt4.state.enthalpy_kj_kg : defaultH4;
  const h6 = pt6 ? pt6.state.enthalpy_kj_kg : (pt1 ? pt1.state.enthalpy_kj_kg : defaultH6);
  const h1 = pt1 ? pt1.state.enthalpy_kj_kg : h6;

  // Temperatures
  const t1 = pt1 ? pt1.state.temperature_c : -10.0;
  const t3 = pt3 ? pt3.state.temperature_c : -5.0;
  const t4 = pt4 ? pt4.state.temperature_c : 55.0;
  const t6 = pt6 ? pt6.state.temperature_c : 35.0;

  // Specific Volumes
  const v1 = pt1?.state.specific_volume_m3_kg && pt1.state.specific_volume_m3_kg > 0
    ? pt1.state.specific_volume_m3_kg
    : 0.025;
  const v3 = pt3?.state.specific_volume_m3_kg && pt3.state.specific_volume_m3_kg > 0
    ? pt3.state.specific_volume_m3_kg
    : 0.0994;
  const v4 = pt4?.state.specific_volume_m3_kg && pt4.state.specific_volume_m3_kg > 0
    ? pt4.state.specific_volume_m3_kg
    : 0.0211;
  const v6 = pt6?.state.specific_volume_m3_kg && pt6.state.specific_volume_m3_kg > 0
    ? pt6.state.specific_volume_m3_kg
    : 0.00087;

  // Core formulas requested:
  // qevap = h3 - h1
  // wcomp = h4 - h3
  // qcond = h4 - h6 (o |h6 - h4|)
  const q_evap = Math.max(0.1, h3 - h1);
  const w_comp = Math.max(0.1, h4 - h3);
  const q_cond = Math.max(0.1, h4 - h6);

  const cop = Math.max(0.01, q_evap / w_comp);
  const cop_heat = Math.max(0.01, q_cond / w_comp);
  const compression_ratio = Math.max(1.0, p_max / Math.max(0.01, p_min));

  // Volumetric properties (Compresión de 3 a 4)
  const delta_v = Math.abs(v3 - v4);
  const v_ratio = Math.max(1.0, v3 / Math.max(1e-6, v4));

  const allVols = validPoints
    .map((p) => p.state.specific_volume_m3_kg)
    .filter((v) => typeof v === 'number' && !isNaN(v) && v > 0);
  const v_min = allVols.length > 0 ? Math.min(...allVols) : v6;
  const v_max = allVols.length > 0 ? Math.max(...allVols) : v3;

  // Global Energy Balance: (h3 - h1) + (h4 - h3) vs (h4 - h6)
  const energy_in = q_evap + w_comp; // = h4 - h1
  const energy_out = q_cond;         // = h4 - h6 (since h1 = h6, energy_in = energy_out)
  const balance_err = Math.abs(energy_in - energy_out);
  const balance_percent = Math.max(0, 100 - (balance_err / Math.max(1, energy_out)) * 100);
  const is_balanced = balance_err < 1.0;

  return {
    fluid: fluidName,
    p_evap_bar: p_min,
    t_evap_c: t1 < t3 ? t1 : t3,
    p_cond_bar: p_max,
    t_cond_c: t6,
    t_discharge_c: t4,
    t_subcooling_k: Math.max(0, 40.0 - t6),
    t_superheat_k: Math.max(0, t3 - (-10.0)),
    h1_kj_kg: h1,
    h3_kj_kg: h3,
    h4_kj_kg: h4,
    h6_kj_kg: h6,
    v1_m3_kg: v1,
    v3_suction_m3_kg: v3,
    v4_discharge_m3_kg: v4,
    v6_m3_kg: v6,
    delta_v_m3_kg: delta_v,
    v_ratio,
    v_min_m3_kg: v_min,
    v_max_m3_kg: v_max,
    q_evap_kj_kg: q_evap,
    w_comp_kj_kg: w_comp,
    q_cond_kj_kg: q_cond,
    cop,
    cop_heat,
    compression_ratio,
    energy_in_kj_kg: energy_in,
    energy_out_kj_kg: energy_out,
    energy_balance_err_kj_kg: balance_err,
    energy_balance_percent: balance_percent,
    is_balanced,
    has_valid_cycle: validPoints.length >= 4,
    point1_id: pt1?.id,
    point3_id: pt3?.id,
    point4_id: pt4?.id,
    point6_id: pt6?.id,
  };
}
