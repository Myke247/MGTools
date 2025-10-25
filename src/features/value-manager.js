/**
 * Enhanced Value Manager
 *
 * Performance-optimized value calculation system with caching and throttling.
 * Manages tile, inventory, and garden value calculations with automatic
 * cache invalidation based on game state changes.
 *
 * Features:
 * - 100ms throttle for performance optimization
 * - Automatic cache invalidation via MutationObserver
 * - Retry mechanism for resilient calculations
 * - Synchronized UI updates across all contexts
 * - Value calculations for tiles, inventory, and garden
 *
 * @module features/value-manager
 */

/**
 * Species base values (in coins)
 * Defines the base value for each crop species before mutations
 */
export const SPECIES_VALUES = {
  Sunflower: 750000,
  Starweaver: 10000000,
  DawnCelestial: 11000000,
  MoonCelestial: 11000000,
  Lychee: 50000,
  DragonFruit: 24500,
  PassionFruit: 24500,
  Lemon: 10000,
  Pepper: 7220,
  Grape: 7085,
  Bamboo: 500000,
  Cactus: 287000,
  Mushroom: 160000,
  BurrosTail: 6000,
  Lily: 20123,
  Banana: 1750,
  Coconut: 302,
  Echeveria: 5520,
  Pumpkin: 3700,
  Watermelon: 2708,
  Corn: 36,
  Daffodil: 1090,
  Tomato: 27,
  OrangeTulip: 767,
  Apple: 73,
  Blueberry: 23,
  Aloe: 310,
  Strawberry: 14,
  Carrot: 20
};

/**
 * Color mutation multipliers (Gold, Rainbow)
 */
export const COLOR_MULT = {
  Gold: 25,
  Rainbow: 50
};

/**
 * Weather mutation multipliers (Wet, Chilled, Frozen)
 */
export const WEATHER_MULT = {
  Wet: 2,
  Chilled: 2,
  Frozen: 10
};

/**
 * Time mutation multipliers (Dawnlit, Dawnbound, Amberlit, Amberbound, etc.)
 */
export const TIME_MULT = {
  Dawnlit: 2,
  Dawnbound: 3,
  Dawncharged: 3, // Same as Dawnbound
  Amberlit: 5,
  Ambershine: 5, // Internal game name for Amberlit
  Amberbound: 6,
  Ambercharged: 6 // Same as Amberbound
};

/**
 * Combined weather + time mutation multipliers
 * For crops with both weather and time mutations
 */
export const WEATHER_TIME_COMBO = {
  'Wet+Dawnlit': 3,
  'Chilled+Dawnlit': 3,
  'Wet+Amberlit': 6,
  'Chilled+Amberlit': 6,
  'Wet+Ambershine': 6, // Internal game name for Amberlit
  'Chilled+Ambershine': 6, // Internal game name for Amberlit
  'Frozen+Dawnlit': 11,
  'Frozen+Dawnbound': 12,
  'Frozen+Dawncharged': 12, // Same as Dawnbound
  'Frozen+Amberlit': 14,
  'Frozen+Ambershine': 14, // Internal game name for Amberlit
  'Frozen+Amberbound': 15,
  'Frozen+Ambercharged': 15 // Same as Amberbound
};

/**
 * Calculate total mutation multiplier for a crop
 *
 * Implements FriendsScript-compatible logic:
 * - Best color multiplier (Rainbow > Gold)
 * - Best weather multiplier (Frozen > Wet/Chilled)
 * - Best time multiplier (Amberbound > Amberlit > Dawnbound > Dawnlit)
 * - Combined weather+time bonus if both present
 *
 * @param {Array<string>} mutations - Array of mutation names
 * @returns {number} Total multiplier (minimum 1)
 *
 * @example
 * calculateMutationMultiplier(['Gold', 'Frozen', 'Amberbound']) // Returns 375 (25 * 15)
 */
export function calculateMutationMultiplier(mutations) {
  if (!mutations || !Array.isArray(mutations)) return 1;

  // Pick best color multiplier
  let color = 1;
  for (const m of mutations) {
    if (m === 'Rainbow' && COLOR_MULT.Rainbow > color) color = COLOR_MULT.Rainbow;
    if (m === 'Gold' && COLOR_MULT.Gold > color) color = COLOR_MULT.Gold;
  }

  // Pick best weather
  let weather = null;
  for (const m of mutations) {
    if (WEATHER_MULT[m]) {
      if (!weather || WEATHER_MULT[m] > WEATHER_MULT[weather]) {
        weather = m;
      }
    }
  }

  // Pick best time
  let time = null;
  for (const m of mutations) {
    if (TIME_MULT[m]) {
      if (!time || TIME_MULT[m] > TIME_MULT[time]) {
        time = m;
      }
    }
  }

  // Calculate weather+time multiplier
  let wt = 1;
  if (!weather && !time) wt = 1;
  else if (weather && !time) wt = WEATHER_MULT[weather];
  else if (!weather && time) wt = TIME_MULT[time];
  else {
    const combo = `${weather}+${time}`;
    wt = WEATHER_TIME_COMBO[combo] || Math.max(WEATHER_MULT[weather], TIME_MULT[time]);
  }

  return Math.round(color * wt);
}

