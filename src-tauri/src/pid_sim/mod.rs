pub mod chambers;
pub mod charge;
pub mod controls;
pub mod electrical;
pub mod engine;
pub mod model;
pub mod refrigeration;
pub mod validator;

use engine::get_sim_engine;
use model::{InstallationSchema, SimulationStateResponse};
use validator::{SchemaValidator, ValidationReport};

#[tauri::command]
pub fn pid_sim_load_schema_cmd(schema: InstallationSchema) -> Result<(), String> {
    log::info!("Invocando 'pid_sim_load_schema_cmd' para '{}'", schema.name);
    get_sim_engine().load_schema(schema);
    Ok(())
}

#[tauri::command]
pub fn pid_sim_start_cmd() -> Result<(), String> {
    get_sim_engine().start();
    Ok(())
}

#[tauri::command]
pub fn pid_sim_pause_cmd() -> Result<(), String> {
    get_sim_engine().pause();
    Ok(())
}

#[tauri::command]
pub fn pid_sim_reset_cmd() -> Result<(), String> {
    get_sim_engine().reset();
    Ok(())
}

#[tauri::command]
pub fn pid_sim_step_cmd(dt: f64) -> Result<SimulationStateResponse, String> {
    get_sim_engine().step(dt);
    get_sim_engine().get_state()
}

#[tauri::command]
pub fn pid_sim_set_speed_cmd(multiplier: f64) -> Result<(), String> {
    get_sim_engine().set_speed(multiplier);
    Ok(())
}

#[tauri::command]
pub fn pid_sim_intervene_cmd(
    action: String,
    target_id: String,
    value: f64,
) -> Result<String, String> {
    get_sim_engine().intervene(&action, &target_id, value)
}

#[tauri::command]
pub fn pid_sim_get_state_cmd() -> Result<SimulationStateResponse, String> {
    get_sim_engine().get_state()
}

