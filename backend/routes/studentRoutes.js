const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All student routes require auth + student role
router.use(auth, roleCheck('student'));

router.get('/profile', studentController.getProfile);
router.get('/payments', studentController.getPaymentHistory);
router.get('/fee-amount', studentController.getFeeAmount);

module.exports = router;
