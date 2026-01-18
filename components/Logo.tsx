
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  dark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 120, showText = false, dark = false }) => {
  const color = dark ? "white" : "black";
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="8" />
          {/* Middle Ring */}
          <circle cx="50" cy="50" r="24" stroke={color} strokeWidth="8" />
          {/* Center Dot */}
          <circle cx="50" cy="50" r="8" fill={color} />
        </svg>
      </div>
      {showText && (
        <span 
          className={`mt-4 font-black tracking-[0.2em] uppercase text-xl ${dark ? 'text-white' : 'text-black'}`}
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          FocusFlow
        </span>
      )}
    </div>
  );
};
