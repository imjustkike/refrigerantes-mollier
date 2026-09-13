use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Tipos de componentes soportados en P&ID
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ComponentType {
    CompressorScroll,
    CompressorReciprocating,
    CompressorScrew,
    CompressorInverter,
    CondenserAir,
    CondenserWaterPlate,
    EvaporatorDxAir,
    EvaporatorPlateChiller,
    ExpansionValveTxv,
    ExpansionValveEev,
    LiquidReceiverVertical,
    LiquidReceiverHorizontal,
    SuctionAccumulator,
    OilSeparator,
    FilterDrier,
    SightGlass,
    SolenoidValve,
    CheckValve,
    BallServiceValve,
    SafetyReliefValve,
    PipeUnionStraight,
    PipeUnionTee,
    PipeUnionElbow,
    PipeUnionCross,
    GaugePressureHp,
    GaugePressureLp,
    SensorTemperature,
    PressureSwitch,
    FlowMeter,
    PowerMeter,
    // Cámaras Frigoríficas & Recintos
    ColdRoomConservation,
    ColdRoomFreezer,
    ColdRoomBlastChiller,
    ConditionedRoom,
    ColdRoomFermentation,
    ColdRoomRipening,
    ColdRoomDrying,
    IceStorageRoom,
    // Instalación Eléctrica & Cuadros
    ElectricalPanelMain,
    PowerSupplyTerminal,
    GroundEarth,
    CircuitBreakerMcb,
    ResidualCurrentDevice,
    MotorProtectionSwitch,
    FuseDisconnect,
    ThermalOverloadRelay,
    ContactorRelay,
    RelayCoilAuxiliary,
    ContactAuxNo,
    ContactAuxNc,
    TimerDelayOn,
    TimerDelayOff,
    PushbuttonNo,
    PushbuttonNc,
    EmergencyStopButton,
    SelectorSwitchRotary,
    ControlTransformer,
    PowerSupplyDc24v,
    PilotLightGreen,
    PilotLightRed,
    PilotLightAmber,
    BuzzerSiren,
    ElectricMotor3p,
    ElectricMotor1p,
    ElectricHeater,
    SolenoidCoil,
    FrequencyInverterVfd,
    SoftStarter,
    PowerDemandController,
    // Electricidad Básica & Didáctica
    BatteryDcCell,
    PowerSourceAc,
    LightBulb,
    SwitchSpst,
    SwitchSpdt,
    PushbuttonSimple,
    PushbuttonNcSimple,
    ResistorFixed,
    Potentiometer,
    CapacitorFixed,
    DiodeLed,
    VoltmeterBasic,
    AmmeterBasic,
    CellDcSimple,
    DcPowerSource,
    PowerSourceAc3p,
    JunctionDotElectric,
    TerminalBlockElectric,
    ConnectorPlugSocket,
    NeutralTerminal,
    SwitchDisconnector,
    OhmmeterBasic,
    WattmeterBasic,
    Other(String),
}

