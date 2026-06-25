import { api } from '../api/client.js';
import { authStore } from '../api/authStore.js';

export function renderLoginPage(container, navigate) {
  if (authStore.isLoggedIn) {
    navigate('/profile');
    return;
  }

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Вход</h2>
        <p class="auth-subtitle">Войди, чтобы управлять бронями</p>
        <div class="auth-tabs">
          <button class="auth-tab auth-tab--active" data-method="email">Email</button>
          <button class="auth-tab" data-method="phone">Телефон</button>
        </div>
        <form id="login-form">
          <label>
            Email
            <input type="email" name="email" placeholder="email@example.com" required autocomplete="email" />
          </label>
          <label>
            Пароль
            <input type="password" name="password" placeholder="••••••" required autocomplete="current-password" minlength="6" />
          </label>
          <button type="submit" class="btn btn-primary btn-block">Войти</button>
        </form>
        <p class="auth-switch">Нет аккаунта? <a href="#" id="to-register">Зарегистрироваться</a></p>
      </div>
    </div>
  `;

  container.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Вхожу...';

    try {
      const formData = new FormData(form);
      const result = await api.login({
        email: formData.get('email'),
        password: formData.get('password'),
      });
      authStore.login(result.token, result.user);
      navigate('/profile');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Войти';
      alert(err.message);
    }
  });

  container.querySelector('#to-register').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/register');
  });

  // Переключение между Email и Телефон
  const tabs = container.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.method === 'phone') {
        navigate('/phone-login');
      }
    });
  });
}
