import express from 'express';
import upload from '../middleware/multer.js';
import { 
    addEvent, 
    getAllEvents, 
    getEventsByType,
    getEventById, 
    updateEvent, 
    deleteEvent, 
    togglePublish 
} from '../Controller/EventController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/type/:type', getEventsByType);
router.get('/:id', getEventById);

// Admin routes (protected)
router.post('/add', adminAuth, upload.single('image'), addEvent);
router.put('/:id', adminAuth, upload.single('image'), updateEvent);
router.delete('/:id', adminAuth, deleteEvent);
router.patch('/:id/toggle-publish', adminAuth, togglePublish);

export default router;
