const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const logAction = require('../middleware/logAction');

// Public routes
router.post('/login', logAction('LOGIN_ATTEMPT'), authController.login);

// Protected routes
router.post('/logout', auth, logAction('LOGOUT'), authController.logout);
router.get('/me', auth, authController.getMe);
router.put('/change-password', auth, logAction('CHANGE_PASSWORD'), authController.changePassword);

module.exports = router;
