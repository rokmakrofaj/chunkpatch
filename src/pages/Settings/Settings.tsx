import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { openUrl } from '@tauri-apps/plugin-opener';
import './Settings.css';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';

interface BackupItem {
  id: string;
  name: string;
  size: number;
  install_path: string;
}

interface InstalledGame {
  id: string;
  title: string;
  install_path?: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState<string>('Bilinmiyor');
  const [tauriUpdate, setTauriUpdate] = useState<Update | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'uptodate' | 'error' | 'downloading'>('idle');
  
  // Theme Color State
  const [primaryColor, setPrimaryColor] = useState<string>('#ffac00');

  // Backup State
  const [backups, setBackups] = useState<BackupItem[]>([]);

  useEffect(() => {
    // Load current app version
    async function init() {
      try {
        const ver = await getVersion();
        setAppVersion(`v${ver}`);
      } catch (e) {
        setAppVersion('v0.1.0');
      }
    }
    init();

    // Load saved color
    const savedColor = localStorage.getItem("chunkpatch_color");
    if (savedColor) {
      setPrimaryColor(savedColor);
    }

    // Load Backups
    async function loadBackups() {
      try {
        const games = await invoke<InstalledGame[]>('get_installed_games');
        const backupList: BackupItem[] = [];
        for (const g of games) {
          if (g.install_path) {
            const size = await invoke<number>('get_backup_size', { installPath: g.install_path });
            if (size > 0) {
              backupList.push({ id: g.id, name: g.title, size, install_path: g.install_path });
            }
          }
        }
        setBackups(backupList);
      } catch (e) {
        console.error("Yedekler yüklenirken hata:", e);
      }
    }
    loadBackups();
  }, []);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setPrimaryColor(newColor);
    document.documentElement.style.setProperty('--color-primary', newColor);
    localStorage.setItem("chunkpatch_color", newColor);
  };

  const handleResetColor = () => {
    const defaultColor = '#ffac00';
    setPrimaryColor(defaultColor);
    document.documentElement.style.setProperty('--color-primary', defaultColor);
    localStorage.removeItem("chunkpatch_color");
  };

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      const update = await check();
      if (update) {
        setTauriUpdate(update);
        setUpdateStatus('available');
      } else {
        setUpdateStatus('uptodate');
      }
    } catch (e) {
      console.error("Update check failed", e);
      setUpdateStatus('error');
    }
  };

  const handleDownloadUpdate = async () => {
    if (tauriUpdate) {
      setUpdateStatus('downloading');
      try {
        let downloaded = 0;
        await tauriUpdate.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              break;
            case 'Finished':
              break;
          }
        });
        await relaunch();
      } catch (e) {
        console.error("Install failed", e);
        setUpdateStatus('error');
      }
    }
  };

  return (
    <div className="page-container settings-container">
      <div className="settings-header">
        <h2>Ayarlar</h2>
        <p>Uygulama tercihlerinizi ve güncellemeleri buradan yönetebilirsiniz.</p>
      </div>

      <div className="settings-grid">
        {/* Appearance Settings */}
        <div className="settings-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
          </div>
          <h3>Görünüm</h3>
          <p>Uygulama arayüzünü kişiselleştirin.</p>
          
          <div className="setting-item">
            <label>Tema Vurgu Rengi</label>
            <div className="color-picker-wrapper">
              <input 
                id="primary-color-picker"
                name="primary-color-picker"
                type="color" 
                value={primaryColor} 
                onChange={handleColorChange}
                className="color-picker"
              />
              <span className="color-hex">{primaryColor.toUpperCase()}</span>
              {primaryColor !== '#ffac00' && (
                <button className="reset-btn" onClick={handleResetColor}>Varsayılana Dön</button>
              )}
            </div>
          </div>
        </div>

        {/* Update Settings */}
        <div className="settings-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          </div>
          <h3>Güncellemeler</h3>
          <p>Mevcut Sürüm: <strong>{appVersion}</strong></p>
          
          {updateStatus !== 'available' && updateStatus !== 'downloading' && (
            <div className="setting-action">
              <button 
                className={`action-btn ${updateStatus === 'checking' ? 'loading' : ''}`} 
                onClick={checkForUpdates}
                disabled={updateStatus === 'checking'}
              >
                {updateStatus === 'checking' ? 'Kontrol Ediliyor...' : 'Kontrol Et'}
              </button>
            </div>
          )}

          {updateStatus === 'uptodate' && (
            <div className="update-notice success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>Uygulamanız güncel!</span>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="update-notice error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Bağlantı hatası oluştu.</span>
            </div>
          )}

          {updateStatus === 'downloading' && (
            <div className="update-notice success">
              <div className="spinner" style={{ width: '16px', height: '16px', marginBottom: '0', marginRight: '8px' }}></div>
              <span>İndiriliyor ve Kuruluyor... Lütfen bekleyin.</span>
            </div>
          )}

          {updateStatus === 'available' && tauriUpdate && (
            <div className="update-box">
              <h4>Yeni Sürüm Bulundu! (v{tauriUpdate.version})</h4>
              <p className="update-notes">{tauriUpdate.body}</p>
              <button className="download-btn" onClick={handleDownloadUpdate}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Şimdi İndir ve Kur
              </button>
            </div>
          )}
        </div>

        {/* About */}
        <div className="settings-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <h3>Hakkında</h3>
          <p>ChunkPatch, Türkçe yama kurmanızı kolaylaştıran modern bir platformdur.</p>
          <div className="about-links">
            <a href="https://github.com/rokmakrofaj/chunkpatch" target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); openUrl('https://github.com/rokmakrofaj/chunkpatch'); }}>
              GitHub Deposu
            </a>
            <a href="https://github.com/rokmakrofaj/chunkpatch/issues" target="_blank" rel="noreferrer" onClick={(e) => { e.preventDefault(); openUrl('https://github.com/rokmakrofaj/chunkpatch/issues'); }}>
              Hata Bildir
            </a>
          </div>
        </div>
        
        {/* Backup Manager */}
        <div className="settings-card">
          <div className="card-icon" style={{ background: 'rgba(255, 60, 60, 0.2)', color: '#ff3c3c' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </div>
          <h3>Yedekler</h3>
          <p>Kurulan yamalardan arta kalan orijinal oyun yedeklerini yönetin. Gereksiz yedekleri silerek disk alanında yer açabilirsiniz.</p>
          <div className="setting-action">
            <button className="action-btn" onClick={() => navigate('/backups')}>
              Yedekleri Yönet {backups.length > 0 ? `(${backups.length})` : ''}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
