import UserModel from "../Models/userModel.js";
import bcrypt from "bcrypt"; 
import jwt from 'jsonwebtoken';

//get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({});
    // users = users.map((user) => {
    //   const { password, ...otherDetails } = user._doc;
    //   return otherDetails;
    // });
    return res.status(200).send({
      userCount: users.length,
      success: true,
      message: "all users data",
      users: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

//get a User
export const getUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await UserModel.findById(id);
    if (user) {
      const { password, ...otherDetails } = user._doc;
      res.status(200).json(otherDetails);
    } else {
      res.status(404).json("User does not exist");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};


//Update a User
export const updateUser = async (req, res) => {
  const id = req.params.id;
  const { _id, currentUserAdminStatus, password } = req.body;

  if (id === _id || currentUserAdminStatus) {
    try {
        if (password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(password, salt);
        }

        // Check if user exists
        const userExists = await UserModel.findById(id);
        if (!userExists) {
          return res.status(404).json({ message: "User not found" });
        }

        const user = await UserModel.findByIdAndUpdate(id, req.body, {
            new: true,
        });

        const token = jwt.sign(
          { username: user.username, id: user._id },
          process.env.JWT_KEY,
          { expiresIn: "1h" }
        );

        res.status(200).json({ user ,token });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while updating the user", details: error });
    }
  } else {
    res.status(403).json("Access Denied! You can only update your own account");
  }
};


//Delete user

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const { _id , currentUserAdminStatus } = req.body;

  if ( _id ===  id|| currentUserAdminStatus) {
    try {
      await UserModel.findByIdAndDelete(id);
      res.status(200).json("User deleted successfully");
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).json("Access Denied! You can only delete your own account");
  }
};

//Follow a User
export const followUser = async (req, res) => {
  const id = req.params.id;
  const { _id } = req.body;

  if (_id === id) {
    res.status(403).json("Action forbidden");
  } else {
    try {
      const followUser = await UserModel.findById(id);
      const followingUser = await UserModel.findById(_id);

      if (!followUser.followers.includes(_id)) {
        await followUser.updateOne({ $push: { followers: _id } });
        await followingUser.updateOne({ $push: { following: id } });
        res.status(200).json("User followed!");
      } else {
        res.status(403).json("User is already followed by you");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
};


//Unfollow a User
export const unfollowUser = async (req, res) => {
  const id = req.params.id;
  const { _id } = req.body;

  if (_id === id) {
    res.status(403).json("Action forbidden");
  } else {
    try {
      const followUser = await UserModel.findById(id);
      const followingUser = await UserModel.findById(_id);

      if (followUser.followers.includes(_id)) {
        await followUser.updateOne({ $pull: { followers: _id } });
        await followingUser.updateOne({ $pull: { following: id } });
        res.status(200).json("User Unfollowed!");
      } else {
        res.status(403).json("User is not followed by you");
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
};

//create new User
export const createUser = async (req, res) => {
  const newUser = new User(req.body)
  try {
      const savedUser = await newUser.save()
      res
          .status(200)
          .json({
              success: true, message: "Successfully created",
              data: savedUser,
          });
  } catch (err) {
      res
          .status(500)
          .json({ success: false, message: "Failed to created. Try again", });

  }
}

// Save destination
export const saveDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const userId = req.user._id;

    const user = await UserModel.findById(userId);
    
    // Check if destination is already saved
    const isAlreadySaved = user.savedDestinations.some(
      saved => saved.destination.toString() === destinationId
    );

    if (isAlreadySaved) {
      return res.status(400).json({
        success: false,
        message: "Destination already saved"
      });
    }

    // Add to saved destinations
    user.savedDestinations.push({
      destination: destinationId
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Destination saved successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to save destination",
      error: err.message
    });
  }
};

// Get user's saved destinations
export const getSavedDestinations = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId)
      .populate('savedDestinations.destination', 'name images address description');

    res.status(200).json({
      success: true,
      message: "Successfully fetched saved destinations",
      data: user.savedDestinations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved destinations",
      error: err.message
    });
  }
};

// Get user's itineraries
export const getUserItineraries = async (req, res) => {
  try {
    const userId = req.user._id;

    const itineraries = await Itinerary.find({ creator: userId })
      .populate('destinations.destination', 'name images address');

    res.status(200).json({
      success: true,
      message: "Successfully fetched user itineraries",
      data: itineraries
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user itineraries",
      error: err.message
    });
  }
};