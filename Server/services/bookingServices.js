import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import Tour from '../Models/TourModel.js';
import Booking from '../Models/TourBookingModel.js';
import AppError from '../utils/AppError.js';

class BookingService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Create new booking
  async createBooking(bookingData, user) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tour = await Tour.findById(bookingData.tourId);
      if (!tour) {
        throw new AppError('Tour not found', 404);
      }

      // Validate schedule and availability
      const scheduleDate = tour.schedule.find(s => 
        s.date.toISOString().split('T')[0] === bookingData.selectedDate
      );

      if (!scheduleDate || scheduleDate.status !== 'AVAILABLE') {
        throw new AppError('Selected tour date is not available', 400);
      }

      // Create booking
      const booking = await Booking.create({
        userId: user._id,
        tourId: bookingData.tourId,
        tourName: tour.name,
        fullName: bookingData.fullName,
        email: bookingData.email,
        phone: bookingData.phone,
        guestSize: bookingData.participants,
        bookAt: bookingData.selectedDate,
        totalAmount: bookingData.amount
      });

      // Update tour availability
      scheduleDate.bookedParticipants += bookingData.participants;
      if (scheduleDate.bookedParticipants >= scheduleDate.maxParticipants) {
        scheduleDate.status = 'FULL';
      }
      await tour.save();

      await session.commitTransaction();

      // Send confirmation email
      await this.sendBookingConfirmation(booking, tour, user.email);

      return booking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Send booking confirmation email
  async sendBookingConfirmation(booking, tour, email) {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Booking Confirmation - SafarNama</h1>
          <p>Dear ${booking.fullName},</p>
          <p>Your booking for ${tour.name} has been confirmed!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h3>Booking Details:</h3>
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Tour Date:</strong> ${new Date(booking.bookAt).toLocaleDateString()}</p>
            <p><strong>Number of Guests:</strong> ${booking.guestSize}</p>
            <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
          </div>

          <div style="margin-top: 20px;">
            <h3>Meeting Point:</h3>
            <p>${tour.meetingPoint.address}</p>
            <p>Please arrive 15 minutes before the scheduled time.</p>
          </div>

          <div style="margin-top: 20px;">
            <h3>Important Information:</h3>
            <ul>
              <li>Carry valid ID proof</li>
              <li>Wear comfortable clothing and shoes</li>
              <li>Bring water and any necessary medications</li>
            </ul>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: `Booking Confirmation - ${tour.name}`,
        html: emailContent
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      // Don't throw error as email sending is not critical
    }
  }

  // Get user's booking history
  async getBookingHistory(userId, filter = 'all') {
    const baseQuery = { userId };

    switch (filter) {
      case 'upcoming':
        baseQuery.bookAt = { $gte: new Date() };
        break;
      case 'past':
        baseQuery.bookAt = { $lt: new Date() };
        break;
    }

    const bookings = await Booking.find(baseQuery)
      .populate({
        path: 'tourId',
        select: 'name images destination schedule pricing',
        populate: {
          path: 'destination',
          select: 'name address'
        }
      })
      .sort({ bookAt: -1 });

    return bookings;
  }

  // Cancel booking
  async cancelBooking(bookingId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findOne({ _id: bookingId, userId });
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      // Check cancellation deadline
      const tourDate = new Date(booking.bookAt);
      const now = new Date();
      const hoursBeforeTour = (tourDate - now) / (1000 * 60 * 60);

      if (hoursBeforeTour < 24) {
        throw new AppError(
          'Cancellation is only allowed up to 24 hours before the tour',
          400
        );
      }

      // Update tour availability
      const tour = await Tour.findById(booking.tourId);
      const scheduleDate = tour.schedule.find(s => 
        s.date.toISOString().split('T')[0] === booking.bookAt.toISOString().split('T')[0]
      );

      scheduleDate.bookedParticipants -= booking.guestSize;
      scheduleDate.status = 'AVAILABLE';
      await tour.save();

      // Update booking status
      booking.status = 'CANCELLED';
      await booking.save();

      await session.commitTransaction();
      return booking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new BookingService();