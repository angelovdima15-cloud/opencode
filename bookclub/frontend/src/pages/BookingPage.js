import { api } from '../api/client.js';
import { formatDate, formatPrice } from '../utils/format.js';

export async function renderBookingPage(container, navigate, bookingId) {
  container.innerHTML = '<div class="loading">Загрузка...</div>';

  try {
    const booking = await api.getBooking(bookingId);
    const isConfirmed = booking.status === 'confirmed';

    container.innerHTML = `
      <div class="booking-page">
        <div class="booking-status">
          <div class="confirmation-check">
            <span class="confirmation-check__icon">${isConfirmed ? '✓' : '✗'}</span>
          </div>
          <h2>${isConfirmed ? 'Бронь подтверждена!' : 'Бронь отменена'}</h2>
          <p style="color:var(--text-muted);font-size:14px;margin-top:4px">
            ${isConfirmed ? 'Приходи в клуб к указанному времени. Мы отправили уведомление в Telegram.' : ''}
          </p>
        </div>

        ${isConfirmed ? `
          <div class="qr-block">
            <span class="qr-block__label">Код для входа</span>
            <span class="qr-block__code">${bookingId.toString().padStart(6, '0')}</span>
            <span class="qr-block__label" style="font-size:11px">Покажи этот код на ресепшене</span>
          </div>
        ` : ''}

        <div class="booking-details">
          <div class="detail-row">
            <span class="detail-label">Клуб</span>
            <span class="detail-value">${booking.club_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Телефон клуба</span>
            <span class="detail-value"><a href="tel:${booking.club_phone}">${booking.club_phone}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ПК</span>
            <span class="detail-value">${booking.workstation_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Начало</span>
            <span class="detail-value">${formatDate(booking.start_time)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Конец</span>
            <span class="detail-value">${formatDate(booking.end_time)}</span>
          </div>
          <div class="detail-row total">
            <span class="detail-label">Сумма</span>
            <span class="detail-value">${formatPrice(booking.total_price)}</span>
          </div>
        </div>

        <div class="booking-actions">
          <button class="btn btn-primary" onclick="location.href='/'">На главную</button>
          ${booking.status !== 'cancelled' ? `
            <button class="btn btn-outline" style="flex:1;text-align:center" onclick="window.open('https://2gis.kz/...', '_blank')">🗺️ Проложить маршрут</button>
            <button class="btn btn-danger" data-cancel="${booking.booking_id}">Отменить</button>
          ` : ''}
        </div>
      </div>
    `;

    const cancelBtn = container.querySelector('[data-cancel]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', async () => {
        if (confirm('Отменить бронь?')) {
          try {
            await api.cancelBooking(booking.booking_id);
            navigate(`/booking/${booking.booking_id}`);
          } catch (err) {
            alert('Ошибка: ' + err.message);
          }
        }
      });
    }
  } catch (err) {
    container.innerHTML = `
      <div class="error-page">
        <h2>😕</h2>
        <p>${err.message}</p>
        <button onclick="location.href='/'" class="btn">На главную</button>
      </div>
    `;
  }
}
