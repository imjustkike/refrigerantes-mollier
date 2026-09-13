export type EquipmentRunState =
  | 'Stopped'
  | 'Starting'
  | 'Running'
  | 'Interlocked'
  | 'Defrosting'
  | 'TrippedOverload'
  | 'TrippedSafety'
  | 'LockedByDemand';

export interface SimBreaker {
  id: string;
  name: string;
  tag: string;
  rated_current_a: number;
  curve_type: string;
  is_main: boolean;
  is_closed: boolean;
  trip_reason?: string | null;
  thermal_memory: number; // 0.0 a 1.5
}

export interface SimElectricalSupply {
  supply_type: 'SinglePhase230V' | 'ThreePhase400V';
  voltage_v: number;
  frequency_hz: number;
  max_contracted_power_kw: number;
  demand_control_enabled: boolean;
  demand_limit_kw: number;
  breakers: SimBreaker[];
}

export interface ChamberDimensions {
  length_m: number;
  width_m: number;
  height_m: number;
}

export interface SimChamber {
  id: string;
  name: string;
  dimensions: ChamberDimensions;
  u_value_w_m2_k: number;
  ambient_temp_ext_c: number;
  setpoint_temp_c: number;
  hysteresis_k: number;
  current_air_temp_c: number;
  product_mass_kg: number;
  product_cp_kj_kg_k: number;
  product_temp_c: number;
  is_door_open: boolean;
  internal_lights_w: number;
  occupancy_people: number;
  is_defrost_active: boolean;
  defrost_heater_power_kw: number;
}

export interface SimEquipment {
  id: string;
  tag: string;
  label: string;
  component_type: string;
  is_energized: boolean;
  nominal_capacity_kw?: number | null;
  nominal_power_kw?: number | null;
  displacement_m3_h?: number | null;
  superheat_setpoint_k?: number | null;
  subcooling_k?: number | null;
  internal_volume_l?: number | null;
  valve_opening_percent?: number | null;
  is_valve_open?: boolean | null;
  breaker_id?: string | null;
  chamber_id?: string | null;
  is_lead_compressor?: boolean | null;
  min_off_time_s?: number | null;
  start_inrush_multiplier?: number | null;
}

export interface SimPipe {
  id: string;
  source_node_id: string;
  source_port: string;
  target_node_id: string;
  target_port: string;
  diameter_mm?: number | null;
  length_m?: number | null;
  pipe_state_category?: string | null;
}

export interface SimElectricWire {
  id: string;
  source_node_id: string;
  source_port: string;
  target_node_id: string;
  target_port: string;
  wire_function?: string | null;
  wire_section_mm2?: number | null;
  wire_tag?: string | null;
  pipe_state_category?: string | null;
}

export interface InstallationSchema {
  version: string;
  name: string;
  refrigerant: string;
  total_charge_kg: number;
  current_charge_kg: number;
  leak_rate_kg_h: number;
  ambient_temp_c: number;
  electrical: SimElectricalSupply;
  chambers: SimChamber[];
  equipments: SimEquipment[];
  pipes: SimPipe[];
  wires?: SimElectricWire[];
}

export interface EquipmentCalculatedState {
  id: string;
  run_state: EquipmentRunState;
  electrical_power_kw: number;
  current_a: number;
  thermal_capacity_kw: number;
  inlet_pressure_bar?: number | null;
  outlet_pressure_bar?: number | null;
  inlet_temp_c?: number | null;
  outlet_temp_c?: number | null;
  effective_flow_kg_s?: number | null;
  superheat_k?: number | null;
  subcooling_k?: number | null;
  status_message: string;
}

export interface PipeCalculatedState {
  pipe_id: string;
  pressure_abs_bar: number;
  pressure_gauge_bar: number;
  temperature_c: number;
  enthalpy_kj_kg: number;
  mass_flow_kg_s: number;
  vapor_quality?: number | null;
  phase_description: string;
}

export interface ElectricalPanelState {
  total_active_power_kw: number;
  peak_demand_kw: number;
  total_energy_kwh: number;
  current_phase_r_a: number;
  current_phase_s_a: number;
  current_phase_t_a: number;
  power_factor: number;
  is_main_breaker_tripped: boolean;
  is_demand_limit_exceeded: boolean;
  breakers: SimBreaker[];
}

export interface SimEventLogItem {
  timestamp_s: number;
  formatted_time: string;
  level: string; // "INFO" | "WARN" | "ALARM" | "TRIP"
  source_id: string;
  source_tag: string;
  message: string;
  reset_condition?: string | null;
}

export interface SimulationHistoryPoint {
  time_s: number;
  suction_pressure_bar: number;
  discharge_pressure_bar: number;
  chamber_air_temp_c: number;
  chamber_product_temp_c: number;
  total_power_kw: number;
  cooling_capacity_kw: number;
  charge_kg: number;
}

export interface SimulationStateResponse {
  is_running: boolean;
  sim_time_s: number;
  speed_multiplier: number;
  circuit_refrigerant: string;
  total_charge_kg: number;
  current_charge_kg: number;
  charge_status: string;
  leak_rate_kg_h: number;
  suction_pressure_bar: number;
  discharge_pressure_bar: number;
  evaporation_temp_c: number;
  condensing_temp_c: number;
  system_superheat_k: number;
  system_subcooling_k: number;
  total_cooling_capacity_kw: number;
  cop: number;
  electrical: ElectricalPanelState;
  chambers: SimChamber[];
  equipments: Record<string, EquipmentCalculatedState>;
  pipes: Record<string, PipeCalculatedState>;
  active_alarms: SimEventLogItem[];
  recent_history: SimulationHistoryPoint[];
}

export interface ValidationIssue {
  level: 'ERROR' | 'WARNING';
  equipment_id?: string | null;
  message: string;
  technical_detail: string;
}

export interface ValidationReport {
  is_valid: boolean;
  issues: ValidationIssue[];
}
