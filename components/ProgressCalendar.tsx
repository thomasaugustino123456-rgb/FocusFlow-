
import React, { useState } from 'react';
import { Activity } from '../types';

interface ProgressCalendarProps {
  activities: Activity[];
}

export const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ activities }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && viewDate.getMonth() === selectedDate.getMonth() && viewDate.getFullYear() === selectedDate.getFullYear();
  };

  /**
   * Only mark days where a topic (quiz) was finished successfully.
   * Based on the user's request: "just if a user finished a topic".
   */
  const hasTopicMilestone = (day: number) => {
    const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
    return activities.some(a => 
      new Date(a.timestamp).toDateString() === checkDate && 
      a.type === 'quiz' && 
      a.status === 'success'
    );
  };

  const getDayTopics = (day: number) => {
    const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
    return activities.filter(a => 
      new Date(a.timestamp).toDateString() === checkDate && 
      a.type === 'quiz' && 
      a.status === 'success'
    );
  };

  const totalTopicsFinished = activities.filter(a => a.type === 'quiz' && a.status === 'success').length;
  const currentSelectedTopics = getDayTopics(selectedDate.getDate());

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-soft border border-gray-100 dark:border-white/5 animate-slide-up">
      {/* Header with Mastered Count */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Mastery Map</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
              {totalTopicsFinished} Topics Completed ✨
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
            <span className="text-gray-400">❮</span>
          </button>
          <button onClick={nextMonth} className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
            <span className="text-gray-400">❯</span>
          </button>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-300 dark:text-gray-600 py-2">{d}</div>
        ))}
        {blanks.map(i => <div key={`b-${i}`} />)}
        {days.map(d => {
          const isMarked = hasTopicMilestone(d);
          const selected = isSelected(d);
          const today = isToday(d);
          
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-black transition-all group ${
                selected 
                  ? 'bg-blue-600 text-white shadow-xl scale-110 z-10' 
                  : today 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="relative z-10">{d}</span>
              {isMarked && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center ${selected ? 'bg-yellow-400' : 'bg-blue-500'}`}>
                   <span className="text-[6px] text-white">★</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Log for Selected Day - Only showing Finished Topics */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-slate-900/20 -mx-6 -mb-6 px-6 pb-6 rounded-b-[2.5rem]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </h4>
          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md uppercase">
            {currentSelectedTopics.length} Mastered
          </span>
        </div>
        
        {currentSelectedTopics.length > 0 ? (
          <div className="space-y-3">
            {currentSelectedTopics.map((act) => (
              <div key={act.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-white/5 animate-pop-out">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center text-lg shadow-inner">
                  🎓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{act.message}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                    Topic Finished • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="text-3xl mb-2 grayscale opacity-30">📚</div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 italic max-w-[180px] mx-auto leading-tight">
              Finish a topic today to mark it on your mastery map!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
