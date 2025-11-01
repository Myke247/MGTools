/**
 * Auto-Favorite System
 *
 * Automatically favorites items in inventory based on:
 * - Crop species (e.g., auto-favorite all Bamboo)
 * - Crop mutations (e.g., auto-favorite all Rainbow crops)
 * - Pet abilities (e.g., auto-favorite Gold/Rainbow Granter pets)
 *
 * Features:
 * - Performance optimized (2-second polling interval)
 * - Inventory change detection (only processes when new items added)
 * - Never unfavorites (preserves user manual favorites)
 * - Extensive filtering to prevent accidental favoriting of eggs/tools
 *
 * @module features/auto-favorite
 */

/**
 * Initialize the Auto-Favorite system
 *
 * Sets up interval-based monitoring of inventory changes and auto-favorites
 * items that match configured species, mutations, or pet abilities.
 *
 * Performance: Optimized to poll every 2 seconds (4x less CPU than original 500ms)
 * Only processes when inventory count increases (new items detected)
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.UnifiedState - Global state manager
 * @param {Object} dependencies.targetWindow - Game window object
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 *
 * @example
 * initAutoFavorite({ UnifiedState, targetWindow, productionLog });
 */
export function initAutoFavorite({ UnifiedState, targetWindow, productionLog }) {
  let lastInventoryCount = 0;

  // PERFORMANCE OPTIMIZATION: Increased interval from 500ms to 2000ms
  // Still responsive for new items, but 4x less CPU usage
  setInterval(() => {
    // Early exit if auto-favorite is disabled or no watched items
    if (!UnifiedState.data.settings.autoFavorite.enabled) {
      return;
    }

    const watchedSpecies = UnifiedState.data.settings.autoFavorite.species || [];
    const watchedMutations = UnifiedState.data.settings.autoFavorite.mutations || [];

    // Skip processing if nothing is being watched
    if (watchedSpecies.length === 0 && watchedMutations.length === 0) {
      return;
    }

    if (!targetWindow.myData?.inventory?.items) {
      return;
    }

    const currentCount = targetWindow.myData.inventory.items.length;
    // Only process if inventory count increased (new items added)
    if (currentCount > lastInventoryCount) {
      checkAndFavoriteNewItems({
        inventory: targetWindow.myData.inventory,
        UnifiedState,
        targetWindow,
        productionLog
      });
    }
    lastInventoryCount = currentCount;
  }, 2000); // OPTIMIZED: Every 2 seconds (was 500ms)

  productionLog('🌟 [AUTO-FAVORITE] System initialized - monitoring inventory changes');
}

/**
 * Check inventory for new items and auto-favorite based on configured rules
 *
 * Internal function called when new items are detected in inventory.
 * Processes items and favorites those matching species, mutations, or pet abilities.
 *
 * @param {Object} params - Parameters
 * @param {Object} params.inventory - Player inventory object
 * @param {Object} params.UnifiedState - Global state manager
 * @param {Object} params.targetWindow - Game window object
 * @param {Function} params.productionLog - Logging function
 * @returns {void}
 * @private
 */
