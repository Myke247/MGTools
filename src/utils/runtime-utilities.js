/**
 * Runtime Utilities Module
 * =========================
 * Collection of runtime helper functions used throughout the application.
 *
 * Systems included:
 * - Interval Management - Managed intervals for cleanup
 * - Popout Window Tracking - Track and cleanup popout windows
 * - DOM Query Cache - Performance optimization for DOM queries
 * - Game Communication - Safe message sending to game
 * - Atom Utilities - Jotai atom reading and hooking
 * - Slot Index Tracking - Advanced slot tracking with multi-harvest sync
 *
 * @module utils/runtime-utilities
 */

/* ============================================================================
 * INTERVAL MANAGEMENT
 * ============================================================================ */

/**
 * Create or replace a managed interval
 *
 * @param {string} name - Interval identifier
 * @param {Function} callback - Function to execute
 * @param {number} delay - Interval delay in milliseconds
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.debugLog] - Debug logging function
 * @returns {number} Interval ID
 *
 * @example
 * setManagedInterval('autoSave', () => save(), 30000, { UnifiedState });
 */
export function setManagedInterval(name, callback, delay, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    debugLog = console.log
  } = dependencies;

  // Clear existing interval if it exists
  if (UnifiedState?.intervals?.[name]) {
    clearInterval(UnifiedState.intervals[name]);
  }

  // Set new interval and store reference
  const intervalId = setInterval(callback, delay);
  if (UnifiedState && UnifiedState.intervals) {
    UnifiedState.intervals[name] = intervalId;
  }
  debugLog('PERFORMANCE', `Created managed interval: ${name} (${delay}ms)`);
  return intervalId;
}

/**
 * Clear a specific managed interval
 *
 * @param {string} name - Interval identifier
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.debugLog] - Debug logging function
 *
 * @example
 * clearManagedInterval('autoSave', { UnifiedState });
 */
export function clearManagedInterval(name, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    debugLog = console.log
  } = dependencies;

  if (UnifiedState?.intervals?.[name]) {
    clearInterval(UnifiedState.intervals[name]);
    UnifiedState.intervals[name] = null;
    debugLog('PERFORMANCE', `Cleared managed interval: ${name}`);
  }
}

/**
 * Clear all managed intervals
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.debugLog] - Debug logging function
 *
 * @example
 * clearAllManagedIntervals({ UnifiedState });
 */
export function clearAllManagedIntervals(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    debugLog = console.log
  } = dependencies;

  if (UnifiedState && UnifiedState.intervals) {
    Object.keys(UnifiedState.intervals).forEach(name => {
      clearManagedInterval(name, dependencies);
    });
    debugLog('PERFORMANCE', 'Cleared all managed intervals');
  }
}

/* ============================================================================
 * POPOUT WINDOW TRACKING
 * ============================================================================ */

/**
 * Track a popout window for cleanup
 *
 * @param {Window} popoutWindow - Popout window reference
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 *
 * @example
 * trackPopoutWindow(newWindow, { UnifiedState });
 */
export function trackPopoutWindow(popoutWindow, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState
  } = dependencies;

  if (UnifiedState && UnifiedState.popoutWindows) {
    UnifiedState.popoutWindows.add(popoutWindow);

    // Add cleanup listener
    popoutWindow.addEventListener('beforeunload', () => {
      UnifiedState.popoutWindows.delete(popoutWindow);
    });
  }
}

/**
 * Close all tracked popout windows
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.debugError] - Error logging function
 *
 * @example
 * closeAllPopoutWindows({ UnifiedState });
 */
export function closeAllPopoutWindows(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    debugError = console.error
  } = dependencies;

  if (UnifiedState && UnifiedState.popoutWindows) {
    UnifiedState.popoutWindows.forEach(window => {
      try {
        window.close();
      } catch (e) {
        debugError('PERFORMANCE', 'Error closing popout window', e);
      }
    });
    UnifiedState.popoutWindows.clear();
  }
}

/* ============================================================================
 * DOM QUERY CACHE SYSTEM
 * ============================================================================
 * Performance optimization: Cache frequently accessed DOM queries
 */

// WeakMap for element caching
const elementCache = new WeakMap();
const CACHE_DURATION = 1000; // 1 second cache

/**
 * Get cached DOM element by selector
 *
 * @param {string} selector - CSS selector
 * @param {Document|Element} context - Query context
 * @returns {Element|null} Cached or fresh element
 *
 * @example
 * const panel = getCachedElement('#mga-panel', document);
 */
