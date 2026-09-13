use crate::pid_sim::chambers::ChamberSimulator;
use crate::pid_sim::charge::ChargeSimulator;
use crate::pid_sim::controls::ControlsManager;
use crate::pid_sim::electrical::{ElectricalLoad, ElectricalSimulator};
use crate::pid_sim::model::*;
use crate::pid_sim::refrigeration::{
    CircuitOperatingConditions, CompressorOperatingInput, RefrigerationSolver,
};
use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;

pub struct SimulationEngineState {
    pub schema: Option<InstallationSchema>,
    pub is_running: bool,
    pub sim_time_s: f64,
    pub speed_multiplier: f64,
    pub controls: ControlsManager,
    pub total_energy_kwh: f64,
    pub peak_demand_kw: f64,
    pub active_alarms: Vec<SimEventLogItem>,
    pub history: VecDeque<SimulationHistoryPoint>,
    pub max_history_size: usize,
}

pub struct PidSimEngine {
    state: Mutex<SimulationEngineState>,
}

static INSTANCE: std::sync::OnceLock<PidSimEngine> = std::sync::OnceLock::new();

pub fn get_sim_engine() -> &'static PidSimEngine {
    INSTANCE.get_or_init(|| PidSimEngine {
        state: Mutex::new(SimulationEngineState {
            schema: None,
            is_running: false,
            sim_time_s: 0.0,
            speed_multiplier: 1.0,
            controls: ControlsManager::new(),
            total_energy_kwh: 0.0,
            peak_demand_kw: 0.0,
            active_alarms: Vec::new(),
            history: VecDeque::with_capacity(120),
            max_history_size: 120,
        }),
    })
}

impl PidSimEngine {
    /// Carga un nuevo esquema de instalación
    pub fn load_schema(&self, schema: InstallationSchema) {
        let mut lock = self.state.lock().unwrap();
        lock.schema = Some(schema);
        lock.sim_time_s = 0.0;
        lock.total_energy_kwh = 0.0;
        lock.peak_demand_kw = 0.0;
        lock.active_alarms.clear();
        lock.history.clear();
        lock.controls = ControlsManager::new();
    }

    /// Inicia la simulación
    pub fn start(&self) {
        let mut lock = self.state.lock().unwrap();
        lock.is_running = true;
    }

    /// Pausa la simulación
    pub fn pause(&self) {
        let mut lock = self.state.lock().unwrap();
        lock.is_running = false;
    }

    /// Reinicia la simulación al estado inicial
    pub fn reset(&self) {
        let mut lock = self.state.lock().unwrap();
        lock.sim_time_s = 0.0;
        lock.total_energy_kwh = 0.0;
        lock.peak_demand_kw = 0.0;
        lock.active_alarms.clear();
        lock.history.clear();
        lock.controls = ControlsManager::new();

        if let Some(ref mut schema) = lock.schema {
            schema.current_charge_kg = schema.total_charge_kg;
            schema.leak_rate_kg_h = 0.0;
            for ch in &mut schema.chambers {
                ch.current_air_temp_c = 18.0;
                ch.product_temp_c = 18.0;
                ch.is_door_open = false;
                ch.is_defrost_active = false;
            }
            for b in &mut schema.electrical.breakers {
                b.is_closed = true;
                b.thermal_memory = 0.0;
                b.trip_reason = None;
            }
        }
    }

    /// Ajusta la velocidad de simulación (1.0 a 30.0)
    pub fn set_speed(&self, multiplier: f64) {
        let mut lock = self.state.lock().unwrap();
        lock.speed_multiplier = multiplier.clamp(0.1, 50.0);
    }

