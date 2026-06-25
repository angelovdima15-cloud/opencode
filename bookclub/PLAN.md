# BookClub — План полной реализации (D + E + F)

## Текущий стек
- Backend: Node.js/Express/TypeScript (порт 8000)
- Frontend: Vanilla JS + Vite (порт 5173)
- DB: SQLite (better-sqlite3)
- Интеграция: Mock SENET (порт 9000)

---

## ФАЗА D — Базовые фичи

### D1. Регистрация по телефону

**Суть:** заменить email-регистрацию на телефон + SMS-код (пока заглушка)

**БД:**
```sql
-- Новая таблица
CREATE TABLE verification_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER DEFAULT 0
);

-- В users — phone теперь обязателен, phone_verified INTEGER DEFAULT 0
```

**API:**
- `POST /auth/send-code` — { phone } → сохраняет код 1234 в БД, отправляет (заглушка)
- `POST /auth/verify-code` — { phone, code } → создаёт user если нет, возвращает JWT
- `POST /auth/login-phone` — { phone, code } → верифицирует код, логинит

**Фронт:**
- `PhoneInput.js` — выбор страны (+7/KZ), маска номера
- `CodeInput.js` — 6 полей для кода, автофокус
- `PhoneLoginPage.js` — объединяет PhoneInput → CodeInput → редирект
- `main.js` — новый роут /phone-login

**Файлы для изменения:**
- backend/src/db/database.ts — + verification_codes, phone_verified в users
- backend/src/services/auth.service.ts — + sendVerificationCode, verifyPhone
- backend/src/routes/auth.ts — + send-code, verify-code, login-phone
- frontend/src/api/client.js — + sendCode, verifyCode, loginByPhone
- frontend/src/pages/PhoneLoginPage.js — новый файл
- frontend/src/pages/LoginPage.js — добавить кнопку "Войти по телефону"
- frontend/src/main.js — + /phone-login роут

---

### D2. Отзывы на клубы

**БД:**
```sql
CREATE TABLE reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id    INTEGER NOT NULL REFERENCES clubs(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  rating     INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  text       TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_reviews_unique ON reviews(club_id, user_id);
```

**API:**
- `POST /api/v1/clubs/:id/review` — auth required, body: { rating, text }
- `GET /api/v1/clubs/:id/reviews` — список отзывов с user.name

**Фронт:**
- ClubPage — блок "Отзывы" под описанием
- Форма: 5 звёзд + textarea + кнопка "Оставить отзыв"
- Список: аватар, имя, ★★★★★, текст, дата

**Файлы:**
- backend/src/db/database.ts — + reviews table
- backend/src/routes/clubs.ts — + /:id/review, /:id/reviews
- frontend/src/pages/ClubPage.js — блок отзывов
- frontend/src/styles/main.css — .reviews, .review-card, .stars

---

### D3. Фильтр по играм

**БД:**
```sql
CREATE TABLE games (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT
);
CREATE TABLE club_games (
  club_id INTEGER NOT NULL REFERENCES clubs(id),
  game_id INTEGER NOT NULL REFERENCES games(id),
  PRIMARY KEY (club_id, game_id)
);
```

**API:**
- `GET /api/v1/games` — список всех игр
- `GET /api/v1/clubs?game_id=x` — фильтр по игре
- `POST /api/v1/clubs/:id/games` — auth (admin) — добавить игры клубу

**Фронт:**
- Главная: блок "Играешь в...?" с иконками Dota 2, CS2, Valorant, LoL, PUBG
- MapPage: фильтр по играм над списком клубов
- ClubPage: блок "Популярные игры" с иконками

**Файлы:**
- backend/src/db/database.ts — + games, club_games
- backend/src/routes/clubs.ts — + /:id/games
- backend/src/routes/games.ts — новый роут
- frontend/src/pages/HomePage.js — блок игр
- frontend/src/pages/MapPage.js — фильтр по играм
- frontend/src/pages/ClubPage.js — блок игр клуба

---

### D4. Подробная карточка клуба