/**
 * Enhanced Value Manager class
 *
 * Manages value calculations with performance optimizations:
 * - 100ms throttle to prevent excessive recalculations
 * - Cache system for tile, inventory, and garden values
 * - MutationObserver for automatic cache invalidation
 * - Retry mechanism for resilient error handling
 * - Synchronized UI updates across all contexts
 *
 * @class ValueManager
 */
export class ValueManager {
  /**
   * Create a ValueManager instance
   *
   * @param {Object} dependencies - Injected dependencies
   * @param {Object} dependencies.UnifiedState - Global state manager
   * @param {Document} dependencies.targetDocument - Target document for MutationObserver
   * @param {Function} dependencies.debugLog - Debug logging function
   * @param {Function} dependencies.debugError - Error logging function
   * @param {Function} dependencies.updateTabContent - Update main tab content
   * @param {Function} dependencies.updatePureOverlayContent - Update pure overlay content
   * @param {Function} dependencies.getValuesTabContent - Get values tab HTML
   * @param {Function} dependencies.refreshSeparateWindowPopouts - Refresh separate windows
   */
  constructor({
    UnifiedState,
    targetDocument,
    debugLog,
    debugError,
    updateTabContent,
    updatePureOverlayContent,
    getValuesTabContent,
    refreshSeparateWindowPopouts
  }) {
    this.UnifiedState = UnifiedState;
    this.targetDocument = targetDocument;
    this.debugLog = debugLog;
    this.debugError = debugError;
    this.updateTabContent = updateTabContent;
    this.updatePureOverlayContent = updatePureOverlayContent;
    this.getValuesTabContent = getValuesTabContent;
    this.refreshSeparateWindowPopouts = refreshSeparateWindowPopouts;

    this.cache = {
      inventoryValue: { value: 0, lastUpdate: 0 },
      tileValue: { value: 0, lastUpdate: 0 },
      gardenValue: { value: 0, lastUpdate: 0 }
    };
    this.throttleMs = 100; // 100ms throttle for value calculations
    this.retryAttempts = 3;
    this.observer = null;

    this.initializeObserver();
    this.debugLog('VALUE_MANAGER', 'ValueManager initialized', { throttleMs: this.throttleMs });
  }

