import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { fetchWithCache } from '../../utils/api';
import './Catalog.css';

interface CatalogGame {
  id: number;
  slug: string;
  name: string;
  version: string;
  cover: string;
  bg: string;
  description: string;
  translator: string;
  release_date: string;
  platforms: {
    [key: string]: {
      name: string;
      url: string;
    }
  }
}

interface InstalledGame {
  id: string;
  title: string;
  platform: string;
  icon_url: string | null;
  install_path?: string;
}

export default function Catalog() {
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [installedGames, setInstalledGames] = useState<InstalledGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<CatalogGame | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch official catalog patches using cache
        const data = await fetchWithCache<CatalogGame[]>('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/database.json');
        setGames(data);
        
        // Fetch installed games to know if auto-install is possible
        const installed = await invoke<InstalledGame[]>('get_installed_games');
        setInstalledGames(installed);
      } catch (err) {
        console.error("Katalog verisi çekilemedi", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery) || 
    game.translator.toLowerCase().includes(searchQuery)
  );


  return (
    <div className="page-container catalog-container">
      <div className="catalog-header">
        <h2>Katalog Vitrini</h2>
        <p>Desteklenen tüm resmi Türkçe yamalar burada. Keşfetmeye başla.</p>
      </div>

      {loading ? (
        <div className="catalog-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="catalog-card skeleton-base"></div>
          ))}
        </div>
      ) : (
        <div className="catalog-grid">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <div 
                key={game.id} 
                className="catalog-card"
                onClick={() => setSelectedGame(game)}
              >
                <img src={game.cover} alt={game.name} className="catalog-cover" />
                
                <div className="catalog-overlay">
                  <div className="catalog-info">
                    <h3>{game.name}</h3>
                    <div className="catalog-meta">
                      <span className="catalog-translator">{game.translator}</span>
                      <span className="catalog-version">v{game.version}</span>
                    </div>
                  </div>
                  <button className="catalog-inspect-btn">
                    İncele
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="catalog-empty">
              <p>"{searchQuery}" aramasına uygun yama bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {/* Game Detail Modal */}
      {selectedGame && (
        <div className="catalog-modal-backdrop" onClick={() => setSelectedGame(null)}>
          <div className="catalog-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-actions">
              <button className="modal-back" onClick={() => setSelectedGame(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Geri
              </button>
              <button className="modal-close" onClick={() => setSelectedGame(null)}>✕</button>
            </div>
            
            <div className="catalog-modal-hero" style={{ backgroundImage: `url(https://steamcdn-a.akamaihd.net/steam/apps/${selectedGame.id}/library_hero.jpg), url(${selectedGame.bg})` }}>
              <h2>{selectedGame.name}</h2>
            </div>
            
            <div className="catalog-modal-content">
              <div className="catalog-modal-meta">
                <span className="badge">Çevirmen: {selectedGame.translator}</span>
                <span className="badge">Sürüm: {selectedGame.version}</span>
                <span className="badge">Tarih: {selectedGame.release_date}</span>
              </div>
              
              <p className="catalog-modal-desc">{selectedGame.description}</p>
              
              <div className="catalog-modal-downloads">
                <h3>Yama Kurulum Seçenekleri</h3>
                <div className="download-buttons">
                  {/* Otomatik Kurulum Kontrolü */}
                  {(() => {
                    const localGames = installedGames.filter(g => g.id === selectedGame.id.toString());
                    if (localGames.length > 0) {
                      return localGames.map((localGame, idx) => {
                        let platformPath = localGame.platform.toLowerCase();
                        if (platformPath === 'epic games') platformPath = 'epic';
                        return (
                          <button 
                            key={`auto-${platformPath}-${idx}`}
                            className="download-btn auto-install-btn"
                            onClick={() => {
                              navigate(`/game/${platformPath}/${selectedGame.id}`);
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            {localGame.platform} İçin Otomatik Kur (Yüklü)
                          </button>
                        );
                      });
                    } else {
                      return (
                        <div className="not-installed-warning">
                          Bu oyun sisteminde yüklü bulunamadı. Otomatik yama kurulumu yapılamaz.
                        </div>
                      );
                    }
                  })()}

                  <div className="manual-links-section">
                    <h4 className="manual-title">Yamayı Manuel İndir veya İncele (Tarayıcıda)</h4>
                    <div className="manual-buttons">
                      {/* Tek bir genel Sürüm Sayfası Butonu */}
                      {(() => {
                        const platforms = Object.values(selectedGame.platforms || {});
                        if (platforms.length > 0) {
                          const firstUrl = platforms[0].url;
                          if (firstUrl.includes('/releases/download/')) {
                            const parts = firstUrl.split('/releases/download/');
                            const tag = parts[1].split('/')[0];
                            const releaseUrl = `${parts[0]}/releases/tag/${tag}`;
                            return (
                              <button 
                                className="download-btn manual-btn"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                onClick={() => openUrl(releaseUrl)}
                                title="Yamanın kaynak sayfasına ve yama notlarına gider"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                GitHub Sürüm Notları
                              </button>
                            );
                          }
                        }
                        return null;
                      })()}

                      {/* Her platform için doğrudan .zip indirme butonları */}
                      {Object.entries(selectedGame.platforms || {}).map(([key, p]) => (
                        <button 
                          key={key} 
                          className="download-btn manual-btn"
                          onClick={() => openUrl(p.url)}
                          title={`${p.name} için doğrudan zip dosyasını indirir`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          {p.name} İndir (.zip)
                        </button>
                      ))}
                      
                      {!selectedGame.platforms && <p>Bağlantı bulunamadı.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
