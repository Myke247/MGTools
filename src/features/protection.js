/**
 * PROTECTION/HARVEST SYSTEM MODULE
 * ====================================================================================
 * Crop protection, auto-harvest rules, and sell blocking system for MGTools
 *
 * @module features/protection
 *
 * Phase 5 (Complete):
 * - Protection Tab UI - ~250 lines
 *   • setupProtectTabHandlers() - Setup protection settings tab
 *   • Crop species protection checkboxes
 *   • Crop mutation protection checkboxes (Rainbow, Frozen, Gold, etc.)
 *   • Pet ability protection (Gold Granter, Rainbow Granter)
 *   • Decor protection checkboxes
 *   • Sell block threshold slider
 *   • Frozen pickup exception toggle
 *   • Clear all protections button
 *
 * Phase 6 (Complete):
 * - Protection Status & Display - ~42 lines
 *   • updateProtectStatus() - Update protection status display
 *   • Show/hide active protection indicators
 *
 * Phase 7 (Complete):
 * - Protection Hooks & Logic - ~392 lines
 *   • applyHarvestRule() - Apply auto-harvest protection rules
 *   • applySellBlockThreshold() - Apply sell block threshold
 *   • initializeProtectionHooks() - Initialize protection system hooks
 *   • Intercept harvest/sell messages
 *   • Block protected crops/decor/pets
 *   • Track shop purchases for inventory management
 *
 * Total Extracted: ~684 lines (ALL 3 PHASES COMPLETE!)
 * Progress: 100% (protection system fully extracted!)
 *
 * Dependencies:
 * - Core: UnifiedState (protection config), MGA_saveJSON (persistence)
 * - Logging: productionLog, console
 * - Shop: trackLocalPurchase (optional, for purchase tracking)
 * - UI: DECOR_ITEMS constant (for decor names)
 * - Game: targetWindow (for game object access)
 */

/* ====================================================================================
 * IMPORTS
 * ====================================================================================
 */

// NOTE: These will be available from the global scope when bundled
// In the future, we can import explicitly:
// import { productionLog } from '../core/logging.js';
// import { UnifiedState } from '../state/unified-state.js';

/* ====================================================================================
 * PROTECTION TAB UI * ====================================================================================
 */

/**
 * Setup event handlers for protection settings tab
 * Handles crop species, mutation, decor, and pet ability protection
 *
 * @param {Document|HTMLElement} [context] - Context to search for elements (default: document)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - JSON save function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.updateProtectStatus] - Update status display function
 * @param {Function} [dependencies.applyHarvestRule] - Apply harvest rule function
 * @param {Function} [dependencies.applySellBlockThreshold] - Apply sell threshold function
 * @param {Array} [dependencies.DECOR_ITEMS] - List of decor items
 */