impl From<&str> for ComponentType {
    fn from(s: &str) -> Self {
        match s {
            "compressor_scroll" => ComponentType::CompressorScroll,
            "compressor_reciprocating" => ComponentType::CompressorReciprocating,
            "compressor_screw" => ComponentType::CompressorScrew,
            "compressor_inverter" => ComponentType::CompressorInverter,
            "condenser_air" => ComponentType::CondenserAir,
            "condenser_water_plate" => ComponentType::CondenserWaterPlate,
            "evaporator_dx_air" => ComponentType::EvaporatorDxAir,
            "evaporator_plate_chiller" => ComponentType::EvaporatorPlateChiller,
            "expansion_valve_txv" => ComponentType::ExpansionValveTxv,
            "expansion_valve_eev" => ComponentType::ExpansionValveEev,
            "liquid_receiver_vertical" => ComponentType::LiquidReceiverVertical,
            "liquid_receiver_horizontal" => ComponentType::LiquidReceiverHorizontal,
            "suction_accumulator" => ComponentType::SuctionAccumulator,
            "oil_separator" => ComponentType::OilSeparator,
            "filter_drier" => ComponentType::FilterDrier,
            "sight_glass" => ComponentType::SightGlass,
            "solenoid_valve" => ComponentType::SolenoidValve,
            "check_valve" => ComponentType::CheckValve,
            "ball_service_valve" => ComponentType::BallServiceValve,
            "safety_relief_valve" => ComponentType::SafetyReliefValve,
            "pipe_union_straight" => ComponentType::PipeUnionStraight,
            "pipe_union_tee" => ComponentType::PipeUnionTee,
            "pipe_union_elbow" => ComponentType::PipeUnionElbow,
            "pipe_union_cross" => ComponentType::PipeUnionCross,
            "gauge_pressure_hp" => ComponentType::GaugePressureHp,
            "gauge_pressure_lp" => ComponentType::GaugePressureLp,
            "sensor_temperature" => ComponentType::SensorTemperature,
            "pressure_switch" => ComponentType::PressureSwitch,
            "flow_meter" => ComponentType::FlowMeter,
            "power_meter" => ComponentType::PowerMeter,
            "cold_room_conservation" => ComponentType::ColdRoomConservation,
            "cold_room_freezer" => ComponentType::ColdRoomFreezer,
            "cold_room_blast_chiller" => ComponentType::ColdRoomBlastChiller,
            "conditioned_room" => ComponentType::ConditionedRoom,
            "cold_room_fermentation" => ComponentType::ColdRoomFermentation,
            "cold_room_ripening" => ComponentType::ColdRoomRipening,
            "cold_room_drying" => ComponentType::ColdRoomDrying,
            "ice_storage_room" => ComponentType::IceStorageRoom,
            "electrical_panel_main" => ComponentType::ElectricalPanelMain,
            "power_supply_terminal" => ComponentType::PowerSupplyTerminal,
            "ground_earth" => ComponentType::GroundEarth,
            "circuit_breaker_mcb" => ComponentType::CircuitBreakerMcb,
            "residual_current_device" => ComponentType::ResidualCurrentDevice,
            "motor_protection_switch" => ComponentType::MotorProtectionSwitch,
            "fuse_disconnect" => ComponentType::FuseDisconnect,
            "thermal_overload_relay" => ComponentType::ThermalOverloadRelay,
            "contactor_relay" => ComponentType::ContactorRelay,
            "relay_coil_auxiliary" => ComponentType::RelayCoilAuxiliary,
            "contact_aux_no" => ComponentType::ContactAuxNo,
            "contact_aux_nc" => ComponentType::ContactAuxNc,
            "timer_delay_on" => ComponentType::TimerDelayOn,
            "timer_delay_off" => ComponentType::TimerDelayOff,
            "pushbutton_no" => ComponentType::PushbuttonNo,
            "pushbutton_nc" => ComponentType::PushbuttonNc,
            "emergency_stop_button" => ComponentType::EmergencyStopButton,
            "selector_switch_rotary" => ComponentType::SelectorSwitchRotary,
            "control_transformer" => ComponentType::ControlTransformer,
            "power_supply_dc_24v" => ComponentType::PowerSupplyDc24v,
            "pilot_light_green" => ComponentType::PilotLightGreen,
            "pilot_light_red" => ComponentType::PilotLightRed,
            "pilot_light_amber" => ComponentType::PilotLightAmber,
            "buzzer_siren" => ComponentType::BuzzerSiren,
            "electric_motor_3p" => ComponentType::ElectricMotor3p,
            "electric_motor_1p" => ComponentType::ElectricMotor1p,
            "electric_heater" => ComponentType::ElectricHeater,
            "solenoid_coil" => ComponentType::SolenoidCoil,
            "frequency_inverter_vfd" => ComponentType::FrequencyInverterVfd,
            "soft_starter" => ComponentType::SoftStarter,
            "power_demand_controller" => ComponentType::PowerDemandController,
            "battery_dc_cell" => ComponentType::BatteryDcCell,
            "power_source_ac" => ComponentType::PowerSourceAc,
            "light_bulb" => ComponentType::LightBulb,
            "switch_spst" => ComponentType::SwitchSpst,
            "switch_spdt" => ComponentType::SwitchSpdt,
            "pushbutton_simple" => ComponentType::PushbuttonSimple,
            "pushbutton_nc_simple" => ComponentType::PushbuttonNcSimple,
            "resistor_fixed" => ComponentType::ResistorFixed,
            "potentiometer" => ComponentType::Potentiometer,
            "capacitor_fixed" => ComponentType::CapacitorFixed,
            "diode_led" => ComponentType::DiodeLed,
            "voltmeter_basic" => ComponentType::VoltmeterBasic,
            "ammeter_basic" => ComponentType::AmmeterBasic,
            "cell_dc_simple" => ComponentType::CellDcSimple,
            "dc_power_source" => ComponentType::DcPowerSource,
            "power_source_ac_3p" => ComponentType::PowerSourceAc3p,
            "junction_dot_electric" => ComponentType::JunctionDotElectric,
            "terminal_block_electric" => ComponentType::TerminalBlockElectric,
            "connector_plug_socket" => ComponentType::ConnectorPlugSocket,
            "neutral_terminal" => ComponentType::NeutralTerminal,
            "switch_disconnector" => ComponentType::SwitchDisconnector,
            "ohmmeter_basic" => ComponentType::OhmmeterBasic,
            "wattmeter_basic" => ComponentType::WattmeterBasic,
            other => ComponentType::Other(other.to_string()),
        }
    }
}

