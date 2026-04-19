const Announcement = require('../models/Announcement');

/**
 * Create announcement
 * POST /api/announcements
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const announcement = new Announcement({
      title,
      content,
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    await announcement.save();

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name role');

    res.status(201).json({ message: 'Announcement created.', announcement: populated });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get all announcements
 * GET /api/announcements
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await Announcement.countDocuments();
    const announcements = await Announcement.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      announcements,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Update announcement
 * PUT /api/announcements/:id
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    // Only the creator or admin can edit
    if (announcement.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own announcements.' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    await announcement.save();

    res.json({ message: 'Announcement updated.', announcement });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    if (announcement.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own announcements.' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