    /// Intervención interactiva del usuario
    pub fn intervene(&self, action: &str, target_id: &str, value: f64) -> Result<String, String> {
        let mut lock = self.state.lock().unwrap();
        if lock.schema.is_none() {
            return Err("No hay instalación cargada".to_string());
        }

        match action {
            "toggle_breaker" => {
                let schema = lock.schema.as_mut().unwrap();
                if let Some(b) = schema.electrical.breakers.iter_mut().find(|b| b.id == target_id) {
                    if b.is_closed {
                        b.is_closed = false;
                        b.trip_reason = Some("Apertura manual por usuario".to_string());
                        Ok(format!("Disyuntor {} abierto manualmente", b.tag))
                    } else {
                        if b.thermal_memory >= 0.7 {
                            return Err(format!(
                                "Bloqueo de rearme en {}: memoria térmica elevada ({:.0}%). Espere enfriamiento.",
                                b.tag, b.thermal_memory * 100.0
                            ));
                        }
                        b.is_closed = true;
                        b.trip_reason = None;
                        Ok(format!("Disyuntor {} rearmado con éxito", b.tag))
                    }
                } else {
                    Err("Disyuntor no encontrado".to_string())
                }
            }
            "toggle_chamber_door" => {
                let schema = lock.schema.as_mut().unwrap();
                if let Some(ch) = schema.chambers.iter_mut().find(|c| c.id == target_id) {
                    ch.is_door_open = !ch.is_door_open;
                    Ok(format!(
                        "Puerta de cámara '{}' {}",
                        ch.name,
                        if ch.is_door_open { "ABIERTA" } else { "CERRADA" }
                    ))
                } else {
                    Err("Cámara no encontrada".to_string())
                }
            }
            "set_chamber_setpoint" => {
                let schema = lock.schema.as_mut().unwrap();
                if let Some(ch) = schema.chambers.iter_mut().find(|c| c.id == target_id) {
                    ch.setpoint_temp_c = value;
                    Ok(format!("Consigna de cámara '{}' fijada en {:.1} °C", ch.name, value))
                } else {
                    Err("Cámara no encontrada".to_string())
                }
            }
            "set_leak_rate" => {
                let schema = lock.schema.as_mut().unwrap();
                schema.leak_rate_kg_h = value.max(0.0);
                Ok(format!("Tasa de fuga fijada en {:.2} kg/h", schema.leak_rate_kg_h))
            }
            "add_refrigerant_charge" => {
                let schema = lock.schema.as_mut().unwrap();
                schema.current_charge_kg += value;
                Ok(format!(
                    "Añadidos {:.2} kg de refrigerante. Carga actual: {:.2} kg",
                    value, schema.current_charge_kg
                ))
            }
            "trigger_defrost" => {
                lock.controls.trigger_manual_defrost(value.max(30.0));
                let schema = lock.schema.as_mut().unwrap();
                if let Some(ch) = schema.chambers.iter_mut().find(|c| c.id == target_id) {
                    ch.is_defrost_active = true;
                }
                Ok("Ciclo de desescarche forzado iniciado".to_string())
            }
            "reset_hp_switch" => {
                if lock.controls.reset_hp_switch() {
                    Ok("Presostato de alta presión (HP) rearmado".to_string())
                } else {
                    Ok("El presostato HP ya se encontraba rearmado".to_string())
                }
            }
            _ => Err(format!("Acción de intervención desconocida: {}", action)),
        }
    }

    /// Ejecuta un paso temporal dt con sub-stepping para estabilidad numérica
    pub fn step(&self, dt: f64) {
        let mut lock = self.state.lock().unwrap();
        if !lock.is_running || lock.schema.is_none() {
            return;
        }

        let speed = lock.speed_multiplier;
        let effective_dt = dt * speed;

        // Sub-stepping para garantizar estabilidad numérica a 10x o 30x
        let max_sub_dt = 0.5; // paso máximo de integración 0.5s
        let steps = (effective_dt / max_sub_dt).ceil() as usize;
        let sub_dt = effective_dt / (steps.max(1) as f64);

        for _ in 0..steps {
            Self::step_internal(&mut lock, sub_dt);
        }
    }

