
import React from 'react';
import { UserStats } from '../types';

interface HeaderProps {
  stats: UserStats;
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  const xpInCurrentLevel = stats.xp % 100;
  const progressPercent = Math.min(100, xpInCurrentLevel);

  return (
    <header className="w-full bg-white dark:bg-slate-900 px-4 pt-6 pb-2 border-b border-gray-100 dark:border-white/5 animate-slide-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          {/* Rank Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3b82f6] dark:bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 dark:shadow-none">
              {stats.level}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Rank</span>
              <span className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">Adventurer</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="font-black text-lg text-orange-500">{stats.streak}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <span className="font-black text-lg text-[#1cb0f6] dark:text-blue-400">{stats.xp}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-[#1cb0f6] dark:bg-blue-500 transition-all duration-1000 ease-out rounded-full relative shadow-[0_0_10px_rgba(28,176,246,0.3)]"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </header>
  );
};
