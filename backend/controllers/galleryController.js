const Gallery = require('../models/Gallery');

/**
 * PUBLIC: Get all visible gallery photos
 * Pinned photos appear first, then ordered by displayOrder and date
 */
exports.getPublicGallery = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      Gallery.find({ isVisible: true })
        .sort({ isPinned: -1, displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-uploadedBy'),
      Gallery.countDocuments({ isVisible: true })
    ]);

    res.json({ photos, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get public gallery error:', err);
    res.status(500).json({ message: 'Failed to load gallery.' });
  }
};

/**
 * ADMIN: Get all gallery photos (including hidden)
 */
exports.getAdminGallery = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      Gallery.find()
        .sort({ isPinned: -1, displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name'),
      Gallery.countDocuments()
    ]);

    res.json({ photos, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get admin gallery error:', err);
    res.status(500).json({ message: 'Failed to load gallery.' });
  }
};

/**
 * ADMIN: Upload photo(s) to gallery
 * Accepts base64 encoded image data in request body
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { photos } = req.body; // Array of { imageData, mimeType, fileSize, title, description }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: 'No photos provided.' });
    }

    // Validate each photo
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    const maxSize = 1 * 1024 * 1024 * 1024; // 1 GB
    const minSize = 20 * 1024; // 20 KB

    for (const photo of photos) {
      if (!photo.imageData || !photo.mimeType) {
        return res.status(400).json({ message: 'Each photo must have imageData and mimeType.' });
      }
      if (!validMimes.includes(photo.mimeType)) {
        return res.status(400).json({ message: `Invalid image type: ${photo.mimeType}. Allowed: JPEG, PNG, GIF, WebP, BMP, SVG.` });
      }
      if (photo.fileSize < minSize) {
        return res.status(400).json({ message: `File too small (${(photo.fileSize / 1024).toFixed(1)} KB). Minimum is 20 KB.` });
      }
      if (photo.fileSize > maxSize) {
        return res.status(400).json({ message: `File too large (${(photo.fileSize / 1024 / 1024).toFixed(1)} MB). Maximum is 1 GB.` });
      }
    }

    // Get current max displayOrder
    const lastPhoto = await Gallery.findOne().sort({ displayOrder: -1 });
    let nextOrder = (lastPhoto?.displayOrder || 0) + 1;

    const created = await Gallery.insertMany(
      photos.map(p => ({
        imageData: p.imageData,
        mimeType: p.mimeType,
        fileSize: p.fileSize,
        title: p.title || '',
        description: p.description || '',
        displayOrder: nextOrder++,
        uploadedBy: req.user._id
      }))
    );

    res.status(201).json({ message: `${created.length} photo(s) uploaded.`, photos: created });
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ message: 'Failed to upload photos.' });
  }
};

/**
 * ADMIN: Update photo details (title, description, visibility, pin)
 */
exports.updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPinned, isVisible } = req.body;

    const photo = await Gallery.findById(id);
    if (!photo) return res.status(404).json({ message: 'Photo not found.' });

    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;
    if (isPinned !== undefined) photo.isPinned = isPinned;
    if (isVisible !== undefined) photo.isVisible = isVisible;

    await photo.save();
    res.json({ message: 'Photo updated.', photo });
  } catch (err) {
    console.error('Update photo error:', err);
    res.status(500).json({ message: 'Failed to update photo.' });
  }
};

/**
 * ADMIN: Toggle pin status
 */
exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Gallery.findById(id);
    if (!photo) return res.status(404).json({ message: 'Photo not found.' });

    photo.isPinned = !photo.isPinned;
    await photo.save();
    res.json({ message: photo.isPinned ? 'Photo pinned.' : 'Photo unpinned.', photo });
  } catch (err) {
    console.error('Toggle pin error:', err);
    res.status(500).json({ message: 'Failed to toggle pin.' });
  }
};

/**
 * ADMIN: Toggle visibility
 */
exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Gallery.findById(id);
    if (!photo) return res.status(404).json({ message: 'Photo not found.' });

    photo.isVisible = !photo.isVisible;
    await photo.save();
    res.json({ message: photo.isVisible ? 'Photo is now visible.' : 'Photo is now hidden.', photo });
  } catch (err) {
    console.error('Toggle visibility error:', err);
    res.status(500).json({ message: 'Failed to toggle visibility.' });
  }
};

/**
 * ADMIN: Delete photo(s)
 */
exports.deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Gallery.findByIdAndDelete(id);
    if (!photo) return res.status(404).json({ message: 'Photo not found.' });
    res.json({ message: 'Photo deleted.' });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ message: 'Failed to delete photo.' });
  }
};

/**
 * ADMIN: Bulk delete photos
 */
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No photo IDs provided.' });
    }

    const result = await Gallery.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} photo(s) deleted.` });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ message: 'Failed to delete photos.' });
  }
};

/**
 * ADMIN: Get gallery stats
 */
exports.getGalleryStats = async (req, res) => {
  try {
    const [total, visible, pinned, totalSizeResult] = await Promise.all([
      Gallery.countDocuments(),
      Gallery.countDocuments({ isVisible: true }),
      Gallery.countDocuments({ isPinned: true }),
      Gallery.aggregate([{ $group: { _id: null, totalSize: { $sum: '$fileSize' } } }])
    ]);

    const totalSize = totalSizeResult.length > 0 ? totalSizeResult[0].totalSize : 0;

    res.json({ total, visible, hidden: total - visible, pinned, totalSize });
  } catch (err) {
    console.error('Gallery stats error:', err);
    res.status(500).json({ message: 'Failed to get gallery stats.' });
  }
};
