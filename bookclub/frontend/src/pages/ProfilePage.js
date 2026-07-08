import { api } from '../api/client.js';
import { authStore } from '../api/authStore.js';
import { formatPrice } from '../utils/format.js';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatAmount(amount) {
  const n = Number(amount);
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString('ru-RU')} ₸`;
}

function statusClass(status) {
  if (status === 'confirmed') return 'status-badge status-badge--confirmed';
  if (status === 'cancelled') return 'status-badge status-badge--cancelled';
  if (status === 'completed') return 'status-badge status-badge--completed';
  return '';
}

function statusLabel(status) {
  const labels = { confirmed: 'Подтверждено', cancelled: 'Отменено', completed: 'Завершено' };
  return labels[status] || status;
}

function showError(el, msg) {
  el.innerHTML = `<div class="error-msg">${msg}</div>`;
}

function showLoading(el) {
  el.innerHTML = '<div class="loading">Загрузка...</div>';
}

function navigateTo(navigate, path) {
  if (navigate) navigate(path);
}

export async function renderProfilePage(container, navigate) {
  if (!authStore.isLoggedIn) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <h2>Войдите в аккаунт</h2>
          <p class="auth-subtitle">Чтобы увидеть профиль</p>
          <a href="#" class="btn btn-primary btn-block" id="go-login">Войти</a>
        </div>
      </div>
    `;
    container.querySelector('#go-login')?.addEventListener('click', (e) => { e.preventDefault(); navigate('/login'); });
    return;
  }

  container.innerHTML = '<div class="loading">Загрузка профиля...</div>';

  try {
    const [profileRes, statsRes] = await Promise.all([
      api.getMe(),
      api.getStats().catch(() => ({ stats: { total_bookings: 0, active_bookings: 0, total_hours: 0, total_spent: 0, total_topups: 0 } })),
    ]);

    const user = profileRes.user;
    const stats = statsRes.stats;

    // Parse tab from query param (e.g. ?tab=balance)
    const params = new URLSearchParams(window.location.search);
    let activeTab = params.get('tab') || 'bookings';

    function renderLayout() {
      const initial = (user.name || user.email)[0].toUpperCase();
      container.innerHTML = `
        <div class="profile-page">
          <div class="profile-header">
            <div class="profile-avatar">${initial}</div>
            <div class="profile-info">
              <h2>${user.name || 'Пользователь'}</h2>
              <div class="profile-email">${user.email}</div>
              ${user.phone ? `<div class="profile-phone">${user.phone}</div>` : ''}
            </div>
            <div class="profile-balance" style="margin-left:auto;text-align:right">
              <div style="font-size:12px;color:var(--text-muted)">Баланс</div>
              <div style="font-size:22px;font-weight:800;color:var(--accent)">${(user.balance || 0).toLocaleString('ru-RU')} ₸</div>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-card">
              <div class="stat-card__value">${stats.total_bookings}</div>
              <div class="stat-card__label">Броней</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${stats.total_hours}</div>
              <div class="stat-card__label">Часов</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${stats.active_bookings}</div>
              <div class="stat-card__label">Активных</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${stats.total_spent.toLocaleString('ru-RU')} ₸</div>
              <div class="stat-card__label">Потрачено</div>
            </div>
          </div>

          <div class="tabs">
            <button class="tab ${activeTab === 'bookings' ? 'tab--active' : ''}" data-tab="bookings">Мои брони</button>
            <button class="tab ${activeTab === 'balance' ? 'tab--active' : ''}" data-tab="balance">Баланс</button>
            <button class="tab ${activeTab === 'favorites' ? 'tab--active' : ''}" data-tab="favorites">Избранное</button>
            <button class="tab ${activeTab === 'settings' ? 'tab--active' : ''}" data-tab="settings">Настройки</button>
          </div>

          <div class="tab-content" id="tab-content">
            <div class="loading">Загрузка...</div>
          </div>

          <div class="profile-footer">
            <button class="btn btn-danger" id="btn-logout">Выйти из аккаунта</button>
          </div>
        </div>
      `;

      container.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          activeTab = tab.dataset.tab;
          const url = new URL(window.location);
          url.searchParams.set('tab', activeTab);
          window.history.replaceState({}, '', url.toString());
          renderLayout();
        });
      });

      container.querySelector('#btn-logout')?.addEventListener('click', () => {
        authStore.logout();
        navigate('/');
      });

      renderTab();
    }

    async function renderTab() {
      const tabContent = container.querySelector('#tab-content');
      if (!tabContent) return;

      if (activeTab === 'bookings') await renderBookings(tabContent, user, navigate);
      else if (activeTab === 'balance') await renderBalance(tabContent, user);
      else if (activeTab === 'favorites') await renderFavorites(tabContent, navigate);
      else if (activeTab === 'settings') renderSettings(tabContent, user);
    }

    renderLayout();

  } catch (err) {
    container.innerHTML = `<div class="error-page"><h2>:(</h2><p>${err.message}</p></div>`;
  }
}

