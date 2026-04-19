const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const logAction = require('../middleware/logAction');

// All teacher routes require auth + teacher/admin role
router.use(auth, roleCheck('teacher', 'admin'));

// Dashboard
router.get('/dashboard', teacherController.getDashboardStats);

// Student management
router.post('/students', logAction('TEACHER_ADD_STUDENT'), teacherController.addStudent);
router.get('/students', teacherController.getStudents);
router.get('/students/:id', teacherController.getStudent);
router.put('/students/:id', logAction('TEACHER_UPDATE_STUDENT'), teacherController.updateStudent);

// Offline payments
router.post('/payments/offline', logAction('MARK_OFFLINE_PAYMENT'), teacherController.markOfflinePayment);

// Pending fees
router.get('/pending-fees', teacherController.getPendingFees);

module.exports = router;
