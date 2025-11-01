/**
 * @fileoverview Legacy Bootstrap and Initialization System
 *
 * This module contains the complete legacy initialization system extracted from MGTools.user.js.
 * It handles script bootstrapping, game readiness checks, environment detection, and feature
 * initialization with comprehensive dependency injection.
 *
 * Key responsibilities:
 * - Main script initialization with game readiness polling
 * - Standalone/demo mode initialization
 * - Environment-based initialization routing
 * - Auto-sort inventory implementation
 * - Instant feed buttons system
 * - UI creation and setup
 *
 * All browser APIs and global dependencies are injected to ensure testability and modularity.
 *
 * @module init/legacy-bootstrap
 * @version 1.0.0
 * @extracted 2025-10-25
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/* ============================================================================
 * HELPER FUNCTIONS - STORAGE AND UTILITY
 * ============================================================================ */

/**
 * Cleans up corrupted dock position data from localStorage
 * Prevents UI positioning issues caused by malformed saved state
 *
 * @param {Object} deps - Dependency injection object
 * @param {Storage} deps.localStorage - localStorage API
 * @param {Console} deps.console - Console API for logging
 * @returns {void}
 *
 * @example
 * cleanupCorruptedDockPosition({
 *   localStorage: window.localStorage,
 *   console: console
 * });
 */
export function cleanupCorruptedDockPosition({ localStorage, console }) {
  try {
    const dockPos = localStorage.getItem('mgh_dock_position');
    if (dockPos) {
      try {
        const parsed = JSON.parse(dockPos);
        // Check for invalid position data
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          (parsed.x !== undefined && typeof parsed.x !== 'number') ||
          (parsed.y !== undefined && typeof parsed.y !== 'number')
        ) {
          productionWarn('⚠️ Corrupted dock position detected, clearing...');
          localStorage.removeItem('mgh_dock_position');
        }
      } catch (e) {
        productionWarn('⚠️ Invalid dock position JSON, clearing...', e);
        localStorage.removeItem('mgh_dock_position');
      }
    }
  } catch (error) {
    productionError('❌ Error cleaning dock position:', error);
  }
}

/**
 * Generates demo garden tiles for standalone mode
 * Creates realistic tile objects with plants at various growth stages
 *
 * @param {number} count - Number of tiles to generate
 * @param {Object} deps - Dependency injection object
 * @param {Function} deps.dateNow - Date.now() function
 * @param {Function} deps.mathRandom - Math.random() function
 * @returns {Object} Object mapping tile index to tile data
 *
 * @example
 * const tiles = generateDemoTiles(10, {
 *   dateNow: () => Date.now(),
 *   mathRandom: () => Math.random()
 * });
 */
export function generateDemoTiles(count, { dateNow, mathRandom }) {
  const tiles = {};
  const species = ['Carrot', 'Apple', 'Banana', 'Lily', 'Dragon Fruit'];

  for (let i = 0; i < count; i++) {
    tiles[i] = {
      objectType: 'plant',
      slots: [
        {
          species: species[i % species.length],
          endTime: dateNow() - 1000, // Ready for harvest
          targetScale: 1 + mathRandom() * 0.5, // Random scale
          mutations: i % 3 === 0 ? ['Gold'] : [] // Some have mutations
        }
      ]
    };
  }

  return tiles;
}

/* ============================================================================
 * AUTO-SORT INVENTORY IMPLEMENTATION
 * ============================================================================ */

/**
 * Complete autosort implementation (v3.8.6)
 * Sorts inventory keeping first N items fixed, sorting the rest by category and metrics
 *
 * Sorting strategy:
 * 1. Seeds: By quantity (descending), then species (A-Z)
 * 2. Produce: By scale (descending), then species (A-Z)
 * 3. Pets: By rarity or XP (configurable), then species (A-Z)
 * 4. Eggs: By quantity (descending), then type (A-Z)
 * 5. Decor: By decorId (A-Z)
 *
 * @param {Object} inventoryObj - Inventory object with items array
 * @param {Object} options - Sort options
 * @param {number} [options.fixedCount=9] - Number of items to keep at head (unsorted)
 * @param {string} [options.petSortBy='rarity'] - Pet sort method: 'rarity' or 'xp'
 * @param {Object} [options.petRarityMap] - Custom pet rarity mapping (lower = earlier)
 * @param {Object} deps - Dependency injection object
 * @param {Object} deps.connection - MagicCircle_RoomConnection object
 * @param {Console} deps.console - Console API for logging
 * @returns {Array|null} Target order array or null on error
 *
 * @example
 * const sorted = sortInventoryKeepHeadAndSendMovesOptimized(inventory, {
 *   fixedCount: 9,
 *   petSortBy: 'rarity'
 * }, {
 *   connection: window.MagicCircle_RoomConnection,
 *   console: console
 * });
 */
