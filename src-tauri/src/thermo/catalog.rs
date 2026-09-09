use crate::thermo::{get_fluid_constants, resolve_coolprop_fluid_id, FluidInfo};
use coolprop_sys::COOLPROP;
use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogItem {
    pub display_name: String,
    pub coolprop_id: String,
    pub aliases: Vec<String>,
    pub group: String, // "Naturales", "HFC y mezclas", "HFO y bajo GWP", "Históricos y existentes", "Otros fluidos"
    pub fluid_type: String, // "Puro", "Mezcla casi azeotrópica", "Mezcla zeotrópica", "Mezcla azeotrópica"
    pub gwp: Option<f64>,
    pub ashrae_safety: Option<String>,
    pub is_available: bool,
    pub notes: Option<String>,
    pub info: Option<FluidInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogResponse {
    pub engine_version: String,
    pub priority_items: Vec<CatalogItem>,
    pub other_available_fluids: Vec<String>,
}

pub fn get_refrigerant_catalog() -> CatalogResponse {
    let raw_priority = vec![
        // Naturales
        ("R717 (Amoníaco)", vec!["R717", "Ammonia", "NH3"], "Naturales", "Puro", Some(0.0), Some("B2L".to_string())),
        ("R744 (Dióxido de carbono / CO₂)", vec!["R744", "CarbonDioxide", "CO2"], "Naturales", "Puro", Some(1.0), Some("A1".to_string())),
        ("R290 (Propano)", vec!["R290", "Propane"], "Naturales", "Puro", Some(3.0), Some("A3".to_string())),
        ("R600a (Isobutano)", vec!["R600a", "IsoButane", "Isobutane"], "Naturales", "Puro", Some(3.0), Some("A3".to_string())),
        ("R600 (Butano)", vec!["R600", "n-Butane", "Butane"], "Naturales", "Puro", Some(4.0), Some("A3".to_string())),
        ("R1270 (Propileno)", vec!["R1270", "Propylene"], "Naturales", "Puro", Some(2.0), Some("A3".to_string())),

        // HFO y mezclas de bajo GWP (Reemplazos modernos directos)
        ("R513A (Opteon XP10)", vec!["R513A.mix", "R513A", "XP10", "Opteon XP10"], "HFO y bajo GWP", "Mezcla azeotrópica", Some(631.0), Some("A1".to_string())),
        ("R1234yf", vec!["R1234yf"], "HFO y bajo GWP", "Puro", Some(4.0), Some("A2L".to_string())),
        ("R1234ze(E)", vec!["R1234ze(E)", "R1234ze"], "HFO y bajo GWP", "Puro", Some(7.0), Some("A2L".to_string())),
        ("R1233zd(E)", vec!["R1233zd(E)", "R1233zd"], "HFO y bajo GWP", "Puro", Some(1.0), Some("A1".to_string())),
        ("R448A (Solstice N40)", vec!["R448A.mix", "R448A", "Solstice N40"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(1387.0), Some("A1".to_string())),
        ("R449A (Opteon XP40)", vec!["R449A.mix", "R449A", "Opteon XP40"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(1397.0), Some("A1".to_string())),
        ("R450A (Solstice N13)", vec!["R450A.mix", "R450A", "Solstice N13"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(605.0), Some("A1".to_string())),
        ("R452A (Opteon XP44)", vec!["R452A.mix", "R452A", "Opteon XP44"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(2140.0), Some("A1".to_string())),
        ("R454B (Opteon XL41 / Puron Advance)", vec!["R454B.mix", "R454B", "Opteon XL41"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(466.0), Some("A2L".to_string())),
        ("R454C (Opteon XL20)", vec!["R454C.mix", "R454C", "Opteon XL20"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(148.0), Some("A2L".to_string())),
        ("R455A (Solstice L40X)", vec!["R455A.mix", "R455A", "Solstice L40X"], "HFO y bajo GWP", "Mezcla zeotrópica", Some(148.0), Some("A2L".to_string())),

        // HFC y mezclas habituales
        ("R134a", vec!["R134a"], "HFC y mezclas", "Puro", Some(1430.0), Some("A1".to_string())),
        ("R32 (Difluorometano)", vec!["R32", "Difluoromethane"], "HFC y mezclas", "Puro", Some(675.0), Some("A2L".to_string())),
        ("R404A", vec!["R404A", "R404A.mix"], "HFC y mezclas", "Mezcla casi azeotrópica", Some(3922.0), Some("A1".to_string())),
        ("R410A", vec!["R410A", "R410A.mix"], "HFC y mezclas", "Mezcla casi azeotrópica", Some(2088.0), Some("A1".to_string())),
        ("R407C", vec!["R407C", "R407C.mix"], "HFC y mezclas", "Mezcla zeotrópica", Some(1774.0), Some("A1".to_string())),
        ("R407A", vec!["R407A.mix", "R407A"], "HFC y mezclas", "Mezcla zeotrópica", Some(2107.0), Some("A1".to_string())),
        ("R407F (Performax LT)", vec!["R407F.mix", "R407F"], "HFC y mezclas", "Mezcla zeotrópica", Some(1825.0), Some("A1".to_string())),
        ("R507A", vec!["R507A", "R507A.mix"], "HFC y mezclas", "Mezcla azeotrópica", Some(3985.0), Some("A1".to_string())),
        ("R125 (Pentafluoroetano)", vec!["R125", "Pentafluoroethane"], "HFC y mezclas", "Puro", Some(3500.0), Some("A1".to_string())),
        ("R143a (Trifluoroetano)", vec!["R143a"], "HFC y mezclas", "Puro", Some(4470.0), Some("A2L".to_string())),
        ("R152a (Difluoroetano)", vec!["R152a"], "HFC y mezclas", "Puro", Some(124.0), Some("A2".to_string())),
        ("R422D (ISCEON MO29)", vec!["R422D.mix", "R422D"], "HFC y mezclas", "Mezcla zeotrópica", Some(2729.0), Some("A1".to_string())),
        ("R438A (MO99)", vec!["R438A.mix", "R438A"], "HFC y mezclas", "Mezcla zeotrópica", Some(2264.0), Some("A1".to_string())),
        ("R417A (ISCEON MO59)", vec!["R417A.mix", "R417A"], "HFC y mezclas", "Mezcla zeotrópica", Some(2346.0), Some("A1".to_string())),

        // Equipos existentes e históricos
        ("R22 (Clorodifluorometano)", vec!["R22", "Chlorodifluoromethane"], "Históricos y existentes", "Puro (HCFC)", Some(1810.0), Some("A1".to_string())),
        ("R502", vec!["R502.mix", "R502"], "Históricos y existentes", "Mezcla azeotrópica (CFC/HCFC)", Some(4657.0), Some("A1".to_string())),
        ("R12 (Diclorodifluorometano)", vec!["R12", "Dichlorodifluoromethane"], "Históricos y existentes", "Puro (CFC histórico)", Some(10900.0), Some("A1".to_string())),
        ("R11 (Triclorofluorometano)", vec!["R11"], "Históricos y existentes", "Puro (CFC histórico)", Some(4750.0), Some("A1".to_string())),
        ("R123 (Diclorotrifluoroetano)", vec!["R123", "Dichlorotrifluoroethane"], "Históricos y existentes", "Puro (HCFC)", Some(77.0), Some("B1".to_string())),
        ("R124 (Clorotetrafluoroetano)", vec!["R124"], "Históricos y existentes", "Puro (HCFC)", Some(609.0), Some("A1".to_string())),
        ("R23 (Trifluorometano)", vec!["R23", "Trifluoromethane"], "Históricos y existentes", "Puro (HFC muy baja T)", Some(14800.0), Some("A1".to_string())),
        ("R508B (Suva 95)", vec!["R508B.mix", "R508B"], "Históricos y existentes", "Mezcla azeotrópica (PFC/HFC)", Some(13396.0), Some("A1".to_string())),
        ("R500", vec!["R500.mix", "R500"], "Históricos y existentes", "Mezcla azeotrópica (CFC/HFC)", Some(8077.0), Some("A1".to_string())),
    ];

    let mut priority_items = Vec::new();

    for (display_name, aliases, group, fluid_type, gwp, ashrae) in raw_priority {
        let mut resolved_id = None;
        let mut resolved_info = None;

        for alias in &aliases {
            let actual_id = resolve_coolprop_fluid_id(alias);
            if let Ok(consts) = get_fluid_constants(&actual_id) {
                if consts.t_crit_k > 0.0 {
                    resolved_id = Some(actual_id);
                    resolved_info = crate::thermo::get_fluid_info(alias).ok();
                    break;
                }
            }
        }

        let is_avail = resolved_id.is_some();
        let notes = match &resolved_id {
            Some(id) => Some(format!("Disponible en CoolProp con identificador '{}'", id)),
            None => Some("No incluido en la base de datos estándar de CoolProp".to_string()),
        };

        priority_items.push(CatalogItem {
            display_name: display_name.to_string(),
            coolprop_id: resolved_id.unwrap_or_else(|| aliases[0].to_string()),
            aliases: aliases.into_iter().map(|s| s.to_string()).collect(),
            group: group.to_string(),
            fluid_type: fluid_type.to_string(),
            gwp,
            ashrae_safety: ashrae,
            is_available: is_avail,
            notes,
            info: resolved_info,
        });
    }

    // Explore other available fluids in CoolProp
    let other_available_fluids = get_all_coolprop_fluids();

    CatalogResponse {
        engine_version: crate::thermo::get_coolprop_version(),
        priority_items,
        other_available_fluids,
    }
}

pub fn get_all_coolprop_fluids() -> Vec<String> {
    let cp = COOLPROP.shared_access();
    let fluids_param = CString::new("fluids_list").unwrap();
    let mut fluids_buf = vec![0u8; 65536];
    unsafe {
        cp.get_global_param_string(
            fluids_param.as_ptr(),
            fluids_buf.as_mut_ptr() as *mut std::os::raw::c_char,
            65536,
        );
        let fluids_list = CStr::from_ptr(fluids_buf.as_ptr() as *const std::os::raw::c_char).to_string_lossy();
        let mut list: Vec<String> = fluids_list
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        list.sort();
        list
    }
}

