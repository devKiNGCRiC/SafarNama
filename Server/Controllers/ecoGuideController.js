// controllers/ecoGuideController.js
import EcoGuide from '../Models/ecoGuideModel.js';

export const getAllGuides = async (req, res) => {
  try {
    const guides = await EcoGuide.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name');
    
    res.status(200).json({
      success: true,
      message: "Successfully fetched eco guides",
      data: guides
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch eco guides",
      error: err.message
    });
  }
};

export const createGuide = async (req, res) => {
  try {
    const newGuide = new EcoGuide(req.body);
    const savedGuide = await newGuide.save();
    
    res.status(201).json({
      success: true,
      message: "Successfully created eco guide",
      data: savedGuide
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create eco guide",
      error: err.message
    });
  }
};

export const getGuideById = async (req, res) => {
  try {
    const guide = await EcoGuide.findById(req.params.id)
      .populate('author', 'name')
      .populate('comments.user', 'name');
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Guide not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Successfully fetched eco guide",
      data: guide
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch eco guide",
      error: err.message
    });
  }
};