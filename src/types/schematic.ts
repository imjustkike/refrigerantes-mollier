import type { Edge, Node } from '@xyflow/react';

export type SchematicComponentCategory =
  | 'basic_electrical'
  | 'compressors'
  | 'heat_exchangers'
  | 'expansion'
  | 'vessels'
  | 'valves'
  | 'fittings'
  | 'instruments'
  | 'accessories'
  | 'chambers'
  | 'electrical';

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
  // Uniones, Derivaciones & Accesorios de Tubería
  | 'pipe_union_straight'
  | 'pipe_union_elbow'
  | 'pipe_union_tee'
  | 'pipe_union_cross'
  | 'pipe_junction_dot'
  // Instrumentación & Sensores
  | 'gauge_pressure_hp'
  | 'gauge_pressure_lp'
  | 'sensor_temperature'
  | 'pressure_switch'
  | 'flow_meter'
  | 'power_meter'
  // Cámaras Frigoríficas & Recintos
  | 'cold_room_conservation'
  | 'cold_room_freezer'
  | 'cold_room_blast_chiller'
  | 'conditioned_room'
  | 'cold_room_fermentation'
  | 'cold_room_ripening'
  | 'cold_room_drying'
  | 'ice_storage_room'
  // Instalación Eléctrica: Cuadros, Acometida y Protecciones
  | 'electrical_panel_main'
  | 'power_supply_terminal'
  | 'ground_earth'
  | 'circuit_breaker_mcb'
  | 'residual_current_device'
  | 'motor_protection_switch'
  | 'fuse_disconnect'
  | 'thermal_overload_relay'
  // Instalación Eléctrica: Maniobra, Contactos y Relés
  | 'contactor_relay'
  | 'relay_coil_auxiliary'
  | 'contact_aux_no'
  | 'contact_aux_nc'
  | 'timer_delay_on'
  | 'timer_delay_off'
  | 'pushbutton_no'
  | 'pushbutton_nc'
  | 'emergency_stop_button'
  | 'selector_switch_rotary'
  // Instalación Eléctrica: Transformadores y Fuentes
  | 'control_transformer'
  | 'power_supply_dc_24v'
  // Instalación Eléctrica: Señalización
  | 'pilot_light_green'
  | 'pilot_light_red'
  | 'pilot_light_amber'
  | 'buzzer_siren'
  // Instalación Eléctrica: Cargas, Motores y Electrónica
  | 'electric_motor_3p'
  | 'electric_motor_1p'
  | 'electric_heater'
  | 'solenoid_coil'
  | 'frequency_inverter_vfd'
  | 'soft_starter'
  | 'power_demand_controller'
  // Electricidad Básica & Didáctica (Circuitos Elementales)
  | 'battery_dc_cell'
  | 'cell_dc_simple'
  | 'dc_power_source'
  | 'power_source_ac'
  | 'power_source_ac_3p'
  | 'junction_dot_electric'
  | 'terminal_block_electric'
  | 'connector_plug_socket'
  | 'neutral_terminal'
  | 'switch_disconnector'
  | 'light_bulb'
  | 'switch_spst'
  | 'switch_spdt'
  | 'pushbutton_simple'
  | 'pushbutton_nc_simple'
  | 'resistor_fixed'
  | 'potentiometer'
  | 'capacitor_fixed'
  | 'diode_led'
  | 'voltmeter_basic'
  | 'ammeter_basic'
  | 'ohmmeter_basic'
  | 'wattmeter_basic'
  // Semiconductores & Transistores
  | 'transistor_bjt_npn'
  | 'transistor_bjt_pnp'
  // Salidas de Audio & Parlantes
  | 'audio_speaker'
  // Motores DC y Voltaje Variable
  | 'electric_motor_dc';

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
  | 'electric_power'   // Línea / Fase eléctrica de fuerza (L1, L2, L3)
  | 'electric_neutral' // Neutro de red (N)
  | 'electric_ground'  // Conductor de protección / Puesta a tierra (PE ⏚)
  | 'electric_control' // Maniobra / Bobinas / Contactos auxiliares (A1, A2, NO, NC)
  | 'electric_signal'  // Señal analógica o sonda (0-10V, 4-20mA, NTC/PT100)
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

  // Vinculación Eléctrica y Cámaras Frigoríficas
  breakerId?: string;
  chamberId?: string;
  isLeadCompressor?: boolean;

  // Propiedades Específicas de Cámaras Frigoríficas
  chamberLengthM?: number;
  chamberWidthM?: number;
  chamberHeightM?: number;
  chamberVolumeM3?: number;
  chamberAreaM2?: number;
  chamberUValue?: number;         // W / (m²·K)
  productMassKg?: number;         // kg
  productCp?: number;             // kJ / (kg·K)
  productTempC?: number;          // °C
  isDoorOpen?: boolean;
  internalLightingW?: number;     // W
  occupancyPeople?: number;
  isDefrostActive?: boolean;
  defrostPowerKw?: number;

  // Propiedades Específicas de Cuadros Eléctricos y Protecciones
  supplyType?: 'SinglePhase230V' | 'ThreePhase400V';
  ratedCurrentA?: number;         // In (A) ej. 16, 25, 32, 50, 63
  curveType?: 'B' | 'C' | 'D';
  isBreakerClosed?: boolean;
  isBreakerTripped?: boolean;
  thermalMemoryPercent?: number;  // 0 - 100%
  tripReason?: string;
  maxContractedPowerKw?: number;  // kW
  demandLimitKw?: number;         // kW

  // Maniobra Eléctrica y Automatismos
  contactState?: 'open' | 'closed';
  timerDelayS?: number;
  coilVoltageV?: number;
  isPushButtonPressed?: boolean;
  selectorPosition?: 'man' | 'off' | 'auto';
  pilotLightColor?: 'green' | 'red' | 'amber' | 'white';
  overloadCurrentSettingA?: number;
  fuseRatingA?: number;
  motorPoleCount?: number;
  motorRpm?: number;

  // Circuitos Eléctricos Básicos & Didácticos
  isSwitchClosed?: boolean;
  resistanceOhm?: number;
  capacitanceUf?: number;
  currentA?: number;
  powerWatts?: number;
  isSeriesWarning?: boolean;
  isSeriesPassThrough?: boolean;

  // Motores con Control de Tensión & Umbral de Arranque
  minOperatingVoltageV?: number;
  ratedVoltageV?: number;
  ratedRpm?: number;
  actualRpm?: number;
  powerPercent?: number;
  motorVoltageWarning?: string;
  voltageWarning?: string;
  maxCurrentA?: number;
  acWaveform?: 'sine' | 'square' | 'triangle';
  currentLimitWarning?: string;

  // Transistores BJT & Semiconductores
  transistorState?: 'cutoff' | 'saturation' | 'active';
  vBe?: number;
  vCe?: number;

  // Salidas de Audio & Parlantes
  impedanceOhm?: number;
  audioFrequencyHz?: number;
  isAudioMuted?: boolean;
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
  | 'control_line'          // Gris discontinuo (#94a3b8)
  // Cableado Eléctrico Didáctico
  | 'electric_phase'        // Fase de potencia L1, L2, L3 (Marrón #b45309)
  | 'electric_neutral'      // Neutro N (Azul eléctrico #2563eb)
  | 'electric_ground'       // Conductor de protección PE (Verde/Amarillo #65a30d)
  | 'electric_control'      // Maniobra 230V / 24V (Rojo #dc2626)
  | 'electric_signal';      // Señal o sonda (Púrpura #9333ea)

