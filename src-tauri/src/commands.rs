use crate::logger::get_current_log_path;
use crate::thermo::catalog::{get_refrigerant_catalog, CatalogResponse};
use crate::thermo::curves::{generate_diagram_curves, CurvePoint, DiagramCurvesResponse};
use crate::thermo::engine::{get_engine, EngineInfo};
use crate::thermo::{calculate_state, get_fluid_info, FluidInfo, ThermodynamicState};
use serde::{Deserialize, Serialize};

#[tauri::command]
pub fn get_log_path_cmd() -> String {
    get_current_log_path()
}

#[tauri::command]
pub fn get_engine_info_cmd() -> EngineInfo {
    get_engine().get_engine_info()
}

#[tauri::command]
pub fn log_client_event_cmd(level: String, message: String, details: Option<String>) {
    let det = details.map(|d| format!(" | Detalle: {}", d)).unwrap_or_default();
    match level.to_lowercase().as_str() {
        "error" => log::error!("[Frontend] {}{}", message, det),
        "warn" => log::warn!("[Frontend] {}{}", message, det),
        "debug" => log::debug!("[Frontend] {}{}", message, det),
        _ => log::info!("[Frontend] {}{}", message, det),
    }
}

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
pub async fn get_catalog() -> Result<CatalogResponse, String> {
    log::info!("Invocando 'get_catalog' en hilo asíncrono");
    tauri::async_runtime::spawn_blocking(move || {
        let cat = get_refrigerant_catalog();
        log::info!("'get_catalog' completado exitosamente ({} fluidos prioritarios)", cat.priority_items.len());
        Ok(cat)
    })
    .await
    .map_err(|e| format!("Error en hilo de ejecución de catálogo: {}", e))?
}

#[tauri::command]
pub async fn get_fluid_details(fluid_id: String) -> Result<FluidInfo, String> {
    log::info!("Invocando 'get_fluid_details' para fluido '{}'", fluid_id);
    tauri::async_runtime::spawn_blocking(move || {
        match get_fluid_info(&fluid_id) {
            Ok(info) => {
                log::info!("'get_fluid_details' OK para '{}' (Tc={:?}, Pc={:?})", fluid_id, info.t_crit_c, info.p_crit_bar);
                Ok(info)
            }
            Err(e) => {
                log::error!("'get_fluid_details' FALLÓ para '{}': {}", fluid_id, e);
                Err(e)
            }
        }
    })
    .await
    .map_err(|e| format!("Error en hilo de ejecución: {}", e))?
}

use std::collections::HashMap;
use std::fs::{create_dir_all, File};
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;
use std::sync::{OnceLock, RwLock};

static DIAGRAM_CURVES_CACHE: OnceLock<RwLock<HashMap<String, DiagramCurvesResponse>>> = OnceLock::new();

fn get_memory_cache() -> &'static RwLock<HashMap<String, DiagramCurvesResponse>> {
    DIAGRAM_CURVES_CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

fn get_curves_cache_dir() -> PathBuf {
    let mut dir = std::env::temp_dir().join("coolmollier_curves_cache_v2");
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            dir = PathBuf::from(home)
                .join("Library")
                .join("Caches")
                .join("CoolMollier")
                .join("curves_v2");
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(appdata) = std::env::var_os("LOCALAPPDATA").or_else(|| std::env::var_os("APPDATA")) {
            dir = PathBuf::from(appdata)
                .join("CoolMollier")
                .join("Cache")
                .join("curves_v2");
        }
    }
    let _ = create_dir_all(&dir);
    dir
}

fn sanitize_cache_key(fluid_id: &str) -> String {
    fluid_id
        .replace('/', "_")
        .replace('\\', "_")
        .replace(':', "_")
        .replace('*', "_")
        .replace('?', "_")
        .replace('"', "_")
        .replace('<', "_")
        .replace('>', "_")
        .replace('|', "_")
        .replace('&', "_")
}

