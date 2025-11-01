/**
 * Enhanced WebSocket Auto-Reconnect System Module
 * Patches native WebSocket to provide robust auto-reconnection with exponential backoff
 *
 * Features:
 * - Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 15s, 15s)
 * - Version detection (code 4710) with auto-refresh
 * - Platform-aware reload strategies (Discord, iframe, mobile)
 * - Network state monitoring (online/offline detection)
 * - Visual feedback with toast notifications
 * - Compatibility mode integration (document.hidden override)
 *
 * @module WebSocketManager
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/**
 * Configuration object for WebSocket reconnection behavior
 * @typedef {object} WebSocketConfig
 * @property {number} maxAttempts - Maximum reconnection attempts (default: 6)
 * @property {number} heartbeatInterval - Heartbeat check interval in ms (not used in current impl)
 * @property {boolean} enableToasts - Show visual toast notifications (default: true)
 * @property {boolean} enableNetworkListeners - Monitor online/offline events (default: true)
 */

/**
 * Initialize enhanced WebSocket auto-reconnect system
 * Patches the native WebSocket constructor to add automatic reconnection with exponential backoff
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object to patch
 * @param {Document} dependencies.document - Document object for DOM operations
 * @param {Navigator} dependencies.navigator - Navigator object for platform detection
 * @param {object} dependencies.CompatibilityMode - Compatibility mode flags object
 * @param {Function} dependencies.productionLog - Production log function
 * @param {Function} dependencies.productionWarn - Production warning function
 * @param {Function} dependencies.productionError - Production error function
 * @param {Function} dependencies.logInfo - Info log function
 * @param {Function} dependencies.logWarn - Warning log function
 * @param {WebSocketConfig} config - Configuration options
 * @returns {void}
 */
