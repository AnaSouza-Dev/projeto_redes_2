import { Router } from "express";
import { pool } from "./db";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, created_at, last_login FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// create user with password (for testing/registration)
router.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "`name`, `email` and `password` are required" });
  }

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    const insertId = result.insertId;
    const [rows] = await pool.query("SELECT id, name, email, created_at, last_login FROM users WHERE id = ?", [insertId]);

    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// login: sets session
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  try {
    const [rows]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const now = new Date();
    await pool.query("UPDATE users SET last_login = ? WHERE id = ?", [now, user.id]);

    // store minimal info in session and ensure it's saved before responding
    (req as any).session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      last_login: now
    };

    (req as any).session.save((saveErr: any) => {
      if (saveErr) {
        console.error('Session save failed', saveErr);
        return res.status(500).json({ error: 'Login failed' });
      }
      res.json({ ok: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  (req as any).session.destroy((err: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ ok: true });
  });
});

router.get("/me", async (req, res) => {
  const s = (req as any).session;
  if (!s || !s.user) return res.status(401).json({ error: "Not authenticated" });
  res.json(s.user);
});

export default router;
