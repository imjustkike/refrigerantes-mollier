use crate::pid_sim::model::{ComponentType, InstallationSchema};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub level: String, // "ERROR" o "WARNING"
    pub equipment_id: Option<String>,
    pub message: String,
    pub technical_detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationReport {
    pub is_valid: bool,
    pub issues: Vec<ValidationIssue>,
}

pub struct SchemaValidator;

impl SchemaValidator {
    pub fn validate(schema: &InstallationSchema) -> ValidationReport {
        let mut issues = Vec::new();

        // 1. Comprobar presencia de componentes esenciales
        let has_compressor = schema.equipments.iter().any(|e| {
            matches!(
                ComponentType::from(e.component_type.as_str()),
                ComponentType::CompressorScroll
                    | ComponentType::CompressorReciprocating
                    | ComponentType::CompressorScrew
                    | ComponentType::CompressorInverter
            )
        });

        let has_condenser = schema.equipments.iter().any(|e| {
            matches!(
                ComponentType::from(e.component_type.as_str()),
                ComponentType::CondenserAir | ComponentType::CondenserWaterPlate
            )
        });

        let has_evaporator = schema.equipments.iter().any(|e| {
            matches!(
                ComponentType::from(e.component_type.as_str()),
                ComponentType::EvaporatorDxAir | ComponentType::EvaporatorPlateChiller
            )
        });

        let has_expansion = schema.equipments.iter().any(|e| {
            matches!(
                ComponentType::from(e.component_type.as_str()),
                ComponentType::ExpansionValveTxv | ComponentType::ExpansionValveEev
            )
        });

        if !has_compressor {
            issues.push(ValidationIssue {
                level: "ERROR".to_string(),
                equipment_id: None,
                message: "No se ha encontrado ningún compresor en la instalación.".to_string(),
                technical_detail: "Se requiere al menos un compresor para generar caudal y relación de compresión.".to_string(),
            });
        }

        if !has_condenser {
            issues.push(ValidationIssue {
                level: "ERROR".to_string(),
                equipment_id: None,
                message: "Falta el intercambiador de alta presión (condensador).".to_string(),
                technical_detail: "El circuito no puede evacuar el calor de rechazo hacia el ambiente exterior.".to_string(),
            });
        }

        if !has_evaporator {
            issues.push(ValidationIssue {
                level: "ERROR".to_string(),
                equipment_id: None,
                message: "Falta el intercambiador de baja presión (evaporador).".to_string(),
                technical_detail: "No hay superficie de intercambio para absorber el calor de las cámaras.".to_string(),
            });
        }

        if !has_expansion {
            issues.push(ValidationIssue {
                level: "ERROR".to_string(),
                equipment_id: None,
                message: "Falta el dispositivo de expansión (TXV o Válvula Electrónica).".to_string(),
                technical_detail: "No se puede regular la caída de presión ni la alimentación del evaporador.".to_string(),
            });
        }

        // 2. Comprobar tuberías y continuidad de refrigerante
        for eq in &schema.equipments {
            let eq_type = ComponentType::from(eq.component_type.as_str());

            // Compresor: comprobar conexión de aspiración y descarga
            if matches!(
                eq_type,
                ComponentType::CompressorScroll
                    | ComponentType::CompressorReciprocating
                    | ComponentType::CompressorScrew
                    | ComponentType::CompressorInverter
            ) {
                let has_suction = schema
                    .pipes
                    .iter()
                    .any(|p| p.target_node_id == eq.id || p.source_node_id == eq.id);
                if !has_suction {
                    issues.push(ValidationIssue {
                        level: "WARNING".to_string(),
                        equipment_id: Some(eq.id.clone()),
                        message: format!("Compresor '{}' con puertos de tubería desconectados.", eq.tag),
                        technical_detail: "El compresor no podrá circular refrigerante hasta conectar su línea de aspiración y descarga.".to_string(),
                    });
                }
            }

            // Evaporador: comprobar vinculación a cámara frigorífica
            if matches!(
                eq_type,
                ComponentType::EvaporatorDxAir | ComponentType::EvaporatorPlateChiller
            ) {
                if eq.chamber_id.is_none() && schema.chambers.is_empty() {
                    issues.push(ValidationIssue {
                        level: "WARNING".to_string(),
                        equipment_id: Some(eq.id.clone()),
                        message: format!("Evaporador '{}' sin cámara frigorífica asignada.", eq.tag),
                        technical_detail: "El evaporador absorberá calor de una temperatura ambiente por defecto al no existir cámaras configuradas.".to_string(),
                    });
                }
            }

            // Válvulas manuales o solenoides cerradas
            if matches!(
                eq_type,
                ComponentType::SolenoidValve | ComponentType::BallServiceValve
            ) {
                if eq.is_valve_open == Some(false) {
                    issues.push(ValidationIssue {
                        level: "WARNING".to_string(),
                        equipment_id: Some(eq.id.clone()),
                        message: format!("Válvula '{}' cerrada en el circuito.", eq.tag),
                        technical_detail: "Una válvula cerrada interrumpirá el flujo, provocando vaciado pump-down o sobrepresión aguas arriba.".to_string(),
                    });
                }
            }

            // Comprobación de asignación eléctrica
            if matches!(
                eq_type,
                ComponentType::CompressorScroll
                    | ComponentType::CompressorReciprocating
                    | ComponentType::CompressorScrew
                    | ComponentType::CompressorInverter
            ) {
                if eq.breaker_id.is_none() {
                    issues.push(ValidationIssue {
                        level: "WARNING".to_string(),
                        equipment_id: Some(eq.id.clone()),
                        message: format!("Compresor '{}' sin disyuntor asignado en el cuadro eléctrico.", eq.tag),
                        technical_detail: "Se alimentará directamente de la barra general sin protección individual de ramal.".to_string(),
                    });
                }
            }
        }

        let is_valid = !issues.iter().any(|i| i.level == "ERROR");

        ValidationReport { is_valid, issues }
    }
}
