const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Admin only
router.get('/', auth, roleCheck('admin'), logController.getLogs);

module.exports = router;
