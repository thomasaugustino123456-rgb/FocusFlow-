
import React, { useState, useEffect } from 'react';

interface FocusTimerProps {
  initialMinutes: number;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ initialMinutes }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(initialMinutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-3xl font-bold text-gray-700 dark:text-white font-mono">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={toggle}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            isActive ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {isActive ? 'PAUSE' : 'GO!'}
        </button>
        <button 
          onClick={reset}
          className="px-4 py-1.5 rounded-lg text-sm font-bold bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
        >
          RESET
        </button>
      </div>
    </div>
  );
};
