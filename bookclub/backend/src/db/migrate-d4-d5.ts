import { getDb, initDb } from './database';

/**
 * Миграция: добавляем таблицы pc_specs и club_promos,
 * а также сидируем данные для первых 2 клубов.
 */
export function migrateD4D5(): void {
  const db = getDb();

  // Проверяем, есть ли уже данные в pc_specs
  const pcCount = db.prepare('SELECT COUNT(*) as cnt FROM pc_specs').get() as { cnt: number };
  if (pcCount.cnt === 0) {
    console.log('[Migration] Добавляем pc_specs...');

    const insertPcSpec = db.prepare(`
      INSERT INTO pc_specs (club_id, zone_name, cpu, gpu, ram, monitor, peripherals, price_per_hour)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const pcSpecsData: Array<[number, string, string, string, string, string, string, number]> = [
      [1, 'Общий зал', 'Intel Core i7-13700', 'NVIDIA RTX 4070', '32GB DDR5', '27" 240Hz', 'Mouse Razer DeathAdder, Keyboard Razer BlackWidow', 500],
      [1, 'VIP', 'Intel Core i9-13900K', 'NVIDIA RTX 4080', '64GB DDR5', '32" 280Hz', 'Mouse Razer Viper V2 Pro, Keyboard Razer Huntsman V2', 800],
      [2, 'Общий зал', 'AMD Ryzen 7 7800X3D', 'NVIDIA RTX 4070 Ti', '32GB DDR5', '27" 240Hz', 'Mouse Logitech G Pro X, Keyboard Logitech G Pro', 600],
      [2, 'VIP', 'AMD Ryzen 9 7950X3D', 'NVIDIA RTX 4090', '64GB DDR5', '32" 280Hz', 'Mouse Razer DeathAdder V3 Pro, Keyboard Razer Huntsman V2 Analog', 1000],
    ];

    for (const spec of pcSpecsData) {
      insertPcSpec.run(...spec);
    }
    console.log(`[Migration] Добавлено ${pcSpecsData.length} записей pc_specs`);
  }

  const promoCount = db.prepare('SELECT COUNT(*) as cnt FROM club_promos').get() as { cnt: number };
  if (promoCount.cnt === 0) {
    console.log('[Migration] Добавляем club_promos...');

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
    console.log(`[Migration] Добавлено ${promosData.length} записей club_promos`);
  }
}

// Запуск при прямом вызове
if (require.main === module) {
  initDb();
  migrateD4D5();
  console.log('[Migration] Готово');
}
