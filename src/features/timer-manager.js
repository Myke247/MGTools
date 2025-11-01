/**
 * Enhanced Timer Manager Module
 * Provides centralized timer management with RAF-based main loop,
 * heartbeat monitoring, frozen timer detection, and persistence
 *
 * Features:
 * - RAF-based main loop for smooth timer execution
 * - Heartbeat monitoring to detect and recover from frozen timers
 * - Timer state persistence across sessions
 * - Lunar event calculations (Central Time)
 * - Shop restock timer tracking
 * - Performance-optimized DOM element caching
 *
 * @module TimerManager
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';


/**
 * TimerManager class for managing multiple timers with RAF-based execution
 *
 * @class
 */
export class TimerManager {
  /**
   * Create a TimerManager instance
   *
   * @param {object} dependencies - Injected dependencies
   * @param {object} dependencies.UnifiedState - Unified state management object
   * @param {Function} dependencies.MGA_saveJSON - Storage save function
   * @param {Function} dependencies.MGA_loadJSON - Storage load function
   * @param {Function} dependencies.debugLog - Debug logging function
   * @param {Function} dependencies.debugError - Error logging function
   * @param {Window} dependencies.window - Window object for RAF
   */
  constructor(dependencies = {}) {
    const {
      UnifiedState,
      MGA_saveJSON = () => {},
      MGA_loadJSON = () => ({}),
      debugLog = console.log.bind(console),
      debugError = console.error.bind(console),
      window: win = typeof window !== 'undefined' ? window : null
    } = dependencies;

    this.UnifiedState = UnifiedState;
    this.MGA_saveJSON = MGA_saveJSON;
    this.MGA_loadJSON = MGA_loadJSON;
    this.debugLog = debugLog;
    this.debugError = debugError;
    this.window = win;

    this.activeTimers = new Map();
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = 1000; // 1 second heartbeat
    this.frozenThreshold = 3000; // 3 seconds to consider frozen

    // Initialize active timers storage
    if (!this.UnifiedState.data.activeTimers) {
      this.UnifiedState.data.activeTimers = {};
    }

    this.loadPersistedTimers();
    this.startHeartbeat();

    this.debugLog('TIMER_MANAGER', 'TimerManager initialized', {
      heartbeatInterval: this.heartbeatInterval,
      frozenThreshold: this.frozenThreshold
    });
  }

  /**
   * Start a new timer
   *
   * @param {string} id - Unique timer identifier
   * @param {Function} callback - Function to call on timer tick
   * @param {number} interval - Timer interval in milliseconds (default: 1000)
   * @returns {object} Timer object
   */
  startTimer(id, callback, interval = 1000) {
    if (this.activeTimers.has(id)) {
      this.stopTimer(id);
    }

    const timer = {
      id,
      callback,
      interval,
      lastRun: Date.now(),
      running: true,
      frozen: false
    };

    this.activeTimers.set(id, timer);
    this.UnifiedState.data.activeTimers[id] = {
      interval,
      lastRun: timer.lastRun,
      running: true
    };

    this.saveTimerState();

    if (!this.isRunning) {
      this.startMainLoop();
    }

    this.debugLog('TIMER_MANAGER', `Timer started: ${id}`, { interval });
    return timer;
  }

  /**
   * Stop a timer by ID
   *
   * @param {string} id - Timer identifier
   */
  stopTimer(id) {
    if (this.activeTimers.has(id)) {
      this.activeTimers.delete(id);
      delete this.UnifiedState.data.activeTimers[id];
      this.saveTimerState();
      this.debugLog('TIMER_MANAGER', `Timer stopped: ${id}`);
    }
  }

  /**
   * Pause all active timers
   */
  pauseAll() {
    this.activeTimers.forEach((timer, id) => {
      const modifiedTimer = timer;
      modifiedTimer.running = false;
      this.UnifiedState.data.activeTimers[id].running = false;
    });
    this.saveTimerState();
    this.debugLog('TIMER_MANAGER', 'All timers paused');
  }

