import { test } from "node:test";
import assert from "node:assert/strict";
import { INTEREST_NAMES, distanceKm, generateItinerary, monthName } from "../services/itineraryGenerator.js";
import { parseGenerateInput } from "../utils/itineraryInput.js";

// A small, made-up India: a Himalayan cluster, a Kerala/Goa coast, and Rajasthan far away.
const dest = (id, name, address, coords, extra = {}) => ({
  _id: id,
  name,
  address,
  images: [`https://cdn.test/${id}.jpg`],
  category: ["Nature"],
  rating: 4,
  featured: false,
  location: { type: "Point", coordinates: coords },
  activities: [],
  bestTimeToVisit: { months: [] },
  seasonality: { peakSeason: { months: [] }, offSeason: { months: [] } },
  ...extra,
});

const WORLD = [
  dest("d1", "Valley of Flowers", "Chamoli, Uttarakhand, India", [79.6, 30.4], {
    category: ["Mountain"], rating: 4.7,
    activities: [{ name: "Trekking" }, { name: "Photography" }],
    bestTimeToVisit: { months: ["June", "July", "August"] },
    seasonality: { peakSeason: { months: ["July", "August"] }, offSeason: { months: ["January", "February"] } },
  }),
  dest("d2", "Kedarnath", "Rudraprayag, Uttarakhand, India", [79.06, 30.73], {
    category: ["Mountain"], rating: 4.5,
    activities: [{ name: "High altitude trek" }, { name: "Temple visit" }],
    bestTimeToVisit: { months: ["May", "June", "September"] },
    seasonality: { offSeason: { months: ["December", "January"] } },
  }),
  dest("d3", "Rishikesh", "Rishikesh, Uttarakhand, India", [78.27, 30.09], {
    rating: 4.4, activities: [{ name: "River rafting" }, { name: "Yoga retreat" }],
    bestTimeToVisit: { months: ["September", "October", "March"] },
  }),
  dest("d4", "Palolem Beach", "Canacona, Goa, India", [74.02, 15.01], {
    category: ["Beach"], rating: 4.3, featured: true,
    activities: [{ name: "Kayaking" }, { name: "Snorkeling" }, { name: "Beach yoga" }],
    bestTimeToVisit: { months: ["November", "December", "January", "February"] },
    seasonality: { offSeason: { months: ["June", "July", "August"] } },
  }),
  dest("d5", "Alleppey Backwaters", "Alappuzha, Kerala, India", [76.33, 9.49], {
    rating: 4.6, activities: [{ name: "Houseboat cruise" }, { name: "Village food walk" }],
    bestTimeToVisit: { months: ["November", "December", "January", "February"] },
  }),
  dest("d6", "Jaisalmer", "Jaisalmer, Rajasthan, India", [70.91, 26.91], {
    category: ["Park"], rating: 4.2, activities: [{ name: "Camel safari" }, { name: "Desert camping" }],
    bestTimeToVisit: { months: ["October", "November", "February"] },
  }),
];

const ask = (over = {}) => generateItinerary(WORLD, { days: 6, month: null, interests: [], pace: "balanced", region: "", ...over });

test("distanceKm is roughly right, symmetric, and null when a place has no coordinates", () => {
  const km = distanceKm([79.6, 30.4], [79.06, 30.73]);
  assert.ok(km > 50 && km < 90, `Valley of Flowers to Kedarnath was ${km}`);
  assert.equal(distanceKm([79.6, 30.4], [79.06, 30.73]), distanceKm([79.06, 30.73], [79.6, 30.4]));
  assert.ok(distanceKm([79.6, 30.4], [76.33, 9.49]) > 2000);
  assert.equal(distanceKm(undefined, [1, 1]), null);
  assert.equal(distanceKm([1], [1, 1]), null);
  assert.equal(monthName(6), "June");
  assert.equal(monthName(13), "");
});

