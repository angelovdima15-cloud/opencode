# API Specification v0.1

## Base URL
`https://api.bookclub.kz/v1` (dev: `http://localhost:8000/api/v1`)

---

## 1. Клубы

### GET /clubs
Список клубов с количеством свободных ПК.

**Query Parameters:**
| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `lat` | float | нет | Широта пользователя |
| `lng` | float | нет | Долгота пользователя |
| `radius` | int | нет | Радиус поиска в км (default: 5) |

**Response 200:**
```json
{
  "clubs": [
    {
      "id": 1,
      "name": "Good Game",
      "address": "ул. Камали Дюсембекова, 83/2",
      "lat": 49.801,
      "lng": 73.086,
      "phone": "+77053132344",
      "total_pcs": 40,
      "free_pcs": 12,
      "price_per_hour": 500,
      "zones": ["Общий зал", "VIP"],
      "updated_at": "2026-06-24T14:30:00Z"
    },
    {
      "id": 2,
      "name": "Arena",
      "address": "пр. Нурсултан Назарбаев, 33/2",
      "lat": 49.812,
      "lng": 73.098,
      "phone": "+77011223344",
      "total_pcs": 30,
      "free_pcs": 5,
      "price_per_hour": 600,
      "zones": ["Общий зал"],
      "updated_at": "2026-06-24T14:29:00Z"
    }
  ]
}
```

### GET /clubs/:id
Детальная информация о клубе.

**Response 200:**
```json
{
  "id": 1,
  "name": "Good Game",
  "address": "ул. Камали Дюсембекова, 83/2",
  "lat": 49.801,
  "lng": 73.086,
  "phone": "+77053132344",
  "description": "Круглосуточный компьютерный клуб",
  "schedule": "24/7",
  "total_pcs": 40,
  "free_pcs": 12,
  "price_per_hour": 500,
  "zones": [
    {
      "name": "Общий зал",
      "pcs_count": 30,
      "free_pcs": 10
    },
    {
      "name": "VIP",
      "pcs_count": 10,
      "free_pcs": 2,
      "price_per_hour": 800
    }
  ],
  "amenities": ["Кондиционер", "Санузел", "Бар"],
  "workstations_updated_at": "2026-06-24T14:30:00Z"
}
```

---

## 2. Рабочие станции (ПК)

### GET /clubs/:id/workstations
Список всех ПК клуба со статусами в реальном времени.

**Response 200:**
```json
{
  "club_id": 1,
  "workstations": [
    {
      "id": "senet_101",
      "name": "ПК-01",
      "status": "free",
      "zone": "Общий зал",
      "specs": {
        "cpu": "Intel Core i3-10100",
        "gpu": "NVIDIA GeForce 1070Ti",
        "ram": "16 GB DDR4",
        "monitor": "24\" 144Гц"
      },
      "position": { "x": 10, "y": 20 }
    },
    {
      "id": "senet_102",
      "name": "ПК-02",
      "status": "busy",
      "zone": "Общий зал",
      "specs": {
        "cpu": "Intel Core i3-10100",
        "gpu": "NVIDIA GeForce 1070Ti",
        "ram": "16 GB DDR4",
        "monitor": "24\" 144Гц"
      },
      "position": { "x": 30, "y": 20 },
      "booked_until": "2026-06-24T16:00:00Z"
    }
  ]
}
```

**Statuses:** `free` | `busy` | `offline` | `booked`

---

## 3. Бронирование

### POST /bookings
Создать бронь.

**Request Body:**
```json
{
  "club_id": 1,
  "workstation_id": "senet_101",
  "user_phone": "+77001234567",
  "user_name": "Азамат",
  "duration_hours": 2,
  "start_time": "2026-06-24T18:00:00Z"
}
```

**Response 201:**
```json
{
  "booking_id": "bk_abc123",
  "status": "pending",
  "club_id": 1,
  "workstation_name": "ПК-01",
  "start_time": "2026-06-24T18:00:00Z",
  "end_time": "2026-06-24T20:00:00Z",
  "total_price": 1000,
  "created_at": "2026-06-24T14:35:00Z"
}
```

**Statuses:** `pending` | `confirmed` | `cancelled` | `completed`

### GET /bookings/:id
Проверить статус брони.

**Response 200:**
```json
{
  "booking_id": "bk_abc123",
  "status": "confirmed",
  "club_id": 1,
  "club_name": "Good Game",
  "club_phone": "+77053132344",
  "workstation_name": "ПК-01",
  "start_time": "2026-06-24T18:00:00Z",
  "end_time": "2026-06-24T20:00:00Z",
  "total_price": 1000
}
```

### POST /bookings/:id/cancel
Отменить бронь.

**Response 200:**
```json
{
  "booking_id": "bk_abc123",
  "status": "cancelled"
}
```

---

## 4. Уведомления клубам (Webhook)

### POST /webhooks/club/:id/booking
SENET API callback (когда статус ПК меняется).

**Request Body:**
```json
{
  "workstation_id": "senet_101",
  "old_status": "busy",
  "new_status": "free",
  "timestamp": "2026-06-24T14:32:00Z"
}
```

---

## 5. SENET Proxy (внутренний)

### GET /proxy/:club_id/workstations
Прокси-запрос к SENET API клуба с кэшированием.

**Cache policy:** 30 секунд (status), 1 час (specs)

**Error handling:**
```json
{
  "error": "senet_unreachable",
  "message": "Не удалось получить данные от клуба. Попробуйте позже.",
  "cached_data_available": true,
  "cached_at": "2026-06-24T14:28:00Z"
}
```

---

## 6. Telegram Bot Webhook

### POST /telegram/webhook
Обработка сообщений от Telegram Bot.

**Update types handled:**
| Команда | Действие |
|---|---|
| `/start` | Приветствие, запрос геолокации |
| `/clubs` | Список клубов рядом |
| `/club_N` | Детали клуба N |
| `/book_N_H_PHONE` | Бронь ПК N на H часов, тел. PHONE |
| `/status_ID` | Статус брони ID |
| `/cancel_ID` | Отмена брони ID |
