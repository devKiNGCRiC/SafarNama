import UserModel from "../Models/userModel.js";
import { validatePasswordStrength } from "../utils/security.js";

// Fields that must never be sent to a client
const SENSITIVE_FIELDS =
  "-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -loginAttempts -lockUntil -passwordChangedAt";

// Fields a user may change on their own account. Anything else in the request
// body (role, active, accountStatus, ...) is ignored.
const UPDATABLE_FIELDS = ["firstName", "lastName", "username", "avatar"];

//get all users (admin only - enforced in the route)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}).select(SENSITIVE_FIELDS);
    return res.status(200).send({
      userCount: users.length,
      success: true,
      message: "all users data",
      users,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

//get a User
export const getUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select(
      SENSITIVE_FIELDS,
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }
    res.status(200).json(user);
  } catch (error) {
    // An invalid ObjectId lands here as well
    res.status(400).json({ success: false, message: "Invalid user id" });
  }
};

//Update a User (self or admin - enforced in the route)
export const updateUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    for (const field of UPDATABLE_FIELDS) {
      if (typeof req.body[field] === "string") {
        user[field] = req.body[field];
      }
    }

    if (req.body.password !== undefined) {
      if (typeof req.body.password !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid password" });
      }
      const check = validatePasswordStrength(req.body.password);
      if (!check.isValid) {
        return res
          .status(400)
          .json({ success: false, message: check.errors[0] });
      }
      // Hashed by the pre-save hook in userModel.js
      user.password = req.body.password;
    }

    await user.save();

    const safeUser = await UserModel.findById(user._id).select(
      SENSITIVE_FIELDS,
    );
    res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });
    }
    console.error("updateUser error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update the user" });
  }
};

//Delete user (self or admin - enforced in the route)
export const deleteUser = async (req, res) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};
