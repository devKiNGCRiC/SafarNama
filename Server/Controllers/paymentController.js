import Payment from '../Models/PaymentModel.js';

export const processPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, name, cardNumber, expiryDate, upiId } = req.body;

    const newPayment = new Payment({
      bookingId,
      amount,
      paymentMethod,
      name,
      cardNumber: cardNumber ? cardNumber.slice(-4) : null, // Store only last 4 digits
      expiryDate,
      upiId
    });

    await newPayment.save();

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully!',
      paymentId: newPayment._id
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
};