    fn step_internal(lock: &mut SimulationEngineState, dt: f64) {
        let schema = match lock.schema.as_mut() {
            Some(s) => s,
            None => return,
        };

        lock.sim_time_s += dt;

        // 1. Actualizar fugas de refrigerante
        ChargeSimulator::update_leak(&mut schema.current_charge_kg, schema.leak_rate_kg_h, dt);

        // 2. Evaluar balance de masa y estado de carga
        let charge_dist = ChargeSimulator::evaluate(
            schema.total_charge_kg,
            schema.current_charge_kg,
            15.0, // Volumen de recipiente litros
            25.0, // Volumen condensador litros
            1200.0,
        );

        // 3. Preparar compresores (buscar compresores en equipos)
        let mut comp_inputs = Vec::new();
        let mut comp_breakers_status: HashMap<String, bool> = HashMap::new();

        let mut lead_comp_id = String::new();
        let mut lag_comp_id = String::new();

        for eq in &schema.equipments {
            let eq_type = ComponentType::from(eq.component_type.as_str());
            if matches!(
                eq_type,
                ComponentType::CompressorScroll
                    | ComponentType::CompressorReciprocating
                    | ComponentType::CompressorScrew
                    | ComponentType::CompressorInverter
            ) {
                let is_lead = eq.is_lead_compressor.unwrap_or(comp_inputs.is_empty());
                if is_lead && lead_comp_id.is_empty() {
                    lead_comp_id = eq.id.clone();
                } else if lag_comp_id.is_empty() {
                    lag_comp_id = eq.id.clone();
                }

                // Verificar su disyuntor
                let is_breaker_closed = if let Some(ref b_id) = eq.breaker_id {
                    schema
                        .electrical
                        .breakers
                        .iter()
                        .find(|b| &b.id == b_id)
                        .map(|b| b.is_closed)
                        .unwrap_or(true)
                } else {
                    true
                };
                comp_breakers_status.insert(eq.id.clone(), is_breaker_closed);

                let is_running = if eq.id == lead_comp_id {
                    lock.controls.lead_comp.run_state == EquipmentRunState::Running
                        || lock.controls.lead_comp.run_state == EquipmentRunState::Starting
                } else {
                    lock.controls.lag_comp.run_state == EquipmentRunState::Running
                        || lock.controls.lag_comp.run_state == EquipmentRunState::Starting
                };

                comp_inputs.push(CompressorOperatingInput {
                    id: eq.id.clone(),
                    tag: eq.tag.clone(),
                    is_running,
                    displacement_m3_h: eq.displacement_m3_h.unwrap_or(18.5),
                    nominal_power_kw: eq.nominal_power_kw.unwrap_or(5.5),
                });
            }
        }

        let lead_breaker_closed = comp_breakers_status
            .get(&lead_comp_id)
            .cloned()
            .unwrap_or(true);
        let lag_breaker_closed = comp_breakers_status
            .get(&lag_comp_id)
            .cloned()
            .unwrap_or(true);

        // 4. Parámetros de la primera cámara frigorífica
        let first_chamber = schema.chambers.get(0).cloned();
        let (chamber_air_temp, chamber_setpoint, chamber_hysteresis) = match first_chamber {
            Some(ref ch) => (ch.current_air_temp_c, ch.setpoint_temp_c, ch.hysteresis_k),
            None => (18.0, 2.0, 2.0),
        };

        // 5. Paso de controles
        // Estimación previa de presiones para control
        let est_suction_p = if comp_inputs.iter().any(|c| c.is_running) {
            2.1
        } else {
            5.0
        };
        let est_discharge_p = if comp_inputs.iter().any(|c| c.is_running) {
            12.5
        } else {
            5.0
        };

        let is_demand_exceeded = schema.electrical.demand_control_enabled
            && lock.peak_demand_kw > schema.electrical.demand_limit_kw;

        lock.controls.step(
            chamber_air_temp,
            chamber_setpoint,
            chamber_hysteresis,
            est_suction_p,
            est_discharge_p,
            is_demand_exceeded,
            lead_breaker_closed,
            lag_breaker_closed,
            dt,
        );

        // Actualizar estado de marcha en comp_inputs con el nuevo estado del controlador
        for comp in &mut comp_inputs {
            if comp.id == lead_comp_id {
                comp.is_running = lock.controls.lead_comp.run_state == EquipmentRunState::Running
                    || lock.controls.lead_comp.run_state == EquipmentRunState::Starting;
            } else if comp.id == lag_comp_id {
                comp.is_running = lock.controls.lag_comp.run_state == EquipmentRunState::Running
                    || lock.controls.lag_comp.run_state == EquipmentRunState::Starting;
            }
        }

        // 6. Solucionador del Ciclo Frigorífico
        let cycle_conditions = CircuitOperatingConditions {
            refrigerant: schema.refrigerant.clone(),
            ambient_temp_c: schema.ambient_temp_c,
            chamber_air_temp_c: chamber_air_temp,
            nominal_evaporator_capacity_kw: 14.0,
            nominal_condenser_capacity_kw: 22.0,
            txv_superheat_setpoint_k: 5.0,
            nominal_subcooling_k: 4.0,
            is_solenoid_open: lock.controls.solenoid_valve_open,
            charge_dist,
        };

        let cycle_res = RefrigerationSolver::solve(&comp_inputs, &cycle_conditions);

        // 7. Simulación de Cámaras Frigoríficas
        for ch in &mut schema.chambers {
            ch.is_defrost_active = lock.controls.is_defrost_active;
            ChamberSimulator::step(ch, cycle_res.cooling_capacity_kw, dt);
        }

        // 8. Simulación Eléctrica
        let mut electrical_loads = Vec::new();

        // Cargas de compresores
        for comp in &comp_inputs {
            let eq = schema.equipments.iter().find(|e| e.id == comp.id);
            let is_starting = if comp.id == lead_comp_id {
                lock.controls.lead_comp.run_state == EquipmentRunState::Starting
            } else {
                lock.controls.lag_comp.run_state == EquipmentRunState::Starting
            };

            let calc_p_kw = cycle_res
                .compressor_powers
                .iter()
                .find(|(id, _)| id == &comp.id)
                .map(|(_, p)| *p)
                .unwrap_or(0.0);

            electrical_loads.push(ElectricalLoad {
                id: comp.id.clone(),
                breaker_id: eq.and_then(|e| e.breaker_id.clone()),
                nominal_power_kw: calc_p_kw.max(0.1),
                power_factor: 0.85,
                is_starting,
                starting_multiplier: 5.5,
                is_running: comp.is_running,
                is_single_phase: false,
            });
        }

        // Ventilador de condensador (1.2 kW trifásico)
        let cond_fan_running = comp_inputs.iter().any(|c| c.is_running);
        let cond_breaker = schema
            .electrical
            .breakers
            .iter()
            .find(|b| b.name.contains("Condensador") || b.tag.contains("Q3"))
            .map(|b| b.id.clone());
        electrical_loads.push(ElectricalLoad {
            id: "load_cond_fan".to_string(),
            breaker_id: cond_breaker,
            nominal_power_kw: 1.1,
            power_factor: 0.82,
            is_starting: false,
            starting_multiplier: 1.0,
            is_running: cond_fan_running,
            is_single_phase: false,
        });

        // Resistencias de desescarche (3.5 kW)
        let defrost_breaker = schema
            .electrical
            .breakers
            .iter()
            .find(|b| b.name.contains("Desescarche") || b.tag.contains("Q5"))
            .map(|b| b.id.clone());
        electrical_loads.push(ElectricalLoad {
            id: "load_defrost".to_string(),
            breaker_id: defrost_breaker,
            nominal_power_kw: 3.5,
            power_factor: 1.0, // Resistivo
            is_starting: false,
            starting_multiplier: 1.0,
            is_running: lock.controls.is_defrost_active,
            is_single_phase: true,
        });

        let elec_res = ElectricalSimulator::step(
            &mut schema.electrical,
            &electrical_loads,
            dt,
            &mut lock.total_energy_kwh,
            &mut lock.peak_demand_kw,
        );

        // 9. Alarmas y disparos nuevos
        for (b_id, reason) in elec_res.newly_tripped_breakers {
            let tag = schema
                .electrical
                .breakers
                .iter()
                .find(|b| b.id == b_id)
                .map(|b| b.tag.clone())
                .unwrap_or_else(|| "Q?".to_string());
            lock.active_alarms.push(SimEventLogItem {
                timestamp_s: lock.sim_time_s,
                formatted_time: format!("{:.0}s", lock.sim_time_s),
                level: "TRIP".to_string(),
                source_id: b_id,
                source_tag: tag,
                message: reason,
                reset_condition: Some("Enfriamiento bimetálica y rearme en panel eléctrico".to_string()),
            });
        }

        if cycle_res.high_pressure_alarm {
            lock.active_alarms.push(SimEventLogItem {
                timestamp_s: lock.sim_time_s,
                formatted_time: format!("{:.0}s", lock.sim_time_s),
                level: "ALARM".to_string(),
                source_id: "ps_hp".to_string(),
                source_tag: "HP-01".to_string(),
                message: format!(
                    "Disparo por alta presión de descarga ({:.1} bar)",
                    cycle_res.discharge_pressure_bar
                ),
                reset_condition: Some("Rearme manual del presostato HP".to_string()),
            });
        }

        // 10. Histórico de métricas
        if lock.history.len() >= lock.max_history_size {
            lock.history.pop_front();
        }
        lock.history.push_back(SimulationHistoryPoint {
            time_s: lock.sim_time_s,
            suction_pressure_bar: cycle_res.suction_pressure_bar,
            discharge_pressure_bar: cycle_res.discharge_pressure_bar,
            chamber_air_temp_c: first_chamber
                .as_ref()
                .map(|c| c.current_air_temp_c)
                .unwrap_or(chamber_air_temp),
            chamber_product_temp_c: first_chamber
                .as_ref()
                .map(|c| c.product_temp_c)
                .unwrap_or(chamber_air_temp),
            total_power_kw: elec_res.total_active_power_kw,
            cooling_capacity_kw: cycle_res.cooling_capacity_kw,
            charge_kg: schema.current_charge_kg,
        });
    }

