const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const logAction = require('../middleware/logAction');

// PUBLIC: Get visible gallery photos (no auth required)
router.get('/public', galleryController.getPublicGallery);

// ADMIN routes: require auth + admin role
router.get('/', auth, roleCheck('admin'), galleryController.getAdminGallery);
router.get('/stats', auth, roleCheck('admin'), galleryController.getGalleryStats);
router.post('/upload', auth, roleCheck('admin'), logAction('UPLOAD_GALLERY_PHOTO'), galleryController.uploadPhoto);
router.put('/:id', auth, roleCheck('admin'), logAction('UPDATE_GALLERY_PHOTO'), galleryController.updatePhoto);
router.patch('/:id/pin', auth, roleCheck('admin'), logAction('TOGGLE_PIN_GALLERY'), galleryController.togglePin);
router.patch('/:id/visibility', auth, roleCheck('admin'), logAction('TOGGLE_VISIBILITY_GALLERY'), galleryController.toggleVisibility);
router.delete('/:id', auth, roleCheck('admin'), logAction('DELETE_GALLERY_PHOTO'), galleryController.deletePhoto);
router.post('/bulk-delete', auth, roleCheck('admin'), logAction('BULK_DELETE_GALLERY'), galleryController.bulkDelete);

module.exports = router;
