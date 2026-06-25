import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

export const gameRoutes = Router();

// GET /games — список всех игр
gameRoutes.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const games = db.prepare('SELECT id, name, icon FROM games ORDER BY name').all();
    res.json({ games });
  } catch (err) {
    console.error('[Games] List error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Failed to fetch games' });
  }
});
