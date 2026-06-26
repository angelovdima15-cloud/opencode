import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { effectiveStatus } from '../availability';

/**
 * Юнит-тесты доступности ПК. Закрываем пробел в покрытии для критичной
 * бизнес-логики: статус ПК должен корректно вычисляться по активным броням.
 */
describe('effectiveStatus', () => {
  it('помечает свободный ПК как booked, если он в множестве активных броней', () => {
    const booked = new Set<string>(['ws_1']);
    expect(effectiveStatus('free', 'ws_1', booked)).toBe('booked');
  });

  it('оставляет свободный ПК free, если активных броней на него нет', () => {
    const booked = new Set<string>(['ws_2']);
    expect(effectiveStatus('free', 'ws_1', booked)).toBe('free');
  });

  it('не меняет статусы busy/offline даже при наличии брони', () => {
    const booked = new Set<string>(['ws_1']);
    expect(effectiveStatus('busy', 'ws_1', booked)).toBe('busy');
    expect(effectiveStatus('offline', 'ws_1', booked)).toBe('offline');
  });
});

/**
 * Интеграционный тест логики пересечения временных слотов на in-memory БД.
 * Дублирует SQL из isOverlapping, чтобы зафиксировать ожидаемое поведение
 * (полуоткрытый интервал: start < existingEnd AND end > existingStart).
 */
describe('booking overlap (SQL semantics)', () => {
  let db: Database.Database;

  function isOverlapping(workstationId: string, start: string, end: string): boolean {
    const row = db.prepare(`
      SELECT COUNT(*) as cnt FROM bookings
      WHERE workstation_id = ?
        AND status IN ('confirmed','pending','arrived')
        AND start_time < ?
        AND end_time > ?
    `).get(workstationId, end, start) as { cnt: number };
    return row.cnt > 0;
  }

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE bookings (
        id TEXT PRIMARY KEY,
        workstation_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
    db.prepare(
      `INSERT INTO bookings (id, workstation_id, start_time, end_time, status)
       VALUES ('bk_1', 'ws_1', '2026-06-26T14:00:00.000Z', '2026-06-26T16:00:00.000Z', 'confirmed')`
    ).run();
  });

  it('обнаруживает пересечение слотов', () => {
    expect(isOverlapping('ws_1', '2026-06-26T15:00:00.000Z', '2026-06-26T17:00:00.000Z')).toBe(true);
  });

  it('не считает соседний слот пересечением (границы касаются)', () => {
    expect(isOverlapping('ws_1', '2026-06-26T16:00:00.000Z', '2026-06-26T18:00:00.000Z')).toBe(false);
  });

  it('игнорирует отменённые брони', () => {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', 'bk_1');
    expect(isOverlapping('ws_1', '2026-06-26T15:00:00.000Z', '2026-06-26T17:00:00.000Z')).toBe(false);
  });
});
