// Builds a day-by-day trip plan from the destinations we have. No AI and no outside service:
// it scores each destination against what the traveller asked for, keeps the route
// geographically tight, and spreads the days across the chosen stops. Pure and deterministic
// (the same input always gives the same plan), so it is easy to test.

export const INTERESTS = {
  Trekking: { activity: ["trek", "hik", "trail", "climb", "mountaineer"], category: ["Mountain"] },
  Wildlife: { activity: ["safari", "wildlife", "bird", "tiger", "elephant", "jungle"], category: ["Park", "Nature"] },
  Beaches: { activity: ["beach", "surf", "snorkel", "swim", "island"], category: ["Beach"] },
  "Water sports": { activity: ["raft", "kayak", "dive", "scuba", "boat", "paddle", "snorkel"], category: ["Beach"] },
  Camping: { activity: ["camp", "bonfire", "stargaz"], category: ["Mountain", "Nature"] },
  Photography: { activity: ["photo", "sunrise", "sunset", "view"], category: ["Nature", "Mountain"] },
  Culture: { activity: ["culture", "heritage", "temple", "monaster", "festival", "village", "food", "cuisine", "market", "museum"], category: [] },
  Relaxation: { activity: ["spa", "yoga", "meditat", "relax", "retreat", "boat"], category: ["Beach", "Nature"] },
};
export const INTEREST_NAMES = Object.keys(INTERESTS);

// How many days the traveller wants to spend at each stop.
export const PACES = { relaxed: 3, balanced: 2, packed: 1 };

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export const monthName = (n) => (Number.isInteger(n) && n >= 1 && n <= 12 ? MONTHS[n - 1][0].toUpperCase() + MONTHS[n - 1].slice(1) : "");

const inMonthList = (list, month) => {
  if (!month) return false;
  const name = MONTHS[month - 1];
  return (list || []).some((m) => typeof m === "string" && name.startsWith(m.trim().toLowerCase().slice(0, 3)) && m.trim().length >= 3);
};

