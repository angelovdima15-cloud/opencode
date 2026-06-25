import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = config.database.url.replace('sqlite:///', '');
    const resolvedPath = path.resolve(__dirname, '../../', dbPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS clubs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      slug            TEXT UNIQUE NOT NULL,
      address         TEXT NOT NULL,
      lat             REAL NOT NULL,
      lng             REAL NOT NULL,
      phone           TEXT,
      description     TEXT,
      schedule        TEXT DEFAULT '24/7',
      price_per_hour  INTEGER DEFAULT 0,
      total_pcs       INTEGER DEFAULT 0,
      senet_api_url   TEXT,
      senet_token     TEXT,
      senet_org_id    TEXT,
      has_senet       INTEGER DEFAULT 0,
      is_active       INTEGER DEFAULT 1,
      amenities       TEXT DEFAULT '[]',
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clubs_location ON clubs(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_clubs_active ON clubs(is_active);

    CREATE TABLE IF NOT EXISTS zones (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      price_per_hour  INTEGER,
      pcs_count       INTEGER DEFAULT 0,
      UNIQUE(club_id, name)
    );

    CREATE INDEX IF NOT EXISTS idx_zones_club ON zones(club_id);

    CREATE TABLE IF NOT EXISTS workstations (
      id              TEXT PRIMARY KEY,
      club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'unknown',
      zone_id         INTEGER REFERENCES zones(id),
      position_x      REAL,
      position_y      REAL,
      cpu             TEXT,
      gpu             TEXT,
      ram             TEXT,
      monitor         TEXT,
      last_synced     TEXT DEFAULT (datetime('now')),
      booked_until    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_workstations_club ON workstations(club_id);
    CREATE INDEX IF NOT EXISTS idx_workstations_status ON workstations(status);

    CREATE TABLE IF NOT EXISTS bookings (
      id              TEXT PRIMARY KEY,
      club_id         INTEGER NOT NULL REFERENCES clubs(id),
      workstation_id  TEXT NOT NULL REFERENCES workstations(id),
      user_id         INTEGER REFERENCES users(id),
      user_phone      TEXT NOT NULL,
      user_name       TEXT,
      start_time      TEXT NOT NULL,
      end_time        TEXT NOT NULL,
      duration_hours  REAL NOT NULL,
      total_price     INTEGER,
      status          TEXT NOT NULL DEFAULT 'confirmed',
      cancel_reason   TEXT,
      admin_note      TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_club ON bookings(club_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(user_phone);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);

    CREATE TABLE IF NOT EXISTS sync_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id         INTEGER NOT NULL REFERENCES clubs(id),
      status          TEXT NOT NULL,
      workstations_count INTEGER,
      error_message   TEXT,
      duration_ms     INTEGER,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sync_log_club ON sync_log(club_id);

    CREATE TABLE IF NOT EXISTS reviews (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      rating          INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      text            TEXT DEFAULT '',
      created_at      TEXT DEFAULT (datetime('now')),
      UNIQUE(club_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_club ON reviews(club_id);

    CREATE TABLE IF NOT EXISTS games (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL UNIQUE,
      icon            TEXT NOT NULL DEFAULT '🎮'
    );

    CREATE TABLE IF NOT EXISTS club_games (
      club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      PRIMARY KEY (club_id, game_id)
    );

    CREATE INDEX IF NOT EXISTS idx_club_games_club ON club_games(club_id);
    CREATE INDEX IF NOT EXISTS idx_club_games_game ON club_games(game_id);

    CREATE TABLE IF NOT EXISTS pc_specs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      zone_name       TEXT NOT NULL,
      cpu             TEXT,
      gpu             TEXT,
      ram             TEXT,
      monitor         TEXT,
      peripherals     TEXT,
      price_per_hour  INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_pc_specs_club ON pc_specs(club_id);

    CREATE TABLE IF NOT EXISTS club_promos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      description     TEXT,
      discount        INTEGER,
      expires_at      TEXT,
      is_active       INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_club_promos_club ON club_promos(club_id);
    CREATE INDEX IF NOT EXISTS idx_club_promos_active ON club_promos(is_active);

    CREATE TABLE IF NOT EXISTS club_notifications (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id         INTEGER NOT NULL REFERENCES clubs(id),
      channel         TEXT NOT NULL,
      recipient       TEXT NOT NULL,
      is_active       INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_club ON club_notifications(club_id);

    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT UNIQUE NOT NULL,
      phone           TEXT,
      name            TEXT NOT NULL,
      password_hash   TEXT NOT NULL,
      avatar_url      TEXT,
      balance         INTEGER NOT NULL DEFAULT 0,
      phone_verified  INTEGER DEFAULT 0,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

    CREATE TABLE IF NOT EXISTS verification_codes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      phone           TEXT NOT NULL,
      code            TEXT NOT NULL,
      expires_at      TEXT NOT NULL,
      used            INTEGER DEFAULT 0,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_verification_phone ON verification_codes(phone);

    CREATE TABLE IF NOT EXISTS transactions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      type            TEXT NOT NULL CHECK(type IN ('topup','payment','refund','withdraw')),
      amount          INTEGER NOT NULL,
      balance_before  INTEGER NOT NULL,
      balance_after   INTEGER NOT NULL,
      description     TEXT,
      booking_id      TEXT REFERENCES bookings(id),
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

    CREATE TABLE IF NOT EXISTS favorite_clubs (
      user_id         INTEGER NOT NULL REFERENCES users(id),
      club_id         INTEGER NOT NULL REFERENCES clubs(id),
      created_at      TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, club_id)
    );
  `);

  // Миграция: добавляем phone_verified, если колонка отсутствует (существующие БД)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0`);
  } catch {
    // колонка уже существует — игнорируем
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
