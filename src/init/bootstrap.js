/**
 * BOOTSTRAP MODULE
 * ====================================================================================
 * Side-effect-free initialization layer for MGTools
 *
 * @module init/bootstrap
 *
 * This module provides:
 * - bootstrapStart(opts) - Initialize and start the application
 * - bootstrapStop() - Cleanly shut down the application
 *
 * NO SIDE EFFECTS ON IMPORT:
 * - No timers created on import
 * - No DOM manipulation on import (except ensureStyles when called)
 * - No network calls on import
 * - All initialization happens explicitly in bootstrapStart()
 *
 * Dependencies: AppCore (M13), UI framework (M7), CONFIG (M2)
 *
 * GUARANTEES:
 * - Pure module (no side effects on import)
 * - Clean lifecycle (start/stop)
 * - All timers/network/DOM live inside child modules
 */

import { AppCore } from '../controller/app-core.js';
import { ensureStyles, on, off, emit } from '../ui/ui.js';
import { CONFIG } from '../utils/constants.js';
import { Logger } from '../core/logging.js';

/* ====================================================================================
 * PRIVATE STATE
 * ====================================================================================
 */

let isBootstrapped = false;
let eventHandlers = [];
let bootstrapConfig = null;

/* ====================================================================================
 * BOOTSTRAP API
 * ====================================================================================
 */

/**
 * Start the MGTools application
 * @param {Object} opts - Bootstrap configuration
 * @param {string} opts.roomIdOrCode - Room ID or code to monitor
 * @param {number} [opts.pollIntervalMs=5000] - Room poll interval
 * @param {number} [opts.jitterMs=500] - Poll jitter
 * @param {HTMLElement} [opts.versionBadgeRoot=null] - Version badge container
 * @param {boolean} [opts.isLiveBeta=false] - Live Beta branch flag
 * @param {Function} [opts.onSwitchBranch=null] - Branch switch callback
 * @param {number} [opts.versionCheckIntervalMs=3600000] - Version check interval (1 hour)
 */
export function bootstrapStart(opts = {}) {
  if (isBootstrapped) {
    Logger.warn('BOOTSTRAP', 'Application already bootstrapped');
    return;
  }

  Logger.info('BOOTSTRAP', 'Starting MGTools application...');

  // Store config for later reference
  bootstrapConfig = { ...opts };

  // 1) Ensure UI styles are injected
  Logger.debug('BOOTSTRAP', 'Ensuring UI styles');
  ensureStyles();

  // 2) Set up minimal top-level UI event wiring
  Logger.debug('BOOTSTRAP', 'Wiring top-level UI events');
  wireTopLevelEvents();

  // 3) Start AppCore (which will start all child controllers)
  Logger.debug('BOOTSTRAP', 'Starting AppCore');
  AppCore.start(opts);

  isBootstrapped = true;
  Logger.info('BOOTSTRAP', 'MGTools application started successfully');

  // Emit bootstrap complete event
  emit('bootstrap:complete', {
    timestamp: Date.now(),
    config: bootstrapConfig
  });
}

/**
 * Stop the MGTools application
 */
export function bootstrapStop() {
  if (!isBootstrapped) {
    Logger.warn('BOOTSTRAP', 'Application not bootstrapped');
    return;
  }

  Logger.info('BOOTSTRAP', 'Stopping MGTools application...');

  // Emit bootstrap stopping event
  emit('bootstrap:stopping', {
    timestamp: Date.now()
  });

  // 1) Stop AppCore (which will stop all child controllers)
  Logger.debug('BOOTSTRAP', 'Stopping AppCore');
  AppCore.stop();

  // 2) Remove top-level UI event handlers
  Logger.debug('BOOTSTRAP', 'Removing top-level event handlers');
  unwireTopLevelEvents();

  // 3) Clear local refs
  bootstrapConfig = null;
  isBootstrapped = false;

  Logger.info('BOOTSTRAP', 'MGTools application stopped');
}

/**
 * Get bootstrap status
 * @returns {Object} - { isBootstrapped, config, appCoreStatus }
 */
export function getBootstrapStatus() {
  return {
    isBootstrapped,
    config: bootstrapConfig ? { ...bootstrapConfig } : null,
    appCoreStatus: AppCore.getStatus()
  };
}

/* ====================================================================================
 * TOP-LEVEL EVENT WIRING
 * ====================================================================================
 */

/**
 * Wire top-level UI events
 * These are minimal cross-cutting concerns that don't belong in any specific module
 * @private
 */
function wireTopLevelEvents() {
  // Example: Log important UI events for debugging
  const onToastCreated = data => {
    Logger.debug('BOOTSTRAP', `Toast created: ${data.type} - "${data.message}"`);
  };

  const onShortcutTriggered = data => {
    Logger.debug('BOOTSTRAP', `Shortcut triggered: ${data.name}`);
  };

  // Subscribe to UI events
  on('toast:created', onToastCreated);
  on('shortcut:*', onShortcutTriggered);

  // Store handlers for cleanup
  eventHandlers.push(
    { event: 'toast:created', handler: onToastCreated },
    { event: 'shortcut:*', handler: onShortcutTriggered }
  );

  Logger.debug('BOOTSTRAP', `Wired ${eventHandlers.length} top-level event handlers`);
}

/**
 * Unwire top-level UI events
 * @private
 */
function unwireTopLevelEvents() {
  eventHandlers.forEach(({ event, handler }) => {
    off(event, handler);
  });
  eventHandlers = [];

  Logger.debug('BOOTSTRAP', 'Unwired all top-level event handlers');
}

/* ====================================================================================
 * MODULE INITIALIZATION
 * ====================================================================================
 */

// NO SIDE EFFECTS ON IMPORT
// This module is pure - all initialization happens in bootstrapStart()

Logger.info('BOOTSTRAP', 'Bootstrap module loaded (no side effects)');
