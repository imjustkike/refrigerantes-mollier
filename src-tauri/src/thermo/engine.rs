use coolprop_sys::bindings::CoolProp;
use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineInfo {
    pub is_ready: bool,
    pub version: String,
    pub loaded_path: Option<String>,
    pub error: Option<String>,
}

enum EngineState {
    Uninitialized,
    Ready {
        instance: CoolProp,
        loaded_path: PathBuf,
        version: String,
    },
    Failed {
        error: String,
    },
}

pub struct CoolPropEngine {
    state: Mutex<EngineState>,
}

static INSTANCE: OnceLock<CoolPropEngine> = OnceLock::new();

pub fn get_engine() -> &'static CoolPropEngine {
    INSTANCE.get_or_init(|| CoolPropEngine {
        state: Mutex::new(EngineState::Uninitialized),
    })
}

impl CoolPropEngine {
    /// Discovers candidate paths where the CoolProp native library may reside.
    pub fn discover_library_candidates(custom_hint: Option<&Path>) -> Vec<PathBuf> {
        let mut candidates = Vec::new();

        // 1. Explicit hint (e.g. from Tauri resource resolver or test override)
        if let Some(hint) = custom_hint {
            if hint.exists() {
                candidates.push(hint.to_path_buf());
            }
        }

        // 2. Environment variable COOLPROP_PATH
        if let Ok(env_path) = std::env::var("COOLPROP_PATH") {
            let p = PathBuf::from(env_path.trim());
            if p.exists() {
                candidates.push(p);
            }
        }

        // Platform-specific library names
        #[cfg(target_os = "windows")]
        let lib_names = &["CoolProp.dll", "coolprop.dll", "libs/CoolProp.dll"];
        #[cfg(target_os = "macos")]
        let lib_names = &["libCoolProp.dylib", "CoolProp.dylib", "libs/libCoolProp.dylib"];
        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        let lib_names = &["libCoolProp.so", "CoolProp.so", "libs/libCoolProp.so"];

        // 3. Candidates relative to executable directory
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                for name in lib_names {
                    candidates.push(exe_dir.join(name));
                    candidates.push(exe_dir.join("libs").join(name));
                    candidates.push(exe_dir.join("resources").join(name));
                    candidates.push(exe_dir.join("resources").join("libs").join(name));
                }

                // macOS App Bundle standard locations
                #[cfg(target_os = "macos")]
                {
                    candidates.push(exe_dir.join("../Frameworks/libCoolProp.dylib"));
                    candidates.push(exe_dir.join("../Resources/libs/libCoolProp.dylib"));
                    candidates.push(exe_dir.join("../Resources/libCoolProp.dylib"));
                }
            }
        }

        // 4. Current working directory and repository standard layout (dev & tests)
        if let Ok(cwd) = std::env::current_dir() {
            for name in lib_names {
                candidates.push(cwd.join(name));
                candidates.push(cwd.join("libs").join(name));
                candidates.push(cwd.join("src-tauri").join("libs").join(name));
                candidates.push(cwd.join("..").join("src-tauri").join("libs").join(name));
            }
        }

        // 5. Bare library names for OS standard search path fallback
        for name in lib_names {
            candidates.push(PathBuf::from(name));
        }

        // Remove duplicates while preserving order
        let mut unique = Vec::new();
        for c in candidates {
            if !unique.contains(&c) {
                unique.push(c);
            }
        }
        unique
    }

    /// Initializes or re-initializes the engine with an optional custom path hint.
    pub fn init(&self, custom_hint: Option<&Path>) -> Result<(), String> {
        let mut lock = self.state.lock().map_err(|e| format!("Mutex poisoning error: {}", e))?;

        // If already ready, return Ok
        if let EngineState::Ready { .. } = *lock {
            return Ok(());
        }

        let candidates = Self::discover_library_candidates(custom_hint);
        let mut attempt_errors = Vec::new();

        for candidate in &candidates {
            // Check if file exists when path is not just a bare filename
            if candidate.components().count() > 1 && !candidate.exists() {
                continue;
            }

            log::debug!("Intentando cargar biblioteca CoolProp desde: {:?}", candidate);
            match unsafe { CoolProp::new(candidate) } {
                Ok(instance) => {
                    // Query version to verify initialization
                    let ver = Self::read_string_param(&instance, "version")
                        .unwrap_or_else(|_| "Desconocida (Cargada)".to_string());

                    log::info!(
                        "CoolProp inicializado exitosamente desde {:?} (Versión: {})",
                        candidate,
                        ver
                    );

                    *lock = EngineState::Ready {
                        instance,
                        loaded_path: candidate.clone(),
                        version: ver,
                    };
                    return Ok(());
                }
                Err(err) => {
                    let msg = format!("{:?}: {}", candidate, err);
                    log::debug!("Fallo al cargar desde {:?}: {}", candidate, err);
                    attempt_errors.push(msg);
                }
            }
        }

        let error_summary = format!(
            "No se pudo cargar la biblioteca nativa CoolProp. Rutas probadas:\n - {}",
            attempt_errors.join("\n - ")
        );
        log::error!("{}", error_summary);
        *lock = EngineState::Failed {
            error: error_summary.clone(),
        };
        Err(error_summary)
    }

    /// Ensure engine is initialized. If uninitialized, attempts automatic discovery.
    fn ensure_initialized<'a>(
        &'a self,
        lock: &'a mut std::sync::MutexGuard<'_, EngineState>,
    ) -> Result<(&'a CoolProp, &'a PathBuf, &'a str), String> {
        if let EngineState::Uninitialized = **lock {
            drop(std::mem::replace(&mut **lock, EngineState::Uninitialized));
            // Run discovery outside lock to avoid deadlocks
            let candidates = Self::discover_library_candidates(None);
            let mut attempt_errors = Vec::new();
            let mut loaded = None;

            for candidate in &candidates {
                if candidate.components().count() > 1 && !candidate.exists() {
                    continue;
                }
                match unsafe { CoolProp::new(candidate) } {
                    Ok(instance) => {
                        let ver = Self::read_string_param(&instance, "version")
                            .unwrap_or_else(|_| "Desconocida".to_string());
                        log::info!(
                            "CoolProp inicializado automáticamente desde {:?} (Versión: {})",
                            candidate,
                            ver
                        );
                        loaded = Some((instance, candidate.clone(), ver));
                        break;
                    }
                    Err(err) => {
                        attempt_errors.push(format!("{:?}: {}", candidate, err));
                    }
                }
            }

            if let Some((instance, path, ver)) = loaded {
                **lock = EngineState::Ready {
                    instance,
                    loaded_path: path,
                    version: ver,
                };
            } else {
                let err_msg = format!(
                    "Biblioteca nativa CoolProp no disponible. Rutas probadas:\n - {}",
                    attempt_errors.join("\n - ")
                );
                **lock = EngineState::Failed {
                    error: err_msg.clone(),
                };
                return Err(err_msg);
            }
        }

        match &**lock {
            EngineState::Ready {
                instance,
                loaded_path,
                version,
            } => Ok((instance, loaded_path, version.as_str())),
            EngineState::Failed { error } => Err(error.clone()),
            EngineState::Uninitialized => unreachable!(),
        }
    }

    fn read_string_param(cp: &CoolProp, param: &str) -> Result<String, String> {
        let param_c = CString::new(param).map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 4096];
        let res = unsafe {
            cp.get_global_param_string(
                param_c.as_ptr(),
                buf.as_mut_ptr() as *mut std::os::raw::c_char,
                buf.len() as std::os::raw::c_int,
            )
        };
        if res == 0 {
            // Buffer was too small or parameter invalid, but string may still be null terminated
        }
        let s = unsafe { CStr::from_ptr(buf.as_ptr() as *const std::os::raw::c_char) }
            .to_string_lossy()
            .trim()
            .to_string();
        Ok(s)
    }

    /// Reads CoolProp errstring inside an active lock
    fn get_errstring_internal(cp: &CoolProp) -> String {
        Self::read_string_param(cp, "errstring").unwrap_or_default()
    }

    /// Evaluates Props1SI holding exclusive synchronized access to the native engine.
    pub fn props1_si(&self, fluid: &str, prop: &str) -> Result<f64, String> {
        let fluid_c = CString::new(fluid).map_err(|e| e.to_string())?;
        let prop_c = CString::new(prop).map_err(|e| e.to_string())?;

        let mut lock = self.state.lock().map_err(|e| format!("Mutex error: {}", e))?;
        let (cp, _, _) = self.ensure_initialized(&mut lock)?;

        let val = unsafe { cp.Props1SI(fluid_c.as_ptr(), prop_c.as_ptr()) };

        if val.is_finite() && val > -1e30 {
            Ok(val)
        } else {
            let err = Self::get_errstring_internal(cp);
            if err.is_empty() {
                Err(format!("Error evaluando {} para {}", prop, fluid))
            } else {
                Err(err)
            }
        }
    }

    /// Evaluates PropsSI holding exclusive synchronized access to the native engine.
    pub fn props_si(
        &self,
        out_prop: &str,
        in1_name: &str,
        in1_val: f64,
        in2_name: &str,
        in2_val: f64,
        fluid: &str,
    ) -> Result<f64, String> {
        let out_c = CString::new(out_prop).map_err(|e| e.to_string())?;
        let in1_c = CString::new(in1_name).map_err(|e| e.to_string())?;
        let in2_c = CString::new(in2_name).map_err(|e| e.to_string())?;
        let fluid_c = CString::new(fluid).map_err(|e| e.to_string())?;

        let mut lock = self.state.lock().map_err(|e| format!("Mutex error: {}", e))?;
        let (cp, _, _) = self.ensure_initialized(&mut lock)?;

        let val = unsafe {
            cp.PropsSI(
                out_c.as_ptr(),
                in1_c.as_ptr(),
                in1_val,
                in2_c.as_ptr(),
                in2_val,
                fluid_c.as_ptr(),
            )
        };

        if val.is_finite() && val > -1e30 {
            Ok(val)
        } else {
            let err = Self::get_errstring_internal(cp);
            if err.is_empty() {
                Err(format!(
                    "Error termodinámico evaluando {} con {}={}, {}={} para {}",
                    out_prop, in1_name, in1_val, in2_name, in2_val, fluid
                ))
            } else {
                Err(err)
            }
        }
    }

    /// Queries a global parameter string holding exclusive synchronized access.
    pub fn get_global_param_string(&self, param: &str) -> Result<String, String> {
        let mut lock = self.state.lock().map_err(|e| format!("Mutex error: {}", e))?;
        let (cp, _, _) = self.ensure_initialized(&mut lock)?;
        Self::read_string_param(cp, param)
    }

    /// Returns engine diagnosis information.
    pub fn get_engine_info(&self) -> EngineInfo {
        let mut lock = match self.state.lock() {
            Ok(l) => l,
            Err(e) => {
                return EngineInfo {
                    is_ready: false,
                    version: "Error".to_string(),
                    loaded_path: None,
                    error: Some(format!("Mutex poisoned: {}", e)),
                }
            }
        };

        match self.ensure_initialized(&mut lock) {
            Ok((_, path, ver)) => EngineInfo {
                is_ready: true,
                version: ver.to_string(),
                loaded_path: Some(path.to_string_lossy().to_string()),
                error: None,
            },
            Err(err) => EngineInfo {
                is_ready: false,
                version: "No disponible".to_string(),
                loaded_path: None,
                error: Some(err),
            },
        }
    }

    /// Returns whether the engine is ready and functional.
    pub fn is_available(&self) -> bool {
        self.get_engine_info().is_ready
    }

    /// Returns the active CoolProp version string or error description.
    pub fn get_version(&self) -> Result<String, String> {
        let info = self.get_engine_info();
        if info.is_ready {
            Ok(info.version)
        } else {
            Err(info.error.unwrap_or_else(|| "CoolProp no inicializado".to_string()))
        }
    }
}
