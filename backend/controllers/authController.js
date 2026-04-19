const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Log = require('../models/Log');

/**
 * Login user (admin, teacher, or student)
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required.' });
    }

    // Find user by username and role
    const user = await User.findOne({ username: username.toLowerCase(), role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or role.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT (8 hours expiry)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Create session in DB
    const session = new Session({
      userId: user._id,
      token,
      role: user.role,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    await session.save();

    // Log the login action
    await Log.create({
      userId: user._id,
      userName: user.name,
      role: user.role,
      action: 'LOGIN',
      details: { method: 'credentials' },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // Deactivate the session
    await Session.findOneAndUpdate(
      { token: req.token },
      { isActive: false }
    );

    // Log the logout
    await Log.create({
      userId: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'LOGOUT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout.' });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
