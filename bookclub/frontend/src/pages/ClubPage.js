import { api } from '../api/client.js';
import { SeatMap } from '../components/SeatMap.js';
import { BookingForm } from '../components/BookingForm.js';
import { formatPrice } from '../utils/format.js';
import { authStore } from '../api/authStore.js';

export async function renderClubPage(container, navigate, clubId) {
  container.innerHTML = '<div class="loading">Загрузка...</div>';

  try {
    const [club, reviewsData, gamesData] = await Promise.all([
      api.getClub(clubId),
      api.getReviews(clubId).catch(() => ({ reviews: [], stats: { count: 0, avg_rating: 0 } })),
      api.getGames().catch(() => ({ games: [] })),
    ]);
    const workstations = await api.getWorkstations(clubId);

    // Check if favorited
    let isFavorited = false;
    if (authStore.isLoggedIn) {
      try {
        const favData = await api.getFavorites();
        isFavorited = (favData.favorites || []).some(f => f.id === club.id);
      } catch {}
    }

    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'club-header';
    header.innerHTML = `
      <button class="btn-back" onclick="history.back()">← Назад</button>
      <div style="display:flex;align-items:center;gap:8px;margin:8px 0">
        <h2 style="flex:1;margin:0">${club.name}</h2>
        ${authStore.isLoggedIn ? `
          <button class="btn btn-sm ${isFavorited ? 'btn-primary' : 'btn-outline'}" id="btn-fav">
            ${isFavorited ? '★ В избранном' : '☆ В избранное'}
          </button>
        ` : ''}
      </div>
      <p class="club-header__address">📍 ${club.address}</p>
      <p class="club-header__phone">📞 ${club.phone || 'Не указан'}</p>
      <p class="club-header__schedule">🕐 ${club.schedule}</p>
    `;
    container.appendChild(header);

    // ===== D5: Баннер акции над ценами =====
    if (club.promos && club.promos.length > 0) {
      const promoBanner = document.createElement('div');
      promoBanner.className = 'promo-banner';
      const promo = club.promos[0]; // первая активная акция
      promoBanner.innerHTML = `
        <div class="promo-banner__icon">🔥</div>
        <div class="promo-banner__content">
          <div class="promo-banner__title">${promo.title}</div>
          <div class="promo-banner__desc">${promo.description}</div>
          ${promo.expires_at ? `<div class="promo-banner__expires">До ${new Date(promo.expires_at).toLocaleDateString('ru-RU')}</div>` : ''}
        </div>
        ${promo.discount ? `<div class="promo-banner__discount">-${promo.discount}%</div>` : ''}
      `;
      container.appendChild(promoBanner);
    }

    // Статистика (цены + свободные ПК)
    const statsDiv = document.createElement('div');
    statsDiv.className = 'club-header__stats';
    statsDiv.innerHTML = `
      <span class="stat">🖥️ ${club.free_pcs}/${club.total_pcs} свободно</span>
      <span class="stat">💰 от ${formatPrice(club.price_per_hour)}</span>
    `;
    container.appendChild(statsDiv);

    // ===== D4: Секция описания =====
    if (club.description) {
      const descSection = document.createElement('section');
      descSection.className = 'section club-description';
      descSection.innerHTML = `
        <h3 class="section__subtitle">О клубе</h3>
        <p class="club-description__text">${club.description}</p>
      `;
      container.appendChild(descSection);
    }

    // ===== D4: Секция удобств (amenities) =====
    if (club.amenities && club.amenities.length > 0) {
      const amenityIcons = {
        'WiFi': '📶',
        'Кондиционер': '❄️',
        'Еда': '🍕',
        'Бар': '🍕',
        'Свои девайсы': '🖱️',
        'Гардероб': '🧥',
        'Стримерская': '🎙️',
        'Санузел': '🚻',
        'VIP-зона': '👑',
        'Турнирная зона': '🏆',
        'PS5': '🎮',
        'VR': '🥽',
      };

      const amenitiesSection = document.createElement('section');
      amenitiesSection.className = 'section club-amenities';
      amenitiesSection.innerHTML = `
        <h3 class="section__subtitle">Удобства</h3>
        <div class="amenities-grid">
          ${club.amenities.map(a => `
            <div class="amenity-item">
              <span class="amenity-item__icon">${amenityIcons[a] || '✅'}</span>
              <span class="amenity-item__label">${a}</span>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(amenitiesSection);
    }

    // ===== D4: Секция характеристик ПК =====
    if (club.pc_specs && club.pc_specs.length > 0) {
      const specsSection = document.createElement('section');
      specsSection.className = 'section club-pc-specs';
      specsSection.innerHTML = `
        <h3 class="section__subtitle">🖥️ Характеристики ПК</h3>
        <div class="pc-specs-table-wrapper">
          <table class="pc-specs-table">
            <thead>
              <tr>
                <th>Зона</th>
                <th>Процессор</th>
                <th>Видеокарта</th>
                <th>ОЗУ</th>
                <th>Монитор</th>
                <th>Периферия</th>
                <th>Цена/час</th>
              </tr>
            </thead>
            <tbody>
              ${club.pc_specs.map(s => `
                <tr>
                  <td><strong>${s.zone_name}</strong></td>
                  <td>${s.cpu || '—'}</td>
                  <td>${s.gpu || '—'}</td>
                  <td>${s.ram || '—'}</td>
                  <td>${s.monitor || '—'}</td>
                  <td>${s.peripherals || '—'}</td>
                  <td>${s.price_per_hour ? formatPrice(s.price_per_hour) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      container.appendChild(specsSection);
    }

    // Favorite button handler
    const favBtn = container.querySelector('#btn-fav');
    if (favBtn) {
      favBtn.addEventListener('click', async () => {
        try {
          const res = await api.toggleFavorite(club.id);
          favBtn.className = `btn btn-sm ${res.favorited ? 'btn-primary' : 'btn-outline'}`;
          favBtn.textContent = res.favorited ? '★ В избранном' : '☆ В избранное';
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const zonesDiv = document.createElement('div');
    zonesDiv.className = 'club-zones';
    if (club.zones && club.zones.length > 0) {
      zonesDiv.innerHTML = club.zones
        .map(
          (z) =>
            `<div class="zone-card">
              <span class="zone-name">${z.name}</span>
              <span class="zone-stats">${z.free_pcs != null ? z.free_pcs : '?'}/${z.pcs_count}</span>
              ${z.price_per_hour ? `<span class="zone-price">${formatPrice(z.price_per_hour)}</span>` : ''}
            </div>`
        )
        .join('');
    } else {
      zonesDiv.innerHTML = '<div class="zone-card"><span class="zone-name">Стандартный</span><span class="zone-stats">—</span></div>';
    }
    container.appendChild(zonesDiv);

    const seatMapSection = document.createElement('div');
    seatMapSection.className = 'seatmap-section';
    seatMapSection.innerHTML = '<h3>Схема зала</h3>';
    container.appendChild(seatMapSection);

    const seatMap = new SeatMap(seatMapSection, workstations.workstations, (ws) => {
      if (ws.status === 'free') {
        bookingForm.show(ws);
      }
    });

    const bookingForm = new BookingForm(container, async (formData) => {
      try {
        const result = await api.createBooking(formData);
        navigate(`/booking/${result.booking_id}`);
      } catch (err) {
        alert('Ошибка при бронировании: ' + err.message);
      }
    });

    // ===== D3: Блок популярных игр =====
    const gamesSection = document.createElement('section');
    gamesSection.className = 'section club-games';
    const clubsGamesList = gamesData.games.filter(g =>
      (club.game_ids || [1, 2, 3, 4, 5]).includes(g.id)
    );
    gamesSection.innerHTML = `
      <h3 class="section__title" style="text-align:left;margin-bottom:12px;font-size:18px">🎮 Популярные игры</h3>
      <div class="club-games__list">
        ${(clubsGamesList.length > 0 ? clubsGamesList : gamesData.games.slice(0, 6)).map(g => `
          <span class="club-game-tag">${g.icon} ${g.name}</span>
        `).join('')}
      </div>
    `;
    container.appendChild(gamesSection);

    // ===== D2: Блок отзывов =====
    const reviewsSection = document.createElement('section');
    reviewsSection.className = 'section club-reviews';
    reviewsSection.innerHTML = `
      <h3 class="section__title" style="text-align:left;margin-bottom:12px;font-size:18px">
        ⭐ Отзывы
        <span class="reviews-stats">${reviewsData.stats.count > 0 ? `★ ${reviewsData.stats.avg_rating} (${reviewsData.stats.count})` : ''}</span>
      </h3>
      <div id="reviews-container"></div>
    `;
    container.appendChild(reviewsSection);

    const reviewsContainer = reviewsSection.querySelector('#reviews-container');

    // Форма отзыва (только для авторизованных)
    if (authStore.isLoggedIn) {
      // Ищем отзыв текущего пользователя
      const myReview = reviewsData.reviews.find(r => r.user_id === authStore.user.id);

      const reviewForm = document.createElement('div');
      reviewForm.className = 'review-form';
      reviewForm.innerHTML = `
        <div class="review-form__stars" id="review-stars">
          ${[1,2,3,4,5].map(i => `<span class="star ${myReview && myReview.rating >= i ? 'star--active' : ''}" data-rating="${i}">★</span>`).join('')}
        </div>
        <textarea class="review-form__text" id="review-text" placeholder="Напиши отзыв..." rows="3">${myReview ? myReview.text : ''}</textarea>
        <div class="review-form__actions">
          <button class="btn btn-primary btn-sm" id="btn-submit-review">${myReview ? 'Обновить отзыв' : 'Оставить отзыв'}</button>
          ${myReview ? `<button class="btn btn-danger btn-sm" id="btn-delete-review">Удалить</button>` : ''}
        </div>
      `;
      reviewsContainer.appendChild(reviewForm);

      // Обработчик звёзд
      let currentRating = myReview ? myReview.rating : 0;
      const stars = reviewForm.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          currentRating = parseInt(star.dataset.rating);
          stars.forEach(s => s.classList.toggle('star--active', parseInt(s.dataset.rating) <= currentRating));
        });
      });

      // Отправка отзыва
      reviewForm.querySelector('#btn-submit-review').addEventListener('click', async () => {
        if (currentRating === 0) {
          alert('Выбери рейтинг');
          return;
        }
        const text = reviewForm.querySelector('#review-text').value.trim();
        try {
          const result = await api.postReview(clubId, { rating: currentRating, text });
          // Обновляем блок отзывов
          const updated = await api.getReviews(clubId);
          renderReviewList(reviewsContainer, updated.reviews, authStore.user.id, clubId, api);
        } catch (err) {
          alert('Ошибка: ' + err.message);
        }
      });

      // Удаление отзыва
      const deleteBtn = reviewForm.querySelector('#btn-delete-review');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Удалить отзыв?')) return;
          try {
            await api.deleteReview(clubId);
            const updated = await api.getReviews(clubId);
            renderReviewList(reviewsContainer, updated.reviews, authStore.user.id, clubId, api);
          } catch (err) {
            alert('Ошибка: ' + err.message);
          }
        });
      }
    }

    // Список отзывов
    renderReviewList(reviewsContainer, reviewsData.reviews, authStore.user?.id, clubId, api);

  } catch (err) {
    container.innerHTML = `
      <div class="error-page">
        <h2>😕</h2>
        <p>${err.message}</p>
        <button onclick="history.back()" class="btn">Назад</button>
      </div>
    `;
  }
}

function renderReviewList(container, reviews, currentUserId, clubId, api) {
  // Удаляем старый список, оставляя форму
  const existingList = container.querySelector('.review-list');
  if (existingList) existingList.remove();

  if (reviews.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'reviews-empty';
    emptyMsg.textContent = 'Пока нет отзывов. Будь первым!';
    container.appendChild(emptyMsg);
    return;
  }

  const list = document.createElement('div');
  list.className = 'review-list';
  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-card__header">
        <span class="review-card__user">${r.user_name}</span>
        <span class="review-card__stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
      </div>
      ${r.text ? `<p class="review-card__text">${r.text}</p>` : ''}
      <span class="review-card__date">${new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
    </div>
  `).join('');
  container.appendChild(list);
}
