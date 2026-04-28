const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiChat = require('../models/AiChat');

// ─── Validate API key on module load ────────────────────────────────────────
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is missing or set to placeholder in .env. AI chatbot will NOT work.');
} else {
  console.log('✅ GEMINI_API_KEY loaded successfully.');
}

// ─── Institute Knowledge System Prompt ──────────────────────────────────────
const INSTITUTE_KNOWLEDGE = `
You are the official AI mentor and assistant for AGS Tutorial — a coaching institute located at:
A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi – 110094.

CONTACT:
- Phone / WhatsApp: 9839910481
- Email: agstutorial050522@gmail.com
- Instagram: @agstutorial (https://www.instagram.com/agstutorial/)
- WhatsApp: https://wa.me/919839910481
- Timings: Monday–Saturday, 7:00 AM – 8:00 PM

ABOUT AGS TUTORIAL:
- Established in 2022 (4+ years of excellence)
- Offers coaching from Nursery to Class 12
- 100% board passing result for every student since opening
- 500+ students enrolled and trusted by 500+ families
- Small batch sizes for personalized attention
- CBSE-aligned curriculum
- 24/7 CCTV surveillance for safety
- Admission open for academic year 2026-27

MONTHLY FEE STRUCTURE:
- Nursery / LKG / UKG: ₹250 per month
- Class 1 & 2: ₹300 per month
- Class 3, 4 & 5: ₹350 per month
- Class 6 & 7: ₹400 per month
- Class 8: ₹450 per month
- Class 9: ₹500 per month
- Class 10: ₹600 per month
- Class 11 & 12: ₹400–₹1200 per month (contact branch for exact details)

FACULTY:
- Nursery, LKG, UKG: KULSUM MAM
- Class 1, 2, 3: KHUSHI MAM
- Class 4, 5: SHIVANI MAM
- Class 6, 7, 8: VARTIKA MAM
- Class 9, 10: ABHIGYA SIR
- Class 11 & 12: Contact branch for teacher details

ADMISSION PROCESS:
1. Visit the branch at Sonia Vihar, Delhi.
2. Student undergoes a basic assessment.
3. Fill the admission form and submit documents (Aadhaar, photo, previous mark-sheet).
4. Batch allotment based on class and timing preference.

ACADEMICS:
- Foundation (Nursery–UKG): Play-way method, basic literacy & numeracy.
- Primary (Class 1–5): Core fundamentals in languages, math, and EVS.
- Middle (Class 6–8): Broad subjects including science and social studies.
- Secondary (Class 9–10): CBSE board preparation with weekly tests.
- Sr. Secondary (Class 11–12): Specialized streams (Science, Commerce, Arts).

YOUR BEHAVIOUR RULES:
1. Be warm, encouraging, and professional — like a knowledgeable human mentor from AGS Tutorial.
2. Always answer in simple, clear language appropriate for students and parents.
3. If asked about fees, schedules, or admissions, give the exact data above.
4. If a question is completely unrelated to the institute or education, politely redirect the user.
5. If you genuinely cannot answer something that requires human judgement or real-time info (e.g., specific student records, live schedule changes), say EXACTLY: "I am connecting you to one of our team members for support. They will get back to you shortly."
6. NEVER make up information. If unsure, ask them to call 9839910481.
7. Keep responses concise — no more than 3-4 paragraphs unless the user asks for detail.
`;

// ─── Handoff detection phrases ──────────────────────────────────────────────
const HANDOFF_TRIGGERS = [
  'connecting you to one of our team members',
  'connect you to a team member',
  'connect you with a team member',
  'connect you to our team',
  'connect you with our team',
  'let me connect you',
  'transfer you to',
  'reaching out to our team',
  'have a team member',
  'have our team',
  'escalate this',
  'human support',
  'speak to a representative',
  'talk to a person',
  'contact a team member',
];

function detectHandoff(text) {
  const lower = text.toLowerCase();
  return HANDOFF_TRIGGERS.some(phrase => lower.includes(phrase));
}

