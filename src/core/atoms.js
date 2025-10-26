/**
 * ATOM/STATE MANAGEMENT SYSTEM
 * ====================================================================================
 * Core infrastructure for hooking into Jotai atom cache and managing reactive state
 *
 * @module core/atoms
 *
 * Complete System (6 Components):
 * - Module State: hookedAtoms Set, atomReferences Map
 * - readAtom() - Simple atom reader with MGTools store fallback
 * - getAtomValueFresh() - Get fresh value from atom cache
 * - hookAtom() - Hook atom with retry logic and exponential backoff
 * - listenToSlotIndexAtom() - Track slot index changes for multi-harvest crops
 * - getCropHash() - Generate hash for change detection
 *
 * Total: ~490 lines (core infrastructure)
 *
 * Features:
 * - Jotai atom cache hooking with multiple fallback contexts
 * - Automatic retry with exponential backoff (50ms → 500ms cap)
 * - Slot index tracking via atom hooks and keyboard watchers
 * - Fresh atom value retrieval for reactive updates
 * - Change detection via JSON hashing
 * - Debug logging and diagnostics
 * - Duplicate hook prevention
 * - UnifiedState integration
 *
 * Dependencies:
 * - Core: UnifiedState, targetWindow, targetDocument
 * - Logging: console, productionLog, productionWarn
 * - Utils: queueMicrotask polyfill
 * - Turtle Timer: insertTurtleEstimate (optional callback)
 * - Full dependency injection on all functions
 */

/* ====================================================================================
 * MODULE-LEVEL STATE
 * ====================================================================================
 */

/**
 * Track successfully hooked atoms to prevent duplicates
 * Key format: `${atomPath}_${windowKey}`
 * @type {Set<string>}
 */
const hookedAtoms = new Set();

/**
 * Store atom references for fresh value retrieval
 * @type {Map<string, {atom: Object, atomCache: Object, atomPath: string}>}
 */
const atomReferences = new Map();

/* ====================================================================================
 * ATOM READING FUNCTIONS
 * ====================================================================================
 */

/**
 * Read atom value with MGTools store fallback
 * Simple reader that checks MGTools store first
 *
 * @param {string} atomName - Name of the atom to read
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.window] - Window object
 * @param {Window} [dependencies.unsafeWindow] - Unsafe window for userscripts
 * @returns {*} Atom value or null
 */
export function readAtom(atomName, dependencies = {}) {
  const { window: win = typeof window !== 'undefined' ? window : null, unsafeWindow: unsafeWin = null } = dependencies;

  // Check for global unsafeWindow (userscript context)
  const globalUnsafeWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : null;
  const gw = unsafeWin || globalUnsafeWindow || win;

  try {
    if (gw?.MGTools?.store?.getAtomValue) {
      return gw.MGTools.store.getAtomValue(atomName);
    }
  } catch (e) {
    // Silent catch - store not available
  }

  return null;
}

/**
 * Get fresh atom value from cache
 * Forces a fresh read from the atom cache bypassing stale data
 *
 * @param {string} windowKey - Key used to store atom in UnifiedState
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Map} [dependencies.atomReferences] - Atom references map
 * @param {Function} [dependencies.console] - Console object
 * @returns {*} Fresh atom value or null
 */
export function getAtomValueFresh(windowKey, dependencies = {}) {
  const {
    atomReferences: atomRefs = atomReferences,
    console: consoleObj = typeof console !== 'undefined' ? console : null
  } = dependencies;

  const ref = atomRefs.get(windowKey);
  if (!ref) {
    consoleObj?.warn(`[MGTools] No atom reference stored for '${windowKey}'`);
    return null;
  }

  try {
    // Force a fresh read from the atom cache
    const currentState = ref.atomCache.get(ref.atomPath);
    if (!currentState || !currentState.v) {
      consoleObj?.warn(`[MGTools] Atom '${windowKey}' has no current state`);
      return null;
    }

    // Return the current value directly from the atom cache
    consoleObj?.log(`[MGTools] 🔄 Got fresh data for '${windowKey}' from atom cache`);
    return currentState.v;
  } catch (error) {
    consoleObj?.error(`[MGTools] Error getting fresh atom value for '${windowKey}':`, error);
    return null;
  }
}

/* ====================================================================================
 * ATOM HOOKING SYSTEM
 * ====================================================================================
 */

/**
 * Hook into Jotai atom with retry logic and exponential backoff
 * Intercepts atom reads to store values in UnifiedState and window
 *
 * @param {string} atomPath - Full path to the atom in Jotai cache
 * @param {string} windowKey - Key to store value in window and UnifiedState
 * @param {Function} [callback] - Optional transform callback(rawValue) => finalValue
 * @param {number} [retryCount=0] - Current retry attempt (internal)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Set} [dependencies.hookedAtoms] - Hooked atoms tracking set
 * @param {Map} [dependencies.atomReferences] - Atom references map
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.productionWarn] - Production warning logger
 * @param {Function} [dependencies.console] - Console object
 */
