import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { hashPassword, comparePassword, generateToken, sendVerificationCode, verifyPhoneCode } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { config } from '../config';

export const authRoutes = Router();

function getUser(db: import('better-sqlite3').Database, userId: number) {
  return db.prepare(`
    SELECT id, email, name, phone, avatar_url, balance, created_at
    FROM users WHERE id = ?
  `).get(userId) as any;
}

// POST /register — регистрация
authRoutes.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'validation_error', message: 'email, password и name обязательны' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'validation_error', message: 'Пароль должен быть минимум 6 символов' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'validation_error', message: 'Некорректный email' });
      return;
    }

    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      res.status(409).json({ error: 'email_exists', message: 'Пользователь с таким email уже зарегистрирован' });
      return;
    }

    const passwordHash = hashPassword(password);
    const result = db.prepare('INSERT INTO users (email, phone, name, password_hash) VALUES (?, ?, ?, ?)')
      .run(email, phone || null, name, passwordHash);

    const userId = result.lastInsertRowid as number;
    const token = generateToken({ userId, email, name });

    res.status(201).json({
      token,
      user: getUser(db, userId),
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось зарегистрироваться' });
  }
});

// POST /login — вход
authRoutes.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'validation_error', message: 'email и password обязательны' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, name, phone, password_hash FROM users WHERE email = ?').get(email) as any;
    if (!user || !comparePassword(password, user.password_hash)) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Неверный email или пароль' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email, name: user.name });
    res.json({ token, user: getUser(db, user.id) });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось войти' });
  }
});

// POST /auth/send-code — отправить SMS-код (заглушка 1234)
authRoutes.post('/send-code', (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'validation_error', message: 'phone обязателен' });
      return;
    }
    // Нормализация телефона
    const normalizedPhone = phone.replace(/[^+\d]/g, '');
    if (normalizedPhone.length < 8) {
      res.status(400).json({ error: 'validation_error', message: 'Некорректный номер телефона' });
      return;
    }

    const code = sendVerificationCode(normalizedPhone);
    // TODO: интеграция с реальным SMS-провайдером (Mobizon/SMSC и т.п.).
    // В dev-режиме код выводим в лог; в проде он НЕ возвращается клиенту.
    if (config.app.env === 'development') {
      console.log(`[SMS] Код для ${normalizedPhone}: ${code}`);
    }

    const payload: any = { success: true, message: 'Код отправлен' };
    if (config.app.env === 'development') payload.dev_code = code;
    res.json(payload);
  } catch (err: any) {
    if (err?.code === 'rate_limited') {
      res.status(429).json({ error: 'rate_limited', message: err.message });
      return;
    }
    console.error('[Auth] Send-code error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось отправить код' });
  }
});

// POST /auth/verify-code — проверить SMS-код (подтвердить телефон)
authRoutes.post('/verify-code', (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: 'validation_error', message: 'phone и code обязательны' });
      return;
    }

    const normalizedPhone = phone.replace(/[^+\d]/g, '');
    const valid = verifyPhoneCode(normalizedPhone, code);

    if (!valid) {
      res.status(400).json({ error: 'invalid_code', message: 'Неверный или истёкший код' });
      return;
    }

    // Отмечаем телефон как верифицированный у существующего пользователя
    const db = getDb();
    db.prepare("UPDATE users SET phone_verified = 1, updated_at = datetime('now') WHERE phone = ?")
      .run(normalizedPhone);

    res.json({ success: true, message: 'Телефон подтверждён' });
  } catch (err: any) {
    if (err?.code === 'rate_limited') {
      res.status(429).json({ error: 'rate_limited', message: err.message });
      return;
    }
    console.error('[Auth] Verify-code error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось проверить код' });
  }
});

// POST /auth/login-phone — вход/регистрация по телефону
authRoutes.post('/login-phone', (req: Request, res: Response) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: 'validation_error', message: 'phone и code обязательны' });
      return;
    }

    const normalizedPhone = phone.replace(/[^+\d]/g, '');
    const valid = verifyPhoneCode(normalizedPhone, code);

    if (!valid) {
      res.status(400).json({ error: 'invalid_code', message: 'Неверный или истёкший код' });
      return;
    }

    const db = getDb();
    let user = db.prepare('SELECT id, email, phone, name, avatar_url, balance, phone_verified, created_at FROM users WHERE phone = ?')
      .get(normalizedPhone) as any;

    if (!user) {
      // Новый пользователь — создаём по телефону
      const defaultName = name || 'Пользователь';
      // Генерируем уникальный email на основе телефона, чтобы не нарушать UNIQUE constraint
      const emailPlaceholder = `phone_${normalizedPhone.replace(/[^+\d]/g, '')}@placeholder.bookclub`;
      // Пароль — случайный хеш (вход только по SMS)
      const randomPassword = hashPassword(Math.random().toString(36).slice(2));
      const result = db.prepare(
        'INSERT INTO users (email, phone, name, password_hash, phone_verified) VALUES (?, ?, ?, ?, 1)'
      ).run(emailPlaceholder, normalizedPhone, defaultName, randomPassword);

      const userId = result.lastInsertRowid as number;
      user = getUser(db, userId);
    } else {
      // Существующий пользователь — обновляем verified
      db.prepare("UPDATE users SET phone_verified = 1, updated_at = datetime('now') WHERE id = ?")
        .run(user.id);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    res.json({ token, user });
  } catch (err: any) {
    if (err?.code === 'rate_limited') {
      res.status(429).json({ error: 'rate_limited', message: err.message });
      return;
    }
    console.error('[Auth] Login-phone error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось войти по телефону' });
  }
});

