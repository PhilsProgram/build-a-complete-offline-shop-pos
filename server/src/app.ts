import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRoutes } from "./routes/index.js";
import uploadRoutes from "./routes/uploadRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      hsts: false
    })
  );
  app.use(
    cors({
      origin: config.corsOrigin === "*" ? true : config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, mode: "offline-lan", database: "sqlite" });
  });

  app.use("/api", apiRoutes);

  app.use("/api/upload", uploadRoutes);
  app.use("/uploads", express.static(config.uploadsDir));

  if (fs.existsSync(config.frontendDist)) {
    app.use(express.static(config.frontendDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(config.frontendDist, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
