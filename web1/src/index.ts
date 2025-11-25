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
app.use("/static", express.static(path.join(__dirname, "..", "public")));

const SERVER_NAME = "Web Server 1";

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

app.get("/login", (_req, res) => {
  res.send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrar - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="card-frame">
    <div class="container">
      <div class="header">
        <span class="subtitle">Bem-vindo de volta</span>
        <h1>🔐 Acessar conta</h1>
        <span class="server-badge">${SERVER_NAME}</span>
      </div>
      <form id="login" class="card-form">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" placeholder="nome@exemplo.com" autocomplete="email" required>
        </div>
        <div class="form-group">
          <label for="password">Senha</label>
          <input type="password" id="password" name="password" placeholder="Digite sua senha" autocomplete="current-password" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Entrar</button>
          <button type="button" class="btn btn-outline" id="signup-btn">Criar nova conta</button>
        </div>
        <div id="msg" class="message" role="alert"></div>
      </form>
      <div class="link">
        Precisa de ajuda? <span class="muted">Contate o administrador.</span>
      </div>
    </div>
  </div>
<script>
const formElement = document.getElementById('login');
const msgEl = document.getElementById('msg');
const signupButton = document.getElementById('signup-btn');

if (signupButton) {
  signupButton.addEventListener('click', () => {
    window.location.href = '/signup';
  });
}

if (formElement instanceof HTMLFormElement && msgEl) {
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    msgEl.className = 'message';
    msgEl.innerText = '';

    const formData = new FormData(formElement);
    const data = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || '')
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Não foi possível entrar' }));
        msgEl.className = 'message error';
        msgEl.innerText = error.error || 'Não foi possível entrar';
        return;
      }

      window.location.href = '/home';
    } catch (_error) {
      msgEl.className = 'message error';
      msgEl.innerText = 'Erro ao se conectar ao servidor';
    }
  });
}
</script>
</body>
</html>`);
});

app.get("/signup", (_req, res) => {
  res.send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cadastrar - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="card-frame">
    <div class="container">
      <div class="header">
        <span class="subtitle">Crie sua conta gratuita</span>
        <h1>📝 Nova conta</h1>
        <span class="server-badge">${SERVER_NAME}</span>
      </div>
      <form id="signup" class="card-form">
        <div class="form-group">
          <label for="name">Nome completo</label>
          <input type="text" id="name" name="name" placeholder="Seu nome completo" autocomplete="name" required>
        </div>
        <div class="form-group">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" placeholder="nome@exemplo.com" autocomplete="email" required>
        </div>
        <div class="form-group">
          <label for="password">Senha</label>
          <input type="password" id="password" name="password" placeholder="Crie uma senha segura" autocomplete="new-password" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Cadastrar</button>
          <button type="button" class="btn btn-outline" id="back-to-login">Já tenho conta</button>
        </div>
        <div id="msg" class="message" role="alert"></div>
      </form>
      <div class="link">
        Ao prosseguir, você concorda com os termos de uso da plataforma.
      </div>
    </div>
  </div>
<script>
const formElement = document.getElementById('signup');
const msgEl = document.getElementById('msg');
const backToLogin = document.getElementById('back-to-login');

if (backToLogin) {
  backToLogin.addEventListener('click', () => {
    window.location.href = '/login';
  });
}

if (formElement instanceof HTMLFormElement && msgEl) {
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    msgEl.className = 'message';
    msgEl.innerText = '';

    const formData = new FormData(formElement);
    const data = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || '')
    };

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Não foi possível cadastrar' }));
        msgEl.className = 'message error';
        msgEl.innerText = error.error || 'Não foi possível cadastrar';
        return;
      }

      msgEl.className = 'message success';
      msgEl.innerText = 'Conta criada com sucesso! Redirecionando...';
      setTimeout(() => window.location.href = '/login', 1600);
    } catch (_error) {
      msgEl.className = 'message error';
      msgEl.innerText = 'Erro ao se conectar ao servidor';
    }
  });
}
</script>
</body>
</html>`);
});

app.get("/home", (req, res) => {
  const user = req.session && (req.session as any).user;
  if (!user) return res.redirect("/login");
  res.send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="card-frame">
    <div class="container">
      <div class="header">
        <span class="subtitle">Bem-vindo de volta</span>
        <h1>🏠 Página Inicial</h1>
        <span class="server-badge">${SERVER_NAME}</span>
      </div>
      <div class="home-content">
        <div class="welcome-message">
          <p>Olá, <strong>${user.name}</strong>!</p>
          <p class="muted">Você está conectado ao ${SERVER_NAME}</p>
        </div>
        <div class="home-actions">
          <a href="/profile" class="btn btn-primary">👤 Meu Perfil</a>
          <form id="logout" class="logout-form">
            <button type="submit" class="btn btn-outline">Sair da conta</button>
          </form>
        </div>
      </div>
    </div>
  </div>
<script>
const formElement = document.getElementById('logout');

if (formElement instanceof HTMLFormElement) {
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  });
}
</script>
</body>
</html>`);
});

app.get("/profile", (req, res) => {
  const user = req.session && (req.session as any).user;
  if (!user) return res.redirect("/login");
  res.send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perfil - ${SERVER_NAME}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div class="card-frame">
    <div class="container">
      <div class="header">
        <span class="subtitle">Detalhes da sua conta</span>
        <h1>👤 Meu perfil</h1>
        <span class="server-badge">${SERVER_NAME}</span>
      </div>
      <div class="profile-actions">
        <a href="/home" class="btn btn-outline">← Voltar para Home</a>
      </div>
      <div class="profile-info">
        <div class="info-row">
          <span class="info-label">Nome completo</span>
          <span class="info-value">${user.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail</span>
          <span class="info-value">${user.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Último acesso</span>
          <span class="info-value">${new Date(user.last_login).toLocaleString("pt-BR")}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Servidor</span>
          <span class="info-value">${SERVER_NAME}</span>
        </div>
      </div>
      <form id="logout" class="form-actions single">
        <button type="submit" class="btn btn-outline">Sair da conta</button>
      </form>
    </div>
  </div>
<script>
const formElement = document.getElementById('logout');

if (formElement instanceof HTMLFormElement) {
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  });
}
</script>
</body>
</html>`);
});

app.listen(3000, () => {
  console.log(`🔥 ${SERVER_NAME} rodando na porta 3000`);
});
