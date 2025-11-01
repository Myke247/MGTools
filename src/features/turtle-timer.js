/**
 * Turtle Timer System Module
 * Specialized timer for turtle pet growth boosts with experience tracking
 * and scale bonus calculations
 *
 * Features:
 * - Turtle Plant Growth Boost II calculations
 * - Experience-based XP component (0-30 minutes removed)
 * - Scale-based bonus component (0-20 points)
 * - Egg growth boost support
 * - Multi-harvest crop slot tracking
 * - Tooltip validation to prevent UI contamination
 * - Multiple fallback strategies for crop data
 * - Jotai atom store integration
 *
 * @module TurtleTimer
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/**
 * Generate hash for crop change detection
 *
 * @param {object|Array} crop - Crop data
 * @returns {string} Hash string
 */
export function getCropHash(crop) {
  try {
    return JSON.stringify(crop);
  } catch (e) {
    return `__ref_changed__${Date.now()}`;
  }
}

/**
 * Calculate turtle pet growth boost expectations
 *
 * @param {Array} activePets - Array of active pets
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - Unified state object
 * @param {Function} dependencies.logDebug - Debug logging function
 * @returns {object} Object with expectedMinutesRemoved
 */
export function getTurtleExpectations(activePets, dependencies = {}) {
  const { UnifiedState, logDebug = console.log.bind(console) } = dependencies;

  // Debug: Only log when debug mode is enabled
  if (UnifiedState?.data?.settings?.debugMode) {
    logDebug('TURTLE', 'Checking active pets:', {
      petsCount: activePets?.length || 0,
      pets: (activePets || []).map(p => ({
        species: p?.petSpecies,
        hunger: p?.hunger,
        abilities: p?.abilities
      }))
    });
  }

  const turtles = (activePets || []).filter(
    p =>
      p &&
      p.petSpecies === 'Turtle' &&
      p.hunger > 0 &&
      p.abilities?.some(
        a =>
          a === 'Plant Growth Boost II' ||
          a === 'PlantGrowthBoostII' ||
          a === 'Plant Growth Boost 2' ||
          (typeof a === 'string' &&
            a.toLowerCase().includes('plant') &&
            a.toLowerCase().includes('growth') &&
            (a.includes('II') || a.includes('2')))
      )
  );

  if (UnifiedState?.data?.settings?.debugMode) {
    logDebug('TURTLE', 'Filtered turtles:', {
      turtleCount: turtles.length,
      turtles: turtles.map(t => ({
        species: t.petSpecies,
        hunger: t.hunger,
        abilities: t.abilities,
        xp: t.xp,
        targetScale: t.targetScale
      }))
    });
  }

  let expectedMinutesRemoved = 0;

  turtles.forEach(p => {
    const xpComponent = Math.min(Math.floor(((p.xp || 0) / (100 * 3600)) * 30), 30);
    const scaleComponent = Math.floor((((p.targetScale || 1) - 1) / (2.5 - 1)) * 20 + 80) - 30;
    const base = xpComponent + scaleComponent;
    const minutesRemoved = (base / 100) * 5 * 60 * (1 - (1 - (0.27 * base) / 100) ** (1 / 60));

    if (UnifiedState?.data?.settings?.debugMode) {
      logDebug('TURTLE', 'Turtle calculation:', {
        xp: p.xp,
        targetScale: p.targetScale,
        xpComponent,
        scaleComponent,
        base,
        minutesRemoved
      });
    }

    expectedMinutesRemoved += minutesRemoved;
  });

  if (UnifiedState?.data?.settings?.debugMode) {
    logDebug('TURTLE', 'Total expected minutes removed:', expectedMinutesRemoved);
  }

  return {
    expectedMinutesRemoved
  };
}

/**
 * Estimate time until latest crop with turtle boost
 *
 * @param {Array} currentCrop - Current crop array
 * @param {Array} activePets - Active pets array
 * @param {number|null} slotIndex - Optional slot index
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.getTurtleExpectations - Turtle expectations calculator
 * @param {Function} dependencies.logError - Error logging function
 * @returns {string|null} Formatted time string or null
 */
