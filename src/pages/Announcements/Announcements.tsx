import { useState, useEffect } from 'react';
import { fetchWithCache } from '../../utils/api';
import './Announcements.css';

interface NewsItem {
  title: string;
  content: string;
  category: string;
  date: string;
  image?: string;
}

export default function Announcements() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await fetchWithCache<NewsItem[]>('https://raw.githubusercontent.com/rokmakrofaj/chunkpatch/main/news.json');
        setNews(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <div className="page-container news-container">
      <div className="news-header">
        <h2>Duyurular</h2>
        <p>Platform güncellemeleri, topluluk haberleri ve son gelişmeler.</p>
      </div>

      {loading ? (
        <div className="news-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="news-card skeleton-base" style={{ minHeight: '280px' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="news-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>{error}</p>
        </div>
      ) : news.length === 0 ? (
        <div className="news-empty">Şu an için yeni bir duyuru bulunmuyor.</div>
      ) : (
        <div className="news-grid">
          {news.map((item, index) => (
            <div className="news-card" key={index}>
              <div className="news-cover">
                {item.image && item.image.trim() !== "" ? (
                  <img src={item.image} alt={item.title} className="news-image" />
                ) : (
                  <div className="news-image-placeholder">
                    <span>{item.category}</span>
                  </div>
                )}
                <div className="news-category-badge">{item.category}</div>
              </div>
              <div className="news-content">
                <span className="news-date">{formatDate(item.date)}</span>
                <h3 className="news-title">{item.title}</h3>
                <p className="news-text">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
