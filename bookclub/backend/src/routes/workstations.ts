import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { SenetClient } from '../services/senet.client';
import { config } from '../config';
import { getActiveBookedWorkstationIds, effectiveStatus } from '../services/availability';

export const workstationRoutes = Router();

// GET /clubs/:id/workstations — список ПК клуба
workstationRoutes.get('/:id/workstations', async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const db = getDb();

    const club = db.prepare('SELECT id, name, has_senet FROM clubs WHERE id = ? AND is_active = 1').get(clubId) as any;
    if (!club) {
      res.status(404).json({ error: 'not_found', message: 'Club not found' });
      return;
    }

    const zones = db.prepare('SELECT id, name FROM zones WHERE club_id = ?').all(clubId) as any[];
    let workstations: any[] = [];

    // Пробуем SENET
    if (club.has_senet) {
      try {
        const client = new SenetClient({ apiUrl: config.senet.baseUrl, token: config.senet.token });
        const senetData = await client.getWorkstations();
        const clubWs = (senetData.workstations || [])
          .filter((w: any) => (w.club_id || w.clubId) === clubId);

        if (clubWs.length > 0) {
          workstations = clubWs.map((w: any) => ({
            id: w.id ? `senet_${clubId}_${w.id}` : `ws_${Math.random().toString(36).slice(2)}`,
            name: w.name || w.computer_name || 'ПК',
            status: w.status || 'offline',
            zone: resolveZone(w.zone_id, zones),
            specs: { cpu: w.cpu || w.specs?.cpu, gpu: w.gpu || w.specs?.gpu, ram: w.ram || w.specs?.ram, monitor: w.monitor || w.specs?.monitor },
            position: w.position || { x: w.x || 50, y: w.y || 50 },
          }));
        }
      } catch {
        // SENET недоступен
      }
    }

    // Если SENET не дал данных — БД
    if (workstations.length === 0) {
      const bookedSet = getActiveBookedWorkstationIds(db, clubId);
      const dbWs = db.prepare('SELECT * FROM workstations WHERE club_id = ?').all(clubId) as any[];
      workstations = dbWs.map((w) => ({
        id: w.id,
        name: w.name,
        // Доступность вычисляется по активным броням на текущий момент
        status: effectiveStatus(w.status, w.id, bookedSet),
        zone: resolveZone(w.zone_id, zones),
        specs: { cpu: w.cpu, gpu: w.gpu, ram: w.ram, monitor: w.monitor },
        position: { x: w.position_x || 50, y: w.position_y || 50 },
        booked_until: w.booked_until,
      }));
    }

    res.json({ club_id: clubId, workstations });
  } catch (err) {
    console.error('[Workstations] Error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Failed to fetch workstations' });
  }
});

function resolveZone(zoneId: number | undefined, zones: { id: number; name: string }[]): string {
  if (!zoneId) return 'Общий зал';
  const z = zones.find((z) => z.id === zoneId);
  return z?.name || 'Общий зал';
}
