
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Layout } from './Layout';
import { Header } from './Header';
import { Dashboard } from './Dashboard';
import { TaskInput } from './TaskInput';
import { LessonPath } from './LessonPath';
import { AIChat } from './AIChat';
import { Settings } from './Settings';
import { Auth } from './Auth';
import { ProgressCalendar } from './ProgressCalendar';
import { Community } from './Community';
import { Messenger } from './Messenger';
import { Profile } from './Profile';
import { Mission, UserStats, Activity, UserProfile } from '../types';
import { breakDownTask } from '../geminiService';
import { Logo } from './Logo';

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActive: null,
  completedLessonIds: [],
};

const INITIAL_PROFILE: UserProfile = {
  name: 'Adventurer',
  avatar: 'Felix',
  cover_avatar: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  bio: 'Learning everyday with JustStart! 🚀✨',
  joined_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'coach' | 'community' | 'messenger' | 'profile' | 'settings'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null);
  
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('focusflow_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('focusflow_missions');
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('focusflow_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('focusflow_theme') as 'light' | 'dark') || 'light';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('focusflow_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const updateHeartbeat = async (userId: string) => {
    try {
      const now = new Date().toISOString();
      await supabase.from('profiles').upsert({
        id: userId,
        last_active: now,
        name: userProfile.name,
        avatar: userProfile.avatar,
        bio: userProfile.bio
      });
    } catch (e) {
      console.warn("Heartbeat update failed", e);
    }
  };

  const fetchCloudProfile = async (id: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        const syncedProfile: UserProfile = {
          ...INITIAL_PROFILE,
          name: data.name || INITIAL_PROFILE.name,
          avatar: data.avatar || INITIAL_PROFILE.avatar,
          bio: data.bio || INITIAL_PROFILE.bio,
          location: data.location || INITIAL_PROFILE.location,
          is_custom_avatar: data.avatar?.startsWith('http') || data.avatar?.startsWith('data:image')
        };
        setUserProfile(syncedProfile);
        localStorage.setItem('focusflow_profile', JSON.stringify(syncedProfile));
      }
    } catch (e) {
      console.warn("Cloud profile fetch warning", e);
    }
  };

  const logActivity = (type: Activity['type'], message: string, status: Activity['status'] = 'info') => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now(),
      status
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 100));
  };

  const completeLesson = useCallback((lessonId: string) => {
    setStats(curr => {
      if (curr.completedLessonIds.includes(lessonId)) return curr;
      const newXP = curr.xp + 50;
      const newLevel = Math.floor(newXP / 100) + 1;
      logActivity('quiz', `Finished a training unit! +50 XP`, 'success');
      return {
        ...curr,
        completedLessonIds: [...curr.completedLessonIds, lessonId],
        xp: newXP,
        level: newLevel
      };
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        fetchCloudProfile(activeUser.id);
        updateHeartbeat(activeUser.id);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (event === 'SIGNED_IN' && activeUser) {
        logActivity('auth', 'Signed into cloud persistence', 'success');
        fetchCloudProfile(activeUser.id);
        updateHeartbeat(activeUser.id);
      }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => updateHeartbeat(user.id), 45000);
    return () => clearInterval(interval);
  }, [user, userProfile]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('focusflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('focusflow_stats', JSON.stringify(stats));
    localStorage.setItem('focusflow_activities', JSON.stringify(activities));
  }, [stats, activities]);

  useEffect(() => {
    localStorage.setItem('focusflow_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem('focusflow_profile', JSON.stringify(userProfile));
    if (user?.id) updateHeartbeat(user.id);
  }, [userProfile, user]);

  const handleStartChat = (userId: string) => {
    setTargetChatUserId(userId);
    setActiveTab('messenger');
  };

  const handleCreateMission = async (taskName: string) => {
    setLoading(true);
    setError(null);
    try {
      const breakdown = await breakDownTask(taskName);
      const newMission: Mission = {
        id: crypto.randomUUID(),
        name: breakdown.missionName,
        steps: breakdown.steps.map((s, i) => ({ id: `step-${i}-${Date.now()}`, text: s, completed: false })),
        focusTimeMinutes: breakdown.focusTimeMinutes,
        xpReward: breakdown.xpReward,
        encouragement: breakdown.encouragement,
        createdAt: Date.now(),
      };
      setMissions(prev => [newMission, ...prev]);
      logActivity('mission', `New Mission: ${breakdown.missionName}`, 'info');
      
      const today = new Date().toDateString();
      if (stats.lastActive !== today) {
        setStats(prev => ({
          ...prev,
          streak: prev.lastActive === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1,
          lastActive: today,
        }));
      }
    } catch (err) {
      setError("Oops! My AI brain got a little dizzy. Try again?");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = useCallback((missionId: string, stepId: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      const stepIndex = m.steps.findIndex(s => s.id === stepId);
      const isCompleting = !m.steps[stepIndex].completed;
      if (isCompleting) setStats(curr => ({...curr, xp: curr.xp + 5}));

      const newSteps = m.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
      const allDone = newSteps.every(s => s.completed);
      
      if (isCompleting) logActivity('system', `Completed step in: ${m.name}`, 'info');
      if (allDone && isCompleting) {
        setStats(curr => ({...curr, xp: curr.xp + m.xpReward}));
        logActivity('mission', `Mission Accomplished: ${m.name}!`, 'success');
      }
      return { ...m, steps: newSteps };
    }));
  }, []);

  const handleClearData = () => {
    if (confirm("Are you sure? This will reset your progress on this device.")) {
       setMissions([]);
       setActivities([]);
       setStats(INITIAL_STATS);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <Logo size={100} dark={theme === 'dark'} className="animate-bounce" />
      </div>
    );
  }

  if (!user || recoveryMode) {
    return <Auth recoveryMode={recoveryMode} onCompleteRecovery={() => setRecoveryMode(false)} />;
  }

  return (
    <Layout>
      {(activeTab === 'home' || activeTab === 'lessons') && <Header stats={stats} />}
      
      <div className={`mx-auto pb-48 transition-all duration-500 pt-6 ${activeTab === 'coach' || activeTab === 'settings' || activeTab === 'community' || activeTab === 'messenger' || activeTab === 'profile' ? 'max-w-full min-h-screen pt-0' : 'max-w-2xl'}`}>
        {activeTab === 'home' ? (
          <div className="animate-slide-up space-y-8 px-4">
            <div className="flex justify-between items-center">
              <div className="dark:text-white">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Hello, {userProfile.name}!</h1>
                <p className="text-gray-500 font-medium">Level up your skills with <span className="text-purple-600 dark:text-purple-400">FocusFlow!</span></p>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-soft border-2 border-white dark:border-slate-700 transition-transform active:scale-95"
              >
                <img src={userProfile.avatar?.startsWith('http') || userProfile.avatar?.startsWith('data:image') ? userProfile.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.avatar}`} alt="avatar" />
              </button>
            </div>

            <div className="bg-[#f3f0ff] dark:bg-purple-900/30 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-soft border border-white dark:border-white/10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-300 dark:bg-purple-600 blur-3xl opacity-20 group-hover:scale-125 transition-transform"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-4">
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white max-w-[150px]">Learn Smarter with AI-Powered Guidance</h2>
                  <button 
                    onClick={() => setActiveTab('coach')}
                    className="bg-[#1e1b4b] dark:bg-purple-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:scale-105 transition-transform shadow-lg"
                  >
                    Start with AI
                  </button>
                </div>
                <div className="animate-float">
                  <Logo size={80} dark={theme === 'dark'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-soft border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-xl">🔥</div>
                <div>
                  <div className="text-sm font-black text-gray-900 dark:text-white">{stats.streak} Days</div>
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Streak</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-soft border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-xl">💎</div>
                <div>
                  <div className="text-sm font-black text-gray-900 dark:text-white">{stats.xp} XP</div>
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total XP</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Active Missions</h3>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">{missions.length} active</span>
              </div>
              <TaskInput onSubmit={handleCreateMission} isLoading={loading} />
              {error && <p className="text-red-500 text-center mt-2 text-sm font-bold">{error}</p>}
              <Dashboard 
                missions={missions} 
                onToggleStep={handleToggleStep} 
                onDeleteMission={(id) => setMissions(prev => prev.filter(m => m.id !== id))}
              />
            </div>

            <div className="space-y-6 pt-4">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Practice Log</h3>
               </div>
               <ProgressCalendar activities={activities} />
            </div>
          </div>
        ) : activeTab === 'lessons' ? (
          <LessonPath 
            completedLessonIds={stats.completedLessonIds} 
            onComplete={completeLesson} 
          />
        ) : activeTab === 'coach' ? (
          <AIChat />
        ) : activeTab === 'community' ? (
          <Community userProfile={userProfile} user={user} onStartChat={handleStartChat} />
        ) : activeTab === 'messenger' ? (
          <Messenger user={user} userProfile={userProfile} initialTargetId={targetChatUserId} onClearTarget={() => setTargetChatUserId(null)} />
        ) : activeTab === 'profile' ? (
          <Profile profile={userProfile} stats={stats} activities={activities} setProfile={setUserProfile} />
        ) : activeTab === 'settings' ? (
          <Settings 
            theme={theme} 
            setTheme={setTheme} 
            profile={userProfile} 
            setProfile={setUserProfile}
            onClearData={handleClearData}
          />
        ) : null}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 z-[90]">
        <nav className="max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2 py-2 flex justify-around items-center shadow-2xl rounded-[3rem] border border-gray-100 dark:border-white/5 ring-1 ring-black/5">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-full ${activeTab === 'home' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Home</span>
          </button>
          <button onClick={() => setActiveTab('community')} className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-full ${activeTab === 'community' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}>
            <span className="text-2xl">🌐</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Feed</span>
          </button>
          <button onClick={() => setActiveTab('messenger')} className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-full ${activeTab === 'messenger' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}>
            <span className="text-2xl">💬</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Chats</span>
          </button>
          
          <button onClick={() => setActiveTab('coach')} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-purple-600 text-white shadow-lg active:scale-95 ${activeTab === 'coach' ? 'scale-110' : 'opacity-80'}`}>
            <Logo size={40} dark />
          </button>
          
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-full ${activeTab === 'profile' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}>
            <span className="text-2xl">👤</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Profile</span>
          </button>
          
          <button onClick={() => setActiveTab('lessons')} className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-full ${activeTab === 'lessons' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400'}`}>
            <span className="text-2xl">📚</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Quiz</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition-all px-3 py-2 rounded-full ${activeTab === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}>
            <span className="text-2xl">⚙️</span>
            <span className="text-[8px] font-black uppercase tracking-tight">Settings</span>
          </button>
        </nav>
      </div>
    </Layout>
  );
};

export default App;