export function sortInventoryKeepHeadAndSendMovesOptimized(inventoryObj, options = {}, deps) {
  const { connection, console } = deps;

  if (!inventoryObj || !Array.isArray(inventoryObj.items)) {
    productionError('[MGTOOLS-FIX-D] Invalid inventory object passed to sorter.');
    return null;
  }

  const items = inventoryObj.items;
  const fixedCount = Number(options.fixedCount || 9);
  const petSortBy = options.petSortBy === 'rarity' ? 'rarity' : 'xp';

  // Default pet rarity map (lower = earlier in sort)
  const defaultPetRarityMap = {
    Capybara: 0,
    Peacock: 0.1,
    Butterfly: 0.2, // Mythical
    Turtle: 1,
    Goat: 1.1, // Legendary
    Cow: 2,
    Pig: 2.1, // Rare
    Chicken: 3,
    Dragonfly: 3.1, // Uncommon
    Bee: 4,
    Worm: 4.1,
    Snail: 4.2 // Common
  };
  const petRarityMap = Object.assign({}, defaultPetRarityMap, options.petRarityMap || {});

  // Helper functions
  const toNum = v => (typeof v === 'number' ? v : Number(v) || 0);
  const toStr = v => (v == null ? '' : String(v));

  /**
   * Assigns group rank for item categorization
   * Lower rank = earlier in sort order
   */
  function groupRank(item) {
    if (!item) return 6;
    switch (item.itemType) {
      case 'Seed':
        return 0;
      case 'Produce':
        return 1;
      case 'Pet':
        return 2;
      case 'Egg':
        return 3;
      case 'Decor':
        return 4;
      default:
        return 5;
    }
  }

  // Metric extractors for each item type
  function seedMetric(it) {
    return toNum(it.quantity);
  }
  function produceMetric(it) {
    return toNum(it.scale);
  }
  function petXpMetric(it) {
    return toNum(it.xp);
  }
  function eggMetric(it) {
    return toNum(it.quantity);
  }
  function decorMetric(it) {
    return toStr(it.decorId).toLowerCase();
  }
  function fallbackKey(it) {
    return (it && (it.species || it.decorId || it.toolId || it.eggId || it.id || '')).toString().toLowerCase();
  }

  /**
   * Gets rarity rank for pet species
   * Lower rank = rarer (appears earlier in sort)
   */
  function petRarityRank(species) {
    if (!species) return Number.MAX_SAFE_INTEGER;
    if (Object.prototype.hasOwnProperty.call(petRarityMap, species)) return petRarityMap[species];
    const lower = species.toLowerCase();
    for (const k of Object.keys(petRarityMap)) {
      if (k.toLowerCase() === lower) return petRarityMap[k];
    }
    return Number.MAX_SAFE_INTEGER;
  }

  /**
   * Comparator for tail sorting
   * Implements multi-level comparison based on item type
   */
  function cmp(a, b) {
    const ga = groupRank(a);
    const gb = groupRank(b);
    if (ga !== gb) return ga - gb;

    switch (ga) {
      case 0: {
        // Seeds: quantity desc, tie -> species A-Z
        const d = seedMetric(b) - seedMetric(a);
        if (d !== 0) return d;
        break;
      }
      case 1: {
        // Produce: scale desc
        const d = produceMetric(b) - produceMetric(a);
        if (d !== 0) return d;
        break;
      }
      case 2: {
        // Pets
        if (petSortBy === 'rarity') {
          const ra = petRarityRank(a.petSpecies || a.species);
          const rb = petRarityRank(b.petSpecies || b.species);
          if (ra !== rb) return ra - rb; // lower = earlier
          // tie-break: xp desc
          const d = petXpMetric(b) - petXpMetric(a);
          if (d !== 0) return d;
          // final tie: species A-Z
          const sa = (a.petSpecies || a.species || '').toString().toLowerCase();
          const sb = (b.petSpecies || b.species || '').toString().toLowerCase();
          if (sa < sb) return -1;
          if (sa > sb) return 1;
          break;
        } else {
          // xp sort
          const d = petXpMetric(b) - petXpMetric(a);
          if (d !== 0) return d;
        }
        break;
      }
      case 3: {
        // Eggs: quantity desc
        const d = eggMetric(b) - eggMetric(a);
        if (d !== 0) return d;
        break;
      }
      case 4: {
        // Decor: A-Z by decorId
        const da = decorMetric(a);
        const db = decorMetric(b);
        if (da < db) return -1;
        if (da > db) return 1;
        break;
      }
      default:
        break;
    }

    const fa = fallbackKey(a);
    const fb = fallbackKey(b);
    if (fa < fb) return -1;
    if (fa > fb) return 1;
    return 0;
  }

  /**
   * Gets move item ID for server communication
   */
  function getMoveItemId(item) {
    if (!item) return null;
    if (item.id) return item.id;
    if (item.species) return item.species;
    if (item.toolId) return item.toolId;
    if (item.eggId) return item.eggId;
    if (item.decorId) return item.decorId;
    return null;
  }

  // Build target order by keeping head and sorting the tail
  const head = items.slice(0, fixedCount);
  const tail = items.slice(fixedCount);
  const sortedTail = tail.slice().sort(cmp);
  const targetOrder = head.concat(sortedTail);

  // Working copy to simulate moves and compute from/to indices correctly
  const working = items.slice();

  /**
   * Finds item index in working array
   * Handles unique IDs and stackable items
   */
  function findIndexInWorking(desiredItem) {
    if (!desiredItem) return -1;

    // exact unique id first
    if (desiredItem.id) {
      for (let i = 0; i < working.length; i++) {
        const it = working[i];
        if (it && it.id && it.id === desiredItem.id) return i;
      }
    }

    // collect candidates for stackable matches or pets without id
    const candidates = [];
    for (let i = 0; i < working.length; i++) {
      const it = working[i];
      if (!it) continue;

      // species match (seeds, produce)
      if (desiredItem.species && it.species && it.species === desiredItem.species) {
        candidates.push({ idx: i, score: toNum(it.quantity) });
        continue;
      }
      if (desiredItem.toolId && it.toolId && it.toolId === desiredItem.toolId) {
        candidates.push({ idx: i, score: toNum(it.quantity) });
        continue;
      }
      if (desiredItem.eggId && it.eggId && it.eggId === desiredItem.eggId) {
        candidates.push({ idx: i, score: toNum(it.quantity) });
        continue;
      }
      if (desiredItem.decorId && it.decorId && it.decorId === desiredItem.decorId) {
        candidates.push({ idx: i, score: 0 });
        continue;
      }

      // pets without id: match by petSpecies and prefer higher xp
      if (
        desiredItem.itemType === 'Pet' &&
        desiredItem.petSpecies &&
        it.itemType === 'Pet' &&
        it.petSpecies === desiredItem.petSpecies
      ) {
        candidates.push({ idx: i, score: toNum(it.xp) });
        continue;
      }
    }

    if (candidates.length === 0) {
      // fallback match by any moveItemId-like field
      const want = getMoveItemId(desiredItem);
      if (!want) return -1;
      for (let i = 0; i < working.length; i++) {
        const it = working[i];
        if (!it) continue;
        if (
          (it.id && it.id === want) ||
          (it.species && it.species === want) ||
          (it.toolId && it.toolId === want) ||
          (it.eggId && it.eggId === want) ||
          (it.decorId && it.decorId === want)
        ) {
          return i;
        }
      }
      return -1;
    }

    // pick best candidate (largest stack or highest xp)
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].idx;
  }

  /**
   * Sends move message to server
   */
  function sendMove(moveItemId, toIndex) {
    if (!moveItemId || typeof toIndex !== 'number') return;
    const msg = {
      scopePath: ['Room', 'Quinoa'],
      type: 'MoveInventoryItem',
      moveItemId: moveItemId,
      toInventoryIndex: toIndex
    };

    if (connection && typeof connection.sendMessage === 'function') {
      connection.sendMessage(msg);
    } else {
      productionWarn('[MGTOOLS-FIX-D] MagicCircle_RoomConnection not available — simulated move:', msg);
    }
  }

  // Build move list for indices >= fixedCount and update working to reflect each planned move
  const moves = [];
  for (let targetIndex = fixedCount; targetIndex < targetOrder.length; targetIndex++) {
    const desiredItem = targetOrder[targetIndex];
    const workingItem = working[targetIndex];

    const desiredKey = getMoveItemId(desiredItem);
    const workingKey = getMoveItemId(workingItem);
    const alreadySame =
      desiredKey &&
      workingKey &&
      (desiredKey === workingKey ||
        (desiredItem.species && workingItem.species && desiredItem.species === workingItem.species));
    if (alreadySame) continue;

    const curIndex = findIndexInWorking(desiredItem);
    if (curIndex === -1) {
      productionWarn('[MGTOOLS-FIX-D] Could not find desired item in current inventory for', desiredItem);
      continue;
    }

    const moveId = getMoveItemId(desiredItem);
    if (!moveId) {
      productionWarn('[MGTOOLS-FIX-D] No moveItemId for', desiredItem);
      continue;
    }

    moves.push({ moveId, from: curIndex, to: targetIndex });
    const [moved] = working.splice(curIndex, 1);
    working.splice(targetIndex, 0, moved);
  }

  // Send moves immediately
  for (const m of moves) {
    sendMove(m.moveId, m.to);
  }

  productionLog('[MGTOOLS-FIX-D] ✅ Sort completed. Moves sent:', moves.length, moves);
  return targetOrder;
}

