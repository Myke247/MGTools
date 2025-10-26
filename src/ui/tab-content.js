/**
 * Tab Content Generators Module
 * Provides HTML content generation for MGTools UI tabs
 *
 * This module contains tab content generators for:
 * - Seeds: Seed management and deletion interface
 * - Values: Garden values display and auto-favorite settings
 * - Timers: Restock and event timers
 * - Rooms: Live room status and multiplayer rooms
 * - Tools: Calculator and wiki resource links
 * - Protect: Crop, pet, and decor protection settings
 * - Help: User guide and documentation
 * - Hotkeys: Custom hotkey configuration
 *
 * Note: Pets, Shop, Abilities, Settings, and Notifications tabs are in their respective feature modules.
 *
 * @module TabContent
 */

/**
 * Get Seeds tab content HTML
 * Provides seed management interface with:
 * - Quick selection (All/None/Common/Uncommon/Rare+)
 * - Auto-delete checkbox
 * - Delete selected button
 * - Value calculation
 * - Seed groups by rarity (Common → Celestial)
 * - Protected seeds (Celestial, Sunflower)
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.debugLog] - Debug logging function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @returns {string} HTML content for seeds tab
 *
 * @example
 * const html = getSeedsTabContent({ UnifiedState, debugLog, productionLog });
 * container.innerHTML = html;
 */
export function getSeedsTabContent(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    debugLog = () => {},
    productionLog = () => {}
  } = dependencies;

  debugLog('SEEDS_TAB', 'getSeedsTabContent() called - generating full content');
  productionLog('🔍 [SEEDS DEBUG] getSeedsTabContent() called - generating content');

  const seedGroups = [
    { name: 'Common', color: '#fff', seeds: ['Carrot', 'Strawberry', 'Aloe'] },
    { name: 'Uncommon', color: '#0f0', seeds: ['Apple', 'Tulip', 'Tomato', 'Blueberry'] },
    { name: 'Rare', color: '#0af', seeds: ['Daffodil', 'Corn', 'Watermelon', 'Pumpkin', 'Delphinium', 'Squash'] },
    { name: 'Legendary', color: '#ff0', seeds: ['Echeveria', 'Coconut', 'Banana', 'Lily', 'BurrosTail'] },
    { name: 'Mythical', color: '#a0f', seeds: ['Mushroom', 'Cactus', 'Bamboo', 'Grape'] },
    {
      name: 'Divine',
      color: 'orange',
      seeds: ['Sunflower', 'Pepper', 'Lemon', 'PassionFruit', 'DragonFruit', 'Lychee']
    },
    { name: 'Celestial', color: '#ff69b4', seeds: ['Starweaver', 'Moonbinder', 'Dawnbinder'], protected: true }
  ];

  let html = `
          <div class="mga-section">
              <div class="mga-section-title">Quick Actions</div>
              <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                  <button class="mga-btn mga-btn-sm" id="select-all-seeds" style="background: #059669;">Select All</button>
                  <button class="mga-btn mga-btn-sm" id="select-none-seeds" style="background: #dc2626;">Select None</button>
                  <button class="mga-btn mga-btn-sm" id="select-common" style="background: #6b7280;">Common</button>
                  <button class="mga-btn mga-btn-sm" id="select-uncommon" style="background: #059669;">Uncommon</button>
                  <button class="mga-btn mga-btn-sm" id="select-rare" style="background: #0ea5e9;">Rare+</button>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Seed Management</div>
              <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap;">
                  <label class="mga-checkbox-group">
                      <input type="checkbox" class="mga-checkbox" id="auto-delete-checkbox">
                      <span class="mga-label">Auto-Delete</span>
                  </label>
                  <button class="mga-btn" id="delete-selected-btn" style="background: #dc2626;">Delete Selected</button>
                  <button class="mga-btn mga-btn-sm" id="calculate-value-btn" style="background: #f59e0b;">Calculate Value</button>
              </div>
              <div id="seed-value-display" style="display: none; margin-top: 8px; padding: 8px; background: rgba(245, 158, 11, 0.30); border-radius: 4px;">
                  <div style="font-size: 13px; color: #f59e0b;">Selected Seeds Value: <span id="selected-seeds-value">0</span> 💰</div>
              </div>
          </div>
      `;

  // Seed ID mapping for checking saved state
  const seedIdMap = {
    Carrot: 'Carrot',
    Strawberry: 'Strawberry',
    Aloe: 'Aloe',
    Blueberry: 'Blueberry',
    Apple: 'Apple',
    Tulip: 'OrangeTulip',
    Tomato: 'Tomato',
    Daffodil: 'Daffodil',
    Sunflower: 'Sunflower',
    Corn: 'Corn',
    Watermelon: 'Watermelon',
    Pumpkin: 'Pumpkin',
    Delphinium: 'Delphinium',
    Squash: 'Squash',
    Echeveria: 'Echeveria',
    Coconut: 'Coconut',
    Banana: 'Banana',
    Lily: 'Lily',
    BurrosTail: 'BurrosTail',
    Mushroom: 'Mushroom',
    Cactus: 'Cactus',
    Bamboo: 'Bamboo',
    Grape: 'Grape',
    Pepper: 'Pepper',
    Lemon: 'Lemon',
    PassionFruit: 'PassionFruit',
    DragonFruit: 'DragonFruit',
    Lychee: 'Lychee',
    Starweaver: 'Starweaver',
    Moonbinder: 'Moonbinder',
    Dawnbinder: 'Dawnbinder'
  };

  productionLog('🔍 [SEEDS DEBUG] Applying saved state to checkboxes:', {
    savedSeedsToDelete: UnifiedState?.data?.seedsToDelete,
    savedSeedsCount: UnifiedState?.data?.seedsToDelete?.length || 0
  });

  seedGroups.forEach(group => {
    html += `
              <div class="mga-section">
                  <div class="mga-section-title" style="color: ${group.color}">${group.name}</div>
                  <div class="mga-grid">
          `;

    group.seeds.forEach(seed => {
      const isGroupProtected = group.protected === true;
      const isIndividuallyProtected = ['Starweaver', 'Moonbinder', 'Dawnbinder', 'Sunflower'].includes(seed);
      const isProtected = isGroupProtected || isIndividuallyProtected;
      const disabledAttr = isProtected ? 'disabled' : '';
      const protectedStyle = isProtected ? 'opacity: 0.5; cursor: not-allowed;' : '';
      const protectedLabel = isProtected ? ' 🔒' : '';

      // Check if this seed should be checked based on saved state
      const internalId = seedIdMap[seed] || seed;
      const isChecked = UnifiedState?.data?.seedsToDelete?.includes(internalId) || false;
      const checkedAttr = isChecked ? 'checked' : '';

      productionLog(`🔍 [SEEDS DEBUG] Seed ${seed} (${internalId}): checked=${isChecked}`);

      html += `
                  <label class="mga-checkbox-group" style="${protectedStyle}">
                      <input type="checkbox" class="mga-checkbox seed-checkbox" data-seed="${seed}" ${disabledAttr} ${checkedAttr}>
                      <span class="mga-label" style="color: ${group.color}">${seed}${protectedLabel}</span>
                  </label>
              `;
    });

    html += '</div></div>';
  });

  debugLog('SEEDS_TAB', 'getSeedsTabContent() returning HTML', { htmlLength: html.length });
  productionLog('🔍 [SEEDS DEBUG] Returning HTML:', {
    htmlLength: html.length,
    htmlPreview: html.substring(0, 200)
  });
  return html;
}