// great-circle distance in km between two [lng, lat] pairs (null when either is missing)
export function distanceKm(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return null;
  const rad = (d) => (d * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

const has = (text, keywords) => keywords.some((k) => String(text || "").toLowerCase().includes(k));
const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

// Which of the traveller's interests a destination satisfies, and via which activities.
function matchInterests(destination, interests) {
  const matched = new Set();
  const activityHits = [];
  const categories = asList(destination.category);
  for (const interest of interests) {
    const rule = INTERESTS[interest];
    for (const activity of destination.activities || []) {
      if (has(activity.name, rule.activity) || has(activity.description, rule.activity.filter((k) => k.length > 4))) {
        matched.add(interest);
        activityHits.push(activity.name);
      }
    }
    if (categories.some((c) => rule.category.includes(c))) matched.add(interest);
  }
  return { matched: [...matched], activityHits: [...new Set(activityHits)] };
}

// Higher is a better fit. Season counts a lot: a great match in the wrong month is a bad trip.
function scoreDestination(destination, { interests, month }) {
  const { matched } = matchInterests(destination, interests);
  let score = (Number(destination.rating) || 0) * 2 + (destination.featured ? 1 : 0) + matched.length * 4;
  let season = "unknown";
  if (month) {
    if (inMonthList(destination.bestTimeToVisit?.months, month) || inMonthList(destination.seasonality?.peakSeason?.months, month)) {
      score += 5;
      season = "good";
    } else if (inMonthList(destination.seasonality?.offSeason?.months, month)) {
      score -= 4;
      season = "off";
    } else if ((destination.bestTimeToVisit?.months || []).length) {
      score -= 1; // there is a best time and this is not it
      season = "other";
    }
  }
  return { score, matched, season };
}

const pointOf = (d) => d.location?.coordinates;
const KM_PER_SCORE_POINT = 120; // 120 km of extra travel cancels one point of score

// Pick `count` stops: start from the best fit, then keep choosing good destinations that are
// also close to the previous one, so the trip is a sensible route and not a zig-zag.
function chooseRoute(scored, count) {
  const remaining = [...scored].sort((a, b) => b.score - a.score || String(a.destination.name).localeCompare(String(b.destination.name)));
  const route = [remaining.shift()];
  while (route.length < count && remaining.length) {
    const last = route[route.length - 1];
    let bestIndex = 0;
    let bestValue = -Infinity;
    remaining.forEach((candidate, i) => {
      const km = distanceKm(pointOf(last.destination), pointOf(candidate.destination));
      const value = candidate.score - (km === null ? 0 : km / KM_PER_SCORE_POINT);
      if (value > bestValue) {
        bestValue = value;
        bestIndex = i;
      }
    });
    route.push(remaining.splice(bestIndex, 1)[0]);
  }
  return route;
}

// days split over stops: everyone gets the same, the extras go to the best-scoring first stops
function splitDays(totalDays, stops) {
  const base = Math.floor(totalDays / stops);
  const extra = totalDays % stops;
  return Array.from({ length: stops }, (_, i) => base + (i < extra ? 1 : 0));
}

const LONG_TRANSFER_KM = 450;

// `destinations`: plain objects (see the fields used above). `options`: validated by
// parseGenerateInput. Returns { plan } or { error }.
export function generateItinerary(destinations, options) {
  const { days, month = null, interests = [], pace = "balanced", region = "" } = options;
  const warnings = [];

  let pool = destinations.filter((d) => d?.name);
  if (region) {
    const inRegion = pool.filter((d) => String(d.address || "").toLowerCase().includes(region.toLowerCase()));
    if (inRegion.length) pool = inRegion;
    else warnings.push(`We have no destinations in "${region}" yet, so this plan covers the whole country.`);
  }
  if (!pool.length) return { error: "There are no destinations to plan with yet." };

  const scored = pool.map((destination) => ({ destination, ...scoreDestination(destination, { interests, month }) }));

  // do not send anyone to a place in its off-season if there is another way to fill the trip
  const comfortable = scored.filter((s) => s.season !== "off");
  const usable = comfortable.length >= Math.min(2, scored.length) ? comfortable : scored;

  const wanted = Math.max(1, Math.floor(days / PACES[pace]));
  const stopCount = Math.min(wanted, days, usable.length);
  if (stopCount < wanted && usable.length < wanted) {
    warnings.push(`We only have ${usable.length} destination${usable.length === 1 ? "" : "s"} to choose from, so some stops are longer.`);
  }

  const route = chooseRoute(usable, stopCount);
  const dayCounts = splitDays(days, route.length);

  let cursor = 1;
  let totalKm = 0;
  const stops = route.map((entry, index) => {
    const { destination } = entry;
    const { activityHits } = matchInterests(destination, interests);
    const all = (destination.activities || []).map((a) => a.name).filter(Boolean);
    const ordered = [...new Set([...activityHits, ...all])];
    const legKm = index === 0 ? 0 : distanceKm(pointOf(route[index - 1].destination), pointOf(destination));
    if (legKm) totalKm += legKm;
    if (legKm && legKm > LONG_TRANSFER_KM) {
      warnings.push(`The trip from ${route[index - 1].destination.name} to ${destination.name} is about ${legKm} km. Plan for a full travel day.`);
    }
    let note = "";
    if (month && entry.season === "good") note = `${monthName(month)} is a great time to visit.`;
    else if (month && entry.season === "off") {
      note = `${monthName(month)} is off-season here. Check the weather before you go.`;
      warnings.push(`${destination.name} is in its off-season in ${monthName(month)}.`);
    } else if (month && entry.season === "other") {
      const best = (destination.bestTimeToVisit?.months || []).join(", ");
      note = best ? `Best time to visit: ${best}.` : "";
    }
    const stop = {
      destination: {
        _id: destination._id,
        name: destination.name,
        address: destination.address || "",
        image: destination.images?.[0] || "",
        category: asList(destination.category),
      },
      startDay: cursor,
      days: dayCounts[index],
      activities: ordered.slice(0, Math.max(2, dayCounts[index] * 2)),
      matched: entry.matched,
      travelKm: legKm || 0,
      note,
    };
    cursor += dayCounts[index];
    return stop;
  });

  // one line per day
  const dayPlans = [];
  for (const stop of stops) {
    for (let i = 0; i < stop.days; i += 1) {
      const dayNumber = stop.startDay + i;
      const arriving = i === 0 && stop.travelKm > 0;
      const pick = stop.activities.length ? stop.activities.slice(i * 2, i * 2 + 2) : [];
      dayPlans.push({
        day: dayNumber,
        destination: stop.destination.name,
        destinationId: stop.destination._id,
        title: arriving ? `Travel to ${stop.destination.name}` : i === 0 ? `Arrive in ${stop.destination.name}` : `Explore ${stop.destination.name}`,
        activities: pick.length ? pick : [i === 0 ? "Settle in and explore on foot" : "Free day to explore"],
        travelKm: arriving ? stop.travelKm : 0,
      });
    }
  }

  const requested = interests.length;
  const covered = new Set(stops.flatMap((s) => s.matched));
  const missed = interests.filter((i) => !covered.has(i));
  if (requested && missed.length) warnings.push(`We could not find a match for: ${missed.join(", ")}.`);
  if (month && stops.every((s) => s.note === "" || !/great time/.test(s.note))) {
    warnings.push(`None of the stops is known as a best-season visit in ${monthName(month)}.`);
  }

  return {
    plan: {
      title: "",
      days,
      month,
      pace,
      interests,
      stops,
      dayPlans,
      summary: { stops: stops.length, days, totalKm, interestsCovered: [...covered] },
      warnings: [...new Set(warnings)],
    },
  };
}
