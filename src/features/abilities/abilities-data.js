/**
 * Abilities Data & Categorization
 *
 * Provides core data structures and categorization logic for pet abilities.
 * This module contains:
 * - Known ability types registry
 * - Ability name normalization
 * - Ability categorization logic
 * - Filter key mapping
 *
 * All functions are pure or have minimal side effects (debug logging only).
 *
 * @module features/abilities/abilities-data
 */

/**
 * Complete list of all known pet ability types in the game
 *
 * Abilities are categorized by their primary effect:
 * - XP Boosts: Increase pet or hatch experience gain
 * - Crop Size Boosts: Increase crop harvest size
 * - Selling: Increase coins from selling crops/pets
 * - Harvesting: Double harvest or auto-harvest abilities
 * - Growth Speed: Accelerate plant or egg growth
 * - Seeds: Seed finding or special mutations
 * - Other: Passive abilities like hunger boost, strength boost
 *
 * @constant {string[]}
 */
export const KNOWN_ABILITY_TYPES = [
  // XP Boosts
  'XP Boost I',
  'XP Boost II',
  'XP Boost III',
  'Hatch XP Boost I',
  'Hatch XP Boost II',

  // Crop Size Boosts
  'Crop Size Boost I',
  'Crop Size Boost II',

  // Selling
  'Sell Boost I',
  'Sell Boost II',
  'Sell Boost III',
  'Coin Finder I',
  'Coin Finder II',

  // Harvesting
  'Harvesting',
  'Auto Harvest',

  // Growth Speed
  'Plant Growth Boost I',
  'Plant Growth Boost II',
  'Plant Growth Boost III',
  'Egg Growth Boost I',
  'Egg Growth Boost II',

  // Seeds
  'Seed Finder I',
  'Seed Finder II',
  'Special Mutations',

  // Other
  'Hunger Boost I',
  'Hunger Boost II',
  'Max Strength Boost I',
  'Max Strength Boost II'
];

/**
 * Normalize ability name for consistency
 *
 * Fixes common formatting issues:
 * - Adds missing spaces before Roman numerals (e.g., "FinderIII" → "Finder III")
 * - Handles renamed abilities (e.g., "Produce Scale Boost" → "Crop Size Boost")
 * - Trims whitespace
 *
 * @param {string} name - Raw ability name from game
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state for debug mode check
 * @param {Function} [dependencies.logDebug] - Debug logging function
 * @returns {string} Normalized ability name
 *
 * @example
 * normalizeAbilityName('FinderIII'); // Returns: "Finder III"
 * normalizeAbilityName('Produce Scale Boost'); // Returns: "Crop Size Boost"
 */
export function normalizeAbilityName(name, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    logDebug = typeof window !== 'undefined' && window.logDebug ? window.logDebug : () => {}
  } = dependencies;

  if (!name || typeof name !== 'string') return name;

  // Fix missing spaces before roman numerals
  const normalized = name
    .replace(/([a-z])III$/i, '$1 III') // "FinderIII" → "Finder III"
    .replace(/([a-z])II$/i, '$1 II') // "FinderII" → "Finder II"
    .replace(/([a-z])I$/i, '$1 I') // "FinderI" → "Finder I"
    .replace(/produce\s*scale\s*boost/gi, 'Crop Size Boost') // Game renamed this ability
    .trim();

  // Log normalization if name was changed
  if (normalized !== name && UnifiedState?.data?.settings?.debugMode) {
    logDebug('ABILITY-LOGS', `📝 Normalized ability name: "${name}" → "${normalized}"`);
  }

  return normalized;
}

/**
 * Check if ability type is in the known abilities list
 *
 * @param {string} abilityType - Ability type to validate
 * @returns {boolean} True if ability is known, false otherwise
 *
 * @example
 * isKnownAbilityType('XP Boost I'); // Returns: true
 * isKnownAbilityType('Unknown Ability'); // Returns: false
 */
export function isKnownAbilityType(abilityType) {
  if (!abilityType) return false;
  return KNOWN_ABILITY_TYPES.includes(abilityType);
}