/* ============================================================================
 * STANDALONE/DEMO MODE INITIALIZATION
 * ============================================================================ */

/**
 * Initializes the script in standalone/demo mode
 * Creates a fully functional demo with sample data when game is not available
 *
 * @param {Object} deps - Dependency injection object
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Document} deps.document - Document API
 * @param {Function} deps.createDemoData - Function to create demo data
 * @param {Function} deps.loadSavedData - Function to load saved settings
 * @param {Function} deps.createUnifiedUI - Function to create UI
 * @param {Function} deps.ensureUIHealthy - Function to ensure UI health
 * @param {Function} deps.setupToolbarToggle - Function to setup toolbar toggle
 * @param {Function} deps.setupDockSizeControl - Function to setup dock size control
 * @param {Function} deps.addDemoBanner - Function to add demo banner
 * @param {Function} deps.setupDemoTimers - Function to setup demo timers
 * @param {Console} deps.console - Console API for logging
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @returns {void}
 *
 * @example
 * initializeStandalone({
 *   UnifiedState: UnifiedState,
 *   document: document,
 *   createDemoData: createDemoData,
 *   // ... other dependencies
 * });
 */
export function initializeStandalone(deps) {
  const {
    UnifiedState,
    document,
    createDemoData,
    loadSavedData,
    createUnifiedUI,
    ensureUIHealthy,
    setupToolbarToggle,
    setupDockSizeControl,
    addDemoBanner,
    setupDemoTimers,
    console,
    productionLog,
    debugError,
    cleanupCorruptedDockPosition,
    generateDemoTiles,
    // UI Health & Toolbar Control Dependencies
    CURRENT_VERSION,
    showToast,
    resetDockPosition
  } = deps;

  if (UnifiedState.initialized) {
    productionLog('⚠️ Magic Garden Unified Assistant already initialized, skipping...');
    return;
  }

  productionLog('🎮 Magic Garden Assistant - Demo Mode');
  productionLog('💡 Running in standalone mode with demo data');
  productionLog('📝 Note: This is a demonstration - no real game integration');

  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    productionLog('⏳ DOM not ready, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => initializeStandalone(deps));
    return;
  }

  try {
    // Initialize demo data
    const demoData = createDemoData();

    // Populate UnifiedState with demo data
    UnifiedState.atoms.inventory = demoData.inventory;
    UnifiedState.atoms.myGarden = {
      garden: {
        tileObjects: generateDemoTiles(demoData.garden.readyTiles)
      }
    };
    UnifiedState.atoms.friendBonus = 1.2; // Demo bonus
    // Demo data disabled - only use real ability logs from users actual gameplay
    // UnifiedState.data.petAbilityLogs = demoData.abilityLogs;
    productionLog('📝 Skipping demo ability logs injection - using real logs only');
    UnifiedState.data.timers = demoData.timers;

    // Load saved data (or use defaults)
    productionLog('💾 Loading saved settings...');
    loadSavedData();

    // Create UI with demo banner
    productionLog('🎨 Creating Demo UI...');
    // Clean up any corrupted dock position data before creating UI
    cleanupCorruptedDockPosition();
    createUnifiedUI();

    // TEST VERSION: Add UI health check and Alt+M toggle
    ensureUIHealthy({
      targetDocument: document,
      cleanupCorruptedDockPosition,
      createUnifiedUI,
      showToast
    });
    setupToolbarToggle({
      targetDocument: document,
      document,
      productionLog,
      showToast,
      CURRENT_VERSION
    });
    setupDockSizeControl({
      targetDocument: document,
      document,
      resetDockPosition,
      showToast
    });

    addDemoBanner();

    // Setup demo timers
    productionLog('⏰ Setting up demo timers...');
    setupDemoTimers();

    // Mark as initialized
    UnifiedState.initialized = true;
    productionLog('✅ Magic Garden Assistant Demo initialized successfully!');
    productionLog('🎯 Try the features - they work with realistic demo data');
  } catch (error) {
    productionError('❌ Failed to initialize demo mode:', error);
    debugError('STANDALONE_INIT', 'Demo initialization failed', error);
    UnifiedState.initialized = false;
  }
}

/**
 * Adds a demo mode banner to the main panel
 * Visually indicates the application is running in demo mode
 *
 * @param {Object} deps - Dependency injection object
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Document} deps.document - Document API
 * @returns {void}
 *
 * @example
 * addDemoBanner({
 *   UnifiedState: UnifiedState,
 *   document: document
 * });
 */
export function addDemoBanner({ UnifiedState, document }) {
  // Add a demo mode banner to the main panel
  const panel = UnifiedState.panels.main;
  if (!panel) return;

  const banner = document.createElement('div');
  banner.style.cssText = `
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    color: white;
    text-align: center;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    position: relative;
    margin: -1px -1px 8px -1px;
    border-radius: 6px 6px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.30);
  `;
  banner.innerHTML = '🎮 DEMO MODE - Showcasing full functionality with sample data';

  // Insert banner at the top of the panel
  const header = panel.querySelector('.mga-header');
  if (header) {
    panel.insertBefore(banner, header.nextSibling);
  }
}