// ─── Sanitize history for Gemini (must alternate user/model) ────────────────
function sanitizeHistoryForGemini(messages) {
  const history = [];
  let lastRole = null;

  for (const m of messages) {
    const role = m.role === 'user' ? 'user' : 'model';
    // Skip consecutive messages from the same role (merge or skip)
    if (role === lastRole) {
      // Merge into the last message
      if (history.length > 0) {
        history[history.length - 1].parts[0].text += '\n' + m.content;
      }
      continue;
    }
    history.push({
      role,
      parts: [{ text: m.content }]
    });
    lastRole = role;
  }

  // Gemini requires history to start with 'user' if non-empty
  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  // Gemini requires history to end with 'model' (the last turn before the new user message)
  while (history.length > 0 && history[history.length - 1].role !== 'model') {
    history.pop();
  }

  return history;
}

// ─── Optional middleware: Identifies logged-in user or sets visitorId from header ─
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      const Session = require('../models/Session');
      const User = require('../models/User');
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const session = await Session.findOne({ token, isActive: true });
        if (session) {
          const user = await User.findById(decoded.userId);
          if (user && user.isActive) {
            req.user = user;
          }
        }
      } catch (_) { /* token invalid or expired – treat as visitor */ }
    }
  } catch (_) { /* ignore */ }
  next();
};

// ─── GET /api/ai/history ─────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const { visitorId } = req.query;
    let chat;
    if (req.user) {
      chat = await AiChat.findOne({ userId: req.user._id, status: { $ne: 'closed' } }).sort({ updatedAt: -1 });
    } else if (visitorId) {
      chat = await AiChat.findOne({ visitorId, status: { $ne: 'closed' } }).sort({ updatedAt: -1 });
    }
    if (!chat) return res.json({ messages: [], chatId: null });
    res.json({ messages: chat.messages, chatId: chat._id, status: chat.status, adminReplies: chat.adminReplies });
  } catch (err) {
    console.error('AI getHistory error:', err.message);
    res.status(500).json({ message: 'Failed to fetch chat history.' });
  }
};