/**
 * Get Values tab content HTML
 * Provides garden value display and auto-favorite configuration:
 * - Tile value, Inventory value, Garden value display
 * - Auto-favorite enable toggle
 * - Species selection (29 species)
 * - Mutation selection (9 mutations)
 * - Pet ability selection (Rainbow/Gold Granter)
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {object} [dependencies.globalValueManager] - Global value manager instance
 * @param {Function} [dependencies.initializeValueManager] - Value manager initialization function
 * @returns {string} HTML content for values tab
 *
 * @example
 * const html = getValuesTabContent({ UnifiedState, globalValueManager, initializeValueManager });
 */
export function getValuesTabContent(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    globalValueManager = typeof window !== 'undefined' && window.globalValueManager,
    initializeValueManager = typeof window !== 'undefined' && window.initializeValueManager
  } = dependencies;

  const valueManager = globalValueManager || (initializeValueManager ? initializeValueManager() : null);

  // Safe fallbacks if value manager not available
  const tileValue = valueManager ? valueManager.getTileValue() : 0;
  const gardenValue = valueManager ? valueManager.getGardenValue() : 0;
  const inventoryValue = valueManager ? valueManager.getInventoryValue() : 0;

  return `
          <div class="mga-section">
              <div class="mga-section-title">💰 Garden Values</div>
              <div class="mga-value-compact" style="
                  display: grid;
                  grid-template-columns: 1fr auto;
                  column-gap: 12px;
                  row-gap: 4px;
                  font-size: 13px;
                  line-height: 1.5;
              ">
                  <div class="overlay-label" style="text-align: left; color: #e5e7eb; white-space: nowrap;">Tile value:</div>
                  <div class="overlay-val" style="text-align: right; color: #4a9eff; font-weight: bold; min-width: 90px; word-break: keep-all;">${tileValue.toLocaleString()}</div>

                  <div class="overlay-label" style="text-align: left; color: #e5e7eb; white-space: nowrap;">Inventory value:</div>
                  <div class="overlay-val" style="text-align: right; color: #f59e0b; font-weight: bold; min-width: 90px; word-break: keep-all;">${inventoryValue.toLocaleString()}</div>

                  <div class="overlay-label" style="text-align: left; color: #e5e7eb; white-space: nowrap;">Garden value:</div>
                  <div class="overlay-val" style="text-align: right; color: #10b981; font-weight: bold; min-width: 90px; word-break: keep-all;">${gardenValue.toLocaleString()}</div>
              </div>
          </div>

          <div class="mga-section" style="margin-top: 16px;">
              <div class="mga-section-title" style="display: flex; align-items: center; justify-content: space-between;">
                  <span>🌟 Auto-Favorite</span>
                  <label class="switch" style="margin-left: auto;">
                      <input type="checkbox" id="auto-favorite-enabled" ${UnifiedState?.data?.settings?.autoFavorite?.enabled ? 'checked' : ''}>
                      <span class="slider"></span>
                  </label>
              </div>
              <div style="margin-top: 8px;">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                      Automatically favorite these species when added to inventory:
                  </div>
                  <div id="auto-favorite-species" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; max-height: 300px; overflow-y: auto; padding-right: 8px;">
                      ${[
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
                      ]
                        .map(
                          species => `
                              <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; user-select: none;">
                                  <input type="checkbox" value="${species}"
                                      ${UnifiedState?.data?.settings?.autoFavorite?.species?.includes(species) ? 'checked' : ''}
                                      style="cursor: pointer;">
                                  <span style="color: #e5e7eb;">${species.replace('OrangeTulip', 'Tulip').replace('DawnCelestial', 'Dawnbinder').replace('MoonCelestial', 'Moonbinder')}</span>
                              </label>
                          `
                        )
                        .join('')}
                  </div>
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 12px; border-top: 1px solid rgba(255, 255, 255, 0.57); padding-top: 12px;">
                      Automatically favorite items with these mutations:
                  </div>
                  <div id="auto-favorite-mutations" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                      ${[
                        'Rainbow',
                        'Gold',
                        'Frozen',
                        'Wet',
                        'Chilled',
                        'Dawnlit',
                        'Amberlit',
                        'Dawnbound',
                        'Amberbound'
                      ]
                        .map(
                          mutation => `
                              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; user-select: none;">
                                  <input type="checkbox" value="${mutation}"
                                      ${UnifiedState?.data?.settings?.autoFavorite?.mutations?.includes(mutation) ? 'checked' : ''}
                                      style="cursor: pointer;">
                                  <span style="color: #e5e7eb;">${mutation}</span>
                              </label>
                          `
                        )
                        .join('')}
                  </div>
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 12px; border-top: 1px solid rgba(255, 255, 255, 0.57); padding-top: 12px;">
                      Automatically favorite pets with these abilities:
                  </div>
                  <div id="auto-favorite-pet-abilities" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                      ${['Rainbow Granter', 'Gold Granter']
                        .map(
                          ability => `
                              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; user-select: none;">
                                  <input type="checkbox" value="${ability}"
                                      ${(UnifiedState?.data?.settings?.autoFavorite?.petAbilities || []).includes(ability) ? 'checked' : ''}
                                      style="cursor: pointer;">
                                  <span style="color: #e5e7eb;">${ability}</span>
                              </label>
                          `
                        )
                        .join('')}
                  </div>
              </div>
          </div>
      `;
}

/**
 * Get Timers tab content HTML
 * Displays restock and event timers:
 * - Seed Restock timer
 * - Egg Restock timer
 * - Tool Restock timer
 * - Lunar Event timer (purple styled)
 *
 * @returns {string} HTML content for timers tab
 *
 * @example
 * const html = getTimersTabContent();
 * container.innerHTML = html;
 */
export function getTimersTabContent() {
  return `
          <div class="mga-section">
              <div class="mga-section-title">Restock Timers</div>
              <div class="mga-timer">
                  <div class="mga-timer-label">Seed Restock</div>
                  <div class="mga-timer-value" id="timer-seed">--:--</div>
              </div>
              <div class="mga-timer">
                  <div class="mga-timer-label">Egg Restock</div>
                  <div class="mga-timer-value" id="timer-egg">--:--</div>
              </div>
              <div class="mga-timer">
                  <div class="mga-timer-label">Tool Restock</div>
                  <div class="mga-timer-value" id="timer-tool">--:--</div>
              </div>
              <div class="mga-timer" style="background: rgba(147, 51, 234, 0.30); border-color: rgba(147, 51, 234, 0.3);">
                  <div class="mga-timer-label">Lunar Event</div>
                  <div class="mga-timer-value" id="timer-lunar" style="color: #9333ea;">--:--</div>
              </div>
          </div>
      `;
}

