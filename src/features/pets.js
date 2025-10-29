/**
 * PET MANAGEMENT MODULE
 * ====================================================================================
 * All pet-related functionality extracted from monolith
 *
 * @module features/pets
 *
 * Phase 1 Extraction (Complete):
 * - Pet Presets (import/export) - ~99 lines
 * - Pet Hunger Monitoring - ~320 lines
 *
 * Phase 2 Extraction (Complete):
 * - Pet Detection & State - ~114 lines
 * - Pet Feeding Logic - ~47 lines
 *
 * Phase 3 Extraction (Complete):
 * - Pet UI Helper Functions - ~291 lines ✅
 * - Pet Event Handlers (setupPetsTabHandlers) - ~377 lines ✅
 * - Pet Tab Content HTML Generators - ~736 lines ✅
 *   • getPetsPopoutContent() - ~127 lines
 *   • setupPetPopoutHandlers() - ~223 lines
 *   • getPetsTabContent() - ~150 lines
 * - Pet Ability Calculation Helpers - ~176 lines ✅
 *   • getTurtleExpectations() - Growth boost calculations
 *   • estimateUntilLatestCrop() - Crop timing with turtle boost
 *   • getAbilityExpectations() - Generic ability calculator
 *   • getEggExpectations() - Egg growth boost
 *   • getGrowthExpectations() - Plant growth boost
 *
 * Phase 4 (Complete):
 * - Auto-Favorite Integration - ~304 lines ✅
 *   • initAutoFavorite() - Main initialization
 *   • favoriteSpecies() - Favorite all crops of a species
 *   • favoriteMutation() - Favorite all crops with mutation
 *   • favoritePetAbility() - Favorite pets with specific abilities
 *   • unfavorite* stubs - Preserve existing favorites
 *
 * Phase 5 (Complete):
 * - Additional Pet Functions - ~485 lines ✅
 *   • playPetNotificationSound() - Sound playback
 *   • placePetPreset() - Load preset with swap logic
 *   • loadPetPreset() - Alternative preset loader
 *   • getAllUniquePets() - Extract unique pet species
 *   • populatePetSpeciesList() - UI population
 *   • shouldLogAbility() - Ability filtering logic
 *   • categorizeAbilityToFilterKey() - Ability categorization
 *   • monitorPetAbilities() - Main ability monitoring (~201 lines)
 *
 * Phase 6 (Complete):
 * - Ability Log Utilities & Supporting Functions - ~273 lines ✅
 *   • getAllUniqueAbilities() - Extract unique abilities
 *   • populateIndividualAbilities() - UI population (~40 lines)
 *   • selectAllFilters() - Select all filters by mode (~26 lines)
 *   • selectNoneFilters() - Deselect all filters by mode (~20 lines)
 *   • exportAbilityLogs() - CSV export (~29 lines)
 *   • loadPresetByNumber() - Load preset by index
 *   • normalizeAbilityName() - Name normalization (~17 lines)
 *   • formatTimestamp() - Timestamp formatting with cache (~33 lines)
 *   • getGardenCropIfUnique() - Unique crop detection (~22 lines)
 *
 * Phase 7 (Complete):
 * - Ability Log Management & Display Helpers - ~129 lines ✅
 *   • KNOWN_ABILITY_TYPES - Constant array (~40 lines)
 *   • isKnownAbilityType() - Ability validation
 *   • initAbilityCache() - Cache initialization (~15 lines)
 *   • MGA_manageLogMemory() - Log archiving (~18 lines)
 *   • MGA_getAllLogs() - Retrieve all logs (~11 lines)
 *   • categorizeAbility() - Alternative categorization (~16 lines)
 *   • formatLogData() - Format log data objects
 *   • formatRelativeTime() - Relative time formatting
 *
 * Phase 8 (Complete):
 * - Display Update Functions - ~316 lines ✅
 *   • updateAbilityLogDisplay() - Main log renderer with styling (~195 lines)
 *   • updateLogVisibility() - CSS-based visibility toggle (~28 lines)
 *   • updateAllLogVisibility() - Visibility orchestrator (~12 lines)
 *   • updateAllAbilityLogDisplays() - Update across all contexts (~66 lines)
 *
 * Phase 9 (Complete):
 * - Instant Feed Core Functions - ~365 lines ✅
 *   • createInstantFeedButton() - Game-native styled feed button (~58 lines)
 *   • flashButton() - Success/error visual feedback (~14 lines)
 *   • handleInstantFeed() - 3-tier fallback feed logic with auto-favorite protection (~293 lines)
 *
 * Phase 10 (Complete):
 * - Instant Feed Initialization & Polling - ~287 lines ✅
 *   • injectInstantFeedButtons() - Container-based button injection (~133 lines)
 *   • initializeInstantFeedButtons() - Polling-based initialization with auto-reinjection (~154 lines)
 *
 * Phase 11 (Complete):
 * - Additional Pet Management Functions - ~415 lines ✅
 *   • presetHasCropEater() - Detect Crop Eater ability in presets (~26 lines)
 *   • cycleToNextPreset() - Cycle through presets, skip Crop Eater (~41 lines)
 *   • playAbilityNotificationSound() - Ability notification sound playback (~51 lines)
 *   • setupAbilitiesTabHandlers() - Ability log tab event handlers (~297 lines)
 *
 * NOTE: Pet Preset UI functions (updatePetPresetDropdown, updateActivePetsDisplay,
 * ensurePresetOrder, movePreset, getDragAfterElement, refreshPresetsList, addPresetToList)
 * were already extracted in Phase 3 above.
 *
 * ✅ PET MODULE EXTRACTION 100% COMPLETE!
 * Total Extracted: ~5,295 lines (exceeded 5,000 estimate by 5.9%)
 * Progress: 100% - All pet-related functionality successfully modularized!
 *
 * Dependencies:
 * - Core: storage, logging
 * - State: UnifiedState (passed as parameter or global)
 * - UI: toast notifications, sound playback
 */

/* ====================================================================================
 * IMPORTS
 * ====================================================================================
 */

// NOTE: These will be available from the global scope when bundled
// In the future, we can import explicitly:
// import { MGA_saveJSON, MGA_loadJSON } from '../core/storage.js';
// import { productionLog } from '../core/logging.js';

/* ====================================================================================
 * PET HUNGER CONSTANTS
 * ====================================================================================
 */

// Species max hunger values from wiki
// Source: https://magicgarden.fandom.com/wiki/Pets
export const SPECIES_MAX_HUNGER = {
  Worm: 500,
  Snail: 1000,
  Bee: 1500,
  Chicken: 3000,
  Bunny: 750,
  Dragonfly: 250,
  Pig: 50000,
  Cow: 25000,
  Turtle: 100000,
  Goat: 20000,
  Squirrel: 15000,
  Capybara: 150000,
  Butterfly: 25000,
  Peacock: 100000
};

// Per-species hunger depletion times (milliseconds from full to 0)
// Source: https://magicgarden.fandom.com/wiki/Pets
export const SPECIES_HUNGER_DEPLETION_TIME = {
  Worm: 30 * 60 * 1000,
  Snail: 60 * 60 * 1000,
  Bee: 15 * 60 * 1000,
  Chicken: 60 * 60 * 1000,
  Bunny: 45 * 60 * 1000,
  Dragonfly: 15 * 60 * 1000,
  Pig: 60 * 60 * 1000,
  Cow: 75 * 60 * 1000,
  Turtle: 90 * 60 * 1000,
  Goat: 60 * 60 * 1000,
  Squirrel: 30 * 60 * 1000,
  Capybara: 60 * 60 * 1000,
  Butterfly: 30 * 60 * 1000,
  Peacock: 60 * 60 * 1000
};

export const HUNGER_BOOST_VALUES = {
  'Hunger Boost I': 0.12, // 12% reduction per 100 STR
  'Hunger Boost II': 0.16 // 16% reduction per 100 STR
};

// Track previous hunger states for each pet
const lastPetHungerStates = {};
const petHungerLastAlertTime = {}; // BUGFIX: Track when we last alerted per pet (timestamp) for time-based throttle

/* ====================================================================================
 * PET PRESETS (IMPORT/EXPORT)
 * ====================================================================================
 */

/**
 * Export pet presets to JSON file
 * @param {Object} UnifiedState - Global state object
 */
export function exportPetPresets(UnifiedState) {
  try {
    const presets = UnifiedState.data.petPresets || {};
    const presetCount = Object.keys(presets).length;

    if (presetCount === 0) {
      alert('⚠️ No pet presets to export!\n\nCreate some presets first.');
      return;
    }

    // Create export object with metadata
    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      presetCount: presetCount,
      presets: presets,
      presetsOrder: UnifiedState.data.petPresetsOrder || []
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mgtools-presets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

    console.log(`✅ [EXPORT] Successfully exported ${presetCount} pet presets`);
    alert(`✅ Exported ${presetCount} pet presets!\n\nFile saved to Downloads folder.`);
  } catch (error) {
    console.error('❌ [EXPORT] Failed to export presets:', error);
    alert(`❌ Export failed!\n\nError: ${error.message}`);
  }
}

/**
 * Import pet presets from JSON file
 * @param {Object} UnifiedState - Global state object
 * @param {Function} MGA_saveJSON - Storage save function
 */
export function importPetPresets(UnifiedState, MGA_saveJSON) {
  try {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async e => {
      try {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate import data
        if (!importData.presets || typeof importData.presets !== 'object') {
          throw new Error('Invalid preset file format');
        }

        const importCount = Object.keys(importData.presets).length;
        const currentCount = Object.keys(UnifiedState.data.petPresets || {}).length;

        // Ask for confirmation
        const confirmed = confirm(
          `📥 Import ${importCount} presets?\n\n` +
            `Current presets: ${currentCount}\n` +
            `Import date: ${importData.exportDate || 'Unknown'}\n` +
            `Version: ${importData.version || 'Unknown'}\n\n` +
            `⚠️ This will OVERWRITE your current presets!`
        );

        if (!confirmed) {
          console.log('⏸️ [IMPORT] User cancelled import');
          return;
        }

        // Perform import
        UnifiedState.data.petPresets = importData.presets;
        UnifiedState.data.petPresetsOrder = importData.presetsOrder || [];

        // Save to storage
        MGA_saveJSON('MGA_petPresets', importData.presets);
        MGA_saveJSON('MGA_petPresetsOrder', importData.presetsOrder || []);

        console.log(`✅ [IMPORT] Successfully imported ${importCount} pet presets`);
        alert(`✅ Imported ${importCount} presets!\n\nPage will reload to apply changes.`);

        // Reload to refresh UI
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('❌ [IMPORT] Failed to import presets:', error);
        alert(
          `❌ Import failed!\n\nError: ${error.message}\n\nMake sure you're importing a valid MGTools preset file.`
        );
      }
    };

    input.click();
  } catch (error) {
    console.error('❌ [IMPORT] Failed to create import dialog:', error);
    alert(`❌ Import failed!\n\nError: ${error.message}`);
  }
}

/* ====================================================================================
 * PET HUNGER MONITORING
 * ====================================================================================
 */

/**
 * Check active pets' hunger levels and alert if below threshold
 * @param {Object} UnifiedState - Global state object
 * @param {Function} playPetNotificationSound - Sound playback function
 * @param {Function} showNotificationToast - Toast notification function
 */
export function checkPetHunger(UnifiedState, playPetNotificationSound, showNotificationToast) {
  if (!UnifiedState.data.settings.notifications.petHungerEnabled) return;

  try {
    // BUGFIX: Use window.activePets which has the REAL atom data with full hunger values
    // UnifiedState.atoms.activePets might be stale or incomplete
    const activePets = window.activePets || UnifiedState.atoms.activePets || [];
    // Threshold is a PERCENTAGE (0-100)
    // Default: 25 = alert when pet drops below 25% full
    const thresholdPercent = UnifiedState.data.settings.notifications.petHungerThreshold || 25;

    activePets.forEach(pet => {
      if (!pet || !pet.id) return;

      // BUGFIX: Check if hunger data exists before processing
      const currentHunger = pet.hunger !== undefined ? Number(pet.hunger) : null;
      if (currentHunger === null || isNaN(currentHunger)) {
        console.log(`⚠️ [PET-HUNGER] ${pet.petSpecies || 'Pet'} has no hunger data - skipping`);
        return; // Skip this pet if no hunger data
      }

      const petName = pet.petSpecies || 'Pet';

      // BUGFIX: Different species have different max hunger values
      // Source: https://magicgarden.fandom.com/wiki/Pets
      // Lower hunger = hungrier (inverse system!)
      const estimatedMaxHunger = SPECIES_MAX_HUNGER[pet.petSpecies] || 100000;

      // Calculate percentage based on species max
      const hungerPercent = (currentHunger / estimatedMaxHunger) * 100;

      // Get previous hunger percentage for comparison
      const lastHunger = lastPetHungerStates[pet.id] ?? currentHunger;
      const lastPercent = (lastHunger / estimatedMaxHunger) * 100;

      // BUGFIX: Time-based throttle instead of boolean flag to allow re-alerting
      const ALERT_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes between alerts
      const now = Date.now();
      const lastAlertTime = petHungerLastAlertTime[pet.id] || 0;
      const timeSinceLastAlert = now - lastAlertTime;

      // Debug logging (only when enabled)
      if (UnifiedState.data.settings?.debugMode) {
        console.log(
          `🐾 [PET-HUNGER-DEBUG] ${petName} (ID: ${pet.id}): ${hungerPercent.toFixed(1)}% (hunger=${currentHunger}/${estimatedMaxHunger}), threshold=${thresholdPercent}%, lastPercent=${lastPercent.toFixed(1)}%, timeSinceLastAlert=${(timeSinceLastAlert / 1000).toFixed(0)}s`
        );
      }

      // Critical thresholds that alert every 1 minute (more urgent than normal 5 min throttle)
      const CRITICAL_THROTTLE_MS = 60 * 1000; // 1 minute for critical alerts
      const isCritical = hungerPercent <= 1;
      const criticalNeedsAlert = isCritical && (timeSinceLastAlert >= CRITICAL_THROTTLE_MS || !lastAlertTime);

      // Alert if below threshold and enough time has passed since last alert
      const needsAlert =
        hungerPercent < thresholdPercent &&
        hungerPercent > 1 &&
        (timeSinceLastAlert >= ALERT_THROTTLE_MS || !lastAlertTime);

      // Also alert if hunger DROPPED below threshold since last check (crossing behavior)
      const justCrossed = hungerPercent < thresholdPercent && lastPercent >= thresholdPercent;

      if (needsAlert || justCrossed || criticalNeedsAlert) {
        const reason = isCritical
          ? 'CRITICAL hunger level'
          : justCrossed
            ? 'crossed threshold'
            : 'below threshold (throttle expired)';
        console.log(
          `🐾 [PET-HUNGER] ${petName} is getting hungry! (${hungerPercent.toFixed(1)}% < ${thresholdPercent}%) - Reason: ${reason}`
        );

        // Play different sound for pet hunger (custom or default)
        const volume = UnifiedState.data.settings.notifications.volume || 0.3;
        playPetNotificationSound(volume);

        // Show visual notification with percentage
        showNotificationToast(`⚠️ ${petName} needs feeding! Only ${Math.round(hungerPercent)}% full`, 'warning');

        // Update last alert timestamp
        petHungerLastAlertTime[pet.id] = now;
      }

      // Reset alert timestamp if pet is fed above threshold (allows immediate alert on next drop)
      if (hungerPercent >= thresholdPercent && lastAlertTime > 0) {
        delete petHungerLastAlertTime[pet.id];
        if (UnifiedState.data.settings?.debugMode) {
          console.log(`🐾 [PET-HUNGER-DEBUG] ${petName} fed above threshold, reset alert timer`);
        }
      }

      // Store hunger value for next comparison
      lastPetHungerStates[pet.id] = currentHunger;
    });
  } catch (error) {
    console.error('❌ [PET-HUNGER] Error checking pet hunger:', error);
  }
}

/**
 * Scan all active pets and alert for any currently below threshold
 * Called when user enables pet hunger alerts
 * @param {Object} UnifiedState - Global state object
 * @param {Function} playPetNotificationSound - Sound playback function
 * @param {Function} showNotificationToast - Toast notification function
 */
export function scanAndAlertHungryPets(UnifiedState, playPetNotificationSound, showNotificationToast) {
  if (!UnifiedState.data.settings.notifications.petHungerEnabled) return;

  try {
    // BUGFIX: Use window.activePets which has the REAL atom data with full hunger values
    const activePets = window.activePets || UnifiedState.atoms.activePets || [];
    const thresholdPercent = UnifiedState.data.settings.notifications.petHungerThreshold || 25;
    const now = Date.now();

    let hungryCount = 0;

    activePets.forEach(pet => {
      if (!pet || !pet.id) return;

      // BUGFIX: Check if hunger data exists before processing
      const currentHunger = pet.hunger !== undefined ? Number(pet.hunger) : null;
      if (currentHunger === null || isNaN(currentHunger)) {
        console.log(`⚠️ [PET-HUNGER] ${pet.petSpecies || 'Pet'} has no hunger data in scan - skipping`);
        return; // Skip this pet if no hunger data
      }

      // BUGFIX: Different species have different max hunger values
      // Source: https://magicgarden.fandom.com/wiki/Pets
      const estimatedMaxHunger = SPECIES_MAX_HUNGER[pet.petSpecies] || 100000;
      const hungerPercent = (currentHunger / estimatedMaxHunger) * 100;
      const petName = pet.petSpecies || 'Pet';

      // Alert for any pet currently below threshold
      if (hungerPercent < thresholdPercent) {
        hungryCount += 1;
        console.log(
          `🐾 [PET-HUNGER] Initial scan: ${petName} needs feeding! (${hungerPercent.toFixed(1)}% < ${thresholdPercent}%)`
        );

        // Show notification for this pet
        showNotificationToast(`⚠️ ${petName} needs feeding! Only ${Math.round(hungerPercent)}% full`, 'warning');

        // Mark with timestamp to enable time-based throttle
        petHungerLastAlertTime[pet.id] = now;
        lastPetHungerStates[pet.id] = currentHunger;
      }
    });

    if (hungryCount > 0) {
      // Play sound once for all hungry pets (custom or default)
      const volume = UnifiedState.data.settings.notifications.volume || 0.3;
      playPetNotificationSound(volume);
      console.log(`🐾 [PET-HUNGER] Initial scan found ${hungryCount} hungry pet(s)`);
    } else {
      console.log(`🐾 [PET-HUNGER] Initial scan: All pets are well-fed`);
    }
  } catch (error) {
    console.error('❌ [PET-HUNGER] Error scanning for hungry pets:', error);
  }
}

/**
 * Calculate time until pet becomes hungry (returns milliseconds)
 * @param {Object} pet - Pet object with hunger, species, abilities
 * @param {Object} UnifiedState - Global state object
 * @returns {number|null} Milliseconds until hungry, or null if no data
 */
export function calculateTimeUntilHungry(pet, UnifiedState) {
  if (!pet || typeof pet.hunger === 'undefined') return null;

  const currentHunger = Number(pet.hunger) || 0;
  const maxHunger = SPECIES_MAX_HUNGER[pet.petSpecies] || 100000;
  const baseDepletionTime = SPECIES_HUNGER_DEPLETION_TIME[pet.petSpecies] || 60 * 60 * 1000;

  // If already hungry, return 0
  if (currentHunger <= 0) return 0;

  // Calculate total hunger reduction from all pets' Hunger Boost abilities
  let totalHungerReduction = 0;
  const activePets = window.activePets || UnifiedState.atoms.activePets || [];

  // DEBUG: Log active pets and their abilities (using console.log to bypass PRODUCTION mode)
  if (UnifiedState.data.settings?.debugMode) {
    console.log('🍖 [HUNGER-CALC] Calculating for pet:', pet.petSpecies);
    console.log('🍖 [HUNGER-CALC] Active pets:', activePets.length);
    activePets.forEach((p, i) => {
      console.log(`🍖 [HUNGER-CALC] Pet ${i}:`, {
        species: p.petSpecies,
        abilities: p.abilities,
        strength: p.strength,
        str: p.str
      });
    });
  }

  activePets.forEach(p => {
    if (p.abilities && Array.isArray(p.abilities)) {
      p.abilities.forEach(ability => {
        if (UnifiedState.data.settings?.debugMode) {
          console.log('🍖 [HUNGER-CALC] Checking ability:', ability);
        }
        // Ability can be either a string directly or an object with properties
        const abilityType = typeof ability === 'string' ? ability : ability.abilityType || ability.type || ability;
        if (typeof abilityType === 'string') {
          // Check for both "Hunger Boost" (with space) and "HungerBoost" (without space)
          if (abilityType.includes('HungerBoost') || abilityType.includes('Hunger Boost')) {
            // Hunger Boost I = 12% per 100 STR, Hunger Boost II = 16% per 100 STR
            const reduction = abilityType.includes('II')
              ? HUNGER_BOOST_VALUES['Hunger Boost II']
              : HUNGER_BOOST_VALUES['Hunger Boost I'];
            const strength = (p.strength || p.str || 100) / 100;
            totalHungerReduction += reduction * strength;

            if (UnifiedState.data.settings?.debugMode) {
              console.log(
                `🍖 [HUNGER-CALC] Found ${abilityType} on ${p.petSpecies}, STR: ${p.strength || p.str}, reduction: ${reduction}, strength mult: ${strength}`
              );
            }
          }
        }
      });
    }
  });

  if (UnifiedState.data.settings?.debugMode && totalHungerReduction > 0) {
    console.log(`🍖 [HUNGER-CALC] Total hunger reduction: ${(totalHungerReduction * 100).toFixed(1)}%`);
  }

  // Cap reduction at 90% to avoid division by zero
  totalHungerReduction = Math.min(totalHungerReduction, 0.9);

  // Calculate time remaining: baseTime / (1 - reductions) * (current/max)
  const timeRemaining = (baseDepletionTime / Math.max(0.1, 1 - totalHungerReduction)) * (currentHunger / maxHunger);

  return Math.max(0, Math.round(timeRemaining));
}

