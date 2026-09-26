import UserModel from "../Models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { createSecureToken, logSecurityEvent, validatePasswordStrength } from "../utils/security.js";

export const NOTIFICATION_KINDS = ["likes", "comments", "follows", "replies"];

const DEFAULT_NOTIFICATIONS = { likes: true, comments: true, follows: true, replies: true };

// Missing values (older accounts) count as "on".
export const notificationPrefs = (user) => ({
  ...DEFAULT_NOTIFICATIONS,
  ...(user.preferences?.notifications?.toObject?.() ?? user.preferences?.notifications ?? {}),
});

const freshToken = (user) => createSecureToken(user._id, { userRole: user.role });

// The person must prove they know the current password before anything risky happens.
async function loadUserWithPassword(id) {
  return UserModel.findById(id).select("+password +active");
}
async function assertPassword(user, candidate, label = "password") {
  if (typeof candidate !== "string" || !candidate) throw new AppError(`Please enter your current ${label}`, 400);
  // 400, not 401: a 401 would make the site think the login expired and sign the person out.
  if (!(await user.comparePassword(candidate))) throw new AppError(`Your current ${label} is incorrect`, 400);
}

export function makeSettingsController() {
  const getSettings = catchAsync(async (req, res) => {
    const u = req.user;
    res.status(200).json({
      success: true,
      data: {
        account: {
          username: u.username,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isEmailVerified: u.isEmailVerified,
          memberSince: u.createdAt,
        },
        preferences: { notifications: notificationPrefs(u) },
      },
    });
  });

  const updatePreferences = catchAsync(async (req, res) => {
    const incoming = req.body?.notifications;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      throw new AppError("Send the notification settings to change", 400);
    }
    const $set = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (!NOTIFICATION_KINDS.includes(key)) throw new AppError(`Unknown notification setting: ${key}`, 400);
      if (typeof value !== "boolean") throw new AppError(`${key} must be true or false`, 400);
      $set[`preferences.notifications.${key}`] = value;
    }
    if (!Object.keys($set).length) throw new AppError("Send the notification settings to change", 400);

    const user = await UserModel.findByIdAndUpdate(req.user._id, { $set }, { new: true });
    res.status(200).json({ success: true, data: { notifications: notificationPrefs(user) } });
  });

  const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    const user = await loadUserWithPassword(req.user._id);
    await assertPassword(user, currentPassword);

    if (typeof newPassword !== "string") throw new AppError("Please enter a new password", 400);
    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) throw new AppError(strength.errors[0], 400);
    if (newPassword === currentPassword) throw new AppError("Your new password must be different from the current one", 400);

    user.password = newPassword; // hashed and "password changed" time set by the model
    await user.save();
    logSecurityEvent("PASSWORD_CHANGED", { userId: user._id, ip: req.ip });

    // Every older token stops working; hand this browser a fresh one so it stays signed in.
    res.status(200).json({ success: true, message: "Password changed. Other devices were signed out.", token: freshToken(user) });
  });

  const signOutEverywhere = catchAsync(async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(req.user._id, { $set: { passwordChangedAt: new Date() } }, { new: true });
    logSecurityEvent("SIGN_OUT_EVERYWHERE", { userId: user._id, ip: req.ip });
    res.status(200).json({ success: true, message: "Signed out of all other devices", token: freshToken(user) });
  });

  // Closes the account (login stops working, all tokens die). Content stays; getting the
  // account back is done by support because nothing is erased.
  const deactivate = catchAsync(async (req, res) => {
    const user = await loadUserWithPassword(req.user._id);
    await assertPassword(user, req.body?.password);

    if (user.role === "admin" && (await UserModel.countDocuments({ role: "admin", _id: { $ne: user._id } })) === 0) {
      throw new AppError("You are the only admin. Make someone else an admin before closing this account.", 400);
    }

    await UserModel.updateOne({ _id: user._id }, { $set: { active: false, passwordChangedAt: new Date() } });
    logSecurityEvent("ACCOUNT_DEACTIVATED", { userId: user._id, ip: req.ip });
    res.status(200).json({ success: true, message: "Your account has been deactivated" });
  });

  return { getSettings, updatePreferences, changePassword, signOutEverywhere, deactivate };
}
