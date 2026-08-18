import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { fetchWithCache } from '../../utils/api';
import './Home.css';

interface CatalogGame { id: number; name: string; bg: string; cover?: string; description: string; badge?: string; }
interface InstalledGame { id: string; title: string; platform: string; bg_url?: string; cover_url?: string; }
interface NewsItem { title: string; date: string; }
interface CommunityPatch { name: string; author: string; progress: number; }

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [heroGame, setHeroGame] = useState<CatalogGame | null>(null);
  const [installed, setInstalled] = useState<InstalledGame[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [community, setCommunity] = useState<CommunityPatch[]>([]);
  const [trending, setTrending] = useState<CatalogGame[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // 1. Hero Game (Öne Çıkan Yama / Günün Yaması)
        let featured: CatalogGame | null = null;
        try {
          // Önce GitHub'daki featured.json dosyasını çekmeyi dene
          const featData = await fetchWithCache<CatalogGame>('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/featured.json');
          if (featData && featData.id) featured = featData;
        } catch (e) {
          console.log("featured.json henüz GitHub'a yüklenmemiş veya bulunamadı. Otomatik yedeğe (database.json) geçiliyor.");
        }

        // Eğer featured.json yoksa (hata verdiyse) database.json'daki ilk oyunu otomatik seç
        if (!featured) {
          const dbData = await fetchWithCache<CatalogGame[]>('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/database.json');
          if (dbData && dbData.length > 0) featured = dbData[0];
        }
        
        setHeroGame(featured);

        // 2. Kütüphane (Yüklü oyunlar)
        const inst = await invoke<InstalledGame[]>('get_installed_games');
        setInstalled(inst);

        // 3. Haberler
        const newsData = await fetchWithCache<NewsItem[]>('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/news.json');
        setNews(newsData.slice(0, 3)); // Son 3 haber

        // 4. Topluluk
        const commData = await fetchWithCache<CommunityPatch[]>('https://raw.githubusercontent.com/rokmakrofaj/ChunkPatch-Community-Assets/main/community-database.json');
        const upcoming = commData.filter(p => p.progress < 100).sort((a, b) => b.progress - a.progress).slice(0, 3);
        setCommunity(upcoming);

        // 5. Trendler
        try {
          const trendData = await fetchWithCache<CatalogGame[]>('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/trending.json');
          if (trendData && trendData.length > 0) {
            setTrending(trendData);
          } else {
            throw new Error("Boş veri");
          }
        } catch (e) {
          // Fallback to hardcoded mock data if trending.json is not on GitHub yet
          setTrending([
            { id: 1091500, name: "Cyberpunk 2077", cover: "https://steamcdn-a.akamaihd.net/steam/apps/1091500/header.jpg", bg: "https://steamcdn-a.akamaihd.net/steam/apps/1091500/page_bg_generated_v6b.jpg", description: "Night City'nin tehlikeli sokaklarında geçen bu macerada Türkçe yamayı indirip hemen oynamaya başlayın.", badge: "Trend" },
            { id: 1174180, name: "Red Dead Redemption 2", cover: "https://steamcdn-a.akamaihd.net/steam/apps/1174180/header.jpg", bg: "https://steamcdn-a.akamaihd.net/steam/apps/1174180/page_bg_generated_v6b.jpg", description: "Vahşi batının en iyi Türkçe yama deneyimi.", badge: "Çok İndirilen" },
            { id: 379430, name: "Kingdom Come: Deliverance", cover: "https://steamcdn-a.akamaihd.net/steam/apps/379430/header.jpg", bg: "https://steamcdn-a.akamaihd.net/steam/apps/379430/page_bg_generated_v6b.jpg", description: "Ortaçağ atmosferini Türkçe alt yazılarla deneyimleyin.", badge: "Popüler" }
          ]);
        }

      } catch (err) {
        console.error("Dashboard yüklenirken hata:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="home-container" style={{ padding: '40px' }}>
        <div className="skeleton-base" style={{ height: '400px', width: '100%', marginBottom: '40px' }}></div>
        <div className="skeleton-base" style={{ height: '100px', width: '100%', marginBottom: '40px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div className="skeleton-base" style={{ height: '300px' }}></div>
          <div className="skeleton-base" style={{ height: '300px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      {heroGame && (
        <div className="home-hero" style={{ backgroundImage: `url(https://steamcdn-a.akamaihd.net/steam/apps/${heroGame.id}/page_bg_generated_v6b.jpg), url(${heroGame.bg})` }}>
          <div className="home-hero-content">
            <span className="home-hero-badge">Günün Yaması</span>
            <h1 className="home-hero-title">{heroGame.name}</h1>
            <p className="home-hero-desc">{heroGame.description}</p>
            <button className="home-hero-btn" onClick={() => navigate(`/catalog?q=${heroGame.name}`)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
              Hemen İncele
            </button>
          </div>
        </div>
      )}

      <div className="home-content-wrapper">
        <div className="home-main-col">
          {/* Library Shelf */}
          <h3 className="home-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Kütüphanendekiler
          </h3>
          {installed.length > 0 ? (
            <div className="home-library-shelf">
              {installed.map((game, idx) => {
                let platformPath = game.platform.toLowerCase();
                if(platformPath === 'epic games') platformPath = 'epic';
                
                return (
                  <div 
                    key={idx} 
                    className="home-library-card"
                    style={{ backgroundImage: `url(https://steamcdn-a.akamaihd.net/steam/apps/${game.id}/library_600x900.jpg), url(https://steamcdn-a.akamaihd.net/steam/apps/${game.id}/header.jpg)` }}
                    onClick={() => navigate(`/game/${platformPath}/${game.id}`)}
                  >
                    <div className="home-library-info">
                      <h4>{game.title}</h4>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="home-library-empty">
              Bilgisayarında yüklü desteklenen oyun bulunamadı.
            </div>
          )}
          {/* Trending Widget */}
          {trending.length > 0 && (
            <>
              <h3 className="home-section-title" style={{ marginTop: '40px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 11V3l-5 6.5L7 3v8l-5 6h20l-5-6z"></path></svg>
                Trendler ve Öneriler
              </h3>
              <div className="home-news-horizontal-list">
                {trending.map((t, i) => (
                  <div key={i} className="home-news-horizontal-card" style={{ minWidth: '260px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', height: '140px', backgroundImage: `url("${t.cover || `https://steamcdn-a.akamaihd.net/steam/apps/${t.id}/header.jpg`}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ background: 'var(--color-primary)', color: '#000', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{t.badge || 'Önerilen'}</span>
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800 }}>{t.name}</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>
                      <button 
                        style={{ marginTop: 'auto', width: '100%', background: 'var(--color-primary)', border: 'none', color: '#000', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                        onClick={() => navigate(`/catalog?q=${t.name}`)}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        İncele
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* News Widget (Horizontal Layout) */}
          <h3 className="home-section-title" style={{ marginTop: '40px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>
            Son Duyurular
          </h3>
          <div className="home-news-horizontal-list">
            {news.map((n, i) => (
              <div key={i} className="home-news-horizontal-card">
                <span className="home-news-date">{new Date(n.date).toLocaleDateString('tr-TR')}</span>
                <h4>{n.title}</h4>
              </div>
            ))}
          </div>
          {/* Community Upcoming Widget (Horizontal Layout) */}
          <h3 className="home-section-title" style={{ marginTop: '40px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Çok Yakında (Topluluk)
          </h3>
          <div className="home-news-horizontal-list">
            {community.map((c, i) => (
              <div key={i} className="home-news-horizontal-card" style={{ minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>{c.name}</h4>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, opacity: 0.8, marginBottom: '6px' }}>
                    <span>{c.author}</span>
                    <span>%{c.progress}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.progress}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