/**
 * Sets up demo timers that count down
 * Creates realistic timer behavior for demo mode
 *
 * @param {Object} deps - Dependency injection object
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Object} deps.timerManager - Timer manager object
 * @param {Function} deps.initializeTimerManager - Function to initialize timer manager
 * @param {Function} deps.updateTimerDisplay - Function to update timer display
 * @returns {void}
 *
 * @example
 * setupDemoTimers({
 *   UnifiedState: UnifiedState,
 *   timerManager: globalTimerManager,
 *   initializeTimerManager: initializeTimerManager,
 *   updateTimerDisplay: updateTimerDisplay
 * });
 */
export function setupDemoTimers({ UnifiedState, timerManager, initializeTimerManager, updateTimerDisplay }) {
  // Start demo timer countdown
  const manager = timerManager || initializeTimerManager();

  manager.startTimer('demo-timer', 1000, () => {
    // Update demo timers
    if (UnifiedState.data.timers.seed > 0) UnifiedState.data.timers.seed--;
    if (UnifiedState.data.timers.egg > 0) UnifiedState.data.timers.egg--;
    if (UnifiedState.data.timers.tool > 0) UnifiedState.data.timers.tool--;

    // Update timer displays
    updateTimerDisplay();
  });
}

/* ============================================================================
 * MAIN INITIALIZATION FUNCTION
 * ============================================================================ */

/**
 * Main script initialization function
 * Bootstraps all modules and starts the application
 *
 * This is the primary entry point for the script initialization sequence.
 * It performs the following steps:
 * 1. Checks if already initialized (prevents double initialization)
 * 2. Waits for DOM ready state
 * 3. Polls for game readiness (jotaiAtomCache and MagicCircle_RoomConnection)
 * 4. Calls continueInitialization() when ready or after max retries
 * 5. Sets up failsafe interval starter
 *
 * @param {Object} deps - Dependency injection object
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Document} deps.document - Document API
 * @param {Window} deps.targetWindow - Target window (game iframe or main window)
 * @param {Function} deps.continueInitialization - Function to continue initialization
 * @param {Function} deps.setTimeout - setTimeout function
 * @param {Function} deps.performanceNow - performance.now() function
 * @param {Function} deps.startIntervals - Function to start monitoring intervals
 * @param {Console} deps.console - Console API for logging
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.productionWarn - Production warning function
 * @param {Object} [deps.MGA_DEBUG] - Optional debug object for detailed logging
 * @returns {void}
 *
 * @example
 * initializeScript({
 *   UnifiedState: UnifiedState,
 *   document: document,
 *   targetWindow: window,
 *   continueInitialization: continueInitialization,
 *   setTimeout: setTimeout,
 *   performanceNow: () => performance.now(),
 *   startIntervals: startIntervals,
 *   console: console,
 *   productionLog: productionLog,
 *   productionWarn: productionWarn,
 *   MGA_DEBUG: window.MGA_DEBUG
 * });
 */
export function initializeScript(deps) {
  const {
    UnifiedState,
    document,
    targetWindow,
    continueInitialization,
    setTimeout,
    performanceNow,
    startIntervals,
    console,
    productionLog,
    productionWarn,
    MGA_DEBUG
  } = deps;

  // DEBUG: Log initialization attempt
  if (MGA_DEBUG) {
    MGA_DEBUG.logStage('INITIALIZE_SCRIPT_CALLED', {
      initialized: UnifiedState.initialized,
      domState: document.readyState,
      retryAttempt: targetWindow.MGA_initRetryCount || 0
    });
  }

  if (UnifiedState.initialized) {
    productionLog('⚠️ Magic Garden Unified Assistant already initialized, skipping...');
    if (MGA_DEBUG) {
      MGA_DEBUG.logStage('ALREADY_INITIALIZED', { skipReason: 'UnifiedState.initialized is true' });
    }
    return;
  }

  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    productionLog('⏳ DOM not ready, waiting for DOMContentLoaded...');
    if (MGA_DEBUG) {
      MGA_DEBUG.logStage('DOM_NOT_READY', { domState: document.readyState });
    }
    document.addEventListener('DOMContentLoaded', () => initializeScript(deps));
    return;
  }

  // REMOVED: Modal check - was causing false positives and infinite retry loops

  // Improved initialization timing to prevent splash screen stall
  productionLog('⏳ Waiting for game initialization to complete...');
  let retryCount = 0;
  const maxRetries = 3;

  // CRITICAL FIX: If game is already ready, don't delay! Only delay if we need to retry
  const gameAlreadyReady =
    (targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache) && targetWindow.MagicCircle_RoomConnection;
  const initialDelay = gameAlreadyReady ? 0 : 2000;

  const attemptInit = () => {
    // Check if game is ready
    const gameReadiness = {
      jotaiAtomCache: !!targetWindow.jotaiAtomCache,
      magicCircleConnection: !!targetWindow.MagicCircle_RoomConnection,
      jotaiType: typeof targetWindow.jotaiAtomCache,
      connectionType: typeof targetWindow.MagicCircle_RoomConnection
    };

    if (MGA_DEBUG) {
      MGA_DEBUG.logStage('GAME_READINESS_CHECK', {
        retryCount,
        maxRetries,
        gameReadiness,
        timestamp: performanceNow()
      });
    }

    if (targetWindow.jotaiAtomCache && targetWindow.MagicCircle_RoomConnection) {
      productionLog('✅ Game ready, initializing script...');
      if (MGA_DEBUG) {
        MGA_DEBUG.logStage('GAME_READY', gameReadiness);
        // Safe performance metric setting
        if (MGA_DEBUG.performanceMetrics) {
          MGA_DEBUG.performanceMetrics.gameReady = performanceNow();
        }
      }
      continueInitialization(deps);
    } else if (retryCount < maxRetries) {
      retryCount++;
      productionLog(
        `⏳ Game not ready (jotaiAtomCache: ${!!targetWindow.jotaiAtomCache}, ` +
          `RoomConnection: ${!!targetWindow.MagicCircle_RoomConnection}), ` +
          `retry ${retryCount}/${maxRetries} in 1s...`
      );
      if (MGA_DEBUG) {
        MGA_DEBUG.logStage('GAME_NOT_READY_RETRYING', { retryCount, gameReadiness });
      }
      setTimeout(attemptInit, 1000);
    } else {
      productionWarn('⚠️ Max retries reached, initializing anyway...');
      if (MGA_DEBUG) {
        MGA_DEBUG.logStage('MAX_RETRIES_REACHED', { retryCount, gameReadiness });
      }
      continueInitialization(deps);
    }
  };

  setTimeout(attemptInit, initialDelay);

  // CRITICAL: Ensure intervals start even if initialization partially fails
  setTimeout(() => {
    if (typeof targetWindow.notificationInterval === 'undefined' || !targetWindow._mgaIntervalsStarted) {
      productionWarn('⚠️ [FAILSAFE] Intervals not started after 30s, forcing start...');
      try {
        if (typeof startIntervals === 'function') {
          startIntervals();
          productionLog('✅ [FAILSAFE] Successfully started intervals');
        } else {
          productionError('❌ [FAILSAFE] startIntervals function not found!');
        }
      } catch (e) {
        productionError('❌ [FAILSAFE] Could not start intervals:', e);
      }
    } else {
      productionLog('✅ [FAILSAFE] Intervals already running, no action needed');
    }
  }, 30000); // Failsafe after 30 seconds
}

