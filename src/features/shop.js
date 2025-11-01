/**
 * Shop System Module
 *
 * Comprehensive shop management system for Magic Garden.
 *
 * Features:
 * - Shop constants and pricing data
 * - Inventory and stock management with 100-slot cap tracking
 * - Shop UI windows and overlays (draggable, persistent)
 * - Purchase logic with validation and visual feedback
 * - Restock detection and notifications
 * - Watch list integration for automated monitoring
 *
 * @module features/shop
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';


// ============================================================================
// SHOP CONSTANTS & UTILITIES
// ============================================================================

/**
 * Shop sprite image map (Discord CDN URLs)
 * Contains sprite images for all shop items (seeds, eggs, tools)
 */
export const SHOP_IMAGE_MAP = {
  // Seeds
  Carrot: 'https://cdn.discordapp.com/emojis/1423010183574982669.webp',
  Strawberry: 'https://cdn.discordapp.com/emojis/1423010222724874330.webp',
  Aloe: 'https://cdn.discordapp.com/emojis/1423010259655590028.webp',
  Blueberry: 'https://cdn.discordapp.com/emojis/1423010283126784010.webp',
  Apple: 'https://cdn.discordapp.com/emojis/1423010302965846046.webp',
  OrangeTulip: 'https://cdn.discordapp.com/emojis/1423010324952514621.webp',
  Tomato: 'https://cdn.discordapp.com/emojis/1423010355109433478.webp',
  Daffodil: 'https://cdn.discordapp.com/emojis/1423010391356866654.webp',
  Corn: 'https://cdn.discordapp.com/emojis/1423010497648656566.webp',
  Watermelon: 'https://cdn.discordapp.com/emojis/1423010520067346515.webp',
  Pumpkin: 'https://cdn.discordapp.com/emojis/1423010546474549338.webp',
  Echeveria: 'https://cdn.discordapp.com/emojis/1423010587910078614.webp',
  Coconut: 'https://cdn.discordapp.com/emojis/1423010611721273444.webp',
  Banana: 'https://cdn.discordapp.com/emojis/1423010652582187089.webp',
  Lily: 'https://cdn.discordapp.com/emojis/1423010686388404407.webp',
  BurrosTail: 'https://cdn.discordapp.com/emojis/1423010714267942912.webp',
  Mushroom: 'https://cdn.discordapp.com/emojis/1423010734002012160.webp',
  Cactus: 'https://cdn.discordapp.com/emojis/1423010755267133531.webp',
  Bamboo: 'https://cdn.discordapp.com/emojis/1423010797830930552.webp',
  Grape: 'https://cdn.discordapp.com/emojis/1423010779522666616.webp',
  Pepper: 'https://cdn.discordapp.com/emojis/1423010818953580574.webp',
  Lemon: 'https://cdn.discordapp.com/emojis/1423010911144120330.webp',
  PassionFruit: 'https://cdn.discordapp.com/emojis/1423010934863171677.webp',
  DragonFruit: 'https://cdn.discordapp.com/emojis/1423010954991370271.webp',
  Lychee: 'https://cdn.discordapp.com/emojis/1423011007206396076.webp',
  Sunflower: 'https://cdn.discordapp.com/emojis/1423010976499765288.webp',
  Starweaver: 'https://cdn.discordapp.com/emojis/1423011042744729700.webp',
  DawnCelestial: 'https://cdn.discordapp.com/emojis/1423011097883185412.webp',
  MoonCelestial: 'https://cdn.discordapp.com/emojis/1423011077410525308.webp',
  // Eggs
  CommonEgg: 'https://cdn.discordapp.com/emojis/1423011628978540676.webp',
  UncommonEgg: 'https://cdn.discordapp.com/emojis/1423011627602804856.webp',
  RareEgg: 'https://cdn.discordapp.com/emojis/1423011625664905316.webp',
  LegendaryEgg: 'https://cdn.discordapp.com/emojis/1423011623089737739.webp',
  MythicalEgg: 'https://cdn.discordapp.com/emojis/1423011620828745899.webp',
  // Tools (Use Discord emojis for proper display)
  WateringCan: 'https://cdn.discordapp.com/emojis/1426622484957888512.webp',
  PlanterPot: 'https://cdn.discordapp.com/emojis/1426622518948794451.webp',
  Shovel: 'https://cdn.discordapp.com/emojis/1426622542222856282.webp',
  'Watering Can': 'https://cdn.discordapp.com/emojis/1426622484957888512.webp',
  'Planter Pot': 'https://cdn.discordapp.com/emojis/1426622518948794451.webp',
  'Garden Shovel': 'https://cdn.discordapp.com/emojis/1426622542222856282.webp'
};

/**
 * Color groups for item rarity/type
 * Maps CSS color classes to item lists for visual theming
 */
export const SHOP_COLOR_GROUPS = {
  white: ['CommonEgg', 'Carrot', 'Strawberry', 'Aloe'],
  green: ['UncommonEgg', 'Apple', 'OrangeTulip', 'Tomato', 'Blueberry'],
  blue: ['RareEgg', 'Daffodil', 'Corn', 'Watermelon', 'Pumpkin', 'Delphinium', 'Squash'],
  yellow: ['LegendaryEgg', 'Echeveria', 'Coconut', 'Banana', 'Lily', 'BurrosTail'],
  purple: ['MythicalEgg', 'Mushroom', 'Cactus', 'Bamboo', 'Grape'],
  orange: ['Pepper', 'Lemon', 'PassionFruit', 'DragonFruit', 'Lychee', 'Sunflower']
};

/**
 * Rainbow items (celestial seeds)
 * Special visual treatment with animated rainbow text
 */
export const SHOP_RAINBOW_ITEMS = ['Starweaver', 'DawnCelestial', 'MoonCelestial'];

/**
 * Shop prices (from in-game shop screenshots)
 * All prices in coins
 */
export const SHOP_PRICES = {
  // Seeds - Common tier
  Carrot: 10,
  Strawberry: 50,
  Aloe: 135,
  // Seeds - Uncommon tier
  Blueberry: 400,
  Apple: 500,
  OrangeTulip: 600,
  Tomato: 800,
  // Seeds - Rare tier
  Daffodil: 1000,
  Corn: 1300,
  Delphinium: 1800,
  Squash: 2200,
  Watermelon: 2500,
  Pumpkin: 3000,
  // Seeds - Legendary tier
  Echeveria: 4200,
  Coconut: 6000,
  Banana: 7500,
  Lily: 20000,
  BurrosTail: 93000,
  // Seeds - Mythical tier
  Mushroom: 150000,
  Cactus: 250000,
  Bamboo: 400000,
  Grape: 850000,
  // Seeds - Divine tier
  Pepper: 1000000,
  Lemon: 2000000,
  PassionFruit: 2750000,
  DragonFruit: 5000000,
  Lychee: 25000000,
  Sunflower: 100000000,
  // Seeds - Celestial tier
  Starweaver: 1000000000,
  DawnCelestial: 10000000000,
  MoonCelestial: 50000000000,
  // Eggs
  CommonEgg: 100000,
  UncommonEgg: 1000000,
  RareEgg: 10000000,
  LegendaryEgg: 100000000,
  MythicalEgg: 1000000000,
  // Tools (from game screenshot)
  WateringCan: 3000,
  'Watering Can': 3000,
  PlanterPot: 25000,
  'Planter Pot': 25000,
  GardenShovel: 0, // OWNED - unlimited uses
  'Garden Shovel': 0
};

/**
 * Display name overrides for shop
 * Keeps internal names intact while showing user-friendly names
 */
export const SHOP_DISPLAY_NAMES = {
  OrangeTulip: 'Tulip',
  // Tools
  WateringCan: 'Watering Can',
  PlanterPot: 'Planter Pot',
  GardenShovel: 'Garden Shovel'
};

/**
 * Format price with k/m/b notation and return color
 *
 * @param {number} price - Price in coins
 * @returns {{formatted: string, color: string}} Formatted price and color
 *
 * @example
 * formatShopPrice(1500) // {formatted: '1.5k', color: '#999'}
 * formatShopPrice(2500000) // {formatted: '2.5m', color: '#ffd700'}
 * formatShopPrice(10000000000) // {formatted: '10b', color: '#4a9eff'}
 */