/**
 * Get Room Status tab content HTML
 * Provides live multiplayer room monitoring with:
 * - Two-tab interface (MG & Custom / Discord Servers)
 * - Search bar for filtering rooms
 * - Live player counts (0-6)
 * - Color-coded status (gray/green/yellow/red)
 * - Room join buttons
 * - Add/remove custom rooms with drag-and-drop reordering
 * - Informational cards explaining room systems
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @param {object} [dependencies.RoomRegistry] - Room registry with discord/magicCircle rooms
 * @param {Function} [dependencies.getCurrentRoomCode] - Function to get current room code
 * @returns {string} HTML content for room status tab
 *
 * @example
 * const html = getRoomStatusTabContent({ UnifiedState, RoomRegistry, getCurrentRoomCode });
 */
export function getRoomStatusTabContent(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    RoomRegistry = typeof window !== 'undefined' && window.RoomRegistry,
    getCurrentRoomCode = typeof window !== 'undefined' && window.getCurrentRoomCode
  } = dependencies;

  const currentRoom = getCurrentRoomCode ? getCurrentRoomCode() : null;
  const roomCounts = UnifiedState?.data?.roomStatus?.counts || {};
  const activeRoomsTab = UnifiedState?.data?.activeRoomsTab || 'mg'; // Default to MG rooms

  // Helper function to render room card
  const renderRoomCard = (room, allowDelete = false, allowDrag = false) => {
    // Try name first (Discord rooms stored as 'PLAY1'), fallback to id (MG rooms stored as 'MG1')
    const count = roomCounts[room.name?.toUpperCase()] || roomCounts[room.id] || 0;
    const displayCount = Math.min(count, 6);
    const isCurrentRoom = room.id === currentRoom;

    // Color based on player count
    let statusColor = '#94a3b8'; // Gray for empty
    if (count > 0) statusColor = '#4ade80'; // Green for active
    if (count >= 4) statusColor = '#fbbf24'; // Yellow for busy
    if (count >= 6) statusColor = '#ef4444'; // Red for full

    const bgColor = isCurrentRoom ? 'rgba(59, 130, 246, 0.40)' : 'rgba(255, 255, 255, 0.03)';
    const borderColor = isCurrentRoom ? '#3b82f6' : 'rgba(255, 255, 255, 0.57)';

    return `
              <div class="room-item" ${allowDrag ? 'draggable="true"' : ''} data-room="${room.id}" style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 12px;
                  background: ${bgColor};
                  border: 1px solid ${borderColor};
                  border-radius: 6px;
                  transition: all 0.2s;
                  cursor: ${allowDrag ? 'grab' : 'default'} !important;
                  user-select: none;
              ">
                  <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: ${allowDrag ? 'grab' : 'default'} !important;">
                      ${allowDrag ? '<span style="color: #666; font-size: 16px; cursor: grab !important;" title="Drag to reorder">⋮⋮</span>' : ''}
                      <span style="
                          font-weight: bold;
                          color: ${isCurrentRoom ? '#60a5fa' : '#e5e7eb'};
                          font-size: 14px;
                          min-width: ${allowDrag ? '45px' : '70px'};
                          cursor: ${allowDrag ? 'grab' : 'default'} !important;
                      ">${room.name || room.id}</span>
                      <span style="
                          font-weight: bold;
                          color: ${statusColor};
                          font-size: 13px;
                          min-width: 50px;
                          cursor: ${allowDrag ? 'grab' : 'default'} !important;
                      ">${displayCount}/6 ${isCurrentRoom ? '(You)' : ''}</span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                      <button class="mga-button room-join-btn" data-room="${room.id}" style="
                          padding: 6px 14px;
                          font-size: 12px;
                          background: ${isCurrentRoom ? '#666' : '#4a9eff'};
                          color: white;
                          border: none;
                          border-radius: 4px;
                          cursor: ${isCurrentRoom ? 'not-allowed' : 'pointer'} !important;
                          opacity: ${isCurrentRoom ? '0.5' : '1'};
                      " ${isCurrentRoom ? 'disabled' : ''}>
                          ${isCurrentRoom ? 'Current' : 'Join'}
                      </button>
                      ${
                        allowDelete
                          ? `
                      <button class="room-delete-btn" data-room="${room.id}" style="
                          padding: 6px 10px;
                          font-size: 14px;
                          background: #ef4444;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          cursor: pointer !important;
                          opacity: 0.8;
                          transition: opacity 0.2s;
                      " title="Remove room from list">
                          ❌
                      </button>`
                          : ''
                      }
                  </div>
              </div>
          `;
  };

  // Get MG & Custom rooms
  const mgAndCustomRooms = RoomRegistry && RoomRegistry.getMGAndCustomRooms ? RoomRegistry.getMGAndCustomRooms() : [];

  return `
          <div class="mga-section">
              <div class="mga-section-title">🎮 Live Room Status</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Real-time player counts for Magic Garden rooms. Add custom rooms to track, or browse official MG1-10 servers.
              </p>

              <!-- Tab Selector -->
              <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid rgba(255,255,255,0.1);">
                  <button class="rooms-tab-btn" data-tab="mg" style="
                      flex: 1;
                      padding: 10px;
                      background: ${activeRoomsTab === 'mg' ? 'rgba(34, 197, 94, 0.3)' : 'transparent'};
                      border: none;
                      border-bottom: 2px solid ${activeRoomsTab === 'mg' ? '#22c55e' : 'transparent'};
                      color: ${activeRoomsTab === 'mg' ? '#fff' : '#aaa'};
                      font-size: 13px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.2s;
                      border-radius: 4px 4px 0 0;
                  ">
                      🌟 MG & Custom
                  </button>
                  <button class="rooms-tab-btn" data-tab="discord" style="
                      flex: 1;
                      padding: 10px;
                      background: ${activeRoomsTab === 'discord' ? 'rgba(138, 43, 226, 0.3)' : 'transparent'};
                      border: none;
                      border-bottom: 2px solid ${activeRoomsTab === 'discord' ? '#8a2be2' : 'transparent'};
                      color: ${activeRoomsTab === 'discord' ? '#fff' : '#aaa'};
                      font-size: 13px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.2s;
                      border-radius: 4px 4px 0 0;
                  ">
                      🎮 Discord Servers
                  </button>
              </div>

              <!-- Search Bar -->
              <div style="margin-bottom: 12px;">
                  <input type="text" id="room-search-input" placeholder="Search room..."
                      style="width: 100%; padding: 8px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255, 255, 255, 0.57);
                      border-radius: 4px; color: white; font-size: 12px;">
              </div>

              <!-- Single container approach - swaps content instead of toggling display -->
              <div id="rooms-tab-content">
                  ${
                    activeRoomsTab === 'mg'
                      ? `
                      <!-- MG & Custom Tab Content -->
                      <div id="room-status-list-mg" style="display: flex; flex-direction: column; gap: 8px;">
                          ${mgAndCustomRooms.map(room => renderRoomCard(room, room.category === 'custom', room.category === 'custom')).join('')}
                      </div>

                      <!-- Add Custom Room Section -->
                      <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255, 255, 255, 0.57); border-radius: 6px;">
                          <div style="font-weight: bold; color: #60a5fa; margin-bottom: 8px; font-size: 13px;">➕ Add Custom Room</div>
                          <div style="display: flex; gap: 8px; align-items: center;">
                              <input type="text" id="add-room-input" placeholder="Room code (e.g., MG16)"
                                  style="flex: 1; padding: 8px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255, 255, 255, 0.57);
                                  border-radius: 4px; color: white; font-size: 12px; text-transform: uppercase;">
                              <button id="add-room-btn" class="mga-button" style="
                                  padding: 8px 16px;
                                  font-size: 12px;
                                  background: #4ade80;
                                  color: white;
                                  border: none;
                                  border-radius: 4px;
                                  cursor: pointer;
                                  font-weight: bold;
                              ">Add</button>
                          </div>
                          <div style="font-size: 10px; color: #888; margin-top: 6px;">
                              Tip: Drag custom rooms to reorder, click ❌ to remove
                          </div>
                      </div>

                      <div style="margin-top: 16px; padding: 12px; background: rgba(34, 197, 94, 0.2); border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.3);">
                          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                              <strong style="color: #4ade80;">Magic Garden Rooms</strong><br>
                              • MG1-15 are public Magic Garden servers<br>
                              • Add your own custom rooms to track<br>
                              • Player counts update automatically every 5 seconds
                          </div>
                      </div>
                  `
                      : `
                      <!-- Discord Servers Tab Content -->
                      <div id="room-status-list-discord" style="display: flex; flex-direction: column; gap: 8px;">
                          ${
                            RoomRegistry && RoomRegistry.discord && RoomRegistry.discord.length > 0
                              ? RoomRegistry.discord.map(room => renderRoomCard(room, false, false)).join('')
                              : '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">No Discord rooms available</div>'
                          }
                      </div>
                      <div style="margin-top: 16px; padding: 12px; background: rgba(138, 43, 226, 0.2); border-radius: 6px; border: 1px solid rgba(138, 43, 226, 0.3);">
                          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                              <strong style="color: #a78bfa;">💡 Discord Activity Rooms (87 Total)</strong><br>
                              • Garlic Bread: play1-play10 (no hyphen) - 10 rooms<br>
                              • Magic Circle: play-2 to play-50 (with hyphen) - 49 rooms<br>
                              • Magic Circle: Country rooms (play-🇨🇦, play-🇬🇧, etc.) - 26 rooms<br>
                              • Special: play-québec, play - 2 rooms<br>
                              • <strong>Player counts via /api/rooms/{id}/info</strong> (same as community scripts)
                          </div>
                      </div>
                  `
                  }
              </div>
          </div>
      `;
}

