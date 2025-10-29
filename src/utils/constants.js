/**
 * CONSTANTS MODULE
 * ====================================================================================
 * Global configuration, version info, and utility constants
 *
 * @module utils/constants
 *
 * This module contains all application-wide constants including:
 * - CONFIG: Main configuration object with version, debug, UI, timers, and API settings
 * - Version constants for compatibility
 * - Environment detection (Live Beta, Tampermonkey)
 * - Utility functions for version comparison
 *
 * Dependencies: None (pure constants and utilities)
 */

/* ====================================================================================
 * MAIN CONFIGURATION OBJECT
 * ====================================================================================
 */

export const CONFIG = {
  // Version Information
  VERSION: {
    CURRENT: '2.0.0',
    CHECK_URL_STABLE: 'https://raw.githubusercontent.com/Myke247/MGTools/main/MGTools.user.js',
    CHECK_URL_BETA: 'https://raw.githubusercontent.com/Myke247/MGTools/Live-Beta/MGTools.user.js',
    DOWNLOAD_URL_STABLE: 'https://github.com/Myke247/MGTools/raw/refs/heads/main/MGTools.user.js',
    DOWNLOAD_URL_BETA: 'https://github.com/Myke247/MGTools/raw/refs/heads/Live-Beta/MGTools.user.js'
  },

  // Debug Settings
  DEBUG: {
    PRODUCTION: false, // Set to false for verbose debug logging - ENABLED FOR DEBUGGING
    FLAGS: {
      OVERLAY_LIFECYCLE: false,
      HANDLER_SETUP: false,
      THEME_APPLICATION: false,
      VALUE_CALCULATIONS: false,
      ABILITY_LOGS: false,
      BUTTON_INTERACTIONS: false,
      POP_OUT_DESIGN: false,
      ERROR_TRACKING: true,
      PERFORMANCE: false,
      FIX_VALIDATION: false // Enable to see fix debug logs during testing (now controlled by debugMode setting)
    }
  },

  // UI Settings
  UI: {
    DEFAULT_OPACITY: 95,
    DEFAULT_POPOUT_OPACITY: 50,
    DEFAULT_THEME: 'default',
    DEFAULT_GRADIENT: 'blue-purple',
    DEFAULT_EFFECT: 'none',
    DOCK_WIDTH: 380,
    DOCK_MIN_WIDTH: 320,
    DOCK_MAX_WIDTH: 600,
    TAB_HEIGHT: 40,
    ANIMATION_DURATION: 300
  },

  // Timing Settings
  TIMERS: {
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    CONNECTION_CHECK_INTERVAL: 5000, // 5 seconds
    HEARTBEAT_INTERVAL: 300000, // 5 minutes
    SHOP_CHECK_INTERVAL: 3000, // 3 seconds
    PET_HUNGER_CHECK_INTERVAL: 60000 // 1 minute
  },

  // API Settings
  API: {
    BASE_URL_PRIMARY: 'https://magiccircle.gg',
    BASE_URL_FALLBACK: 'https://magicgarden.gg',
    ENDPOINTS: {
      ROOMS: '/api/rooms',
      SHOP: '/api/shop',
      PETS: '/api/pets',
      INVENTORY: '/api/inventory'
    }
  },

  // Game Data - Decoration Items
  DECOR_ITEMS: [
    // Rocks
    { id: 'SmallRock', name: 'Small Garden Rock', category: 'Rocks' },
    { id: 'MediumRock', name: 'Medium Garden Rock', category: 'Rocks' },
    { id: 'LargeRock', name: 'Large Garden Rock', category: 'Rocks' },
    // Wood Items
    { id: 'WoodBench', name: 'Wood Bench', category: 'Wood' },
    { id: 'WoodArch', name: 'Wood Arch', category: 'Wood' },
    { id: 'WoodBridge', name: 'Wood Bridge', category: 'Wood' },
    { id: 'WoodLampPost', name: 'Wood Lamp Post', category: 'Wood' },
    { id: 'WoodOwl', name: 'Wood Owl', category: 'Wood' },
    { id: 'WoodBirdhouse', name: 'Wood Birdhouse', category: 'Wood' },
    // Stone Items
    { id: 'StoneBench', name: 'Stone Bench', category: 'Stone' },
    { id: 'StoneArch', name: 'Stone Arch', category: 'Stone' },
    { id: 'StoneBridge', name: 'Stone Bridge', category: 'Stone' },
    { id: 'StoneLampPost', name: 'Stone Lamp Post', category: 'Stone' },
    { id: 'StoneGnome', name: 'Stone Gnome', category: 'Stone' },
    { id: 'StoneBirdbath', name: 'Stone Birdbath', category: 'Stone' },
    // Marble Items
    { id: 'MarbleBench', name: 'Marble Bench', category: 'Marble' },
    { id: 'MarbleArch', name: 'Marble Arch', category: 'Marble' },
    { id: 'MarbleBridge', name: 'Marble Bridge', category: 'Marble' },
    { id: 'MarbleLampPost', name: 'Marble Lamp Post', category: 'Marble' }
  ]
};

