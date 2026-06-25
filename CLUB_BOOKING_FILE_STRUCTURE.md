# Project File Structure v0.1

## Monorepo Layout

```
bookclub/
│
├── backend/                        # Python FastAPI (или Node.js)
│   ├── main.py                     # Entry point
│   ├── config.py                   # ENV vars, settings
│   ├── requirements.txt
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py               # Main router
│   │   ├── clubs.py                # GET /clubs, GET /clubs/:id
│   │   ├── workstations.py         # GET /clubs/:id/workstations
│   │   ├── bookings.py             # POST /bookings, GET /bookings/:id
│   │   └── telegram.py             # POST /telegram/webhook
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── senet_client.py         # SENET API client
│   │   ├── booking_service.py      # Booking logic
│   │   ├── notification_service.py # Telegram/email notifications
│   │   └── cache_service.py        # 30-second caching layer
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── club.py
│   │   ├── workstation.py
│   │   ├── booking.py
│   │   └── sync_log.py
│   │
│   ├── schemas/                    # Pydantic models
│   │   ├── __init__.py
│   │   ├── club.py
│   │   ├── workstation.py
│   │   └── booking.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py             # SQLAlchemy engine
│   │   ├── migrations/             # Alembic
│   │   └── seed.py                 # Dev seed data
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── helpers.py
│
├── telegram-bot/                   # Отдельный микросервис (Python)
│   ├── main.py
│   ├── config.py
│   ├── bot.py                      # Telegram bot handlers
│   ├── keyboards.py                # Inline keyboards
│   ├── messages.py                 # Message templates (RU)
│   └── api_client.py               # HTTP calls to backend
│
├── frontend/                       # PWA (React/Vite или Vanilla JS)
│   ├── index.html
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service Worker
│   │
│   ├── src/
│   │   ├── main.js
│   │   ├── api/
│   │   │   └── client.js           # Fetch wrapper
│   │   │
│   │   ├── pages/
│   │   │   ├── MapPage.js          # Карта с клубами
│   │   │   ├── ClubPage.js         # Схема зала + бронь
│   │   │   ├── BookingPage.js      # Подтверждение брони
│   │   │   └── NotFoundPage.js
│   │   │
│   │   ├── components/
│   │   │   ├── ClubMap.js          # Leaflet map with markers
│   │   │   ├── ClubCard.js         # Club preview card
│   │   │   ├── SeatMap.js          # SVG/Canvas seat grid
│   │   │   ├── Seat.js             # Individual PC seat
│   │   │   ├── BookingForm.js      # Time + phone form
│   │   │   ├── ZoneLegend.js       # Color legend
│   │   │   └── Header.js
│   │   │
│   │   ├── utils/
│   │   │   ├── map.js              # Leaflet helpers
│   │   │   ├── format.js           # Price/time formatters
│   │   │   └── geo.js              # Geolocation
│   │   │
│   │   └── styles/
│   │       ├── main.css
│   │       └── map.css
│   │
│   └── public/
│       ├── icons/
│       └── images/
│
├── docs/
│   ├── MVP_PLAN.md
│   ├── API_SPEC.md
│   ├── DB_SCHEMA.md
│   └── SRS.md                      # Software Requirements Spec
│
├── scripts/
│   ├── seed_clubs.py               # Generate test data
│   ├── sync_senet.py               # Manual SENET sync
│   └── test_bookings.py            # Integration test
│
├── .env.example
├── docker-compose.yml              # For local dev
├── Dockerfile
└── README.md
```

---

## Key Design Decisions

### 1. Backend: Python FastAPI vs Node.js Express

| | FastAPI | Express |
|---|---|---|
| Async | ✅ native | ✅ async/await |
| Auto-docs | ✅ Swagger | ❌ manual |
| Type safety | ✅ Pydantic | ❌ (TS helps) |
| SENET client | ✅ httpx | ✅ axios |
| Team skill | ? | ? |

**Recommendation:** FastAPI (Python) — если команда знает Python. Express (Node.js/TS) — если команда знает JS.

### 2. Frontend: Vanilla JS vs React

**Recommendation:** Vanilla JS + Leaflet + Vite. Для MVP React — избыточен. Если команда не знает React — Vanilla быстрее.

### 3. Telegram Bot: отдельный микросервис

Причина: Telegram Bot имеет собственный polling (webhook), свои rate limits, свою очередь сообщений. Если бот упадёт — API продолжает работать.

### 4. Кэширование

SENET API не рассчитан на частые запросы (30 сек между syncl). Решение:
- Backend кэширует `GET /workstations/` ответ на 30 секунд в памяти
- При форс-мажоре (SENET недоступен) отдаём последние кэшированные данные

### 5. PWA вместо Native App

Причина: $0 стоимость разработки, instant update, не требует App Store/Google Play. Для MVP — идеально.

---

## Environment Variables (.env)

```bash
# App
APP_NAME=BookClub
APP_ENV=development
APP_SECRET=change-me-in-production

# Database
DATABASE_URL=sqlite:///./bookclub.db  # or postgresql://...

# SENET (per-club, stored in DB, not in .env)
# Each club has its own senet_api_url and senet_token in clubs table

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_URL=https://api.bookclub.kz/v1/telegram/webhook

# Notifications (for club admins)
NOTIFICATION_CHANNEL=telegram  # telegram | email | sms

# Caching
CACHE_TTL_SECONDS=30
```

---

## Docker Compose (dev)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app
    depends_on:
      - db

  telegram-bot:
    build: ./telegram-bot
    env_file: .env
    depends_on:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bookclub
      POSTGRES_USER: bookclub
      POSTGRES_PASSWORD: bookclub_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