function checkAndFavoriteNewItems({ inventory, UnifiedState, targetWindow, productionLog }) {
  if (!inventory?.items) return;

  // DEFENSIVE: Ensure petAbilities array exists (v2.1.0 fix for upgrade path)
  if (!UnifiedState.data.settings.autoFavorite.petAbilities) {
    UnifiedState.data.settings.autoFavorite.petAbilities = [];
  }

  if (
    !UnifiedState.data.settings.autoFavorite.species.length &&
    !UnifiedState.data.settings.autoFavorite.mutations.length &&
    !UnifiedState.data.settings.autoFavorite.petAbilities.length
  )
    return;

  const favoritedIds = new Set(inventory.favoritedItemIds || []);
  const targetSpecies = new Set(UnifiedState.data.settings.autoFavorite.species);
  const targetMutations = new Set(UnifiedState.data.settings.autoFavorite.mutations);
  const targetPetAbilities = new Set(UnifiedState.data.settings.autoFavorite.petAbilities);
  let cropCount = 0;
  let petCount = 0;

  for (const item of inventory.items) {
    if (favoritedIds.has(item.id)) continue; // Already favorited

    // Check if it's a pet
    if (item.itemType === 'Pet') {
      // Check pet mutations for Gold or Rainbow
      const petMutations = item.mutations || [];
      const hasGoldMutation = petMutations.includes('Gold');
      const hasRainbowMutation = petMutations.includes('Rainbow');

      // ALSO check abilities array for granter abilities
      const petAbilities = item.abilities || [];
      const hasGoldGranterAbility = petAbilities.some(a => {
        const abilityStr = typeof a === 'string' ? a : a?.type || a?.abilityType || '';
        return abilityStr.toLowerCase().includes('gold') && abilityStr.toLowerCase().includes('grant');
      });
      const hasRainbowGranterAbility = petAbilities.some(a => {
        const abilityStr = typeof a === 'string' ? a : a?.type || a?.abilityType || '';
        return abilityStr.toLowerCase().includes('rainbow') && abilityStr.toLowerCase().includes('grant');
      });

      const shouldFavorite =
        (targetPetAbilities.has('Gold Granter') && (hasGoldMutation || hasGoldGranterAbility)) ||
        (targetPetAbilities.has('Rainbow Granter') && (hasRainbowMutation || hasRainbowGranterAbility));

      if (shouldFavorite) {
        if (targetWindow.MagicCircle_RoomConnection?.sendMessage) {
          targetWindow.MagicCircle_RoomConnection.sendMessage({
            scopePath: ['Room', 'Quinoa'],
            type: 'ToggleFavoriteItem',
            itemId: item.id
          });
          petCount++;
        }
      }
      continue; // Skip to next item
    }

    // Only auto-favorite crops beyond this point
    if (item.itemType !== 'Produce') continue;

    // CRITICAL: Explicitly exclude eggs and tools - CROPS ONLY
    if (item.itemType === 'Egg' || item.itemType === 'Tool') continue;
    if (item.category === 'Egg' || item.category === 'Tool') continue;
    if (item.species && (item.species.includes('Pet') || item.species.includes('Egg'))) continue;

    // Check if item matches species
    const matchesSpecies = targetSpecies.has(item.species);

    // Check if item matches any mutation
    const itemMutations = item.mutations || [];
    const matchesMutation = itemMutations.some(mut => targetMutations.has(mut));

    if (matchesSpecies || matchesMutation) {
      // Send favorite command
      if (targetWindow.MagicCircle_RoomConnection?.sendMessage) {
        targetWindow.MagicCircle_RoomConnection.sendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: 'ToggleFavoriteItem',
          itemId: item.id
        });
        cropCount++;
      }
    }
  }

  if (cropCount > 0) {
    productionLog(`🌟 [AUTO-FAVORITE] Auto-favorited ${cropCount} new crops`);
  }
  if (petCount > 0) {
    productionLog(`🌟 [AUTO-FAVORITE] Auto-favorited ${petCount} new pets`);
  }
}

/**
 * Favorite all crops of a specific species
 *
 * Called when user checks a species checkbox in settings.
 * Scans entire inventory and favorites all matching crops (excludes pets, eggs, tools).
 *
 * @param {string} speciesName - Name of species to favorite (e.g., "Bamboo")
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.targetWindow - Game window object
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 *
 * @example
 * favoriteSpecies('Bamboo', { targetWindow, productionLog });
 */
export function favoriteSpecies(speciesName, { targetWindow, productionLog }) {
  if (!targetWindow.myData?.inventory?.items) {
    productionLog('🌟 [AUTO-FAVORITE] No myData available yet - waiting for game to load');
    return;
  }

  const items = targetWindow.myData.inventory.items;
  const favoritedIds = new Set(targetWindow.myData.inventory.favoritedItemIds || []);
  let count = 0;

  for (const item of items) {
    // CRITICAL: Multiple checks to ensure ONLY crops are favorited
    if (item.itemType !== 'Produce') continue;
    if (item.itemType === 'Pet' || item.itemType === 'Egg' || item.itemType === 'Tool') continue;
    if (item.category === 'Pet' || item.category === 'Egg' || item.category === 'Tool') continue;
    if (item.species && (item.species.includes('Pet') || item.species.includes('Egg'))) continue;

    if (item.species === speciesName && !favoritedIds.has(item.id)) {
      if (targetWindow.MagicCircle_RoomConnection?.sendMessage) {
        targetWindow.MagicCircle_RoomConnection.sendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: 'ToggleFavoriteItem',
          itemId: item.id
        });
        count++;
      }
    }
  }

  if (count > 0) {
    productionLog(`✅ [AUTO-FAVORITE] Favorited ${count} ${speciesName} crops`);
  } else {
    productionLog(`ℹ️ [AUTO-FAVORITE] No ${speciesName} crops to favorite (already favorited or none in inventory)`);
  }
}

