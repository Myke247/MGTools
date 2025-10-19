/**
 * CORE ORCHESTRATOR
 * ====================================================================================
 * Pure wiring layer that connects controllers with UI via event bus
 *
 * @module controller/app-core
 *
 * This orchestrator provides:
 * - Lifecycle management (start/stop) for child controllers
 * - Event bus wiring between controllers and UI modules
 * - No side effects on import (all wiring happens in start())
 *
 * Dependencies: Logger (M2), Controllers (M10/M11/M12), UI event bus (M7)
 *
 * GUARANTEES:
 * - Zero DOM manipulation
 * - Zero direct network calls
 * - Zero UnifiedState writes
 * - Zero timers owned here (child controllers own their timers)
 * - No side effects on import (pure module)
 */

import { Logger } from '../core/logging.js';
import { RoomPollController } from './room-poll.js';
import { scheduleVersionChecks } from './version-check.js';
import { ShortcutsController } from './shortcuts.js';
import { on, off, emit } from '../ui/ui.js';

/* ====================================================================================
 * PRIVATE STATE
 * ====================================================================================
 */

let isRunning = false;
let eventHandlers = [];
let versionScheduler = null;
let roomPollController = null;
let shortcutsController = null;

/* ====================================================================================
 * EVENT WIRING HELPERS
 * ====================================================================================
 */

/**
 * Wire room poll events to connection status UI (M9)
 * @private
 */
function wireRoomPollEvents() {
  const handlers = [];

  // Forward 'open' event to connection UI
  const onOpen = (data) => {
    Logger.debug('APP_CORE', 'Room poll opened, forwarding to UI');
    emit('conn:open', data);
  };

  // Forward 'update' event to connection UI
  const onUpdate = (data) => {
    Logger.debug('APP_CORE', `Room poll update: ${data.players} players`);
    emit('conn:update', data);
  };

  // Forward 'error' event to connection UI
  const onError = (data) => {
    Logger.warn('APP_CORE', `Room poll error: ${data.err.message}`);
    emit('conn:error', data);
  };

  // Forward 'close' event to connection UI
  const onClose = (data) => {
    Logger.debug('APP_CORE', 'Room poll closed');
    emit('conn:close', data);
  };

  // Register handlers
  RoomPollController.on('open', onOpen);
  RoomPollController.on('update', onUpdate);
  RoomPollController.on('error', onError);
  RoomPollController.on('close', onClose);

  // Store for cleanup
  handlers.push(
    { controller: RoomPollController, event: 'open', handler: onOpen },
    { controller: RoomPollController, event: 'update', handler: onUpdate },
    { controller: RoomPollController, event: 'error', handler: onError },
    { controller: RoomPollController, event: 'close', handler: onClose }
  );

  return handlers;
}

/**
 * Wire shortcut events to UI actions (M7)
 * @private
 */
function wireShortcutEvents() {
  const handlers = [];

  // Listen for shortcut actions emitted by shortcuts controller
  // The shortcuts controller already emits to the UI event bus,
  // so we just need to log them here for debugging
  const onShortcutHelp = (data) => {
    Logger.debug('APP_CORE', `Shortcut help requested: ${data.description}`);
  };

  const onShortcutAction = (data) => {
    Logger.debug('APP_CORE', `Shortcut action: ${data.name}`);
  };

  // Subscribe to shortcut events from UI bus
  on('shortcut:show-help', onShortcutHelp);
  on('shortcut:*', onShortcutAction); // Catch-all for debugging

  // Store for cleanup
  handlers.push(
    { bus: 'ui', event: 'shortcut:show-help', handler: onShortcutHelp },
    { bus: 'ui', event: 'shortcut:*', handler: onShortcutAction }
  );

  return handlers;
}

/* ====================================================================================
 * ORCHESTRATOR API
 * ====================================================================================
 */

/**
 * Core Application Orchestrator
 * Wires controllers and UI without side effects on import
 * @namespace AppCore
 */
