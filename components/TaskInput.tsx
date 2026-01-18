
import React, { useState } from 'react';

interface TaskInputProps {
  onSubmit: (task: string) => void;
  isLoading: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isLoading }) => {
  const [task, setTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim() && !isLoading) {
      onSubmit(task);
      setTask('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative group">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="I want to study..."
          disabled={isLoading}
          className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-[2rem] px-8 py-5 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:outline-none shadow-soft transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={!task.trim() || isLoading}
          className={`absolute right-2.5 top-2.5 bottom-2.5 px-8 rounded-[1.5rem] font-extrabold text-white transition-all bouncy flex items-center justify-center ${
            isLoading || !task.trim() 
              ? 'bg-gray-100 dark:bg-slate-900 text-gray-400' 
              : 'bg-[#1e1b4b] dark:bg-purple-600 shadow-lg'
          }`}
        >
          {isLoading ? '...' : 'Plan'}
        </button>
      </div>
    </form>
  );
};
