import Profile from '../Models/profileModel.js';
import Achievement from '../Models/achievementModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const checkAndAwardAchievements = catchAsync(async (userId) => {
  const profile = await Profile.findOne({ user: userId });
  const achievements = await Achievement.find();
  
  for (const achievement of achievements) {
    const meetsCondition = await checkAchievementCondition(profile, achievement);
    if (meetsCondition && !profile.achievements.includes(achievement._id)) {
      await Profile.findByIdAndUpdate(profile._id, {
        $push: { 
          achievements: {
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            earnedDate: new Date()
          }
        }
      });
    }
  }
});