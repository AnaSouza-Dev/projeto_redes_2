import { Router } from "express";
import { pool } from "./db";

const router = Router();

router.get("/users", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users");
  res.json(rows);
});

router.post("/users", async (req, res) => {
  const { name, email } = req.body;

  const [result]: any = await pool.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email]
  );

  const insertId = result.insertId;
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [insertId]);

  res.json(rows[0]);
});

export default router;