export const AppCore = {
  /**
   * Start the application core
   * @param {Object} opts - Configuration options
   * @param {string} opts.roomIdOrCode - Room ID or code to monitor
   * @param {number} [opts.pollIntervalMs=5000] - Room poll interval in milliseconds
   * @param {number} [opts.jitterMs=500] - Jitter for poll interval
   * @param {HTMLElement} [opts.versionBadgeRoot=null] - Container for version badge UI
   * @param {boolean} [opts.isLiveBeta=false] - Whether running on Live Beta branch
   * @param {Function} [opts.onSwitchBranch=null] - Callback when user switches branch
   * @param {number} [opts.versionCheckIntervalMs=3600000] - Version check interval (1 hour default)
   */
  start(opts = {}) {
    if (isRunning) {
      Logger.warn('APP_CORE', 'Core already running');
      return;
    }

    Logger.info('APP_CORE', 'Starting application core...');

    const {
      roomIdOrCode = null,
      pollIntervalMs = 5000,
      jitterMs = 500,
      versionBadgeRoot = null,
      isLiveBeta = false,
      onSwitchBranch = null,
      versionCheckIntervalMs = 60 * 60 * 1000 // 1 hour
    } = opts;

    // 1) Start VersionController (M10)
    if (versionBadgeRoot) {
      Logger.debug('APP_CORE', 'Starting version check scheduler');
      versionScheduler = scheduleVersionChecks({
        badgeRoot: versionBadgeRoot,
        intervalMs: versionCheckIntervalMs,
        isLiveBeta,
        onSwitchBranch,
        runImmediately: true
      });
      versionScheduler.start();
    } else {
      Logger.warn('APP_CORE', 'No version badge root provided, skipping version checks');
    }

    // 2) Start RoomPollController (M12)
    if (roomIdOrCode) {
      Logger.debug('APP_CORE', `Starting room poll for: ${roomIdOrCode}`);
      const roomHandlers = wireRoomPollEvents();
      eventHandlers.push(...roomHandlers);

      RoomPollController.start({
        roomIdOrCode,
        intervalMs: pollIntervalMs,
        jitterMs
      });
      roomPollController = RoomPollController;
    } else {
      Logger.warn('APP_CORE', 'No room ID provided, skipping room poll');
    }

    // 3) Start Shortcuts (M11)
    Logger.debug('APP_CORE', 'Starting shortcuts controller');
    shortcutsController = new ShortcutsController();
    shortcutsController.start();

    const shortcutHandlers = wireShortcutEvents();
    eventHandlers.push(...shortcutHandlers);

    isRunning = true;
    Logger.info('APP_CORE', 'Application core started successfully');
  },

  /**
   * Stop the application core
   */
  stop() {
    if (!isRunning) {
      Logger.warn('APP_CORE', 'Core not running');
      return;
    }

    Logger.info('APP_CORE', 'Stopping application core...');

    // Stop version scheduler
    if (versionScheduler) {
      Logger.debug('APP_CORE', 'Stopping version scheduler');
      versionScheduler.stop();
      versionScheduler = null;
    }

    // Stop room poll controller
    if (roomPollController) {
      Logger.debug('APP_CORE', 'Stopping room poll controller');
      roomPollController.stop();
      roomPollController = null;
    }

    // Stop shortcuts controller
    if (shortcutsController) {
      Logger.debug('APP_CORE', 'Stopping shortcuts controller');
      shortcutsController.stop();
      shortcutsController = null;
    }

    // Unregister all event handlers
    eventHandlers.forEach(({ controller, bus, event, handler }) => {
      if (controller && controller.off) {
        Logger.debug('APP_CORE', `Unregistering controller event: ${event}`);
        controller.off(event, handler);
      } else if (bus === 'ui') {
        Logger.debug('APP_CORE', `Unregistering UI bus event: ${event}`);
        off(event, handler);
      }
    });
    eventHandlers = [];

    isRunning = false;
    Logger.info('APP_CORE', 'Application core stopped');
  },

  /**
   * Get current status
   * @returns {Object} - { isRunning, controllers }
   */
  getStatus() {
    return {
      isRunning,
      controllers: {
        versionScheduler: versionScheduler !== null,
        roomPoll: roomPollController !== null,
        shortcuts: shortcutsController !== null
      },
      eventHandlerCount: eventHandlers.length
    };
  }
};
