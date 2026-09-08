use crate::thermo::catalog::{get_refrigerant_catalog, CatalogResponse};
use crate::thermo::curves::{generate_diagram_curves, CurvePoint, DiagramCurvesResponse};
use crate::thermo::{calculate_state, get_fluid_info, FluidInfo, ThermodynamicState};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessCalculationRequest {
    pub fluid_id: String,
    pub p1_h: f64,
    pub p1_p: f64,
    pub p2_h: f64,
    pub p2_p: f64,
    pub process_type: String, // "direct_line", "isobaric", "isenthalpic", "isothermal", "isentropic"
    pub steps: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessCalculationResponse {
    pub process_type: String,
    pub delta_h_kj_kg: f64,
    pub delta_t_c: f64,
    pub delta_p_bar: f64,
    pub delta_s_kj_kg_k: f64,
    pub intermediate_points: Vec<CurvePoint>,
}

#[tauri::command]
pub fn get_catalog() -> Result<CatalogResponse, String> {
    Ok(get_refrigerant_catalog())
}

#[tauri::command]
pub fn get_fluid_details(fluid_id: String) -> Result<FluidInfo, String> {
    get_fluid_info(&fluid_id)
}

#[tauri::command]
pub fn get_diagram_curves_cmd(fluid_id: String) -> Result<DiagramCurvesResponse, String> {
    generate_diagram_curves(&fluid_id)
}

#[tauri::command]
pub fn calculate_point_cmd(
    fluid_id: String,
    in1_type: String,
    in1_val: f64,
    in2_type: String,
    in2_val: f64,
) -> Result<ThermodynamicState, String> {
    calculate_state(&fluid_id, &in1_type, in1_val, &in2_type, in2_val)
}

#[tauri::command]
pub fn calculate_process_curve_cmd(
    req: ProcessCalculationRequest,
) -> Result<ProcessCalculationResponse, String> {
    let s1 = calculate_state(&req.fluid_id, "H", req.p1_h, "P", req.p1_p)?;
    let s2 = calculate_state(&req.fluid_id, "H", req.p2_h, "P", req.p2_p)?;

    let delta_h_kj_kg = s2.enthalpy_kj_kg - s1.enthalpy_kj_kg;
    let delta_t_c = s2.temperature_c - s1.temperature_c;
    let delta_p_bar = s2.pressure_bar - s1.pressure_bar;
    let delta_s_kj_kg_k = s2.entropy_kj_kg_k - s1.entropy_kj_kg_k;

    let steps = req.steps.unwrap_or(20).max(5);
    let mut intermediate_points = Vec::with_capacity(steps + 1);

    match req.process_type.as_str() {
        "isobaric" => {
            // Constant pressure (P = P1) from h1 to h2
            let p_bar = req.p1_p;
            for i in 0..=steps {
                let frac = i as f64 / steps as f64;
                let h = req.p1_h + (req.p2_h - req.p1_h) * frac;
                if let Ok(st) = calculate_state(&req.fluid_id, "H", h, "P", p_bar) {
                    intermediate_points.push(CurvePoint {
                        h_kj_kg: st.enthalpy_kj_kg,
                        p_bar: st.pressure_bar,
                        t_c: Some(st.temperature_c),
                        s_kj_kg_k: Some(st.entropy_kj_kg_k),
                        v_m3_kg: Some(st.specific_volume_m3_kg),
                        q: st.vapor_quality,
                    });
                }
            }
        }
        "isenthalpic" => {
            // Constant enthalpy (h = h1) from P1 to P2
            let h = req.p1_h;
            let log_p1 = req.p1_p.ln();
            let log_p2 = req.p2_p.ln();
            for i in 0..=steps {
                let frac = i as f64 / steps as f64;
                let p_bar = (log_p1 + (log_p2 - log_p1) * frac).exp();
                if let Ok(st) = calculate_state(&req.fluid_id, "H", h, "P", p_bar) {
                    intermediate_points.push(CurvePoint {
                        h_kj_kg: st.enthalpy_kj_kg,
                        p_bar: st.pressure_bar,
                        t_c: Some(st.temperature_c),
                        s_kj_kg_k: Some(st.entropy_kj_kg_k),
                        v_m3_kg: Some(st.specific_volume_m3_kg),
                        q: st.vapor_quality,
                    });
                }
            }
        }
        "isothermal" => {
            // Constant temperature (T = T1) from P1 to P2
            let t_c = s1.temperature_c;
            let log_p1 = req.p1_p.ln();
            let log_p2 = req.p2_p.ln();
            for i in 0..=steps {
                let frac = i as f64 / steps as f64;
                let p_bar = (log_p1 + (log_p2 - log_p1) * frac).exp();
                if let Ok(st) = calculate_state(&req.fluid_id, "T", t_c, "P", p_bar) {
                    intermediate_points.push(CurvePoint {
                        h_kj_kg: st.enthalpy_kj_kg,
                        p_bar: st.pressure_bar,
                        t_c: Some(st.temperature_c),
                        s_kj_kg_k: Some(st.entropy_kj_kg_k),
                        v_m3_kg: Some(st.specific_volume_m3_kg),
                        q: st.vapor_quality,
                    });
                }
            }
        }
        "isentropic" => {
            // Constant entropy (s = s1) from P1 to P2
            let s_kj = s1.entropy_kj_kg_k;
            let log_p1 = req.p1_p.ln();
            let log_p2 = req.p2_p.ln();
            for i in 0..=steps {
                let frac = i as f64 / steps as f64;
                let p_bar = (log_p1 + (log_p2 - log_p1) * frac).exp();
                if let Ok(st) = calculate_state(&req.fluid_id, "S", s_kj, "P", p_bar) {
                    intermediate_points.push(CurvePoint {
                        h_kj_kg: st.enthalpy_kj_kg,
                        p_bar: st.pressure_bar,
                        t_c: Some(st.temperature_c),
                        s_kj_kg_k: Some(st.entropy_kj_kg_k),
                        v_m3_kg: Some(st.specific_volume_m3_kg),
                        q: st.vapor_quality,
                    });
                }
            }
        }
        _ => {
            // Direct geometric connection
            intermediate_points.push(CurvePoint {
                h_kj_kg: s1.enthalpy_kj_kg,
                p_bar: s1.pressure_bar,
                t_c: Some(s1.temperature_c),
                s_kj_kg_k: Some(s1.entropy_kj_kg_k),
                v_m3_kg: Some(s1.specific_volume_m3_kg),
                q: s1.vapor_quality,
            });
            intermediate_points.push(CurvePoint {
                h_kj_kg: s2.enthalpy_kj_kg,
                p_bar: s2.pressure_bar,
                t_c: Some(s2.temperature_c),
                s_kj_kg_k: Some(s2.entropy_kj_kg_k),
                v_m3_kg: Some(s2.specific_volume_m3_kg),
                q: s2.vapor_quality,
            });
        }
    }

    Ok(ProcessCalculationResponse {
        process_type: req.process_type,
        delta_h_kj_kg,
        delta_t_c,
        delta_p_bar,
        delta_s_kj_kg_k,
        intermediate_points,
    })
}
