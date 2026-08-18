use std::fs;
use std::path::{Path, PathBuf};
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub platform: String,
    pub icon_url: Option<String>,
    pub install_path: Option<String>,
    pub last_played: Option<u64>,
    pub build_id: Option<String>,
}

use std::collections::HashSet;

pub fn get_steam_games() -> Vec<Game> {
    let mut games = Vec::new();
    let mut seen_appids = HashSet::new();
    
    // 1. Get Steam Path from Registry
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let steam_path: String = match hkcu.open_subkey("Software\\Valve\\Steam") {
        Ok(key) => match key.get_value("SteamPath") {
            Ok(path) => path,
            Err(_) => return games,
        },
        Err(_) => return games,
    };
    
    let steam_path = steam_path.replace("/", "\\");
    let library_vdf = Path::new(&steam_path).join("steamapps").join("libraryfolders.vdf");
    let mut library_paths = vec![PathBuf::from(&steam_path)];
    
    // 2. Read libraryfolders.vdf
    if let Ok(content) = fs::read_to_string(&library_vdf) {
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("\"path\"") {
                let parts: Vec<&str> = line.split('"').collect();
                if parts.len() >= 4 {
                    let path_str = parts[3].replace("\\\\", "\\");
                    let p = PathBuf::from(path_str);
                    if !library_paths.contains(&p) {
                        library_paths.push(p);
                    }
                }
            }
        }
    }
    
    // 3. For each library path, find appmanifest_*.acf
    for mut lib_path in library_paths {
        lib_path.push("steamapps");
        if let Ok(entries) = fs::read_dir(&lib_path) {
            for entry in entries.flatten() {
                let file_name = entry.file_name().into_string().unwrap_or_default();
                if file_name.starts_with("appmanifest_") && file_name.ends_with(".acf") {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        let mut appid = String::new();
                        let mut name = String::new();
                        let mut installdir = String::new();
                        let mut last_played: Option<u64> = None;
                        let mut build_id: Option<String> = None;
                        
                        for line in content.lines() {
                            let line = line.trim();
                            if line.starts_with("\"appid\"") {
                                let parts: Vec<&str> = line.split('"').collect();
                                if parts.len() >= 4 {
                                    appid = parts[3].to_string();
                                }
                            } else if line.starts_with("\"name\"") {
                                let parts: Vec<&str> = line.split('"').collect();
                                if parts.len() >= 4 {
                                    name = parts[3].to_string();
                                }
                            } else if line.starts_with("\"installdir\"") {
                                let parts: Vec<&str> = line.split('"').collect();
                                if parts.len() >= 4 {
                                    installdir = parts[3].to_string();
                                }
                            } else if line.starts_with("\"LastPlayed\"") {
                                let parts: Vec<&str> = line.split('"').collect();
                                if parts.len() >= 4 {
                                    last_played = parts[3].parse::<u64>().ok();
                                }
                            } else if line.starts_with("\"buildid\"") {
                                let parts: Vec<&str> = line.split('"').collect();
                                if parts.len() >= 4 {
                                    build_id = Some(parts[3].to_string());
                                }
                            }
                        }
                        
                        if !appid.is_empty() && !name.is_empty() {
                            let name_lower = name.to_lowercase();
                            let is_tool = name_lower.contains("redistributable")
                                || name_lower.contains("server")
                                || name_lower.contains("proton")
                                || name_lower.contains("runtime")
                                || name_lower.contains("sdk")
                                || name_lower.contains("dedicated")
                                || name_lower.contains("test")
                                || name_lower.contains("tool")
                                || name_lower.contains("base");
                                
                            if !is_tool && !seen_appids.contains(&appid) {
                                seen_appids.insert(appid.clone());
                                // Use Steam CDN for cover art
                                let cover_url = format!("https://steamcdn-a.akamaihd.net/steam/apps/{}/library_600x900.jpg", appid);
                                let full_install_path = lib_path.join("common").join(&installdir).to_string_lossy().to_string();
                                
                                games.push(Game {
                                    id: appid,
                                    title: name,
                                    platform: "Steam".to_string(),
                                    icon_url: Some(cover_url),
                                    install_path: Some(full_install_path),
                                    last_played,
                                    build_id,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    games
}
