import { api } from '../api/client.js';
import { getCurrentPosition } from '../utils/geo.js';
import { geocode } from '../utils/geocode.js';
import { ClubMap } from '../components/ClubMap.js';
import { formatPrice } from '../utils/format.js';

const KARAGANDA_COORDS = { lat: 49.802, lng: 73.100 };

async function tryGeolocation() {
  try {
    return await getCurrentPosition();
  } catch {
    return null;
  }
}

function showLocationModal(container, navigate) {
  const overlay = document.createElement('div');
  overlay.className = 'location-overlay';
  overlay.innerHTML = `
    <div class="location-modal">
      <div class="location-modal__icon">📍</div>
      <h2>Где ты находишься?</h2>
      <p class="location-modal__desc">Разреши геолокацию или введи адрес — найдём ближайшие клубы</p>
      <div class="location-modal__manual">
        <input type="text" class="location-modal__input" id="address-input" placeholder="Караганда, ул. Ленина, 1" value="Караганда" />
        <button class="btn btn-primary btn-block" id="search-address">Найти клубы</button>
        <div id="address-suggestions" class="address-suggestions"></div>
      </div>
      <div class="location-modal__actions">
        <button class="btn" id="retry-geo">Определить автоматически</button>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const input = overlay.querySelector('#address-input');
  const suggestions = overlay.querySelector('#address-suggestions');
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 3) { suggestions.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
      try {
        const results = await geocode(q);
        suggestions.innerHTML = results
          .slice(0, 3)
          .map((r) => `<div class="suggestion-item" data-lat="${r.lat}" data-lng="${r.lng}">${r.displayName}</div>`)
          .join('');
        suggestions.querySelectorAll('.suggestion-item').forEach((el) => {
          el.addEventListener('click', () => {
            overlay.remove();
            loadClubs(container, navigate, { lat: parseFloat(el.dataset.lat), lng: parseFloat(el.dataset.lng) });
          });
        });
      } catch { /* ignore */ }
    }, 400);
  });

  overlay.querySelector('#search-address').addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    overlay.querySelector('#search-address').textContent = 'Ищем...';
    overlay.querySelector('#search-address').disabled = true;
    geocode(q)
      .then((results) => {
        if (results.length > 0) {
          overlay.remove();
          loadClubs(container, navigate, { lat: results[0].lat, lng: results[0].lng });
        } else {
          overlay.querySelector('#search-address').textContent = 'Ничего не найдено';
          setTimeout(() => {
            overlay.querySelector('#search-address').textContent = 'Найти клубы';
            overlay.querySelector('#search-address').disabled = false;
          }, 2000);
        }
      })
      .catch(() => {
        overlay.querySelector('#search-address').textContent = 'Ошибка';
        setTimeout(() => {
          overlay.querySelector('#search-address').textContent = 'Найти клубы';
          overlay.querySelector('#search-address').disabled = false;
        }, 2000);
      });
  });

  overlay.querySelector('#retry-geo').addEventListener('click', async () => {
    overlay.querySelector('#retry-geo').textContent = 'Определяю...';
    overlay.querySelector('#retry-geo').disabled = true;
    const pos = await tryGeolocation();
    if (pos) {
      overlay.remove();
      loadClubs(container, navigate, pos);
    } else {
      overlay.querySelector('#retry-geo').textContent = 'Определить автоматически';
      overlay.querySelector('#retry-geo').disabled = false;
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      overlay.querySelector('#search-address').click();
    }
  });

  setTimeout(() => input.focus(), 100);
}

function updateClubList(listContainer, map, clubs, navigate, coords) {
  listContainer.innerHTML = '';
  map.clearMarkers();
  map.addUserMarker(coords.lat, coords.lng);

  clubs.forEach((club, i) => {
    map.addMarker(club, () => navigate(`/club/${club.id}`));
    const card = createClubCard(club, i === 0, navigate);
    listContainer.appendChild(card);
  });

  map.fitAllMarkers();
}

function showNetworkError(container, navigate, lastCoords) {
  const overlay = document.createElement('div');
  overlay.className = 'location-overlay';
  overlay.innerHTML = `
    <div class="location-modal">
      <div class="location-modal__icon">😕</div>
      <h2>Не удалось загрузить данные</h2>
      <p class="location-modal__desc">Проверь, запущен ли бэкенд на порту 8000, и попробуй снова</p>
      <div class="location-modal__actions">
        <button class="btn btn-primary" id="retry-load">Попробовать снова</button>
        <button class="btn" id="back-btn">Ввести адрес</button>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  overlay.querySelector('#retry-load').addEventListener('click', () => {
    overlay.remove();
    loadClubs(container, navigate, lastCoords);
  });

  overlay.querySelector('#back-btn').addEventListener('click', () => {
    overlay.remove();
    showLocationModal(container, navigate);
  });
}

