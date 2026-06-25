import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { nanoid } from 'nanoid';
import { config } from '../config';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import type { CreateBookingRequest, BookingResponse } from '../schemas/booking';

export const bookingRoutes = Router();

function generateBookingId(): string {
  return 'bk_' + nanoid(10);
}

/** Нормализация телефона для сравнения (только + и цифры). */
function normalizePhone(phone: string | null | undefined): string {
  return (phone || '').replace(/[^+\d]/g, '');
}

/**
 * Проверяет, принадлежит ли бронь пользователю: по user_id, либо по совпадению
 * верифицированного телефона пользователя с телефоном гостевой брони.
 */
function ownsBooking(
  db: ReturnType<typeof getDb>,
  booking: { user_id: number | null; user_phone: string | null },
  userId: number,
): boolean {
  if (booking.user_id != null && booking.user_id === userId) return true;
  const u = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId) as { phone?: string } | undefined;
  const userPhone = normalizePhone(u?.phone);
  return !!userPhone && normalizePhone(booking.user_phone) === userPhone;
}

/**
 * Проверяет пересечение нового временного слота с существующими бронями.
 */
function isOverlapping(
  db: ReturnType<typeof getDb>,
  workstationId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string,
): boolean {
  let sql = `
    SELECT COUNT(*) as cnt FROM bookings
    WHERE workstation_id = ?
      AND status IN ('confirmed', 'pending', 'arrived')
      AND start_time < ?
      AND end_time > ?
  `;
  const params: any[] = [workstationId, endTime, startTime];

  if (excludeBookingId) {
    sql += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const row = db.prepare(sql).get(...params) as { cnt: number };
  return row.cnt > 0;
}

/**
 * Валидация временного слота: start_time должен быть в будущем,
 * end_time — строго позже start_time, не больше 24 часов.
 */
function validateTimeSlot(startISO: string, endISO: string): { valid: boolean; error?: string } {
  const start = new Date(startISO);
  const end = new Date(endISO);

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Некорректное время начала' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Некорректное время окончания' };
  }

  // Минимальная длительность — 30 минут
  const minMs = 30 * 60 * 1000;
  if (end.getTime() - start.getTime() < minMs) {
    return { valid: false, error: 'Минимальная длительность брони — 30 минут' };
  }

  // Максимум — 24 часа
  const maxMs = 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > maxMs) {
    return { valid: false, error: 'Максимальная длительность брони — 24 часа' };
  }

  if (end <= start) {
    return { valid: false, error: 'Время окончания должно быть позже времени начала' };
  }

  // Нельзя бронировать в прошлом — ни начало, ни конец слота
  const now = Date.now();
  const GRACE_MS = 60000; // 1 минута запаса на рассинхрон часов
  if (start.getTime() < now - GRACE_MS) {
    return { valid: false, error: 'Нельзя бронировать на прошедшее время' };
  }
  if (end.getTime() < now - GRACE_MS) {
    return { valid: false, error: 'Нельзя бронировать на прошедшее время' };
  }

  return { valid: true };
}

