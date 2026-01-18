
import React from 'react';
import { Mission } from '../types';
import { MissionCard } from './MissionCard';

interface DashboardProps {
  missions: Mission[];
  onToggleStep: (missionId: string, stepId: string) => void;
  onDeleteMission: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ missions, onToggleStep, onDeleteMission }) => {
  if (missions.length === 0) {
    return (
      <div className="text-center py-20 px-4 opacity-80 animate-slide-up">
        <div className="text-8xl mb-6 animate-bounce">🚀</div>
        <h3 className="text-2xl font-black text-gray-700 dark:text-white mb-2 uppercase tracking-tight">Ready for take-off?</h3>
        <p className="text-gray-400 dark:text-gray-500 font-bold max-w-xs mx-auto">Start by typing a big goal above. We'll help you crush it step by step!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Active Missions</h2>
        <span className="text-xs font-black text-blue-500 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{missions.length} Missions</span>
      </div>
      <div className="grid grid-cols-1 gap-6 items-start">
        {missions.map((mission) => (
          <MissionCard 
            key={mission.id} 
            mission={mission} 
            onToggleStep={onToggleStep} 
            onDeleteMission={onDeleteMission}
          />
        ))}
      </div>
    </div>
  );
};