test("every day of the trip is planned exactly once, in order, and the stops add up", () => {
  for (const days of [1, 2, 3, 5, 6, 9, 14]) {
    for (const pace of ["relaxed", "balanced", "packed"]) {
      const { plan } = ask({ days, pace });
      assert.equal(plan.dayPlans.length, days, `${days} days, ${pace}`);
      assert.deepEqual(plan.dayPlans.map((d) => d.day), Array.from({ length: days }, (_, i) => i + 1));
      assert.equal(plan.stops.reduce((sum, s) => sum + s.days, 0), days);
      let expectedStart = 1;
      for (const stop of plan.stops) {
        assert.equal(stop.startDay, expectedStart);
        assert.ok(stop.days >= 1);
        expectedStart += stop.days;
      }
    }
  }
});

test("pace decides how many stops: packed has more stops than relaxed", () => {
  const stops = (pace) => ask({ days: 6, pace }).plan.stops.length;
  assert.equal(stops("relaxed"), 2);
  assert.equal(stops("balanced"), 3);
  assert.equal(stops("packed"), 6);
  assert.equal(ask({ days: 1 }).plan.stops.length, 1);
});

test("interests steer the choice: trekkers get the mountains, beach lovers the coast", () => {
  const names = (opts) => ask(opts).plan.stops.map((s) => s.destination.name);
  const trek = names({ days: 4, interests: ["Trekking"] });
  assert.ok(trek.includes("Valley of Flowers") && trek.includes("Kedarnath"), trek.join());
  const beach = names({ days: 4, interests: ["Beaches", "Water sports"] });
  assert.ok(beach.includes("Palolem Beach"), beach.join());
  assert.ok(!beach.includes("Kedarnath"));
  const first = ask({ days: 4, interests: ["Trekking"] }).plan.stops[0];
  assert.ok(first.matched.includes("Trekking"));
  assert.ok(first.activities[0].toLowerCase().includes("trek"), "matching activities come first");
});

test("the travel month matters: June goes to the hills, January to the coast, and off-season is avoided", () => {
  const june = ask({ days: 4, month: 6 }).plan.stops.map((s) => s.destination.name);
  assert.ok(june.includes("Valley of Flowers"));
  assert.ok(!june.includes("Palolem Beach"), "Goa beach is off-season in June");
  const jan = ask({ days: 4, month: 1 }).plan.stops.map((s) => s.destination.name);
  assert.ok(jan.includes("Palolem Beach") || jan.includes("Alleppey Backwaters"));
  assert.ok(!jan.includes("Valley of Flowers") && !jan.includes("Kedarnath"));
  const note = ask({ days: 4, month: 6 }).plan.stops.find((s) => s.destination.name === "Valley of Flowers").note;
  assert.match(note, /June is a great time/);
});

test("the route stays tight: with an Uttarakhand trip the stops are neighbours, not across the country", () => {
  const { plan } = ask({ days: 6, interests: ["Trekking"], month: 6 });
  assert.ok(plan.summary.totalKm < 400, `route was ${plan.summary.totalKm} km`);
  assert.equal(plan.stops[0].travelKm, 0);
  assert.ok(plan.stops.slice(1).every((s) => s.travelKm > 0));
  assert.equal(plan.summary.totalKm, plan.stops.reduce((sum, s) => sum + s.travelKm, 0));
});

test("a region filter narrows the plan, and an unknown region explains itself instead of failing", () => {
  const goa = ask({ days: 3, region: "goa" }).plan;
  assert.deepEqual(goa.stops.map((s) => s.destination.name), ["Palolem Beach"]);
  const nowhere = ask({ days: 3, region: "Atlantis" }).plan;
  assert.ok(nowhere.stops.length >= 1);
  assert.ok(nowhere.warnings.some((w) => w.includes("Atlantis")));
});

