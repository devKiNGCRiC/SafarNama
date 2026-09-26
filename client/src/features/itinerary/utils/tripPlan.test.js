import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addActivity, buildDayList, daysText, itineraryToStops, moveStop, newStop, parseDays, planToStops,
  removeActivity, removeStop, setStopDays, suggestTitle, totalDays, tripError, tripToPayload,
} from "./tripPlan.js";

const place = (id, name) => ({ _id: id, name, address: `${name}, India`, images: [`https://cdn.test/${id}.jpg`] });
const trip = () => [
  { ...newStop(place("a", "Auli")), days: 2, activities: ["Skiing", "Ropeway", "Trek"] },
  { ...newStop(place("b", "Kedarnath")), days: 1 },
  { ...newStop(place("c", "Rishikesh")), days: 3, notes: "  Book rafting early " },
];

test("daysText and parseDays", () => {
  assert.equal(daysText(1), "1 day");
  assert.equal(daysText(3), "3 days");
  assert.equal(parseDays("2 days"), 2);
  assert.equal(parseDays("1 day"), 1);
  assert.equal(parseDays("3-4 days"), 3);
  assert.equal(parseDays(""), 1);
  assert.equal(parseDays(undefined), 1);
  assert.equal(parseDays("0 days"), 1);
  assert.equal(parseDays("400 days"), 30);
});

test("planToStops turns the planner's answer into editable stops with unique keys", () => {
  const plan = { stops: [
    { destination: { _id: "a", name: "Auli", address: "Chamoli", image: "i.jpg" }, days: 2, note: "Great in June", activities: ["Skiing"] },
    { destination: { _id: "a", name: "Auli", address: "Chamoli" }, days: 1, activities: [] },
  ] };
  const stops = planToStops(plan);
  assert.equal(stops.length, 2);
  assert.deepEqual([stops[0].days, stops[0].notes, stops[0].activities], [2, "Great in June", ["Skiing"]]);
  assert.notEqual(stops[0].key, stops[1].key);
  assert.equal(stops[1].destination.image, "");
  assert.deepEqual(planToStops(undefined), []);
});

test("itineraryToStops reads saved trips, prefers 'days', falls back to the duration text, drops deleted places", () => {
  const stops = itineraryToStops({ destinations: [
    { destination: { _id: "a", name: "Auli", images: ["x.jpg"] }, days: 4, duration: "1 day", notes: "n", activities: ["Ski"] },
    { destination: { _id: "b", name: "Kedarnath" }, duration: "2 days" },
    { destination: null, duration: "9 days" },
  ] });
  assert.deepEqual(stops.map((s) => [s.destination.name, s.days]), [["Auli", 4], ["Kedarnath", 2]]);
  assert.equal(stops[0].destination.image, "x.jpg");
  assert.deepEqual(stops[1].activities, []);
});

test("moveStop swaps neighbours and does nothing at the ends", () => {
  const stops = trip();
  assert.deepEqual(moveStop(stops, 1, -1).map((s) => s.destination.name), ["Kedarnath", "Auli", "Rishikesh"]);
  assert.deepEqual(moveStop(stops, 1, 1).map((s) => s.destination.name), ["Auli", "Rishikesh", "Kedarnath"]);
  assert.equal(moveStop(stops, 0, -1), stops);
  assert.equal(moveStop(stops, 2, 1), stops);
  assert.equal(moveStop(stops, 9, 1), stops);
  assert.deepEqual(stops.map((s) => s.destination.name), ["Auli", "Kedarnath", "Rishikesh"]); // input untouched
});

test("removeStop, setStopDays and totalDays", () => {
  const stops = trip();
  assert.deepEqual(removeStop(stops, 1).map((s) => s.destination.name), ["Auli", "Rishikesh"]);
  assert.equal(totalDays(stops), 6);
  assert.equal(setStopDays(stops, 1, 4)[1].days, 4);
  assert.equal(setStopDays(stops, 1, 0)[1].days, 1);
  assert.equal(setStopDays(stops, 1, 99)[1].days, 30);
  assert.equal(setStopDays(stops, 1, "abc")[1].days, 1);
  assert.equal(stops[1].days, 1); // not modified
});

test("activities: trimmed, no duplicates (any case), capped at 10, removable", () => {
  let stops = trip();
  stops = addActivity(stops, 1, "  Temple walk ");
  assert.deepEqual(stops[1].activities, ["Temple walk"]);
  assert.equal(addActivity(stops, 1, "temple WALK"), stops);
  assert.equal(addActivity(stops, 1, "   "), stops);
  assert.equal(addActivity(stops, 7, "Nothing"), stops);
  for (let i = 0; i < 12; i += 1) stops = addActivity(stops, 0, `Extra ${i}`);
  assert.equal(stops[0].activities.length, 10);
  assert.deepEqual(removeActivity(trip(), 0, "Ropeway")[0].activities, ["Skiing", "Trek"]);
});

test("buildDayList follows the stops: one line per day, arrival days first, activities two per day", () => {
  const list = buildDayList(trip());
  assert.equal(list.length, 6);
  assert.deepEqual(list.map((d) => d.day), [1, 2, 3, 4, 5, 6]);
  assert.equal(list[0].title, "Arrive in Auli");
  assert.equal(list[1].title, "Explore Auli");
  assert.equal(list[2].title, "Travel to Kedarnath");
  assert.deepEqual(list[0].activities, ["Skiing", "Ropeway"]);
  assert.deepEqual(list[1].activities, ["Trek"]);
  assert.deepEqual(list[2].activities, ["Settle in and explore on foot"]);
  assert.deepEqual(buildDayList([]), []);
});

test("tripToPayload numbers the days, trims text, and totals the trip", () => {
  const payload = tripToPayload({ title: "  Hills trip ", stops: trip(), generated: true });
  assert.equal(payload.title, "Hills trip");
  assert.equal(payload.tripDays, 6);
  assert.equal(payload.totalDuration, "6 days");
  assert.equal(payload.generated, true);
  assert.deepEqual(payload.destinations.map((d) => [d.destination, d.duration, d.days, d.startDay]), [["a", "2 days", 2, 1], ["b", "1 day", 1, 3], ["c", "3 days", 3, 4]]);
  assert.equal(payload.destinations[2].notes, "Book rafting early");
  assert.equal(tripToPayload({ title: "x", stops: [] }).generated, false);
});

test("tripError catches what the server would refuse", () => {
  const stops = trip();
  assert.equal(tripError({ title: "Hills trip", stops }), null);
  assert.match(tripError({ title: "ab", stops }), /name/i);
  assert.match(tripError({ title: "x".repeat(101), stops }), /100/);
  assert.match(tripError({ title: "Hills trip", stops: [] }), /at least one/i);
  assert.match(tripError({ title: "Hills trip", stops: Array.from({ length: 21 }, () => stops[0]) }), /at most 20/);
  assert.match(tripError({ title: "Hills trip", stops: [{ ...stops[0], notes: "x".repeat(501) }] }), /Notes/);
});

test("suggestTitle names the trip from its first stop and length", () => {
  assert.equal(suggestTitle([]), "");
  assert.equal(suggestTitle([{ ...newStop(place("a", "Auli")), days: 3 }]), "3 days in Auli");
  assert.equal(suggestTitle(trip()), "6 days: Auli and more");
});
