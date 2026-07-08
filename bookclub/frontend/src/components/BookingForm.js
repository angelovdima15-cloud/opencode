export class BookingForm {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.overlay = null;
    this.pricePerHour = 0;
  }

  show(workstation) {
    this.hide();

    // Определяем цену за час из рабочих станций или клуба
    this.pricePerHour = workstation.price_per_hour || 500;

    // Дефолтное время: начало — следующий час, конец — +2 часа
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setMinutes(0, 0, 0);
    defaultStart.setHours(now.getHours() + 1);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + 2);

    const fmtTime = (d) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    // Дата для поля
    const todayStr = now.toISOString().split('T')[0];

    this.overlay = document.createElement('div');
    this.overlay.className = 'booking-overlay';

    this.overlay.innerHTML = `
      <div class="booking-form">
        <button class="booking-form__close">&times;</button>
        <h3>Бронирование</h3>
        <p class="booking-form__pc"><b>${workstation.name}</b> (${workstation.zone})</p>
        ${workstation.specs?.cpu ? `<p class="booking-form__specs">${workstation.specs.cpu} · ${workstation.specs.gpu}</p>` : ''}

        <form id="booking-form">
          <label>
            Имя (необязательно)
            <input type="text" name="user_name" placeholder="Азамат" />
          </label>
          <label>
            Номер телефона *
            <input type="tel" name="user_phone" placeholder="+7 700 123 45 67" required />
          </label>

          <div class="booking-form__time-row">
            <label class="booking-form__time-label">
              Дата
              <input type="date" name="booking_date" value="${todayStr}" min="${todayStr}" required />
            </label>
          </div>
          <div class="booking-form__time-row">
            <label class="booking-form__time-label">
              С
              <input type="time" name="time_start" value="${fmtTime(defaultStart)}" required />
            </label>
            <label class="booking-form__time-label">
              До
              <input type="time" name="time_end" value="${fmtTime(defaultEnd)}" required />
            </label>
          </div>

          <div class="booking-form__summary">
            <span id="booking-duration-text" style="color:var(--text-muted)">2 часа</span>
            <span id="booking-price-text" style="color:var(--accent);font-weight:800;font-size:20px">${this.pricePerHour * 2} ₸</span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="background:var(--accent);border-radius:12px;padding:14px;font-size:16px">
            💳 Оплатить и забронировать
          </button>
        </form>
        <p class="booking-form__note">✅ Бронь подтверждается сразу после оплаты. Администратор клуба не участвует — просто приходи к указанному времени.</p>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector('.booking-form__close').addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    // Динамический пересчёт длительности и цены
    const timeStartInput = this.overlay.querySelector('input[name="time_start"]');
    const timeEndInput = this.overlay.querySelector('input[name="time_end"]');
    const durationText = this.overlay.querySelector('#booking-duration-text');
    const priceText = this.overlay.querySelector('#booking-price-text');

    const updateSummary = () => {
      const partsStart = timeStartInput.value.split(':').map(Number);
      const partsEnd = timeEndInput.value.split(':').map(Number);
      const startMin = partsStart[0] * 60 + partsStart[1];
      const endMin = partsEnd[0] * 60 + partsEnd[1];

      if (endMin <= startMin) {
        durationText.textContent = '—';
        priceText.textContent = '—';
        return;
      }

      const hours = (endMin - startMin) / 60;
      const hh = Math.floor(hours);
      const mm = Math.round((hours - hh) * 60);

      let durationStr = '';
      if (hh > 0) durationStr += `${hh} ч`;
      if (mm > 0) durationStr += ` ${mm} мин`;
      durationText.textContent = durationStr.trim();
      priceText.textContent = `${Math.round(hours * this.pricePerHour)} ₸`;
    };

    timeStartInput.addEventListener('change', updateSummary);
    timeEndInput.addEventListener('change', updateSummary);

    this.overlay.querySelector('#booking-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = this.overlay.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Бронирую...';

      const formData = new FormData(e.target);
      const dateStr = formData.get('booking_date');
      const timeStart = formData.get('time_start');
      const timeEnd = formData.get('time_end');

      // Собираем ISO строки
      const startISO = new Date(`${dateStr}T${timeStart}:00`).toISOString();
      const endISO = new Date(`${dateStr}T${timeEnd}:00`).toISOString();

      this.onSubmit({
        workstation_id: workstation.id,
        club_id: workstation.club_id || parseInt(window.location.pathname.split('/')[2]),
        user_phone: formData.get('user_phone'),
        user_name: formData.get('user_name') || undefined,
        start_time: startISO,
        end_time: endISO,
      });
    });
  }

  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
