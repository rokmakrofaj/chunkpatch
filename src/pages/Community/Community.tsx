import { useState, useEffect } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { fetchWithCache } from '../../utils/api';
import './Community.css';

interface CommunityPatch {
  game: string;
  game_id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  date: string;
  progress: number;
  platform: string;
  verified: boolean;
  download_url: string;
  cover: string;
}

export default function Community() {
  const [patches, setPatches] = useState<CommunityPatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatches() {
      try {
        const data = await fetchWithCache<CommunityPatch[]>('https://raw.githubusercontent.com/rokmakrofaj/ChunkPatch-Community-Assets/main/community-database.json');
        setPatches(data);
      } catch (err) {
        console.error("Topluluk verisi çekilemedi", err);
        setError("Topluluk yamaları yüklenirken bir sorun oluştu.");
      } finally {
        setLoading(false);
      }
    }
    fetchPatches();
  }, []);

  const handlePublishClick = async () => {
    await openUrl('https://github.com/rokmakrofaj/ChunkPatch-Community-Assets');
  };

  const handleDownloadClick = async (url: string) => {
    if (url) {
      await openUrl(url);
    }
  };

  return (
    <div className="page-container community-container">
      {/* Hero Section */}
      <div className="community-hero">
        <div className="hero-content">
          <h2>Topluluk Yamaları</h2>
          <p>
            Gönüllü çevirmenlerin hazırladığı, ChunkPatch ekosistemiyle uyumlu Türkçe yamaları keşfet. 
            Sen de kendi yamanı milyonlarla paylaşmak ister misin?
          </p>
        </div>
        <button className="publish-btn" onClick={handlePublishClick}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path></svg>
          Yamanı Yayınla
        </button>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="community-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="community-card skeleton-base" style={{ minHeight: '200px' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="community-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>{error}</p>
        </div>
      ) : patches.length === 0 ? (
        <div className="community-empty">
          <p>Henüz yayınlanmış bir topluluk yaması bulunmuyor. İlk sen ol!</p>
        </div>
      ) : (
        <div className="community-grid">
          {patches.map((patch, index) => (
            <div key={index} className="community-card">
              <div className="cc-header">
                <div className="cc-title-area">
                  <h3>{patch.name}</h3>
                  <span className="cc-game-badge">{patch.game}</span>
                </div>
                {patch.verified && (
                  <div className="cc-verified" title="Güvenilir Çevirmen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                )}
              </div>

              <p className="cc-desc">{patch.description}</p>
              
              <div className="cc-meta">
                <div className="cc-author">
                  <div className="author-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <span>{patch.author}</span>
                </div>
                <div className="cc-version">v{patch.version}</div>
                <div className="cc-platform">{patch.platform}</div>
              </div>

              <div className="cc-footer">
                <div className="cc-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${patch.progress}%` }}></div>
                  </div>
                  <span>%{patch.progress} Çeviri</span>
                </div>
                
                <button 
                  className="cc-download-btn" 
                  onClick={() => handleDownloadClick(patch.download_url)}
                  disabled={!patch.download_url}
                >
                  {patch.download_url ? 'İndir & İncele' : 'Link Yok'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
