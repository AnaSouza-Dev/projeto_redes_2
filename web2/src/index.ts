import express from "express";
import cors from "cors";
import { sessionMiddleware } from "./session";

const app = express();
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);

// identificação do servidor
const SERVER_NAME = "Web Server 2";

app.get("/", (req, res) => {
  if (!req.session.views) req.session.views = 0;
  req.session.views++;

  res.json({
    server: SERVER_NAME,
    views: req.session.views,
    sessionId: req.sessionID
  });
});

app.listen(3000, () => {
  console.log(`🔥 ${SERVER_NAME} rodando na porta 3000`);
});