export function hookAtom(atomPath, windowKey, callback = null, retryCount = 0, dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    hookedAtoms: hookedAtomsSet = hookedAtoms,
    atomReferences: atomRefs = atomReferences,
    productionLog = () => {},
    productionWarn = () => {},
    console: consoleObj = typeof console !== 'undefined' ? console : null
  } = dependencies;

  const maxRetries = 60; // Max 30 seconds
  const hookKey = `${atomPath}_${windowKey}`;

  // Prevent duplicate hooks - only check if retryCount is 0 (first attempt)
  if (retryCount === 0 && hookedAtomsSet.has(hookKey)) {
    productionLog(`[HOOK] Already hooked: ${windowKey} - skipping duplicate`);
    return;
  }

  // DIAGNOSTIC: Check multiple possible locations for jotaiAtomCache
  if (retryCount === 0) {
    consoleObj?.log(
      '  - targetWindow.jotaiAtomCache:',
      typeof targetWindow.jotaiAtomCache,
      targetWindow.jotaiAtomCache
    );
    consoleObj?.log(
      '  - isUserscript:',
      typeof unsafeWindow !== 'undefined',
      '(using unsafeWindow:',
      typeof unsafeWindow !== 'undefined' ? 'YES' : 'NO)'
    );
    const jotaiKeys = Object.keys(targetWindow).filter(k => k.toLowerCase().includes('jotai'));
    consoleObj?.log('  - Keys with "jotai" on targetWindow:', jotaiKeys);
  }

  // Try multiple contexts for jotaiAtomCache (cascading fallback)
  let atomCache = null;

  // Priority 1: Check targetWindow (should be window in page context)
  if (targetWindow.jotaiAtomCache) {
    atomCache = targetWindow.jotaiAtomCache.cache || targetWindow.jotaiAtomCache;
  }
  // Priority 2: Check window directly
  if (!atomCache && window.jotaiAtomCache) {
    atomCache = window.jotaiAtomCache.cache || window.jotaiAtomCache;
  }
  // Priority 3: Check window.top (in case we're in iframe)
  if (!atomCache && window.top && window.top.jotaiAtomCache) {
    atomCache = window.top.jotaiAtomCache.cache || window.top.jotaiAtomCache;
  }

  if (!atomCache || !atomCache.get) {
    if (retryCount >= maxRetries) {
      consoleObj?.error(
        `❌ [ATOM-HOOK] Gave up waiting for atom store for ${windowKey} after ${maxRetries} retries (${maxRetries / 2}s)`
      );
      consoleObj?.error(`❌ [ATOM-HOOK] Final check - targetWindow.jotaiAtomCache:`, targetWindow.jotaiAtomCache);
      consoleObj?.error(`❌ [ATOM-HOOK] Using unsafeWindow:`, typeof unsafeWindow !== 'undefined');
      consoleObj?.error(`❌ [ATOM-HOOK] Script will continue with reduced functionality`);
      productionWarn(`⚠️ [ATOM-HOOK] Gave up waiting for atom store for ${windowKey} after ${maxRetries} retries`);
      productionWarn(`⚠️ [ATOM-HOOK] Script will continue with reduced functionality`);
      return;
    }

    // Exponential backoff: 50ms → 100ms → 200ms → 500ms (cap at 500ms)
    const delay = Math.min(50 * Math.pow(2, Math.min(retryCount, 3)), 500);

    setTimeout(() => hookAtom(atomPath, windowKey, callback, retryCount + 1, dependencies), delay);
    return;
  }

  // Success - atomCache found!
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
      UnifiedState.atoms[windowKey] = finalValue;
      window[windowKey] = finalValue;

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
    hookedAtomsSet.add(hookKey);

    // Store atom reference for later re-querying (CRITICAL for fresh data)
    atomRefs.set(windowKey, {
      atom: atom,
      atomCache: atomCache,
      atomPath: atomPath
    });
    productionLog(`📦 Stored atom reference for ${windowKey} (can now re-query for fresh data)`);

    // Don't force an initial read - it might trigger game modals
    // Instead, wait for the game to naturally read the atom
  } catch (error) {
    consoleObj?.error(`❌ Error hooking ${atomPath}:`, error);
  }
}

/**
 * Generate hash for crop change detection
 * Uses JSON.stringify for deep comparison
 *
 * @param {*} crop - Crop data to hash
 * @returns {string} JSON hash or timestamp-based fallback
 */
export function getCropHash(crop) {
  try {
    return JSON.stringify(crop);
  } catch (e) {
    return '__ref_changed__' + Date.now();
  }
}

/* ====================================================================================
 * SLOT INDEX TRACKING
 * ====================================================================================
 */

