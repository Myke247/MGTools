/**
 * CROP HIGHLIGHTING SYSTEM MODULE
 * ====================================================================================
 * Visual highlighting system for crops in the garden
 *
 * @module features/crop-highlighting
 *
 * Features:
 * - Species-based crop highlighting
 * - Slot-based highlighting (0-2)
 * - Hidden species with scale control
 * - Ctrl+C toggle current crop
 * - Ctrl+H clear all highlights
 * - Comprehensive debug utilities
 *
 * Dependencies:
 * - Core: targetWindow, productionLog, debugLog, debugError
 * - Notifications: queueNotification
 * - Game: window.gardenInfo, window.currentCrop, window.highlightTilesByMutation
 * - Atom hooks: hookAtomForTileOverrides
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';


/* ====================================================================================
 * IMPORTS
 * ====================================================================================
 */

// NOTE: These will be available from the global scope when bundled

/* ====================================================================================
 * MODULE-LEVEL STATE
 * ====================================================================================
 */

/**
 * Track the last highlighted species for toggle functionality
 * @type {string|null}
 */
let lastHighlightedSpecies = null;

/**
 * Track if crop highlighting system is installed
 * @type {boolean}
 */
let cropHighlightInstalled = false;

/* ====================================================================================
 * ATOM INITIALIZATION
 * ====================================================================================
 */

/**
 * Initialize crop highlighting atom hooks
 * Hooks into garden data and current crop atoms
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.hookAtomForTileOverrides] - Atom hook function
 * @param {Function} [dependencies.debugLog] - Debug logging function
 * @param {Function} [dependencies.debugError] - Debug error function
 */
export function initializeCropHighlightingAtoms(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    hookAtomForTileOverrides = typeof window !== 'undefined' && window.hookAtomForTileOverrides,
    debugLog = console.log,
    debugError = console.error
  } = dependencies;

  if (!targetWindow.jotaiAtomCache) {
    // Wait for jotaiAtomCache to be available
    setTimeout(() => initializeCropHighlightingAtoms(dependencies), 1000);
    return;
  }

  try {
    if (typeof hookAtomForTileOverrides === 'function') {
      hookAtomForTileOverrides(
        '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myDataAtom',
        'gardenInfo'
      );
      hookAtomForTileOverrides(
        '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom',
        'currentCrop'
      );
      debugLog('CROP_HIGHLIGHT', 'Crop highlighting atom hooks initialized');
    }
  } catch (error) {
    debugError('CROP_HIGHLIGHT', 'Failed to initialize crop highlighting atoms', error);
  }
}

/* ====================================================================================
 * CORE HIGHLIGHTING FUNCTIONS * ====================================================================================
 */

/**
 * Clear all crop highlighting
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.productionWarn] - Production warning function
 * @param {Function} [dependencies.queueNotification] - Notification queue function
 * @param {Function} [dependencies.debugLog] - Debug logging function
 * @param {Function} [dependencies.debugError] - Debug error function
 * @returns {boolean} True if cleared successfully
 */
export function clearCropHighlighting(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    productionLog = console.log,
    productionWarn = console.warn,
    queueNotification = typeof window !== 'undefined' && window.queueNotification,
    debugLog = console.log,
    debugError = console.error
  } = dependencies;

  try {
    if (typeof targetWindow.removeAllTileOverrides === 'function') {
      targetWindow.removeAllTileOverrides();
      productionLog('🌱 Cleared all crop highlighting');
      if (queueNotification) queueNotification('🧹 Cleared all crop highlighting', false);
      debugLog('CROP_HIGHLIGHTING', 'Cleared all tile overrides');
      return true;
    }
    productionWarn('🌱 removeAllTileOverrides function not available');
    if (queueNotification) queueNotification('⚠️ Cannot clear highlighting - game not fully loaded', false);
    debugLog('CROP_HIGHLIGHTING', 'removeAllTileOverrides function not found in window object');
    return false;
  } catch (error) {
    debugError('CROP_HIGHLIGHTING', 'Failed to clear crop highlighting', error);
    return false;
  }
}