// POST /bookings — создать бронь (полностью онлайн, без звонков)
bookingRoutes.post('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const { club_id, workstation_id, user_phone, user_name, start_time, end_time } =
      req.body as CreateBookingRequest;

    // Валидация обязательных полей
    if (!club_id || !workstation_id || !user_phone) {
      res.status(400).json({
        error: 'validation_error',
        message: 'club_id, workstation_id, user_phone обязательны',
      });
      return;
    }

    if (!start_time || !end_time) {
      res.status(400).json({
        error: 'validation_error',
        message: 'start_time и end_time обязательны (указывайте временной слот, например с 17:00 до 21:00)',
      });
      return;
    }

    // Валидация временного слота
    const slotValidation = validateTimeSlot(start_time, end_time);
    if (!slotValidation.valid) {
      res.status(400).json({ error: 'validation_error', message: slotValidation.error });
      return;
    }

    // Валидация телефона
    const phoneClean = user_phone.replace(/[\s\-\(\)]/g, '');
    if (phoneClean.length < 10) {
      res.status(400).json({
        error: 'validation_error',
        message: 'Неверный формат номера телефона',
      });
      return;
    }

    const db = getDb();
    const startISO = new Date(start_time).toISOString();
    const endISO = new Date(end_time).toISOString();

    // Проверяем клуб
    const club = db.prepare('SELECT id, name, phone, price_per_hour, has_senet FROM clubs WHERE id = ?').get(club_id) as any;
    if (!club) {
      res.status(404).json({ error: 'not_found', message: 'Клуб не найден' });
      return;
    }

    // Проверяем ПК
    const workstation = db.prepare('SELECT id, name, status, booked_until FROM workstations WHERE id = ? AND club_id = ?').get(workstation_id, club_id) as any;
    if (!workstation) {
      res.status(404).json({ error: 'not_found', message: 'Рабочая станция не найдена' });
      return;
    }

    if (workstation.status === 'offline') {
      res.status(409).json({ error: 'station_offline', message: 'Этот ПК в данный момент недоступен' });
      return;
    }

    // Расчёт цены
    let pricePerHour = club.price_per_hour;
    const wsZone = db.prepare('SELECT zone_id FROM workstations WHERE id = ?').get(workstation_id) as any;
    if (wsZone?.zone_id) {
      const zone = db.prepare('SELECT price_per_hour FROM zones WHERE id = ? AND club_id = ?').get(wsZone.zone_id, club_id) as any;
      if (zone?.price_per_hour) {
        pricePerHour = zone.price_per_hour;
      }
    }

    const durationMs = new Date(endISO).getTime() - new Date(startISO).getTime();
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    const totalPrice = Math.round(pricePerHour * durationHours);

    // Создаём бронь — статус "confirmed" сразу (онлайн-покупка, звонок не нужен)
    const bookingId = generateBookingId();
    const now = new Date().toISOString();
    const userId = req.user?.userId || null;

    // Атомарно: повторная проверка пересечения, списание баланса и вставка брони.
    // better-sqlite3 синхронен, поэтому транзакция полностью сериализует операцию
    // и исключает гонку двойного бронирования и перерасход баланса при
    // одновременных запросах. Ошибки бросаем с httpCode для маппинга в ответ.
    const runBooking = db.transaction(() => {
      // Повторная проверка ВНУТРИ транзакции — ключ к защите от гонки
      if (isOverlapping(db, workstation_id, startISO, endISO)) {
        throw Object.assign(new Error('time_conflict'), {
          httpCode: 409,
          errCode: 'time_conflict',
          msg: 'Этот ПК уже занят на выбранное время. Выберите другой слот или другой ПК.',
        });
      }

      if (userId) {
        const userBalance = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
        if (!userBalance || userBalance.balance < totalPrice) {
          throw Object.assign(new Error('insufficient_balance'), {
            httpCode: 402,
            errCode: 'insufficient_balance',
            msg: 'Недостаточно средств на балансе. Пополните кошелёк.',
          });
        }
        db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalPrice, userId);
        db.prepare(`
          INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, booking_id)
          VALUES (?, 'payment', ?, ?, ?, ?, ?)
        `).run(userId, -totalPrice, userBalance.balance, userBalance.balance - totalPrice, `Оплата брони #${bookingId}`, bookingId);
      }

      db.prepare(`
        INSERT INTO bookings (id, club_id, workstation_id, user_id, user_phone, user_name, start_time, end_time, duration_hours, total_price, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
      `).run(bookingId, club_id, workstation_id, userId, phoneClean, user_name || null, startISO, endISO, durationHours, totalPrice, now, now);
    });

    try {
      runBooking();
    } catch (txErr: any) {
      if (txErr?.httpCode) {
        res.status(txErr.httpCode).json({ error: txErr.errCode, message: txErr.msg });
        return;
      }
      throw txErr;
    }

    // ПРИМЕЧАНИЕ: статус ПК здесь НЕ меняется. Доступность вычисляется по
    // активным броням на текущий момент (см. services/availability.ts),
    // поэтому будущая бронь не делает ПК «занятым» прямо сейчас, и несколько
    // будущих броней не перетирают друг друга.

    // Фоновое уведомление клубу (не критично, бронь уже подтверждена)
    try {
      const { notificationService } = require('../services/notification.service');
      notificationService.notifyClub(
        config.telegram.botToken ? String(club_id) : undefined,
        { clubName: club.name, clubPhone: club.phone, workstationName: workstation.name, userName: user_name || 'Не указано', userPhone: phoneClean, startTime: startISO, endTime: endISO, bookingId },
      );
    } catch { /* уведомление опционально */ }

    const response: BookingResponse = {
      booking_id: bookingId,
      status: 'confirmed',
      club_id,
      club_name: club.name,
      workstation_name: workstation.name,
      start_time: startISO,
      end_time: endISO,
      duration_hours: durationHours,
      total_price: totalPrice,
      created_at: now,
    };

    res.status(201).json(response);
  } catch (err: any) {
    console.error('[Bookings] Create error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось создать бронь' });
  }
});

