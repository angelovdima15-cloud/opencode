import { getDb } from '../db/database';

/**
 * Возвращает множество ID рабочих станций, занятых бронью ПРЯМО СЕЙЧАС
 * (активная бронь, чей интервал включает текущий момент времени).
 *
 * Будущие брони сюда НЕ попадают — они не должны делать ПК «занятым» в
 * настоящем. Это источник истины для доступности вместо мутации
 * workstations.status при создании/отмене брони.
 */
export function getActiveBookedWorkstationIds(
  db: ReturnType<typeof getDb>,
  clubId?: number,
): Set<string> {
  const now = new Date().toISOString();
  let sql = `
    SELECT DISTINCT workstation_id
    FROM bookings
    WHERE status IN ('confirmed', 'pending', 'arrived')
      AND start_time <= ?
      AND end_time > ?
  `;
  const params: any[] = [now, now];
  if (clubId != null) {
    sql += ' AND club_id = ?';
    params.push(clubId);
  }
  const rows = db.prepare(sql).all(...params) as { workstation_id: string }[];
  return new Set(rows.map((r) => String(r.workstation_id)));
}

/**
 * Применяет вычисленную занятость к статусу ПК: если базовый статус 'free',
 * но ПК занят активной бронью — возвращаем 'booked'. busy/offline остаются как есть.
 */
export function effectiveStatus(rawStatus: string, workstationId: string, bookedSet: Set<string>): string {
  if (rawStatus === 'free' && bookedSet.has(String(workstationId))) return 'booked';
  return rawStatus;
}