/**
 * Debug function to check garden data availability
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function debugCropHighlighting(dependencies = {}) {
  const { targetWindow = typeof window !== 'undefined' ? window : null, productionLog = console.log } = dependencies;

  productionLog('🔍 CROP HIGHLIGHTING DEBUG:');
  productionLog('  window.gardenInfo:', !!targetWindow.gardenInfo);
  productionLog('  window.currentCrop:', !!targetWindow.currentCrop);
  productionLog('  targetWindow.jotaiAtomCache:', !!targetWindow.jotaiAtomCache);

  if (targetWindow.gardenInfo?.garden?.tileObjects) {
    const tileObjects = targetWindow.gardenInfo.garden.tileObjects;
    const tileCount = Array.isArray(tileObjects)
      ? tileObjects.length
      : tileObjects instanceof Map
        ? tileObjects.size
        : Object.keys(tileObjects).length;
    productionLog('  Garden tiles available:', tileCount);

    // Show first few tiles for debugging
    if (Array.isArray(tileObjects) && tileObjects.length > 0) {
      productionLog('  Sample tile:', tileObjects[0]);
    }
  } else {
    productionLog('  ❌ No garden tile data available');
  }

  if (targetWindow.currentCrop && Array.isArray(targetWindow.currentCrop) && targetWindow.currentCrop.length > 0) {
    productionLog('  Current crop species:', targetWindow.currentCrop[0]?.species);
  } else {
    productionLog('  ❌ No current crop data available');
  }

  productionLog('  Available functions:');
  productionLog('    removeAllTileOverrides:', typeof targetWindow.removeAllTileOverrides);
  productionLog('    highlightTilesByMutation:', typeof targetWindow.highlightTilesByMutation);
  productionLog('    setTileSpecies:', typeof targetWindow.setTileSpecies);
}

/**
 * Apply crop highlighting with validation and debugging
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.productionWarn] - Production warning function
 * @param {Function} [dependencies.productionError] - Production error function
 * @param {Function} [dependencies.queueNotification] - Notification queue function
 * @param {Function} [dependencies.debugCropHighlighting] - Debug function
 * @returns {boolean} True if highlighting applied successfully
 */
export function applyCropHighlighting(dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    productionLog = console.log,
    productionWarn = console.warn,
    productionError = console.error,
    queueNotification = typeof window !== 'undefined' && window.queueNotification,
    debugCropHighlighting: debugFn = debugCropHighlighting
  } = dependencies;

  productionLog('🌱 Starting crop highlighting...');
  debugFn(dependencies);

  try {
    // Get values from UI
    const highlightSpecies = targetDocument.querySelector('#highlight-species-select')?.value || null;
    const slotIndex = parseInt(targetDocument.querySelector('#highlight-slot-input')?.value || '0');
    const hiddenSpecies = targetDocument.querySelector('#hidden-species-select')?.value || 'Carrot';
    const hiddenScale = parseFloat(targetDocument.querySelector('#hidden-scale-input')?.value || '0.1');

    productionLog('🌱 Settings:', { highlightSpecies, slotIndex, hiddenSpecies, hiddenScale });

    // Validate inputs
    if (!highlightSpecies) {
      productionWarn('🌱 No species selected for highlighting');
      if (queueNotification) queueNotification('⚠️ Please select a species to highlight first', false);
      return false;
    }

    // Check if required game functions are available
    const hasRemoveOverrides = typeof targetWindow.removeAllTileOverrides === 'function';
    const hasHighlightFunction = typeof targetWindow.highlightTilesByMutation === 'function';

    productionLog('🌱 Function availability:', {
      removeAllTileOverrides: hasRemoveOverrides,
      highlightTilesByMutation: hasHighlightFunction
    });

    if (!hasHighlightFunction) {
      productionWarn('🌱 Crop highlighting function not available - game may not be loaded yet');
      if (queueNotification) {
        queueNotification('⚠️ Crop highlighting not available - try again when fully loaded', false);
      }
      return false;
    }

    // Always clear previous highlights first
    if (hasRemoveOverrides) {
      targetWindow.removeAllTileOverrides();
      productionLog('🌱 Cleared previous highlights');
    }

    // Apply new highlighting with array format
    const config = {
      highlightSpecies: [highlightSpecies], // Convert to array like working reference
      highlightMutations: [null], // Default to no mutation filter
      slotIndex,
      highlightScale: null, // Let the system decide
      hiddenSpecies,
      hiddenScale
    };

    productionLog('🌱 Applying config:', config);

    try {
      targetWindow.highlightTilesByMutation(config);
      productionLog(`✅ Applied crop highlighting for ${highlightSpecies} (slot ${slotIndex})`);
      if (queueNotification) {
        queueNotification(`🌱 Highlighted all ${highlightSpecies} crops (slot ${slotIndex})`, false);
      }

      // Force a re-render by triggering a small change
      setTimeout(() => {
        productionLog('🔄 Forcing render update...');
        try {
          globalThis.dispatchEvent?.(new Event('visibilitychange'));
        } catch (e) {
          productionLog('Could not dispatch visibility change:', e);
        }
      }, 100);

      return true;
    } catch (highlightError) {
      productionError('🌱 Error during highlighting:', highlightError);
      if (queueNotification) queueNotification(`❌ Crop highlighting failed: ${highlightError.message}`, false);
      return false;
    }
  } catch (error) {
    productionError('❌ Failed to apply crop highlighting:', error);
    if (queueNotification) queueNotification(`❌ Crop highlighting system error: ${error.message}`, false);
    return false;
  }
}

/* ====================================================================================
 * AUTOMATIC HIGHLIGHTING & HOTKEYS * ====================================================================================
 */

