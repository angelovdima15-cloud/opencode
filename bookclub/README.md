# BookClub

Платформа для поиска и бронирования мест в компьютерных клубах Караганды.

## Быстрый старт

```bash
# Backend
cd backend
npm install
npm run dev

# Telegram Bot (второй терминал)
cd telegram-bot
npm install
npm run dev

# Frontend (третий терминал)
cd frontend
npm install
npm run dev
```

## Структура

```
bookclub/
├── backend/          # Express API (8000)
├── telegram-bot/     # Telegram Bot
├── frontend/         # PWA (5173)
├── docs/             # Документация
└── docker-compose.yml
```

## API

- `GET /api/v1/clubs` — список клубов
- `GET /api/v1/clubs/:id` — детали клуба
- `GET /api/v1/clubs/:id/workstations` — ПК со статусами
- `POST /api/v1/bookings` — создание брони
- `GET /api/v1/bookings/:id` — статус брони
- `POST /api/v1/bookings/:id/cancel` — отмена

## License

MIT