// GET /bookings/ — список броней текущего пользователя
bookingRoutes.get('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const phone = req.query.phone as string;

    if (!userId && !phone) {
      res.status(401).json({ error: 'unauthorized', message: 'Требуется авторизация или номер телефона' });
      return;
    }

    let bookings: any[];
    if (userId) {
      bookings = db.prepare(`
        SELECT b.*, c.name as club_name, w.name as workstation_name
        FROM bookings b
        JOIN clubs c ON c.id = b.club_id
        JOIN workstations w ON w.id = b.workstation_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        LIMIT 50
      `).all(userId);
    } else {
      bookings = db.prepare(`
        SELECT b.*, c.name as club_name, w.name as workstation_name
        FROM bookings b
        JOIN clubs c ON c.id = b.club_id
        JOIN workstations w ON w.id = b.workstation_id
        WHERE b.user_phone = ?
        ORDER BY b.created_at DESC
        LIMIT 50
      `).all(phone);
    }

    res.json({ bookings });
  } catch (err) {
    console.error('[Bookings] List error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить список броней' });
  }
});

// GET /bookings/:id — статус брони
bookingRoutes.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const booking = db.prepare(`
      SELECT b.*, c.name as club_name, c.phone as club_phone, w.name as workstation_name
      FROM bookings b
      JOIN clubs c ON c.id = b.club_id
      JOIN workstations w ON w.id = b.workstation_id
      WHERE b.id = ?
    `).get(req.params.id) as any;

    if (!booking) {
      res.status(404).json({ error: 'not_found', message: 'Бронь не найдена' });
      return;
    }

    // Проверка владельца: бронь принадлежит пользователю по user_id
    // либо по совпадению верифицированного телефона (гостевые брони)
    if (!ownsBooking(db, booking, req.user!.userId)) {
      res.status(403).json({ error: 'forbidden', message: 'Нет доступа к этой брони' });
      return;
    }

    res.json({
      booking_id: booking.id,
      status: booking.status,
      club_id: booking.club_id,
      club_name: booking.club_name,
      club_phone: booking.club_phone,
      workstation_name: booking.workstation_name,
      start_time: booking.start_time,
      end_time: booking.end_time,
      total_price: booking.total_price,
      created_at: booking.created_at,
    });
  } catch (err) {
    console.error('[Bookings] Get error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить бронь' });
  }
});

// POST /bookings/:id/cancel — отмена
bookingRoutes.post('/:id/cancel', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;

    if (!booking) {
      res.status(404).json({ error: 'not_found', message: 'Бронь не найдена' });
      return;
    }

    // Проверка владельца — отменить можно только свою бронь
    if (!ownsBooking(db, booking, req.user!.userId)) {
      res.status(403).json({ error: 'forbidden', message: 'Нет доступа к этой брони' });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ error: 'already_cancelled', message: 'Бронь уже отменена' });
      return;
    }

    const now = new Date().toISOString();
    const reason = req.body?.reason || 'Отменено пользователем';

    // Атомарно: возврат средств (если оплачивал авторизованный пользователь) +
    // смена статуса брони. Статус ПК НЕ трогаем — доступность вычисляется по
    // активным броням, поэтому отмена одной брони не «освобождает» ПК,
    // на котором есть другие активные/будущие брони.
    const runCancel = db.transaction(() => {
      if (booking.user_id && booking.status === 'confirmed' && booking.total_price > 0) {
        const userBal = db.prepare('SELECT balance FROM users WHERE id = ?').get(booking.user_id) as any;
        if (userBal) {
          db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(booking.total_price, booking.user_id);
          db.prepare(
            `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description, booking_id)
             VALUES (?, 'refund', ?, ?, ?, ?, ?)`
          ).run(booking.user_id, booking.total_price, userBal.balance, userBal.balance + booking.total_price, `Возврат за отмену брони #${booking.id}`, booking.id);
        }
      }

      db.prepare('UPDATE bookings SET status = ?, updated_at = ?, cancel_reason = ? WHERE id = ?')
        .run('cancelled', now, reason, req.params.id);
    });

    runCancel();

    res.json({ booking_id: booking.id, status: 'cancelled' });
  } catch (err) {
    console.error('[Bookings] Cancel error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось отменить бронь' });
  }
});

// GET /bookings/check/:workstation_id — проверка доступности ПК на конкретный слот
bookingRoutes.get('/check/:workstation_id', (req: Request, res: Response) => {
  try {
    const wsId = req.params.workstation_id;
    const start = req.query.start as string;
    const end = req.query.end as string;

    if (!start || !end) {
      res.status(400).json({ error: 'validation_error', message: 'Параметры start и end обязательны' });
      return;
    }

    const db = getDb();
    const workstation = db.prepare('SELECT id, name, status FROM workstations WHERE id = ?').get(wsId) as any;
    if (!workstation) {
      res.status(404).json({ error: 'not_found', message: 'Станция не найдена' });
      return;
    }

    const overlapping = isOverlapping(db, wsId, new Date(start).toISOString(), new Date(end).toISOString());

    res.json({
      workstation_id: wsId,
      workstation_name: workstation.name,
      is_free: !overlapping && workstation.status !== 'busy' && workstation.status !== 'offline',
      requested_start: start,
      requested_end: end,
    });
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: 'Не удалось проверить доступность' });
  }
});