export function setupProtectTabHandlers(context = document, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = console.log,
    updateProtectStatus: updateProtectStatusFn = updateProtectStatus,
    applyHarvestRule: applyHarvestRuleFn = applyHarvestRule,
    applySellBlockThreshold: applySellBlockThresholdFn = applySellBlockThreshold,
    DECOR_ITEMS = typeof window !== 'undefined' && window.DECOR_ITEMS
  } = dependencies;

  // Actual game crop species (from shop)
  const cropSpecies = [
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
  const cropMutations = [
    'Rainbow',
    'Frozen',
    'Wet',
    'Chilled',
    'Gold',
    'Dawnlit',
    'Amberlit',
    'Dawnbound',
    'Amberbound',
    'Lock All Mutations',
    'Lock Only Non-Mutated'
  ];

  // Add new setting for frozen exception
  if (!UnifiedState.data.protectionSettings) {
    UnifiedState.data.protectionSettings = {
      allowFrozenPickup: false // Allow pickup of protected crops when frozen
    };
  }

  // Initialize locked crops if not exists
  if (!UnifiedState.data.lockedCrops) {
    UnifiedState.data.lockedCrops = { species: [], mutations: [] };
  }
  if (!UnifiedState.data.sellBlockThreshold) {
    UnifiedState.data.sellBlockThreshold = 1.0;
  }
  // Initialize locked decor if not exists
  if (!UnifiedState.data.lockedDecor) {
    UnifiedState.data.lockedDecor = [];
  }
  // Initialize locked pet abilities if not exists
  if (!UnifiedState.data.lockedPetAbilities) {
    UnifiedState.data.lockedPetAbilities = [];
  }

  const lockedCrops = UnifiedState.data.lockedCrops;

  // Generate species checkboxes
  const speciesList = context.querySelector('#protect-species-list');
  if (speciesList) {
    speciesList.innerHTML = cropSpecies
      .map(
        species => `
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px; background: rgba(74, 158, 255, 0.30); border-radius: 4px;">
                      <input type="checkbox" class="protect-species-checkbox" value="${species}"
                          ${lockedCrops.species?.includes(species) ? 'checked' : ''}
                          style="cursor: pointer;">
                      <span style="font-size: 12px;">${species}</span>
                  </label>
              `
      )
      .join('');
  }

  // Generate mutation checkboxes
  const mutationsList = context.querySelector('#protect-mutations-list');
  if (mutationsList) {
    mutationsList.innerHTML = cropMutations
      .map(
        mutation => `
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px; background: rgba(74, 158, 255, 0.30); border-radius: 4px;">
                      <input type="checkbox" class="protect-mutation-checkbox" value="${mutation}"
                          ${lockedCrops.mutations?.includes(mutation) ? 'checked' : ''}
                          style="cursor: pointer;">
                      <span style="font-size: 12px;">${mutation}</span>
                  </label>
              `
      )
      .join('');
  }

  // Generate pet ability checkboxes
  const petAbilities = ['Rainbow Granter', 'Gold Granter'];
  const petAbilitiesList = context.querySelector('#protect-pet-abilities-list');
  if (petAbilitiesList) {
    petAbilitiesList.innerHTML = petAbilities
      .map(
        ability => `
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px; background: rgba(74, 158, 255, 0.30); border-radius: 4px;">
                      <input type="checkbox" class="protect-pet-ability-checkbox" value="${ability}"
                          ${UnifiedState.data.lockedPetAbilities?.includes(ability) ? 'checked' : ''}
                          style="cursor: pointer;">
                      <span style="font-size: 12px;">${ability}</span>
                  </label>
              `
      )
      .join('');
  }

  // Generate decor checkboxes
  const decorList = context.querySelector('#protect-decor-list');
  if (decorList && DECOR_ITEMS) {
    decorList.innerHTML = DECOR_ITEMS.map(
      decor => `
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px; background: rgba(74, 158, 255, 0.30); border-radius: 4px;">
                      <input type="checkbox" class="protect-decor-checkbox" value="${decor.id}"
                          ${UnifiedState.data.lockedDecor?.includes(decor.id) ? 'checked' : ''}
                          style="cursor: pointer;">
                      <span style="font-size: 11px;">${decor.name}</span>
                  </label>
              `
    ).join('');
  }

  // Diagnostic logging
  const speciesCheckboxes = context.querySelectorAll('.protect-species-checkbox');
  const mutationCheckboxes = context.querySelectorAll('.protect-mutation-checkbox');
  productionLog(
    `✅ [Protect] Found ${speciesCheckboxes.length} species checkboxes, ${mutationCheckboxes.length} mutation checkboxes`
  );

  // Handle species checkbox changes
  context.querySelectorAll('.protect-species-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      productionLog('[Protect] 🔔 Species checkbox changed!', e.target.value, 'checked:', e.target.checked);
      const species = e.target.value;
      if (e.target.checked) {
        if (!lockedCrops.species.includes(species)) {
          lockedCrops.species.push(species);
        }
      } else {
        lockedCrops.species = lockedCrops.species.filter(s => s !== species);
      }
      productionLog('[Protect] Saving species change:', species, e.target.checked);
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog('[Protect] Save completed');
      updateProtectStatusFn(context, dependencies);
      applyHarvestRuleFn(dependencies);
    });
  });

  // Handle mutation checkbox changes
  context.querySelectorAll('.protect-mutation-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      productionLog('[Protect] 🔔 Mutation checkbox changed!', e.target.value, 'checked:', e.target.checked);
      const mutation = e.target.value;

      // Special handling for "Lock All Mutations" - it's a "select all" toggle
      if (mutation === 'Lock All Mutations') {
        const allMutationCheckboxes = context.querySelectorAll('.protect-mutation-checkbox');

        if (e.target.checked) {
          // Check all other mutation checkboxes
          allMutationCheckboxes.forEach(cb => {
            if (cb.value !== 'Lock All Mutations' && cb.value !== 'Lock Only Non-Mutated') {
              cb.checked = true;
              if (!lockedCrops.mutations.includes(cb.value)) {
                lockedCrops.mutations.push(cb.value);
              }
            }
          });
        } else {
          // Uncheck all other mutation checkboxes
          allMutationCheckboxes.forEach(cb => {
            if (cb.value !== 'Lock All Mutations' && cb.value !== 'Lock Only Non-Mutated') {
              cb.checked = false;
            }
          });
          lockedCrops.mutations = lockedCrops.mutations.filter(m => m === 'Lock Only Non-Mutated');
        }
      } else if (mutation === 'Lock Only Non-Mutated') {
        // Special handling for "Lock Only Non-Mutated" - locks crops with 0 mutations
        if (e.target.checked) {
          if (!lockedCrops.mutations.includes(mutation)) {
            lockedCrops.mutations.push(mutation);
          }
        } else {
          lockedCrops.mutations = lockedCrops.mutations.filter(m => m !== mutation);
        }
      } else {
        // Regular mutation checkbox
        if (e.target.checked) {
          if (!lockedCrops.mutations.includes(mutation)) {
            lockedCrops.mutations.push(mutation);
          }
        } else {
          lockedCrops.mutations = lockedCrops.mutations.filter(m => m !== mutation);
          // Uncheck "Lock All Mutations" if any individual mutation is unchecked
          const lockAllCheckbox = context.querySelector('.protect-mutation-checkbox[value="Lock All Mutations"]');
          if (lockAllCheckbox) {
            lockAllCheckbox.checked = false;
          }
        }
      }

      productionLog('[Protect] Saving mutation change:', mutation, e.target.checked);
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog('[Protect] Save completed');
      updateProtectStatusFn(context, dependencies);
      applyHarvestRuleFn(dependencies);
    });
  });

  // Handle pet ability checkbox changes
  context.querySelectorAll('.protect-pet-ability-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      const ability = e.target.value;
      if (e.target.checked) {
        if (!UnifiedState.data.lockedPetAbilities.includes(ability)) {
          UnifiedState.data.lockedPetAbilities.push(ability);
        }
      } else {
        UnifiedState.data.lockedPetAbilities = UnifiedState.data.lockedPetAbilities.filter(a => a !== ability);
      }
      MGA_saveJSON('MGA_data', UnifiedState.data);
      updateProtectStatusFn(context, dependencies);
    });
  });

  // Handle decor checkbox changes
  context.querySelectorAll('.protect-decor-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      const decorId = e.target.value;
      if (e.target.checked) {
        if (!UnifiedState.data.lockedDecor.includes(decorId)) {
          UnifiedState.data.lockedDecor.push(decorId);
        }
      } else {
        UnifiedState.data.lockedDecor = UnifiedState.data.lockedDecor.filter(d => d !== decorId);
      }
      MGA_saveJSON('MGA_data', UnifiedState.data);
      updateProtectStatusFn(context, dependencies);
    });
  });

  // Clear all button
  const clearButton = context.querySelector('#protect-clear-all');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      lockedCrops.species = [];
      lockedCrops.mutations = [];
      UnifiedState.data.lockedDecor = [];
      UnifiedState.data.lockedPetAbilities = [];
      MGA_saveJSON('MGA_data', UnifiedState.data);

      // Uncheck all checkboxes
      context
        .querySelectorAll(
          '.protect-species-checkbox, .protect-mutation-checkbox, .protect-decor-checkbox, .protect-pet-ability-checkbox'
        )
        .forEach(cb => {
          cb.checked = false;
        });

      updateProtectStatusFn(context, dependencies);
      applyHarvestRuleFn(dependencies);
    });
  }

  // Sell threshold slider
  const thresholdSlider = context.querySelector('#protect-sell-threshold');
  const thresholdValue = context.querySelector('#protect-sell-threshold-value');
  if (thresholdSlider) {
    thresholdSlider.addEventListener('input', e => {
      const value = parseFloat(e.target.value);
      UnifiedState.data.sellBlockThreshold = value;
      if (thresholdValue) {
        thresholdValue.textContent = `${value.toFixed(2)}x (${((value - 1) * 100).toFixed(0)}%)`;
      }
      MGA_saveJSON('MGA_data', UnifiedState.data);
      applySellBlockThresholdFn(dependencies);
    });
  }

  // Add handler for frozen pickup checkbox
  productionLog('[Protect-Debug] 🔍 Looking for #allow-frozen-pickup checkbox in context:', context);
  const frozenCheckbox = context.querySelector('#allow-frozen-pickup');
  productionLog('[Protect-Debug] 📋 Frozen checkbox found?', !!frozenCheckbox, frozenCheckbox);

  if (frozenCheckbox) {
    productionLog('[Protect-Debug] ✅ Attaching change event handler to frozen checkbox');
    frozenCheckbox.addEventListener('change', e => {
      productionLog('[Protect-Debug] 🔔 FROZEN CHECKBOX CHANGED!', e.target.checked);
      if (!UnifiedState.data.protectionSettings) {
        UnifiedState.data.protectionSettings = {};
      }
      UnifiedState.data.protectionSettings.allowFrozenPickup = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`❄️ [PROTECTION] Frozen exception: ${e.target.checked ? 'enabled' : 'disabled'}`);
      applyHarvestRuleFn(dependencies);
    });
    productionLog('[Protect-Debug] ✅ Frozen checkbox handler attached successfully');
  } else {
    productionWarn('[Protect-Debug] ⚠️ Frozen checkbox NOT FOUND in context!');
  }

  // Initial status update
  updateProtectStatusFn(context, dependencies);
  applyHarvestRuleFn(dependencies);
  applySellBlockThresholdFn(dependencies);
}

