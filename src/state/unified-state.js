/**
 * STATE MODULE - UnifiedState Container
 * ====================================================================================
 * Pure state container for MGTools application state
 *
 * @module state/unified-state
 *
 * This module provides:
 * - UnifiedState object (complete application state tree)
 * - State initialization
 * - Snapshot/restore methods for serialization
 * - Pure data container with deterministic structure
 *
 * Dependencies: (optional) Storage, Logger for debug logging
 *
 * GUARANTEES:
 * - Zero DOM manipulation
 * - Zero network calls
 * - Zero timers (structure only, no execution)
 * - Deterministic structure
 * - Pure data container
 */

import { Storage } from '../core/storage.js';
import { Logger } from '../core/logging.js';

/* ====================================================================================
 * UNIFIED STATE CONTAINER
 * ====================================================================================
 */

/**
 * UnifiedState - Complete application state container
 * @namespace UnifiedState
 */
export const UnifiedState = {
  // ==================== METADATA ====================
  initialized: false,
  jotaiReady: false,      // Track when Jotai store is ready
  atomsSubscribed: false, // Track when atom subscriptions are active
  connectionStatus: false,

  // ==================== UI STATE ====================
  panels: {
    main: null,   // Main panel reference (structure only, no DOM)
    toggle: null  // Toggle button reference (structure only, no DOM)
  },
  activeTab: 'pets',

  // ==================== INTERVAL MANAGEMENT ====================
  // Structure only - actual timers managed by init module
  intervals: {
    autoDelete: null,
    heartbeat: null,
    activitySimulator: null,
    gameCheck: null,
    connectionCheck: null,
    autoSave: null
  },

  // ==================== POPOUT WINDOWS ====================
  popoutWindows: new Set(), // Track all popout windows

  // ==================== FIREBASE CONNECTION ====================
  // Structure only - actual connection managed by network/init modules
  firebase: {
    app: null,
    database: null,
    reportInterval: null,
    unsubscribe: null
  },

  // ==================== APPLICATION DATA ====================
  data: {
    // Pet Management
    petPresets: {},
    petPresetsOrder: [],        // Array to maintain preset display order
    currentPresetIndex: -1,     // Track position for cycling through presets
    petAbilityLogs: [],
    lastAbilityTimestamps: {},

    // Seeds & Auto-delete
    seedsToDelete: [],
    autoDeleteEnabled: false,

    // Values
    inventoryValue: 0,
    gardenValue: 0,
    tileValue: 0,

    // Room Status
    roomStatus: {
      counts: {},       // Store room counts {MG1: 3, MG2: 2, ...}
      currentRoom: null,
      reporterId: null
    },
    customRooms: [],    // Dynamic list of tracked rooms

    // Timers
    timers: {
      seed: null,
      egg: null,
      tool: null,
      lunar: null
    },

    // Settings
    settings: {
      opacity: 95,
      popoutOpacity: 50,
      theme: 'default',
      gradientStyle: 'blue-purple',
      effectStyle: 'none',
      compactMode: false,
      ultraCompactMode: false,
      useInGameOverlays: true,

      // Notifications
      notifications: {
        enabled: true,
        volume: 0.3,
        notificationType: 'epic', // 'simple', 'triple', 'alarm', 'epic', 'continuous'
        requiresAcknowledgment: false,
        continuousEnabled: false,
        watchedSeeds: ['Carrot', 'Sunflower', 'Moonbinder', 'Dawnbinder', 'Starweaver'],
        watchedEggs: ['CommonEgg', 'MythicalEgg'],
        watchedDecor: [],

        // Pet hunger notifications
        petHungerEnabled: false,
        petHungerThreshold: 25,   // Notify when hunger drops below this %
        petHungerSound: 'double',

        // Ability trigger notifications
        abilityNotificationsEnabled: false,
        watchedAbilities: [],     // Legacy - kept for backward compatibility
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

        // Weather event notifications
        weatherNotificationsEnabled: false,
        watchedWeatherEvents: ['Snow', 'Rain', 'AmberMoon', 'Dawn'],

        // Shop Firebase integration toggle
        shopFirebaseEnabled: false,
        lastSeenTimestamps: {}
      },

      detailedTimestamps: true,   // Show HH:MM:SS 24-hour format
      debugMode: false,           // Enable debug logging
      roomDebugMode: false,       // Enable detailed room API logging
      hideWeather: false,         // Hide weather visual effects

      // Auto-favorite
      autoFavorite: {
        enabled: false,
        species: [],              // List of species names to auto-favorite
        mutations: []             // List of mutations to auto-favorite
      },

      // UI Settings
      hideFeedButtons: false      // Default: show feed buttons
    },

    // Hotkeys
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

    // Popouts
    popouts: {
      overlays: new Map(),  // Track in-game overlays (Alt+key)
      windows: new Map(),   // Track separate windows
      widgets: new Map()    // Track shift+click popout widgets
    },

    // Ability Filters
    filterMode: 'categories', // 'categories', 'byPet', 'custom'
    abilityFilters: {
      xpBoost: true,
      cropSizeBoost: true,
      selling: true,
      harvesting: true,
      growthSpeed: true,
      specialMutations: true,
      other: true
    },
    customMode: {
      selectedAbilities: {}
    },
    petFilters: {
      selectedPets: {}
    }
  },

  // ==================== GAME STATE ATOMS ====================
  // References to game state atoms (managed by init module)
  atoms: {
    activePets: [],       // Initialize as empty array to prevent null errors
    petAbility: null,
    inventory: null,
    currentCrop: null,
    friendBonus: 1,
    myGarden: null,
    quinoaData: null
  }
};

