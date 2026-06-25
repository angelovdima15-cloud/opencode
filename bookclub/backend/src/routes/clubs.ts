import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { SenetClient } from '../services/senet.client';
import { config } from '../config';
import { haversineKm } from '../services/distance';
import { authMiddleware } from '../middleware/auth.middleware';

export const clubRoutes = Router();

let wsCache: Record<number, { free_pcs: number; total_pcs: number; updated_at: string }> = {};
let lastWsFetch = 0;

async function fetchSENETStatuses(): Promise<void> {
  const now = Date.now();
  if (now - lastWsFetch < config.cache.ttlSeconds * 1000) return;
  try {
    const client = new SenetClient({ apiUrl: config.senet.baseUrl, token: config.senet.token });
    const data = await client.getWorkstations();
    const grouped: Record<number, { free: number; total: number }> = {};
    for (const ws of data.workstations || []) {
      const clubId = ws.club_id || ws.clubId || 1;
      if (!grouped[clubId]) grouped[clubId] = { free: 0, total: 0 };
      grouped[clubId].total++;
      if (ws.status === 'free') grouped[clubId].free++;
    }
    wsCache = {};
    for (const [cid, info] of Object.entries(grouped)) {
      wsCache[Number(cid)] = {
        free_pcs: info.free,
        total_pcs: info.total,
        updated_at: new Date().toISOString(),
      };
    }
    lastWsFetch = now;
  } catch {
    // SENET недоступен — используем кеш или данные по умолчанию
  }
}

function enrichFromCache(club: any, cid: number) {
  const senet = wsCache[cid];
  return {
    ...club,
    total_pcs: senet?.total_pcs ?? club.total_pcs,
    free_pcs: senet?.free_pcs ?? (club.has_senet ? 0 : null),
    updated_at: senet?.updated_at ?? new Date().toISOString(),
  };
}

// GET /clubs — список клубов
clubRoutes.get('/', async (req: Request, res: Response) => {
  try {
    await fetchSENETStatuses();
    const db = getDb();

    const userLat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const userLng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const gameId = req.query.game_id ? parseInt(req.query.game_id as string, 10) : undefined;
    const hasPromo = req.query.has_promo === 'true';

    let sql = `
      SELECT id, name, address, lat, lng, phone, description, schedule,
             price_per_hour, total_pcs, has_senet, amenities
      FROM clubs WHERE is_active = 1
    `;

    let params: any[] = [];
    // Фильтр по игре
    if (gameId) {
      sql += ' AND id IN (SELECT club_id FROM club_games WHERE game_id = ?)';
      params.push(gameId);
    }

    // D5: Фильтр по наличию активных акций
    if (hasPromo) {
      sql += ` AND id IN (SELECT club_id FROM club_promos WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')))`;
    }

    let clubs = db.prepare(sql).all(...params) as any[];

    // Парсим amenities из JSON-строки
    clubs = clubs.map((c) => ({
      ...c,
      has_senet: c.has_senet === 1,
      amenities: JSON.parse(c.amenities || '[]'),
    }));

    // D5: Добавляем флаг has_active_promo
    const promoClubIds = new Set(
      (db.prepare(`
        SELECT DISTINCT club_id FROM club_promos
        WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
      `).all() as any[]).map((r: any) => r.club_id)
    );

    clubs = clubs.map((c: any) => ({
      ...c,
      has_active_promo: promoClubIds.has(c.id),
    }));

    // Сортировка по расстоянию
    if (userLat !== undefined && userLng !== undefined) {
      clubs = clubs
        .map((c) => ({ ...c, distance_km: haversineKm(userLat, userLng, c.lat, c.lng) }))
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    // Обогащаем статусами из SENET/кеша
    const enriched = clubs.map((c: any) => {
      const enrichedClub = enrichFromCache(c, c.id);
      const zones = db.prepare('SELECT name, pcs_count, price_per_hour FROM zones WHERE club_id = ?').all(c.id) as any[];
      return { ...enrichedClub, zones };
    });

    res.json({ clubs: enriched });
  } catch (err) {
    console.error('[Clubs] List error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Failed to fetch clubs' });
  }
});

