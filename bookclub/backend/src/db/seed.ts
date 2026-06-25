import { getDb, initDb } from './database';
import fs from 'fs';
import path from 'path';

export function seed(): void {
  const db = getDb();

  // Проверяем, есть ли уже данные
  const count = db.prepare('SELECT COUNT(*) as cnt FROM clubs').get() as { cnt: number };
  if (count.cnt > 0) {
    console.log('[Seed] Данные уже есть, пропускаем');
    return;
  }

  const clubsPath = path.resolve(__dirname, '../../data/clubs.json');
  const clubs = JSON.parse(fs.readFileSync(clubsPath, 'utf-8'));

  const insertClub = db.prepare(`
    INSERT INTO clubs (id, name, slug, address, lat, lng, phone, description, schedule, price_per_hour, total_pcs, has_senet, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertZone = db.prepare(`
    INSERT INTO zones (club_id, name, price_per_hour, pcs_count)
    VALUES (?, ?, ?, ?)
  `);

  const insertWs = db.prepare(`
    INSERT INTO workstations (id, club_id, name, status, position_x, position_y, cpu, gpu, ram, monitor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const club of clubs) {
      const slug = club.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      insertClub.run(
        club.id, club.name, slug, club.address, club.lat, club.lng,
        club.phone, club.description, club.schedule, club.price_per_hour,
        club.total_pcs, club.has_senet ? 1 : 0, JSON.stringify(club.amenities || []),
      );

      // Зоны
      if (club.zones) {
        club.zones.forEach((zone: any, idx: number) => {
          insertZone.run(club.id, zone.name, zone.price_per_hour || club.price_per_hour, zone.pcs_count);
        });
      }
    }

    // Сидируем игры
    const gameNames = [
      { name: 'Dota 2', icon: '🟢' },
      { name: 'CS2', icon: '🔫' },
      { name: 'Valorant', icon: '🔴' },
      { name: 'LoL', icon: '💛' },
      { name: 'PUBG', icon: '🪂' },
    ];

    const insertGame = db.prepare('INSERT INTO games (name, icon) VALUES (?, ?)');
    for (const g of gameNames) {
      insertGame.run(g.name, g.icon);
    }

    // Привязываем первые клубы к 2-3 играм
    const clubGamePairs = [
      [1, 1], [1, 2],
      [2, 2], [2, 3], [2, 4],
      [3, 1], [3, 5],
      [4, 3], [4, 4], [4, 5],
      [5, 1], [5, 2], [5, 3],
    ];
    const insertClubGame = db.prepare('INSERT OR IGNORE INTO club_games (club_id, game_id) VALUES (?, ?)');
    for (const [cId, gId] of clubGamePairs) {
      insertClubGame.run(cId, gId);
    }

    // ===== D4: Характеристики ПК (pc_specs) для первых 2 клубов =====
    const insertPcSpec = db.prepare(`
      INSERT INTO pc_specs (club_id, zone_name, cpu, gpu, ram, monitor, peripherals, price_per_hour)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const pcSpecsData: Array<[number, string, string, string, string, string, string, number]> = [
      // Good Game — Общий зал
      [1, 'Общий зал', 'Intel Core i7-13700', 'NVIDIA RTX 4070', '32GB DDR5', '27" 240Hz', 'Mouse Razer DeathAdder, Keyboard Razer BlackWidow', 500],
      // Good Game — VIP
      [1, 'VIP', 'Intel Core i9-13900K', 'NVIDIA RTX 4080', '64GB DDR5', '32" 280Hz', 'Mouse Razer Viper V2 Pro, Keyboard Razer Huntsman V2', 800],
      // Arena — Общий зал
      [2, 'Общий зал', 'AMD Ryzen 7 7800X3D', 'NVIDIA RTX 4070 Ti', '32GB DDR5', '27" 240Hz', 'Mouse Logitech G Pro X, Keyboard Logitech G Pro', 600],
      // Arena — VIP
      [2, 'VIP', 'AMD Ryzen 9 7950X3D', 'NVIDIA RTX 4090', '64GB DDR5', '32" 280Hz', 'Mouse Razer DeathAdder V3 Pro, Keyboard Razer Huntsman V2 Analog', 1000],
    ];

    for (const spec of pcSpecsData) {
      insertPcSpec.run(...spec);
    }

    // ===== D5: Акции/промо для первых 2 клубов =====
    const insertPromo = db.prepare(`
      INSERT INTO club_promos (club_id, title, description, discount, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const promosData: Array<[number, string, string, number, string, number]> = [
      [1, 'Новичкам скидка 20%', 'При первом посещении — скидка 20% на все зоны', 20, '2026-08-01 23:59:59', 1],
      [1, 'Happy Hour каждую пятницу', 'С 18:00 до 21:00 — час игры всего за 300₸', 40, '2026-07-31 23:59:59', 1],
      [2, 'Скидка на VIP-зону', 'VIP-зона всего за 700₸/час вместо 1000₸', 30, '2026-07-30 23:59:59', 1],
    ];

    for (const promo of promosData) {
      insertPromo.run(...promo);
    }

    // Сидируем workstations для всех клубов
    const mockDir = path.resolve(__dirname, '../../../mock-senet/data');

    // Сначала загружаем из mock SENET (клубы 1-2)
    if (fs.existsSync(mockDir)) {
      for (let i = 1; i <= 2; i++) {
        const clubFile = path.join(mockDir, `club-${i}.json`);
        if (fs.existsSync(clubFile)) {
          const data = JSON.parse(fs.readFileSync(clubFile, 'utf-8'));
          for (const ws of data.workstations || []) {
            const wsId = `senet_${i}_${ws.id}`;
            insertWs.run(
              wsId, i, ws.name, ws.status, ws.x, ws.y,
              ws.cpu, ws.gpu, ws.ram, ws.monitor,
            );
          }
        }
      }
    }

    // Для клубов без SENET (3-6) — создаём ПК в БД из зон
    const clubsWithoutSenet = clubs.filter((c: any) => !c.has_senet);
    for (const club of clubsWithoutSenet) {
      if (!club.zones) continue;
      let wsCounter = 1;
      for (const zone of club.zones) {
        for (let p = 0; p < (zone.pcs_count || 10); p++) {
          const wsId = `ws_${club.id}_${wsCounter}`;
          const posX = 30 + Math.random() * 340;
          const posY = 30 + Math.random() * 240;
          insertWs.run(
            wsId, club.id, `ПК-${wsCounter}`, 'free',
            Math.round(posX), Math.round(posY),
            'Intel Core i5-12400', 'NVIDIA RTX 3060', '16GB DDR4', '24" 144Hz',
          );
          wsCounter++;
        }
      }
    }

    // D4: Добавляем pc_specs для клубов 3-6
    const clubZonesSpecs: Array<[number, string, string, string, string, string, string, number]> = [
      [3, 'Общий зал', 'AMD Ryzen 5 5600X', 'NVIDIA RTX 3060 Ti', '16GB DDR4', '24" 144Hz', 'Mouse Logitech G203, Keyboard Logitech G413', 550],
      [3, 'VIP', 'AMD Ryzen 7 5800X3D', 'NVIDIA RTX 4070', '32GB DDR5', '27" 165Hz', 'Mouse Logitech G Pro, Keyboard Logitech G Pro X', 900],
      [4, 'Общий зал', 'Intel Core i5-11400F', 'NVIDIA GTX 1660 Super', '16GB DDR4', '24" 144Hz', 'Mouse A4Tech, Keyboard A4Tech', 450],
      [5, 'Общий зал', 'Intel Core i5-12400F', 'NVIDIA RTX 3060', '16GB DDR4', '24" 165Hz', 'Mouse Logitech G403, Keyboard Logitech G213', 500],
      [6, 'Общий зал', 'Intel Core i3-10100F', 'NVIDIA GTX 1650', '8GB DDR4', '22" 75Hz', 'Mouse A4Tech, Keyboard A4Tech', 400],
    ];
    for (const spec of clubZonesSpecs) {
      insertPcSpec.run(...spec);
    }
  });

  transaction();
  console.log(`[Seed] Загружено ${clubs.length} клубов`);
}

// Запуск при прямом вызове
if (require.main === module) {
  initDb();
  seed();
  console.log('[Seed] Готово');
}