    /// Retorna el estado completo calculado para enviar al frontend
    pub fn get_state(&self) -> Result<SimulationStateResponse, String> {
        let lock = self.state.lock().unwrap();
        let schema = match lock.schema.as_ref() {
            Some(s) => s,
            None => return Err("No hay instalación cargada".to_string()),
        };

        let charge_dist = ChargeSimulator::evaluate(
            schema.total_charge_kg,
            schema.current_charge_kg,
            15.0,
            25.0,
            1200.0,
        );

        let latest_history = lock.history.back().cloned().unwrap_or(SimulationHistoryPoint {
            time_s: 0.0,
            suction_pressure_bar: 3.5,
            discharge_pressure_bar: 11.0,
            chamber_air_temp_c: 18.0,
            chamber_product_temp_c: 18.0,
            total_power_kw: 0.0,
            cooling_capacity_kw: 0.0,
            charge_kg: schema.current_charge_kg,
        });

        let mut equipments = HashMap::new();
        for eq in &schema.equipments {
            let eq_type = ComponentType::from(eq.component_type.as_str());
            let (run_state, p_kw, i_a, status) = if matches!(
                eq_type,
                ComponentType::CompressorScroll
                    | ComponentType::CompressorReciprocating
                    | ComponentType::CompressorScrew
                    | ComponentType::CompressorInverter
            ) {
                let is_lead = eq.is_lead_compressor.unwrap_or(true);
                let st = if is_lead {
                    lock.controls.lead_comp.run_state.clone()
                } else {
                    lock.controls.lag_comp.run_state.clone()
                };
                let p = if st == EquipmentRunState::Running || st == EquipmentRunState::Starting {
                    eq.nominal_power_kw.unwrap_or(5.5)
                } else {
                    0.0
                };
                let i = (p * 1000.0) / (3.0_f64.sqrt() * 400.0 * 0.85);
                let msg = match st {
                    EquipmentRunState::Running => "En régimen de marcha normal",
                    EquipmentRunState::Starting => "Arranque en curso (pico de corriente)",
                    EquipmentRunState::Stopped => "Parado por control",
                    EquipmentRunState::Interlocked => "Bloqueado por temporizador anti-ciclo",
                    EquipmentRunState::LockedByDemand => "Bloqueado por limitador de demanda (kW)",
                    EquipmentRunState::TrippedOverload => "Disparo de disyuntor por sobrecarga térmica",
                    EquipmentRunState::TrippedSafety => "Disparo de seguridad (Presostato HP)",
                    EquipmentRunState::Defrosting => "Parado por ciclo de desescarche",
                };
                (st, p, i, msg.to_string())
            } else {
                (
                    EquipmentRunState::Running,
                    0.0,
                    0.0,
                    "En servicio".to_string(),
                )
            };

            equipments.insert(
                eq.id.clone(),
                EquipmentCalculatedState {
                    id: eq.id.clone(),
                    run_state,
                    electrical_power_kw: p_kw,
                    current_a: i_a,
                    thermal_capacity_kw: eq.nominal_capacity_kw.unwrap_or(0.0),
                    inlet_pressure_bar: Some(latest_history.suction_pressure_bar),
                    outlet_pressure_bar: Some(latest_history.discharge_pressure_bar),
                    inlet_temp_c: Some(10.0),
                    outlet_temp_c: Some(72.0),
                    effective_flow_kg_s: Some(0.08),
                    superheat_k: Some(5.0),
                    subcooling_k: Some(4.0),
                    status_message: status,
                },
            );
        }

        let pipes = HashMap::new();

        let electrical = ElectricalPanelState {
            total_active_power_kw: latest_history.total_power_kw,
            peak_demand_kw: lock.peak_demand_kw,
            total_energy_kwh: lock.total_energy_kwh,
            current_phase_r_a: (latest_history.total_power_kw * 1000.0)
                / (3.0_f64.sqrt() * 400.0 * 0.85),
            current_phase_s_a: (latest_history.total_power_kw * 1000.0)
                / (3.0_f64.sqrt() * 400.0 * 0.85),
            current_phase_t_a: (latest_history.total_power_kw * 1000.0)
                / (3.0_f64.sqrt() * 400.0 * 0.85),
            power_factor: 0.85,
            is_main_breaker_tripped: schema
                .electrical
                .breakers
                .iter()
                .find(|b| b.is_main)
                .map(|b| !b.is_closed)
                .unwrap_or(false),
            is_demand_limit_exceeded: schema.electrical.demand_control_enabled
                && latest_history.total_power_kw > schema.electrical.demand_limit_kw,
            breakers: schema.electrical.breakers.clone(),
        };

        let cop = if latest_history.total_power_kw > 0.05 {
            latest_history.cooling_capacity_kw / latest_history.total_power_kw
        } else {
            0.0
        };

        Ok(SimulationStateResponse {
            is_running: lock.is_running,
            sim_time_s: lock.sim_time_s,
            speed_multiplier: lock.speed_multiplier,
            circuit_refrigerant: schema.refrigerant.clone(),
            total_charge_kg: schema.total_charge_kg,
            current_charge_kg: schema.current_charge_kg,
            charge_status: charge_dist.condition_description,
            leak_rate_kg_h: schema.leak_rate_kg_h,
            suction_pressure_bar: latest_history.suction_pressure_bar,
            discharge_pressure_bar: latest_history.discharge_pressure_bar,
            evaporation_temp_c: -5.0,
            condensing_temp_c: 42.0,
            system_superheat_k: 5.0,
            system_subcooling_k: 4.0,
            total_cooling_capacity_kw: latest_history.cooling_capacity_kw,
            cop,
            electrical,
            chambers: schema.chambers.clone(),
            equipments,
            pipes,
            active_alarms: lock.active_alarms.clone(),
            recent_history: lock.history.iter().cloned().collect(),
        })
    }
}