export function formatShopPrice(price) {
  let formatted;
  let color;
  if (price >= 1000000000) {
    formatted = `${(price / 1000000000).toFixed(price % 1000000000 === 0 ? 0 : 1)}b`;
    color = '#4a9eff'; // Blue for billions
  } else if (price >= 1000000) {
    formatted = `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}m`;
    color = '#ffd700'; // Gold for millions
  } else if (price >= 1000) {
    formatted = `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    color = '#999'; // Grey for thousands
  } else {
    formatted = price.toString();
    color = '#999'; // Grey for under 1000
  }
  return { formatted, color };
}

/**
 * Normalize string for comparison
 * Removes non-alphanumeric characters and converts to lowercase
 *
 * @param {string} s - String to normalize
 * @returns {string} Normalized string
 *
 * @example
 * normalizeShopKey('Orange Tulip') // 'orangetulip'
 * normalizeShopKey('DawnCelestial') // 'dawncelestial'
 */
export function normalizeShopKey(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Get text color class for an item
 * Determines rarity-based or rainbow color class
 *
 * @param {string} itemId - Item identifier
 * @returns {string} CSS class name
 *
 * @example
 * getShopItemColorClass('DawnCelestial') // 'shop-rainbow-text'
 * getShopItemColorClass('Mushroom') // 'shop-color-purple'
 * getShopItemColorClass('Carrot') // 'shop-color-white'
 */
export function getShopItemColorClass(itemId) {
  const normalized = normalizeShopKey(itemId);

  // Check if rainbow item
  for (const rainbowItem of SHOP_RAINBOW_ITEMS) {
    if (normalized.includes(normalizeShopKey(rainbowItem))) {
      return 'shop-rainbow-text';
    }
  }

  // Check color groups
  const colorKeys = Object.keys(SHOP_COLOR_GROUPS);
  for (let i = 0; i < colorKeys.length; i += 1) {
    const color = colorKeys[i];
    const items = SHOP_COLOR_GROUPS[color];
    for (const item of items) {
      if (normalized === normalizeShopKey(item) || normalized.includes(normalizeShopKey(item))) {
        return `shop-color-${color}`;
      }
    }
  }

  return '';
}

/**
 * Preload shop images for better performance
 * IIFE that runs immediately to populate browser cache
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.Image] - Image constructor (default: window.Image)
 */
export function preloadShopImages(dependencies = {}) {
  const { Image: ImageConstructor = typeof window !== 'undefined' ? window.Image : null } = dependencies;

  if (!ImageConstructor) return;

  Object.values(SHOP_IMAGE_MAP).forEach(src => {
    if (!src) return;
    const img = new ImageConstructor();
    img.src = src;
  });
}

/**
 * Flash purchase feedback tooltip
 * Shows animated tooltip near element with purchase confirmation
 * Includes multiple fallbacks and cleanup to prevent stuck tooltips
 *
 * @param {HTMLElement} el - Element to show tooltip near
 * @param {string} message - Message to display
 * @param {number} [duration=1500] - Duration in milliseconds
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 * @param {Function} [dependencies.showFloatingMsg] - Fallback message function
 * @param {Console} [dependencies.console] - Console for logging (default: console)
 */
export function flashPurchaseFeedback(el, message, duration = 1500, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    showFloatingMsg: showFloatingMsgFn = showFloatingMsg,
    console: consoleObj = console
  } = dependencies;

  if (!targetDocument) return;

  // Clean up any stuck tooltips first
  try {
    const stuckTooltips = targetDocument.querySelectorAll('.mga-flash-tooltip');
    stuckTooltips.forEach(t => {
      if (t && t.parentNode) t.remove();
    });
  } catch (e) {
    // Silent fail
  }

  try {
    if (!el || !(el instanceof Element)) {
      consoleObj.warn('flashPurchaseFeedback: invalid element', el);
      showFloatingMsgFn(message, duration, { targetDocument });
      return;
    }

    const rect = el.getBoundingClientRect();
    const msg = targetDocument.createElement('div');
    msg.className = 'mga-flash-tooltip';
    msg.textContent = message;
    msg.setAttribute('role', 'status');
    msg.style.cssText =
      'position:fixed;pointer-events:none;padding:6px 10px;border-radius:8px;font-size:12px;background:rgba(0,0,0,.9);color:#fff;z-index:2147483647;transition:opacity 180ms ease,transform 220ms ease;opacity:0;transform:translateY(-6px);';

    if (rect && rect.width > 0 && rect.height > 0) {
      const left = rect.left + rect.width / 2;
      let top = rect.top - 10;

      if (top < 6) top = rect.bottom + 8;
      msg.style.left = `${Math.round(left)}px`;
      msg.style.top = `${Math.round(top)}px`;
      msg.style.transform += ' translateX(-50%)';
    } else {
      const left = window.innerWidth / 2;
      const top = 20;
      msg.style.left = `${Math.round(left)}px`;
      msg.style.top = `${Math.round(top)}px`;
      msg.style.transform += ' translateX(-50%)';
    }

    targetDocument.body.appendChild(msg);

    // Trigger animation
    requestAnimationFrame(() => {
      msg.style.opacity = '1';
      msg.style.transform = msg.style.transform.replace('translateY(-6px)', 'translateY(0)');
    });

    // Ensure removal with multiple fallbacks
    const removeMsg = () => {
      try {
        if (msg && msg.parentNode) {
          msg.style.opacity = '0';
          msg.style.transform = msg.style.transform.replace('translateY(0)', 'translateY(-6px)');
          setTimeout(() => {
            try {
              if (msg && msg.parentNode) msg.remove();
            } catch (e) {
              // Silent fail
            }
          }, 220);
        }
      } catch (e) {
        try {
          if (msg && msg.parentNode) msg.remove();
        } catch (_) {
          // Silent fail
        }
      }
    };

    setTimeout(removeMsg, duration);
  } catch (err) {
    consoleObj.error('flashPurchaseFeedback error:', err);
    try {
      showFloatingMsgFn(message, duration, { targetDocument });
    } catch (e) {
      // Silent fail
    }
  }
}

/**
 * Show floating message (fallback for flashPurchaseFeedback)
 * Simple centered message at top of screen
 *
 * @param {string} msg - Message to display
 * @param {number} [dur=900] - Duration in milliseconds
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 */
export function showFloatingMsg(msg, dur = 900, dependencies = {}) {
  const { targetDocument = typeof window !== 'undefined' ? window.document : null } = dependencies;

  if (!targetDocument) return;

  const m = targetDocument.createElement('div');
  m.textContent = msg;
  m.style.cssText =
    'position:fixed;left:50%;top:20px;transform:translateX(-50%);background:rgba(0,0,0,.9);color:#fff;padding:6px 10px;border-radius:8px;z-index:2147483647;';
  targetDocument.body.appendChild(m);
  setTimeout(() => m.remove(), dur);
}

// ============================================================================
// PHASE 2: INVENTORY & STOCK MANAGEMENT
// ============================================================================

/**
 * Module-level state: Purchase tracking across restocks
 * Tracks local purchases to calculate accurate stock counts
 * Persisted to localStorage via MGA_saveJSON/MGA_loadJSON
 */
let localPurchaseTrackerState = {
  seed: {},
  egg: {},
  tool: {}
};

/**
 * Load persisted purchase tracker from storage
 * Called automatically on module initialization
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.MGA_loadJSON] - Load JSON from GM storage
 * @param {Console} [dependencies.console] - Console for logging
 */
export function loadPurchaseTracker(dependencies = {}) {
  const { MGA_loadJSON = typeof window !== 'undefined' && window.MGA_loadJSON, console: consoleObj = console } =
    dependencies;

  if (!MGA_loadJSON) return;

  try {
    const saved = MGA_loadJSON('MGA_purchaseTracker');
    if (saved && typeof saved === 'object') {
      localPurchaseTrackerState = {
        seed: saved.seed || {},
        egg: saved.egg || {},
        tool: saved.tool || {}
      };
      consoleObj.log('📦 [LOCAL-TRACK] Loaded purchase tracker:', {
        seeds: Object.keys(localPurchaseTrackerState.seed).length,
        eggs: Object.keys(localPurchaseTrackerState.egg).length,
        tools: Object.keys(localPurchaseTrackerState.tool).length,
        toolData: localPurchaseTrackerState.tool
      });
    }
  } catch (e) {
    consoleObj.error('[LOCAL-TRACK] Error loading purchase tracker:', e);
  }
}

/**
 * Save purchase tracker to storage
 * Persists current state to GM storage for cross-session persistence
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.MGA_saveJSON] - Save JSON to GM storage
 * @param {Object} [dependencies.localPurchaseTracker] - Tracker state (default: module state)
 * @param {Console} [dependencies.console] - Console for logging
 */
export function savePurchaseTracker(dependencies = {}) {
  const {
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    localPurchaseTracker = localPurchaseTrackerState,
    console: consoleObj = console
  } = dependencies;

  if (!MGA_saveJSON) return;

  try {
    MGA_saveJSON('MGA_purchaseTracker', localPurchaseTracker);
  } catch (e) {
    consoleObj.error('[LOCAL-TRACK] Error saving purchase tracker:', e);
  }
}

/**
 * Track a local purchase
 * Increments purchase count for item and persists to storage
 *
 * @param {string} id - Item identifier
 * @param {string} type - Item type ('seed', 'egg', 'tool')
 * @param {number} [amount=1] - Quantity purchased
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.localPurchaseTracker] - Tracker state
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.savePurchaseTracker] - Save function
 */
export function trackLocalPurchase(id, type, amount = 1, dependencies = {}) {
  const {
    localPurchaseTracker = localPurchaseTrackerState,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    savePurchaseTracker: saveFn = savePurchaseTracker
  } = dependencies;

  if (!localPurchaseTracker[type][id]) {
    localPurchaseTracker[type][id] = 0;
  }
  localPurchaseTracker[type][id] += amount;

  if (productionLog) {
    productionLog(
      `📝 [LOCAL-TRACK] Recorded ${amount}x ${id} (${type}). Total local: ${localPurchaseTracker[type][id]}`
    );
  }

  // Persist to storage
  saveFn({ localPurchaseTracker });
}

/**
 * Get local purchase count for an item
 * Handles tool name variations (with/without spaces)
 *
 * @param {string} id - Item identifier
 * @param {string} type - Item type ('seed', 'egg', 'tool')
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.localPurchaseTracker] - Tracker state
 * @returns {number} Purchase count
 */
export function getLocalPurchaseCount(id, type, dependencies = {}) {
  const { localPurchaseTracker = localPurchaseTrackerState } = dependencies;

  // Check exact match first
  if (localPurchaseTracker[type][id]) {
    return localPurchaseTracker[type][id];
  }

  // For tools, also check with/without spaces for compatibility
  if (type === 'tool') {
    const idNoSpaces = id.replace(/\s+/g, '');
    const typeKeys = Object.keys(localPurchaseTracker[type]);
    for (let i = 0; i < typeKeys.length; i += 1) {
      const key = typeKeys[i];
      const keyNoSpaces = key.replace(/\s+/g, '');
      if (keyNoSpaces === idNoSpaces) {
        return localPurchaseTracker[type][key];
      }
    }
  }

  return 0;
}

/**
 * Reset local purchases when shop restocks
 * Clears purchase tracking for specific type or all types
 *
 * @param {string|null} [type=null] - Item type to reset, or null for all
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.localPurchaseTracker] - Tracker state
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.savePurchaseTracker] - Save function
 */
export function resetLocalPurchases(type = null, dependencies = {}) {
  const {
    localPurchaseTracker = localPurchaseTrackerState,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    savePurchaseTracker: saveFn = savePurchaseTracker
  } = dependencies;

  if (type) {
    localPurchaseTracker[type] = {};
    if (productionLog) {
      productionLog(`🔄 [LOCAL-TRACK] Reset ${type} purchases for restock`);
    }
  } else {
    localPurchaseTracker.seed = {};
    localPurchaseTracker.egg = {};
    localPurchaseTracker.tool = {};
    if (productionLog) {
      productionLog(`🔄 [LOCAL-TRACK] Reset all purchases for restock`);
    }
  }

  // Persist to storage
  saveFn({ localPurchaseTracker });
}

/**
 * Check if inventory is full (100-slot cap)
 * Magic Garden inventory: 91 bag slots + 9 hotbar slots = 100 total
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @returns {boolean} True if inventory is at 100-slot capacity
 */
export function isInventoryFull(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const inventory = UnifiedState?.atoms?.inventory;
  if (!inventory || !inventory.items) return false;

  const MAX_INVENTORY = 100;
  const currentCount = inventory.items.length;

  return currentCount >= MAX_INVENTORY;
}

/**
 * Count how many of a specific item type are in inventory
 * Handles seeds, eggs, and tools with quantity stacking
 *
 * @param {string} itemId - Item identifier
 * @param {string} itemType - Item type ('seed', 'egg', 'tool')
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @returns {number} Total quantity in inventory
 */
export function getInventoryItemCount(itemId, itemType, dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const inventory = UnifiedState?.atoms?.inventory;
  if (!inventory || !inventory.items) return 0;

  let count = 0;
  for (const item of inventory.items) {
    if (itemType === 'seed' && item.species === itemId) {
      count += item.quantity || 1;
    } else if (itemType === 'egg' && item.eggId === itemId) {
      count += item.quantity || 1;
    } else if (itemType === 'tool' && item.toolId === itemId) {
      count += item.quantity || 1;
    }
  }

  return count;
}

/**
 * Get stack capacity limit for specific items
 * Different items have different capacity limits
 *
 * @param {string} itemId - Item identifier
 * @param {string} itemType - Item type ('seed', 'egg', 'tool')
 * @returns {number} Stack capacity (Infinity = no limit, 99 = WateringCan cap)
 */
export function getItemStackCap(itemId, itemType) {
  // Shovel: unlimited uses (can buy 1 at a time, restocks)
  if (itemType === 'tool' && (itemId === 'Shovel' || itemId === 'GardenShovel')) {
    return Infinity; // No cap for Shovel
  }

  // WateringCan: Only item with a cap of 99 (cannot stack in inventory)
  if (itemType === 'tool' && itemId === 'WateringCan') {
    return 99;
  }

  // All other items (PlanterPot, seeds, eggs, etc.): No purchase limit
  return Infinity;
}

/**
 * Visual feedback for full inventory (red flash animation)
 * Flashes element red 3 times with 200ms intervals
 *
 * @param {HTMLElement} element - Element to flash
 * @param {string} message - Message to log
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.productionLog] - Production logger
 */
export function flashInventoryFullFeedback(element, message, dependencies = {}) {
  const { productionLog = typeof window !== 'undefined' && window.productionLog } = dependencies;

  // Flash red 3 times
  let flashes = 0;
  const flashInterval = setInterval(() => {
    if (flashes >= 6) {
      // 3 full cycles (on/off)
      clearInterval(flashInterval);
      element.style.background = '';
      element.style.borderColor = '';
      element.style.boxShadow = '';
      return;
    }

    // Alternate between red and normal
    if (flashes % 2 === 0) {
      element.style.background = 'rgba(255, 0, 0, 0.3)';
      element.style.borderColor = 'rgba(255, 0, 0, 0.8)';
      element.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
    } else {
      element.style.background = '';
      element.style.borderColor = '';
      element.style.boxShadow = '';
    }

    flashes += 1;
  }, 200); // Flash every 200ms

  // Show message
  if (productionLog) {
    productionLog(`❌ [SHOP] ${message}`);
  }
}

/**
 * Get current shop stock for an item
 * Calculates actual stock by subtracting local purchases from initialStock
 * Handles seeds, eggs, and tools with name/ID variations
 *
 * @param {string} id - Item identifier
 * @param {string} type - Item type ('seed', 'egg', 'tool')
 * @param {Object} dependencies - Injectable dependencies
 * @param {Window} [dependencies.targetWindow] - Target window (default: window)
 * @param {Function} [dependencies.getLocalPurchaseCount] - Get purchase count function
 * @param {Function} [dependencies.productionError] - Error logger
 * @returns {number} Current stock (0 if not available)
 */
export function getItemStock(id, type, dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    getLocalPurchaseCount: getPurchasesFn = getLocalPurchaseCount,
    productionError = console.error
  } = dependencies;

  try {
    const shop = targetWindow?.globalShop?.shops;
    if (!shop) return 0;

    let inventory;
    let item;

    if (type === 'seed') {
      inventory = shop.seed?.inventory;
      if (!inventory) return 0;
      item = inventory.find(i => i.species === id);
    } else if (type === 'egg') {
      inventory = shop.egg?.inventory;
      if (!inventory) return 0;
      item = inventory.find(i => i.eggId === id);
    } else if (type === 'tool') {
      inventory = shop.tool?.inventory;
      if (!inventory) return 0;
      // Tools use toolId property - also check with/without spaces for compatibility
      const idNoSpaces = id.replace(/\s+/g, '');
      item = inventory.find(
        i =>
          i.toolId === id ||
          i.name === id ||
          i.toolId?.replace(/\s+/g, '') === idNoSpaces ||
          i.name?.replace(/\s+/g, '') === idNoSpaces
      );
    } else {
      return 0;
    }

    if (!item) return 0;

    // initialStock is a snapshot that only updates on restock
    // We must subtract local purchases to get current stock
    const initial = item.initialStock || item.stock || 0;
    // Cap purchased count to initial - can't have purchased more than what was available
    // This prevents stale localStorage data from showing incorrect stock
    const purchased = Math.min(getPurchasesFn(id, type), initial);

    const stock = Math.max(0, initial - purchased);
    return stock;
  } catch (e) {
    productionError('[SHOP] getItemStock error:', e);
    return 0;
  }
}

// ============================================================================
// PHASE 3: SHOP ITEM ELEMENTS & PURCHASE LOGIC
// ============================================================================

/**
 * Check if shop data is ready/loaded
 * Simple availability check for globalShop.shops
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Window} [dependencies.targetWindow] - Target window (default: window)
 * @returns {boolean} True if shop data is available
 */
export function isShopDataReady(dependencies = {}) {
  const { targetWindow = typeof window !== 'undefined' ? window : null } = dependencies;
  return !!targetWindow?.globalShop?.shops;
}

/**
 * Wait for shop data to be available (polling-based)
 * Polls every 100ms up to timeout, calls callback with success/failure
 *
 * @param {Function} callback - Callback(success: boolean)
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.isShopDataReady] - Shop ready check function
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.productionWarn] - Production warn logger
 */
export function waitForShopData(callback, timeout = 5000, dependencies = {}) {
  const {
    isShopDataReady: isReadyFn = isShopDataReady,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    productionWarn = typeof window !== 'undefined' && window.productionWarn
  } = dependencies;

  const startTime = Date.now();
  const pollInterval = 100; // Check every 100ms

  const poller = setInterval(() => {
    if (isReadyFn(dependencies)) {
      clearInterval(poller);
      if (productionLog) {
        productionLog(`✅ [SHOP] Shop data ready after ${Date.now() - startTime}ms`);
      }
      callback(true);
    } else if (Date.now() - startTime >= timeout) {
      clearInterval(poller);
      if (productionWarn) {
        productionWarn(`⚠️ [SHOP] Shop data timeout after ${timeout}ms`);
      }
      callback(false);
    }
  }, pollInterval);
}

/**
 * Create shop item UI element with buy buttons, stock display, owned quantity
 * Includes rarity coloring, sprite images, hover effects
 *
 * @param {string} id - Item identifier
 * @param {string} type - Item type ('seed', 'egg', 'tool')
 * @param {number} stock - Current shop stock
 * @param {number} value - Item value (unused, for future)
 * @param {Object} [options={}] - Additional options
 * @param {boolean} [options.owned=false] - Whether item is owned (e.g., Shovel)
 * @param {boolean} [options.unlimited=false] - Whether stock is unlimited
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Object} [dependencies.SHOP_DISPLAY_NAMES] - Display name overrides
 * @param {Object} [dependencies.SHOP_IMAGE_MAP] - Sprite image map
 * @param {Object} [dependencies.SHOP_PRICES] - Price data
 * @param {Function} [dependencies.getShopItemColorClass] - Get color class function
 * @param {Function} [dependencies.formatShopPrice] - Price formatter
 * @param {Function} [dependencies.getInventoryItemCount] - Get inventory count
 * @param {Function} [dependencies.getItemStackCap] - Get stack cap
 * @param {Function} [dependencies.buyItem] - Buy item function
 * @returns {HTMLElement} Shop item div element with event listeners
 */
export function createShopItemElement(id, type, stock, value, options = {}, dependencies = {}) {
  const { owned = false, unlimited = false } = options;
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    SHOP_DISPLAY_NAMES: displayNames = SHOP_DISPLAY_NAMES,
    SHOP_IMAGE_MAP: imageMap = SHOP_IMAGE_MAP,
    SHOP_PRICES: prices = SHOP_PRICES,
    getShopItemColorClass: getColorClassFn = getShopItemColorClass,
    formatShopPrice: formatPriceFn = formatShopPrice,
    getInventoryItemCount: getInventoryCountFn = getInventoryItemCount,
    getItemStackCap: getStackCapFn = getItemStackCap,
    buyItem: buyItemFn = buyItem
  } = dependencies;

  if (!targetDocument) return null;

  const div = targetDocument.createElement('div');
  div.className = 'shop-item';
  // Only add 'in-stock' class if actually in stock (not owned)
  if (stock > 0 && !owned) div.classList.add('in-stock');

  div.style.cssText = `
    padding: 8px;
    background: ${stock > 0 && !owned ? 'rgba(76, 255, 106, 0.40)' : 'rgba(255,255,255,0.03)'};
    border: 1px solid ${stock > 0 && !owned ? 'rgba(9, 255, 0, 0.48)' : 'rgba(255, 255, 255, 0.57)'};
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    transition: all 0.2s ease;
  `;

  const displayName = displayNames[id] || id.replace(/([A-Z])/g, ' $1').trim();
  const spriteUrl = imageMap[id] || '';
  const colorClass = getColorClassFn(id);
  const price = prices[id] || 0;
  const priceData = formatPriceFn(price);

  // Determine stock display text
  let stockDisplay;
  if (owned || unlimited) {
    // For owned items (like Shovel), just show "OWNED" in neutral color
    stockDisplay = '<span style="color: #888; font-weight: 600;">OWNED</span>';
  } else {
    stockDisplay = `Stock: ${stock} | <span style="color: ${priceData.color};">💰${priceData.formatted}</span>`;
  }

  // Get current owned quantity for display
  const ownedCount = getInventoryCountFn(id, type, dependencies);
  const stackCap = getStackCapFn(id, type);
  let quantityDisplay = '';

  if (stackCap < Infinity && ownedCount > 0) {
    const percentFull = (ownedCount / stackCap) * 100;
    let color = 'rgba(255, 255, 255, 0.7)';

    // Color code based on capacity
    if (percentFull >= 100) {
      color = '#ff4444'; // Red at max
    } else if (percentFull >= 80) {
      color = '#ffaa44'; // Orange at 80%+
    } else if (percentFull >= 50) {
      color = '#ffff44'; // Yellow at 50%+
    }

    quantityDisplay = `<div class="quantity-display" style="font-size: 11px; color: ${color}; margin-top: 2px; font-weight: bold;">Owned: ${ownedCount}/${stackCap}</div>`;
  } else if (ownedCount > 0 && !owned && !unlimited) {
    quantityDisplay = `<div class="quantity-display" style="font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-top: 2px;">Owned: ${ownedCount}</div>`;
  }

  div.innerHTML = `
    <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;">
      ${spriteUrl ? `<img src="${spriteUrl}" alt="${displayName}" class="shop-sprite" loading="lazy">` : ''}
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 2px;" class="${colorClass}">${displayName}</div>
        <div class="stock-display" style="font-size: 10px; color: #888;">${stockDisplay}</div>
        ${quantityDisplay}
      </div>
    </div>
    <div style="display: ${owned || unlimited ? 'none' : 'flex'}; gap: 4px;">
      <button class="buy-btn" data-amount="1" ${stock === 0 ? 'disabled' : ''}
        style="padding: 4px 8px; font-size: 11px; background: rgba(74, 158, 255, 0.3); border: 1px solid rgba(74, 158, 255, 0.5); border-radius: 3px; color: #fff; cursor: ${stock > 0 ? 'pointer' : 'not-allowed'}; transition: all 0.15s ease;">1</button>
      <button class="buy-btn" data-amount="all" ${stock === 0 ? 'disabled' : ''}
        style="padding: 4px 8px; font-size: 11px; background: rgba(76, 175, 80, 0.3); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 3px; color: #fff; cursor: ${stock > 0 ? 'pointer' : 'not-allowed'}; transition: all 0.15s ease;">All</button>
    </div>
  `;

  div.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = btn.dataset.amount === 'all' ? stock : 1;
      buyItemFn(id, type, amount, div, dependencies);
    });

    // Add hover effects (NO TRANSFORM - prevents flickering)
    if (stock > 0) {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(9, 255, 0, 0.5)';
        btn.style.borderColor = 'rgba(9, 255, 0, 0.8)';
        btn.style.boxShadow = '0 0 8px rgba(9, 255, 0, 0.4)';
      });
      btn.addEventListener('mouseleave', () => {
        const isAllButton = btn.dataset.amount === 'all';
        btn.style.background = isAllButton ? 'rgba(76, 175, 80, 0.3)' : 'rgba(74, 158, 255, 0.3)';
        btn.style.borderColor = isAllButton ? 'rgba(76, 175, 80, 0.5)' : 'rgba(74, 158, 255, 0.5)';
        btn.style.boxShadow = '';
      });
    }
  });

  return div;
}

/**
 * Buy item from shop with comprehensive validation
 * Handles inventory checks, stack cap validation, purchase messages, UI updates
 *
 * @param {string} id - Item identifier
 * @param {string} type - Item type ('seed', 'egg', 'tool')
 * @param {number} amount - Quantity to purchase
 * @param {HTMLElement} itemEl - Item element for visual feedback
 * @param {Object} dependencies - Injectable dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.UnifiedState] - Unified state
 * @param {Object} [dependencies.SHOP_DISPLAY_NAMES] - Display name overrides
 * @param {Object} [dependencies.SHOP_PRICES] - Price data
 * @param {Function} [dependencies.isInventoryFull] - Inventory full check
 * @param {Function} [dependencies.flashInventoryFullFeedback] - Visual feedback
 * @param {Function} [dependencies.getInventoryItemCount] - Get inventory count
 * @param {Function} [dependencies.getItemStackCap] - Get stack cap
 * @param {Function} [dependencies.getItemStock] - Get shop stock
 * @param {Function} [dependencies.formatShopPrice] - Price formatter
 * @param {Function} [dependencies.flashPurchaseFeedback] - Purchase feedback
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.alert] - Alert function (default: window.alert)
 * @param {Console} [dependencies.console] - Console for logging
 */
export function buyItem(id, type, amount, itemEl, dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    SHOP_DISPLAY_NAMES: displayNames = SHOP_DISPLAY_NAMES,
    SHOP_PRICES: prices = SHOP_PRICES,
    isInventoryFull: isInvFullFn = isInventoryFull,
    flashInventoryFullFeedback: flashInvFullFn = flashInventoryFullFeedback,
    getInventoryItemCount: getInvCountFn = getInventoryItemCount,
    getItemStackCap: getStackCapFn = getItemStackCap,
    getItemStock: getStockFn = getItemStock,
    formatShopPrice: formatPriceFn = formatShopPrice,
    flashPurchaseFeedback: flashPurchaseFn = flashPurchaseFeedback,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    alert: alertFn = typeof window !== 'undefined' ? window.alert : console.log,
    console: consoleObj = console
  } = dependencies;

  const conn = targetWindow?.MagicCircle_RoomConnection;
  if (!conn?.sendMessage) {
    alertFn('Connection not available');
    return;
  }

  // SMART INVENTORY CHECK: Only block if truly full
  // For stackable items, check if we already have the item (can stack more)
  // For non-stackable items (Produce, Pets), check if inventory is full
  const inventory = UnifiedState?.atoms?.inventory;
  const hasExistingStack = inventory?.items?.some(item => {
    if (type === 'seed') return item.species === id && item.itemType !== 'Produce';
    if (type === 'egg') return item.eggId === id;
    if (type === 'tool') return item.toolId === id || item.name === id;
    return false;
  });

  // If inventory is full AND we don't have an existing stack, block purchase
  if (isInvFullFn(dependencies) && !hasExistingStack) {
    flashInvFullFn(itemEl, `Inventory Full! (100/100) - Cannot purchase new items`, dependencies);
    if (UnifiedState?.data?.settings?.debugMode) {
      consoleObj.log(`[SHOP] Purchase blocked: Inventory full and no existing stack for ${id}`);
    }
    return;
  }

  // If we have an existing stack, the quantity cap check will handle it
  if (hasExistingStack && UnifiedState?.data?.settings?.debugMode) {
    consoleObj.log(`[SHOP] ✅ Inventory full but ${id} can stack on existing item`);
  }

  // Check if at item stack cap before purchase
  const currentCount = getInvCountFn(id, type, dependencies);
  const stackCap = getStackCapFn(id, type);

  if (currentCount >= stackCap) {
    const displayName = displayNames[id] || id.replace(/([A-Z])/g, ' $1').trim();

    // Special visual feedback for items at max quantity
    if (stackCap < Infinity) {
      flashInvFullFn(
        itemEl,
        `${displayName} at MAX! (${currentCount}/${stackCap}) - Cannot purchase more`,
        dependencies
      );

      // Update the item display to show current quantity persistently
      const quantityDisplay = itemEl.querySelector('.quantity-display');
      if (quantityDisplay) {
        quantityDisplay.textContent = `Owned: ${currentCount}/${stackCap}`;
        quantityDisplay.style.color = '#ff4444';
        quantityDisplay.style.fontWeight = 'bold';
      }
    } else {
      flashInvFullFn(itemEl, `${displayName} at max capacity! (${currentCount}/${stackCap})`, dependencies);
    }

    if (UnifiedState?.data?.settings?.debugMode) {
      consoleObj.log(`[SHOP] ❌ Purchase blocked: ${id} at cap (${currentCount}/${stackCap})`);
    }
    return;
  }

  // Check if purchasing would exceed cap
  if (currentCount + amount > stackCap) {
    const displayName = displayNames[id] || id.replace(/([A-Z])/g, ' $1').trim();
    const canPurchase = stackCap - currentCount;
    flashInvFullFn(
      itemEl,
      `Can only purchase ${canPurchase} more ${displayName} (currently ${currentCount}/${stackCap})`,
      dependencies
    );
    if (UnifiedState?.data?.settings?.debugMode) {
      consoleObj.log(`[SHOP] ❌ Purchase blocked: would exceed cap (${currentCount} + ${amount} > ${stackCap})`);
    }
    return;
  }

  if (UnifiedState?.data?.settings?.debugMode) {
    consoleObj.log(`[SHOP] ✅ Purchase allowed: ${id} (${currentCount} + ${amount} <= ${stackCap})`);
  }

  try {
    for (let i = 0; i < amount; i += 1) {
      let messageType;
      let itemKey;

      if (type === 'seed') {
        messageType = 'PurchaseSeed';
        itemKey = 'species';
      } else if (type === 'egg') {
        messageType = 'PurchaseEgg';
        itemKey = 'eggId';
      } else if (type === 'tool') {
        messageType = 'PurchaseTool';
        itemKey = 'toolId';
      }

      conn.sendMessage({
        scopePath: ['Room', 'Quinoa'],
        type: messageType,
        [itemKey]: id
      });
    }

    // Purchase tracking happens automatically in sendMessage intercept
    const displayName = id.replace(/([A-Z])/g, ' $1').trim();
    flashPurchaseFn(itemEl, `Purchased x${amount} ${displayName}`, 1500, dependencies);
    if (productionLog) {
      productionLog(`✅ Purchased ${amount}x ${id}`);
    }

    // Update stock display - game automatically updates window.bought.shopPurchases
    setTimeout(() => {
      const newStock = getStockFn(id, type, dependencies);
      const stockSpan = itemEl.querySelector('.stock-display');
      if (stockSpan) {
        const priceData = formatPriceFn(prices[id] || 0);
        stockSpan.innerHTML = `Stock: ${newStock} | <span style="color: ${priceData.color};">💰${priceData.formatted}</span>`;
      }

      // Update quantity display
      const quantityDiv = itemEl.querySelector('.quantity-display');
      if (quantityDiv) {
        const ownedCount = getInvCountFn(id, type, dependencies);
        const itemStackCap = getStackCapFn(id, type);

        if (itemStackCap < Infinity && ownedCount > 0) {
          const percentFull = (ownedCount / itemStackCap) * 100;
          let color = 'rgba(255, 255, 255, 0.7)';

          if (percentFull >= 100) {
            color = '#ff4444';
          } else if (percentFull >= 80) {
            color = '#ffaa44';
          } else if (percentFull >= 50) {
            color = '#ffff44';
          }

          quantityDiv.style.color = color;
          quantityDiv.style.fontWeight = percentFull >= 100 ? 'bold' : 'normal';
          quantityDiv.textContent = `Owned: ${ownedCount}/${itemStackCap}`;
        } else if (ownedCount > 0) {
          quantityDiv.textContent = `Owned: ${ownedCount}`;
        }
      }

      if (UnifiedState?.data?.settings?.debugMode) {
        consoleObj.log(`[SHOP DEBUG] Stock updated for ${id}: ${newStock} (using game's purchase data)`);
      }

      // Update in-stock styling
      if (newStock === 0) {
        itemEl.classList.remove('in-stock');
        itemEl.style.background = 'rgba(255,255,255,0.03)';
        itemEl.style.borderColor = 'rgba(255, 255, 255, 0.57)';
        // Disable buttons
        itemEl.querySelectorAll('.buy-btn').forEach(btn => {
          btn.disabled = true;
          btn.style.cursor = 'not-allowed';
        });
      } else {
        itemEl.classList.add('in-stock');
        itemEl.style.background = 'rgba(76, 255, 106, 0.40)';
        itemEl.style.borderColor = 'rgba(9, 255, 0, 0.48)';
      }
    }, 100);
  } catch (e) {
    consoleObj.error('Purchase error:', e);
    alertFn('Purchase failed');
  }
}

