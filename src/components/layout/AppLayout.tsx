import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '@/hooks';

export default function AppLayout() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [sidebarOpen]);

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
      className={`min-h-screen app-layout ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <div className="hidden md:block md:fixed md:left-0 md:top-0 md:h-screen md:w-[280px] md:flex-shrink-0 md:z-20">
        <Sidebar isMobile={false} closeSidebar={() => {}} />
      </div>

      {sidebarOpen ? (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed right-0 top-[64px] bottom-0 w-[280px] z-40 md:hidden overflow-hidden animate-in slide-in-from-right duration-300">
            <Sidebar isMobile closeSidebar={() => setSidebarOpen(false)} />
          </div>
        </>
      ) : null}

      <div className="flex flex-col min-h-screen overflow-hidden md:ml-[280px]">
        <Header
          title={pageTitle}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
        />
        <div className="flex-1 overflow-y-auto animate-fade-in-up pt-16 sm:pt-18 lg:pt-20">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