**БД:**
```sql
-- Добавить поля в clubs
ALTER TABLE clubs ADD COLUMN description TEXT;
ALTER TABLE clubs ADD COLUMN amenities TEXT; -- JSON: wifi, ac, locker, food, own_device, streamer
ALTER TABLE clubs ADD COLUMN work_hours TEXT; -- "24/7" или "12:00-00:00"

-- Таблица характеристик ПК по зонам
CREATE TABLE pc_specs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id     INTEGER NOT NULL REFERENCES clubs(id),
  zone_name   TEXT NOT NULL, -- "Comfort", "VIP", "Bootcamp"
  cpu         TEXT,
  gpu         TEXT,
  ram         TEXT,
  monitor     TEXT,
  peripherals TEXT,
  price_per_hour REAL
);
```

**API:**
- `GET /api/v1/clubs/:id` — добавить description, amenities, work_hours, pc_specs
- `PUT /api/v1/clubs/:id` — auth (admin) — редактирование

**Фронт:**
- ClubPage: секция "Характеристики ПК" — таблица по зонам
- ClubPage: секция "Удобства" — иконки (WiFi, Кондиционер, Еда и т.д.)
- ClubPage: секция "Описание"
- ClubPage: режим работы

**Файлы:**
- backend/src/db/database.ts — + pc_specs, alter clubs
- backend/src/routes/clubs.ts — enrich GET
- frontend/src/pages/ClubPage.js — секции spec, amenities
- frontend/src/styles/main.css — .specs-table

---

### D5. Акции/промо

**БД:**
```sql
CREATE TABLE club_promos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id     INTEGER NOT NULL REFERENCES clubs(id),
  title       TEXT NOT NULL,
  description TEXT,
  discount    TEXT, -- "15%", "200₸/час"
  expires_at  TEXT,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT NOT NULL
);
```

**API:**
- `GET /api/v1/clubs?has_promo=true` — клубы с активными акциями
- `GET /api/v1/clubs/:id/promos` — акции клуба
- `POST /api/v1/clubs/:id/promos` — auth (admin) — создать

**Фронт:**
- Карточки клуба: бейдж "🔥 Акция"
- ClubPage: баннер/блок акций над ценами

**Файлы:**
- backend/src/db/database.ts — + club_promos
- backend/src/routes/clubs.ts — + promos
- frontend/src/pages/MapPage.js — бейдж на карточке
- frontend/src/pages/ClubPage.js — блок акций

---

## ФАЗА E — Монетизация

### E1. Пополнение Steam

**Суть:** пользователь указывает логин Steam, сумму, пополнение через баланс

**БД:**
```sql
CREATE TABLE steam_topups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  steam_login TEXT NOT NULL,
  amount      REAL NOT NULL,
  status      TEXT DEFAULT 'pending', -- pending, completed, failed
  created_at  TEXT NOT NULL
);
```

**API:**
- `POST /api/v1/steam/topup` — auth, body: { steam_login, amount } → списывает с баланса
- `GET /api/v1/steam/history` — история пополнений

**Фронт:**
- ProfilePage: вкладка "Пополнение Steam"
- Форма: логин Steam + сумма + кнопка
- Интеграция: редирект на Steam, пока заглушка

**Файлы:**
- backend/src/db/database.ts — + steam_topups
- backend/src/routes/steam.ts — новый роут
- frontend/src/api/client.js — + topupSteam, getSteamHistory
- frontend/src/pages/ProfilePage.js — вкладка Steam

---

### E2. Витрина (напитки/снеки)

**Суть:** статический каталог товаров, как /vitrina на langame.ru

**БД:**
```sql
CREATE TABLE products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  price_from  REAL,
  price_to    REAL,
  category    TEXT -- drinks, snacks
);
```

**API:**
- `GET /api/v1/products` — каталог
- `GET /api/v1/products/:id` — детально

**Фронт:**
- Новая страница /vitrina
- Сетка карточек: изображение, название, цена
- Фильтр по категории

**Файлы:**
- backend/src/db/database.ts — + products
- backend/src/routes/products.ts — новый роут
- frontend/src/pages/VitrinaPage.js — новый файл
- frontend/src/main.js — + /vitrina роут
- frontend/src/styles/main.css — .vitrina

