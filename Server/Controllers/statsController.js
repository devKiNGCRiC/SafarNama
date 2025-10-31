import Profile from '../Models/profileModel.js';
import catchAsync from '../utils/catchAsync.js';

export const updateTravelStats = catchAsync(async (req, res) => {
  const { tripDistance, location } = req.body;
  const profile = await Profile.findOne({ user: req.user._id });

  profile.travelStats.totalTrips += 1;
  profile.travelStats.totalDistance += tripDistance;
  
  if (!profile.travelStats.placesVisited.includes(location)) {
    profile.travelStats.placesVisited.push(location);
  }

  await profile.save();
  await checkAndAwardAchievements(req.user._id);

  res.status(200).json({
    status: 'success',
    data: profile.travelStats
  });
});