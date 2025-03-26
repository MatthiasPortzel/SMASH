use std::path::PathBuf;
use std::str::FromStr;

use resolve_path::PathResolveExt;

#[tauri::command]
// path is a user-input relative path, e.g. the argument to `cd`
fn resolve_path(path: &str, cwd: &str) -> String {
    let new_path = PathBuf::from_str(path).expect("Path isn't a path, unreachable").resolve_in(cwd).to_path_buf();

    if let Ok(new_cwd) = new_path.canonicalize() {
        return new_cwd.into_os_string().into_string().expect("Unreachable none-Unicode path");
    }else {
        // TODO, need a real error case
        // Error if the directory doesn't exist.
        return "Directory doesn't exist or you don't have permission to read it".to_string();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![resolve_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
