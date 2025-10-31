import express from 'express';
const router = express.Router();
import  DestinationModel from '../Models/destinationModel.js';

// Get all destinations
router.get('/', async (req, res) => {
  try {
    const destinations = await DestinationModel.find();
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single destination by ID
router.get('/:id', getDestination, (req, res) => {
  res.json(res.destination);
});

// Middleware to get destination by ID
async function getDestination(req, res, next) {
  let destination;
  try {
    destination = await Destination.findById(req.params.id);
    if (destination == null) {
      return res.status(404).json({ message: 'Cannot find destination' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.destination = destination;
  next();
}

export default router;
