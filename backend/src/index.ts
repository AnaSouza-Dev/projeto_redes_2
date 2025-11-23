import express from "express";
import cors from "cors";
import routes from "./routes";
import { sessionMiddleware } from "./session";

const app = express();
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);

app.get("/", (req, res) => {
  res.json({ backend: true, sessionId: req.sessionID });
});

app.use("/api", routes);

app.listen(4000, () => {
  console.log("🔥 Backend rodando na porta 4000");
});