/**
 * Format milliseconds as readable timer string (minutes only)
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
export function formatHungerTimer(milliseconds) {
  if (!milliseconds || milliseconds <= 0) return 'Hungry!';

  const totalMinutes = Math.ceil(milliseconds / (60 * 1000));
  return `${totalMinutes}m`;
}

/* ====================================================================================
 * PET DETECTION & STATE
 * ====================================================================================
 */

/**
 * Get active pets from room state
 * @param {Object} targetWindow - Game window object
 * @param {Object} UnifiedState - Global state object
 * @returns {Array} Array of pet objects
 */
export function getActivePetsFromRoomState(targetWindow, UnifiedState) {
  console.log('🔧 [DEBUG] getActivePetsFromRoomState() called - checking for pets...');
  try {
    // CORRECT path: Get the actual atom value that console shows
    const roomState = targetWindow.MagicCircle_RoomConnection?.lastRoomStateJsonable;
    if (!roomState?.child?.data) {
      console.log('🐾 [SIMPLE-PETS] No room state data');
      return [];
    }

    // Try multiple data sources in priority order
    let petData = null;

    // Source 1: Check if pet data is directly in child.data (field1, field2, field3 format)
    if (roomState.child.data.field1 !== undefined) {
      petData = roomState.child.data;
      console.log('🐾 [SIMPLE-PETS] Found pet data in child.data directly');
    }

    if (!petData) {
      if (UnifiedState.data.settings?.debugMode) {
        console.log('🐾 [SIMPLE-PETS] No pet data found in room state');
      }

      // FALLBACK: Use atom data if available
      if (window.activePets && window.activePets.length > 0) {
        if (UnifiedState.data.settings?.debugMode) {
          console.log('🐾 [FALLBACK] Using pets from myPetSlotsAtom:', window.activePets);
        }
        return window.activePets;
      }

      if (UnifiedState.data.settings?.debugMode) {
        console.log('🐾 [SIMPLE-PETS] No pet data found in room state or atoms');
      }
      return [];
    }

    // Extract pets from field1, field2, field3 format (the actual console format)
    const pets = [];
    const fields = [petData.field1, petData.field2, petData.field3];
    fields.forEach((species, index) => {
      if (species && species !== '' && typeof species === 'string') {
        pets.push({ petSpecies: species, slot: index + 1 });
      }
    });

    console.log('🐾 [SIMPLE-PETS] Extracted pets:', pets);
    return pets;
  } catch (error) {
    console.log('🐾 [SIMPLE-PETS] Error:', error.message);
    return [];
  }
}

/**
 * Update active pets from room state
 * @param {Object} targetWindow - Game window object
 * @param {Object} UnifiedState - Global state object
 * @param {Function} updateActivePetsDisplay - Optional UI update function
 * @returns {Array} Updated pet array
 */
export function updateActivePetsFromRoomState(targetWindow, UnifiedState, updateActivePetsDisplay = null) {
  const roomPets = getActivePetsFromRoomState(targetWindow, UnifiedState);
  const previousCount = UnifiedState.atoms.activePets?.length || 0;

  // CRITICAL BUGFIX: Don't overwrite if we already have better data from atom hook
  // The atom gives us FULL pet data with hunger, abilities, etc.
  // Room state only gives us petSpecies and slot - incomplete data!
  if (
    window.activePets &&
    window.activePets.length > 0 &&
    window.activePets[0] &&
    window.activePets[0].hunger !== undefined
  ) {
    // We have full atom data with hunger - preserve it!
    console.log('🐾 [SIMPLE-PETS] Preserving existing full pet data from atom (has hunger)');

    // Only update species info if it's missing
    roomPets.forEach((roomPet, index) => {
      if (window.activePets[index] && !window.activePets[index].petSpecies && roomPet.petSpecies) {
        window.activePets[index].petSpecies = roomPet.petSpecies;
        console.log(`🐾 [SIMPLE-PETS] Added missing species ${roomPet.petSpecies} to slot ${index + 1}`);
      }
    });

    UnifiedState.atoms.activePets = window.activePets;
    return window.activePets; // Return the good data
  }

  // Only use room state data if we have NO atom data or it's incomplete
  UnifiedState.atoms.activePets = roomPets;
  window.activePets = roomPets; // Expose globally for debugging

  const newCount = roomPets.length;
  if (newCount !== previousCount) {
    console.log(`🐾 [SIMPLE-PETS] Pet count changed: ${previousCount} → ${newCount}`);

    // Update UI if pets tab is active and function provided
    if (UnifiedState.activeTab === 'pets' && updateActivePetsDisplay) {
      const context = document.getElementById('mga-tab-content');
      if (context) {
        updateActivePetsDisplay(context);
      }
    }
  }

  return roomPets;
}

/* ====================================================================================
 * PET FEEDING
 * ====================================================================================
 */

/**
 * Send feed pet command to server
 * @param {string} petItemId - Pet item ID
 * @param {string} cropItemId - Crop/food item ID
 * @param {Function} rcSend - Room connection send function
 * @returns {Promise} Send result
 */
export async function sendFeedPet(petItemId, cropItemId, rcSend) {
  const payload = {
    type: 'FeedPet',
    petItemId: petItemId,
    cropItemId: cropItemId
  };
  console.log('[MGA] Feed payload:', payload);
  return rcSend(payload);
}

/**
 * Feed pet with server event verification
 * @param {string} petItemId - Pet item ID
 * @param {string} cropItemId - Crop/food item ID
 * @param {number} petIndex - Pet slot index
 * @param {Function} rcSend - Room connection send function
 * @param {Function} waitForServer - Server event waiter function
 * @param {boolean} enableDebugPeek - Enable debug message peeking
 * @returns {Promise<Object>} Verification result {verified: boolean}
 */
export async function feedPetEnsureSync(
  petItemId,
  cropItemId,
  petIndex,
  rcSend,
  waitForServer,
  _enableDebugPeek = false
) {
  // Predicate matching server events that confirm feed success
  const makePredicate =
    ({ payload }) =>
    msg => {
      if (!msg || typeof msg !== 'object') return false;

      // Option A: Explicit ack with matching petItemId
      if (msg.type === 'FeedPetAck' && msg.ok && msg.petItemId === payload.petItemId) {
        return true;
      }

      // Option B: Domain event (PetFed)
      if (msg.type === 'PetFed' && msg.petItemId === payload.petItemId) {
        return true;
      }

      // Option C: InventoryDelta removing the crop
      if (msg.type === 'InventoryDelta' && msg.removed) {
        if (Array.isArray(msg.removed)) {
          return msg.removed.some(r => r.id === payload.cropItemId || r === payload.cropItemId);
        }
      }

      // Fallback: Check if message JSON contains our IDs (less precise)
      const msgStr = JSON.stringify(msg);
      if (msgStr.includes(payload.petItemId) && msgStr.includes(payload.cropItemId)) {
        console.log('[Feed-Verify] 🔍 Fallback match on IDs in:', msg.type || 'unknown');
        return true;
      }

      return false;
    };

  console.log('[Feed-Debug] 🚀 Sending feed command');
  await sendFeedPet(petItemId, cropItemId, rcSend);

  const ack = await waitForServer(makePredicate({ type: 'FeedPet', payload: { petItemId, cropItemId } })).catch(
    () => null
  );

  if (ack) {
    console.log('[Feed-Verify] ✅ verified by server event');
    return { verified: true };
  }

  console.warn('[Feed-Verify] ❌ no ack/delta in timeout period');
  return { verified: false };
}

/* ====================================================================================
 * PET UI HELPERS (PHASE 3)
 * ====================================================================================
 */

/**
 * Update pet preset dropdown without full refresh
 * @param {Element} context - DOM context
 * @param {Object} UnifiedState - Global state object
 * @param {Document} targetDocument - Target document
 */
export function updatePetPresetDropdown(context, UnifiedState, targetDocument) {
  const select = context.querySelector('#preset-quick-select');
  if (!select) return;

  // Preserve current selection
  const currentValue = select.value;

  // Clear existing options except the first one
  select.innerHTML = '<option value="">-- Select Preset --</option>';

  // Add all presets
  Object.keys(UnifiedState.data.petPresets).forEach(name => {
    const preset = UnifiedState.data.petPresets[name];
    const option = targetDocument.createElement('option');
    option.value = name;
    option.textContent = `${name} (${preset.map(p => p.petSpecies).join(', ')})`;
    select.appendChild(option);
  });

  // Restore selection if it still exists
  if (currentValue && UnifiedState.data.petPresets[currentValue]) {
    select.value = currentValue;
  }

  if (UnifiedState.data.settings?.debugMode) {
    console.log('[PETS_UI] Updated preset dropdown without full refresh');
  }
}

/**
 * Update active pets display with retry logic
 * @param {Element} context - DOM context
 * @param {Object} UnifiedState - Global state object
 * @param {Function} calculateTimeUntilHungry - Hunger calculation function
 * @param {Function} formatHungerTimer - Timer formatting function
 * @param {number} retryCount - Retry counter
 */
export function updateActivePetsDisplay(
  context,
  UnifiedState,
  calculateTimeUntilHungry,
  formatHungerTimer,
  retryCount = 0
) {
  // Only log in debug mode to reduce console spam
  if (UnifiedState.data.settings?.debugMode) {
    console.log('🐾 [ACTIVE-PETS] Updating display', {
      retryCount,
      unifiedStateActivePets: UnifiedState.atoms.activePets?.length || 0,
      windowActivePets: window.activePets?.length || 0,
      context: context === document ? 'document' : 'overlay'
    });
  }

  // Try multiple sources for pet data (React timing issue workaround)
  const activePets = UnifiedState.atoms.activePets || window.activePets || [];

  // If no pets found and this is first try, wait and retry (DOM timing fix)
  if (activePets.length === 0 && retryCount < 3) {
    if (UnifiedState.data.settings?.debugMode) {
      console.log(`🐾 [ACTIVE-PETS] No pets found, retrying in ${100 * (retryCount + 1)}ms...`);
    }
    setTimeout(
      () => updateActivePetsDisplay(context, UnifiedState, calculateTimeUntilHungry, formatHungerTimer, retryCount + 1),
      100 * (retryCount + 1)
    );
    return;
  }

  // Find all Active Pets display elements in the given context
  const activePetsDisplays = context.querySelectorAll('.mga-active-pets-display');

  activePetsDisplays.forEach(display => {
    const innerHTML =
      activePets.length > 0
        ? `
              <div class="mga-active-pets-header">Currently Equipped:</div>
              <div class="mga-active-pets-list">
                  ${activePets
                    .map((p, index) => {
                      const timeUntilHungry = calculateTimeUntilHungry(p, UnifiedState);
                      const timerText = formatHungerTimer(timeUntilHungry);
                      const timerColor =
                        timeUntilHungry === null
                          ? '#999'
                          : timeUntilHungry <= 0
                            ? '#8B0000'
                            : timeUntilHungry < 5 * 60 * 1000
                              ? '#ff4444'
                              : timeUntilHungry < 15 * 60 * 1000
                                ? '#ffa500'
                                : '#4caf50';
                      return `
                          <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                              <span class="mga-pet-badge">${p.petSpecies}</span>
                              <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                          </div>
                      `;
                    })
                    .join('')}
              </div>
          `
        : `
              <div class="mga-empty-state">
                  <div class="mga-empty-state-icon">—</div>
                  <div class="mga-empty-state-description">No pets currently active</div>
              </div>
          `;

    display.innerHTML = innerHTML;
  });

  if (UnifiedState.data.settings?.debugMode) {
    console.log('🐾 [ACTIVE-PETS] Updated display elements:', {
      elementsFound: activePetsDisplays.length,
      activePetsCount: activePets.length
    });
  }
}

/**
 * Initialize preset order array if not exists
 * @param {Object} UnifiedState - Global state object
 */
export function ensurePresetOrder(UnifiedState) {
  if (!UnifiedState.data.petPresetsOrder || !Array.isArray(UnifiedState.data.petPresetsOrder)) {
    UnifiedState.data.petPresetsOrder = Object.keys(UnifiedState.data.petPresets);
  } else {
    // Ensure all existing presets are in the order array
    Object.keys(UnifiedState.data.petPresets).forEach(name => {
      if (!UnifiedState.data.petPresetsOrder.includes(name)) {
        UnifiedState.data.petPresetsOrder.push(name);
      }
    });
    // Remove any presets from order array that no longer exist
    UnifiedState.data.petPresetsOrder = UnifiedState.data.petPresetsOrder.filter(name =>
      Object.prototype.hasOwnProperty.call(UnifiedState.data.petPresets, name)
    );
  }
}

/**
 * Move preset up or down in the order
 * @param {string} presetName - Preset name
 * @param {string} direction - 'up' or 'down'
 * @param {Element} context - DOM context
 * @param {Object} UnifiedState - Global state object
 * @param {Function} MGA_saveJSON - Storage save function
 * @param {Function} refreshPresetsList - Refresh list function
 * @param {Function} refreshSeparateWindowPopouts - Refresh popouts function
 * @param {Function} updateTabContent - Update tab content function
 */
export function movePreset(
  presetName,
  direction,
  context,
  UnifiedState,
  MGA_saveJSON,
  refreshPresetsList,
  refreshSeparateWindowPopouts,
  updateTabContent
) {
  console.log(`🚨 [CRITICAL] movePreset called: ${presetName} ${direction}`);
  console.log(`🚨 [CRITICAL] Current order:`, UnifiedState.data.petPresetsOrder);
  ensurePresetOrder(UnifiedState);
  const currentIndex = UnifiedState.data.petPresetsOrder.indexOf(presetName);

  if (currentIndex === -1) return;

  let newIndex;
  if (direction === 'up' && currentIndex > 0) {
    newIndex = currentIndex - 1;
  } else if (direction === 'down' && currentIndex < UnifiedState.data.petPresetsOrder.length - 1) {
    newIndex = currentIndex + 1;
  } else {
    return; // Can't move
  }

  // Swap elements
  const temp = UnifiedState.data.petPresetsOrder[currentIndex];
  UnifiedState.data.petPresetsOrder[currentIndex] = UnifiedState.data.petPresetsOrder[newIndex];
  UnifiedState.data.petPresetsOrder[newIndex] = temp;

  // Save the new order
  MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);

  // Force UI refresh after reorder
  console.log(`🚨 [CRITICAL] Order after swap:`, UnifiedState.data.petPresetsOrder);

  // Refresh the preset list display
  refreshPresetsList(context, UnifiedState, MGA_saveJSON);

  // Refresh popout windows
  refreshSeparateWindowPopouts('pets');

  // Also update main tab content if needed
  if (UnifiedState.activeTab === 'pets') {
    updateTabContent();
  }

  console.log(`📋 [PET-PRESETS] Moved preset "${presetName}" ${direction}`);
}

/**
 * Helper function for drag and drop positioning
 * @param {Element} container - Container element
 * @param {number} y - Y coordinate
 * @returns {Element} Element after which to insert
 */
export function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.mga-preset:not(.dragging)')];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

/**
 * Refresh the presets list with new order
 * @param {Element} context - DOM context
 * @param {Object} UnifiedState - Global state object
 * @param {Function} MGA_saveJSON - Storage save function
 */
export function refreshPresetsList(context, UnifiedState, MGA_saveJSON) {
  const presetsList = context.querySelector('#presets-list');
  if (!presetsList) return;

  // Clear current list
  presetsList.innerHTML = '';

  // Re-add presets in order
  ensurePresetOrder(UnifiedState);
  UnifiedState.data.petPresetsOrder.forEach(name => {
    if (UnifiedState.data.petPresets[name]) {
      addPresetToList(context, name, UnifiedState.data.petPresets[name], UnifiedState, MGA_saveJSON);
    }
  });
}

/**
 * Add preset to list with event handlers
 * @param {Element} context - DOM context
 * @param {string} name - Preset name
 * @param {Array} preset - Preset pets array
 * @param {Object} UnifiedState - Global state object
 * @param {Function} _MGA_saveJSON - Storage save function (unused, reserved for future)
 */
export function addPresetToList(context, name, preset, UnifiedState, _MGA_saveJSON) {
  const presetsList = context.querySelector('#presets-list');
  if (!presetsList) return;

  const targetDocument = context.ownerDocument || document;

  // Create new preset element
  const presetDiv = targetDocument.createElement('div');
  presetDiv.className = 'mga-preset';
  presetDiv.draggable = true;
  presetDiv.dataset.presetName = name;
  const hotkey = UnifiedState.data.petPresetHotkeys[name];
  presetDiv.innerHTML = `
          <div class="mga-preset-header" style="cursor: move;">
              <span class="mga-preset-name">⋮⋮ ${name}</span>
              <button class="mga-hotkey-btn" data-preset="${name}" style="margin-left: auto; padding: 2px 8px; font-size: 11px; background: rgba(100, 200, 255, 0.48); border: 1px solid #4a9eff; border-radius: 4px; color: white; cursor: pointer;">
                  ${hotkey || 'Set Hotkey'}
              </button>
          </div>
          <div class="mga-preset-pets">${preset.map(p => p.petSpecies).join(', ')}</div>
          <div class="mga-preset-actions">
              <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                  <button class="mga-btn mga-btn-sm" data-action="move-up" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↑</button>
                  <button class="mga-btn mga-btn-sm" data-action="move-down" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↓</button>
                  <button class="mga-btn mga-btn-sm" data-action="save" data-preset="${name}">Save Current</button>
              </div>
              <div style="display: flex; gap: 4px;">
                  <button class="mga-btn mga-btn-sm" data-action="place" data-preset="${name}">Place</button>
                  <button class="mga-btn mga-btn-sm" data-action="remove" data-preset="${name}">Remove</button>
              </div>
          </div>
      `;

  // Note: Drag handlers and event handlers would need to be set up by the calling code
  // They require additional dependencies (showHotkeyRecordingModal, updatePetPresetDropdown, etc.)

  presetsList.appendChild(presetDiv);
  if (UnifiedState.data.settings?.debugMode) {
    console.log(`[PETS_UI] Added preset ${name} to list without full refresh`);
  }
}

/**
 * Setup event handlers for the pets tab
 * NOTE: This is a complex function with many dependencies - extracted from monolith
 * Dependencies are passed as parameters for modularity
 *
 * @param {Element} context - DOM context for event binding
 * @param {Object} deps - Dependencies object containing:
 *   - UnifiedState: Global state
 *   - MGA_saveJSON: Storage save function
 *   - targetDocument: Document object
 *   - movePreset: Move preset function
 *   - refreshPresetsList: Refresh list function
 *   - updatePetPresetDropdown: Update dropdown function
 *   - updateActivePetsDisplay: Update display function
 *   - refreshSeparateWindowPopouts: Refresh popouts function
 *   - showHotkeyRecordingModal: Hotkey modal function
 *   - safeSendMessage: Message sending function
 *   - updateActivePetsFromRoomState: Update from room state function
 *   - updatePureOverlayContent: Update overlay function
 *   - startRecordingHotkeyMGTools: Start hotkey recording function
 *   - MGA_safeSave: Safe save function
 *   - window.debouncedPlacePetPreset: Debounced place function
 *   - exportPetPresets: Export function
 *   - importPetPresets: Import function
 */