/**
 * Get Tools tab content HTML
 * Provides access to calculators and wiki resources:
 * - 5 calculator tools (Sell Price, Weight Probability, Pet Appearance, Ability Trigger, Import Garden)
 * - 6 wiki resource links (Crops, Pets, Abilities, Weather, Multipliers, Shops)
 * - Crop highlighting controls (species, slot index, hidden species, scale)
 * - Includes CSS styles for tool/wiki cards
 *
 * @returns {string} HTML content for tools tab with embedded styles
 *
 * @example
 * const html = getToolsTabContent();
 * container.innerHTML = html;
 */
export function getToolsTabContent() {
  return `
          <div class="mga-section">
              <div class="mga-section-title">Magic Garden Calculators</div>
              <div class="mga-tools-grid">
                  <div class="mga-tool-card" data-calculator="sell-price">
                      <div class="mga-tool-icon">💰</div>
                      <div class="mga-tool-name">Sell Price Calculator</div>
                      <div class="mga-tool-desc">Calculate optimal selling prices for items</div>
                  </div>
                  <div class="mga-tool-card" data-calculator="weight-probability">
                      <div class="mga-tool-icon">⚖️</div>
                      <div class="mga-tool-name">Weight Probability Calculator</div>
                      <div class="mga-tool-desc">Calculate weight-based probability outcomes</div>
                  </div>
                  <div class="mga-tool-card" data-calculator="pet-appearance-probability">
                      <div class="mga-tool-icon">🎲</div>
                      <div class="mga-tool-name">Pet Appearance Probability Calculator</div>
                      <div class="mga-tool-desc">Calculate probabilities for pet appearances</div>
                  </div>
                  <div class="mga-tool-card" data-calculator="ability-trigger-time">
                      <div class="mga-tool-icon">⏱️</div>
                      <div class="mga-tool-name">Ability Trigger Time Calculator</div>
                      <div class="mga-tool-desc">Calculate optimal timing for pet ability triggers</div>
                  </div>
                  <div class="mga-tool-card" data-calculator="import-garden">
                      <div class="mga-tool-icon">📥</div>
                      <div class="mga-tool-name">Import Your Garden</div>
                      <div class="mga-tool-desc">Import and analyze your garden layout</div>
                  </div>
              </div>
              <div class="mga-section-note" style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.15); border-radius: 5px;">
                  <strong>Note:</strong> Calculators will open in new popup windows. Make sure popup blockers are disabled for this site.
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">📚 Wiki Resources</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Quick access to Magic Garden wiki pages. Click any card to open in a popup window.
              </p>
              <div class="mga-wiki-grid">
                  <div class="mga-wiki-card" data-wiki="crops">
                      <div class="mga-wiki-icon">🌾</div>
                      <div class="mga-wiki-name">Crops</div>
                  </div>
                  <div class="mga-wiki-card" data-wiki="pets">
                      <div class="mga-wiki-icon">🐾</div>
                      <div class="mga-wiki-name">Pets</div>
                  </div>
                  <div class="mga-wiki-card" data-wiki="abilities">
                      <div class="mga-wiki-icon">⚡</div>
                      <div class="mga-wiki-name">Abilities</div>
                  </div>
                  <div class="mga-wiki-card" data-wiki="weather">
                      <div class="mga-wiki-icon">🌤️</div>
                      <div class="mga-wiki-name">Weather Events</div>
                  </div>
                  <div class="mga-wiki-card" data-wiki="multipliers">
                      <div class="mga-wiki-icon">📈</div>
                      <div class="mga-wiki-name">Multipliers</div>
                  </div>
                  <div class="mga-wiki-card" data-wiki="shops">
                      <div class="mga-wiki-icon">🏪</div>
                      <div class="mga-wiki-name">Shops</div>
                  </div>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🌱 Crop Highlighting</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Visual highlighting system for crops. Use Ctrl+H to clear highlights, Ctrl+Shift+H to toggle this panel.
              </p>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Highlight Species:
                  </label>
                  <select class="mga-select" id="highlight-species-select">
                      <option value="">Select species to highlight...</option>
                      <option value="Carrot">🥕 Carrot</option>
                      <option value="Strawberry">🍓 Strawberry</option>
                      <option value="Aloe">🌿 Aloe</option>
                      <option value="Apple">🍎 Apple</option>
                      <option value="Tulip">🌷 Tulip</option>
                      <option value="Tomato">🍅 Tomato</option>
                      <option value="Blueberry">🫐 Blueberry</option>
                      <option value="Daffodil">🌻 Daffodil</option>
                      <option value="Corn">🌽 Corn</option>
                      <option value="Watermelon">🍉 Watermelon</option>
                      <option value="Pumpkin">🎃 Pumpkin</option>
                      <option value="Echeveria">🌵 Echeveria</option>
                      <option value="Coconut">🥥 Coconut</option>
                      <option value="Banana">🍌 Banana</option>
                      <option value="Lily">🌺 Lily</option>
                      <option value="BurrosTail">🌿 BurrosTail</option>
                      <option value="Mushroom">🍄 Mushroom</option>
                      <option value="Cactus">🌵 Cactus</option>
                      <option value="Bamboo">🎋 Bamboo</option>
                      <option value="Grape">🍇 Grape</option>
                      <option value="Sunflower">🌻 Sunflower</option>
                      <option value="Pepper">🌶️ Pepper</option>
                      <option value="Lemon">🍋 Lemon</option>
                      <option value="PassionFruit">🥭 PassionFruit</option>
                      <option value="DragonFruit">🐉 DragonFruit</option>
                      <option value="Lychee">🍒 Lychee</option>
                      <option value="Starweaver">⭐ Starweaver</option>
                      <option value="Moonbinder">🌙 Moonbinder</option>
                      <option value="Dawnbinder">🌅 Dawnbinder</option>
                  </select>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Slot Index (0-2):
                  </label>
                  <input type="number" class="mga-input" id="highlight-slot-input"
                         min="0" max="2" value="0" style="width: 80px;">
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Hidden Species:
                  </label>
                  <select class="mga-select" id="hidden-species-select">
                      <option value="">None</option>
                      <option value="Carrot">🥕 Carrot</option>
                      <option value="Strawberry">🍓 Strawberry</option>
                      <option value="Aloe">🌿 Aloe</option>
                      <option value="Apple">🍎 Apple</option>
                      <option value="Tulip">🌷 Tulip</option>
                      <option value="Tomato">🍅 Tomato</option>
                      <option value="Blueberry">🫐 Blueberry</option>
                      <option value="Daffodil">🌻 Daffodil</option>
                      <option value="Corn">🌽 Corn</option>
                      <option value="Watermelon">🍉 Watermelon</option>
                      <option value="Pumpkin">🎃 Pumpkin</option>
                      <option value="Echeveria">🌵 Echeveria</option>
                      <option value="Coconut">🥥 Coconut</option>
                      <option value="Banana">🍌 Banana</option>
                      <option value="Lily">🌺 Lily</option>
                      <option value="BurrosTail">🌿 BurrosTail</option>
                      <option value="Mushroom">🍄 Mushroom</option>
                      <option value="Cactus">🌵 Cactus</option>
                      <option value="Bamboo">🎋 Bamboo</option>
                      <option value="Grape">🍇 Grape</option>
                      <option value="Sunflower">🌻 Sunflower</option>
                      <option value="Pepper">🌶️ Pepper</option>
                      <option value="Lemon">🍋 Lemon</option>
                      <option value="PassionFruit">🥭 PassionFruit</option>
                      <option value="DragonFruit">🐉 DragonFruit</option>
                      <option value="Lychee">🍒 Lychee</option>
                      <option value="Starweaver">⭐ Starweaver</option>
                      <option value="Moonbinder">🌙 Moonbinder</option>
                      <option value="Dawnbinder">🌅 Dawnbinder</option>
                  </select>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Hidden Scale (0.0 - 1.0):
                  </label>
                  <input type="number" class="mga-input" id="hidden-scale-input"
                         min="0" max="1" step="0.1" value="0.1" style="width: 80px;">
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="mga-btn" id="apply-highlighting-btn" style="background: #059669;">
                      ✨ Apply Highlighting
                  </button>
                  <button class="mga-btn mga-btn-sm" id="clear-highlighting-btn" style="background: #dc2626;">
                      🗑️ Clear All
                  </button>
              </div>
          </div>
          <style>
              .mga-tools-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                  gap: 15px;
                  margin-top: 15px;
              }

              .mga-tool-card {
                  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02));
                  border: 1px solid rgba(255, 255, 255, 0.57);
                  border-radius: 8px;
                  padding: 15px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  text-align: center;
              }

              .mga-tool-card:hover {
                  background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255,255,255,0.04));
                  border-color: rgba(255, 255, 255, 0.73);
                  transform: translateY(-2px);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.48);
              }

              .mga-tool-icon {
                  font-size: 2em;
                  margin-bottom: 8px;
              }

              .mga-tool-name {
                  font-weight: bold;
                  margin-bottom: 5px;
                  color: rgba(255,255,255,0.9);
              }

              .mga-tool-desc {
                  font-size: 0.85em;
                  color: rgba(255,255,255,0.6);
                  line-height: 1.3;
              }

              .mga-wiki-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 10px;
                  margin-top: 12px;
              }

              .mga-wiki-card {
                  background: linear-gradient(135deg, rgba(74, 158, 255, 0.28), rgba(74, 158, 255, 0.03));
                  border: 1px solid rgba(74, 158, 255, 0.48);
                  border-radius: 6px;
                  padding: 12px 8px;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  text-align: center;
              }

              .mga-wiki-card:hover {
                  background: linear-gradient(135deg, rgba(74, 158, 255, 0.40), rgba(74, 158, 255, 0.28));
                  border-color: rgba(74, 158, 255, 0.4);
                  transform: translateY(-1px);
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.48);
              }

              .mga-wiki-icon {
                  font-size: 1.5em;
                  margin-bottom: 4px;
              }

              .mga-wiki-name {
                  font-size: 0.85em;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
              }
          </style>
      `;
}

