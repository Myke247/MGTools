/**
 * Shop System Module
 *
 * Comprehensive shop management system for Magic Garden:
 * - Seeds, eggs, tools, and decor shop monitoring
 * - Shop UI windows and overlays (draggable, persistent)
 * - Purchase logic with inventory management
 * - Restock detection and notifications
 * - Watch list integration
 *
 * This module is extracted incrementally across 6 phases:
 *
 * Phase 1 (Complete):
 * - Shop Constants & Utilities - ~246 lines
 *   • SHOP_IMAGE_MAP - Discord CDN URLs for item sprites (~45 lines)
 *   • SHOP_COLOR_GROUPS - Rarity color groupings (~7 lines)
 *   • SHOP_RAINBOW_ITEMS - Celestial seed list (~1 line)
 *   • SHOP_PRICES - Price data for all items (~50 lines)
 *   • SHOP_DISPLAY_NAMES - Human-readable name overrides (~7 lines)
 *   • formatShopPrice() - Format prices with k/m/b notation (~17 lines)
 *   • normalizeShopKey() - Normalize strings for comparison (~5 lines)
 *   • getShopItemColorClass() - Get rarity color class (~24 lines)
 *   • preloadShopImages() - Image preloading for performance (~7 lines)
 *   • flashPurchaseFeedback() - Visual purchase feedback (~75 lines)
 *   • showFloatingMsg() - Floating message helper (~8 lines)
 *
 * Phase 2 (Current):
 * - Inventory & Stock Management - ~363 lines
 *   • localPurchaseTrackerState - Module-level state (~4 lines)
 *   • loadPurchaseTracker() - Load tracker from storage (~27 lines)
 *   • savePurchaseTracker() - Save tracker to storage (~15 lines)
 *   • trackLocalPurchase() - Track item purchase (~20 lines)
 *   • getLocalPurchaseCount() - Get purchase count (~23 lines)
 *   • resetLocalPurchases() - Reset on restock (~24 lines)
 *   • isInventoryFull() - Check 100-slot cap (~10 lines)
 *   • getInventoryItemCount() - Count items in inventory (~18 lines)
 *   • getItemStackCap() - Get stack capacity limits (~13 lines)
 *   • flashInventoryFullFeedback() - Red flash animation (~33 lines)
 *   • getItemStock() - Get current shop stock (~53 lines)
 *
 * Phase 3 (Planned):
 * - Shop Item Elements & Purchase Logic
 *
 * Phase 4 (Planned):
 * - Shop Windows & Overlays
 *
 * Phase 5 (Planned):
 * - Shop Tab Content
 *
 * Phase 6 (Planned):
 * - Shop Monitoring & Restock Detection
 *
 * Total Extracted (Current): ~609 lines (Phase 1-2)
 * Estimated Total: ~2,000-2,500 lines (shop is a major feature comparable to pets)
 * Progress: ~24% complete (2/6 phases)
 *
 * @module features/shop
 */

// ============================================================================
// PHASE 1: SHOP CONSTANTS & UTILITIES
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
// PHASE 3: SHOP ITEM ELEMENTS & PURCHASE LOGIC (PLANNED)
// ============================================================================
// - createShopItemElement()
// - buyItem() (shop window version)
// - buyItem() (settings tab version)
// - isShopDataReady()
// - waitForShopData()

// ============================================================================
// PHASE 4: SHOP WINDOWS & OVERLAYS (PLANNED)
// ============================================================================
// - createShopOverlay()
// - createShopSidebar()
// - toggleShopWindows()
// - createShopSidebars()
// - createShopWindow()
// - makeShopWindowDraggable()
// - setupShopWindowHandlers()
// - refreshAllShopWindows()

// ============================================================================
// PHASE 5: SHOP TAB CONTENT (PLANNED)
// ============================================================================
// - getShopTabContent()
// - setupShopTabHandlers()

// ============================================================================
// PHASE 6: SHOP MONITORING & RESTOCK DETECTION (PLANNED)
// ============================================================================
// - initializeShopWatcher()
// - watchShopData()
// - scheduleRefresh()
// - handleEggRestockDetection()
// - Tool shop restock detection

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Phase 1: Constants & Utilities
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
  // Phase 2: Inventory & Stock Management
  loadPurchaseTracker,
  savePurchaseTracker,
  trackLocalPurchase,
  getLocalPurchaseCount,
  resetLocalPurchases,
  isInventoryFull,
  getInventoryItemCount,
  getItemStackCap,
  flashInventoryFullFeedback,
  getItemStock
  // Phase 3-6: To be added
};