export function setupPetsTabHandlers(context, deps) {
  const {
    UnifiedState,
    MGA_saveJSON,
    targetDocument,
    movePreset,
    refreshPresetsList,
    updatePetPresetDropdown,
    refreshSeparateWindowPopouts,
    showHotkeyRecordingModal,
    safeSendMessage,
    updateActivePetsFromRoomState,
    updateActivePetsDisplay: updateActivePetsDisplayFn,
    updatePureOverlayContent,
    startRecordingHotkeyMGTools,
    debouncedPlacePetPreset,
    calculateTimeUntilHungry,
    formatHungerTimer,
    exportPetPresets: exportPetPresetsFn,
    importPetPresets: importPetPresetsFn
  } = deps;

  console.log('🚨 [CRITICAL] Setting up pet preset handlers');

  // Use event delegation on the parent container for all preset buttons
  const presetsContainer = context.querySelector('#presets-list');
  if (presetsContainer) {
    console.log('🚨 [CRITICAL] Found presets container, adding delegation');

    // Remove old listener if it exists
    if (presetsContainer._mgaClickHandler) {
      presetsContainer.removeEventListener('click', presetsContainer._mgaClickHandler);
    }

    // Create new handler
    presetsContainer._mgaClickHandler = e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const action = btn.dataset.action;
      const presetName = btn.dataset.preset;

      console.log(`🚨 [CRITICAL] Delegated click: action=${action}, preset=${presetName}`);

      if (action === 'move-up') {
        console.log(`🚨 [CRITICAL] Moving ${presetName} UP`);
        movePreset(
          presetName,
          'up',
          context,
          UnifiedState,
          MGA_saveJSON,
          refreshPresetsList,
          refreshSeparateWindowPopouts,
          () => {}
        );
      } else if (action === 'move-down') {
        console.log(`🚨 [CRITICAL] Moving ${presetName} DOWN`);
        movePreset(
          presetName,
          'down',
          context,
          UnifiedState,
          MGA_saveJSON,
          refreshPresetsList,
          refreshSeparateWindowPopouts,
          () => {}
        );
      } else if (action === 'save') {
        console.log(`🚨 [CRITICAL] Saving preset ${presetName}`);
        UnifiedState.data.petPresets[presetName] = (UnifiedState.atoms.activePets || []).slice(0, 3);
        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        refreshPresetsList(context, UnifiedState, MGA_saveJSON);
      } else if (action === 'place') {
        console.log(`🚨 [CRITICAL] Placing preset ${presetName}`);
        debouncedPlacePetPreset(presetName);
      } else if (action === 'remove') {
        console.log(`[CRITICAL] Removing preset ${presetName}`);
        delete UnifiedState.data.petPresets[presetName];

        // Clean up associated hotkey if it exists
        if (UnifiedState.data.petPresetHotkeys[presetName]) {
          const deletedHotkey = UnifiedState.data.petPresetHotkeys[presetName];
          delete UnifiedState.data.petPresetHotkeys[presetName];
          MGA_saveJSON('MGA_petPresetHotkeys', UnifiedState.data.petPresetHotkeys);
          console.log(`[MGTOOLS] Cleared hotkey "${deletedHotkey}" for deleted preset: ${presetName}`);
        }

        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        refreshPresetsList(context, UnifiedState, MGA_saveJSON);
      }
    };

    // Add the handler
    presetsContainer.addEventListener('click', presetsContainer._mgaClickHandler);
    console.log('🚨 [CRITICAL] Event delegation handler attached successfully');

    // Handle hotkey button clicks
    context.querySelectorAll('.mga-hotkey-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const presetName = btn.dataset.preset;
        showHotkeyRecordingModal(presetName, context);
      });
    });
  } else {
    console.log('🚨 [CRITICAL] ERROR: presets container not found!');
  }

  const input = context.querySelector('#preset-name-input');
  if (input) {
    // Comprehensive input isolation to prevent game key interference
    let handlingEvent = false;

    // Create input isolation system
    const createInputIsolation = function (inputElement) {
      // Prevent ALL game key interference when input is focused
      const isolateKeyEvent = e => {
        if (document.activeElement === inputElement) {
          // Stop all propagation to prevent game from receiving keys
          e.stopImmediatePropagation();
          e.stopPropagation();

          // Handle special keys
          if (e.key === 'Escape') {
            e.preventDefault();
            inputElement.blur(); // Allow user to return to game
            return;
          }

          // Allow Enter to submit
          if (e.key === 'Enter') {
            e.preventDefault();
            const addBtn = context.querySelector('#add-preset-btn');
            if (addBtn) addBtn.click();
            return;
          }

          // For other keys, let the input handle them naturally
          // but prevent game from seeing them
        }
      };

      // Capture ALL key events before they reach the game
      ['keydown', 'keyup', 'keypress'].forEach(eventType => {
        inputElement.addEventListener(eventType, isolateKeyEvent, {
          capture: true,
          passive: false
        });
      });

      // Also isolate focus/blur events
      inputElement.addEventListener('focus', e => {
        if (UnifiedState.data.settings.debugMode) {
          console.log('🔒 Input focused - Game keys isolated');
        }
        e.stopPropagation();
      });

      inputElement.addEventListener('blur', e => {
        if (UnifiedState.data.settings.debugMode) {
          console.log('🔓 Input blurred - Game keys restored');
        }
        e.stopPropagation();
      });
    };

    // Apply input isolation
    createInputIsolation(input);

    // Existing click handlers with improved event handling
    input.addEventListener('mousedown', e => {
      if (handlingEvent) return;
      handlingEvent = true;
      e.stopPropagation();

      setTimeout(() => {
        handlingEvent = false;
      }, 50);
    });

    input.addEventListener('click', e => {
      if (handlingEvent) return;
      e.stopPropagation();

      // Only select all if the input is empty or user clicked when not focused
      if (input.value === '' || document.activeElement !== input) {
        setTimeout(() => {
          input.focus();
          input.select();
        }, 0);
      }
    });
  }

  // Cycle Presets Hotkey Button Handler
  const setCycleHotkeyBtn = context.querySelector('#set-cycle-hotkey-btn');
  if (setCycleHotkeyBtn && !setCycleHotkeyBtn.hasAttribute('data-handler-setup')) {
    setCycleHotkeyBtn.setAttribute('data-handler-setup', 'true');
    setCycleHotkeyBtn.addEventListener('click', () => {
      startRecordingHotkeyMGTools('cyclePresets', setCycleHotkeyBtn);
    });
  }

  // Quick Load Button Handler
  const quickLoadBtn = context.querySelector('#quick-load-btn');
  if (quickLoadBtn && !quickLoadBtn.hasAttribute('data-handler-setup')) {
    quickLoadBtn.setAttribute('data-handler-setup', 'true');
    quickLoadBtn.addEventListener('click', () => {
      const select = context.querySelector('#preset-quick-select');
      const presetName = select.value;

      if (!presetName) {
        console.warn('[PETS] No preset selected');
        return;
      }

      if (!UnifiedState.data.petPresets[presetName]) {
        console.warn('[PETS] Preset not found:', presetName);
        return;
      }

      const preset = UnifiedState.data.petPresets[presetName];

      // Validate preset
      if (!preset || !Array.isArray(preset) || preset.length === 0) {
        console.warn('[PETS] Preset is empty or invalid:', preset);
        return;
      }

      const maxSlots = 3;

      // Native swap approach - works even with full inventory!
      let delay = 0;

      for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
        const desiredPet = preset[slotIndex];

        // BUGFIX: Capture delay value in closure to prevent race conditions
        ((currentDelay, slot) => {
          setTimeout(() => {
            // BUGFIX: Read FRESH state inside timeout (not stale reference)
            const currentPets = UnifiedState.atoms.activePets || window.activePets || [];
            const currentPet = currentPets[slot];

            if (currentPet && desiredPet) {
              // Check if desired pet is already equipped
              if (currentPet.id === desiredPet.id) {
                if (UnifiedState.data.settings?.debugMode) {
                  console.log(`[PET-SWAP] Slot ${slot + 1}: Already equipped (${currentPet.id}), skipping`);
                }
                return; // Skip swap, pet already in place
              }

              // Both exist: Use native SwapPet (no inventory space needed!)
              if (UnifiedState.data.settings?.debugMode) {
                console.log(`[PET-SWAP] Slot ${slot + 1}: Swapping ${currentPet.id} → ${desiredPet.id}`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'SwapPet',
                petSlotId: currentPet.id,
                petInventoryId: desiredPet.id
              });
            } else if (!currentPet && desiredPet) {
              // Empty slot: Place new pet
              if (UnifiedState.data.settings?.debugMode) {
                console.log(`[PET-SWAP] Slot ${slot + 1}: Placing ${desiredPet.id} (empty slot)`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'PlacePet',
                itemId: desiredPet.id,
                position: { x: 17 + slot * 2, y: 13 },
                localTileIndex: 64,
                tileType: 'Boardwalk'
              });
            } else if (currentPet && !desiredPet) {
              // Remove excess pet (preset has fewer pets)
              if (UnifiedState.data.settings?.debugMode) {
                console.log(`[PET-SWAP] Slot ${slot + 1}: Storing ${currentPet.id} (no preset pet)`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'StorePet',
                itemId: currentPet.id
              });
            }
          }, currentDelay);
        })(delay, slotIndex);

        // Increase delay: 100ms → 200ms for better network latency tolerance
        delay += 200;
      }

      // Refresh after swaps complete
      setTimeout(() => {
        updateActivePetsFromRoomState();
        updateActivePetsDisplayFn(context, UnifiedState, calculateTimeUntilHungry, formatHungerTimer);
      }, delay + 200);

      setTimeout(() => {
        updateActivePetsFromRoomState();
        updateActivePetsDisplayFn(context, UnifiedState, calculateTimeUntilHungry, formatHungerTimer);
      }, delay + 600);

      setTimeout(() => {
        updateActivePetsFromRoomState();
        updateActivePetsDisplayFn(context, UnifiedState, calculateTimeUntilHungry, formatHungerTimer);
        refreshSeparateWindowPopouts('pets');
        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
          if (overlay && document.contains(overlay) && tabName === 'pets') {
            if (overlay.className.includes('mga-overlay-content-only')) {
              updatePureOverlayContent(overlay, tabName);
            }
          }
        });
      }, delay + 1000);
    });
  }

  // Add/Save Preset Button Handler
  const addBtn = context.querySelector('#add-preset-btn');
  if (addBtn && !addBtn.hasAttribute('data-handler-setup')) {
    addBtn.setAttribute('data-handler-setup', 'true');
    addBtn.addEventListener('click', () => {
      const input = context.querySelector('#preset-name-input');
      const name = input.value.trim();
      if (name && UnifiedState.atoms.activePets && UnifiedState.atoms.activePets.length) {
        // Save full pet data including abilities for Crop Eater detection
        UnifiedState.data.petPresets[name] = UnifiedState.atoms.activePets.slice(0, 3);
        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        input.value = ''; // Clear input after successful add

        // Add preset name to order array
        ensurePresetOrder(UnifiedState);
        if (!UnifiedState.data.petPresetsOrder.includes(name)) {
          UnifiedState.data.petPresetsOrder.push(name);
          MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);
        }

        // Refresh preset list to show in correct order
        refreshPresetsList(context, UnifiedState, MGA_saveJSON);

        // Update dropdown
        updatePetPresetDropdown(context, UnifiedState, targetDocument);

        // Update popouts
        refreshSeparateWindowPopouts('pets');
        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
          if (overlay && document.contains(overlay) && tabName === 'pets') {
            if (overlay.className.includes('mga-overlay-content-only')) {
              updatePureOverlayContent(overlay, tabName);
            }
          }
        });

        if (UnifiedState.data.settings?.debugMode) {
          console.log(`[BUTTON_INTERACTIONS] Created new preset: ${name} without full DOM refresh`);
        }
      } else if (!name) {
        input.focus(); // Focus input if name is empty
      }
    });
  }

  // Export/Import button handlers
  const exportBtn = context.querySelector('#export-presets-btn');
  if (exportBtn && !exportBtn.hasAttribute('data-handler-setup')) {
    exportBtn.setAttribute('data-handler-setup', 'true');
    exportBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      exportPetPresetsFn(UnifiedState);
    });
  }

  const importBtn = context.querySelector('#import-presets-btn');
  if (importBtn && !importBtn.hasAttribute('data-handler-setup')) {
    importBtn.setAttribute('data-handler-setup', 'true');
    importBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      importPetPresetsFn(UnifiedState, MGA_saveJSON);
    });
  }

  console.log('[PETS_UI] Event handlers setup complete');
}

/* ====================================================================================
 * PET TAB CONTENT HTML GENERATORS (PHASE 3 - CONTINUED)
 * ====================================================================================
 */

/**
 * Generate HTML content for pets popout window
 * Creates a simplified interface showing active pets and preset selection
 *
 * @param {Object} deps - Dependencies object containing:
 *   - UnifiedState: Global state object
 *   - calculateTimeUntilHungry: Function to calculate hunger timer
 *   - formatHungerTimer: Function to format timer display
 *   - ensurePresetOrder: Function to ensure preset order array exists
 * @returns {string} HTML content for popout window
 */
export function getPetsPopoutContent(deps) {
  const { UnifiedState, calculateTimeUntilHungry, formatHungerTimer, ensurePresetOrder } = deps;

  // Use multiple sources for pet data (same as updateActivePetsDisplay)
  const activePets = UnifiedState.atoms.activePets || window.activePets || [];
  const petPresets = UnifiedState.data.petPresets;

  if (Object.keys(petPresets).length === 0) {
    return `
            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Active Pets</div>
                <div class="mga-active-pets-display">
                    ${
                      activePets.length > 0
                        ? `
                        <div style="color: #93c5fd; font-size: 12px; margin-bottom: 4px;">Currently Equipped:</div>
                        <div class="mga-active-pets-list">
                            ${activePets
                              .map((p, index) => {
                                const timeUntilHungry = calculateTimeUntilHungry(p, UnifiedState);
                                const timerText = formatHungerTimer(timeUntilHungry);
                                const timerColor =
                                  timeUntilHungry === null
                                    ? '#999'
                                    : timeUntilHungry <= 0
                                      ? '#8B0000'
                                      : timeUntilHungry < 5 * 60 * 1000
                                        ? '#ff4444'
                                        : timeUntilHungry < 15 * 60 * 1000
                                          ? '#ffa500'
                                          : '#4caf50';
                                return `
                                    <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                        <span class="mga-pet-badge">${p.petSpecies}</span>
                                        <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                    </div>
                                `;
                              })
                              .join('')}
                        </div>
                    `
                        : `
                        <div class="mga-empty-state">
                            <div class="mga-empty-state-icon">—</div>
                            <div class="mga-empty-state-description">No pets currently active</div>
                        </div>
                    `
                    }
                </div>
            </div>
            <div class="mga-section">
                <div class="mga-empty-state" style="padding: 40px 20px;">
                    <div class="mga-empty-state-icon">📋</div>
                    <div class="mga-empty-state-title">No Saved Presets</div>
                    <div class="mga-empty-state-description">
                        You haven't saved any pet loadout presets yet.<br>
                        Open the main HUD Pets tab to create presets from your current active pets.
                    </div>
                </div>
            </div>
        `;
  }

  let html = `
        <div class="mga-section">
            <div class="mga-section-title mga-pet-section-title">Active Pets</div>
            <div class="mga-active-pets-display">
                ${
                  activePets.length > 0
                    ? `
                    <div class="mga-active-pets-header">Currently Equipped:</div>
                    <div class="mga-active-pets-list">
                        ${activePets
                          .map((p, index) => {
                            const timeUntilHungry = calculateTimeUntilHungry(p, UnifiedState);
                            const timerText = formatHungerTimer(timeUntilHungry);
                            const timerColor =
                              timeUntilHungry === null
                                ? '#999'
                                : timeUntilHungry <= 0
                                  ? '#8B0000'
                                  : timeUntilHungry < 5 * 60 * 1000
                                    ? '#ff4444'
                                    : timeUntilHungry < 15 * 60 * 1000
                                      ? '#ffa500'
                                      : '#4caf50';
                            return `
                                <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                    <span class="mga-pet-badge">${p.petSpecies}</span>
                                    <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                </div>
                            `;
                          })
                          .join('')}
                    </div>
                `
                    : `
                    <div class="mga-empty-state">
                        <div class="mga-empty-state-icon">—</div>
                        <div class="mga-empty-state-description">No pets currently active</div>
                    </div>
                `
                }
            </div>
        </div>

        <div class="mga-section">
            <div class="mga-section-title">Load Pet Preset</div>
    `;

  // Create clickable preset cards (consistent with main HUD structure) in order
  ensurePresetOrder(UnifiedState);
  UnifiedState.data.petPresetsOrder.forEach(name => {
    if (petPresets[name]) {
      const pets = petPresets[name];
      const petList = pets.map(p => p.petSpecies).join(', ');
      html += `
                <div class="mga-preset mga-preset-clickable" data-preset="${name}">
                    <div class="mga-preset-header">
                        <span class="mga-preset-name">${name}</span>
                    </div>
                    <div class="mga-preset-pets">${petList}</div>
                </div>
            `;
    }
  });

  html += `</div>`;
  return html;
}

/**
 * Setup event handlers for pet popout window
 * Handles preset card clicks and preset management buttons
 *
 * @param {Element} context - DOM context for event binding
 * @param {Object} deps - Dependencies object containing:
 *   - UnifiedState: Global state object
 *   - safeSendMessage: Function to send messages to server
 *   - updateActivePetsFromRoomState: Function to update pet state
 *   - refreshSeparateWindowPopouts: Function to refresh popout windows
 *   - updatePureOverlayContent: Function to update overlay content
 *   - updateTabContent: Function to update tab content
 *   - movePreset: Function to move preset in order
 *   - refreshPresetsList: Function to refresh presets list
 *   - MGA_saveJSON: Storage save function
 *   - exportPetPresets: Export function
 *   - importPetPresets: Import function
 *   - productionLog: Production logging function
 *   - productionWarn: Production warning function
 */
export function setupPetPopoutHandlers(context, deps) {
  const {
    UnifiedState,
    safeSendMessage,
    updateActivePetsFromRoomState,
    refreshSeparateWindowPopouts,
    updatePureOverlayContent,
    updateTabContent,
    movePreset: movePresetFn,
    refreshPresetsList,
    MGA_saveJSON,
    exportPetPresets: exportPetPresetsFn,
    importPetPresets: importPetPresetsFn,
    productionLog,
    productionWarn
  } = deps;

  // Find all preset cards
  const cards = context.querySelectorAll('.mga-preset-clickable[data-preset]');

  // Set up preset card handlers - use cloneNode to ensure clean slate
  cards.forEach(presetCard => {
    // Clone the node to remove ALL event listeners
    const newCard = presetCard.cloneNode(true);
    presetCard.parentNode.replaceChild(newCard, presetCard);

    // Attach fresh handler to the cloned card
    newCard.addEventListener('click', e => {
      const presetName = e.currentTarget.dataset.preset;

      if (!presetName || !UnifiedState.data.petPresets[presetName]) {
        productionWarn('⚠️ Preset not found!');
        return;
      }

      const preset = UnifiedState.data.petPresets[presetName];
      const maxSlots = 3;

      // Native swap approach - works even with full inventory!
      let delay = 0;

      for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
        const desiredPet = preset[slotIndex];

        // BUGFIX: Capture delay value in closure to prevent race conditions
        ((currentDelay, slot) => {
          setTimeout(() => {
            // BUGFIX: Read FRESH state inside timeout (not stale reference)
            const currentPets = UnifiedState.atoms.activePets || window.activePets || [];
            const currentPet = currentPets[slot];

            if (currentPet && desiredPet) {
              // Check if desired pet is already equipped
              if (currentPet.id === desiredPet.id) {
                if (UnifiedState.data.settings?.debugMode) {
                  productionLog(`[PET-SWAP] Slot ${slot + 1}: Already equipped (${currentPet.id}), skipping`);
                }
                return; // Skip swap, pet already in place
              }

              // Both exist: Use native SwapPet (no inventory space needed!)
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`[PET-SWAP] Slot ${slot + 1}: Swapping ${currentPet.id} → ${desiredPet.id}`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'SwapPet',
                petSlotId: currentPet.id,
                petInventoryId: desiredPet.id
              });
            } else if (!currentPet && desiredPet) {
              // Empty slot: Place new pet
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`[PET-SWAP] Slot ${slot + 1}: Placing ${desiredPet.id} (empty slot)`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'PlacePet',
                itemId: desiredPet.id,
                position: { x: 17 + slot * 2, y: 13 },
                localTileIndex: 64,
                tileType: 'Boardwalk'
              });
            } else if (currentPet && !desiredPet) {
              // Remove excess pet (preset has fewer pets)
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`[PET-SWAP] Slot ${slot + 1}: Storing ${currentPet.id} (no preset pet)`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'StorePet',
                itemId: currentPet.id
              });
            }
          }, currentDelay);
        })(delay, slotIndex);

        // Increase delay: 100ms → 200ms for better network latency tolerance
        delay += 200;
      }

      // Update displays after all pets are placed (single refresh with retry)
      const refreshPetDisplays = () => {
        // Force update from room state
        updateActivePetsFromRoomState();

        // Get the actual window context, whether we're in main window or popout
        const contextDoc = context.ownerDocument || context;
        const contextWindow = contextDoc.defaultView || window;

        // Check if this is a separate window popout
        const isSeparateWindow = contextWindow !== window && contextWindow.refreshPopoutContent;

        if (isSeparateWindow) {
          // Refresh separate window popout
          contextWindow.refreshPopoutContent('pets');
        } else {
          // It's an in-game overlay or main window - update all popouts
          refreshSeparateWindowPopouts('pets');

          // Update all overlays
          UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
            if (overlay && document.contains(overlay) && tabName === 'pets') {
              if (overlay.className.includes('mga-overlay-content-only')) {
                updatePureOverlayContent(overlay, tabName);
              }
            }
          });

          // Update main tab if active
          if (UnifiedState.activeTab === 'pets') {
            updateTabContent();
          }
        }
      };

      // Refresh after swaps complete + 500ms
      setTimeout(() => {
        refreshPetDisplays();

        // Retry handler reattachment after a short delay to ensure reliability
        setTimeout(() => {
          const overlay = UnifiedState.data.popouts.overlays.get('pets');
          if (overlay && document.contains(overlay)) {
            setupPetPopoutHandlers(overlay, deps);
          }
        }, 500);
      }, delay + 500);

      // Visual feedback - gentle highlight, no transform (prevents stutter)
      // Temporarily disable pointer events to prevent hover conflicts
      e.currentTarget.style.pointerEvents = 'none';
      const originalBackground = e.currentTarget.style.background;
      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
      setTimeout(() => {
        e.currentTarget.style.background = originalBackground;
        e.currentTarget.style.pointerEvents = '';
      }, 200);
    });
  });

  // Add event delegation for preset action buttons (move-up, move-down, save, place, remove)
  const presetsContainer = context.querySelector('#presets-list');
  if (presetsContainer) {
    // Remove old listener if it exists
    if (presetsContainer._mgaClickHandler) {
      presetsContainer.removeEventListener('click', presetsContainer._mgaClickHandler);
    }

    // Create new handler
    presetsContainer._mgaClickHandler = e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const action = btn.dataset.action;
      const presetName = btn.dataset.preset;

      if (action === 'move-up') {
        movePresetFn(
          presetName,
          'up',
          context,
          UnifiedState,
          MGA_saveJSON,
          refreshPresetsList,
          refreshSeparateWindowPopouts,
          updateTabContent
        );
      } else if (action === 'move-down') {
        movePresetFn(
          presetName,
          'down',
          context,
          UnifiedState,
          MGA_saveJSON,
          refreshPresetsList,
          refreshSeparateWindowPopouts,
          updateTabContent
        );
      } else if (action === 'save') {
        UnifiedState.data.petPresets[presetName] = (UnifiedState.atoms.activePets || []).slice(0, 3);
        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        refreshPresetsList(context, UnifiedState, MGA_saveJSON);
        refreshSeparateWindowPopouts('pets');
      } else if (action === 'place') {
        window.debouncedPlacePetPreset(presetName);
      } else if (action === 'remove') {
        delete UnifiedState.data.petPresets[presetName];
        const saveSuccess = MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);

        // FIX BUG #2 (v3.8.6): Also delete hotkey when preset is deleted
        if (UnifiedState.data.petPresetHotkeys[presetName]) {
          const deletedHotkey = UnifiedState.data.petPresetHotkeys[presetName];
          delete UnifiedState.data.petPresetHotkeys[presetName];
          MGA_saveJSON('MGA_petPresetHotkeys', UnifiedState.data.petPresetHotkeys);
          console.log(`[MGTOOLS-FIX] ✅ Cleared hotkey "${deletedHotkey}" for deleted preset: ${presetName}`);
        }

        if (!saveSuccess) {
          console.error('❌ Failed to save after removing preset');
          alert('⚠️ Failed to save changes! The preset removal may not persist.');
        }
        refreshPresetsList(context, UnifiedState, MGA_saveJSON);
        refreshSeparateWindowPopouts('pets');
      }
    };

    // Add the handler
    presetsContainer.addEventListener('click', presetsContainer._mgaClickHandler);
  }

  // === EXPORT/IMPORT BUTTON HANDLERS (v3.8.7) ===
  const exportBtn = context.querySelector('#export-presets-btn');
  if (exportBtn && !exportBtn.hasAttribute('data-handler-setup')) {
    exportBtn.setAttribute('data-handler-setup', 'true');
    exportBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      exportPetPresetsFn(UnifiedState);
    });
  }

  const importBtn = context.querySelector('#import-presets-btn');
  if (importBtn && !importBtn.hasAttribute('data-handler-setup')) {
    importBtn.setAttribute('data-handler-setup', 'true');
    importBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      importPetPresetsFn(UnifiedState, MGA_saveJSON);
    });
  }
}

