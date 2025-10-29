import express from 'express';
import { 
  createBooking, 
  getAllBookings, 
  getBookingsByEvent, 
  updateBookingStatus, 
  deleteBooking, 
  getBookingStats 
} from '../Controller/BookingController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.post('/create', createBooking);
router.get('/event/:eventId', getBookingsByEvent);

// Admin routes (protected)
router.get('/', adminAuth, getAllBookings);
router.get('/stats', adminAuth, getBookingStats);
router.patch('/:id/status', adminAuth, updateBookingStatus);
router.delete('/:id', adminAuth, deleteBooking);

export default router;
