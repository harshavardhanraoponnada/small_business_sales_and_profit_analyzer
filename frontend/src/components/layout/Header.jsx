import React, { memo } from 'react';
import { useTheme } from "../../app/ThemeContext";

const Header = memo(function Header({ title }) {
  const { isDarkMode } = useTheme();

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b flex items-center justify-between px-8 py-5 transition-all duration-300
      ${isDarkMode 
        ? 'bg-[#0f172a]/80 border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
        : 'bg-white/80 border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}`
    }>
      <div className="flex items-center gap-4">
        <h2 className={`text-2xl font-bold tracking-tight bg-clip-text text-transparent
          ${isDarkMode ? 'bg-gradient-to-r from-white to-slate-400' : 'bg-gradient-to-r from-slate-900 to-slate-600'}`}>
          {title}
        </h2>
      </div>
      
      {/* Subtle glowing orb effect in dark mode */}
      {isDarkMode && (
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] -z-10 pointer-events-none"></div>
      )}
    </header>
  );
});

export default Header;
