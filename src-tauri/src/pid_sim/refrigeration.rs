use crate::pid_sim::charge::ChargeDistribution;
use crate::thermo::engine::get_engine;

#[derive(Debug, Clone)]
pub struct CompressorOperatingInput {
    pub id: String,
    pub tag: String,
    pub is_running: bool,
    pub displacement_m3_h: f64,
    pub nominal_power_kw: f64,
}

pub struct CircuitOperatingConditions {
    pub refrigerant: String,
    pub ambient_temp_c: f64,
    pub chamber_air_temp_c: f64,
    pub nominal_evaporator_capacity_kw: f64,
    pub nominal_condenser_capacity_kw: f64,
    pub txv_superheat_setpoint_k: f64,
    pub nominal_subcooling_k: f64,
    pub is_solenoid_open: bool,
    pub charge_dist: ChargeDistribution,
}

#[derive(Debug, Clone)]
pub struct StatePointCalculated {
    pub p_abs_bar: f64,
    pub p_gauge_bar: f64,
    pub temp_c: f64,
    pub enthalpy_kj_kg: f64,
    pub vapor_quality: Option<f64>,
}

pub struct RefrigerationCycleResult {
    pub suction_pressure_bar: f64,
    pub discharge_pressure_bar: f64,
    pub evaporation_temp_c: f64,
    pub condensing_temp_c: f64,
    pub total_mass_flow_kg_s: f64,
    pub system_superheat_k: f64,
    pub system_subcooling_k: f64,
    pub cooling_capacity_kw: f64,
    pub heat_rejection_kw: f64,
    pub compressor_powers: Vec<(String, f64)>, // id, power_kw
    pub total_compressor_power_kw: f64,
    pub cop: f64,
    pub pt1_suction: StatePointCalculated,
    pub pt2_discharge: StatePointCalculated,
    pub pt3_condenser_out: StatePointCalculated,
    pub pt4_expansion_out: StatePointCalculated,
    pub high_pressure_alarm: bool,
    pub low_pressure_alarm: bool,
    pub discharge_temp_alarm: bool,
}

pub struct RefrigerationSolver;