/**
 * Generate HTML content for main pets tab
 * Creates full pet management interface with presets, quick load, and management controls
 *
 * @param {Object} deps - Dependencies object containing:
 *   - UnifiedState: Global state object
 *   - calculateTimeUntilHungry: Function to calculate hunger timer
 *   - formatHungerTimer: Function to format timer display
 *   - ensurePresetOrder: Function to ensure preset order array exists
 *   - productionLog: Production logging function
 * @returns {string} HTML content for main pets tab
 */
export function getPetsTabContent(deps) {
  const { UnifiedState, calculateTimeUntilHungry, formatHungerTimer, ensurePresetOrder, productionLog } = deps;

  // Use multiple sources for pet data (same as updateActivePetsDisplay)
  const activePets = UnifiedState.atoms.activePets || window.activePets || [];
  const petPresets = UnifiedState.data.petPresets;

  productionLog('🐾 [PETS-TAB-CONTENT] Generating HTML with pets:', {
    unifiedStateActivePets: UnifiedState.atoms.activePets?.length || 0,
    windowActivePets: window.activePets?.length || 0,
    finalActivePets: activePets.length,
    activePetsData: activePets
  });

  // Get cycle presets hotkey status
  const cycleHotkey = UnifiedState.data.hotkeys?.mgToolsKeys?.cyclePresets?.custom;
  const totalPresets = Object.keys(petPresets).length;

  let html = `
        ${
          totalPresets > 0
            ? `
            <div class="mga-section" style="padding: 8px 12px; background: rgba(139, 92, 246, 0.15); border-left: 3px solid #8b5cf6; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: #a78bfa; font-weight: 600; margin-bottom: 2px;">🔄 CYCLE PRESETS</div>
                        <div style="font-size: 10px; color: rgba(255,255,255,0.7);">
                            ${cycleHotkey ? `Hotkey: <span style="background: rgba(139, 92, 246, 0.4); padding: 1px 6px; border-radius: 3px; font-weight: 600;">${cycleHotkey.toUpperCase()}</span>` : 'No hotkey set'}
                        </div>
                    </div>
                    <button class="mga-btn" id="set-cycle-hotkey-btn" style="padding: 4px 12px; font-size: 11px; white-space: nowrap; background: rgba(139, 92, 246, 0.4); border: 1px solid #8b5cf6;">
                        ${cycleHotkey ? 'Change' : 'Set Key'}
                    </button>
                </div>
            </div>
        `
            : ''
        }
        <div class="mga-section">
            <div class="mga-section-title mga-pet-section-title">Active Pets</div>
            <div class="mga-active-pets-display">
                ${
                  activePets.length > 0
                    ? `
                    <div class="mga-active-pets-header">Currently Equipped:</div>
                    <div class="mga-active-pets-list">
                        ${activePets
                          .map((p, index) => {
                            const timeUntilHungry = calculateTimeUntilHungry(p, UnifiedState);
                            const timerText = formatHungerTimer(timeUntilHungry);
                            const timerColor =
                              timeUntilHungry === null
                                ? '#999'
                                : timeUntilHungry <= 0
                                  ? '#8B0000'
                                  : timeUntilHungry < 5 * 60 * 1000
                                    ? '#ff4444'
                                    : timeUntilHungry < 15 * 60 * 1000
                                      ? '#ffa500'
                                      : '#4caf50';
                            return `
                                <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                    <span class="mga-pet-badge">${p.petSpecies}</span>
                                    <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                </div>
                            `;
                          })
                          .join('')}
                    </div>
                `
                    : `
                    <div class="mga-empty-state">
                        <div class="mga-empty-state-icon">—</div>
                        <div class="mga-empty-state-description">No pets currently active</div>
                    </div>
                `
                }
            </div>
        </div>

        <div class="mga-section">
            <div class="mga-section-title mga-pet-section-title">Quick Load Preset</div>
            <select class="mga-select" id="preset-quick-select" style="margin-bottom: 8px;">
                <option value="">-- Select Preset --</option>
                ${Object.keys(petPresets)
                  .map(
                    name =>
                      `<option value="${name}">${name} (${petPresets[name].map(p => p.petSpecies).join(', ')})</option>`
                  )
                  .join('')}
            </select>
            <button class="mga-btn" id="quick-load-btn" style="width: 100%;">Load</button>
        </div>

        <div class="mga-section">
            <div class="mga-section-title mga-pet-section-title">Create New Preset</div>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 8px;">
                <input type="text" class="mga-input" id="preset-name-input" placeholder="Preset name...">
                <button class="mga-btn" id="add-preset-btn" style="white-space: nowrap; padding: 6px 24px;">Save Current</button>
            </div>
        </div>

        <div class="mga-section">
            <div class="mga-section-title mga-pet-section-title">Manage Presets</div>

            <!-- Export/Import Buttons (v3.8.7) -->
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button id="export-presets-btn" class="mga-btn mga-btn-sm" style="flex: 1; background: #10b981; border-color: #059669; padding: 6px 12px;">
                    📤 Export Backup
                </button>
                <button id="import-presets-btn" class="mga-btn mga-btn-sm" style="flex: 1; background: #3b82f6; border-color: #2563eb; padding: 6px 12px;">
                    📥 Import Backup
                </button>
            </div>

            <div id="presets-list" class="mga-scrollable mga-presets-container">
    `;

  // Display presets in order
  ensurePresetOrder(UnifiedState);
  UnifiedState.data.petPresetsOrder.forEach(name => {
    if (petPresets[name]) {
      const pets = petPresets[name];
      const hotkey = UnifiedState.data.petPresetHotkeys[name];
      html += `
                <div class="mga-preset">
                    <div class="mga-preset-header">
                        <span class="mga-preset-name">${name}</span>
                        <button class="mga-hotkey-btn" data-preset="${name}" style="margin-left: auto; padding: 2px 8px; font-size: 11px; background: rgba(100, 200, 255, 0.48); border: 1px solid #4a9eff; border-radius: 4px; color: white; cursor: pointer;">
                            ${hotkey || 'Set Hotkey'}
                        </button>
                    </div>
                    <div class="mga-preset-pets">${pets.map(p => p.petSpecies).join(', ')}</div>
                    <div class="mga-preset-actions">
                        <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                            <button class="mga-btn mga-btn-sm" data-action="move-up" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↑</button>
                            <button class="mga-btn mga-btn-sm" data-action="move-down" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↓</button>
                            <button class="mga-btn mga-btn-sm" data-action="save" data-preset="${name}">Save Current</button>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button class="mga-btn mga-btn-sm" data-action="place" data-preset="${name}">Place</button>
                            <button class="mga-btn mga-btn-sm" data-action="remove" data-preset="${name}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
    }
  });

  html += '</div></div>';

  return html;
}

/* ====================================================================================
 * PET ABILITY CALCULATION HELPERS (GAME-SPECIFIC)
 * ====================================================================================
 */

/**
 * Calculate expected time reduction from Turtle pets with Plant Growth Boost II
 * @param {Array} activePets - Array of active pet objects
 * @param {Object} UnifiedState - Global state object (for debug logging)
 * @param {Function} logDebug - Debug logging function
 * @returns {Object} Object with expectedMinutesRemoved property
 */
export function getTurtleExpectations(activePets, UnifiedState, logDebug) {
  // Debug: Only log when debug mode is enabled
  if (UnifiedState?.data?.settings?.debugMode && logDebug) {
    logDebug('TURTLE', 'Checking active pets:', {
      petsCount: activePets?.length || 0,
      pets: (activePets || []).map(p => ({
        species: p?.petSpecies,
        hunger: p?.hunger,
        abilities: p?.abilities
      }))
    });
  }

  const turtles = (activePets || []).filter(
    p =>
      p &&
      p.petSpecies === 'Turtle' &&
      p.hunger > 0 &&
      p.abilities?.some(
        a =>
          a === 'Plant Growth Boost II' ||
          a === 'PlantGrowthBoostII' ||
          a === 'Plant Growth Boost 2' ||
          (typeof a === 'string' &&
            a.toLowerCase().includes('plant') &&
            a.toLowerCase().includes('growth') &&
            (a.includes('II') || a.includes('2')))
      )
  );

  if (UnifiedState?.data?.settings?.debugMode && logDebug) {
    logDebug('TURTLE', 'Filtered turtles:', {
      turtleCount: turtles.length,
      turtles: turtles.map(t => ({
        species: t.petSpecies,
        hunger: t.hunger,
        abilities: t.abilities,
        xp: t.xp,
        targetScale: t.targetScale
      }))
    });
  }

  let expectedMinutesRemoved = 0;

  turtles.forEach(p => {
    const xpComponent = Math.min(Math.floor(((p.xp || 0) / (100 * 3600)) * 30), 30);
    const scaleComponent = Math.floor((((p.targetScale || 1) - 1) / (2.5 - 1)) * 20 + 80) - 30;
    const base = xpComponent + scaleComponent;
    const minutesRemoved = (base / 100) * 5 * 60 * (1 - Math.pow(1 - (0.27 * base) / 100, 1 / 60));

    if (UnifiedState?.data?.settings?.debugMode && logDebug) {
      logDebug('TURTLE', 'Turtle calculation:', {
        xp: p.xp,
        targetScale: p.targetScale,
        xpComponent,
        scaleComponent,
        base,
        minutesRemoved
      });
    }

    expectedMinutesRemoved += minutesRemoved;
  });

  if (UnifiedState?.data?.settings?.debugMode && logDebug) {
    logDebug('TURTLE', 'Total expected minutes removed:', expectedMinutesRemoved);
  }

  return {
    expectedMinutesRemoved
  };
}

/**
 * Estimate real-time until crop matures with turtle growth boost applied
 * @param {Array} currentCrop - Array of crop objects with endTime
 * @param {Array} activePets - Array of active pet objects
 * @param {number|null} slotIndex - Optional slot index to target specific crop
 * @param {Object} UnifiedState - Global state object (for debug logging)
 * @param {Function} logError - Error logging function
 * @returns {string|null} Formatted time string like "5h 30m" or null
 */
export function estimateUntilLatestCrop(currentCrop, activePets, slotIndex, UnifiedState, logError) {
  try {
    if (!currentCrop || currentCrop.length === 0) return null;
    if (!activePets || activePets.length === 0) return null;

    const turtleExpectations = getTurtleExpectations(activePets, UnifiedState, null);
    if (!turtleExpectations || turtleExpectations.expectedMinutesRemoved === 0) {
      return null;
    }

    const now = Date.now();

    // If slotIndex provided and valid, use that slot's endTime
    // Otherwise use the latest crop's endTime
    let targetEndTime;
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < currentCrop.length) {
      targetEndTime = currentCrop[slotIndex]?.endTime || 0;
    } else {
      targetEndTime = Math.max(...currentCrop.map(c => c.endTime || 0));
    }

    if (targetEndTime <= now) return null; // Crop already mature

    const remainingRealMinutes = (targetEndTime - now) / (1000 * 60);
    const { expectedMinutesRemoved } = turtleExpectations;
    const effectiveRate = expectedMinutesRemoved + 1;
    const expectedRealMinutes = remainingRealMinutes / effectiveRate;

    const hours = Math.floor(expectedRealMinutes / 60);
    const minutes = Math.floor(expectedRealMinutes % 60);

    return `${hours}h ${minutes}m`;
  } catch (error) {
    if (logError) {
      logError('TURTLE', 'ERROR in estimateUntilLatestCrop:', error);
    }
    return null;
  }
}

/**
 * Generic ability expectations calculator
 * @param {Array} activePets - Array of active pet objects
 * @param {string} abilityName - Name of the ability to check for
 * @param {number} minutesPerBase - Base minutes per tick (default 5)
 * @param {number} odds - Ability odds (default 0.27)
 * @returns {Object} Object with expectedMinutesRemoved property
 */
export function getAbilityExpectations(activePets, abilityName, minutesPerBase = 5, odds = 0.27) {
  const pets = (activePets || []).filter(p => p && p.hunger > 0 && p.abilities?.some(a => a === abilityName));

  let expectedMinutesRemoved = 0;

  pets.forEach(p => {
    const base =
      Math.min(Math.floor(((p.xp || 0) / (100 * 3600)) * 30), 30) +
      Math.floor((((p.targetScale || 1) - 1) / (2.5 - 1)) * 20 + 80) -
      30;

    expectedMinutesRemoved += (base / 100) * minutesPerBase * 60 * (1 - Math.pow(1 - (odds * base) / 100, 1 / 60));
  });

  return {
    expectedMinutesRemoved
  };
}

/**
 * Calculate expected time reduction from Egg Growth Boost II pets
 * @param {Array} activePets - Array of active pet objects
 * @returns {Object} Object with expectedMinutesRemoved property
 */
export function getEggExpectations(activePets) {
  return getAbilityExpectations(activePets, 'EggGrowthBoostII', 10, 0.24);
}

/**
 * Calculate expected time reduction from Plant Growth Boost II pets
 * @param {Array} activePets - Array of active pet objects
 * @returns {Object} Object with expectedMinutesRemoved property
 */
export function getGrowthExpectations(activePets) {
  return getAbilityExpectations(activePets, 'PlantGrowthBoostII', 5, 0.27);
}

/* ====================================================================================
 * AUTO-FAVORITE SYSTEM
 * ====================================================================================
 */

/**
 * Initialize auto-favorite monitoring system
 * Monitors inventory changes and automatically favorites items based on user settings
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.UnifiedState - Unified state object
 * @param {Window} dependencies.targetWindow - Target window object with game data
 * @param {Function} dependencies.productionLog - Production logging function
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
      checkAndFavoriteNewItems(targetWindow.myData.inventory, { UnifiedState, targetWindow, productionLog });
    }
    lastInventoryCount = currentCount;
  }, 2000); // OPTIMIZED: Every 2 seconds (was 500ms)

  productionLog('🌟 [AUTO-FAVORITE] System initialized - monitoring inventory changes');
}

/**
 * Check inventory for new items and auto-favorite based on settings
 * @param {Object} inventory - Inventory object from game data
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.UnifiedState - Unified state object
 * @param {Window} dependencies.targetWindow - Target window object
 * @param {Function} dependencies.productionLog - Production logging function
 */
function checkAndFavoriteNewItems(inventory, { UnifiedState, targetWindow, productionLog }) {
  if (!inventory?.items) return;

  // DEFENSIVE: Ensure petAbilities array exists (v2.0.0 fix for upgrade path)
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
 * Favorite ALL items of a specific species (called when checkbox is checked)
 * @param {string} speciesName - Name of the species to favorite
 * @param {Object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window object
 * @param {Function} dependencies.productionLog - Production logging function
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
 * DISABLED: Script never unfavorites - only adds favorites
 * @param {string} speciesName - Name of the species
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.productionLog - Production logging function
 */
export function unfavoriteSpecies(speciesName, { productionLog }) {
  productionLog(
    `🔒 [AUTO-FAVORITE] Checkbox unchecked for ${speciesName} - Auto-favorite disabled, but existing favorites are preserved (script never removes favorites)`
  );
  // Do nothing - script only adds favorites, never removes them
  // This protects user's manually-favorited items (pets, eggs, crops, etc.)
}

/**
 * Favorite ALL items with a specific mutation (called when mutation checkbox is checked)
 * @param {string} mutationName - Name of the mutation to favorite
 * @param {Object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window object
 * @param {Function} dependencies.productionLog - Production logging function
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
 * DISABLED: Script never unfavorites - only adds favorites
 * @param {string} mutationName - Name of the mutation
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.productionLog - Production logging function
 */
export function unfavoriteMutation(mutationName, { productionLog }) {
  productionLog(
    `🔒 [AUTO-FAVORITE] Checkbox unchecked for ${mutationName} mutation - Auto-favorite disabled, but existing favorites are preserved (script never removes favorites)`
  );
  // Do nothing - script only adds favorites, never removes them
  // This protects user's manually-favorited items (pets, eggs, crops, etc.)
}

/**
 * Favorite ALL pets with a specific ability (called when checkbox is checked)
 * @param {string} abilityName - Name of the ability to favorite
 * @param {Object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window object
 * @param {Function} dependencies.productionLog - Production logging function
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
 * DISABLED: Script never unfavorites - only adds favorites
 * @param {string} abilityName - Name of the ability
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.productionLog - Production logging function
 */
export function unfavoritePetAbility(abilityName, { productionLog }) {
  productionLog(
    `🔒 [AUTO-FAVORITE-PET] Checkbox unchecked for ${abilityName} - Auto-favorite disabled, but existing favorites are preserved (script never removes favorites)`
  );
  // Do nothing - script only adds favorites, never removes them
}

/* ====================================================================================
 * PET NOTIFICATION SOUND
 * ====================================================================================
 */

/**
 * Play pet notification sound (delegates to custom or default sound system)
 * @param {number} volume - Volume level (0-1)
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.playCustomOrDefaultSound - Sound playback function
 * @param {Function} dependencies.playGeneralNotificationSound - Fallback sound function
 */
export function playPetNotificationSound(volume, { playCustomOrDefaultSound, playGeneralNotificationSound }) {
  playCustomOrDefaultSound('pet', playGeneralNotificationSound, volume);
}

/* ====================================================================================
 * PET PRESET MANAGEMENT
 * ====================================================================================
 */

/**
 * Place a pet preset (load pets from saved preset)
 * @param {string} presetName - Name of the preset to load
 * @param {Object} dependencies - Injected dependencies
 */
export function placePetPreset(
  presetName,
  {
    UnifiedState,
    targetWindow,
    productionLog,
    productionWarn,
    safeSendMessage,
    updateActivePetsFromRoomState,
    updateTabContent,
    updatePureOverlayContent,
    refreshSeparateWindowPopouts
  }
) {
  const preset = UnifiedState.data.petPresets[presetName];
  if (!preset) {
    productionWarn(`[PETS] Preset "${presetName}" not found`);
    return;
  }

  const maxSlots = 3;
  let delay = 0;

  for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
    const desiredPet = preset[slotIndex];

    // BUGFIX: Capture delay value in closure to prevent race conditions
    ((currentDelay, slot) => {
      setTimeout(() => {
        // BUGFIX: Read FRESH state inside timeout (not stale reference)
        const currentPets = UnifiedState.atoms.activePets || targetWindow.activePets || [];
        const currentPet = currentPets[slot];

        if (currentPet && desiredPet) {
          // Check if desired pet is already equipped
          if (currentPet.id === desiredPet.id) {
            if (UnifiedState.data.settings?.debugMode) {
              productionLog(`[PET-SWAP] Slot ${slot + 1}: Already equipped (${currentPet.id}), skipping`);
            }
            return;
          }

          // Both exist: Use native SwapPet
          if (UnifiedState.data.settings?.debugMode) {
            productionLog(`[PET-SWAP] Slot ${slot + 1}: Swapping ${currentPet.id} → ${desiredPet.id}`);
          }

          safeSendMessage({
            scopePath: ['Room', 'Quinoa'],
            type: 'SwapPet',
            petSlotId: currentPet.id,
            petInventoryId: desiredPet.id
          });
        } else if (!currentPet && desiredPet) {
          // Empty slot: Place new pet
          if (UnifiedState.data.settings?.debugMode) {
            productionLog(`[PET-SWAP] Slot ${slot + 1}: Placing ${desiredPet.id} (empty slot)`);
          }

          safeSendMessage({
            scopePath: ['Room', 'Quinoa'],
            type: 'PlacePet',
            itemId: desiredPet.id,
            position: { x: 17 + slot * 2, y: 13 },
            localTileIndex: 64,
            tileType: 'Boardwalk'
          });
        } else if (currentPet && !desiredPet) {
          // Remove excess pet
          if (UnifiedState.data.settings?.debugMode) {
            productionLog(`[PET-SWAP] Slot ${slot + 1}: Storing ${currentPet.id} (no preset pet)`);
          }

          safeSendMessage({
            scopePath: ['Room', 'Quinoa'],
            type: 'StorePet',
            itemId: currentPet.id
          });
        }
      }, currentDelay);
    })(delay, slotIndex);

    delay += 200;
  }

  // Update all displays after pets are placed
  const refreshAllPetDisplays = () => {
    updateActivePetsFromRoomState();

    if (UnifiedState.activeTab === 'pets') {
      updateTabContent();
    }

    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
      if (overlay && document.contains(overlay) && tabName === 'pets') {
        if (overlay.className.includes('mga-overlay-content-only')) {
          updatePureOverlayContent(overlay, tabName);
        }
      }
    });

    refreshSeparateWindowPopouts('pets');
  };

  setTimeout(
    () => {
      refreshAllPetDisplays();
    },
    maxSlots * 200 + 500
  );

  setTimeout(() => {
    refreshAllPetDisplays();
  }, 2000);
}

/**
 * Load a pet preset (alternative implementation using atomic swaps)
 * @param {Array} preset - Array of pet objects to load
 * @param {Object} dependencies - Injected dependencies
 */
export function loadPetPreset(preset, { UnifiedState, targetWindow, productionLog, productionWarn, safeSendMessage }) {
  if (!preset || !Array.isArray(preset)) {
    productionWarn('[PETS] Invalid preset data');
    return;
  }

  productionLog('[PETS] Using SwapPet for atomic swapping');

  preset.forEach((presetPet, i) => {
    setTimeout(() => {
      const currentPets = UnifiedState.atoms.activePets || targetWindow.activePets || [];
      const currentPet = currentPets[i];

      if (currentPet) {
        if (currentPet.id === presetPet.id) {
          if (UnifiedState.data.settings?.debugMode) {
            productionLog(`[PET-SWAP] Slot ${i + 1}: Already equipped (${currentPet.id}), skipping`);
          }
          return;
        }

        if (UnifiedState.data.settings?.debugMode) {
          productionLog(`[PET-SWAP] Slot ${i + 1}: Swapping ${currentPet.id} → ${presetPet.id}`);
        }

        safeSendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: 'SwapPet',
          petSlotId: currentPet.id,
          petInventoryId: presetPet.id
        });
      } else {
        if (UnifiedState.data.settings?.debugMode) {
          productionLog(`[PET-SWAP] Slot ${i + 1}: Placing ${presetPet.id} (empty slot)`);
        }

        safeSendMessage({
          scopePath: ['Room', 'Quinoa'],
          type: 'PlacePet',
          itemId: presetPet.id,
          position: { x: 17 + i * 2, y: 13 },
          localTileIndex: 64,
          tileType: 'Boardwalk'
        });
      }
    }, i * 200);
  });

  productionLog(`✅ [PETS] Loaded pet preset (${preset.length} pets)`);
}

/* ====================================================================================
 * PET SPECIES AND ABILITY FILTERING
 * ====================================================================================
 */

/**
 * Get all unique pet species from ability logs
 * @param {Object} dependencies - Injected dependencies
 * @returns {Array<string>} Sorted array of unique pet species names
 */
export function getAllUniquePets({ UnifiedState }) {
  const pets = new Set();
  UnifiedState.data.petAbilityLogs.forEach(log => {
    if (log.petName && log.petName !== 'Test Pet') {
      pets.add(log.petName);
    }
  });
  return Array.from(pets).sort();
}

/**
 * Populate pet species list UI with checkboxes
 * @param {Object} dependencies - Injected dependencies
 */
export function populatePetSpeciesList({ UnifiedState, targetDocument, MGA_saveJSON, updateAllLogVisibility }) {
  const container = targetDocument.getElementById('pet-species-list');
  if (!container) return;

  const pets = getAllUniquePets({ UnifiedState });
  container.innerHTML = '';

  if (pets.length === 0) {
    container.innerHTML = '<div style="color: #888; text-align: center;">No pet species found in logs</div>';
    return;
  }

  pets.forEach(pet => {
    const label = targetDocument.createElement('label');
    label.className = 'mga-checkbox-group';
    label.style.display = 'block';
    label.style.marginBottom = '4px';

    const checkbox = targetDocument.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mga-checkbox';
    checkbox.checked = UnifiedState.data.petFilters.selectedPets[pet] || false;

    checkbox.addEventListener('change', e => {
      UnifiedState.data.petFilters.selectedPets[pet] = e.target.checked;
      MGA_saveJSON('MGA_petFilters', UnifiedState.data.petFilters);
      updateAllLogVisibility();
    });

    const span = targetDocument.createElement('span');
    span.className = 'mga-label';
    span.textContent = ` ${pet}`;

    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}

/**
 * Check if an ability should be logged based on current filter mode
 * @param {string} abilityType - Type of ability to check
 * @param {string|null} petName - Name of the pet (optional)
 * @param {Object} dependencies - Injected dependencies
 * @returns {boolean} True if ability should be logged
 */
export function shouldLogAbility(abilityType, petName, { UnifiedState, categorizeAbilityToFilterKey }) {
  if (abilityType && (abilityType.includes('ProduceMutationBoost') || abilityType.includes('PetMutationBoost'))) {
    return false;
  }

  const mode = UnifiedState.data.filterMode || 'categories';

  if (mode === 'custom') {
    return UnifiedState.data.customMode.selectedAbilities[abilityType] || false;
  }

  if (mode === 'byPet') {
    if (!petName) return false;
    return UnifiedState.data.petFilters.selectedPets[petName] || false;
  }

  const category = categorizeAbilityToFilterKey(abilityType, { UnifiedState });
  return UnifiedState.data.abilityFilters[category] || false;
}

/**
 * Categorize an ability type to a filter key
 * @param {string} abilityType - Type of ability
 * @param {Object} dependencies - Injected dependencies
 * @returns {string} Category key
 */
export function categorizeAbilityToFilterKey(abilityType, { MGA_AbilityCache }) {
  if (MGA_AbilityCache.categories.has(abilityType)) {
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

  MGA_AbilityCache.categories.set(abilityType, category);
  return category;
}

/* ====================================================================================
 * PET ABILITY MONITORING
 * ====================================================================================
 */

/**
 * Monitor pet abilities and log new triggers
 * @param {Object} dependencies - Injected dependencies
 */
export function monitorPetAbilities({
  UnifiedState,
  targetWindow,
  productionLog,
  MGA_debouncedSave,
  MGA_manageLogMemory,
  formatTimestamp,
  normalizeAbilityName,
  getGardenCropIfUnique,
  playAbilityNotificationSound,
  showNotificationToast,
  updateAllAbilityLogDisplays,
  updateTabContent,
  pendingAbilityUpdates
}) {
  if (!UnifiedState.atoms.petAbility || !UnifiedState.atoms.activePets) return;

  let hasNewAbility = false;

  UnifiedState.atoms.activePets.forEach((pet, index) => {
    if (!pet || !pet.id) return;

    const abilityData = UnifiedState.atoms.petAbility[pet.id];
    if (!abilityData || !abilityData.lastAbilityTrigger) return;

    const trigger = abilityData.lastAbilityTrigger;
    const currentTimestamp = trigger.performedAt;

    if (!currentTimestamp || pet.hunger === 0) {
      productionLog(`🚫 [ABILITY-SKIP] Pet ${pet.petSpecies} unfed (hunger: ${pet.hunger}) - skipping ability log`);
      return;
    }

    if (!trigger.abilityId || trigger.abilityId === 'Unknown' || trigger.abilityId === '') {
      productionLog(`🚫 [ABILITY-SKIP] Invalid ability ID for ${pet.petSpecies} - likely unfed pet notification`);
      return;
    }

    if (!UnifiedState.data.lastAbilityTimestamps) {
      UnifiedState.data.lastAbilityTimestamps = {};
    }

    const lastKnown = UnifiedState.data.lastAbilityTimestamps[pet.id];

    if (lastKnown === currentTimestamp) {
      return;
    }

    if (lastKnown && Math.abs(currentTimestamp - lastKnown) < 3000) {
      if (UnifiedState.data.settings?.debugMode) {
        productionLog(
          `🚫 [ABILITY-SKIP] ${pet.petSpecies} - Timestamp too close to last (${Math.abs(currentTimestamp - lastKnown)}ms)`
        );
      }
      return;
    }

    const isDuplicate = UnifiedState.data.petAbilityLogs
      .slice(0, 10)
      .some(log => log.timestamp === currentTimestamp && log.petName && log.petName.includes(pet.petSpecies));

    if (isDuplicate) {
      if (UnifiedState.data.settings?.debugMode) {
        productionLog(`🚫 [ABILITY-SKIP] ${pet.petSpecies} - Already in recent logs (duplicate prevention)`);
      }
      return;
    }

    UnifiedState.data.lastAbilityTimestamps[pet.id] = currentTimestamp;
    hasNewAbility = true;

    MGA_debouncedSave('MGA_lastAbilityTimestamps', UnifiedState.data.lastAbilityTimestamps);

    const enrichedData = trigger.data ? { ...trigger.data } : {};

    const abilityId = trigger.abilityId || '';
    if (abilityId.includes('Granter') && !enrichedData.cropName) {
      const currentCrop = targetWindow.currentCrop || UnifiedState.atoms.currentCrop;
      if (currentCrop && currentCrop[0]?.species) {
        enrichedData.cropName = currentCrop[0].species;
      } else {
        const uniqueCrop = getGardenCropIfUnique();
        if (uniqueCrop) {
          enrichedData.cropName = uniqueCrop;
        }
      }
    }

    let displayName = pet.petSpecies || `Pet ${index + 1}`;
    if (pet.name && pet.name !== pet.petSpecies) {
      displayName = `${pet.name} (${pet.petSpecies || 'Pet'})`;
    }

    const rawAbilityType = trigger.abilityId || 'Unknown Ability';
    const normalizedAbilityType = normalizeAbilityName(rawAbilityType);

    const abilityLog = {
      petName: displayName,
      abilityType: normalizedAbilityType,
      timestamp: currentTimestamp,
      timeString: formatTimestamp(currentTimestamp),
      data: Object.keys(enrichedData).length > 0 ? enrichedData : null
    };

    UnifiedState.data.petAbilityLogs.unshift(abilityLog);
    UnifiedState.data.petAbilityLogs = MGA_manageLogMemory(UnifiedState.data.petAbilityLogs);

    const clearSession = localStorage.getItem('MGA_logs_clear_session');
    if (!clearSession || Date.now() - parseInt(clearSession, 10) > 86400000) {
      MGA_debouncedSave('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
    }

    if (UnifiedState.data.settings.notifications.abilityNotificationsEnabled) {
      const abilityType = trigger.abilityId || '';

      if (abilityType && (abilityType.includes('ProduceMutationBoost') || abilityType.includes('PetMutationBoost'))) {
        return;
      }

      const watchedAbilities = UnifiedState.data.settings.notifications.watchedAbilities || [];

      let shouldNotify = false;
      if (watchedAbilities.length === 0) {
        shouldNotify = true;
      } else if (watchedAbilities.includes('__NONE__')) {
        shouldNotify = false;
      } else {
        shouldNotify = watchedAbilities.includes(abilityType);
      }

      if (shouldNotify) {
        const displayAbilityName = normalizeAbilityName(abilityType);
        productionLog(`🎯 [ABILITY-NOTIFY] ${abilityLog.petName} triggered ${displayAbilityName}`);

        const abilityVolume = UnifiedState.data.settings.notifications.abilityNotificationVolume || 0.2;
        playAbilityNotificationSound(abilityVolume);
        showNotificationToast(`✨ ${abilityLog.petName}: ${displayAbilityName}`, 'success');
      }
    }
  });

  if (hasNewAbility && document.visibilityState === 'visible') {
    if (!pendingAbilityUpdates.value) {
      pendingAbilityUpdates.value = true;

      setTimeout(() => {
        requestAnimationFrame(() => {
          updateAllAbilityLogDisplays();

          if (UnifiedState.activeTab === 'abilities') {
            updateTabContent();
          }

          pendingAbilityUpdates.value = false;
        });
      }, 500);
    }
  }
}

/* ====================================================================================
 * ABILITY LOG UTILITY FUNCTIONS
 * ====================================================================================
 */

/**
 * Get all unique abilities from logs
 * @param {Object} dependencies - Injected dependencies
 * @returns {Array<string>} Sorted array of unique ability types
 */
export function getAllUniqueAbilities({ UnifiedState }) {
  const abilities = new Set();
  UnifiedState.data.petAbilityLogs.forEach(log => {
    if (log.abilityType) {
      abilities.add(log.abilityType);
    }
  });
  return Array.from(abilities).sort();
}

/**
 * Populate individual abilities list UI with checkboxes
 * @param {Object} dependencies - Injected dependencies
 */
export function populateIndividualAbilities({
  UnifiedState,
  targetDocument,
  MGA_saveJSON,
  normalizeAbilityName,
  updateAllLogVisibility
}) {
  const container = targetDocument.getElementById('individual-abilities-list');
  if (!container) return;

  const abilities = getAllUniqueAbilities({ UnifiedState });
  container.innerHTML = '';

  if (abilities.length === 0) {
    container.innerHTML = '<div style="color: #888; text-align: center;">No individual abilities found in logs</div>';
    return;
  }

  abilities.forEach(ability => {
    const label = targetDocument.createElement('label');
    label.className = 'mga-checkbox-group';
    label.style.display = 'block';
    label.style.marginBottom = '4px';

    const checkbox = targetDocument.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mga-checkbox';
    checkbox.checked = UnifiedState.data.customMode.selectedAbilities[ability] || false;

    checkbox.addEventListener('change', e => {
      UnifiedState.data.customMode.selectedAbilities[ability] = e.target.checked;
      MGA_saveJSON('MGA_customMode', UnifiedState.data.customMode);
      updateAllLogVisibility();
    });

    const span = targetDocument.createElement('span');
    span.className = 'mga-label';
    span.textContent = ` ${normalizeAbilityName(ability)}`;

    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}

/**
 * Select all filters for a given mode
 * @param {string} mode - Filter mode ('categories', 'byPet', 'custom')
 * @param {Object} dependencies - Injected dependencies
 */
export function selectAllFilters(
  mode,
  { UnifiedState, targetDocument, MGA_saveJSON, getAllUniquePets, populatePetSpeciesList, updateAllLogVisibility }
) {
  if (mode === 'categories') {
    Object.keys(UnifiedState.data.abilityFilters).forEach(key => {
      UnifiedState.data.abilityFilters[key] = true;
      const checkbox = targetDocument.querySelector(`[data-filter="${key}"]`);
      if (checkbox) checkbox.checked = true;
    });
    MGA_saveJSON('MGA_abilityFilters', UnifiedState.data.abilityFilters);
  } else if (mode === 'byPet') {
    const pets = getAllUniquePets({ UnifiedState });
    pets.forEach(pet => {
      UnifiedState.data.petFilters.selectedPets[pet] = true;
    });
    MGA_saveJSON('MGA_petFilters', UnifiedState.data.petFilters);
    populatePetSpeciesList({ UnifiedState, targetDocument, MGA_saveJSON, getAllUniquePets, updateAllLogVisibility });
  } else if (mode === 'custom') {
    const abilities = getAllUniqueAbilities({ UnifiedState });
    abilities.forEach(ability => {
      UnifiedState.data.customMode.selectedAbilities[ability] = true;
    });
    MGA_saveJSON('MGA_customMode', UnifiedState.data.customMode);
    populateIndividualAbilities({ UnifiedState, targetDocument, MGA_saveJSON, updateAllLogVisibility });
  }
  updateAllLogVisibility();
}

/**
 * Deselect all filters for a given mode
 * @param {string} mode - Filter mode ('categories', 'byPet', 'custom')
 * @param {Object} dependencies - Injected dependencies
 */
export function selectNoneFilters(
  mode,
  {
    UnifiedState,
    targetDocument,
    MGA_saveJSON,
    populatePetSpeciesList,
    populateIndividualAbilities,
    updateAllLogVisibility
  }
) {
  if (mode === 'categories') {
    Object.keys(UnifiedState.data.abilityFilters).forEach(key => {
      UnifiedState.data.abilityFilters[key] = false;
      const checkbox = targetDocument.querySelector(`[data-filter="${key}"]`);
      if (checkbox) checkbox.checked = false;
    });
    MGA_saveJSON('MGA_abilityFilters', UnifiedState.data.abilityFilters);
  } else if (mode === 'byPet') {
    UnifiedState.data.petFilters.selectedPets = {};
    MGA_saveJSON('MGA_petFilters', UnifiedState.data.petFilters);
    populatePetSpeciesList({ UnifiedState, targetDocument, MGA_saveJSON, updateAllLogVisibility });
  } else if (mode === 'custom') {
    UnifiedState.data.customMode.selectedAbilities = {};
    MGA_saveJSON('MGA_customMode', UnifiedState.data.customMode);
    populateIndividualAbilities({ UnifiedState, targetDocument, MGA_saveJSON, updateAllLogVisibility });
  }
  updateAllLogVisibility();
}

/**
 * Export ability logs to CSV file
 * @param {Object} dependencies - Injected dependencies
 */
export function exportAbilityLogs({ MGA_getAllLogs, productionWarn, normalizeAbilityName, targetDocument }) {
  const allLogs = MGA_getAllLogs();
  if (!allLogs.length) {
    productionWarn('⚠️ No logs to export!');
    return;
  }

  const headers = 'Date,Time,Pet Name,Ability Type,Details\r\n';
  const csvContent = allLogs
    .map(log => {
      const date = new Date(log.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        log.petName,
        normalizeAbilityName(log.abilityType),
        JSON.stringify(log.data || '')
      ]
        .map(field => `"${String(field).replace(/"/g, '""')}"`)
        .join(',');
    })
    .join('\r\n');

  const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = targetDocument.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `MagicGarden_AbilityLogs_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

/**
 * Load a pet preset by numeric index
 * @param {number} number - Preset index (1-based)
 * @param {Object} dependencies - Injected dependencies
 */
export function loadPresetByNumber(number, { UnifiedState, loadPetPreset, productionLog }) {
  const presets = Object.keys(UnifiedState.data.petPresets);
  if (presets[number - 1]) {
    const presetName = presets[number - 1];
    const preset = UnifiedState.data.petPresets[presetName];
    loadPetPreset(preset, { UnifiedState, productionLog });
    productionLog(`🐾 Loaded preset ${number}: ${presetName}`);
  }
}

/* ====================================================================================
 * UTILITY FUNCTIONS (SUPPORTING)
 * ====================================================================================
 */

/**
 * Normalize ability name (fix spacing, roman numerals, etc.)
 * @param {string} name - Raw ability name
 * @param {Object} dependencies - Injected dependencies
 * @returns {string} Normalized ability name
 */
export function normalizeAbilityName(name, { UnifiedState, logDebug } = {}) {
  if (!name || typeof name !== 'string') return name;

  // Fix missing spaces before roman numerals
  const normalized = name
    .replace(/([a-z])III$/i, '$1 III') // "FinderIII" → "Finder III"
    .replace(/([a-z])II$/i, '$1 II') // "FinderII" → "Finder II"
    .replace(/([a-z])I$/i, '$1 I') // "FinderI" → "Finder I"
    .replace(/produce\s*scale\s*boost/gi, 'Crop Size Boost') // Game renamed this ability
    .trim();

  // Log normalization if name was changed
  if (normalized !== name && UnifiedState?.data?.settings?.debugMode && logDebug) {
    logDebug('ABILITY-LOGS', `📝 Normalized ability name: "${name}" → "${normalized}"`);
  }

  return normalized;
}

/**
 * Format timestamp based on user settings
 * @param {number} timestamp - Unix timestamp
 * @param {Object} dependencies - Injected dependencies
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp, { UnifiedState, MGA_AbilityCache }) {
  // PERFORMANCE: Check cache first
  const cacheKey = `${timestamp}_${UnifiedState.data.settings.detailedTimestamps}`;
  if (MGA_AbilityCache.timestamps.has(cacheKey)) {
    return MGA_AbilityCache.timestamps.get(cacheKey);
  }

  const date = new Date(timestamp);
  let formatted;
  if (UnifiedState.data.settings.detailedTimestamps) {
    // Return HH:MM:SS format
    formatted = date.toLocaleTimeString(undefined, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } else {
    // Return H:MM AM/PM format
    formatted = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // PERFORMANCE: Cache result
  MGA_AbilityCache.timestamps.set(cacheKey, formatted);

  return formatted;
}

/**
 * Get garden crop if there's only one unique species
 * @param {Window} targetWindow - Target window object
 * @returns {string|null} Species name if unique, null otherwise
 */
export function getGardenCropIfUnique(targetWindow) {
  const tileObjects = targetWindow.gardenInfo?.garden?.tileObjects;
  if (!tileObjects) return null;

  // Count unique species (only plants)
  const speciesSet = new Set();
  const tiles = Object.values(tileObjects);

  tiles.forEach(tile => {
    if (tile?.species && tile.objectType === 'plant') {
      speciesSet.add(tile.species);
    }
  });

  // Only return if there's exactly ONE unique species
  if (speciesSet.size === 1) {
    return Array.from(speciesSet)[0];
  }

  return null;
}

/* ====================================================================================
 * ABILITY CONSTANTS AND CACHE
 * ====================================================================================
 */

// List of all known ability types for validation
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
 * Check if an ability type is known/valid
 * @param {string} abilityType - Ability type to check
 * @returns {boolean} True if known
 */
export function isKnownAbilityType(abilityType) {
  if (!abilityType) return false;
  return KNOWN_ABILITY_TYPES.includes(abilityType);
}

/**
 * Initialize ability cache
 * @param {Object} dependencies - Injected dependencies
 * @returns {Object} Cache object
 */
export function initAbilityCache({ targetWindow }) {
  const cache = {
    categories: new Map(),
    timestamps: new Map(),
    normalizedNames: new Map(),
    lastTimestampUpdate: 0
  };

  // Clear timestamp cache every minute
  setInterval(() => {
    cache.timestamps.clear();
    cache.lastTimestampUpdate = Date.now();
  }, 60000);

  return cache;
}

/* ====================================================================================
 * LOG MEMORY MANAGEMENT
 * ====================================================================================
 */

/**
 * Manage log memory - archive old logs to storage
 * @param {Array} logs - Array of logs
 * @param {Object} dependencies - Injected dependencies
 * @returns {Array} Managed logs (recent ones kept in memory)
 */
export function MGA_manageLogMemory(logs, { MGA_MemoryConfig, MGA_loadJSON, MGA_debouncedSave, productionLog }) {
  if (!Array.isArray(logs) || logs.length <= MGA_MemoryConfig.maxLogsInMemory) {
    return logs;
  }

  productionLog(
    `🧠 [MEMORY] Managing log memory: ${logs.length} logs, keeping ${MGA_MemoryConfig.maxLogsInMemory} in memory`
  );

  const recentLogs = logs.slice(0, MGA_MemoryConfig.maxLogsInMemory);
  const archivedLogs = logs.slice(MGA_MemoryConfig.maxLogsInMemory);

  if (archivedLogs.length > 0) {
    const existingArchive = MGA_loadJSON('MGA_petAbilityLogs_archive', []);
    const combinedArchive = [...archivedLogs, ...existingArchive].slice(0, MGA_MemoryConfig.maxLogsInStorage);
    MGA_debouncedSave('MGA_petAbilityLogs_archive', combinedArchive);
    productionLog(`📦 [MEMORY] Archived ${archivedLogs.length} logs to storage`);
  }

  return recentLogs;
}

/**
 * Get all logs (memory + archived)
 * @param {Object} dependencies - Injected dependencies
 * @returns {Array} All logs sorted by timestamp
 */
export function MGA_getAllLogs({ UnifiedState, MGA_loadJSON, productionLog }) {
  const memoryLogs = UnifiedState.data?.petAbilityLogs || [];
  const archivedLogs = MGA_loadJSON('MGA_petAbilityLogs_archive', []);

  const allLogs = [...memoryLogs, ...archivedLogs];
  allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  productionLog(
    `📜 [MEMORY] Retrieved ${memoryLogs.length} memory logs + ${archivedLogs.length} archived logs = ${allLogs.length} total`
  );
  return allLogs;
}

/* ====================================================================================
 * ABILITY LOG DISPLAY & UPDATES
 * ====================================================================================
 */

/**
 * Categorize ability for display (alternative categorization logic)
 * @param {string} abilityType - Ability type
 * @returns {string} Category key
 */
export function categorizeAbility(abilityType) {
  const cleanType = (abilityType || '').toLowerCase();

  if (cleanType.includes('xp') && cleanType.includes('boost')) return 'xp-boost';
  if (cleanType.includes('hatch') && cleanType.includes('xp')) return 'xp-boost';
  if (cleanType.includes('crop') && (cleanType.includes('size') || cleanType.includes('scale')))
    return 'crop-size-boost';
  if (cleanType.includes('sell') && cleanType.includes('boost')) return 'selling';
  if (cleanType.includes('refund')) return 'selling';
  if (cleanType.includes('double') && cleanType.includes('harvest')) return 'harvesting';
  if (cleanType.includes('growth') && cleanType.includes('boost')) return 'growth-speed';
  if (cleanType.includes('plant') && cleanType.includes('growth')) return 'growth-speed';
  if (cleanType.includes('egg') && cleanType.includes('growth')) return 'growth-speed';
  if (cleanType.includes('rainbow') || cleanType.includes('gold')) return 'special-mutations';

  return 'other';
}

/**
 * Format log data object for display
 * @param {Object} data - Log data object
 * @returns {string} Formatted string
 */
export function formatLogData(data) {
  if (!data || typeof data !== 'object') return '';

  const formatted = Object.entries(data)
    .filter(([key, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return formatted.length > 60 ? formatted.substring(0, 60) + '...' : formatted;
}

/**
 * Format relative time for display
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted relative time
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s ago`;
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

