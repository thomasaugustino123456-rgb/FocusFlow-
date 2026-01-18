
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const SqlEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'setup' | 'explorer'>('setup');
  const [results, setResults] = useState<any[] | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableStatus, setTableStatus] = useState<Record<string, 'loading' | 'missing' | 'ready'>>({
    profiles: 'loading',
    community_posts: 'loading',
    stories: 'loading',
    direct_messages: 'loading'
  });

  const fullSqlSchema = `-- JUSTSTART MASTER REPAIR SCRIPT V15
-- OPTIMIZED FOR PRIORITY DISCOVERY

-- 1. RE-CREATE PROFILES (ENSURE last_active IS INDEXED)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  name text,
  avatar text,
  bio text,
  location text,
  last_active timestamp with time zone DEFAULT now()
);
-- Clean up old indexes and add high-performance discovery index
DROP INDEX IF EXISTS idx_profiles_last_active;
CREATE INDEX IF NOT EXISTS idx_profiles_discovery ON profiles(last_active DESC);

-- 2. ENSURE OTHER TABLES
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  user_avatar text,
  content text,
  image_url text,
  type text DEFAULT 'thought',
  likes int DEFAULT 0,
  dislikes int DEFAULT 0,
  comments_count int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  user_avatar text,
  image_url text,
  media_type text DEFAULT 'image',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. RESET PERMISSIONS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public posts are viewable" ON community_posts;
CREATE POLICY "Public posts are viewable" ON community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public stories are viewable" ON stories;
CREATE POLICY "Public stories are viewable" ON stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create stories" ON stories;
CREATE POLICY "Users can create stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can see their messages" ON direct_messages;
CREATE POLICY "Users can see their messages" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 4. ENABLE REALTIME
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_posts, stories, direct_messages, profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;`;

  useEffect(() => {
    checkTables();
    const interval = setInterval(checkTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkTables = async () => {
    const tables = ['profiles', 'community_posts', 'stories', 'direct_messages'];
    const status: any = {};
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      status[table] = error ? 'missing' : 'ready';
    }
    setTableStatus(status);
  };

  const handleRunQuery = async () => {
    setExecuting(true);
    setError(null);
    try {
      const { data, error: pgError } = await supabase.from('profiles').select('*').limit(15);
      if (pgError) throw pgError;
      setResults(data);
    } catch (err: any) {
      setError(JSON.stringify(err, null, 2));
      setResults(null);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-40 animate-slide-up px-4">
      <div className="max-w-4xl mx-auto pt-12">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5">
          <div className="p-10 bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Persistence Lab</h1>
            <p className="font-bold opacity-80 text-sm mt-1 leading-relaxed">Infrastructure & Realtime Diagnostics</p>
          </div>
          
          <div className="flex bg-gray-50 dark:bg-slate-800/50 p-2">
            <button onClick={() => setActiveTab('setup')} className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-gray-400'}`}>1. SQL Fix V15</button>
            <button onClick={() => setActiveTab('explorer')} className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'explorer' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md' : 'text-gray-400'}`}>2. Explorer</button>
          </div>

          <div className="p-10">
            {activeTab === 'setup' ? (
              <div className="space-y-12">
                <div>
                   <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">Database Integrity Status</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(tableStatus).map(([name, status]) => (
                        <div key={name} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                           <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{name}</span>
                           <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${status === 'ready' ? 'bg-green-500 shadow-lg' : 'bg-red-500 shadow-lg animate-pulse'}`}></span>
                              <span className={`text-[10px] font-black uppercase ${status === 'ready' ? 'text-green-500' : 'text-red-500'}`}>{status === 'ready' ? 'Active' : 'Missing'}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-10 rounded-[3rem] border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-4xl">🛠️</span>
                     <h3 className="text-blue-700 dark:text-blue-300 font-black text-xl uppercase tracking-tight">V15 Master Repair</h3>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-bold mb-8 leading-relaxed">
                    This version optimizes discovery for the Facebook Messenger UI with priority online sorting.
                  </p>
                  <button onClick={() => { navigator.clipboard.writeText(fullSqlSchema); alert("Repair Script V15 Copied!"); }} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-200">Copy V15 Script</button>
                </div>

                <div className="relative group">
                  <pre className="bg-slate-900 text-blue-300 p-10 rounded-[3rem] text-[10px] font-mono h-[350px] overflow-y-auto border-2 border-slate-800 shadow-2xl">
                    {fullSqlSchema}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center px-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Discovery</h4>
                  <button onClick={handleRunQuery} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-all">Scan Network</button>
                </div>
                {error && <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-[2.5rem] text-red-600 dark:text-red-400 text-xs font-mono break-all whitespace-pre-wrap border border-red-100 dark:border-red-900/20">{error}</div>}
                {results && (
                  <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 overflow-x-auto border border-gray-100 dark:border-white/5 shadow-inner">
                    <pre className="text-[10px] font-mono text-gray-500 dark:text-gray-300 leading-relaxed">{JSON.stringify(results, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
