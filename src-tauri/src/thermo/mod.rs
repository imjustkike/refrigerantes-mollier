pub mod catalog;
pub mod curves;

use coolprop_sys::COOLPROP;
use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FluidInfo {
    pub id: String,
    pub name: String,
    pub chemical_formula: Option<String>,
    pub molar_mass_kg_mol: Option<f64>,
    pub t_triple_c: Option<f64>,
    pub t_crit_c: Option<f64>,
    pub p_crit_bar: Option<f64>,
    pub p_min_bar: Option<f64>,
    pub p_max_bar: Option<f64>,
    pub h_crit_kj_kg: Option<f64>,
    pub is_pure: bool,
    pub is_mixture: bool,
    pub gwp: Option<f64>,
    pub ashrae_safety: Option<String>,
    pub reference_state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThermodynamicState {
    pub fluid_id: String,
    pub pressure_bar: f64,
    pub temperature_c: f64,
    pub enthalpy_kj_kg: f64,
    pub entropy_kj_kg_k: f64,
    pub density_kg_m3: f64,
    pub specific_volume_m3_kg: f64,
    pub vapor_quality: Option<f64>, // None if subcooled or superheated
    pub phase: String,
    pub is_valid: bool,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PointInput {
    pub input1_type: String, // "P", "T", "h", "s", "Q"
    pub input1_value: f64,
    pub input2_type: String, // "P", "T", "h", "s", "Q"
    pub input2_value: f64,
}

pub fn get_coolprop_version() -> String {
    let cp = COOLPROP.shared_access();
    let name = CString::new("version").unwrap();
    let mut buffer = [0u8; 256];
    unsafe {
        cp.get_global_param_string(
            name.as_ptr(),
            buffer.as_mut_ptr() as *mut std::os::raw::c_char,
            256,
        );
        CStr::from_ptr(buffer.as_ptr() as *const std::os::raw::c_char)
            .to_string_lossy()
            .to_string()
    }
}

pub fn get_last_error() -> String {
    let cp = COOLPROP.exclusive_access();
    let err_name = CString::new("errstring").unwrap();
    let mut err_buf = [0u8; 2048];
    unsafe {
        cp.get_global_param_string(
            err_name.as_ptr(),
            err_buf.as_mut_ptr() as *mut std::os::raw::c_char,
            2048,
        );
        CStr::from_ptr(err_buf.as_ptr() as *const std::os::raw::c_char)
            .to_string_lossy()
            .to_string()
    }
}

/// Helper to call Props1SI with error recovery
pub fn props1_si(fluid: &str, prop: &str) -> Result<f64, String> {
    let fluid_c = CString::new(fluid).map_err(|e| e.to_string())?;
    let prop_c = CString::new(prop).map_err(|e| e.to_string())?;

    let cp = COOLPROP.shared_access();
    let val = unsafe { cp.Props1SI(fluid_c.as_ptr(), prop_c.as_ptr()) };
    drop(cp);

    if val.is_finite() && val > -1e30 {
        Ok(val)
    } else {
        let err = get_last_error();
        if err.is_empty() {
            Err(format!("Error evaluando {} para {}", prop, fluid))
        } else {
            Err(err)
        }
    }
}

/// Helper to call PropsSI with error recovery
pub fn props_si(
    out_prop: &str,
    in1_name: &str,
    in1_val: f64,
    in2_name: &str,
    in2_val: f64,
    fluid: &str,
) -> Result<f64, String> {
    let out_c = CString::new(out_prop).map_err(|e| e.to_string())?;
    let in1_c = CString::new(in1_name).map_err(|e| e.to_string())?;
    let in2_c = CString::new(in2_name).map_err(|e| e.to_string())?;
    let fluid_c = CString::new(fluid).map_err(|e| e.to_string())?;

    let cp = COOLPROP.shared_access();
    let val = unsafe {
        cp.PropsSI(
            out_c.as_ptr(),
            in1_c.as_ptr(),
            in1_val,
            in2_c.as_ptr(),
            in2_val,
            fluid_c.as_ptr(),
        )
    };
    drop(cp);

    if val.is_finite() && val > -1e30 {
        Ok(val)
    } else {
        let err = get_last_error();
        if err.is_empty() {
            Err(format!(
                "Error termodinámico evaluando {} con {}={}, {}={} para {}",
                out_prop, in1_name, in1_val, in2_name, in2_val, fluid
            ))
        } else {
            Err(err)
        }
    }
}

pub fn get_fluid_info(fluid_id: &str) -> Result<FluidInfo, String> {
    let t_crit_k = props1_si(fluid_id, "T_critical").ok();
    let p_crit_pa = props1_si(fluid_id, "p_critical").ok();
    let t_triple_k = props1_si(fluid_id, "T_triple").or_else(|_| props1_si(fluid_id, "T_min")).ok();
    let p_min_pa = props1_si(fluid_id, "p_min").or_else(|_| props1_si(fluid_id, "ptriple")).ok();
    let p_max_pa = props1_si(fluid_id, "p_max").ok();
    let molar_mass = props1_si(fluid_id, "molar_mass").ok();

    let h_crit_kj_kg = match (p_crit_pa, t_crit_k) {
        (Some(p), Some(_t)) => props_si("H", "P", p * 0.9999, "Q", 1.0, fluid_id)
            .map(|h| h / 1000.0)
            .ok(),
        _ => None,
    };

    let is_mixture = fluid_id.contains(".mix") || fluid_id.contains('&');

    Ok(FluidInfo {
        id: fluid_id.to_string(),
        name: fluid_id.to_string(),
        chemical_formula: None,
        molar_mass_kg_mol: molar_mass,
        t_triple_c: t_triple_k.map(|t| t - 273.15),
        t_crit_c: t_crit_k.map(|t| t - 273.15),
        p_crit_bar: p_crit_pa.map(|p| p / 1e5),
        p_min_bar: p_min_pa.map(|p| (p / 1e5).max(0.01)),
        p_max_bar: p_max_pa.map(|p| p / 1e5),
        h_crit_kj_kg,
        is_pure: !is_mixture,
        is_mixture,
        gwp: None,
        ashrae_safety: None,
        reference_state: "IIR / DEF (según configuración del motor CoolProp)".to_string(),
    })
}

/// Resolves complete thermodynamic state for any 2 input parameters with engineering conversions
pub fn calculate_state(
    fluid_id: &str,
    in1_type: &str,
    in1_val: f64,
    in2_type: &str,
    in2_val: f64,
) -> Result<ThermodynamicState, String> {
    // Standardize input variable symbols and convert user units to SI
    let (coolprop_in1, si_val1) = to_si_input(in1_type, in1_val)?;
    let (coolprop_in2, si_val2) = to_si_input(in2_type, in2_val)?;

    if coolprop_in1 == coolprop_in2 {
        return Err("Las dos variables de entrada deben ser distintas e independientes.".to_string());
    }

    // Check pure fluid P-T ambiguity in two-phase region
    let is_mixture = fluid_id.contains(".mix") || fluid_id.contains('&');
    if (coolprop_in1 == "P" && coolprop_in2 == "T") || (coolprop_in1 == "T" && coolprop_in2 == "P") {
        let p_si = if coolprop_in1 == "P" { si_val1 } else { si_val2 };
        let t_si = if coolprop_in1 == "T" { si_val1 } else { si_val2 };

        if let Ok(t_sat) = props_si("T", "P", p_si, "Q", 0.0, fluid_id) {
            // If T is within saturation range (< 0.05 K difference) and pure fluid, P and T alone are ambiguous
            if (t_sat - t_si).abs() < 0.05 && !is_mixture {
                return Err(format!(
                    "Estado indeterminado: A P = {:.3} bar, la temperatura de saturación es {:.2} °C. Para un fluido puro en saturación, P y T están ligadas; se requiere especificar el título de vapor (Q) o la entalpía (h) para fijar el estado.",
                    p_si / 1e5,
                    t_sat - 273.15
                ));
            }
        }
    }

    // Calculate all key properties in SI
    let p_pa = if coolprop_in1 == "P" {
        si_val1
    } else if coolprop_in2 == "P" {
        si_val2
    } else {
        props_si("P", &coolprop_in1, si_val1, &coolprop_in2, si_val2, fluid_id)?
    };

    let t_k = if coolprop_in1 == "T" {
        si_val1
    } else if coolprop_in2 == "T" {
        si_val2
    } else {
        props_si("T", &coolprop_in1, si_val1, &coolprop_in2, si_val2, fluid_id)?
    };

    let h_j_kg = if coolprop_in1 == "H" {
        si_val1
    } else if coolprop_in2 == "H" {
        si_val2
    } else {
        props_si("H", &coolprop_in1, si_val1, &coolprop_in2, si_val2, fluid_id)?
    };

    let s_j_kg_k = if coolprop_in1 == "S" {
        si_val1
    } else if coolprop_in2 == "S" {
        si_val2
    } else {
        props_si("S", &coolprop_in1, si_val1, &coolprop_in2, si_val2, fluid_id)
            .unwrap_or(0.0)
    };

    let d_kg_m3 = if coolprop_in1 == "D" {
        si_val1
    } else if coolprop_in2 == "D" {
        si_val2
    } else {
        props_si("D", &coolprop_in1, si_val1, &coolprop_in2, si_val2, fluid_id)?
    };

    let q_val = if coolprop_in1 == "Q" {
        Some(si_val1)
    } else if coolprop_in2 == "Q" {
        Some(si_val2)
    } else {
        match props_si("Q", &coolprop_in1, si_val1, &coolprop_in2, si_val2, fluid_id) {
            Ok(q) if (0.0..=1.0).contains(&q) => Some(q),
            _ => None,
        }
    };

    // Determine thermodynamic phase
    let t_crit = props1_si(fluid_id, "T_critical").unwrap_or(1e6);
    let p_crit = props1_si(fluid_id, "p_critical").unwrap_or(1e9);

    let phase = if p_pa >= p_crit && t_k >= t_crit {
        "Supercrítico".to_string()
    } else if p_pa >= p_crit {
        "Líquido supercrítico / Alta presión".to_string()
    } else if t_k >= t_crit {
        "Gas supercrítico".to_string()
    } else if let Some(q) = q_val {
        if (q - 0.0).abs() < 1e-4 {
            "Líquido saturado (Q=0)".to_string()
        } else if (q - 1.0).abs() < 1e-4 {
            "Vapor saturado seco (Q=1)".to_string()
        } else {
            format!("Bifásico (líquido + vapor, x = {:.1}%)", q * 100.0)
        }
    } else {
        // Monophasic: check if subcooled or superheated relative to saturation at P
        match props_si("T", "P", p_pa, "Q", 0.0, fluid_id) {
            Ok(t_sat) => {
                if t_k < t_sat - 0.05 {
                    "Líquido subenfriado".to_string()
                } else {
                    "Vapor sobrecalentado".to_string()
                }
            }
            Err(_) => "Monofásico".to_string(),
        }
    };

    let specific_volume = if d_kg_m3 > 0.0 { 1.0 / d_kg_m3 } else { 0.0 };

    Ok(ThermodynamicState {
        fluid_id: fluid_id.to_string(),
        pressure_bar: p_pa / 1e5,
        temperature_c: t_k - 273.15,
        enthalpy_kj_kg: h_j_kg / 1000.0,
        entropy_kj_kg_k: s_j_kg_k / 1000.0,
        density_kg_m3: d_kg_m3,
        specific_volume_m3_kg: specific_volume,
        vapor_quality: q_val,
        phase,
        is_valid: true,
        warning: None,
    })
}

fn to_si_input(input_type: &str, val: f64) -> Result<(String, f64), String> {
    match input_type.to_uppercase().as_str() {
        "P" | "PRESSURE" | "PRESION" | "BAR" => {
            if val <= 0.0 {
                return Err("La presión absoluta debe ser estrictamente positiva (> 0 bar).".to_string());
            }
            Ok(("P".to_string(), val * 1e5)) // bar -> Pa
        }
        "T" | "TEMP" | "TEMPERATURE" | "TEMPERATURA" | "C" | "°C" => {
            let k = val + 273.15;
            if k <= 0.0 {
                return Err("La temperatura absoluta no puede ser inferior al cero absoluto (-273.15 °C).".to_string());
            }
            Ok(("T".to_string(), k)) // °C -> K
        }
        "H" | "ENTHALPY" | "ENTALPIA" | "KJ/KG" => {
            Ok(("H".to_string(), val * 1000.0)) // kJ/kg -> J/kg
        }
        "S" | "ENTROPY" | "ENTROPIA" | "KJ/KG.K" | "KJ/(KG.K)" => {
            Ok(("S".to_string(), val * 1000.0)) // kJ/(kg*K) -> J/(kg*K)
        }
        "Q" | "QUALITY" | "TITULO" | "X" => {
            if !(0.0..=1.0).contains(&val) {
                return Err("El título de vapor (Q) debe estar comprendido entre 0.0 (líquido saturado) y 1.0 (vapor saturado).".to_string());
            }
            Ok(("Q".to_string(), val))
        }
        "D" | "DENSITY" | "DENSIDAD" | "KG/M3" => {
            if val <= 0.0 {
                return Err("La densidad debe ser positiva (> 0 kg/m³).".to_string());
            }
            Ok(("D".to_string(), val))
        }
        "V" | "SPECIFIC_VOLUME" | "VOLUMEN" | "M3/KG" => {
            if val <= 0.0 {
                return Err("El volumen específico debe ser positivo (> 0 m³/kg).".to_string());
            }
            Ok(("D".to_string(), 1.0 / val)) // v -> density = 1/v
        }
        other => Err(format!("Tipo de variable de entrada no reconocido: '{}'. Use P, T, h, s, Q o v.", other)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coolprop_version() {
        let v = get_coolprop_version();
        assert!(!v.is_empty(), "CoolProp version should be non-empty");
        println!("CoolProp version: {}", v);
    }

    #[test]
    fn test_r134a_properties_and_inverse_volume() {
        // R134a at P = 2.0 bar (200 kPa), T = 20 °C (superheated vapor)
        let state = calculate_state("R134a", "P", 2.0, "T", 20.0).expect("R134a calculation failed");
        assert!((state.pressure_bar - 2.0).abs() < 1e-4);
        assert!((state.temperature_c - 20.0).abs() < 1e-4);
        assert!(state.enthalpy_kj_kg > 400.0 && state.enthalpy_kj_kg < 450.0);
        assert!(state.density_kg_m3 > 0.0);
        // Verify v = 1 / rho
        assert!((state.specific_volume_m3_kg - (1.0 / state.density_kg_m3)).abs() < 1e-9);
        assert_eq!(state.phase, "Vapor sobrecalentado");
    }

    #[test]
    fn test_r134a_saturation_and_two_phase() {
        // R134a at P = 4.0 bar, Q = 0.5 (two-phase mixture)
        let state = calculate_state("R134a", "P", 4.0, "Q", 0.5).expect("Two phase calculation failed");
        assert_eq!(state.vapor_quality, Some(0.5));
        assert!(state.phase.contains("Bifásico"));
        // At 4 bar, R134a boiling temp is ~8.9 °C
        assert!((state.temperature_c - 8.9).abs() < 1.0);
    }

    #[test]
    fn test_r744_co2_supercritical() {
        // CO2 (R744) at P = 90.0 bar (above Pcrit ~73.8 bar), T = 45 °C (above Tcrit ~30.98 °C)
        let state = calculate_state("R744", "P", 90.0, "T", 45.0).expect("CO2 supercritical calculation failed");
        assert_eq!(state.phase, "Supercrítico");
        assert!(state.specific_volume_m3_kg > 0.0);
        assert!((state.specific_volume_m3_kg * state.density_kg_m3 - 1.0).abs() < 1e-9);
    }

    #[test]
    fn test_zeotropic_mixture_r407c() {
        // R407C at P = 5.0 bar, Q = 0.0 vs Q = 1.0 (glide)
        let bubble = calculate_state("R407C", "P", 5.0, "Q", 0.0).expect("R407C bubble failed");
        let dew = calculate_state("R407C", "P", 5.0, "Q", 1.0).expect("R407C dew failed");
        // For zeotrope R407C, dew temperature is strictly higher than bubble temperature at same pressure
        assert!(dew.temperature_c > bubble.temperature_c, "Dew temperature ({}) should be > bubble temperature ({}) for R407C glide", dew.temperature_c, bubble.temperature_c);
    }

    #[test]
    fn test_invalid_and_ambiguous_inputs() {
        // Same inputs
        let err_same = calculate_state("R134a", "P", 2.0, "P", 3.0);
        assert!(err_same.is_err());

        // Pure fluid saturated P and T ambiguity
        let t_sat_2bar = props_si("T", "P", 200000.0, "Q", 0.0, "R134a").unwrap() - 273.15;
        let err_ambig = calculate_state("R134a", "P", 2.0, "T", t_sat_2bar);
        assert!(err_ambig.is_err(), "Pure fluid P-T at saturation should return ambiguous error");
        assert!(err_ambig.unwrap_err().contains("indeterminado"));
    }
}