/* ====================================================================================
 * ABILITY LOG DISPLAY UPDATE FUNCTIONS (LARGE)
 * ====================================================================================
 */

/**
 * Update ability log display in a given context (document or overlay)
 * This is a large function (~195 lines) that handles rendering logs with full styling
 * @param {Document|Element} context - Context to update (document or overlay element)
 * @param {Object} dependencies - Injected dependencies
 */
export function updateAbilityLogDisplay(
  context,
  {
    MGA_getAllLogs,
    shouldLogAbility,
    categorizeAbilityToFilterKey,
    formatTimestamp,
    normalizeAbilityName,
    formatLogData,
    UnifiedState,
    targetDocument,
    debugLog,
    CONFIG
  }
) {
  const abilityLogs = context.querySelector('#ability-logs');
  if (!abilityLogs) {
    debugLog('ABILITY_LOGS', 'No ability logs element found in context', {
      isDocument: context === document,
      className: context.className || 'unknown'
    });
    return;
  }

  // Preserve drag state
  const isOverlay = context.classList?.contains('mga-overlay-content-only');
  const isDragInProgress = context.getAttribute?.('data-dragging') === 'true';
  if (isOverlay && isDragInProgress) {
    debugLog('ABILITY_LOGS', 'Skipping content update during drag operation', {
      overlayId: context.id
    });
    return;
  }

  const logs = MGA_getAllLogs({ UnifiedState, MGA_loadJSON: window.MGA_loadJSON, productionLog: window.productionLog });
  const filteredLogs = logs.filter(log =>
    shouldLogAbility(log.abilityType, log.petName, { UnifiedState, categorizeAbilityToFilterKey })
  );

  debugLog('ABILITY_LOGS', 'Updating ability log display', {
    totalLogs: logs.length,
    filteredLogs: filteredLogs.length,
    filterMode: UnifiedState.data.filterMode
  });

  if (CONFIG?.DEBUG?.FLAGS?.FIX_VALIDATION) {
    console.log('[FIX_ABILITY_LOGS] Update called:', {
      totalLogs: logs.length,
      filteredLogs: filteredLogs.length,
      filterMode: UnifiedState.data.filterMode,
      elementFound: !!abilityLogs,
      contextType: context === document ? 'document' : 'overlay'
    });
  }

  const htmlParts = [];
  const categoryData = {
    xpBoost: { icon: '💫', color: '#4a9eff', label: 'XP Boost' },
    cropSizeBoost: { icon: '📈', color: '#10b981', label: 'Crop Size' },
    selling: { icon: '💰', color: '#f59e0b', label: 'Selling' },
    harvesting: { icon: '🌾', color: '#84cc16', label: 'Harvesting' },
    growthSpeed: { icon: '🐢', color: '#06b6d4', label: 'Growth Speed' },
    specialMutations: { icon: '🌈✨', color: '#8b5cf6', label: 'Special' },
    other: { icon: '🔧', color: '#6b7280', label: 'Other' }
  };

  filteredLogs.forEach(log => {
    const category = categorizeAbilityToFilterKey(log.abilityType, { MGA_AbilityCache: window.MGA_AbilityCache });
    const catData = categoryData[category] || categoryData.other;
    const formattedTime = formatTimestamp(log.timestamp, { UnifiedState, MGA_AbilityCache: window.MGA_AbilityCache });
    const isRecent = Date.now() - log.timestamp < 10000;
    const displayAbilityName = normalizeAbilityName(log.abilityType, { UnifiedState });

    htmlParts.push(`
      <div class="mga-log-item ${isRecent ? 'mga-log-recent' : ''}" data-category="${category}" data-ability-type="${log.abilityType}" data-pet-name="${log.petName}" style="--category-color: ${catData.color}">
        <div class="mga-log-header">
          <span class="mga-log-icon">${catData.icon}</span>
          <span class="mga-log-meta">
            <span class="mga-log-pet" style="color: ${catData.color}; font-weight: 600;">${log.petName}</span>
            <span class="mga-log-time">${formattedTime}</span>
          </span>
        </div>
        <div class="mga-log-ability">${displayAbilityName}</div>
        ${log.data && Object.keys(log.data).length > 0 ? `<div class="mga-log-details">${formatLogData(log.data)}</div>` : ''}
      </div>
    `);
  });

  const fragment = targetDocument.createDocumentFragment();
  const tempContainer = targetDocument.createElement('div');

  if (htmlParts.length === 0) {
    const mode = UnifiedState.data.filterMode || 'categories';
    const modeText = mode === 'categories' ? 'category filters' : mode === 'byPet' ? 'pet filters' : 'custom filters';
    tempContainer.innerHTML = `<div class="mga-log-empty">
      <div style="color: #888; text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
        <div>No abilities match the current ${modeText}</div>
        <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Try adjusting your filter settings</div>
      </div>
    </div>`;
  } else {
    tempContainer.innerHTML = htmlParts.join('');
    setTimeout(() => {
      if (abilityLogs.scrollHeight > abilityLogs.clientHeight) {
        abilityLogs.scrollTop = 0;
      }
    }, 100);
  }

  while (tempContainer.firstChild) {
    fragment.appendChild(tempContainer.firstChild);
  }

  abilityLogs.innerHTML = '';
  abilityLogs.appendChild(fragment);

  // Add styles if not present
  if (!context.querySelector('#mga-log-styles')) {
    const logStyles = targetDocument.createElement('style');
    logStyles.id = 'mga-log-styles';
    logStyles.textContent = `
      .mga-log-item { margin: 4px 0; padding: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.02);
        border-left: 2px solid var(--category-color, #6b7280); transition: all 0.2s ease; font-size: 11px; line-height: 1.3; }
      .mga-log-item:hover { background: rgba(255, 255, 255, 0.05); transform: translateX(2px); }
      .mga-log-recent { background: rgba(74, 158, 255, 0.30); border-color: #4a9eff;
        box-shadow: 0 0 8px rgba(74, 158, 255, 0.3); animation: mgaLogPulse 2s ease-out; }
      @keyframes mgaLogPulse { 0% { box-shadow: 0 0 8px rgba(74, 158, 255, 0.6); }
        100% { box-shadow: 0 0 8px rgba(74, 158, 255, 0.3); } }
      .mga-log-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
      .mga-log-icon { font-size: 12px; }
      .mga-log-meta { display: flex; align-items: center; gap: 8px; flex: 1; }
      .mga-log-pet { font-weight: 600; font-size: 11px; }
      .mga-log-time { font-size: 9px; color: rgba(255, 255, 255, 0.6); margin-left: auto; }
      .mga-log-ability { color: rgba(255, 255, 255, 0.9); font-size: 10px; margin: 2px 0 0 18px; }
      .mga-log-details { font-size: 9px; color: rgba(255, 255, 255, 0.5); margin: 2px 0 0 18px; font-style: italic; }
      .mga-log-empty { text-align: center; padding: 20px; color: #888; }
    `;
    (context.head || context.querySelector('head') || targetDocument.head).appendChild(logStyles);
  }
}