/**
 * Listen to slot index atom changes for multi-harvest crops
 * Sets up dual tracking: atom cache hooking + keyboard/click fallback
 *
 * Method 1: Direct atom hooking via jotaiAtomCache (preferred)
 * Method 2: Keyboard (X/C keys) and arrow button click detection (fallback)
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.console] - Console object
 * @param {Function} [dependencies.insertTurtleEstimate] - Turtle estimate callback
 * @param {Object} [dependencies.CONFIG] - Config object with DEBUG flags
 * @param {Function} [dependencies.queueMicrotask] - Microtask scheduler
 * @param {Function} [dependencies.getCropHash] - Crop hash function
 */
export function listenToSlotIndexAtom(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    targetDocument = typeof document !== 'undefined' ? document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    productionLog = () => {},
    console: consoleObj = typeof console !== 'undefined' ? console : null,
    insertTurtleEstimate = null,
    CONFIG = { DEBUG: { FLAGS: { FIX_VALIDATION: false } } },
    queueMicrotask: qmt = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn),
    getCropHash: getCropHashFn = getCropHash
  } = dependencies;

  productionLog('🔍 [SLOT-ATOM] Starting slot index atom listener...');

  // Initialize the slot index
  if (typeof targetWindow._mgtools_currentSlotIndex === 'undefined') {
    targetWindow._mgtools_currentSlotIndex = 0;
    consoleObj?.log('🎯 [SLOT-ATOM] Initialized slot index to 0');
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
            consoleObj?.log(`🎯 [SLOT-ATOM-CACHE] Slot index changed to: ${idx}`);

            // Update display
            if (insertTurtleEstimate && typeof insertTurtleEstimate === 'function') {
              requestAnimationFrame(() => insertTurtleEstimate(dependencies));
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
    const slotIndexAtom = slotAtoms.find(key => key.includes('GrowSlotIndex') || key.includes('CurrentGrowSlotIndex'));

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
      } catch (e) {
        // Silent catch
      }
      return undefined;
    }

    // Centralized state setter
    function setSlotIndex(idx) {
      targetWindow._mgtools_currentSlotIndex = idx;

      if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
        consoleObj?.log('[FIX_SLOT] Set slot index to:', idx);
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
            if (insertTurtleEstimate && typeof insertTurtleEstimate === 'function') {
              insertTurtleEstimate(dependencies);
            }
          });
        });

        if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
          targetWindow._mgtools_syncCount = (targetWindow._mgtools_syncCount || 0) + 1;
          consoleObj?.log('[FIX_HARVEST] Synced to game slot:', {
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
      const currentCrop = UnifiedState.atoms.currentCrop || targetWindow.currentCrop || [];
      const sortedIndices = UnifiedState.atoms.sortedSlotIndices || targetWindow.sortedSlotIndices;

      if (!currentCrop || currentCrop.length <= 1) return;

      // Get the max valid index based on sorted indices or crop length
      const maxIndex = sortedIndices?.length || currentCrop.length;

      if (direction === 'forward') {
        targetWindow._mgtools_currentSlotIndex = (targetWindow._mgtools_currentSlotIndex + 1) % maxIndex;
      } else if (direction === 'backward') {
        targetWindow._mgtools_currentSlotIndex = (targetWindow._mgtools_currentSlotIndex - 1 + maxIndex) % maxIndex;
      }

      consoleObj?.log(
        `🎯 [SLOT-KEY] Cycled ${direction} - slot index: ${targetWindow._mgtools_currentSlotIndex}/${maxIndex}`
      );

      // Update display immediately
      setTimeout(() => {
        if (insertTurtleEstimate && typeof insertTurtleEstimate === 'function') {
          insertTurtleEstimate(dependencies);
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

        const currentCrop = UnifiedState.atoms.currentCrop || targetWindow.currentCrop || [];
        if (!currentCrop || currentCrop.length <= 1) return;

        // Check if crop changed (new tile)
        const currentHash = getCropHashSimple(currentCrop);
        if (currentHash !== lastCropHash) {
          targetWindow._mgtools_currentSlotIndex = 0;
          lastCropHash = currentHash;
          consoleObj?.log(`🔄 [SLOT-KEY] New crop detected, reset index to 0`);
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
          consoleObj?.log('⬅️ [SLOT-ARROW] Left arrow clicked');
          updateSlotIndex('backward');
        } else if (hasRightArrow) {
          consoleObj?.log('➡️ [SLOT-ARROW] Right arrow clicked');
          updateSlotIndex('forward');
        }
      },
      true
    );

    consoleObj?.log('✅ [SLOT-ATOM] Key and arrow watchers installed');
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

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // State
  hookedAtoms,
  atomReferences,

  // Reading Functions
  readAtom,
  getAtomValueFresh,

  // Hooking System
  hookAtom,
  listenToSlotIndexAtom,

  // Utilities
  getCropHash
};