// ─── POST /api/ai/chat ───────────────────────────────────────────────────────
const handleChat = async (req, res) => {
  try {
    const { message, visitorId, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.error('GEMINI_API_KEY is not configured properly.');
      return res.status(500).json({ message: 'AI service is not configured. Please contact the administrator.' });
    }

    // ── 1. Find or create chat thread ──────────────────────────────────────
    let chat;
    if (chatId) {
      chat = await AiChat.findById(chatId);
    }
    if (!chat) {
      const query = req.user
        ? { userId: req.user._id, status: { $ne: 'closed' } }
        : visitorId ? { visitorId, status: { $ne: 'closed' } } : null;
      if (query) {
        chat = await AiChat.findOne(query).sort({ updatedAt: -1 });
      }
    }
    if (!chat) {
      chat = new AiChat({
        userId: req.user ? req.user._id : null,
        visitorId: req.user ? null : (visitorId || null),
        messages: [],
        status: 'active'
      });
    }

    // Merge visitor → user if logging in later
    if (req.user && !chat.userId) {
      chat.userId = req.user._id;
      chat.visitorId = null;
    }

    // ── 2. Save user message ────────────────────────────────────────────────
    chat.messages.push({ role: 'user', content: message });

    // ── 3. Build Gemini conversation ────────────────────────────────────────
    let responseText;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        systemInstruction: { parts: [{ text: INSTITUTE_KNOWLEDGE }] }
      });

      // Format and sanitize history (exclude the message we just added)
      const pastMessages = chat.messages.slice(0, -1);
      const formattedHistory = sanitizeHistoryForGemini(pastMessages);

      console.log(`[AI Chat] User: ${req.user?.name || visitorId || 'anonymous'} | History: ${formattedHistory.length} turns | Message: "${message.substring(0, 80)}..."`);

      const geminiChat = model.startChat({ history: formattedHistory });
      const result = await geminiChat.sendMessage(message);
      responseText = result.response.text();

      if (!responseText || responseText.trim() === '') {
        console.warn('[AI Chat] Gemini returned empty response. Using fallback.');
        responseText = "I'm sorry, I couldn't process that right now. Please try rephrasing your question, or call us at 9839910481 for immediate help.";
      }

      console.log(`[AI Chat] Response: "${responseText.substring(0, 100)}..."`);
    } catch (geminiErr) {
      console.error('[AI Chat] Gemini API call failed:', geminiErr.message);

      // Detailed error classification
      const errMsg = geminiErr.message || '';
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401') || errMsg.includes('403')) {
        console.error('[AI Chat] ❌ API key is invalid or unauthorized. Check your GEMINI_API_KEY.');
        responseText = "I'm temporarily unable to respond. Our team has been notified. Please call us at 9839910481 for immediate assistance.";
      } else if (errMsg.includes('429') || errMsg.includes('RATE_LIMIT') || errMsg.includes('quota')) {
        console.error('[AI Chat] ❌ Rate limit / quota exceeded.');
        responseText = "I'm receiving too many requests right now. Please wait a moment and try again, or call us at 9839910481.";
      } else if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
        console.error('[AI Chat] ❌ Response blocked by safety filters.');
        responseText = "I wasn't able to respond to that particular question. Could you please rephrase it? For specific queries, contact us at 9839910481.";
      } else {
        // Generic fallback - retry once
        console.log('[AI Chat] Retrying once...');
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
            systemInstruction: { parts: [{ text: INSTITUTE_KNOWLEDGE }] }
          });
          // Retry with no history (simpler request)
          const retryResult = await model.generateContent(message);
          responseText = retryResult.response.text();
          console.log('[AI Chat] Retry succeeded.');
        } catch (retryErr) {
          console.error('[AI Chat] Retry also failed:', retryErr.message);
          responseText = "I'm having trouble connecting right now. Please try again in a moment, or reach out to us directly at 9839910481.";
        }
      }
    }

    // ── 4. Check for human handoff trigger ─────────────────────────────────
    const needsHuman = detectHandoff(responseText);
    if (needsHuman) {
      chat.status = 'needs_human';
      console.log(`[AI Chat] 🚨 Handoff triggered for chat ${chat._id}`);
    }

    // ── 5. Save assistant response & persist ───────────────────────────────
    chat.messages.push({ role: 'assistant', content: responseText });

    try {
      await chat.save();
      console.log(`[AI Chat] ✅ Chat saved. ID: ${chat._id}, Messages: ${chat.messages.length}`);
    } catch (saveErr) {
      console.error('[AI Chat] ❌ Failed to save chat to database:', saveErr.message);
      // Still return the AI response even if save fails
    }

    res.json({
      text: responseText,
      chatId: chat._id,
      status: chat.status,
      needsHuman
    });
  } catch (error) {
    console.error('[AI Chat] Unhandled error:', error.message, error.stack);
    res.status(500).json({
      message: 'Failed to communicate with AI service.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── GET /api/ai/support-chats (Admin) ──────────────────────────────────────
const getSupportChats = async (req, res) => {
  try {
    const { status = 'needs_human' } = req.query;
    const query = status === 'all' ? {} : { status };
    const chats = await AiChat.find(query)
      .populate('userId', 'name username role')
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json(chats);
  } catch (err) {
    console.error('getSupportChats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch support chats.' });
  }
};

// ─── POST /api/ai/support-chats/:id/reply (Admin) ───────────────────────────
const adminReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message is required.' });
    }
    const chat = await AiChat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    chat.adminReplies.push({
      message,
      adminId: req.user._id,
      timestamp: new Date()
    });
    // Also add to messages so user sees it in history
    chat.messages.push({ role: 'assistant', content: `[Support Team]: ${message}` });
    await chat.save();
    console.log(`[Support] Admin replied to chat ${chat._id}`);

    res.json({ success: true, chat });
  } catch (err) {
    console.error('adminReply error:', err.message);
    res.status(500).json({ message: 'Failed to send reply.' });
  }
};

// ─── PATCH /api/ai/support-chats/:id/status (Admin) ─────────────────────────
const updateChatStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'needs_human', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const chat = await AiChat.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    console.log(`[Support] Chat ${chat._id} status changed to: ${status}`);
    res.json(chat);
  } catch (err) {
    console.error('updateChatStatus error:', err.message);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

// ─── GET /api/ai/support-chats/count (Admin) ────────────────────────────────
const getSupportCount = async (req, res) => {
  try {
    const count = await AiChat.countDocuments({ status: 'needs_human' });
    res.json({ count });
  } catch (err) {
    console.error('getSupportCount error:', err.message);
    res.json({ count: 0 });
  }
};

module.exports = {
  optionalAuth,
  getHistory,
  handleChat,
  getSupportChats,
  adminReply,
  updateChatStatus,
  getSupportCount
};
