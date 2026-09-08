use crate::thermo::{props1_si, props_si};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurvePoint {
    pub h_kj_kg: f64,
    pub p_bar: f64,
    pub t_c: Option<f64>,
    pub s_kj_kg_k: Option<f64>,
    pub v_m3_kg: Option<f64>,
    pub q: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurveSeries {
    pub id: String,
    pub name: String,
    pub curve_type: String, // "saturation_liquid", "saturation_vapor", "isotherm", "isobar", "isentropic", "isochore", "quality"
    pub parameter_value: f64, // e.g. T in C, s in kJ/kgK, v in m3/kg, Q
    pub parameter_unit: String,
    pub points: Vec<CurvePoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagramDomain {
    pub p_min_bar: f64,
    pub p_max_bar: f64,
    pub h_min_kj_kg: f64,
    pub h_max_kj_kg: f64,
    pub t_min_c: f64,
    pub t_crit_c: f64,
    pub p_crit_bar: f64,
    pub h_crit_kj_kg: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagramCurvesResponse {
    pub fluid_id: String,
    pub domain: DiagramDomain,
    pub saturation_liquid: CurveSeries,
    pub saturation_vapor: CurveSeries,
    pub isotherms: Vec<CurveSeries>,
    pub isentropics: Vec<CurveSeries>,
    pub isochores: Vec<CurveSeries>,
    pub quality_lines: Vec<CurveSeries>,
}

pub fn generate_diagram_curves(fluid_id: &str) -> Result<DiagramCurvesResponse, String> {
    let t_crit_k = props1_si(fluid_id, "T_critical")
        .map_err(|e| format!("No se pudo obtener T_critical para {}: {}", fluid_id, e))?;
    let p_crit_pa = props1_si(fluid_id, "p_critical")
        .map_err(|e| format!("No se pudo obtener p_critical para {}: {}", fluid_id, e))?;

    let t_triple_k = props1_si(fluid_id, "T_triple")
        .or_else(|_| props1_si(fluid_id, "T_min"))
        .unwrap_or(t_crit_k * 0.5)
        .max(120.0);

    // Practical refrigeration minimum temperature: around -60 °C or T_triple + 2K
    let t_min_k = (t_triple_k + 2.0).max(213.15).min(t_crit_k - 30.0);
    let p_min_pa = props_si("P", "T", t_min_k, "Q", 0.0, fluid_id)
        .unwrap_or(10000.0)
        .max(5000.0); // at least 0.05 bar

    let p_crit_bar = p_crit_pa / 1e5;

    // Critical point enthalpy
    let h_crit_j = props_si("H", "P", p_crit_pa * 0.9998, "Q", 1.0, fluid_id)
        .or_else(|_| props_si("H", "T", t_crit_k - 0.02, "Q", 0.5, fluid_id))
        .unwrap_or(405_000.0);
    let h_crit_kj = h_crit_j / 1000.0;

    // Saturation curve points: ultra dense resolution (160 points) with Chebyshev / Cosine clustering at critical top
    let n_sat_points = 160;
    let t_start = t_min_k;
    let t_end = t_crit_k - 0.005;

    let mut sat_liquid_pts = Vec::with_capacity(n_sat_points + 2);
    let mut sat_vapor_pts = Vec::with_capacity(n_sat_points + 2);

    for i in 0..=n_sat_points {
        let frac = (i as f64) / (n_sat_points as f64);
        // Sinusoidal distribution: starts at t_start (frac=0), ends at t_end (frac=1), dense near critical apex
        let factor = (frac * std::f64::consts::PI * 0.5).sin();
        let t = t_start + (t_end - t_start) * factor;

        // Bubble point (Q=0)
        if let (Ok(p_liq), Ok(h_liq)) = (
            props_si("P", "T", t, "Q", 0.0, fluid_id),
            props_si("H", "T", t, "Q", 0.0, fluid_id),
        ) {
            if p_liq.is_finite() && h_liq.is_finite() && p_liq <= p_crit_pa * 1.001 {
                sat_liquid_pts.push(CurvePoint {
                    h_kj_kg: h_liq / 1000.0,
                    p_bar: p_liq / 1e5,
                    t_c: Some(t - 273.15),
                    s_kj_kg_k: props_si("S", "T", t, "Q", 0.0, fluid_id).ok().map(|s| s / 1000.0),
                    v_m3_kg: props_si("D", "T", t, "Q", 0.0, fluid_id).ok().map(|d| 1.0 / d),
                    q: Some(0.0),
                });
            }
        }

        // Dew point (Q=1)
        if let (Ok(p_vap), Ok(h_vap)) = (
            props_si("P", "T", t, "Q", 1.0, fluid_id),
            props_si("H", "T", t, "Q", 1.0, fluid_id),
        ) {
            if p_vap.is_finite() && h_vap.is_finite() && p_vap <= p_crit_pa * 1.001 {
                sat_vapor_pts.push(CurvePoint {
                    h_kj_kg: h_vap / 1000.0,
                    p_bar: p_vap / 1e5,
                    t_c: Some(t - 273.15),
                    s_kj_kg_k: props_si("S", "T", t, "Q", 1.0, fluid_id).ok().map(|s| s / 1000.0),
                    v_m3_kg: props_si("D", "T", t, "Q", 1.0, fluid_id).ok().map(|d| 1.0 / d),
                    q: Some(1.0),
                });
            }
        }
    }

    // Critical point at apex
    let crit_point = CurvePoint {
        h_kj_kg: h_crit_kj,
        p_bar: p_crit_bar,
        t_c: Some(t_crit_k - 273.15),
        s_kj_kg_k: props_si("S", "P", p_crit_pa * 0.9998, "Q", 1.0, fluid_id).ok().map(|s| s / 1000.0),
        v_m3_kg: props_si("D", "P", p_crit_pa * 0.9998, "Q", 1.0, fluid_id).ok().map(|d| 1.0 / d),
        q: Some(1.0),
    };

    sat_liquid_pts.push(crit_point.clone());
    sat_vapor_pts.push(crit_point);

    // Compute bounds from saturation curves or standard chart boundaries
    let min_sat_h = sat_liquid_pts.first().map(|p| p.h_kj_kg).unwrap_or(100.0);
    let max_sat_h = sat_vapor_pts.iter().map(|p| p.h_kj_kg).fold(f64::NEG_INFINITY, f64::max);
    let h_span = (max_sat_h - min_sat_h).max(200.0);
    let h_min = (min_sat_h - h_span * 0.10).max(-150.0);
    let h_max = max_sat_h + h_span * 0.65;
    let p_min = (p_min_pa / 1e5).max(0.05);
    let p_max = (p_crit_bar * 1.10).max(10.0);
    let (h_min_kj_kg, h_max_kj_kg, p_min_bar, p_max_bar) = (h_min, h_max, p_min, p_max);

    let domain = DiagramDomain {
        p_min_bar,
        p_max_bar,
        h_min_kj_kg,
        h_max_kj_kg,
        t_min_c: t_min_k - 273.15,
        t_crit_c: t_crit_k - 273.15,
        p_crit_bar,
        h_crit_kj_kg: h_crit_kj,
    };

    // Quality lines (x = 0.1 .. 0.9) inside the dome
    let qualities = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    let quality_lines: Vec<CurveSeries> = qualities
        .into_par_iter()
        .map(|q| {
            let mut pts = Vec::with_capacity(70);
            let n_pts = 60;
            for i in 0..=n_pts {
                let frac = (i as f64) / (n_pts as f64);
                let factor = (frac * std::f64::consts::PI * 0.5).sin();
                let t = t_start + (t_end - t_start) * factor;
                if let (Ok(p), Ok(h)) = (
                    props_si("P", "T", t, "Q", q, fluid_id),
                    props_si("H", "T", t, "Q", q, fluid_id),
                ) {
                    if p.is_finite() && h.is_finite() {
                        pts.push(CurvePoint {
                            h_kj_kg: h / 1000.0,
                            p_bar: p / 1e5,
                            t_c: Some(t - 273.15),
                            s_kj_kg_k: None,
                            v_m3_kg: None,
                            q: Some(q),
                        });
                    }
                }
            }
            pts.push(CurvePoint {
                h_kj_kg: h_crit_kj,
                p_bar: p_crit_bar,
                t_c: Some(t_crit_k - 273.15),
                s_kj_kg_k: None,
                v_m3_kg: None,
                q: Some(q),
            });
            CurveSeries {
                id: format!("q_{:.1}", q),
                name: format!("x = {:.1}", q),
                curve_type: "quality".to_string(),
                parameter_value: q,
                parameter_unit: "-".to_string(),
                points: pts,
            }
        })
        .collect();

    // Isotherms (T = const) matching Danfoss chart (-60..+90 by 10°C, then +100..+240 by 20°C)
    let temps_c: Vec<f64> = if fluid_id == "R134a" {
        vec![
            -60.0, -50.0, -40.0, -30.0, -20.0, -10.0, 0.0, 10.0, 20.0, 30.0, 40.0, 50.0,
            60.0, 70.0, 80.0, 90.0, 100.0, 120.0, 140.0, 160.0, 180.0, 200.0, 220.0, 240.0,
        ]
    } else {
        let mut t_vec = Vec::new();
        let t_c_min = ((t_min_k - 273.15) / 10.0).floor() * 10.0;
        let t_c_crit = t_crit_k - 273.15;
        let t_c_max = (t_c_crit + 120.0).min(260.0);
        let mut cur_t = t_c_min;
        while cur_t <= t_c_max {
            t_vec.push(cur_t);
            if cur_t < t_c_crit - 15.0 {
                cur_t += 10.0;
            } else if cur_t < t_c_crit + 15.0 {
                cur_t += 5.0;
            } else {
                cur_t += 20.0;
            }
        }
        t_vec
    };

    let isotherms: Vec<CurveSeries> = temps_c
        .into_par_iter()
        .filter_map(|t_c| {
            let t_k = t_c + 273.15;
            let mut pts = Vec::new();

            if t_k < t_crit_k - 0.05 {
                // Subcritical isotherm: subcooled liquid -> two-phase -> superheated vapor
                let p_sat_liq = props_si("P", "T", t_k, "Q", 0.0, fluid_id).unwrap_or(1e5);
                let p_sat_vap = props_si("P", "T", t_k, "Q", 1.0, fluid_id).unwrap_or(p_sat_liq);

                // 1. Subcooled liquid: from p_max_bar down to p_sat_liq (almost vertical)
                let p_max_sub = (p_max_bar * 1e5).max(p_sat_liq * 1.05);
                let n_sub = 15;
                for i in (0..=n_sub).rev() {
                    let p = p_sat_liq + (p_max_sub - p_sat_liq) * (i as f64 / n_sub as f64);
                    if let Ok(h) = props_si("H", "T", t_k, "P", p, fluid_id) {
                        pts.push(CurvePoint {
                            h_kj_kg: h / 1000.0,
                            p_bar: p / 1e5,
                            t_c: Some(t_c),
                            s_kj_kg_k: None,
                            v_m3_kg: None,
                            q: Some(0.0),
                        });
                    }
                }

                // 2. Two-phase: bubble to dew (horizontal straight line for pure fluids, gliding for zeotropes)
                let n_two_phase = 16;
                for i in 0..=n_two_phase {
                    let q = i as f64 / n_two_phase as f64;
                    if let (Ok(p), Ok(h)) = (
                        props_si("P", "T", t_k, "Q", q, fluid_id),
                        props_si("H", "T", t_k, "Q", q, fluid_id),
                    ) {
                        pts.push(CurvePoint {
                            h_kj_kg: h / 1000.0,
                            p_bar: p / 1e5,
                            t_c: Some(t_c),
                            s_kj_kg_k: None,
                            v_m3_kg: None,
                            q: Some(q),
                        });
                    }
                }

                // 3. Superheated vapor: from p_sat_vap down to p_min_bar (continuous curve)
                let p_min_sup = (p_min_bar * 1e5).min(p_sat_vap * 0.98).max(1000.0);
                if p_sat_vap > p_min_sup {
                    let n_sup = 35;
                    for i in 1..=n_sup {
                        let frac = i as f64 / n_sup as f64;
                        let log_p = (p_sat_vap.ln()) * (1.0 - frac) + (p_min_sup.ln()) * frac;
                        let p = log_p.exp();
                        if let Ok(h) = props_si("H", "T", t_k, "P", p, fluid_id) {
                            pts.push(CurvePoint {
                                h_kj_kg: h / 1000.0,
                                p_bar: p / 1e5,
                                t_c: Some(t_c),
                                s_kj_kg_k: None,
                                v_m3_kg: None,
                                q: None,
                            });
                        }
                    }
                }
            } else {
                // Supercritical isotherm: smooth curve from p_max down to p_min
                let n_pts = 50;
                let log_p_min = (p_min_bar * 1e5).ln();
                let log_p_max = (p_max_bar * 1e5).ln();

                for i in (0..=n_pts).rev() {
                    let frac = i as f64 / n_pts as f64;
                    let p = (log_p_min + (log_p_max - log_p_min) * frac).exp();
                    if let Ok(h) = props_si("H", "T", t_k, "P", p, fluid_id) {
                        pts.push(CurvePoint {
                            h_kj_kg: h / 1000.0,
                            p_bar: p / 1e5,
                            t_c: Some(t_c),
                            s_kj_kg_k: None,
                            v_m3_kg: None,
                            q: None,
                        });
                    }
                }
            }

            if pts.len() >= 3 {
                Some(CurveSeries {
                    id: format!("t_{:.0}", t_c),
                    name: format!("T = {:.0} °C", t_c),
                    curve_type: "isotherm".to_string(),
                    parameter_value: t_c,
                    parameter_unit: "°C".to_string(),
                    points: pts,
                })
            } else {
                None
            }
        })
        .collect();

    // Isentropics (s = const) in vapor/superheated region matching Danfoss/Mollier PDF
    let s_vals: Vec<f64> = if fluid_id == "R134a" {
        vec![
            0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45, 1.55, 1.65,
            1.70, 1.75, 1.80, 1.85, 1.90, 1.95, 2.00, 2.05, 2.10, 2.15, 2.20,
            2.25, 2.30, 2.35, 2.40, 2.45, 2.50, 2.55, 2.60,
        ]
    } else {
        let mut s_vec = Vec::new();
        let mut cur_s = 1.0;
        while cur_s <= 2.6 {
            s_vec.push(cur_s);
            cur_s += 0.10;
        }
        s_vec
    };

    let isentropics: Vec<CurveSeries> = s_vals
        .into_par_iter()
        .filter_map(|s_kj| {
            let s_j = s_kj * 1000.0;
            let mut pts = Vec::new();
            let n_pts = 40;
            let log_p_min = (p_min_bar * 1e5).ln();
            let log_p_max = (p_max_bar * 1e5).ln();

            for i in 0..=n_pts {
                let frac = i as f64 / n_pts as f64;
                let p = (log_p_min + (log_p_max - log_p_min) * frac).exp();
                if let (Ok(h), Ok(t)) = (
                    props_si("H", "S", s_j, "P", p, fluid_id),
                    props_si("T", "S", s_j, "P", p, fluid_id),
                ) {
                    if h.is_finite() && t.is_finite() && t < t_crit_k + 200.0 {
                        let h_kj = h / 1000.0;
                        if h_kj >= h_min_kj_kg - 50.0 && h_kj <= h_max_kj_kg + 50.0 {
                            pts.push(CurvePoint {
                                h_kj_kg: h_kj,
                                p_bar: p / 1e5,
                                t_c: Some(t - 273.15),
                                s_kj_kg_k: Some(s_kj),
                                v_m3_kg: None,
                                q: None,
                            });
                        }
                    }
                }
            }

            if pts.len() >= 3 {
                Some(CurveSeries {
                    id: format!("s_{:.2}", s_kj),
                    name: format!("s = {:.2} kJ/(kg·K)", s_kj),
                    curve_type: "isentropic".to_string(),
                    parameter_value: s_kj,
                    parameter_unit: "kJ/(kg·K)".to_string(),
                    points: pts,
                })
            } else {
                None
            }
        })
        .collect();

    // Isochores (v = const) in vapor region matching Danfoss/Mollier PDF
    let v_vals: Vec<f64> = if fluid_id == "R134a" {
        vec![
            0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.010, 0.015, 0.020, 0.030,
            0.040, 0.050, 0.060, 0.070, 0.080, 0.090, 0.10, 0.15, 0.20, 0.30,
            0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0, 1.5, 2.0, 3.0, 4.0,
        ]
    } else {
        vec![0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0]
    };

    let isochores: Vec<CurveSeries> = v_vals
        .into_par_iter()
        .filter_map(|v_m3| {
            let density = 1.0 / v_m3;
            let mut pts = Vec::new();
            let n_pts = 80;
            let p_min_pa = p_min_bar * 1e5;
            let p_max_pa = p_max_bar * 1e5;
            let log_p_min = p_min_pa.ln();
            let log_p_max = p_max_pa.ln();

            // 1. Try to anchor starting point at the saturation vapor line (Q = 1.0)
            if let (Ok(p_sat), Ok(h_sat), Ok(t_sat)) = (
                props_si("P", "D", density, "Q", 1.0, fluid_id),
                props_si("H", "D", density, "Q", 1.0, fluid_id),
                props_si("T", "D", density, "Q", 1.0, fluid_id),
            ) {
                if p_sat.is_finite() && h_sat.is_finite() && p_sat >= p_min_pa * 0.8 && p_sat <= p_max_pa * 1.05 {
                    pts.push(CurvePoint {
                        h_kj_kg: h_sat / 1000.0,
                        p_bar: p_sat / 1e5,
                        t_c: Some(t_sat - 273.15),
                        s_kj_kg_k: None,
                        v_m3_kg: Some(v_m3),
                        q: Some(1.0),
                    });
                }
            }

            let start_log_p = if let Some(first) = pts.first() {
                (first.p_bar * 1e5).max(p_min_pa).ln()
            } else {
                log_p_min
            };

            // 2. High-resolution evaluation through superheated vapor region
            for i in 1..=n_pts {
                let frac = i as f64 / n_pts as f64;
                let p = (start_log_p + (log_p_max - start_log_p) * frac).exp();
                if let (Ok(h), Ok(t)) = (
                    props_si("H", "D", density, "P", p, fluid_id),
                    props_si("T", "D", density, "P", p, fluid_id),
                ) {
                    if h.is_finite() && t.is_finite() {
                        let h_kj = h / 1000.0;
                        pts.push(CurvePoint {
                            h_kj_kg: h_kj,
                            p_bar: p / 1e5,
                            t_c: Some(t - 273.15),
                            s_kj_kg_k: None,
                            v_m3_kg: Some(v_m3),
                            q: None,
                        });
                        if h_kj > h_max_kj_kg + 30.0 {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            // 3. If curve stopped early in superheated gas before reaching a border,
            // extrapolate smoothly with ideal gas slope to reach the right or top boundary
            if pts.len() >= 2 {
                let last = pts[pts.len() - 1].clone();
                let prev = pts[pts.len() - 2].clone();
                let dp = last.p_bar - prev.p_bar;
                let dh = last.h_kj_kg - prev.h_kj_kg;

                if dp > 1e-6 && dh > 1e-6 && last.h_kj_kg < h_max_kj_kg && last.p_bar < p_max_bar {
                    let slope = dh / dp; // kJ/kg per bar
                    let p_to_hmax = last.p_bar + (h_max_kj_kg - last.h_kj_kg) / slope;
                    let p_target = p_to_hmax.min(p_max_bar);

                    let n_extra = 10;
                    for k in 1..=n_extra {
                        let f = k as f64 / n_extra as f64;
                        let p_k = last.p_bar + (p_target - last.p_bar) * f;
                        let h_k = last.h_kj_kg + slope * (p_k - last.p_bar);
                        pts.push(CurvePoint {
                            h_kj_kg: h_k,
                            p_bar: p_k,
                            t_c: None,
                            s_kj_kg_k: None,
                            v_m3_kg: Some(v_m3),
                            q: None,
                        });
                    }
                }
            }

            if pts.len() >= 3 {
                Some(CurveSeries {
                    id: format!("v_{:.3}", v_m3),
                    name: format!("v = {:.3} m³/kg", v_m3),
                    curve_type: "isochore".to_string(),
                    parameter_value: v_m3,
                    parameter_unit: "m³/kg".to_string(),
                    points: pts,
                })
            } else {
                None
            }
        })
        .collect();

    Ok(DiagramCurvesResponse {
        fluid_id: fluid_id.to_string(),
        domain,
        saturation_liquid: CurveSeries {
            id: "sat_liquid".to_string(),
            name: "Líquido saturado (Q=0)".to_string(),
            curve_type: "saturation_liquid".to_string(),
            parameter_value: 0.0,
            parameter_unit: "-".to_string(),
            points: sat_liquid_pts,
        },
        saturation_vapor: CurveSeries {
            id: "sat_vapor".to_string(),
            name: "Vapor saturado seco (Q=1)".to_string(),
            curve_type: "saturation_vapor".to_string(),
            parameter_value: 1.0,
            parameter_unit: "-".to_string(),
            points: sat_vapor_pts,
        },
        isotherms,
        isentropics,
        isochores,
        quality_lines,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_curves_r134a() {
        let res = generate_diagram_curves("R134a").expect("R134a curves failed");
        println!("Domain: {:?}", res.domain);
        println!("Sat liquid points: {}", res.saturation_liquid.points.len());
        println!("Sat vapor points: {}", res.saturation_vapor.points.len());
        println!("Isotherms count: {}", res.isotherms.len());
        println!("Isentropics count: {}", res.isentropics.len());
        println!("Isochores count: {}", res.isochores.len());
        println!("Quality lines: {}", res.quality_lines.len());

        let first_liq = &res.saturation_liquid.points[0];
        let last_liq = res.saturation_liquid.points.last().unwrap();
        println!("First liq: h={}, P={}", first_liq.h_kj_kg, first_liq.p_bar);
        println!("Last liq (crit): h={}, P={}", last_liq.h_kj_kg, last_liq.p_bar);

        let first_vap = &res.saturation_vapor.points[0];
        let last_vap = res.saturation_vapor.points.last().unwrap();
        println!("First vap: h={}, P={}", first_vap.h_kj_kg, first_vap.p_bar);
        println!("Last vap (crit): h={}, P={}", last_vap.h_kj_kg, last_vap.p_bar);
    }

    #[test]
    fn test_audit_r134a() {
        let fluid = "R134a";
        let temps = [-40.0, -20.0, 0.0, 20.0, 40.0, 60.0, 70.0, 80.0, 90.0, 95.0, 98.0, 100.0, 101.0, 101.06];

        println!("\n=== TABLA DE SATURACIÓN COOLPROP DIRECTA PARA R-134a ===");
        println!("{:<10} | {:<12} | {:<15} | {:<15} | {:<12}", "T [°C]", "P_sat [bar]", "h_L [kJ/kg]", "h_V [kJ/kg]", "Δh_vap [kJ/kg]");
        println!("{:-<75}", "");

        for &t_c in &temps {
            let t_k = t_c + 273.15;
            let p_liq = props_si("P", "T", t_k, "Q", 0.0, fluid);
            let h_liq = props_si("H", "T", t_k, "Q", 0.0, fluid);
            let h_vap = props_si("H", "T", t_k, "Q", 1.0, fluid);

            match (p_liq, h_liq, h_vap) {
                (Ok(p), Ok(hl), Ok(hv)) => {
                    let p_bar = p / 1e5;
                    let hl_kj = hl / 1000.0;
                    let hv_kj = hv / 1000.0;
                    let dh_kj = hv_kj - hl_kj;
                    println!("{:<10.2} | {:<12.4} | {:<15.3} | {:<15.3} | {:<12.3}", t_c, p_bar, hl_kj, hv_kj, dh_kj);
                }
                _ => {
                    println!("{:<10.2} | ERROR DE EVALUACIÓN EN COOLPROP", t_c);
                }
            }
        }

        // Critical Point
        let tc = props1_si(fluid, "T_critical").unwrap() - 273.15;
        let pc = props1_si(fluid, "p_critical").unwrap() / 1e5;
        let hc = props_si("H", "T", tc + 273.15 - 0.001, "Q", 0.5, fluid).unwrap() / 1000.0;
        println!("PUNTO CRÍTICO: Tc = {:.4} °C, Pc = {:.4} bar, hc = {:.3} kJ/kg", tc, pc, hc);

        // Audit superheated isotherms: T = 0, 40, 80 °C across pressures
        println!("\n=== ISOTERMAS SOBRECALENTADAS COOLPROP (h en función de P) ===");
        for &t_c in &[-20.0, 0.0, 40.0, 80.0] {
            let t_k = t_c + 273.15;
            let p_sat = props_si("P", "T", t_k, "Q", 1.0, fluid).unwrap() / 1e5;
            println!("\n--- Isoterma T = {:.1} °C (P_sat = {:.4} bar) ---", t_c, p_sat);
            println!("{:<12} | {:<15} | {:<15} | {:<15}", "P [bar]", "h [kJ/kg]", "v [m³/kg]", "s [kJ/(kg·K)]");
            let pressures = [0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 15.0, 20.0, 25.0];
            for &p_bar in &pressures {
                if p_bar < p_sat {
                    let p_pa = p_bar * 1e5;
                    let h = props_si("H", "T", t_k, "P", p_pa, fluid).unwrap() / 1000.0;
                    let d = props_si("D", "T", t_k, "P", p_pa, fluid).unwrap();
                    let s = props_si("S", "T", t_k, "P", p_pa, fluid).unwrap() / 1000.0;
                    println!("{:<12.3} | {:<15.3} | {:<15.5} | {:<15.4}", p_bar, h, 1.0 / d, s);
                }
            }
        }
    }

    #[test]
    fn test_curves_other_refrigerants() {
        for fluid in &["R744", "R717", "R290", "R32", "R407C"] {
            let res = generate_diagram_curves(fluid).unwrap_or_else(|e| panic!("Failed curves for {}: {}", fluid, e));
            assert!(!res.saturation_liquid.points.is_empty(), "Sat liq empty for {}", fluid);
            assert!(!res.saturation_vapor.points.is_empty(), "Sat vap empty for {}", fluid);
            assert!(!res.isotherms.is_empty(), "Isotherms empty for {}", fluid);
            println!("Successfully generated curves for {}: {} liq pts, {} isotherms", fluid, res.saturation_liquid.points.len(), res.isotherms.len());
        }
    }
}

