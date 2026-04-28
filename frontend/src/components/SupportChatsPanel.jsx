import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function SupportChatsPanel() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('needs_human');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchChats = async () => {
    try {
      const res = await api.get('/ai/support-chats', { params: { status: statusFilter } });
      setChats(res.data);
    } catch (err) {
      console.error('[SupportChats] Failed to fetch chats:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchChats();
    // Poll every 15 seconds for new flagged chats
    const interval = setInterval(fetchChats, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected]);

  const handleSelectChat = (chat) => {
    setSelected(chat);
    setReplyText('');
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/ai/support-chats/${selected._id}/reply`, { message: replyText });
      setReplyText('');
      // Refresh the selected chat
      const res = await api.get('/ai/support-chats', { params: { status: statusFilter } });
      setChats(res.data);
      const updated = res.data.find(c => c._id === selected._id);
      if (updated) setSelected(updated);
    } catch {
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (chatId, newStatus) => {
    try {
      await api.patch(`/ai/support-chats/${chatId}/status`, { status: newStatus });
      if (selected?._id === chatId) setSelected(null);
      fetchChats();
    } catch {
      alert('Failed to update status.');
    }
  };

  const statusBadge = (status) => {
    const map = {
      needs_human: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-500'
    };
    const labels = { needs_human: '⚠️ Needs Human', active: '✅ Active', closed: '🔒 Closed' };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
      {/* ── Left: Chat List ──────────────────────────────────────────────── */}
      <div className="lg:w-80 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-dark-grey">Support Chats</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); fetchChats(); }}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-dark-grey px-2 py-1 rounded-lg transition-colors"
              title="Refresh"
            >
              🔄
            </button>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="needs_human">Needs Human</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center text-mid-grey py-8">Loading…</div>
          ) : chats.length === 0 ? (
            <div className="text-center text-mid-grey py-10">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">No chats matching this filter.</p>
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat._id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?._id === chat._id
                    ? 'border-[#4CAF50] bg-[#4CAF50]/5'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-dark-grey text-sm truncate">
                    {chat.userId?.name || 'Visitor'}
                  </p>
                  {statusBadge(chat.status)}
                </div>
                <p className="text-xs text-mid-grey truncate">
                  {chat.messages[chat.messages.length - 1]?.content || '—'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(chat.updatedAt).toLocaleString('en-IN')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Chat Detail + Reply ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-mid-grey">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm">Select a conversation to view and reply.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0 gap-2 flex-wrap">
              <div>
                <p className="font-bold text-dark-grey text-sm">
                  {selected.userId?.name || 'Visitor'}
                  {selected.userId?.username && (
                    <span className="text-xs text-mid-grey font-normal ml-1">(@{selected.userId.username})</span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {statusBadge(selected.status)}
                  <span className="text-[10px] text-gray-400">
                    {selected.messages.length} messages
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {selected.status !== 'active' && (
                  <button
                    onClick={() => handleStatusChange(selected._id, 'active')}
                    className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 border border-green-200"
                  >
                    Mark Active
                  </button>
                )}
                {selected.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange(selected._id, 'closed')}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200"
                  >
                    Close Thread
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {selected.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#4CAF50] text-white rounded-br-none'
                      : 'bg-white border border-gray-100 shadow-sm text-dark-grey rounded-bl-none'
                  }`}>
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN') : ''}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Reply Input */}
            {selected.status !== 'closed' ? (
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply as team member…"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4CAF50] text-sm min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="bg-[#4CAF50] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
                This thread is closed.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
