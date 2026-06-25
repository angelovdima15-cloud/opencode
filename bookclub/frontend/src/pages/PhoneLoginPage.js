import { api } from '../api/client.js';
import { authStore } from '../api/authStore.js';

export function renderPhoneLoginPage(container, navigate) {
  if (authStore.isLoggedIn) {
    navigate('/profile');
    return;
  }

  let phone = '';

  function renderPhoneStep(errorMsg) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <h2>Вход по телефону</h2>
          <p class="auth-subtitle">Введи номер — придёт SMS с кодом</p>
          <form id="phone-form">
            <label>
              Номер телефона
              <input
                type="tel"
                name="phone"
                placeholder="+7 700 123 45 67"
                value="${phone}"
                required
                autocomplete="tel"
                inputmode="numeric"
              />
            </label>
            ${errorMsg ? `<p class="phone-login__error">${errorMsg}</p>` : ''}
            <button type="submit" class="btn btn-primary btn-block">
              Получить код
            </button>
          </form>
          <p class="auth-switch" style="margin-top:12px">
            <a href="#" id="back-to-email-login">← Войти по email</a>
          </p>
        </div>
      </div>
    `;

    const input = container.querySelector('input[name="phone"]');
    input.focus();

    container.querySelector('#phone-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');
      phone = form.querySelector('input[name="phone"]').value.trim();

      if (!phone || phone.replace(/[^+\d]/g, '').length < 8) {
        renderPhoneStep('Введите корректный номер телефона');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Отправляю...';

      try {
        await api.sendCode(phone);
        renderCodeStep();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Получить код';
        renderPhoneStep(err.message);
      }
    });

    container.querySelector('#back-to-email-login').addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/login');
    });
  }

  function renderCodeStep(errorMsg) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <h2>Введи код</h2>
          <p class="auth-subtitle">
            Код отправлен на <strong>${phone}</strong>
          </p>
          <form id="code-form">
            <label>
              Код из SMS
              <input
                type="text"
                name="code"
                placeholder="1234"
                maxlength="4"
                required
                autocomplete="one-time-code"
                inputmode="numeric"
                class="phone-login__code-input"
              />
            </label>
            ${errorMsg ? `<p class="phone-login__error">${errorMsg}</p>` : ''}
            <button type="submit" class="btn btn-primary btn-block">
              Войти
            </button>
          </form>
          <p class="auth-switch" style="margin-top:12px">
            <a href="#" id="back-to-phone">← Назад</a>
            &nbsp;·&nbsp;
            <a href="#" id="resend-code">Отправить снова</a>
          </p>
        </div>
      </div>
    `;

    const input = container.querySelector('input[name="code"]');
    input.focus();

    container.querySelector('#code-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');
      const code = form.querySelector('input[name="code"]').value.trim();

      if (!code || code.length !== 4) {
        renderCodeStep('Введите 4-значный код');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Вхожу...';

      try {
        const result = await api.loginByPhone(phone, code);
        authStore.login(result.token, result.user);
        navigate('/profile');
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Войти';
        renderCodeStep(err.message);
      }
    });

    container.querySelector('#back-to-phone').addEventListener('click', (e) => {
      e.preventDefault();
      renderPhoneStep();
    });

    container.querySelector('#resend-code').addEventListener('click', async (e) => {
      e.preventDefault();
      const link = e.target;
      link.textContent = 'Отправляю...';
      try {
        await api.sendCode(phone);
        link.textContent = 'Код отправлен ✓';
        setTimeout(() => { link.textContent = 'Отправить снова'; }, 3000);
      } catch {
        link.textContent = 'Ошибка, попробуйте ещё';
        setTimeout(() => { link.textContent = 'Отправить снова'; }, 3000);
      }
    });
  }

  renderPhoneStep();
}
