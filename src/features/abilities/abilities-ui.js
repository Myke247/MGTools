/**
 * Abilities Tab UI Generation
 *
 * Generates the HTML content for the Abilities tab, including:
 * - Filter mode selection (Categories, By Pet, Custom)
 * - Category filters (XP Boost, Crop Size, Selling, etc.)
 * - Pet species filter list
 * - Individual abilities filter list
 * - Action buttons (Clear Logs, Export CSV, Diagnose Storage)
 * - Recent ability triggers display area
 * - Detailed timestamps toggle
 *
 * @module features/abilities/abilities-ui
 */

/**
 * Get Abilities tab content HTML
 *
 * Generates the complete HTML for the Abilities tab interface including
 * filter controls, mode selection, and ability logs display area.
 *
 * Filter Modes:
 * - Categories: Filter by ability type categories (XP, Selling, Harvesting, etc.)
 * - By Pet: Filter by pet species name
 * - Custom: Filter by individual ability types
 *
 * Category Filters:
 * - 💫 XP Boost (pet experience gain)
 * - 📈 Crop Size Boost (harvest size increase)
 * - 💰 Selling (coins from selling)
 * - 🌾 Harvesting (double harvest, auto-harvest)
 * - 🐢 Growth Speed (plant/egg growth acceleration)
 * - 🌈✨ Special Mutations (Rainbow/Gold conversions)
 * - 🔧 Other (passive abilities)
 *
 * Action Buttons:
 * - Clear Logs: Remove all ability log entries
 * - Export CSV: Download ability logs as CSV file
 * - Diagnose Storage: Show storage diagnostic (debug mode only)
 *
 * Display Options:
 * - Detailed timestamps toggle (24-hour vs 12-hour format)
 * - Ability logs area (max 30 recent entries, scrollable)
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state with ability logs and filters
 * @returns {string} HTML content for abilities tab
 *
 * @example
 * const html = getAbilitiesTabContent({ UnifiedState });
 * container.innerHTML = html;
 */
export function getAbilitiesTabContent(dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const logs = (UnifiedState?.data?.petAbilityLogs || []).slice(0, 30);
  const filterMode = UnifiedState?.data?.filterMode || 'categories';
  const abilityFilters = UnifiedState?.data?.abilityFilters || {};
  const debugMode = UnifiedState?.data?.settings?.debugMode || false;
  const detailedTimestamps = UnifiedState?.data?.settings?.detailedTimestamps || false;

  const html = `
          <div class="mga-section">
              <div class="mga-section-title">Filter Mode</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
                  <div style="display: flex; gap: 6px;">
                      <button class="mga-btn mga-btn-sm ${filterMode === 'categories' ? 'active' : ''}" id="filter-mode-categories" style="padding: 6px 12px; font-size: 12px;">Categories</button>
                      <button class="mga-btn mga-btn-sm ${filterMode === 'byPet' ? 'active' : ''}" id="filter-mode-bypet" style="padding: 6px 12px; font-size: 12px;">By Pet</button>
                      <button class="mga-btn mga-btn-sm ${filterMode === 'custom' ? 'active' : ''}" id="filter-mode-custom" style="padding: 6px 12px; font-size: 12px;">Custom</button>
                  </div>
                  <div style="display: flex; gap: 6px;">
                      <button class="mga-btn mga-btn-sm" id="select-all-filters" style="padding: 6px 10px; font-size: 11px;">All</button>
                      <button class="mga-btn mga-btn-sm" id="select-none-filters" style="padding: 6px 10px; font-size: 11px;">None</button>
                  </div>
              </div>
              <div id="filter-mode-description" style="font-size: 11px; color: #aaa; margin-bottom: 12px; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 4px;">
                  ${
                    filterMode === 'categories'
                      ? '📂 Filter by ability categories'
                      : filterMode === 'byPet'
                        ? '🐾 Filter by pet species'
                        : '⚙️ Filter by individual abilities'
                  }
              </div>

              <!-- Categories Mode -->
              <div id="category-filters" style="display: ${filterMode === 'categories' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.xpBoost ? 'checked' : ''} data-filter="xpBoost" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">💫 XP Boost</span>
                  </label>
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.cropSizeBoost ? 'checked' : ''} data-filter="cropSizeBoost" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">📈 Crop Size Boost</span>
                  </label>
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.selling ? 'checked' : ''} data-filter="selling" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">💰 Selling</span>
                  </label>
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.harvesting ? 'checked' : ''} data-filter="harvesting" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">🌾 Harvesting</span>
                  </label>
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.growthSpeed ? 'checked' : ''} data-filter="growthSpeed" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">🐢 Growth Speed</span>
                  </label>
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.specialMutations ? 'checked' : ''} data-filter="specialMutations" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">🌈✨ Special Mutations</span>
                  </label>
                  <label class="mga-checkbox-group" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                      <input type="checkbox" class="mga-checkbox" ${abilityFilters.other ? 'checked' : ''} data-filter="other" style="accent-color: #4a9eff;">
                      <span class="mga-label" style="font-size: 12px;">🔧 Other</span>
                  </label>
              </div>

              <!-- By Pet Mode -->
              <div id="pet-filters" style="display: ${filterMode === 'byPet' ? 'block' : 'none'}; margin-bottom: 8px;">
                  <div id="pet-species-list" class="mga-scrollable" style="max-height: 150px; border: 1px solid rgba(255, 255, 255, 0.57); border-radius: 4px; padding: 8px;">
                      <div style="color: #888; text-align: center;">Loading pet species...</div>
                  </div>
              </div>

              <!-- Custom Mode -->
              <div id="custom-filters" style="display: ${filterMode === 'custom' ? 'block' : 'none'}; margin-bottom: 8px;">
                  <div id="individual-abilities-list" class="mga-scrollable" style="max-height: 150px; border: 1px solid rgba(255, 255, 255, 0.57); border-radius: 4px; padding: 8px;">
                      <div style="color: #888; text-align: center;">Loading individual abilities...</div>
                  </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                  <button class="mga-btn mga-btn-sm" id="clear-logs-btn">Clear Logs</button>
                  <button class="mga-btn mga-btn-sm" id="export-logs-btn">Export CSV</button>
                  ${debugMode ? '<button class="mga-btn mga-btn-sm" id="diagnose-logs-btn" style="background: #ff6b35;">🔍 Diagnose Storage</button>' : ''}
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Recent Ability Triggers</div>
              <div style="margin-bottom: 8px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="detailed-timestamps-checkbox" class="mga-checkbox"
                             ${detailedTimestamps ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🕐 Show detailed timestamps (HH:MM:SS)</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      When enabled, shows detailed 24-hour format timestamps instead of 12-hour format.
                  </p>
              </div>
              <div id="ability-logs" class="mga-scrollable" style="max-height: 400px; overflow-y: auto;">
                  ${logs.length === 0 ? '<div style="color: #888; text-align: center; padding: 20px;">No ability logs yet. Ability logs will appear here when your pets trigger abilities in-game.</div>' : ''}
              </div>
          </div>
      `;

  return html;
}
