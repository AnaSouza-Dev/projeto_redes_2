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

export const redisClient = createClient({
  socket: {
    host: "redis",
    port: 6379
  }
});

redisClient.connect().catch(console.error);

export const sessionMiddleware = session({
  store: new RedisStoreCtor({ client: redisClient as any }),
  secret: "segredo-super-importante",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 10
  }
});