export function estimateUntilLatestCrop(currentCrop, activePets, slotIndex = null, dependencies = {}) {
  const { getTurtleExpectations: getTurtleExp = getTurtleExpectations, logError = console.error.bind(console) } =
    dependencies;

  try {
    if (!currentCrop || currentCrop.length === 0) return null;
    if (!activePets || activePets.length === 0) return null;

    const turtleExpectations = getTurtleExp(activePets, dependencies);
    if (!turtleExpectations || turtleExpectations.expectedMinutesRemoved === 0) {
      return null;
    }

    const now = Date.now();

    // If slotIndex provided and valid, use that slot's endTime
    // Otherwise use the latest crop's endTime
    let targetEndTime;
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < currentCrop.length) {
      targetEndTime = currentCrop[slotIndex]?.endTime || 0;
    } else {
      targetEndTime = Math.max(...currentCrop.map(c => c.endTime || 0));
    }

    if (targetEndTime <= now) return null; // Crop already mature

    const remainingRealMinutes = (targetEndTime - now) / (1000 * 60);
    const { expectedMinutesRemoved } = turtleExpectations;
    const effectiveRate = expectedMinutesRemoved + 1;
    const expectedRealMinutes = remainingRealMinutes / effectiveRate;

    const hours = Math.floor(expectedRealMinutes / 60);
    const minutes = Math.floor(expectedRealMinutes % 60);

    return `${hours}h ${minutes}m`;
  } catch (error) {
    logError('TURTLE', 'ERROR in estimateUntilLatestCrop:', error);
    return null;
  }
}

/**
 * Generic ability expectations calculator
 *
 * @param {Array} activePets - Active pets array
 * @param {string} abilityName - Ability name to search for
 * @param {number} minutesPerBase - Minutes per base calculation
 * @param {number} odds - Odds multiplier
 * @returns {object} Object with expectedMinutesRemoved
 */
export function getAbilityExpectations(activePets, abilityName, minutesPerBase = 5, odds = 0.27) {
  const pets = (activePets || []).filter(p => p && p.hunger > 0 && p.abilities?.some(a => a === abilityName));

  let expectedMinutesRemoved = 0;

  pets.forEach(p => {
    const base =
      Math.min(Math.floor(((p.xp || 0) / (100 * 3600)) * 30), 30) +
      Math.floor((((p.targetScale || 1) - 1) / (2.5 - 1)) * 20 + 80) -
      30;

    expectedMinutesRemoved += (base / 100) * minutesPerBase * 60 * (1 - (1 - (odds * base) / 100) ** (1 / 60));
  });

  return {
    expectedMinutesRemoved
  };
}

/**
 * Get egg growth boost expectations
 *
 * @param {Array} activePets - Active pets array
 * @returns {object} Object with expectedMinutesRemoved
 */
export function getEggExpectations(activePets) {
  return getAbilityExpectations(activePets, 'EggGrowthBoostII', 10, 0.24);
}

/**
 * Get plant growth boost expectations
 *
 * @param {Array} activePets - Active pets array
 * @returns {object} Object with expectedMinutesRemoved
 */
export function getGrowthExpectations(activePets) {
  return getAbilityExpectations(activePets, 'PlantGrowthBoostII', 5, 0.27);
}

/**
 * Validate tooltip element position to prevent UI contamination
 *
 * @param {HTMLElement} element - Element to validate
 * @param {object} dependencies - Injected dependencies
 * @param {Document} dependencies.targetDocument - Target document
 * @param {Document} dependencies.document - Regular document
 * @param {Window} dependencies.window - Window object
 * @param {object} dependencies.UnifiedState - Unified state object
 * @returns {boolean} True if valid tooltip element
 */
