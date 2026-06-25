import { Router, Request, Response } from 'express';

export const telegramRoutes = Router();

telegramRoutes.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // TODO: handle Telegram updates
    // /start -> send welcome + request location
    // location -> find nearby clubs
    // /club_N -> show club detail
    // /book_N_H_PHONE -> create booking
    // /status_ID -> check booking

    console.log('[Telegram] Received update:', JSON.stringify(update).slice(0, 200));

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Telegram] Webhook error:', err);
    return res.json({ ok: false });
  }
});

telegramRoutes.get('/set-webhook', async (_req: Request, res: Response) => {
  try {
    const { config } = await import('../config');
    const axios = (await import('axios')).default;

    const response = await axios.post(
      `https://api.telegram.org/bot${config.telegram.botToken}/setWebhook`,
      { url: config.telegram.webhookUrl }
    );

    res.json({ ok: response.data.ok, description: response.data.description });
  } catch (err: any) {
    res.status(500).json({ error: 'webhook_setup_failed', message: err.message });
  }
});
