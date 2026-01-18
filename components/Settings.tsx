
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
// Import UserProfile to correctly type the props
import { UserProfile } from '../types';

interface SettingsProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  // Updated profile and setProfile to use UserProfile to avoid type mismatch in parent component
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, profile, setProfile, onClearData }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [justSaved, setJustSaved] = useState(false);
  const [showGithubGuide, setShowGithubGuide] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleNameSave = () => {
    const trimmedName = nameInput.trim();
    if (trimmedName && trimmedName !== profile.name) {
      setProfile({ ...profile, name: trimmedName });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
    setIsEditingName(false);
  };

  const handleCancel = () => {
    setNameInput(profile.name);
    setIsEditingName(false);
  };

  const changeAvatar = () => {
    const seeds = ['Felix', 'Aneka', 'Caleb', 'Zoe', 'Max', 'Luna', 'Kiki', 'Jasper', 'Sasha'];
    const currentIndex = seeds.indexOf(profile.avatar);
    const nextIndex = (currentIndex + 1) % seeds.length;
    setProfile({ ...profile, avatar: seeds[nextIndex] });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <div className="min-h-screen pb-40 animate-slide-up bg-transparent">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-white/5 transition-all">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Personalize your learning journey</p>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-10">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-soft border border-gray-100 dark:border-white/5 flex flex-col items-center gap-6 transition-colors relative">
          {justSaved && (
            <div className="absolute top-6 right-8 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pop-out shadow-lg">
              Saved! ✨
            </div>
          )}

          <button 
            onClick={changeAvatar}
            className="relative group bouncy"
          >
            <div className="w-28 h-28 bg-purple-50 dark:bg-purple-900/30 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl transition-all group-hover:ring-4 group-hover:ring-purple-200 dark:group-hover:ring-purple-900/40">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-1 right-1 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-lg">🔄</span>
            </div>
          </button>
          
          <div className="text-center w-full space-y-2">
            {isEditingName ? (
              <div className="flex flex-col gap-3 items-center justify-center animate-pop-out">
                <input 
                  autoFocus
                  className="bg-gray-50 dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 rounded-xl px-4 py-2 font-bold text-center text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all text-xl w-full max-w-[240px]"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleNameSave}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1"
                  >
                    <span>✓</span> Save
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1"
                  >
                    <span>✕</span> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{profile.name}</h2>
                <span className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">✏️</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">CLOUD SYNCED</span>
            </div>
          </div>
        </div>

        {/* GitHub Sync Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4">Development</h3>
          <div className="bg-[#1e1b4b] dark:bg-slate-800 rounded-[2rem] p-6 shadow-soft border border-white/10 group transition-all">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🐙</div>
                  <div>
                    <p className="font-bold text-white">GitHub Sync</p>
                    <p className="text-xs font-medium text-purple-300">Save your app to the cloud</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGithubGuide(!showGithubGuide)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all"
                >
                  {showGithubGuide ? 'Close' : 'How?'}
                </button>
             </div>
             
             {showGithubGuide && (
               <div className="mt-6 space-y-4 animate-pop-out border-t border-white/5 pt-6">
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                    <p className="text-sm text-purple-100 font-medium">Create a new <b>Public Repository</b> on GitHub.com named <code>FocusFlow</code>.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                    <p className="text-sm text-purple-100 font-medium">Click <b>"uploading an existing file"</b> on your new GitHub page.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                    <p className="text-sm text-purple-100 font-medium">Drag and drop all your files (App.tsx, index.html, etc.) and click <b>Commit</b>!</p>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4">Preference</h3>
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-soft border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 transition-colors">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-2xl">🌓</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Easier on the eyes at night</p>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${
                    theme === 'dark' ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4">Account</h3>
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-soft border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 transition-colors">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-6 text-left group hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👋</div>
                  <div>
                    <p className="font-bold text-orange-600 dark:text-orange-400">Sign Out</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Sign out of your session</p>
                  </div>
                </div>
                <span className="text-gray-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform">❯</span>
              </button>

              <button 
                onClick={onClearData}
                className="w-full flex items-center justify-between p-6 text-left group hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚠️</div>
                  <div>
                    <p className="font-bold text-red-600 dark:text-red-400">Reset Local Progress</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Delete missions stored on this device</p>
                  </div>
                </div>
                <span className="text-gray-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform">❯</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-10 pb-10">
          <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.5em]">FocusFlow App v1.3.1</p>
        </div>
      </div>
    </div>
  );
};
