import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { sessionMiddleware, redisClient } from "./session";

const app = express();
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);

const SERVER_NAME = "Web Server 1";

app.get("/", (req, res) => {
  const user = req.session && (req.session as any).user;
  if (user) return res.redirect('/profile');
  return res.redirect('/login');
});

app.get("/healthz", async (_req, res) => {
  try {
    const pong = await redisClient.ping();
    if (pong !== "PONG") throw new Error("bad ping");
    res.json({ status: "ok" });
  } catch (err) {
    console.error("healthz failed", err);
    res.status(503).json({ status: "unhealthy" });
  }
});

app.get('/login', (_req, res) => {
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Login</title></head><body>
<h1>Login - ${SERVER_NAME}</h1>
<form id="login">
  <label>Email: <input type="email" name="email" required></label><br>
  <label>Password: <input type="password" name="password" required></label><br>
  <button type="submit">Login</button>
</form>
<div id="msg"></div>
<script>
document.getElementById('login').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const data = { email: f.email.value, password: f.password.value };
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: 'Login failed' }));
      document.getElementById('msg').innerText = err.error || 'Login failed';
      return;
    }
    window.location.href = '/profile';
  } catch (err) {
    document.getElementById('msg').innerText = 'Network error';
  }
});
</script>
</body></html>`);
});

app.get('/signup', (_req, res) => {
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Signup</title></head><body>
<h1>Signup - ${SERVER_NAME}</h1>
<form id="signup">
  <label>Name: <input type="text" name="name" required></label><br>
  <label>Email: <input type="email" name="email" required></label><br>
  <label>Password: <input type="password" name="password" required></label><br>
  <button type="submit">Create account</button>
</form>
<div id="msg"></div>
<script>
document.getElementById('signup').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const data = { name: f.name.value, email: f.email.value, password: f.password.value };
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: 'Signup failed' }));
      document.getElementById('msg').innerText = err.error || 'Signup failed';
      return;
    }
    // Redirect to login so user can authenticate
    window.location.href = '/login';
  } catch (err) {
    document.getElementById('msg').innerText = 'Network error';
  }
});
</script>
</body></html>`);
});

app.get('/profile', (req, res) => {
  const user = req.session && (req.session as any).user;
  if (!user) return res.redirect('/login');
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Profile</title></head><body>
  <h1>Profile - ${SERVER_NAME}</h1>
  <p><strong>Name:</strong> ${user.name}</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <p><strong>Last login:</strong> ${new Date(user.last_login).toString()}</p>
  <p><strong>Server:</strong> ${SERVER_NAME}</p>
  <form id="logout"><button>Logout</button></form>
  <script>
  document.getElementById('logout').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  });
  </script>
</body></html>`);
});

app.listen(3000, () => {
  console.log(`🔥 ${SERVER_NAME} rodando na porta 3000`);
});
