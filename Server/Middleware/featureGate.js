// Keeps an unfinished feature switched off until its environment flag is "true".
// The flag is read on every request, so it can be flipped without touching code.
//   app.use("/api/v1/booking", featureGate("ENABLE_BOOKING", "Booking"), bookingRoutes);
export const featureGate = (flag, label = "This feature", env) => (req, res, next) => {
  if ((env ?? process.env)[flag] === "true") return next();
  return res.status(404).json({ success: false, message: `${label} is not available yet` });
};
