const { GoogleGenerativeAI } = require('@google/generative-ai');

const handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let chat;
    if (history && history.length > 0) {
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      chat = model.startChat({
        history: formattedHistory,
      });
    } else {
      chat = model.startChat({
        history: [],
      });
    }

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.status(200).json({ text: responseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Failed to communicate with AI service.', error: error.message });
  }
};

module.exports = { handleChat };
