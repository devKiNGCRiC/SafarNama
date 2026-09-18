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
      // Owner comes from the token. Without it the booking could never be found
      // again, because history and lookups filter on userId.
      userId: req.user._id.toString(),
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
      message: "Failed to create booking"
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
  
  // Update booking status. Clients may only cancel their own booking;
  // confirmation is done by the payment controller once a payment is recorded.
  export const updateBookingStatus = async (req, res) => {
    try {
      if (req.body.status !== 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: "Only cancelling a booking is allowed here"
        });
      }

      const booking = await Booking.findOne({
        _id: req.params.id,
        userId: req.user._id.toString()
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found"
        });
      }

      if (booking.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: "Booking is already cancelled"
        });
      }

      booking.status = 'CANCELLED';
      await booking.save();

      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Failed to update booking"
      });
    }
  };

  // Cancel booking (with tour-availability handling; see bookingServices)
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