/**
 * Categorize ability type into display category
 *
 * Maps ability types to visual categories for UI display:
 * - 'xp-boost' → 💫 XP Boost
 * - 'crop-size-boost' → 📈 Crop Size Boost
 * - 'selling' → 💰 Selling
 * - 'harvesting' → 🌾 Harvesting
 * - 'growth-speed' → 🐢 Growth Speed
 * - 'special-mutations' → 🌈✨ Special Mutations
 * - 'other' → 🔧 Other
 *
 * @param {string} abilityType - Ability type to categorize
 * @returns {string} Category slug for UI display
 *
 * @example
 * categorizeAbility('XP Boost II'); // Returns: 'xp-boost'
 * categorizeAbility('Plant Growth Boost I'); // Returns: 'growth-speed'
 * categorizeAbility('Unknown'); // Returns: 'other'
 */
export function categorizeAbility(abilityType) {
  const cleanType = (abilityType || '').toLowerCase();

  // 💫 XP Boost (for pet experience)
  if (cleanType.includes('xp') && cleanType.includes('boost')) {
    return 'xp-boost';
  }
  if (cleanType.includes('hatch') && cleanType.includes('xp')) {
    return 'xp-boost';
  }

  // 📈 Crop Size Boost (for scaling crops)
  if (cleanType.includes('crop') && (cleanType.includes('size') || cleanType.includes('scale'))) {
    return 'crop-size-boost';
  }

  // 💰 Selling (for selling crops/pets)
  if (cleanType.includes('sell') && cleanType.includes('boost')) {
    return 'selling';
  }
  if (cleanType.includes('refund')) {
    return 'selling';
  }

  // 🌾 Harvesting (for harvesting crops)
  if (cleanType.includes('double') && cleanType.includes('harvest')) {
    return 'harvesting';
  }

  // 🐢 Growth Speed (plant and egg growth)
  if (cleanType.includes('growth') && cleanType.includes('boost')) {
    return 'growth-speed';
  }
  if (cleanType.includes('plant') && cleanType.includes('growth')) {
    return 'growth-speed';
  }
  if (cleanType.includes('egg') && cleanType.includes('growth')) {
    return 'growth-speed';
  }

  // 🌈✨ Special Mutations (Rainbow/Gold conversion)
  if (cleanType.includes('rainbow') || cleanType.includes('gold')) {
    return 'special-mutations';
  }

  // 🔧 Other (passive abilities, pet management, etc.)
  return 'other';
}

/**
 * Categorize ability type to filter key for state management
 *
 * Maps ability types to camelCase filter keys used in UnifiedState:
 * - XP abilities → 'xpBoost'
 * - Crop size abilities → 'cropSizeBoost'
 * - Selling abilities → 'selling'
 * - Harvesting abilities → 'harvesting'
 * - Growth abilities → 'growthSpeed'
 * - Special mutations → 'specialMutations'
 * - Other → 'other'
 *
 * Uses caching for performance optimization via MGA_AbilityCache.
 *
 * @param {string} abilityType - Ability type to categorize
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.MGA_AbilityCache] - Cache object for performance
 * @returns {string} Filter key for state management (camelCase)
 *
 * @example
 * categorizeAbilityToFilterKey('XP Boost I'); // Returns: 'xpBoost'
 * categorizeAbilityToFilterKey('Crop Size Boost II'); // Returns: 'cropSizeBoost'
 */
export function categorizeAbilityToFilterKey(abilityType, dependencies = {}) {
  const {
    MGA_AbilityCache = typeof window !== 'undefined' && window.MGA_AbilityCache
  } = dependencies;

  // PERFORMANCE: Check cache first
  if (MGA_AbilityCache && MGA_AbilityCache.categories.has(abilityType)) {
    return MGA_AbilityCache.categories.get(abilityType);
  }

  const cleanType = (abilityType || '').toLowerCase();

  let category = 'other';
  if (cleanType.includes('xp') && cleanType.includes('boost')) category = 'xpBoost';
  else if (cleanType.includes('hatch') && cleanType.includes('xp')) category = 'xpBoost';
  else if (cleanType.includes('crop') && (cleanType.includes('size') || cleanType.includes('scale')))
    category = 'cropSizeBoost';
  else if (cleanType.includes('sell') && cleanType.includes('boost')) category = 'selling';
  else if (cleanType.includes('refund')) category = 'selling';
  else if (cleanType.includes('double') && cleanType.includes('harvest')) category = 'harvesting';
  else if (cleanType.includes('growth') && cleanType.includes('boost')) category = 'growthSpeed';
  else if (cleanType.includes('rainbow') || cleanType.includes('gold')) category = 'specialMutations';

  // PERFORMANCE: Cache result
  if (MGA_AbilityCache) {
    MGA_AbilityCache.categories.set(abilityType, category);
  }

  return category;
}
