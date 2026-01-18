
import React, { useState } from 'react';
import { Mission } from '../types';
import { FocusTimer } from './FocusTimer';

interface MissionCardProps {
  mission: Mission;
  onToggleStep: (missionId: string, stepId: string) => void;
  onDeleteMission: (id: string) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onToggleStep, onDeleteMission }) => {
  const [showTimer, setShowTimer] = useState(false);
  const completedCount = mission.steps.filter(s => s.completed).length;
  const isAllDone = completedCount === mission.steps.length;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-soft transition-all animate-slide-up border border-gray-100 dark:border-white/5 group hover:shadow-xl hover:shadow-purple-200/20 ${isAllDone ? 'ring-2 ring-green-100 dark:ring-green-900/50' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
          <div>
            <h3 className={`text-lg font-extrabold text-gray-900 dark:text-white leading-tight ${isAllDone ? 'line-through opacity-50' : ''}`}>
              {mission.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md">+{mission.xpReward} XP</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{mission.focusTimeMinutes} Min</span>
            </div>
          </div>
        </div>
        <button 
            onClick={() => onDeleteMission(mission.id)}
            className="text-gray-200 dark:text-slate-600 hover:text-red-400 p-2 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {mission.steps.map((step, idx) => {
          const isNext = !step.completed && (idx === 0 || mission.steps[idx - 1].completed);
          return (
            <div 
              key={step.id} 
              onClick={() => onToggleStep(mission.id, step.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                step.completed 
                  ? 'bg-gray-50 dark:bg-slate-900/50 opacity-60' 
                  : isNext 
                    ? 'bg-white dark:bg-slate-700 border-2 border-purple-500/10 dark:border-purple-400/20 shadow-lg shadow-purple-100 dark:shadow-none ring-4 ring-purple-500/5' 
                    : 'bg-gray-50 dark:bg-slate-900/50 border border-transparent text-gray-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                step.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}>
                {step.completed && <span className="text-[10px]">✔</span>}
              </div>
              <span className={`text-sm font-bold ${isNext ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {step.text}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {!isAllDone ? (
            <button 
                onClick={() => setShowTimer(!showTimer)}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bouncy ${
                    showTimer ? 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400' : 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                }`}
            >
                {showTimer ? 'Hide Timer' : 'Start Focus Session'}
            </button>
        ) : (
            <div className="flex-1 text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600 dark:text-green-400 font-extrabold flex items-center justify-center gap-2">
                Mission Completed! ✨
            </div>
        )}
      </div>

      {showTimer && !isAllDone && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl animate-pop-out">
           <FocusTimer initialMinutes={mission.focusTimeMinutes} />
        </div>
      )}
    </div>
  );
};
