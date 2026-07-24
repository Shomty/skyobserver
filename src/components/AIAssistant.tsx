import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlanetPosition, Yoga, TransitEvent, PanchangData } from '../vedic-utils';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import {
  collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot,
  query, orderBy, limit, getDoc
} from 'firebase/firestore';
import { arrayUnion } from 'firebase/firestore';
import { callGeminiProxy, getErrorMessage } from '../lib/api-utils';
import { buildSystemInstruction, ChatContextProps } from '../lib/chatUtils';
import MessageBubble, { ChatMessageData } from './chat/MessageBubble';
import TypingIndicator from './chat/TypingIndicator';
import EmptyState from './chat/EmptyState';
import ChatInput from './chat/ChatInput';
import type { User } from 'firebase/auth';

export interface AIAssistantProps {
  user: User | null;
  userProfile?: any;
  positions: PlanetPosition[];
  birthPositions?: PlanetPosition[] | null;
  birthYogas?: Yoga[];
  yogas: Yoga[];
  transits: TransitEvent[];
  birthPanchang?: PanchangData | null;
  panchang?: PanchangData | null;
  birthSpecialPoints?: any;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  user,
  userProfile,
  positions,
  birthPositions,
  birthYogas = [],
  yogas,
  transits,
  birthPanchang = null,
  panchang = null,
  birthSpecialPoints,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  // Load most recent session when opened
  useEffect(() => {
    if (!isOpen || !user) return;

    const sessionsRef = collection(db, `users/${user.uid}/ai_chats`);
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(d => d.type === 'chat_session');
      if (sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0].id);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.uid]);

  // Subscribe to messages for active session
  useEffect(() => {
    if (!activeSessionId || !user) {
      setMessages([]);
      return;
    }
    const sessionDocRef = doc(db, `users/${user.uid}/ai_chats`, activeSessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMessages(
          (data.messages || []).map((m: any, i: number) => ({
            id: `msg-${i}-${m.createdAt || i}`,
            role: m.role,
            content: m.content,
            isSaved: m.isSaved || false,
          }))
        );
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, [user?.uid, activeSessionId]);

  const chatCtx: ChatContextProps = {
    userProfile,
    transitPositions: positions,
    birthPositions: birthPositions ?? null,
    birthYogas,
    yogas,
    transits,
    birthPanchang,
    panchang,
    birthSpecialPoints,
  };

  const systemInstruction = useCallback(
    () => buildSystemInstruction(chatCtx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userProfile, positions, birthPositions, birthYogas, yogas, transits, birthPanchang, panchang, birthSpecialPoints]
  );

  const saveInterpretation = async (content: string, messageId: string) => {
    if (!user) return;
    setSavingId(messageId);
    try {
      await addDoc(collection(db, `users/${user.uid}/interpretations`), {
        uid: user.uid,
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        content,
        type: 'general',
        createdAt: serverTimestamp(),
      });
      // Mark saved in session doc
      if (activeSessionId) {
        const sessionRef = doc(db, `users/${user.uid}/ai_chats`, activeSessionId);
        const snap = await getDoc(sessionRef);
        if (snap.exists()) {
          const msgs: any[] = snap.data().messages || [];
          const msgIndex = parseInt(messageId.split('-')[1]);
          if (!isNaN(msgIndex) && msgs[msgIndex]) {
            msgs[msgIndex] = { ...msgs[msgIndex], isSaved: true };
            await updateDoc(sessionRef, { messages: msgs });
          }
        }
      }
    } catch (error) {
      console.error('Error saving interpretation:', error);
    } finally {
      setSavingId(null);
    }
  };

  const sendMessage = async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || isLoading || !user) return;

    setChatError(null);
    setInput('');
    setIsLoading(true);

    let sessionId = activeSessionId;

    try {
      if (!sessionId) {
        const newDoc = await addDoc(collection(db, `users/${user.uid}/ai_chats`), {
          type: 'chat_session',
          title: userMessage.slice(0, 60),
          messages: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        sessionId = newDoc.id;
        setActiveSessionId(sessionId);
      } else if (messages.length === 0) {
        await updateDoc(doc(db, `users/${user.uid}/ai_chats`, sessionId), {
          title: userMessage.slice(0, 60),
          updatedAt: serverTimestamp(),
        });
      }

      // Snapshot messages before Firestore write to avoid onSnapshot race condition
      const historySnapshot = messages.filter(m => m.content);

      const now = new Date().toISOString();
      await updateDoc(doc(db, `users/${user.uid}/ai_chats`, sessionId), {
        messages: arrayUnion({ role: 'user', content: userMessage, createdAt: now }),
        updatedAt: serverTimestamp(),
      });

      const aiResponse = await callGeminiProxy({
        model: 'gemini-3-flash-preview',
        contents: [
          ...historySnapshot.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction: systemInstruction(),
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      });

      await updateDoc(doc(db, `users/${user.uid}/ai_chats`, sessionId), {
        messages: arrayUnion({ role: 'assistant', content: aiResponse, createdAt: new Date().toISOString() }),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const friendlyMsg = getErrorMessage(error);
      if (sessionId) {
        try {
          await updateDoc(doc(db, `users/${user.uid}/ai_chats`, sessionId), {
            messages: arrayUnion({ role: 'assistant', content: `I encountered an error: ${friendlyMsg}. Please try again.`, createdAt: new Date().toISOString() }),
            updatedAt: serverTimestamp(),
          });
        } catch {
          setChatError(friendlyMsg);
        }
      } else {
        setChatError(friendlyMsg);
        setInput(userMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button — clears bottom nav + floating controls pill */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-28 lg:bottom-6 right-5 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-2xl z-50 transition-all duration-300 active:scale-95',
          isOpen
            ? 'bg-red-500 rotate-90 text-white'
            : 'bg-jyotish-gold text-black hover:bg-celestial-gold shadow-jyotish-gold/20'
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Chat Panel — full mobile sheet / floating window on desktop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className={cn(
                'fixed z-50 flex flex-col overflow-hidden transition-colors duration-500 font-sans shadow-2xl',
                'inset-x-0 bottom-0 top-12 rounded-t-[2rem] border-t lg:top-auto lg:bottom-24 lg:right-6 lg:left-auto lg:w-[90vw] lg:max-w-[420px] lg:h-[70vh] lg:max-h-[700px] lg:rounded-3xl lg:border',
                isDark ? 'bg-[#090a0e]/98 border-white/10 text-white shadow-black/80' : 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-200/50'
              )}
            >
              <div
                className={cn(
                  "lg:hidden w-12 h-1 rounded-full mx-auto my-2.5 shrink-0 cursor-pointer",
                  isDark ? "bg-white/20" : "bg-slate-300"
                )}
                onClick={() => setIsOpen(false)}
              />

              {/* Header */}
              <div className={cn(
                'px-5 py-3.5 border-b flex items-center gap-2 flex-shrink-0 transition-colors duration-500',
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
              )}>
                <div className="w-8 h-8 rounded-lg bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-jyotish-gold" />
                </div>
                <div>
                  <h3 className={cn('font-bold text-sm gold-gradient-text')}>Jyotish AI</h3>
                  <p className={cn('text-[10px] uppercase tracking-widest font-mono', isDark ? 'text-white/40' : 'text-slate-400')}>
                    Vedic Astrology Assistant
                  </p>
                </div>
                {activeSessionId && (
                  <button
                    onClick={() => setActiveSessionId(null)}
                    className={cn(
                      'ml-auto text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded-md transition-colors',
                      isDark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    )}
                    title="New Chat"
                  >
                    + New
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "lg:hidden p-1.5 rounded-full",
                    isDark ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-700",
                    activeSessionId ? "ml-2" : "ml-auto"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Error banner */}
            {chatError && (
              <div className={cn(
                'flex items-center gap-3 px-4 py-2 text-xs border-b flex-shrink-0',
                isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
              )}>
                <span className="flex-1">{chatError}</span>
                <button onClick={() => setChatError(null)} className="opacity-60 hover:opacity-100 font-bold">✕</button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {messages.length === 0 && !isLoading ? (
                <EmptyState theme={theme} onSelectPrompt={(p) => sendMessage(p)} />
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      theme={theme}
                      onSave={saveInterpretation}
                      isSaving={savingId === msg.id}
                    />
                  ))}
                  {isLoading && <TypingIndicator theme={theme} />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className={cn(
              'flex-shrink-0 p-4 border-t transition-colors duration-500 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4',
              isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'
            )}>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage()}
                isLoading={isLoading}
                placeholder="Ask about your chart…"
                theme={theme}
              />
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
