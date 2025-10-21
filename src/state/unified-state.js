/**
 * UnifiedState Module
 *
 * Centralized state management for MGTools
 * Handles:
 * - State initialization and readiness detection
 * - Jotai atom subscriptions and synchronization
 * - State persistence
 */

export function createUnifiedState() {
  const UnifiedState = {
    // Readiness flags for proper initialization timing
    initialized: false,
    jotaiReady: false, // NEW: Track when Jotai store is ready
    atomsSubscribed: false, // NEW: Track when atom subscriptions are active

    connectionStatus: false,
    panels: {
      main: null,
      toggle: null
    },
    activeTab: 'pets',

    // Interval Management System
    intervals: {
      autoDelete: null,
      heartbeat: null,
      activitySimulator: null,
      gameCheck: null,
      connectionCheck: null,
      autoSave: null
    },

    popoutWindows: new Set(),

    firebase: {
      app: null,
      database: null,
      reportInterval: null,
      unsubscribe: null
    },

    data: {
      petPresets: {},
      petPresetsOrder: [],
      currentPresetIndex: -1,
      petAbilityLogs: [],
      seedsToDelete: [],
      autoDeleteEnabled: false,
      inventoryValue: 0,
      gardenValue: 0,
      tileValue: 0,
      lastAbilityTimestamps: {},
      roomStatus: {
        counts: {},
        currentRoom: null,
        reporterId: null
      },
      customRooms: [],
      timers: {
        seed: null,
        egg: null,
        tool: null,
        lunar: null
      },
      settings: {
        opacity: 95,
        popoutOpacity: 50,
        theme: 'default',
        gradientStyle: 'blue-purple',
        effectStyle: 'none',
        compactMode: false,
        ultraCompactMode: false,
        useInGameOverlays: true,
        notifications: {
          enabled: true,
          volume: 0.3,
          notificationType: 'epic',
          requiresAcknowledgment: false,
          continuousEnabled: false,
          watchedSeeds: ['Carrot', 'Sunflower', 'Moonbinder', 'Dawnbinder', 'Starweaver'],
          watchedEggs: ['CommonEgg', 'MythicalEgg'],
          watchedDecor: [],
          petHungerEnabled: false,
          petHungerThreshold: 25,
          petHungerSound: 'double',
          abilityNotificationsEnabled: false,
          watchedAbilities: [],
          watchedAbilityCategories: {
            xpBoost: true,
            cropSizeBoost: true,
            selling: true,
            harvesting: true,
            growthSpeed: true,
            specialMutations: true,
            other: true
          },
          abilityNotificationSound: 'single',
          abilityNotificationVolume: 0.2,
          weatherNotificationsEnabled: false,
          watchedWeatherEvents: ['Snow', 'Rain', 'AmberMoon', 'Dawn'],
          shopFirebaseEnabled: false,
          lastSeenTimestamps: {}
        },
        detailedTimestamps: true,
        debugMode: false,
        roomDebugMode: false,
        hideWeather: false,
        autoFavorite: {
          enabled: false,
          species: [],
          mutations: []
        },
        hideFeedButtons: false
      },
      hotkeys: {
        enabled: true,
        gameKeys: {
          inventory: { name: 'Open Inventory', original: 'e', custom: null },
          harvest: { name: 'Harvest/Select', original: ' ', custom: null },
          selectLeft: { name: 'Select Left Crop', original: 'x', custom: null },
          selectRight: { name: 'Select Right Crop', original: 'c', custom: null },
          hotbar1: { name: 'Hotbar Slot 1', original: '1', custom: null },
          hotbar2: { name: 'Hotbar Slot 2', original: '2', custom: null },
          hotbar3: { name: 'Hotbar Slot 3', original: '3', custom: null },
          hotbar4: { name: 'Hotbar Slot 4', original: '4', custom: null },
          hotbar5: { name: 'Hotbar Slot 5', original: '5', custom: null },
          hotbar6: { name: 'Hotbar Slot 6', original: '6', custom: null },
          hotbar7: { name: 'Hotbar Slot 7', original: '7', custom: null },
          hotbar8: { name: 'Hotbar Slot 8', original: '8', custom: null },
          hotbar9: { name: 'Hotbar Slot 9', original: '9', custom: null },
          teleportShop: { name: 'Teleport to Shop', original: 'shift+1', custom: null },
          teleportGarden: { name: 'Teleport to Garden', original: 'shift+2', custom: null },
          teleportSell: { name: 'Teleport to Sell', original: 'shift+3', custom: null },
          toggleQuickShop: { name: 'Toggle Quick Shop', original: 'ctrl+b', custom: null }
        },
        mgToolsKeys: {
          openPets: { name: 'Open Pets Tab', custom: null },
          openAbilities: { name: 'Open Abilities Tab', custom: null },
          openSeeds: { name: 'Open Seeds Tab', custom: null },
          openValues: { name: 'Open Values Tab', custom: null },
          openTimers: { name: 'Open Timers Tab', custom: null },
          openRooms: { name: 'Open Rooms Tab', custom: null },
          openShop: { name: 'Open Shop Tab', custom: null },
          cyclePresets: { name: 'Cycle Pet Presets', custom: null }
        }
      },
      petPresetHotkeys: {},
      popouts: {
        overlays: new Map(),
        windows: new Map(),
        widgets: new Map()
      },
      filterMode: 'categories',
      abilityFilters: {
        xpBoost: true,
        cropSizeBoost: true,
        selling: true,
        harvesting: true,
        growthSpeed: true,
        specialMutations: true,
        other: true
      },
      selectedSpecies: null,
      autoFavorite: {
        enabled: false,
        selectedSpecies: []
      }
    },

    // Atom subscriptions and live data
    atoms: {
      activePets: [],
      petAbility: null,
      inventory: null,
      currentCrop: null,
      friendBonus: 1,
      myGarden: null,
      quinoaData: null
    }
  };

  return UnifiedState;
}

