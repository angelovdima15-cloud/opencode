import { getCurrentPosition } from './utils/geo.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderMapPage } from './pages/MapPage.js';
import { renderClubPage } from './pages/ClubPage.js';
import { renderBookingPage } from './pages/BookingPage.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderPhoneLoginPage } from './pages/PhoneLoginPage.js';
import { renderRegisterPage } from './pages/RegisterPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { authStore } from './api/authStore.js';
import './styles/main.css';
import './styles/map.css';

const app = document.getElementById('main-content');
const headerEl = document.getElementById('app-header');

function renderHeader() {
  if (!headerEl) return;
  const user = authStore.user;

  headerEl.innerHTML = `
    <div class="header__inner">
      <a href="/" class="header__logo" onclick="event.preventDefault(); window.__navigate('/')">
        🎮 BookClub
      </a>
      <nav class="header__nav">
        <a href="/map" class="header__link" onclick="event.preventDefault(); window.__navigate('/map')">Карта</a>
        ${user ? `
          <a href="/profile" class="header__link" onclick="event.preventDefault(); window.__navigate('/profile')">
            <span class="header__avatar">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
            ${user.name || 'Пользователь'}
          </a>
        ` : `
          <a href="/login" class="header__link" onclick="event.preventDefault(); window.__navigate('/login')">Войти</a>
          <a href="/register" class="btn btn-sm btn-header" onclick="event.preventDefault(); window.__navigate('/register')">Регистрация</a>
        `}
      </nav>
    </div>
  `;
}

function navigate(path) {
  window.history.pushState({}, '', path);
  router(path);
}

// Глобально для ссылок внутри HTML-шаблонов
window.__navigate = navigate;

function router(path) {
  app.innerHTML = '';

  if (path === '/') {
    renderHomePage(app, navigate);
  } else if (path === '/map') {
    renderMapPage(app, navigate);
  } else if (path.startsWith('/club/')) {
    const clubId = path.split('/')[2];
    renderClubPage(app, navigate, clubId);
  } else if (path.startsWith('/booking/')) {
    const bookingId = path.split('/')[2];
    renderBookingPage(app, navigate, bookingId);
  } else if (path === '/login') {
    renderLoginPage(app, navigate);
  } else if (path === '/phone-login') {
    renderPhoneLoginPage(app, navigate);
  } else if (path === '/register') {
    renderRegisterPage(app, navigate);
  } else if (path === '/profile') {
    // Защищённый роут
    if (!authStore.isLoggedIn) {
      navigate('/login');
      return;
    }
    renderProfilePage(app, navigate);
  } else {
    app.innerHTML = '<div class="error-page"><h2>404</h2><p>Страница не найдена</p></div>';
  }

  // Обновляем хедер после смены страницы
  renderHeader();
}

window.addEventListener('popstate', () => {
  router(window.location.pathname);
});

// При загрузке — проверить токен и обновить хедер
renderHeader();
// Обновляем хедер при изменении пользователя (например после сохранения профиля)
window.addEventListener('user-updated', renderHeader);
router(window.location.pathname);
