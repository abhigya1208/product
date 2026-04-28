import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Generate or retrieve a persistent visitor ID
function getVisitorId() {
  let vid = localStorage.getItem('ags_visitor_id');
  if (!vid) {
    vid = 'visitor_' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('ags_visitor_id', vid);
  }
  return vid;
}

export default function FloatingChat() {
  const { user, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Login form state (shown to unauthenticated users)
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);

  // Use a ref for history loaded flag to avoid stale closure / race conditions
  const historyLoadedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const visitorId = useRef(getVisitorId()).current;
  // Track current user id to detect login/logout changes
  const prevUserRef = useRef(user?.id || user?._id || null);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Focus input when chat opens (logged in) ────────────────────────────────
  useEffect(() => {
    if (isOpen && user && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  // ── Load persistent chat history ──────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    // Guard: don't load twice
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    try {
      const params = user ? {} : { visitorId };
      console.log('[FloatingChat] Loading history...', user ? `user: ${user.name}` : `visitor: ${visitorId}`);
      const res = await api.get('/ai/history', { params });

      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.content,
          ts: m.timestamp
        })));
        setChatId(res.data.chatId);
        setNeedsHuman(res.data.status === 'needs_human');
        console.log(`[FloatingChat] Loaded ${res.data.messages.length} messages. Chat ID: ${res.data.chatId}`);
      } else {
        // Default greeting
        setMessages([{
          role: 'model',
          text: "Hello! 👋 I'm the AGS Tutorial AI mentor. I can answer questions about our courses, fees, admissions, faculty, and more. How can I help you today?"
        }]);
        setChatId(null);
        console.log('[FloatingChat] No history found, showing greeting.');
      }
    } catch (err) {
      console.error('[FloatingChat] Failed to load history:', err.message);
      setMessages([{
        role: 'model',
        text: "Hello! 👋 I'm the AGS Tutorial AI mentor. How can I help you today?"
      }]);
    }
  }, [user, visitorId]); // Note: historyLoadedRef is NOT a dependency (it's a ref)

  // ── Load history when chat opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !historyLoadedRef.current) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // ── Reset history when user changes (login/logout) ────────────────────────
  useEffect(() => {
    const currentUserId = user?.id || user?._id || null;
    if (currentUserId !== prevUserRef.current) {
      prevUserRef.current = currentUserId;
      // Reset so history is re-fetched for the new user
      historyLoadedRef.current = false;
      setMessages([]);
      setChatId(null);
      setNeedsHuman(false);
      // If the chat is open, reload immediately
      if (isOpen) {
        loadHistory();
      }
    }
  }, [user, isOpen, loadHistory]);

  // ── Login handler ──────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(username.trim(), password, role);
      // History will reload via the useEffect above (user change detection)
    } catch {
      setLoginError('Invalid credentials. Please contact the branch if you need access.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        visitorId: user ? undefined : visitorId,
        chatId
      });
      setMessages(prev => [...prev, { role: 'model', text: res.data.text }]);
      if (res.data.chatId) setChatId(res.data.chatId);
      if (res.data.needsHuman) setNeedsHuman(true);
      console.log(`[FloatingChat] Message sent. Chat ID: ${res.data.chatId}`);
    } catch (err) {
      console.error('[FloatingChat] Send failed:', err.response?.data || err.message);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "⚠️ I'm having trouble connecting to my brain right now. Please try again in a moment, or reach out to us at 9839910481."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle Enter key ───────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => setIsOpen(v => !v)}
          aria-label={isOpen ? 'Close chat' : 'Open AI Chat'}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-[#4CAF50]'}`}
        >
          {isOpen ? (
            <span className="text-white text-3xl leading-none">×</span>
          ) : (
            <img src="/bot-avatar.png" alt="Chat Bot" className="w-9 h-9 object-contain drop-shadow-md" />
          )}
        </button>

        {/* ── Chat Window ────────────────────────────────────────────────── */}
        {isOpen && (
          <div
            className="absolute bottom-20 right-0 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up"
            style={{ width: 'min(380px, calc(100vw - 24px))', height: 'min(520px, calc(100vh - 120px))' }}
          >
            {/* Header */}
            <div className="bg-[#4CAF50] px-4 py-3 text-white flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <img src="/bot-avatar.png" alt="Bot" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">AGS Mentor Bot</p>
                  <p className="text-[10px] opacity-80 leading-tight">Powered by Gemini AI</p>
                </div>
              </div>
              {needsHuman && (
                <span className="text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-semibold">
                  🧑 Human Support
                </span>
              )}
            </div>

            {/* ── Login Screen (unauthenticated) ────────────────────────── */}
            {!user ? (
              <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center bg-gray-50">
                <div className="text-center mb-5">
                  <span className="text-4xl block mb-2">🔒</span>
                  <p className="text-dark-grey font-semibold text-sm leading-relaxed">
                    Login to use the AGS AI mentor.
                  </p>
                  <p className="text-xs text-mid-grey mt-1">
                    Not from AGS? <Link to="/contact" className="text-[#4CAF50] underline" onClick={() => setIsOpen(false)}>Contact the branch</Link>.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="flex gap-3 justify-center">
                    {['student', 'teacher', 'admin'].map(r => (
                      <label key={r} className="flex items-center gap-1 text-xs text-dark-grey cursor-pointer capitalize font-medium">
                        <input
                          type="radio"
                          name="chat-role"
                          checked={role === r}
                          onChange={() => { setRole(r); setLoginError(''); }}
                          className="accent-[#4CAF50]"
                        />
                        {r}
                      </label>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder={role === 'student' ? 'Roll Number' : 'Username'}
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm"
                  />
                  <input
                    type="password"
                    placeholder={role === 'student' ? "Father's Name (password)" : 'Password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm"
                  />

                  {loginError && (
                    <p className="text-red-500 text-[11px] text-center leading-tight">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-[#4CAF50] text-white py-2 rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {loginLoading && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loginLoading ? 'Signing in…' : 'Access AI Mentor'}
                  </button>
                </form>
              </div>
            ) : (
              /* ── Chat Interface (authenticated) ──────────────────────── */
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-1`}>
                      {msg.role !== 'user' && (
                        <div className="w-6 h-6 rounded-full bg-[#4CAF50] flex-shrink-0 flex items-center justify-center mb-0.5">
                          <img src="/bot-avatar.png" alt="bot" className="w-4 h-4 object-contain" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#4CAF50] text-white rounded-br-none'
                          : 'bg-white border border-gray-100 shadow-sm text-dark-grey rounded-bl-none'
                      }`}>
                        <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <div className="flex justify-start items-end gap-1">
                      <div className="w-6 h-6 rounded-full bg-[#4CAF50] flex-shrink-0 flex items-center justify-center">
                        <img src="/bot-avatar.png" alt="bot" className="w-4 h-4 object-contain" />
                      </div>
                      <div className="bg-white border border-gray-100 shadow-sm px-3 py-2 rounded-2xl rounded-bl-none flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  {/* Human handoff notice */}
                  {needsHuman && (
                    <div className="mx-auto text-center bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-3 py-2 rounded-xl">
                      🧑 A team member has been notified and will respond soon.
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="flex-shrink-0 px-3 py-2 bg-white border-t border-gray-100">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about fees, admissions, faculty…"
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="w-9 h-9 flex-shrink-0 rounded-full bg-[#4CAF50] text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                  <p className="text-[10px] text-center text-gray-400 mt-1">
                    Logged in as <span className="font-semibold">{user.name || user.username}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
