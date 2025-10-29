import express from 'express';
import { uploadMultiple } from '../middleware/multer.js';
import { 
    addNews, 
    getAllNews, 
    getNewsById, 
    updateNews, 
    deleteNews, 
    togglePublish
} from '../Controller/NewsController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/', getAllNews);
router.get('/:id', getNewsById);

// Admin routes (protected)
router.post('/add', adminAuth, uploadMultiple, addNews);
router.put('/:id', adminAuth, uploadMultiple, updateNews);
router.delete('/:id', adminAuth, deleteNews);
router.patch('/:id/toggle-publish', adminAuth, togglePublish);

export default router;
