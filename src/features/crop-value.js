/**
 * CROP VALUE & TURTLE TIMER MODULE
 * ====================================================================================
 * Crop value calculation and growth time estimation system
 *
 * @module features/crop-value
 *
 * Features:
 * - Accurate crop value calculation with all mutation types
 * - Multi-harvest crop support with slot tracking
 * - Egg growth time estimation with pet boosts
 * - Crop growth time estimation (turtle timer)
 * - Friend bonus integration
 * - Tooltip validation and positioning
 *
 * Dependencies:
 * - Core: UnifiedState, targetWindow, targetDocument
 * - Logging: console, productionLog
 * - Pet Functions: getEggExpectations, estimateUntilLatestCrop
 * - Atom Hooks: hookAtom, listenToSlotIndexAtom
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
 * Track current slot index for multi-harvest crops
 * Updated ONLY when cycling (X/C keys) in handleTooltipChange()
 * CRITICAL: Must be on window object to be accessible from both scopes
 * @type {number}
 */
if (typeof window !== 'undefined' && typeof window._mgtools_currentSlotIndex === 'undefined') {
  window._mgtools_currentSlotIndex = 0;
}

/* ====================================================================================
 * VALUE CONSTANTS & MULTIPLIERS * ====================================================================================
 */

/**
 * Base values for all crop species
 * @const {Object<string, number>}
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
 * Color mutation multipliers
 * @const {Object<string, number>}
 */
export const COLOR_MULT = {
  Gold: 25,
  Rainbow: 50
};

/**
 * Weather mutation multipliers
 * @const {Object<string, number>}
 */
export const WEATHER_MULT = {
  Wet: 2,
  Chilled: 2,
  Frozen: 10
};

/**
 * Time mutation multipliers
 * @const {Object<string, number>}
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
 * Weather + Time combination multipliers
 * @const {Object<string, number>}
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
 * Calculate mutation multiplier for crop value
 * Matches FriendsScript logic for accurate value calculation
 *
 * @param {Array<string>} mutations - Array of mutation strings
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.COLOR_MULT] - Color multipliers
 * @param {Object} [dependencies.WEATHER_MULT] - Weather multipliers
 * @param {Object} [dependencies.TIME_MULT] - Time multipliers
 * @param {Object} [dependencies.WEATHER_TIME_COMBO] - Combined multipliers
 * @returns {number} Total mutation multiplier
 */
export function calculateMutationMultiplier(mutations, dependencies = {}) {
  const {
    COLOR_MULT: colorMult = COLOR_MULT,
    WEATHER_MULT: weatherMult = WEATHER_MULT,
    TIME_MULT: timeMult = TIME_MULT,
    WEATHER_TIME_COMBO: weatherTimeCombo = WEATHER_TIME_COMBO
  } = dependencies;

  if (!mutations || !Array.isArray(mutations)) return 1;

  // Pick best color multiplier
  let color = 1;
  for (const m of mutations) {
    if (m === 'Rainbow' && colorMult.Rainbow > color) color = colorMult.Rainbow;
    if (m === 'Gold' && colorMult.Gold > color) color = colorMult.Gold;
  }

  // Pick best weather
  let weather = null;
  for (const m of mutations) {
    if (weatherMult[m]) {
      if (!weather || weatherMult[m] > weatherMult[weather]) {
        weather = m;
      }
    }
  }

  // Pick best time
  let time = null;
  for (const m of mutations) {
    if (timeMult[m]) {
      if (!time || timeMult[m] > timeMult[time]) {
        time = m;
      }
    }
  }

  // Calculate weather+time multiplier
  let wt = 1;
  if (!weather && !time) wt = 1;
  else if (weather && !time) wt = weatherMult[weather];
  else if (!weather && time) wt = timeMult[time];
  else {
    const combo = `${weather}+${time}`;
    wt = weatherTimeCombo[combo] || Math.max(weatherMult[weather], timeMult[time]);
  }

  return Math.round(color * wt);
}

