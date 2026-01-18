
import React, { useState, useRef } from 'react';
import { UserProfile, UserStats, Activity } from '../types';
import { uploadMedia } from '../supabaseClient';

interface ProfileProps {
  profile: UserProfile;
  stats: UserStats;
  activities: Activity[];
  setProfile: (p: UserProfile) => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, stats, activities, setProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'stats'>('posts');
  const [isUploading, setIsUploading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const userActivities = activities.filter(a => a.type === 'mission' || a.type === 'quiz');

  const handleSave = () => {
    setProfile(editData);
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const publicUrl = await uploadMedia(file);
    
    if (publicUrl) {
      if (type === 'avatar') {
        setEditData({ ...editData, avatar: publicUrl, is_custom_avatar: true });
      } else {
        setEditData({ ...editData, cover_avatar: publicUrl, is_custom_cover: true });
      }
    }
    setIsUploading(false);
  };

  const getAvatarUrl = (p: UserProfile) => {
    if (p.is_custom_avatar || p.avatar?.startsWith('http')) return p.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar || 'Felix'}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-40 animate-slide-up">
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />

      {/* Profile Banner */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden shadow-inner">
        <img 
          src={isEditing ? editData.cover_avatar : profile.cover_avatar} 
          alt="cover" 
          className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        {isEditing && (
          <button 
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-6 right-6 bg-white/90 dark:bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isUploading ? '📤 Uploading...' : '📸 Update Cover Photo'}
          </button>
        )}
      </div>

      {/* Profile Core Info Overlay */}
      <div className="max-w-4xl mx-auto px-4 relative -mt-20 md:-mt-24">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 md:p-10 shadow-2xl border border-gray-100 dark:border-white/5 ring-1 ring-black/5">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
            <div className="relative group">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-blue-50 dark:bg-slate-800 border-[8px] border-white dark:border-slate-900 shadow-2xl overflow-hidden relative transition-transform duration-500 hover:rotate-2">
                <img src={getAvatarUrl(isEditing ? editData : profile)} alt="avatar" className="w-full h-full object-cover" />
                {isUploading && (
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                     <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                )}
              </div>
              {isEditing && (
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-2xl hover:scale-110 active:scale-90 transition-all z-20 disabled:opacity-50"
                >
                  <span className="text-xl">📷</span>
                </button>
              )}
            </div>

            <div className="flex-1 text-center md:text-left mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-3">
                 <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Master Level {stats.level}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2 leading-none">
                {profile.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-bold mb-6 max-w-md leading-relaxed">
                {profile.bio}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-5">
                 <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">
                    <span className="text-lg">📍</span> {profile.location || 'Focus Hub'}
                 </div>
                 <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">
                    <span className="text-lg">✨</span> Joined {profile.joined_date}
                 </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4 md:mt-0">
              {isEditing ? (
                <>
                  <button onClick={handleSave} disabled={isUploading} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">Save Profile</button>
                  <button onClick={() => { setIsEditing(false); setEditData(profile); }} className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-gray-100 dark:border-white/5">Discard</button>
                </>
              ) : (
                <>
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95">+ Add Story</button>
                  <button onClick={() => setIsEditing(true)} className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-gray-200 dark:border-white/5 transition-all hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95">Edit Details</button>
                </>
              )}
            </div>
          </div>

          {/* Edit Drawer Integration */}
          {isEditing && (
            <div className="mt-12 p-8 bg-gray-50 dark:bg-slate-950/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10 space-y-8 animate-pop-out">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] ml-2">Public Identity</label>
                    <input 
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      placeholder="Display Name"
                      className="w-full bg-white dark:bg-slate-900 rounded-[1.5rem] px-6 py-4 font-black text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white shadow-sm"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] ml-2">Current Location</label>
                    <input 
                      value={editData.location || ''}
                      onChange={e => setEditData({...editData, location: e.target.value})}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-white dark:bg-slate-900 rounded-[1.5rem] px-6 py-4 font-black text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white shadow-sm"
                    />
                 </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] ml-2">About Your Journey</label>
                  <textarea 
                    value={editData.bio}
                    onChange={e => setEditData({...editData, bio: e.target.value})}
                    placeholder="Tell the community about your goals..."
                    className="w-full bg-white dark:bg-slate-900 rounded-[1.5rem] px-6 py-4 font-black text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white min-h-[120px] shadow-sm resize-none"
                  />
               </div>
            </div>
          )}

          {/* Secondary Tab Nav */}
          <div className="mt-10 border-t border-gray-100 dark:border-white/5 pt-8 flex gap-10 justify-center md:justify-start overflow-x-auto no-scrollbar">
             {['posts', 'about', 'stats'].map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {tab}
                 {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>}
               </button>
             ))}
          </div>
        </div>

        {/* Dynamic Tab Panels */}
        <div className="mt-10">
           {activeTab === 'posts' ? (
             <div className="space-y-6">
                {userActivities.length > 0 ? (
                  userActivities.map(act => (
                    <div key={act.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 animate-slide-up group transition-all hover:shadow-xl">
                       <div className="flex gap-5 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/20 overflow-hidden flex items-center justify-center text-3xl shadow-inner">
                             {act.type === 'mission' ? '🎯' : '📚'}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-1">Timeline Milestone</p>
                             <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tight">{act.message.split('!')[0]}</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{new Date(act.timestamp).toLocaleDateString()} • Public Post</p>
                          </div>
                       </div>
                       <p className="text-gray-700 dark:text-gray-300 font-bold leading-relaxed text-lg italic">"{act.message}"</p>
                       <div className="mt-8 flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-6">
                          <div className="flex gap-6">
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">👍 Like</button>
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">💬 Comment</button>
                          </div>
                          <button className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Share Timeline ↗️</button>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] text-center border-4 border-dashed border-gray-100 dark:border-slate-800">
                     <span className="text-7xl block mb-6 animate-pulse">🌱</span>
                     <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2">Start Your Story</h3>
                     <p className="text-gray-400 font-bold max-w-xs mx-auto">Crush your first mission or finish a unit to build your public timeline!</p>
                  </div>
                )}
             </div>
           ) : activeTab === 'about' ? (
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 space-y-12 animate-pop-out">
                <div className="space-y-4">
                   <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                     <span className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xs">📝</span>
                     Introduction
                   </h3>
                   <p className="text-gray-600 dark:text-gray-300 font-bold text-xl leading-relaxed italic border-l-4 border-blue-500 pl-6">
                     "{profile.bio}"
                   </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-2 border border-white/5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lives in</p>
                      <p className="text-lg font-black text-gray-800 dark:text-white">{profile.location || 'The Zone'}</p>
                   </div>
                   <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-2 border border-white/5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total XP</p>
                      <p className="text-lg font-black text-blue-600">{stats.xp}</p>
                   </div>
                   <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-2 border border-white/5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</p>
                      <p className="text-lg font-black text-purple-600">{profile.joined_date}</p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 animate-pop-out">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Mastery Statistics</h3>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-full">Updated Live</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                   <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] border border-blue-100 dark:border-white/5 group transition-all hover:-translate-y-2 shadow-sm">
                      <p className="text-4xl font-black text-blue-600 mb-2 group-hover:scale-110 transition-transform">{stats.xp}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total XP</p>
                   </div>
                   <div className="p-8 bg-orange-50 dark:bg-orange-900/20 rounded-[2.5rem] border border-orange-100 dark:border-white/5 group transition-all hover:-translate-y-2 shadow-sm">
                      <p className="text-4xl font-black text-orange-500 mb-2 group-hover:scale-110 transition-transform">{stats.streak}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Day Streak</p>
                   </div>
                   <div className="p-8 bg-purple-50 dark:bg-purple-900/20 rounded-[2.5rem] border border-purple-100 dark:border-white/5 group transition-all hover:-translate-y-2 shadow-sm">
                      <p className="text-4xl font-black text-purple-600 mb-2 group-hover:scale-110 transition-transform">{stats.completedLessonIds.length}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Skills Mastery</p>
                   </div>
                   <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-[2.5rem] border border-green-100 dark:border-white/5 group transition-all hover:-translate-y-2 shadow-sm">
                      <p className="text-4xl font-black text-green-500 mb-2 group-hover:scale-110 transition-transform">{activities.filter(a => a.type === 'mission').length}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quests Won</p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
