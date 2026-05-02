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
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-24 lg:bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50 transition-all duration-300',
          isOpen
            ? 'bg-red-500 rotate-90'
            : 'bg-jyotish-gold/90 hover:bg-jyotish-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
        )}
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-black w-7 h-7" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-40 lg:bottom-24 right-6 w-[90vw] max-w-[420px] h-[65vh] max-h-[640px] backdrop-blur-xl border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-colors duration-500',
              isDark ? 'bg-black/90 border-jyotish-gold/10' : 'bg-white/95 border-slate-200'
            )}
          >
            {/* Header */}
            <div className={cn(
              'p-4 border-b flex items-center gap-2 flex-shrink-0 transition-colors duration-500',
              isDark ? 'border-jyotish-gold/10 bg-white/5' : 'border-slate-100 bg-slate-50'
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
              'flex-shrink-0 p-4 border-t transition-colors duration-500',
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
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
