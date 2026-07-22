/**
 * @file Online/offline awareness. Emits app events + drives a persistent offline
 * toast; lets pages know when to re-attempt loads. No polling; uses native events.
 */

export class NetworkStatus {
  /** @param {{ bus: import('../core/EventBus.js').EventBus, toasts: any, announcer: any }} deps */
  constructor({ bus, toasts, announcer }) {
    let offlineDismiss = null;
    window.addEventListener('offline', () => {
      offlineDismiss = toasts.show('You’re offline. Some content may not load.', { type: 'warning', duration: 1e9 });
      bus.emit('net:offline');
    });
    window.addEventListener('online', () => {
      offlineDismiss?.(); offlineDismiss = null;
      announcer.announce('Back online');
      bus.emit('net:online');
    });
  }
}