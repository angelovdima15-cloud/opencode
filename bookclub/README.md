# BookClub

Платформа для поиска и бронирования мест в компьютерных клубах Караганды.

## 🚀 Быстрый старт (бета — одна команда)

Нужен только **Node.js 20+**. Из папки `bookclub/`:

```bash
npm install      # поставит concurrently
npm run beta     # установит зависимости всех модулей, создаст .env и запустит всё
```

Затем открой **http://localhost:5173** — можно тестить все функции:
поиск клубов, карта, карта мест, бронирование, вход по телефону (код печатается
в консоли backend), баланс, отзывы, профиль.

> Поднимаются: mock-SENET `:9000`, API `:8000`, фронт `:5173`. База наполняется
> тестовыми данными автоматически (seed в dev-режиме).

### Альтернатива — Docker (одна команда)

```bash
docker compose up            # mock-senet + backend + frontend
docker compose --profile bot up   # + Telegram-бот (нужен токен в .env.example)
```

### Telegram-бот (опционально)

Боту нужен токен. Укажи `TELEGRAM_BOT_TOKEN` в `backend/.env`, затем:

```bash
cd telegram-bot && npm install && npm run dev
```

## Структура

```
bookclub/
├── backend/          # Express API (8000)
├── frontend/         # PWA (5173)
├── mock-senet/       # мок POS-системы SENET (9000)
├── telegram-bot/     # Telegram-бот (опционально)
├── scripts/          # ensure-env и пр.
├── package.json      # запуск всего: npm run beta
└── docker-compose.yml
```

## API

- `GET /api/v1/clubs` — список клубов
- `GET /api/v1/clubs/:id` — детали клуба
- `GET /api/v1/clubs/:id/workstations` — ПК со статусами
- `POST /api/v1/bookings` — создание брони
- `GET /api/v1/bookings/:id` — статус брони (требует авторизации)
- `POST /api/v1/bookings/:id/cancel` — отмена (требует авторизации)
- `POST /api/v1/auth/send-code` · `/auth/login-phone` — вход по телефону

## License

MIT
