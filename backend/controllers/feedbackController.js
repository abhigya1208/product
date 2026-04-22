const Feedback = require('../models/Feedback');

/**
 * Submit feedback (public)
 * POST /api/feedback
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { name, rating, message } = req.body;

    if (!rating || !message) {
      return res.status(400).json({ message: 'Rating and message are required.' });
    }

    const feedback = new Feedback({
      name: name || undefined, // allows fallback to default 'Anonymous'
      rating,
      message
    });
    
    await feedback.save();

    res.status(201).json({ message: 'Thank you for your feedback! It has been submitted for review.' });
  } catch (error) {
    console.error('Feedback submit error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get all approved feedback (public)
 * GET /api/feedback/approved
 */
exports.getApprovedFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ isApproved: true }).sort({ createdAt: -1 }).limit(20);
    res.json({ feedbacks });
  } catch (error) {
    console.error('Get approved feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get all feedback (admin only)
 * GET /api/admin/feedback
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Approve or revoke feedback (admin only)
 * PATCH /api/admin/feedback/:id/approve
 */
exports.toggleApproval = async (req, res) => {
  try {
    const { isApproved } = req.body;
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found.' });
    }

    res.json({ message: 'Feedback status updated.', feedback });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Delete feedback permanently (admin only)
 * DELETE /api/admin/feedback/:id
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found.' });
    }
    
    res.json({ message: 'Feedback deleted successfully.' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
