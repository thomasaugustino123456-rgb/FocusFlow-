
import React from 'react';
import { Confetti } from './Confetti';

interface MascotProps {
  score: number;
}

export const Mascot: React.FC<MascotProps> = ({ score }) => {
  let mood = "normal";
  let message = "Keep it up! Practice makes perfect.";
  let emoji = "🦉";
  let color = "bg-[#dff1fd]";
  let textColor = "text-[#1899d6]";
  let showConfetti = false;

  if (score === 10) {
    mood = "happy";
    message = "YOU'RE A LEGEND! A PERFECT SCORE!";
    emoji = "🥳";
    color = "bg-[#f7e9d1]";
    textColor = "text-[#ef8e00]";
    showConfetti = true;
  } else if (score >= 5) {
    mood = "neutral";
    message = "Not bad! You're really getting the hang of this!";
    emoji = "🦉";
    color = "bg-[#dff1fd]";
    textColor = "text-[#1899d6]";
    if (score >= 8) showConfetti = true;
  } else {
    mood = "sad";
    message = "Mistakes are just lessons in disguise. Let's try again!";
    emoji = "😢";
    color = "bg-[#f2f2f2]";
    textColor = "text-[#afafaf]";
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <div className={`w-full ${color} rounded-3xl p-8 flex flex-col items-center gap-6 transition-all animate-pop-out shadow-sm overflow-hidden relative border-b-8 border-black/10`}>
        <div className={`text-9xl transition-all duration-500 drop-shadow-lg ${
          mood === 'happy' ? 'animate-bounce' : mood === 'sad' ? 'animate-pulse' : 'hover:scale-110'
        }`}>
          {emoji}
        </div>
        
        <div className="text-center relative z-10 w-full">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 relative">
            {/* Speech bubble arrow */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-l-2 border-t-2 border-gray-100 rotate-45"></div>
            <p className={`text-xl font-black ${textColor} leading-tight`}>
              {message}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
