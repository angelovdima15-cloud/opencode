# Database Schema v0.1

**Database:** SQLite (dev) / PostgreSQL (prod)
**ORM:** Prisma (Node.js) or SQLAlchemy (Python)

---

## 1. clubs

```sql
CREATE TABLE clubs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  address       TEXT NOT NULL,
  lat           REAL NOT NULL,
  lng           REAL NOT NULL,
  phone         TEXT,
  description   TEXT,
  schedule      TEXT DEFAULT '24/7',
  price_per_hour INTEGER DEFAULT 0,
  total_pcs     INTEGER DEFAULT 0,
  // SENET integration
  senet_api_url TEXT,
  senet_token   TEXT,
  senet_org_id  TEXT,
  // Metadata
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_clubs_location ON clubs(lat, lng);
CREATE INDEX idx_clubs_active ON clubs(is_active);
```

## 2. zones

```sql
CREATE TABLE zones (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id       INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  price_per_hour INTEGER,
  pcs_count     INTEGER DEFAULT 0,
  UNIQUE(club_id, name)
);

CREATE INDEX idx_zones_club ON zones(club_id);
```

## 3. workstations (кэш SENET)

```sql
CREATE TABLE workstations (
  id            TEXT PRIMARY KEY,  -- SENET workstation ID
  club_id       INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'unknown',  -- free | busy | offline | booked
  zone_id       INTEGER REFERENCES zones(id),
  position_x    REAL,
  position_y    REAL,
  // Specs (JSON)
  cpu           TEXT,
  gpu           TEXT,
  ram           TEXT,
  monitor       TEXT,
  // Sync
  last_synced   TEXT DEFAULT (datetime('now')),
  booked_until  TEXT
);

CREATE INDEX idx_workstations_club ON workstations(club_id);
CREATE INDEX idx_workstations_status ON workstations(status);
```

## 4. bookings

```sql
CREATE TABLE bookings (
  id              TEXT PRIMARY KEY,  -- bk_ + nanoid
  club_id         INTEGER NOT NULL REFERENCES clubs(id),
  workstation_id  TEXT NOT NULL REFERENCES workstations(id),
  user_phone      TEXT NOT NULL,
  user_name       TEXT,
  start_time      TEXT NOT NULL,
  end_time        TEXT NOT NULL,
  duration_hours  REAL NOT NULL,
  total_price     INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending',
  -- pending | confirmed | arrived | cancelled | completed | no_show
  cancel_reason   TEXT,
  admin_note      TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_bookings_club ON bookings(club_id);
CREATE INDEX idx_bookings_phone ON bookings(user_phone);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time ON bookings(start_time, end_time);
```

## 5. sync_log (для отладки SENET)

```sql
CREATE TABLE sync_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id       INTEGER NOT NULL REFERENCES clubs(id),
  status        TEXT NOT NULL,  -- success | error | timeout
  workstations_count INTEGER,
  error_message TEXT,
  duration_ms   INTEGER,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sync_log_club ON sync_log(club_id);
```

## 6. club_notifications (Telegram/email уведомления клубам)

```sql
CREATE TABLE club_notifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id       INTEGER NOT NULL REFERENCES clubs(id),
  channel       TEXT NOT NULL,  -- telegram | email | sms
  recipient     TEXT NOT NULL,  -- chat_id | email | phone
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifications_club ON club_notifications(club_id);
```

---

## Entity Relationship

```
clubs ──1:N──> zones
clubs ──1:N──> workstations
clubs ──1:N──> sync_log
clubs ──1:N──> club_notifications
clubs ──1:N──> bookings
zones ──1:N──> workstations
workstations ──1:N──> bookings
```

---

## Data Flow: Booking Lifecycle

```
pending ──> confirmed ──> arrived ──> completed
  │             │
  └──> cancelled    └──> no_show
```

1. **pending** — пользователь отправил запрос, ждём подтверждения клуба
2. **confirmed** — клуб подтвердил (через Telegram-уведомление)
3. **arrived** — пользователь пришёл, админ отметил
4. **completed** — сессия завершена
5. **cancelled** — отменено (клубом или пользователем)
6. **no_show** — пользователь не пришёл