  /**
   * Resume all paused timers
   */
  resumeAll() {
    this.activeTimers.forEach((timer, id) => {
      const modifiedTimer = timer;
      modifiedTimer.running = true;
      modifiedTimer.lastRun = Date.now(); // Reset to prevent immediate execution
      this.UnifiedState.data.activeTimers[id].running = true;
      this.UnifiedState.data.activeTimers[id].lastRun = modifiedTimer.lastRun;
    });
    this.saveTimerState();
    this.debugLog('TIMER_MANAGER', 'All timers resumed');
  }

  /**
   * Start the RAF-based main loop
   */
  startMainLoop() {
    if (this.isRunning) return;

    this.isRunning = true;
    const loop = currentTime => {
      if (!this.isRunning || this.activeTimers.size === 0) {
        this.isRunning = false;
        this.animationFrameId = null;
        return;
      }

      this.processTimers(currentTime);
      this.animationFrameId = this.window.requestAnimationFrame(loop);
    };

    this.animationFrameId = this.window.requestAnimationFrame(loop);
    this.debugLog('TIMER_MANAGER', 'Main loop started');
  }

  /**
   * Process all active timers
   *
   * @param {number} currentTime - Current timestamp from RAF
   */
  processTimers(currentTime) {
    this.activeTimers.forEach((timer, id) => {
      if (!timer.running) return;

      const elapsed = currentTime - timer.lastRun;
      if (elapsed >= timer.interval) {
        try {
          timer.callback();
          const modifiedTimer = timer;
          modifiedTimer.lastRun = currentTime;
          modifiedTimer.frozen = false;
          this.UnifiedState.data.activeTimers[id].lastRun = modifiedTimer.lastRun;
        } catch (error) {
          this.debugError('TIMER_MANAGER', `Timer callback error for ${id}`, error);
        }
      }
    });
  }

  /**
   * Start heartbeat monitoring for frozen timer detection
   */
  startHeartbeat() {
    const heartbeat = () => {
      const now = Date.now();
      const timeSinceLastBeat = now - this.lastHeartbeat;

      // Detect if main loop is frozen
      if (this.isRunning && timeSinceLastBeat > this.frozenThreshold) {
        this.debugLog('TIMER_MANAGER', 'Heartbeat detected frozen timers, restarting main loop', {
          timeSinceLastBeat
        });
        this.restartMainLoop();
      }

      // Check individual timers for freezing
      this.checkForFrozenTimers(now);

      this.lastHeartbeat = now;
      setTimeout(heartbeat, this.heartbeatInterval);
    };

    // Start first heartbeat
    setTimeout(heartbeat, this.heartbeatInterval);
    this.debugLog('TIMER_MANAGER', 'Heartbeat monitor started');
  }

  /**
   * Check for frozen timers
   *
   * @param {number} now - Current timestamp
   */
  checkForFrozenTimers(now) {
    this.activeTimers.forEach((timer, id) => {
      if (!timer.running) return;

      const timeSinceLastRun = now - timer.lastRun;
      const expectedRuns = Math.floor(timeSinceLastRun / timer.interval);

      if (expectedRuns > 2 && !timer.frozen) {
        this.debugLog('TIMER_MANAGER', `Timer appears frozen: ${id}`, {
          timeSinceLastRun,
          expectedRuns,
          interval: timer.interval
        });
        const modifiedTimer = timer;
        modifiedTimer.frozen = true;
        this.restartTimer(id);
      }
    });
  }

  /**
   * Restart a frozen timer
   *
   * @param {string} id - Timer identifier
   */
  restartTimer(id) {
    const timer = this.activeTimers.get(id);
    if (timer) {
      timer.lastRun = Date.now();
      timer.frozen = false;
      this.debugLog('TIMER_MANAGER', `Timer restarted: ${id}`);
    }
  }