// ============================================================================
// PHASE 4: SHOP WINDOWS & OVERLAYS
// ============================================================================

/**
 * Module-level State: Shop Window Management
 * Tracks window open state and references to DOM elements
 */
let shopWindowsOpen = false;
let seedShopWindow = null;
let eggShopWindow = null;
let shopOverlay = null;
const shopRenderFunctions = {
  seed: null,
  egg: null
};

/**
 * Shop item lists for rendering
 * Defines which items appear in each shop type
 */
export const SEED_SPECIES_SHOP = [
  'Carrot',
  'Strawberry',
  'Aloe',
  'Blueberry',
  'Apple',
  'OrangeTulip',
  'Tomato',
  'Daffodil',
  'Corn',
  'Watermelon',
  'Pumpkin',
  'Echeveria',
  'Coconut',
  'Banana',
  'Lily',
  'BurrosTail',
  'Mushroom',
  'Cactus',
  'Bamboo',
  'Grape',
  'Pepper',
  'Lemon',
  'PassionFruit',
  'DragonFruit',
  'Lychee',
  'Sunflower',
  'Starweaver',
  'DawnCelestial',
  'MoonCelestial'
];

export const EGG_IDS_SHOP = ['CommonEgg', 'UncommonEgg', 'RareEgg', 'LegendaryEgg', 'MythicalEgg'];

/**
 * Refresh all shop windows
 * Calls stored render functions for seed and egg shops
 * Made globally available on targetWindow for atom hooks
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.shopRenderFunctions] - Render function registry
 */
export function refreshAllShopWindows(dependencies = {}) {
  const { shopRenderFunctions: renderFns = shopRenderFunctions } = dependencies;

  if (renderFns.seed) {
    renderFns.seed();
  }
  if (renderFns.egg) {
    renderFns.egg();
  }
}

/**
 * Create shop overlay backdrop
 * Creates persistent backdrop for shop windows with click-to-close
 * Returns cached overlay if already exists
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Function} [dependencies.toggleShopWindows] - Toggle function
 * @param {HTMLElement} [dependencies.shopOverlay] - Cached overlay element
 * @returns {HTMLElement} Shop overlay element
 */
export function createShopOverlay(dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    toggleShopWindows: toggleFn = toggleShopWindows,
    shopOverlay: cachedOverlay = shopOverlay
  } = dependencies;

  if (!targetDocument) return null;
  if (cachedOverlay) return cachedOverlay;

  const overlay = targetDocument.createElement('div');
  overlay.id = 'mga-shop-overlay';
  targetDocument.body.appendChild(overlay);

  // Click outside to close
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      toggleFn(dependencies);
    }
  });

  // Update module-level reference
  shopOverlay = overlay;

  return overlay;
}

