import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../../app/ThemeContext';

export default function AppLayout() {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  const themeColors = useMemo(() => ({
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
  }), [isDarkMode]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/sales')) return 'Sales';
    if (path.startsWith('/inventory')) return 'Inventory';
    if (path.startsWith('/expenses')) return 'Expenses';
    if (path.startsWith('/audit')) return 'Audit Logs';
    if (path.startsWith('/users')) return 'Users';
    if (path.startsWith('/ml-analytics')) return 'AI Insights';
    return 'Dashboard';
  }, [location.pathname]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: themeColors.background,
        color: themeColors.text,
      }}
      className={`app-layout ${isDarkMode ? 'dark' : ''} animate-fade-in-up`}
    >
      <Sidebar />
      <div 
        style={{ 
          flex: 1, 
          marginLeft: "280px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh"
        }}
        className="main-content"
      >
        <Header title={pageTitle} />
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
