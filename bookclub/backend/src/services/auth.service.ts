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

export function sendVerificationCode(phone: string): string {
  const code = '1234'; // заглушка — в реальности отправлять через SMS
  const db = getDb();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 минут
  db.prepare(
    `INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)`
  ).run(phone, code, expiresAt);
  return code;
}

export function verifyPhoneCode(phone: string, code: string): boolean {
  const db = getDb();
  const row = db.prepare(
    `SELECT id FROM verification_codes
     WHERE phone = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  ).get(phone, code) as { id: number } | undefined;

  if (!row) return false;

  // Помечаем код как использованный
  db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(row.id);
  return true;
}
