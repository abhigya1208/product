const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const logAction = require('../middleware/logAction');

// Get announcements - all authenticated users
router.get('/', auth, announcementController.getAnnouncements);

// Create/update/delete - admin and teacher only
router.post('/', auth, roleCheck('admin', 'teacher'), logAction('CREATE_ANNOUNCEMENT'), announcementController.createAnnouncement);
router.put('/:id', auth, roleCheck('admin', 'teacher'), logAction('UPDATE_ANNOUNCEMENT'), announcementController.updateAnnouncement);
router.delete('/:id', auth, roleCheck('admin', 'teacher'), logAction('DELETE_ANNOUNCEMENT'), announcementController.deleteAnnouncement);

module.exports = router;