/* ====================================================================================
 * PROTECTION STATUS & DISPLAY * ====================================================================================
 */

/**
 * Update protection status display
 * Shows/hides active protection indicators
 *
 * @param {Document|HTMLElement} [context] - Context to search for elements (default: document)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Array} [dependencies.DECOR_ITEMS] - List of decor items
 */
export function updateProtectStatus(context = document, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    DECOR_ITEMS = typeof window !== 'undefined' && window.DECOR_ITEMS
  } = dependencies;

  const statusDisplay = context.querySelector('#protect-status-display');
  if (!statusDisplay) return;

  const lockedCrops = UnifiedState.data.lockedCrops || { species: [], mutations: [] };
  const lockedDecor = UnifiedState.data.lockedDecor || [];
  const lockedPetAbilities = UnifiedState.data.lockedPetAbilities || [];
  const hasLocks =
    lockedCrops.species.length > 0 ||
    lockedCrops.mutations.length > 0 ||
    lockedDecor.length > 0 ||
    lockedPetAbilities.length > 0;

  if (!hasLocks) {
    statusDisplay.innerHTML = '<div style="color: #888;">No protections are currently active.</div>';
    return;
  }

  let html = '';
  if (lockedCrops.species.length > 0) {
    html += `<div style="margin-bottom: 8px;"><strong>🔒 Locked Crop Species:</strong> ${lockedCrops.species.join(', ')}</div>`;
  }
  if (lockedCrops.mutations.length > 0) {
    html += `<div style="margin-bottom: 8px;"><strong>🔒 Locked Mutations:</strong> ${lockedCrops.mutations.join(', ')}</div>`;
  }
  if (lockedPetAbilities.length > 0) {
    html += `<div style="margin-bottom: 8px;"><strong>🐾 Locked Pet Abilities:</strong> ${lockedPetAbilities.join(', ')}</div>`;
  }
  if (lockedDecor.length > 0 && DECOR_ITEMS) {
    const decorNames = lockedDecor
      .map(id => {
        const decor = DECOR_ITEMS.find(d => d.id === id);
        return decor ? decor.name : id;
      })
      .join(', ');
    html += `<div><strong>🏛️ Locked Decor:</strong> ${decorNames}</div>`;
  }

  statusDisplay.innerHTML = html;
}

