import { http } from "../../config/api";

const BASE = "/api/v1/admin";
const body = (r) => r.data;

export const getOverview = () => http.get(`${BASE}/overview`).then(body);
export const getAudit = (limit = 15) => http.get(`${BASE}/audit`, { params: { limit } }).then(body);

// filters: search, status (active | suspended | deactivated), role (user | admin), cursor
export const getUsers = ({ search, status, role, cursor } = {}) =>
  http
    .get(`${BASE}/users`, {
      params: { ...(search ? { search } : {}), ...(status ? { status } : {}), ...(role ? { role } : {}), ...(cursor ? { cursor } : {}) },
    })
    .then(body);
// action: suspend | unsuspend | deactivate | reactivate | make-admin | remove-admin
export const userAction = (userId, action) => http.patch(`${BASE}/users/${userId}`, { action }).then(body);

export const getReports = ({ status = "open", cursor } = {}) =>
  http.get(`${BASE}/reports`, { params: { status, ...(cursor ? { cursor } : {}) } }).then(body);
export const resolveReport = (reportId, status) => http.patch(`${BASE}/reports/${reportId}`, { status }).then(body);

// type: contact | feedback
export const getMessages = ({ type = "contact", cursor } = {}) =>
  http.get(`${BASE}/messages`, { params: { type, ...(cursor ? { cursor } : {}) } }).then(body);
