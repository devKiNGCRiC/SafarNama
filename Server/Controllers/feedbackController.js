import Feedback from '../Models/Feedback.js';

export const addFeedback = async (req, res) => {
  try {
    const { userId, feedback, rating } = req.body;
    const newFeedback = new Feedback({ userId, feedback, rating });
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};
