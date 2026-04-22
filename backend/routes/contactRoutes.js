const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public: submit contact form
router.post('/', contactController.submitContact);

// Admin only: view submissions
router.get('/', auth, roleCheck('admin'), contactController.getContacts);
router.patch('/:id/status', auth, roleCheck('admin'), contactController.updateContactStatus);

module.exports = router;