/**
 * Wait for Jotai store and atoms to be ready
 * Returns a promise that resolves when the system is ready
 *
 * @param {Window} targetWindow - The game window object
 * @param {Object} jotaiStore - The Jotai store (can be null initially)
 * @param {Function} captureJotaiStore - Function to attempt capturing the store
 * @param {number} maxWaitMs - Maximum time to wait (default 10000ms)
 * @returns {Promise<Object>} Resolves with { store, ready: true } or { store: null, ready: false }
 */
export async function waitForJotaiReady(targetWindow, jotaiStore, captureJotaiStore, maxWaitMs = 10000) {
  const startTime = Date.now();
  const pollInterval = 200; // Check every 200ms

  console.log('[UnifiedState] 🔍 Waiting for Jotai store to be ready...');

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Try to capture store if we don't have it yet
      if (!jotaiStore) {
        jotaiStore = captureJotaiStore();
      }

      // Check if store is ready
      const storeReady = !!(jotaiStore && targetWindow.jotaiAtomCache);

      if (storeReady) {
        clearInterval(checkInterval);
        console.log(`[UnifiedState] ✅ Jotai store ready after ${elapsed}ms`);
        resolve({ store: jotaiStore, ready: true });
        return;
      }

      // Timeout check
      if (elapsed >= maxWaitMs) {
        clearInterval(checkInterval);
        console.warn(`[UnifiedState] ⚠️ Jotai store not ready after ${maxWaitMs}ms - proceeding with fallback`);
        resolve({ store: null, ready: false });
      }
    }, pollInterval);
  });
}

/**
 * Wait for a specific atom to update after an operation
 * Used to ensure state synchronization after game actions
 *
 * @param {Function} getAtomValue - Function to get current atom value
 * @param {string} atomKey - The atom key to watch
 * @param {Function} condition - Function that returns true when update is detected
 * @param {number} maxWaitMs - Maximum time to wait
 * @returns {Promise<boolean>} True if condition was met, false if timed out
 */
export async function waitForAtomUpdate(getAtomValue, atomKey, condition, maxWaitMs = 1000) {
  const startTime = Date.now();
  const pollInterval = 50; // Fast polling for responsiveness

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;

      try {
        const value = await getAtomValue(atomKey);
        if (condition(value)) {
          clearInterval(checkInterval);
          console.log(`[UnifiedState] ✅ Atom '${atomKey}' updated after ${elapsed}ms`);
          resolve(true);
          return;
        }
      } catch (err) {
        // Atom not ready yet, continue waiting
      }

      if (elapsed >= maxWaitMs) {
        clearInterval(checkInterval);
        console.warn(`[UnifiedState] ⏱️ Atom '${atomKey}' update timeout after ${maxWaitMs}ms`);
        resolve(false);
      }
    }, pollInterval);
  });
}
