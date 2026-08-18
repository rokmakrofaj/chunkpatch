import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Library from "./pages/Library/Library";
import Catalog from "./pages/Catalog/Catalog";
import Announcements from "./pages/Announcements/Announcements";
import Community from "./pages/Community/Community";
import Settings from "./pages/Settings/Settings";
import GameDetail from "./pages/GameDetail/GameDetail";
import Backups from "./pages/Backups/Backups";
import "./App.css";

// Temporary Dev Tool: Mouse Tracker
function MouseTracker() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'lime',
      padding: '4px 8px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      X: {coords.x} | Y: {coords.y}
    </div>
  );
}

function App() {
  useEffect(() => {
    const savedColor = localStorage.getItem("chunkpatch_color");
    if (savedColor) {
      document.documentElement.style.setProperty("--color-primary", savedColor);
    }
  }, []);

  return (
    <Layout>
      <MouseTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/community" element={<Community />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/backups" element={<Backups />} />
        <Route path="/game/:platform/:id" element={<GameDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
