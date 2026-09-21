export const playlists = {
  async getMine() { return []; },
  async getById() { return null; },
  async create() { throw new Error('Playlist persistence is not configured yet.'); },
  async addTrack() { throw new Error('Playlist persistence is not configured yet.'); },
  async removeTrack() { throw new Error('Playlist persistence is not configured yet.'); },
  async delete() { throw new Error('Playlist persistence is not configured yet.'); }
};
