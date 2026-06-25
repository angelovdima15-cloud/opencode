import axios from 'axios';
import { config } from '../config';

interface BookingNotification {
  clubName: string;
  clubPhone: string;
  workstationName: string;
  userName: string;
  userPhone: string;
  startTime: string;
  endTime: string;
  bookingId: string;
}

export class NotificationService {
  async notifyClub(chatId: string, notification: BookingNotification): Promise<void> {
    const message = this.buildMessage(notification);

    try {
      await axios.post(
        `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }
      );
    } catch (err) {
      console.error('[Notification] Failed to send Telegram message:', err);
    }
  }

  private buildMessage(n: BookingNotification): string {
    return [
      `🔔 <b>Новая бронь!</b>`,
      ``,
      `🏪 Клуб: ${n.clubName}`,
      `🖥️ ПК: ${n.workstationName}`,
      `👤 Клиент: ${n.userName} (${n.userPhone})`,
      `🕐 Начало: ${n.startTime}`,
      `🕐 Конец: ${n.endTime}`,
      ``,
      `🆔 ID: ${n.bookingId}`,
      `📞 Телефон клуба: ${n.clubPhone}`,
    ].join('\n');
  }
}

export const notificationService = new NotificationService();