/**
 * Module-level state for inventory counter management
 * Tracks interval and cached DOM elements for performance
 */
let inventoryUpdateInterval = null;
let cachedCounterElements = null;
let cachedCountElements = null;
let inventoryCounterRefs = 0;

/**
 * Create shop sidebar UI
 * Creates sidebar with inventory counter, filters, and item list container
 *
 * @param {string} type - Shop type ('seed' or 'egg')
 * @param {string} title - Sidebar title
 * @param {string} side - Side to display ('left' or 'right')
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Object} [dependencies.UnifiedState] - Unified state
 * @param {Function} [dependencies.toggleShopWindows] - Toggle function
 * @returns {HTMLElement} Sidebar element
 */
export function createShopSidebar(type, title, side, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    toggleShopWindows: toggleFn = toggleShopWindows
  } = dependencies;

  if (!targetDocument) return null;

  const sidebar = targetDocument.createElement('div');
  sidebar.className = `mga-shop-sidebar mga-shop-sidebar-${side}`;
  sidebar.id = `mga-shop-${type}`;

  // Get current inventory count (includes bag + hotbar)
  const inventory = UnifiedState?.atoms?.inventory;
  const currentCount = inventory?.items?.length || 0;
  const maxCount = 100; // 91 bag + 9 hotbar = 100 total

  // Color code based on inventory fullness
  let inventoryColor = '#4caf50'; // Green (< 95)
  if (currentCount >= 100) {
    inventoryColor = '#ff4444'; // Red (full)
  } else if (currentCount >= 95) {
    inventoryColor = '#ffa500'; // Yellow (95-99)
  }

  sidebar.innerHTML = `
    <div class="mga-shop-sidebar-header">
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">🌱 ${title}</h3>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="shop-refresh-btn" style="cursor: pointer; font-size: 16px; color: #4a9eff; background: none; border: none; padding: 4px 8px; transition: color 0.2s ease;" title="Refresh shop">🔄</button>
        <button class="shop-close-btn" style="cursor: pointer; font-weight: 700; font-size: 20px; color: #cfcfcf; background: none; border: none; padding: 0 8px; transition: color 0.2s ease;">×</button>
      </div>
    </div>

    <!-- Inventory counter -->
    <div class="shop-inventory-counter" style="
      font-size: 12px;
      font-weight: 600;
      color: ${inventoryColor};
      margin: 12px 12px 0 12px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      border-left: 3px solid ${inventoryColor};
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <span>📦</span>
      <span>Inventory: <span class="shop-inventory-count">${currentCount}</span>/${maxCount}</span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.57);">
      <label style="font-size: 12px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
        <input type="checkbox" class="show-available-only" style="accent-color: #2afd23;">
        <span>Show available only</span>
      </label>
      <label style="font-size: 12px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
        <input type="checkbox" class="sort-by-value" style="accent-color: #4a9eff;">
        <span>Sort by Value</span>
      </label>
    </div>
    <div class="shop-items-list" style="display: flex; flex-direction: column; gap: 6px; padding: 12px; overflow-y: auto; flex: 1;"></div>
  `;

  targetDocument.body.appendChild(sidebar);

  // Close button handler
  const closeBtn = sidebar.querySelector('.shop-close-btn');
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleFn(dependencies);
  });
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.color = '#ff5555';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.color = '#cfcfcf';
  });

  // Refresh button handler (will be fully wired in setupShopWindowHandlers)
  const refreshBtn = sidebar.querySelector('.shop-refresh-btn');
  refreshBtn.addEventListener('mouseenter', () => {
    refreshBtn.style.color = '#6fbfff';
  });
  refreshBtn.addEventListener('mouseleave', () => {
    refreshBtn.style.color = '#4a9eff';
  });

  return sidebar;
}

/**
 * Update inventory counter displays
 * Updates all inventory counter elements with current count and color
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Object} [dependencies.UnifiedState] - Unified state
 */
export function updateInventoryCounters(dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState
  } = dependencies;

  if (!targetDocument) return;

  const inventory = UnifiedState?.atoms?.inventory;
  const currentCount = inventory?.items?.length || 0;
  const maxCount = 100;

  // Determine color based on fullness
  let inventoryColor = '#4caf50'; // Green
  if (currentCount >= 100) {
    inventoryColor = '#ff4444'; // Red
  } else if (currentCount >= 95) {
    inventoryColor = '#ffa500'; // Yellow
  }

  // Cache DOM elements on first run or if they don't exist
  if (!cachedCountElements || cachedCountElements.length === 0) {
    cachedCountElements = targetDocument.querySelectorAll('.shop-inventory-count, #shop-inventory-count');
  }
  if (!cachedCounterElements || cachedCounterElements.length === 0) {
    cachedCounterElements = targetDocument.querySelectorAll('.shop-inventory-counter, #shop-inventory-counter');
  }

  // Update all inventory counter elements (using cached selectors)
  cachedCountElements.forEach(el => {
    if (el && el.textContent !== String(currentCount)) {
      el.textContent = currentCount;
    }
  });

  // Update counter colors (using cached selectors)
  cachedCounterElements.forEach(el => {
    if (el && el.style.color !== inventoryColor) {
      el.style.color = inventoryColor;
      el.style.borderLeftColor = inventoryColor;
    }
  });
}

/**
 * Start inventory counter with reference counting
 * Starts interval updates for inventory counters
 * Uses reference counting to support multiple windows
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.updateInventoryCounters] - Update function
 */
export function startInventoryCounter(dependencies = {}) {
  const { updateInventoryCounters: updateFn = updateInventoryCounters } = dependencies;

  inventoryCounterRefs += 1;
  if (inventoryCounterRefs === 1) {
    // First reference - start the interval
    updateFn(dependencies); // Update immediately
    if (inventoryUpdateInterval) clearInterval(inventoryUpdateInterval);
    inventoryUpdateInterval = setInterval(() => updateFn(dependencies), 1000); // Optimized: 500ms→1000ms
  }
}

/**
 * Stop inventory counter with reference counting
 * Stops interval updates when no windows need them
 * Clears cached elements for fresh queries on next start
 *
 * @param {Object} dependencies - Injectable dependencies
 */
export function stopInventoryCounter(dependencies = {}) {
  inventoryCounterRefs = Math.max(0, inventoryCounterRefs - 1);
  if (inventoryCounterRefs === 0 && inventoryUpdateInterval) {
    // No more references - stop the interval
    clearInterval(inventoryUpdateInterval);
    inventoryUpdateInterval = null;
    // Clear cache so it refreshes next time
    cachedCounterElements = null;
    cachedCountElements = null;
  }
}

/**
 * Toggle shop windows open/closed
 * Shows/hides both shop sidebars with inventory counter management
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.createShopSidebars] - Create sidebars function
 * @param {Function} [dependencies.startInventoryCounter] - Start counter function
 * @param {Function} [dependencies.stopInventoryCounter] - Stop counter function
 */
export function toggleShopWindows(dependencies = {}) {
  const {
    createShopSidebars: createSidebarsFn = createShopSidebars,
    startInventoryCounter: startCounterFn = startInventoryCounter,
    stopInventoryCounter: stopCounterFn = stopInventoryCounter
  } = dependencies;

  if (shopWindowsOpen) {
    // Close both sidebars
    if (seedShopWindow) {
      seedShopWindow.classList.remove('open');
    }
    if (eggShopWindow) {
      eggShopWindow.classList.remove('open');
    }
    shopWindowsOpen = false;

    // Stop inventory counter updates
    stopCounterFn(dependencies);
  } else {
    // Open both sidebars
    if (!seedShopWindow) createSidebarsFn(dependencies);
    seedShopWindow.classList.add('open');
    eggShopWindow.classList.add('open');
    shopWindowsOpen = true;

    // Start inventory counter updates
    startCounterFn(dependencies);
  }
}

/**
 * Create both shop sidebars (seed and egg)
 * Initializes both sidebars and sets up their event handlers
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.createShopSidebar] - Create sidebar function
 * @param {Function} [dependencies.setupShopWindowHandlers] - Setup handlers function
 */
export function createShopSidebars(dependencies = {}) {
  const {
    createShopSidebar: createSidebarFn = createShopSidebar,
    setupShopWindowHandlers: setupHandlersFn = setupShopWindowHandlers
  } = dependencies;

  // Create seed shop sidebar (left)
  seedShopWindow = createSidebarFn('seed', 'Seeds', 'left', dependencies);
  // Create egg & tool shop sidebar (right)
  eggShopWindow = createSidebarFn('egg', 'Eggs & Tools', 'right', dependencies);

  // Setup handlers
  setupHandlersFn(seedShopWindow, 'seed', dependencies);
  setupHandlersFn(eggShopWindow, 'egg', dependencies); // This now handles both eggs and tools
}

/**
 * Create floating shop window (alternative to sidebar)
 * Creates draggable, resizable shop window with saved position
 *
 * @param {string} type - Shop type ('seed' or 'egg')
 * @param {string} title - Window title
 * @param {number} leftOffset - Default left position
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.MGA_loadJSON] - Load JSON from storage
 * @param {Function} [dependencies.MGA_saveJSON] - Save JSON to storage
 * @param {Function} [dependencies.makeShopWindowDraggable] - Make draggable function
 * @param {Function} [dependencies.makeElementResizable] - Make resizable function
 * @returns {HTMLElement} Shop window element
 */