#[tauri::command]
pub async fn get_diagram_curves_cmd(fluid_id: String) -> Result<DiagramCurvesResponse, String> {
    log::info!("Invocando 'get_diagram_curves_cmd' para fluido '{}'", fluid_id);

    // 1. Fast in-memory cache check (< 0.1 ms)
    let cache = get_memory_cache();
    if let Ok(guard) = cache.read() {
        if let Some(curves) = guard.get(&fluid_id) {
            log::info!("'get_diagram_curves_cmd' para '{}': ¡HIT en caché de memoria (0 ms)!", fluid_id);
            return Ok(curves.clone());
        }
    }

    // 2. Offload to background thread for disk cache lookup or fresh calculation
    tauri::async_runtime::spawn_blocking(move || {
        let norm_id = sanitize_cache_key(&fluid_id);
        let cache_file = get_curves_cache_dir().join(format!("{}_iir_v2.json", norm_id));

        // 2a. Check persistent disk cache
        if cache_file.exists() {
            if let Ok(file) = File::open(&cache_file) {
                let reader = BufReader::new(file);
                if let Ok(cached_curves) = serde_json::from_reader::<_, DiagramCurvesResponse>(reader) {
                    // Sanity check: discard stale R717 curves if they still use DEF reference state (h_crit > 1200)
                    let is_stale_r717 = fluid_id == "R717" && cached_curves.domain.h_crit_kj_kg > 1200.0;
                    if !is_stale_r717 {
                        log::info!("'get_diagram_curves_cmd' para '{}': ¡HIT en caché de disco v2!", fluid_id);
                        if let Ok(mut guard) = get_memory_cache().write() {
                            guard.insert(fluid_id.clone(), cached_curves.clone());
                        }
                        return Ok(cached_curves);
                    }
                }
            }
        }

        // 2b. Compute from thermodynamic engine
        let start = std::time::Instant::now();
        match generate_diagram_curves(&fluid_id) {
            Ok(curves) => {
                log::info!(
                    "'get_diagram_curves_cmd' calculado para '{}' en {:?} (isotermas: {}, isentrópicas: {}, isocoras: {})",
                    fluid_id,
                    start.elapsed(),
                    curves.isotherms.len(),
                    curves.isentropics.len(),
                    curves.isochores.len()
                );
                // Save to memory cache
                if let Ok(mut guard) = get_memory_cache().write() {
                    guard.insert(fluid_id.clone(), curves.clone());
                }
                // Save to persistent disk cache
                if let Ok(file) = File::create(&cache_file) {
                    let writer = BufWriter::new(file);
                    let _ = serde_json::to_writer(writer, &curves);
                }
                Ok(curves)
            }
            Err(e) => {
                log::error!("'get_diagram_curves_cmd' FALLÓ para '{}': {}", fluid_id, e);
                Err(e)
            }
        }
    })
    .await
    .map_err(|e| format!("Error en hilo de cálculo de curvas: {}", e))?
}

#[tauri::command]
pub async fn calculate_point_cmd(
    fluid_id: String,
    in1_type: String,
    in1_val: f64,
    in2_type: String,
    in2_val: f64,
) -> Result<ThermodynamicState, String> {
    tauri::async_runtime::spawn_blocking(move || {
        log::debug!("Invocando calculate_point_cmd: fluido={}, {}={}, {}={}", fluid_id, in1_type, in1_val, in2_type, in2_val);
        match calculate_state(&fluid_id, &in1_type, in1_val, &in2_type, in2_val) {
            Ok(st) => Ok(st),
            Err(e) => {
                log::warn!("calculate_point_cmd error ({} {}={}, {}={}): {}", fluid_id, in1_type, in1_val, in2_type, in2_val, e);
                Err(e)
            }
        }
    })
    .await
    .map_err(|e| format!("Error en hilo de cálculo de punto: {}", e))?
}

#[tauri::command]
pub async fn calculate_process_curve_cmd(
    req: ProcessCalculationRequest,
) -> Result<ProcessCalculationResponse, String> {
    tauri::async_runtime::spawn_blocking(move || {
        calculate_process_curve_internal(req)
    })
    .await
    .map_err(|e| format!("Error en hilo de cálculo de proceso: {}", e))?
}

fn calculate_process_curve_internal(
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_diagram_curves_cache() {
        tauri::async_runtime::block_on(async {
            let fluid = "R513A".to_string();

            // Call 1: fresh calculation or load
            let start1 = std::time::Instant::now();
            let res1 = get_diagram_curves_cmd(fluid.clone()).await.expect("Call 1 failed");
            let dur1 = start1.elapsed();
            println!("Call 1 duration: {:?}", dur1);
            assert!(!res1.saturation_liquid.points.is_empty());

            // Call 2: MUST hit memory cache in < 10ms
            let start2 = std::time::Instant::now();
            let res2 = get_diagram_curves_cmd(fluid.clone()).await.expect("Call 2 failed");
            let dur2 = start2.elapsed();
            println!("Call 2 (cached) duration: {:?}", dur2);

            assert!(dur2 < std::time::Duration::from_millis(20), "Cached call took too long: {:?}", dur2);
            assert_eq!(res1.saturation_liquid.points.len(), res2.saturation_liquid.points.len());
            assert_eq!(res1.isotherms.len(), res2.isotherms.len());
        });
    }
}
