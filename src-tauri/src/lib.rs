// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// --- NOWA FUNKCJA DO TERMINALA ---
#[tauri::command]
fn run_command(command: &str, current_dir: &str) -> Result<String, String> {
    use std::process::Command;

    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", command])
            .current_dir(current_dir)
            .output()
    } else {
        Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(current_dir)
            .output()
    };

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            if output.status.success() {
                Ok(stdout)
            } else {
                let mut err_msg = stderr;
                if err_msg.trim().is_empty() {
                    err_msg = stdout;
                }
                Err(err_msg)
            }
        }
        Err(e) => Err(format!("Failed to execute process: {}", e)),
    }
}
// ---------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // DODANO: run_command!
        .invoke_handler(tauri::generate_handler![greet, run_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
