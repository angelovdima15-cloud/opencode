// Создаёт backend/.env из .env.example при первом запуске, чтобы бета
// заводилась без ручной настройки.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '.env.example');
const dst = path.join(__dirname, '..', 'backend', '.env');

if (!fs.existsSync(dst)) {
  fs.copyFileSync(src, dst);
  console.log('[setup] backend/.env создан из .env.example');
} else {
  console.log('[setup] backend/.env уже существует — пропускаю');
}
