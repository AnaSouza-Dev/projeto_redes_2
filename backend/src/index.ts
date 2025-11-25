import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import routes from "./routes";
import { sessionMiddleware, redisClient } from "./session";
import { pool } from "./db";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

const app = express();

// Allow credentials and reflect origin so frontend servers on different ports can send cookies
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(sessionMiddleware);

// If COOKIE_DOMAIN is configured, set the session cookie domain dynamically
// for requests coming from that domain. This ensures the `Set-Cookie` header
// includes the correct Domain when behind proxies or when testing with Host
// headers (useful for SSO across subdomains).
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
app.use((req, _res, next) => {
  try {
    if (COOKIE_DOMAIN && req.hostname) {
      const normalized = COOKIE_DOMAIN.startsWith(".") ? COOKIE_DOMAIN.slice(1) : COOKIE_DOMAIN;
      if (req.hostname === normalized || req.hostname.endsWith("." + normalized)) {
        if (req.session) {
          (req.session as any).cookie.domain = COOKIE_DOMAIN;
        }
      }
    }
  } catch (err) {
    console.error('Failed to set cookie domain middleware', err);
  }
  next();
});

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.get("/", (req, res) => {
  res.json({ backend: true, sessionId: req.sessionID });
});

app.use("/api", routes);

app.get("/healthz", async (_req, res) => {
  try {
    // check DB
    await pool.query("SELECT 1");
  } catch (err) {
    console.error("DB health check failed", err);
    return res.status(503).json({ status: "unhealthy", component: "db" });
  }

  try {
    // Redis PING
    const pong = await redisClient.ping();
    if (pong !== "PONG") throw new Error("bad ping");
  } catch (err) {
    console.error("Redis health check failed", err);
    return res.status(503).json({ status: "unhealthy", component: "redis" });
  }

  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`🔥 Backend rodando na porta ${PORT}`);
});
