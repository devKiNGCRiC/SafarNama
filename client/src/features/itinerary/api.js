import { http } from "../../config/api";

const BASE = "/api/v1/itineraries";
const body = (r) => r.data;

// The planner: { days, month, interests, pace, region } -> { data: plan }. Nothing is saved.
export const generatePlan = (form) =>
  http
    .post(`${BASE}/generate`, {
      days: form.days,
      pace: form.pace,
      interests: form.interests,
      ...(form.month ? { month: Number(form.month) } : {}),
      ...(form.region?.trim() ? { region: form.region.trim() } : {}),
    })
    .then(body);
export const getPlannerOptions = () => http.get(`${BASE}/options`).then(body);

export const getMyItineraries = (userId) => http.get(`${BASE}/user/${userId}`).then(body);
export const saveItinerary = (payload) => http.post(BASE, payload).then(body);
export const updateItinerary = (id, payload) => http.put(`${BASE}/${id}`, payload).then(body);
export const deleteItinerary = (id) => http.delete(`${BASE}/${id}`).then(body);
export const getTemplates = () => http.get(BASE).then(body);

// admin: every itinerary (templates and private trips), and promoting/demoting a template
export const getAllItinerariesAdmin = () => http.get(`${BASE}/admin/all`).then(body);
export const setItineraryTemplate = (id, isTemplate) => updateItinerary(id, { isTemplate });
export const deleteItineraryAdmin = (id) => http.delete(`${BASE}/admin/${id}`).then(body);

// destinations to pick from when adding a stop by hand
export const getDestinations = () => http.get("/api/v1/destinations").then(body);
