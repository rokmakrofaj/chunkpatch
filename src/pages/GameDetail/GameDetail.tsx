import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import './GameDetail.css';

interface Game {
  id: string;
  title: string;
  platform: string;
  icon_url: string | null;
  install_path?: string;
  last_played?: number;
}

interface PatchData {
  id: number;
  slug: string;
  name: string;
  version: string;
  description?: string;
  translator?: string;
  release_date?: string;
  platforms: {
    [key: string]: {
      name: string;
      url: string;
    }
  }
}

export default function GameDetail() {
  const { platform, id } = useParams();
  const navigate = useNavigate();
  
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Patch State
  const [patchData, setPatchData] = useState<PatchData | null>(null);
  const [patchUrl, setPatchUrl] = useState<string | null>(null);
  const [patchVersion, setPatchVersion] = useState<string | null>(null);
  const [patchStatus, setPatchStatus] = useState<'none' | 'idle' | 'working'>('none');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);

  useEffect(() => {
    setStatusMessage(''); // Clear previous status message when switching games
    async function fetchGames() {
      try {
        const installedGames = await invoke<Game[]>('get_installed_games');
        setGames(installedGames);
        
        const found = installedGames.find(g => {
          let p = g.platform.toLowerCase();
          if (p === 'epic games') p = 'epic';
          return g.id === id && p === platform;
        });
        if (found) {
          setCurrentGame(found);
          
          // Fetch Patch Database
          try {
            const res = await fetch('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/database.json');
            const db: PatchData[] = await res.json();
            const dbEntry = db.find(p => p.id.toString() === found.id);
            
            if (dbEntry) {
              setPatchData(dbEntry);
              let pKey = found.platform.toLowerCase();
              if (pKey === 'epic games') pKey = 'epic';
              
              if (dbEntry.platforms[pKey]) {
                setPatchUrl(dbEntry.platforms[pKey].url);
                setPatchVersion(dbEntry.version);
                setPatchStatus('idle');
                
                // Check if already installed
                if (found.install_path) {
                  try {
                    const version = await invoke<string | null>('check_patch_status', { 
                      installPath: found.install_path 
                    });
                    if (version) {
                      setIsInstalled(true);
                      setInstalledVersion(version);
                    } else {
                      setIsInstalled(false);
                      setInstalledVersion(null);
                    }
                  } catch(e) {
                    console.error(e);
                  }
                }
              } else {
                setPatchUrl(null);
                setPatchVersion(null);
                setPatchStatus('none');
              }
            } else {
                setPatchUrl(null);
                setPatchVersion(null);
                setPatchStatus('none');
            }
          } catch(e) {
            console.error("DB Fetch error", e);
          }
        }
      } catch (error) {
        console.error('Failed to load games:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, [id, platform]);

  const handlePlay = async () => {
    if (!currentGame) return;
    
    try {
      if (currentGame.platform === 'Steam') {
        await openUrl(`steam://rungameid/${currentGame.id}`);
      } else if (currentGame.platform === 'Epic Games') {
        await openUrl(`com.epicgames.launcher://apps/${currentGame.id}?action=launch&silent=true`);
      }
    } catch (e) {
      console.error("Failed to launch game:", e);
      alert("Oyunu başlatırken bir hata oluştu.");
    }
  };

  const handleInstallPatch = async () => {
    if (!patchUrl || !currentGame?.install_path || !patchVersion) {
      alert("Kurulum yolu veya yama bilgisi bulunamadı!");
      return;
    }
    setPatchStatus('working');
    setStatusMessage('Yama indiriliyor ve kuruluyor...');
    try {
      const msg = await invoke<string>('download_and_install_patch', { 
        url: patchUrl, 
        installPath: currentGame.install_path,
        version: patchVersion
      });
      setStatusMessage(msg);
      setPatchStatus('idle');
      setIsInstalled(true);
      setInstalledVersion(patchVersion);
    } catch(e: any) {
      alert("Kurulum hatası: " + e);
      setPatchStatus('idle');
      setStatusMessage('');
    }
  };

  const handleRevertPatch = async () => {
    if (!currentGame?.install_path) return;
    setPatchStatus('working');
    setStatusMessage('Yama siliniyor, orijinal dosyalar onarılıyor...');
    try {
      const msg = await invoke<string>('revert_patch', { 
        installPath: currentGame.install_path 
      });
      setStatusMessage(msg);
      setPatchStatus('idle');
      setIsInstalled(false);
      setInstalledVersion(null);
    } catch(e: any) {
      alert("Silme hatası: " + e);
      setPatchStatus('idle');
      setStatusMessage('');
    }
  };

  if (loading) {
    return <div className="game-detail-loading">Oyun verileri yükleniyor...</div>;
  }

  if (!currentGame) {
    return <div className="game-detail-error">Oyun bulunamadı!</div>;
  }

  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const heroUrl = currentGame.platform === 'Steam' 
    ? `https://steamcdn-a.akamaihd.net/steam/apps/${currentGame.id}/library_hero.jpg` 
    : null;

  return (
    <div className="game-detail-container">
      <div className="game-detail-sidebar">
        <div className="sidebar-search">
          <input 
            id="library-search"
            name="library-search"
            type="text" 
            placeholder="Arama..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sidebar-list">
          {filteredGames.map((g) => {
            let p = g.platform.toLowerCase();
            if (p === 'epic games') p = 'epic';
            
            return (
              <div 
                key={`${g.platform}-${g.id}`} 
                className={`sidebar-item ${g.id === id && p === platform ? 'active' : ''}`}
                onClick={() => navigate(`/game/${p}/${g.id}`)}
              >
                <div className="sidebar-item-icon">
                   {g.icon_url ? <img src={g.icon_url} alt="" /> : <span>{g.title.charAt(0)}</span>}
                </div>
                <span className="sidebar-item-title">{g.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="game-detail-content">
        <div className="hero-banner">
          {heroUrl ? (
            <img src={heroUrl} alt="Hero" className="hero-image" />
          ) : (
            <div className="hero-placeholder"></div>
          )}
          
          <div className="hero-overlay">
            <h1 className="hero-title">{currentGame.title}</h1>
            <div className="hero-actions">
              <button className="play-button" onClick={handlePlay} disabled={patchStatus === 'working'}>
                <span>OYNA</span>
              </button>

              {patchStatus !== 'none' && (
                <div className="patch-actions">
                  {isInstalled ? (
                    <button className="patch-btn patch-primary" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      Yama Kurulu
                    </button>
                  ) : (
                    <button className="patch-btn patch-primary" onClick={handleInstallPatch} disabled={patchStatus === 'working'}>
                      {patchStatus === 'working' ? 'İşleniyor...' : 'Yama Kur'}
                    </button>
                  )}
                  {isInstalled && installedVersion !== patchVersion && (
                    <button className="patch-btn patch-warning" onClick={handleInstallPatch} disabled={patchStatus === 'working'}>
                      Güncelle
                    </button>
                  )}
                  <button className="patch-btn patch-danger" onClick={handleRevertPatch} disabled={patchStatus === 'working' || !isInstalled}>Sil</button>
                </div>
              )}

              <div className="play-info">
                {statusMessage ? (
                  <div className="info-box">
                    <span className="info-label" style={{ color: 'var(--color-primary)' }}>DURUM</span>
                    <span className="info-value">{statusMessage}</span>
                  </div>
                ) : (
                  <>
                    <div className="info-box">
                      <span className="info-label">SON OYNANMA</span>
                      <span className="info-value">
                        {currentGame.last_played && currentGame.last_played > 0
                          ? new Date(currentGame.last_played * 1000).toLocaleDateString('tr-TR')
                          : 'Henüz Oynanmadı'}
                      </span>
                    </div>
                    <div className="info-box">
                      <span className="info-label">OYNAMA SÜRESİ</span>
                      <span className="info-value">Gizli / API Yok</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="content-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          
          <div className="activity-feed">
            <h2>Yama Geçmişi ve Etkinlikler</h2>
            
            {patchData ? (
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">{patchData.release_date || 'Yakın Zamanda'}</span>
                    <h3>v{patchData.version} Güncellemesi Yayınlandı</h3>
                    <p>{patchData.name} için resmi Türkçe çeviri tamamlandı ve yama sunucularında yerini aldı! {patchData.description}</p>
                    <div className="timeline-tags">
                      <span className="tag">Çevirmen: {patchData.translator || 'Topluluk'}</span>
                      <span className="tag tag-success">%100 Tamamlandı</span>
                    </div>
                  </div>
                </div>
                {/* Geçmiş Sürüm (Görsellik için eklendi) */}
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: 'rgba(255,255,255,0.2)', boxShadow: 'none' }}></div>
                  <div className="timeline-content">
                    <span className="timeline-date">Geçmiş</span>
                    <h3>Proje Duyuruldu</h3>
                    <p>Çeviri projesinin altyapısı hazırlandı ve ilk metinler çevrilmeye başlandı.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-patch-info">
                <p>Bu oyun için sistemimizde kayıtlı resmi bir ChunkPatch yaması bulunmuyor. Topluluk atölyesini kontrol edebilir veya istekte bulunabilirsiniz.</p>
              </div>
            )}
          </div>

          <div className="game-info-sidebar">
            <h2>Oyun Hakkında</h2>
            {patchData ? (
              <div className="info-card">
                <p style={{ margin: 0 }}>{patchData.description || 'Bu oyun için henüz bir açıklama girilmemiş.'}</p>
                <div className="info-row">
                  <span>Sürüm:</span>
                  <strong>{patchData.version}</strong>
                </div>
                <div className="info-row">
                  <span>Destek:</span>
                  <strong>{currentGame.platform}</strong>
                </div>
              </div>
            ) : (
              <div className="info-card">
                <p>Sisteminizde yüklü olan bu oyun şu an desteklenen resmi yamalar arasında yer almıyor.</p>
              </div>
            )}
            
            {/* Fake screenshots grid for visual flair */}
            <h3 style={{ marginTop: '32px', fontSize: '18px', marginBottom: '16px' }}>Oyun Görselleri</h3>
            <div className="fake-screenshots">
               <div className="screenshot" style={{ backgroundImage: `url(https://steamcdn-a.akamaihd.net/steam/apps/${currentGame.id}/page_bg_generated_v6b.jpg)` }}></div>
               <div className="screenshot" style={{ backgroundImage: `url(https://steamcdn-a.akamaihd.net/steam/apps/${currentGame.id}/library_hero.jpg)` }}></div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
