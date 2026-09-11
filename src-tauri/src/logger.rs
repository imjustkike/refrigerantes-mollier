use chrono::Local;
use log::{Level, LevelFilter, Metadata, Record, SetLoggerError};
use std::backtrace::Backtrace;
use std::fs::{create_dir_all, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

static LOG_FILE: Mutex<Option<File>> = Mutex::new(None);
static LOG_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

struct FileLogger;

impl log::Log for FileLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Debug
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
            let line = format!(
                "[{}] [{:<5}] [{}] {}\n",
                timestamp,
                record.level(),
                record.target(),
                record.args()
            );

            // Print to standard stderr/stdout
            eprint!("{}", line);

            // Write to file and flush immediately
            if let Ok(mut guard) = LOG_FILE.lock() {
                if let Some(file) = guard.as_mut() {
                    let _ = file.write_all(line.as_bytes());
                    let _ = file.flush();
                }
            }
        }
    }

    fn flush(&self) {
        if let Ok(mut guard) = LOG_FILE.lock() {
            if let Some(file) = guard.as_mut() {
                let _ = file.flush();
            }
        }
    }
}

static LOGGER: FileLogger = FileLogger;

/// Determine a reliable, writable log path across Windows, macOS, and Linux
fn resolve_log_path() -> PathBuf {
    // 1. Try AppData / LocalData / Config dir
    if let Some(mut base_dir) = dirs_next_custom() {
        base_dir.push("CoolMollier");
        base_dir.push("logs");
        if create_dir_all(&base_dir).is_ok() {
            return base_dir.join("coolmollier.log");
        }
    }

    // 2. Try adjacent to executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let log_dir = exe_dir.join("logs");
            if create_dir_all(&log_dir).is_ok() {
                return log_dir.join("coolmollier.log");
            }
            return exe_dir.join("coolmollier.log");
        }
    }

    // 3. Fallback to system temp directory
    std::env::temp_dir().join("coolmollier.log")
}

fn dirs_next_custom() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("APPDATA")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("LOCALAPPDATA").map(PathBuf::from))
            .or_else(|| std::env::var_os("USERPROFILE").map(|p| PathBuf::from(p).join(".coolmollier")))
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var_os("HOME").map(|h| PathBuf::from(h).join("Library").join("Logs"))
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config"))
    }
}

pub fn init_logger() -> Result<PathBuf, SetLoggerError> {
    // Force Rust to capture backtraces on panic
    if std::env::var("RUST_BACKTRACE").is_err() {
        std::env::set_var("RUST_BACKTRACE", "1");
    }

    let log_path = resolve_log_path();

    if let Some(parent) = log_path.parent() {
        let _ = create_dir_all(parent);
    }

    // Open or create log file in append mode
    if let Ok(file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        if let Ok(mut guard) = LOG_FILE.lock() {
            *guard = Some(file);
        }
        if let Ok(mut guard) = LOG_PATH.lock() {
            *guard = Some(log_path.clone());
        }
    }

    // Install global logger
    let res = log::set_logger(&LOGGER).map(|()| log::set_max_level(LevelFilter::Debug));

    // Install panic hook
    setup_panic_hook(log_path.clone());

    log::info!("============================================================");
    log::info!("CoolMollier Desktop Engine Iniciado");
    log::info!("Fecha / Hora: {}", Local::now().format("%Y-%m-%d %H:%M:%S"));
    log::info!("Ruta del archivo de log: {:?}", log_path);
    log::info!("Sistema Operativo: {} ({})", std::env::consts::OS, std::env::consts::ARCH);
    log::info!("============================================================");

    res.map(|_| log_path)
}

fn setup_panic_hook(log_path: PathBuf) {
    let default_hook = std::panic::take_hook();

    std::panic::set_hook(Box::new(move |panic_info| {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let backtrace = Backtrace::capture();

        let payload = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            (*s).to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic payload".to_string()
        };

        let location = if let Some(loc) = panic_info.location() {
            format!("{}:{}:{}", loc.file(), loc.line(), loc.column())
        } else {
            "unknown location".to_string()
        };

        let report = format!(
            "\n\n============================================================\n\
             FATAL CRASH / RUST PANIC DETECTED\n\
             Timestamp: {}\n\
             Location:  {}\n\
             Message:   {}\n\
             ------------------------------------------------------------\n\
             STACK BACKTRACE:\n\
             {}\n\
             ============================================================\n",
            timestamp, location, payload, backtrace
        );

        eprintln!("{}", report);

        // Append to main log file
        if let Ok(mut guard) = LOG_FILE.lock() {
            if let Some(file) = guard.as_mut() {
                let _ = file.write_all(report.as_bytes());
                let _ = file.flush();
            }
        }

        // Also write to a dedicated crash.log next to the log file and in temp
        let crash_path = log_path.with_file_name("coolmollier_crash.log");
        if let Ok(mut crash_file) = OpenOptions::new().create(true).append(true).open(&crash_path) {
            let _ = crash_file.write_all(report.as_bytes());
            let _ = crash_file.flush();
        }

        let temp_crash = std::env::temp_dir().join("coolmollier_crash.log");
        if let Ok(mut temp_file) = OpenOptions::new().create(true).append(true).open(&temp_crash) {
            let _ = temp_file.write_all(report.as_bytes());
            let _ = temp_file.flush();
        }

        // Call original hook as well (for stderr if available)
        default_hook(panic_info);
    }));
}

pub fn get_current_log_path() -> String {
    if let Ok(guard) = LOG_PATH.lock() {
        if let Some(p) = guard.as_ref() {
            return p.to_string_lossy().to_string();
        }
    }
    resolve_log_path().to_string_lossy().to_string()
}
