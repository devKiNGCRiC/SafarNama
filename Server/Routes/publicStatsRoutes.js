import express from "express";
import Destination from "../Models/destinationModel.js";
import Tour from "../Models/TourModel.js";
import blogModel from "../Models/blogModel.js";
import UserModel from "../Models/userModel.js";
import catchAsync from "../utils/catchAsync.js";

const CACHE_MS = 5 * 60 * 1000;
let cache = null; // { at, data }

export const clearPublicStatsCache = () => {
  cache = null;
};

// Real totals for the home page (instead of hard-coded marketing numbers).
async function loadCounts() {
  const [destinations, tours, blogs, travellers] = await Promise.all([
    Destination.estimatedDocumentCount(),
    Tour.estimatedDocumentCount(),
    blogModel.estimatedDocumentCount(),
    UserModel.countDocuments({ active: { $ne: false } }),
  ]);
  return { destinations, tours, blogs, travellers };
}

// GET /api/v1/public-stats - public, cached for 5 minutes
export function createPublicStatsRouter() {
  const router = express.Router();
  router.get(
    "/",
    catchAsync(async (req, res) => {
      if (!cache || Date.now() - cache.at > CACHE_MS) {
        cache = { at: Date.now(), data: await loadCounts() };
      }
      res.status(200).json({ success: true, data: cache.data });
    }),
  );
  return router;
}

export default createPublicStatsRouter();
