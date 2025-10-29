/**
 * @fileoverview Initialization Functions Module
 *
 * This module contains the core initialization functions that orchestrate
 * the MGTools startup sequence. These functions were extracted from the
 * Live-Beta monolith to complete the modularization.
 *
 * Key responsibilities:
 * - Data loading and persistence (loadSavedData)
 * - Atom subscriptions (initializeAtoms)
 * - Monitoring intervals (startIntervals)
 * - Theme application (applyTheme)
 * - Settings application (compact mode, weather)
 * - Keyboard shortcuts initialization
 *
 * All functions use dependency injection for testability.
 *
 * @module init/init-functions
 * @version 1.0.0
 * @extracted 2025-10-27
 */

/* ============================================================================
 * LOAD SAVED DATA
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 28443-28650
 */

/**
 * Loads saved user data from storage and initializes persistence guard
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Function} deps.MGA_loadJSON - Storage load function
 * @param {Function} deps.performStorageHealthCheck - Health check function
 * @param {Function} deps.productionLog - Production logging
 * @param {Function} deps.productionWarn - Production warnings
 * @param {Window} deps.targetWindow - Target window
 * @returns {void}
 */
export function loadSavedData(deps) {
  const {
    UnifiedState,
    MGA_loadJSON,
    performStorageHealthCheck,
    productionLog,
    productionWarn,
    targetWindow
  } = deps;

  // PERSISTENCE GUARD v3.6.6: Initialize guard to prevent premature saves during initialization
  targetWindow.MGA_PERSISTENCE_GUARD = {
    initializationSavesBlocked: true,
    finalSaveLocation: 23480,
    warningMessage:
      '⚠️ BLOCKED: Premature save during initialization detected! Only final save at line ~23480 is allowed.'
  };
  productionLog('🛡️ [PERSISTENCE-GUARD] Initialized - blocking premature saves during initialization');

  // === STORAGE HEALTH CHECK (v3.8.7) ===
  productionLog('🏥 [HEALTH-CHECK] Running storage health check...');
  const healthReport = performStorageHealthCheck();
  productionLog('🏥 [HEALTH-CHECK] Results:', {
    GM: healthReport.writeTest.GM || 'N/A',
    localStorage: healthReport.writeTest.localStorage || 'N/A',
    issues: healthReport.issues.length
  });

  if (healthReport.issues.length > 0) {
    productionWarn('⚠️ [HEALTH-CHECK] Storage issues detected:', healthReport.issues);
    healthReport.issues.forEach(issue => {
      productionWarn(`  - ${issue.severity}: ${issue.message}`);
    });
  }

  // Load saved data from GM storage
  const savedData = MGA_loadJSON('MGA_data', null);
  if (savedData && typeof savedData === 'object') {
    // Deep merge saved data into UnifiedState
    Object.keys(savedData).forEach(key => {
      if (key in UnifiedState.data) {
        if (typeof savedData[key] === 'object' && !Array.isArray(savedData[key])) {
          UnifiedState.data[key] = { ...UnifiedState.data[key], ...savedData[key] };
        } else {
          UnifiedState.data[key] = savedData[key];
        }
      }
    });
    productionLog('✅ Loaded saved data from storage');
    productionLog('📊 Loaded state keys:', Object.keys(savedData).join(', '));
  } else {
    productionLog('💡 No saved data found, using defaults');
  }

  // Disable persistence guard at end of data loading
  targetWindow.MGA_PERSISTENCE_GUARD.initializationSavesBlocked = false;
  productionLog('🛡️ [PERSISTENCE-GUARD] Disabled - normal saves now allowed');
}

/* ============================================================================
 * INITIALIZE ATOMS
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 27014-27300
 */