/**
 * Update log visibility via CSS (performance optimization)
 * @param {Document|Element} context - Context to update
 * @param {Object} dependencies - Injected dependencies
 */
export function updateLogVisibility(context, { UnifiedState, debugLog }) {
  const abilityLogs = context.querySelector('#ability-logs');
  if (!abilityLogs) return;

  const filterMode = UnifiedState.data.filterMode || 'categories';
  const logItems = abilityLogs.querySelectorAll('.mga-log-item');

  debugLog('ABILITY_LOGS', 'Updating log visibility via CSS', {
    filterMode,
    totalItems: logItems.length
  });

  logItems.forEach(item => {
    let shouldShow = false;

    if (filterMode === 'categories') {
      const category = item.dataset.category;
      shouldShow = UnifiedState.data.abilityFilters[category] || false;
    } else if (filterMode === 'byPet') {
      const petName = item.dataset.petName;
      shouldShow = UnifiedState.data.petFilters.selectedPets[petName] || false;
    } else if (filterMode === 'custom') {
      const abilityType = item.dataset.abilityType;
      shouldShow = UnifiedState.data.customAbilityFilters[abilityType] || false;
    }

    item.style.display = shouldShow ? '' : 'none';
  });
}

/**
 * Update log visibility across all contexts
 * @param {Object} dependencies - Injected dependencies
 */
export function updateAllLogVisibility({ UnifiedState, targetDocument, debugLog, updateLogVisibility }) {
  debugLog('ABILITY_LOGS', 'Updating log visibility across all contexts');

  updateLogVisibility(document, { UnifiedState, debugLog });

  const allOverlays = targetDocument.querySelectorAll('.mga-overlay-content-only, .mga-overlay');
  allOverlays.forEach(overlay => {
    if (overlay.offsetParent === null) return;
    if (overlay.querySelector('#ability-logs')) {
      updateLogVisibility(overlay, { UnifiedState, debugLog });
    }
  });
}

/**
 * Update ability log displays across ALL contexts (main + overlays + popouts)
 * @param {boolean} force - Force update even if no new logs
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.lastLogCount - Ref to track log count
 */
export function updateAllAbilityLogDisplays(force, dependencies) {
  const { UnifiedState, targetDocument, debugLog, CONFIG, updateAbilityLogDisplay, lastLogCount } = dependencies;

  const currentLogCount = UnifiedState.data.petAbilityLogs?.length || 0;

  if (CONFIG?.DEBUG?.FLAGS?.FIX_VALIDATION) {
    console.log('[FIX_ABILITY_LOGS] Update called:', {
      force,
      currentLogCount,
      lastLogCount: lastLogCount.value,
      willUpdate: force || currentLogCount !== lastLogCount.value,
      petAbilityLogsExists: !!UnifiedState.data.petAbilityLogs
    });
  }

  if (!force && currentLogCount === lastLogCount.value) {
    debugLog('ABILITY_LOGS', 'Skipping update - no new logs');
    return;
  }
  lastLogCount.value = currentLogCount;

  debugLog('ABILITY_LOGS', 'Updating ability logs across all contexts');

  // Update main document
  updateAbilityLogDisplay(document, dependencies);

  // Update overlays
  const allOverlays = targetDocument.querySelectorAll('.mga-overlay-content-only, .mga-overlay, .mgh-popout');
  allOverlays.forEach(overlay => {
    if (overlay.offsetParent === null) return;
    if (overlay.querySelector('#ability-logs')) {
      updateAbilityLogDisplay(overlay, dependencies);
      debugLog('ABILITY_LOGS', 'Updated overlay/widget ability logs', {
        overlayId: overlay.id || overlay.className
      });
    }
  });

  // Update separate window pop-outs
  UnifiedState.data.popouts.windows.forEach((windowRef, tabName) => {
    if (windowRef && !windowRef.closed && tabName === 'abilities') {
      try {
        const popoutContent = windowRef.document?.getElementById('popout-content');
        if (popoutContent) {
          const freshContent = dependencies.getAbilitiesTabContent();
          popoutContent.innerHTML = freshContent;
          if (typeof dependencies.setupAbilitiesTabHandlers === 'function') {
            dependencies.setupAbilitiesTabHandlers.call(window, windowRef.document);
          }
          debugLog('ABILITY_LOGS', 'Updated pop-out via direct DOM manipulation');
        } else if (windowRef.refreshPopoutContent && typeof windowRef.refreshPopoutContent === 'function') {
          windowRef.refreshPopoutContent('abilities');
          debugLog('ABILITY_LOGS', 'Updated pop-out via refresh function');
        }
      } catch (e) {
        debugLog('ABILITY_LOGS', 'Error updating separate window:', e.message);
        try {
          windowRef.location.reload();
          debugLog('ABILITY_LOGS', 'Forced pop-out refresh via reload');
        } catch (e2) {
          debugLog('ABILITY_LOGS', 'Window is dead, removing reference');
          UnifiedState.data.popouts.windows.delete(tabName);
        }
      }
    }
  });
}

/* ====================================================================================
 * INSTANT FEED UI FUNCTIONS (PHASE 9)
 * ====================================================================================
 */

/**
 * Create instant feed button for pet with game-native styling
 * @param {number} petIndex - Pet slot index (0-2)
 * @param {Object} dependencies - Injected dependencies
 * @param {Document} dependencies.targetDocument - Target document (may be popout/iframe)
 * @param {Object} dependencies.UnifiedState - Global unified state
 * @param {Function} dependencies.handleInstantFeed - Click handler for instant feed
 * @returns {HTMLButtonElement} - Created button element
 */