/**
 * Setup automatic crop highlighting with Ctrl+C toggle
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function setupAutomaticCropHighlighting(dependencies = {}) {
  const { targetWindow = typeof window !== 'undefined' ? window : null, productionLog = console.log } = dependencies;

  targetWindow.addEventListener('keydown', function (e) {
    // Ignore when typing in input fields
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

    // Ctrl (or Cmd) + C for automatic highlighting
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      try {
        const cc = targetWindow.currentCrop;

        targetWindow.removeAllTileOverrides(); // always clear first
        productionLog('🌱 Ctrl+C: Cleared previous highlights');

        if (cc && Array.isArray(cc) && cc.length > 0 && cc[0] && cc[0].species) {
          const species = cc[0].species;

          if (lastHighlightedSpecies === species) {
            // Same species pressed twice → just clear
            productionLog(`🌱 Ctrl+C: Removed highlights (${species} was already highlighted)`);
            lastHighlightedSpecies = null;
          } else {
            // New species → highlight it after delay
            setTimeout(() => {
              targetWindow.highlightTilesByMutation({
                highlightSpecies: [species],
                highlightMutations: [null],
                slotIndex: 0,
                highlightScale: null,
                hiddenSpecies: 'Carrot',
                hiddenScale: 0.1
              });
              productionLog(`✅ Ctrl+C: Highlighted current crop: ${species}`);
              lastHighlightedSpecies = species;
            }, 350);
          }
        } else {
          // currentCrop is null or invalid → just clear
          productionLog('🌱 Ctrl+C: No current crop - highlights cleared');
          lastHighlightedSpecies = null;
        }

        e.preventDefault(); // block normal copy
      } catch (err) {
        productionError('❌ Error handling Ctrl+C highlight action', err);
      }
    }
  });

  productionLog('🌱 Automatic crop highlighting installed (Ctrl+C)');
}

/**
 * Setup crop highlighting hotkey system (Ctrl+H to clear)
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.debugLog] - Debug logging function
 * @param {Function} [dependencies.debugError] - Debug error function
 */
export function setupCropHighlightingSystem(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    productionLog = console.log,
    debugLog = console.log,
    debugError = console.error
  } = dependencies;

  productionLog('🌱 [DEBUG] setupCropHighlightingSystem() called - setting up crop highlighting...');

  // FIRST: Verify crop highlighting utilities are installed
  if (typeof targetWindow.removeAllTileOverrides !== 'function') {
    debugLog('CROP_HIGHLIGHT', 'Crop highlighting utilities not available - they should have been installed earlier');
  } else {
    debugLog('CROP_HIGHLIGHT', 'Crop highlighting utilities confirmed available');
  }

  if (cropHighlightInstalled) {
    debugLog('CROP_HIGHLIGHT', 'Crop highlighting system already installed');
    return;
  }

  function cropHighlightHandler(e) {
    // Ctrl+H clears all highlights
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (typeof targetWindow.removeAllTileOverrides === 'function') {
          targetWindow.removeAllTileOverrides();
          debugLog('CROP_HIGHLIGHT', 'Ctrl+H → cleared all tile highlights');
        } else {
          debugLog('CROP_HIGHLIGHT', 'removeAllTileOverrides function not available');
        }
      } catch (err) {
        debugError('CROP_HIGHLIGHT', 'Failed to clear highlights', err);
      }
    }
  }

  targetWindow.addEventListener('keydown', cropHighlightHandler, true);
  cropHighlightInstalled = true;
  debugLog('CROP_HIGHLIGHT', 'Ctrl+H crop highlight hotkey installed');
}

/* ====================================================================================
 * EVENT HANDLERS * ====================================================================================
 */

/**
 * Setup event handlers for crop highlighting buttons
 *
 * @param {Document|HTMLElement} [context] - Context to search for elements (default: document)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.applyCropHighlighting] - Apply highlighting function
 * @param {Function} [dependencies.clearCropHighlighting] - Clear highlighting function
 */
export function setupCropHighlightingHandlers(context = document, dependencies = {}) {
  const {
    applyCropHighlighting: applyFn = applyCropHighlighting,
    clearCropHighlighting: clearFn = clearCropHighlighting
  } = dependencies;

  // Apply highlighting button
  const applyHighlightingBtn = context.querySelector('#apply-highlighting-btn');
  if (applyHighlightingBtn) {
    applyHighlightingBtn.addEventListener('click', () => {
      applyFn(dependencies);
    });
  }

  // Clear highlighting button
  const clearHighlightingBtn = context.querySelector('#clear-highlighting-btn');
  if (clearHighlightingBtn) {
    clearHighlightingBtn.addEventListener('click', () => {
      clearFn(dependencies);
    });
  }
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Atom Initialization
  initializeCropHighlightingAtoms,

  // Core Functions  clearCropHighlighting,
  debugCropHighlighting,
  applyCropHighlighting,

  // Automatic & Hotkeys  setupAutomaticCropHighlighting,
  setupCropHighlightingSystem,

  // Event Handlers  setupCropHighlightingHandlers
};
