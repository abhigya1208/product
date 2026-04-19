const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and checks active session in database
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session is still active in DB (for force logout support)
    const session = await Session.findOne({ token, isActive: true });
    if (!session) {
      return res.status(401).json({ message: 'Session expired or terminated. Please log in again.' });
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated.' });
    }

    req.user = user;
    req.token = token;
    req.session = session;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Clean up expired session
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await Session.findOneAndUpdate({ token }, { isActive: false });
      }
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

module.exports = auth;
