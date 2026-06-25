import { authStore } from '../api/authStore.js';
import { api } from '../api/client.js';

export async function renderHomePage(container, navigate) {
  const isLogged = authStore.isLoggedIn;
  const userName = authStore.user?.name || '';
  const balance = authStore.user?.balance || 0;

  // Загружаем игры
  let gamesList = [];
  try {
    const gamesData = await api.getGames();
    gamesList = gamesData.games || [];
  } catch { /* игры недоступны */ }

  // Try to fetch active bookings and stats for logged-in user
  let activeBookings = [];
  let stats = null;
  if (isLogged) {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        api.getMyBookings().catch(() => ({ bookings: [] })),
        api.getStats().catch(() => null),
      ]);
      const now = new Date().toISOString();
      activeBookings = (bookingsRes.bookings || []).filter(
        b => b.status === 'confirmed' && b.end_time > now
      );
      stats = statsRes?.stats;
    } catch {}
  }

  container.innerHTML = `
    <section class="hero">
      <div class="hero__bg"></div>
      <div class="hero__content">
        <div class="hero__emoji">🎮</div>
        <h1 class="hero__title">BookClub</h1>
        <p class="hero__subtitle">Бронируй ПК в клубах Караганды онлайн</p>
        <p class="hero__desc">Без звонков, без очередей, по-настоящему</p>

        ${isLogged && stats ? `
          <div class="hero__balance-widget">
            <div class="hero__balance-item">
              <div class="hero__balance-item__value">${balance.toLocaleString('ru-RU')} ₸</div>
              <div class="hero__balance-item__label">Баланс</div>
            </div>
            <div class="hero__balance-item">
              <div class="hero__balance-item__value">${stats.total_bookings}</div>
              <div class="hero__balance-item__label">Броней</div>
            </div>
            <div class="hero__balance-item">
              <div class="hero__balance-item__value">${stats.total_hours}</div>
              <div class="hero__balance-item__label">Часов</div>
            </div>
          </div>
        ` : ''}

        <div class="hero__cta">
          <button class="btn btn-primary btn-lg" id="btn-find-clubs">Найти клубы</button>
          ${isLogged ? `
            <p class="hero__greeting">С возвращением, ${userName}!</p>
          ` : `
            <button class="btn btn-outline btn-lg" id="btn-register">Зарегистрироваться</button>
          `}
        </div>
      </div>
    </section>

    <section class="section games-section">
      <h2 class="section__title">🎮 Во что играешь?</h2>
      <div class="games-grid">
        ${gamesList.map(g => `
          <div class="game-icon-card" data-game-id="${g.id}">
            <span class="game-icon-card__icon">${g.icon}</span>
            <span class="game-icon-card__name">${g.name}</span>
          </div>
        `).join('')}
      </div>
    </section>

    ${isLogged && activeBookings.length > 0 ? `
      <div class="active-bookings-widget">
        <div class="active-bookings-widget__header">
          <h3>🎮 Активные брони</h3>
          <button class="btn btn-sm btn-outline" id="btn-all-bookings">Все брони</button>
        </div>
        ${activeBookings.map(b => `
          <div class="booking-chip">
            <div>
              <div class="booking-chip__club">${b.club_name || 'Клуб'}</div>
              <div class="booking-chip__time">🖥️ ${b.workstation_name || ''} · ${new Date(b.start_time).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'})} — ${new Date(b.end_time).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="window.__navigate('/booking/${b.id}')">Подробнее</button>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <section class="section how-it-works">
      <h2 class="section__title">Как это работает</h2>
      <div class="steps">
        <div class="step">
          <div class="step__num">1</div>
          <div class="step__icon">🗺️</div>
          <h3>Выбери клуб</h3>
          <p>Найди ближайший клуб на карте. Узнай цену, свободные места, характеристики ПК.</p>
        </div>
        <div class="step">
          <div class="step__num">2</div>
          <div class="step__icon">⏰</div>
          <h3>Выбери время</h3>
          <p>Укажи с какого по какое время хочешь играть. Цена рассчитается автоматически.</p>
        </div>
        <div class="step">
          <div class="step__num">3</div>
          <div class="step__icon">🎉</div>
          <h3>Приходи и играй</h3>
          <p>Бронь подтверждается сразу — никаких звонков. Просто приходи к указанному времени.</p>
        </div>
      </div>
    </section>

    <section class="section features">
      <h2 class="section__title">Почему BookClub</h2>
      <div class="features__grid">
        <div class="feature-card">
          <div class="feature-card__icon">✅</div>
          <h3>Мгновенно</h3>
          <p>Бронь подтверждается за секунду. Никакого ожидания.</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__icon">📱</div>
          <h3>Без звонков</h3>
          <p>Ты покупаешь место за ПК онлайн. Никаких звонков администратору.</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__icon">💰</div>
          <h3>Кошелёк</h3>
          <p>Пополняй баланс и оплачивай брони онлайн. Все операции в истории.</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__icon">🖥️</div>
          <h3>Выбор ПК</h3>
          <p>Видишь конфигурацию каждого компьютера и выбираешь под свои задачи.</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__icon">📅</div>
          <h3>Слоты</h3>
          <p>Бронируешь на конкретное время. Удобно планировать день.</p>
        </div>
        <div class="feature-card">
          <div class="feature-card__icon">🆓</div>
          <h3>Свободные места</h3>
          <p>Видишь в реальном времени, какие ПК свободны в каждом клубе.</p>
        </div>
      </div>
    </section>

    <section class="section cta-section">
      <div class="cta-card">
        <h2>Готов начать?</h2>
        <p>Найди клуб рядом и забронируй ПК за 2 минуты</p>
        <button class="btn btn-primary btn-lg" id="btn-cta">Найти клубы</button>
      </div>
    </section>

    <footer class="footer">
      <p>🎮 BookClub — бронирование ПК клубов в Караганде</p>
      <p class="footer__small">© ${new Date().getFullYear()} — Работает полностью онлайн</p>
    </footer>
  `;

  container.querySelector('#btn-find-clubs')?.addEventListener('click', () => navigate('/map'));
  container.querySelector('#btn-cta')?.addEventListener('click', () => navigate('/map'));
  container.querySelector('#btn-register')?.addEventListener('click', () => navigate('/register'));
  container.querySelector('#btn-all-bookings')?.addEventListener('click', () => navigate('/profile'));

  // Клик по игре — переход на карту с фильтром
  container.querySelectorAll('.game-icon-card').forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.dataset.gameId;
      navigate(`/map?game_id=${gameId}`);
    });
  });
}
