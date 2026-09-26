import express from "express";

// GET /health - for the hosting platform's health check and uptime monitors.
// 200 when the database connection is up, 503 otherwise.
export function createHealthRouter({ isDbReady, startedAt = Date.now() }) {
  const router = express.Router();
  router.get("/", (req, res) => {
    const db = isDbReady();
    res.status(db ? 200 : 503).json({
      status: db ? "ok" : "degraded",
      db: db ? "up" : "down",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    });
  });
  return router;
}
