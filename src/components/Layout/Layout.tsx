import { ReactNode } from "react";
import TitleBar from "../TitleBar/TitleBar";
import SideBar from "../SideBar/SideBar";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout-container">
      <TitleBar />
      <div className="layout-main">
        <SideBar />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
