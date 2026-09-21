export const auth = {
  async login() { throw new Error('Authentication is not configured yet.'); },
  async register() { throw new Error('Authentication is not configured yet.'); },
  async logout() {},
  getCurrentUser() { return null; },
  onAuthStateChanged(callback) { callback(null); return () => {}; }
};
