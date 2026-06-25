const Database = require('better-sqlite3');
const db = new Database('./bookclub.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if not exist (safe)
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    text TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(club_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '🎮'
  );
  CREATE TABLE IF NOT EXISTS club_games (
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    PRIMARY KEY (club_id, game_id)
  );
`);

// Seed games
const existingGames = db.prepare('SELECT COUNT(*) as cnt FROM games').get();
if (existingGames.cnt === 0) {
  const games = [
    { name: 'Dota 2', icon: '\uD83D\uDFE2' },
    { name: 'CS2', icon: '\uD83D\uDD2B' },
    { name: 'Valorant', icon: '\uD83D\uDD34' },
    { name: 'LoL', icon: '\uD83D\uDC9B' },
    { name: 'PUBG', icon: '\uD83E\uDE82' },
  ];
  const insert = db.prepare('INSERT INTO games (name, icon) VALUES (?, ?)');
  for (const g of games) insert.run(g.name, g.icon);
  console.log('Seeded 5 games');
} else {
  console.log('Games already exist:', existingGames.cnt);
}

// Seed club_games
const existingCG = db.prepare('SELECT COUNT(*) as cnt FROM club_games').get();
if (existingCG.cnt === 0) {
  const pairs = [
    [1, 1], [1, 2],
    [2, 2], [2, 3], [2, 4],
    [3, 1], [3, 5],
    [4, 3], [4, 4], [4, 5],
    [5, 1], [5, 2], [5, 3],
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO club_games (club_id, game_id) VALUES (?, ?)');
  for (const [cId, gId] of pairs) insert.run(cId, gId);
  console.log('Seeded club_games');
} else {
  console.log('Club_games already exist:', existingCG.cnt);
}

console.log('Games:', db.prepare('SELECT * FROM games').all());
console.log('Club_games:', db.prepare('SELECT * FROM club_games').all());
db.close();