/* ====================================================================================
 * VALUE CALCULATION FUNCTIONS * ====================================================================================
 */

/**
 * Get current slot index for multi-harvest crops
 *
 * @param {Array} currentCrop - Current crop array
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @returns {number} Current slot index (0 if single slot)
 */
export function getCurrentSlotIndex(currentCrop, dependencies = {}) {
  const { targetWindow = typeof window !== 'undefined' ? window : null } = dependencies;

  if (!currentCrop || currentCrop.length <= 1) return 0;
  return targetWindow._mgtools_currentSlotIndex || 0;
}

/**
 * Calculate value of current visible crop slot
 *
 * @param {Array} currentCrop - Current crop array
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.SPECIES_VALUES] - Species values
 * @param {Function} [dependencies.calculateMutationMultiplier] - Mutation multiplier function
 * @param {Function} [dependencies.getCurrentSlotIndex] - Slot index function
 * @returns {number} Calculated crop value
 */
export function calculateCurrentSlotValue(currentCrop, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetWindow = typeof window !== 'undefined' ? window : null,
    SPECIES_VALUES: speciesValues = SPECIES_VALUES,
    calculateMutationMultiplier: calcMult = calculateMutationMultiplier,
    getCurrentSlotIndex: getSlotIndex = getCurrentSlotIndex
  } = dependencies;

  if (!currentCrop || currentCrop.length === 0) return 0;

  const friendBonus = UnifiedState.atoms.friendBonus || 1;
  const slotIndex = getSlotIndex(currentCrop, dependencies);

  // If we have sorted indices, use them to get the actual slot
  const sortedIndices = UnifiedState.atoms.sortedSlotIndices || targetWindow.sortedSlotIndices;
  let actualSlotIndex = slotIndex;

  if (sortedIndices && Array.isArray(sortedIndices) && sortedIndices.length > 0) {
    // The window._mgtools_currentSlotIndex is the position in the sorted array
    // The value at that position is the actual slot index in currentCrop
    if (slotIndex < sortedIndices.length) {
      actualSlotIndex = sortedIndices[slotIndex];
      productionLog(`🔄 [CROP-VALUE] Using sorted index: position ${slotIndex} → actual slot ${actualSlotIndex}`);
    }
  }

  // Debug logging
  productionLog(`📊 [CROP-VALUE] Calculating value for slot ${actualSlotIndex}/${currentCrop.length}`, {
    displayIndex: slotIndex,
    actualSlotIndex,
    cropCount: currentCrop.length,
    windowIndex: targetWindow._mgtools_currentSlotIndex,
    sortedIndices
  });

  // Validate slot index
  if (actualSlotIndex < 0 || actualSlotIndex >= currentCrop.length) {
    productionError(`[CROP-VALUE] Invalid slot index: ${actualSlotIndex} for crop array length: ${currentCrop.length}`);
    targetWindow._mgtools_currentSlotIndex = 0; // Reset to safe value
    return 0;
  }

  const slot = currentCrop[actualSlotIndex];
  if (!slot || !slot.species) {
    productionLog(`[CROP-VALUE] No species at slot ${actualSlotIndex}`, slot);
    return 0;
  }

  const multiplier = calcMult(slot.mutations, dependencies);
  const speciesVal = speciesValues[slot.species] || 0;
  const scale = slot.targetScale || 1;
  const value = Math.round(multiplier * speciesVal * scale * friendBonus);

  // Always log for debugging
  productionLog(
    `💰 [CROP-VALUE] Slot ${actualSlotIndex}/${currentCrop.length}: ${slot.species} = ${value.toLocaleString()}`,
    {
      species: slot.species,
      speciesVal,
      multiplier,
      scale,
      friendBonus,
      value
    }
  );

  return value;
}

/**
 * Validate tooltip DOM element position and size
 * Prevents value display in UI elements (top-left corner, off-screen, etc.)
 *
 * @param {HTMLElement} element - Element to validate
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Object} [dependencies.UnifiedState] - Unified state for debug mode
 * @returns {boolean} True if element is a valid tooltip
 */
