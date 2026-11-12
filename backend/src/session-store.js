'use strict';
const crypto = require('node:crypto');
class SessionStore {
  #rooms = new Map();
  create({ ownerId, offerId }) {
    const id = crypto.randomUUID();
    const room = {
      id, ownerId, offerId,
      createdAt: new Date().toISOString(),
      state: 'pending',
      acceptedViewer: null,
      pendingPeer: null,
      participants: new Map(),
      producers: new Map(),
      recordings: new Set(),
    };
    this.#rooms.set(id, room); return room;
  }
  get(id) { return this.#rooms.get(id) || null; }
  remove(id) { return this.#rooms.delete(id); }
  list() { return [...this.#rooms.values()]; }
  size() { return this.#rooms.size; }
}
module.exports = { SessionStore };
