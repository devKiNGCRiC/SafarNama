import { http } from "../../config/api";

const BASE = "/api/v1/events";
const body = (r) => r.data;

// when: "upcoming" | "past" | "all"; type: FESTIVAL | ACTIVITY | WORKSHOP | CLEANUP | OTHER | "ALL"
export const getEvents = ({ when = "upcoming", type, search } = {}) =>
  http
    .get(BASE, {
      params: {
        when,
        ...(type && type !== "ALL" ? { type } : {}),
        ...(search ? { search } : {}),
      },
    })
    .then(body);
export const getEvent = (id) => http.get(`${BASE}/${id}`).then(body);
export const getMyEvents = () => http.get(`${BASE}/mine`).then(body);
export const registerForEvent = (id) => http.post(`${BASE}/register/${id}`).then(body);
export const cancelEventRegistration = (id) => http.delete(`${BASE}/register/${id}`).then(body);

// admin / organizer (multipart so a cover photo can travel with the fields)
export const createEvent = (formData) => http.post(BASE, formData).then(body);
export const updateEvent = (id, formData) => http.put(`${BASE}/${id}`, formData).then(body);
export const deleteEvent = (id) => http.delete(`${BASE}/${id}`).then(body);
export const getEventAttendees = (id) => http.get(`${BASE}/${id}/attendees`).then(body);
