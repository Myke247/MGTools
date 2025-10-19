/**
 * NETWORK MODULE
 * ====================================================================================
 * Pure transport layer for HTTP requests and WebSocket connections
 *
 * @module core/network
 *
 * This module provides:
 * - CSP-aware HTTP wrapper (GM_xmlhttpRequest for cross-origin when needed)
 * - Room API helpers (pure functions, no state mutations)
 * - Version metadata fetcher (no DOM, returns data only)
 * - WebSocket manager with reconnection logic (event-based, no UI)
 *
 * Dependencies: CONFIG, Logger, CompatibilityMode
 *
 * GUARANTEES:
 * - Zero DOM manipulation
 * - Zero UnifiedState access
 * - Pure transport functions (return data, emit events)
 */

import { CONFIG } from '../utils/constants.js';
import { Logger } from './logging.js';
import { CompatibilityMode } from './compat.js';

/* ====================================================================================
 * CORE HTTP WRAPPER
 * ====================================================================================
 */

/**
 * Core HTTP request wrapper with CSP bypass support
 * Uses GM_xmlhttpRequest for cross-origin requests when CSP bypass is needed
 * @namespace Network
 */
export const Network = {
  /**
   * Make HTTP request with CSP-aware path selection
   * @param {string} url - Request URL
   * @param {Object} opts - Request options
   * @param {string} [opts.method='GET'] - HTTP method
   * @param {Object} [opts.headers={}] - Request headers
   * @param {*} [opts.body] - Request body
   * @param {number} [opts.timeout=10000] - Timeout in ms
   * @returns {Promise<Response>} - Fetch-compatible response object
   */
  async request(url, opts = {}) {
    const method = opts.method || 'GET';
    const headers = opts.headers || {};
    const body = opts.body;
    const timeout = opts.timeout || 10000;

    // Determine if we need CSP bypass
    const isCrossOrigin = !url.startsWith(location.origin);
    const needsBypass = CompatibilityMode.flags.bypassCSPNetworking &&
                        isCrossOrigin &&
                        typeof GM_xmlhttpRequest === 'function';

    if (needsBypass) {
      Logger.debug('NETWORK', `Using GM_xmlhttpRequest for: ${url}`);

      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          url,
          method,
          headers,
          data: body,
          responseType: 'text',
          timeout,
          onload: response => {
            resolve({
              ok: response.status >= 200 && response.status < 300,
              status: response.status,
              statusText: response.statusText,
              headers: {
                get: name => {
                  const match = response.responseHeaders.match(
                    new RegExp(`^${name}:\\s*(.*)$`, 'mi')
                  );
                  return match ? match[1] : null;
                }
              },
              text: () => Promise.resolve(response.responseText),
              json: () => Promise.resolve(JSON.parse(response.responseText))
            });
          },
          onerror: error => reject(new Error(error.statusText || 'Network error')),
          ontimeout: () => reject(new Error('Request timeout'))
        });
      });
    } else {
      // Use standard fetch
      return fetch(url, {
        method,
        headers,
        body,
        signal: opts.signal
      });
    }
  },

  /**
   * Convenience GET method
   * @param {string} url - Request URL
   * @param {Object} opts - Request options
   * @returns {Promise<Response>}
   */
  get(url, opts = {}) {
    return this.request(url, { ...opts, method: 'GET' });
  },

  /**
   * Convenience POST method
   * @param {string} url - Request URL
   * @param {*} body - Request body
   * @param {Object} opts - Request options
   * @returns {Promise<Response>}
   */
  post(url, body, opts = {}) {
    return this.request(url, { ...opts, method: 'POST', body });
  }
};

/* ====================================================================================
 * ROOM API HELPERS
 * ====================================================================================
 */

/**
 * Build room API URL with fallback support
 * @param {string} idOrCode - Room ID or code
 * @param {string} [endpoint='info'] - API endpoint
 * @returns {string} - Full API URL
 */
export function apiV1RoomInfoUrl(idOrCode, endpoint = 'info') {
  // Use primary base URL (fallback handled at call site)
  const base = CONFIG.API.BASE_URL_PRIMARY;
  return `${base}/api/rooms/${encodeURIComponent(idOrCode)}/${endpoint}`;
}

/**
 * Fetch room information (pure network, no state mutations)
 * @param {string} idOrCode - Room ID or code
 * @param {Object} opts - Options
 * @param {string} [opts.endpoint='info'] - API endpoint
 * @param {number} [opts.timeoutMs=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} - { status, ok, body, parsed }
 */