// GET /clubs/:id — детали клуба
clubRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const db = getDb();

    const club = db.prepare(`
      SELECT id, name, address, lat, lng, phone, description, schedule,
             price_per_hour, total_pcs, has_senet, amenities
      FROM clubs WHERE id = ? AND is_active = 1
    `).get(clubId) as any;

    if (!club) {
      res.status(404).json({ error: 'not_found', message: 'Club not found' });
      return;
    }

    club.has_senet = club.has_senet === 1;
    club.amenities = JSON.parse(club.amenities || '[]');

    // Зоны
    const zones = db.prepare('SELECT id, name, pcs_count, price_per_hour FROM zones WHERE club_id = ?').all(clubId) as any[];

    // Рабочие станции
    let workstations: any[] = [];
    let wsUpdatedAt: string | undefined;

    // Сначала пробуем SENET
    if (club.has_senet) {
      try {
        await fetchSENETStatuses();
        const client = new SenetClient({ apiUrl: config.senet.baseUrl, token: config.senet.token });
        const senetData = await client.getWorkstations();
        const clubWs = (senetData.workstations || [])
          .filter((w: any) => (w.club_id || w.clubId) === clubId);

        if (clubWs.length > 0) {
          workstations = clubWs.map((w: any) => ({
            id: w.id ? `senet_${clubId}_${w.id}` : `ws_${Math.random().toString(36).slice(2)}`,
            name: w.name || 'ПК',
            status: w.status || 'offline',
            zone: resolveZoneName(w.zone_id, zones),
            specs: { cpu: w.cpu, gpu: w.gpu, ram: w.ram, monitor: w.monitor },
            position: { x: w.x || 50, y: w.y || 50 },
          }));
          wsUpdatedAt = new Date().toISOString();
        }
      } catch {
        // SENET недоступен — падаем на БД
      }
    }

    // Если SENET не дал данных — берём из БД
    if (workstations.length === 0) {
      const dbWs = db.prepare('SELECT * FROM workstations WHERE club_id = ?').all(clubId) as any[];
      workstations = dbWs.map((w) => ({
        id: w.id,
        name: w.name,
        status: w.status,
        zone: resolveZoneNameByWs(w.zone_id, zones),
        specs: { cpu: w.cpu, gpu: w.gpu, ram: w.ram, monitor: w.monitor },
        position: { x: w.position_x || 50, y: w.position_y || 50 },
        booked_until: w.booked_until,
      }));
      wsUpdatedAt = new Date().toISOString();
    }

    const freePcs = workstations.filter((w) => w.status === 'free').length;
    const totalPcs = workstations.length || club.total_pcs;

    // Зоны со free_pcs из живых данных
    const zonesWithFree = zones.map((z: any) => ({
      name: z.name,
      pcs_count: z.pcs_count,
      price_per_hour: z.price_per_hour || club.price_per_hour,
      free_pcs: workstations.length > 0
        ? workstations.filter((w) => w.zone === z.name && w.status === 'free').length
        : undefined,
    }));

    res.json({
      id: club.id,
      name: club.name,
      address: club.address,
      lat: club.lat,
      lng: club.lng,
      phone: club.phone,
      description: club.description || '',
      schedule: club.schedule,
      price_per_hour: club.price_per_hour,
      amenities: club.amenities,
      total_pcs: totalPcs,
      free_pcs: freePcs,
      zones: zonesWithFree,
      workstations,
      has_live_status: club.has_senet || workstations.length > 0,
      workstations_updated_at: wsUpdatedAt || new Date().toISOString(),
      // D4: Характеристики ПК
      pc_specs: db.prepare(`
        SELECT id, zone_name, cpu, gpu, ram, monitor, peripherals, price_per_hour
        FROM pc_specs WHERE club_id = ?
      `).all(clubId),
      // D5: Активные акции
      promos: db.prepare(`
        SELECT id, title, description, discount, expires_at
        FROM club_promos WHERE club_id = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY created_at DESC
      `).all(clubId),
    });
  } catch (err) {
    console.error('[Clubs] Detail error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Failed to fetch club' });
  }
});

// ===================== D5: Промо/акции =====================