/**
 * Initializes Jotai atom subscriptions for live game data
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Window} deps.targetWindow - Target window
 * @param {Function} deps.hookAtom - Atom hooking function
 * @param {Function} deps.setManagedInterval - Managed interval setter
 * @param {Function} deps.updateTabContent - Tab content updater
 * @param {Document} deps.document - Document API
 * @param {Function} deps.productionLog - Production logging
 * @param {Function} deps.updateActivePetsFromRoomState - Pet detector
 * @returns {void}
 */
export function initializeAtoms(deps) {
  const {
    UnifiedState,
    targetWindow,
    hookAtom,
    setManagedInterval,
    updateTabContent,
    document,
    productionLog,
    updateActivePetsFromRoomState
  } = deps;

  productionLog('🔗 [SIMPLE-ATOMS] Starting simple atom initialization...');

  // Start simple pet detection using room state
  productionLog('🐾 [SIMPLE-ATOMS] Setting up room state pet detection...');
  updateActivePetsFromRoomState(); // Get initial pets immediately

  // Set up periodic pet detection (reduced frequency to minimize console spam)
  setManagedInterval(
    'petDetection',
    () => {
      updateActivePetsFromRoomState();

      // ALSO check window.activePets directly (set by atom hook)
      if (targetWindow.activePets && Array.isArray(targetWindow.activePets) && targetWindow.activePets.length > 0) {
        productionLog('🐾 [PERIODIC-CHECK] Found pets in window.activePets:', targetWindow.activePets);

        // Update UnifiedState
        if (!UnifiedState.atoms.activePets || UnifiedState.atoms.activePets.length !== targetWindow.activePets.length) {
          UnifiedState.atoms.activePets = targetWindow.activePets;

          // Force UI update
          if (UnifiedState.activeTab === 'pets') {
            updateTabContent();
          }
        }
      }
    },
    30000
  ); // Check every 30 seconds

  // Hook #1: Pet SPECIES data (for active pets display)
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/_archive/myPetSlotsAtom.ts/myPetSlotsAtom',
    'activePets',
    petSlots => {
      if (UnifiedState.data.settings?.debugMode) {
        productionLog('🐾 [ATOM-DEBUG] myPetSlotsAtom raw value:', {
          value: petSlots,
          type: typeof petSlots,
          isArray: Array.isArray(petSlots),
          length: petSlots?.length,
          valueIsArray: Array.isArray(petSlots?.value),
          valueLength: petSlots?.value?.length
        });
      }

      // Store in UnifiedState for UI access
      UnifiedState.atoms.activePets = petSlots || [];
      targetWindow.activePets = petSlots || [];

      // Force UI update if on pets tab
      if (UnifiedState.activeTab === 'pets') {
        updateTabContent();
      }
    },
    0,
    {
      targetWindow,
      UnifiedState,
      productionLog,
      productionWarn: () => {},
      console
    }
  );

  // Hook #2: Friend bonus multiplier
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/friendBonusAtom.ts/friendBonusAtom',
    'friendBonus',
    value => {
      UnifiedState.atoms.friendBonus = value || 1.0;
      targetWindow.friendBonus = value || 1.0;
    },
    0,
    {
      targetWindow,
      UnifiedState,
      productionLog,
      productionWarn: () => {},
      console
    }
  );

  // Hook #3: Garden state (for crop data)
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myGardenAtom.ts/myGardenAtom',
    'myGarden',
    garden => {
      UnifiedState.atoms.myGarden = garden || {};
      targetWindow.myGarden = garden || {};
    },
    0,
    {
      targetWindow,
      UnifiedState,
      productionLog,
      productionWarn: () => {},
      console
    }
  );

  // Hook #4: Inventory data
  hookAtom(
    '/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myInventoryAtom.ts/myInventoryAtom',
    'inventory',
    inventory => {
      UnifiedState.atoms.inventory = inventory || { items: [] };
      targetWindow.inventory = inventory || { items: [] };
    },
    0,
    {
      targetWindow,
      UnifiedState,
      productionLog,
      productionWarn: () => {},
      console
    }
  );

  productionLog('✅ [SIMPLE-ATOMS] Atom initialization complete');
}

