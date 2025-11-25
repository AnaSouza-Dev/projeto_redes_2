import session from "express-session";
const ConnectRedis = require("connect-redis");
import { createClient } from "redis";

let RedisStoreCtor: any;
if (typeof ConnectRedis === "function") {
  try {
    const maybe = (ConnectRedis as any)(session);
    RedisStoreCtor = typeof maybe === "function" ? maybe : ConnectRedis;
  } catch {
    RedisStoreCtor = ConnectRedis;
  }
} else if (ConnectRedis && typeof ConnectRedis.default === "function") {
  try {
    const maybe = (ConnectRedis.default as any)(session);
    RedisStoreCtor = typeof maybe === "function" ? maybe : ConnectRedis.default;
  } catch {
    RedisStoreCtor = ConnectRedis.default;
  }
} else {
  RedisStoreCtor = ConnectRedis;
}

const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries: number) => Math.min(1000 * 2 ** retries, 30000)
  }
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis client connecting..."));
redisClient.on("ready", () => console.log("Redis client ready"));
redisClient.connect().catch((err) => console.error("Initial Redis connect failed (will retry):", err));

export const sessionMiddleware = session({
  store: new RedisStoreCtor({ client: redisClient as any }),
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 1000 * 60 * 60 * 24 // 24 horas para facilitar testes
  }
});