/* ====================================================================================
 * PROTECTION HOOKS & LOGIC * ====================================================================================
 */

/**
 * Apply harvest rule to window
 * Creates/updates the harvest rule function that blocks protected crops
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Window} [dependencies.targetWindow] - Target window (default: window)
 */
export function applyHarvestRule(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetWindow = typeof window !== 'undefined' ? window : null
  } = dependencies;

  targetWindow.currentHarvestRule = ({ species, mutations } = {}) => {
    // CRITICAL FIX: Read fresh locked crops from UnifiedState each time harvest is attempted
    // This ensures unlocking crops takes effect immediately without requiring page refresh
    const freshLockedCrops = UnifiedState.data.lockedCrops || { species: [], mutations: [] };
    let mutationsLocal = mutations;
    mutationsLocal = Array.isArray(mutationsLocal) ? mutationsLocal : [];

    // Check if crop is frozen
    const isFrozen = mutationsLocal.includes('Frozen');
    const allowFrozenPickup = UnifiedState.data.protectionSettings?.allowFrozenPickup || false;

    // If species is locked, check for frozen exception
    if (freshLockedCrops.species && freshLockedCrops.species.includes(species)) {
      // If frozen exception is enabled and crop is frozen, allow harvest
      if (isFrozen && allowFrozenPickup) {
        return true;
      }
      return false;
    }

    // Check for "Lock Only Non-Mutated" - locks crops with 0 mutations
    if (freshLockedCrops.mutations && freshLockedCrops.mutations.includes('Lock Only Non-Mutated')) {
      if (mutationsLocal.length === 0) {
        return false; // Block harvest if crop has no mutations
      }
    }

    // If any locked mutation is present, check for frozen exception
    if (freshLockedCrops.mutations && freshLockedCrops.mutations.length > 0) {
      const regularMutations = freshLockedCrops.mutations.filter(
        m => m !== 'Lock All Mutations' && m !== 'Lock Only Non-Mutated'
      );
      const hasLockedMutation = regularMutations.some(m => mutationsLocal.includes(m));
      if (hasLockedMutation) {
        // If frozen exception is enabled and crop is frozen, allow harvest
        if (isFrozen && allowFrozenPickup) {
          return true;
        }
        return false;
      }
    }

    return true;
  };
}