/* ============================================================================
 * START INTERVALS
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 29307-29600
 */

/**
 * Starts all monitoring intervals for notifications and updates
 *
 * @param {Object} deps - Dependencies
 * @param {Window} deps.targetWindow - Target window
 * @param {Function} deps.setManagedInterval - Managed interval setter
 * @param {Function} deps.checkShopRestock - Shop restock checker
 * @param {Function} deps.checkTurtleTimer - Turtle timer checker
 * @param {Function} deps.productionLog - Production logging
 * @returns {void}
 */
export function startIntervals(deps) {
  const {
    targetWindow,
    setManagedInterval,
    checkShopRestock,
    checkTurtleTimer,
    productionLog
  } = deps;

  productionLog('⏱️ Starting monitoring intervals...');

  // Shop restock monitoring
  if (checkShopRestock) {
    setManagedInterval('shopRestock', checkShopRestock, 30000); // Every 30 seconds
    productionLog('✅ Shop restock monitoring started');
  }

  // Turtle timer monitoring
  if (checkTurtleTimer) {
    setManagedInterval('turtleTimer', checkTurtleTimer, 10000); // Every 10 seconds
    productionLog('✅ Turtle timer monitoring started');
  }

  // Mark intervals as started
  targetWindow._mgaIntervalsStarted = true;
  productionLog('✅ All monitoring intervals started');
}

/* ============================================================================
 * APPLY THEME
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 25332-25400
 */

/**
 * Applies current theme to all UI elements
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Function} deps.generateThemeStyles - Theme generator
 * @param {Function} deps.applyThemeToElement - Apply to element
 * @param {Function} deps.applyThemeToDock - Apply to dock
 * @param {Function} deps.applyThemeToSidebar - Apply to sidebar
 * @param {Function} deps.applyAccentToDock - Apply accent to dock
 * @param {Function} deps.applyAccentToSidebar - Apply accent to sidebar
 * @param {Function} deps.syncThemeToAllWindows - Sync to windows
 * @returns {void}
 */
export function applyTheme(deps) {
  const {
    UnifiedState,
    generateThemeStyles,
    applyThemeToElement,
    applyThemeToDock,
    applyThemeToSidebar,
    applyAccentToDock,
    applyAccentToSidebar,
    syncThemeToAllWindows
  } = deps;

  const themeStyles = generateThemeStyles({}, UnifiedState.data.settings, false);

  // Store current theme for cross-window synchronization
  UnifiedState.currentTheme = themeStyles;

  // Apply to main panel if it exists
  const panel = UnifiedState.panels.main;
  if (panel && applyThemeToElement) {
    applyThemeToElement({ document }, panel, themeStyles);
  }

  // Apply theme colors to dock and sidebar
  const isBlackTheme = themeStyles.gradientStyle && themeStyles.gradientStyle.startsWith('black-');
  if (isBlackTheme && themeStyles.accentColor) {
    // Black themes get special accent styling
    applyAccentToDock({ document }, themeStyles);
    applyAccentToSidebar({ document }, themeStyles);
  } else {
    // Non-black themes get their gradient applied
    applyThemeToDock({ document }, themeStyles);
    applyThemeToSidebar({ document }, themeStyles);
  }

  // Update all existing overlays and pop-out windows
  if (syncThemeToAllWindows) {
    syncThemeToAllWindows();
  }
}

/* ============================================================================
 * APPLY ULTRA COMPACT MODE
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 25642-25750
 */

/**
 * Applies or removes ultra compact mode styling
 *
 * @param {Object} deps - Dependencies
 * @param {Document} deps.document - Document API
 * @param {Function} deps.productionLog - Production logging
 * @param {boolean} enabled - Whether to enable compact mode
 * @returns {void}
 */
