pub mod commands;
pub mod thermo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_catalog,
            commands::get_fluid_details,
            commands::get_diagram_curves_cmd,
            commands::calculate_point_cmd,
            commands::calculate_process_curve_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
