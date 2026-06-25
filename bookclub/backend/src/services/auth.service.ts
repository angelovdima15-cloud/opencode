import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDb } from '../db/database';

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

export interface UserPayload {
  userId: number;
  email?: string;
  phone?: string;
  name: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// Лимиты против перебора/спама. verifyAttempts — in-memory (достаточно для
// одного инстанса; при горизонтальном масштабировании вынести в Redis).
const MAX_CODES_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;
const verifyAttempts = new Map<string, { count: number; resetAt: number }>();

export class RateLimitError extends Error {
  code = 'rate_limited';
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/** Криптостойкий 4-значный код (1000–9999). */
function generateCode(): string {
  return String(1000 + crypto.randomInt(0, 9000));
}

export function sendVerificationCode(phone: string): string {
  const db = getDb();

  // Ограничение частоты выдачи: не более MAX_CODES_PER_HOUR кодов на номер за час
  const recent = db.prepare(
    `SELECT COUNT(*) as cnt FROM verification_codes
     WHERE phone = ? AND created_at > datetime('now', '-1 hour')`
  ).get(phone) as { cnt: number };
  if (recent.cnt >= MAX_CODES_PER_HOUR) {
    throw new RateLimitError('Слишком много запросов кода. Попробуйте позже.');
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 минут
  db.prepare(
    `INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)`
  ).run(phone, code, expiresAt);
  return code;
}

export function verifyPhoneCode(phone: string, code: string): boolean {
  // Лимит попыток ввода на номер — защита от перебора 4-значного кода
  const now = Date.now();
  const entry = verifyAttempts.get(phone);
  if (entry && now < entry.resetAt && entry.count >= MAX_VERIFY_ATTEMPTS) {
    throw new RateLimitError('Слишком много попыток ввода кода. Попробуйте позже.');
  }

  const db = getDb();
  const row = db.prepare(
    `SELECT id FROM verification_codes
     WHERE phone = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  ).get(phone, code) as { id: number } | undefined;

  if (!row) {
    const next = entry && now < entry.resetAt
      ? { count: entry.count + 1, resetAt: entry.resetAt }
      : { count: 1, resetAt: now + VERIFY_WINDOW_MS };
    verifyAttempts.set(phone, next);
    return false;
  }

  // Успех — сбрасываем счётчик попыток и помечаем код использованным
  verifyAttempts.delete(phone);
  db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(row.id);
  return true;
}