export interface SchematicEdgeData {
  [key: string]: unknown;
  pipeState: PipeStateCategory;
  edgeType?: 'electricWire' | 'refrigerantPipe';
  flowDirection?: 'forward' | 'reverse' | 'bidirectional';
  isAnimated?: boolean;
  waypoints?: Array<{ x: number; y: number }>; // Puntos de quiebre / dobleces móviles de la tubería
  offset?: number;

  // Propiedades Exclusivas de Tuberías Frigoríficas
  diameterInch?: string;   // ej. 3/8", 1/2", 7/8", 1-1/8"
  diameterMm?: number;
  insulationThicknessMm?: number;
  pressureBar?: number;
  temperatureC?: number;
  enthalpyKjKg?: number;
  massFlowKgS?: number;
  customLabel?: string;
  fluidName?: string;

  // Propiedades Exclusivas de Conexiones Eléctricas (Cables)
  wireSectionMm2?: number;  // 0.75, 1.5, 2.5, 4.0, 6.0, 10.0 mm²
  wireFunction?: 'phase' | 'neutral' | 'ground' | 'dc_pos' | 'dc_neg' | 'control' | 'signal';
  wireTag?: string;
  voltageV?: number;
  voltageDropV?: number;
  wireCurrentA?: number;
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

export type SchematicNode = Node<SchematicNodeData>;
export type SchematicEdge = Edge<SchematicEdgeData>;
