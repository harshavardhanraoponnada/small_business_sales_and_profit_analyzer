import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  Package,
  CreditCard,
  Search,
  Users,
  LogOut,
  Smartphone,
  Brain,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/auth/authContext';
import { useTheme } from '@/hooks';

type UserRole = 'OWNER' | 'ACCOUNTANT' | 'MANAGER' | 'USER' | 'VIEWER';

interface SidebarProps {
  isMobile?: boolean;
  closeSidebar?: () => void;
}

interface NavLinkProps {
  to: string;
  children: string;
  isActive: boolean;
  icon: React.ElementType;
  onClick: () => void;
}

function NavLink({ to, icon: Icon, children, isActive, onClick }: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 mx-4 my-1 rounded-xl transition-all duration-200 relative overflow-hidden ${
        isActive
          ? 'bg-primary-500/10 text-primary-500 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
      }`}
    >
      {isActive ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-md" /> : null}
      <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="text-sm">{children}</span>
    </Link>
  );
}

export default function Sidebar({ isMobile = false, closeSidebar = () => {} }: SidebarProps) {
  const { user, logout } = useAuth() as {
    user: { role?: UserRole } | null;
    logout: () => void;
  };
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  if (!user) {
    return (
      <aside
        className={`h-screen w-full flex items-center justify-center border-r ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="animate-pulse font-medium tracking-wide text-sm">Loading workspace...</div>
      </aside>
    );
  }

  const canManageStock = user.role === 'OWNER' || user.role === 'ACCOUNTANT';
  const canSeeAdmin = user.role === 'OWNER';

  return (
    <aside
      className={`${isMobile ? 'h-full' : 'h-screen'} w-full flex flex-col border-r overflow-hidden ${
        isDarkMode
          ? 'bg-[#0a0f1c] border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
          : 'bg-slate-50 border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'
      }`}
    >
      <div className="flex flex-col px-8 py-8 flex-shrink-0 overflow-hidden">
        <div className={`flex items-center gap-2 text-xl font-bold tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <div className={`p-2 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'}`}>
            <Smartphone size={22} />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-indigo-500">
            PhoneVerse
          </span>
        </div>
        <p className={`text-[10px] ml-11 font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Profit Analyzer
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 custom-scrollbar overscroll-contain">
        <NavLink to="/" icon={BarChart3} isActive={location.pathname === '/'} onClick={closeSidebar}>Dashboard</NavLink>
        <NavLink to="/sales" icon={CreditCard} isActive={location.pathname === '/sales'} onClick={closeSidebar}>Sales</NavLink>

        {canManageStock ? (
          <>
            <NavLink to="/inventory" icon={ClipboardList} isActive={location.pathname === '/inventory'} onClick={closeSidebar}>Inventory</NavLink>
            <NavLink to="/products" icon={Package} isActive={location.pathname === '/products'} onClick={closeSidebar}>Products</NavLink>
            <NavLink to="/expenses" icon={CreditCard} isActive={location.pathname === '/expenses'} onClick={closeSidebar}>Expenses</NavLink>
          </>
        ) : null}

        {canSeeAdmin ? (
          <>
            <div className={`mx-8 mt-6 mb-2 text-xs font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Administration
            </div>
            <NavLink to="/audit" icon={Search} isActive={location.pathname === '/audit'} onClick={closeSidebar}>Audit Logs</NavLink>
            <NavLink to="/users" icon={Users} isActive={location.pathname === '/users'} onClick={closeSidebar}>Users</NavLink>
            <NavLink to="/ml-analytics" icon={Brain} isActive={location.pathname === '/ml-analytics'} onClick={closeSidebar}>AI Insights</NavLink>
          </>
        ) : null}
      </nav>

      <div className={`p-4 border-t transition-colors duration-300 flex-shrink-0 overflow-hidden ${isDarkMode ? 'border-slate-800/60 bg-slate-900/30' : 'border-slate-200/80 bg-white/50'}`}>
        <button
          onClick={toggleTheme}
          type="button"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
            isDarkMode ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50' : 'text-slate-600 hover:text-primary-600 hover:bg-primary-50'
          }`}
        >
          {isDarkMode ? <Sun size={18} className="text-amber-300 flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
          <span className="font-medium text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          type="button"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
          }`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
