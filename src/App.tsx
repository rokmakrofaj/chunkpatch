import { useEffect } from "react";
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

function App() {
  useEffect(() => {
    const savedColor = localStorage.getItem("chunkpatch_color");
    if (savedColor) {
      document.documentElement.style.setProperty("--color-primary", savedColor);
    }
  }, []);

  return (
    <Layout>
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