/**
 * Get Protect tab content HTML
 * Provides crop/pet/decor protection interface:
 * - Informational card explaining protection system
 * - Lock by species (13 species)
 * - Lock by mutations (9 mutations) with "Lock All Mutations" and "Lock Only Non-Mutated" toggles
 * - Unlock All button
 * - Allow frozen pickup checkbox (advanced setting)
 * - Sell threshold slider (1.0x-1.5x friend bonus)
 * - Pet ability protection (Gold/Rainbow Granter)
 * - Decor protection list (scrollable)
 * - Currently Protected status display
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @returns {string} HTML content for protect tab
 *
 * @example
 * const html = getProtectTabContent({ UnifiedState });
 * container.innerHTML = html;
 */
export function getProtectTabContent(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const lockedCrops = UnifiedState?.data?.lockedCrops || {};
  const sellThreshold = UnifiedState?.data?.sellBlockThreshold || 1.0;

  return `
          <div class="mga-section">
              <div class="mga-section-title">🔒 Crop Protection</div>
              <div style="padding: 12px; background: rgba(74, 158, 255, 0.30); border-radius: 6px; border-left: 3px solid #4a9eff; margin-bottom: 16px;">
                  <p style="margin-bottom: 8px; font-size: 13px;"><strong>How it works:</strong></p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• <strong>Lock crops</strong> to prevent accidental harvesting</p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• All crops are <strong>unlocked by default</strong></p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• Locked crops <strong>cannot be harvested</strong> until unlocked</p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• <strong>Lock All Mutations:</strong> Locks all mutation types at once</p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• <strong>Lock Only Non-Mutated:</strong> Locks ONLY crops with 0 mutations</p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🌱 Lock Specific Crops</div>
              <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 600;">Lock by Species:</label>
                  <div id="protect-species-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px;">
                      <!-- Species checkboxes will be generated here -->
                  </div>
              </div>

              <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 600;">Lock by Mutations:</label>
                  <div id="protect-mutations-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px;">
                      <!-- Mutation checkboxes will be generated here -->
                  </div>
              </div>

              <div style="margin-bottom: 12px;">
                  <button id="protect-clear-all" class="mga-button" style="background: rgba(239, 68, 68, 0.48); border: 1px solid rgba(239, 68, 68, 0.4);">
                      🔓 Unlock All Crops
                  </button>
              </div>

              <div style="margin-top: 20px; padding: 15px; background: rgba(100, 200, 255, 0.30); border-radius: 8px; border: 1px solid rgba(100,200,255,0.3);">
                  <div style="font-weight: 600; margin-bottom: 10px; color: #64b5f6;">℗ Advanced Settings</div>
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                      <input type="checkbox" id="allow-frozen-pickup" class="mga-checkbox"
                             ${UnifiedState?.data?.protectionSettings?.allowFrozenPickup ? 'checked' : ''}>
                      <span>Allow pickup of protected crops when frozen</span>
                  </label>
                  <div style="font-size: 11px; color: #888; margin-top: 5px; margin-left: 26px;">
                      When enabled, locked Rainbow/Gold crops can still be harvested if they're frozen
                  </div>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">💰 Crop Sell Protection</div>
              <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 600;">Minimum Friend Bonus to Allow Selling Crops:</label>
                  <div style="display: flex; align-items: center; gap: 12px;">
                      <input type="range" id="protect-sell-threshold" min="1.0" max="1.5" step="0.05" value="${sellThreshold}"
                          style="flex: 1; height: 6px; background: rgba(74,158,255,0.3); border-radius: 3px; outline: none;">
                      <span id="protect-sell-threshold-value" style="min-width: 80px; font-weight: 600; color: #4a9eff;">${sellThreshold.toFixed(2)}x (${((sellThreshold - 1) * 100).toFixed(0)}%)</span>
                  </div>
                  <p style="font-size: 11px; color: #888; margin-top: 8px;">
                      Set to 1.0x to allow selling anytime. Max 1.5x (50% bonus). Higher values require better friend bonus.
                  </p>
                  <p style="font-size: 11px; color: #4a9eff; margin-top: 8px; font-weight: 600;">
                      Note: Friend bonus does NOT affect pet selling in the game.
                  </p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🐾 Pet Protection</div>
              <div style="padding: 12px; background: rgba(74, 158, 255, 0.30); border-radius: 6px; border-left: 3px solid #4a9eff; margin-bottom: 16px;">
                  <p style="margin-bottom: 4px; font-size: 12px;">• Lock pets by ability to prevent accidental selling</p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• Protect valuable pets with rare abilities</p>
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 600;">Lock Pets with These Abilities:</label>
                  <div id="protect-pet-abilities-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
                      <!-- Pet ability checkboxes will be generated here -->
                  </div>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🏛️ Decor Protection</div>
              <div style="padding: 12px; background: rgba(74, 158, 255, 0.30); border-radius: 6px; border-left: 3px solid #4a9eff; margin-bottom: 16px;">
                  <p style="margin-bottom: 4px; font-size: 12px;">• Lock decor items to prevent accidental pickup</p>
                  <p style="margin-bottom: 4px; font-size: 12px;">• All decor is <strong>unlocked by default</strong></p>
              </div>
              <div style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 600;">Lock by Decor Type:</label>
                  <div id="protect-decor-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; max-height: 300px; overflow-y: auto; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                      <!-- Decor checkboxes will be generated here -->
                  </div>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">📋 Currently Protected</div>
              <div id="protect-status-display" style="padding: 12px; background: rgba(0, 0, 0, 0.48); border-radius: 6px; font-size: 12px; min-height: 60px;">
                  <div style="color: #888;">No crops are currently locked.</div>
              </div>
          </div>
      `;
}

