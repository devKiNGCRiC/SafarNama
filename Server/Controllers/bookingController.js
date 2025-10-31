import Booking from '../Models/TourBookingModel.js';
import bookingService from '../services/bookingServices.js';

//create new booking
export const createBooking = async (req, res) => {
  try {
    const {
      tourId,
      tourName,
      userEmail,
      fullName,
      phone,
      guestSize,
      bookAt,
      totalAmount,
      specialRequirements
    } = req.body;

    // Validate required fields
    if (!tourId || !tourName || !userEmail || !fullName || !phone || !guestSize || !bookAt || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newBooking = new Booking({
      tourId,
      tourName,
      userEmail,
      fullName,
      phone,
      guestSize,
      bookAt,
      totalAmount,
      specialRequirements,
      status: 'PENDING'
    });

    const savedBooking = await newBooking.save();

    res.status(200).json({
      success: true,
      message: "Your tour is booked",
      data: savedBooking,
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: err.message
    });
  }
};


//get signal booking
export const getBooking = async (req, res) => {
    try {
      const bookings = await bookingService.getBookingHistory(req.user._id);
      const booking = bookings.find(b => b._id.toString() === req.params.id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found"
        });
      }
  
      res.status(200).json({
        success: true,
        message: "successful",
        data: booking
      });
    } catch (err) {
      res.status(404).json({
        success: false,
        message: err.message
      });
    }
  };



//get all booking
export const getAllBooking = async (req, res) => {
    try {
      const bookings = await bookingService.getBookingHistory(
        req.user._id,
        req.query.filter
      );
  
      res.status(200).json({
        success: true,
        message: "successful",
        data: bookings
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };
  
  // Cancel booking
  export const cancelBooking = async (req, res) => {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user._id);
      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message
      });
    }
  };




// export const createBooking = async (req, res) => {
//   const { fullName, phone, bookingDate, guestCount, totalAmount } = req.body;
//   const newBooking = new Booking({ fullName, phone, bookingDate, guestCount, totalAmount });

//   try {
//     await newBooking.save();
//     res.status(201).json({ message: 'Booking successful!' });
//   } catch (error) {
//     res.status(500).json({ message: 'Booking failed!', error });
//   }
// };
