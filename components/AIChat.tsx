
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ChatMessage } from '../types';
import { askCoach } from '../geminiService';
import { Logo } from './Logo';

// Audio encoding/decoding utilities
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: "Hello! 👋 So happy to see you here! I am Starty Coach, and I'm ready to help you learn anything you want in FocusFlow! 🌟 Do you have a big question, a homework problem, or a cool idea you want to explore? Let me know, and we will find the amazing answers together! 🚀📚" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const dictationSessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const dictationContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // Ref for the current replay source specifically
  const currentReplaySource = useRef<AudioBufferSourceNode | null>(null);

  // Turn tracking for live updates
  const currentTurnAudioRef = useRef<Uint8Array[]>([]);
  const currentTurnTextRef = useRef<string>('');
  const currentUserInputRef = useRef<string>('');
  const currentAssistantMsgIdRef = useRef<string | null>(null);
  const currentUserMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, voiceTranscription]);

  const stopVoiceMode = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close?.();
      liveSessionRef.current = null;
    }
    if (audioContextsRef.current) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.output.close();
      audioContextsRef.current = null;
    }
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    setIsVoiceActive(false);
    setVoiceTranscription('');
    
    currentTurnAudioRef.current = [];
    currentTurnTextRef.current = '';
    currentUserInputRef.current = '';
    currentAssistantMsgIdRef.current = null;
    currentUserMsgIdRef.current = null;
  }, []);

  const stopDictation = useCallback(() => {
    if (dictationSessionRef.current) {
      dictationSessionRef.current.close?.();
      dictationSessionRef.current = null;
    }
    if (dictationContextRef.current) {
      dictationContextRef.current.close();
      dictationContextRef.current = null;
    }
    setIsDictating(false);
  }, []);

  const toggleDictation = async () => {
    if (isDictating) {
      stopDictation();
      return;
    }

    if (isVoiceActive) stopVoiceMode();

    setIsDictating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      dictationContextRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = ctx.createMediaStreamSource(stream);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setInput(prev => prev + text);
            }
          },
          onclose: () => setIsDictating(false),
          onerror: () => stopDictation(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'You are a transcription assistant. Transcribe user speech accurately to text. Do not generate audio output.',
        }
      });
      dictationSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      stopDictation();
    }
  };

  const playStoredAudio = async (msgId: string, audioData: Uint8Array) => {
    // If we are already playing this specific message, stop it
    if (playingAudioId === msgId) {
      if (currentReplaySource.current) {
        try { currentReplaySource.current.stop(); } catch (e) {}
        currentReplaySource.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    // Stop any other currently playing replay
    if (currentReplaySource.current) {
      try { currentReplaySource.current.stop(); } catch (e) {}
    }

    setPlayingAudioId(msgId);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(audioData, ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    currentReplaySource.current = source;
    
    source.onended = () => {
      // Only reset if this specific source just finished
      if (currentReplaySource.current === source) {
        setPlayingAudioId(null);
        currentReplaySource.current = null;
      }
      ctx.close();
    };
    
    source.start(0);
  };

  const startVoiceMode = async () => {
    if (isVoiceActive) {
      stopVoiceMode();
      return;
    }

    if (isDictating) stopDictation();

    setIsVoiceActive(true);
    setVoiceTranscription('Connecting...');
    currentTurnAudioRef.current = [];
    currentTurnTextRef.current = '';
    currentUserInputRef.current = '';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setVoiceTranscription('I\'m listening...');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Live User Transcription
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentUserInputRef.current += text;
              
              if (!currentUserMsgIdRef.current) {
                currentUserMsgIdRef.current = `voice-u-${Date.now()}`;
                setMessages(prev => [...prev, { id: currentUserMsgIdRef.current!, role: 'user', content: currentUserInputRef.current }]);
              } else {
                setMessages(prev => prev.map(m => m.id === currentUserMsgIdRef.current ? { ...m, content: currentUserInputRef.current } : m));
              }
            }

            // Live Assistant Transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentTurnTextRef.current += text;
              setVoiceTranscription(currentTurnTextRef.current);

              if (!currentAssistantMsgIdRef.current) {
                currentAssistantMsgIdRef.current = `voice-a-${Date.now()}`;
                setMessages(prev => [...prev, { id: currentAssistantMsgIdRef.current!, role: 'assistant', content: currentTurnTextRef.current }]);
              } else {
                setMessages(prev => prev.map(m => m.id === currentAssistantMsgIdRef.current ? { ...m, content: currentTurnTextRef.current } : m));
              }
            }

            // Audio Streaming
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const bytes = decode(base64Audio);
              currentTurnAudioRef.current.push(bytes);

              const outCtx = audioContextsRef.current?.output;
              if (outCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(bytes, outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }

            // Finalize Turn
            if (message.serverContent?.turnComplete) {
              const totalLength = currentTurnAudioRef.current.reduce((acc, val) => acc + val.length, 0);
              const combinedAudio = new Uint8Array(totalLength);
              let offset = 0;
              for (const arr of currentTurnAudioRef.current) {
                combinedAudio.set(arr, offset);
                offset += arr.length;
              }

              // Update the assistant message one last time with audio data
              if (currentAssistantMsgIdRef.current) {
                setMessages(prev => prev.map(m => 
                  m.id === currentAssistantMsgIdRef.current 
                    ? { ...m, content: currentTurnTextRef.current || "(Voice Response)", audioData: combinedAudio } 
                    : m
                ));
              }

              // Reset local turn buffers
              currentTurnAudioRef.current = [];
              currentTurnTextRef.current = '';
              currentUserInputRef.current = '';
              currentAssistantMsgIdRef.current = null;
              currentUserMsgIdRef.current = null;
              setVoiceTranscription('');
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              currentTurnAudioRef.current = [];
            }
          },
          onclose: () => stopVoiceMode(),
          onerror: (e) => {
            console.error('Live Error:', e);
            stopVoiceMode();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are Starty, a friendly and enthusiastic AI study coach for teens in the FocusFlow app. You help break down tasks and provide motivation. Keep your spoken responses energetic, short, and encouraging like a friendly game character.',
        },
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      stopVoiceMode();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    if (isDictating) stopDictation();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askCoach(input, history);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        sources: response.sources
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: 'err', 
        role: 'assistant', 
        content: "I'm a bit overwhelmed by all that data! Mind rephrasing? 🪐" 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900 relative animate-slide-up overflow-hidden">
      {/* Centered Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-40">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          
          {/* Top Branding Area */}
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-purple-100 dark:bg-purple-900/30 blur-[80px] opacity-40 rounded-full animate-pulse"></div>
              <div className="relative z-10 animate-float">
                <Logo size={120} dark={document.documentElement.classList.contains('dark')} />
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 dark:text-purple-300">AI Sensei</div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Ready to help!</h1>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="space-y-10">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-pop-out`}>
                <div className={`max-w-[85%] md:max-w-[90%] rounded-[1.8rem] p-5 md:p-6 transition-all shadow-sm relative ${
                  m.role === 'user' 
                    ? 'bg-[#1e1b4b] dark:bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/5 rounded-tl-none'
                }`}>
                  
                  <p className="font-medium leading-relaxed text-[15px] whitespace-pre-wrap">
                    {m.content || (m.role === 'assistant' ? "..." : "")}
                  </p>
                  
                  {/* Replay Audio Action (integrated footer) */}
                  {m.role === 'assistant' && m.audioData && (
                    <div className="mt-4 flex items-center justify-end">
                      <button 
                        onClick={() => playStoredAudio(m.id, m.audioData!)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider ${
                          playingAudioId === m.id 
                          ? 'bg-red-500 text-white animate-pulse shadow-md' 
                          : 'bg-purple-100 dark:bg-slate-700 text-purple-600 dark:text-purple-300 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {playingAudioId === m.id ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-200/30 dark:border-white/10 space-y-3">
                      <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Verified Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {m.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] bg-white dark:bg-slate-700 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-purple-600 dark:text-purple-300 font-bold hover:bg-purple-50 dark:hover:bg-slate-600 transition-colors inline-flex items-center gap-1 max-w-full"
                          >
                             <span className="truncate">{source.title}</span>
                             <span className="text-[8px]">↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-full px-6 py-4 border border-gray-100 dark:border-white/5 shadow-sm flex gap-2">
                   <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                   <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      </div>

      {/* Voice Mode Overlay */}
      {isVoiceActive && (
        <div className="fixed inset-0 z-[100] bg-[#1e1b4b]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="absolute top-8 right-8">
            <button 
              onClick={stopVoiceMode}
              className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative mb-20 flex items-center justify-center">
            <div className="absolute w-[300px] h-[300px] bg-purple-500/30 rounded-full blur-3xl animate-pulse scale-150"></div>
            <div className="absolute w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-2xl animate-ping"></div>
            <div className="relative z-10 animate-float drop-shadow-2xl">
              <Logo size={180} dark />
            </div>
            <div className="absolute -bottom-10 flex gap-1 h-12 items-end">
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-white/40 rounded-full"
                  style={{ 
                    height: `${20 + Math.random() * 80}%`,
                    animation: `voice-bar 1s infinite alternate ${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="text-center max-w-md">
            <h2 className="text-purple-300 font-black text-xs uppercase tracking-[0.4em] mb-4">Live Conversation</h2>
            <div className="min-h-[100px] flex items-center justify-center">
              <p className="text-white text-2xl font-bold leading-relaxed opacity-90 transition-all duration-300 line-clamp-4">
                {voiceTranscription || "Listening for your voice..."}
              </p>
            </div>
          </div>

          <div className="absolute bottom-12 flex flex-col items-center gap-4">
             <div className="text-white/40 font-bold text-sm uppercase tracking-widest">Speak freely • Coach is here</div>
             <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-2xl animate-pulse border-4 border-red-500/20 active:scale-90 transition-transform cursor-pointer" onClick={stopVoiceMode}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM15 13H9V11H15V13Z" />
                </svg>
             </div>
          </div>
        </div>
      )}

      {/* Floating Modern Input Bar (ChatGPT Style) */}
      <div className="absolute bottom-24 left-0 right-0 px-4 md:px-0">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSend} className="bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-white/5 rounded-[2rem] pl-1 pr-1.5 py-1.5 flex items-center shadow-2xl shadow-purple-200/40 dark:shadow-none ring-1 ring-black/5">
            <button type="button" className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isDictating ? "I'm listening..." : "Ask Starty anything..."}
              className={`flex-1 min-w-0 bg-transparent border-none focus:outline-none px-2 font-semibold text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 text-base transition-all ${isDictating ? 'text-red-500 font-bold' : ''}`}
            />
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Refined Voice-to-Text Microphone Button */}
              <button 
                type="button" 
                onClick={toggleDictation}
                title="Tap to speak"
                className={`w-10 h-10 flex items-center justify-center transition-all relative rounded-full group ${
                  isDictating 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 animate-pulse-soft' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                {isDictating && (
                  <>
                    <span className="absolute inset-0 bg-red-500/30 rounded-full animate-ping-slow"></span>
                  </>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 relative z-10 transition-transform ${isDictating ? 'scale-110' : 'group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 10v2a7 7 0 01-14 0v-2m7 9v3m-3 0h6" />
                </svg>
              </button>

              {/* Live Voice Mode Toggle */}
              <button 
                type="button" 
                onClick={startVoiceMode}
                title="Full Voice Conversation"
                className={`w-10 h-10 flex items-center justify-center transition-all relative rounded-full group ${
                  isVoiceActive ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 relative z-10 ${isVoiceActive ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.343 6.586c5.857-5.858 15.455-5.858 21.313 0" />
                </svg>
              </button>
              
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${
                  !input.trim() || isTyping ? 'bg-gray-100 dark:bg-slate-700 text-gray-400' : 'bg-gray-900 dark:bg-purple-600 shadow-xl active:scale-95'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>
          <div className="flex items-center justify-center gap-6 mt-3">
             <div className="flex items-center gap-1.5 opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dictation</p>
             </div>
             <div className="flex items-center gap-1.5 opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Voice</p>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes voice-bar { from { height: 20%; } to { height: 100%; } }
        
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes ping-slow {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