impl RefrigerationSolver {
    /// Resuelve el punto de equilibrio estacionario del circuito frigorífico
    pub fn solve(
        compressors: &[CompressorOperatingInput],
        cond: &CircuitOperatingConditions,
    ) -> RefrigerationCycleResult {
        let any_running = compressors.iter().any(|c| c.is_running) && cond.is_solenoid_open;

        // Propiedades de saturación aproximadas/CoolProp para el fluido
        let fluid = if cond.refrigerant.is_empty() {
            "R134a"
        } else {
            &cond.refrigerant
        };

        // Si la solenoide está cerrada o no hay compresores en marcha (instalación parada)
        if !any_running {
            let p_equalized_bar = Self::get_sat_pressure(fluid, cond.ambient_temp_c)
                .unwrap_or(5.0)
                .clamp(1.5, 16.0);
            let h_gas = Self::get_sat_enthalpy(fluid, p_equalized_bar, 1.0).unwrap_or(400.0);
            let h_liq = Self::get_sat_enthalpy(fluid, p_equalized_bar, 0.0).unwrap_or(250.0);

            let pt = StatePointCalculated {
                p_abs_bar: p_equalized_bar,
                p_gauge_bar: (p_equalized_bar - 1.013).max(0.0),
                temp_c: cond.ambient_temp_c,
                enthalpy_kj_kg: h_gas,
                vapor_quality: Some(1.0),
            };
            let pt_liq = StatePointCalculated {
                p_abs_bar: p_equalized_bar,
                p_gauge_bar: (p_equalized_bar - 1.013).max(0.0),
                temp_c: cond.ambient_temp_c,
                enthalpy_kj_kg: h_liq,
                vapor_quality: Some(0.0),
            };

            return RefrigerationCycleResult {
                suction_pressure_bar: p_equalized_bar,
                discharge_pressure_bar: p_equalized_bar,
                evaporation_temp_c: cond.ambient_temp_c,
                condensing_temp_c: cond.ambient_temp_c,
                total_mass_flow_kg_s: 0.0,
                system_superheat_k: 0.0,
                system_subcooling_k: 0.0,
                cooling_capacity_kw: 0.0,
                heat_rejection_kw: 0.0,
                compressor_powers: compressors.iter().map(|c| (c.id.clone(), 0.0)).collect(),
                total_compressor_power_kw: 0.0,
                cop: 0.0,
                pt1_suction: pt.clone(),
                pt2_discharge: pt.clone(),
                pt3_condenser_out: pt_liq.clone(),
                pt4_expansion_out: pt_liq,
                high_pressure_alarm: false,
                low_pressure_alarm: false,
                discharge_temp_alarm: false,
            };
        }

        // Si la solenoide está cerrada pero el compresor arranca (Pump-Down)
        if !cond.is_solenoid_open && compressors.iter().any(|c| c.is_running) {
            // La aspiración se vacía a vacío/baja presión extrema
            let p_suction_bar = 0.6; // Presión residual de pump-down
            let p_discharge_bar =
                Self::get_sat_pressure(fluid, cond.ambient_temp_c + 8.0).unwrap_or(12.0);
            return RefrigerationCycleResult {
                suction_pressure_bar: p_suction_bar,
                discharge_pressure_bar: p_discharge_bar,
                evaporation_temp_c: -30.0,
                condensing_temp_c: cond.ambient_temp_c + 8.0,
                total_mass_flow_kg_s: 0.005,
                system_superheat_k: 25.0,
                system_subcooling_k: 5.0,
                cooling_capacity_kw: 0.0,
                heat_rejection_kw: 1.5,
                compressor_powers: compressors
                    .iter()
                    .map(|c| {
                        (
                            c.id.clone(),
                            if c.is_running {
                                c.nominal_power_kw * 0.45
                            } else {
                                0.0
                            },
                        )
                    })
                    .collect(),
                total_compressor_power_kw: 1.5,
                cop: 0.0,
                pt1_suction: StatePointCalculated {
                    p_abs_bar: p_suction_bar,
                    p_gauge_bar: p_suction_bar - 1.013,
                    temp_c: 10.0,
                    enthalpy_kj_kg: 380.0,
                    vapor_quality: Some(1.0),
                },
                pt2_discharge: StatePointCalculated {
                    p_abs_bar: p_discharge_bar,
                    p_gauge_bar: p_discharge_bar - 1.013,
                    temp_c: 75.0,
                    enthalpy_kj_kg: 445.0,
                    vapor_quality: Some(1.0),
                },
                pt3_condenser_out: StatePointCalculated {
                    p_abs_bar: p_discharge_bar,
                    p_gauge_bar: p_discharge_bar - 1.013,
                    temp_c: cond.ambient_temp_c + 4.0,
                    enthalpy_kj_kg: 245.0,
                    vapor_quality: Some(0.0),
                },
                pt4_expansion_out: StatePointCalculated {
                    p_abs_bar: p_suction_bar,
                    p_gauge_bar: p_suction_bar - 1.013,
                    temp_c: -30.0,
                    enthalpy_kj_kg: 245.0,
                    vapor_quality: Some(0.4),
                },
                high_pressure_alarm: false,
                low_pressure_alarm: true,
                discharge_temp_alarm: false,
            };
        }

        // 1. Resolver Presión de Condensación en equilibrio con el ambiente
        // UA condensador (kW/K)
        let delta_t_cond_nom = 12.0; // K de salto térmico nominal condensador-aire
        let ua_cond_nom = (cond.nominal_condenser_capacity_kw / delta_t_cond_nom).max(0.5);
        let effective_ua_cond = ua_cond_nom * cond.charge_dist.condenser_ua_factor.clamp(0.2, 1.0);

        // Suma de desplazamientos de los compresores activos
        let total_active_disp_m3_h: f64 = compressors
            .iter()
            .filter(|c| c.is_running)
            .map(|c| c.displacement_m3_h.max(5.0))
            .sum();

        // 2. Iteración balance Presión de Aspiración y Evaporación
        // UA evaporador (kW/K)
        let delta_t_evap_nom = 8.0; // K de salto térmico cámara-evaporador
        let _ua_evap = (cond.nominal_evaporator_capacity_kw / delta_t_evap_nom).max(0.4);

        // A mayor caudal volumétrico, el evaporador trabaja con mayor salto térmico (T_camara - T_evap)
        // Estimación física acoplada: Q_evap = UA_evap * (T_camara - T_evap)
        // y Q_evap = V_disp * eta_v * rho_gas * delta_h_evap
        let mut t_evap_c = cond.chamber_air_temp_c - (total_active_disp_m3_h * 0.35).clamp(4.0, 22.0);
        // Penalización por falta de refrigerante
        t_evap_c -= (1.0 - cond.charge_dist.expansion_flow_penalty) * 12.0;

        let p_suction_bar = Self::get_sat_pressure(fluid, t_evap_c)
            .unwrap_or(2.5)
            .clamp(0.4, 8.0);

        // Recalentamiento efectivo
        let superheat_k =
            (cond.txv_superheat_setpoint_k + cond.charge_dist.superheat_adder_k).clamp(2.0, 35.0);
        let t_suction_c = t_evap_c + superheat_k;

        // 3. Densidad de aspiración y caudal másico
        let rho_suction_kg_m3 = Self::get_density(fluid, p_suction_bar, t_suction_c).unwrap_or(12.0);

        // Rendimiento volumétrico de compresor alternativo/scroll: eta_v = 1 - c * ((Pd/Ps)^(1/gamma) - 1)
        let est_pr: f64 = 4.2;
        let clearance_ratio = 0.045; // 4.5% espacio muerto
        let eta_v = (1.0 - clearance_ratio * (est_pr.powf(1.0 / 1.15) - 1.0)).clamp(0.65, 0.92);

        let total_mass_flow_kg_s = ((total_active_disp_m3_h / 3600.0)
            * rho_suction_kg_m3
            * eta_v
            * cond.charge_dist.expansion_flow_penalty)
            .max(0.001);

        // 4. Entalpías y Potencia
        let h_sat_vap = Self::get_sat_enthalpy(fluid, p_suction_bar, 1.0).unwrap_or(395.0);
        let h_suction = h_sat_vap + superheat_k * 0.95; // kJ/kg aprox cp vapor

        // Subenfriamiento efectivo
        let subcooling_k =
            (cond.nominal_subcooling_k * cond.charge_dist.subcooling_factor).clamp(0.0, 15.0);

        // Estimación potencia frigorífica y calor de rechazo
        let h_sat_liq_est = 250.0;
        let h_liq_sub = h_sat_liq_est - subcooling_k * 1.4;
        let cooling_capacity_kw = (total_mass_flow_kg_s * (h_suction - h_liq_sub)).max(0.1);

        // Calor de condensación y presión de descarga
        let est_w_elec = (cooling_capacity_kw / 3.1).max(0.8);
        let heat_rejection_kw = cooling_capacity_kw + est_w_elec * 0.85;

        let delta_t_cond = (heat_rejection_kw / effective_ua_cond).clamp(5.0, 30.0);
        let t_cond_c = cond.ambient_temp_c + delta_t_cond;
        let p_discharge_bar = Self::get_sat_pressure(fluid, t_cond_c)
            .unwrap_or(12.0)
            .clamp(6.0, 28.0);

        // Compresión isentrópica CoolProp o formulación termodinámica
        let isentropic_eff = 0.72;
        let motor_mech_eff = 0.88;
        let pr = (p_discharge_bar / p_suction_bar).max(1.1);
        let gamma = 1.14; // exponente isentrópico aprox
        let t_discharge_c = ((t_suction_c + 273.15) * pr.powf((gamma - 1.0) / gamma) - 273.15)
            + (1.0 - isentropic_eff) * 30.0;

        let h_discharge = h_suction + (h_suction * 0.25 * (pr.powf(0.2) - 1.0) / isentropic_eff);
        let h_cond_out = Self::get_sat_enthalpy(fluid, p_discharge_bar, 0.0).unwrap_or(255.0)
            - subcooling_k * 1.42;
        let h_exp_out = h_cond_out; // Expansión isoentálpica

        // Potencia eléctrica individual por compresor activo
        let mut compressor_powers = Vec::new();
        let mut total_compressor_power_kw = 0.0;

        for comp in compressors {
            if comp.is_running {
                let frac = comp.displacement_m3_h / total_active_disp_m3_h.max(0.1);
                let comp_m_dot = total_mass_flow_kg_s * frac;
                let power_kw = ((comp_m_dot * (h_discharge - h_suction)) / motor_mech_eff)
                    .max(comp.nominal_power_kw * 0.4);
                compressor_powers.push((comp.id.clone(), power_kw));
                total_compressor_power_kw += power_kw;
            } else {
                compressor_powers.push((comp.id.clone(), 0.0));
            }
        }

        let cop = if total_compressor_power_kw > 0.05 {
            cooling_capacity_kw / total_compressor_power_kw
        } else {
            0.0
        };

        let high_pressure_alarm = p_discharge_bar >= 21.0;
        let low_pressure_alarm = p_suction_bar <= 0.9;
        let discharge_temp_alarm = t_discharge_c >= 115.0;

        RefrigerationCycleResult {
            suction_pressure_bar: p_suction_bar,
            discharge_pressure_bar: p_discharge_bar,
            evaporation_temp_c: t_evap_c,
            condensing_temp_c: t_cond_c,
            total_mass_flow_kg_s,
            system_superheat_k: superheat_k,
            system_subcooling_k: subcooling_k,
            cooling_capacity_kw,
            heat_rejection_kw,
            compressor_powers,
            total_compressor_power_kw,
            cop,
            pt1_suction: StatePointCalculated {
                p_abs_bar: p_suction_bar,
                p_gauge_bar: (p_suction_bar - 1.013).max(0.0),
                temp_c: t_suction_c,
                enthalpy_kj_kg: h_suction,
                vapor_quality: Some(1.0),
            },
            pt2_discharge: StatePointCalculated {
                p_abs_bar: p_discharge_bar,
                p_gauge_bar: (p_discharge_bar - 1.013).max(0.0),
                temp_c: t_discharge_c,
                enthalpy_kj_kg: h_discharge,
                vapor_quality: Some(1.0),
            },
            pt3_condenser_out: StatePointCalculated {
                p_abs_bar: p_discharge_bar,
                p_gauge_bar: (p_discharge_bar - 1.013).max(0.0),
                temp_c: t_cond_c - subcooling_k,
                enthalpy_kj_kg: h_cond_out,
                vapor_quality: Some(0.0),
            },
            pt4_expansion_out: StatePointCalculated {
                p_abs_bar: p_suction_bar,
                p_gauge_bar: (p_suction_bar - 1.013).max(0.0),
                temp_c: t_evap_c,
                enthalpy_kj_kg: h_exp_out,
                vapor_quality: Some(
                    ((h_exp_out - (h_sat_vap - 200.0)) / 200.0).clamp(0.15, 0.45),
                ),
            },
            high_pressure_alarm,
            low_pressure_alarm,
            discharge_temp_alarm,
        }
    }