// GET /me — профиль + баланс
authRoutes.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const user = getUser(db, req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'not_found', message: 'Пользователь не найден' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить профиль' });
  }
});

// PUT /me — обновление профиля
authRoutes.put('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;
    const db = getDb();
    db.prepare("UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = datetime('now') WHERE id = ?")
      .run(name || null, phone || null, req.user!.userId);
    res.json({ user: getUser(db, req.user!.userId) });
  } catch (err: any) {
    console.error('[Auth] Update error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось обновить профиль' });
  }
});

// PUT /me/password — смена пароля
authRoutes.put('/me/password', authMiddleware, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'validation_error', message: 'currentPassword и newPassword обязательны' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'validation_error', message: 'Новый пароль должен быть минимум 6 символов' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.userId) as any;
    if (!comparePassword(currentPassword, user.password_hash)) {
      res.status(400).json({ error: 'wrong_password', message: 'Текущий пароль неверен' });
      return;
    }

    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(hashPassword(newPassword), req.user!.userId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Auth] Password error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось сменить пароль' });
  }
});

// POST /balance/topup — пополнение баланса
authRoutes.post('/balance/topup', authMiddleware, (req: Request, res: Response) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount < 1 || amount > 100000) {
      res.status(400).json({ error: 'validation_error', message: 'Сумма от 1 до 100 000 ₸' });
      return;
    }
    if (amount % 1 !== 0) {
      res.status(400).json({ error: 'validation_error', message: 'Сумма должна быть целым числом' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user!.userId) as any;
    const balanceBefore = user.balance;

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user!.userId);
    db.prepare('INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user!.userId, 'topup', amount, balanceBefore, balanceBefore + amount, description || 'Пополнение баланса');

    const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user!.userId) as any;
    res.json({ balance: updated.balance, amount });
  } catch (err: any) {
    console.error('[Auth] Topup error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось пополнить баланс' });
  }
});

// GET /balance/transactions — история операций
authRoutes.get('/balance/transactions', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const transactions = db.prepare(`
      SELECT t.*, c.name as club_name
      FROM transactions t
      LEFT JOIN bookings b ON b.id = t.booking_id
      LEFT JOIN clubs c ON c.id = b.club_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 100
    `).all(req.user!.userId);
    res.json({ transactions });
  } catch (err: any) {
    console.error('[Auth] Transactions error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить историю' });
  }
});

// POST /favorites/:clubId — toggle избранного
authRoutes.post('/favorites/:clubId', authMiddleware, (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.clubId, 10);
    const db = getDb();

    const club = db.prepare('SELECT id FROM clubs WHERE id = ?').get(clubId);
    if (!club) {
      res.status(404).json({ error: 'not_found', message: 'Клуб не найден' });
      return;
    }

    const existing = db.prepare('SELECT 1 FROM favorite_clubs WHERE user_id = ? AND club_id = ?').get(req.user!.userId, clubId);

    if (existing) {
      db.prepare('DELETE FROM favorite_clubs WHERE user_id = ? AND club_id = ?').run(req.user!.userId, clubId);
      res.json({ favorited: false, club_id: clubId });
    } else {
      db.prepare('INSERT INTO favorite_clubs (user_id, club_id) VALUES (?, ?)').run(req.user!.userId, clubId);
      res.json({ favorited: true, club_id: clubId });
    }
  } catch (err: any) {
    console.error('[Auth] Favorites error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось изменить избранное' });
  }
});

// GET /favorites — список избранных клубов
authRoutes.get('/favorites', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const favorites = db.prepare(`
      SELECT c.*, fc.created_at as favorited_at
      FROM favorite_clubs fc
      JOIN clubs c ON c.id = fc.club_id
      WHERE fc.user_id = ?
      ORDER BY fc.created_at DESC
    `).all(req.user!.userId);
    res.json({ favorites });
  } catch (err: any) {
    console.error('[Auth] Favorites list error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить список избранного' });
  }
});

// GET /stats — статистика пользователя
authRoutes.get('/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;

    const [totalBookings, activeBookings, totalHours, totalSpent] = [
      db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ?").get(userId) as any,
      db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND status = 'confirmed' AND end_time > datetime('now')").get(userId) as any,
      db.prepare("SELECT COALESCE(SUM(duration_hours), 0) as total FROM bookings WHERE user_id = ? AND status = 'confirmed'").get(userId) as any,
      db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE user_id = ? AND status = 'confirmed'").get(userId) as any,
    ];

    const totalTopups = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'topup'").get(userId) as any;

    res.json({
      stats: {
        total_bookings: totalBookings.cnt,
        active_bookings: activeBookings.cnt,
        total_hours: Math.round(totalHours.total * 10) / 10,
        total_spent: totalSpent.total,
        total_topups: totalTopups.total,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Stats error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить статистику' });
  }
});