/* ====================================================================================
 * LEGACY COMPATIBILITY EXPORTS
 * ====================================================================================
 */

// Version constants (maintained for backward compatibility)
export const CURRENT_VERSION = CONFIG.VERSION.CURRENT;
export const VERSION_CHECK_URL_STABLE = CONFIG.VERSION.CHECK_URL_STABLE;
export const VERSION_CHECK_URL_BETA = CONFIG.VERSION.CHECK_URL_BETA;
export const STABLE_DOWNLOAD_URL = CONFIG.VERSION.DOWNLOAD_URL_STABLE;
export const BETA_DOWNLOAD_URL = CONFIG.VERSION.DOWNLOAD_URL_BETA;

/* ====================================================================================
 * ENVIRONMENT DETECTION
 * ====================================================================================
 */

/**
 * Detect if running Live Beta version (checks @updateURL in Tampermonkey script metadata)
 * Safe check for Discord pop-out and console paste compatibility
 * @type {boolean}
 */
export const IS_LIVE_BETA = (() => {
  try {
    if (typeof GM_info === 'undefined') {
      return false;
    }
    return GM_info?.script?.updateURL?.includes('Live-Beta') || false;
  } catch (e) {
    console.warn('[MGTOOLS] Branch detection failed:', e.message);
    return false;
  }
})();

/**
 * Detect if running without Tampermonkey (console paste or incompatible environment)
 * @type {boolean}
 */
export const isRunningWithoutTampermonkey = typeof GM_info === 'undefined';

/**
 * Show installation error message if not running in Tampermonkey
 * This code executes immediately on module load
 */
if (isRunningWithoutTampermonkey) {
  console.error('%c⚠️ MGTOOLS INSTALLATION ERROR', 'font-size:16px;color:#ff0000;font-weight:bold');
  console.error('%cMGTools MUST be installed via Tampermonkey!', 'font-size:14px;color:#ff9900');
  console.error('%cDo NOT paste the script in console - it will not work correctly!', 'font-size:14px;color:#ff9900');
  console.error(
    '%c\n📋 Correct Installation:\n1. Install Tampermonkey: https://www.tampermonkey.net/\n2. Click: https://github.com/Myke247/MGTools/raw/main/MGTools.user.js\n3. Click "Install" button\n4. Refresh Magic Garden',
    'font-size:12px;color:#00ffff'
  );

  // Try to continue anyway using localStorage fallback
  console.warn('%c⚠️ Attempting to run in fallback mode (limited functionality)...', 'font-size:12px;color:#ffff00');
}

/* ====================================================================================
 * UTILITY FUNCTIONS
 * ====================================================================================
 */

/**
 * Semantic version comparison function
 * Compares two version strings in format "x.y.z"
 *
 * @param {string} v1 - First version string
 * @param {string} v2 - Second version string
 * @returns {number} -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 *
 * @example
 * compareVersions('3.8.8', '3.8.7') // returns 1
 * compareVersions('3.8.7', '3.8.8') // returns -1
 * compareVersions('3.8.8', '3.8.8') // returns 0
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}