/// Estado de funcionamiento de un equipo
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EquipmentRunState {
    Stopped,
    Starting,
    Running,
    Interlocked,
    Defrosting,
    TrippedOverload,
    TrippedSafety,
    LockedByDemand,
}

/// Parámetros nominales y de ajuste de un equipo en el esquema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimEquipment {
    pub id: String,
    pub tag: String,
    pub label: String,
    pub component_type: String,
    pub is_energized: bool,
    
    // Frigorífico
    pub nominal_capacity_kw: Option<f64>,  // Capacidad frigorífica/térmica nominal
    pub nominal_power_kw: Option<f64>,     // Potencia eléctrica absorbida nominal
    pub displacement_m3_h: Option<f64>,    // Caudal volumétrico del compresor
    pub superheat_setpoint_k: Option<f64>, // Recalentamiento objetivo (para TXV/EEV)
    pub subcooling_k: Option<f64>,         // Subenfriamiento esperado
    pub internal_volume_l: Option<f64>,    // Volumen interno en litros
    pub valve_opening_percent: Option<f64>,// Apertura de válvula (0 a 100%)
    pub is_valve_open: Option<bool>,       // Para solenoides y válvulas manuales
    
    // Eléctrico & Control
    pub breaker_id: Option<String>,        // Disyuntor que alimenta el equipo
    pub chamber_id: Option<String>,        // Cámara vinculada (para evaporadores)
    pub is_lead_compressor: Option<bool>,  // Si es compresor principal o secundario
    pub min_off_time_s: Option<f64>,       // Anti-ciclo corto (ej. 180s)
    pub start_inrush_multiplier: Option<f64>, // Multiplicador corriente arranque (ej. 6.0)
}

/// Conexión de tubería de refrigerante
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimPipe {
    pub id: String,
    pub source_node_id: String,
    pub source_port: String,
    pub target_node_id: String,
    pub target_port: String,
    pub diameter_mm: Option<f64>,
    pub length_m: Option<f64>,
    pub pipe_state_category: Option<String>,
}

/// Conexión de cable / conductor eléctrico
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimElectricWire {
    pub id: String,
    pub source_node_id: String,
    pub source_port: String,
    pub target_node_id: String,
    pub target_port: String,
    pub wire_function: Option<String>,
    pub wire_section_mm2: Option<f64>,
    pub wire_tag: Option<String>,
    pub pipe_state_category: Option<String>,
}

/// Tipo de suministro eléctrico
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ElectricalSupplyType {
    SinglePhase230V,
    ThreePhase400V,
}

/// Disyuntor o interruptor magnetotérmico
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimBreaker {
    pub id: String,
    pub name: String,
    pub tag: String,
    pub rated_current_a: f64,
    pub curve_type: String, // "B", "C", "D"
    pub is_main: bool,
    pub is_closed: bool,
    pub trip_reason: Option<String>,
    pub thermal_memory: f64, // 0.0 (frío) a 1.0 (disparado)
}

/// Suministro y cuadro eléctrico general
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimElectricalSupply {
    pub supply_type: ElectricalSupplyType,
    pub voltage_v: f64,
    pub frequency_hz: f64,
    pub max_contracted_power_kw: f64,
    pub demand_control_enabled: bool,
    pub demand_limit_kw: f64,
    pub breakers: Vec<SimBreaker>,
}

/// Dimensiones de la cámara frigorífica
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChamberDimensions {
    pub length_m: f64,
    pub width_m: f64,
    pub height_m: f64,
}