/**
 * Get Help tab content HTML
 * Comprehensive user documentation including:
 * - Getting Started guide
 * - Dock Controls (click, shift+click, drag, toggle orientation)
 * - Keyboard Shortcuts (Alt+=/-/M/B, ESC, Custom)
 * - Turtle Timer & Slot Value explanation
 * - Version Indicator guide (green/yellow/red/orange dots)
 * - Pet Management guide
 * - Crop Protection guide
 * - Ability Tracking guide
 * - Seeds & Automation guide
 * - Shop Interface guide
 * - Notifications guide
 * - Customization options
 * - Troubleshooting section
 * - Tips & Best Practices
 *
 * @returns {string} HTML content for help tab
 *
 * @example
 * const html = getHelpTabContent();
 * container.innerHTML = html;
 */
export function getHelpTabContent() {
  return `
          <div class="mga-section">
              <div class="mga-section-title">🚀 Getting Started</div>
              <div style="margin-bottom: 16px;">
                  <p style="margin-bottom: 8px;"><strong>Magic Garden Unified</strong> provides a hybrid dock interface with powerful tools for managing pets, tracking abilities, shop automation, and resource monitoring.</p>
                  <p style="margin-bottom: 8px;">Click dock icons to open sidebars, or Shift+Click to open floating widgets. Drag the dock from its edges to reposition.</p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🎛️ Dock Controls</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Click Icon:</strong> Opens slide-out sidebar</li>
                  <li style="margin-bottom: 4px;"><strong>Shift+Click Icon:</strong> Opens floating popout widget</li>
                  <li style="margin-bottom: 4px;"><strong>Drag from edges:</strong> Reposition the dock (grab cursor appears near edges)</li>
                  <li style="margin-bottom: 4px;"><strong>↔ Icon:</strong> Toggle horizontal/vertical orientation</li>
                  <li style="margin-bottom: 4px;"><strong>⋯ Icon:</strong> Hover to reveal Tools, Settings, Hotkeys, Notifications, Help</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">⌨️ Keyboard Shortcuts</div>
              <div class="mga-help-grid" style="display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; margin-bottom: 16px;">
                  <code style="background: rgba(74, 158, 255, 0.48); padding: 2px 6px; border-radius: 3px;">Alt+=</code>
                  <span>Increase dock size (Micro → Mini → Tiny → Small → Medium → Large)</span>
                  <code style="background: rgba(74, 158, 255, 0.48); padding: 2px 6px; border-radius: 3px;">Alt+-</code>
                  <span>Decrease dock size (Large → Medium → Small → Tiny → Mini → Micro)</span>
                  <code style="background: rgba(74, 158, 255, 0.48); padding: 2px 6px; border-radius: 3px;">Alt+M</code>
                  <span>Toggle toolbar visibility (show/hide entire dock and sidebar)</span>
                  <code style="background: rgba(74, 158, 255, 0.48); padding: 2px 6px; border-radius: 3px;">Alt+B</code>
                  <span>Toggle Shop (opens/closes both seed and egg sidebars)</span>
                  <code style="background: rgba(74, 158, 255, 0.48); padding: 2px 6px; border-radius: 3px;">Escape</code>
                  <span>Close shop sidebars</span>
                  <code style="background: rgba(74, 158, 255, 0.48); padding: 2px 6px; border-radius: 3px;">Custom</code>
                  <span>Set your own hotkeys for tabs and pet presets in Hotkeys tab (⌨️)</span>
              </div>
              <p style="font-size: 11px; color: #888; margin-top: 12px; padding: 8px; background: rgba(255, 200, 100, 0.30); border-radius: 4px; border-left: 3px solid #ffc864;">
                  <strong>⚠️ Note:</strong> Ctrl+1-9 removed to avoid conflicts with game hotbar controls.<br>
                  Use the Hotkeys tab to set custom keys for opening tabs and loading pet presets!
              </p>
              <p style="font-size: 11px; color: #888; margin-top: 8px; padding: 8px; background: rgba(74, 158, 255, 0.30); border-radius: 4px; border-left: 3px solid #4a9eff;">
                  <strong>🎮 Pet Preset Hotkeys:</strong><br>
                  • Click "Set Hotkey" button next to any preset<br>
                  • Press your desired key combination<br>
                  • Hotkey will instantly load that preset when pressed<br>
                  • Perfect for quick pet swapping during gameplay!
              </p>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">📊 Turtle Timer & Slot Value</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Slot Value:</strong> Always shows when standing on crops (💰 gold text)</li>
                  <li style="margin-bottom: 4px;"><strong>Turtle Timer:</strong> Green countdown shown when turtle pet is active</li>
                  <li style="margin-bottom: 4px;"><strong>Display Location:</strong> Appears below crop growth timer in-game</li>
                  <li style="margin-bottom: 4px;"><strong>Values:</strong> Calculated from species value × scale × hybrid multiplier × friend bonus</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🔴🟢 Version Indicator</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Green Dot (●):</strong> You're up to date! ✓</li>
                  <li style="margin-bottom: 4px;"><strong>Yellow Dot (●):</strong> Development version (newer than GitHub)</li>
                  <li style="margin-bottom: 4px;"><strong>Red Dot (●):</strong> Update available</li>
                  <li style="margin-bottom: 4px;"><strong>Orange Dot (●):</strong> Version check failed (network/404 error)</li>
                  <li style="margin-bottom: 4px;"><strong>Click Dot:</strong> Manually refresh version check (bypasses GitHub cache)</li>
                  <li style="margin-bottom: 4px;"><strong>Shift+Click Dot:</strong> Open script on GitHub (when red/orange)</li>
                  <li style="margin-bottom: 4px;"><strong>Location:</strong> Hover ⋯ icon in dock to reveal version dot</li>
                  <li style="margin-bottom: 4px;"><strong>How it works:</strong> Checks GitHub for version.json or magicgardenunified.user.js (tries main/master branches with cache-busting)</li>
                  <li style="margin-bottom: 4px;"><strong>Cache delay:</strong> GitHub CDN caches files ~2-5 min, click dot to force refresh</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🐾 Pet Management</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Save Presets:</strong> Store your current pet setup with a custom name</li>
                  <li style="margin-bottom: 4px;"><strong>Load Presets:</strong> Quickly deploy saved pet configurations</li>
                  <li style="margin-bottom: 4px;"><strong>Reorder Presets:</strong> Use ↑↓ arrows or drag-and-drop to organize your preset list</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🔒 Crop Protection</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Lock Species:</strong> Prevent harvesting specific crop types (e.g., Pepper, Starweaver)</li>
                  <li style="margin-bottom: 4px;"><strong>Lock Mutations:</strong> Block harvesting crops with certain mutations (Rainbow, Frozen)</li>
                  <li style="margin-bottom: 4px;"><strong>All Unlocked by Default:</strong> Crops can be harvested normally until you lock them</li>
                  <li style="margin-bottom: 4px;"><strong>Sell Protection:</strong> Set minimum friend bonus threshold (1.0x-1.5x / 0%-50%) before selling allowed</li>
                  <li style="margin-bottom: 4px;"><strong>Smart Blocking:</strong> Prevents both manual and automated harvesting of locked crops</li>
                  <li style="margin-bottom: 4px;"><strong>Real-time Updates:</strong> Changes take effect immediately without reload</li>
                  <li style="margin-bottom: 4px;"><strong>Status Display:</strong> View all currently protected crops at a glance</li>
              </ul>
              <p style="font-size: 11px; color: #888; margin-top: 12px; padding: 8px; background: rgba(74, 158, 255, 0.30); border-radius: 4px; border-left: 3px solid #4a9eff;">
                  <strong>💡 Pro Tip:</strong> Use crop protection to safeguard valuable mutations while auto-harvesting everything else. Set sell protection to 1.5x (50% bonus) to ensure you only sell during maximum friend bonus!
              </p>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">⚡ Ability Tracking</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Automatic Logging:</strong> All pet abilities are tracked automatically</li>
                  <li style="margin-bottom: 4px;"><strong>Filter by Category:</strong> View specific types of abilities (XP, Selling, etc.)</li>
                  <li style="margin-bottom: 4px;"><strong>Filter by Pet:</strong> See abilities from specific pet species</li>
                  <li style="margin-bottom: 4px;"><strong>Detailed Timestamps:</strong> Enable to show HH:MM:SS format timestamps</li>
                  <li style="margin-bottom: 4px;"><strong>Export Data:</strong> Download ability logs as CSV for analysis</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🌱 Seeds & Automation</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Mass Deletion:</strong> Select multiple seed types for bulk deletion</li>
                  <li style="margin-bottom: 4px;"><strong>Auto-Delete:</strong> Automatically remove unwanted seeds as they appear</li>
                  <li style="margin-bottom: 4px;"><strong>Value Calculation:</strong> See total value of selected seeds before deletion</li>
                  <li style="margin-bottom: 4px;"><strong>Quick Selection:</strong> Use preset buttons for common seed types</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🛒 Shop Interface</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Dual Sidebars:</strong> Seeds on left, eggs on right (both open together)</li>
                  <li style="margin-bottom: 4px;"><strong>Color-Coded Names:</strong> Item rarity shown by text color (rainbow for celestial)</li>
                  <li style="margin-bottom: 4px;"><strong>Auto-Restock Detection:</strong> Purchase tracking resets when shop restocks</li>
                  <li style="margin-bottom: 4px;"><strong>Sort & Filter:</strong> Show available only, sort by value</li>
                  <li style="margin-bottom: 4px;"><strong>Quick Purchase:</strong> Buy 1 or All buttons for each item</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🔔 Notifications</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Shop Monitoring:</strong> Get alerts when rare seeds/eggs appear</li>
                  <li style="margin-bottom: 4px;"><strong>Multiple Notifications:</strong> Single click dismisses all pending alerts</li>
                  <li style="margin-bottom: 4px;"><strong>Continuous Mode:</strong> Must be enabled via checkbox for persistent alerts</li>
                  <li style="margin-bottom: 4px;"><strong>Sound Types:</strong> Choose from beep, alarm, fanfare, or continuous alerts</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🎨 Customization</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Themes:</strong> Switch between normal, dark, and other visual themes</li>
                  <li style="margin-bottom: 4px;"><strong>Compact Modes:</strong> Use compact or ultra-compact layouts to save space</li>
                  <li style="margin-bottom: 4px;"><strong>Overlays:</strong> Pop out tabs into separate in-game overlays</li>
                  <li style="margin-bottom: 4px;"><strong>Crop Highlighting:</strong> Visually highlight specific crops in your garden</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">❓ Troubleshooting</div>
              <ul style="margin-left: 16px; margin-bottom: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Crop Highlighting Not Working:</strong> Ensure the game is fully loaded before using highlighting</li>
                  <li style="margin-bottom: 4px;"><strong>Notifications Not Playing:</strong> Check volume settings and browser audio permissions</li>
                  <li style="margin-bottom: 4px;"><strong>Pet Presets Not Saving:</strong> Wait for success confirmation before switching tabs</li>
                  <li style="margin-bottom: 4px;"><strong>Performance Issues:</strong> Try compact mode or disable debug logging in settings</li>
              </ul>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">💡 Tips & Best Practices</div>
              <ul style="margin-left: 16px;">
                  <li style="margin-bottom: 4px;"><strong>Regular Backups:</strong> Export ability logs periodically for data safety</li>
                  <li style="margin-bottom: 4px;"><strong>Preset Organization:</strong> Use descriptive names and reorder presets by frequency of use</li>
                  <li style="margin-bottom: 4px;"><strong>Notification Management:</strong> Enable continuous mode only for critical alerts</li>
                  <li style="margin-bottom: 4px;"><strong>Resource Monitoring:</strong> Use the Values tab to track inventory and garden worth</li>
              </ul>
          </div>
      `;
}