#[tauri::command]
pub fn pid_sim_validate_cmd(schema: InstallationSchema) -> Result<ValidationReport, String> {
    Ok(SchemaValidator::validate(&schema))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pid_sim::chambers::ChamberSimulator;
    use crate::pid_sim::charge::{ChargeCondition, ChargeSimulator};
    use crate::pid_sim::electrical::{ElectricalLoad, ElectricalSimulator};
    use crate::pid_sim::model::*;
    use crate::pid_sim::refrigeration::{
        CircuitOperatingConditions, CompressorOperatingInput, RefrigerationSolver,
    };

    fn make_test_schema() -> InstallationSchema {
        InstallationSchema {
            version: "2.0.0".to_string(),
            name: "Prueba 2 Compresores R134a".to_string(),
            refrigerant: "R134a".to_string(),
            total_charge_kg: 18.0,
            current_charge_kg: 18.0,
            leak_rate_kg_h: 0.0,
            ambient_temp_c: 32.0,
            electrical: SimElectricalSupply {
                supply_type: ElectricalSupplyType::ThreePhase400V,
                voltage_v: 400.0,
                frequency_hz: 50.0,
                max_contracted_power_kw: 25.0,
                demand_control_enabled: true,
                demand_limit_kw: 20.0,
                breakers: vec![
                    SimBreaker {
                        id: "b_main".to_string(),
                        name: "General IGA".to_string(),
                        tag: "IGA".to_string(),
                        rated_current_a: 50.0,
                        curve_type: "C".to_string(),
                        is_main: true,
                        is_closed: true,
                        trip_reason: None,
                        thermal_memory: 0.0,
                    },
                    SimBreaker {
                        id: "b_comp1".to_string(),
                        name: "Compresor 1".to_string(),
                        tag: "Q1".to_string(),
                        rated_current_a: 16.0,
                        curve_type: "D".to_string(),
                        is_main: false,
                        is_closed: true,
                        trip_reason: None,
                        thermal_memory: 0.0,
                    },
                    SimBreaker {
                        id: "b_comp2".to_string(),
                        name: "Compresor 2".to_string(),
                        tag: "Q2".to_string(),
                        rated_current_a: 16.0,
                        curve_type: "D".to_string(),
                        is_main: false,
                        is_closed: true,
                        trip_reason: None,
                        thermal_memory: 0.0,
                    },
                ],
            },
            chambers: vec![SimChamber {
                id: "ch_01".to_string(),
                name: "Cámara Frescos".to_string(),
                dimensions: ChamberDimensions {
                    length_m: 5.0,
                    width_m: 4.0,
                    height_m: 3.0,
                },
                u_value_w_m2_k: 0.30,
                ambient_temp_ext_c: 32.0,
                setpoint_temp_c: 2.0,
                hysteresis_k: 2.0,
                current_air_temp_c: 18.0,
                product_mass_kg: 3000.0,
                product_cp_kj_kg_k: 3.8,
                product_temp_c: 18.0,
                is_door_open: false,
                internal_lights_w: 120.0,
                occupancy_people: 0,
                is_defrost_active: false,
                defrost_heater_power_kw: 3.5,
            }],
            equipments: vec![
                SimEquipment {
                    id: "cmp_1".to_string(),
                    tag: "CMP-01".to_string(),
                    label: "Compresor 1 Lead".to_string(),
                    component_type: "compressor_reciprocating".to_string(),
                    is_energized: true,
                    nominal_capacity_kw: Some(15.0),
                    nominal_power_kw: Some(5.5),
                    displacement_m3_h: Some(18.5),
                    superheat_setpoint_k: None,
                    subcooling_k: None,
                    internal_volume_l: Some(4.0),
                    valve_opening_percent: None,
                    is_valve_open: None,
                    breaker_id: Some("b_comp1".to_string()),
                    chamber_id: None,
                    is_lead_compressor: Some(true),
                    min_off_time_s: Some(180.0),
                    start_inrush_multiplier: Some(5.5),
                },
                SimEquipment {
                    id: "cmp_2".to_string(),
                    tag: "CMP-02".to_string(),
                    label: "Compresor 2 Lag".to_string(),
                    component_type: "compressor_reciprocating".to_string(),
                    is_energized: false,
                    nominal_capacity_kw: Some(15.0),
                    nominal_power_kw: Some(5.5),
                    displacement_m3_h: Some(18.5),
                    superheat_setpoint_k: None,
                    subcooling_k: None,
                    internal_volume_l: Some(4.0),
                    valve_opening_percent: None,
                    is_valve_open: None,
                    breaker_id: Some("b_comp2".to_string()),
                    chamber_id: None,
                    is_lead_compressor: Some(false),
                    min_off_time_s: Some(180.0),
                    start_inrush_multiplier: Some(5.5),
                },
                SimEquipment {
                    id: "cnd_1".to_string(),
                    tag: "COND-01".to_string(),
                    label: "Condensador".to_string(),
                    component_type: "condenser_air".to_string(),
                    is_energized: true,
                    nominal_capacity_kw: Some(25.0),
                    nominal_power_kw: Some(1.2),
                    displacement_m3_h: None,
                    superheat_setpoint_k: None,
                    subcooling_k: Some(4.0),
                    internal_volume_l: Some(25.0),
                    valve_opening_percent: None,
                    is_valve_open: None,
                    breaker_id: None,
                    chamber_id: None,
                    is_lead_compressor: None,
                    min_off_time_s: None,
                    start_inrush_multiplier: None,
                },
                SimEquipment {
                    id: "txv_1".to_string(),
                    tag: "TXV-01".to_string(),
                    label: "Válvula TXV".to_string(),
                    component_type: "expansion_valve_txv".to_string(),
                    is_energized: true,
                    nominal_capacity_kw: Some(15.0),
                    nominal_power_kw: None,
                    displacement_m3_h: None,
                    superheat_setpoint_k: Some(5.0),
                    subcooling_k: None,
                    internal_volume_l: Some(0.5),
                    valve_opening_percent: Some(60.0),
                    is_valve_open: Some(true),
                    breaker_id: None,
                    chamber_id: None,
                    is_lead_compressor: None,
                    min_off_time_s: None,
                    start_inrush_multiplier: None,
                },
                SimEquipment {
                    id: "evp_1".to_string(),
                    tag: "EVAP-01".to_string(),
                    label: "Evaporador Cámara".to_string(),
                    component_type: "evaporator_dx_air".to_string(),
                    is_energized: true,
                    nominal_capacity_kw: Some(15.0),
                    nominal_power_kw: Some(0.6),
                    displacement_m3_h: None,
                    superheat_setpoint_k: Some(5.0),
                    subcooling_k: None,
                    internal_volume_l: Some(20.0),
                    valve_opening_percent: None,
                    is_valve_open: None,
                    breaker_id: None,
                    chamber_id: Some("ch_01".to_string()),
                    is_lead_compressor: None,
                    min_off_time_s: None,
                    start_inrush_multiplier: None,
                },
            ],
            pipes: vec![
                SimPipe {
                    id: "p1".to_string(),
                    source_node_id: "cmp_1".to_string(),
                    source_port: "discharge".to_string(),
                    target_node_id: "cnd_1".to_string(),
                    target_port: "gas_in".to_string(),
                    diameter_mm: Some(16.0),
                    length_m: Some(5.0),
                    pipe_state_category: Some("discharge_superheated".to_string()),
                },
                SimPipe {
                    id: "p2".to_string(),
                    source_node_id: "cnd_1".to_string(),
                    source_port: "liquid_out".to_string(),
                    target_node_id: "txv_1".to_string(),
                    target_port: "inlet".to_string(),
                    diameter_mm: Some(12.0),
                    length_m: Some(8.0),
                    pipe_state_category: Some("subcooled_liquid".to_string()),
                },
                SimPipe {
                    id: "p3".to_string(),
                    source_node_id: "txv_1".to_string(),
                    source_port: "outlet".to_string(),
                    target_node_id: "evp_1".to_string(),
                    target_port: "liquid_in".to_string(),
                    diameter_mm: Some(12.0),
                    length_m: Some(1.0),
                    pipe_state_category: Some("two_phase_flashing".to_string()),
                },
                SimPipe {
                    id: "p4".to_string(),
                    source_node_id: "evp_1".to_string(),
                    source_port: "vapor_out".to_string(),
                    target_node_id: "cmp_1".to_string(),
                    target_port: "suction".to_string(),
                    diameter_mm: Some(22.0),
                    length_m: Some(6.0),
                    pipe_state_category: Some("suction_superheated".to_string()),
                },
            ],
            wires: vec![],
        }
    }

    #[test]
    fn test_validation_detects_complete_and_missing_installations() {
        let schema = make_test_schema();
        let rep = SchemaValidator::validate(&schema);
        assert!(rep.is_valid, "El esquema de prueba debe ser válido");

        // Quitar el compresor
        let mut broken_schema = schema.clone();
        broken_schema.equipments.retain(|e| !e.component_type.contains("compressor"));
        let rep_broken = SchemaValidator::validate(&broken_schema);
        assert!(!rep_broken.is_valid, "Debe ser inválido si no hay compresor");
        assert!(rep_broken.issues.iter().any(|i| i.level == "ERROR"));
    }

    #[test]
    fn test_electrical_power_kwh_and_thermal_trip() {
        let mut supply = SimElectricalSupply {
            supply_type: ElectricalSupplyType::ThreePhase400V,
            voltage_v: 400.0,
            frequency_hz: 50.0,
            max_contracted_power_kw: 25.0,
            demand_control_enabled: false,
            demand_limit_kw: 20.0,
            breakers: vec![
                SimBreaker {
                    id: "b_test".to_string(),
                    name: "Ramal Test".to_string(),
                    tag: "Q1".to_string(),
                    rated_current_a: 10.0, // 10 A
                    curve_type: "C".to_string(),
                    is_main: false,
                    is_closed: true,
                    trip_reason: None,
                    thermal_memory: 0.0,
                },
                SimBreaker {
                    id: "b_main".to_string(),
                    name: "IGA".to_string(),
                    tag: "IGA".to_string(),
                    rated_current_a: 40.0,
                    curve_type: "C".to_string(),
                    is_main: true,
                    is_closed: true,
                    trip_reason: None,
                    thermal_memory: 0.0,
                },
            ],
        };

        let mut kwh = 0.0;
        let mut peak_kw = 0.0;

        // Carga normal: 5 kW trifásico (~8.5 A < 10 A)
        let loads = vec![ElectricalLoad {
            id: "load1".to_string(),
            breaker_id: Some("b_test".to_string()),
            nominal_power_kw: 5.0,
            power_factor: 0.85,
            is_starting: false,
            starting_multiplier: 1.0,
            is_running: true,
            is_single_phase: false,
        }];

        let _res = ElectricalSimulator::step(&mut supply, &loads, 3600.0, &mut kwh, &mut peak_kw);
        assert!((kwh - 5.0).abs() < 1e-3, "En 1 hora a 5 kW se deben consumir 5 kWh exactos");
        assert!(supply.breakers[0].is_closed, "No debe disparar bajo corriente nominal");

        // Sobrecarga severa: 15 kW en ramal de 10 A (~25.5 A -> 2.5x In)
        let overload = vec![ElectricalLoad {
            id: "load_over".to_string(),
            breaker_id: Some("b_test".to_string()),
            nominal_power_kw: 15.0,
            power_factor: 0.85,
            is_starting: false,
            starting_multiplier: 1.0,
            is_running: true,
            is_single_phase: false,
        }];

        // Avanzar tiempo para que actúe la curva térmica
        for _ in 0..60 {
            ElectricalSimulator::step(&mut supply, &overload, 1.0, &mut kwh, &mut peak_kw);
            if !supply.breakers[0].is_closed {
                break;
            }
        }
        assert!(!supply.breakers[0].is_closed, "El disyuntor debe disparar por sobrecarga térmica I²t");
    }

    #[test]
    fn test_chamber_thermal_balance_and_door_opening() {
        let mut chamber = SimChamber {
            id: "ch_test".to_string(),
            name: "Cámara".to_string(),
            dimensions: ChamberDimensions {
                length_m: 4.0,
                width_m: 4.0,
                height_m: 3.0,
            },
            u_value_w_m2_k: 0.28,
            ambient_temp_ext_c: 30.0,
            setpoint_temp_c: 2.0,
            hysteresis_k: 2.0,
            current_air_temp_c: 10.0,
            product_mass_kg: 2000.0,
            product_cp_kj_kg_k: 3.8,
            product_temp_c: 10.0,
            is_door_open: false,
            internal_lights_w: 0.0,
            occupancy_people: 0,
            is_defrost_active: false,
            defrost_heater_power_kw: 3.0,
        };

        // Enfriamiento con 10 kW frigoríficos
        ChamberSimulator::step(&mut chamber, 10.0, 60.0);
        assert!(chamber.current_air_temp_c < 10.0, "La temperatura del aire debe descender");

        // Sin frío y con puerta abierta: debe calentarse
        let t_before = chamber.current_air_temp_c;
        chamber.is_door_open = true;
        ChamberSimulator::step(&mut chamber, 0.0, 60.0);
        assert!(chamber.current_air_temp_c > t_before, "La temperatura debe aumentar al abrir la puerta sin frío");
    }

    #[test]
    fn test_parallel_compressors_increases_capacity_non_linearly() {
        let comp1 = CompressorOperatingInput {
            id: "c1".to_string(),
            tag: "C1".to_string(),
            is_running: true,
            displacement_m3_h: 18.0,
            nominal_power_kw: 5.5,
        };
        let comp2 = CompressorOperatingInput {
            id: "c2".to_string(),
            tag: "C2".to_string(),
            is_running: false,
            displacement_m3_h: 18.0,
            nominal_power_kw: 5.5,
        };

        let charge_dist = ChargeSimulator::evaluate(18.0, 18.0, 15.0, 25.0, 1200.0);
        let cond = CircuitOperatingConditions {
            refrigerant: "R134a".to_string(),
            ambient_temp_c: 30.0,
            chamber_air_temp_c: 10.0,
            nominal_evaporator_capacity_kw: 16.0,
            nominal_condenser_capacity_kw: 25.0,
            txv_superheat_setpoint_k: 5.0,
            nominal_subcooling_k: 4.0,
            is_solenoid_open: true,
            charge_dist,
        };

        // 1 Compresor activo
        let res_1 = RefrigerationSolver::solve(&[comp1.clone(), comp2.clone()], &cond);

        // 2 Compresores activos
        let mut comp2_active = comp2.clone();
        comp2_active.is_running = true;
        let res_2 = RefrigerationSolver::solve(&[comp1, comp2_active], &cond);

        assert!(res_2.cooling_capacity_kw > res_1.cooling_capacity_kw, "2 compresores deben dar mayor potencia frigorífica");
        assert!(res_2.cooling_capacity_kw < 2.0 * res_1.cooling_capacity_kw, "2 compresores no deben duplicar ciegamente la capacidad si el evaporador limita");
        assert!(res_2.total_compressor_power_kw > res_1.total_compressor_power_kw, "La potencia eléctrica consumida debe aumentar");
    }

    #[test]
    fn test_charge_variation_affects_superheat_and_subcooling() {
        // Carga normal
        let normal = ChargeSimulator::evaluate(20.0, 20.0, 15.0, 25.0, 1200.0);
        assert_eq!(normal.condition, ChargeCondition::Normal);
        assert!(!normal.has_bubbles_in_sight_glass);
        assert_eq!(normal.subcooling_factor, 1.0);

        // Falta de refrigerante (subcarga severa)
        let under = ChargeSimulator::evaluate(20.0, 10.0, 15.0, 25.0, 1200.0);
        assert_eq!(under.condition, ChargeCondition::SevereUndercharge);
        assert!(under.has_bubbles_in_sight_glass, "Debe haber burbujas en el visor ante falta de refrigerante");
        assert!(under.subcooling_factor < 0.2, "El subenfriamiento debe perderse");
        assert!(under.superheat_adder_k > 10.0, "El sobrecalentamiento debe dispararse");

        // Sobrecarga severa
        let over = ChargeSimulator::evaluate(20.0, 28.0, 15.0, 25.0, 1200.0);
        assert_eq!(over.condition, ChargeCondition::SevereOvercharge);
        assert!(over.condenser_flooded_fraction > 0.3, "El condensador debe inundarse de líquido");
        assert!(over.subcooling_factor > 2.0, "El subenfriamiento debe aumentar fuertemente");
    }
}
