export type SchematicComponentCategory =
  | 'compressors'
  | 'heat_exchangers'
  | 'expansion'
  | 'vessels'
  | 'valves'
  | 'instruments'
  | 'accessories';

export type SchematicComponentType =
  // Compresores & Bombas
  | 'compressor_scroll'
  | 'compressor_reciprocating'
  | 'compressor_screw'
  | 'compressor_inverter'
  | 'compressor_compound'
  | 'refrigerant_pump'
  // Intercambiadores de Calor
  | 'condenser_air'
  | 'condenser_water_plate'
  | 'condenser_evaporative'
  | 'gas_cooler_co2'
  | 'evaporator_dx_air'
  | 'evaporator_plate_chiller'
  | 'evaporator_flooded'
  | 'heat_exchanger_slhx'
  | 'desuperheater'
  // Dispositivos de Expansión
  | 'expansion_valve_txv'
  | 'expansion_valve_eev'
  | 'capillary_tube'
  | 'float_valve'
  | 'regulator_epr_kvp'
  | 'regulator_cpr_kvl'
  | 'regulator_kvr'
  // Recipientes & Gestión de Aceite
  | 'liquid_receiver_vertical'
  | 'liquid_receiver_horizontal'
  | 'suction_accumulator'
  | 'oil_separator'
  | 'oil_reservoir'
  | 'flash_tank_economizer'
  | 'co2_flash_tank'
  | 'filter_drier'
  | 'sight_glass'
  // Válvulas
  | 'four_way_reversing_valve'
  | 'solenoid_valve'
  | 'check_valve'
  | 'safety_relief_valve'
  | 'hot_gas_bypass_valve'
  | 'ball_service_valve'
  // Instrumentación & Sensores
  | 'gauge_pressure_hp'
  | 'gauge_pressure_lp'
  | 'sensor_temperature'
  | 'pressure_switch'
  | 'flow_meter'
  | 'power_meter';

export type PortDirection = 'left' | 'right' | 'top' | 'bottom';

export type PortKind =
  | 'suction'        // Aspiración (Vapor frío baja presión)
  | 'discharge'      // Descarga (Vapor muy caliente alta presión)
  | 'condensed'      // Condensado (Líquido alta presión)
  | 'subcooled'      // Líquido subenfriado
  | 'expansion_in'   // Entrada a válvula
  | 'expansion_out'  // Salida mezcla bifásica (frío evaporación)
  | 'evaporated'     // Salida de evaporador
  | 'intermediate'   // Presión intermedia / Economizador / Flash gas
  | 'oil'            // Línea de aceite
  | 'equalization'   // Toma de igualación externa de presión (TXV)
  | 'bulb'           // Bulbo termostático
  | 'water_in'       // Entrada agua secundaria
  | 'water_out'      // Salida agua secundaria
  | 'hot_gas_bypass' // Bypass gas caliente / desescarche
  | 'defrost'        // Inyección desescarche
  | 'generic';       // Puerto genérico bidireccional

export interface ComponentPort {
  id: string;
  name: string;
  shortCode: string; // Ej: ASP, DESC, LIQ, EXP, EVI, OIL, AGUA, IGU, BULB
  kind: PortKind;
  position: PortDirection;
  hint: string;      // Explicación técnica clara de conexión
  relativeOffset?: { x: number; y: number };
}

export interface SchematicNodeData {
  [key: string]: unknown;
  componentType: SchematicComponentType;
  label: string;
  tag?: string; // ej. COMP-01, COND-01, TXV-01, PI-01
  customName?: string;
  modelNumber?: string; // ej. Copeland ZB45KCE, Danfoss T2, Bitzer 4CES
  rotation?: 0 | 90 | 180 | 270;
  flippedHorizontal?: boolean;
  flippedVertical?: boolean;
  isEnergized?: boolean;
  notes?: string;

  // Parámetros de Ingeniería Directos (Independientes de Mollier)
  // Presiones y Temperaturas de Trabajo
  pressureInBar?: number;
  pressureOutBar?: number;
  tempInC?: number;
  tempOutC?: number;
  setpointBar?: number;
  setpointTempC?: number;

  // Rendimiento y Capacidad
  capacityKw?: number;       // Potencia frigorífica o térmica (kW / kcal/h)
  powerKw?: number;          // Potencia eléctrica absorbida (kW)
  displacementM3h?: number;  // Caudal volumétrico / Desplazamiento (m³/h)
  frequencyHz?: number;      // Frecuencia de modulación Inverter (Hz)
  cop?: number;              // Coeficiente de rendimiento COP

  // Ajustes de Operación
  subcoolingK?: number;      // Subenfriamiento deseado (K)
  superheatK?: number;       // Recalentamiento útil (K)
  openingPercent?: number;   // Apertura de válvula (%)
  volumeL?: number;          // Volumen de recipiente (Litros)
  fluidName?: string;        // Nombre del refrigerante (ej. R134a, R744, R448A)
  voltageV?: number;         // Tensión de alimentación (V)

  // Medición de Instrumentos
  measuredValue?: number;
  measuredUnit?: string;
}

export type PipeStateCategory =
  | 'discharge_superheated' // Rojo (#ef4444)
  | 'condensing_liquid'     // Naranja (#f97316)
  | 'subcooled_liquid'      // Ámbar (#eab308)
  | 'two_phase_flashing'    // Cian (#06b6d4)
  | 'evaporating_vapor'     // Azul Cielo (#38bdf8)
  | 'suction_superheated'   // Azul Cobalto (#2563eb)
  | 'intermediate_pressure' // Violeta (#8b5cf6)
  | 'oil_line'              // Verde Oliva / Lima (#84cc16)
  | 'hot_gas_defrost'       // Púrpura (#a855f7)
  | 'secondary_fluid'       // Esmeralda (#10b981)
  | 'control_line';         // Gris discontinuo (#94a3b8)

export interface SchematicEdgeData {
  [key: string]: unknown;
  pipeState: PipeStateCategory;
  flowDirection?: 'forward' | 'reverse' | 'bidirectional';
  isAnimated?: boolean;
  diameterInch?: string;   // ej. 3/8", 1/2", 7/8", 1-1/8"
  diameterMm?: number;
  insulationThicknessMm?: number;
  pressureBar?: number;
  temperatureC?: number;
  enthalpyKjKg?: number;
  massFlowKgS?: number;
  customLabel?: string;
  fluidName?: string;
}

export interface SchematicComponentDefinition {
  type: SchematicComponentType;
  category: SchematicComponentCategory;
  name: string;
  description: string;
  defaultLabel: string;
  defaultTagPrefix: string;
  defaultModel?: string;
  defaultSpecs?: Partial<SchematicNodeData>;
  ports: ComponentPort[];
  dimensions: { width: number; height: number };
}

export interface SchematicPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  refrigerant: string;
  iconName: string;
  nodes: any[];
  edges: any[];
}