/**
 * Unfavorite species stub - preserves user favorites
 *
 * The Auto-Favorite system NEVER removes favorites to protect user manual choices.
 * This function logs the action but does nothing.
 *
 * @param {string} speciesName - Name of species (unused)
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 */
export function unfavoriteSpecies(speciesName, { productionLog }) {
  productionLog(
    `🔒 [AUTO-FAVORITE] Checkbox unchecked for ${speciesName} - Auto-favorite disabled, but existing favorites are preserved (script never removes favorites)`
  );
  // Do nothing - script only adds favorites, never removes them
  // This protects user's manually-favorited items (pets, eggs, crops, etc.)
}

/**
 * Favorite all crops with a specific mutation
 *
 * Called when user checks a mutation checkbox in settings.
 * Scans entire inventory and favorites all matching crops (excludes pets, eggs, tools).
 *
 * @param {string} mutationName - Name of mutation to favorite (e.g., "Rainbow", "Frozen")
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.targetWindow - Game window object
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 *
 * @example
 * favoriteMutation('Rainbow', { targetWindow, productionLog });
 */
export function favoriteMutation(mutationName, { targetWindow, productionLog }) {
  if (!targetWindow.myData?.inventory?.items) {
    productionLog('🌟 [AUTO-FAVORITE] No myData available yet - waiting for game to load');
    return;
  }

  const items = targetWindow.myData.inventory.items;
  const favoritedIds = new Set(targetWindow.myData.inventory.favoritedItemIds || []);
  let count = 0;

  for (const item of items) {
    // CRITICAL: Multiple checks to ensure ONLY crops are favorited
    if (item.itemType !== 'Produce') continue;
    if (item.itemType === 'Pet' || item.itemType === 'Egg' || item.itemType === 'Tool') continue;
    if (item.category === 'Pet' || item.category === 'Egg' || item.category === 'Tool') continue;
    if (item.species && (item.species.includes('Pet') || item.species.includes('Egg'))) continue;

    const itemMutations = item.mutations || [];
    if (itemMutations.includes(mutationName) && !favoritedIds.has(item.id)) {
      if (targetWindow.MagicCircle_RoomConnection?.sendMessage) {
        targetWindow.MagicCircle_RoomConnection.sendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: 'ToggleFavoriteItem',
          itemId: item.id
        });
        count++;
      }
    }
  }

  if (count > 0) {
    productionLog(`✅ [AUTO-FAVORITE] Favorited ${count} crops with ${mutationName} mutation`);
  } else {
    productionLog(
      `ℹ️ [AUTO-FAVORITE] No crops with ${mutationName} mutation to favorite (already favorited or none in inventory)`
    );
  }
}

/**
 * Unfavorite mutation stub - preserves user favorites
 *
 * The Auto-Favorite system NEVER removes favorites to protect user manual choices.
 * This function logs the action but does nothing.
 *
 * @param {string} mutationName - Name of mutation (unused)
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 */
export function unfavoriteMutation(mutationName, { productionLog }) {
  productionLog(
    `🔒 [AUTO-FAVORITE] Checkbox unchecked for ${mutationName} mutation - Auto-favorite disabled, but existing favorites are preserved (script never removes favorites)`
  );
  // Do nothing - script only adds favorites, never removes them
  // This protects user's manually-favorited items (pets, eggs, crops, etc.)
}