export function getCachedElement(selector, context = document) {
  const now = Date.now();
  const key = `${selector}_${context.id || 'document'}`;

  let cached = elementCache.get(context);
  if (cached && cached[key] && now - cached[key].time < CACHE_DURATION) {
    return cached[key].element;
  }

  const element = context.querySelector(selector);
  if (!cached) cached = {};
  cached[key] = { element, time: now };
  elementCache.set(context, cached);

  return element;
}

/**
 * Get cached DOM elements by selector (returns NodeList)
 *
 * @param {string} selector - CSS selector
 * @param {Document|Element} context - Query context
 * @returns {NodeList} Cached or fresh elements
 *
 * @example
 * const buttons = getCachedElements('button.mga-btn', document);
 */
export function getCachedElements(selector, context = document) {
  const now = Date.now();
  const key = `${selector}_all_${context.id || 'document'}`;

  let cached = elementCache.get(context);
  if (cached && cached[key] && now - cached[key].time < CACHE_DURATION) {
    return cached[key].elements;
  }

  const elements = context.querySelectorAll(selector);
  if (!cached) cached = {};
  cached[key] = { elements, time: now };
  elementCache.set(context, cached);

  return elements;
}

/**
 * Invalidate cache for a specific context (useful after DOM changes)
 *
 * @param {Document|Element} context - Context to invalidate
 *
 * @example
 * invalidateCache(document);
 */
export function invalidateCache(context = document) {
  elementCache.delete(context);
}

/* ============================================================================
 * GAME COMMUNICATION
 * ============================================================================ */

/**
 * Safely send a message to the game's RoomConnection
 *
 * @param {object} message - Message object to send
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {Function} [dependencies.productionWarn] - Warning logger
 * @returns {boolean} True if message sent successfully
 *
 * @example
 * safeSendMessage({ type: 'test' }, { targetWindow: window });
 */
export function safeSendMessage(message, dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    productionWarn = console.warn
  } = dependencies;

  try {
    // Check for connection availability
    if (!targetWindow.MagicCircle_RoomConnection) {
      productionWarn('⚠️ MagicCircle_RoomConnection not available');
      return false;
    }

    // Validate that sendMessage exists and is a function
    if (typeof targetWindow.MagicCircle_RoomConnection.sendMessage !== 'function') {
      productionWarn('⚠️ sendMessage is not a function or not available');
      return false;
    }

    // Send the message
    targetWindow.MagicCircle_RoomConnection.sendMessage(message);
    return true;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return false;
  }
}

/**
 * Send a message to the game with proper scopePath
 *
 * @param {object} payloadObj - Payload object (will be merged with scopePath)
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {Function} [dependencies.productionLog] - Info logger
 * @param {Function} [dependencies.productionWarn] - Warning logger
 * @returns {boolean} True if message sent successfully
 *
 * @example
 * sendToGame({ type: 'harvest' }, { targetWindow: window });
 */
export function sendToGame(payloadObj, dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    productionLog = console.log,
    productionWarn = console.warn
  } = dependencies;

  const msg = { scopePath: ['Room', 'Quinoa'], ...payloadObj };
  try {
    if (!targetWindow.MagicCircle_RoomConnection || !targetWindow.MagicCircle_RoomConnection.sendMessage) {
      productionWarn('⚠️ MagicCircle_RoomConnection not available for sendToGame');
      return false;
    }

    productionLog('🎮 sendToGame:', msg);
    targetWindow.MagicCircle_RoomConnection.sendMessage(msg);
    return true;
  } catch (error) {
    console.error('❌ sendToGame error:', error);
    return false;
  }
}

/* ============================================================================
 * ATOM UTILITIES
 * ============================================================================ */

/**
 * Read an atom value from the Jotai store
 *
 * @param {string} atomName - Name of the atom to read
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.unsafeWindow] - Unsafe window (for userscripts)
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @returns {*} Atom value or null
 *
 * @example
 * const value = readAtom('myPetSlotInfosAtom', { targetWindow: window });
 */
export function readAtom(atomName, dependencies = {}) {
  const {
    unsafeWindow: unsafeWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : null,
    targetWindow = typeof window !== 'undefined' ? window : null
  } = dependencies;

  const gw = unsafeWin || targetWindow;
  try {
    if (gw.MGTools?.store?.getAtomValue) return gw.MGTools.store.getAtomValue(atomName);
  } catch {}
  return null;
}

