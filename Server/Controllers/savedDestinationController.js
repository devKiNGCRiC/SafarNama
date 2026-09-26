import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import UserModel from "../Models/userModel.js";
import Destination from "../Models/destinationModel.js";
import { assertObjectId } from "../utils/cursor.js";

// A user's saved destinations live in User.savedDestinations (ids of Destination documents).

export const listSavedDestinations = catchAsync(async (req, res) => {
  const user = await UserModel.findById(req.user._id)
    .select("savedDestinations")
    .populate({ path: "savedDestinations", select: "name address images category rating" });
  // a destination that was deleted later populates as null - drop it
  const data = (user?.savedDestinations || []).filter(Boolean);
  res.status(200).json({ success: true, data });
});

export const saveDestination = catchAsync(async (req, res) => {
  const id = assertObjectId(req.params.id, "destination id");
  if (!(await Destination.exists({ _id: id }))) throw new AppError("Destination not found", 404);
  // $addToSet: saving twice is harmless
  await UserModel.updateOne({ _id: req.user._id }, { $addToSet: { savedDestinations: id } });
  res.status(200).json({ success: true, data: { saved: true } });
});

export const unsaveDestination = catchAsync(async (req, res) => {
  const id = assertObjectId(req.params.id, "destination id");
  await UserModel.updateOne({ _id: req.user._id }, { $pull: { savedDestinations: id } });
  res.status(200).json({ success: true, data: { saved: false } });
});
