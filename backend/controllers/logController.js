const Log = require('../models/Log');

/**
 * Get all logs (admin only, paginated)
 * GET /api/logs
 */
exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, role, userId } = req.query;

    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (role) filter.role = role;
    if (userId) filter.userId = userId;

    const total = await Log.countDocuments(filter);
    const logs = await Log.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
