export const userService = {
  async getProfile() { return null; },
  async updateProfile() { throw new Error('User persistence is not configured yet.'); },
  async getLikedSongIds() { return []; },
  async likeSong() { throw new Error('User persistence is not configured yet.'); },
  async unlikeSong() { throw new Error('User persistence is not configured yet.'); },
  async savePreferences() { throw new Error('User persistence is not configured yet.'); }
};