export function isValidTooltipElement(element, dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    UnifiedState
  } = dependencies;

  if (!element) return false;

  try {
    const rect = element.getBoundingClientRect();

    // Reject if element is in top-left corner (likely UI element, not tooltip)
    if (rect.top < 50 && rect.left < 50) {
      return false;
    }

    // Reject if element is too small
    if (rect.width < 50 || rect.height < 30) {
      return false;
    }

    // Reject if element is off-screen
    const viewportDoc = targetDocument || doc;
    const viewportWidth = win.innerWidth || viewportDoc.documentElement.clientWidth;
    const viewportHeight = win.innerHeight || viewportDoc.documentElement.clientHeight;

    if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight) {
      return false;
    }

    // Element should contain text (tooltips always have content)
    const hasText = element.textContent && element.textContent.trim().length > 0;
    if (!hasText) {
      return false;
    }

    return true;
  } catch (e) {
    // Only log errors, not validation failures
    if (UnifiedState?.data?.settings?.debugMode) {
      productionError('[CROP-VALUE] ❌ Error validating tooltip element:', e);
    }
    return false;
  }
}

/**
 * Get current slot index for multi-harvest crops
 *
 * @param {Array} currentCrop - Current crop array
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object
 * @returns {number} Current slot index
 */
export function getCurrentSlotIndex(currentCrop, dependencies = {}) {
  const { window: win = typeof window !== 'undefined' ? window : null } = dependencies;

  if (!currentCrop || currentCrop.length <= 1) return 0;

  // Initialize if not exists
  if (typeof win._mgtools_currentSlotIndex === 'undefined') {
    win._mgtools_currentSlotIndex = 0;
  }

  return win._mgtools_currentSlotIndex || 0;
}

/**
 * Calculate current slot value
 *
 * @param {Array} currentCrop - Current crop array
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - Unified state object
 * @param {Window} dependencies.window - Window object
 * @param {Function} dependencies.calculateMutationMultiplier - Mutation multiplier calculator
 * @param {object} dependencies.speciesValues - Species values lookup
 * @param {Function} dependencies.getCurrentSlotIndex - Get slot index function
 * @returns {number} Calculated value
 */
export function calculateCurrentSlotValue(currentCrop, dependencies = {}) {
  const {
    UnifiedState,
    window: win = typeof window !== 'undefined' ? window : null,
    calculateMutationMultiplier = () => 1,
    speciesValues = {},
    getCurrentSlotIndex: getSlotIdx = getCurrentSlotIndex
  } = dependencies;

  if (!currentCrop || currentCrop.length === 0) return 0;

  const friendBonus = UnifiedState.atoms.friendBonus || 1;
  const slotIndex = getSlotIdx(currentCrop, dependencies);

  // If we have sorted indices, use them to get the actual slot
  const sortedIndices = UnifiedState.atoms.sortedSlotIndices || win.sortedSlotIndices;
  let actualSlotIndex = slotIndex;

  if (sortedIndices && Array.isArray(sortedIndices) && sortedIndices.length > 0) {
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
    windowIndex: win._mgtools_currentSlotIndex,
    sortedIndices
  });

  // Validate slot index
  if (actualSlotIndex < 0 || actualSlotIndex >= currentCrop.length) {
    productionError(`[CROP-VALUE] Invalid slot index: ${actualSlotIndex} for crop array length: ${currentCrop.length}`);
    win._mgtools_currentSlotIndex = 0; // Reset to safe value
    return 0;
  }

  const slot = currentCrop[actualSlotIndex];
  if (!slot || !slot.species) {
    productionLog(`[CROP-VALUE] No species at slot ${actualSlotIndex}`, slot);
    return 0;
  }

  const multiplier = calculateMutationMultiplier(slot.mutations);
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
 * Insert turtle estimate and slot value into tooltip
 *
 * @param {object} dependencies - Injected dependencies (extensive - see function body)
 */
