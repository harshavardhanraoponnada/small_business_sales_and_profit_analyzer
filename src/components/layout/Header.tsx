import { memo, useMemo, useState } from 'react';
import { ChevronDown, LogOut, Menu, Moon, Settings, Sun, UserCircle2, X } from 'lucide-react';
import { useTheme } from '@/hooks';
import { useAuth } from '@/auth/authContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const Header = memo(function Header({ title, onMenuClick, isSidebarOpen }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth() as { user: { role?: string } | null; logout: () => void };
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLabel = useMemo(() => {
    const role = user?.role || 'User';
    return String(role).toLowerCase().replace(/(^\w|_\w)/g, (value) => value.replace('_', ' ').toUpperCase());
  }, [user?.role]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 md:left-[280px] z-50 backdrop-blur-lg transition-all duration-300 border-b ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800/50 shadow-[0_8px_40px_rgba(0,0,0,0.4)]'
          : 'bg-white/95 border-slate-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
      }`}
    >
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <h2
              className={`text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight truncate ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {title}
            </h2>
            <div
              className={`absolute -bottom-1 left-0 h-0.5 w-10 rounded-full ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4">
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isDarkMode
                ? 'bg-slate-800/50 border border-slate-700/50'
                : 'bg-slate-100/50 border border-slate-200/50'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className={`text-xs font-medium tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              System Active
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="User menu"
            >
              <UserCircle2 size={16} />
              <span className="hidden sm:inline text-xs font-medium">{roleLabel}</span>
              <ChevronDown size={14} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className={`absolute right-0 mt-2 min-w-[180px] rounded-lg border p-1 shadow-lg ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-200'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={14} />
                  Settings
                </button>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    isDarkMode ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-red-50 text-red-600'
                  }`}
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          <button
            onClick={onMenuClick}
            className={`md:hidden flex-shrink-0 p-2.5 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-300 hover:text-slate-100'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Toggle sidebar"
            type="button"
          >
            {isSidebarOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </header>
  );
});

export default Header;
