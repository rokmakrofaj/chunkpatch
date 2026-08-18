use std::fs;
use std::io::{self, Cursor};
use std::path::{Path, PathBuf};
use tauri::command;

fn backup_file(original_path: &Path, backup_dir: &Path, relative_path: &Path) -> io::Result<()> {
    if original_path.exists() {
        let backup_path = backup_dir.join(relative_path);
        
        // Create parent directories for backup
        if let Some(parent) = backup_path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        // Only backup if we haven't backed it up before
        if !backup_path.exists() {
            fs::copy(original_path, &backup_path)?;
        }
    }
    Ok(())
}

#[command]
pub fn check_patch_status(install_path: String) -> Option<String> {
    let install_dir = PathBuf::from(&install_path);
    let backup_dir = install_dir.join("chunkpatch_backups");
    let version_file = backup_dir.join("patch_version.txt");
    
    if backup_dir.exists() {
        if version_file.exists() {
            if let Ok(version) = fs::read_to_string(&version_file) {
                return Some(version.trim().to_string());
            }
        }
        // If backup exists but no version file (e.g. installed before this update), return a generic version or empty string
        return Some("unknown".to_string());
    }
    None
}

#[command]
pub fn download_and_install_patch(url: String, install_path: String, version: String) -> Result<String, String> {
    // Güvenlik: Sadece güvenilir kaynaklardan indirmeye izin ver
    let allowed_hosts = ["github.com", "raw.githubusercontent.com", "objects.githubusercontent.com"];
    let parsed_url = url::Url::parse(&url)
        .map_err(|_| "Geçersiz URL formatı".to_string())?;
    let host = parsed_url.host_str()
        .ok_or_else(|| "URL'de host bulunamadı".to_string())?;
    if !allowed_hosts.iter().any(|&allowed| host == allowed || host.ends_with(&format!(".{}", allowed))) {
        return Err(format!("Güvenlik: '{}' güvenilir bir kaynak değil", host));
    }
    if parsed_url.scheme() != "https" {
        return Err("Güvenlik: Sadece HTTPS bağlantıları kabul edilir".to_string());
    }

    let install_dir = PathBuf::from(&install_path);
    if !install_dir.exists() {
        return Err(format!("Oyun klasörü bulunamadı: {}", install_path));
    }

    let backup_dir = install_dir.join("chunkpatch_backups");
    
    // Download the ZIP file
    let response = reqwest::blocking::get(&url)
        .map_err(|e| format!("İndirme hatası: {}", e))?;
    
    // Güvenlik: İndirme boyutu kontrolü (maks 500MB)
    const MAX_DOWNLOAD_SIZE: u64 = 500 * 1024 * 1024;
    if let Some(content_length) = response.content_length() {
        if content_length > MAX_DOWNLOAD_SIZE {
            return Err(format!("Dosya çok büyük: {} bytes (maksimum: {} bytes)", content_length, MAX_DOWNLOAD_SIZE));
        }
    }
        
    let bytes = response.bytes()
        .map_err(|e| format!("Dosya okuma hatası: {}", e))?;
    
    // Belleğe yüklenen boyutu da kontrol et
    if bytes.len() as u64 > MAX_DOWNLOAD_SIZE {
        return Err(format!("İndirilen dosya çok büyük: {} bytes", bytes.len()));
    }
        
    let reader = Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(reader)
        .map_err(|e| format!("Zip okuma hatası: {}", e))?;

    let mut extracted_count = 0;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Zip dosya okuma hatası: {}", e))?;
        let outpath = match file.enclosed_name() {
            Some(path) => install_dir.join(path),
            None => continue,
        };
        
        let relative_path = match file.enclosed_name() {
            Some(path) => path.to_owned(),
            None => continue,
        };

        // Güvenlik: Path traversal kontrolü
        if relative_path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
            eprintln!("Güvenlik uyarısı: Dizin dışı dosya atlandı: {:?}", relative_path);
            continue;
        }

        if file.is_dir() {
            // It's a directory
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            // It's a file
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            
            // Backup existing file (Yöntem A)
            if let Err(e) = backup_file(&outpath, &backup_dir, &relative_path) {
                println!("Yedekleme hatası: {}", e);
            }

            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            extracted_count += 1;
        }
    }

    // Save the installed version
    if !backup_dir.exists() {
        let _ = fs::create_dir_all(&backup_dir);
    }
    let version_file = backup_dir.join("patch_version.txt");
    if let Err(e) = fs::write(&version_file, version) {
        println!("Sürüm numarası kaydedilemedi: {}", e);
    }

    Ok(format!("Yama başarıyla kuruldu. {} dosya çıkarıldı.", extracted_count))
}

#[command]
pub fn revert_patch(install_path: String) -> Result<String, String> {
    let install_dir = PathBuf::from(&install_path);
    let backup_dir = install_dir.join("chunkpatch_backups");
    
    if !backup_dir.exists() {
        return Err("Yedek klasörü bulunamadı. Geri alınacak bir yama yok.".to_string());
    }

    // Recursively restore files from backup_dir to install_dir
    let mut restored_count = 0;
    let mut dirs_to_visit = vec![backup_dir.clone()];
    
    while let Some(current_dir) = dirs_to_visit.pop() {
        if let Ok(entries) = fs::read_dir(&current_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    dirs_to_visit.push(path);
                } else if path.is_file() {
                    if let Ok(relative_path) = path.strip_prefix(&backup_dir) {
                        let original_path = install_dir.join(relative_path);
                        
                        if fs::copy(&path, &original_path).is_ok() {
                            restored_count += 1;
                        }
                    }
                }
            }
        }
    }
    
    // Once restored, delete backup folder
    let _ = fs::remove_dir_all(&backup_dir);
    
    Ok(format!("Yama başarıyla geri alındı. {} dosya onarıldı.", restored_count))
}

#[command]
pub fn get_backup_size(install_path: String) -> Result<u64, String> {
    let backup_dir = PathBuf::from(&install_path).join("chunkpatch_backups");
    if !backup_dir.exists() {
        return Ok(0);
    }
    
    let mut size = 0;
    let mut dirs_to_visit = vec![backup_dir];
    
    while let Some(dir) = dirs_to_visit.pop() {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                if path.is_dir() {
                    dirs_to_visit.push(path);
                } else if let Ok(metadata) = fs::metadata(&path) {
                    size += metadata.len();
                }
            }
        }
    }
    Ok(size)
}

#[command]
pub fn delete_backup(install_path: String) -> Result<String, String> {
    let backup_dir = PathBuf::from(&install_path).join("chunkpatch_backups");
    if !backup_dir.exists() {
        return Err("Yedek klasörü bulunamadı.".to_string());
    }
    
    fs::remove_dir_all(&backup_dir)
        .map_err(|e| format!("Yedek silinirken hata oluştu: {}", e))?;
        
    Ok("Yedek başarıyla silindi ve disk alanı açıldı.".to_string())
}
