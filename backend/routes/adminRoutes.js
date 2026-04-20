const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const logAction = require('../middleware/logAction');

// All admin routes require auth + admin role
router.use(auth, roleCheck('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Teacher management
router.post('/teachers', logAction('CREATE_TEACHER'), adminController.createTeacher);
router.get('/teachers', adminController.getTeachers);
router.put('/teachers/:id', logAction('UPDATE_TEACHER'), adminController.updateTeacher);
router.put('/teachers/:id/reset-password', logAction('RESET_TEACHER_PASSWORD'), adminController.resetTeacherPassword);
router.delete('/teachers/:id', logAction('DELETE_TEACHER'), adminController.deleteTeacher);

// Student management
router.post('/students', logAction('ADD_STUDENT'), adminController.addStudent);
router.post('/students/bulk-import', logAction('BULK_IMPORT_STUDENTS'), adminController.bulkImportStudents);
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudent);
router.put('/students/:id', logAction('UPDATE_STUDENT'), adminController.updateStudent);
router.delete('/students/:id', logAction('DELETE_STUDENT'), adminController.deleteStudent);

// Session management
router.get('/sessions', adminController.getSessions);
router.delete('/sessions/:id', logAction('TERMINATE_SESSION'), adminController.terminateSession);

// Exports
router.get('/export/students', adminController.exportStudentsExcel);
router.get('/export/payments', adminController.exportPaymentsExcel);
router.get('/export/logs', adminController.exportLogsExcel);

module.exports = router;
