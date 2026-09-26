// Startup checks and small environment helpers. Pure functions (they take `env`) so they
// are easy to test; index.js calls them with process.env.

const isProduction = (env) => env.NODE_ENV === "production" || env.DEV_MODE === "production";

export const cloudinaryConfigured = (env = process.env) =>
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

// Photos must go to Cloudinary whenever it is set up: most hosts wipe the server's disk on
// every deploy. USE_CLOUDINARY=false is the explicit opt-out for local experiments.
export const shouldUseCloudinary = (env = process.env) =>
  env.USE_CLOUDINARY !== "false" && cloudinaryConfigured(env);

// Behind a host's load balancer (Render, Railway...) every request appears to come from the
// proxy unless Express is told to trust it, which would make per-IP rate limits hit everyone
// at once. TRUST_PROXY overrides the number of hops.
export function trustProxySetting(env = process.env) {
  if (env.TRUST_PROXY) {
    const hops = Number(env.TRUST_PROXY);
    return Number.isFinite(hops) ? hops : env.TRUST_PROXY;
  }
  return isProduction(env) ? 1 : false;
}

// `errors` stop the server from starting; `warnings` are printed and the server runs.
export function validateEnv(env = process.env) {
  const errors = [];
  const warnings = [];
  const production = isProduction(env);

  if (!env.MONGO_DB) errors.push("MONGO_DB is not set (the MongoDB connection string).");

  if (!env.JWT_SECRET_KEY) {
    errors.push("JWT_SECRET_KEY is not set.");
  } else if (env.JWT_SECRET_KEY.length < 32) {
    const message = "JWT_SECRET_KEY should be at least 32 characters long.";
    (production ? errors : warnings).push(message);
  }

  if (production && !env.CLIENT_URL) {
    errors.push("CLIENT_URL must be set in production (used for CORS and links in emails).");
  }

  if (!cloudinaryConfigured(env)) {
    warnings.push("Cloudinary is not configured: photo and video uploads will fail.");
  }
  if (!env.EMAIL_USERNAME || !env.EMAIL_PASSWORD) {
    warnings.push("Email is not configured: password-reset emails will not be sent.");
  }
  return { errors, warnings };
}