export function createShopWindow(type, title, leftOffset, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    MGA_loadJSON = typeof window !== 'undefined' && window.MGA_loadJSON,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    makeShopWindowDraggable: makeDraggableFn = makeShopWindowDraggable,
    makeElementResizable = typeof window !== 'undefined' && window.makeElementResizable
  } = dependencies;

  if (!targetDocument) return null;

  const windowEl = targetDocument.createElement('div');
  windowEl.className = 'mga-shop-window';
  windowEl.id = `mga-shop-${type}`;

  // Load saved position and size with validation
  const savedPositions = MGA_loadJSON ? MGA_loadJSON('MGA_shopWindowPositions', {}) : {};
  const savedSizes = MGA_loadJSON ? MGA_loadJSON('MGA_shopWindowSizes', {}) : {};
  const savedPos = savedPositions[type] || { left: leftOffset, top: 120 };
  const savedSize = savedSizes[type] || { width: 300, height: 500 };

  // Validate saved position is on screen
  if (targetWindow) {
    if (savedPos.left < 0 || savedPos.left > targetWindow.innerWidth - 100) {
      savedPos.left = leftOffset;
    }
    if (savedPos.top < 0 || savedPos.top > targetWindow.innerHeight - 100) {
      savedPos.top = 120;
    }
  }

  // Validate saved size is reasonable
  if (savedSize.width < 250 || savedSize.width > 800) {
    savedSize.width = 300;
  }
  if (savedSize.height < 300 || savedSize.height > 900) {
    savedSize.height = 500;
  }

  windowEl.style.cssText = `
    position: fixed;
    top: ${savedPos.top}px;
    left: ${savedPos.left}px;
    width: ${savedSize.width}px;
    height: ${savedSize.height}px;
    background: rgba(17, 24, 39, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.73);
    border-radius: 8px;
    padding: 12px;
    z-index: 999999;
    overflow-y: auto;
    color: #fff;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;

  windowEl.innerHTML = `
    <div class="shop-window-header" style="padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.57); cursor: grab;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative;">
        <h3 style="margin: 0; font-size: 14px;">🌱 ${title}</h3>
        <button class="shop-close-btn" style="position: absolute; top: -4px; right: -4px; cursor: pointer; font-weight: 700; font-size: 16px; color: #cfcfcf; background: none; border: none; padding: 0 6px; transition: color 0.2s ease;">×</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" class="show-available-only" style="accent-color: #2afd23;">
          <span>Show available only</span>
        </label>
        <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" class="sort-by-value" style="accent-color: #4a9eff;">
          <span>Sort by Value</span>
        </label>
      </div>
    </div>
    <div class="shop-items-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
  `;

  targetDocument.body.appendChild(windowEl);

  // Add close button handler
  const closeBtn = windowEl.querySelector('.shop-close-btn');
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    windowEl.remove();
    // Update state
    if (type === 'seed') {
      seedShopWindow = null;
    } else {
      eggShopWindow = null;
    }
    // If both windows are closed, close overlay and update state
    if (!seedShopWindow && !eggShopWindow) {
      if (shopOverlay) shopOverlay.classList.remove('active');
      shopWindowsOpen = false;
    }
  });
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.color = '#ff5555';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.color = '#cfcfcf';
  });

  // Make draggable with type parameter for position saving
  makeDraggableFn(windowEl, windowEl.querySelector('.shop-window-header'), type, dependencies);

  // Make resizable with size saving
  if (makeElementResizable) {
    makeElementResizable(windowEl, {
      minWidth: 250,
      minHeight: 300,
      maxWidth: 600,
      maxHeight: 800,
      showHandleOnHover: true
    });

    // Save size on resize
    if (typeof ResizeObserver !== 'undefined' && MGA_saveJSON && MGA_loadJSON) {
      const resizeObserver = new ResizeObserver(() => {
        const sizes = MGA_loadJSON('MGA_shopWindowSizes', {});
        sizes[type] = {
          width: windowEl.offsetWidth,
          height: windowEl.offsetHeight
        };
        MGA_saveJSON('MGA_shopWindowSizes', sizes);
      });
      resizeObserver.observe(windowEl);
    }
  }

  return windowEl;
}

/**
 * Make shop window draggable
 * Adds drag-and-drop functionality with position saving
 *
 * @param {HTMLElement} element - Window element to make draggable
 * @param {HTMLElement} handle - Drag handle element
 * @param {string} windowType - Window type for saving position
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Function} [dependencies.MGA_loadJSON] - Load JSON from storage
 * @param {Function} [dependencies.MGA_saveJSON] - Save JSON to storage
 */
export function makeShopWindowDraggable(element, handle, windowType, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    MGA_loadJSON = typeof window !== 'undefined' && window.MGA_loadJSON,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON
  } = dependencies;

  if (!targetDocument || !element || !handle) return;

  let isDragging = false;
  let startX;
  let startY;
  let startLeft;
  let startTop;

  handle.style.cursor = 'grab';

  handle.addEventListener('mousedown', e => {
    // Don't drag if clicking on interactive elements
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    // Allow dragging from labels and spans, but not if they contain an input
    if (e.target.tagName === 'LABEL' && e.target.querySelector('input')) return;
    // Don't start drag if clicking resize handle
    if (e.target.classList && e.target.classList.contains('mga-resize-handle')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    handle.style.cursor = 'grabbing';
    element.style.zIndex = '9999999'; // Bring to front while dragging
  });

  targetDocument.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    element.style.left = `${startLeft + dx}px`;
    element.style.top = `${startTop + dy}px`;
  });

  targetDocument.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';
      element.style.zIndex = '999999'; // Reset z-index

      // Save position
      if (MGA_loadJSON && MGA_saveJSON) {
        const positions = MGA_loadJSON('MGA_shopWindowPositions', {});
        positions[windowType] = {
          left: element.offsetLeft,
          top: element.offsetTop
        };
        MGA_saveJSON('MGA_shopWindowPositions', positions);
      }
    }
  });
}

/**
 * Setup shop window event handlers
 * Configures filtering, sorting, rendering, and restock detection
 *
 * @param {HTMLElement} windowEl - Shop window element
 * @param {string} type - Shop type ('seed' or 'egg')
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.UnifiedState] - Unified state
 * @param {Function} [dependencies.MGA_loadJSON] - Load JSON from storage
 * @param {Function} [dependencies.MGA_saveJSON] - Save JSON to storage
 * @param {Function} [dependencies.createShopItemElement] - Create item function
 * @param {Function} [dependencies.getItemStock] - Get stock function
 * @param {Function} [dependencies.getItemValue] - Get value function
 * @param {Function} [dependencies.resetLocalPurchases] - Reset purchases function
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.productionWarn] - Production warn logger
 * @param {Function} [dependencies.isShopDataReady] - Shop ready check
 * @param {Function} [dependencies.waitForShopData] - Wait for shop data
 */
export function setupShopWindowHandlers(windowEl, type, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_loadJSON = typeof window !== 'undefined' && window.MGA_loadJSON,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    createShopItemElement: createItemFn = createShopItemElement,
    getItemStock: getStockFn = getItemStock,
    getItemValue: getValueFn = getItemValue,
    resetLocalPurchases: resetPurchasesFn = resetLocalPurchases,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    productionWarn = typeof window !== 'undefined' && window.productionWarn,
    isShopDataReady: isReadyFn = isShopDataReady,
    waitForShopData: waitForDataFn = waitForShopData
  } = dependencies;

  if (!windowEl) return;

  const itemsList = windowEl.querySelector('.shop-items-list');
  const sortCheckbox = windowEl.querySelector('.sort-by-value');
  const showAvailableCheckbox = windowEl.querySelector('.show-available-only');

  const items = type === 'seed' ? SEED_SPECIES_SHOP : EGG_IDS_SHOP;

  function renderItems(sortByValue = false, showAvailableOnly = false) {
    if (!itemsList) return;
    itemsList.innerHTML = '';

    // For egg type, render both eggs and tools with divider
    if (type === 'egg') {
      // Render eggs section
      let eggItemsToRender = EGG_IDS_SHOP.map(id => ({
        id,
        stock: getStockFn(id, 'egg', dependencies),
        value: getValueFn(id, 'egg'),
        type: 'egg'
      }));

      if (showAvailableOnly) {
        eggItemsToRender = eggItemsToRender.filter(item => item.stock > 0);
      }

      if (sortByValue) {
        eggItemsToRender.sort((a, b) => b.value - a.value);
      }

      eggItemsToRender.forEach(({ id, stock, value }) => {
        const itemEl = createItemFn(id, 'egg', stock, value, {}, dependencies);
        if (itemEl) itemsList.appendChild(itemEl);
      });

      // Get tools from game shop inventory
      const toolShop = targetWindow?.globalShop?.shops?.tool;
      const toolInventory = toolShop?.inventory || [];

      // Only show divider and tools if tools exist
      if (toolInventory.length > 0) {
        // Add professional divider
        const divider = targetDocument.createElement('div');
        divider.style.cssText = `
          margin: 12px 0;
          padding: 8px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        `;
        divider.textContent = '🔧 Tools';
        itemsList.appendChild(divider);

        // Render tools dynamically from inventory
        let toolItemsToRender = toolInventory.map((tool, idx) => {
          const toolId = tool.toolId || tool.name || `Tool_${idx}`;

          // Check if player owns Shovel (it's a one-time purchase)
          let isOwned = false;
          let isUnlimited = false;
          if (toolId === 'Shovel' || toolId === 'GardenShovel') {
            // Check player inventory for Shovel ownership
            const playerInventory = targetWindow.myData?.inventory?.items || [];
            isOwned = playerInventory.some(
              item => item.itemType === 'Tool' && (item.toolId === 'Shovel' || item.toolId === 'GardenShovel')
            );
            if (isOwned) {
              isUnlimited = true;
            }
          }

          const toolStock = isOwned ? 0 : getStockFn(toolId, 'tool', dependencies);
          return {
            id: toolId,
            stock: toolStock,
            value: getValueFn(toolId, 'tool'),
            type: 'tool',
            owned: isOwned,
            unlimited: isUnlimited
          };
        });

        if (showAvailableOnly) {
          // Don't filter out owned/unlimited items (like Shovel)
          toolItemsToRender = toolItemsToRender.filter(item => item.stock > 0 || item.owned || item.unlimited);
        }

        if (sortByValue) {
          toolItemsToRender.sort((a, b) => b.value - a.value);
        }

        toolItemsToRender.forEach(({ id, stock, value, owned, unlimited }) => {
          const itemEl = createItemFn(id, 'tool', stock, value, { owned, unlimited }, dependencies);
          if (itemEl) itemsList.appendChild(itemEl);
        });
      }

      // Show empty state if no items after filtering
      if (eggItemsToRender.length === 0 && toolInventory.length === 0 && showAvailableOnly) {
        itemsList.innerHTML =
          '<div style="color: #888; text-align: center; padding: 20px; font-size: 12px;">No items in stock</div>';
      }
    } else {
      // Render seeds normally
      let itemsToRender = items.map(id => ({
        id,
        stock: getStockFn(id, type, dependencies),
        value: getValueFn(id, type)
      }));

      if (showAvailableOnly) {
        itemsToRender = itemsToRender.filter(item => item.stock > 0);
      }

      if (sortByValue) {
        itemsToRender.sort((a, b) => b.value - a.value);
      }

      itemsToRender.forEach(({ id, stock, value }) => {
        const itemEl = createItemFn(id, type, stock, value, {}, dependencies);
        if (itemEl) itemsList.appendChild(itemEl);
      });

      if (itemsToRender.length === 0 && showAvailableOnly) {
        itemsList.innerHTML =
          '<div style="color: #888; text-align: center; padding: 20px; font-size: 12px;">No items in stock</div>';
      }
    }
  }

  // Load saved checkbox states
  const savedFilters = MGA_loadJSON ? MGA_loadJSON('MGA_shopFilters', {}) : {};
  const savedShowAvailable = savedFilters.showAvailableOnly ?? false;
  const savedSortByValue = savedFilters.sortByValue ?? false;

  if (sortCheckbox) sortCheckbox.checked = savedSortByValue;
  if (showAvailableCheckbox) showAvailableCheckbox.checked = savedShowAvailable;

  if (sortCheckbox) {
    sortCheckbox.addEventListener('change', () => {
      if (MGA_saveJSON) {
        const filters = {
          showAvailableOnly: showAvailableCheckbox?.checked ?? false,
          sortByValue: sortCheckbox.checked
        };
        MGA_saveJSON('MGA_shopFilters', filters);
      }
      renderItems(sortCheckbox.checked, showAvailableCheckbox?.checked ?? false);
    });
  }

  if (showAvailableCheckbox) {
    showAvailableCheckbox.addEventListener('change', () => {
      if (MGA_saveJSON) {
        const filters = {
          showAvailableOnly: showAvailableCheckbox.checked,
          sortByValue: sortCheckbox?.checked ?? false
        };
        MGA_saveJSON('MGA_shopFilters', filters);
      }
      renderItems(sortCheckbox?.checked ?? false, showAvailableCheckbox.checked);
    });
  }

  // Manual refresh button handler
  const refreshBtn = windowEl.querySelector('.shop-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderItems(sortCheckbox?.checked ?? false, showAvailableCheckbox?.checked ?? false);
    });
  }

  // Loading and error states
  function showLoadingState() {
    if (!itemsList) return;
    itemsList.innerHTML = `
      <div style="color: #4a9eff; text-align: center; padding: 40px 20px; font-size: 13px;">
        <div style="margin-bottom: 12px; font-size: 24px;">⏳</div>
        <div style="font-weight: 600; margin-bottom: 8px;">Loading shop data...</div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">Waiting for game data</div>
      </div>
    `;
  }

  function showTimeoutError() {
    if (!itemsList) return;
    itemsList.innerHTML = `
      <div style="color: #ff6b6b; text-align: center; padding: 40px 20px; font-size: 13px;">
        <div style="margin-bottom: 12px; font-size: 24px;">⚠️</div>
        <div style="font-weight: 600; margin-bottom: 8px;">Shop data unavailable</div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 16px;">
          Game data not loaded yet
        </div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.7);">
          Try using the refresh button (🔄) or closing and reopening the shop
        </div>
      </div>
    `;
  }

  // Check if shop data is ready on initial render
  if (isReadyFn(dependencies)) {
    // Data ready immediately - render normally
    renderItems(savedSortByValue, savedShowAvailable);
  } else {
    // Data not ready - show loading state and wait
    if (productionLog) {
      productionLog(`⏳ [SHOP] Shop data not ready yet, showing loading state for ${type} shop`);
    }
    showLoadingState();

    waitForDataFn(
      success => {
        if (success) {
          // Data became available - render shop
          renderItems(savedSortByValue, savedShowAvailable);
        } else {
          // Timeout - show error
          showTimeoutError();
        }
      },
      5000,
      dependencies
    );
  }

  // Store render function for global refresh
  shopRenderFunctions[type] = () =>
    renderItems(sortCheckbox?.checked ?? false, showAvailableCheckbox?.checked ?? false);

  // Auto-refresh stock and detect restocks using pattern-based detection
  let lastTimerValue = null;
  let timerWasDecreasing = false;

  setInterval(() => {
    // Check if shop has restocked by watching secondsUntilRestock timer pattern
    const shop = targetWindow?.globalShop?.shops;
    if (shop) {
      const shopData = type === 'seed' ? shop.seed : shop.egg;
      if (shopData && typeof shopData.secondsUntilRestock !== 'undefined') {
        const currentTimer = Number(shopData.secondsUntilRestock) || 0;

        // First reading - initialize tracking
        if (lastTimerValue === null) {
          lastTimerValue = currentTimer;
          return;
        }

        let restockDetected = false;

        // Pattern-based detection: timer naturally decreases, then suddenly increases = restock
        if (currentTimer < lastTimerValue) {
          // Timer decreasing normally (countdown in progress)
          timerWasDecreasing = true;
        } else if (timerWasDecreasing && currentTimer > lastTimerValue + 2) {
          // Timer increased after decreasing - this is the restock pattern!
          // +2 threshold prevents false positives from network jitter
          restockDetected = true;
          timerWasDecreasing = false;

          if (UnifiedState?.data?.settings?.debugMode) {
            productionLog(
              `[SHOP DEBUG] Restock detected for ${type}! Pattern: ${lastTimerValue}s → ${currentTimer}s (was decreasing, then increased)`
            );
          }
        }

        lastTimerValue = currentTimer;

        // Refresh UI when restock is detected
        if (restockDetected) {
          // Reset local purchase tracking for this shop type
          resetPurchasesFn(type, dependencies);

          // Short delay to ensure stock data is stable
          setTimeout(() => {
            renderItems(sortCheckbox?.checked ?? false, showAvailableCheckbox?.checked ?? false);
          }, 500);
          return; // Skip the immediate render below
        }
      }
    }

    // Normal periodic refresh (no restock detected)
    // In-game purchases are now detected via sendMessage interception
    // ONLY refresh if no buttons are being hovered (prevents flickering)
    const isHovering = itemsList?.querySelector('.buy-btn:hover');
    if (!isHovering) {
      renderItems(sortCheckbox?.checked ?? false, showAvailableCheckbox?.checked ?? false);
    }
  }, 2000); // Check every 2 seconds for better responsiveness
}

/**
 * Get item value for sorting
 * Returns approximate value for shop item sorting
 *
 * @param {string} id - Item identifier
 * @param {string} type - Item type ('seed', 'egg', 'tool')
 * @returns {number} Item value for sorting
 */
export function getItemValue(id, type) {
  const valueMap = {
    // Seeds (approximate values)
    MoonCelestial: 50000,
    DawnCelestial: 45000,
    Starweaver: 40000,
    Lychee: 8000,
    DragonFruit: 7000,
    PassionFruit: 6000,
    Sunflower: 5000,
    Lemon: 4000,
    Pepper: 3500,
    Grape: 3000,
    Bamboo: 2500,
    Cactus: 2000,
    Mushroom: 1800,
    BurrosTail: 1500,
    Lily: 1200,
    Banana: 1000,
    Coconut: 900,
    Echeveria: 800,
    Pumpkin: 600,
    Watermelon: 500,
    Corn: 400,
    Daffodil: 300,
    Tomato: 250,
    OrangeTulip: 200,
    Apple: 150,
    Blueberry: 100,
    Aloe: 80,
    Strawberry: 60,
    Carrot: 40,
    // Eggs
    MythicalEgg: 10000,
    LegendaryEgg: 5000,
    RareEgg: 1000,
    UncommonEgg: 200,
    CommonEgg: 50,
    // Tools (placeholder values)
    Shovel: 500,
    WateringCan: 300,
    PlanterPot: 200,
    Fertilizer: 200
  };
  return valueMap[id] || 100;
}

// ============================================================================
// PHASE 5: SHOP TAB CONTENT
// ============================================================================

/**
 * Generate shop tab HTML content
 * Creates settings tab content with inventory counter, filters, seed/egg lists
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state
 * @param {Object} [dependencies.SHOP_DISPLAY_NAMES] - Display name overrides
 * @returns {string} HTML content for shop tab
 */
export function getShopTabContent(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  // Get current inventory count (includes bag + hotbar)
  const inventory = UnifiedState?.atoms?.inventory;
  const currentCount = inventory?.items?.length || 0;
  const maxCount = 100; // 91 bag + 9 hotbar = 100 total

  // Color code based on inventory fullness
  let inventoryColor = '#4caf50'; // Green (< 95)
  if (currentCount >= 100) {
    inventoryColor = '#ff4444'; // Red (full)
  } else if (currentCount >= 95) {
    inventoryColor = '#ffa500'; // Yellow (95-99)
  }

  return `
    <div class="mga-section">
      <div class="mga-section-title">🛒 Shop</div>
      <p style="font-size: 12px; color: #aaa; margin-bottom: 8px;">
        Quick buy seeds and eggs. Stock updates automatically when shop resets.
      </p>

      <!-- Inventory counter -->
      <div id="shop-inventory-counter" style="
        font-size: 13px;
        font-weight: 600;
        color: ${inventoryColor};
        margin-bottom: 16px;
        padding: 8px 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 6px;
        border-left: 3px solid ${inventoryColor};
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span>📦</span>
        <span>Inventory: <span id="shop-inventory-count">${currentCount}</span>/${maxCount}</span>
      </div>

      <div style="margin-bottom: 20px;">
        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <input type="checkbox" id="shop-in-stock-only" class="mga-checkbox">
          <span>Show only items in stock</span>
        </label>
      </div>

      <div id="shop-seed-section" style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; margin-bottom: 12px; color: #fff;">🌱 Seeds</h3>
        <div id="shop-seed-list" style="display: grid; gap: 6px;"></div>
      </div>

      <div id="shop-egg-section">
        <h3 style="font-size: 14px; margin-bottom: 12px; color: #fff;">🥚 Eggs</h3>
        <div id="shop-egg-list" style="display: grid; gap: 6px;"></div>
      </div>
    </div>
  `;
}

/**
 * Setup shop tab event handlers
 * Initializes shop tab with item lists, filters, and auto-refresh
 *
 * @param {HTMLElement|Document} context - DOM context for the tab
 * @param {Object} dependencies - Injectable dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Object} [dependencies.UnifiedState] - Unified state
 * @param {Object} [dependencies.SHOP_DISPLAY_NAMES] - Display name overrides
 * @param {Function} [dependencies.getItemStock] - Get stock function
 * @param {Function} [dependencies.isInventoryFull] - Inventory full check
 * @param {Function} [dependencies.flashInventoryFullFeedback] - Visual feedback
 * @param {Function} [dependencies.getInventoryItemCount] - Get inventory count
 * @param {Function} [dependencies.getItemStackCap] - Get stack cap
 * @param {Function} [dependencies.getLocalPurchaseCount] - Get purchase count
 * @param {Function} [dependencies.startInventoryCounter] - Start counter function
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.productionError] - Production error logger
 * @param {Function} [dependencies.alert] - Alert function
 * @param {Console} [dependencies.console] - Console for logging
 */
export function setupShopTabHandlers(context, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    SHOP_DISPLAY_NAMES: displayNames = SHOP_DISPLAY_NAMES,
    getItemStock: getStockFn = getItemStock,
    isInventoryFull: isInvFullFn = isInventoryFull,
    flashInventoryFullFeedback: flashInvFullFn = flashInventoryFullFeedback,
    getInventoryItemCount: getInvCountFn = getInventoryItemCount,
    getItemStackCap: getStackCapFn = getItemStackCap,
    getLocalPurchaseCount: getPurchaseCountFn = getLocalPurchaseCount,
    startInventoryCounter: startCounterFn = startInventoryCounter,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    productionError = typeof window !== 'undefined' && window.productionError,
    alert: alertFn = typeof window !== 'undefined' ? window.alert : console.log,
    console: consoleObj = console
  } = dependencies;

  let contextLocal = context;
  if (!contextLocal) contextLocal = targetDocument;
  if (!contextLocal) return;

  const inStockCheckbox = contextLocal.querySelector('#shop-in-stock-only');
  const seedList = contextLocal.querySelector('#shop-seed-list');
  const eggList = contextLocal.querySelector('#shop-egg-list');

  if (!seedList || !eggList) return;

  // Start inventory counter updates for shop tab
  if (startCounterFn) {
    startCounterFn(dependencies);
  }

  // Seed/Egg item definition (using module constants)
  const SEED_SPECIES = SEED_SPECIES_SHOP;
  const EGG_IDS = EGG_IDS_SHOP;

  // Create shop items (tab version - simplified UI)
  function createShopItem(id, type) {
    if (!targetDocument) return null;

    const item = targetDocument.createElement('div');
    item.className = 'shop-item';
    item.dataset.itemId = id;
    item.dataset.itemType = type;
    item.style.cssText = `
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255, 255, 255, 0.57);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      transition: all 0.2s ease;
    `;

    const displayName = displayNames[id] || id.replace(/([A-Z])/g, ' $1').trim();
    const stock = getTabItemStock(id, type);

    item.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 2px;">${displayName}</div>
        <div class="stock-display" style="font-size: 11px; color: #888;">Stock: ${stock}</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="mga-btn mga-btn-secondary buy-one" ${stock === 0 ? 'disabled' : ''}
          style="padding: 6px 12px; font-size: 12px;">Buy 1</button>
        <button class="mga-btn mga-btn-secondary buy-all" ${stock === 0 ? 'disabled' : ''}
          style="padding: 6px 12px; font-size: 12px;">Buy All</button>
      </div>
    `;

    if (stock > 0) {
      item.style.background = 'rgba(76, 255, 106, 0.40)';
      item.style.borderColor = 'rgba(9, 255, 0, 0.48)';
    }

    // Event handlers
    const buyOneBtn = item.querySelector('.buy-one');
    const buyAllBtn = item.querySelector('.buy-all');
    if (buyOneBtn) {
      buyOneBtn.addEventListener('click', () => buyTabItem(id, type, 1, item));
    }
    if (buyAllBtn) {
      buyAllBtn.addEventListener('click', () => buyTabItem(id, type, stock, item));
    }

    return item;
  }

  // Get item stock (tab version - uses extracted function)
  function getTabItemStock(id, type) {
    try {
      const shop = targetWindow?.globalShop?.shops;
      if (!shop) return 0;

      const inventory = type === 'seed' ? shop.seed?.inventory : shop.egg?.inventory;
      if (!inventory) return 0;

      const item = inventory.find(i => {
        const itemId = type === 'seed' ? i.species : i.eggId;
        return itemId === id;
      });

      if (!item) return 0;

      // initialStock is a snapshot that only updates on restock
      // We must subtract local purchases to get current stock
      const initial = item.initialStock || 0;
      // Cap purchased count to initial - can't have purchased more than what was available
      const purchased = Math.min(getPurchaseCountFn(id, type, dependencies), initial);
      const stock = Math.max(0, initial - purchased);

      return stock;
    } catch (e) {
      if (productionError) {
        productionError('[SHOP-TAB] getItemStock error:', e);
      }
      return 0;
    }
  }

  // Buy item (tab version - similar to main buyItem but with tab-specific UI)
  function buyTabItem(id, type, amount, itemEl) {
    const conn = targetWindow?.MagicCircle_RoomConnection;
    if (!conn?.sendMessage) {
      alertFn('Connection not available');
      return;
    }

    // SMART INVENTORY CHECK: Only block if truly full
    const inventory = UnifiedState?.atoms?.inventory;
    const hasExistingStack = inventory?.items?.some(item => {
      if (type === 'seed') return item.species === id && item.itemType !== 'Produce';
      if (type === 'egg') return item.eggId === id;
      if (type === 'tool') return item.toolId === id || item.name === id;
      return false;
    });

    // If inventory is full AND we don't have an existing stack, block purchase
    if (isInvFullFn(dependencies) && !hasExistingStack) {
      flashInvFullFn(itemEl, `Inventory Full! (100/100) - Cannot purchase new items`, dependencies);
      if (consoleObj) {
        consoleObj.log(`[SHOP] Purchase blocked: Inventory full and no existing stack for ${id}`);
      }
      return;
    }

    // If we have an existing stack, the quantity cap check will handle it
    if (hasExistingStack && consoleObj) {
      consoleObj.log(`[SHOP] ✅ Inventory full but ${id} can stack on existing item`);
    }

    // Check if at item stack cap before purchase
    const currentCount = getInvCountFn(id, type, dependencies);
    const stackCap = getStackCapFn(id, type);

    if (currentCount >= stackCap) {
      const displayName = displayNames[id] || id.replace(/([A-Z])/g, ' $1').trim();

      // Special visual feedback for items at max quantity
      if (stackCap < Infinity) {
        flashInvFullFn(
          itemEl,
          `${displayName} at MAX! (${currentCount}/${stackCap}) - Cannot purchase more`,
          dependencies
        );

        // Update the item display to show current quantity persistently
        const quantityDisplay = itemEl.querySelector('.quantity-display');
        if (quantityDisplay) {
          quantityDisplay.textContent = `Owned: ${currentCount}/${stackCap}`;
          quantityDisplay.style.color = '#ff4444';
          quantityDisplay.style.fontWeight = 'bold';
        }
      } else {
        flashInvFullFn(itemEl, `${displayName} at max capacity! (${currentCount}/${stackCap})`, dependencies);
      }

      if (UnifiedState?.data?.settings?.debugMode && consoleObj) {
        consoleObj.log(`[SHOP-TAB] ❌ Purchase blocked: ${id} at cap (${currentCount}/${stackCap})`);
      }
      return;
    }

    // Check if purchasing would exceed cap
    if (currentCount + amount > stackCap) {
      const displayName = displayNames[id] || id.replace(/([A-Z])/g, ' $1').trim();
      const canPurchase = stackCap - currentCount;
      flashInvFullFn(
        itemEl,
        `Can only purchase ${canPurchase} more ${displayName} (currently ${currentCount}/${stackCap})`,
        dependencies
      );
      if (UnifiedState?.data?.settings?.debugMode && consoleObj) {
        consoleObj.log(`[SHOP-TAB] ❌ Purchase blocked: would exceed cap (${currentCount} + ${amount} > ${stackCap})`);
      }
      return;
    }

    if (UnifiedState?.data?.settings?.debugMode && consoleObj) {
      consoleObj.log(`[SHOP-TAB] ✅ Purchase allowed: ${id} (${currentCount} + ${amount} <= ${stackCap})`);
    }

    try {
      for (let i = 0; i < amount; i += 1) {
        let messageType;
        let itemKey;

        if (type === 'seed') {
          messageType = 'PurchaseSeed';
          itemKey = 'species';
        } else if (type === 'egg') {
          messageType = 'PurchaseEgg';
          itemKey = 'eggId';
        } else if (type === 'tool') {
          messageType = 'PurchaseTool';
          itemKey = 'toolId';
        }

        conn.sendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: messageType,
          [itemKey]: id
        });
      }

      // Purchase tracking happens automatically in sendMessage intercept

      // Update UI
      setTimeout(() => {
        const newStock = getTabItemStock(id, type);
        const stockDisplay = itemEl.querySelector('.stock-display');
        if (stockDisplay) stockDisplay.textContent = `Stock: ${newStock}`;

        // Update quantity display
        const quantityDiv = itemEl.querySelector('.quantity-display');
        if (quantityDiv) {
          const ownedCount = getInvCountFn(id, type, dependencies);
          const itemStackCap = getStackCapFn(id, type);

          if (itemStackCap < Infinity && ownedCount > 0) {
            const percentFull = (ownedCount / itemStackCap) * 100;
            let color = 'rgba(255, 255, 255, 0.7)';

            if (percentFull >= 100) {
              color = '#ff4444';
            } else if (percentFull >= 80) {
              color = '#ffaa44';
            } else if (percentFull >= 50) {
              color = '#ffff44';
            }

            quantityDiv.style.color = color;
            quantityDiv.style.fontWeight = percentFull >= 100 ? 'bold' : 'normal';
            quantityDiv.textContent = `Owned: ${ownedCount}/${itemStackCap}`;
          } else if (ownedCount > 0) {
            quantityDiv.textContent = `Owned: ${ownedCount}`;
          }
        }

        const buttons = itemEl.querySelectorAll('button');
        buttons.forEach(btn => {
          btn.disabled = newStock === 0;
        });

        if (newStock === 0) {
          itemEl.style.background = 'rgba(255,255,255,0.03)';
          itemEl.style.borderColor = 'rgba(255, 255, 255, 0.57)';
        }

        applyStockFilter();
      }, 100);

      if (productionLog) {
        productionLog(`✅ Purchased ${amount}x ${id}`);
      }
    } catch (e) {
      if (consoleObj) {
        consoleObj.error('Purchase error:', e);
      }
      alertFn('Purchase failed');
    }
  }

  // Apply stock filter
  function applyStockFilter() {
    if (!inStockCheckbox || !contextLocal) return;
    const showOnlyInStock = inStockCheckbox.checked;

    contextLocal.querySelectorAll('.shop-item').forEach(item => {
      const id = item.dataset.itemId;
      const type = item.dataset.itemType;
      const stock = getTabItemStock(id, type);
      item.style.display = showOnlyInStock && stock === 0 ? 'none' : 'flex';
    });
  }

  // Initialize shop
  SEED_SPECIES.forEach(species => {
    const itemEl = createShopItem(species, 'seed');
    if (itemEl) seedList.appendChild(itemEl);
  });

  EGG_IDS.forEach(eggId => {
    const itemEl = createShopItem(eggId, 'egg');
    if (itemEl) eggList.appendChild(itemEl);
  });

  if (inStockCheckbox) {
    inStockCheckbox.addEventListener('change', applyStockFilter);
  }

  // Auto-refresh on shop update
  const refreshInterval = setInterval(() => {
    if (!contextLocal || !contextLocal.querySelector('#shop-seed-list')) {
      clearInterval(refreshInterval);
      return;
    }

    contextLocal.querySelectorAll('.shop-item').forEach(item => {
      const id = item.dataset.itemId;
      const type = item.dataset.itemType;
      const newStock = getTabItemStock(id, type);
      const stockDisplay = item.querySelector('.stock-display');
      if (stockDisplay) stockDisplay.textContent = `Stock: ${newStock}`;

      const buttons = item.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.disabled = newStock === 0;
      });

      if (newStock > 0) {
        item.style.background = 'rgba(76, 255, 106, 0.40)';
        item.style.borderColor = 'rgba(9, 255, 0, 0.48)';
      } else {
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.borderColor = 'rgba(255, 255, 255, 0.57)';
      }
    });

    applyStockFilter();
  }, 2000);
}

