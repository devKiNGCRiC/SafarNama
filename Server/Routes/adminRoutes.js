import express from "express";
import { makeAdminController } from "../Controllers/adminController.js";
import { verifyToken, isAdmin } from "../Middleware/authMiddleware.js";

// /api/v1/admin - everything here needs a logged-in admin. Admins sign in through the normal
// login (their account has the admin role); there is no separate admin login.
export function createAdminRouter() {
  const router = express.Router();
  const admin = makeAdminController();

  router.use(verifyToken, isAdmin);
  router.get("/overview", admin.overview);
  router.get("/users", admin.listUsers);
  router.patch("/users/:userId", admin.userAction);
  router.get("/reports", admin.listReports);
  router.patch("/reports/:reportId", admin.resolveReport);
  router.get("/messages", admin.listMessages);
  router.get("/audit", admin.listAudit);

  return router;
}

export default createAdminRouter();
