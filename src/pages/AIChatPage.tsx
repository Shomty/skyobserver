import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageSquare, Plus, Trash2, Sparkles, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { db, doc, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc } from '../firebase';
import { serverTimestamp, arrayUnion, getDoc } from 'firebase/firestore';
import { callGeminiProxy, getErrorMessage } from '../lib/api-utils';
import { PlanetPosition, Yoga, TransitEvent, PanchangData } from '../vedic-utils';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import MessageBubble, { ChatMessageData } from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import EmptyState from '../components/chat/EmptyState';
import ChatInput from '../components/chat/ChatInput';
import { buildSystemInstruction, ChatContextProps } from '../lib/chatUtils';

interface ChatSession {
  id: string;
  title: string;
  createdAt: any;
  updatedAt: any;
}

export interface AIChatPageProps {
  user: User;
  userProfile: any;
  transitPositions: PlanetPosition[];
  birthPositions: PlanetPosition[] | null;
  birthYogas: Yoga[];
  yogas: Yoga[];
  transits: TransitEvent[];
  birthPanchang: PanchangData | null;
  panchang: PanchangData;
  birthSpecialPoints: any;
  onClose: () => void;
}

const AIChatPage: React.FC<AIChatPageProps> = ({
  user,
  userProfile,
  transitPositions,
  birthPositions,
  birthYogas,
  yogas,
  transits,
  birthPanchang,
  panchang,
  birthSpecialPoints,
  onClose,
}) => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to sessions list — uses ai_chats (has deployed rules), filters by type
  useEffect(() => {
    const sessionsRef = collection(db, `users/${user.uid}/ai_chats`);
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSessions(
          snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .filter(d => d.type === 'chat_session') as ChatSession[]
        );
      },
      (err) => {
        console.error('ai_chats subscription error:', err);
        setChatError('Unable to load chat history. Check your connection.');
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

  // Subscribe to messages for active session (embedded array in the session doc)
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    const sessionDocRef = doc(db, `users/${user.uid}/ai_chats`, activeSessionId);
    const unsubscribe = onSnapshot(
      sessionDocRef,
      (snapshot) => {
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
      },
      (err) => {
        console.error('messages subscription error:', err);
        setChatError('Unable to load messages. Check your connection.');
      }
    );
    return () => unsubscribe();
  }, [user.uid, activeSessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);


  const chatCtx: ChatContextProps = {
    userProfile,
    transitPositions,
    birthPositions,
    birthYogas,
    yogas,
    transits,
    birthPanchang,
    panchang,
    birthSpecialPoints,
  };

  const getSystemInstruction = useCallback(
    () => buildSystemInstruction(chatCtx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userProfile, birthPositions, birthYogas, birthPanchang, transitPositions, yogas, transits, panchang, birthSpecialPoints]
  );

  const createNewSession = async () => {
    const newDoc = await addDoc(collection(db, `users/${user.uid}/ai_chats`), {
      type: 'chat_session',
      title: 'New Chat',
      messages: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setActiveSessionId(newDoc.id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDoc(doc(db, `users/${user.uid}/ai_chats`, sessionId));
    if (activeSessionId === sessionId) setActiveSessionId(null);
  };

  const sendMessage = async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || isLoading) return;

    setChatError(null);
    setInput('');
    setIsLoading(true);

    let sessionId = activeSessionId;

    try {
      // Create or retrieve the session document
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
          systemInstruction: getSystemInstruction(),
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

  const saveInterpretation = async (content: string, messageId: string) => {
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

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen font-sans flex flex-col transition-colors duration-500",
      isDark ? "bg-[#050505] text-white" : "bg-white text-slate-900"
    )}>
      {/* Page Header */}
      <header className={cn(
        "sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-xl flex-shrink-0",
        isDark ? "bg-mystic-purple/60 border-jyotish-gold/10" : "bg-white/80 border-slate-200"
      )}>
        <button
          onClick={onClose}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors",
            isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className={cn("w-px h-6", isDark ? "bg-white/10" : "bg-slate-200")} />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-jyotish-gold" />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-widest gold-gradient-text">Jyotish AI</h1>
        </div>

        <button
          onClick={() => setSidebarOpen(s => !s)}
          className={cn(
            "ml-auto lg:hidden p-2 rounded-lg transition-colors",
            isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          )}
          aria-label="Toggle session list"
        >
          <Menu className="w-4 h-4" />
        </button>
      </header>

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100dvh - 57px)' }}>

        {/* Sidebar — fixed overlay on mobile, inline on desktop */}
        <aside className={cn(
          "flex-shrink-0 flex flex-col border-r transition-all duration-300 overflow-hidden",
          isDark ? "bg-black/40 border-jyotish-gold/10" : "bg-slate-50 border-slate-200",
          // Desktop: always visible at full width
          "hidden lg:flex lg:w-[280px]",
        )}>
          <SidebarContent
            sessions={sessions}
            activeSessionId={activeSessionId}
            theme={theme}
            onNewChat={createNewSession}
            onSelectSession={(id) => setActiveSessionId(id)}
            onDeleteSession={deleteSession}
          />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-20 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                key="mobile-sidebar"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className={cn(
                  "lg:hidden fixed left-0 top-0 bottom-0 z-30 w-[280px] flex flex-col border-r pt-14",
                  isDark ? "bg-[#0a0a0f] border-jyotish-gold/10" : "bg-white border-slate-200"
                )}
              >
                <SidebarContent
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  theme={theme}
                  onNewChat={() => { createNewSession(); setSidebarOpen(false); }}
                  onSelectSession={(id) => { setActiveSessionId(id); setSidebarOpen(false); }}
                  onDeleteSession={deleteSession}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Error Banner */}
          {chatError && (
            <div className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-xs border-b flex-shrink-0",
              isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"
            )}>
              <span className="flex-1">{chatError}</span>
              <button onClick={() => setChatError(null)} className="opacity-60 hover:opacity-100 font-bold">✕</button>
            </div>
          )}
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!activeSessionId && messages.length === 0 ? (
              <EmptyState theme={theme} onSelectPrompt={(p) => sendMessage(p)} />
            ) : (
              <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto w-full">
                {messages.map(msg => (
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

          {/* Input Bar */}
          <div className={cn(
            "flex-shrink-0 p-4 border-t",
            isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-200"
          )}>
            <div className="max-w-4xl mx-auto">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage()}
                isLoading={isLoading}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────

interface SidebarContentProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  theme: 'dark' | 'light';
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  sessions, activeSessionId, theme, onNewChat, onSelectSession, onDeleteSession
}) => {
  const isDark = theme === 'dark';
  return (
    <>
      <div className={cn("p-3 border-b flex-shrink-0", isDark ? "border-jyotish-gold/10" : "border-slate-200")}>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/20 text-jyotish-gold hover:bg-jyotish-gold/20 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {sessions.length === 0 && (
          <p className={cn("text-xs text-center py-10 px-4", isDark ? "text-white/30" : "text-slate-400")}>
            No chats yet. Start a new conversation.
          </p>
        )}
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={cn(
              "w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left transition-all group",
              activeSessionId === session.id
                ? "bg-jyotish-gold/10 border border-jyotish-gold/20"
                : isDark
                  ? "hover:bg-white/5 border border-transparent"
                  : "hover:bg-slate-100 border border-transparent"
            )}
          >
            <MessageSquare className={cn(
              "w-4 h-4 mt-0.5 flex-shrink-0",
              activeSessionId === session.id ? "text-jyotish-gold" : isDark ? "text-white/30" : "text-slate-400"
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs font-medium truncate",
                activeSessionId === session.id ? "text-jyotish-gold" : isDark ? "text-white/80" : "text-slate-700"
              )}>
                {session.title}
              </p>
              {session.updatedAt?.toDate && (
                <p className={cn("text-[10px] mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>
                  {format(session.updatedAt.toDate(), 'MMM d')}
                </p>
              )}
            </div>
            <button
              onClick={(e) => onDeleteSession(session.id, e)}
              className={cn(
                "opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all flex-shrink-0 mt-0.5",
                isDark ? "hover:bg-red-500/20 text-red-400/50 hover:text-red-400" : "hover:bg-red-50 text-red-400/50 hover:text-red-500"
              )}
              aria-label="Delete chat"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </>
  );
};

export default AIChatPage;