function createClubCard(club, isNearest, navigate) {
  const card = document.createElement('div');
  card.className = 'club-card';
  if (isNearest) card.classList.add('club-card--nearest');

  card.innerHTML = `
    <div class="club-card__header">
      <h3>${isNearest ? '⭐ ' : ''}${club.name}</h3>
      <div style="display:flex;align-items:center;gap:6px">
        ${club.has_active_promo ? '<span class="promo-badge">🔥 Акция</span>' : ''}
        <span class="club-card__price">от ${formatPrice(club.price_per_hour)}</span>
      </div>
    </div>
    <p class="club-card__address">${club.address}</p>
    <div class="club-card__meta">
      <div class="club-card__status">
        ${club.free_pcs !== undefined
          ? `<span class="status-dot ${club.free_pcs > 0 ? 'free' : 'busy'}"></span>
             ${club.free_pcs} из ${club.total_pcs} свободно`
          : `<span class="status-dot busy"></span>Нет данных`
        }
      </div>
      ${club.distance_km !== undefined
        ? `<span class="club-card__distance">${club.distance_km} км</span>`
        : ''
      }
    </div>
    ${isNearest ? '<div class="club-card__badge">Самый близкий</div>' : ''}
  `;
  card.addEventListener('click', () => navigate(`/club/${club.id}`));
  return card;
}

async function loadClubs(container, navigate, coords, preselectedGameId) {
  container.innerHTML = '<div class="loading">Загружаем клубы...</div>';

  try {
    const data = await api.getClubs(coords.lat, coords.lng);

    container.innerHTML = '';

    const searchBar = document.createElement('div');
    searchBar.className = 'search-bar';
    searchBar.innerHTML = `
      <input type="text" class="search-bar__input" placeholder="Введите адрес..." value="Караганда" />
      <button class="btn btn-primary" id="search-btn">Найти</button>
      <div id="search-suggestions" class="address-suggestions"></div>
    `;
    container.appendChild(searchBar);

    // ===== D3: Фильтр по играм =====
    const gameFilterBar = document.createElement('div');
    gameFilterBar.className = 'game-filter';
    gameFilterBar.innerHTML = '<div class="game-filter__label">🎮</div>';
    container.appendChild(gameFilterBar);

    let selectedGameId = preselectedGameId ? parseInt(preselectedGameId, 10) : null;

    try {
      const gamesData = await api.getGames();
      (gamesData.games || []).forEach(g => {
        const chip = document.createElement('button');
        chip.className = 'game-chip';
        chip.innerHTML = `${g.icon} ${g.name}`;
        if (selectedGameId === g.id) {
          chip.classList.add('game-chip--active');
        }
        chip.addEventListener('click', async () => {
          if (selectedGameId === g.id) {
            // Снимаем фильтр
            selectedGameId = null;
            gameFilterBar.querySelectorAll('.game-chip').forEach(c => c.classList.remove('game-chip--active'));
            // Перезагружаем без фильтра
            map.destroy();
            loadClubs(container, navigate, coords);
          } else {
            selectedGameId = g.id;
            gameFilterBar.querySelectorAll('.game-chip').forEach(c => c.classList.remove('game-chip--active'));
            chip.classList.add('game-chip--active');
            // Фильтруем клубы
            const filteredData = await api.getClubsByGame(g.id, coords.lat, coords.lng);
            updateClubList(listContainer, map, filteredData.clubs || [], navigate, coords);
          }
        });
        gameFilterBar.appendChild(chip);
      });
    } catch { /* игры недоступны */ }

    // Если есть preselectedGameId — применяем фильтр
    if (selectedGameId) {
      try {
        const filteredData = await api.getClubsByGame(selectedGameId, coords.lat, coords.lng);
        data.clubs = filteredData.clubs || [];
      } catch { /* ignore */ }
    }

    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    container.appendChild(mapContainer);

    const listContainer = document.createElement('div');
    listContainer.id = 'club-list';
    container.appendChild(listContainer);

    const map = new ClubMap('map-container', coords);
    map.addUserMarker(coords.lat, coords.lng);

    const clubs = data.clubs || [];
    updateClubList(listContainer, map, clubs, navigate, coords);

    const searchInput = searchBar.querySelector('.search-bar__input');
    const searchSuggestions = searchBar.querySelector('#search-suggestions');
    let debounceTimer;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = searchInput.value.trim();
      if (q.length < 3) { searchSuggestions.innerHTML = ''; return; }
      debounceTimer = setTimeout(async () => {
        try {
          const results = await geocode(q);
          searchSuggestions.innerHTML = results
            .slice(0, 3)
            .map((r) => `<div class="suggestion-item" data-lat="${r.lat}" data-lng="${r.lng}">${r.displayName}</div>`)
            .join('');
          searchSuggestions.querySelectorAll('.suggestion-item').forEach((el) => {
            el.addEventListener('click', () => {
              map.destroy();
              container.innerHTML = '';
              loadClubs(container, navigate, { lat: parseFloat(el.dataset.lat), lng: parseFloat(el.dataset.lng) });
            });
          });
        } catch { /* ignore */ }
      }, 400);
    });

    searchBar.querySelector('#search-btn').addEventListener('click', async () => {
      const q = searchInput.value.trim();
      if (!q) return;
      try {
        const results = await geocode(q);
        if (results.length > 0) {
          map.destroy();
          container.innerHTML = '';
          loadClubs(container, navigate, { lat: results[0].lat, lng: results[0].lng });
        }
      } catch { /* ignore */ }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchBar.querySelector('#search-btn').click();
      }
    });
  } catch (err) {
    showNetworkError(container, navigate, coords);
  }
}

export async function renderMapPage(container, navigate) {
  container.innerHTML = '<div class="loading">Определяем местоположение...</div>';

  // Проверяем параметр game_id в URL
  const params = new URLSearchParams(window.location.search);
  const gameIdParam = params.get('game_id');

  const pos = await tryGeolocation();

  if (pos) {
    loadClubs(container, navigate, pos, gameIdParam);
  } else {
    container.innerHTML = '';
    showLocationModal(container, navigate);
  }
}
