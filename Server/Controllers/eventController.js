// controllers/eventController.js
import Event from '../Models/eventModel.js';

// Create new event
export const createEvent = async (req, res) => {
  try {
    const newEvent = new Event({
      ...req.body,
      organizer: req.user._id
    });
    
    const savedEvent = await newEvent.save();
    
    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: savedEvent
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: err.message
    });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const { type, date, search } = req.query;
    let query = {};

    // Filter by type
    if (type && type !== 'ALL') {
      query.type = type;
    }

    // Filter by date
    if (date) {
      query.startDate = { $gte: new Date(date) };
    }

    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: 1 });
    
    res.status(200).json({
      success: true,
      message: "Successfully fetched events",
      data: events
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: err.message
    });
  }
};

// Get single event
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('registeredUsers.user', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched event",
      data: event
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: err.message
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event"
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Successfully updated event",
      data: updatedEvent
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: err.message
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event"
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Successfully deleted event"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: err.message
    });
  }
};

// Register for event
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if event is full
    if (event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: "Event is full"
      });
    }

    // Check if user is already registered
    if (event.registeredUsers.some(reg => reg.user.toString() === req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: "Already registered for this event"
      });
    }

    event.registeredUsers.push({
      user: req.user._id,
      registrationDate: new Date()
    });

    await event.save();

    res.status(200).json({
      success: true,
      message: "Successfully registered for event",
      data: event
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to register for event",
      error: err.message
    });
  }
};

// Cancel registration
export const cancelRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Remove user from registered users
    event.registeredUsers = event.registeredUsers.filter(
      reg => reg.user.toString() !== req.user._id.toString()
    );

    await event.save();

    res.status(200).json({
      success: true,
      message: "Successfully cancelled registration"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
      error: err.message
    });
  }
};