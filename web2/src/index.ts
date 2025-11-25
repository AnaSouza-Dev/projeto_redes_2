import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { sessionMiddleware, redisClient } from "./session";

const app = express();
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// identificação do servidor
const SERVER_NAME = "Web Server 2";

app.get("/", (req, res) => {
  const user = req.session && (req.session as any).user;
  if (user) return res.redirect('/home');
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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Login</h1>
      <span class="server-badge">${SERVER_NAME}</span>
    </div>
    <form id="login">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="seu@email.com" required>
      </div>
      <div class="form-group">
        <label for="password">Senha</label>
        <input type="password" id="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn">Entrar</button>
      <div id="msg" class="message"></div>
    </form>
    <div class="link">
      Não tem conta? <a href="/signup">Criar conta</a>
    </div>
  </div>
<script>
document.getElementById('login').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msgEl = document.getElementById('msg');
  msgEl.className = 'message';
  msgEl.innerText = '';
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
      const err = await res.json().catch(()=>({ error: 'Login falhou' }));
      msgEl.className = 'message error';
      msgEl.innerText = err.error || 'Login falhou';
      return;
    }
    window.location.href = '/home';
  } catch (err) {
    msgEl.className = 'message error';
    msgEl.innerText = 'Erro de conexão';
  }
});
</script>
</body>
</html>`);
});

app.get('/signup', (_req, res) => {
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cadastro - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Criar Conta</h1>
      <span class="server-badge">${SERVER_NAME}</span>
    </div>
    <form id="signup">
      <div class="form-group">
        <label for="name">Nome</label>
        <input type="text" id="name" name="name" placeholder="Seu nome completo" required>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="seu@email.com" required>
      </div>
      <div class="form-group">
        <label for="password">Senha</label>
        <input type="password" id="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn">Criar conta</button>
      <div id="msg" class="message"></div>
    </form>
    <div class="link">
      Já tem conta? <a href="/login">Fazer login</a>
    </div>
  </div>
<script>
document.getElementById('signup').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msgEl = document.getElementById('msg');
  msgEl.className = 'message';
  msgEl.innerText = '';
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
      const err = await res.json().catch(()=>({ error: 'Cadastro falhou' }));
      msgEl.className = 'message error';
      msgEl.innerText = err.error || 'Cadastro falhou';
      return;
    }
    msgEl.className = 'message success';
    msgEl.innerText = 'Conta criada! Redirecionando...';
    setTimeout(() => window.location.href = '/login', 1500);
  } catch (err) {
    msgEl.className = 'message error';
    msgEl.innerText = 'Erro de conexão';
  }
});
</script>
</body>
</html>`);
});

app.get('/home', (req, res) => {
  const user = req.session && (req.session as any).user;
  if (!user) return res.redirect('/login');
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Página Inicial</h1>
      <span class="server-badge">${SERVER_NAME}</span>
    </div>
    <div class="home-content">
      <div class="welcome-message">
        <p>Olá, <strong>${user.name}</strong>!</p>
        <p class="muted">Você está conectado ao ${SERVER_NAME}</p>
      </div>
      <div class="home-actions">
        <a href="/profile" class="btn">👤 Meu Perfil</a>
        <form id="logout" class="logout-form">
          <button type="submit" class="btn btn-secondary">Sair da conta</button>
        </form>
      </div>
    </div>
  </div>
<script>
document.getElementById('logout').addEventListener('submit', async (e)=>{
  e.preventDefault();
  await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login';
});
</script>
</body>
</html>`);
});

app.get('/profile', (req, res) => {
  const user = req.session && (req.session as any).user;
  if (!user) return res.redirect('/login');
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perfil - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👤 Meu Perfil</h1>
      <span class="server-badge">${SERVER_NAME}</span>
    </div>
    <div class="profile-actions">
      <a href="/home" class="btn">← Voltar para Home</a>
    </div>
    <div class="profile-info">
      <div class="info-row">
        <span class="info-label">Nome:</span>
        <span class="info-value">${user.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${user.email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Último login:</span>
        <span class="info-value">${new Date(user.last_login).toLocaleString('pt-BR')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Servidor:</span>
        <span class="info-value">${SERVER_NAME}</span>
      </div>
    </div>
    <form id="logout">
      <button class="btn btn-secondary">Sair</button>
    </form>
  </div>
<script>
document.getElementById('logout').addEventListener('submit', async (e)=>{
  e.preventDefault();
  await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login';
});
</script>
</body>
</html>`);
});

app.listen(3000, () => {
  console.log(`🔥 ${SERVER_NAME} rodando na porta 3000`);
});
