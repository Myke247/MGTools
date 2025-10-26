/**
 * Abilities Display Logic
 *
 * Manages the display and filtering of pet ability logs:
 * - Log display updates across all contexts (main UI + overlays)
 * - Filter mode switching (Categories, By Pet, Custom)
 * - Filter content population
 * - Log visibility management with CSS
 * - Performance caching
 *
 * @module features/abilities/abilities-display
 */

import { normalizeAbilityName, categorizeAbilityToFilterKey } from './abilities-data.js';
import { formatRelativeTime, formatLogData, getAllUniquePets, getAllUniqueAbilities } from './abilities-utils.js';

/**
 * Performance cache for expensive operations
 * - categories: Map of ability types to category keys
 * - timestamps: Map of timestamps to formatted strings
 * - normalizedNames: Map of raw names to normalized names
 * - lastTimestampUpdate: Timestamp of last cache clear
 *
 * @type {object}
 */
export const MGA_AbilityCache = {
  categories: new Map(),
  timestamps: new Map(),
  normalizedNames: new Map(),
  lastTimestampUpdate: 0
};

/**
 * Initialize cache clearing interval
 *
 * Clears timestamp cache every minute since relative times change over time.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Function} [dependencies.setInterval] - setInterval function
 * @param {object} [dependencies.Date] - Date constructor
 * @returns {number} Interval ID
 */
export function initCacheClearInterval(dependencies = {}) {
  const {
    setInterval: setIntervalFn = typeof setInterval !== 'undefined' ? setInterval : null,
    Date: DateClass = typeof Date !== 'undefined' ? Date : null
  } = dependencies;

  if (!setIntervalFn) return null;

  return setIntervalFn(() => {
    MGA_AbilityCache.timestamps.clear();
    MGA_AbilityCache.lastTimestampUpdate = DateClass.now();
  }, 60000);
}

/**
 * Format timestamp based on user preferences
 *
 * @param {number} timestamp - Unix timestamp
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State with timestamp preferences
 * @param {object} [dependencies.Date] - Date constructor
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    Date: DateClass = typeof Date !== 'undefined' ? Date : null
  } = dependencies;

  const useDetailedTimestamps = UnifiedState?.data?.settings?.detailedTimestamps;

  if (useDetailedTimestamps) {
    const date = new DateClass(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  return formatRelativeTime(timestamp, dependencies);
}

/**
 * Update ability log display in a specific context
 *
 * Renders ability logs with filtering, formatting, and styling.
 * Uses DocumentFragment for batch DOM updates (performance optimization).
 *
 * Features:
 * - Filters logs based on current filter mode
 * - Categorizes and color-codes logs
 * - Highlights recent logs (< 10 seconds)
 * - Auto-scrolls to newest entries
 * - Injects CSS styles dynamically
 *
 * @param {Document|Element} context - DOM context to update
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State with logs and filters
 * @param {Function} [dependencies.MGA_getAllLogs] - Function to get all logs
 * @param {Function} [dependencies.shouldLogAbility] - Filter function
 * @param {Function} [dependencies.debugLog] - Debug logging
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {object} [dependencies.CONFIG] - Config object
 * @param {Console} [dependencies.console] - Console for logging
 * @param {object} [dependencies.Date] - Date constructor
 *
 * @example
 * updateAbilityLogDisplay(document, { UnifiedState, MGA_getAllLogs, shouldLogAbility });
 */
