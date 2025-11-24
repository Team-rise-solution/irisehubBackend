import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid mobile number']
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  educationBackground: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  employmentStatus: {
    type: String,
    enum: ['employed', 'unemployed'],
    required: true
  },
  expectation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for better query performance
bookingSchema.index({ eventId: 1, email: 1 });
bookingSchema.index({ bookingDate: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
