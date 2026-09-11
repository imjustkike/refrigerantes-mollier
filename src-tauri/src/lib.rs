pub mod commands;
pub mod logger;
pub mod thermo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Initialize logging system and panic crash hook immediately
    if let Ok(path) = logger::init_logger() {
        log::info!("Logger inicializado en: {:?}", path);
    }

    // 2. Test CoolProp C++ engine availability at startup
    log::info!("Probando motor termodinámico CoolProp C++...");
    let cp_ver = thermo::get_coolprop_version();
    log::info!("Versión CoolProp activa: {}", cp_ver);

    // 3. Build and launch Tauri desktop application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            log::info!("Tauri Setup completado. Ventana principal lista.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_catalog,
            commands::get_fluid_details,
            commands::get_diagram_curves_cmd,
            commands::calculate_point_cmd,
            commands::calculate_process_curve_cmd,
            commands::get_log_path_cmd,
            commands::log_client_event_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
