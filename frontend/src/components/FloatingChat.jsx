import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I'm the AGS AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if user authenticated in this session
    const auth = sessionStorage.getItem('ai_chat_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'student@ags.com' && loginPassword === 'ags2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('ai_chat_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Please contact the branch.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMessage.text,
        history: messages.filter(m => m.role === 'user' || m.role === 'model')
      });
      
      setMessages(prev => [...prev, { role: 'model', text: res.data.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Sorry, I am having trouble connecting to my brain right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isOpen ? 'bg-red-500' : 'bg-[#4CAF50]'}`}
      >
        {isOpen ? (
          <span className="text-white text-2xl">×</span>
        ) : (
          <span className="text-white text-2xl">🤖</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-[#4CAF50] p-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>🤖</span> AGS Assistant
            </h3>
            <p className="text-xs opacity-90">Powered by Gemini AI</p>
          </div>

          {!isAuthenticated ? (
            /* Login Screen */
            <div className="flex-1 p-6 flex flex-col justify-center bg-cream">
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">🔒</span>
                <p className="text-dark-grey font-semibold text-sm">
                  You have to login first to use the AI assistant. If you are not from AGS, please contact the branch.
                </p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    required 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm"
                  />
                </div>
                <div>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    required 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm"
                  />
                </div>
                {loginError && <p className="text-red-500 text-xs text-center">{loginError}</p>}
                <button type="submit" className="w-full bg-[#4CAF50] text-white py-2 rounded-xl font-semibold hover:opacity-90 transition-all text-sm">
                  Access AI Chat
                </button>
              </form>
            </div>
          ) : (
            /* Chat Interface */
            <>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-pastel-green text-dark-grey rounded-br-none' 
                        : 'bg-white border border-gray-100 shadow-sm text-dark-grey rounded-bl-none'
                    }`}>
                      {/* Using whitespace-pre-wrap to respect newlines from Gemini */}
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 shadow-sm text-dark-grey p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..." 
                    className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 rounded-full bg-[#4CAF50] text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-all"
                  >
                    ➤
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
