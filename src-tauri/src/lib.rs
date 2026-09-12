use tauri::Manager;

pub mod commands;
pub mod logger;
pub mod thermo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Initialize logging system and panic crash hook immediately
    if let Ok(path) = logger::init_logger() {
        log::info!("Logger inicializado en: {:?}", path);
    }

    // 2. Build and launch Tauri desktop application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            log::info!("Iniciando setup de Tauri y resolviendo recursos...");

            // Resolve potential resource path from Tauri 2 ResourceResolver
            let mut resource_hint = None;
            if let Ok(res_dir) = app.path().resource_dir() {
                #[cfg(target_os = "windows")]
                {
                    let c1 = res_dir.join("libs").join("CoolProp.dll");
                    let c2 = res_dir.join("CoolProp.dll");
                    if c1.exists() {
                        resource_hint = Some(c1);
                    } else if c2.exists() {
                        resource_hint = Some(c2);
                    }
                }
                #[cfg(target_os = "macos")]
                {
                    let c1 = res_dir.join("libs").join("libCoolProp.dylib");
                    let c2 = res_dir.join("libCoolProp.dylib");
                    if c1.exists() {
                        resource_hint = Some(c1);
                    } else if c2.exists() {
                        resource_hint = Some(c2);
                    }
                }
            }

            // Initialize CoolProp with discovered resource hint (or fallback candidates)
            let _ = thermo::init_coolprop(resource_hint.as_deref());

            let info = thermo::engine::get_engine().get_engine_info();
            if info.is_ready {
                log::info!(
                    "Motor CoolProp activo y verificado. Versión: {}. Ruta: {:?}",
                    info.version,
                    info.loaded_path
                );
            } else {
                log::error!(
                    "Fallo al inicializar CoolProp: {}",
                    info.error.as_deref().unwrap_or("Error desconocido")
                );
            }

            log::info!("Tauri Setup completado. Ventana principal lista.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_catalog,
            commands::get_fluid_details,
            commands::get_diagram_curves_cmd,
            commands::calculate_point_cmd,
            commands::calculate_process_curve_cmd,
            commands::get_engine_info_cmd,
            commands::get_log_path_cmd,
            commands::log_client_event_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