export function createInstantFeedButton(petIndex, { targetDocument, UnifiedState, handleInstantFeed }) {
  const btn = targetDocument.createElement('button');
  btn.className = 'mgtools-instant-feed-btn';
  btn.textContent = 'Feed';
  btn.setAttribute('data-pet-index', petIndex);
  btn.setAttribute('data-cooldown', 'false');

  const shouldHide = UnifiedState.data.settings.hideFeedButtons;

  btn.style.cssText = `
    position: absolute !important;
    right: -50px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 48px !important;
    height: 24px !important;
    border: 2px solid #FFC83D !important;
    background: rgba(0, 0, 0, 0.75) !important;
    color: rgb(205, 200, 193) !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    z-index: 9999 !important;
    transition: all 0.2s ease !important;
    pointer-events: auto !important;
    display: ${shouldHide ? 'none' : 'block'} !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.setProperty('box-shadow', '0 0 8px rgba(255, 200, 61, 0.6)', 'important');
    btn.style.setProperty('transform', 'translateY(-50%) scale(1.05)', 'important');
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.setProperty('box-shadow', 'none', 'important');
    btn.style.setProperty('transform', 'translateY(-50%) scale(1)', 'important');
  });

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    handleInstantFeed(petIndex, btn);
  });

  return btn;
}

/**
 * Flash button with success/error color feedback
 * @param {HTMLButtonElement} btn - Button element to flash
 * @param {string} type - Flash type: 'success' or 'error'
 */
export function flashButton(btn, type) {
  const color = type === 'success' ? '#4CAF50' : '#F44336';
  const originalBorder = btn.style.borderColor;
  const originalShadow = btn.style.boxShadow;

  btn.style.borderColor = color;
  btn.style.boxShadow = `0 0 10px ${color}`;

  setTimeout(() => {
    btn.style.borderColor = originalBorder || '#FFC83D';
    btn.style.boxShadow = originalShadow || 'none';
  }, 300);
}

/**
 * Handle instant feed action with 3-tier fallback and auto-favorite protection
 * @param {number} petIndex - Pet slot index (0-2)
 * @param {HTMLButtonElement} buttonEl - Feed button element
 * @param {Object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window (may be popout/iframe)
 * @param {Object} dependencies.UnifiedState - Global unified state
 * @param {Function} dependencies.getAtomValue - Jotai atom getter (async)
 * @param {Function} dependencies.readAtom - Jotai atom reader (sync)
 * @param {Function} dependencies.readMyPetSlots - Get current pet slots
 * @param {Object} dependencies.PET_FEED_CATALOG - Pet species → compatible crops mapping
 * @param {Function} dependencies.sendFeedPet - Send feed pet message
 * @param {Function} dependencies.feedPetEnsureSync - Feed with verification
 * @param {Function} dependencies.flashButton - Button flash feedback
 * @param {Set} dependencies.usedCropIds - Set of used crop IDs (shared state)
 * @returns {Promise<void>}
 */
export async function handleInstantFeed(
  petIndex,
  buttonEl,
  {
    targetWindow,
    UnifiedState,
    getAtomValue,
    readAtom,
    readMyPetSlots,
    PET_FEED_CATALOG,
    sendFeedPet,
    feedPetEnsureSync,
    flashButton,
    usedCropIds
  }
) {
  if (buttonEl.disabled) return;

  buttonEl.disabled = true;
  buttonEl.textContent = '...';
  buttonEl.style.opacity = '0.6';

  try {
    let pet = null;

    if (targetWindow.jotaiAtomCache) {
      try {
        const freshPetSlots = await getAtomValue('myPetSlotInfosAtom');
        if (freshPetSlots?.[petIndex]) {
          pet = freshPetSlots[petIndex];
          console.log('[MGTOOLS-FIX-A] Using fresh pet data from Jotai atom cache (Tier 1)');
        }
      } catch (e) {
        console.warn('[MGTOOLS-FIX-A] Tier 1 (atom cache) failed:', e.message);
      }
    }

    if (!pet && UnifiedState.atoms.activePets?.[petIndex]) {
      pet = UnifiedState.atoms.activePets[petIndex];
      console.log('[MGTOOLS-FIX-A] Using UnifiedState atoms (Tier 2)');
    }

    if (!pet && targetWindow.myData?.petSlots?.[petIndex]) {
      pet = targetWindow.myData.petSlots[petIndex];
      console.log('[MGTOOLS-FIX-A] Using window.myData (Tier 3)');
    }

    if (!pet) {
      console.error('[MGTOOLS-FIX-A] ❌ No pet data available from any source');
      alert('Pet data not ready. Please wait a moment and try again.');
      flashButton(buttonEl, 'error');
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
      return;
    }

    const species = pet.petSpecies;
    const petItemId = pet.id;

    console.log('[Feed-Flow-1] 🐾 Active Pet:', {
      species,
      petItemId: petItemId.substring(0, 8) + '...',
      hunger: pet.hunger,
      hungerPercentage: pet.hunger ? `${pet.hunger}%` : 'N/A'
    });

    const compatibleCrops = PET_FEED_CATALOG[species];

    console.log(`[Feed-Flow-2] 🌾 Compatible crops for ${species}:`, compatibleCrops || []);

    if (!compatibleCrops || compatibleCrops.length === 0) {
      console.error('[MGTools Feed] No compatible crops for', species);
      flashButton(buttonEl, 'error');
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
      return;
    }

    if (typeof unsafeWindow !== 'undefined' && unsafeWindow.__mga_cachedInventory) {
      delete unsafeWindow.__mga_cachedInventory;
    }

    let inventoryItems = null;

    if (targetWindow.jotaiAtomCache) {
      try {
        const freshInventory = await getAtomValue('myCropInventoryAtom');
        if (freshInventory?.items) {
          inventoryItems = freshInventory.items;
          console.log('[MGTOOLS-FIX-A] Using fresh inventory from Jotai atom cache (Tier 1)');
        }
      } catch (e) {
        console.warn('[MGTOOLS-FIX-A] Inventory Tier 1 (atom cache) failed:', e.message);
      }
    }

    if (!inventoryItems) {
      try {
        inventoryItems = readAtom('myCropItemsAtom') || [];
        if (inventoryItems.length > 0) {
          console.log('[MGTOOLS-FIX-A] Using myCropItemsAtom (Tier 1.5)');
        }
      } catch (e) {
        console.warn('[MGTOOLS-FIX-A] myCropItemsAtom failed:', e.message);
      }
    }

    if (!inventoryItems || inventoryItems.length === 0) {
      if (UnifiedState.atoms.inventory?.items) {
        inventoryItems = UnifiedState.atoms.inventory.items.filter(
          i => i.itemType === 'Produce' || i.itemType === 'Crop'
        );
        console.log('[MGTOOLS-FIX-A] Using UnifiedState inventory (Tier 2)');
      }
    }

    if (!inventoryItems || inventoryItems.length === 0) {
      if (targetWindow.myData?.inventory?.items) {
        inventoryItems = targetWindow.myData.inventory.items;
        console.log('[MGTOOLS-FIX-A] Using window.myData inventory (Tier 3)');
      }
    }

    console.log('[Feed-Inventory] Fresh read:', inventoryItems?.length || 0, 'items');

    if (!inventoryItems || inventoryItems.length === 0) {
      console.error('[MGTOOLS-FIX-A] ❌ No inventory data available from any source');
      alert('Inventory not ready. Please wait a moment.');
      flashButton(buttonEl, 'error');
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
      return;
    }

    console.log('[Feed-Flow-3] 📦 Full inventory:', {
      count: inventoryItems.length,
      species: inventoryItems.map(item => item.species),
      items: inventoryItems
    });

    const favoritedSpecies = UnifiedState.data?.autoFavorite?.selectedSpecies || [];

    console.log('[Feed-Flow-4] 🚫 Favorited species:', favoritedSpecies);

    const nonFavoritedCompatibleCrops = inventoryItems.filter(item => {
      if (!item || !item.species || !item.id) return false;
      const isCompatible = compatibleCrops.includes(item.species);
      const isFavorited = favoritedSpecies.includes(item.species);
      const notUsed = !usedCropIds.has(item.id);
      return isCompatible && !isFavorited && notUsed;
    });

    console.log('[Feed-Flow-5] ✅ Non-favorited compatible crops available:', {
      count: nonFavoritedCompatibleCrops.length,
      species: nonFavoritedCompatibleCrops.map(item => item.species),
      items: nonFavoritedCompatibleCrops
    });

    const cropToFeed = nonFavoritedCompatibleCrops[0];

    console.log(`[Feed-Flow-6] ❓ Compatible crop exists: ${!!cropToFeed}`);

    if (!cropToFeed) {
      console.error('[MGTools Feed] No feedable crops (compatible, non-favorited, unused)');
      console.log('[MGTools Feed] Compatible species:', compatibleCrops);
      console.log('[MGTools Feed] Favorited species:', favoritedSpecies);
      console.log('[MGTools Feed] Used crop IDs:', Array.from(usedCropIds));
      usedCropIds.clear();
      flashButton(buttonEl, 'error');
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
      return;
    }

    usedCropIds.add(cropToFeed.id);

    const cropItemId = cropToFeed?.id || cropToFeed?.inventoryItemId || cropToFeed?.itemId;

    console.log('[Feed-Flow-7a] 🧪 Selected crop:', {
      species: cropToFeed?.species,
      fullItem: cropToFeed,
      resolvedId: cropItemId
    });

    if (!cropItemId) {
      console.error('[Feed] No valid ID found in crop item:', cropToFeed);
      flashButton(buttonEl, 'error');
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
      return;
    }

    const currentInventory = inventoryItems || [];
    const cropStillExists = currentInventory.some(
      item => item.id === cropItemId || item.inventoryItemId === cropItemId || item.itemId === cropItemId
    );

    if (!cropStillExists) {
      console.error('[Feed] Crop no longer in inventory! ID:', cropItemId);
      console.log(
        '[Feed] Current inventory IDs:',
        currentInventory.map(i => i.id || i.inventoryItemId || i.itemId)
      );
      usedCropIds.delete(cropItemId);
      flashButton(buttonEl, 'error');
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
      return;
    }

    const slotsNow = readMyPetSlots() || [];
    const reboundPetItemId = slotsNow?.[petIndex]?.id || petItemId;
    if (reboundPetItemId !== petItemId) {
      console.warn('[Feed-Guard] Rebound petItemId from slots', {
        old: petItemId,
        new: reboundPetItemId,
        petIndex
      });
    }

    console.log('[Feed-Debug] 🚀 Sending FeedPet message with inventoryItemId');

    try {
      await sendFeedPet(reboundPetItemId, cropItemId);
      console.log(`[MGTools Feed] 🚀 Sent feed: ${species} with ${cropToFeed.species}`);

      flashButton(buttonEl, 'success');

      setTimeout(() => {
        buttonEl.disabled = false;
        buttonEl.textContent = 'Feed';
        buttonEl.style.opacity = '1';
      }, 200);

      feedPetEnsureSync(reboundPetItemId, cropItemId, petIndex, false)
        .then(result => {
          if (!result?.verified) {
            console.warn('[MGTools Feed] ⚠️ Background verification failed (feed may have worked anyway)');
          } else {
            console.log('[MGTools Feed] ✅ Background verification succeeded');
          }
        })
        .catch(err => console.warn('[MGTools Feed] Background verification error:', err));
    } catch (err) {
      console.warn('[MGTools Feed] ⚠️ Feed failed:', err.message);
      flashButton(buttonEl, 'error');
      usedCropIds.delete(cropToFeed.id);
      buttonEl.disabled = false;
      buttonEl.textContent = 'Feed';
      buttonEl.style.opacity = '1';
    }
  } catch (error) {
    console.error('[MGTools Feed] Error:', error);
    flashButton(buttonEl, 'error');

    buttonEl.disabled = false;
    buttonEl.textContent = 'Feed';
    buttonEl.style.opacity = '1';
  }
}

/* ====================================================================================
 * INSTANT FEED INITIALIZATION & POLLING (Phase 10)
 * ====================================================================================
 */

/**
 * Inject instant feed buttons next to pet avatars (container-based)
 * Uses re-entry guard to prevent infinite loop with MutationObserver
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Document} dependencies.targetDocument - Target document (may be iframe/popout)
 * @param {Window} dependencies.targetWindow - Target window
 * @param {Function} dependencies.createInstantFeedButton - Button factory function
 * @param {Function} dependencies.productionLog - Production logging function
 * @returns {Function} - Injection function
 */
export function injectInstantFeedButtons({ targetDocument, targetWindow, createInstantFeedButton, productionLog }) {
  // Re-entry guard to prevent infinite loop
  let isInjecting = false;

  return function inject() {
    // Prevent re-entry while already injecting (avoids MutationObserver infinite loop)
    if (isInjecting) {
      return;
    }

    try {
      isInjecting = true;
      console.log('[MGTools Feed] 🔍 Starting container-based injection...');

      // Check which buttons already exist by data-pet-index
      const existingButtons = targetDocument.querySelectorAll('.mgtools-instant-feed-btn');
      const existingIndices = new Set();
      existingButtons.forEach(btn => {
        const index = btn.getAttribute('data-pet-index');
        if (index !== null) {
          existingIndices.add(parseInt(index, 10));
        }
      });

      if (existingIndices.size === 3) {
        isInjecting = false;
        return;
      }

      const missingIndices = [0, 1, 2].filter(i => !existingIndices.has(i));

      // Find ALL canvas elements
      const allCanvases = Array.from(targetDocument.querySelectorAll('canvas'));

      // Filter to pet avatar canvases (left 15% of screen, reasonable size)
      const viewportWidth = targetWindow.innerWidth;
      const viewportHeight = targetWindow.innerHeight;
      const leftThreshold = viewportWidth * 0.15;
      const minTop = 80;
      const maxTop = viewportHeight - 100;

      const petAvatarCanvases = allCanvases
        .filter(canvas => {
          const rect = canvas.getBoundingClientRect();
          const isOnScreen = rect.left >= 0 && rect.left < leftThreshold;
          const hasReasonableSize = rect.width > 20 && rect.width < 200 && rect.height > 20 && rect.height < 200;
          const isInValidVerticalRange = rect.top > minTop && rect.top < maxTop;

          if (isOnScreen && hasReasonableSize && isInValidVerticalRange) {
            // Intentionally empty - just for debugging in original
          }

          return isOnScreen && hasReasonableSize && isInValidVerticalRange;
        })
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
        .slice(0, 3);

      if (petAvatarCanvases.length === 0) {
        console.warn('[MGTools Feed] ⚠️ No pet avatar canvases found!');
        isInjecting = false;
        return;
      }

      // For EACH canvas, find its pet panel container and inject button
      petAvatarCanvases.forEach((canvas, index) => {
        try {
          // Skip if button already exists
          if (existingIndices.has(index)) {
            return;
          }

          // Find the SMALLEST container with STR/INT text (the pet panel)
          let container = canvas.parentElement;
          let levelsUp = 0;
          const maxLevels = 10;
          const candidates = [];

          while (container && levelsUp < maxLevels && container !== targetDocument.body) {
            const hasStats = /STR\s+\d+|INT\s+\d+/.test(container.textContent);
            const rect = container.getBoundingClientRect();

            if (hasStats && rect.width < 200 && rect.height < 200) {
              // Valid small container with stats
              candidates.push({
                element: container,
                area: rect.width * rect.height,
                width: rect.width,
                height: rect.height
              });
            }

            container = container.parentElement;
            levelsUp++;
          }

          if (candidates.length === 0) {
            console.warn(`[MGTools Feed] ⚠️ No valid container found for pet ${index + 1}`);
            return;
          }

          // Use SMALLEST container (most direct parent)
          candidates.sort((a, b) => a.area - b.area);
          const targetContainer = candidates[0].element;

          console.log(`[MGTools Feed] 📐 Selected container:`, {
            width: candidates[0].width.toFixed(1),
            height: candidates[0].height.toFixed(1),
            tagName: targetContainer.tagName
          });

          // Check if button already exists in this container
          if (targetContainer.querySelector('.mgtools-instant-feed-btn')) {
            return;
          }

          // Set container to position: relative
          const currentPosition = targetWindow.getComputedStyle(targetContainer).position;
          if (currentPosition === 'static') {
            targetContainer.style.position = 'relative';
          }

          // Create and append button
          const btn = createInstantFeedButton(index);
          targetContainer.appendChild(btn);

          productionLog(`[MGTools Feed] Injected feed button ${index + 1}`);
        } catch (err) {
          console.error(`[MGTools Feed] Error processing canvas ${index + 1}:`, err);
        }
      });

      // Reset flag after successful injection
      isInjecting = false;
    } catch (error) {
      console.error('[MGTools Feed] Error in injectInstantFeedButtons:', error);
      isInjecting = false; // Reset flag even on error
    }
  };
}

/**
 * Initialize instant feed buttons with polling interval
 * Handles CSS visibility changes that MutationObserver can't detect
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Document} dependencies.targetDocument - Target document (may be iframe/popout)
 * @param {Window} dependencies.targetWindow - Target window
 * @param {Function} dependencies.createInstantFeedButton - Button factory function
 * @param {Function} dependencies.captureJotaiStore - Jotai store capture function
 * @param {Function} dependencies.productionLog - Production logging function
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.pollInterval=2000] - Polling interval in milliseconds
 */
export function initializeInstantFeedButtons(
  { targetDocument, targetWindow, UnifiedState, handleInstantFeed, captureJotaiStore, productionLog },
  options = {}
) {
  const { pollInterval = 2000 } = options;

  console.log('[MGTools Feed] 🚀 Initializing instant feed buttons with polling interval...');

  // Capture jotaiStore early (but don't block if unavailable)
  let jotaiStore = null;
  if (!jotaiStore) {
    jotaiStore = captureJotaiStore();
    if (jotaiStore) {
      console.log('[MGTools Feed] ✅ Jotai store captured at initialization');
    } else {
      console.log('[MGTools Feed] ⏳ Jotai store not ready yet - will use fallback data');
    }
  }

  /**
   * Helper to find all visible pet containers
   * @returns {HTMLElement[]} Array of visible pet containers
   */
  function findVisiblePetContainers() {
    const allCanvases = Array.from(targetDocument.querySelectorAll('canvas'));
    const viewportWidth = targetWindow.innerWidth;
    const viewportHeight = targetWindow.innerHeight;
    const leftThreshold = viewportWidth * 0.15;
    const minTop = 80;
    const maxTop = viewportHeight - 100;

    // Filter to pet avatar canvases (left side, reasonable size, visible)
    const petAvatarCanvases = allCanvases
      .filter(canvas => {
        const rect = canvas.getBoundingClientRect();

        // Check if visible (not hidden with CSS)
        const computedStyle = targetWindow.getComputedStyle(canvas);
        const isVisible =
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0;

        if (!isVisible) return false;

        const isOnScreen = rect.left >= 0 && rect.left < leftThreshold;
        const hasReasonableSize = rect.width > 20 && rect.width < 200 && rect.height > 20 && rect.height < 200;
        const isInValidVerticalRange = rect.top > minTop && rect.top < maxTop;

        return isOnScreen && hasReasonableSize && isInValidVerticalRange;
      })
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .slice(0, 3);

    // Find containers for each canvas
    const containers = [];
    petAvatarCanvases.forEach(canvas => {
      let container = canvas.parentElement;
      let levelsUp = 0;
      const maxLevels = 10;
      const candidates = [];

      while (container && levelsUp < maxLevels && container !== targetDocument.body) {
        const hasStats = /STR\s+\d+|INT\s+\d+/.test(container.textContent);
        const rect = container.getBoundingClientRect();

        if (hasStats && rect.width < 200 && rect.height < 200 && rect.width > 0) {
          candidates.push({
            element: container,
            area: rect.width * rect.height
          });
        }

        container = container.parentElement;
        levelsUp++;
      }

      if (candidates.length > 0) {
        // Use smallest container (most direct parent)
        candidates.sort((a, b) => a.area - b.area);
        containers.push(candidates[0].element);
      }
    });

    return containers;
  }

  /**
   * Helper to inject button into container
   * @param {HTMLElement} container - Container element
   * @param {number} index - Pet index (0-2)
   * @returns {boolean} - True if button was injected, false if already exists
   */
  function injectButton(container, index) {
    // Skip if button already exists
    if (container.querySelector('.mgtools-instant-feed-btn')) {
      return false;
    }

    try {
      // Set container to position: relative
      const currentPosition = targetWindow.getComputedStyle(container).position;
      if (currentPosition === 'static') {
        container.style.position = 'relative';
      }

      // Create and append button
      const btn = createInstantFeedButton(index, { targetDocument, UnifiedState, handleInstantFeed });
      container.appendChild(btn);

      return true;
    } catch (err) {
      console.error(`[MGTools Feed] Error injecting button ${index + 1}:`, err);
      return false;
    }
  }

  /**
   * Main polling function - checks and injects buttons if needed
   */
  function checkAndInjectButtons() {
    const containers = findVisiblePetContainers();

    if (containers.length === 0) {
      // No visible pet containers - buttons will be checked again next poll
      return;
    }

    // Check if we need to inject any buttons
    let injectedCount = 0;
    containers.forEach((container, index) => {
      const injected = injectButton(container, index);
      if (injected) injectedCount++;
    });

    // Log if buttons were re-injected (means they disappeared and came back)
    if (injectedCount > 0) {
      // Intentionally empty - could add logging here if needed
    }
  }

  // Initial injection
  checkAndInjectButtons();

  // Poll every pollInterval ms to check if buttons need re-injection
  // Reduced from 500ms for better performance while maintaining functionality
  // This handles CSS visibility changes that MutationObserver can't detect
  const interval = setInterval(() => {
    try {
      // Only check if pet containers are actually visible
      const petContainers = findVisiblePetContainers();
      if (petContainers.length > 0) {
        checkAndInjectButtons();
      }
    } catch (err) {
      console.error('[MGTools Feed] Error in polling:', err);
    }
  }, pollInterval);

  // Store interval ID for potential cleanup
  if (!targetWindow.MGToolsIntervals) {
    targetWindow.MGToolsIntervals = [];
  }
  targetWindow.MGToolsIntervals.push(interval);

  console.log(
    `[MGTools Feed] ✅ Polling active (${pollInterval}ms) - buttons will auto-reappear when containers become visible`
  );
  productionLog('✅ [MGTools] Instant feed buttons initialized with polling detection');
}

/* ====================================================================================
 * ADDITIONAL PET MANAGEMENT FUNCTIONS (Phase 11)
 * ====================================================================================
 */

/**
 * Check if preset contains Worm with Crop Eater ability
 * Uses same detection pattern as turtle timer (checks abilities array)
 *
 * @param {Array} preset - Array of pet objects
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @returns {boolean} - True if preset contains Worm with Crop Eater
 */
export function presetHasCropEater(preset, dependencies = {}) {
  const { productionLog = console.log } = dependencies;

  if (!preset || !Array.isArray(preset)) {
    return false;
  }

  // Filter for Worms with Crop Eater ability (same pattern as turtle timer)
  const wormsWithCropEater = preset.filter(
    p =>
      p &&
      p.petSpecies === 'Worm' &&
      p.abilities?.some(
        a =>
          a === 'Crop Eater' ||
          a === 'CropEater' ||
          (typeof a === 'string' && a.toLowerCase().includes('crop') && a.toLowerCase().includes('eater'))
      )
  );

  if (wormsWithCropEater.length > 0) {
    productionLog(`[Crop Eater Check] Preset contains ${wormsWithCropEater.length} Worm(s) with Crop Eater - skipping`);
  }

  return wormsWithCropEater.length > 0;
}

/**
 * Cycle to next preset in the order list
 * Auto-skips presets with Crop Eater pets
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.UnifiedState - Global unified state
 * @param {Function} dependencies.ensurePresetOrder - Ensure preset order function
 * @param {Function} dependencies.placePetPreset - Place preset function
 * @param {Function} dependencies.presetHasCropEater - Crop eater detection function
 * @param {Function} dependencies.productionLog - Production logging function
 */
export function cycleToNextPreset(dependencies) {
  const { UnifiedState, ensurePresetOrder, placePetPreset, presetHasCropEater, productionLog } = dependencies;

  ensurePresetOrder(); // Ensure order array is up to date

  if (UnifiedState.data.petPresetsOrder.length === 0) {
    productionLog('[Cycle Presets] No presets available');
    return;
  }

  const startIndex = UnifiedState.data.currentPresetIndex;
  let attempts = 0;
  const maxAttempts = UnifiedState.data.petPresetsOrder.length;

  do {
    // Move to next preset
    UnifiedState.data.currentPresetIndex++;

    // Loop back to start if at end
    if (UnifiedState.data.currentPresetIndex >= UnifiedState.data.petPresetsOrder.length) {
      UnifiedState.data.currentPresetIndex = 0;
    }

    const presetName = UnifiedState.data.petPresetsOrder[UnifiedState.data.currentPresetIndex];
    const preset = UnifiedState.data.petPresets[presetName];

    attempts++;

    // Check if preset has Crop Eater
    if (preset && !presetHasCropEater(preset, { productionLog })) {
      productionLog(
        `[Cycle Presets] Loading: ${presetName} (${UnifiedState.data.currentPresetIndex + 1}/${UnifiedState.data.petPresetsOrder.length})`
      );
      placePetPreset(presetName);
      return; // Found valid preset
    } else if (preset && presetHasCropEater(preset, { productionLog })) {
      productionLog(`[Cycle Presets] Skipping ${presetName} - contains Crop Eater`);
    }
  } while (attempts < maxAttempts);

  // All presets have Crop Eater
  productionLog('[Cycle Presets] All presets contain Crop Eater - cannot cycle');
}

/**
 * Play ability notification sound
 * Supports custom sounds and various default sound options
 *
 * @param {number} volume - Volume level (0-1)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.GM_getValue] - GM getValue function
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.playSingleBeepNotification] - Single beep function
 * @param {Function} [dependencies.playDoubleBeepNotification] - Double beep function
 * @param {Function} [dependencies.playTripleBeepNotification] - Triple beep function
 * @param {Function} [dependencies.playChimeNotification] - Chime function
 * @param {Function} [dependencies.playAlertNotification] - Alert function
 * @param {Function} [dependencies.playBuzzNotification] - Buzz function
 * @param {Function} [dependencies.playDingNotification] - Ding function
 * @param {Function} [dependencies.playChirpNotification] - Chirp function
 * @param {Function} [dependencies.playEpicNotification] - Epic function
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function playAbilityNotificationSound(volume, dependencies = {}) {
  const {
    GM_getValue = typeof window !== 'undefined' && window.GM_getValue,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    playSingleBeepNotification,
    playDoubleBeepNotification,
    playTripleBeepNotification,
    playChimeNotification,
    playAlertNotification,
    playBuzzNotification,
    playDingNotification,
    playChirpNotification,
    playEpicNotification,
    productionLog = console.log
  } = dependencies;

  const customSound = GM_getValue?.('mgtools_custom_sound_ability', null);
  if (customSound) {
    try {
      const audio = new Audio(customSound);
      audio.volume = volume || 0.2;
      audio.play();
      productionLog('🎵 [CUSTOM-SOUND] Playing custom ability sound');
      return; // Exit early if custom sound played
    } catch (err) {
      console.error('Failed to play custom ability sound:', err);
      // Fall through to default sound logic
    }
  }

  // If no custom sound or custom sound failed, use user's selected default
  if (!customSound) {
    const abilitySound = UnifiedState?.data?.settings?.notifications?.abilityNotificationSound || 'single';

    switch (abilitySound) {
      case 'single':
        playSingleBeepNotification?.(volume);
        break;
      case 'double':
        playDoubleBeepNotification?.(volume);
        break;
      case 'triple':
        playTripleBeepNotification?.(volume);
        break;
      case 'chime':
        playChimeNotification?.(volume);
        break;
      case 'alert':
        playAlertNotification?.(volume);
        break;
      case 'buzz':
        playBuzzNotification?.(volume);
        break;
      case 'ding':
        playDingNotification?.(volume);
        break;
      case 'chirp':
        playChirpNotification?.(volume);
        break;
      case 'epic':
        playEpicNotification?.(volume);
        break;
      default:
        playSingleBeepNotification?.(volume);
    }
  }
}

/**
 * Setup abilities tab event handlers
 * Manages filter modes, clear/export buttons, and ability log interactions
 *
 * @param {Document} context - Document or container element
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.debugLog - Debug logging function
 * @param {Function} dependencies.switchFilterMode - Switch filter mode function
 * @param {Function} dependencies.selectAllFilters - Select all filters function
 * @param {Function} dependencies.selectNoneFilters - Select none filters function
 * @param {Function} dependencies.updateAllLogVisibility - Update log visibility function
 * @param {Object} dependencies.UnifiedState - Global unified state
 * @param {Function} dependencies.MGA_saveJSON - Save JSON to storage function
 * @param {Function} dependencies.logDebug - Log debug function
 * @param {Function} dependencies.GM_getValue - GM getValue function
 * @param {Function} dependencies.logWarn - Log warn function
 * @param {Function} dependencies.MGA_loadJSON - Load JSON from storage function
 * @param {Function} dependencies.productionWarn - Production warn function
 * @param {Function} dependencies.productionLog - Production log function
 * @param {Function} dependencies.updateTabContent - Update tab content function
 * @param {Function} dependencies.updateAllAbilityLogDisplays - Update all displays function
 * @param {Function} dependencies.exportAbilityLogs - Export logs function
 * @param {Function} dependencies.MGA_diagnoseAbilityLogStorage - Diagnostic function
 * @param {Function} dependencies.showNotificationToast - Show toast function
 * @param {Function} dependencies.updateAbilityLogDisplay - Update log display function
 * @param {Function} dependencies.populateFilterModeContent - Populate filter content function
 * @param {Object} dependencies.MGA_AbilityCache - Ability cache object
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.lastLogCount] - Last log count tracker
 */
export function setupAbilitiesTabHandlers(context = document, dependencies, options = {}) {
  const {
    debugLog,
    switchFilterMode,
    selectAllFilters,
    selectNoneFilters,
    updateAllLogVisibility,
    UnifiedState,
    MGA_saveJSON,
    logDebug,
    GM_getValue,
    logWarn,
    MGA_loadJSON,
    productionWarn,
    productionLog,
    updateTabContent,
    updateAllAbilityLogDisplays,
    exportAbilityLogs,
    MGA_diagnoseAbilityLogStorage,
    showNotificationToast,
    updateAbilityLogDisplay,
    populateFilterModeContent,
    MGA_AbilityCache
  } = dependencies;

  let { lastLogCount } = options;

  debugLog('ABILITY_LOGS', 'Setting up abilities tab handlers with context', {
    isDocument: context === document,
    className: context.className || 'document'
  });

  // Filter mode switching
  const categoriesBtn = context.querySelector('#filter-mode-categories');
  const byPetBtn = context.querySelector('#filter-mode-bypet');
  const customBtn = context.querySelector('#filter-mode-custom');

  if (categoriesBtn && !categoriesBtn.hasAttribute('data-handler-setup')) {
    categoriesBtn.setAttribute('data-handler-setup', 'true');
    categoriesBtn.addEventListener('click', () => switchFilterMode('categories'));
  }
  if (byPetBtn && !byPetBtn.hasAttribute('data-handler-setup')) {
    byPetBtn.setAttribute('data-handler-setup', 'true');
    byPetBtn.addEventListener('click', () => switchFilterMode('byPet'));
  }
  if (customBtn && !customBtn.hasAttribute('data-handler-setup')) {
    customBtn.setAttribute('data-handler-setup', 'true');
    customBtn.addEventListener('click', () => switchFilterMode('custom'));
  }

  // All/None filter buttons (context-aware)
  const selectAllBtn = context.querySelector('#select-all-filters');
  const selectNoneBtn = context.querySelector('#select-none-filters');

  if (selectAllBtn && !selectAllBtn.hasAttribute('data-handler-setup')) {
    selectAllBtn.setAttribute('data-handler-setup', 'true');
    selectAllBtn.addEventListener('click', () => {
      const mode = UnifiedState.data.filterMode || 'categories';
      selectAllFilters(mode);
    });
  }

  if (selectNoneBtn && !selectNoneBtn.hasAttribute('data-handler-setup')) {
    selectNoneBtn.setAttribute('data-handler-setup', 'true');
    selectNoneBtn.addEventListener('click', () => {
      const mode = UnifiedState.data.filterMode || 'categories';
      selectNoneFilters(mode);
    });
  }

  // Category filter checkboxes - USE CONTEXT-AWARE SELECTORS
  context.querySelectorAll('#category-filters .mga-checkbox[data-filter]').forEach(checkbox => {
    if (!checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const filterKey = e.target.dataset.filter;
        UnifiedState.data.abilityFilters[filterKey] = e.target.checked;
        MGA_saveJSON('MGA_abilityFilters', UnifiedState.data.abilityFilters);

        // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
        updateAllLogVisibility();
        debugLog('ABILITY_LOGS', `Filter ${filterKey} changed to ${e.target.checked}, updated visibility via CSS`);
      });
    }
  });

  // Basic action buttons
  const clearLogsBtn = context.querySelector('#clear-logs-btn');
  if (clearLogsBtn && !clearLogsBtn.hasAttribute('data-handler-setup')) {
    clearLogsBtn.setAttribute('data-handler-setup', 'true');
    clearLogsBtn.addEventListener('click', () => {
      logDebug('ABILITY-LOGS', 'Starting comprehensive ability log clear...');

      // BEFORE CLEAR: Show what exists in each storage
      const beforeClear = {
        memory: UnifiedState.data.petAbilityLogs?.length || 0,
        gmMain: (() => {
          try {
            const v = GM_getValue('MGA_petAbilityLogs', null);
            return v ? JSON.parse(v).length : 0;
          } catch (e) {
            return 0;
          }
        })(),
        gmArchive: (() => {
          try {
            const v = GM_getValue('MGA_petAbilityLogs_archive', null);
            return v ? JSON.parse(v).length : 0;
          } catch (e) {
            return 0;
          }
        })(),
        lsMain: (() => {
          try {
            const v = window.localStorage?.getItem('MGA_petAbilityLogs');
            return v ? JSON.parse(v).length : 0;
          } catch (e) {
            return 0;
          }
        })(),
        lsArchive: (() => {
          try {
            const v = window.localStorage?.getItem('MGA_petAbilityLogs_archive');
            return v ? JSON.parse(v).length : 0;
          } catch (e) {
            return 0;
          }
        })()
      };

      logDebug('ABILITY-LOGS', '📊 BEFORE CLEAR - Log counts:', beforeClear);

      // Show individual logs from memory (to identify which one won't delete)
      if (UnifiedState.data.petAbilityLogs?.length > 0) {
        logDebug('ABILITY-LOGS', '📋 Current logs in memory:');
        UnifiedState.data.petAbilityLogs.forEach((log, i) => {
          logDebug(
            'ABILITY-LOGS',
            `  ${i + 1}. ${log.abilityType} - ${log.petName} - ${new Date(log.timestamp).toLocaleString()}`
          );
        });
      }

      // 1. Clear memory
      UnifiedState.data.petAbilityLogs = [];
      logDebug('ABILITY-LOGS', '  ✓ Cleared UnifiedState memory');

      // 2. Clear GM storage (Tampermonkey)
      MGA_saveJSON('MGA_petAbilityLogs', []);
      MGA_saveJSON('MGA_petAbilityLogs_archive', []);
      logDebug('ABILITY-LOGS', '  ✓ Cleared GM storage (main + archive)');

      // 3. Clear window.localStorage directly (bypass sync logic)
      try {
        window.localStorage?.removeItem('MGA_petAbilityLogs');
        window.localStorage?.removeItem('MGA_petAbilityLogs_archive');
        logDebug('ABILITY-LOGS', '  ✓ Cleared window.localStorage');
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not clear window.localStorage:', e.message);
      }

      // 4. Clear targetWindow.localStorage (if different from window)
      try {
        if (typeof targetWindow !== 'undefined' && targetWindow && targetWindow !== window) {
          targetWindow.localStorage?.removeItem('MGA_petAbilityLogs');
          targetWindow.localStorage?.removeItem('MGA_petAbilityLogs_archive');
          logDebug('ABILITY-LOGS', '  ✓ Cleared targetWindow.localStorage');
        }
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not clear targetWindow.localStorage:', e.message);
      }

      // 5. Clear compatibility array
      try {
        if (typeof window.petAbilityLogs !== 'undefined') {
          window.petAbilityLogs = [];
          logDebug('ABILITY-LOGS', '  ✓ Cleared window.petAbilityLogs compatibility array');
        }
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not clear compatibility array:', e.message);
      }

      // 6. Set comprehensive clear flags with timestamp-based session lock
      const clearTimestamp = Date.now();
      localStorage.setItem('MGA_logs_manually_cleared', clearTimestamp.toString());
      localStorage.setItem('MGA_logs_clear_session', clearTimestamp.toString());
      try {
        GM_setValue('MGA_logs_manually_cleared', clearTimestamp.toString());
      } catch (e) {
        logWarn('ABILITY-LOGS', '  ⚠️ Could not set GM clear flag:', e.message);
      }
      logDebug('ABILITY-LOGS', '  ✓ Set manual clear flags (session + GM + timestamp)');

      // 7. AFTER CLEAR: Comprehensive verification
      const verifyMain = MGA_loadJSON('MGA_petAbilityLogs', null);
      const verifyArchive = MGA_loadJSON('MGA_petAbilityLogs_archive', null);
      const verifyLS = window.localStorage?.getItem('MGA_petAbilityLogs');
      const verifyCompat = typeof window.petAbilityLogs !== 'undefined' ? window.petAbilityLogs?.length : 'N/A';

      // Recount all sources after clear
      const afterClear = {
        memory: UnifiedState.data.petAbilityLogs?.length || 0,
        gmMain: verifyMain?.length || 0,
        gmArchive: verifyArchive?.length || 0,
        lsMain: verifyLS
          ? (() => {
              try {
                return JSON.parse(verifyLS).length;
              } catch (e) {
                return 'parse-error';
              }
            })()
          : 0,
        lsArchive: (() => {
          try {
            const v = window.localStorage?.getItem('MGA_petAbilityLogs_archive');
            return v ? JSON.parse(v).length : 0;
          } catch (e) {
            return 0;
          }
        })(),
        compatArray: verifyCompat
      };

      logDebug('ABILITY-LOGS', '📊 AFTER CLEAR - Log counts:', afterClear);
      logDebug('ABILITY-LOGS', '📊 COMPARISON:', {
        before: beforeClear,
        after: afterClear,
        clearedFlag: localStorage.getItem('MGA_logs_manually_cleared')
      });

      // If ANY logs remain, show which ones
      const totalRemaining = Object.values(afterClear).reduce(
        (sum, val) => sum + (typeof val === 'number' ? val : 0),
        0
      );

      if (totalRemaining > 0) {
        productionWarn(`⚠️ [ABILITIES] ${totalRemaining} log(s) persist after clear!`);
        logDebug('ABILITY-LOGS', '🔍 Logs that persisted - check these sources:', afterClear);

        // Show which specific logs remain (if any)
        if (verifyMain && verifyMain.length > 0) {
          logDebug('ABILITY-LOGS', '❌ PERSISTENT LOGS IN GM STORAGE:');
          verifyMain.forEach((log, i) => {
            logDebug(
              'ABILITY-LOGS',
              `  ${i + 1}. ${log.abilityType} - ${log.petName} - ${new Date(log.timestamp).toLocaleString()}`
            );
          });
        }
      } else {
        productionLog('✅ [ABILITIES] Successfully cleared all ability logs from all storage locations');
      }

      lastLogCount = 0; // Reset log count tracker
      updateTabContent();
      updateAllAbilityLogDisplays();
    });
  }

  const exportLogsBtn = context.querySelector('#export-logs-btn');
  if (exportLogsBtn && !exportLogsBtn.hasAttribute('data-handler-setup')) {
    exportLogsBtn.setAttribute('data-handler-setup', 'true');
    exportLogsBtn.addEventListener('click', () => {
      exportAbilityLogs();
    });
  }

  // Diagnose logs button (only visible when debug mode is enabled)
  const diagnoseLogsBtn = context.querySelector('#diagnose-logs-btn');
  if (diagnoseLogsBtn && !diagnoseLogsBtn.hasAttribute('data-handler-setup')) {
    diagnoseLogsBtn.setAttribute('data-handler-setup', 'true');
    diagnoseLogsBtn.addEventListener('click', () => {
      console.log('🔍 Running ability logs storage diagnostic...');
      const report = MGA_diagnoseAbilityLogStorage();

      // Show a user-friendly notification
      const totalWithLogs = report.summary.totalLocationsWithLogs;
      if (totalWithLogs === 0) {
        showNotificationToast('✅ No ability logs found in any storage location', 'success');
      } else {
        showNotificationToast(
          `📊 Found logs in ${totalWithLogs} storage location(s). Check console for details.`,
          'info'
        );
      }
    });
  }

  // Detailed timestamps checkbox
  const detailedTimestampsCheckbox = context.querySelector('#detailed-timestamps-checkbox');
  if (detailedTimestampsCheckbox && !detailedTimestampsCheckbox.hasAttribute('data-handler-setup')) {
    detailedTimestampsCheckbox.setAttribute('data-handler-setup', 'true');
    detailedTimestampsCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.detailedTimestamps = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);

      // Clear timestamp cache and force full rebuild for timestamp format change
      MGA_AbilityCache.timestamps.clear();

      // BUGFIX: Force overlay refresh to show new timestamp format
      // Update all overlays first to ensure they show the new format
      UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
        if (tabName === 'abilities' && overlay && overlay.offsetParent !== null) {
          updateAbilityLogDisplay(overlay);
          debugLog('ABILITY_LOGS', 'Updated overlay with new timestamp format');
        }
      });

      // Then update main displays
      updateAllAbilityLogDisplays(true);
      productionLog(`🕐 [ABILITIES] Detailed timestamps: ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Test Abilities button removed - function kept for potential debugging use

  // Initialize the current filter mode display
  const currentMode = UnifiedState.data.filterMode || 'categories';
  setTimeout(() => populateFilterModeContent(currentMode), 100);
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Constants
  SPECIES_MAX_HUNGER,
  SPECIES_HUNGER_DEPLETION_TIME,
  HUNGER_BOOST_VALUES,

  // Presets
  exportPetPresets,
  importPetPresets,

  // Hunger Monitoring
  checkPetHunger,
  scanAndAlertHungryPets,
  calculateTimeUntilHungry,
  formatHungerTimer,

  // Pet Detection
  getActivePetsFromRoomState,
  updateActivePetsFromRoomState,

  // Pet Feeding
  sendFeedPet,
  feedPetEnsureSync,

  // UI Helpers (Phase 3)
  updatePetPresetDropdown,
  updateActivePetsDisplay,
  ensurePresetOrder,
  movePreset,
  getDragAfterElement,
  refreshPresetsList,
  addPresetToList,
  setupPetsTabHandlers,

  // Tab Content Generators (Phase 3 - continued)
  getPetsPopoutContent,
  setupPetPopoutHandlers,
  getPetsTabContent,

  // Ability Calculation Helpers (Game-specific)
  getTurtleExpectations,
  estimateUntilLatestCrop,
  getAbilityExpectations,
  getEggExpectations,
  getGrowthExpectations,

  // Auto-Favorite System (Phase 4)
  initAutoFavorite,
  favoriteSpecies,
  unfavoriteSpecies,
  favoriteMutation,
  unfavoriteMutation,
  favoritePetAbility,
  unfavoritePetAbility,

  // Additional Pet Functions (Phase 5)
  playPetNotificationSound,
  placePetPreset,
  loadPetPreset,
  getAllUniquePets,
  populatePetSpeciesList,
  shouldLogAbility,
  categorizeAbilityToFilterKey,
  monitorPetAbilities,

  // Ability Log Utilities (Phase 6)
  getAllUniqueAbilities,
  populateIndividualAbilities,
  selectAllFilters,
  selectNoneFilters,
  exportAbilityLogs,
  loadPresetByNumber,

  // Supporting Utilities (Phase 6)
  normalizeAbilityName,
  formatTimestamp,
  getGardenCropIfUnique,

  // Ability Log Management (Phase 7)
  KNOWN_ABILITY_TYPES,
  isKnownAbilityType,
  initAbilityCache,
  MGA_manageLogMemory,
  MGA_getAllLogs,
  categorizeAbility,
  formatLogData,
  formatRelativeTime,

  // Display Update Functions (Phase 8)
  updateAbilityLogDisplay,
  updateLogVisibility,
  updateAllLogVisibility,
  updateAllAbilityLogDisplays,

  // Instant Feed Core Functions (Phase 9)
  createInstantFeedButton,
  flashButton,
  handleInstantFeed,

  // Instant Feed Initialization & Polling (Phase 10)
  injectInstantFeedButtons,
  initializeInstantFeedButtons,

  // Additional Pet Management Functions (Phase 11)
  presetHasCropEater,
  cycleToNextPreset,
  playAbilityNotificationSound,
  setupAbilitiesTabHandlers
};
