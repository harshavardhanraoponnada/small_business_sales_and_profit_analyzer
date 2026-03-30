import React from 'react';
import { useTheme } from '../../app/ThemeContext';

export default function Loader({ fullScreen = false, message = "Loading..." }) {
  const { isDarkMode } = useTheme();
  
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Dynamic dual-ring spinner */}
      <div className="relative w-16 h-16">
        <div className={`absolute top-0 left-0 w-full h-full border-4 rounded-full border-t-primary-500 border-b-primary-500 animate-spin border-r-transparent border-l-transparent ${isDarkMode ? 'opacity-80' : 'opacity-100'}`}></div>
        <div className={`absolute top-2 left-2 w-12 h-12 border-4 rounded-full border-l-indigo-400 border-r-indigo-400 animate-[spin_1.5s_linear_infinite_reverse] border-t-transparent border-b-transparent ${isDarkMode ? 'opacity-60' : 'opacity-80'}`}></div>
      </div>
      {/* Animated text */}
      <div className={`text-sm font-medium tracking-widest uppercase animate-pulse ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        {message}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-slate-50/40 backdrop-blur-sm'}`}>
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center p-8">
      {loaderContent}
    </div>
  );
}
