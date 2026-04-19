const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const logAction = require('../middleware/logAction');

// Public: get razorpay key
router.get('/razorpay-key', paymentController.getRazorpayKey);

// Protected routes
router.post('/create-order', auth, paymentController.createOrder);
router.post('/verify', auth, logAction('ONLINE_PAYMENT'), paymentController.verifyPayment);
router.get('/', auth, paymentController.getPayments);
router.get('/:id/receipt', auth, paymentController.downloadReceipt);

module.exports = router;