/**
 * Get Hotkeys tab content HTML
 * Provides custom hotkey configuration interface:
 * - Enable/disable custom hotkeys checkbox
 * - Game Controls section (water, harvest, feed, etc.) with rebind buttons and reset
 * - MGTools Navigation & Features section (custom keys) with rebind and reset
 * - Green highlight for custom keys, blue for defaults
 * - Reset individual hotkeys or reset all button
 * - Export Config button
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object
 * @returns {string} HTML content for hotkeys tab
 *
 * @example
 * const html = getHotkeysTabContent({ UnifiedState });
 * container.innerHTML = html;
 */
export function getHotkeysTabContent(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const hotkeys = UnifiedState?.data?.hotkeys || { enabled: false, gameKeys: {}, mgToolsKeys: {} };

  return `
          <div class="mga-section">
              <div class="mga-section-title">🎮 Custom Hotkeys</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Click any key button to set a custom keybind. Press ESC to cancel.
              </p>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                      <input type="checkbox" id="hotkeys-enabled" class="mga-checkbox"
                             ${hotkeys.enabled ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>Enable custom hotkeys</span>
                  </label>
              </div>

              <div class="mga-section">
                  <div class="mga-section-title" style="font-size: 13px;">Game Controls</div>
                  ${Object.entries(hotkeys.gameKeys || {})
                    .map(
                      ([key, config]) => `
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                          <span style="font-size: 12px; flex: 1;">${config.name}</span>
                          <button class="hotkey-button" data-key="${key}" style="
                              padding: 4px 8px;
                              background: ${config.custom ? 'rgba(100, 255, 100, 0.48)' : 'rgba(74, 158, 255, 0.48)'};
                              border: 1px solid ${config.custom ? '#64ff64' : '#4a9eff'};
                              border-radius: 4px;
                              color: white;
                              font-size: 11px;
                              min-width: 80px;
                              cursor: pointer;
                          ">
                              ${config.custom ? `${config.original.toUpperCase()} → ${config.custom.toUpperCase()}` : config.original.toUpperCase()}
                          </button>
                          ${
                            config.custom
                              ? `
                              <button class="hotkey-reset" data-key="${key}" style="
                                  margin-left: 5px;
                                  padding: 2px 6px;
                                  background: rgba(255, 100, 100, 0.48);
                                  border: 1px solid #ff6464;
                                  border-radius: 3px;
                                  color: white;
                                  font-size: 10px;
                                  cursor: pointer;
                              ">↺</button>
                          `
                              : ''
                          }
                      </div>
                  `
                    )
                    .join('')}
              </div>

              <div class="mga-section">
                  <div class="mga-section-title" style="font-size: 13px;">MGTools Navigation & Features</div>
                  ${Object.entries(hotkeys.mgToolsKeys || {})
                    .map(
                      ([key, config]) => `
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                          <span style="font-size: 12px; flex: 1;">${config.name}</span>
                          <button class="hotkey-button-mgtools" data-key="${key}" style="
                              padding: 4px 8px;
                              background: ${config.custom ? 'rgba(100, 255, 100, 0.48)' : 'rgba(74, 158, 255, 0.48)'};
                              border: 1px solid ${config.custom ? '#64ff64' : '#4a9eff'};
                              border-radius: 4px;
                              color: white;
                              font-size: 11px;
                              min-width: 80px;
                              cursor: pointer;
                          ">
                              ${config.custom ? config.custom.toUpperCase() : 'Not Set'}
                          </button>
                          ${
                            config.custom
                              ? `
                              <button class="hotkey-reset-mgtools" data-key="${key}" style="
                                  margin-left: 5px;
                                  padding: 2px 6px;
                                  background: rgba(255, 100, 100, 0.48);
                                  border: 1px solid #ff6464;
                                  border-radius: 3px;
                                  color: white;
                                  font-size: 10px;
                                  cursor: pointer;
                              ">↺</button>
                          `
                              : ''
                          }
                      </div>
                  `
                    )
                    .join('')}
              </div>

              <div style="display: flex; gap: 10px; margin-top: 15px;">
                  <button id="hotkeys-reset-all" class="mga-button" style="flex: 1;">
                      Reset All
                  </button>
                  <button id="hotkeys-export" class="mga-button" style="flex: 1;">
                      Export Config
                  </button>
              </div>
          </div>
      `;
}