    /// Obtiene la presión de saturación en bar a una temperatura dada (°C) mediante CoolProp
    fn get_sat_pressure(fluid: &str, temp_c: f64) -> Option<f64> {
        let t_k = temp_c + 273.15;
        let engine = get_engine();
        if let Ok(p_pa) = engine.props_si("P", "T", t_k, "Q", 0.0, fluid) {
            if p_pa.is_finite() && p_pa > 1000.0 {
                return Some(p_pa / 1e5);
            }
        }
        // Fallback robusto para R134a si CoolProp no estuviera cargado
        Some((10.0_f64.powf(4.25 - 1050.0 / (temp_c + 240.0))).clamp(0.5, 30.0))
    }

    /// Obtiene la entalpía de saturación en kJ/kg mediante CoolProp
    fn get_sat_enthalpy(fluid: &str, p_bar: f64, quality: f64) -> Option<f64> {
        let p_pa = p_bar * 1e5;
        let engine = get_engine();
        if let Ok(h_j_kg) = engine.props_si("H", "P", p_pa, "Q", quality, fluid) {
            if h_j_kg.is_finite() {
                return Some(h_j_kg / 1000.0);
            }
        }
        if quality > 0.5 {
            Some(400.0)
        } else {
            Some(250.0)
        }
    }

    /// Obtiene la densidad del vapor sobrecalentado mediante CoolProp
    fn get_density(fluid: &str, p_bar: f64, temp_c: f64) -> Option<f64> {
        let p_pa = p_bar * 1e5;
        let t_k = temp_c + 273.15;
        let engine = get_engine();
        if let Ok(d) = engine.props_si("D", "P", p_pa, "T", t_k, fluid) {
            if d.is_finite() && d > 0.1 {
                return Some(d);
            }
        }
        // Gas ideal aproximado
        let r_spec = 81.49; // J/(kg*K) para R134a
        Some(p_pa / (r_spec * t_k))
    }
}
