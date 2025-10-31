// Controllers/destinationController.js
import Destination from '../Models/destinationModel.js';

// Create new destination
export const createDestination = async (req, res) => {
  try {
    const newDestination = new Destination(req.body);
    const savedDestination = await newDestination.save();
    res.status(201).json({
      success: true,
      message: "Successfully created destination",
      data: savedDestination
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create destination"
    });
  }
};

// Update destination
export const updateDestination = async (req, res) => {
  try {
    const updatedDestination = await Destination.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Successfully updated destination",
      data: updatedDestination
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update destination"
    });
  }
};

// Delete destination
export const deleteDestination = async (req, res) => {
  try {
    await Destination.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Successfully deleted destination"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete destination"
    });
  }
};


// Get all destinations
export const getAllDestinations = async (req, res) => {
  try {
    const destinations = await Destination.find();
    res.status(200).json({
      success: true,
      message: "Successfully fetched destinations",
      data: destinations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch destinations"
    });
  }
};

// Get single destination
export const getDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Successfully fetched destination",
      data: destination
    });
  } catch (err) {
    const status = err.name === 'CastError' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? "Destination not found" : "Error fetching destination",
      error: err.message
    });
  }
};

export const getFeaturedDestinations = async (req, res) => {
  try {
    const destinations = await Destination.find({ featured: true })
      .limit(8)
      .select('name location images rating category address');
    
    if (!destinations.length) {
      return res.status(404).json({
        success: false,
        message: "No featured destinations found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched featured destinations",
      data: destinations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured destinations",
      error: err.message
    });
  }
};

// Get destinations by category
export const getDestinationsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const destinations = await Destination.find({ 
      category: category === 'All' ? { $exists: true } : category 
    })
    .select('name location images rating address');
    
    if (!destinations || destinations.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No destinations found for category: ${category}`,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully fetched destinations for category: ${category}`,
      data: destinations
    });
  } catch (err) {
    console.error('Error in getDestinationsByCategory:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch destinations by category",
      error: err.message
    });
  }
};


// Add these new methods for map functionality
export const getNearbyDestinations = async (req, res) => {
  try {
      const { longitude, latitude, radius = 50 } = req.query; // radius in kilometers, default 50km
      
      const destinations = await Destination.find({
          location: {
              $near: {
                  $geometry: {
                      type: 'Point',
                      coordinates: [parseFloat(longitude), parseFloat(latitude)]
                  },
                  $maxDistance: radius * 1000 // Convert to meters
              }
          }
      }).select('name location images rating category address description');

      res.status(200).json({
          success: true,
          message: "Successfully fetched nearby destinations",
          data: destinations
      });
  } catch (err) {
      res.status(500).json({
          success: false,
          message: "Failed to fetch nearby destinations",
          error: err.message
      });
  }
};

// Get destinations within a specific area (for map bounds)
export const getDestinationsInBounds = async (req, res) => {
  try {
      const { north, south, east, west } = req.query;
      
      const destinations = await Destination.find({
          'location.coordinates': {
              $geoWithin: {
                  $box: [
                      [parseFloat(west), parseFloat(south)],
                      [parseFloat(east), parseFloat(north)]
                  ]
              }
          }
      }).select('name location images rating category address');

      res.status(200).json({
          success: true,
          message: "Successfully fetched destinations in bounds",
          data: destinations
      });
  } catch (err) {
      res.status(500).json({
          success: false,
          message: "Failed to fetch destinations in bounds",
          error: err.message
      });
  }
};

// Get destinations with category and activity filters
export const getFilteredDestinations = async (req, res) => {
  try {
      const { category, activityName } = req.query;
      
      let query = {};
      
      if (category && category !== 'All') {
          query.category = category;
      }
      
      if (activityName) {
          query['activities.name'] = activityName;
      }
      
      const destinations = await Destination.find(query)
          .select('name location images rating category address activities');
          
      res.status(200).json({
          success: true,
          message: "Successfully fetched filtered destinations",
          data: destinations
      });
  } catch (err) {
      res.status(500).json({
          success: false,
          message: "Failed to fetch filtered destinations",
          error: err.message
      });
  }
};

