const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiChat = require('../models/AiChat');

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
    console.error('AI getHistory error:', err);
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

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
    }

    // ── 1. Find or create chat thread ──────────────────────────────────────
    let chat;
    if (chatId) {
      chat = await AiChat.findById(chatId);
    }
    if (!chat) {
      const query = req.user
        ? { userId: req.user._id, status: { $ne: 'closed' } }
        : { visitorId, status: { $ne: 'closed' } };
      chat = await AiChat.findOne(query).sort({ updatedAt: -1 });
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

    // ── 3. Build Gemini history from stored messages ────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      systemInstruction: INSTITUTE_KNOWLEDGE
    });

    // Format history for Gemini (exclude the message we just added)
    const pastMessages = chat.messages.slice(0, -1);
    const formattedHistory = pastMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const geminiChat = model.startChat({ history: formattedHistory });
    const result = await geminiChat.sendMessage(message);
    const responseText = result.response.text();

    // ── 4. Check for human handoff trigger ─────────────────────────────────
    const HANDOFF_PHRASE = 'I am connecting you to one of our team members';
    const needsHuman = responseText.toLowerCase().includes('connecting you to one of our team members');
    if (needsHuman) {
      chat.status = 'needs_human';
    }

    // ── 5. Save assistant response & persist ───────────────────────────────
    chat.messages.push({ role: 'assistant', content: responseText });
    await chat.save();

    res.json({
      text: responseText,
      chatId: chat._id,
      status: chat.status,
      needsHuman
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to communicate with AI service.', error: error.message });
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
    console.error('getSupportChats error:', err);
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

    res.json({ success: true, chat });
  } catch (err) {
    console.error('adminReply error:', err);
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
    res.json(chat);
  } catch (err) {
    console.error('updateChatStatus error:', err);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

// ─── GET /api/ai/support-chats/count (Admin) ────────────────────────────────
const getSupportCount = async (req, res) => {
  try {
    const count = await AiChat.countDocuments({ status: 'needs_human' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ count: 0 });
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
