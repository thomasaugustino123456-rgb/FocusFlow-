
import React, { useState, useMemo } from 'react';
import { LessonTopic, QuizQuestion, QuizResult, StudyGuide } from '../types';
import { generateLessonQuiz, evaluateQuiz, generateStudyGuide } from '../geminiService';
import { Mascot } from './Mascot';

const TOPICS_POOL = [
  "Mastering Focus", "Note-Taking Secrets", "Coding Basics", "Money Management", 
  "Social Skills 101", "Digital Citizenship", "Public Speaking", "Creative Writing",
  "First Aid Basics", "Nutrition for Teens", "Emotional Intelligence", "Time Blocking",
  "AI Foundations", "History of Gaming", "Science of Sleep", "Debate Skills",
  "Photography Basics", "Graphic Design Intro", "Mindfulness", "Fast Reading"
];

const ICONS = ["🔥", "📘", "💻", "💰", "🤝", "🌐", "🗣️", "✍️", "🩹", "🍎", "🎨", "🧪", "🧠", "⏰", "🤖"];

const LESSON_TOPICS: LessonTopic[] = Array.from({ length: 50 }, (_, i) => ({
  id: `lesson-${i + 1}`,
  title: TOPICS_POOL[i % TOPICS_POOL.length] + (i >= TOPICS_POOL.length ? ` II` : ""),
  category: i < 10 ? "The Basics" : i < 25 ? "Leveling Up" : "Master Class",
  icon: ICONS[i % ICONS.length]
}));

const UNITS = [
  { id: 1, title: "Unit 1: Getting Started", description: "Learn the fundamentals of focus.", range: [0, 8], color: "bg-[#58cc02]", border: "border-[#46a302]" },
  { id: 2, title: "Unit 2: Life Skills", description: "Master your daily routine.", range: [8, 18], color: "bg-[#1cb0f6]", border: "border-[#1899d6]" },
  { id: 3, title: "Unit 3: Tech & Creator", description: "Build things and stay safe.", range: [18, 30], color: "bg-[#a560e8]", border: "border-[#8e49d1]" },
  { id: 4, title: "Unit 4: Social Mastery", description: "Connecting with the world.", range: [30, 42], color: "bg-[#ff9600]", border: "border-[#e58700]" },
  { id: 5, title: "Unit 5: The Masterclass", description: "Advanced productivity hacks.", range: [42, 50], color: "bg-[#ff4b4b]", border: "border-[#d33131]" },
];

interface LessonPathProps {
  completedLessonIds: string[];
  onComplete: (id: string) => void;
}

