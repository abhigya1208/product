const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiChat = require('../models/AiChat');

// ─── Validate API key on module load ────────────────────────────────────────
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is missing or set to placeholder in .env. AI chatbot will NOT work.');
} else {
  console.log('✅ GEMINI_API_KEY found.');
}

// ─── Institute Knowledge System Prompt ──────────────────────────────────────
const INSTITUTE_KNOWLEDGE = `
You are the official AI mentor and assistant for AGS Tutorial — a coaching institute located at:
A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi – 110094.

CONTACT:
- Phone / WhatsApp: 9839910481
- Email: agstutorial050522@gmail.com
- Instagram: @agstutorial (https://www.instagram.com/agstutorial/)
- Timings: Monday–Saturday, 7:00 AM – 8:00 PM

ABOUT AGS TUTORIAL:
- Established in 2022 (4+ years of excellence)
- Offers coaching from Nursery to Class 12
- 100% board passing result for every student since opening
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
- Class 1-3: KHUSHI MAM
- Class 4-5: SHIVANI MAM
- Class 6-8: VARTIKA MAM
- Class 9-10: ABHIGYA SIR

HANDOFF INSTRUCTION:
If someone asks something completely outside the scope of AGS Tutorial (e.g., cooking recipes, politics, personal advice), respond EXACTLY with: "I am connecting you to one of our team members for support. They will get back to you shortly."
Do NOT use this phrase for simple greetings, course questions, fee queries, or anything related to the institute.
`;

// ─── Static Fallback Logic (Keywords) ───────────────────────────────────────
function getStaticFallback(message) {
  const msg = message.toLowerCase();
  
  // Greetings
  if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.includes('good morning') || msg.includes('good evening')) {
    return "Hello! 👋 I'm the AGS Tutorial AI mentor. How can I help you today? You can ask me about our courses, fees, location, or faculty.";
  }

  if (msg.includes('fee') || msg.includes('price') || msg.includes('charge')) {
    return "Our monthly fees range from ₹250 to ₹600 depending on the class. \n\n- Nursery-UKG: ₹250\n- Class 1-2: ₹300\n- Class 3-5: ₹350\n- Class 6-7: ₹400\n- Class 8: ₹450\n- Class 9: ₹500\n- Class 10: ₹600\n\nFor Classes 11-12, it ranges between ₹400–₹1200. Please visit the branch for specific details.";
  }
  
  if (msg.includes('address') || msg.includes('location') || msg.includes('where')) {
    return "AGS Tutorial is located at: A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi – 110094. You are always welcome to visit us!";
  }
  
  if (msg.includes('phone') || msg.includes('contact') || msg.includes('number') || msg.includes('call') || msg.includes('whatsapp')) {
    return "You can call or WhatsApp us at 9839910481, or email us at agstutorial050522@gmail.com.";
  }
  
  if (msg.includes('timing') || msg.includes('open') || msg.includes('when') || msg.includes('schedule')) {
    return "We are open Monday to Saturday, from 7:00 AM to 8:00 PM.";
  }
  
  if (msg.includes('teacher') || msg.includes('faculty') || msg.includes('sir') || msg.includes('mam')) {
    return "Our expert faculty includes:\n- Nursery-UKG: Kulsum Mam\n- Class 1-3: Khushi Mam\n- Class 4-5: Shivani Mam\n- Class 6-8: Vartika Mam\n- Class 9-10: Abhigya Sir\n\nAll our teachers are dedicated to your academic success!";
  }

  if (msg.includes('admission') || msg.includes('join') || msg.includes('enroll')) {
    return "Admissions are currently OPEN for the academic session 2026-27. Please visit our Sonia Vihar branch to fill out the admission form. Bring along Aadhaar, a photo, and your previous mark-sheet.";
  }

  return null; // No static match
}

// ─── Handoff detection phrases ──────────────────────────────────────────────
const HANDOFF_TRIGGERS = [
  'connecting you to one of our team members',
  'connect you to a team member',
  'talk to a person',
  'human support',
  'speak to a representative'
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
    if (role === lastRole) {
      if (history.length > 0) {
        history[history.length - 1].parts[0].text += '\n' + m.content;
      }
      continue;
    }
    history.push({ role, parts: [{ text: m.content }] });
    lastRole = role;
  }

  while (history.length > 0 && history[0].role !== 'user') history.shift();
  while (history.length > 0 && history[history.length - 1].role !== 'model') history.pop();

  return history;
}