// GET /clubs/:id/promos — список акций для клуба
clubRoutes.get('/:id/promos', (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const db = getDb();

    const promos = db.prepare(`
      SELECT id, title, description, discount, expires_at, is_active, created_at
      FROM club_promos
      WHERE club_id = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC
    `).all(clubId);

    res.json({ promos });
  } catch (err) {
    console.error('[Clubs] Promos error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Failed to fetch promos' });
  }
});

function resolveZoneName(zoneId: number | undefined, zones: any[]): string {
  if (!zoneId) return 'Общий зал';
  const z = zones.find((z: any) => z.id === zoneId);
  return z?.name || 'Общий зал';
}

function resolveZoneNameByWs(zoneId: number | null | undefined, zones: any[]): string {
  if (!zoneId) return 'Общий зал';
  const z = zones.find((z: any) => z.id === zoneId);
  return z?.name || 'Общий зал';
}

// ===================== D2: Отзывы =====================

// POST /clubs/:id/review — создать/обновить отзыв
clubRoutes.post('/:id/review', authMiddleware, (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;
    const { rating, text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'validation_error', message: 'Рейтинг от 1 до 5' });
      return;
    }

    const db = getDb();

    // Проверяем, что клуб существует
    const club = db.prepare('SELECT id FROM clubs WHERE id = ?').get(clubId);
    if (!club) {
      res.status(404).json({ error: 'not_found', message: 'Клуб не найден' });
      return;
    }

    // UPSERT: если отзыв уже есть — обновляем, если нет — создаём
    const existing = db.prepare('SELECT id FROM reviews WHERE club_id = ? AND user_id = ?').get(clubId, userId) as any;

    if (existing) {
      db.prepare(`UPDATE reviews SET rating = ?, text = ?, created_at = datetime('now') WHERE id = ?`)
        .run(rating, text || '', existing.id);
    } else {
      db.prepare(`INSERT INTO reviews (club_id, user_id, rating, text) VALUES (?, ?, ?, ?)`)
        .run(clubId, userId, rating, text || '');
    }

    // Возвращаем обновлённый отзыв
    const review = db.prepare(`
      SELECT r.id, r.rating, r.text, r.created_at, u.name as user_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.club_id = ? AND r.user_id = ?
    `).get(clubId, userId);

    res.json({ review });
  } catch (err) {
    console.error('[Clubs] Review post error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось сохранить отзыв' });
  }
});

// DELETE /clubs/:id/review — удалить свой отзыв
clubRoutes.delete('/:id/review', authMiddleware, (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM reviews WHERE club_id = ? AND user_id = ?').get(clubId, userId);
    if (!existing) {
      res.status(404).json({ error: 'not_found', message: 'Отзыв не найден' });
      return;
    }

    db.prepare('DELETE FROM reviews WHERE club_id = ? AND user_id = ?').run(clubId, userId);
    res.json({ success: true });
  } catch (err) {
    console.error('[Clubs] Review delete error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось удалить отзыв' });
  }
});

// GET /clubs/:id/reviews — список отзывов на клуб (с флагом my_review для текущего пользователя)
clubRoutes.get('/:id/reviews', (req: Request, res: Response) => {
  try {
    const clubId = parseInt(req.params.id, 10);
    const db = getDb();

    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.text, r.created_at, u.name as user_name, r.user_id
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.club_id = ?
      ORDER BY r.created_at DESC
    `).all(clubId);

    // Считаем средний рейтинг
    const stats = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg_rating
      FROM reviews WHERE club_id = ?
    `).get(clubId) as any;

    res.json({
      reviews,
      stats: {
        count: stats.count,
        avg_rating: Math.round(stats.avg_rating * 10) / 10,
      },
    });
  } catch (err) {
    console.error('[Clubs] Reviews list error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить отзывы' });
  }
});

// ===================== D3: Игры =====================

// GET /games — список всех игр
clubRoutes.get('/games/list', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const games = db.prepare('SELECT id, name, icon FROM games ORDER BY name').all();
    res.json({ games });
  } catch (err) {
    console.error('[Clubs] Games list error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Не удалось получить список игр' });
  }
});
