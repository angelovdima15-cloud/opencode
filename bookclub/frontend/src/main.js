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
const navEl = document.getElementById('bottom-nav');

const NAV_ITEMS = [
  { id: 'map', icon: '🗺️', label: 'Карта', path: '/map' },
  { id: 'bookings', icon: '📋', label: 'Брони', path: '/profile' },
  { id: 'wallet', icon: '💰', label: 'Кошелёк', path: '/profile?tab=balance' },
  { id: 'profile', icon: '👤', label: 'Профиль', path: '/profile' },
];

function getActiveNavId(path) {
  if (path === '/' || path === '/map') return 'map';
  if (path.startsWith('/club/')) return 'map';
  if (path.startsWith('/booking/')) return 'bookings';
  if (path === '/profile') return 'profile';
  if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/phone-login')) return null;
  return null;
}

function renderHeader() {
  if (!headerEl) return;
  const user = authStore.user;

  headerEl.innerHTML = `
    <div class="header__inner">
      <a href="/" class="header__logo" onclick="event.preventDefault(); window.__navigate('/')">
        cofou
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

function renderBottomNav(currentPath) {
  if (!navEl) return;
  const activeId = getActiveNavId(currentPath);

  navEl.innerHTML = NAV_ITEMS.map(item => {
    const isActive = activeId === item.id;
    return `
      <button class="bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}" data-path="${item.path}" ${item.id === 'bookings' || item.id === 'wallet' ? `data-tab="${item.id === 'wallet' ? 'balance' : 'bookings'}"` : ''}>
        <span class="bottom-nav__icon">${item.icon}</span>
        <span class="bottom-nav__label">${item.label}</span>
      </button>
    `;
  }).join('');

  navEl.querySelectorAll('.bottom-nav__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.path;
      const tab = btn.dataset.tab;
      if (tab) {
        navigate(`${path}?tab=${tab}`);
      } else {
        navigate(path);
      }
    });
  });
}

function navigate(path) {
  window.history.pushState({}, '', path);
  router(path);
}

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
  } else if (path === '/profile' || path.startsWith('/profile?')) {
    if (!authStore.isLoggedIn) {
      navigate('/login');
      return;
    }
    renderProfilePage(app, navigate);
  } else {
    app.innerHTML = '<div class="error-page"><h2>404</h2><p>Страница не найдена</p></div>';
  }

  renderHeader();
  renderBottomNav(path);
}

window.addEventListener('popstate', () => {
  router(window.location.pathname);
});

renderHeader();
renderBottomNav(window.location.pathname);
window.addEventListener('user-updated', renderHeader);
router(window.location.pathname);
