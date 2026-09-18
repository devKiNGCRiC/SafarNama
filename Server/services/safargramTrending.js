import SafarPost from "../Models/safargramPostModel.js";
import Destination from "../Models/destinationModel.js";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // last 30 days
const CACHE_MS = 60 * 1000; // recompute at most once a minute
const MAX_HASHTAGS = 8;
const MAX_DESTINATIONS = 5;

let cache = null; // { at, data }

export function clearTrendingCache() {
  cache = null;
}

// Top hashtags and tagged destinations of the last 30 days.
// Each post counts once per tag (hashtags are unique within a post).
export async function getTrending(now = Date.now()) {
  if (cache && now - cache.at < CACHE_MS) return cache.data;

  const since = new Date(now - WINDOW_MS);

  const [hashtags, destinations] = await Promise.all([
    SafarPost.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: MAX_HASHTAGS },
    ]),
    SafarPost.aggregate([
      { $match: { createdAt: { $gte: since }, destination: { $ne: null } } },
      { $group: { _id: "$destination", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: MAX_DESTINATIONS },
      {
        $lookup: {
          from: Destination.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "place",
        },
      },
      { $unwind: "$place" }, // drops destinations that no longer exist
      { $project: { name: "$place.name", count: 1 } },
    ]),
  ]);

  const data = {
    hashtags: hashtags.map((h) => ({ tag: h._id, count: h.count })),
    destinations: destinations.map((d) => ({ _id: d._id, name: d.name, count: d.count })),
  };
  cache = { at: now, data };
  return data;
}