// ============================================================================
// PHASE 6: SHOP MONITORING & RESTOCK DETECTION
// ============================================================================

/**
 * Module-level State: Shop Watcher Management
 * Tracks watcher initialization and restock detection state
 */
let shopWatcherInitialized = false;
let lastEggSeconds = null;
let eggWasDecreasing = false;
let refreshDebounceTimer = null;

/**
 * Check for watched shop items and trigger notifications
 * Scans seed, egg, and decor shops for watched items and notifies user
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.MGA_saveJSON] - Save JSON function
 * @param {Function} [dependencies.isWatchedItem] - Check if item is watched
 * @param {Function} [dependencies.updateLastSeen] - Update last seen timestamp
 * @param {Function} [dependencies.queueNotification] - Queue notification function
 * @param {Function} [dependencies.playShopNotificationSound] - Play notification sound
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.normalizeSpeciesName] - Normalize species name
 * @param {Console} [dependencies.console] - Console for error logging
 */
export function checkForWatchedItems(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetWindow = typeof window !== 'undefined' ? window : null,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    isWatchedItem = typeof window !== 'undefined' && window.isWatchedItem,
    updateLastSeen = typeof window !== 'undefined' && window.updateLastSeen,
    queueNotification = typeof window !== 'undefined' && window.queueNotification,
    playShopNotificationSound = typeof window !== 'undefined' && window.playShopNotificationSound,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    console: consoleObj = console
  } = dependencies;

  const notifications = UnifiedState?.data?.settings?.notifications;
  if (!notifications || !notifications.enabled) return;

  try {
    const now = Date.now();

    // Collect all detected items in this check cycle for batch notification
    const detectedItems = [];

    // Constants for restock detection
    const CHECK_INTERVAL = 5000;
    const SMALL_EDGE = 5;
    const LARGE_EDGE = 180;
    const BIG_JUMP_DELTA = 60;
    const RESTOCK_COOLDOWN = 30000;
    const NOTIFICATION_COOLDOWN = 60000;

    // Module-level state for checkForWatchedItems (maintained across calls)
    if (!checkForWatchedItems._state) {
      checkForWatchedItems._state = {
        lastRestockCheck: 0,
        lastSeedTimer: 999,
        lastEggTimer: 999,
        lastDecorTimer: 999,
        lastSeedRestock: 0,
        lastEggRestock: 0,
        lastDecorRestock: 0,
        previousSeedInventory: [],
        previousSeedQuantities: {},
        previousEggInventory: [],
        previousEggQuantities: {},
        previousDecorInventory: [],
        previousDecorQuantities: {},
        seedRestockNotifiedItems: new Set(),
        eggRestockNotifiedItems: new Set(),
        decorRestockNotifiedItems: new Set(),
        isFirstRun: true
      };
    }

    const state = checkForWatchedItems._state;

    // Check every 5 seconds to catch items quickly
    if (now - state.lastRestockCheck < CHECK_INTERVAL) return;
    state.lastRestockCheck = now;

    // Get timer data - use both sources for reliability
    const quinoaData = UnifiedState?.atoms?.quinoaData || targetWindow?.globalShop;
    if (!quinoaData && !targetWindow?.globalShop) return; // No shop data available

    // Use targetWindow.globalShop as primary source, quinoaData as fallback
    const shopData = targetWindow?.globalShop || UnifiedState?.atoms?.quinoaData || quinoaData;
    const seedTimer = shopData?.shops?.seed?.secondsUntilRestock || 999;
    const eggTimer = shopData?.shops?.egg?.secondsUntilRestock || 999;
    const decorTimer = shopData?.shops?.decor?.secondsUntilRestock || 999;

    // Detect restock using robust edge-detection
    const seedRestocked =
      (state.lastSeedTimer <= SMALL_EDGE && seedTimer >= LARGE_EDGE) ||
      (seedTimer - state.lastSeedTimer >= BIG_JUMP_DELTA && state.lastSeedTimer > 0);

    const eggRestocked =
      (state.lastEggTimer <= SMALL_EDGE && eggTimer >= LARGE_EDGE) ||
      (eggTimer - state.lastEggTimer >= BIG_JUMP_DELTA && state.lastEggTimer > 0);

    const decorRestocked =
      (state.lastDecorTimer <= SMALL_EDGE && decorTimer >= LARGE_EDGE) ||
      (decorTimer - state.lastDecorTimer >= BIG_JUMP_DELTA && state.lastDecorTimer > 0);

    // Handle restock events
    if (seedRestocked) {
      if (productionLog) {
        productionLog(`🔄 [NOTIFICATIONS] SEED SHOP RESTOCKED! (Edge detection: ${state.lastSeedTimer}→${seedTimer})`);
      }
      state.previousSeedInventory = [];
      state.previousSeedQuantities = {};
      state.seedRestockNotifiedItems.clear();
      state.lastSeedRestock = now;
    }

    if (eggRestocked) {
      if (productionLog) {
        productionLog(`🔄 [NOTIFICATIONS] EGG SHOP RESTOCKED! (Edge detection: ${state.lastEggTimer}→${eggTimer})`);
      }
      state.previousEggInventory = [];
      state.previousEggQuantities = {};
      state.eggRestockNotifiedItems.clear();
      state.lastEggRestock = now;
    }

    if (decorRestocked) {
      if (productionLog) {
        productionLog(
          `🔄 [NOTIFICATIONS] DECOR SHOP RESTOCKED! (Edge detection: ${state.lastDecorTimer}→${decorTimer})`
        );
      }
      state.previousDecorInventory = [];
      state.previousDecorQuantities = {};
      state.decorRestockNotifiedItems.clear();
      state.lastDecorRestock = now;
    }

    // Update last timer values
    state.lastSeedTimer = seedTimer;
    state.lastEggTimer = eggTimer;
    state.lastDecorTimer = decorTimer;

    // Check seed shop
    const currentSeeds = targetWindow?.globalShop?.shops?.seed?.inventory || [];
    const inStockSeeds = currentSeeds.filter(item => item.initialStock > 0);
    const currentSeedIds = inStockSeeds.map(item => item.species);

    // Track seed quantities
    const currentSeedQuantities = {};
    inStockSeeds.forEach(item => {
      currentSeedQuantities[item.species] = item.initialStock;
    });

    // Initialize previous quantities if empty (first run)
    if (Object.keys(state.previousSeedQuantities).length === 0 && !seedRestocked) {
      if (productionLog) {
        productionLog(`🔧 [NOTIFICATIONS] Initializing previous seed quantities...`);
      }
      Object.keys(currentSeedQuantities).forEach(seedId => {
        state.previousSeedQuantities[seedId] = currentSeedQuantities[seedId];
      });
    }

    if (productionLog) {
      productionLog(
        `🛒 [NOTIFICATIONS] Current seed quantities:`,
        currentSeedQuantities,
        `| Previous:`,
        state.previousSeedQuantities
      );
    }

    // Find seeds with increased quantities or new items (after restock)
    Object.keys(currentSeedQuantities).forEach(seedId => {
      const oldQuantity = state.previousSeedQuantities[seedId] || 0;
      const newQuantity = currentSeedQuantities[seedId];

      if (productionLog) {
        productionLog(`🔍 [NOTIFICATIONS] Processing seed: ${seedId} (${oldQuantity}→${newQuantity})`);
      }

      // Determine if we should check for notification
      const quantityIncreased = newQuantity > oldQuantity;
      const isRestockWindow = seedRestocked && now - state.lastSeedRestock < RESTOCK_COOLDOWN;
      const alreadyNotifiedInRestock = state.seedRestockNotifiedItems.has(seedId);

      if (productionLog) {
        productionLog(
          `🔍 [NOTIFICATIONS] ${seedId} check logic: quantityIncreased=${quantityIncreased}, isRestockWindow=${isRestockWindow}, alreadyNotifiedInRestock=${alreadyNotifiedInRestock}`
        );
      }

      const shouldCheck =
        (state.isFirstRun && newQuantity > 0) ||
        (quantityIncreased && !isRestockWindow) ||
        (isRestockWindow && !alreadyNotifiedInRestock) ||
        (oldQuantity === 0 && newQuantity > 0);

      if (productionLog) {
        productionLog(`🔍 [NOTIFICATIONS] ${seedId} shouldCheck: ${shouldCheck}`);
      }

      if (shouldCheck) {
        if (productionLog) {
          productionLog(
            `🆕 [NOTIFICATIONS] Seed stock change: ${seedId} (${oldQuantity}→${newQuantity}) | Restock: ${seedRestocked} | RestockWindow: ${isRestockWindow}`
          );
        }

        // Update last seen for ANY seed that appears or increases
        if (updateLastSeen) {
          updateLastSeen(seedId);
        }

        // Check if it's a watched seed
        const isWatched = isWatchedItem ? isWatchedItem(seedId, 'seed') : false;
        if (productionLog) {
          productionLog(`🔍 [NOTIFICATIONS] Is ${seedId} watched? ${isWatched}`);
        }

        if (isWatched) {
          // Check cooldown (1 minute per item)
          const itemKey = `seed_${seedId}`;
          const lastNotified = notifications.lastSeenTimestamps[`notified_${itemKey}`] || 0;
          const canNotify = now - lastNotified > NOTIFICATION_COOLDOWN;

          if (productionLog) {
            productionLog(
              `🔍 [NOTIFICATIONS] ${seedId} cooldown check: lastNotified=${lastNotified}, now=${now}, diff=${now - lastNotified}, canNotify=${canNotify}`
            );
          }

          if (canNotify) {
            if (productionLog) {
              productionLog(`🎉 [NOTIFICATIONS] RARE SEED DETECTED: ${seedId} (${newQuantity} in stock)`);
            }
            notifications.lastSeenTimestamps[`notified_${itemKey}`] = now;

            // Track that we notified this item during restock
            if (isRestockWindow) {
              state.seedRestockNotifiedItems.add(seedId);
            }

            if (MGA_saveJSON) {
              MGA_saveJSON('MGA_data', UnifiedState.data);
            }

            // Collect item for batch notification
            detectedItems.push({
              type: 'seed',
              id: seedId,
              quantity: newQuantity,
              icon: '🌱'
            });
          } else if (productionLog) {
            productionLog(`⏰ [NOTIFICATIONS] ${seedId} on cooldown, not notifying`);
          }
        } else if (productionLog) {
          productionLog(`❌ [NOTIFICATIONS] ${seedId} is not watched, skipping notification`);
        }
      } else if (productionLog) {
        productionLog(`⏭️ [NOTIFICATIONS] ${seedId} shouldCheck=false, skipping`);
      }
    });

    if (productionLog) {
      productionLog(`✅ [NOTIFICATIONS] Finished checking seeds, moving to eggs...`);
    }

    // Check egg shop
    let currentEggIds = [];
    const currentEggQuantities = {};

    try {
      if (productionLog) {
        productionLog(`🥚 [NOTIFICATIONS] === CHECKING EGG SHOP ===`);
      }
      const currentEggs = targetWindow?.globalShop?.shops?.egg?.inventory || [];
      const inStockEggs = currentEggs.filter(item => item.initialStock > 0);
      currentEggIds = inStockEggs.map(item => item.eggId);

      if (productionLog) {
        productionLog(
          `🥚 [NOTIFICATIONS] Current eggs in shop: [${currentEggIds.join(', ')}] | Previous: [${state.previousEggInventory.join(', ')}]`
        );
      }

      // Track egg quantities
      inStockEggs.forEach(item => {
        currentEggQuantities[item.eggId] = item.initialStock;
      });

      // Initialize previous quantities if empty (first run)
      if (Object.keys(state.previousEggQuantities).length === 0 && !eggRestocked) {
        if (productionLog) {
          productionLog(`🔧 [NOTIFICATIONS] Initializing previous egg quantities...`);
        }
        Object.keys(currentEggQuantities).forEach(eggId => {
          state.previousEggQuantities[eggId] = currentEggQuantities[eggId];
        });
      }

      if (productionLog) {
        productionLog(
          `🥚 [NOTIFICATIONS] Current egg quantities:`,
          currentEggQuantities,
          `| Previous:`,
          state.previousEggQuantities
        );
      }

      // Find eggs with increased quantities or new items
      Object.keys(currentEggQuantities).forEach(eggId => {
        const oldQuantity = state.previousEggQuantities[eggId] || 0;
        const newQuantity = currentEggQuantities[eggId];

        if (productionLog) {
          productionLog(`🔍 [NOTIFICATIONS] Processing egg: ${eggId} (${oldQuantity}→${newQuantity})`);
        }

        const quantityIncreased = newQuantity > oldQuantity;
        const isRestockWindow = eggRestocked && now - state.lastEggRestock < RESTOCK_COOLDOWN;
        const alreadyNotifiedInRestock = state.eggRestockNotifiedItems.has(eggId);

        const shouldCheck =
          (state.isFirstRun && newQuantity > 0) ||
          (quantityIncreased && !isRestockWindow) ||
          (isRestockWindow && !alreadyNotifiedInRestock) ||
          (oldQuantity === 0 && newQuantity > 0);

        if (shouldCheck) {
          if (updateLastSeen) {
            updateLastSeen(eggId);
          }

          const isWatched = isWatchedItem ? isWatchedItem(eggId, 'egg') : false;

          if (isWatched) {
            const itemKey = `egg_${eggId}`;
            const lastNotified = notifications.lastSeenTimestamps[`notified_${itemKey}`] || 0;
            const canNotify = now - lastNotified > NOTIFICATION_COOLDOWN;

            if (canNotify) {
              if (productionLog) {
                productionLog(`🎉 [NOTIFICATIONS] RARE EGG DETECTED: ${eggId} (${newQuantity} in stock)`);
              }
              notifications.lastSeenTimestamps[`notified_${itemKey}`] = now;

              if (isRestockWindow) {
                state.eggRestockNotifiedItems.add(eggId);
              }

              if (MGA_saveJSON) {
                MGA_saveJSON('MGA_data', UnifiedState.data);
              }

              detectedItems.push({
                type: 'egg',
                id: eggId,
                quantity: newQuantity,
                icon: '🥚'
              });
            }
          }
        }
      });

      if (productionLog) {
        productionLog(`✅ [NOTIFICATIONS] Finished checking all eggs`);
      }

      // Update egg inventory and quantities
      state.previousEggInventory = [...currentEggIds];
      state.previousEggQuantities = { ...currentEggQuantities };
    } catch (eggError) {
      if (consoleObj) {
        consoleObj.error(`❌ [NOTIFICATIONS] Error checking eggs:`, eggError);
      }
    }

    if (productionLog) {
      productionLog(`✅ [NOTIFICATIONS] Finished checking eggs, moving to decor...`);
    }

    // Check decor shop (hourly resets)
    let currentDecorIds = [];
    const currentDecorQuantities = {};

    try {
      // Ensure watchedDecor exists (backwards compatibility)
      if (!notifications.watchedDecor) {
        notifications.watchedDecor = [];
      }

      if (productionLog) {
        productionLog(`🎨 [NOTIFICATIONS] === CHECKING DECOR SHOP ===`);
      }
      const currentDecor = targetWindow?.globalShop?.shops?.decor?.inventory || [];
      const inStockDecor = currentDecor.filter(item => item.initialStock > 0);
      currentDecorIds = inStockDecor.map(item => item.decorId);

      if (productionLog) {
        productionLog(
          `🎨 [NOTIFICATIONS] Current decor in shop: [${currentDecorIds.join(', ')}] | Previous: [${state.previousDecorInventory.join(', ')}]`
        );
      }

      // Track decor quantities
      inStockDecor.forEach(item => {
        currentDecorQuantities[item.decorId] = item.initialStock;
      });

      // Initialize previous quantities if empty (first run)
      if (Object.keys(state.previousDecorQuantities).length === 0 && !decorRestocked) {
        if (productionLog) {
          productionLog(`🔧 [NOTIFICATIONS] Initializing previous decor quantities...`);
        }
        Object.keys(currentDecorQuantities).forEach(decorId => {
          state.previousDecorQuantities[decorId] = currentDecorQuantities[decorId];
        });
      }

      // Find decor with increased quantities or new items
      Object.keys(currentDecorQuantities).forEach(decorId => {
        const oldQuantity = state.previousDecorQuantities[decorId] || 0;
        const newQuantity = currentDecorQuantities[decorId];

        const quantityIncreased = newQuantity > oldQuantity;
        const isRestockWindow = decorRestocked && now - state.lastDecorRestock < RESTOCK_COOLDOWN;
        const alreadyNotifiedInRestock = state.decorRestockNotifiedItems.has(decorId);

        const shouldCheck =
          (state.isFirstRun && newQuantity > 0) ||
          (quantityIncreased && !isRestockWindow) ||
          (isRestockWindow && !alreadyNotifiedInRestock) ||
          (oldQuantity === 0 && newQuantity > 0);

        if (shouldCheck) {
          if (updateLastSeen) {
            updateLastSeen(decorId);
          }

          const isWatched = isWatchedItem ? isWatchedItem(decorId, 'decor') : false;

          if (isWatched) {
            const itemKey = `decor_${decorId}`;
            const lastNotified = notifications.lastSeenTimestamps[`notified_${itemKey}`] || 0;
            const canNotify = now - lastNotified > NOTIFICATION_COOLDOWN;

            if (canNotify) {
              if (productionLog) {
                productionLog(`🎉 [NOTIFICATIONS] WATCHED DECOR DETECTED: ${decorId} (${newQuantity} in stock)`);
              }
              notifications.lastSeenTimestamps[`notified_${itemKey}`] = now;

              if (isRestockWindow) {
                state.decorRestockNotifiedItems.add(decorId);
              }

              if (MGA_saveJSON) {
                MGA_saveJSON('MGA_data', UnifiedState.data);
              }

              detectedItems.push({
                type: 'decor',
                id: decorId,
                quantity: newQuantity,
                icon: '🎨'
              });
            }
          }
        }
      });

      if (productionLog) {
        productionLog(`✅ [NOTIFICATIONS] Finished checking all decor`);
      }

      // Update decor inventory and quantities
      state.previousDecorInventory = [...currentDecorIds];
      state.previousDecorQuantities = { ...currentDecorQuantities };
    } catch (decorError) {
      if (consoleObj) {
        consoleObj.error(`❌ [NOTIFICATIONS] Error checking decor:`, decorError);
      }
    }

    // Process batch notifications if any items were detected
    if (detectedItems.length > 0) {
      if (productionLog) {
        productionLog(`🎉 [NOTIFICATIONS] Batch detected: ${detectedItems.length} items`);
      }

      // Play notification sound once for all items
      const volume = UnifiedState?.data?.settings?.notifications?.volume || 0.3;
      if (playShopNotificationSound) {
        playShopNotificationSound(volume);
      }

      // Create notification message based on number of items
      let notificationMessage;
      if (detectedItems.length === 1) {
        const item = detectedItems[0];
        notificationMessage = `${item.icon} Rare ${item.type} in shop: ${item.id}! (${item.quantity} available)`;
      } else {
        notificationMessage = `🎉 Multiple items in stock:\n`;
        detectedItems.forEach(item => {
          notificationMessage += `${item.icon} ${item.id} (${item.quantity} available)\n`;
        });
      }

      // Queue the batch notification
      if (queueNotification) {
        queueNotification(notificationMessage.trim(), notifications.requiresAcknowledgment);
      }
      if (productionLog) {
        productionLog(`📢 [NOTIFICATIONS] Batched notification sent for ${detectedItems.length} items`);
      }
    }

    // Update previous seed inventory and quantities
    state.previousSeedInventory = [...currentSeedIds];
    state.previousSeedQuantities = { ...currentSeedQuantities };

    // Clear first run flag after first check completes
    if (state.isFirstRun) {
      if (productionLog) {
        productionLog(`✅ [NOTIFICATIONS] First run complete - will now only notify on changes`);
      }
      state.isFirstRun = false;
    }
  } catch (error) {
    if (consoleObj) {
      consoleObj.error('❌ [NOTIFICATIONS] Error checking for watched items:', error);
      consoleObj.error('Stack trace:', error.stack);
    }
  }
}