export function applyUltraCompactMode(deps, enabled) {
  const { document, productionLog } = deps;

  const panel = document.querySelector('.mga-panel');
  if (!panel) return;

  if (enabled) {
    panel.classList.add('ultra-compact');
    productionLog('📱 Ultra-compact mode enabled');
  } else {
    panel.classList.remove('ultra-compact');
    productionLog('📱 Ultra-compact mode disabled');
  }

  // Apply ultra-compact styles
  const compactStyles = `
    .mga-panel.ultra-compact {
      max-width: 300px !important;
    }
    .mga-panel.ultra-compact .mga-tab-content {
      font-size: 11px !important;
      padding: 8px !important;
    }
    .mga-panel.ultra-compact button {
      padding: 4px 8px !important;
      font-size: 11px !important;
    }
    .mga-panel.ultra-compact input,
    .mga-panel.ultra-compact select {
      font-size: 11px !important;
      padding: 4px !important;
    }
  `;

  // Add or update style element
  let styleEl = document.getElementById('mga-ultra-compact-styles');
  if (enabled) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'mga-ultra-compact-styles';
      styleEl.textContent = compactStyles;
      document.head.appendChild(styleEl);
    }
  } else {
    if (styleEl) {
      styleEl.remove();
    }
  }
}

/* ============================================================================
 * APPLY WEATHER SETTING
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 9445-9550
 */

/**
 * Applies weather visibility setting
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Document} deps.document - Document API
 * @param {Function} deps.productionLog - Production logging
 * @returns {void}
 */
export function applyWeatherSetting(deps) {
  const { UnifiedState, document, productionLog } = deps;

  const hideWeather = UnifiedState.data.settings.hideWeather || false;

  // Find weather elements and hide/show them
  const weatherElements = document.querySelectorAll('[class*="weather"], [class*="Weather"]');

  weatherElements.forEach(el => {
    if (hideWeather) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  });

  // Add or remove global weather hiding style
  let styleEl = document.getElementById('mga-weather-hide-styles');

  if (hideWeather) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'mga-weather-hide-styles';
      styleEl.textContent = `
        [class*="weather"],
        [class*="Weather"],
        [data-weather] {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    productionLog('🌧️ Weather hidden');
  } else {
    if (styleEl) {
      styleEl.remove();
    }
    productionLog('🌧️ Weather visible');
  }
}

/* ============================================================================
 * INITIALIZE KEYBOARD SHORTCUTS
 * ============================================================================
 * Extracted from Live-Beta MGTools.user.js lines 29973-30150
 */

/**
 * Initializes keyboard shortcuts for UI control
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - UnifiedState object
 * @param {Document} deps.document - Document API
 * @param {Function} deps.toggleMainHUD - Toggle main HUD
 * @param {Function} deps.productionLog - Production logging
 * @returns {void}
 */
export function initializeKeyboardShortcuts(deps) {
  const { UnifiedState, document, toggleMainHUD, productionLog } = deps;

  // Alt+M to toggle main HUD
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      if (toggleMainHUD) {
        toggleMainHUD();
      }
    }
  });

  // Alt+T to toggle turtle timer
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      UnifiedState.data.settings.turtleTimerEnabled = !UnifiedState.data.settings.turtleTimerEnabled;
      productionLog(`🐢 Turtle timer ${UnifiedState.data.settings.turtleTimerEnabled ? 'enabled' : 'disabled'}`);
    }
  });

  // Alt+P to toggle protection
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      UnifiedState.data.settings.protectionEnabled = !UnifiedState.data.settings.protectionEnabled;
      productionLog(`🛡️ Protection ${UnifiedState.data.settings.protectionEnabled ? 'enabled' : 'disabled'}`);
    }
  });

  productionLog('⌨️ Keyboard shortcuts initialized (Alt+M, Alt+T, Alt+P)');
}

/* ============================================================================
 * EXPORTS
 * ============================================================================
 */

export default {
  loadSavedData,
  initializeAtoms,
  startIntervals,
  applyTheme,
  applyUltraCompactMode,
  applyWeatherSetting,
  initializeKeyboardShortcuts
};