async function renderBookings(el, user, navigate) {
  showLoading(el);
  try {
    const data = await api.getMyBookings();
    const bookings = data.bookings || [];

    if (bookings.length === 0) {
      el.innerHTML = `
        <div class="profile-empty">
          <p>У вас пока нет броней</p>
          <a href="#" id="go-map">Найти клуб</a>
        </div>
      `;
      el.querySelector('#go-map')?.addEventListener('click', (e) => { e.preventDefault(); navigate('/map'); });
      return;
    }

    const now = new Date().toISOString();
    const active = bookings.filter(b => b.status === 'confirmed' && b.end_time > now);
    const past = bookings.filter(b => b.status !== 'confirmed' || b.end_time <= now);

    let html = '';
    if (active.length > 0) {
      html += '<h3 style="margin-bottom:12px">Активные брони</h3><div class="booking-list">';
      active.forEach(b => {
        html += renderBookingCard(b, navigate, true);
      });
      html += '</div>';
    }

    html += `<h3 style="margin:20px 0 12px">История</h3><div class="booking-list">`;
    past.forEach(b => {
      html += renderBookingCard(b, navigate, false);
    });
    html += '</div>';

    el.innerHTML = html;

    // Attach cancel handlers
    el.querySelectorAll('.btn-cancel-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Отменить бронь?')) {
          try {
            await api.cancelBooking(id);
            renderBookings(el, user, navigate);
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });
  } catch (err) {
    showError(el, err.message);
  }
}

function renderBookingCard(b, navigate, isActive) {
  return `
    <div class="booking-card${isActive ? ' booking-card--active' : ''}">
      <div class="booking-card__header">
        <span class="booking-card__club">${b.club_name || 'Клуб'}</span>
        <span class="booking-card__status ${statusClass(b.status)}">${statusLabel(b.status)}</span>
      </div>
      <div class="booking-card__details">
        <span>🖥️ ${b.workstation_name || b.workstation_id}</span>
        <span>⏰ ${formatTime(b.start_time)} — ${formatTime(b.end_time)} (${b.duration_hours} ч)</span>
        <span>💰 ${b.total_price ? formatPrice(b.total_price) : '—'}</span>
        <span>📅 ${formatDate(b.created_at)}</span>
      </div>
      ${isActive ? `
        <div class="booking-card__actions">
          <button class="btn btn-sm btn-danger btn-cancel-booking" data-id="${b.id}">Отменить</button>
          <button class="btn btn-sm btn-outline" data-id="${b.id}" onclick="window.__navigate('/booking/${b.id}')">Подробнее</button>
        </div>
      ` : ''}
    </div>
  `;
}