  /**
   * Initialize MutationObserver for automatic cache invalidation
   *
   * Watches for DOM changes related to inventory, garden, and crops
   * to automatically invalidate cached values when game state changes.
   *
   * @returns {void}
   * @private
   */
  initializeObserver() {
    // Create MutationObserver to detect game state changes
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(mutations => {
        let shouldUpdate = false;
        mutations.forEach(mutation => {
          // Check if changes are related to inventory or game state
          if (
            mutation.target.className &&
            (mutation.target.className.includes('inventory') ||
              mutation.target.className.includes('garden') ||
              mutation.target.className.includes('crop'))
          ) {
            shouldUpdate = true;
          }
        });

        if (shouldUpdate) {
          this.invalidateCache();
          this.debugLog('VALUE_MANAGER', 'Game state change detected, invalidating cache');
        }
      });

      // Observe body for any game-related changes
      this.observer.observe(this.targetDocument.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-value']
      });
    }
  }

  /**
   * Get tile value (current crop being hovered)
   *
   * @param {boolean} forceRefresh - Force recalculation ignoring cache
   * @returns {number} Total value of current tile
   */
  getTileValue(forceRefresh = false) {
    return this.getCachedValue('tileValue', forceRefresh, () => this.calculateTileValue());
  }

  /**
   * Get total inventory value
   *
   * @param {boolean} forceRefresh - Force recalculation ignoring cache
   * @returns {number} Total value of all crops in inventory
   */
  getInventoryValue(forceRefresh = false) {
    return this.getCachedValue('inventoryValue', forceRefresh, () => this.calculateInventoryValue());
  }

  /**
   * Get total garden value (ready-to-harvest crops)
   *
   * @param {boolean} forceRefresh - Force recalculation ignoring cache
   * @returns {number} Total value of all harvestable crops in garden
   */
  getGardenValue(forceRefresh = false) {
    return this.getCachedValue('gardenValue', forceRefresh, () => this.calculateGardenValue());
  }

  /**
   * Get cached value with throttling and retry mechanism
   *
   * @param {string} type - Type of value ('tileValue', 'inventoryValue', 'gardenValue')
   * @param {boolean} forceRefresh - Force recalculation
   * @param {Function} calculator - Function to calculate new value
   * @returns {number} Calculated or cached value
   * @private
   */
  getCachedValue(type, forceRefresh, calculator) {
    const cached = this.cache[type];
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.lastUpdate < this.throttleMs) {
      return cached.value;
    }

    // Calculate new value with retry mechanism
    let attempts = 0;
    let value = 0;

    while (attempts < this.retryAttempts) {
      try {
        value = calculator();
        break;
      } catch (error) {
        attempts++;
        this.debugError('VALUE_MANAGER', `Calculation failed for ${type}, attempt ${attempts}`, error);

        if (attempts >= this.retryAttempts) {
          // Use cached value if all retries fail
          value = cached ? cached.value : 0;
          this.debugLog('VALUE_MANAGER', `Using cached value for ${type} after ${attempts} failures`);
        } else {
          // Brief delay before retry (synchronous for simplicity)
          const start = Date.now();
          while (Date.now() - start < 10 * attempts) {
            // Busy wait
          }
        }
      }
    }

    // Update cache
    this.cache[type] = {
      value,
      lastUpdate: now
    };

    return value;
  }

  /**
   * Calculate value of current tile (crop being hovered)
   *
   * @returns {number} Total value of all slots in current tile
   * @private
   */
  calculateTileValue() {
    const currentCrop = this.UnifiedState.atoms.currentCrop;
    const friendBonus = this.UnifiedState.atoms.friendBonus || 1;
    let tileValue = 0;

    if (currentCrop && currentCrop.length) {
      currentCrop.forEach(slot => {
        if (slot && slot.species) {
          const multiplier = calculateMutationMultiplier(slot.mutations);
          const speciesVal = SPECIES_VALUES[slot.species] || 0;
          const scale = slot.targetScale || 1;
          tileValue += Math.round(multiplier * speciesVal * scale * friendBonus);
        }
      });
    }

    return tileValue;
  }

  /**
   * Calculate total inventory value
   *
   * @returns {number} Total value of all produce items in inventory
   * @private
   */
  calculateInventoryValue() {
    const inventory = this.UnifiedState.atoms.inventory;
    const friendBonus = this.UnifiedState.atoms.friendBonus || 1;
    let inventoryValue = 0;

    if (inventory && inventory.items) {
      inventory.items.forEach(item => {
        if (item.itemType === 'Produce' && item.species) {
          const multiplier = calculateMutationMultiplier(item.mutations);
          const speciesVal = SPECIES_VALUES[item.species] || 0;
          const scale = item.scale || 1;
          inventoryValue += Math.round(multiplier * speciesVal * scale * friendBonus);
        }
      });
    }

    return inventoryValue;
  }

  /**
   * Calculate total garden value (ready-to-harvest crops only)
   *
   * @returns {number} Total value of all harvestable crops in garden
   * @private
   */
  calculateGardenValue() {
    const myGarden = this.UnifiedState.atoms.myGarden;
    const friendBonus = this.UnifiedState.atoms.friendBonus || 1;
    let gardenValue = 0;

    if (myGarden && myGarden.garden && myGarden.garden.tileObjects) {
      const now = Date.now();
      Object.values(myGarden.garden.tileObjects).forEach(tile => {
        if (tile.objectType === 'plant' && tile.slots) {
          tile.slots.forEach(slot => {
            if (slot && slot.species && slot.endTime && now >= slot.endTime) {
              const multiplier = calculateMutationMultiplier(slot.mutations);
              const speciesVal = SPECIES_VALUES[slot.species] || 0;
              const scale = slot.targetScale || 1;
              gardenValue += Math.round(multiplier * speciesVal * scale * friendBonus);
            }
          });
        }
      });
    }

    return gardenValue;
  }

  /**
   * Update all values and store in UnifiedState
   *
   * Calculates tile, inventory, and garden values and updates UI
   *
   * @param {boolean} forceRefresh - Force recalculation ignoring cache
   * @returns {Object} Object with tileValue, inventoryValue, gardenValue
   */
  updateAllValues(forceRefresh = false) {
    const tileValue = this.getTileValue(forceRefresh);
    const inventoryValue = this.getInventoryValue(forceRefresh);
    const gardenValue = this.getGardenValue(forceRefresh);

    // Store in UnifiedState
    this.UnifiedState.data.tileValue = tileValue;
    this.UnifiedState.data.inventoryValue = inventoryValue;
    this.UnifiedState.data.gardenValue = gardenValue;

    // Update UI if values tab is active
    this.updateValueDisplays();

    this.debugLog('VALUE_MANAGER', 'All values updated', {
      tileValue,
      inventoryValue,
      gardenValue,
      cached: Object.keys(this.cache).map(k => `${k}: ${Date.now() - this.cache[k].lastUpdate}ms ago`)
    });

    return { tileValue, inventoryValue, gardenValue };
  }

  /**
   * Update value displays in all UI contexts
   *
   * Updates main tab, overlays, and separate windows showing values
   *
   * @returns {void}
   */
  updateValueDisplays() {
    // Update main window if values tab is active
    if (this.UnifiedState.activeTab === 'values') {
      this.updateTabContent();
    }

    // Update all overlay windows showing values tab
    this.UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
      if (overlay && document.contains(overlay) && tabName === 'values') {
        if (overlay.className.includes('mga-overlay-content-only')) {
          this.updatePureOverlayContent(overlay, tabName);
          this.debugLog('VALUE_MANAGER', 'Updated pure values overlay');
        } else {
          // Legacy overlay structure
          const overlayContent = overlay.querySelector('.mga-overlay-content > div');
          if (overlayContent) {
            overlayContent.innerHTML = this.getValuesTabContent();
            this.debugLog('VALUE_MANAGER', 'Updated legacy values overlay');
          }
        }
      }
    });

    // Update separate windows
    this.UnifiedState.data.popouts.windows.forEach((windowRef, tabName) => {
      if (windowRef && !windowRef.closed && tabName === 'values') {
        try {
          const freshContent = this.getValuesTabContent();
          const contentElement = windowRef.document.getElementById('content');
          if (contentElement) {
            contentElement.innerHTML = freshContent;
            // Set up dashboard handlers in the separate window
            if (window.resourceDashboard) {
              window.resourceDashboard.setupDashboardHandlers(windowRef.document);
            }
            this.debugLog('VALUE_MANAGER', 'Updated values in separate window');
          }
        } catch (error) {
          this.debugError('VALUE_MANAGER', 'Failed to update separate window', error);
        }
      }
    });
  }

  /**
   * Invalidate all cached values
   *
   * Forces next getValue calls to recalculate
   *
   * @returns {void}
   */
  invalidateCache() {
    Object.keys(this.cache).forEach(key => {
      this.cache[key].lastUpdate = 0;
    });
  }

  /**
   * Get manager status and cache info
   *
   * @returns {Object} Status object with cache info, throttle, and retry settings
   */
  getStatus() {
    const now = Date.now();
    return {
      cache: Object.keys(this.cache).reduce((acc, key) => {
        const cached = this.cache[key];
        acc[key] = {
          value: cached.value,
          age: now - cached.lastUpdate,
          fresh: now - cached.lastUpdate < this.throttleMs
        };
        return acc;
      }, {}),
      throttleMs: this.throttleMs,
      retryAttempts: this.retryAttempts
    };
  }

  /**
   * Destroy the ValueManager and cleanup resources
   *
   * Disconnects MutationObserver and clears cache
   *
   * @returns {void}
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Initialize global ValueManager instance
 *
 * Creates a singleton ValueManager if not already created
 *
 * @param {Object} dependencies - Injected dependencies
 * @returns {ValueManager} Global ValueManager instance
 *
 * @example
 * const valueManager = initializeValueManager({ UnifiedState, targetDocument, ... });
 */
