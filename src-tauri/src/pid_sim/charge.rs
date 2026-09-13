use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChargeCondition {
    SevereUndercharge,
    SlightUndercharge,
    Normal,
    SlightOvercharge,
    SevereOvercharge,
}

pub struct ChargeDistribution {
    pub total_mass_kg: f64,
    pub receiver_liquid_fraction: f64, // 0.0 a 1.0
    pub condenser_flooded_fraction: f64, // 0.0 a 1.0 (en sobrecarga)
    pub condition: ChargeCondition,
    pub condition_description: String,
    pub has_bubbles_in_sight_glass: bool,
    pub subcooling_factor: f64,      // multiplicador sobre SC nominal
    pub superheat_adder_k: f64,      // sobrecalentamiento extra por falta de llenado
    pub expansion_flow_penalty: f64, // penalización de caudal por vapor en la válvula
    pub condenser_ua_factor: f64,    // reducción de intercambio en condensador por inundación
}

pub struct ChargeSimulator;

impl ChargeSimulator {
    /// Calcula la distribución física de masa en el circuito
    pub fn evaluate(
        nominal_charge_kg: f64,
        current_charge_kg: f64,
        receiver_volume_l: f64,
        condenser_volume_l: f64,
        liquid_density_kg_m3: f64, // aprox. 1200 kg/m³ para refrigerantes HFC/HFO
    ) -> ChargeDistribution {
        let nom = nominal_charge_kg.max(0.5);
        let cur = current_charge_kg.max(0.05);
        let charge_ratio = cur / nom;

        // Capacidad de almacenamiento del recipiente en kg
        let _receiver_cap_kg = (receiver_volume_l / 1000.0) * liquid_density_kg_m3 * 0.85;
        let _condenser_cap_kg = (condenser_volume_l / 1000.0) * liquid_density_kg_m3 * 0.40;

        let (condition, condition_description, receiver_liquid_fraction, condenser_flooded_fraction, has_bubbles_in_sight_glass, subcooling_factor, superheat_adder_k, expansion_flow_penalty, condenser_ua_factor) =
            if charge_ratio < 0.70 {
                // Falta de refrigerante severa
                (
                    ChargeCondition::SevereUndercharge,
                    "Falta severa de refrigerante: recipiente vacío, burbujas continuas en visor y evaporador subalimentado".to_string(),
                    0.0,
                    0.0,
                    true,
                    0.05, // Prácticamente 0 K de subenfriamiento
                    18.0, // Gran sobrecalentamiento
                    0.45, // Caudal estrangulado por mezcla bifásica en TXV
                    1.0,
                )
            } else if charge_ratio < 0.90 {
                // Falta leve de refrigerante
                let frac = (charge_ratio - 0.70) / 0.20;
                (
                    ChargeCondition::SlightUndercharge,
                    "Falta leve de refrigerante: bajo nivel en recipiente, ráfagas de burbujas y recalentamiento elevado".to_string(),
                    frac * 0.15,
                    0.0,
                    frac < 0.5,
                    0.2 + 0.6 * frac,
                    8.0 * (1.0 - frac),
                    0.75 + 0.20 * frac,
                    1.0,
                )
            } else if charge_ratio <= 1.10 {
                // Carga normal óptima
                let frac = (charge_ratio - 0.90) / 0.20;
                (
                    ChargeCondition::Normal,
                    "Carga correcta: sello de líquido estable en recipiente y visor lleno".to_string(),
                    0.20 + 0.55 * frac,
                    0.0,
                    false,
                    1.0,
                    0.0,
                    1.0,
                    1.0,
                )
            } else if charge_ratio <= 1.25 {
                // Sobrecarga moderada
                let frac = (charge_ratio - 1.10) / 0.15;
                (
                    ChargeCondition::SlightOvercharge,
                    "Sobrecarga moderada: recipiente lleno, aumento de subenfriamiento y ligera subida de presión de descarga".to_string(),
                    1.0,
                    frac * 0.20,
                    false,
                    1.4 + 0.6 * frac,
                    0.0,
                    1.0,
                    1.0 - 0.15 * frac,
                )
            } else {
                // Sobrecarga severa
                let frac = ((charge_ratio - 1.25) / 0.35).min(1.0);
                (
                    ChargeCondition::SevereOvercharge,
                    "Sobrecarga severa: tubos de condensador inundados de líquido, presión de condensación crítica y riesgo inminente de disparo por alta presión".to_string(),
                    1.0,
                    0.20 + 0.60 * frac,
                    false,
                    2.2 + 1.2 * frac,
                    0.0,
                    1.0,
                    (0.85 - 0.45 * frac).max(0.35),
                )
            };

        ChargeDistribution {
            total_mass_kg: cur,
            receiver_liquid_fraction,
            condenser_flooded_fraction,
            condition,
            condition_description,
            has_bubbles_in_sight_glass,
            subcooling_factor,
            superheat_adder_k,
            expansion_flow_penalty,
            condenser_ua_factor,
        }
    }

    /// Actualiza la fuga de refrigerante en kg/s
    pub fn update_leak(current_charge_kg: &mut f64, leak_rate_kg_h: f64, dt: f64) -> f64 {
        if leak_rate_kg_h <= 0.0 || *current_charge_kg <= 0.05 {
            return 0.0;
        }
        let lost_kg = (leak_rate_kg_h / 3600.0) * dt;
        let actual_lost = lost_kg.min(*current_charge_kg - 0.05);
        *current_charge_kg -= actual_lost;
        actual_lost
    }
}