export async function fetchRoomInfo(idOrCode, opts = {}) {
  const endpoint = opts.endpoint ?? 'info';
  const timeoutMs = opts.timeoutMs ?? 10000;
  const url = apiV1RoomInfoUrl(idOrCode, endpoint);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await Network.request(url, {
      method: 'GET',
      signal: controller.signal
    });

    const body = await res.text();
    const parsed = res.ok ? JSON.parse(body) : undefined;

    return {
      status: res.status,
      ok: res.ok,
      body,
      parsed
    };
  } catch (err) {
    throw new Error(`Room endpoint fetch failed: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse player count from various API response formats
 * @param {Object} data - API response data
 * @returns {number} - Player count (0 if invalid)
 */
export function parsePlayerCount(data) {
  if (!data) return 0;

  // Try multiple field names used by different API versions
  const count = data?.numPlayers ??
                data?.players?.online ??
                data?.players?.count ??
                data?.online ??
                data?.count ??
                data?.playerCount ??
                0;

  return Math.max(0, Number(count) || 0);
}

/* ====================================================================================
 * VERSION METADATA FETCHER (NO DOM)
 * ====================================================================================
 */

/**
 * Fetch latest version metadata from GitHub (no DOM manipulation)
 * @returns {Promise<Object>} - { version: string, branch: string }
 */
export async function fetchLatestVersionMeta() {
  // Determine branch from CONFIG
  const IS_LIVE_BETA = CONFIG.VERSION.CURRENT.includes('beta') ||
                       (typeof GM_info !== 'undefined' &&
                        GM_info?.script?.updateURL?.includes('Live-Beta'));

  const branch = IS_LIVE_BETA ? 'Live-Beta' : 'main';
  const branchName = IS_LIVE_BETA ? 'Live Beta' : 'Stable';

  // Try multiple URLs with cache-busting
  const cacheBust = `?t=${Date.now()}`;
  const urls = [
    `${CONFIG.VERSION.CHECK_URL_STABLE.replace('/main/', `/${branch}/`)}${cacheBust}`,
    `${CONFIG.VERSION.CHECK_URL_STABLE}${cacheBust}`, // fallback to main
    'https://api.github.com/repos/Myke247/MGTools/contents/MGTools.user.js' // API endpoint
  ];

  for (let i = 0; i < urls.length; i++) {
    try {
      const url = urls[i];
      const isGitHubAPI = url.includes('api.github.com');

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        headers: isGitHubAPI ? { 'Accept': 'application/vnd.github.v3.raw' } : {}
      });

      if (!response.ok) {
        if (i === urls.length - 1) {
          throw new Error(`All URLs failed. Last: ${response.status}`);
        }
        continue; // Try next URL
      }

      const text = await response.text();

      // Parse @version tag from userscript
      const match = text.match(/@version\s+([\d.]+)/);
      if (match) {
        return {
          version: match[1],
          branch: branchName
        };
      } else {
        throw new Error('Version not found in response');
      }
    } catch (e) {
      if (i === urls.length - 1) {
        throw new Error(`Failed to fetch version metadata: ${e.message}`);
      }
      // Continue to next URL
    }
  }

  throw new Error('All version fetch attempts failed');
}

/* ====================================================================================
 * WEBSOCKET MANAGER (EVENT-BASED, NO UI)
 * ====================================================================================
 */

/**
 * WebSocket Manager with reconnection logic
 * Provides transport-level WebSocket management with exponential backoff
 * Emits events for UI to handle (no DOM manipulation)
 * @namespace WebSocketManager
 */
export const WebSocketManager = (() => {
  const Native = typeof window !== 'undefined' ? window.WebSocket : null;

  let socket = null;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let eventHandlers = {
    open: [],
    close: [],
    error: [],
    message: [],
    reconnect: []
  };

  const MAX_ATTEMPTS = 6;
  const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 32000];

  /**
   * Calculate exponential backoff delay
   * @private
   * @param {number} attempt - Current attempt number
   * @returns {number} - Delay in milliseconds
   */
  function getBackoffDelay(attempt) {
    const index = Math.min(attempt, BACKOFF_MS.length - 1);
    return BACKOFF_MS[index];
  }

  /**
   * Emit event to registered handlers
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  function emit(event, data) {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          Logger.error('WEBSOCKET', `Event handler error for ${event}`, e);
        }
      });
    }
  }

  /**
   * Handle WebSocket close event with reconnection logic
   * @private
   * @param {CloseEvent} event - Close event
   */
  function handleClose(event) {
    const { code, wasClean, reason } = event;

    Logger.info('WEBSOCKET', `Closed - Code: ${code}, Clean: ${wasClean}, Reason: "${reason || 'none'}"`);
    emit('close', { code, wasClean, reason });

    // Handle version expired (4710) - emit special event, no reconnect
    if (code === 4710 || /version.?expired/i.test(reason || '')) {
      Logger.info('WEBSOCKET', 'Version expired detected (code 4710)');
      emit('reconnect', { type: 'version_expired', code, reason });
      return;
    }

    // Only reconnect for abnormal closures
    if (wasClean && code !== 1006 && !/update/i.test(reason || '')) {
      Logger.info('WEBSOCKET', 'Clean close detected - no reconnect needed');
      return;
    }

    // Check max attempts
    if (reconnectAttempts >= MAX_ATTEMPTS) {
      Logger.warn('WEBSOCKET', `Max reconnect attempts (${MAX_ATTEMPTS}) reached`);
      emit('reconnect', { type: 'max_attempts', attempts: reconnectAttempts });
      return;
    }

    // Schedule reconnection with exponential backoff
    reconnectAttempts++;
    const delay = getBackoffDelay(reconnectAttempts);

    Logger.info('WEBSOCKET', `Reconnect attempt ${reconnectAttempts}/${MAX_ATTEMPTS} in ${delay}ms (code: ${code})`);
    emit('reconnect', {
      type: 'scheduled',
      attempt: reconnectAttempts,
      maxAttempts: MAX_ATTEMPTS,
      delayMs: delay,
      code,
      reason
    });

    reconnectTimer = setTimeout(() => {
      Logger.info('WEBSOCKET', `Attempting reconnect (${reconnectAttempts}/${MAX_ATTEMPTS})`);
      // Note: Actual reconnection would be handled by game code
      // This manager just provides the hooks and events
    }, delay);
  }

  /**
   * Handle WebSocket open event
   * @private
   */
  function handleOpen() {
    Logger.info('WEBSOCKET', 'Connection established successfully');
    reconnectAttempts = 0; // Reset counter on successful connection

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    emit('open', {});
  }

  /**
   * Handle WebSocket error event
   * @private
   * @param {Event} event - Error event
   */
  function handleError(event) {
    Logger.error('WEBSOCKET', 'Error detected', event);
    emit('error', event);
  }

  /**
   * Handle WebSocket message event
   * @private
   * @param {MessageEvent} event - Message event
   */
  function handleMessage(event) {
    emit('message', event.data);
  }

  // Public API
  return {
    /**
     * Connect to WebSocket with auto-reconnect
     * @param {string} url - WebSocket URL
     * @param {Object} opts - Options
     * @param {Array<string>} [opts.protocols] - WebSocket protocols
     * @returns {WebSocket} - WebSocket instance
     */
    connect(url, opts = {}) {
      if (!Native) {
        throw new Error('WebSocket not available');
      }

      socket = new Native(url, opts.protocols);

      socket.addEventListener('open', handleOpen);
      socket.addEventListener('close', handleClose);
      socket.addEventListener('error', handleError);
      socket.addEventListener('message', handleMessage);

      Logger.info('WEBSOCKET', `Connecting to ${url}`);
      return socket;
    },

    /**
     * Send data via WebSocket
     * @param {*} data - Data to send
     */
    send(data) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        Logger.warn('WEBSOCKET', 'Cannot send - socket not open');
        return false;
      }

      socket.send(data);
      return true;
    },

    /**
     * Close WebSocket connection
     * @param {number} [code=1000] - Close code
     * @param {string} [reason=''] - Close reason
     */
    close(code = 1000, reason = '') {
      if (socket) {
        socket.close(code, reason);
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    },

    /**
     * Register event handler
     * @param {string} event - Event name ('open', 'close', 'error', 'message', 'reconnect')
     * @param {Function} handler - Event handler function
     */
    on(event, handler) {
      if (eventHandlers[event]) {
        eventHandlers[event].push(handler);
      }
    },

    /**
     * Unregister event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    off(event, handler) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
    },

    /**
     * Get current connection status
     * @returns {Object} - { connected: boolean, attempts: number }
     */
    getStatus() {
      return {
        connected: socket && socket.readyState === WebSocket.OPEN,
        attempts: reconnectAttempts,
        maxAttempts: MAX_ATTEMPTS
      };
    }
  };
})();

/* ====================================================================================
 * GLOBAL EXPORTS (for IIFE/window access)
 * ====================================================================================
 * In the bundled version, these will be assigned to window object for global access.
 * This will be handled by the main index.js entry point.
 *
 * The following will be available globally:
 * - window.Network
 * - window.apiV1RoomInfoUrl
 * - window.fetchRoomInfo
 * - window.parsePlayerCount
 * - window.fetchLatestVersionMeta
 * - window.WebSocketManager
 */