export const LessonPath: React.FC<LessonPathProps> = ({ completedLessonIds, onComplete }) => {
  const [activeQuiz, setActiveQuiz] = useState<{ topic: LessonTopic; questions: QuizQuestion[] } | null>(null);
  const [activeStudyGuide, setActiveStudyGuide] = useState<StudyGuide | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startLesson = async (topic: LessonTopic) => {
    setLoading(true);
    try {
      const questions = await generateLessonQuiz(topic.title);
      setActiveQuiz({ topic, questions });
      setAnswers(new Array(questions.length).fill(""));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openStudyGuide = async (unit: typeof UNITS[0]) => {
    setLoading(true);
    try {
      const guide = await generateStudyGuide(unit.title, unit.description);
      setActiveStudyGuide(guide);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const res = await evaluateQuiz(activeQuiz.topic.title, activeQuiz.questions, answers);
      await new Promise(r => setTimeout(r, 800));
      setResult(res);
      if (res.score >= 5) onComplete(activeQuiz.topic.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-24 h-24 relative mb-6">
           <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping"></div>
           <div className="relative z-10 text-7xl">🦉</div>
        </div>
        <p className="font-black text-[#afafaf] dark:text-gray-500 text-xl animate-pulse text-center px-6 uppercase tracking-tight">
          "Preparing your adventure..."
        </p>
      </div>
    );
  }

  if (activeStudyGuide) {
    return (
      <div className="animate-slide-up pb-40 max-w-2xl mx-auto px-4 pt-12">
        <div className="flex items-center justify-between mb-8">
           <button 
             onClick={() => setActiveStudyGuide(null)}
             className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 transition-colors"
           >
             ✕
           </button>
           <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Study Guide</h2>
           <div className="w-12 h-12"></div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100 dark:border-white/5 space-y-10">
          <div className="text-center space-y-4">
             <div className="text-6xl mb-4">📖</div>
             <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tight">{activeStudyGuide.title}</h1>
             <p className="text-lg font-bold text-gray-500 dark:text-gray-400 italic">"{activeStudyGuide.summary}"</p>
          </div>

          <div className="space-y-12">
            {activeStudyGuide.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-xs">{idx + 1}</span>
                  {section.heading}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-3xl border border-green-100 dark:border-green-800/30">
            <h4 className="text-sm font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <span>✨</span> Key Takeaways
            </h4>
            <ul className="space-y-3">
              {activeStudyGuide.keyTakeaways.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm font-bold text-green-800 dark:text-green-300">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={() => setActiveStudyGuide(null)}
            className="w-full bg-[#1e1b4b] dark:bg-purple-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all bouncy text-xl uppercase tracking-tight"
          >
            I'm Ready to Quiz!
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="animate-slide-in pb-20 max-w-2xl mx-auto px-4">
        <Mascot score={result.score} />
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border-b-8 border-x-2 border-t-2 border-gray-100 dark:border-white/5 shadow-xl mt-8">
          <h2 className="text-2xl font-black text-center mb-2 text-gray-800 dark:text-white uppercase tracking-tight">MISSION COMPLETED</h2>
          <div className={`text-8xl font-black text-center mb-6 ${result.score >= 5 ? 'text-[#58cc02]' : 'text-[#ff4b4b]'} animate-pop-out drop-shadow-sm`}>
            {result.score}/10
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 mb-8 border-2 border-gray-100 dark:border-white/5 italic font-bold text-gray-600 dark:text-gray-400 text-center leading-snug">
            "{result.feedback}"
          </div>
          
          <div className="space-y-4">
            <h3 className="font-black text-[#afafaf] uppercase text-xs tracking-widest px-2 mb-2">Detailed Analysis</h3>
            {result.corrections.map((c, i) => (
              <div key={i} className={`p-5 rounded-2xl border-b-4 border-2 transition-all ${c.isCorrect ? 'bg-green-50 dark:bg-green-900/10 border-[#58cc02]/20' : 'bg-red-50 dark:bg-red-900/10 border-[#ff4b4b]/20'}`}>
                <div className="flex gap-3">
                  <span className={`text-xl font-black ${c.isCorrect ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-gray-100 mb-3">{c.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-gray-400">Your Answer</span>
                        <span className={`font-black uppercase ${c.isCorrect ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}`}>{c.userAnswer || "None"}</span>
                      </div>
                      {!c.isCorrect && (
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-gray-400">Correct Answer</span>
                          <span className="font-black uppercase text-[#58cc02]">{c.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-200/50 dark:border-white/5 pt-3 font-medium leading-relaxed">
                      {c.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => { setResult(null); setActiveQuiz(null); }}
            className="w-full bg-[#58cc02] border-b-8 border-[#46a302] text-white font-black py-5 rounded-2xl mt-10 shadow-lg active:border-b-0 active:translate-y-2 transition-all text-2xl uppercase tracking-tight"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  if (activeQuiz) {
    const currentQIdx = answers.findIndex(a => a === "");
    const isFinished = currentQIdx === -1;
    const q = isFinished ? activeQuiz.questions[9] : activeQuiz.questions[currentQIdx];

    return (
      <div className="animate-slide-in pb-20 max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-6 mb-12">
           <button onClick={() => setActiveQuiz(null)} className="text-[#afafaf] font-black text-2xl p-2 hover:text-[#ff4b4b] transition-colors">✕</button>
           <div className="h-4 flex-1 bg-[#e5e5e5] dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-[#58cc02] transition-all duration-700 ease-out" 
                style={{ width: `${((isFinished ? 10 : currentQIdx) / 10) * 100}%` }}
              >
                <div className="w-full h-1/2 bg-white/20"></div>
              </div>
           </div>
           <div className="text-[#afafaf] font-black">{isFinished ? 10 : currentQIdx + 1}/10</div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="flex flex-col justify-center">
             <div className="flex items-start gap-4 mb-8">
                <div className="text-6xl hidden sm:block">🦉</div>
                <div className="bg-white dark:bg-slate-800 border-2 border-[#e5e5e5] dark:border-white/5 p-6 rounded-3xl relative">
                  <div className="absolute left-[-10px] top-6 w-5 h-5 bg-white dark:bg-slate-800 border-l-2 border-b-2 border-[#e5e5e5] dark:border-white/5 rotate-45 hidden sm:block"></div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">
                    {q.question}
                  </h2>
                </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
             {q.options.map((opt, i) => (
               <button 
                 key={i}
                 disabled={isSubmitting}
                 onClick={() => {
                   const newAns = [...answers];
                   if (isFinished) newAns[9] = opt;
                   else newAns[currentQIdx] = opt;
                   setAnswers(newAns);
                 }}
                 className="w-full p-5 rounded-2xl border-2 border-b-4 border-[#e5e5e5] dark:border-white/5 hover:border-[#84d8ff] dark:hover:border-blue-400 hover:bg-[#ddf4ff] dark:hover:bg-blue-900/20 text-left font-bold text-gray-700 dark:text-gray-200 transition-all active:border-b-0 active:translate-y-1 group flex items-center gap-5"
               >
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border-2 border-[#e5e5e5] dark:border-white/5 flex items-center justify-center text-[#afafaf] font-black group-hover:border-[#84d8ff] group-hover:text-[#1cb0f6] transition-colors">
                   {i + 1}
                 </div>
                 <span className="text-lg">{opt}</span>
               </button>
             ))}
           </div>
        </div>
        
        {isFinished && (
           <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t-2 border-[#e5e5e5] dark:border-white/5 p-6 z-50 flex justify-center">
             <button 
               onClick={submitQuiz}
               disabled={isSubmitting}
               className={`w-full max-w-2xl text-white font-black py-5 rounded-2xl shadow-lg transition-all text-2xl uppercase tracking-tight block ${
                 isSubmitting ? 'bg-[#e5e5e5]' : 'bg-[#58cc02] border-b-8 border-[#46a302] active:border-b-0 active:translate-y-2'
               }`}
             >
               {isSubmitting ? 'Evaluating...' : 'Check Answer'}
             </button>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-xl mx-auto pb-40 px-4">
        {UNITS.map((unit) => (
          <div key={unit.id} className="mb-16">
            {/* Unit Header */}
            <div className={`${unit.color} p-8 rounded-[2.5rem] shadow-xl mb-12 border-b-8 ${unit.border} transition-transform hover:scale-[1.02] cursor-default relative overflow-hidden group`}>
               <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-white text-3xl font-black uppercase tracking-tight drop-shadow-sm">{unit.title}</h2>
                    <p className="text-white/90 font-bold text-lg mt-1">{unit.description}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl text-3xl border-b-4 border-black/10">📜</div>
               </div>
               <button 
                 onClick={() => openStudyGuide(unit)}
                 className="relative z-10 mt-6 bg-white/20 hover:bg-white/30 text-white font-black py-4 px-8 rounded-2xl uppercase text-sm border-b-4 border-black/20 transition-all flex items-center gap-2 active:translate-y-1 active:border-b-0"
               >
                 <span>Study Guide</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
               </button>
            </div>

            {/* Snake Path */}
            <div className="flex flex-col items-center gap-12 relative px-4">
              {LESSON_TOPICS.slice(unit.range[0], unit.range[1]).map((topic, i) => {
                const absIndex = unit.range[0] + i;
                const isLocked = absIndex > 0 && !completedLessonIds.includes(LESSON_TOPICS[absIndex - 1].id);
                const isCompleted = completedLessonIds.includes(topic.id);
                const isCurrent = !isLocked && !isCompleted;
                
                const cycle = i % 4;
                let xOffset = "0px";
                if (cycle === 1) xOffset = "60px";
                if (cycle === 2) xOffset = "100px";
                if (cycle === 3) xOffset = "60px";
                
                const isReverse = Math.floor(i / 4) % 2 !== 0;
                const finalX = isReverse ? `calc(-1 * ${xOffset})` : xOffset;

                return (
                  <div 
                    key={topic.id} 
                    className="relative flex flex-col items-center transition-all duration-500"
                    style={{ transform: `translateX(${finalX})` }}
                  >
                    {isCurrent && (
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#1cb0f6] text-white px-5 py-2.5 rounded-2xl font-black text-sm whitespace-nowrap animate-bounce shadow-xl z-20 uppercase tracking-tighter border-b-4 border-[#1899d6]">
                        Play!
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1cb0f6] rotate-45 border-r-2 border-b-2 border-[#1899d6]"></div>
                      </div>
                    )}

                    <button
                      disabled={isLocked}
                      onClick={() => startLesson(topic)}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl transition-all duo-path-node relative z-10 ${
                        isCompleted 
                        ? "bg-[#58cc02] border-b-[10px] border-[#46a302] text-white" 
                        : isLocked 
                          ? "bg-[#e5e5e5] dark:bg-slate-800 border-b-[10px] border-[#afafaf] dark:border-slate-900 text-[#afafaf] cursor-not-allowed grayscale" 
                          : "bg-[#1cb0f6] border-b-[10px] border-[#1899d6] text-white"
                      } ${isCurrent ? 'ring-[12px] ring-[#84d8ff]/30 ring-opacity-100 scale-110 shadow-2xl' : 'hover:scale-105'}`}
                    >
                      {isLocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z" />
                        </svg>
                      ) : isCompleted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        topic.icon
                      )}
                    </button>

                    {absIndex % 8 === 4 && (
                      <div className="absolute -left-32 top-0 text-7xl animate-[float_4s_ease-in-out_infinite] hidden sm:block">🦉</div>
                    )}
                    {absIndex % 8 === 0 && absIndex !== 0 && (
                      <div className="absolute -right-32 top-0 text-7xl animate-[float_5s_ease-in-out_infinite] hidden sm:block">🦖</div>
                    )}

                    <span className={`mt-4 font-black text-xs uppercase tracking-widest ${isLocked ? 'text-gray-200 dark:text-slate-700' : 'text-gray-400 dark:text-gray-500'}`}>
                      {topic.title.length > 10 ? topic.title.substring(0, 10) + '...' : topic.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="flex flex-col items-center pt-20 pb-40">
           <div className="text-9xl mb-6 drop-shadow-xl animate-pulse">🏆</div>
           <h3 className="font-black text-3xl text-gray-300 dark:text-slate-700 uppercase tracking-tighter">Legend Status Awaits</h3>
           <p className="text-gray-200 dark:text-slate-800 font-bold mt-2">Finish all units to claim your crown.</p>
        </div>
      </div>
    </div>
  );
};
