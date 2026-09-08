export type RefrigerantGroup =
  | 'Naturales'
  | 'HFC y mezclas'
  | 'HFO y bajo GWP'
  | 'Históricos y existentes'
  | 'Todos';

export interface FluidInfo {
  id: string;
  name: string;
  chemical_formula?: string;
  molar_mass_kg_mol?: number;
  t_triple_c?: number;
  t_crit_c?: number;
  p_crit_bar?: number;
  p_min_bar?: number;
  p_max_bar?: number;
  h_crit_kj_kg?: number;
  is_pure: boolean;
  is_mixture: boolean;
  gwp?: number;
  ashrae_safety?: string;
  reference_state: string;
}

export interface CatalogItem {
  display_name: string;
  coolprop_id: string;
  aliases: string[];
  group: string;
  fluid_type: string;
  gwp?: number;
  ashrae_safety?: string;
  is_available: boolean;
  notes?: string;
  info?: FluidInfo;
}

export interface CatalogResponse {
  engine_version: string;
  priority_items: CatalogItem[];
  other_available_fluids: string[];
}

export interface CurvePoint {
  h_kj_kg: number;
  p_bar: number;
  t_c?: number;
  s_kj_kg_k?: number;
  v_m3_kg?: number;
  q?: number;
}

export interface CurveSeries {
  id: string;
  name: string;
  curve_type:
    | 'saturation_liquid'
    | 'saturation_vapor'
    | 'isotherm'
    | 'isobar'
    | 'isentropic'
    | 'isochore'
    | 'quality';
  parameter_value: number;
  parameter_unit: string;
  points: CurvePoint[];
}

export interface DiagramDomain {
  p_min_bar: number;
  p_max_bar: number;
  h_min_kj_kg: number;
  h_max_kj_kg: number;
  t_min_c: number;
  t_crit_c: number;
  p_crit_bar: number;
  h_crit_kj_kg: number;
}

export interface DiagramCurvesResponse {
  fluid_id: string;
  domain: DiagramDomain;
  saturation_liquid: CurveSeries;
  saturation_vapor: CurveSeries;
  isotherms: CurveSeries[];
  isentropics: CurveSeries[];
  isochores: CurveSeries[];
  quality_lines: CurveSeries[];
}

export interface ThermodynamicState {
  fluid_id: string;
  pressure_bar: number;
  temperature_c: number;
  enthalpy_kj_kg: number;
  entropy_kj_kg_k: number;
  density_kg_m3: number;
  specific_volume_m3_kg: number;
  vapor_quality?: number; // null if not in two-phase
  phase: string;
  is_valid: boolean;
  warning?: string;
}

export type InputPairType = 'P-h' | 'P-T' | 'P-s' | 'P-Q' | 'T-Q' | 'P-v' | 'T-h';

export interface DiagramPoint {
  id: string;
  name: string;
  color: string;
  input1_type: string;
  input1_val: number;
  input2_type: string;
  input2_val: number;
  state: ThermodynamicState;
  labelOffset: { x: number; y: number };
  isLocked?: boolean;
}

export type ProcessType =
  | 'direct_line'
  | 'isobaric'
  | 'isenthalpic'
  | 'isothermal'
  | 'isentropic';

export interface DiagramConnection {
  id: string;
  fromPointId: string;
  toPointId: string;
  name: string;
  color: string;
  processType: ProcessType;
  delta_h_kj_kg?: number;
  delta_t_c?: number;
  delta_p_bar?: number;
  delta_s_kj_kg_k?: number;
  pathPoints?: CurvePoint[];
}

export interface CurveVisibilityConfig {
  saturation: boolean;
  isotherms: boolean;
  isentropics: boolean;
  isochores: boolean;
  qualityLines: boolean;
  showCurveLabels: boolean;
  showPointLabels: boolean;
  pointLabelMode: 'full' | 'compact' | 'hidden';
}

export interface ProjectData {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  engine: string;
  engineVersion: string;
  refrigerant: string;
  refrigerantDisplayName: string;
  points: DiagramPoint[];
  connections: DiagramConnection[];
  curveVisibility: CurveVisibilityConfig;
  notes?: string;
}
