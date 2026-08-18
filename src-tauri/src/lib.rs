pub mod steam;
pub mod epic;
pub mod patcher;

use steam::Game;
use patcher::{download_and_install_patch, revert_patch, check_patch_status, get_backup_size, delete_backup};

#[tauri::command]
fn get_installed_games() -> Vec<Game> {
    let mut all_games = Vec::new();
    all_games.extend(steam::get_steam_games());
    all_games.extend(epic::get_epic_games());
    
    // De-duplicate games with the same ID (e.g. from both Steam and Epic? rare but possible)
    all_games.dedup_by(|a, b| a.id == b.id);
    
    all_games
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_installed_games,
            download_and_install_patch,
            revert_patch,
            check_patch_status,
            get_backup_size,
            delete_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
