import { Telegraf } from 'telegraf';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(
    '🎮 <b>BookClub</b> — бронирование мест в компьютерных клубах Караганды\n\n' +
    'Отправь свою геолокацию, чтобы увидеть ближайшие клубы со свободными местами.',
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📍 Показать клубы рядом', request_location: true }],
        ],
        resize_keyboard: true,
      },
    }
  );
});

bot.on('location', async (ctx) => {
  const { latitude, longitude } = ctx.message.location;

  try {
    const response = await axios.get(`${API_BASE}/clubs`, {
      params: { lat: latitude, lng: longitude, radius: 5 },
    });

    const clubs = response.data.clubs;

    if (clubs.length === 0) {
      await ctx.reply('😕 Рядом нет клубов. Попробуй увеличить радиус поиска.');
      return;
    }

    let message = '🏪 <b>Клубы рядом:</b>\n\n';
    const buttons: any[] = [];

    for (const club of clubs) {
      message += `🏠 <b>${club.name}</b>\n`;
      message += `📍 ${club.address}\n`;
      message += `🖥️ Свободно: ${club.free_pcs}/${club.total_pcs}\n`;
      message += `💰 от ${club.price_per_hour} тг/час\n\n`;
      buttons.push([{ text: `📋 ${club.name}`, callback_data: `club_${club.id}` }]);
    }

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (err) {
    await ctx.reply('❌ Ошибка при получении данных. Попробуй позже.');
  }
});

bot.action(/club_(\d+)/, async (ctx) => {
  const clubId = ctx.match[1];

  try {
    const response = await axios.get(`${API_BASE}/clubs/${clubId}`);
    const club = response.data;

    let message = `🏪 <b>${club.name}</b>\n`;
    message += `📍 ${club.address}\n`;
    message += `📞 ${club.phone || 'не указан'}\n`;
    message += `🕐 ${club.schedule}\n`;
    message += `🖥️ Свободно: ${club.free_pcs}/${club.total_pcs}\n`;
    message += `💰 от ${club.price_per_hour} тг/час\n\n`;

    for (const zone of club.zones) {
      message += `▫️ ${zone.name}: ${zone.free_pcs}/${zone.pcs_count} свободно`;
      if (zone.price_per_hour) message += ` (${zone.price_per_hour} тг/ч)`;
      message += '\n';
    }

    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🖥️ Выбрать ПК', callback_data: `pcs_${clubId}` }],
          [{ text: '🔙 Назад', callback_data: 'back_to_clubs' }],
        ],
      },
    });
  } catch (err) {
    await ctx.reply('❌ Ошибка при получении данных клуба.');
  }
});

bot.action(/pcs_(\d+)/, async (ctx) => {
  const clubId = ctx.match[1];

  try {
    const response = await axios.get(`${API_BASE}/clubs/${clubId}/workstations`);
    const data = response.data;

    const freePcs = data.workstations.filter((w: any) => w.status === 'free');
    const busyPcs = data.workstations.filter((w: any) => w.status === 'busy');

    let message = `🖥️ <b>Свободные ПК (${freePcs.length}/${data.workstations.length}):</b>\n\n`;

    for (const pc of freePcs.slice(0, 10)) {
      message += `🟢 ${pc.name} — ${pc.zone}`;
      if (pc.specs?.gpu) message += ` (${pc.specs.gpu})`;
      message += '\n';
    }

    if (freePcs.length > 10) {
      message += `\n...и ещё ${freePcs.length - 10} свободных ПК`;
    }

    const bookButtons = freePcs.slice(0, 5).map((pc: any) => [
      { text: `✅ ${pc.name}`, callback_data: `book_${clubId}_${pc.id}` },
    ]);

    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...bookButtons,
          [{ text: '🔙 К клубу', callback_data: `club_${clubId}` }],
        ],
      },
    });
  } catch (err) {
    await ctx.reply('❌ Ошибка при получении списка ПК.');
  }
});

bot.action('back_to_clubs', async (ctx) => {
  await ctx.reply('Отправь геолокацию, чтобы увидеть клубы рядом:', {
    reply_markup: {
      keyboard: [
        [{ text: '📍 Показать клубы рядом', request_location: true }],
      ],
      resize_keyboard: true,
    },
  });
  await ctx.deleteMessage();
});

bot.launch().then(() => {
  console.log('[Telegram Bot] Started');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
