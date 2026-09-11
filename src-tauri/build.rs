fn main() {
    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");
    }
    #[cfg(target_os = "windows")]
    {
        println!("cargo:rustc-link-search=native=libs");
    }
    tauri_build::build()
}
