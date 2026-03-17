import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { useTheme } from "../../app/ThemeContext";
import { BarChart3, ClipboardList, Package, CreditCard, Search, Users, LogOut, Smartphone, Brain, Moon, Sun } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  // SAFETY: show a placeholder instead of null
  if (!user) {
    return (
      <aside className="sidebar sidebar-loading">
        <p>Loading user...</p>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Smartphone size={20} />
          PhoneVerse
        </div>
        <p className="sidebar-subtitle"> Small Business Sales & Profit Analyzer</p>
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
          <span className="sidebar-icon"><BarChart3 size={18} /></span>
          Dashboard
        </Link>
        <Link to="/sales" className={`sidebar-link ${location.pathname === '/sales' ? 'active' : ''}`}>
          <span className="sidebar-icon">₹</span>
          Sales
        </Link>

        {(user.role === "OWNER" || user.role === "ACCOUNTANT") && (
          <Link to="/inventory" className={`sidebar-link ${location.pathname === '/inventory' ? 'active' : ''}`}>
            <span className="sidebar-icon"><ClipboardList size={18} /></span>
            Inventory
          </Link>
        )}

        {(user.role === "OWNER" || user.role === "ACCOUNTANT") && (
          <Link to="/products" className={`sidebar-link ${location.pathname === '/products' ? 'active' : ''}`}>
            <span className="sidebar-icon"><Package size={18} /></span>
            Products
          </Link>
        )}

        {(user.role === "OWNER" || user.role === "ACCOUNTANT") && (
          <Link to="/expenses" className={`sidebar-link ${location.pathname === '/expenses' ? 'active' : ''}`}>
            <span className="sidebar-icon"><CreditCard size={18} /></span>
            Expenses
          </Link>
        )}

        {user.role === "OWNER" && (
          <Link to="/audit" className={`sidebar-link ${location.pathname === '/audit' ? 'active' : ''}`}>
            <span className="sidebar-icon"><Search size={18} /></span>
            Audit Logs
          </Link>
        )}

        {user.role === "OWNER" && (
          <Link to="/users" className={`sidebar-link ${location.pathname === '/users' ? 'active' : ''}`}>
            <span className="sidebar-icon"><Users size={18} /></span>
            Users
          </Link>
        )}

        {user.role === "OWNER" && (
          <Link to="/ml-analytics" className={`sidebar-link ${location.pathname === '/ml-analytics' ? 'active' : ''}`}>
            <span className="sidebar-icon"><Brain size={18} /></span>
            AI Insights
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="sidebar-theme-toggle">
          <span className="sidebar-icon">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
        <button onClick={logout} className="sidebar-logout">
          <span className="sidebar-icon"><LogOut size={18} /></span>
          Logout
        </button>
      </div>
    </aside>
  );
}
