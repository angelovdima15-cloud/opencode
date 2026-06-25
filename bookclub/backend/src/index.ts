import { config } from './config';
import { createApp } from './app';
import { initDb } from './db/database';
import { seed } from './db/seed';

function main() {
  // Инициализация БД
  console.log(`[${config.app.name}] Initializing database...`);
  initDb();

  // Загрузка тестовых данных
  if (config.app.env === 'development') {
    console.log(`[${config.app.name}] Seeding data...`);
    seed();
  }

  const app = createApp();

  app.listen(config.app.port, () => {
    console.log(`[${config.app.name}] Running on http://localhost:${config.app.port}`);
    console.log(`[${config.app.name}] Environment: ${config.app.env}`);
  });
}

main();
