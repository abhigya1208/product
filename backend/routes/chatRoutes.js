const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All chat routes require auth + teacher/admin role
router.use(auth, roleCheck('admin', 'teacher'));

router.get('/', chatController.getChats);
router.get('/users', chatController.getChatUsers);
router.post('/one-to-one', chatController.createOneToOneChat);
router.post('/group', chatController.createGroupChat);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.put('/:chatId/read', chatController.markAsRead);
router.put('/:chatId/add-member', chatController.addMember);
router.put('/:chatId/remove-member', chatController.removeMember);
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;