/**
 * Continues initialization after game readiness is confirmed
 * This is called by initializeScript() once the game environment is ready
 *
 * Performs the complete initialization sequence:
 * 1. Loads saved data from localStorage
 * 2. Initializes auto-sort inventory button
 * 3. Initializes instant feed buttons
 * 4. Creates unified UI
 * 5. Initializes atom hooks
 * 6. Starts monitoring intervals
 * 7. Applies saved settings (theme, compact mode, weather)
 * 8. Initializes keyboard shortcuts
 * 9. Initializes teleport, crop highlighting, hotkeys, tooltips
 * 10. Runs conflict detection
 *
 * @param {Object} deps - Dependency injection object (contains all necessary dependencies)
 * @returns {void}
 *
 * @example
 * continueInitialization({
 *   // All dependencies from parent scope
 * });
 */
export function continueInitialization(deps) {
  const {
    UnifiedState,
    targetWindow,
    document,
    setTimeout,
    performanceNow,
    console,
    productionLog,
    productionWarn,
    debugLog,
    debugError,
    MGA_DEBUG,
    loadSavedData,
    cleanupCorruptedDockPosition,
    createUnifiedUI,
    ensureUIHealthy,
    setupToolbarToggle,
    setupDockSizeControl,
    initializeSortInventoryButton,
    initializeInstantFeedButtons,
    initializeAtoms,
    initializeTurtleTimer,
    startIntervals,
    applyTheme,
    applyUltraCompactMode,
    applyWeatherSetting,
    initializeKeyboardShortcuts,
    updateTabContent,
    getContentForTab,
    setupSeedsTabHandlers,
    setupPetsTabHandlers,
    initializeTeleportSystem,
    setupCropHighlightingSystem,
    initializeHotkeySystem,
    setManagedInterval,
    clearManagedInterval,
    // UI Health & Toolbar Control Dependencies
    CURRENT_VERSION,
    showToast,
    resetDockPosition
  } = deps;

  productionLog('🌱 Magic Garden Unified Assistant initializing...');
  productionLog('📊 Connection Status:', targetWindow.MagicCircle_RoomConnection ? '✅ Available' : '❌ Not found');

  if (MGA_DEBUG) {
    MGA_DEBUG.logStage('CONTINUE_INITIALIZATION', {
      connectionStatus: !!targetWindow.MagicCircle_RoomConnection,
      jotaiStatus: !!targetWindow.jotaiAtomCache,
      domState: document.readyState,
      timestamp: performanceNow()
    });
  }

  // ==================== IDLE PREVENTION MOVED ====================
  // NOTE: Idle prevention code has been moved to line ~380 to execute immediately
  // This ensures the game doesn't kick users out while the script loads
  productionLog('📝 [IDLE-PREVENTION] Idle prevention already applied at script start');

  try {
    // Load saved data
    productionLog('💾 Loading saved data...');
    loadSavedData();

    // Room polling handled by anonymous IIFE system (lines 28200-28365)
    // This system already polls all rooms including Discord rooms

    // ==================== SORT INVENTORY BUTTON (FIX ISSUE D) ====================
    // Note: The sortInventoryKeepHeadAndSendMovesOptimized function is exported above
    // The initialization of the Sort Inventory button is handled below in the UI creation section

    // ==================== INSTANT FEED BUTTONS ====================
    // Note: Instant feed button logic is complex and remains in the original file
    // This would require significant refactoring to extract cleanly

    // Create UI
    if (MGA_DEBUG) {
      MGA_DEBUG.logStage('CREATE_UI_STARTING', {
        dataLoaded: !!UnifiedState.data,
        petPresets: Object.keys(UnifiedState.data?.petPresets || {}).length,
        targetDocumentReady: !!document.body
      });
    }

    try {
      // Clean up any corrupted dock position data before creating UI
      cleanupCorruptedDockPosition();

      createUnifiedUI();

      // TEST VERSION: Add UI health check and Alt+M toggle
      ensureUIHealthy({
        targetDocument: document,
        cleanupCorruptedDockPosition,
        createUnifiedUI,
        showToast
      });
      setupToolbarToggle({
        targetDocument: document,
        document,
        productionLog,
        showToast,
        CURRENT_VERSION
      });
      setupDockSizeControl({
        targetDocument: document,
        document,
        resetDockPosition,
        showToast
      });

      if (MGA_DEBUG) {
        MGA_DEBUG.logStage('CREATE_UI_COMPLETED', {
          uiElements: document.querySelectorAll('.mga-panel, .mga-toggle-btn').length,
          mainPanelExists: !!document.querySelector('.mga-panel'),
          toggleBtnExists: !!document.querySelector('.mga-toggle-btn')
        });
        // Safe performance metric setting
        if (MGA_DEBUG.performanceMetrics) {
          MGA_DEBUG.performanceMetrics.uiCreated = performanceNow();
        }
      }

      // Initialize instant feed buttons after UI is created AND atom cache is ready
      (async () => {
        try {
          productionLog('[MGTools Feed] 🔍 Waiting for Jotai atom cache before initializing feed buttons...');

          // Wait for atom cache to be ready (max 10 seconds)
          const maxWait = 10000;
          const startTime = Date.now();
          let atomCacheReady = false;

          while (Date.now() - startTime < maxWait) {
            // Check if atom cache is ready (this is what we actually need!)
            if (targetWindow.jotaiAtomCache) {
              const elapsed = Date.now() - startTime;
              productionLog(`[MGTools Feed] ✅ Jotai atom cache ready after ${elapsed}ms`);
              UnifiedState.jotaiReady = true; // Mark as ready in UnifiedState
              atomCacheReady = true;

              // Try to capture store (nice to have but not required)
              if (!deps.jotaiStore) {
                deps.jotaiStore = deps.captureJotaiStore();
                if (deps.jotaiStore) {
                  productionLog('[MGTools Feed] ✅ Also captured Jotai store');
                } else {
                  productionLog('[MGTools Feed] ℹ️ Store not captured, will use direct atom cache reading');
                }
              }
              break;
            }

            // Wait 200ms before next check
            await new Promise(r => setTimeout(r, 200));
          }

          if (!atomCacheReady) {
            productionWarn('[MGTools Feed] ⚠️ Jotai atom cache not ready after timeout - initializing anyway');
            UnifiedState.jotaiReady = false;
          }

          // Now initialize feed buttons
          initializeInstantFeedButtons();
        } catch (error) {
          productionError('[MGTools] Error initializing instant feed buttons:', error);
        }
      })();

      // FIX ISSUE D: Initialize Sort Inventory button
      setTimeout(() => {
        try {
          initializeSortInventoryButton();
        } catch (error) {
          productionError('[MGTools] Error initializing sort inventory button:', error);
        }
      }, 1500); // Slightly longer delay to ensure inventory UI is ready
    } catch (error) {
      productionError('❌ Error creating UI:', error);

      // Show visible error popup for user (especially important in Discord browser)
      try {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(220, 38, 38, 0.95);
          color: white;
          padding: 20px;
          border-radius: 8px;
          z-index: 9999999;
          font-family: monospace;
          max-width: 500px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;
        errorDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">❌ MGTools UI Failed to Load</div>
          <div style="font-size: 12px; margin-bottom: 10px; color: #fecaca;">${error.message}</div>
          <div style="font-size: 11px; color: #fef2f2;">Press F12 and check Console for details</div>
          <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 8px 16px; background: white; color: #dc2626; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Close</button>
        `;
        document.body.appendChild(errorDiv);
      } catch (e) {
        // If even error display fails, log it
        productionError('Failed to show error UI:', e);
      }

      if (MGA_DEBUG) {
        MGA_DEBUG.logError(error, 'createUnifiedUI');
      }
      productionWarn('⚠️ UI creation failed, but continuing with initialization...');
      // DON'T throw error - continue with intervals even if UI fails
    }

    // Verify UI reflects loaded data immediately after creation
    setTimeout(() => {
      const checkedSeeds = document.querySelectorAll('.seed-checkbox:checked');
      // Optional: Log UI state verification
    }, 100);

    // Initialize atom hooks
    productionLog('🔗 Initializing atom hooks...');
    initializeAtoms();

    // Initialize turtle timer
    productionLog('🐢 Initializing turtle timer...');
    initializeTurtleTimer();

    // Start monitoring intervals
    productionLog('⏱️ Starting monitoring intervals...');
    startIntervals();

    // Apply saved theme settings
    productionLog('🎨 Applying saved theme settings...');
    applyTheme();

    // Apply saved UI mode
    if (UnifiedState.data.settings.ultraCompactMode) {
      productionLog('📱 Applying saved ultra-compact mode...');
      applyUltraCompactMode(true);
    }

    // Apply saved weather setting
    productionLog('🌧️ Applying saved weather setting...');
    applyWeatherSetting();

    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();

    // Force UI refresh to apply saved state (timing fix for data persistence)
    productionLog('🔄 Applying delayed UI refresh to ensure saved state is displayed...');
    setTimeout(() => {
      productionLog('🔄 [DATA-PERSISTENCE] Applying delayed UI refresh...');

      // Verify data before refreshing UI
      productionLog('📊 [DATA-PERSISTENCE] Current state:', {
        petPresets: Object.keys(UnifiedState.data.petPresets).length,
        seedsToDelete: UnifiedState.data.seedsToDelete.length,
        autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled
      });

      // Update main tab content to reflect loaded data
      if (typeof updateTabContent === 'function') {
        updateTabContent();
        productionLog('✅ [DATA-PERSISTENCE] UI refreshed with saved state');
      }

      // Update any open popout overlays
      // CRITICAL FIX: Handle both Map objects (runtime) and plain objects (after JSON deserialization)
      if (UnifiedState.data?.popouts?.overlays) {
        const overlays = UnifiedState.data.popouts.overlays;

        // Check if it's a Map or plain object
        if (overlays instanceof Map) {
          // It's a Map - use Map's forEach (value, key order)
          overlays.forEach((overlay, tabName) => {
            if (overlay && document.contains(overlay)) {
              try {
                const content = getContentForTab(tabName, true);
                const contentEl = overlay.querySelector('.mga-overlay-content, .mga-content');
                if (contentEl) {
                  contentEl.innerHTML = content;
                  // Set up handlers for the refreshed content
                  if (tabName === 'seeds' && typeof setupSeedsTabHandlers === 'function') {
                    setupSeedsTabHandlers(overlay);
                  } else if (tabName === 'pets' && typeof setupPetsTabHandlers === 'function') {
                    setupPetsTabHandlers(overlay);
                  }
                  productionLog(`✅ [DATA-PERSISTENCE] Refreshed ${tabName} overlay with saved state`);
                }
              } catch (error) {
                productionWarn(`⚠️ [DATA-PERSISTENCE] Failed to refresh ${tabName} overlay:`, error);
              }
            }
          });
        } else if (typeof overlays === 'object') {
          // It's a plain object (after JSON deserialization) - iterate using Object.entries
          productionLog(
            '[DATA-PERSISTENCE] ⚠️ Popouts overlays is a plain object (JSON deserialized), skipping iteration'
          );
          // Note: Plain objects from JSON won't have DOM elements anyway, so skip is safe
        } else {
          debugLog('[DATA-PERSISTENCE] Unexpected popouts.overlays type:', typeof overlays);
        }
      }
    }, 1000); // 1000ms delay to ensure all data loading is complete

    // Initialize teleport system
    initializeTeleportSystem();

    // Initialize crop highlighting system
    setupCropHighlightingSystem();

    // Initialize hotkey system
    initializeHotkeySystem();

    // Initialize tooltip system
    if (targetWindow.MGA_Tooltips) {
      targetWindow.MGA_Tooltips.init();
      productionLog('💬 Tooltip system initialized');
    }

    UnifiedState.initialized = true;
    targetWindow._MGA_INITIALIZED = true;
    try {
      delete targetWindow._MGA_INITIALIZING;
    } catch (e) {
      targetWindow._MGA_INITIALIZING = false;
    }
    targetWindow._MGA_TIMESTAMP = Date.now(); // Update timestamp on completion

    // NOW run conflict detection after game has loaded successfully
    if (targetWindow.MGA_ConflictDetection) {
      // Detect external script presence
      const mainScriptDetected = targetWindow.MGA_ConflictDetection.detectMainScript();

      // Only create barriers if external scripts detected
      if (mainScriptDetected) {
        productionLog('🔒 [MGA-ISOLATION] External scripts detected - creating protective barriers');
        targetWindow.MGA_ConflictDetection.createIsolationBarrier();
        targetWindow.MGA_ConflictDetection.preventAccess();
      }

      // Run integrity checks
      const integrityOk = targetWindow.MGA_ConflictDetection.checkGlobalIntegrity();
      const isolationOk = targetWindow.MGA_ConflictDetection.validateIsolation();

      if (integrityOk && isolationOk) {
        productionLog('✅ [MGA-ISOLATION] Final integrity check passed - no conflicts detected');
        if (mainScriptDetected) {
          productionLog('✅ [MGA-ISOLATION] Complete isolation validated - external script protection active');
        }
      } else {
        productionWarn('⚠️ [MGA-ISOLATION] Final integrity check found potential conflicts');
        if (!integrityOk) productionWarn('⚠️ [MGA-ISOLATION] Global integrity issues detected');
        if (!isolationOk) productionWarn('⚠️ [MGA-ISOLATION] Isolation validation failed');
      }
    } else {
      productionWarn('⚠️ [MGA-ISOLATION] ConflictDetection not available - running without isolation');
    }

    productionLog('✅ Magic Garden Unified Assistant initialized successfully!');

    // Add global recovery function for users whose UI disappears
    targetWindow.MGA_SHOW_UI = function () {
      productionLog('%c🔧 MGTools Recovery', 'color: #4CAF50; font-weight: bold; font-size: 14px');
      productionLog('Clearing corrupted UI state...');
      try {
        deps.localStorage.removeItem('mgh_toolbar_visible');
        deps.localStorage.removeItem('mgh_dock_position');
        deps.localStorage.removeItem('mgh_dock_orientation');
        productionLog('✅ State cleared. Reloading page...');
        setTimeout(() => deps.location.reload(), 500);
      } catch (e) {
        productionError('❌ Recovery failed:', e);
        productionLog('Try manually: localStorage.clear() then refresh');
      }
    };

    // Startup banner with recovery instructions
    productionLog(
      '%c🎮 MGTools v' + (typeof deps.GM_info !== 'undefined' ? deps.GM_info.script.version : '1.1.1') + ' Loaded',
      'color: #4CAF50; font-weight: bold; font-size: 14px'
    );
    productionLog('%c💡 UI not showing? Run in console: MGA_SHOW_UI()', 'color: #FFC107; font-size: 12px');

    // Remove test UI after successful initialization
    const testUI =
      document.querySelector('div[style*="Test UI Active"]') ||
      document.querySelector('div[style*="MGA Test UI"]') ||
      Array.from(document.querySelectorAll('div')).find(
        div => div.textContent && div.textContent.includes('Test UI Active')
      );
    if (testUI) {
      testUI.remove();
      debugLog('UI_LIFECYCLE', 'Test UI removed after successful initialization');
    }

    // Check connection status periodically using managed interval
    setManagedInterval(
      'connectionCheck',
      () => {
        const hasConnection =
          targetWindow.MagicCircle_RoomConnection &&
          typeof targetWindow.MagicCircle_RoomConnection.sendMessage === 'function';
        if (!UnifiedState.connectionStatus && hasConnection) {
          productionLog('🔌 Game connection established!');
          UnifiedState.connectionStatus = true;
        } else if (UnifiedState.connectionStatus && !hasConnection) {
          productionWarn('⚠️ Game connection lost!');
          UnifiedState.connectionStatus = false;
        }
      },
      5000
    );
  } catch (error) {
    productionError('❌ Failed to initialize Magic Garden Unified Assistant:', error);
    productionError('Stack trace:', error.stack);
    UnifiedState.initialized = false; // Allow retry
  }
}

/* ============================================================================
 * ENVIRONMENT-BASED INITIALIZATION
 * ============================================================================ */

/**
 * Initializes the script based on detected environment
 * Routes to appropriate initialization strategy based on environment analysis
 *
 * Strategies:
 * - 'game-ready': Full game integration (calls initializeScript)
 * - 'game-wait': Wait for game atoms (calls waitForGameReady)
 * - 'standalone': Demo mode (calls initializeStandalone)
 * - 'skip': Skip initialization (Discord page itself)
 *
 * @param {Object} deps - Dependency injection object
 * @param {Function} deps.detectEnvironment - Function to detect current environment
 * @param {Function} deps.initializeScript - Function for full game initialization
 * @param {Function} deps.waitForGameReady - Function to wait for game readiness
 * @param {Function} deps.initializeStandalone - Function for demo mode
 * @param {Console} deps.console - Console API for logging
 * @param {Function} deps.productionLog - Production logging function
 * @returns {void}
 *
 * @example
 * initializeBasedOnEnvironment({
 *   detectEnvironment: detectEnvironment,
 *   initializeScript: initializeScript,
 *   waitForGameReady: waitForGameReady,
 *   initializeStandalone: initializeStandalone,
 *   console: console,
 *   productionLog: productionLog
 * });
 */
export function initializeBasedOnEnvironment(deps) {
  const { detectEnvironment, initializeScript, waitForGameReady, initializeStandalone, console, productionLog } = deps;

  productionLog('🔍🔍🔍 [EXECUTION] ENTERED initializeBasedOnEnvironment()');
  productionLog('🔍 [EXECUTION] About to call detectEnvironment()');
  const environment = detectEnvironment();
  productionLog('🔍 [EXECUTION] detectEnvironment() returned:', environment);

  productionLog('📊 Environment Analysis:', {
    domain: environment.domain,
    strategy: environment.initStrategy,
    isGame: environment.isGameEnvironment,
    hasAtoms: environment.hasJotaiAtoms,
    hasConnection: environment.hasMagicCircleConnection
  });

  switch (environment.initStrategy) {
    case 'game-ready':
      productionLog('✅ Game environment ready - initializing with full integration');
      initializeScript(deps);
      break;

    case 'game-wait':
      productionLog('⏳ Game environment detected - waiting for game atoms...');
      waitForGameReady(deps);
      break;

    case 'standalone':
      productionLog('🎮 Standalone environment - initializing demo mode');
      initializeStandalone(deps);
      break;

    case 'skip':
      productionLog('⏭️ Skipping initialization - script will run in game iframe only');
      // Do not initialize on Discord page itself
      break;

    default:
      productionLog('❓ Unknown environment - attempting standalone mode');
      initializeStandalone(deps);
      break;
  }
}

/**
 * Waits for game to be ready before initializing
 * Polls for jotaiAtomCache and MagicCircle_RoomConnection
 *
 * Polling strategy:
 * - Checks every 500ms for game readiness
 * - Max 20 attempts (10 seconds)
 * - After 10 attempts, more lenient check (allows some game elements)
 * - Falls back to demo mode if max attempts exceeded
 *
 * @param {Object} deps - Dependency injection object
 * @param {Window} deps.targetWindow - Target window to check for game objects
 * @param {Document} deps.document - Document API
 * @param {Function} deps.initializeScript - Function to initialize when ready
 * @param {Function} deps.initializeStandalone - Function for fallback demo mode
 * @param {Function} deps.setManagedInterval - Function to set managed interval
 * @param {Function} deps.clearManagedInterval - Function to clear managed interval
 * @param {Console} deps.console - Console API for logging
 * @param {Function} deps.productionLog - Production logging function
 * @returns {void}
 *
 * @example
 * waitForGameReady({
 *   targetWindow: window,
 *   document: document,
 *   initializeScript: initializeScript,
 *   initializeStandalone: initializeStandalone,
 *   setManagedInterval: setManagedInterval,
 *   clearManagedInterval: clearManagedInterval,
 *   console: console,
 *   productionLog: productionLog
 * });
 */
export function waitForGameReady(deps) {
  const {
    targetWindow,
    document,
    initializeScript,
    initializeStandalone,
    setManagedInterval,
    clearManagedInterval,
    console,
    productionLog
  } = deps;

  let attempts = 0;
  const maxAttempts = 20; // 10 seconds at 500ms intervals

  const checkGameReady = () => {
    // More flexible game readiness check - be less strict about requirements
    const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
    const hasAtoms = atomCache && typeof atomCache === 'object';
    const hasConnection =
      targetWindow.MagicCircle_RoomConnection && typeof targetWindow.MagicCircle_RoomConnection === 'object';
    const hasBasicDom = document.body && document.readyState === 'complete';

    // Check for alternative game indicators if primary ones fail (use regular document for game detection)
    const hasGameElements =
      document.querySelector('canvas') ||
      document.querySelector('[class*="game"]') ||
      document.querySelector('[id*="game"]') ||
      document.querySelector('div[style*="position"]');

    // Additional check: verify atoms actually contain expected keys
    const atomsReady = hasAtoms && atomCache.size > 0;

    // Be more lenient - initialize if we have DOM ready and some game indicators
    if ((atomsReady && hasConnection && hasBasicDom) || (hasBasicDom && hasGameElements && attempts >= 10)) {
      if (atomsReady && hasConnection) {
        productionLog('✅ Game atoms and connection fully ready - switching to full mode');
        productionLog('📊 [GAME-READY] Atoms count:', atomCache.size);
      } else {
        productionLog('✅ Game elements detected, proceeding with reduced functionality mode');
      }

      initializeScript(deps);
      return true;
    }

    // Debug logging for what's missing
    if (attempts % 8 === 0) {
      // Every 4 seconds
      productionLog('⏳ [GAME-WAIT] Still waiting...', {
        hasAtoms,
        atomsCount: hasAtoms ? atomCache.size : 0,
        hasConnection,
        hasBasicDom,
        hasGameElements,
        readyState: document.readyState,
        attempt: attempts,
        willProceedAt: attempts >= 10 ? 'Next check (fallback mode)' : `Attempt ${10 - attempts} more`
      });
    }

    return false;
  };

  if (!checkGameReady()) {
    // Use managed interval for game check
    setManagedInterval(
      'gameCheck',
      () => {
        attempts++;

        if (checkGameReady() || attempts >= maxAttempts) {
          clearManagedInterval('gameCheck');

          if (attempts >= maxAttempts) {
            productionLog('⚠️ Game readiness timeout - falling back to demo mode');
            productionLog('💡 You can try MGA.init() later if the game loads');
            initializeStandalone(deps);
          }
        }
      },
      500
    );
  }
}

/* ============================================================================
 * EXPORTS
 * ============================================================================ */

// All major functions are exported as named exports above
// Helper functions are also exported for testability

/**
 * Complete dependency list for reference:
 *
 * Core Dependencies:
 * - UnifiedState: Global state object
 * - targetWindow: Game iframe window or main window
 * - document: Document API
 * - console: Console API
 * - localStorage: localStorage API
 * - location: Location API for page reload
 *
 * Timing Functions:
 * - setTimeout: setTimeout function
 * - setManagedInterval: Managed interval setter
 * - clearManagedInterval: Managed interval clearer
 * - performanceNow: performance.now() function
 * - dateNow: Date.now() function
 * - mathRandom: Math.random() function
 *
 * Logging Functions:
 * - productionLog: Production logging
 * - productionWarn: Production warnings
 * - debugLog: Debug logging
 * - debugError: Debug error logging
 *
 * Data Functions:
 * - createDemoData: Creates demo data
 * - loadSavedData: Loads saved settings
 * - generateDemoTiles: Generates demo tiles
 *
 * UI Functions:
 * - createUnifiedUI: Creates main UI
 * - ensureUIHealthy: Health check
 * - setupToolbarToggle: Toolbar toggle
 * - setupDockSizeControl: Dock size control
 * - addDemoBanner: Demo banner
 * - updateTabContent: Updates tab content
 * - getContentForTab: Gets tab content
 * - setupSeedsTabHandlers: Seeds tab handlers
 * - setupPetsTabHandlers: Pets tab handlers
 *
 * Feature Functions:
 * - initializeSortInventoryButton: Sort button
 * - initializeInstantFeedButtons: Feed buttons
 * - initializeAtoms: Atom hooks
 * - initializeTurtleTimer: Turtle timer
 * - initializeKeyboardShortcuts: Keyboard shortcuts
 * - initializeTeleportSystem: Teleport system
 * - setupCropHighlightingSystem: Crop highlighting
 * - initializeHotkeySystem: Hotkey system
 *
 * System Functions:
 * - startIntervals: Monitoring intervals
 * - applyTheme: Theme application
 * - applyUltraCompactMode: Compact mode
 * - applyWeatherSetting: Weather setting
 * - detectEnvironment: Environment detection
 * - cleanupCorruptedDockPosition: Storage cleanup
 * - setupDemoTimers: Demo timers
 *
 * Connection:
 * - connection: MagicCircle_RoomConnection
 *
 * Timer Manager:
 * - timerManager: Global timer manager
 * - initializeTimerManager: Timer manager init
 * - updateTimerDisplay: Timer display update
 *
 * Debug:
 * - MGA_DEBUG: Optional debug object
 * - GM_info: Greasemonkey info object
 *
 * Jotai:
 * - jotaiStore: Jotai store
 * - captureJotaiStore: Jotai store capture
 */
