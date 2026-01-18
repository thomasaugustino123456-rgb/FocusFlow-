
import React, { useEffect, useRef } from 'react';
import { Logo } from './Logo';

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const revealRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    revealRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden selection:bg-purple-100 font-sans">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-200/40 dark:bg-purple-900/10 blur-[140px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 dark:bg-blue-900/10 blur-[140px] rounded-full animate-float"></div>
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-indigo-200/20 dark:bg-indigo-900/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Modern Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
             <Logo size={28} dark={false} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase text-gray-900 dark:text-white">JustStart</span>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={onGetStarted} className="hidden sm:block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">Sign In</button>
           <button 
             onClick={onGetStarted}
             className="text-xs font-black uppercase tracking-widest bg-blue-600 dark:bg-white dark:text-gray-900 text-white px-8 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200 dark:shadow-none"
           >
             Get Started
           </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="px-6 pt-20 pb-32 text-center max-w-5xl mx-auto space-y-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-2.5 rounded-full border border-blue-100/50 dark:border-white/5 mb-4 shadow-sm">
            <span className="text-xl">🦉</span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.3em]">Built for the Class of 2025</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tighter">
            PROCRASTINATION <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">ENDS HERE.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-bold max-w-3xl mx-auto leading-tight px-4">
            The AI study companion that turns your overwhelming "To-Do" list into a series of winnable, gamified missions. 
          </p>

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl uppercase tracking-tighter shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              Start Your Flow 
              <span className="group-hover:translate-x-1 transition-transform">🚀</span>
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-8 pt-12 grayscale opacity-40">
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black">50k+</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Students</span>
             </div>
             <div className="w-px h-8 bg-gray-200"></div>
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black">1M+</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Tasks Done</span>
             </div>
             <div className="w-px h-8 bg-gray-200"></div>
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black">4.9/5</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Rating</span>
             </div>
          </div>
        </section>

        {/* HOW IT WORKS: THE AI MAGIC */}
        <section ref={addToRefs} className="reveal px-6 py-32 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500 rounded-full blur-[200px]"></div>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <div className="space-y-8">
                <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Your AI Mission Builder.</h2>
                <p className="text-xl text-blue-100/70 font-medium leading-relaxed">
                   Type a big goal—like "Study for History Final"—and watch JustStart's AI break it into tiny 10-minute steps. We handle the planning; you handle the crushing.
                </p>
                <div className="space-y-4 pt-4">
                   {[
                     { icon: '🪄', title: 'Stress-Free Breakdown', text: 'No more "where do I start?"' },
                     { icon: '💎', title: 'XP & Rewards', text: 'Level up your avatar for every task.' },
                     { icon: '🔥', title: 'Streak Protection', text: 'Build momentum that never dies.' }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <span className="text-3xl">{item.icon}</span>
                        <div>
                           <h4 className="font-black uppercase text-sm tracking-tight">{item.title}</h4>
                           <p className="text-xs text-white/50 font-medium">{item.text}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="relative">
                {/* Visual Mockup Card */}
                <div className="bg-white rounded-[3rem] p-8 shadow-2xl animate-float">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl">🎯</div>
                      <div>
                        <h4 className="font-black text-gray-900 uppercase">History Final</h4>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Generated Plan</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-blue-500/20 ring-4 ring-blue-500/5">
                         <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                         </div>
                         <span className="text-sm font-bold text-gray-900">Read Chapter 5 Summary</span>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl opacity-40">
                         <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                         <span className="text-sm font-bold text-gray-500">Note 3 Key Battles</span>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl opacity-40">
                         <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                         <span className="text-sm font-bold text-gray-500">Take 10min Break</span>
                      </div>
                   </div>
                   <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Reward: +150 XP</span>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">💎</div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* FEATURE BENTO GRID */}
        <section ref={addToRefs} className="reveal px-6 py-32 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <h3 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.4em]">Everything you need</h3>
             <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Designed for Mastery.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Large Column */}
             <div className="md:col-span-2 bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
                <div className="relative z-10 space-y-6">
                   <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Live Voice <br /> Study Mode</h3>
                   <p className="text-xl text-blue-100 font-medium max-w-md">
                      Don't feel like typing? Talk to Starty. It's a low-latency voice conversation that keeps you focused and motivated in real-time.
                   </p>
                   <div className="pt-4 flex gap-2">
                      {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-8 bg-white/30 rounded-full animate-pulse" style={{animationDelay: `${i*0.2}s`}}></div>)}
                   </div>
                </div>
                <div className="absolute right-[-10%] bottom-[-10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
                <span className="absolute bottom-10 right-10 text-8xl opacity-20 select-none">🎙️</span>
             </div>
             
             {/* Small Column */}
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-soft border border-gray-100 dark:border-white/5 space-y-6 flex flex-col justify-center">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-4xl">📚</div>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Skill Quizzes</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                   50+ Interactive units. Master anything from "Social Skills 101" to "Coding Basics" while earning real XP.
                </p>
             </div>

             <div className="bg-orange-50 dark:bg-orange-900/10 rounded-[3rem] p-10 border border-orange-100/50 dark:border-white/5 space-y-6">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center text-4xl shadow-sm">🔥</div>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Global Feed</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                   See what other students are crushing. Share your wins, build your profile, and join a global community of high-performers.
                </p>
             </div>

             <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-soft border border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1 space-y-4">
                   <h4 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Persistence Lab</h4>
                   <p className="text-base text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                      Your data is secure and always in sync. Switch between devices and never lose a single second of focus time.
                   </p>
                </div>
                <div className="shrink-0 flex gap-4">
                   <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-3xl">💻</div>
                   <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl">📱</div>
                </div>
             </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section ref={addToRefs} className="reveal px-6 py-40 text-center">
           <div className="max-w-3xl mx-auto space-y-12">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-20 animate-pulse"></div>
                <Logo size={120} className="relative z-10" />
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                READY TO BE <br />UNSTOPPABLE?
              </h2>
              <p className="text-lg md:text-xl text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest leading-none">
                Zero Excuses. Infinite Flow. JustStart.
              </p>
              <div className="pt-6">
                <button 
                  onClick={onGetStarted}
                  className="bg-blue-600 text-white px-16 py-8 rounded-[3rem] font-black text-2xl uppercase tracking-tighter shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  Create Your Mission 🚀
                </button>
              </div>
              <p className="text-xs font-black text-gray-300 uppercase tracking-widest pt-4">Free forever for students.</p>
           </div>
        </section>

        <footer className="px-6 py-20 border-t border-gray-100 dark:border-white/5 text-center">
          <div className="flex flex-col items-center gap-6">
             <div className="flex items-center gap-2">
                <Logo size={32} />
                <span className="font-black text-base uppercase tracking-widest text-gray-900 dark:text-white">JustStart</span>
             </div>
             <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Instagram</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
             </div>
             <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.5em]">2025 AI-First Productivity • Proudly Independent</p>
          </div>
        </footer>
      </main>

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          filter: blur(10px);
          transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
        @keyframes voice-bar {
          from { height: 20%; }
          to { height: 100%; }
        }
      `}</style>
    </div>
  );
};