/// Definición de una cámara frigorífica
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimChamber {
    pub id: String,
    pub name: String,
    pub dimensions: ChamberDimensions,
    pub u_value_w_m2_k: f64, // Transmitancia térmica aislamiento
    pub ambient_temp_ext_c: f64,
    pub setpoint_temp_c: f64,
    pub hysteresis_k: f64,
    pub current_air_temp_c: f64,
    pub product_mass_kg: f64,
    pub product_cp_kj_kg_k: f64,
    pub product_temp_c: f64,
    pub is_door_open: bool,
    pub internal_lights_w: f64,
    pub occupancy_people: u32,
    pub is_defrost_active: bool,
    pub defrost_heater_power_kw: f64,
}

/// Definición completa de la instalación P&ID (esquema)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallationSchema {
    pub version: String,
    pub name: String,
    pub refrigerant: String,
    pub total_charge_kg: f64,
    pub current_charge_kg: f64,
    pub leak_rate_kg_h: f64,
    pub ambient_temp_c: f64,
    pub electrical: SimElectricalSupply,
    pub chambers: Vec<SimChamber>,
    pub equipments: Vec<SimEquipment>,
    pub pipes: Vec<SimPipe>,
    #[serde(default)]
    pub wires: Vec<SimElectricWire>,
}

/// Estado calculado en un punto/tubería
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipeCalculatedState {
    pub pipe_id: String,
    pub pressure_abs_bar: f64,
    pub pressure_gauge_bar: f64,
    pub temperature_c: f64,
    pub enthalpy_kj_kg: f64,
    pub mass_flow_kg_s: f64,
    pub vapor_quality: Option<f64>,
    pub phase_description: String,
}

/// Estado calculado de un equipo individual
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquipmentCalculatedState {
    pub id: String,
    pub run_state: EquipmentRunState,
    pub electrical_power_kw: f64,
    pub current_a: f64,
    pub thermal_capacity_kw: f64,
    pub inlet_pressure_bar: Option<f64>,
    pub outlet_pressure_bar: Option<f64>,
    pub inlet_temp_c: Option<f64>,
    pub outlet_temp_c: Option<f64>,
    pub effective_flow_kg_s: Option<f64>,
    pub superheat_k: Option<f64>,
    pub subcooling_k: Option<f64>,
    pub status_message: String,
}

/// Resumen eléctrico instantáneo y acumulado
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElectricalPanelState {
    pub total_active_power_kw: f64,
    pub peak_demand_kw: f64,
    pub total_energy_kwh: f64,
    pub current_phase_r_a: f64,
    pub current_phase_s_a: f64,
    pub current_phase_t_a: f64,
    pub power_factor: f64,
    pub is_main_breaker_tripped: bool,
    pub is_demand_limit_exceeded: bool,
    pub breakers: Vec<SimBreaker>,
}

/// Evento de alarma o log de simulación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimEventLogItem {
    pub timestamp_s: f64,
    pub formatted_time: String,
    pub level: String, // "INFO", "WARN", "ALARM", "TRIP"
    pub source_id: String,
    pub source_tag: String,
    pub message: String,
    pub reset_condition: Option<String>,
}

/// Registro histórico para gráficos
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationHistoryPoint {
    pub time_s: f64,
    pub suction_pressure_bar: f64,
    pub discharge_pressure_bar: f64,
    pub chamber_air_temp_c: f64,
    pub chamber_product_temp_c: f64,
    pub total_power_kw: f64,
    pub cooling_capacity_kw: f64,
    pub charge_kg: f64,
}

/// Estado global de la simulación en un instante dado
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationStateResponse {
    pub is_running: bool,
    pub sim_time_s: f64,
    pub speed_multiplier: f64,
    pub circuit_refrigerant: String,
    pub total_charge_kg: f64,
    pub current_charge_kg: f64,
    pub charge_status: String, // "Normal", "Sub-carga severa", "Sobre-carga peligrosa"
    pub leak_rate_kg_h: f64,
    pub suction_pressure_bar: f64,
    pub discharge_pressure_bar: f64,
    pub evaporation_temp_c: f64,
    pub condensing_temp_c: f64,
    pub system_superheat_k: f64,
    pub system_subcooling_k: f64,
    pub total_cooling_capacity_kw: f64,
    pub cop: f64,
    pub electrical: ElectricalPanelState,
    pub chambers: Vec<SimChamber>,
    pub equipments: HashMap<String, EquipmentCalculatedState>,
    pub pipes: HashMap<String, PipeCalculatedState>,
    pub active_alarms: Vec<SimEventLogItem>,
    pub recent_history: Vec<SimulationHistoryPoint>,
}
