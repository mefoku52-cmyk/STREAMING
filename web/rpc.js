'use strict';
class RpcClient {
  constructor(url, opts = {}) {
    this.url = url;
    this.next = 1;
    this.pending = new Map();
    this.ws = null;
    this.onEvent = null;
    this.onClose = null;
    this.onOpen = null;
    this.manualClose = false;
    this.connectTimeoutMs = opts.connectTimeoutMs || 7000;
  }
  connect() {
    return new Promise((resolve, reject) => {
      const ws = this.ws = new WebSocket(this.url);
      let settled = false;
      const done = (fn, arg) => { if (!settled) { settled = true; fn(arg); } };
      const to = setTimeout(() => { try { ws.close(); } catch {} done(reject, new Error('connect_timeout')); }, this.connectTimeoutMs);
      ws.onopen = () => {
        clearTimeout(to);
        done(resolve);
        if (this.onOpen) try { this.onOpen(); } catch (e) { console.error(e); }
      };
      ws.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (m.event && this.onEvent) { try { this.onEvent(m.event, m.data); } catch (err) { console.error('event handler error', err); } return; }
        const p = this.pending.get(m.id); if (!p) return;
        this.pending.delete(m.id);
        if (p.timeout) clearTimeout(p.timeout);
        m.ok ? p.resolve(m.data) : p.reject(new Error(m.error || 'rpc_failed'));
      };
      ws.onclose = (e) => {
        clearTimeout(to);
        const code = e && e.code;
        const err = new Error(code === 4401 ? 'auth_failed' : 'connection_closed');
        err.code = code;
        for (const p of this.pending.values()) { if (p.timeout) clearTimeout(p.timeout); p.reject(err); }
        this.pending.clear();
        if (!settled) done(reject, err);
        if (this.onClose) try { this.onClose({ code, reason: e && e.reason, manual: this.manualClose, error: err }); } catch (ex) { console.error(ex); }
      };
      ws.onerror = () => {};
    });
  }
  request(method, data = {}, opts = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error('not_connected'));
    const id = this.next++;
    const timeoutMs = opts.timeoutMs || 12000;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(`rpc_timeout:${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      try { this.ws.send(JSON.stringify({ id, method, data })); }
      catch (e) { clearTimeout(timeout); this.pending.delete(id); reject(e); }
    });
  }
  isOpen() { return !!(this.ws && this.ws.readyState === WebSocket.OPEN); }
  close() { this.manualClose = true; try { this.ws && this.ws.close(1000, 'client_close'); } catch {} }
}
window.CmepRpcClient = RpcClient;
