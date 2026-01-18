
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { DirectMessage, Contact } from '../types';

interface MessengerProps {
  user: any;
  userProfile: { name: string; avatar: string; bio?: string };
  initialTargetId?: string | null;
  onClearTarget?: () => void;
}

export const Messenger: React.FC<MessengerProps> = ({ user, userProfile, initialTargetId, onClearTarget }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Discovery & Presence Engine
  useEffect(() => {
    updatePresence();
    fetchContacts();

    // Listen for new users logging in or updating their presence
    const sub = supabase
      .channel('messenger_presence_v15')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchContacts();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, p => {
        const msg = p.new as DirectMessage;
        if (selectedContact && (
          (msg.sender_id === selectedContact.id && msg.receiver_id === user.id) || 
          (msg.sender_id === user.id && msg.receiver_id === selectedContact.id)
        )) {
          setMessages(prev => [...prev, msg]);
        }
        fetchContacts(); // Update preview snippets
      })
      .subscribe();

    // High-frequency heartbeat for the chat section
    const hbInterval = setInterval(updatePresence, 20000);
    return () => {
      supabase.removeChannel(sub);
      clearInterval(hbInterval);
    };
  }, [selectedContact, user.id]);

  useEffect(() => {
    if (initialTargetId && contacts.length > 0) {
      const target = contacts.find(c => c.id === initialTargetId);
      if (target) {
        setSelectedContact(target);
        fetchMessages(target.id);
        if (onClearTarget) onClearTarget();
      }
    }
  }, [initialTargetId, contacts]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updatePresence = async () => {
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        last_active: new Date().toISOString(),
        name: userProfile.name,
        avatar: userProfile.avatar,
        bio: userProfile.bio || 'Active on JustStart'
      });
    } catch (e) {
      console.warn("Presence update failed", e);
    }
  };

  const fetchContacts = async () => {
    // Fetch users and sort: Online first, then by last active time
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .order('last_active', { ascending: false });
    
    if (data) {
      const mappedContacts = data.map((p: any) => {
        const isOnline = new Date(p.last_active).getTime() > Date.now() - 3 * 60 * 1000;
        return {
          id: p.id,
          name: p.name || 'Student',
          avatar: p.avatar || 'Felix',
          is_online: isOnline,
          last_message: 'Active recently'
        };
      });

      // Sort: Online users strictly at the top
      const sorted = mappedContacts.sort((a, b) => {
        if (a.is_online === b.is_online) return 0;
        return a.is_online ? -1 : 1;
      });

      setContacts(sorted);
    }
  };

  const fetchMessages = async (contactId: string) => {
    setLoading(true);
    const { data } = await supabase.from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;
    const { error } = await supabase.from('direct_messages').insert([{
      sender_id: user.id,
      receiver_id: selectedContact.id,
      content: newMessage.trim(),
    }]);
    if (!error) setNewMessage('');
  };

  const getAvatar = (seed: string) => {
    if (seed?.startsWith('http') || seed?.startsWith('data:')) return seed;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'Adventurer'}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header - Messenger Style */}
      {!selectedContact ? (
        <div className="px-5 pt-6 pb-2 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="text-2xl font-extrabold text-gray-900 tracking-tight">Messages</div>
           </div>
           <div className="flex gap-4">
             <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-lg cursor-pointer hover:bg-gray-200">⚙️</div>
             <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-lg cursor-pointer hover:bg-gray-200">🔍</div>
           </div>
        </div>
      ) : (
        <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
          <button onClick={() => setSelectedContact(null)} className="text-blue-600 text-2xl px-2">❮</button>
          <div className="relative">
            <img src={getAvatar(selectedContact.avatar)} className="w-10 h-10 rounded-full border border-gray-100" />
            {selectedContact.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>}
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="font-bold text-gray-900 leading-tight truncate">{selectedContact.name}</p>
             <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedContact.is_online ? 'text-green-500' : 'text-gray-400'}`}>
               {selectedContact.is_online ? 'Active now' : 'Offline'}
             </p>
          </div>
          <div className="flex gap-5 text-blue-600 text-xl px-2">
             <span className="cursor-pointer">📞</span>
             <span className="cursor-pointer">📹</span>
          </div>
        </div>
      )}

      {!selectedContact ? (
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {/* Horizontal Active/Notes Bar - Facebook style */}
          <div className="px-5 py-4 flex gap-5 overflow-x-auto no-scrollbar border-b border-gray-50">
             {/* Current User Note */}
             <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative">
                  <img src={getAvatar(userProfile.avatar)} className="w-[68px] h-[68px] rounded-full border-2 border-gray-100 shadow-sm" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-2xl text-[9px] font-bold shadow-md border border-gray-100 whitespace-nowrap">
                    Share a note...
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45"></div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">Your note</span>
             </div>
             
             {/* Contact Notes - Strictly Online First */}
             {contacts.map(c => (
               <div key={c.id} onClick={() => { setSelectedContact(c); fetchMessages(c.id); }} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                  <div className="relative">
                    <img src={getAvatar(c.avatar)} className={`w-[68px] h-[68px] rounded-full border-2 shadow-sm transition-transform group-hover:scale-105 ${c.is_online ? 'border-green-100' : 'border-gray-50'}`} />
                    {c.is_online && <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white animate-pulse"></div>}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-2xl text-[9px] font-bold shadow-md border max-w-[70px] truncate ${c.is_online ? 'text-green-600 border-green-100' : 'text-gray-400 border-gray-100'}`}>
                      {c.is_online ? 'Active' : 'Offline'}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45"></div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${c.is_online ? 'text-gray-900' : 'text-gray-400'}`}>{c.name.split(' ')[0]}</span>
               </div>
             ))}
          </div>

          {/* Search Bar */}
          <div className="px-5 my-4">
            <div className="bg-gray-100 rounded-xl px-5 py-2.5 flex items-center gap-3 text-gray-400">
               <span>🔍</span>
               <span className="text-sm font-medium">Search</span>
            </div>
          </div>

          {/* Conversation List */}
          <div className="pb-32">
             <div className="px-5 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Conversations</div>
             {contacts.map(c => (
               <div key={c.id} onClick={() => { setSelectedContact(c); fetchMessages(c.id); }} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors border-b border-gray-50/50">
                  <div className="relative shrink-0">
                    <img src={getAvatar(c.avatar)} className="w-14 h-14 rounded-full border border-gray-100 shadow-sm" />
                    {c.is_online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline">
                        <p className={`font-bold text-[15px] truncate ${c.is_online ? 'text-gray-900' : 'text-gray-500'}`}>{c.name}</p>
                     </div>
                     <div className="flex items-center gap-1.5 overflow-hidden">
                        <p className="text-[13px] text-gray-400 truncate font-medium">
                          You: Joined JustStart · Just now
                        </p>
                     </div>
                  </div>
                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center justify-center">
                    {c.is_online ? (
                       <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                    ) : (
                       <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-gray-400 text-[8px] font-black">✓</span>
                       </div>
                    )}
                  </div>
               </div>
             ))}
             {contacts.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
                   <div className="text-6xl">📡</div>
                   <p className="font-black uppercase text-xs tracking-widest">Scanning for students...</p>
                </div>
             )}
          </div>

          {/* Messenger FAB */}
          <button className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl font-light hover:scale-110 active:scale-90 transition-all z-50">
            +
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white">
           <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                   {m.sender_id !== user.id && <img src={getAvatar(selectedContact.avatar)} className="w-6 h-6 rounded-full self-end mr-2 mb-1 shadow-sm" />}
                   <div className={`max-w-[75%] p-3.5 rounded-2xl text-[14px] font-medium shadow-sm leading-snug ${
                     m.sender_id === user.id 
                       ? 'bg-[#0084ff] text-white rounded-br-none' 
                       : 'bg-gray-100 text-gray-900 rounded-bl-none'
                   }`}>
                     {m.content}
                   </div>
                </div>
              ))}
              <div ref={chatEndRef} />
           </div>
           
           <div className="p-4 border-t border-gray-100 flex items-center gap-4 bg-white">
              <span className="text-blue-600 text-2xl cursor-pointer hover:scale-110 transition-transform">📷</span>
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
                <input 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(e)}
                  placeholder="Message..." 
                  className="flex-1 bg-transparent outline-none text-[15px] font-medium py-1"
                />
              </div>
              <button onClick={handleSend} disabled={!newMessage.trim()} className={`text-blue-600 font-bold text-[15px] transition-all ${!newMessage.trim() ? 'opacity-30' : 'animate-pop-out'}`}>Send</button>
           </div>
        </div>
      )}
    </div>
  );
};
