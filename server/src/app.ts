import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import adminRouter from "./modules/admin/admin.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import billingRouter from "./modules/billing/billing.routes.js";
import linksRouter from "./modules/links/links.routes.js";
import redirectRouter from "./modules/redirect/redirect.routes.js";
import statsRouter from "./modules/stats/stats.routes.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  // Needed for IP-keyed rate limits to see the real client behind a proxy.
  if (env.TRUST_PROXY > 0) app.set("trust proxy", env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/links", linksRouter);
  app.use("/api/stats", statsRouter);
  app.use("/", redirectRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}