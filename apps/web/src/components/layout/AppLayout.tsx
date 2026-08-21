import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} />
      <div className={`app-main ${collapsed ? 'collapsed' : ''}`}>
        <Header onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};