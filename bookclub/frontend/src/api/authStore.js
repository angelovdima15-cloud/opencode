const TOKEN_KEY = 'cofou_token';
const USER_KEY = 'cofou_user';

let currentUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
let currentToken = localStorage.getItem(TOKEN_KEY);

export const authStore = {
  get token() {
    return currentToken;
  },

  get user() {
    return currentUser;
  },

  get isLoggedIn() {
    return !!currentToken && !!currentUser;
  },

  login(token, user) {
    currentToken = token;
    currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  updateUser(user) {
    currentUser = user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setUser(user) {
    this.updateUser(user);
  },
};
