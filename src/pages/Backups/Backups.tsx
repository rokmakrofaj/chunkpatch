import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import './Backups.css';

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

export default function Backups() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);

  useEffect(() => {
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
      } finally {
        setLoadingBackups(false);
      }
    }
    loadBackups();
  }, []);

  const handleDeleteBackup = async (installPath: string) => {
    if (!confirm("Bu yedeği silmek istediğinize emin misiniz? Silindiğinde yamayı kaldırırsanız oyun çalışmayabilir (dosyaları Steam/Epic üzerinden onarmanız gerekir).")) return;
    try {
      await invoke('delete_backup', { installPath });
      setBackups(prev => prev.filter(b => b.install_path !== installPath));
    } catch (e) {
      alert("Hata: " + e);
    }
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page-container backups-container">
      {/* Hero Section */}
      <div className="backups-hero" style={{ justifyContent: 'flex-start', alignItems: 'flex-start', gap: '24px' }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ padding: '10px 16px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Geri
        </button>
        
        <div className="hero-content" style={{ maxWidth: '100%' }}>
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Yedek Yöneticisi
          </h2>
          <p>
            Kurulan yamalardan arta kalan orijinal oyun yedeklerini yönetin. Gereksiz yedekleri silerek disk alanında yer açabilirsiniz.
          </p>
        </div>
      </div>

      <div className="backups-content">
        {loadingBackups ? (
          <div className="backups-empty">Yedekler taranıyor... Lütfen bekleyin.</div>
        ) : backups.length === 0 ? (
          <div className="backups-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>Hiçbir yedek dosyası bulunamadı. Diskiniz temiz!</p>
          </div>
        ) : (
          <div className="backups-grid">
            {backups.map(b => (
              <div key={b.install_path} className="backup-card">
                <div className="bc-header">
                  <div className="bc-title-area">
                    <h3>{b.name}</h3>
                    <span className="bc-badge">Orijinal Yedek</span>
                  </div>
                </div>

                <div className="bc-body">
                  <div className="bc-path">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span title={b.install_path}>{b.install_path}</span>
                  </div>
                  <div className="bc-size">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                    Disk Alanı: <strong>{formatBytes(b.size)}</strong>
                  </div>
                </div>

                <div className="bc-footer">
                  <button 
                    className="bc-delete-btn"
                    onClick={() => handleDeleteBackup(b.install_path)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Yedeği Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
