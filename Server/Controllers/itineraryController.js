// controllers/itineraryController.js
import Itinerary from '../Models/itineraryModel.js';
import { createError } from '../utils/error.js';

// Create new itinerary
export const createItinerary = async (req, res) => {
  try {
    // Add user ID from authenticated request
    const newItinerary = new Itinerary({
      ...req.body,
      creator: req.user._id
    });
    
    const savedItinerary = await newItinerary.save();
    
    res.status(201).json({
      success: true,
      message: "Itinerary created successfully",
      data: savedItinerary
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create itinerary",
      error: err.message
    });
  }
};


// Get all itineraries
export const getAllItineraries = async (req, res, next) => {
  try {
    const itineraries = await Itinerary.find()
      .populate('destinations.destination', 'name images address category')
      .populate('creator', 'name');
    
    res.status(200).json({
      success: true,
      message: "Successfully fetched all itineraries",
      data: itineraries
    });
  } catch (err) {
    next(createError(500, "Failed to fetch itineraries"));
  }
};

// Get single itinerary
export const getItinerary = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
      .populate('destinations.destination', 'name images address category description activities')
      .populate('creator', 'name');

    if (!itinerary) {
      return next(createError(404, "Itinerary not found"));
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched itinerary",
      data: itinerary
    });
  } catch (err) {
    next(createError(500, "Failed to fetch itinerary"));
  }
};

// Update itinerary
export const updateItinerary = async (req, res) => {
    try {
      const itinerary = await Itinerary.findById(req.params.id);
      
      // Check if itinerary exists
      if (!itinerary) {
        return res.status(404).json({
          success: false,
          message: "Itinerary not found"
        });
      }
      
      // Check if user owns the itinerary or is admin
      if (itinerary.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "You can only update your own itineraries"
        });
      }
  
      const updatedItinerary = await Itinerary.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).populate('destinations.destination');
  
      res.status(200).json({
        success: true,
        message: "Successfully updated itinerary",
        data: updatedItinerary
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to update itinerary",
        error: err.message
      });
    }
  };

// Delete itinerary
export const deleteItinerary = async (req, res) => {
    try {
      const itinerary = await Itinerary.findById(req.params.id);
      
      if (!itinerary) {
        return res.status(404).json({
          success: false,
          message: "Itinerary not found"
        });
      }
  
      // Check if user owns the itinerary or is admin
      if (itinerary.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own itineraries"
        });
      }
  
      await Itinerary.findByIdAndDelete(req.params.id);
      
      res.status(200).json({
        success: true,
        message: "Successfully deleted itinerary"
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to delete itinerary",
        error: err.message
      });
    }
  };

// Get itineraries by destination
export const getItinerariesByDestination = async (req, res, next) => {
  try {
    const { destinationId } = req.params;
    const itineraries = await Itinerary.find({
      'destinations.destination': destinationId
    })
    .populate('destinations.destination', 'name images address')
    .populate('creator', 'name');

    res.status(200).json({
      success: true,
      message: "Successfully fetched itineraries for destination",
      data: itineraries
    });
  } catch (err) {
    next(createError(500, "Failed to fetch itineraries for destination"));
  }
};

// Get user's itineraries
export const getUserItineraries = async (req, res) => {
    try {
      // Check if user is requesting their own itineraries or is admin
      if (req.params.userId !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "You can only view your own itineraries"
        });
      }
  
      const itineraries = await Itinerary.find({ creator: req.params.userId })
        .populate('destinations.destination', 'name images address')
        .populate('creator', 'name');
  
      res.status(200).json({
        success: true,
        message: "Successfully fetched user's itineraries",
        data: itineraries
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch user's itineraries",
        error: err.message
      });
    }
  };