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
 * Phase 3 Extraction (In Progress):
 * - Pet UI Helper Functions - ~291 lines ✅
 * - Pet Event Handlers (setupPetsTabHandlers) - ~377 lines ✅
 * - Pet Tab Content (~736 lines) - Pending
 *
 * Phase 4 (Pending):
 * - Auto-Favorite Integration (~500+ lines)
 * - Magic Garden Helpers (~76 lines)
 *
 * Total Extracted: ~1,248 lines (of ~5,000 estimated)
 * Progress: 24.96%
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
export async function feedPetEnsureSync(petItemId, cropItemId, petIndex, rcSend, waitForServer, enableDebugPeek = false) {
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

  const ack = await waitForServer(makePredicate({ type: 'FeedPet', payload: { petItemId, cropItemId } })).catch(() => null);

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
export function updateActivePetsDisplay(context, UnifiedState, calculateTimeUntilHungry, formatHungerTimer, retryCount = 0) {
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
    setTimeout(() => updateActivePetsDisplay(context, UnifiedState, calculateTimeUntilHungry, formatHungerTimer, retryCount + 1), 100 * (retryCount + 1));
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
export function movePreset(presetName, direction, context, UnifiedState, MGA_saveJSON, refreshPresetsList, refreshSeparateWindowPopouts, updateTabContent) {
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
 * @param {Function} MGA_saveJSON - Storage save function
 */
export function addPresetToList(context, name, preset, UnifiedState, MGA_saveJSON) {
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
    MGA_safeSave,
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
        movePreset(presetName, 'up', context, UnifiedState, MGA_saveJSON, refreshPresetsList, refreshSeparateWindowPopouts, () => {});
      } else if (action === 'move-down') {
        console.log(`🚨 [CRITICAL] Moving ${presetName} DOWN`);
        movePreset(presetName, 'down', context, UnifiedState, MGA_saveJSON, refreshPresetsList, refreshSeparateWindowPopouts, () => {});
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
  setupPetsTabHandlers
};
