const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.post('/', feedbackController.submitFeedback);
router.get('/approved', feedbackController.getApprovedFeedback);

// Admin-only routes
router.get('/admin', auth, roleCheck('admin'), feedbackController.getAllFeedback);
router.patch('/admin/:id/approve', auth, roleCheck('admin'), feedbackController.toggleApproval);
router.delete('/admin/:id', auth, roleCheck('admin'), feedbackController.deleteFeedback);

module.exports = router;