test("day lines are useful: arrival days say where you travel from, every day has something to do", () => {
  const { plan } = ask({ days: 6, interests: ["Trekking"] });
  assert.match(plan.dayPlans[0].title, /^Arrive in/);
  const arrivals = plan.dayPlans.filter((d) => d.travelKm > 0);
  assert.equal(arrivals.length, plan.stops.length - 1);
  assert.ok(arrivals.every((d) => d.title.startsWith("Travel to")));
  assert.ok(plan.dayPlans.every((d) => d.activities.length >= 1 && d.destinationId));
});

test("honest warnings: unmatched interests, thin data, long transfers", () => {
  const noWildlife = ask({ days: 3, interests: ["Wildlife"], region: "goa" }).plan;
  assert.ok(noWildlife.warnings.some((w) => /Wildlife/.test(w)));

  const two = generateItinerary(WORLD.slice(0, 2), { days: 9, month: null, interests: [], pace: "packed", region: "" }).plan;
  assert.equal(two.stops.length, 2);
  assert.ok(two.warnings.some((w) => /only have 2 destinations/.test(w)));

  const far = generateItinerary([WORLD[0], WORLD[4]], { days: 2, month: null, interests: [], pace: "packed", region: "" }).plan;
  assert.ok(far.warnings.some((w) => /km/.test(w) && /travel day/.test(w)));
});

test("it never crashes on thin or odd data, and returns an error only when there is nothing to plan with", () => {
  assert.match(generateItinerary([], { days: 3, interests: [], pace: "balanced", region: "" }).error, /no destinations/i);
  const bare = generateItinerary([{ _id: "x", name: "Mystery Place" }], { days: 3, month: 5, interests: ["Culture"], pace: "relaxed", region: "" });
  assert.equal(bare.plan.stops.length, 1);
  assert.equal(bare.plan.dayPlans.length, 3);
  assert.ok(bare.plan.dayPlans.every((d) => d.activities.length >= 1));
  const noName = generateItinerary([{ _id: "y" }, { _id: "z", name: "Real" }], { days: 2, interests: [], pace: "balanced", region: "" });
  assert.equal(noName.plan.stops[0].destination.name, "Real");
});

test("the same request always gives the same plan (and does not modify the input)", () => {
  const copy = JSON.stringify(WORLD);
  const a = ask({ days: 7, interests: ["Trekking", "Culture"], month: 6 });
  const b = ask({ days: 7, interests: ["Trekking", "Culture"], month: 6 });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(WORLD), copy);
});

test("parseGenerateInput accepts a good request and explains every bad one", () => {
  const ok = parseGenerateInput({ days: "5", month: "6", interests: ["Trekking", "Trekking", "Culture"], pace: "relaxed", region: "  Kerala " });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.data, { days: 5, month: 6, interests: ["Trekking", "Culture"], pace: "relaxed", region: "Kerala" });
  assert.deepEqual(parseGenerateInput({ days: 3 }).data, { days: 3, month: null, interests: [], pace: "balanced", region: "" });

  const bad = [
    [{}, /days/], [{ days: 0 }, /days/], [{ days: 15 }, /days/], [{ days: 2.5 }, /days/], [{ days: "abc" }, /days/],
    [{ days: 3, month: 13 }, /Month/], [{ days: 3, month: 0 }, /Month/],
    [{ days: 3, interests: "Trekking" }, /Interests/], [{ days: 3, interests: ["Skydiving"] }, /Unknown interest/],
    [{ days: 3, interests: [{ $ne: 1 }] }, /Unknown interest/],
    [{ days: 3, pace: "warp" }, /Pace/], [{ days: 3, region: "x".repeat(61) }, /Region/], [{ days: 3, region: { a: 1 } }, /Region/],
  ];
  for (const [body, message] of bad) assert.match(parseGenerateInput(body).errors[0] || "", message, JSON.stringify(body));
  assert.equal(INTEREST_NAMES.length, 8);
});