/* ====================================================================================
 * STATE INITIALIZATION
 * ====================================================================================
 */

/**
 * Initialize UnifiedState with optional initial data
 * @param {Object} initial - Initial state data to merge
 * @returns {Object} - UnifiedState reference
 */
export function initState(initial = {}) {
  Logger.info('STATE', 'Initializing UnifiedState');

  // Merge initial data if provided
  if (initial && typeof initial === 'object') {
    if (initial.data) {
      Object.assign(UnifiedState.data, initial.data);
    }
    if (initial.settings) {
      Object.assign(UnifiedState.data.settings, initial.settings);
    }
  }

  // Try to load saved state from storage
  try {
    const saved = Storage.get('MGA_data');
    if (saved) {
      Logger.info('STATE', 'Restored state from storage');
      Object.assign(UnifiedState.data, saved);
    }
  } catch (error) {
    Logger.warn('STATE', 'Failed to load saved state', error);
  }

  UnifiedState.initialized = true;
  Logger.info('STATE', 'UnifiedState initialized');

  return UnifiedState;
}

/* ====================================================================================
 * SNAPSHOT & RESTORE
 * ====================================================================================
 */

/**
 * Create a snapshot of current state
 * @returns {Object} - State snapshot (deep copy)
 */
export function snapshotState() {
  return {
    initialized: UnifiedState.initialized,
    jotaiReady: UnifiedState.jotaiReady,
    atomsSubscribed: UnifiedState.atomsSubscribed,
    activeTab: UnifiedState.activeTab,
    data: JSON.parse(JSON.stringify(UnifiedState.data)) // Deep copy
  };
}

/**
 * Restore state from snapshot
 * @param {Object} snapshot - State snapshot to restore
 * @returns {boolean} - Success status
 */
export function restoreState(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    Logger.warn('STATE', 'Invalid snapshot provided to restoreState');
    return false;
  }

  try {
    if (snapshot.initialized !== undefined) {
      UnifiedState.initialized = snapshot.initialized;
    }
    if (snapshot.jotaiReady !== undefined) {
      UnifiedState.jotaiReady = snapshot.jotaiReady;
    }
    if (snapshot.atomsSubscribed !== undefined) {
      UnifiedState.atomsSubscribed = snapshot.atomsSubscribed;
    }
    if (snapshot.activeTab) {
      UnifiedState.activeTab = snapshot.activeTab;
    }
    if (snapshot.data) {
      Object.assign(UnifiedState.data, snapshot.data);
    }

    Logger.info('STATE', 'State restored from snapshot');
    return true;
  } catch (error) {
    Logger.error('STATE', 'Failed to restore state from snapshot', error);
    return false;
  }
}

/* ====================================================================================
 * GLOBAL EXPORTS (for IIFE/window access)
 * ====================================================================================
 * In the bundled version, these will be assigned to window object for global access.
 * This will be handled by the main index.js entry point.
 *
 * The following will be available globally:
 * - window.UnifiedState
 * - window.initState
 * - window.snapshotState
 * - window.restoreState
 */
