use crate::pid_sim::model::{ElectricalSupplyType, SimElectricalSupply};

pub struct ElectricalLoad {
    pub id: String,
    pub breaker_id: Option<String>,
    pub nominal_power_kw: f64,
    pub power_factor: f64,
    pub is_starting: bool,
    pub starting_multiplier: f64,
    pub is_running: bool,
    pub is_single_phase: bool,
}

pub struct ElectricalCalculationResult {
    pub total_active_power_kw: f64,
    pub current_phase_r_a: f64,
    pub current_phase_s_a: f64,
    pub current_phase_t_a: f64,
    pub power_factor: f64,
    pub breaker_currents: Vec<(String, f64)>, // breaker_id, current_a
    pub newly_tripped_breakers: Vec<(String, String)>, // breaker_id, reason
    pub is_demand_exceeded: bool,
}

pub struct ElectricalSimulator;

impl ElectricalSimulator {
    /// Paso temporal del modelo eléctrico
    pub fn step(
        supply: &mut SimElectricalSupply,
        loads: &[ElectricalLoad],
        dt: f64,
        total_energy_kwh: &mut f64,
        peak_demand_kw: &mut f64,
    ) -> ElectricalCalculationResult {
        let mut total_active_power_kw = 0.0;
        let mut total_apparent_power_kva = 0.0;
        let mut breaker_currents = Vec::new();
        let mut newly_tripped_breakers = Vec::new();

        // 1. Calcular consumo individual por carga y asociar a disyuntor
        let mut load_currents_by_breaker: std::collections::HashMap<String, f64> =
            std::collections::HashMap::new();

        for load in loads {
            // Verificar si el disyuntor asignado está cerrado
            let breaker_closed = if let Some(ref b_id) = load.breaker_id {
                supply
                    .breakers
                    .iter()
                    .find(|b| &b.id == b_id)
                    .map(|b| b.is_closed)
                    .unwrap_or(true)
            } else {
                true
            };

            // Verificar si el interruptor general está cerrado
            let main_closed = supply
                .breakers
                .iter()
                .find(|b| b.is_main)
                .map(|b| b.is_closed)
                .unwrap_or(true);

            if !breaker_closed || !main_closed || !load.is_running {
                continue;
            }

            let effective_power_kw = if load.is_starting {
                load.nominal_power_kw * load.starting_multiplier
            } else {
                load.nominal_power_kw
            };

            let pf = load.power_factor.clamp(0.6, 1.0);
            let apparent_kva = effective_power_kw / pf;

            total_active_power_kw += effective_power_kw;
            total_apparent_power_kva += apparent_kva;

            // Cálculo de intensidad
            let current_a = match supply.supply_type {
                ElectricalSupplyType::ThreePhase400V => {
                    if load.is_single_phase {
                        // Monofásica conectada entre fase y neutro (230V)
                        (effective_power_kw * 1000.0) / (230.0 * pf)
                    } else {
                        // Trifásica equilibrada (400V)
                        (effective_power_kw * 1000.0) / (3.0_f64.sqrt() * supply.voltage_v * pf)
                    }
                }
                ElectricalSupplyType::SinglePhase230V => {
                    (effective_power_kw * 1000.0) / (supply.voltage_v * pf)
                }
            };

            if let Some(ref b_id) = load.breaker_id {
                let entry = load_currents_by_breaker.entry(b_id.clone()).or_insert(0.0);
                *entry += current_a;
            }
        }

        // 2. Comprobar disparo de disyuntores de ramal
        let thermal_tau_s = 25.0; // Constante de tiempo térmica normalizada

        for breaker in supply.breakers.iter_mut().filter(|b| !b.is_main) {
            let current_a = load_currents_by_breaker
                .get(&breaker.id)
                .cloned()
                .unwrap_or(0.0);
            breaker_currents.push((breaker.id.clone(), current_a));

            if !breaker.is_closed {
                // Enfriamiento pasivo cuando está abierto
                let decay = (-dt / thermal_tau_s).exp();
                breaker.thermal_memory *= decay;
                continue;
            }

            let ratio = current_a / breaker.rated_current_a.max(0.1);

            // Disparo magnético instantáneo (> 8x In para curva C)
            if ratio >= 8.0 {
                breaker.is_closed = false;
                let reason = format!(
                    "Disparo magnético instantáneo ({:.1} A > 8x {:.0} A)",
                    current_a, breaker.rated_current_a
                );
                breaker.trip_reason = Some(reason.clone());
                breaker.thermal_memory = 1.0;
                newly_tripped_breakers.push((breaker.id.clone(), reason));
                continue;
            }

            // Calentamiento térmico analítico exacto: theta(t+dt) = ratio² + (theta - ratio²) * e^(-dt/tau)
            let steady_theta = ratio * ratio;
            let decay = (-dt / thermal_tau_s).exp();
            breaker.thermal_memory = (steady_theta + (breaker.thermal_memory - steady_theta) * decay).clamp(0.0, 1.5);

            if breaker.thermal_memory >= 1.0 {
                breaker.is_closed = false;
                let reason = format!(
                    "Disparo por sobrecarga térmica I²t ({:.1} A sobre {:.0} A)",
                    current_a, breaker.rated_current_a
                );
                breaker.trip_reason = Some(reason.clone());
                newly_tripped_breakers.push((breaker.id.clone(), reason));
            }
        }

        // 3. Corrientes de línea en la cabecera
        let (current_phase_r_a, current_phase_s_a, current_phase_t_a) = match supply.supply_type {
            ElectricalSupplyType::ThreePhase400V => {
                let total_pf = if total_apparent_power_kva > 0.0 {
                    (total_active_power_kw / total_apparent_power_kva).clamp(0.6, 1.0)
                } else {
                    0.95
                };
                let avg_i = (total_active_power_kw * 1000.0)
                    / (3.0_f64.sqrt() * supply.voltage_v * total_pf);
                (avg_i, avg_i, avg_i)
            }
            ElectricalSupplyType::SinglePhase230V => {
                let total_pf = if total_apparent_power_kva > 0.0 {
                    (total_active_power_kw / total_apparent_power_kva).clamp(0.6, 1.0)
                } else {
                    0.95
                };
                let i = (total_active_power_kw * 1000.0) / (supply.voltage_v * total_pf);
                (i, 0.0, 0.0)
            }
        };

        // 4. Comprobar disparo de disyuntor general (IGA)
        if let Some(main_breaker) = supply.breakers.iter_mut().find(|b| b.is_main) {
            breaker_currents.push((main_breaker.id.clone(), current_phase_r_a));

            if main_breaker.is_closed {
                let main_ratio = current_phase_r_a / main_breaker.rated_current_a.max(0.1);
                if main_ratio >= 8.0 {
                    main_breaker.is_closed = false;
                    let reason = format!(
                        "Disparo magnético del General IGA ({:.1} A)",
                        current_phase_r_a
                    );
                    main_breaker.trip_reason = Some(reason.clone());
                    main_breaker.thermal_memory = 1.0;
                    newly_tripped_breakers.push((main_breaker.id.clone(), reason));
                } else {
                    let steady_theta = main_ratio * main_ratio;
                    let decay = (-dt / 35.0).exp();
                    main_breaker.thermal_memory =
                        (steady_theta + (main_breaker.thermal_memory - steady_theta) * decay).clamp(0.0, 1.5);
                    if main_breaker.thermal_memory >= 1.0 {
                        main_breaker.is_closed = false;
                        let reason = format!(
                            "Disparo térmico del General IGA ({:.1} A sobre {:.0} A)",
                            current_phase_r_a, main_breaker.rated_current_a
                        );
                        main_breaker.trip_reason = Some(reason.clone());
                        newly_tripped_breakers.push((main_breaker.id.clone(), reason));
                    }
                }
            } else {
                let decay = (-dt / 35.0).exp();
                main_breaker.thermal_memory *= decay;
            }
        }

        // 5. Acumulación de energía y demanda máxima
        *total_energy_kwh += (total_active_power_kw * dt) / 3600.0;
        if total_active_power_kw > *peak_demand_kw {
            *peak_demand_kw = total_active_power_kw;
        }

        let is_demand_exceeded = supply.demand_control_enabled
            && total_active_power_kw > supply.demand_limit_kw;

        let power_factor = if total_apparent_power_kva > 0.0 {
            (total_active_power_kw / total_apparent_power_kva).clamp(0.6, 1.0)
        } else {
            0.95
        };

        ElectricalCalculationResult {
            total_active_power_kw,
            current_phase_r_a,
            current_phase_s_a,
            current_phase_t_a,
            power_factor,
            breaker_currents,
            newly_tripped_breakers,
            is_demand_exceeded,
        }
    }
}