/**
 * Schedule shop refresh with debouncing
 * Debounces shop refresh to prevent multiple rapid refreshes
 *
 * @param {string} type - Shop type that restocked
 * @param {Object} shopValue - Shop data value (unused but kept for compatibility)
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.checkForWatchedItems] - Check watched items function
 * @param {Function} [dependencies.refreshAllShopWindows] - Refresh windows function
 * @param {Function} [dependencies.productionLog] - Production logger
 */
export function scheduleRefresh(type, shopValue, dependencies = {}) {
  const {
    checkForWatchedItems: checkWatchedFn = checkForWatchedItems,
    refreshAllShopWindows: refreshWindowsFn = refreshAllShopWindows,
    productionLog = typeof window !== 'undefined' && window.productionLog
  } = dependencies;

  if (refreshDebounceTimer) {
    clearTimeout(refreshDebounceTimer);
  }

  refreshDebounceTimer = setTimeout(() => {
    if (productionLog) {
      productionLog(`🔄 [SHOP-REFRESH] Refreshing ${type} shop after pattern-based restock detection`);
    }
    if (checkWatchedFn) {
      checkWatchedFn(dependencies);
    }
    if (refreshWindowsFn) {
      refreshWindowsFn(dependencies);
    }
    refreshDebounceTimer = null;
  }, 100);
}

