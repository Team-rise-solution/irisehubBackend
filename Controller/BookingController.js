import Booking from '../model/Booking.js';
import Event from '../model/Event.js';

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { 
      eventId, 
      fullName, 
      email, 
      location, 
      mobileNumber, 
      gender,
      educationBackground,
      employmentStatus,
      expectation 
    } = req.body;

    // Validate required fields
    if (!eventId || !fullName || !email || !location || !mobileNumber || !gender || !educationBackground || !employmentStatus || !expectation) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const normalizedGender = gender.toLowerCase();
    const normalizedEmployment = employmentStatus.toLowerCase();

    if (!['male', 'female'].includes(normalizedGender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be male or female'
      });
    }

    if (!['employed', 'unemployed'].includes(normalizedEmployment)) {
      return res.status(400).json({
        success: false,
        message: 'Employment status must be employed or unemployed'
      });
    }

    if (educationBackground.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Education background must be at least 2 characters'
      });
    }

    if (expectation.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Expectation must be at least 5 characters'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user already booked this event
    const existingBooking = await Booking.findOne({ eventId, email });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event'
      });
    }

    // Create new booking
    const booking = new Booking({
      eventId,
      fullName,
      email,
      location,
      mobileNumber,
      gender: normalizedGender,
      educationBackground: educationBackground.trim(),
      employmentStatus: normalizedEmployment,
      expectation: expectation.trim()
    });

    await booking.save();

    // Populate event details for response
    await booking.populate('eventId', 'title eventDate location');

    res.status(201).json({
      success: true,
      message: 'Event registration successful!',
      data: booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get all bookings (admin only)
export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'bookingDate', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await Booking.find(query)
      .populate('eventId', 'title eventDate location')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBookings,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get bookings for a specific event
export const getBookingsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const bookings = await Booking.find({ eventId })
      .populate('eventId', 'title eventDate location')
      .sort({ bookingDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalBookings = await Booking.countDocuments({ eventId });
    const totalPages = Math.ceil(totalBookings / limit);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBookings,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching event bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event bookings',
      error: error.message
    });
  }
};

// Update booking status (admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, confirmed, or cancelled'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('eventId', 'title eventDate location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// Delete booking (admin only)
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
};

// Get booking statistics (admin only)
export const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Get bookings by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          bookingDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$bookingDate' },
            month: { $month: '$bookingDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        monthlyBookings
      }
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message
    });
  }
};
