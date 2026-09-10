use crate::thermo::{get_fluid_constants, props_si, resolve_coolprop_fluid_id};
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
    let resolved_fluid = resolve_coolprop_fluid_id(fluid_id);
    let fluid_id = resolved_fluid.as_str();
    let consts = get_fluid_constants(fluid_id)?;

    let t_crit_k = consts.t_crit_k;
    let p_crit_pa = consts.p_crit_pa;

    // Practical refrigeration minimum temperature: around -60 °C or T_min + 2K
    let t_min_k = (consts.t_min_k + 2.0).max(213.15).min(t_crit_k - 30.0);
    let p_min_pa = props_si("P", "T", t_min_k, "Q", 0.0, fluid_id)
        .unwrap_or(10000.0)
        .max(5000.0); // at least 0.05 bar

    let p_crit_bar = p_crit_pa / 1e5;

    // Critical point enthalpy
    let h_crit_kj = consts.h_crit_kj_kg.unwrap_or_else(|| {
        props_si("H", "P", p_crit_pa * 0.9998, "Q", 1.0, fluid_id)
            .or_else(|_| props_si("H", "T", t_crit_k - 0.02, "Q", 0.5, fluid_id))
            .map(|h| h / 1000.0)
            .unwrap_or(400.0)
    });

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

    // Extended domain for thermodynamic curve series generation:
    // Ensures isotherms, isentropes, and isochores extend smoothly across the entire zoom-out headroom
    let p_max_gen_bar = (p_max_bar * 2.8).max(150.0);
    let h_max_gen_kj = h_max_kj_kg + h_span * 0.8;

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

    // Isotherms (T = const) matching Danfoss chart (-60..+90 by 10°C, then +100..+300 by 20°C)
    let temps_c: Vec<f64> = if fluid_id == "R134a" {
        vec![
            -60.0, -50.0, -40.0, -30.0, -20.0, -10.0, 0.0, 10.0, 20.0, 30.0, 40.0, 50.0,
            60.0, 70.0, 80.0, 90.0, 100.0, 120.0, 140.0, 160.0, 180.0, 200.0, 220.0, 240.0,
            260.0, 280.0, 300.0,
        ]
    } else {
        let mut t_vec = Vec::new();
        let t_c_min = ((t_min_k - 273.15) / 10.0).floor() * 10.0;
        let t_c_crit = t_crit_k - 273.15;
        let t_c_max = (t_c_crit + 180.0).min(320.0);
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
                let h_sat_liq = props_si("H", "T", t_k, "Q", 0.0, fluid_id).unwrap_or(200_000.0);
                let h_sat_vap = props_si("H", "T", t_k, "Q", 1.0, fluid_id).unwrap_or(400_000.0);
                let v_sat_liq = props_si("D", "T", t_k, "Q", 0.0, fluid_id).ok().map(|d| 1.0 / d).unwrap_or(0.00085);

                // 1. Subcooled liquid: thermodynamically exact relation dh = v_liq * dP (nearly vertical line)
                let p_max_sub = (p_max_gen_bar * 1e5).max(p_sat_liq * 1.05);
                let n_sub = 20;
                for i in (0..=n_sub).rev() {
                    let p = p_sat_liq + (p_max_sub - p_sat_liq) * (i as f64 / n_sub as f64);
                    // dh = v * dp
                    let h = h_sat_liq + v_sat_liq * (p - p_sat_liq);
                    pts.push(CurvePoint {
                        h_kj_kg: h / 1000.0,
                        p_bar: p / 1e5,
                        t_c: Some(t_c),
                        s_kj_kg_k: None,
                        v_m3_kg: Some(v_sat_liq),
                        q: Some(0.0),
                    });
                }

                // 2. Two-phase: bubble (Q=0) to dew (Q=1)
                let n_two_phase = 16;
                for i in 1..n_two_phase {
                    let q = i as f64 / n_two_phase as f64;
                    let p = p_sat_liq + (p_sat_vap - p_sat_liq) * q;
                    let h = h_sat_liq + (h_sat_vap - h_sat_liq) * q;
                    pts.push(CurvePoint {
                        h_kj_kg: h / 1000.0,
                        p_bar: p / 1e5,
                        t_c: Some(t_c),
                        s_kj_kg_k: None,
                        v_m3_kg: None,
                        q: Some(q),
                    });
                }
                pts.push(CurvePoint {
                    h_kj_kg: h_sat_vap / 1000.0,
                    p_bar: p_sat_vap / 1e5,
                    t_c: Some(t_c),
                    s_kj_kg_k: None,
                    v_m3_kg: None,
                    q: Some(1.0),
                });

                // 3. Superheated vapor: from p_sat_vap down to p_min_bar (continuous curve)
                let p_min_sup = (p_min_bar * 1e5).min(p_sat_vap * 0.98).max(1000.0);
                if p_sat_vap > p_min_sup {
                    let n_sup = 35;
                    for i in 1..=n_sup {
                        let frac = i as f64 / n_sup as f64;
                        let log_p = (p_sat_vap.ln()) * (1.0 - frac) + (p_min_sup.ln()) * frac;
                        let p = log_p.exp();
                        let h = props_si("H", "T", t_k, "P", p, fluid_id)
                            .unwrap_or_else(|_| h_sat_vap + (p_sat_vap / p).ln() * 15_000.0);
                        let h_clamped = h.max(h_sat_vap);
                        pts.push(CurvePoint {
                            h_kj_kg: h_clamped / 1000.0,
                            p_bar: p / 1e5,
                            t_c: Some(t_c),
                            s_kj_kg_k: None,
                            v_m3_kg: None,
                            q: None,
                        });
                    }
                }
            } else {
                // Supercritical isotherm: smooth curve from p_max_gen down to p_min
                let n_pts = 55;
                let log_p_min = (p_min_bar * 1e5).ln();
                let log_p_max = (p_max_gen_bar * 1e5).ln();

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
    let s_min_chart = sat_liquid_pts.iter().filter_map(|p| p.s_kj_kg_k).fold(1.0f64, f64::min);
    let s_max_chart = sat_vapor_pts.iter().filter_map(|p| p.s_kj_kg_k).fold(2.0f64, f64::max) + 0.8;
    let s_vals: Vec<f64> = if fluid_id == "R134a" {
        vec![
            0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45, 1.55, 1.65,
            1.70, 1.75, 1.80, 1.85, 1.90, 1.95, 2.00, 2.05, 2.10, 2.15, 2.20,
            2.25, 2.30, 2.35, 2.40, 2.45, 2.50, 2.55, 2.60, 2.65, 2.70, 2.75,
            2.80, 2.85, 2.90,
        ]
    } else {
        let mut s_vec = Vec::new();
        let start = ((s_min_chart * 10.0).floor() / 10.0).max(0.5);
        let end = ((s_max_chart * 10.0).ceil() / 10.0 + 0.4).min(3.8);
        let mut cur_s = start;
        while cur_s <= end {
            s_vec.push((cur_s * 100.0).round() / 100.0);
            cur_s += 0.10;
        }
        s_vec
    };

    let isentropics: Vec<CurveSeries> = s_vals
        .into_par_iter()
        .filter_map(|s_kj| {
            let s_j = s_kj * 1000.0;
            let mut pts = Vec::new();
            let p_min_pa = p_min_bar * 1e5;
            let p_max_pa = p_max_gen_bar * 1e5;

            // Anchor starting point at saturation vapor curve if s_kj falls in range
            let sat_anchor = sat_vapor_pts
                .iter()
                .find(|pt| pt.s_kj_kg_k.map_or(false, |s| s >= s_kj));

            let p_start = sat_anchor.map(|pt| (pt.p_bar * 1e5).max(p_min_pa)).unwrap_or(p_min_pa);
            let p_end = p_max_pa;
            let log_p_start = p_start.ln();
            let log_p_end = p_end.ln();

            let mut prev_t = sat_anchor.and_then(|pt| pt.t_c.map(|c| c + 273.15)).unwrap_or(t_min_k + 10.0);
            let n_pts = 24;

            for i in 0..=n_pts {
                let frac = i as f64 / n_pts as f64;
                let p = (log_p_start + (log_p_end - log_p_start) * frac).exp();

                // Fast 1D Newton solver using forward (T, P) evaluations
                let mut cur_t = prev_t;
                let mut converged = false;

                for _ in 0..8 {
                    if let Ok(s_eval) = props_si("S", "T", cur_t, "P", p, fluid_id) {
                        let diff = s_eval - s_j;
                        if diff.abs() < 2.0 {
                            converged = true;
                            break;
                        }
                        let ds_dt = 3.3;
                        let step = -diff / ds_dt;
                        cur_t += step.max(-20.0).min(20.0);
                        if cur_t < 150.0 || cur_t > 650.0 {
                            break;
                        }
                    } else {
                        break;
                    }
                }

                if converged {
                    prev_t = cur_t;
                    if let Ok(h) = props_si("H", "T", cur_t, "P", p, fluid_id) {
                        let h_kj = h / 1000.0;
                        if h_kj >= h_min_kj_kg - 50.0 && h_kj <= h_max_gen_kj + 60.0 {
                            pts.push(CurvePoint {
                                h_kj_kg: h_kj,
                                p_bar: p / 1e5,
                                t_c: Some(cur_t - 273.15),
                                s_kj_kg_k: Some(s_kj),
                                v_m3_kg: None,
                                q: if i == 0 && sat_anchor.is_some() { Some(1.0) } else { None },
                            });
                        }
                    }
                }
            }

            if pts.len() >= 2 {
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

    // Isochores (v = const) in vapor region matching standard Mollier diagrams
    // (Only vapor isochores v >= v_crit, starting at dew curve Q=1 or P_min)
    let v_vals: Vec<f64> = vec![
        0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.010, 0.015, 0.020, 0.030,
        0.040, 0.050, 0.060, 0.070, 0.080, 0.090, 0.10, 0.15, 0.20, 0.30,
        0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0,
    ];

    let isochores: Vec<CurveSeries> = v_vals
        .into_par_iter()
        .filter_map(|v_m3| {
            let density = 1.0 / v_m3;
            let mut pts = Vec::new();
            let p_min_pa = p_min_bar * 1e5;
            let p_max_pa = p_max_gen_bar * 1e5;

            // Anchor isochore on dew curve (Q=1): find T where saturated vapor volume matches v_m3
            // In sat_vapor_pts, v_m3_kg starts large at T_min and decreases to v_crit at T_crit
            let t_sat_opt = sat_vapor_pts
                .iter()
                .find(|pt| pt.v_m3_kg.map_or(false, |v| v <= v_m3))
                .and_then(|pt| pt.t_c.map(|c| c + 273.15));

            // If v_m3 is smaller than critical volume or no anchor, skip to avoid 2-phase spinodal artifacts
            let t_start = match t_sat_opt {
                Some(t) => t,
                None => {
                    // Check if v_m3 > v_sat at T_min (superheated at all T >= T_min)
                    let v_at_tmin = sat_vapor_pts.first().and_then(|pt| pt.v_m3_kg).unwrap_or(0.1);
                    if v_m3 >= v_at_tmin {
                        t_min_k
                    } else {
                        return None;
                    }
                }
            };

            let t_end = t_crit_k + 240.0;
            let n_pts = 30;
            for i in 0..=n_pts {
                let frac = i as f64 / n_pts as f64;
                let t = t_start + (t_end - t_start) * frac;
                if let (Ok(p), Ok(h)) = (
                    props_si("P", "T", t, "D", density, fluid_id),
                    props_si("H", "T", t, "D", density, fluid_id),
                ) {
                    if p.is_finite() && h.is_finite() && p >= p_min_pa * 0.5 && p <= p_max_pa * 1.15 {
                        let h_kj = h / 1000.0;
                        if h_kj >= h_min_kj_kg - 50.0 && h_kj <= h_max_gen_kj + 60.0 {
                            pts.push(CurvePoint {
                                h_kj_kg: h_kj,
                                p_bar: p / 1e5,
                                t_c: Some(t - 273.15),
                                s_kj_kg_k: None,
                                v_m3_kg: Some(v_m3),
                                q: if i == 0 && t_sat_opt.is_some() { Some(1.0) } else { None },
                            });
                        }
                    }
                }
            }

            if pts.len() >= 2 {
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
    use crate::thermo::props1_si;

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
    fn test_curves_r513a() {
        let res = generate_diagram_curves("R513A").expect("Failed to generate R513A curves");
        assert!(!res.saturation_liquid.points.is_empty());
        assert!(!res.saturation_vapor.points.is_empty());
        assert!(!res.isotherms.is_empty());
        assert!(!res.isentropics.is_empty());
        assert!(!res.isochores.is_empty());
        assert_eq!(res.fluid_id, "R513A.mix");
        println!(
            "R513A curves generated: {} sat liq, {} sat vap, {} isotherms, {} isentropics, {} isochores",
            res.saturation_liquid.points.len(),
            res.saturation_vapor.points.len(),
            res.isotherms.len(),
            res.isentropics.len(),
            res.isochores.len()
        );
    }

    #[test]
    fn test_curves_other_refrigerants() {
        let test_fluids = [
            "R513A",
            "R513A.mix",
            "R448A",
            "R449A",
            "R450A",
            "R452A",
            "R454B",
            "R454C",
            "R455A",
            "R407F",
            "R502",
            "R422D",
            "R438A",
            "R508B",
            "R744",
            "R717",
            "R290",
            "R32",
            "R407C",
        ];

        for fluid in &test_fluids {
            let res = generate_diagram_curves(fluid)
                .unwrap_or_else(|e| panic!("Failed curves for {}: {}", fluid, e));
            assert!(!res.saturation_liquid.points.is_empty(), "Sat liq empty for {}", fluid);
            assert!(!res.saturation_vapor.points.is_empty(), "Sat vap empty for {}", fluid);
            assert!(!res.isotherms.is_empty(), "Isotherms empty for {}", fluid);
            println!(
                "Successfully generated curves for {}: {} liq pts, {} isotherms, domain P=[{:.2}, {:.2}] bar",
                fluid,
                res.saturation_liquid.points.len(),
                res.isotherms.len(),
                res.domain.p_min_bar,
                res.domain.p_max_bar
            );
        }
    }
}