export function initializeValueManager(dependencies) {
  if (!dependencies._globalValueManager) {
    dependencies._globalValueManager = new ValueManager(dependencies);
  }
  return dependencies._globalValueManager;
}

/**
 * Update all values and refresh UI
 *
 * Convenience function to update all values and refresh active UI contexts
 *
 * @param {Object} dependencies - Injected dependencies
 * @returns {void}
 *
 * @example
 * updateValues({ UnifiedState, targetDocument, debugLog, ... });
 */
export function updateValues(dependencies) {
  // Use enhanced ValueManager instead of manual calculations
  const valueManager = dependencies._globalValueManager || initializeValueManager(dependencies);
  valueManager.updateAllValues();

  // Refresh Values tab if it's currently active
  if (dependencies.UnifiedState.activeTab === 'values') {
    dependencies.updateTabContent();
  }

  // Refresh any open Values overlays
  dependencies.UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
    if (overlay && document.contains(overlay) && tabName === 'values') {
      if (overlay.className.includes('mga-overlay-content-only')) {
        dependencies.updatePureOverlayContent(overlay, tabName);
      }
    }
  });

  // Refresh Values in separate window popouts
  dependencies.refreshSeparateWindowPopouts('values');

  dependencies.debugLog('VALUES_UPDATE', 'Values updated and UI refreshed');
}
