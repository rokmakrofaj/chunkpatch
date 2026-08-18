use std::fs;
use std::path::PathBuf;
use serde::Deserialize;
use crate::steam::Game;

#[derive(Deserialize)]
struct EpicManifest {
    #[serde(rename = "DisplayName")]
    display_name: String,
    #[serde(rename = "AppName")]
    app_name: String,
    #[serde(rename = "InstallLocation")]
    install_location: String,
    #[serde(rename = "AppVersionString")]
    app_version_string: Option<String>,
}

pub fn get_epic_games() -> Vec<Game> {
    let mut games = Vec::new();
    let manifests_path = PathBuf::from("C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests");
    
    if let Ok(entries) = fs::read_dir(manifests_path) {
        for entry in entries.flatten() {
            let file_name = entry.file_name().into_string().unwrap_or_default();
            if file_name.ends_with(".item") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if let Ok(manifest) = serde_json::from_str::<EpicManifest>(&content) {
                        let id = manifest.app_name.clone();
                        let title = manifest.display_name;
                        let install_location = manifest.install_location;
                        let build_id = manifest.app_version_string;
                        
                        if !id.is_empty() && !title.is_empty() {
                            let title_lower = title.to_lowercase();
                            let is_tool = title_lower.contains("engine")
                                || title_lower.contains("redistributable")
                                || title_lower.contains("prerequisites");
                                
                            if !is_tool {
                                games.push(Game {
                                    id,
                                    title,
                                    platform: "Epic Games".to_string(),
                                    icon_url: None, // No official CDN URL for Epic games like Steam has
                                    install_path: Some(install_location),
                                    last_played: None,
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
