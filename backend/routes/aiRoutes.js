const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/aiController');

// Define route for handling chat messages
router.post('/chat', handleChat);

module.exports = router;
