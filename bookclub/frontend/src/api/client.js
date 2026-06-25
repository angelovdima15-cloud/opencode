import { authStore } from './authStore.js';

const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Добавляем Bearer-токен, если есть
  if (authStore.token) {
    config.headers['Authorization'] = `Bearer ${authStore.token}`;
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Клубы
  getClubs(lat, lng, radius = 5) {
    const params = new URLSearchParams();
    if (lat != null) params.set('lat', lat);
    if (lng != null) params.set('lng', lng);
    params.set('radius', String(radius));
    return request(`/clubs?${params}`);
  },

  getClubsByGame(gameId, lat, lng) {
    const params = new URLSearchParams();
    params.set('game_id', String(gameId));
    if (lat != null) params.set('lat', lat);
    if (lng != null) params.set('lng', lng);
    return request(`/clubs?${params}`);
  },

  getClub(id) {
    return request(`/clubs/${id}`);
  },

  getWorkstations(clubId) {
    return request(`/clubs/${clubId}/workstations`);
  },

  // Бронирования
  createBooking({ club_id, workstation_id, user_phone, user_name, start_time, end_time }) {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify({ club_id, workstation_id, user_phone, user_name, start_time, end_time }),
    });
  },

  getBooking(id) {
    return request(`/bookings/${id}`);
  },

  cancelBooking(id) {
    return request(`/bookings/${id}/cancel`, { method: 'POST' });
  },

  getMyBookings() {
    return request('/bookings');
  },

  // Аутентификация
  register({ email, password, name, phone }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    });
  },

  login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  sendCode(phone) {
    return request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyCode(phone, code) {
    return request('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  loginByPhone(phone, code, name) {
    return request('/auth/login-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    });
  },

  getMe() {
    return request('/auth/me');
  },

  updateProfile({ name, phone }) {
    return request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    });
  },

  changePassword({ currentPassword, newPassword }) {
    return request('/auth/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  topUpBalance({ amount, description }) {
    return request('/auth/balance/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  },

  getTransactions() {
    return request('/auth/balance/transactions');
  },

  getStats() {
    return request('/auth/stats');
  },

  getFavorites() {
    return request('/auth/favorites');
  },

  toggleFavorite(clubId) {
    return request(`/auth/favorites/${clubId}`, { method: 'POST' });
  },

  // Отзывы
  getReviews(clubId) {
    return request(`/clubs/${clubId}/reviews`);
  },

  postReview(clubId, { rating, text }) {
    return request(`/clubs/${clubId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, text }),
    });
  },

  deleteReview(clubId) {
    return request(`/clubs/${clubId}/review`, { method: 'DELETE' });
  },

  // Игры
  getGames() {
    return request('/games');
  },

  // D5: Акции/промо
  getClubPromos(clubId) {
    return request(`/clubs/${clubId}/promos`);
  },

  getClubsWithPromo(lat, lng) {
    const params = new URLSearchParams();
    params.set('has_promo', 'true');
    if (lat != null) params.set('lat', lat);
    if (lng != null) params.set('lng', lng);
    return request(`/clubs?${params}`);
  },
};