/**
 * Hook into a Jotai atom to track value changes
 *
 * @param {string} atomPath - Full path to the atom
 * @param {string} windowKey - Key to store value in window/UnifiedState
 * @param {Function} callback - Optional callback to transform value
 * @param {number} retryCount - Internal retry counter
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.productionLog] - Info logger
 * @param {Function} [dependencies.productionWarn] - Warning logger
 * @param {boolean} [dependencies.isUserscript] - Whether running as userscript
 * @param {Set} [dependencies.hookedAtoms] - Set of already hooked atoms
 * @param {Map} [dependencies.atomReferences] - Map of atom references
 *
 * @example
 * hookAtom('myPetSlotInfosAtom', 'activePets', null, 0, { targetWindow: window });
 */
export function hookAtom(atomPath, windowKey, callback, retryCount = 0, dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    productionLog = console.log,
    productionWarn = console.warn,
    isUserscript = typeof unsafeWindow !== 'undefined',
    hookedAtoms = new Set(),
    atomReferences = new Map()
  } = dependencies;

  const maxRetries = 60; // Max 30 seconds
  const hookKey = `${atomPath}_${windowKey}`;

  // Prevent duplicate hooks - only check if retryCount is 0 (first attempt)
  if (retryCount === 0 && hookedAtoms.has(hookKey)) {
    productionLog(`[HOOK] Already hooked: ${windowKey} - skipping duplicate`);
    return;
  }

  // DIAGNOSTIC: Check multiple possible locations for jotaiAtomCache
  if (retryCount === 0) {
    console.log(
      '  - targetWindow.jotaiAtomCache:',
      typeof targetWindow.jotaiAtomCache,
      targetWindow.jotaiAtomCache
    );
    console.log('  - isUserscript:', isUserscript, '(using unsafeWindow:', isUserscript ? 'YES' : 'NO)');
    const jotaiKeys = Object.keys(targetWindow).filter(k => k.toLowerCase().includes('jotai'));
    console.log('  - Keys with "jotai" on targetWindow:', jotaiKeys);
  }

  // Try multiple contexts for jotaiAtomCache (cascading fallback)
  let atomCache = null;

  // Priority 1: Check targetWindow (should be window in page context)
  if (targetWindow.jotaiAtomCache) {
    atomCache = targetWindow.jotaiAtomCache.cache || targetWindow.jotaiAtomCache;
  }
  // Priority 2: Check window directly
  if (!atomCache && typeof window !== 'undefined' && window.jotaiAtomCache) {
    atomCache = window.jotaiAtomCache.cache || window.jotaiAtomCache;
  }
  // Priority 3: Check window.top (in case we're in iframe)
  if (!atomCache && typeof window !== 'undefined' && window.top && window.top.jotaiAtomCache) {
    atomCache = window.top.jotaiAtomCache.cache || window.top.jotaiAtomCache;
  }

  if (!atomCache || !atomCache.get) {
    if (retryCount >= maxRetries) {
      console.error(
        `❌ [ATOM-HOOK] Gave up waiting for atom store for ${windowKey} after ${maxRetries} retries (${maxRetries / 2}s)`
      );
      console.error(`❌ [ATOM-HOOK] Final check - targetWindow.jotaiAtomCache:`, targetWindow.jotaiAtomCache);
      console.error(`❌ [ATOM-HOOK] Using unsafeWindow:`, isUserscript);
      console.error(`❌ [ATOM-HOOK] Script will continue with reduced functionality`);
      productionWarn(`⚠️ [ATOM-HOOK] Gave up waiting for atom store for ${windowKey} after ${maxRetries} retries`);
      productionWarn(`⚠️ [ATOM-HOOK] Script will continue with reduced functionality`);
      return;
    }

    // Exponential backoff: 50ms → 100ms → 200ms → 500ms (cap at 500ms)
    const delay = Math.min(50 * Math.pow(2, Math.min(retryCount, 3)), 500);

    setTimeout(() => hookAtom(atomPath, windowKey, callback, retryCount + 1, dependencies), delay);
    return;
  }

  productionLog(`🔗 Attempting to hook atom: ${windowKey} at path: ${atomPath}`);

  try {
    const atom = atomCache.get(atomPath);
    if (!atom || !atom.read) {
      productionWarn(`❌ Could not find atom for ${atomPath}`);
      // List available atoms for debugging
      const allAtoms = Array.from(atomCache.keys());
      const petAtoms = allAtoms.filter(key => key.includes('Pet') || key.includes('pet') || key.includes('Slot'));
      productionLog('🔍 Pet-related atoms:', petAtoms);
      productionLog('🔍 All atoms (first 20):', allAtoms.slice(0, 20));
      return;
    }

    const originalRead = atom.read;
    atom.read = function (get) {
      const rawValue = originalRead.call(this, get);

      // Enhanced debugging for activePets
      if (windowKey === 'activePets' && UnifiedState?.data?.settings?.debugMode) {
        productionLog(`🐾 [ATOM-DEBUG] ${windowKey} raw value:`, {
          value: rawValue,
          type: typeof rawValue,
          isArray: Array.isArray(rawValue),
          length: rawValue?.length,
          firstItem: rawValue?.[0]
        });
      }

      // Allow callback to transform the value before storing
      let finalValue = rawValue;
      if (callback) {
        const callbackResult = callback(rawValue);
        // If callback returns a value, use it; otherwise use raw value
        if (callbackResult !== undefined) {
          finalValue = callbackResult;
          if (windowKey === 'activePets' && UnifiedState?.data?.settings?.debugMode) {
            productionLog(`🐾 [ATOM-DEBUG] ${windowKey} transformed by callback:`, finalValue);
          }
        }
      }

      // Store the final (possibly transformed) value
      if (UnifiedState && UnifiedState.atoms) {
        UnifiedState.atoms[windowKey] = finalValue;
      }
      if (typeof window !== 'undefined') {
        window[windowKey] = finalValue;
      }

      if (windowKey === 'activePets' && UnifiedState?.data?.settings?.debugMode) {
        productionLog(`🐾 [ATOM-DEBUG] ${windowKey} stored in UnifiedState:`, {
          count: finalValue?.length || 0,
          value: finalValue
        });
      }

      return rawValue; // Return raw value to game
    };

    productionLog(`✅ hookAtom: Successfully hooked ${windowKey}`);

    // Mark this hook as successful to prevent duplicates
    hookedAtoms.add(hookKey);

    // Store atom reference for later re-querying (CRITICAL for fresh data)
    atomReferences.set(windowKey, {
      atom: atom,
      atomCache: atomCache,
      atomPath: atomPath
    });
    productionLog(`📦 Stored atom reference for ${windowKey} (can now re-query for fresh data)`);
  } catch (error) {
    console.error(`❌ Error hooking ${atomPath}:`, error);
  }
}

