import { getCurrentWindow } from '@tauri-apps/api/window';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import packageJson from '../../../package.json';
import './TitleBar.css';

export default function TitleBar() {
  const appWindow = getCurrentWindow();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  
  const appVersion = packageJson.version;
  
  const isLibraryActive = location.pathname === '/library' || location.pathname.startsWith('/game/');

  // URL'deki arama parametresi değişirse (başka bir ekrandan gelindiyse) arama çubuğunu senkronize et
  useEffect(() => {
    if (location.pathname === '/catalog') {
      const searchParams = new URLSearchParams(location.search);
      setSearchValue(searchParams.get('q') || '');
    } else {
      setSearchValue(''); // Başka sayfaya geçilince arama çubuğunu temizle
    }
  }, [location.pathname, location.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    
    // Sadece yazıldığında Kataloğa git ve parametreyi ekle
    if (val.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(val)}`);
    } else if (location.pathname === '/catalog') {
      // Eğer arama silinirse parametreyi kaldır
      navigate('/catalog');
    }
  };

  return (
    <div className="titlebar">
      {/* Navigation Menu */}
      <nav className="titlebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "nav-item active logo-item" : "nav-item logo-item")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-logo">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          ChunkPatch
          {appVersion && (
            <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '0px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', letterSpacing: '0px' }}>
              v{appVersion}
            </span>
          )}
        </NavLink>
        <Link to="/library" className={isLibraryActive ? "nav-item active" : "nav-item"}>Kütüphane</Link>
        <NavLink to="/catalog" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>Yama Kataloğu</NavLink>
        <NavLink to="/announcements" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>Duyurular</NavLink>
        <NavLink to="/community" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>Topluluk</NavLink>
      </nav>

      {/* Draggable empty space */}
      <div className="titlebar-drag-spacer" data-tauri-drag-region></div>

      {/* Global Search Bar - Sadece Katalog Sayfasında Görünür */}
      {location.pathname === '/catalog' && (
        <div className="titlebar-search-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            id="catalog-search"
            name="catalog-search"
            type="text" 
            className="titlebar-search-input" 
            placeholder="Katalogda ara..." 
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {/* Window Controls */}
      <div className="titlebar-actions">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => (isActive ? "titlebar-button active" : "titlebar-button")}
          title="Ayarlar"
          style={{ textDecoration: 'none' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </NavLink>
        <button
          className="titlebar-button"
          onClick={() => appWindow.minimize().catch(e => alert("Minimize hatası: " + e))}
          title="Minimize"
        >
          &#x2012;
        </button>
        <button
          className="titlebar-button"
          onClick={() => appWindow.toggleMaximize().catch(e => alert("Maximize hatası: " + e))}
          title="Maximize"
        >
          &#x25A1;
        </button>
        <button
          className="titlebar-button titlebar-button-close"
          onClick={() => appWindow.close().catch(e => alert("Close hatası: " + e))}
          title="Close"
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}