export function initializeWebSocketReconnect(dependencies = {}, config = {}) {
  const {
    window: win = typeof window !== 'undefined' ? window : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null,
    CompatibilityMode = null,
    productionLog = console.log.bind(console),
    productionWarn = console.warn.bind(console),
    productionError = console.error.bind(console),
    logInfo = console.log.bind(console),
    logWarn = console.warn.bind(console)
  } = dependencies;

  const { maxAttempts = 6, enableToasts = true, enableNetworkListeners = true } = config;

  if (!win || !doc || !nav) {
    productionWarn('[WebSocket] Missing required dependencies - skipping initialization');
    return;
  }

  const Native = win.WebSocket;
  if (!Native || Native.__mgtoolsPatched) {
    productionWarn('[WebSocket] Already patched or WebSocket not available');
    return; // Prevent double-patching
  }

  // Module state
  let attempts = 0;
  let reconnectTimer = null;
  let _userNotified = false; // Tracked for potential future use

  // Platform detection for context-aware reconnection
  const isDiscord = /discord|overlay|electron/i.test(nav.userAgent) || !!(win.DiscordNative || win.__discordApp);
  const isIframe = win !== win.top;
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(nav.userAgent);

  // ==================== DOCUMENT.HIDDEN OVERRIDE FOR COMPAT MODE ====================
  // The game checks document.hidden and refuses to reconnect when hidden
  // In compat mode (Discord/managed devices), we override this to always return false
  if (CompatibilityMode && CompatibilityMode.flags && CompatibilityMode.flags.wsReconnectWhenHidden) {
    try {
      const originalDescriptor =
        Object.getOwnPropertyDescriptor(doc.constructor.prototype, 'hidden') ||
        Object.getOwnPropertyDescriptor(doc, 'hidden');

      if (originalDescriptor && originalDescriptor.get) {
        Object.defineProperty(doc, 'hidden', {
          get: function () {
            // Always return false in compat mode to allow reconnection
            return false;
          },
          configurable: true
        });

        logInfo('COMPAT-WS', 'Overrode document.hidden to enable reconnection in hidden state');
      }

      // Also patch visibilityState
      const originalVisibilityDescriptor =
        Object.getOwnPropertyDescriptor(doc.constructor.prototype, 'visibilityState') ||
        Object.getOwnPropertyDescriptor(doc, 'visibilityState');

      if (originalVisibilityDescriptor && originalVisibilityDescriptor.get) {
        Object.defineProperty(doc, 'visibilityState', {
          get: function () {
            // Always return 'visible' in compat mode
            return 'visible';
          },
          configurable: true
        });
      }
    } catch (e) {
      logWarn('COMPAT-WS', 'Failed to override document.hidden', e);
    }
  }

  // Add CSS animations for toasts
  if (enableToasts) {
    const style = doc.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    doc.head.appendChild(style);
  }

  /**
   * Show visual toast notification for reconnection attempts
   * @param {number} attemptNum - Current attempt number
   * @param {number} maxAttemptsLimit - Maximum attempts allowed
   * @param {number} nextWait - Time until next attempt in milliseconds
   */
  function showReconnectToast(attemptNum, maxAttemptsLimit, nextWait) {
    if (!enableToasts) return;

    let toast = doc.getElementById('mga-reconnect-toast');

    const toastHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">🔄</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Connection Lost</div>
          <div style="font-size: 12px; opacity: 0.9;">
            Reconnecting... (${attemptNum}/${maxAttemptsLimit})
            <br>Next attempt in ${Math.round(nextWait / 1000)}s
          </div>
        </div>
      </div>
    `;

    if (!toast) {
      toast = doc.createElement('div');
      toast.id = 'mga-reconnect-toast';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
        color: white; padding: 16px 24px; border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px; font-weight: 500; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out; max-width: 320px; pointer-events: auto;
      `;
      doc.body.appendChild(toast);
    }

    toast.innerHTML = toastHTML;
    _userNotified = true;

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Show failure toast when max reconnection attempts are exceeded
   */
  function showFailureToast() {
    if (!enableToasts) return;

    const failToast = doc.createElement('div');
    failToast.id = 'mga-reconnect-fail-toast';
    failToast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95));
      color: white; padding: 16px 24px; border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); max-width: 320px;
    `;

    failToast.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">⚠️ Connection Failed</div>
      <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px;">
        Unable to reconnect after ${maxAttempts} attempts
      </div>
      <button onclick="location.reload()" style="
        background: white; color: #dc2626; border: none; padding: 8px 16px;
        border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; font-size: 13px;
      ">Reload Page</button>
    `;

    doc.body.appendChild(failToast);
  }

  /**
   * Show update available toast with countdown for version 4710 (version expired)
   * @param {number} countdownSeconds - Countdown duration in seconds
   */
  function showUpdateToast(countdownSeconds) {
    if (!enableToasts) return;

    let countdown = countdownSeconds;
    const updateToast = doc.createElement('div');
    updateToast.id = 'mga-update-toast';
    updateToast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
      color: white; padding: 16px 24px; border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease-out; max-width: 320px;
    `;

    updateToast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">🎮</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Game Update Available</div>
          <div style="font-size: 12px; opacity: 0.9;">
            Refreshing in <span id="mga-countdown">${countdown}</span>s...
          </div>
        </div>
      </div>
    `;

    doc.body.appendChild(updateToast);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      countdown -= 1;
      const countdownEl = doc.getElementById('mga-countdown');
      if (countdownEl) {
        countdownEl.textContent = countdown;
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    return countdownInterval;
  }

  /**
   * Schedule page reload with exponential backoff or immediate for version updates
   * @param {number} code - WebSocket close code
   * @param {boolean} wasClean - Whether connection closed cleanly
   * @param {string} reason - Close reason string
   */
  function scheduleReload(code, wasClean, reason) {
    // Handle version expired (4710) immediately - auto-refresh with notification
    if (code === 4710 || /version.?expired/i.test(reason || '')) {
      productionLog('[WebSocket] Version expired detected (code 4710) - auto-refreshing in 5 seconds');

      // Show friendly update notification with countdown
      showUpdateToast(5);

      // Auto-refresh after 5 seconds
      setTimeout(() => {
        productionLog('[WebSocket] Auto-refreshing for game update...');
        win.location.reload();
      }, 5000);

      return;
    }

    // Only reconnect for 1006 (abnormal) or if reason mentions update
    if (wasClean && code !== 1006 && !/update/i.test(reason || '')) {
      productionLog('[WebSocket] Clean close detected - no reconnect needed');
      return;
    }

    // Clear any existing timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Check if max attempts exceeded
    if (attempts >= maxAttempts) {
      productionWarn(`[WebSocket] Max reconnect attempts (${maxAttempts}) reached - manual refresh required`);
      showFailureToast();
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 15s, 15s
    const wait = Math.min(1000 * Math.pow(2, attempts), 15000);
    attempts += 1;

    productionLog(
      `[WebSocket] Reconnect attempt ${attempts}/${maxAttempts} in ${wait}ms (code: ${code}, reason: "${reason || 'none'}")`
    );

    // Show user feedback
    showReconnectToast(attempts, maxAttempts, wait);

    reconnectTimer = setTimeout(() => {
      try {
        // Add timestamp to force reload and bypass cache
        const u = new URL(win.location.href);
        u.searchParams.set('_mgtp', Date.now().toString());

        // Platform-specific reload strategy
        if (isDiscord && isIframe) {
          // Discord iframe: try parent reload first
          try {
            win.parent.location.reload();
          } catch (e) {
            // Fallback to self reload if parent is inaccessible
            win.location.replace(u.toString());
          }
        } else if (isMobile) {
          // Mobile: hard reload to clear any cached state
          win.location.href = u.toString();
        } else {
          // Desktop: use replace to avoid back button issues
          win.location.replace(u.toString());
        }
      } catch (e) {
        productionError('[WebSocket] Reload failed:', e);
        // Last resort: simple reload
        win.location.href = win.location.href + '?_t=' + Date.now();
      }
    }, wait);
  }

  // ==================== WEBSOCKET PATCHING ====================
  // Patch WebSocket constructor to add auto-reconnect behavior
  win.WebSocket = function (url, protocols) {
    const ws = new Native(url, protocols);

    // Reset attempts on successful connection
    ws.addEventListener('open', () => {
      productionLog('[WebSocket] Connection established successfully');
      attempts = 0;
      _userNotified = false;

      // Remove any reconnect toasts
      const toast = doc.getElementById('mga-reconnect-toast');
      if (toast) toast.remove();
    });

    // Handle close events
    ws.addEventListener('close', e => {
      productionLog(`[WebSocket] Closed - Code: ${e.code}, Clean: ${e.wasClean}, Reason: "${e.reason || 'none'}"`);
      scheduleReload(e.code, e.wasClean, e.reason);
    });

    // Handle errors
    ws.addEventListener('error', e => {
      productionError('[WebSocket] Error detected:', e);
    });

    return ws;
  };

  // Preserve prototype and static properties
  Object.setPrototypeOf(win.WebSocket, Native);
  win.WebSocket.prototype = Native.prototype;
  win.WebSocket.__mgtoolsPatched = true;

  // ==================== NETWORK STATE LISTENERS ====================
  // Network state listeners for smarter reconnection
  if (enableNetworkListeners) {
    win.addEventListener('online', () => {
      productionLog('[Network] Back online - reducing reconnect attempt counter');
      attempts = Math.max(0, attempts - 2); // Give extra chances when network returns

      // If we have a toast, update it
      const toast = doc.getElementById('mga-reconnect-toast');
      if (toast) toast.remove();
    });

    win.addEventListener('offline', () => {
      productionWarn('[Network] Offline detected - pausing reconnection attempts');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Update toast if visible
      const toast = doc.getElementById('mga-reconnect-toast');
      if (toast && enableToasts) {
        toast.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">📡</div>
            <div>
              <div style="font-weight: 600; margin-bottom: 4px;">Network Offline</div>
              <div style="font-size: 12px; opacity: 0.9;">
                Reconnection paused<br>Waiting for network...
              </div>
            </div>
          </div>
        `;
      }
    });
  }

  productionLog('✅ [WebSocket] Enhanced auto-reconnect system initialized (max attempts: ' + maxAttempts + ')');
}

/**
 * Check if WebSocket is already patched by MGTools
 * @param {Window} win - Window object to check
 * @returns {boolean} True if already patched
 */
export function isWebSocketPatched(win = typeof window !== 'undefined' ? window : null) {
  if (!win || !win.WebSocket) return false;
  return !!win.WebSocket.__mgtoolsPatched;
}

/**
 * Get current reconnection state (for debugging/testing)
 * NOTE: This function cannot access internal state as it's encapsulated in the IIFE
 * This is a placeholder for future state exposure if needed
 *
 * @returns {object} State object with limited information
 */
export function getReconnectionState() {
  return {
    note: 'Reconnection state is encapsulated and not exposed',
    isPatched: isWebSocketPatched()
  };
}