/* ============================================================================
 * SLOT INDEX TRACKING
 * ============================================================================ */

/**
 * Initialize slot index tracking with atom hooking and keyboard listeners
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {object} [dependencies.CONFIG] - Configuration object
 * @param {Function} [dependencies.productionLog] - Info logger
 * @param {Function} [dependencies.insertTurtleEstimate] - Function to update turtle estimate display
 *
 * @example
 * listenToSlotIndexAtom({ targetWindow: window, targetDocument: document });
 */
export function listenToSlotIndexAtom(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    targetDocument = typeof document !== 'undefined' ? document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    CONFIG = { DEBUG: { FLAGS: { FIX_VALIDATION: false } } },
    productionLog = console.log,
    insertTurtleEstimate = null
  } = dependencies;

  productionLog('🔍 [SLOT-ATOM] Starting slot index atom listener...');

  // Initialize the slot index
  if (typeof targetWindow._mgtools_currentSlotIndex === 'undefined') {
    targetWindow._mgtools_currentSlotIndex = 0;
    console.log('🎯 [SLOT-ATOM] Initialized slot index to 0');
  }

  // Method 1: Try to hook via jotaiAtomCache
  const tryHookingViaCache = () => {
    const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
    if (!atomCache || !atomCache.get) {
      productionLog('⏳ [SLOT-ATOM] Waiting for jotaiAtomCache...');
      return false;
    }

    // Look for the slot index atom path
    const possiblePaths = [
      '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotIndexAtom',
      'myCurrentGrowSlotIndexAtom',
      'myCurrentGrowSlotIndex'
    ];

    for (const path of possiblePaths) {
      const atom = atomCache.get(path);
      if (atom && atom.read) {
        productionLog(`✅ [SLOT-ATOM] Found slot atom at: ${path}`);

        // Hook the read function
        const originalRead = atom.read;
        atom.read = function (get) {
          const value = originalRead.call(this, get);
          const idx = Number.isFinite(value) ? value : 0;

          // Only update if changed
          if (targetWindow._mgtools_currentSlotIndex !== idx) {
            targetWindow._mgtools_currentSlotIndex = idx;
            console.log(`🎯 [SLOT-ATOM-CACHE] Slot index changed to: ${idx}`);

            // Update display
            if (typeof insertTurtleEstimate === 'function') {
              requestAnimationFrame(() => insertTurtleEstimate());
            }
          }

          return value;
        };

        return true;
      }
    }

    // List all atoms to find the right one
    const allAtoms = Array.from(atomCache.keys());
    const slotAtoms = allAtoms.filter(
      key => key.includes('Slot') || key.includes('slot') || key.includes('Index') || key.includes('index')
    );

    productionLog('🔍 [SLOT-ATOM] Slot-related atoms found:', slotAtoms);

    // Try to find it in the list
    const slotIndexAtom = slotAtoms.find(
      key => key.includes('GrowSlotIndex') || key.includes('CurrentGrowSlotIndex')
    );

    if (slotIndexAtom) {
      productionLog(`🎯 [SLOT-ATOM] Found potential slot atom: ${slotIndexAtom}`);
      return tryHookingViaCache(); // Retry with the found path
    }

    return false;
  };

  // Method 2: Watch for X/C keypresses and arrow clicks
  const setupKeyWatcher = () => {
    productionLog('🎮 [SLOT-ATOM] Setting up X/C key and arrow click watcher as fallback...');

    let lastCropHash = '';

    // Helper to get crop hash for change detection
    const getCropHashSimple = crops => {
      if (!crops || !crops.length) return '';
      return crops.map(c => `${c.species}_${c.endTime}`).join('|');
    };

    // ==================== MULTI-HARVEST SYNC HELPERS ====================

    // Polyfill queueMicrotask for older embeds
    const qmt = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn);

    // Robust atom finder
    function findAtom(cache, names = ['myCurrentGrowSlotIndexAtom']) {
      if (!cache) return null;

      if (cache.get) {
        // Try direct lookup first
        for (const n of names) {
          if (cache.get(n)) return cache.get(n);
        }
        // Suffix match fallback
        for (const [k, v] of cache.entries?.() ?? []) {
          if (names.some(n => k.endsWith(n))) return v;
        }
      } else {
        // Plain object fallback
        for (const k of Object.keys(cache)) {
          if (names.some(n => k === n || k.endsWith(n))) return cache[k];
        }
      }
      return null;
    }

    // Safe atom value reader
    function readAtomValue(atom) {
      try {
        // Prefer cached "last seen" value if atom watcher tracks it
        if (typeof atom?.lastValue !== 'undefined') return atom.lastValue;

        // Otherwise, attempt safe read only if API matches
        if (typeof atom?.read === 'function' && typeof atom?.init !== 'undefined') {
          const ctx = { get: a => (a === atom ? atom.init : undefined) };
          return atom.read(ctx);
        }
      } catch {}
      return undefined;
    }

    // Centralized state setter
    function setSlotIndex(idx) {
      targetWindow._mgtools_currentSlotIndex = idx;

      if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
        console.log('[FIX_SLOT] Set slot index to:', idx);
      }
    }

    // Main sync function - sync from game's Jotai atom state
    function syncSlotIndexFromGame() {
      const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
      if (!atomCache) return null;

      const slotAtom = findAtom(atomCache, ['myCurrentGrowSlotIndexAtom']);
      if (!slotAtom) return null;

      const gameIndex = readAtomValue(slotAtom);
      if (!Number.isFinite(gameIndex)) return null;

      const currentIndex = targetWindow._mgtools_currentSlotIndex || 0;

      // Only update if changed
      if (gameIndex !== currentIndex) {
        setSlotIndex(gameIndex);

        // Trigger value refresh using consistent scheduling
        qmt(() => {
          requestAnimationFrame(() => {
            if (typeof insertTurtleEstimate === 'function') {
              insertTurtleEstimate();
            }
          });
        });

        if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
          targetWindow._mgtools_syncCount = (targetWindow._mgtools_syncCount || 0) + 1;
          console.log('[FIX_HARVEST] Synced to game slot:', {
            from: currentIndex,
            to: gameIndex,
            syncCount: targetWindow._mgtools_syncCount
          });
        }

        return gameIndex;
      }

      return null;
    }

    // Expose sync function globally for harvest handler
    targetWindow.syncSlotIndexFromGame = syncSlotIndexFromGame;

    // ==================== END MULTI-HARVEST SYNC HELPERS ====================

    // Update function
    const updateSlotIndex = direction => {
      const currentCrop = UnifiedState?.atoms?.currentCrop || targetWindow.currentCrop || [];
      const sortedIndices = UnifiedState?.atoms?.sortedSlotIndices || targetWindow.sortedSlotIndices;

      if (!currentCrop || currentCrop.length <= 1) return;

      // Get the max valid index based on sorted indices or crop length
      const maxIndex = sortedIndices?.length || currentCrop.length;

      if (direction === 'forward') {
        targetWindow._mgtools_currentSlotIndex = (targetWindow._mgtools_currentSlotIndex + 1) % maxIndex;
      } else if (direction === 'backward') {
        targetWindow._mgtools_currentSlotIndex = (targetWindow._mgtools_currentSlotIndex - 1 + maxIndex) % maxIndex;
      }

      console.log(
        `🎯 [SLOT-KEY] Cycled ${direction} - slot index: ${targetWindow._mgtools_currentSlotIndex}/${maxIndex}`
      );

      // Update display immediately
      setTimeout(() => {
        if (typeof insertTurtleEstimate === 'function') {
          insertTurtleEstimate();
        }
      }, 100);
    };

    // Key listener
    targetDocument.addEventListener(
      'keydown',
      e => {
        // Skip if typing in input
        const active = targetDocument.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

        const currentCrop = UnifiedState?.atoms?.currentCrop || targetWindow.currentCrop || [];
        if (!currentCrop || currentCrop.length <= 1) return;

        // Check if crop changed (new tile)
        const currentHash = getCropHashSimple(currentCrop);
        if (currentHash !== lastCropHash) {
          targetWindow._mgtools_currentSlotIndex = 0;
          lastCropHash = currentHash;
          console.log(`🔄 [SLOT-KEY] New crop detected, reset index to 0`);
        }

        if (e.key.toLowerCase() === 'x') {
          updateSlotIndex('forward');
        } else if (e.key.toLowerCase() === 'c') {
          updateSlotIndex('backward');
        }
      },
      true
    );

    // Arrow button click detection
    targetDocument.addEventListener(
      'click',
      e => {
        const target = e.target;
        if (!target) return;

        // Check for arrow buttons in the tooltip
        const button = target.closest('button');
        if (!button) return;

        // Look for chevron icons or arrow text
        const hasLeftArrow =
          button.querySelector('svg[data-icon="chevron-left"]') ||
          button.innerHTML.includes('chevron-left') ||
          button.getAttribute('aria-label')?.includes('Previous');

        const hasRightArrow =
          button.querySelector('svg[data-icon="chevron-right"]') ||
          button.innerHTML.includes('chevron-right') ||
          button.getAttribute('aria-label')?.includes('Next');

        if (hasLeftArrow) {
          console.log('⬅️ [SLOT-ARROW] Left arrow clicked');
          updateSlotIndex('backward');
        } else if (hasRightArrow) {
          console.log('➡️ [SLOT-ARROW] Right arrow clicked');
          updateSlotIndex('forward');
        }
      },
      true
    );

    console.log('✅ [SLOT-ATOM] Key and arrow watchers installed');
  };

  // Install key watcher immediately as backup
  setupKeyWatcher();

  // Also try cache hooking for better integration
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;

    if (tryHookingViaCache()) {
      clearInterval(checkInterval);
      productionLog('✅ [SLOT-ATOM] Successfully hooked slot index atom via cache!');
      // Key watcher remains as backup
    } else if (attempts >= 10) {
      clearInterval(checkInterval);
      productionLog('ℹ️ [SLOT-ATOM] Using key watcher for slot tracking');
    }
  }, 1000);
}

/* ============================================================================
 * EXPORTS
 * ============================================================================ */

export const RuntimeUtilities = {
  // Interval Management
  setManagedInterval,
  clearManagedInterval,
  clearAllManagedIntervals,

  // Popout Window Tracking
  trackPopoutWindow,
  closeAllPopoutWindows,

  // DOM Query Cache
  getCachedElement,
  getCachedElements,
  invalidateCache,

  // Game Communication
  safeSendMessage,
  sendToGame,

  // Atom Utilities
  readAtom,
  hookAtom,
  listenToSlotIndexAtom
};