export function insertTurtleEstimate(dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState,
    isValidTooltipElement: isValidTooltip = isValidTooltipElement,
    getEggExpectations: getEggExp = getEggExpectations,
    estimateUntilLatestCrop: estimateUntil = estimateUntilLatestCrop,
    getCurrentSlotIndex: getSlotIdx = getCurrentSlotIndex,
    calculateCurrentSlotValue: calcSlotValue = calculateCurrentSlotValue
  } = dependencies;

  const doc = targetDocument;

  // Remove existing turtle estimates and slot values
  doc
    .querySelectorAll('[data-turtletimer-estimate="true"], [data-turtletimer-slot-value="true"]')
    .forEach(el => el.remove());

  // Get tooltip element
  let currentPlantTooltipFlexbox = doc.querySelector(
    'div.QuinoaUI > div.McFlex:nth-of-type(2) > div.McGrid > div.McFlex:nth-of-type(3) > :first-child > :last-child p'
  )?.parentElement;

  if (!currentPlantTooltipFlexbox) {
    // Fallback selectors with validation
    const altSelectors = [
      'div.QuinoaUI .McFlex .McGrid',
      '[class*="tooltip"] [class*="flex"]',
      'div[class*="plant"] div[class*="info"]',
      '.McFlex .McGrid .McFlex',
      'div.QuinoaUI div.McFlex div.McGrid'
    ];

    for (let i = 0; i < altSelectors.length; i += 1) {
      const sel = altSelectors[i];
      const el = doc.querySelector(sel);
      if (el && isValidTooltip(el, dependencies)) {
        currentPlantTooltipFlexbox = el;
        break;
      }
    }

    if (!currentPlantTooltipFlexbox) {
      return;
    }
  }

  // Final validation
  if (!isValidTooltip(currentPlantTooltipFlexbox, dependencies)) {
    productionWarn('[CROP-VALUE] ⚠️ Rejected invalid tooltip position - skipping slot value display');
    return;
  }

  // Get current crop/egg with multiple fallbacks
  let currentCrop = targetWindow.currentCrop || UnifiedState.atoms.currentCrop;
  const currentEgg = targetWindow.currentEgg || UnifiedState.atoms.currentEgg;

  // Extensive fallback logic for crop data (from original code)
  if (!currentCrop && !currentEgg) {
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

    for (let i = 0; i < possibleLocations.length; i += 1) {
      const loc = possibleLocations[i];
      if (loc) {
        currentCrop = Array.isArray(loc) ? loc : [loc];
        break;
      }
    }

    // Parse from tooltip DOM as ultimate fallback
    if (!currentCrop && !currentEgg && currentPlantTooltipFlexbox) {
      const tooltipText = currentPlantTooltipFlexbox.textContent || '';
      const eggPattern = /(Common|Uncommon|Rare|Legendary|Mythical)\s*Egg/i;
      const eggMatch = tooltipText.match(eggPattern);

      if (eggMatch) {
        const eggSpecies = eggMatch[0].replace(/\s+/g, '');
        currentCrop = [{ species: eggSpecies, type: 'egg', category: 'egg', isEgg: true }];
      } else {
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

        for (let i = 0; i < cropPatterns.length; i += 1) {
          const pattern = cropPatterns[i];
          const cropMatch = tooltipText.match(pattern);
          if (cropMatch) {
            currentCrop = [{ species: cropMatch[0], type: 'crop', category: 'plant' }];
            break;
          }
        }
      }
    }
  }

  // Check if egg
  const isPlantedEgg1 = currentCrop?.[0]?.species?.endsWith('Egg');
  const isPlantedEgg2 = currentCrop?.[0]?.species?.includes('Egg');
  const isPlantedEgg3 = currentCrop?.[0]?.type === 'egg';
  const isPlantedEgg4 = currentCrop?.[0]?.category === 'egg';
  const isPlantedEgg = isPlantedEgg1 || isPlantedEgg2 || isPlantedEgg3 || isPlantedEgg4;
  const isEgg = currentEgg || isPlantedEgg;

  if (isEgg) {
    // Handle egg timer
    const activePets = targetWindow.activePets || UnifiedState.atoms.activePets;
    const eggExpectations = getEggExp(activePets);

    // Find time element
    const timeElement = [...currentPlantTooltipFlexbox.childNodes].find(el =>
      /^\d+h(?: \d+m)?(?: \d+s)?$|^\d+m(?: \d+s)?$|^\d+s$/.test((el.textContent || '').trim())
    );

    if (!timeElement) return;

    const timeText = timeElement.textContent.trim();
    const timeMatch = timeText.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
    if (!timeMatch) return;

    const hours = parseInt(timeMatch[1] || '0', 10);
    const minutes = parseInt(timeMatch[2] || '0', 10);
    const seconds = parseInt(timeMatch[3] || '0', 10);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) return;

    if (eggExpectations && eggExpectations.expectedMinutesRemoved > 0) {
      const remainingRealMinutes = totalSeconds / 60;
      const effectiveRate = eggExpectations.expectedMinutesRemoved + 1;
      const boostedRealMinutes = remainingRealMinutes / effectiveRate;
      const boostedTotalSeconds = boostedRealMinutes * 60;

      const boostedHours = Math.floor(boostedTotalSeconds / 3600);
      const boostedMinutes = Math.floor((boostedTotalSeconds % 3600) / 60);
      const boostedSeconds = Math.floor(boostedTotalSeconds % 60);

      const eggEstimateEl = doc.createElement('p');
      eggEstimateEl.dataset.turtletimerEstimate = 'true';

      if (boostedHours > 0) {
        eggEstimateEl.textContent = `🥚 Egg: ${boostedHours}h ${boostedMinutes}m`;
      } else {
        eggEstimateEl.textContent = `🥚 Egg: ${boostedMinutes}m ${boostedSeconds}s`;
      }

      eggEstimateEl.style.color = '#fbbf24'; // Yellow
      currentPlantTooltipFlexbox.appendChild(eggEstimateEl);
    }
    return;
  }

  if (!currentCrop || currentCrop.length === 0) return;

  // Find time element for growing crops
  const timeElement = [...currentPlantTooltipFlexbox.childNodes].find(el =>
    /^\d+h(?: \d+m)?(?: \d+s)?$|^\d+m(?: \d+s)?$|^\d+s$/.test((el.textContent || '').trim())
  );

  // Show turtle estimate if growing
  if (timeElement) {
    const activePets = targetWindow.activePets || UnifiedState.atoms.activePets;
    const slotIndex = getSlotIdx(currentCrop, dependencies);
    const sortedIndices = UnifiedState.atoms.sortedSlotIndices || targetWindow.sortedSlotIndices;
    let actualSlotIndex = slotIndex;

    if (sortedIndices && Array.isArray(sortedIndices) && sortedIndices.length > 0 && slotIndex < sortedIndices.length) {
      actualSlotIndex = sortedIndices[slotIndex];
    }

    const estimate = estimateUntil(currentCrop, activePets, actualSlotIndex, dependencies);

    if (estimate) {
      const estimateEl = doc.createElement('p');
      estimateEl.dataset.turtletimerEstimate = 'true';
      estimateEl.textContent = estimate;
      estimateEl.style.color = '#4ade80'; // Green
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
 * Initialize turtle timer system
 *
 * @param {object} dependencies - Injected dependencies (extensive - see function body)
 */
export function initializeTurtleTimer(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    targetDocument = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    UnifiedState,
    productionLog = console.log.bind(console),
    hookAtom = () => {},
    listenToSlotIndexAtom = () => {},
    getCropHash: getHash = getCropHash,
    insertTurtleEstimate: insertEstimate = insertTurtleEstimate,
    requestAnimationFrame: raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout
  } = dependencies;

  productionLog('🐢🐢🐢 [TURTLE-TIMER-START] initializeTurtleTimer() called!');
  productionLog('🐢 [TURTLE-TIMER] Initializing crop growth estimate...');

  // Initialize global slot index if not exists
  if (typeof win._mgtools_currentSlotIndex === 'undefined') {
    win._mgtools_currentSlotIndex = 0;
  }

  // Start listening to slot index changes
  listenToSlotIndexAtom();

  // Hook sorted slot indices atom
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentSortedGrowSlotIndicesAtom',
    'sortedSlotIndices',
    value => value
  );

  // Hook currentCrop atom
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom',
    'currentCrop',
    value => {
      // Extract crop data from atom value
      let cropData = null;
      if (value?.garden?.tileObjects) {
        cropData = value.garden.tileObjects;
      } else if (Array.isArray(value)) {
        cropData = value;
      }

      // Store extracted data
      UnifiedState.atoms.currentCrop = cropData;
      targetWindow.currentCrop = cropData;

      const currentHash = getHash(cropData || value);

      if (currentHash !== win.prevCropHash) {
        win.prevCropHash = currentHash;
        raf(() => insertEstimate(dependencies));
      }

      return value; // Return original to game
    }
  );

  const doc = targetDocument;

  // Polling interval to catch missed updates
  setInterval(() => {
    let currentCrop = targetWindow.currentCrop || UnifiedState.atoms.currentCrop;
    const currentEgg = targetWindow.currentEgg || UnifiedState.atoms.currentEgg;

    // Complex Jotai store finding and reading logic (preserved from original)
    let manualCrop = null;
    if (!currentCrop) {
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

        for (let i = 0; i < possibleStores.length; i += 1) {
          const store = possibleStores[i];
          if (
            store &&
            typeof store.get === 'function' &&
            store !== targetWindow.cookieStore &&
            store !== win.cookieStore &&
            (typeof store.set === 'function' || typeof store.sub === 'function')
          ) {
            targetWindow.__foundJotaiStore = store;
            break;
          }
        }

        if (!targetWindow.__foundJotaiStore) {
          const storeKeys = Object.keys(targetWindow).filter(
            k => k.toLowerCase().includes('store') || k.toLowerCase().includes('jotai')
          );

          for (let i = 0; i < storeKeys.length; i += 1) {
            const key = storeKeys[i];
            const val = targetWindow[key];
            if (
              val &&
              typeof val === 'object' &&
              typeof val.get === 'function' &&
              val !== targetWindow.cookieStore &&
              val !== win.cookieStore &&
              (typeof val.set === 'function' || typeof val.sub === 'function')
            ) {
              targetWindow.__foundJotaiStore = val;
              break;
            }
          }

          if (!targetWindow.__foundJotaiStore && targetWindow.jotaiAtomCache) {
            const cache = targetWindow.jotaiAtomCache;
            if (cache.store) {
              targetWindow.__foundJotaiStore = cache.store;
            } else if (cache.cache && cache.cache.store) {
              targetWindow.__foundJotaiStore = cache.cache.store;
            }
          }
        }
      }

      // Try to read atom using store
      const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
      if (atomCache && atomCache.get) {
        const cropAtom = atomCache.get(
          '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom'
        );

        if (cropAtom) {
          if (targetWindow.__foundJotaiStore) {
            try {
              const cropValue = targetWindow.__foundJotaiStore.get(cropAtom);

              if (cropValue && typeof cropValue.then === 'function') {
                cropValue
                  .then(val => {
                    targetWindow.currentCrop = val;
                    UnifiedState.atoms.currentCrop = val;

                    if (val && !doc.querySelector('[data-turtletimer-estimate="true"]')) {
                      insertEstimate(dependencies);
                    }
                  })
                  .catch(() => {
                    // Silent catch
                  });
              } else {
                manualCrop = cropValue;
                targetWindow.currentCrop = cropValue;
                UnifiedState.atoms.currentCrop = cropValue;
              }
            } catch (e) {
              // Silent catch
            }
          }

          if (!manualCrop && cropAtom.debugValue !== undefined) {
            manualCrop = cropAtom.debugValue;
          }

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
              // Silent catch
            }
          }
        }
      }
    }

    if (manualCrop && !currentCrop) {
      currentCrop = manualCrop;
    }

    // Check if tooltip visible
    const tooltipVisible = doc.querySelector('div.QuinoaUI > div.McFlex:nth-of-type(2) > div.McGrid');

    if (currentCrop || currentEgg || tooltipVisible) {
      const hasExisting = doc.querySelector('[data-turtletimer-estimate="true"], [data-turtletimer-slot-value="true"]');
      if (!hasExisting) {
        insertEstimate(dependencies);
      }
    }
  }, 1000); // Check every second

  // Movement key handlers
  const isMovementKeypress = e =>
    !e.ctrlKey &&
    !e.shiftKey &&
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);

  const onMovementKey = handler => e => {
    if (isMovementKeypress(e)) handler(e);
  };

  // Remove on keydown
  doc.addEventListener(
    'keydown',
    onMovementKey(() => {
      doc
        .querySelectorAll('[data-turtletimer-estimate="true"], [data-turtletimer-slot-value="true"]')
        .forEach(el => el.remove());
    })
  );

  // Insert on keyup
  doc.addEventListener(
    'keyup',
    onMovementKey(() => {
      insertEstimate(dependencies);
    })
  );

  productionLog('✅ [TURTLE-TIMER] Turtle timer initialized successfully');

  // Debug function
  const debugCropDetectionFunc = function debugCropDetection() {
    productionLog('=== MANUAL CROP DETECTION DEBUG ===');

    const atomCache = win.jotaiAtomCache?.cache || win.jotaiAtomCache;
    productionLog('atomCache exists:', !!atomCache);

    if (atomCache && atomCache.get) {
      productionLog('Atom cache entries count:', atomCache.size || 'unknown');

      try {
        const allKeys = Array.from(atomCache.keys ? atomCache.keys() : []);
        productionLog('Total atoms:', allKeys.length);

        const cropAtoms = allKeys.filter(
          k => k.includes('Crop') || k.includes('crop') || k.includes('Grow') || k.includes('Egg')
        );
        productionLog('Crop-related atoms:', cropAtoms);

        const atom = atomCache.get(
          '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom'
        );
        productionLog('Current crop atom:', atom);

        if (atom) {
          productionLog('Atom properties:', Object.keys(atom));
          productionLog('Atom.debugValue:', atom.debugValue);
          productionLog('Atom.init:', atom.init);

          const tw = win;
          if (tw.__foundJotaiStore) {
            productionLog('Found store, trying to read...');
            try {
              const val = tw.__foundJotaiStore.get(atom);
              productionLog('✅ Store.get(atom) returned:', val);
            } catch (e) {
              productionLog('❌ Error reading from store:', e);
            }
          } else {
            productionLog('⚠️ No Jotai store found yet');
          }
        }
      } catch (e) {
        productionLog('Error exploring atoms:', e);
      }
    }

    productionLog('Calling insertTurtleEstimate()...');
    if (typeof insertEstimate === 'function') {
      insertEstimate(dependencies);
    } else {
      productionLog('❌ insertTurtleEstimate not available in this context');
    }
  };

  // Attach debug function
  try {
    win.debugCropDetection = debugCropDetectionFunc;
    targetWindow.debugCropDetection = debugCropDetectionFunc;

    productionLog('💡 TIP: Run window.debugCropDetection() in console to debug crop detection');
    productionLog('💡 Available in: window, targetWindow');
  } catch (e) {
    productionLog('⚠️ Could not attach debugCropDetection:', e);
  }
}

/**
 * Check turtle timer - wrapper for insertTurtleEstimate
 * Used by interval timer in startIntervals()
 *
 * @param {object} dependencies - Injected dependencies
 * @returns {void}
 */
export function checkTurtleTimer(dependencies = {}) {
  return insertTurtleEstimate(dependencies);
}