export function isValidTooltipElement(element, dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState
  } = dependencies;

  if (!element) return false;

  try {
    const rect = element.getBoundingClientRect();

    // Reject if element is in top-left corner (likely UI element, not tooltip)
    // Tooltips should be centered or follow cursor, never stuck at 0,0
    if (rect.top < 50 && rect.left < 50) {
      return false; // Silent rejection
    }

    // Reject if element is too small (likely not a tooltip container)
    if (rect.width < 50 || rect.height < 30) {
      return false; // Silent rejection
    }

    // Reject if element is off-screen
    const viewportWidth = window.innerWidth || targetDocument.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || targetDocument.documentElement.clientHeight;

    if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight) {
      return false; // Silent rejection
    }

    // Additional check: Element should contain text (tooltips always have content)
    const hasText = element.textContent && element.textContent.trim().length > 0;
    if (!hasText) {
      return false; // Silent rejection
    }

    // Passed all validation checks
    return true;
  } catch (e) {
    // Only log errors, not validation failures
    if (UnifiedState?.data?.settings?.debugMode) {
      productionError('[CROP-VALUE] ❌ Error validating tooltip element:', e);
    }
    return false;
  }
}

/* ====================================================================================
 * TURTLE TIMER & UI INTEGRATION * ====================================================================================
 */

/**
 * Insert turtle timer estimate and slot value into crop tooltip
 * Handles both crops and eggs with proper time calculations
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.isValidTooltipElement] - Tooltip validation function
 * @param {Function} [dependencies.getEggExpectations] - Egg expectations function
 * @param {Function} [dependencies.estimateUntilLatestCrop] - Crop estimate function
 * @param {Function} [dependencies.getCurrentSlotIndex] - Slot index function
 * @param {Function} [dependencies.calculateCurrentSlotValue] - Value calculation function
 */
