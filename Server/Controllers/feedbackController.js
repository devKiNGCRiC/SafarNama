import Feedback from '../Models/Feedback.js';

// Public feedback form: a short text and a 1-5 rating.
export const addFeedback = async (req, res) => {
  const feedback = typeof req.body?.feedback === 'string' ? req.body.feedback.trim() : '';
  const rating = Number(req.body?.rating);
  const userId = typeof req.body?.userId === 'string' ? req.body.userId.slice(0, 40) : undefined;

  if (!feedback || feedback.length > 2000) {
    return res.status(400).json({ message: 'Feedback must be 1 to 2000 characters' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Please choose a rating from 1 to 5' });
  }

  try {
    await new Feedback({ userId, feedback, rating }).save();
    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};