/**
 * Favorite all pets with a specific ability
 *
 * Called when user checks a pet ability checkbox in settings.
 * Scans entire inventory and favorites all pets with Gold Granter or Rainbow Granter abilities.
 *
 * Checks both:
 * - Pet mutations array (includes('Gold') or includes('Rainbow'))
 * - Pet abilities array (contains 'gold'+'grant' or 'rainbow'+'grant')
 *
 * @param {string} abilityName - Ability name ("Gold Granter" or "Rainbow Granter")
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.targetWindow - Game window object
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 *
 * @example
 * favoritePetAbility('Gold Granter', { targetWindow, productionLog });
 */
export function favoritePetAbility(abilityName, { targetWindow, productionLog }) {
  if (!targetWindow.myData?.inventory?.items) {
    productionLog('🌟 [AUTO-FAVORITE-PET] No myData available yet - waiting for game to load');
    return;
  }

  productionLog(`🔍 [AUTO-FAVORITE-PET] Searching for pets with ${abilityName}...`);

  const items = targetWindow.myData.inventory.items;
  const favoritedIds = new Set(targetWindow.myData.inventory.favoritedItemIds || []);
  let count = 0;
  let petsChecked = 0;

  // Debug: Log first pet structure to understand data format
  const firstPet = items.find(i => i.itemType === 'Pet');
  if (firstPet) {
    productionLog('🐾 [AUTO-FAVORITE-PET-DEBUG] Sample pet structure:', {
      species: firstPet.petSpecies,
      mutations: firstPet.mutations,
      abilities: firstPet.abilities,
      hasAbilitiesArray: Array.isArray(firstPet.abilities),
      hasMutationsArray: Array.isArray(firstPet.mutations)
    });
  }

  for (const item of items) {
    if (item.itemType !== 'Pet') continue;
    petsChecked++;

    if (favoritedIds.has(item.id)) continue; // Already favorited

    // Check pet mutations for Gold or Rainbow
    const petMutations = item.mutations || [];
    const hasGoldMutation = petMutations.includes('Gold');
    const hasRainbowMutation = petMutations.includes('Rainbow');

    // ALSO check abilities array for granter abilities
    const petAbilities = item.abilities || [];
    const hasGoldGranterAbility = petAbilities.some(a => {
      const abilityStr = typeof a === 'string' ? a : a?.type || a?.abilityType || '';
      return abilityStr.toLowerCase().includes('gold') && abilityStr.toLowerCase().includes('grant');
    });
    const hasRainbowGranterAbility = petAbilities.some(a => {
      const abilityStr = typeof a === 'string' ? a : a?.type || a?.abilityType || '';
      return abilityStr.toLowerCase().includes('rainbow') && abilityStr.toLowerCase().includes('grant');
    });

    const shouldFavorite =
      (abilityName === 'Gold Granter' && (hasGoldMutation || hasGoldGranterAbility)) ||
      (abilityName === 'Rainbow Granter' && (hasRainbowMutation || hasRainbowGranterAbility));

    if (shouldFavorite) {
      productionLog(
        `✨ [AUTO-FAVORITE-PET] Found matching pet: ${item.petSpecies} (${item.id}) - mutations: [${petMutations.join(', ')}], abilities: ${petAbilities.length}`
      );

      if (targetWindow.MagicCircle_RoomConnection?.sendMessage) {
        targetWindow.MagicCircle_RoomConnection.sendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: 'ToggleFavoriteItem',
          itemId: item.id
        });
        count++;
      }
    }
  }

  productionLog(`✅ [AUTO-FAVORITE-PET] Scanned ${petsChecked} pets, favorited ${count} with ${abilityName}`);
}

/**
 * Unfavorite pet ability stub - preserves user favorites
 *
 * The Auto-Favorite system NEVER removes favorites to protect user manual choices.
 * This function logs the action but does nothing.
 *
 * @param {string} abilityName - Ability name (unused)
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.productionLog - Logging function
 * @returns {void}
 */
export function unfavoritePetAbility(abilityName, { productionLog }) {
  productionLog(
    `🔒 [AUTO-FAVORITE-PET] Checkbox unchecked for ${abilityName} - Auto-favorite disabled, but existing favorites are preserved (script never removes favorites)`
  );
  // Do nothing - script only adds favorites, never removes them
}
