/**
 * ROOM POLLING CONTROLLER
 * ====================================================================================
 * Event-driven controller that polls room info at intervals with backoff/jitter
 *
 * @module controller/room-poll
 *
 * This controller provides:
 * - Interval-based room polling using M5 network helpers
 * - Exponential backoff on errors with configurable max
 * - Jitter for distributed load
 * - Event emission for UI (M9) to subscribe
 *
 * Dependencies: Logger (M2), Network helpers (M5)
 *
 * GUARANTEES:
 * - Zero DOM manipulation
 * - Zero UnifiedState writes
 * - Zero direct network calls (only uses M5 exports)
 * - Owns and cleans up all timers
 */

import { Logger } from '../core/logging.js';
import { fetchRoomInfo, parsePlayerCount } from '../core/network.js';

/* ====================================================================================
 * PRIVATE STATE
 * ====================================================================================
 */

let pollTimer = null;
let currentBackoffMs = 0;
let config = {
  roomIdOrCode: null,
  intervalMs: 5000,
  jitterMs: 500,
  maxBackoffMs: 30000
};

let eventHandlers = {
  open: [],
  update: [],
  error: [],
  close: []
};

let isRunning = false;
let hasOpenedOnce = false;

/* ====================================================================================
 * EVENT HELPERS
 * ====================================================================================
 */

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
        Logger.error('ROOM_POLL', `Event handler error for ${event}`, e);
      }
    });
  }
}

/* ====================================================================================
 * BACKOFF & JITTER
 * ====================================================================================
 */

/**
 * Add random jitter to base interval
 * @private
 * @param {number} baseMs - Base interval in milliseconds
 * @param {number} jitterMs - Max jitter in milliseconds
 * @returns {number} - Jittered interval
 */
function applyJitter(baseMs, jitterMs) {
  const jitter = Math.random() * jitterMs;
  return baseMs + jitter;
}

/**
 * Calculate next backoff delay (exponential)
 * @private
 * @param {number} currentMs - Current backoff in milliseconds
 * @param {number} maxMs - Maximum backoff in milliseconds
 * @returns {number} - Next backoff delay
 */
function calculateBackoff(currentMs, maxMs) {
  if (currentMs === 0) {
    return 1000; // Start with 1s
  }
  const next = Math.min(currentMs * 2, maxMs);
  return next;
}

/**
 * Reset backoff to zero (on successful fetch)
 * @private
 */
function resetBackoff() {
  currentBackoffMs = 0;
}

/* ====================================================================================
 * POLLING LOGIC
 * ====================================================================================
 */

/**
 * Execute one poll cycle
 * @private
 */
async function pollOnce() {
  if (!isRunning || !config.roomIdOrCode) {
    return;
  }

  try {
    const result = await fetchRoomInfo(config.roomIdOrCode);

    if (!result.ok) {
      throw new Error(`Room API returned status ${result.status}`);
    }

    const players = parsePlayerCount(result.parsed);
    const data = result.parsed;
    const ts = Date.now();

    // Emit 'open' event only once on first successful fetch
    if (!hasOpenedOnce) {
      hasOpenedOnce = true;
      emit('open', { ts, players, data });
      Logger.info('ROOM_POLL', `Opened connection for room: ${config.roomIdOrCode}`);
    }

    // Emit 'update' event on every success
    emit('update', { players, data, ts });
    Logger.debug('ROOM_POLL', `Update received: ${players} players`);

    // Reset backoff on success
    resetBackoff();

    // Schedule next poll with jitter
    const nextInterval = applyJitter(config.intervalMs, config.jitterMs);
    pollTimer = setTimeout(() => pollOnce(), nextInterval);

  } catch (err) {
    Logger.warn('ROOM_POLL', `Poll failed: ${err.message}`);

    const ts = Date.now();
    emit('error', { err, ts });

    // Calculate backoff
    currentBackoffMs = calculateBackoff(currentBackoffMs, config.maxBackoffMs);
    Logger.info('ROOM_POLL', `Backing off for ${currentBackoffMs}ms`);

    // Schedule retry with backoff + jitter
    const retryDelay = applyJitter(currentBackoffMs, config.jitterMs);
    pollTimer = setTimeout(() => pollOnce(), retryDelay);
  }
}

/* ====================================================================================
 * CONTROLLER API
 * ====================================================================================
 */

/**
 * Room Polling Controller
 * Event-driven polling with backoff and jitter
 * @namespace RoomPollController
 */
export const RoomPollController = {
  /**
   * Start polling for room updates
   * @param {Object} opts - Configuration options
   * @param {string} opts.roomIdOrCode - Room ID or code to poll
   * @param {number} [opts.intervalMs=5000] - Poll interval in milliseconds
   * @param {number} [opts.jitterMs=500] - Max jitter to add to intervals
   * @param {number} [opts.maxBackoffMs=30000] - Maximum backoff delay
   */
  start(opts) {
    if (!opts.roomIdOrCode) {
      throw new Error('roomIdOrCode is required');
    }

    // Stop any existing poll
    this.stop();

    // Update config
    config = {
      roomIdOrCode: opts.roomIdOrCode,
      intervalMs: opts.intervalMs ?? 5000,
      jitterMs: opts.jitterMs ?? 500,
      maxBackoffMs: opts.maxBackoffMs ?? 30000
    };

    // Reset state
    isRunning = true;
    hasOpenedOnce = false;
    currentBackoffMs = 0;

    Logger.info('ROOM_POLL', `Starting poll for room: ${config.roomIdOrCode} (interval: ${config.intervalMs}ms, jitter: ${config.jitterMs}ms)`);

    // Start polling immediately
    pollOnce();
  },

  /**
   * Stop polling and clear timers
   */
  stop() {
    if (!isRunning) {
      return;
    }

    isRunning = false;

    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }

    Logger.info('ROOM_POLL', 'Stopped polling');
    emit('close', { ts: Date.now() });

    // Reset state
    hasOpenedOnce = false;
    currentBackoffMs = 0;
  },

  /**
   * Register event handler
   * @param {string} event - Event name ('open', 'update', 'error', 'close')
   * @param {Function} handler - Event handler function
   *
   * Event data:
   * - open: { ts, players, data }
   * - update: { players, data, ts }
   * - error: { err, ts }
   * - close: { ts }
   */
  on(event, handler) {
    if (eventHandlers[event]) {
      eventHandlers[event].push(handler);
    } else {
      Logger.warn('ROOM_POLL', `Unknown event: ${event}`);
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
   * Get current status
   * @returns {Object} - { isRunning, roomIdOrCode, intervalMs, backoffMs }
   */
  getStatus() {
    return {
      isRunning,
      roomIdOrCode: config.roomIdOrCode,
      intervalMs: config.intervalMs,
      backoffMs: currentBackoffMs
    };
  }
};