/**
 * Handle egg shop restock detection using pattern analysis
 * Detects egg shop restocks by monitoring timer patterns
 *
 * @param {number} curr - Current secondsUntilRestock value
 * @param {Object} shopValue - Egg shop data
 * @param {Object} dependencies - Injectable dependencies
 * @param {Function} [dependencies.resetLocalPurchases] - Reset purchases function
 * @param {Function} [dependencies.scheduleRefresh] - Schedule refresh function
 * @param {Function} [dependencies.productionLog] - Production logger
 */
export function handleEggRestockDetection(curr, shopValue, dependencies = {}) {
  const {
    resetLocalPurchases: resetPurchasesFn = resetLocalPurchases,
    scheduleRefresh: scheduleRefreshFn = scheduleRefresh,
    productionLog = typeof window !== 'undefined' && window.productionLog
  } = dependencies;

  // First reading
  if (lastEggSeconds === null) {
    lastEggSeconds = curr;
    return;
  }

  // Detect pattern change
  if (curr < lastEggSeconds) {
    // Countdown decreasing normally
    eggWasDecreasing = true;
  } else if (eggWasDecreasing && curr > lastEggSeconds + 2) {
    // Countdown started increasing again after decreasing
    if (productionLog) {
      productionLog('🐣 Egg restock detected (pattern-based jump)', { curr, lastEggSeconds });
    }

    // Reset tracker
    eggWasDecreasing = false;
    lastEggSeconds = curr;

    // Reset local purchase tracking for egg shop
    if (resetPurchasesFn) {
      resetPurchasesFn('egg', dependencies);
    }

    // Trigger refresh safely (debounced)
    if (scheduleRefreshFn) {
      scheduleRefreshFn('egg', shopValue, dependencies);
    }
    return;
  }

  // Keep tracking
  lastEggSeconds = curr;
}

/**
 * Initialize tool shop restock watcher
 * Sets up interval-based monitoring for tool shop restocks
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.setManagedInterval] - Managed interval function
 * @param {Function} [dependencies.resetLocalPurchases] - Reset purchases function
 * @param {Function} [dependencies.scheduleRefresh] - Schedule refresh function
 * @param {Function} [dependencies.productionLog] - Production logger
 */
export function initializeToolRestockWatcher(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    setManagedInterval = typeof window !== 'undefined' && window.setManagedInterval,
    resetLocalPurchases: resetPurchasesFn = resetLocalPurchases,
    scheduleRefresh: scheduleRefreshFn = scheduleRefresh,
    productionLog = typeof window !== 'undefined' && window.productionLog
  } = dependencies;

  if (!setManagedInterval) return;

  let toolWasDecreasing = false;
  let lastToolSeconds = 0;

  setManagedInterval(
    'toolRestockWatch',
    () => {
      const toolShop = targetWindow?.globalShop?.shops?.tool;
      if (!toolShop || !toolShop.secondsUntilRestock) return;

      const curr = toolShop.secondsUntilRestock;

      if (curr < lastToolSeconds) {
        toolWasDecreasing = true;
      } else if (toolWasDecreasing && curr > lastToolSeconds + 2) {
        if (productionLog) {
          productionLog('🔧 Tool restock detected (pattern-based jump)', { curr, lastToolSeconds });
        }
        toolWasDecreasing = false;
        lastToolSeconds = curr;
        if (resetPurchasesFn) {
          resetPurchasesFn('tool', dependencies);
        }
        if (scheduleRefreshFn) {
          scheduleRefreshFn('tool', toolShop, dependencies);
        }
      }

      lastToolSeconds = curr;
    },
    1000
  );
}

/**
 * Initialize shop watcher system
 * Sets up event-driven shop monitoring with restock detection
 *
 * @param {Object} dependencies - Injectable dependencies
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.checkForWatchedItems] - Check watched items function
 * @param {Function} [dependencies.refreshAllShopWindows] - Refresh windows function
 * @param {Function} [dependencies.resetLocalPurchases] - Reset purchases function
 * @param {Function} [dependencies.handleEggRestockDetection] - Egg restock handler
 * @param {Function} [dependencies.productionLog] - Production logger
 * @param {Function} [dependencies.productionWarn] - Production warn logger
 */
export function initializeShopWatcher(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    checkForWatchedItems: checkWatchedFn = checkForWatchedItems,
    refreshAllShopWindows: refreshWindowsFn = refreshAllShopWindows,
    resetLocalPurchases: resetPurchasesFn = resetLocalPurchases,
    handleEggRestockDetection: handleEggRestockFn = handleEggRestockDetection,
    productionLog = typeof window !== 'undefined' && window.productionLog,
    productionWarn = typeof window !== 'undefined' && window.productionWarn
  } = dependencies;

  if (shopWatcherInitialized) return;

  if (productionLog) {
    productionLog('🔄 [SHOP-WATCHER] Initializing event-driven shop monitoring...');
  }

  // Try to find and watch globalShop
  function watchShopData() {
    if (!targetWindow || !targetWindow.globalShop) {
      if (productionWarn) {
        productionWarn('⚠️ [SHOP-WATCHER] globalShop not found, will retry...');
      }
      setTimeout(() => watchShopData(), 5000);
      return;
    }

    if (productionLog) {
      productionLog('✅ [SHOP-WATCHER] Found globalShop, setting up watchers...');
    }

    // Use lightweight restock detection instead of heavy JSON.stringify
    let lastSeedRestock = 0;
    let lastEggRestock = 0;
    let lastDecorRestock = 0;

    setInterval(() => {
      try {
        if (!targetWindow.globalShop || !targetWindow.globalShop.shops) return;

        const shops = targetWindow.globalShop.shops;

        // Lightweight check: only compare secondsUntilRestock (resets to high number on restock)
        if (shops.seed) {
          const currentRestock = shops.seed.secondsUntilRestock || 0;
          if (lastSeedRestock > 100 && currentRestock > lastSeedRestock) {
            // Restock detected (timer reset to high value)
            if (productionLog) {
              productionLog('🔄 [SHOP-WATCHER] Seed shop restocked');
            }
            if (resetPurchasesFn) {
              resetPurchasesFn('seed', dependencies);
            }
            setTimeout(() => {
              if (checkWatchedFn) {
                checkWatchedFn(dependencies);
              }
              if (refreshWindowsFn) {
                refreshWindowsFn(dependencies);
              }
            }, 0);
          }
          lastSeedRestock = currentRestock;
        }

        if (shops.egg) {
          const currentRestock = shops.egg.secondsUntilRestock || 0;

          // Use pattern-based detection for egg shop
          if (typeof currentRestock === 'number' && handleEggRestockFn) {
            handleEggRestockFn(currentRestock, shops.egg, dependencies);
          }

          // Keep the fallback detection too
          if (lastEggRestock > 100 && currentRestock > lastEggRestock) {
            if (productionLog) {
              productionLog('🔄 [SHOP-WATCHER] Egg shop restocked (fallback detection)');
            }
            if (resetPurchasesFn) {
              resetPurchasesFn('egg', dependencies);
            }
            setTimeout(() => {
              if (checkWatchedFn) {
                checkWatchedFn(dependencies);
              }
              if (refreshWindowsFn) {
                refreshWindowsFn(dependencies);
              }
            }, 0);
          }
          lastEggRestock = currentRestock;
        }

        if (shops.decor) {
          const currentRestock = shops.decor.secondsUntilRestock || 0;
          if (lastDecorRestock > 100 && currentRestock > lastDecorRestock) {
            if (productionLog) {
              productionLog('🔄 [SHOP-WATCHER] Decor shop restocked');
            }
            setTimeout(() => {
              if (checkWatchedFn) {
                checkWatchedFn(dependencies);
              }
            }, 0);
          }
          lastDecorRestock = currentRestock;
        }
      } catch (e) {
        // Silent fail
      }
    }, 5000); // Poll every 5 seconds - lightweight check

    if (productionLog) {
      productionLog('✅ [SHOP-WATCHER] Using lightweight restock detection (5s interval)');
    }

    // Also watch for complete globalShop replacement
    const globalShopDescriptor = Object.getOwnPropertyDescriptor(targetWindow, 'globalShop');
    if (!globalShopDescriptor || globalShopDescriptor.configurable !== false) {
      Object.defineProperty(targetWindow, 'globalShop', {
        get() {
          return this._globalShop;
        },
        set(newValue) {
          if (productionLog) {
            productionLog('🔄 [SHOP-WATCHER] globalShop replaced entirely!');
          }
          this._globalShop = newValue;

          // Re-initialize watchers for the new shop
          shopWatcherInitialized = false;
          setTimeout(() => initializeShopWatcher(dependencies), 100);

          // Trigger immediate check
          setTimeout(() => {
            if (checkWatchedFn) {
              checkWatchedFn(dependencies);
            }
          }, 0);
        },
        configurable: true
      });

      // Set initial value
      targetWindow._globalShop = targetWindow.globalShop;
      if (productionLog) {
        productionLog('✅ [SHOP-WATCHER] globalShop setter installed');
      }
    }

    shopWatcherInitialized = true;
  }

  // Start watching
  watchShopData();
}

// ============================================================================
// WRAPPER FUNCTIONS FOR EXTERNAL USE
// ============================================================================

/**
 * Check shop restock - wrapper for checkForWatchedItems
 * Used by interval timer in startIntervals()
 *
 * @param {object} dependencies - Injected dependencies
 * @returns {void}
 */
export function checkShopRestock(dependencies = {}) {
  return checkForWatchedItems(dependencies);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Constants & Utilities
  SHOP_IMAGE_MAP,
  SHOP_COLOR_GROUPS,
  SHOP_RAINBOW_ITEMS,
  SHOP_PRICES,
  SHOP_DISPLAY_NAMES,
  formatShopPrice,
  normalizeShopKey,
  getShopItemColorClass,
  preloadShopImages,
  flashPurchaseFeedback,
  showFloatingMsg,
  // Inventory & Stock Management
  loadPurchaseTracker,
  savePurchaseTracker,
  trackLocalPurchase,
  getLocalPurchaseCount,
  resetLocalPurchases,
  isInventoryFull,
  getInventoryItemCount,
  getItemStackCap,
  flashInventoryFullFeedback,
  getItemStock,
  // Shop Item Elements & Purchase Logic
  isShopDataReady,
  waitForShopData,
  createShopItemElement,
  buyItem,
  // Shop Windows & Overlays
  SEED_SPECIES_SHOP,
  EGG_IDS_SHOP,
  refreshAllShopWindows,
  createShopOverlay,
  createShopSidebar,
  updateInventoryCounters,
  startInventoryCounter,
  stopInventoryCounter,
  toggleShopWindows,
  createShopSidebars,
  createShopWindow,
  makeShopWindowDraggable,
  setupShopWindowHandlers,
  getItemValue,
  // Shop Tab Content
  getShopTabContent,
  setupShopTabHandlers,
  // Shop Monitoring & Restock Detection
  checkForWatchedItems,
  checkShopRestock,
  scheduleRefresh,
  handleEggRestockDetection,
  initializeToolRestockWatcher,
  initializeShopWatcher
};
