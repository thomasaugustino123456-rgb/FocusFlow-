
import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadMedia } from '../supabaseClient';
import { CommunityPost, Story, UserProfile } from '../types';

interface CommunityProps {
  userProfile: UserProfile;
  user: any;
  onStartChat?: (userId: string) => void;
}

export const Community: React.FC<CommunityProps> = ({ userProfile, user, onStartChat }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  
  const storyInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    fetchStories();
    fetchOnlineStatus();

    const channel = supabase
      .channel('community_v2_modern')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (p) => setPosts(prev => [p.new as CommunityPost, ...prev]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, (p) => setStories(prev => [p.new as Story, ...prev]))
      .subscribe();

    const interval = setInterval(fetchOnlineStatus, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchOnlineStatus = async () => {
    const { data } = await supabase.from('profiles').select('id, last_active');
    if (data) {
      const status: Record<string, boolean> = {};
      data.forEach(p => {
        status[p.id] = new Date(p.last_active).getTime() > Date.now() - 5 * 60 * 1000;
      });
      setOnlineUsers(status);
    }
  };

  const fetchStories = async () => {
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setStories(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(30);
    if (data) setPosts(data);
  };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStory(true);
    try {
      const url = await uploadMedia(file);
      await supabase.from('stories').insert([{
        user_id: user.id,
        user_name: userProfile.name,
        user_avatar: userProfile.avatar,
        image_url: url
      }]);
      fetchStories();
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!newPostContent.trim() && !postImage) return;
    setLoading(true);
    try {
      const imgUrl = postImage ? await uploadMedia(postImage) : '';
      await supabase.from('community_posts').insert([{
        user_id: user.id,
        user_name: userProfile.name,
        user_avatar: userProfile.avatar,
        content: newPostContent,
        image_url: imgUrl
      }]);
      setNewPostContent('');
      setPostImage(null);
      setPostPreview(null);
      setShowPostModal(false);
      fetchPosts();
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = (seed: string) => {
    if (seed?.startsWith('http') || seed?.startsWith('data:')) return seed;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'Adventurer'}`;
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen pb-40">
      {/* Modern Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-6 pt-12 pb-4 sticky top-0 z-50">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Community</h1>
            <div className="flex gap-4">
               <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-lg cursor-pointer">🔍</div>
               <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-lg cursor-pointer">➕</div>
            </div>
         </div>
      </div>

      <div className="max-w-xl mx-auto space-y-4 pt-4 px-4">
        {/* Post Creator Bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 border border-gray-100 dark:border-white/5">
          <div className="relative shrink-0">
            <img src={getAvatar(userProfile.avatar)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          <button 
            onClick={() => setShowPostModal(true)}
            className="flex-1 bg-gray-50 dark:bg-slate-800 text-left px-5 py-3 rounded-2xl text-gray-500 dark:text-gray-400 font-bold text-sm transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            What are you learning today?
          </button>
          <button className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-xl" onClick={() => postImageInputRef.current?.click()}>🖼️</button>
        </div>

        {/* Stories - Horizontal Scroll */}
        <div className="overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
          <div className="flex gap-3">
            {/* Create Story */}
            <div className="shrink-0 w-32 h-52 bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden relative border border-gray-100 dark:border-white/5 cursor-pointer group shadow-sm" onClick={() => storyInputRef.current?.click()}>
              <div className="h-2/3 overflow-hidden bg-gray-200">
                <img src={getAvatar(userProfile.avatar)} className="w-full h-full object-cover group-hover:scale-110 transition-transform opacity-80" />
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                <div className="w-10 h-10 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-xl font-bold shadow-lg">+</div>
              </div>
              <div className="absolute bottom-4 w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Share Story</div>
              <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleStoryUpload} />
            </div>

            {/* Stories */}
            {stories.map(s => (
              <div key={s.id} onClick={() => setViewingStory(s)} className="shrink-0 w-32 h-52 rounded-[2rem] overflow-hidden relative border border-gray-100 dark:border-white/5 cursor-pointer shadow-sm group">
                <img src={s.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 w-10 h-10 rounded-full border-2 border-blue-600 overflow-hidden bg-white shadow-xl">
                  <img src={getAvatar(s.user_avatar)} className="w-full h-full object-cover" />
                </div>
                <p className="absolute bottom-4 left-4 right-4 text-[10px] font-black text-white leading-tight uppercase tracking-tight truncate">{s.user_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Post Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden animate-slide-up">
              <div className="p-5 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <img src={getAvatar(post.user_avatar)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                    {onlineUsers[post.user_id] && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-black text-gray-900 dark:text-white leading-tight">
                      {post.user_name}
                    </h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {new Date(post.created_at).toLocaleDateString()} • Student Feed
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-gray-300">•••</button>
              </div>
              
              <div className="px-6 pb-4">
                <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{post.content}</p>
              </div>

              {post.image_url && (
                <div className="px-4 pb-4">
                  <img src={post.image_url} className="w-full h-auto max-h-[500px] object-cover rounded-[2rem] shadow-inner" />
                </div>
              )}

              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
                <button className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                  <span>👍</span> {post.likes || 0}
                </button>
                <button className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-purple-600 transition-colors">
                  <span>💬</span> {post.comments_count || 0}
                </button>
                <button className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <span>⤴️</span> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col animate-slide-up">
           <div className="px-6 pt-12 pb-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
             <button onClick={() => setShowPostModal(false)} className="text-gray-400 text-sm font-black uppercase tracking-widest">Cancel</button>
             <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Create Post</h3>
             <button 
               onClick={handlePostSubmit} 
               disabled={loading || !newPostContent.trim()}
               className={`font-black text-sm uppercase tracking-widest transition-all ${!newPostContent.trim() ? 'text-gray-300' : 'text-blue-600'}`}
             >
               {loading ? 'Posting...' : 'Post'}
             </button>
           </div>
           
           <div className="p-6 flex gap-4 items-center">
             <img src={getAvatar(userProfile.avatar)} className="w-14 h-14 rounded-full shadow-xl" />
             <div>
               <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{userProfile.name}</p>
               <div className="inline-flex items-center gap-1.5 text-[10px] bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
                 🌐 Public Feed
               </div>
             </div>
           </div>

           <textarea 
             autoFocus
             placeholder="What's your goal for today?"
             value={newPostContent}
             onChange={e => setNewPostContent(e.target.value)}
             className="flex-1 p-6 text-xl md:text-2xl font-bold bg-transparent outline-none resize-none dark:text-white placeholder:text-gray-200 dark:placeholder:text-gray-700"
           />

           {postPreview && (
              <div className="px-6 relative">
                 <button onClick={() => { setPostImage(null); setPostPreview(null); }} className="absolute top-8 right-8 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">✕</button>
                 <img src={postPreview} className="w-full max-h-60 object-cover rounded-[2rem] shadow-2xl mb-6" />
              </div>
           )}

           <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-4 bg-gray-50 dark:bg-slate-800/50">
             <button className="flex-1 bg-white dark:bg-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center gap-2" onClick={() => postImageInputRef.current?.click()}>
                <span>🖼️</span> Photo / Video
             </button>
             <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={(e) => {
               const f = e.target.files?.[0];
               if(f) { setPostImage(f); const r = new FileReader(); r.onload = () => setPostPreview(r.result as string); r.readAsDataURL(f); }
             }} />
           </div>
        </div>
      )}
    </div>
  );
};
