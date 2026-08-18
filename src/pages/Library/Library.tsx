import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import './Library.css';

interface Game {
  id: string;
  title: string;
  platform: string;
  icon_url: string | null;
  build_id?: string;
}

interface CatalogGame {
  id: number;
  supported_build_id?: string;
}

export default function Library() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [catalog, setCatalog] = useState<CatalogGame[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const installedGames = await invoke<Game[]>('get_installed_games');
        setGames(installedGames);
        
        try {
          const res = await fetch('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/database.json');
          if (res.ok) {
            const data = await res.json();
            setCatalog(data);
          }
        } catch (e) {
          console.error('Failed to fetch catalog for health check:', e);
        }
      } catch (error) {
        console.error('Failed to load games:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="library-container">
      <h2 className="library-title">Kütüphaneniz</h2>
      
      {loading ? (
        <div className="library-loading">Oyunlar bilgisayarınızda taranıyor... Lütfen bekleyin.</div>
      ) : (
        <div className="games-grid">
          {games.map((game) => {
            // Find corresponding game in catalog
            const dbGame = catalog.find(g => g.id.toString() === game.id);
            // Default to warning if we can't verify, or true if matched
            let isWarning = false;
            
            if (dbGame && dbGame.supported_build_id && game.build_id) {
              isWarning = dbGame.supported_build_id !== game.build_id;
            } else if (dbGame && !game.build_id) {
              // If it's in the catalog but local game has no build_id, we can't be sure
              isWarning = true;
            } else if (!dbGame) {
              // Not in our catalog, so we don't have a patch for it anyway
              isWarning = false; 
            }

            return (
              <div 
                key={`${game.platform}-${game.id}`} 
                className="game-card"
                onClick={() => {
                  let p = game.platform.toLowerCase();
                  if (p === 'epic games') p = 'epic';
                  navigate(`/game/${p}/${game.id}`);
                }}
              >
                <div className="game-cover">
                  {game.icon_url ? (
                    <img src={game.icon_url} alt={game.title} loading="lazy" />
                  ) : (
                    <div className="game-cover-placeholder">
                      <span>{game.title.charAt(0)}</span>
                    </div>
                  )}
                  
                  <div className="game-badges-container">
                    <div className="game-platform-badge">{game.platform}</div>
                    <div className={`game-health-badge ${isWarning ? 'warning' : 'healthy'}`} title={isWarning ? "Oyun güncellenmiş olabilir, yama uyumsuzluk yapabilir." : "Yama sürümü ile oyun sürümü tamamen uyumlu."}>
                      {isWarning ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                          Riskli
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          Uyumlu
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="game-info">
                  <h3 className="game-name">{game.title}</h3>
                </div>
              </div>
            );
          })}
          {games.length === 0 && (
            <div className="no-games">Bilgisayarınızda hiç oyun bulunamadı veya yetki sorunu oluştu.</div>
          )}
        </div>
      )}
    </div>
  );
}
