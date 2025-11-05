import express from 'express';
import multer from 'multer';
import { 
    submitStory,
    getApprovedStories,
    getStoryById,
    getAllStories,
    approveStory,
    rejectStory,
    deleteStory
} from '../Controller/StoryController.js';
import adminAuth from '../middleware/adminAuth.js';

// Multer configuration for image or video
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for images
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

const router = express.Router();

// Public routes
router.post('/submit', upload.single('image'), submitStory); // image only
router.get('/approved', getApprovedStories);
router.get('/approved/:id', getStoryById);

console.log("✅ Story routes registered: POST /submit, GET /approved, GET /approved/:id");

// Admin routes (protected)
router.get('/all', adminAuth, getAllStories);
router.patch('/:id/approve', adminAuth, approveStory);
router.patch('/:id/reject', adminAuth, rejectStory);
router.delete('/:id', adminAuth, deleteStory);

export default router;

