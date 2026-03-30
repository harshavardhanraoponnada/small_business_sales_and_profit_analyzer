/* eslint-disable react-hooks/static-components */
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { useTheme } from "../../app/ThemeContext";
import { BarChart3, ClipboardList, Package, CreditCard, Search, Users, LogOut, Smartphone, Brain, Moon, Sun } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  if (!user) {
    return (
      <aside className={`fixed left-0 top-0 h-screen w-[280px] flex items-center justify-center border-r transition-all duration-300
        ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
        <div className="animate-pulse font-medium tracking-wide text-sm">Loading workspace...</div>
      </aside>
    );
  }

  const NavLink = ({ to, icon: Icon, children, isActive }) => (
    <Link
      to={to}
      className={`group flex items-center gap-3 px-4 py-3 mx-4 my-1 rounded-xl transition-all duration-200 relative overflow-hidden
        ${isActive 
          ? (isDarkMode 
              ? 'bg-primary-500/10 text-primary-400 font-medium' 
              : 'bg-primary-50 text-primary-600 font-medium')
          : (isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
        }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-md shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
      )}
      <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="text-sm">{children}</span>
    </Link>
  );

  // Fallback for icons that are not components (like the ₹ sign)
  const TextIcon = ({ text, isActive }) => (
    <span className={`transition-transform duration-200 font-bold text-[15px] px-[2px] ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
      {text}
    </span>
  );

  return (
    <aside className={`fixed left-0 top-0 h-screen w-[280px] flex flex-col border-r transition-all duration-300 z-50
      ${isDarkMode 
        ? 'bg-[#0a0f1c] border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.2)]' 
        : 'bg-slate-50 border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'}`}>
      
      {/* Logo Area */}
      <div className="flex flex-col px-8 py-8">
        <div className={`flex items-center gap-2 text-xl font-bold tracking-tight mb-1
          ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <div className={`p-2 rounded-xl flex items-center justify-center
            ${isDarkMode ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'}`}>
            <Smartphone size={22} />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-indigo-500">
            PhoneVerse
          </span>
        </div>
        <p className={`text-[10px] ml-11 font-bold tracking-widest uppercase
          ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Profit Analyzer
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 custom-scrollbar">
        <NavLink autoFocus={false} to="/" icon={BarChart3} isActive={location.pathname === '/'}>
          Dashboard
        </NavLink>
        
        <NavLink to="/sales" icon={() => <TextIcon text="₹" isActive={location.pathname === '/sales'} />} isActive={location.pathname === '/sales'}>
          Sales
        </NavLink>

        {(user.role === "OWNER" || user.role === "ACCOUNTANT") && (
          <>
            <NavLink to="/inventory" icon={ClipboardList} isActive={location.pathname === '/inventory'}>
              Inventory
            </NavLink>
            <NavLink to="/products" icon={Package} isActive={location.pathname === '/products'}>
              Products
            </NavLink>
            <NavLink to="/expenses" icon={CreditCard} isActive={location.pathname === '/expenses'}>
              Expenses
            </NavLink>
          </>
        )}

        {user.role === "OWNER" && (
          <>
            <div className={`mx-8 mt-6 mb-2 text-xs font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Administration
            </div>
            <NavLink to="/audit" icon={Search} isActive={location.pathname === '/audit'}>
              Audit Logs
            </NavLink>
            <NavLink to="/users" icon={Users} isActive={location.pathname === '/users'}>
              Users
            </NavLink>
            <NavLink to="/ml-analytics" icon={Brain} isActive={location.pathname === '/ml-analytics'}>
              AI Insights
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Actions */}
      <div className={`p-4 border-t transition-colors duration-300
        ${isDarkMode ? 'border-slate-800/60 bg-slate-900/30' : 'border-slate-200/80 bg-white/50'}`}>
        
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2
            ${isDarkMode 
              ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50' 
              : 'text-slate-600 hover:text-primary-600 hover:bg-primary-50'}`}
        >
          {isDarkMode ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} />}
          <span className="font-medium text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
            ${isDarkMode 
              ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' 
              : 'text-slate-600 hover:text-red-600 hover:bg-red-50'}`}
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