  /**
   * Restart the main loop
   */
  restartMainLoop() {
    if (this.animationFrameId) {
      this.window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
    setTimeout(() => this.startMainLoop(), 100); // Small delay before restart
  }

  /**
   * Save timer state to storage
   */
  saveTimerState() {
    try {
      this.MGA_saveJSON('MGA_timerStates', this.UnifiedState.data.activeTimers);
    } catch (error) {
      this.debugError('TIMER_MANAGER', 'Failed to save timer state', error);
    }
  }

  /**
   * Load persisted timers from storage
   */
  loadPersistedTimers() {
    try {
      const saved = this.MGA_loadJSON('MGA_timerStates', {});
      this.UnifiedState.data.activeTimers = { ...saved };
      this.debugLog('TIMER_MANAGER', 'Loaded persisted timer states', {
        count: Object.keys(saved).length
      });
    } catch (error) {
      this.debugError('TIMER_MANAGER', 'Failed to load persisted timers', error);
    }
  }

  /**
   * Get current timer manager status
   *
   * @returns {object} Status object with timer counts and state
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeCount: this.activeTimers.size,
      frozenCount: Array.from(this.activeTimers.values()).filter(t => t.frozen).length,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  /**
   * Destroy timer manager and cleanup
   */
  destroy() {
    // Stop all timers
    this.activeTimers.forEach((timer, id) => {
      this.stopTimer(id);
    });

    // Stop main loop
    if (this.animationFrameId) {
      this.window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isRunning = false;
    this.activeTimers.clear();
  }
}

/**
 * Initialize global timer manager
 *
 * @param {object} dependencies - Injected dependencies
 * @returns {TimerManager} Timer manager instance
 */
export function initializeTimerManager(dependencies = {}) {
  const timerManager = new TimerManager(dependencies);
  return timerManager;
}

/**
 * Update shop and lunar event timers
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - Unified state management object
 * @param {Function} dependencies.getSecondsToNextLunarEvent - Lunar event calculator
 * @param {Function} dependencies.updateTimerDisplay - Timer display update function
 */
export function updateTimers(dependencies = {}) {
  const {
    UnifiedState,
    getSecondsToNextLunarEvent = () => ({ secondsLeft: null }),
    updateTimerDisplay = () => {}
  } = dependencies;

  // Update restock timers
  const quinoaData = UnifiedState.atoms.quinoaData;
  if (quinoaData && quinoaData.shops) {
    UnifiedState.data.timers.seed = (quinoaData.shops.seed && quinoaData.shops.seed.secondsUntilRestock) || null;
    UnifiedState.data.timers.egg = (quinoaData.shops.egg && quinoaData.shops.egg.secondsUntilRestock) || null;
    UnifiedState.data.timers.tool = (quinoaData.shops.tool && quinoaData.shops.tool.secondsUntilRestock) || null;
  }

  // Calculate lunar event
  const lunarResult = getSecondsToNextLunarEvent();
  UnifiedState.data.timers.lunar = lunarResult.secondsLeft;

  // Always update timer display (needed for pop-out windows to work independently)
  updateTimerDisplay();
}

/**
 * Calculate seconds until next lunar event (Central Time)
 *
 * @returns {object} Object with secondsLeft and eventDateLocal
 */
export function getSecondsToNextLunarEvent() {
  const eventZone = 'America/Chicago';
  const lunarHours = [3, 7, 11, 15, 19, 23];

  // Get current time in Central Time Zone
  const now = new Date();
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: eventZone }));

  const currentHour = centralTime.getHours();
  const currentMin = centralTime.getMinutes();
  const currentSec = centralTime.getSeconds();

  // Find next lunar event hour
  let nextEventHour = null;
  for (let i = 0; i < lunarHours.length; i += 1) {
    const eventHour = lunarHours[i];
    if (eventHour > currentHour || (eventHour === currentHour && currentMin === 0 && currentSec === 0)) {
      nextEventHour = eventHour;
      break;
    }
  }

  // If no event found today, get first event tomorrow
  if (nextEventHour === null) {
    nextEventHour = lunarHours[0];
  }

  // Create next event date in Central Time
  const nextEvent = new Date(centralTime);
  nextEvent.setHours(nextEventHour, 0, 0, 0);

  // If event is in the past today, move to tomorrow
  if (nextEvent <= centralTime) {
    nextEvent.setDate(nextEvent.getDate() + 1);
  }

  // Calculate seconds until event (precise calculation without manual adjustment)
  const secondsLeft = Math.max(0, Math.floor((nextEvent.getTime() - centralTime.getTime()) / 1000));

  return {
    secondsLeft, // Precise calculation without manual adjustment
    eventDateLocal: nextEvent
  };
}

