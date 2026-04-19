import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Chat Sidebar ────────────────────────────────────────────
function ChatSidebar({ chats, activeChat, onSelect, onNewChat, onNewGroup, users, isOnline }) {
  const [search, setSearch] = useState('');
  const filtered = chats.filter(c => {
    const name = c.isGroup ? c.groupName : c.members?.find(m => m._id !== activeChat?.myId)?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full md:border-r border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-dark-grey">Messages</h3>
          <div className="flex gap-1">
            <button onClick={onNewChat} title="New Chat" className="p-1.5 rounded-lg hover:bg-pastel-green/20 text-dark-grey">💬</button>
            <button onClick={onNewGroup} title="New Group" className="p-1.5 rounded-lg hover:bg-pastel-green/20 text-dark-grey">👥</button>
          </div>
        </div>
        <input className="input text-sm py-2" placeholder="Search chats…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && <p className="text-center text-sm text-mid-grey py-8">No chats yet. Start one!</p>}
        {filtered.map(c => {
          const otherMember = !c.isGroup ? c.members?.find(m => m._id !== activeChat?.myId) : null;
          const name = c.isGroup ? c.groupName : (otherMember?.name || 'Unknown');
          const online = !c.isGroup && otherMember && isOnline(otherMember._id);
          const isActive = activeChat?._id === c._id;
          return (
            <button key={c._id} onClick={() => onSelect(c)}
              className={`w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${isActive ? 'bg-pastel-green/20' : ''}`}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-pastel-green/50 flex items-center justify-center text-lg font-bold text-dark-grey">
                  {c.isGroup ? '👥' : name.charAt(0).toUpperCase()}
                </div>
                {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-dark-grey truncate">{name}</p>
                  {c.updatedAt && <p className="text-xs text-mid-grey flex-shrink-0 ml-1">{new Date(c.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                {c.isGroup && <p className="text-xs text-mid-grey">{c.members?.length} members</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat Window ─────────────────────────────────────────────
function ChatWindow({ chat, myId, socket, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const otherMember = !chat.isGroup ? chat.members?.find(m => m._id !== myId) : null;
  const chatName = chat.isGroup ? chat.groupName : (otherMember?.name || 'Chat');

  const loadMessages = useCallback(async () => {
    const res = await api.get(`/chat/${chat._id}/messages`);
    setMessages(res.data.messages);
    // Mark as read
    await api.put(`/chat/${chat._id}/read`);
    socket?.emit('markRead', { chatId: chat._id });
  }, [chat._id, socket]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
    socket?.emit('joinChat', chat._id);
  }, [chat._id]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (msg.chatId === chat._id) setMessages(m => [...m, msg]);
    };
    const onTyping = ({ chatId, userName }) => {
      if (chatId === chat._id) { setTypingUser(userName); setTyping(true); }
    };
    const onStop = ({ chatId }) => {
      if (chatId === chat._id) setTyping(false);
    };
    socket.on('newMessage', onNew);
    socket.on('userTyping', onTyping);
    socket.on('userStopTyping', onStop);
    return () => { socket.off('newMessage', onNew); socket.off('userTyping', onTyping); socket.off('userStopTyping', onStop); };
  }, [socket, chat._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleType = (e) => {
    setText(e.target.value);
    socket?.emit('typing', { chatId: chat._id, userName: 'You' });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('stopTyping', { chatId: chat._id }), 1500);
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket?.emit('sendMessage', { chatId: chat._id, content: text.trim() });
    // Also persist via API as fallback
    try { await api.post(`/chat/${chat._id}/messages`, { content: text.trim() }); } catch {}
    setText('');
    socket?.emit('stopTyping', { chatId: chat._id });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
        {/* Back button — visible only on mobile */}
        <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-dark-grey" title="Back to chats">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-pastel-green/40 flex items-center justify-center text-base font-bold text-dark-grey flex-shrink-0">
          {chat.isGroup ? '👥' : chatName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-dark-grey text-sm truncate">{chatName}</p>
          {chat.isGroup && <p className="text-xs text-mid-grey">{chat.members?.length} members</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => {
          const isMe = msg.senderId?._id === myId || msg.senderId === myId;
          const seen = msg.readBy?.length > 1;
          return (
            <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] ${isMe ? 'bg-pastel-green text-dark-grey rounded-2xl rounded-br-sm' : 'bg-white text-dark-grey rounded-2xl rounded-bl-sm shadow-soft'} px-4 py-2.5`}>
                {!isMe && chat.isGroup && (
                  <p className="text-xs font-semibold text-mid-grey mb-1">{msg.senderId?.name}</p>
                )}
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <p className="text-[10px] text-mid-grey">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  {isMe && <span className={`text-[10px] ${seen ? 'text-blue-500' : 'text-mid-grey'}`}>{seen ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-soft">
              <p className="text-xs text-mid-grey">{typingUser} is typing…</p>
              <div className="flex gap-1 mt-1">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 bg-mid-grey rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — sticky at bottom */}
      <form onSubmit={sendMsg} className="p-3 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
        <input className="input flex-1 text-sm" placeholder="Type a message…" value={text} onChange={handleType} />
        <button type="submit" disabled={!text.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-50 flex-shrink-0">Send</button>
      </form>
    </div>
  );
}

// ─── Main Chat Interface ──────────────────────────────────────
export default function ChatInterface() {
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [search, setSearch] = useState('');

  const loadChats = async () => {
    const res = await api.get('/chat');
    setChats(res.data.chats);
  };
  const loadUsers = async () => {
    const res = await api.get('/chat/users');
    setUsers(res.data.users);
  };

  useEffect(() => { loadChats(); loadUsers(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('newMessage', () => loadChats());
    return () => socket.off('newMessage');
  }, [socket]);

  const startChat = async (uid) => {
    const res = await api.post('/chat/one-to-one', { userId: uid });
    setChats(c => {
      const exists = c.find(x => x._id === res.data.chat._id);
      return exists ? c : [res.data.chat, ...c];
    });
    setActive(res.data.chat);
    setShowNewChat(false);
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || groupMembers.length === 0) return;
    const res = await api.post('/chat/group', { groupName, members: groupMembers });
    setChats(c => [res.data.chat, ...c]);
    setActive(res.data.chat);
    setShowNewGroup(false); setGroupName(''); setGroupMembers([]);
  };

  // On mobile: go back from chat window to sidebar
  const handleBack = () => setActive(null);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
      {/* Sidebar — hidden on mobile when a chat is active */}
      <div className={`${active ? 'hidden md:flex' : 'flex'} w-full md:w-64 lg:w-72 flex-shrink-0 flex-col`}>
        <ChatSidebar chats={chats} activeChat={{ ...active, myId: user?._id }}
          onSelect={setActive}
          onNewChat={() => { setShowNewChat(s => !s); setShowNewGroup(false); }}
          onNewGroup={() => { setShowNewGroup(s => !s); setShowNewChat(false); }}
          users={users} isOnline={isOnline} />
      </div>

      {/* Main area — hidden on mobile when no chat is active */}
      <div className={`${active ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {/* New 1-to-1 panel */}
        {showNewChat && (
          <div className="p-4 bg-pastel-green/10 border-b border-pastel-green/30 flex-shrink-0">
            <p className="text-sm font-semibold mb-2 text-dark-grey">Start a new conversation:</p>
            <div className="flex flex-wrap gap-2">
              {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
                <button key={u._id} onClick={() => startChat(u._id)}
                  className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-soft text-sm hover:shadow-card transition-all">
                  <span className="w-7 h-7 rounded-full bg-pastel-peach flex items-center justify-center text-xs font-bold">{u.name[0]}</span>
                  <span className="text-dark-grey">{u.name}</span>
                  <span className="badge-blue">{u.role}</span>
                  {isOnline(u._id) && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New group panel */}
        {showNewGroup && (
          <form onSubmit={createGroup} className="p-4 bg-blue-50 border-b border-blue-100 space-y-3 flex-shrink-0">
            <p className="text-sm font-semibold text-dark-grey">Create Group Chat (max 15 members)</p>
            <input className="input text-sm" placeholder="Group name" value={groupName}
              onChange={e => setGroupName(e.target.value)} required />
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-soft cursor-pointer text-sm">
                  <input type="checkbox" checked={groupMembers.includes(u._id)}
                    onChange={e => setGroupMembers(m => e.target.checked ? [...m, u._id] : m.filter(x => x !== u._id))} />
                  {u.name}
                </label>
              ))}
            </div>
            <button type="submit" className="btn-primary text-sm px-4 py-2">Create Group</button>
          </form>
        )}

        {/* Chat window */}
        {active ? (
          <ChatWindow chat={active} myId={user?._id} socket={socket} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-mid-grey">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-semibold text-dark-grey mb-2">Select a conversation</p>
            <p className="text-sm">Choose from your chats or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
