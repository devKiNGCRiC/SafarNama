import { http } from "../../config/api";

// type: FORUM_THREAD | FORUM_REPLY | GALLERY_PHOTO | SAFARGRAM_POST; reason: see reportLabels.js
export const sendReport = ({ type, targetId, reason, details }) =>
  http.post("/api/v1/reports", { type, targetId, reason, details }).then((r) => r.data);
