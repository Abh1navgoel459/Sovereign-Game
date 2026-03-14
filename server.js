require('dotenv').config();
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;
const gameUrl = process.env.GAME_URL || 'http://localhost:3001';

app.use(express.json());

app.get('/play', async (_req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1400);

  try {
    const health = await fetch(`${gameUrl.replace(/\/$/, '')}/api/game/metrics`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (health.ok) {
      return res.redirect(gameUrl);
    }
  } catch (error) {
    clearTimeout(timeout);
  }

  return res.status(503).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sovereign | Launching</title>
    <style>
      :root { --bg:#0a0f14; --card:#101b26; --text:#e8f0f7; --muted:#98adbf; --accent:#f4b942; --accent2:#39c0b7; }
      body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: radial-gradient(circle at 10% -20%, #203448 0%, transparent 35%), var(--bg); color:var(--text); min-height:100vh; display:grid; place-items:center; }
      .card { width:min(700px, 92vw); background:linear-gradient(145deg, rgba(16,27,38,.9), rgba(10,15,20,.95)); border:1px solid rgba(255,255,255,.15); border-radius:16px; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,.35); }
      h1 { margin:0; font-size:clamp(1.4rem, 3vw, 2rem); }
      p { margin:.7rem 0 0; color:var(--muted); }
      .row { display:flex; gap:.7rem; flex-wrap:wrap; margin-top:1rem; }
      a, button { appearance:none; border:1px solid transparent; border-radius:10px; padding:.65rem .9rem; font-weight:700; text-decoration:none; cursor:pointer; }
      .primary { background:linear-gradient(120deg, var(--accent), #ffd878); color:#1f1a10; }
      .secondary { background:transparent; border-color:rgba(255,255,255,.25); color:var(--text); }
      .hint { margin-top:.8rem; font-size:.9rem; color:var(--muted); }
      code { color:var(--accent2); }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Sovereign Game Server Is Warming Up</h1>
      <p>The landing site is live, but the game endpoint is currently unreachable.</p>
      <div class="row">
        <button class="primary" onclick="window.location.reload()">Retry Launch</button>
        <a class="secondary" href="/">Back To Landing</a>
      </div>
      <p class="hint">Expected game URL: <code>${gameUrl}</code></p>
      <p class="hint">Tip: run <code>npm run start:all</code> to start landing + game together.</p>
    </main>
  </body>
</html>`);
});

app.use(express.static(path.join(__dirname)));

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS must be set.');
  }

  return nodemailer.createTransport({
    host,
    port: smtpPort,
    secure,
    auth: { user, pass }
  });
}

app.post('/api/alpha-signup', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'abhinavgoel459@gmail.com',
      to: email,
      subject: 'Sovereign Alpha Signup Confirmation',
      text: 'Thank you for your interest! We will get back to you shortly!'
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('alpha-signup error:', error);
    return res.status(500).json({ error: 'Unable to send confirmation email.' });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Sovereign site running at http://localhost:${port}`);
});
