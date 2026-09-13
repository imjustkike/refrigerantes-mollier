use crate::pid_sim::model::SimChamber;

pub struct ChamberStepResult {
    pub air_temp_c: f64,
    pub product_temp_c: f64,
    pub transmission_load_kw: f64,
    pub door_load_kw: f64,
    pub internal_load_kw: f64,
    pub product_heat_transfer_kw: f64,
    pub net_cooling_absorbed_kw: f64,
}

pub struct ChamberSimulator;

impl ChamberSimulator {
    /// Ejecuta un paso temporal térmico sobre la cámara frigorífica
    pub fn step(
        chamber: &mut SimChamber,
        evaporator_cooling_kw: f64,
        dt: f64,
    ) -> ChamberStepResult {
        let dim = &chamber.dimensions;
        let area_m2 = 2.0
            * (dim.length_m * dim.width_m
                + dim.length_m * dim.height_m
                + dim.width_m * dim.height_m);
        let volume_m3 = dim.length_m * dim.width_m * dim.height_m;

        // Capacidad calorífica del aire de la cámara (C = m * cp) en kJ/K
        let air_density_kg_m3 = 1.25;
        let air_mass_kg = volume_m3 * air_density_kg_m3;
        let air_cp_kj_kg_k = 1.005;
        let c_air_kj_k = (air_mass_kg * air_cp_kj_kg_k).max(5.0);

        // 1. Transmisión térmica por paredes y techo (Q = U * A * DeltaT) en kW
        let delta_t_ext = chamber.ambient_temp_ext_c - chamber.current_air_temp_c;
        let transmission_load_kw = (chamber.u_value_w_m2_k * area_m2 * delta_t_ext) / 1000.0;

        // 2. Infiltración por apertura de puerta
        let door_load_kw = if chamber.is_door_open {
            // Caudal de renovación aprox por convección natural con puerta abierta
            let ach_door = 8.0; // renovaciones / hora
            let flow_m3_s = (volume_m3 * ach_door) / 3600.0;
            (flow_m3_s * air_density_kg_m3 * air_cp_kj_kg_k * delta_t_ext).max(0.0)
        } else {
            0.0
        };

        // 3. Cargas internas (iluminación, personas, ventiladores del evaporador)
        let lights_kw = chamber.internal_lights_w / 1000.0;
        let people_kw = (chamber.occupancy_people as f64) * 0.13; // 130W / persona
        let fans_heat_kw = if !chamber.is_defrost_active && evaporator_cooling_kw > 0.05 {
            0.35 // 350W disipación de ventiladores en frío
        } else {
            0.0
        };
        let internal_load_kw = lights_kw + people_kw + fans_heat_kw;

        // 4. Intercambio térmico con el producto almacenado (inercia térmica)
        // Coeficiente global de transferencia superficial producto-aire (W/K)
        let ua_prod_kw_k = (chamber.product_mass_kg * 0.0015).clamp(0.05, 15.0);
        let delta_t_prod = chamber.product_temp_c - chamber.current_air_temp_c;
        let product_heat_transfer_kw = ua_prod_kw_k * delta_t_prod; // Positivo si el producto cede calor al aire

        // 5. Enfriamiento o desescarche
        let (net_cooling_absorbed_kw, defrost_spill_kw) = if chamber.is_defrost_active {
            // En desescarche las resistencias calientan el evaporador, no hay frío útil
            let spill = chamber.defrost_heater_power_kw * 0.15; // 15% calor fugado al aire
            (0.0, spill)
        } else {
            (evaporator_cooling_kw, 0.0)
        };

        // 6. Balance de energía del aire: C_air * d(T_air)/dt = Sum(Q)
        let q_net_air_kw = transmission_load_kw
            + door_load_kw
            + internal_load_kw
            + product_heat_transfer_kw
            + defrost_spill_kw
            - net_cooling_absorbed_kw;

        // Integración numérica explícita para T_air
        let d_t_air = (q_net_air_kw / c_air_kj_k) * dt;
        chamber.current_air_temp_c += d_t_air;

        // 7. Balance de energía del producto: M_prod * cp_prod * d(T_prod)/dt = -Q_prod
        let c_prod_kj_k =
            (chamber.product_mass_kg * chamber.product_cp_kj_kg_k).max(10.0);
        let d_t_prod = (-product_heat_transfer_kw / c_prod_kj_k) * dt;
        chamber.product_temp_c += d_t_prod;

        ChamberStepResult {
            air_temp_c: chamber.current_air_temp_c,
            product_temp_c: chamber.product_temp_c,
            transmission_load_kw,
            door_load_kw,
            internal_load_kw,
            product_heat_transfer_kw,
            net_cooling_absorbed_kw,
        }
    }
}