export function insertTurtleEstimate(dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    isValidTooltipElement: validateTooltip = isValidTooltipElement,
    getEggExpectations = targetWindow?.getEggExpectations,
    estimateUntilLatestCrop = targetWindow?.estimateUntilLatestCrop,
    getCurrentSlotIndex: getSlotIndex = getCurrentSlotIndex,
    calculateCurrentSlotValue: calcSlotValue = calculateCurrentSlotValue
  } = dependencies;

  const doc = targetDocument || document;

  // Remove existing turtle estimates and slot values
  doc
    .querySelectorAll('[data-turtletimer-estimate="true"], [data-turtletimer-slot-value="true"]')
    .forEach(el => el.remove());

  // CORRECT SELECTOR: Get the last child's parent (where weight/mutations are shown)
  let currentPlantTooltipFlexbox = doc.querySelector(
    'div.QuinoaUI > div.McFlex:nth-of-type(2) > div.McGrid > div.McFlex:nth-of-type(3) > :first-child > :last-child p'
  )?.parentElement;

  if (!currentPlantTooltipFlexbox) {
    // PERFORMANCE FIX: Validate tooltip position before using fallback selectors
    // This prevents slot value from appearing in top-left corner UI elements
    const altSelectors = [
      'div.QuinoaUI .McFlex .McGrid',
      '[class*="tooltip"] [class*="flex"]',
      'div[class*="plant"] div[class*="info"]',
      '.McFlex .McGrid .McFlex',
      'div.QuinoaUI div.McFlex div.McGrid'
    ];

    for (const sel of altSelectors) {
      const el = doc.querySelector(sel);
      if (el && validateTooltip(el, dependencies)) {
        currentPlantTooltipFlexbox = el;
        break;
      }
    }

    if (!currentPlantTooltipFlexbox) {
      return;
    }
  }

  // Final validation: Ensure element is in valid screen position
  if (!validateTooltip(currentPlantTooltipFlexbox, dependencies)) {
    productionWarn('[CROP-VALUE] ⚠️ Rejected invalid tooltip position - skipping slot value display');
    return;
  }

  // Try multiple ways to get current crop/egg
  let currentCrop = targetWindow.currentCrop || UnifiedState.atoms.currentCrop;
  const currentEgg = targetWindow.currentEgg || UnifiedState.atoms.currentEgg;

  // FALLBACK: Try to get from game state directly
  if (!currentCrop && !currentEgg) {
    // Try different possible locations
    const possibleLocations = [
      targetWindow.gameState?.currentCrop,
      targetWindow.gameState?.currentEgg,
      targetWindow.UnifiedState?.atoms?.currentCrop,
      targetWindow.garden?.currentTile?.crop,
      targetWindow.playerState?.standingOn?.crop,
      targetWindow.jotaiAtomCache?.get?.(
        '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom'
      )?.debugValue
    ];

    for (const loc of possibleLocations) {
      if (loc) {
        currentCrop = Array.isArray(loc) ? loc : [loc];
        break;
      }
    }

    // ULTIMATE FALLBACK: Parse the tooltip DOM itself since game is rendering it
    if (!currentCrop && !currentEgg && currentPlantTooltipFlexbox) {
      const tooltipText = currentPlantTooltipFlexbox.textContent || '';

      // Look for egg species names (Common Egg, Rare Egg, etc.)
      // FIXED: Changed "Mythic" to "Mythical", added "Uncommon", removed non-existent "Epic" and "Special"
      const eggPattern = /(Common|Uncommon|Rare|Legendary|Mythical)\s*Egg/i;
      const eggMatch = tooltipText.match(eggPattern);

      if (eggMatch) {
        const eggSpecies = eggMatch[0].replace(/\s+/g, '');
        currentCrop = [
          {
            species: eggSpecies,
            type: 'egg',
            category: 'egg',
            isEgg: true
          }
        ];
      } else {
        // Try to find crop species (Carrot, Wheat, etc.)
        const cropPatterns = [
          /Carrot/i,
          /Wheat/i,
          /Corn/i,
          /Tomato/i,
          /Potato/i,
          /Pumpkin/i,
          /Watermelon/i,
          /Strawberry/i,
          /Blueberry/i,
          /Rose/i,
          /Tulip/i,
          /Sunflower/i,
          /Daisy/i,
          /Lily/i
        ];

        for (const pattern of cropPatterns) {
          const cropMatch = tooltipText.match(pattern);
          if (cropMatch) {
            currentCrop = [
              {
                species: cropMatch[0],
                type: 'crop',
                category: 'plant'
              }
            ];
            break;
          }
        }
      }
    }
  }

  // Check if we're looking at an egg (multiple ways)
  const isPlantedEgg1 = currentCrop?.[0]?.species?.endsWith('Egg');
  const isPlantedEgg2 = currentCrop?.[0]?.species?.includes('Egg');
  const isPlantedEgg3 = currentCrop?.[0]?.type === 'egg';
  const isPlantedEgg4 = currentCrop?.[0]?.category === 'egg';

  const isPlantedEgg = isPlantedEgg1 || isPlantedEgg2 || isPlantedEgg3 || isPlantedEgg4;
  const isEgg = currentEgg || isPlantedEgg;

  if (isEgg) {
    // Handle egg timer with actual calculations
    const activePets = targetWindow.activePets || UnifiedState.atoms.activePets;
    const eggExpectations = getEggExpectations(activePets);

    // CRITICAL: Find the ACTUAL time element in the tooltip (same way as crops)
    const timeElement = [...currentPlantTooltipFlexbox.childNodes].find(el =>
      /^\d+h(?: \d+m)?(?: \d+s)?$|^\d+m(?: \d+s)?$|^\d+s$/.test((el.textContent || '').trim())
    );

    if (!timeElement) {
      return;
    }

    const timeText = timeElement.textContent.trim();

    // Parse the actual remaining time from tooltip
    const timeMatch = timeText.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
    if (!timeMatch) {
      return;
    }

    const hours = parseInt(timeMatch[1] || '0', 10);
    const minutes = parseInt(timeMatch[2] || '0', 10);
    const seconds = parseInt(timeMatch[3] || '0', 10);

    // Convert to total seconds
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      return;
    }

    if (eggExpectations && eggExpectations.expectedMinutesRemoved > 0) {
      // Calculate boosted time
      const remainingRealMinutes = totalSeconds / 60;
      const effectiveRate = eggExpectations.expectedMinutesRemoved + 1;
      const boostedRealMinutes = remainingRealMinutes / effectiveRate;
      const boostedTotalSeconds = boostedRealMinutes * 60;

      const boostedHours = Math.floor(boostedTotalSeconds / 3600);
      const boostedMinutes = Math.floor((boostedTotalSeconds % 3600) / 60);
      const boostedSeconds = Math.floor(boostedTotalSeconds % 60);

      const eggEstimateEl = doc.createElement('p');
      eggEstimateEl.dataset.turtletimerEstimate = 'true';

      // Format output similar to crop timer
      if (boostedHours > 0) {
        eggEstimateEl.textContent = `🥚 Egg: ${boostedHours}h ${boostedMinutes}m`;
      } else {
        eggEstimateEl.textContent = `🥚 Egg: ${boostedMinutes}m ${boostedSeconds}s`;
      }

      eggEstimateEl.style.color = '#fbbf24'; // Yellow color
      currentPlantTooltipFlexbox.appendChild(eggEstimateEl);
    }
    return;
  }

  if (!currentCrop || currentCrop.length === 0) return;

  const currentSlotIndex = getSlotIndex(currentCrop, dependencies);

  // Find time element (for growing crops)
  const timeElement = [...currentPlantTooltipFlexbox.childNodes].find(el =>
    /^\d+h(?: \d+m)?(?: \d+s)?$|^\d+m(?: \d+s)?$|^\d+s$/.test((el.textContent || '').trim())
  );

  // Show turtle estimate if there's a time element and crop is growing
  if (timeElement) {
    const activePets = targetWindow.activePets || UnifiedState.atoms.activePets;

    // Get the current slot index for turtle timer
    const slotIndex = getSlotIndex(currentCrop, dependencies);
    const sortedIndices = UnifiedState.atoms.sortedSlotIndices || window.sortedSlotIndices;
    let actualSlotIndex = slotIndex;

    if (sortedIndices && Array.isArray(sortedIndices) && sortedIndices.length > 0 && slotIndex < sortedIndices.length) {
      actualSlotIndex = sortedIndices[slotIndex];
    }

    // Pass the actual slot index to estimate function
    const estimate = estimateUntilLatestCrop(currentCrop, activePets, actualSlotIndex);

    if (estimate) {
      const estimateEl = doc.createElement('p');
      estimateEl.dataset.turtletimerEstimate = 'true';
      estimateEl.textContent = estimate;
      estimateEl.style.color = '#4ade80'; // Green-400 color
      currentPlantTooltipFlexbox.appendChild(estimateEl);
    }
  }

  // Show current slot value
  const slotValue = calcSlotValue(currentCrop, dependencies);
  if (slotValue > 0) {
    const slotValueEl = doc.createElement('p');
    slotValueEl.dataset.turtletimerSlotValue = 'true';
    slotValueEl.innerHTML =
      `<img src="https://cdn.discordapp.com/emojis/1425389207525920808.webp?size=96" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 2px; display: inline-block;">` +
      Number(slotValue).toLocaleString();
    currentPlantTooltipFlexbox.appendChild(slotValueEl);
  }
}

