const Contact = require('../models/Contact');

/**
 * Submit contact form (public)
 * POST /api/contact
 */
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    res.status(201).json({ message: 'Thank you for your message. We will get back to you soon!' });
  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get all contact submissions (admin only)
 * GET /api/contact
 */
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
