import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/auth';
import multer from 'multer';
import * as GalleryController from '../controllers/gallery.controller';

const router = Router();

// Configure multer to only store buffers in memory (we upload those directly to Bunny)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});

// Categories
// Allow public access to GET categories to display them on the main website
router.get('/categories', GalleryController.getCategories);
router.get('/categories/:id', GalleryController.getCategoryById);

// Protected routes for backpanel mutations
router.post('/categories', authenticate, authorize('gallery_categories', 'create'), GalleryController.createCategory);
router.put('/categories/:id', authenticate, authorize('gallery_categories', 'update'), GalleryController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('gallery_categories', 'delete'), GalleryController.deleteCategory);

// Images
// Allow public access to GET images to display on the main website
router.get('/images', GalleryController.getImages);
router.get('/images/:id', GalleryController.getImageById);

// Protected routes for backpanel image uploads
router.post('/images', authenticate, authorize('gallery_images', 'create'), upload.single('image'), GalleryController.uploadGalleryImage);
router.put('/images/:id', authenticate, authorize('gallery_images', 'update'), upload.single('image'), GalleryController.updateImage);
router.delete('/images/:id', authenticate, authorize('gallery_images', 'delete'), GalleryController.deleteGalleryImage);

export default router;