// ─── Optional middleware ───────────────────────────────────────────────────
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
          if (user && user.isActive) req.user = user;
        }
      } catch (_) {}
    }
  } catch (_) {}
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
    res.status(500).json({ message: 'Failed to fetch history.' });
  }
};

// ─── POST /api/ai/chat ───────────────────────────────────────────────────────
const handleChat = async (req, res) => {
  const { message, visitorId, chatId } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' });

  try {
    // 1. Find/Create Chat
    let chat;
    if (chatId) chat = await AiChat.findById(chatId);
    if (!chat) {
      const query = req.user ? { userId: req.user._id, status: { $ne: 'closed' } } : visitorId ? { visitorId, status: { $ne: 'closed' } } : null;
      if (query) chat = await AiChat.findOne(query).sort({ updatedAt: -1 });
    }
    if (!chat) {
      chat = new AiChat({
        userId: req.user ? req.user._id : null,
        visitorId: req.user ? null : (visitorId || null),
        messages: [],
        status: 'active'
      });
    }
    if (req.user && !chat.userId) { chat.userId = req.user._id; chat.visitorId = null; }

    // 2. Save User Message
    chat.messages.push({ role: 'user', content: message });

    let responseText = null;
    let needsHuman = false;
    let apiSuccess = false;

    // 3. Try Gemini with Retry Logic
    const callGemini = async (msg, history, attempt = 1) => {
      try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
          throw new Error('MISSING_API_KEY');
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
          systemInstruction: { parts: [{ text: INSTITUTE_KNOWLEDGE }] }
        });

        const formattedHistory = sanitizeHistoryForGemini(history);
        const geminiChat = model.startChat({ history: formattedHistory });
        const result = await geminiChat.sendMessage(msg);
        return result.response.text();
      } catch (err) {
        if (attempt < 2) {
          console.log(`[AI Chat] Gemini attempt ${attempt} failed, retrying...`);
          return callGemini(msg, history, attempt + 1);
        }
        throw err;
      }
    };

    try {
      console.log(`[AI Chat] Calling Gemini for: "${message}"`);
      responseText = await callGemini(message, chat.messages.slice(0, -1));
      apiSuccess = true;
      console.log(`[AI Chat] Gemini responded: "${responseText.substring(0, 50)}..."`);
      
      // Only detect handoff if API was successful
      needsHuman = detectHandoff(responseText);
      if (needsHuman) {
        chat.status = 'needs_human';
        console.log(`[AI Chat] 🚨 Handoff triggered by AI response.`);
      }
    } catch (err) {
      console.error('[AI Chat] Gemini Final Failure:', err.message);
      
      // Check for specific leaked key error for server logs
      if (err.message.includes('leaked') || err.message.includes('reported as leaked')) {
        console.error('🛑 CRITICAL: GEMINI_API_KEY is reported as leaked.');
      }

      // 4. Try Static Fallback (Hidden from handoff logic)
      const fallback = getStaticFallback(message);
      if (fallback) {
        responseText = fallback;
        console.log('[AI Chat] Used static fallback.');
      } else {
        // 5. Final Connection Error Message (No handoff flag unless successful "I don't know")
        responseText = "I'm having trouble connecting to my mentor brain right now. Please try again in a moment, or reach out to us directly at 9839910481.";
        console.log('[AI Chat] API failed and no static fallback found.');
      }
    }

    // 6. Save & Respond
    chat.messages.push({ role: 'assistant', content: responseText });
    await chat.save();

    res.json({ 
      text: responseText, 
      chatId: chat._id, 
      status: chat.status, 
      needsHuman: apiSuccess ? needsHuman : false // Only show handoff badge if API worked and triggered it
    });

  } catch (err) {
    console.error('[AI Chat] Critical Failure:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Admin handlers...
const getSupportChats = async (req, res) => {
  try {
    const chats = await AiChat.find({ status: req.query.status || 'needs_human' }).populate('userId', 'name').sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};
const adminReply = async (req, res) => {
  try {
    const chat = await AiChat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Not found' });
    chat.adminReplies.push({ message: req.body.message, adminId: req.user._id });
    chat.messages.push({ role: 'assistant', content: `[Support Team]: ${req.body.message}` });
    await chat.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};
const updateChatStatus = async (req, res) => {
  try {
    const chat = await AiChat.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(chat);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};
const getSupportCount = async (req, res) => {
  try {
    const count = await AiChat.countDocuments({ status: 'needs_human' });
    res.json({ count });
  } catch (err) { res.json({ count: 0 }); }
};

module.exports = { optionalAuth, getHistory, handleChat, getSupportChats, adminReply, updateChatStatus, getSupportCount };