/**
 * Refresh timer element cache
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.cachedTimerElements - Cached timer elements object
 * @param {object} dependencies.UnifiedState - Unified state management object
 * @param {Document} dependencies.document - Document object
 * @param {Document} dependencies.targetDocument - Target document object
 */
export function refreshTimerElementCache(dependencies = {}) {
  const {
    cachedTimerElements,
    UnifiedState,
    document: doc = typeof document !== 'undefined' ? document : null,
    targetDocument = typeof document !== 'undefined' ? document : null
  } = dependencies;

  const timerIds = ['timer-seed', 'timer-egg', 'timer-tool', 'timer-lunar'];

  timerIds.forEach(id => {
    const elements = [];

    // Main window element
    const mainEl = doc.getElementById(id);
    if (mainEl) elements.push(mainEl);

    // Overlay elements
    UnifiedState.data.popouts.overlays.forEach(overlay => {
      if (overlay && doc.contains(overlay)) {
        const overlayEl = overlay.querySelector(`#${id}`);
        if (overlayEl) elements.push(overlayEl);
      }
    });

    // Target document elements (for popouts)
    try {
      const targetEls = targetDocument.querySelectorAll(`#${id}`);
      targetEls.forEach(el => {
        if (!elements.includes(el)) elements.push(el);
      });
    } catch (e) {
      // Ignore errors from closed windows
    }

    cachedTimerElements[id] = elements;
  });
}

/**
 * Update timer display in UI
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - Unified state management object
 * @param {object} dependencies.cachedTimerElements - Cached timer elements object
 * @param {number} dependencies.lastTimerElementCacheTime - Last cache time
 * @param {number} dependencies.TIMER_ELEMENT_CACHE_DURATION - Cache duration
 * @param {Document} dependencies.document - Document object
 * @param {Function} dependencies.refreshTimerElementCache - Cache refresh function
 * @returns {number} Updated cache time
 */
export function updateTimerDisplay(dependencies = {}) {
  const {
    UnifiedState,
    cachedTimerElements,
    lastTimerElementCacheTime = 0,
    TIMER_ELEMENT_CACHE_DURATION = 5000,
    document: doc = typeof document !== 'undefined' ? document : null,
    refreshTimerElementCache: refreshCacheFn = () => {}
  } = dependencies;

  const formatTime = seconds => {
    if (seconds == null) return '--:--';
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${String(ss).padStart(2, '0')}`;
  };

  const formatTimeHoursMinutes = seconds => {
    if (seconds == null) return '--:--';
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // BUGFIX: Initialize cache on first run or refresh if expired
  const now = Date.now();
  let newCacheTime = lastTimerElementCacheTime;
  if (lastTimerElementCacheTime === 0 || now - lastTimerElementCacheTime > TIMER_ELEMENT_CACHE_DURATION) {
    refreshCacheFn();
    newCacheTime = now;
  }

  // PERFORMANCE: Update cached elements only (no DOM queries in hot path)
  const updateTimerElement = (id, value) => {
    const formatter = id === 'timer-lunar' ? formatTimeHoursMinutes : formatTime;
    const formattedValue = formatter(value);

    const elements = cachedTimerElements[id] || [];

    // FALLBACK: If cache is empty, query directly (first run before cache populated)
    if (elements.length === 0) {
      const el = doc.getElementById(id);
      if (el) {
        el.textContent = formattedValue;
      }
      return;
    }

    elements.forEach(el => {
      // Verify element still in DOM before updating
      if (doc.contains(el)) {
        el.textContent = formattedValue;
      }
    });
  };

  // Update all timer types
  updateTimerElement('timer-seed', UnifiedState.data.timers.seed);
  updateTimerElement('timer-egg', UnifiedState.data.timers.egg);
  updateTimerElement('timer-tool', UnifiedState.data.timers.tool);
  updateTimerElement('timer-lunar', UnifiedState.data.timers.lunar);

  return newCacheTime;
}
