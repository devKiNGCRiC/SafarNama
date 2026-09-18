import express from "express";
import errorHandler from "../../Middleware/errorHandler.js";
import AppError from "../../utils/AppError.js";

export function buildApp(mountPath, router) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  app.all("*", (req, res, next) =>
    next(new AppError(`Can't find ${req.originalUrl}`, 404)),
  );
  app.use(errorHandler);
  return app;
}