async function renderBalance(el, user) {
  el.innerHTML = `
    <div class="balance-section">
      <div class="balance-card">
        <div class="balance-card__amount">${(user.balance || 0).toLocaleString('ru-RU')} ₸</div>
        <div class="balance-card__label">Текущий баланс</div>
      </div>

      <div class="balance-topup">
        <h3>Пополнить баланс</h3>
        <div class="topup-presets">
          <button class="preset-btn" data-amount="500">500 ₸</button>
          <button class="preset-btn" data-amount="1000">1 000 ₸</button>
          <button class="preset-btn" data-amount="3000">3 000 ₸</button>
          <button class="preset-btn" data-amount="5000">5 000 ₸</button>
        </div>
        <div class="topup-custom">
          <input type="number" id="topup-amount" placeholder="Своя сумма" min="1" step="1" class="topup-input" />
          <button class="btn btn-primary" id="btn-topup">Пополнить</button>
        </div>
        <p class="topup-note">Минимальная сумма: 1 ₸, максимальная: 100 000 ₸</p>
      </div>

      <h3 style="margin:24px 0 12px">История операций</h3>
      <div id="transactions-list" class="loading">Загрузка...</div>
    </div>
  `;

  // Preset buttons
  const amountInput = el.querySelector('#topup-amount');
  el.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      amountInput.value = btn.dataset.amount;
    });
  });

  // Topup
  el.querySelector('#btn-topup')?.addEventListener('click', async () => {
    const amount = parseInt(amountInput?.value, 10);
    if (!amount || amount < 1) { alert('Введите сумму от 1 ₸'); return; }
    if (amount > 100000) { alert('Максимум 100 000 ₸'); return; }
    try {
      await api.topUpBalance({ amount, description: 'Пополнение через личный кабинет' });
      const me = await api.getMe();
      authStore.setUser(me.user);
      renderBalance(el, me.user); // reload
    } catch (err) {
      alert(err.message);
    }
  });

  // Transactions
  try {
    const data = await api.getTransactions();
    const txs = data.transactions || [];
    const listEl = el.querySelector('#transactions-list');
    if (txs.length === 0) {
      listEl.innerHTML = '<div class="profile-empty">История операций пуста</div>';
    } else {
      listEl.innerHTML = txs.map(tx => {
        const typeLabels = { topup: 'Пополнение', payment: 'Оплата брони', refund: 'Возврат', withdraw: 'Вывод' };
        const typeColor = tx.type === 'topup' || tx.type === 'refund' ? 'var(--success)' : 'var(--danger)';
        const sign = tx.type === 'topup' || tx.type === 'refund' ? '+' : '';
        return `
          <div class="tx-row">
            <div class="tx-row__left">
              <span style="font-weight:600">${typeLabels[tx.type] || tx.type}</span>
              <span class="tx-row__desc">${tx.description || ''}</span>
              <span class="tx-row__date">${formatDate(tx.created_at)}</span>
            </div>
            <div class="tx-row__right" style="color:${typeColor};font-weight:700">
              ${sign}${Number(tx.amount).toLocaleString('ru-RU')} ₸
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    el.querySelector('#transactions-list').innerHTML = `<div class="error-msg">${err.message}</div>`;
  }
}

async function renderFavorites(el, navigate) {
  showLoading(el);
  try {
    const data = await api.getFavorites();
    const favorites = data.favorites || [];

    if (favorites.length === 0) {
      el.innerHTML = `
        <div class="profile-empty">
          <p>У вас нет избранных клубов</p>
          <a href="#" id="go-map-fav">Добавить клубы</a>
        </div>
      `;
      el.querySelector('#go-map-fav')?.addEventListener('click', (e) => { e.preventDefault(); navigate('/map'); });
      return;
    }

    el.innerHTML = `<div class="fav-list">${favorites.map(f => `
      <div class="fav-card">
        <div class="fav-card__info">
          <h4>${f.name}</h4>
          <span class="fav-card__addr">${f.address || ''}</span>
        </div>
        <button class="btn btn-sm btn-outline" onclick="window.__navigate('/club/${f.id}')">Выбрать ПК</button>
      </div>
    `).join('')}</div>`;
  } catch (err) {
    showError(el, err.message);
  }
}

function renderSettings(el, user) {
  el.innerHTML = `
    <div class="settings-section">
      <h3>Редактировать профиль</h3>
      <label>Имя</label>
      <input type="text" id="edit-name" value="${user.name || ''}" class="settings-input" />
      <label>Телефон</label>
      <input type="tel" id="edit-phone" value="${user.phone || ''}" class="settings-input" placeholder="+7 700 000 00 00" />
      <button class="btn btn-primary" id="btn-save-profile" style="margin-top:12px">Сохранить</button>
      <div id="save-info" style="margin-top:8px;font-size:13px"></div>
    </div>

    <hr class="settings-divider" />

    <div class="settings-section">
      <h3>Сменить пароль</h3>
      <label>Текущий пароль</label>
      <input type="password" id="pw-current" class="settings-input" />
      <label>Новый пароль</label>
      <input type="password" id="pw-new" class="settings-input" placeholder="Минимум 6 символов" />
      <button class="btn btn-primary" id="btn-save-password" style="margin-top:12px">Сменить пароль</button>
      <div id="pw-info" style="margin-top:8px;font-size:13px"></div>
    </div>
  `;

  el.querySelector('#btn-save-profile')?.addEventListener('click', async () => {
    const name = el.querySelector('#edit-name').value.trim();
    const phone = el.querySelector('#edit-phone').value.trim();
    const info = el.querySelector('#save-info');
    try {
      const res = await api.updateProfile({ name, phone: phone || undefined });
      authStore.setUser(res.user);
      window.dispatchEvent(new CustomEvent('user-updated'));
      info.innerHTML = '<span style="color:var(--success)">✓ Профиль сохранён</span>';
    } catch (err) {
      info.innerHTML = `<span style="color:var(--danger)">✗ ${err.message}</span>`;
    }
  });

  el.querySelector('#btn-save-password')?.addEventListener('click', async () => {
    const currentPassword = el.querySelector('#pw-current').value;
    const newPassword = el.querySelector('#pw-new').value;
    const info = el.querySelector('#pw-info');
    if (!currentPassword || !newPassword) {
      info.innerHTML = '<span style="color:var(--danger)">✗ Заполните оба поля</span>';
      return;
    }
    if (newPassword.length < 6) {
      info.innerHTML = '<span style="color:var(--danger)">✗ Минимум 6 символов</span>';
      return;
    }
    try {
      await api.changePassword({ currentPassword, newPassword });
      info.innerHTML = '<span style="color:var(--success)">✓ Пароль изменён</span>';
      el.querySelector('#pw-current').value = '';
      el.querySelector('#pw-new').value = '';
    } catch (err) {
      info.innerHTML = `<span style="color:var(--danger)">✗ ${err.message}</span>`;
    }
  });
}
