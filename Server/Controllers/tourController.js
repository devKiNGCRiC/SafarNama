// Controllers/tourController.js
import Tour from '../Models/TourModel.js';
import Booking from '../Models/TourBookingModel.js';
import Destination from '../Models/destinationModel.js';
import AppError from '../utils/AppError.js';

// Get all tours with filtering
export const getAllTours = async (req, res) => {
  try {
    const {
      destination,
      month,
      season,
      year,
      minPrice,
      maxPrice,
      difficulty
    } = req.query;

    let query = { isActive: true };

    // Destination filter
    if (destination) {
      query.destination = destination;
    }

    // Date filters
    if (month || year) {
      const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : 0);
      const endDate = new Date(year || new Date().getFullYear(), month ? month : 11, 31);
      
      query['schedule.date'] = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Season filter
    if (season) {
      query.season = season.toUpperCase();
    }

    // Price filter
    if (minPrice || maxPrice) {
      query['pricing.adult'] = {};
      if (minPrice) query['pricing.adult'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.adult'].$lte = Number(maxPrice);
    }

    // Difficulty filter
    if (difficulty) {
      query.difficultyLevel = difficulty.toUpperCase();
    }

    const tours = await Tour.find(query)
      .populate('destination', 'name address images')
      .sort({ 'schedule.date': 1 });

    res.status(200).json({
      success: true,
      data: tours,
      message: tours.length > 0 ? 'Tours found' : 'No tours available for the selected criteria'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get tours for a specific destination
export const getDestinationTours = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { month, year } = req.query;

    let dateQuery = {};
    if (month || year) {
      const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : 0);
      const endDate = new Date(year || new Date().getFullYear(), month ? month : 11, 31);
      dateQuery = {
        'schedule.date': {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    const tours = await Tour.find({
      destination: destinationId,
      isActive: true,
      ...dateQuery
    }).populate('destination', 'name address images');

    res.status(200).json({
      success: true,
      data: tours,
      message: tours.length > 0 ? 'Tours found' : 'No tours available for this destination'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single tour
export const getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate('destination', 'name address images description');

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tour
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new tour
export const createTour = async (req, res) => {
  try {
    const newTour = new Tour(req.body);
    await newTour.save();

    res.status(201).json({
      success: true,
      data: newTour,
      message: 'Tour created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update tour
export const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tour,
      message: 'Tour updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete tour
export const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.find({
      tourId: req.params.id,
      status: { $in: ['CONFIRMED', 'PENDING'] }
    });

    if (activeBookings.length > 0) {
      // Instead of deleting, mark as inactive
      tour.isActive = false;
      await tour.save();

      return res.status(200).json({
        success: true,
        message: 'Tour marked as inactive due to existing bookings'
      });
    }

    await tour.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check tour availability
export const checkAvailability = async (req, res) => {
  try {
    const { tourId, date, participants } = req.query;
    
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const schedule = tour.schedule.find(s => 
      new Date(s.date).toISOString().split('T')[0] === date
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'No tour scheduled for this date'
      });
    }

    const availableSpots = schedule.maxParticipants - schedule.bookedParticipants;
    const isAvailable = availableSpots >= parseInt(participants);

    res.status(200).json({
      success: true,
      data: {
        isAvailable,
        availableSpots,
        totalSpots: schedule.maxParticipants,
        bookedSpots: schedule.bookedParticipants
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get tour statistics
export const getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$season',
          numTours: { $sum: 1 },
          avgPrice: { $avg: '$pricing.adult' },
          minPrice: { $min: '$pricing.adult' },
          maxPrice: { $max: '$pricing.adult' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get monthly tour schedule
export const getMonthlySchedule = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1);
    const endDate = new Date(year, month);

    const schedule = await Tour.aggregate([
      {
        $unwind: '$schedule'
      },
      {
        $match: {
          'schedule.date': {
            $gte: startDate,
            $lt: endDate
          },
          isActive: true
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$schedule.date' },
          tours: {
            $push: {
              tourId: '$_id',
              name: '$name',
              availableSpots: {
                $subtract: ['$schedule.maxParticipants', '$schedule.bookedParticipants']
              },
              status: '$schedule.status'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add to waitlist
export const addToWaitlist = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { date, participants } = req.body;
    const userId = req.user._id;

    const waitlistEntry = {
      user: userId,
      participants,
      requestDate: new Date()
    };

    const tour = await Tour.findByIdAndUpdate(
      tourId,
      { 
        $push: { 
          'schedule.$[elem].waitlist': waitlistEntry 
        } 
      },
      { 
        arrayFilters: [{ 'elem.date': date }],
        new: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Added to waitlist successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get featured tours
export const getFeaturedTours = async (req, res) => {
  try {
    const tours = await Tour.find({
      isActive: true,
      'schedule.status': 'AVAILABLE'
    })
    .sort('-createdAt')
    .limit(6)
    .populate('destination', 'name address images');

    res.status(200).json({
      success: true,
      data: tours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSimilarTours = async (req, res) => {
  try {
    const { tourId, destination, category } = req.query;
    
    // Find similar tours based on destination and category
    const tours = await Tour.find({
      _id: { $ne: tourId }, // Exclude current tour
      destination: destination,
      category: category
    })
    .populate('destination', 'name')
    .limit(4);

    res.status(200).json({
      success: true,
      data: tours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export default {
  getAllTours,
  getDestinationTours,
  getTour,
  getSimilarTours,
  createTour,
  updateTour,
  deleteTour,
  checkAvailability,
  getTourStats,
  getMonthlySchedule,
  addToWaitlist,
  getFeaturedTours
};