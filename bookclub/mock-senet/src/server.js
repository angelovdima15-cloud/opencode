const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9000;

app.use(cors());
app.use(express.json());

// ── Data store ──────────────────────────────────────────
const CLUBS_DIR = path.join(__dirname, '..', 'data');

function loadClubData(clubId) {
  const filePath = path.join(CLUBS_DIR, `club-${clubId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveClubData(clubId, data) {
  const filePath = path.join(CLUBS_DIR, `club-${clubId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function randomStatus() {
  return Math.random() < 0.6 ? 'free' : 'busy';
}

// ── SENET API endpoints ────────────────────────────────

// GET /workstations/ — список ПК
// ?club_id=1 — только один клуб
// без club_id — все клубы
app.get('/workstations/', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  if (req.query.club_id) {
    const clubId = parseInt(req.query.club_id, 10);
    const data = loadClubData(clubId);
    if (!data) return res.status(404).json({ error: 'club_not_found' });
    return res.json({
      club: data.club,
      workstations: data.workstations,
      total: data.workstations.length,
      free: data.workstations.filter(w => w.status === 'free').length,
      generated_at: new Date().toISOString(),
    });
  }

  // Без club_id — возвращаем все клубы
  const allWorkstations = [];
  let allTotal = 0;
  let allFree = 0;
  const clubIds = [1, 2];

  for (const id of clubIds) {
    const data = loadClubData(id);
    if (data) {
      data.workstations.forEach(ws => {
        allWorkstations.push({ club_id: id, ...ws });
      });
      allTotal += data.workstations.length;
      allFree += data.workstations.filter(w => w.status === 'free').length;
    }
  }

  res.json({
    workstations: allWorkstations,
    total: allTotal,
    free: allFree,
    generated_at: new Date().toISOString(),
  });
});

// GET /workstations/:id — конкретный ПК
app.get('/workstations/:id', (req, res) => {
  const clubId = parseInt(req.query.club_id || '1', 10);
  const data = loadClubData(clubId);
  if (!data) return res.status(404).json({ error: 'club_not_found' });

  const ws = data.workstations.find(w => w.id === parseInt(req.params.id, 10));
  if (!ws) return res.status(404).json({ error: 'workstation_not_found' });

  res.json(ws);
});

// POST /workstations/login/ — начать сессию
app.post('/workstations/login/', (req, res) => {
  const { workstation_id, user_id } = req.body;
  const clubId = parseInt(req.query.club_id || '1', 10);
  const data = loadClubData(clubId);
  if (!data) return res.status(404).json({ error: 'club_not_found' });

  const ws = data.workstations.find(w => w.id === workstation_id);
  if (!ws) return res.status(404).json({ error: 'workstation_not_found' });
  if (ws.status === 'busy') return res.status(409).json({ error: 'already_busy' });

  ws.status = 'busy';
  ws.logged_in_user = user_id;
  ws.session_started_at = new Date().toISOString();
  saveClubData(clubId, data);

  res.json({ ok: true, workstation: ws });
});

// POST /workstations/logout/ — завершить сессию
app.post('/workstations/logout/', (req, res) => {
  const { workstation_id } = req.body;
  const clubId = parseInt(req.query.club_id || '1', 10);
  const data = loadClubData(clubId);
  if (!data) return res.status(404).json({ error: 'club_not_found' });

  const ws = data.workstations.find(w => w.id === workstation_id);
  if (!ws) return res.status(404).json({ error: 'workstation_not_found' });

  ws.status = 'free';
  ws.logged_in_user = null;
  ws.session_started_at = null;
  saveClubData(clubId, data);

  res.json({ ok: true, workstation: ws });
});

// POST /users/ — создать пользователя
app.post('/users/', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone_required' });

  const users = JSON.parse(fs.readFileSync(path.join(CLUBS_DIR, 'users.json'), 'utf-8'));
  const existing = users.find(u => u.phone === phone);
  if (existing) {
    return res.status(409).json({ error: 'user_exists', user: existing });
  }

  const newUser = {
    id: users.length + 1,
    name: name || 'Guest',
    phone,
    balance: 0,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  fs.writeFileSync(path.join(CLUBS_DIR, 'users.json'), JSON.stringify(users, null, 2));

  res.status(201).json(newUser);
});

// GET /users/ — список пользователей
app.get('/users/', (req, res) => {
  const users = JSON.parse(fs.readFileSync(path.join(CLUBS_DIR, 'users.json'), 'utf-8'));
  res.json(users);
});

// POST /users/refill/ — пополнить баланс
app.post('/users/refill/', (req, res) => {
  const { user_id, amount } = req.body;
  const users = JSON.parse(fs.readFileSync(path.join(CLUBS_DIR, 'users.json'), 'utf-8'));
  const user = users.find(u => u.id === user_id);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  user.balance += amount;
  fs.writeFileSync(path.join(CLUBS_DIR, 'users.json'), JSON.stringify(users, null, 2));

  res.json({ ok: true, balance: user.balance });
});

// ── Admin Panel ────────────────────────────────────────

app.get('/admin', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mock SENET Admin</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; }
        h1 { margin-bottom: 24px; }
        .club-selector { display: flex; gap: 8px; margin-bottom: 24px; }
        .club-btn { padding: 8px 16px; border: 1px solid #334155; border-radius: 8px; background: #1e293b; color: #f1f5f9; cursor: pointer; }
        .club-btn.active { background: #3b82f6; border-color: #3b82f6; }
        .zone { margin-bottom: 24px; }
        .zone-title { font-size: 14px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; }
        .ws-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .ws-card { padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; border: 2px solid transparent; min-width: 80px; text-align: center; transition: all 0.2s; }
        .ws-card.free { background: rgba(34,197,94,0.2); border-color: #22c55e; color: #22c55e; }
        .ws-card.busy { background: rgba(239,68,68,0.2); border-color: #ef4444; color: #ef4444; }
        .ws-card:hover { filter: brightness(1.2); }
        .ws-card .spec { font-size: 10px; color: #64748b; margin-top: 4px; }
        .status-bar { margin-top: 24px; padding: 12px; background: #1e293b; border-radius: 8px; font-size: 14px; }
        .status-bar .free-count { color: #22c55e; }
        .status-bar .busy-count { color: #ef4444; }
      </style>
    </head>
    <body>
      <h1>🎮 Mock SENET Admin</h1>
      <p style="margin-bottom:16px;color:#94a3b8;">Нажми на ПК, чтобы переключить статус (free ↔ busy)</p>
      <div id="app"></div>
      <script>
        let currentClub = 1;

        function loadClub(clubId) {
          currentClub = clubId;
          fetch('/api/club/' + clubId)
            .then(r => r.json())
            .then(data => render(data));
        }

        function toggleWs(wsId) {
          fetch('/api/toggle/' + currentClub + '/' + wsId, { method: 'POST' })
            .then(r => r.json())
            .then(data => render(data));
        }

        function toggleRandom(clubId) {
          fetch('/api/randomize/' + clubId, { method: 'POST' })
            .then(r => r.json())
            .then(data => render(data));
        }

        function render(data) {
          const zones = {};
          data.workstations.forEach(ws => {
            const zone = data.club.zones.find(z => z.id === ws.zone_id);
            const zoneName = zone ? zone.name : 'Unknown';
            if (!zones[zoneName]) zones[zoneName] = [];
            zones[zoneName].push(ws);
          });

          const total = data.workstations.length;
          const free = data.workstations.filter(w => w.status === 'free').length;
          const busy = total - free;

          let html = '<div class="club-selector">';
          for (let i = 1; i <= 2; i++) {
            html += '<button class="club-btn' + (i === currentClub ? ' active' : '') + '" onclick="loadClub(' + i + ')">Клуб ' + i + '</button>';
          }
          html += '<button class="club-btn" onclick="toggleRandom(' + currentClub + ')">🎲 Рандом</button>';
          html += '</div>';

          for (const [zoneName, wss] of Object.entries(zones)) {
            html += '<div class="zone"><div class="zone-title">' + zoneName + '</div><div class="ws-grid">';
            wss.forEach(ws => {
              html += '<div class="ws-card ' + ws.status + '" onclick="toggleWs(' + ws.id + ')">';
              html += '<div>' + ws.name + '</div>';
              html += '<div class="spec">' + (ws.gpu || '').slice(0, 15) + '</div>';
              html += '</div>';
            });
            html += '</div></div>';
          }

          html += '<div class="status-bar">🖥️ Всего: <strong>' + total + '</strong> · <span class="free-count">✓ Свободно: ' + free + '</span> · <span class="busy-count">✗ Занято: ' + busy + '</span></div>';

          document.getElementById('app').innerHTML = html;
        }

        loadClub(1);
      </script>
    </body>
    </html>
  `);
});

// ── Admin API ──────────────────────────────────────────

app.get('/api/club/:id', (req, res) => {
  const data = loadClubData(parseInt(req.params.id, 10));
  if (!data) return res.status(404).json({ error: 'not_found' });
  res.json(data);
});

app.post('/api/toggle/:clubId/:wsId', (req, res) => {
  const clubId = parseInt(req.params.clubId, 10);
  const wsId = parseInt(req.params.wsId, 10);
  const data = loadClubData(clubId);
  if (!data) return res.status(404).json({ error: 'not_found' });

  const ws = data.workstations.find(w => w.id === wsId);
  if (!ws) return res.status(404).json({ error: 'ws_not_found' });

  ws.status = ws.status === 'free' ? 'busy' : 'free';
  saveClubData(clubId, data);
  res.json(data);
});

app.post('/api/randomize/:clubId', (req, res) => {
  const clubId = parseInt(req.params.clubId, 10);
  const data = loadClubData(clubId);
  if (!data) return res.status(404).json({ error: 'not_found' });

  data.workstations.forEach(ws => {
    ws.status = Math.random() < 0.6 ? 'free' : 'busy';
  });
  saveClubData(clubId, data);
  res.json(data);
});

// ── Root ───────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.send(`
    <html><body style="font-family:system-ui;background:#0f172a;color:#f1f5f9;padding:40px;max-width:600px;margin:0 auto;">
      <h1>🎮 Mock SENET Server</h1>
      <p style="color:#94a3b8;">Для разработки и тестирования BookClub</p>
      <ul style="line-height:2;margin-top:24px;">
        <li><a href="/admin" style="color:#3b82f6;">/admin</a> — панель управления ПК</li>
        <li><a href="/workstations/?club_id=1" style="color:#3b82f6;">/workstations/?club_id=1</a> — API список ПК</li>
        <li><a href="/users/" style="color:#3b82f6;">/users/</a> — API список пользователей</li>
        <li><a href="/health" style="color:#3b82f6;">/health</a> — статус сервера</li>
      </ul>
      <p style="color:#64748b;margin-top:32px;">Доступные клубы: 1 (Good Game), 2 (Arena)</p>
    </body></html>
  `);
});

// ── Health ─────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    service: 'mock-senet',
    version: '0.1.0',
    clubs: [1, 2],
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Mock SENET] Running on http://localhost:${PORT}`);
  console.log(`[Mock SENET] Admin panel: http://localhost:${PORT}/admin`);
  console.log(`[Mock SENET] API: GET http://localhost:${PORT}/workstations/`);
});
