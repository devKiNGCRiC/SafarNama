import Express from "express";
import { verifyToken, isSelfOrAdmin } from "../Middleware/authMiddleware.js";
import {
  deleteUser,
  getUser,
  updateUser,
} from "../Controllers/UserController.js";

const router = Express.Router();

// Following/unfollowing lives in /api/v1/profile (follow/:userId) - the User
// schema has no followers/following fields, so the old endpoints here could
// never work.
// (The admin user list, with paging and search, is /api/v1/admin/users.)
router.get("/:id", verifyToken, getUser);
router.put("/:id", verifyToken, isSelfOrAdmin("id"), updateUser);
router.delete("/:id", verifyToken, isSelfOrAdmin("id"), deleteUser);

export default router;