/**
 * Initialize turtle timer atom hooks and event listeners
 * Sets up reactive updates when crops change and movement key handlers
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.console] - Console object
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.hookAtom] - Atom hook function
 * @param {Function} [dependencies.listenToSlotIndexAtom] - Slot index listener
 * @param {Function} [dependencies.getCropHash] - Crop hash function
 * @param {Function} [dependencies.insertTurtleEstimate] - Insert estimate function
 */
export function initializeTurtleTimer(dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    console: consoleObj = typeof console !== 'undefined' ? console : null,
    productionLog = targetWindow?.productionLog || (() => {}),
    hookAtom = targetWindow?.hookAtom,
    listenToSlotIndexAtom = targetWindow?.listenToSlotIndexAtom,
    getCropHash = targetWindow?.getCropHash,
    insertTurtleEstimate: insertEstimate = insertTurtleEstimate
  } = dependencies;

  consoleObj.log('🐢🐢🐢 [TURTLE-TIMER-START] initializeTurtleTimer() called!');
  productionLog('🐢 [TURTLE-TIMER] Initializing crop growth estimate...');

  // Start listening to slot index changes
  listenToSlotIndexAtom();

  // Also hook the sorted slot indices atom for proper order tracking
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentSortedGrowSlotIndicesAtom',
    'sortedSlotIndices',
    value => {
      return value;
    }
  );

  // Hook currentCrop atom
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom',
    'currentCrop',
    value => {
      // CRITICAL: Extract the actual crop data from the atom value
      // The atom might return {garden: {tileObjects: [...]}} not just the crop array
      let cropData = null;
      if (value?.garden?.tileObjects) {
        cropData = value.garden.tileObjects;
      } else if (Array.isArray(value)) {
        cropData = value;
      }

      // Store the extracted crop data
      UnifiedState.atoms.currentCrop = cropData;
      targetWindow.currentCrop = cropData;

      const currentHash = getCropHash(cropData || value);

      if (currentHash !== globalThis.prevCropHash) {
        globalThis.prevCropHash = currentHash;

        // Update estimate when crop changes
        requestAnimationFrame(() => insertEstimate(dependencies));
      }

      return value; // Return original value to game
    }
  );

  const doc = targetDocument;

  // Also poll while player is on a tile to catch any missed updates
  setInterval(() => {
    let currentCrop = targetWindow.currentCrop || UnifiedState.atoms.currentCrop;
    const currentEgg = targetWindow.currentEgg || UnifiedState.atoms.currentEgg;

    // Try to find crop data manually - DIRECT ATOM READING
    let manualCrop = null;
    if (!currentCrop) {
      // Step 1: Find Jotai store if not already found
      if (!targetWindow.__foundJotaiStore) {
        const possibleStores = [
          targetWindow.jotaiStore,
          targetWindow.__JOTAI_STORE__,
          targetWindow.store,
          targetWindow.getDefaultStore?.(),
          targetWindow.globalStore,
          targetWindow.__jotaiStore,
          targetWindow._jotaiStore
        ];

        for (const store of possibleStores) {
          // Make sure it's NOT cookieStore (browser API)
          // And verify it looks like a Jotai store (has sub/unsub or set methods)
          if (
            store &&
            typeof store.get === 'function' &&
            store !== targetWindow.cookieStore &&
            store !== window.cookieStore &&
            (typeof store.set === 'function' || typeof store.sub === 'function')
          ) {
            targetWindow.__foundJotaiStore = store;
            break;
          }
        }

        // If still not found, explore window properties
        if (!targetWindow.__foundJotaiStore) {
          const storeKeys = Object.keys(targetWindow).filter(
            k => k.toLowerCase().includes('store') || k.toLowerCase().includes('jotai')
          );

          for (const key of storeKeys) {
            const val = targetWindow[key];
            if (
              val &&
              typeof val === 'object' &&
              typeof val.get === 'function' &&
              val !== targetWindow.cookieStore &&
              val !== window.cookieStore &&
              (typeof val.set === 'function' || typeof val.sub === 'function')
            ) {
              targetWindow.__foundJotaiStore = val;
              break;
            }
          }

          // ENHANCED: Explore jotaiAtomCache itself for store reference
          if (!targetWindow.__foundJotaiStore && targetWindow.jotaiAtomCache) {
            const cache = targetWindow.jotaiAtomCache;

            // Check if cache has store property
            if (cache.store) {
              targetWindow.__foundJotaiStore = cache.store;
            } else if (cache.cache && cache.cache.store) {
              targetWindow.__foundJotaiStore = cache.cache.store;
            }
          }
        }
      }

      // Step 2: Try to read atom using the store
      const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
      if (atomCache && atomCache.get) {
        const cropAtom = atomCache.get(
          '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom'
        );

        if (cropAtom) {
          // Try to read using found store
          if (targetWindow.__foundJotaiStore) {
            try {
              const cropValue = targetWindow.__foundJotaiStore.get(cropAtom);

              // Handle if it's a Promise
              if (cropValue && typeof cropValue.then === 'function') {
                cropValue
                  .then(val => {
                    targetWindow.currentCrop = val;
                    UnifiedState.atoms.currentCrop = val;

                    // Trigger update
                    if (val && !document.querySelector('[data-turtletimer-estimate="true"]')) {
                      insertEstimate(dependencies);
                    }
                  })
                  .catch(e => {
                    // Promise rejected
                  });
              } else {
                manualCrop = cropValue;

                // Store it for next time
                targetWindow.currentCrop = cropValue;
                UnifiedState.atoms.currentCrop = cropValue;
              }
            } catch (e) {
              // Error reading atom from store
            }
          }

          // Fallback: try debugValue
          if (!manualCrop && cropAtom.debugValue !== undefined) {
            manualCrop = cropAtom.debugValue;
          }

          // ENHANCED: Try calling atom.read directly if it exists
          if (!manualCrop && typeof cropAtom.read === 'function') {
            try {
              const mockGetter = a => {
                if (a === cropAtom && cropAtom.init !== undefined) {
                  return cropAtom.init;
                }
                return undefined;
              };
              const directValue = cropAtom.read(mockGetter);
              if (directValue && typeof directValue.then !== 'function') {
                manualCrop = directValue;
              }
            } catch (e) {
              // Failed to call atom.read()
            }
          }
        }
      }
    }

    // Update currentCrop if we found something manually
    if (manualCrop && !currentCrop) {
      currentCrop = manualCrop;
    }

    // Check if tooltip is visible (player might be standing on something)
    const doc = targetDocument || document;
    const tooltipVisible = doc.querySelector('div.QuinoaUI > div.McFlex:nth-of-type(2) > div.McGrid');

    // If player is standing on something (has crop/egg data OR tooltip is visible), ensure estimate is shown
    if (currentCrop || currentEgg || tooltipVisible) {
      const hasExisting = doc.querySelector('[data-turtletimer-estimate="true"], [data-turtletimer-slot-value="true"]');
      if (!hasExisting) {
        insertEstimate(dependencies);
      }
    }
  }, 1000); // Check every second

  // Predicate: check if keypress is as movement key
  const isMovementKeypress = e =>
    !e.ctrlKey &&
    !e.shiftKey &&
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);

  // Curried helper: takes a handler and runs it only if it's a movement key
  const onMovementKey = handler => e => {
    if (isMovementKeypress(e)) handler(e);
  };

  // Remove turtle timer hints on movement key down
  doc.addEventListener(
    'keydown',
    onMovementKey(() => {
      doc
        .querySelectorAll('[data-turtletimer-estimate="true"], [data-turtletimer-slot-value="true"]')
        .forEach(el => el.remove());
    })
  );

  // Insert turtle estimate on movement key up
  doc.addEventListener(
    'keyup',
    onMovementKey(() => {
      insertEstimate(dependencies);
    })
  );

  // Slot index tracking is now handled by listenToSlotIndexAtom()
  // which directly listens to the game's myCurrentGrowSlotIndex atom

  productionLog('✅ [TURTLE-TIMER] Turtle timer initialized successfully');
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Constants  SPECIES_VALUES,
  COLOR_MULT,
  WEATHER_MULT,
  TIME_MULT,
  WEATHER_TIME_COMBO,

  // Multiplier Calculation  calculateMutationMultiplier,

  // Value Calculation  getCurrentSlotIndex,
  calculateCurrentSlotValue,
  isValidTooltipElement,

  // Turtle Timer & UI Integration  insertTurtleEstimate,
  initializeTurtleTimer
};
