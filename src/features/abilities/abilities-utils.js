/**
 * Abilities Utility Functions
 *
 * Provides utility functions for working with pet ability logs:
 * - Pet and ability extraction from logs
 * - Time formatting for display
 * - Log data formatting
 * - Ability filtering logic
 * - Ability expectations calculation
 *
 * @module features/abilities/abilities-utils
 */

import { categorizeAbilityToFilterKey } from './abilities-data.js';

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 *
 * Converts Unix timestamps to human-readable relative time strings:
 * - Less than 1 minute: "Xs ago"
 * - Less than 1 hour: "Xm ago"
 * - Less than 1 day: "Xh ago"
 * - 1 day or more: Full date (e.g., "10/25/2025")
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.Date] - Date constructor for testing
 * @param {Function} [dependencies.Math] - Math object for testing
 * @returns {string} Formatted relative time string
 *
 * @example
 * formatRelativeTime(Date.now() - 120000); // Returns: "2m ago"
 * formatRelativeTime(Date.now() - 7200000); // Returns: "2h ago"
 */
export function formatRelativeTime(timestamp, dependencies = {}) {
  const {
    Date: DateClass = typeof Date !== 'undefined' ? Date : null,
    Math: MathClass = typeof Math !== 'undefined' ? Math : null
  } = dependencies;

  const now = DateClass.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    // Less than 1 minute
    const seconds = MathClass.floor(diff / 1000);
    return `${seconds}s ago`;
  } else if (diff < 3600000) {
    // Less than 1 hour
    const minutes = MathClass.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    // Less than 1 day
    const hours = MathClass.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    return new DateClass(timestamp).toLocaleDateString();
  }
}

/**
 * Format log data object as comma-separated string
 *
 * Converts log data object to readable string format, truncating if too long.
 * Filters out null/undefined values automatically.
 *
 * @param {object} data - Log data object with key-value pairs
 * @returns {string} Formatted string (max 60 chars with "..." if truncated)
 *
 * @example
 * formatLogData({ petName: 'Fluffy', level: 15 }); // Returns: "petName: Fluffy, level: 15"
 * formatLogData({ very: 'long', text: 'here', more: 'data', keeps: 'going' }); // Returns: "very: long, text: here, more: data, keeps: going..."
 */
export function formatLogData(data) {
  if (!data || typeof data !== 'object') return '';

  const formatted = Object.entries(data)
    .filter(([_key, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return formatted.length > 60 ? formatted.substring(0, 60) + '...' : formatted;
}

/**
 * Get all unique pet names from ability logs
 *
 * Extracts unique pet names from UnifiedState ability logs, sorted alphabetically.
 * Filters out test pets automatically.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state with petAbilityLogs array
 * @returns {string[]} Sorted array of unique pet names
 *
 * @example
 * getAllUniquePets({ UnifiedState }); // Returns: ['Dragon', 'Phoenix', 'Unicorn']
 */
export function getAllUniquePets(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const pets = new Set();
  (UnifiedState?.data?.petAbilityLogs || []).forEach((log) => {
    if (log.petName && log.petName !== 'Test Pet') {
      pets.add(log.petName);
    }
  });
  return Array.from(pets).sort();
}

/**
 * Get all unique ability types from ability logs
 *
 * Extracts unique ability types from UnifiedState ability logs, sorted alphabetically.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state with petAbilityLogs array
 * @returns {string[]} Sorted array of unique ability types
 *
 * @example
 * getAllUniqueAbilities({ UnifiedState }); // Returns: ['Harvesting', 'Sell Boost I', 'XP Boost II']
 */
export function getAllUniqueAbilities(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const abilities = new Set();
  (UnifiedState?.data?.petAbilityLogs || []).forEach((log) => {
    if (log.abilityType) {
      abilities.add(log.abilityType);
    }
  });
  return Array.from(abilities).sort();
}

/**
 * Determine if ability should be logged based on current filter settings
 *
 * Checks if ability should be displayed based on active filter mode:
 * - Categories mode: Filters by ability category (XP, Selling, Harvesting, etc.)
 * - By Pet mode: Filters by pet name
 * - Custom mode: Filters by individual ability type
 *
 * Always filters out Produce/Pet Mutation Boost abilities (user preference).
 *
 * @param {string} abilityType - Ability type to check
 * @param {string|null} petName - Pet name (required for "byPet" mode)
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state with filter settings
 * @returns {boolean} True if ability should be logged, false otherwise
 *
 * @example
 * shouldLogAbility('XP Boost I', 'Dragon', { UnifiedState }); // Returns: true/false based on filters
 */
export function shouldLogAbility(abilityType, petName = null, dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  // Filter out ProduceMutationBoost abilities - user doesn't want these logged
  if (
    abilityType &&
    (abilityType.includes('ProduceMutationBoost') || abilityType.includes('PetMutationBoost'))
  ) {
    return false;
  }

  const mode = UnifiedState?.data?.filterMode || 'categories';

  if (mode === 'custom') {
    return UnifiedState?.data?.customMode?.selectedAbilities?.[abilityType] || false;
  }

  if (mode === 'byPet') {
    if (!petName) return false;
    return UnifiedState?.data?.petFilters?.selectedPets?.[petName] || false;
  }

  // Categories mode - use existing categorizeAbility logic
  const category = categorizeAbilityToFilterKey(abilityType);
  return UnifiedState?.data?.abilityFilters?.[category] || false;
}

/**
 * Calculate expected time savings from pet ability
 *
 * Calculates the expected minutes removed from crop/egg growth time
 * based on active pets with a specific ability. Uses pet level, XP, and
 * target scale to determine effectiveness.
 *
 * Formula considers:
 * - Pet XP progression (up to 30 points)
 * - Pet target scale (scaling multiplier)
 * - Base minutes per activation
 * - Activation odds per minute
 *
 * @param {object[]} activePets - Array of active pet objects
 * @param {string} abilityName - Ability name to calculate for
 * @param {number} [minutesPerBase=5] - Base minutes removed per activation
 * @param {number} [odds=0.27] - Base activation odds (0-1 range)
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.Math] - Math object for calculations
 * @returns {object} Object with expectedMinutesRemoved property
 *
 * @example
 * const pets = [{ hunger: 100, abilities: ['PlantGrowthBoostII'], xp: 50000, targetScale: 1.5 }];
 * getAbilityExpectations(pets, 'PlantGrowthBoostII', 5, 0.27);
 * // Returns: { expectedMinutesRemoved: 2.35 }
 */
export function getAbilityExpectations(
  activePets,
  abilityName,
  minutesPerBase = 5,
  odds = 0.27,
  dependencies = {}
) {
  const { Math: MathClass = typeof Math !== 'undefined' ? Math : null } = dependencies;

  const pets = (activePets || []).filter(
    (p) => p && p.hunger > 0 && p.abilities?.some((a) => a === abilityName)
  );

  let expectedMinutesRemoved = 0;

  pets.forEach((p) => {
    const base =
      MathClass.min(MathClass.floor(((p.xp || 0) / (100 * 3600)) * 30), 30) +
      MathClass.floor((((p.targetScale || 1) - 1) / (2.5 - 1)) * 20 + 80) -
      30;

    expectedMinutesRemoved +=
      (base / 100) *
      minutesPerBase *
      60 *
      (1 - MathClass.pow(1 - (odds * base) / 100, 1 / 60));
  });

  return {
    expectedMinutesRemoved
  };
}
