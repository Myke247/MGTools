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
 * Phase 2 (Pending):
 * - Pet Detection & State
 * - Pet Feeding Logic
 * - Pet UI Components
 * - Pet Tab Content
 * - Auto-Favorite Integration
 *
 * Total Extracted: ~419 lines (of ~5,000 estimated)
 * Progress: 8.4%
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
        hungryCount++;
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
  formatHungerTimer
};