export function updateAbilityLogDisplay(context = null, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_getAllLogs = typeof window !== 'undefined' && window.MGA_getAllLogs,
    shouldLogAbility = typeof window !== 'undefined' && window.shouldLogAbility,
    debugLog = typeof window !== 'undefined' && window.debugLog ? window.debugLog : () => {},
    targetDocument = typeof document !== 'undefined' ? document : null,
    CONFIG = typeof window !== 'undefined' && window.CONFIG,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {} },
    Date: DateClass = typeof Date !== 'undefined' ? Date : null
  } = dependencies;

  const ctx = context || targetDocument;
  const abilityLogs = ctx.querySelector('#ability-logs');
  if (!abilityLogs) {
    debugLog('ABILITY_LOGS', 'No ability logs element found in context', {
      isDocument: ctx === targetDocument,
      className: ctx.className || 'unknown'
    });
    return;
  }

  // Preserve drag state if this is a content-only overlay being updated
  const isOverlay = ctx.classList?.contains('mga-overlay-content-only');
  const isDragInProgress = ctx.getAttribute?.('data-dragging') === 'true';
  if (isOverlay && isDragInProgress) {
    debugLog('ABILITY_LOGS', 'Skipping content update during drag operation', {
      overlayId: ctx.id
    });
    return;
  }

  const logs = MGA_getAllLogs ? MGA_getAllLogs() : UnifiedState?.data?.petAbilityLogs || [];
  const filteredLogs = logs.filter(log => {
    return shouldLogAbility ? shouldLogAbility(log.abilityType, log.petName) : true;
  });

  debugLog('ABILITY_LOGS', 'Updating ability log display', {
    totalLogs: logs.length,
    filteredLogs: filteredLogs.length,
    filterMode: UnifiedState?.data?.filterMode
  });

  // Diagnostic logging for FIX_VALIDATION
  if (CONFIG?.DEBUG?.FLAGS?.FIX_VALIDATION) {
    consoleFn.log('[FIX_ABILITY_LOGS] Update called:', {
      totalLogs: logs.length,
      filteredLogs: filteredLogs.length,
      filterMode: UnifiedState?.data?.filterMode,
      elementFound: !!abilityLogs,
      contextType: ctx === targetDocument ? 'document' : 'overlay'
    });
  }

  const htmlParts = [];
  filteredLogs.forEach((_log, index) => {
    const log = filteredLogs[index];
    const category = categorizeAbilityToFilterKey(log.abilityType);
    const categoryData = {
      xpBoost: { icon: '💫', color: '#4a9eff', label: 'XP Boost' },
      cropSizeBoost: { icon: '📈', color: '#10b981', label: 'Crop Size' },
      selling: { icon: '💰', color: '#f59e0b', label: 'Selling' },
      harvesting: { icon: '🌾', color: '#84cc16', label: 'Harvesting' },
      growthSpeed: { icon: '🐢', color: '#06b6d4', label: 'Growth Speed' },
      specialMutations: { icon: '🌈✨', color: '#8b5cf6', label: 'Special' },
      other: { icon: '🔧', color: '#6b7280', label: 'Other' }
    };

    const catData = categoryData[category] || categoryData.other;
    const formattedTime = formatTimestamp(log.timestamp, dependencies);
    const isRecent = DateClass.now() - log.timestamp < 10000; // Less than 10 seconds ago
    const displayAbilityName = normalizeAbilityName(log.abilityType);

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
                  ${
                    log.data && Object.keys(log.data).length > 0
                      ? `<div class="mga-log-details">${formatLogData(log.data)}</div>`
                      : ''
                  }
              </div>
          `);
  });

  // PERFORMANCE: Use DocumentFragment for batch DOM updates
  const fragment = targetDocument.createDocumentFragment();
  const tempContainer = targetDocument.createElement('div');

  if (htmlParts.length === 0) {
    const mode = UnifiedState?.data?.filterMode || 'categories';
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
    // Auto-scroll to newest if there are new entries
    setTimeout(() => {
      if (abilityLogs.scrollHeight > abilityLogs.clientHeight) {
        abilityLogs.scrollTop = 0; // Scroll to top (newest entries)
      }
    }, 100);
  }

  // Move all children to fragment, then update DOM once
  while (tempContainer.firstChild) {
    fragment.appendChild(tempContainer.firstChild);
  }

  abilityLogs.innerHTML = '';
  abilityLogs.appendChild(fragment);

  // Add enhanced log styles if not already present
  if (!ctx.querySelector('#mga-log-styles')) {
    const logStyles = targetDocument.createElement('style');
    logStyles.id = 'mga-log-styles';
    logStyles.textContent = `
              .mga-log-item {
                  margin: 4px 0;
                  padding: 8px;
                  border-radius: 4px;
                  background: rgba(255, 255, 255, 0.02);
                  border-left: 2px solid var(--category-color, #6b7280);
                  transition: all 0.2s ease;
                  font-size: 11px;
                  line-height: 1.3;
              }

              .mga-log-item:hover {
                  background: rgba(255, 255, 255, 0.05);
                  transform: translateX(2px);
              }

              .mga-log-recent {
                  background: rgba(74, 158, 255, 0.30);
                  border-color: #4a9eff;
                  box-shadow: 0 0 8px rgba(74, 158, 255, 0.3);
                  animation: mgaLogPulse 2s ease-out;
              }

              @keyframes mgaLogPulse {
                  0% { box-shadow: 0 0 8px rgba(74, 158, 255, 0.6); }
                  100% { box-shadow: 0 0 8px rgba(74, 158, 255, 0.3); }
              }

              .mga-log-header {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 2px;
              }

              .mga-log-icon {
                  font-size: 14px;
              }

              .mga-log-meta {
                  display: flex;
                  gap: 8px;
                  align-items: center;
                  flex: 1;
              }

              .mga-log-pet {
                  font-weight: 600;
              }

              .mga-log-time {
                  color: #999;
                  font-size: 10px;
              }

              .mga-log-ability {
                  margin-left: 20px;
                  color: #ddd;
              }

              .mga-log-details {
                  margin-left: 20px;
                  font-size: 10px;
                  color: #999;
                  margin-top: 2px;
              }
          `;
    ctx.appendChild(logStyles);
  }
}

/**
 * Update ability log displays across all contexts
 *
 * Updates logs in main document and all visible overlays/widgets.
 * Optimized to skip updates if log count hasn't changed (unless forced).
 *
 * @param {boolean} force - Force update even if log count unchanged
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State with logs
 * @param {number} [dependencies.lastLogCount] - Last known log count
 * @param {Function} [dependencies.debugLog] - Debug logging
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {object} [dependencies.CONFIG] - Config object
 * @param {Console} [dependencies.console] - Console
 *
 * @example
 * updateAllAbilityLogDisplays(false, { UnifiedState, lastLogCount: 50 });
 */
export function updateAllAbilityLogDisplays(force = false, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    lastLogCount = typeof window !== 'undefined' && window.lastLogCount,
    debugLog = typeof window !== 'undefined' && window.debugLog ? window.debugLog : () => {},
    targetDocument = typeof document !== 'undefined' ? document : null,
    CONFIG = typeof window !== 'undefined' && window.CONFIG,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {} }
  } = dependencies;

  // OPTIMIZED: Skip if no new logs (unless forced by settings change)
  const currentLogCount = UnifiedState?.data?.petAbilityLogs?.length || 0;

  // Debug logging for ability logs
  if (CONFIG?.DEBUG?.FLAGS?.FIX_VALIDATION) {
    consoleFn.log('[FIX_ABILITY_LOGS] Update called:', {
      force,
      currentLogCount,
      lastLogCount,
      willUpdate: force || currentLogCount !== lastLogCount,
      petAbilityLogsExists: !!UnifiedState?.data?.petAbilityLogs
    });
  }

  if (!force && currentLogCount === lastLogCount) {
    debugLog('ABILITY_LOGS', 'Skipping update - no new logs');
    return;
  }

  if (typeof window !== 'undefined' && window.lastLogCount !== undefined) {
    window.lastLogCount = currentLogCount;
  }

  debugLog('ABILITY_LOGS', 'Updating ability logs across all contexts');

  // Update main document context
  updateAbilityLogDisplay(targetDocument, dependencies);

  // OPTIMIZED: Only query DOM once and filter for visible overlays and widgets
  const allOverlays = targetDocument.querySelectorAll('.mga-overlay-content-only, .mga-overlay, .mgh-popout');
  allOverlays.forEach(overlay => {
    // Skip if hidden
    if (overlay.offsetParent === null) return;

    if (overlay.querySelector('#ability-logs')) {
      updateAbilityLogDisplay(overlay, dependencies);
      debugLog('ABILITY_LOGS', 'Updated overlay/widget ability logs', {
        overlayId: overlay.id || overlay.className
      });
    }
  });
}

/**
 * Update log visibility using CSS (performance optimized)
 *
 * Toggles visibility of log items based on current filter settings
 * without rebuilding the DOM.
 *
 * @param {Document|Element} context - DOM context
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State with filter settings
 * @param {Function} [dependencies.debugLog] - Debug logging
 *
 * @example
 * updateLogVisibility(document, { UnifiedState });
 */
export function updateLogVisibility(context = null, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    debugLog = typeof window !== 'undefined' && window.debugLog ? window.debugLog : () => {}
  } = dependencies;

  const ctx = context || (typeof document !== 'undefined' ? document : null);
  const abilityLogs = ctx.querySelector('#ability-logs');
  if (!abilityLogs) return;

  const filterMode = UnifiedState?.data?.filterMode || 'categories';
  const logItems = abilityLogs.querySelectorAll('.mga-log-item');

  debugLog('ABILITY_LOGS', 'Updating log visibility via CSS', {
    filterMode,
    totalItems: logItems.length
  });

  logItems.forEach(item => {
    let shouldShow = false;

    if (filterMode === 'categories') {
      const category = item.dataset.category;
      shouldShow = UnifiedState?.data?.abilityFilters?.[category] || false;
    } else if (filterMode === 'byPet') {
      const petName = item.dataset.petName;
      shouldShow = UnifiedState?.data?.petFilters?.selectedPets?.[petName] || false;
    } else if (filterMode === 'custom') {
      const abilityType = item.dataset.abilityType;
      shouldShow = UnifiedState?.data?.customMode?.selectedAbilities?.[abilityType] || false;
    }

    item.style.display = shouldShow ? '' : 'none';
  });
}

/**
 * Update log visibility across all contexts
 *
 * Applies visibility updates to main document and all visible overlays.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Function} [dependencies.debugLog] - Debug logging
 * @param {Document} [dependencies.targetDocument] - Target document
 *
 * @example
 * updateAllLogVisibility({ targetDocument: document });
 */
export function updateAllLogVisibility(dependencies = {}) {
  const {
    debugLog = typeof window !== 'undefined' && window.debugLog ? window.debugLog : () => {},
    targetDocument = typeof document !== 'undefined' ? document : null
  } = dependencies;

  debugLog('ABILITY_LOGS', 'Updating log visibility across all contexts');

  updateLogVisibility(targetDocument, dependencies);

  const allOverlays = targetDocument.querySelectorAll('.mga-overlay-content-only, .mga-overlay');
  allOverlays.forEach(overlay => {
    if (overlay.offsetParent === null) return;
    if (overlay.querySelector('#ability-logs')) {
      updateLogVisibility(overlay, dependencies);
    }
  });
}

/**
 * Switch filter mode and update UI
 *
 * Changes the active filter mode (Categories, By Pet, Custom) and updates
 * all UI elements accordingly.
 *
 * @param {string} mode - Filter mode ('categories', 'byPet', 'custom')
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Document} [dependencies.document] - Document reference
 *
 * @example
 * switchFilterMode('byPet', { UnifiedState, MGA_saveJSON });
 */
export function switchFilterMode(mode, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    targetDocument = typeof document !== 'undefined' ? document : null,
    document: doc = typeof document !== 'undefined' ? document : null
  } = dependencies;

  if (UnifiedState) {
    UnifiedState.data.filterMode = mode;
  }
  if (MGA_saveJSON) {
    MGA_saveJSON('MGA_filterMode', mode);
  }

  // Update button states
  targetDocument.querySelectorAll('[id^="filter-mode-"]').forEach(btn => btn.classList.remove('active'));
  const modeId = mode === 'byPet' ? 'bypet' : mode;
  doc.getElementById(`filter-mode-${modeId}`)?.classList.add('active');

  // Update description
  const descriptions = {
    categories: '📂 Filter by ability categories',
    byPet: '🐾 Filter by pet species',
    custom: '⚙️ Filter by individual abilities'
  };
  const descEl = doc.getElementById('filter-mode-description');
  if (descEl) descEl.textContent = descriptions[mode] || '';

  // Show/hide appropriate filter sections
  const categoryFilters = doc.getElementById('category-filters');
  const petFilters = doc.getElementById('pet-filters');
  const customFilters = doc.getElementById('custom-filters');

  if (categoryFilters) categoryFilters.style.display = mode === 'categories' ? 'grid' : 'none';
  if (petFilters) petFilters.style.display = mode === 'byPet' ? 'block' : 'none';
  if (customFilters) customFilters.style.display = mode === 'custom' ? 'block' : 'none';

  // Populate content for the selected mode
  populateFilterModeContent(mode, dependencies);

  // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
  updateAllLogVisibility(dependencies);
}

/**
 * Populate filter content based on mode
 *
 * @param {string} mode - Filter mode
 * @param {object} dependencies - Injected dependencies
 */
export function populateFilterModeContent(mode, dependencies = {}) {
  if (mode === 'byPet') {
    populatePetSpeciesList(dependencies);
  } else if (mode === 'custom') {
    populateIndividualAbilities(dependencies);
  }
}

/**
 * Populate pet species list with checkboxes
 *
 * Generates checkbox list of all unique pets from logs.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Document} [dependencies.document] - Document reference
 */
export function populatePetSpeciesList(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    targetDocument = typeof document !== 'undefined' ? document : null,
    document: doc = typeof document !== 'undefined' ? document : null
  } = dependencies;

  const container = doc.getElementById('pet-species-list');
  if (!container) return;

  const pets = getAllUniquePets(dependencies);
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
    checkbox.checked = UnifiedState?.data?.petFilters?.selectedPets?.[pet] || false;

    checkbox.addEventListener('change', e => {
      if (UnifiedState?.data?.petFilters?.selectedPets) {
        UnifiedState.data.petFilters.selectedPets[pet] = e.target.checked;
      }
      if (MGA_saveJSON) {
        MGA_saveJSON('MGA_petFilters', UnifiedState?.data?.petFilters);
      }
      // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
      updateAllLogVisibility(dependencies);
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
 * Populate individual abilities list with checkboxes
 *
 * Generates checkbox list of all unique abilities from logs.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Document} [dependencies.document] - Document reference
 */
export function populateIndividualAbilities(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    targetDocument = typeof document !== 'undefined' ? document : null,
    document: doc = typeof document !== 'undefined' ? document : null
  } = dependencies;

  const container = doc.getElementById('individual-abilities-list');
  if (!container) return;

  const abilities = getAllUniqueAbilities(dependencies);
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
    checkbox.checked = UnifiedState?.data?.customMode?.selectedAbilities?.[ability] || false;

    checkbox.addEventListener('change', e => {
      if (UnifiedState?.data?.customMode?.selectedAbilities) {
        UnifiedState.data.customMode.selectedAbilities[ability] = e.target.checked;
      }
      if (MGA_saveJSON) {
        MGA_saveJSON('MGA_customMode', UnifiedState?.data?.customMode);
      }
      // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
      updateAllLogVisibility(dependencies);
    });

    const span = targetDocument.createElement('span');
    span.className = 'mga-label';
    span.textContent = ` ${normalizeAbilityName(ability, dependencies)}`;

    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}

/**
 * Select all filters for current mode
 *
 * @param {string} mode - Filter mode
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Document} [dependencies.targetDocument] - Target document
 */
export function selectAllFilters(mode, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    targetDocument = typeof document !== 'undefined' ? document : null
  } = dependencies;

  if (mode === 'categories') {
    Object.keys(UnifiedState?.data?.abilityFilters || {}).forEach(key => {
      if (UnifiedState?.data?.abilityFilters) {
        UnifiedState.data.abilityFilters[key] = true;
      }
      const checkbox = targetDocument.querySelector(`[data-filter="${key}"]`);
      if (checkbox) checkbox.checked = true;
    });
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_abilityFilters', UnifiedState?.data?.abilityFilters);
    }
  } else if (mode === 'byPet') {
    const pets = getAllUniquePets(dependencies);
    pets.forEach(pet => {
      if (UnifiedState?.data?.petFilters?.selectedPets) {
        UnifiedState.data.petFilters.selectedPets[pet] = true;
      }
    });
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_petFilters', UnifiedState?.data?.petFilters);
    }
    populatePetSpeciesList(dependencies);
  } else if (mode === 'custom') {
    const abilities = getAllUniqueAbilities(dependencies);
    abilities.forEach(ability => {
      if (UnifiedState?.data?.customMode?.selectedAbilities) {
        UnifiedState.data.customMode.selectedAbilities[ability] = true;
      }
    });
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_customMode', UnifiedState?.data?.customMode);
    }
    populateIndividualAbilities(dependencies);
  }

  // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
  updateAllLogVisibility(dependencies);
}

/**
 * Deselect all filters for current mode
 *
 * @param {string} mode - Filter mode
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.MGA_saveJSON] - Save function
 * @param {Document} [dependencies.targetDocument] - Target document
 */
export function selectNoneFilters(mode, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    targetDocument = typeof document !== 'undefined' ? document : null
  } = dependencies;

  if (mode === 'categories') {
    Object.keys(UnifiedState?.data?.abilityFilters || {}).forEach(key => {
      if (UnifiedState?.data?.abilityFilters) {
        UnifiedState.data.abilityFilters[key] = false;
      }
      const checkbox = targetDocument.querySelector(`[data-filter="${key}"]`);
      if (checkbox) checkbox.checked = false;
    });
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_abilityFilters', UnifiedState?.data?.abilityFilters);
    }
  } else if (mode === 'byPet') {
    if (UnifiedState?.data?.petFilters) {
      UnifiedState.data.petFilters.selectedPets = {};
    }
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_petFilters', UnifiedState?.data?.petFilters);
    }
    populatePetSpeciesList(dependencies);
  } else if (mode === 'custom') {
    if (UnifiedState?.data?.customMode) {
      UnifiedState.data.customMode.selectedAbilities = {};
    }
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_customMode', UnifiedState?.data?.customMode);
    }
    populateIndividualAbilities(dependencies);
  }

  // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
  updateAllLogVisibility(dependencies);
}