/**
 * Apply sell block threshold to window
 * Sets the minimum friend bonus required to sell crops
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Window} [dependencies.targetWindow] - Target window (default: window)
 */
export function applySellBlockThreshold(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetWindow = typeof window !== 'undefined' ? window : null
  } = dependencies;

  targetWindow.sellBlockThreshold = UnifiedState.data.sellBlockThreshold || 1.0;
  productionLog(`✅ Sell block threshold set to ${targetWindow.sellBlockThreshold}x`);
}

/**
 * Initialize protection system hooks
 * Hooks into game's sendMessage to intercept harvest/sell commands
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Window} [dependencies.targetWindow] - Target window (default: window)
 * @param {Function} [dependencies.trackLocalPurchase] - Purchase tracking function (optional)
 * @param {Function} [dependencies.insertTurtleEstimate] - Turtle estimate function (optional)
 * @param {Function} [dependencies.applyHarvestRule] - Apply harvest rule function
 * @param {Function} [dependencies.applySellBlockThreshold] - Apply sell threshold function
 */
export function initializeProtectionHooks(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetWindow = typeof window !== 'undefined' ? window : null,
    trackLocalPurchase = typeof window !== 'undefined' && window.trackLocalPurchase,
    insertTurtleEstimate = typeof window !== 'undefined' && window.insertTurtleEstimate,
    applyHarvestRule: applyHarvestRuleFn = applyHarvestRule,
    applySellBlockThreshold: applySellBlockThresholdFn = applySellBlockThreshold
  } = dependencies;

  // Track RoomConnection retry attempts
  let roomConnectionRetries = 0;
  const MAX_ROOM_CONNECTION_RETRIES = 10;

  // Note: friendBonus and myGarden atoms are already hooked in initializeAtoms()
  // which sets both UnifiedState.atoms and targetWindow values

  // Hook sendMessage to intercept harvest and sell commands
  setTimeout(() => {
    if (!targetWindow.MagicCircle_RoomConnection) {
      if (roomConnectionRetries < MAX_ROOM_CONNECTION_RETRIES) {
        roomConnectionRetries++;
        productionWarn(`⏳ Waiting for RoomConnection (${roomConnectionRetries}/${MAX_ROOM_CONNECTION_RETRIES})...`);
        setTimeout(() => initializeProtectionHooks(dependencies), 1000);
        return;
      }
      productionWarn('⚠️ RoomConnection not found after max retries - continuing without protection hooks');
      // Continue without it - non-critical feature
      return;
    }

    // Reset counter on success
    roomConnectionRetries = 0;
    productionLog('✅ MagicCircle_RoomConnection found - initializing protection hooks');

    const originalSendMessage = targetWindow.MagicCircle_RoomConnection.sendMessage.bind(
      targetWindow.MagicCircle_RoomConnection
    );

    // Wrap sendMessage to intercept messages for protection and tracking
    targetWindow.MagicCircle_RoomConnection.sendMessage = function (message, ...rest) {
      try {
        if (!message || typeof message.type !== 'string') {
          return originalSendMessage(message, ...rest);
        }

        const friendBonus = targetWindow.friendBonus ?? 1.5;
        const msgType = message.type;
        const isSellMessage = msgType === 'SellAllCrops'; // Only check crops - friend bonus doesn't work for pets

        // Detect in-game shop purchases
        if (msgType === 'PurchaseSeed' && message.species) {
          if (typeof trackLocalPurchase === 'function') {
            trackLocalPurchase(message.species, 'seed', 1);
          }
        } else if (msgType === 'PurchaseEgg' && message.eggId) {
          if (typeof trackLocalPurchase === 'function') {
            trackLocalPurchase(message.eggId, 'egg', 1);
          }
        } else if (msgType === 'PurchaseTool' && message.toolId) {
          if (UnifiedState.data.settings?.debugMode) {
            productionLog(`🔧 [PURCHASE-INTERCEPT] Tool Purchase Detected!`, {
              toolId: message.toolId,
              toolIdType: typeof message.toolId,
              fullMessage: JSON.stringify(message)
            });
          }
          if (typeof trackLocalPurchase === 'function') {
            trackLocalPurchase(message.toolId, 'tool', 1);
            if (UnifiedState.data.settings?.debugMode) {
              productionLog(`🔧 [PURCHASE-INTERCEPT] Called trackLocalPurchase with: "${message.toolId}"`);
            }
          } else {
            productionError(`❌ [PURCHASE-INTERCEPT] trackLocalPurchase function not available!`);
          }
        }

        // Check sell blocking
        if (isSellMessage && friendBonus < targetWindow.sellBlockThreshold) {
          productionWarn(
            `[SellBlock] Blocked ${msgType} (friendBonus=${friendBonus} < ${targetWindow.sellBlockThreshold})`
          );
          return;
        }

        // Check harvest blocking
        if (msgType === 'HarvestCrop') {
          const tile = targetWindow.myGarden?.garden?.tileObjects?.[message.slot];
          const slotData = tile?.slots?.[message.slotsIndex];

          productionLog(`[HarvestCheck] Attempting harvest: slot=${message.slot}, index=${message.slotsIndex}`);
          productionLog(`[HarvestCheck] Tile data:`, tile);
          productionLog(`[HarvestCheck] Slot data:`, slotData);

          if (slotData) {
            const species = slotData.species;
            const slotMutations = slotData.mutations || [];

            productionLog(`[HarvestCheck] Species: ${species}, Mutations:`, slotMutations);
            productionLog(`[HarvestCheck] currentHarvestRule exists:`, !!targetWindow.currentHarvestRule);

            if (
              targetWindow.currentHarvestRule &&
              !targetWindow.currentHarvestRule({ species, mutations: slotMutations })
            ) {
              productionLog(`🔒 BLOCKED HarvestCrop: ${species} with mutations [${slotMutations.join(', ')}]`);
              return;
            }
            productionLog(`✅ ALLOWED HarvestCrop: ${species} with mutations [${slotMutations.join(', ')}]`);

            // DIAGNOSTIC: Log when debug mode is enabled
            if (UnifiedState.data.settings?.debugMode) {
              productionLog('[FIX_HARVEST] Harvest handler called for:', species, 'Will attempt sync in 100ms...');
            }

            // Sync slot index after harvest - works for both single and multi-harvest crops
            // For single-harvest: game doesn't advance slot, sync returns null (no change)
            // For multi-harvest: game advances slot, sync updates MGTools to match
            const preHarvestIndex = window._mgtools_currentSlotIndex || 0;

            // Use polyfill from multi-harvest helpers
            const qmt = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn);

            // Wait for game to update atoms after harvest
            qmt(() => {
              setTimeout(() => {
                try {
                  // Use globally exposed sync function
                  if (!window.syncSlotIndexFromGame) {
                    if (UnifiedState.data.settings?.debugMode) {
                      productionError('[FIX_HARVEST] ERROR: syncSlotIndexFromGame not found on window!');
                    }
                    return;
                  }

                  const newIndex = window.syncSlotIndexFromGame();

                  // Log slot sync when debug mode is enabled
                  if (UnifiedState.data.settings?.debugMode) {
                    productionLog('[FIX_HARVEST] Post-harvest slot sync:', {
                      species,
                      preHarvest: preHarvestIndex,
                      postHarvest: newIndex !== null ? newIndex : preHarvestIndex,
                      slotAdvanced: newIndex !== null,
                      isMultiHarvest: newIndex !== null,
                      note:
                        newIndex === null
                          ? 'Single-harvest crop (expected - no slot advance)'
                          : 'Multi-harvest detected - slot advanced'
                    });
                  }

                  // Force refresh the value display after slot sync
                  if (typeof insertTurtleEstimate === 'function') {
                    requestAnimationFrame(() => {
                      insertTurtleEstimate();
                      if (UnifiedState.data.settings?.debugMode) {
                        productionLog('[FIX_HARVEST] Refreshed value display');
                      }
                    });
                  }
                } catch (error) {
                  productionError('[FIX_HARVEST] Sync error:', error);
                }
              }, 100); // Small delay to let game update atom
            });
          } else {
            productionWarn(`[HarvestCheck] No slot data found for slot ${message.slot}, index ${message.slotsIndex}`);
          }
        }

        // Check pet sell blocking by ability (using mutation-based detection)
        if (msgType.toLowerCase().includes('pet') && msgType.toLowerCase().includes('sell')) {
          const lockedAbilities = UnifiedState.data.lockedPetAbilities || [];
          const petId = message.itemId || message.petId;

          if (UnifiedState.data.settings?.debugMode) {
            productionLog(`🐾 [PetSellDebug] Message type: ${msgType}`, message);
            productionLog(`🐾 [PetSellDebug] Locked abilities:`, lockedAbilities);
          }

          if (lockedAbilities.length > 0 && petId) {
            // Find the pet being sold
            let pet = null;

            // Check active pets
            if (UnifiedState.atoms.activePets) {
              pet = UnifiedState.atoms.activePets.find(p => p.id === petId);
            }

            // Check inventory if not found in active pets
            if (!pet && UnifiedState.atoms.inventory?.items) {
              pet = UnifiedState.atoms.inventory.items.find(item => item.id === petId && item.itemType === 'Pet');
            }

            if (UnifiedState.data.settings?.debugMode) {
              productionLog(`🐾 [PetSellDebug] Found pet:`, pet);
            }

            if (pet) {
              // BETTER APPROACH: Check pet mutations instead of petAbility atom
              // Gold/Rainbow mutations are ALWAYS present, unlike ability data which may not be populated
              const petMutations = pet.mutations || [];

              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`🐾 [PetSellDebug] Pet mutations:`, petMutations);

                // Check petAbility atom as backup
                let abilityFromAtom = null;
                if (UnifiedState.atoms.petAbility && UnifiedState.atoms.petAbility[petId]) {
                  const abilityData = UnifiedState.atoms.petAbility[petId];
                  abilityFromAtom = abilityData.lastAbilityTrigger?.abilityId;
                  productionLog(`🐾 [PetSellDebug] Pet ability from atom:`, abilityFromAtom);
                }
              }

              // Check if pet has Gold or Rainbow mutation
              const hasGoldMutation = petMutations.includes('Gold');
              const hasRainbowMutation = petMutations.includes('Rainbow');

              if (UnifiedState.data.settings?.debugMode) {
                productionLog(
                  `🐾 [PetSellDebug] Has Gold mutation: ${hasGoldMutation}, Has Rainbow mutation: ${hasRainbowMutation}`
                );
              }

              // Block if mutation matches locked ability
              const isGoldGranterLocked = lockedAbilities.includes('Gold Granter');
              const isRainbowGranterLocked = lockedAbilities.includes('Rainbow Granter');

              const shouldBlockGold = hasGoldMutation && isGoldGranterLocked;
              const shouldBlockRainbow = hasRainbowMutation && isRainbowGranterLocked;

              if (UnifiedState.data.settings?.debugMode) {
                productionLog(
                  `🐾 [PetSellDebug] Should block gold: ${shouldBlockGold}, Should block rainbow: ${shouldBlockRainbow}`
                );
              }

              if (shouldBlockGold || shouldBlockRainbow) {
                const blockedType = shouldBlockGold ? 'Gold' : 'Rainbow';
                productionWarn(`🐾 [PetLock] ❌ BLOCKED selling ${blockedType} pet (${blockedType} Granter is locked)`);
                return; // Block the sale
              }
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`🐾 [PetSellDebug] ✅ Pet mutations not locked, allowing sale`);
              }
            } else if (UnifiedState.data.settings?.debugMode) {
              productionLog(`🐾 [PetSellDebug] ⚠️ Could not find pet with ID ${petId}`);
            }
          }
        }

        // Check decor removal blocking
        // CRITICAL: PickupDecor message doesn't include decorId, only localTileIndex!
        // We need to look up what's at that position in the garden
        if (msgType === 'PickupDecor') {
          productionLog(`🏛️ [DecorCheck] PickupDecor message:`, JSON.stringify(message, null, 2));

          const lockedDecor = UnifiedState.data.lockedDecor || [];

          if (lockedDecor.length > 0) {
            // Extract tile information from message
            const tileType = message.tileType;
            const tileIndex = message.localTileIndex;

            productionLog(`🏛️ [DecorCheck] Looking for decor at ${tileType} tile ${tileIndex}`);

            // Look up what decor is at this tile position
            let decorAtPosition = null;

            if (targetWindow.myGarden?.garden) {
              const garden = targetWindow.myGarden.garden;

              // Check the appropriate tile collection based on tileType
              if (tileType === 'Boardwalk' && garden.boardwalkTileObjects) {
                const tile = garden.boardwalkTileObjects[tileIndex];
                if (tile && tile.objectType === 'decor' && tile.decorId) {
                  decorAtPosition = tile.decorId;
                }
              } else if (tileType === 'Garden' && garden.tileObjects) {
                const tile = garden.tileObjects[tileIndex];
                if (tile && tile.objectType === 'decor' && tile.decorId) {
                  decorAtPosition = tile.decorId;
                }
              }
            }

            productionLog(`🏛️ [DecorCheck] Decor at position: "${decorAtPosition}"`);
            productionLog(`🏛️ [DecorCheck] Locked decor list:`, lockedDecor);

            // Block if this decor is locked
            if (decorAtPosition && lockedDecor.includes(decorAtPosition)) {
              productionWarn(`🏛️ [DecorLock] ❌ BLOCKED pickup of "${decorAtPosition}"`);
              return; // Block the pickup
            }
            if (decorAtPosition) {
              productionLog(`🏛️ [DecorCheck] ✅ Decor "${decorAtPosition}" not locked, allowing pickup`);
            } else {
              productionLog(`🏛️ [DecorCheck] ⚠️ Could not find decor at tile position`);
            }
          }
        }

        // Backup scopePath capture for Feed buttons
        if (Array.isArray(message?.scopePath)) {
          targetWindow.__mga_lastScopePath = message.scopePath.slice();
        }

        // Debug hook to see ALL FeedPet messages (native and ours)
        if (message?.type === 'FeedPet') {
          productionLog('[FEED-DEBUG] 🔍 FeedPet message being sent:', {
            type: message.type,
            petItemId: message.petItemId,
            cropItemId: message.cropItemId,
            scopePath: message.scopePath,
            fullMsg: JSON.stringify(message)
          });

          // Check if IDs look valid (UUIDs)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(message.petItemId)) {
            productionError('[FEED-DEBUG] ❌ Invalid petItemId format:', message.petItemId);
          }
          if (!uuidRegex.test(message.cropItemId)) {
            productionError('[FEED-DEBUG] ❌ Invalid cropItemId format:', message.cropItemId);
          }
        }

        return originalSendMessage(message, ...rest);
      } catch (err) {
        productionError('[SendMessageHook] Error:', err);
        return originalSendMessage(message, ...rest);
      }
    };

    productionLog('✅ Harvest and sell protection hooks installed');
  }, 2000);

  // Apply initial rules
  applyHarvestRuleFn(dependencies);
  applySellBlockThresholdFn(dependencies);
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Tab UI  setupProtectTabHandlers,

  // Status Display  updateProtectStatus,

  // Protection Hooks  applyHarvestRule,
  applySellBlockThreshold,
  initializeProtectionHooks
};
