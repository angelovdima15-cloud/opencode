import { api } from '../api/client.js';
import { authStore } from '../api/authStore.js';

export function renderRegisterPage(container, navigate) {
  if (authStore.isLoggedIn) {
    navigate('/profile');
    return;
  }

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Регистрация</h2>
        <p class="auth-subtitle">Создай аккаунт — бронируй без телефона</p>
        <form id="register-form">
          <label>
            Имя *
            <input type="text" name="name" placeholder="Азамат" required />
          </label>
          <label>
            Email *
            <input type="email" name="email" placeholder="email@example.com" required autocomplete="email" />
          </label>
          <label>
            Телефон
            <input type="tel" name="phone" placeholder="+7 700 123 45 67" />
          </label>
          <label>
            Пароль *
            <input type="password" name="password" placeholder="минимум 6 символов" required autocomplete="new-password" minlength="6" />
          </label>
          <button type="submit" class="btn btn-primary btn-block">Создать аккаунт</button>
        </form>
        <p class="auth-switch">Уже есть аккаунт? <a href="#" id="to-login">Войти</a></p>
      </div>
    </div>
  `;

  container.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Регистрирую...';

    try {
      const formData = new FormData(form);
      const result = await api.register({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
        phone: formData.get('phone') || undefined,
      });
      authStore.login(result.token, result.user);
      navigate('/profile');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Создать аккаунт';
      alert(err.message);
    }
  });

  container.querySelector('#to-login').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/login');
  });
}