---

### E3. Кэшбек / бонусы

**Суть:** при пополнении баланса начисляется 5% бонусами

**БД:**
```sql
-- В users добавить bonus_balance REAL DEFAULT 0
ALTER TABLE users ADD COLUMN bonus_balance REAL DEFAULT 0;
```

**API:**
- При пополнении — +5% от суммы в bonus_balance
- При брони — опция "Списать бонусы" (до 50% стоимости)
- `GET /api/v1/auth/me` — включает bonus_balance

**Фронт:**
- Popolnenie: "Вам начислено X бонусов (5%)"
- BookingForm: чекбокс "Списать бонусы"
- ProfilePage: отображение бонусов

**Файлы:**
- backend/src/services/auth.service.ts — начисление при topup
- backend/src/routes/auth.ts — списание при брони
- backend/src/routes/bookings.ts — учёт бонусов
- frontend/src/pages/ProfilePage.js — бонусы
- frontend/src/components/BookingForm.js — чекбокс бонусов

---

### E4. Чат с клубом

**Суть:** пользователь может написать администратору клуба

**API:** пока заглушка через Telegram (ссылку на Telegram клуба)
- `GET /api/v1/clubs/:id/contacts` — { telegram, phone }

**Фронт:**
- ClubPage: кнопка "Написать в Telegram" (ссылка)
- Если Telegram не указан — "Позвонить"

**Файлы:**
- backend/src/routes/clubs.ts — contacts
- frontend/src/pages/ClubPage.js — кнопка чата

---

## ФАЗА F — Вовлечение

### F1. QR-код для входа

**Суть:** при брони генерируется QR, на входе сканируют

**БД:**
```sql
-- В bookings добавить qr_code TEXT UNIQUE, checked_in_at TEXT
ALTER TABLE bookings ADD COLUMN qr_code TEXT;
ALTER TABLE bookings ADD COLUMN checked_in_at TEXT;
```

**API:**
- `GET /api/v1/bookings/:id/qr` — QR-код (base64 или url)
- `POST /api/v1/bookings/:id/checkin` — auth (admin) — сканирование

**Фронт:**
- Страница брони: показать QR-код
- Кнопка "Скачать QR"

**Файлы:**
- backend/src/routes/bookings.ts — QR generation
- backend/package.json — + qrcode npm
- frontend/src/pages/BookingConfirmPage.js — QR display

---

### F2. Уведомления (Telegram)

**Суть:** чат-бот для напоминаний

**API:**
- `POST /api/v1/telegram/link` — привязать Telegram ID к user
- `POST /api/v1/telegram/unlink` — отвязать
- Фоновый скрипт: каждую минуту проверять брони за 1 час → отправлять

**Фронт:**
- ProfilePage: кнопка "Привязать Telegram"
- Ссылка на бота

**Файлы:**
- backend/src/routes/telegram.ts — + link, unlink
- backend/src/services/notification.service.ts — новый
- backend/src/cron/reminder.ts — новый

---

### F3. Бронь нескольких мест

**Суть:** выбор 2+ ПК в одной брони

**API:**
- `POST /api/v1/bookings` — body: { workstation_ids: ["1a","1b"], ... }
- Создаётся одна бронь с multiple workstations

**Фронт:**
- SeatMap: чекбоксы (click toggle, выделено синим)
- BookingForm: отображает количество выбранных мест и общую цену

**Файлы:**
- backend/src/routes/bookings.ts — accept workstation_ids[]
- backend/src/db/database.ts — booking_workstations table
- frontend/src/components/SeatMap.js — checkbox mode
- frontend/src/components/BookingForm.js — multiple selection

---

## Порядок выполнения

```
Фаза D (сейчас):
  D1 → D2 → D3 → D4 → D5

Фаза E (после D):
  E3 (кэшбек, легко) → E2 (витрина) → E1 (Steam) → E4 (чат)

Фаза F (после E):
  F1 (QR) → F3 (несколько мест) → F2 (Telegram)
```
