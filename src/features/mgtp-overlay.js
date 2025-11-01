/**
 * MGTP Overlay Module
 * =====================================================================================
 * Advanced runtime features for Magic Garden Tools Platform
 *
 * @module features/mgtp-overlay
 *
 * Features:
 * - Slot/Estimate Overlay - Shadow DOM overlay showing crop estimates
 * - Ability Logs Proxy - Deduplication and sticky clear system
 * - Room Info System - Player count fetching with smart polling
 * - Enhanced WebSocket Auto-Reconnect - Platform-aware reconnection
 * - DOM Update Detection - Auto-handles game update popups
 * - Ability Logs Hard Clear - Tombstone persistence system
 *
 * Dependencies:
 * - window.UnifiedState (global)
 * - window.RoomRegistry (global)
 * - GM_setValue, GM_getValue, GM_xmlhttpRequest (optional, Tampermonkey)
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/**
 * Initialize MGTP Overlay system
 *
 * Installs slot overlay, ability log proxies, room polling, WebSocket
 * reconnection, and update detection systems.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Window} [dependencies.unsafeWindow] - Userscript unsafe window
 * @param {object} [dependencies.CompatibilityMode] - Compatibility mode system
 * @param {Function} [dependencies.logInfo] - Info logging function
 * @param {Function} [dependencies.logWarn] - Warning logging function
 * @param {Function} [dependencies.logDebug] - Debug logging function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.productionWarn] - Production warning function
 * @param {Function} [dependencies.productionError] - Production error function
 * @param {Function} [dependencies.GM_setValue] - Tampermonkey GM_setValue
 * @param {Function} [dependencies.GM_getValue] - Tampermonkey GM_getValue
 * @param {Function} [dependencies.GM_xmlhttpRequest] - Tampermonkey GM_xmlhttpRequest
 * @returns {void}
 *
 * @example
 * import { initializeMGTPOverlay } from './features/mgtp-overlay.js';
 * initializeMGTPOverlay({ targetDocument: document, targetWindow: window });
 */
export function initializeMGTPOverlay(dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    targetWindow = typeof window !== 'undefined' ? window : null,
    unsafeWindow: unsafeWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : null,
    CompatibilityMode,
    logInfo = console.log,
    logWarn = console.warn,
    logDebug = console.log,
    productionLog = console.log,
    productionWarn = console.warn,
    productionError = console.error,
    GM_setValue: gmSetValue = typeof GM_setValue !== 'undefined' ? GM_setValue : null,
    GM_getValue: gmGetValue = typeof GM_getValue !== 'undefined' ? GM_getValue : null,
    GM_xmlhttpRequest: gmXhr = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : null
  } = dependencies;

  if (!targetDocument || !targetWindow) {
    productionWarn('[MGTP] Cannot initialize - missing document or window');
    return;
  }

  const d = targetDocument;

  // ---------- Slot/Estimate Overlay ----------
  const rootHost = d.createElement('div');
  rootHost.id = 'mgtp-overlay-root';
  rootHost.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none;';
  const shadow = rootHost.attachShadow({ mode: 'open' });
  const style = d.createElement('style');
  style.textContent = `
      .wrap{position:absolute;transform:translate(-50%,-100%); background:transparent; pointer-events:none; font-family: system-ui, sans-serif;}
      .line{display:block; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,.6); font-weight:700; text-align:center;}
      .estimate{font-size:13px; color:#70ff70;}
      .slot{font-size:14px; color:#ffd24d;}
      .hidden{display:none;}
    `;
  const wrap = d.createElement('div');
  wrap.className = 'wrap hidden';
  const est = d.createElement('div');
  est.className = 'line estimate';
  const slot = d.createElement('div');
  slot.className = 'line slot';
  wrap.appendChild(est);
  wrap.appendChild(slot);
  shadow.appendChild(style);
  shadow.appendChild(wrap);
  d.documentElement.appendChild(rootHost);

  function placeAtRect(rect) {
    wrap.style.left = rect.left + rect.width / 2 + 'px';
    wrap.style.top = rect.top + 2 + 'px';
  }
  function visible(v) {
    wrap.classList.toggle('hidden', !v);
  }

  function bestAnchorFrom(el) {
    try {
      if (el && el.getBoundingClientRect) return el.getBoundingClientRect();
    } catch (e) {
      // Silent catch
    }
    // fallback: any visible tooltip-like container
    const cand = d.querySelectorAll(
      '[role="tooltip"], [data-popper-placement], .chakra-tooltip, .chakra-tooltip__popper'
    );
    let best = null,
      bestArea = -1;
    cand.forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        // avoid pet panel/sidebar
        if (e.closest('[data-panel="pet-stats"], .pet-panel, [data-sidebar]')) return;
        const area = r.width * r.height;
        if (area > bestArea) {
          bestArea = area;
          best = r;
        }
      }
    });
    if (best) return best;
    // viewport fallback
    return { left: innerWidth / 2 - 1, top: innerHeight / 2 - 1, width: 2, height: 2 };
  }

  targetWindow.MGTP_slotOverlay = {
    update({ estimateText, slotValueText, anchorElement } = {}) {
      const hasEst = !!(estimateText && String(estimateText).trim());
      const hasSlot = !!(slotValueText && String(slotValueText).trim());
      est.textContent = hasEst ? String(estimateText) : '';
      slot.textContent = hasSlot ? String(slotValueText) : '';
      if (!hasEst && !hasSlot) {
        visible(false);
        return;
      }
      const r = bestAnchorFrom(anchorElement);
      placeAtRect(r);
      visible(true);
    },
    hide() {
      visible(false);
    }
  };

  // ---------- Ability Logs: Sticky Clear + Proxy dedupe ----------
  const CLEAR_FLAG = 'MGA_logs_manually_cleared';
  const SESSION_FLAG = 'MGA_logs_clear_session';
  function clearFlagIfNeededOnAdd() {
    // BUGFIX v3.7.8: Clear BOTH flags when new logs are added
    if (localStorage.getItem(CLEAR_FLAG) === 'true') {
      try {
        localStorage.removeItem(CLEAR_FLAG);
      } catch (e) {
        // Silent catch
      }
    }
    if (localStorage.getItem(SESSION_FLAG)) {
      try {
        localStorage.removeItem(SESSION_FLAG);
      } catch (e) {
        // Silent catch
      }
    }
  }
  function wrapLogsArray(arr) {
    let arrLocal = arr;
    if (!Array.isArray(arrLocal)) arrLocal = [];
    const seen = new Set();
    const fp = l => {
      const t = (l && l.abilityType) || '',
        p = (l && l.petName) || '';
      const ts = String((l && l.timestamp) || 0);
      let h = 2166136261 >>> 0,
        s = t + '|' + p + '|' + ts;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(36);
    };
    const dedupePush = item => {
      const id = item.id || fp(item);
      if (seen.has(id)) return 0;
      seen.add(id);
      arrLocal.push({ ...item, id });
      return 1;
    };
    // seed seen
    for (const it of arrLocal) {
      seen.add(it.id || fp(it));
    }
    return new Proxy(arrLocal, {
      get(target, prop, recv) {
        if (['push', 'unshift', 'splice', 'concat'].includes(prop)) {
          return function (...args) {
            let added = 0;
            if (prop === 'push' || prop === 'unshift') {
              for (const it of args) {
                added += dedupePush(it);
              }
              if (added > 0) clearFlagIfNeededOnAdd();
              return target.length;
            }
            if (prop === 'splice') {
              // if items provided after start/deleteCount, dedupe them
              if (args.length > 2) {
                const start = args[0] >>> 0,
                  del = args[1] >>> 0,
                  newItems = args.slice(2);
                const before = target.slice(0, start);
                const after = target.slice(start + del);
                const rebuilt = wrapLogsArray(before);
                for (const it of newItems) {
                  dedupePush.call({ arr: rebuilt }, it);
                }
                for (const it of after) {
                  dedupePush.call({ arr: rebuilt }, it);
                }
                while (target.length) target.pop();
                for (const it of rebuilt) target.push(it);
                clearFlagIfNeededOnAdd();
                return [];
              }
            }
            return Array.prototype[prop].apply(target, args);
          };
        }
        return Reflect.get(target, prop, recv);
      },
      set(target, key, val) {
        // direct index sets count as add
        if (!isNaN(key)) {
          const added = dedupePush(val);
          if (added > 0) clearFlagIfNeededOnAdd();
          return true;
        }
        return Reflect.set(target, key, val);
      }
    });
  }

  // Install proxy once UnifiedState is ready
  (function waitUnified() {
    const us = targetWindow.UnifiedState && targetWindow.UnifiedState.data;
    if (us) {
      if (!us.petAbilityLogs || !us.petAbilityLogs.__proxied) {
        us.petAbilityLogs = wrapLogsArray(us.petAbilityLogs || []);
        Object.defineProperty(us.petAbilityLogs, '__proxied', { value: true });
      }
      // Intercept clear button globally to ensure sticky clear + full purge
      d.addEventListener(
        'click',
        function (e) {
          const tgt = e.target;
          if (tgt && tgt.id === 'clear-ability-logs') {
            e.preventDefault();
            e.stopImmediatePropagation();
            try {
              us.petAbilityLogs.length = 0;
              if (gmSetValue) {
                gmSetValue('MGA_petAbilityLogs', JSON.stringify([]));
              }
              localStorage.setItem('MGA_petAbilityLogs', JSON.stringify([]));
              localStorage.setItem(CLEAR_FLAG, 'true'); // keep sticky until next new log
              const archKeys = ['MGA_petAbilityLogs_archive'];
              archKeys.forEach(k => {
                try {
                  if (gmSetValue) gmSetValue(k, JSON.stringify([]));
                } catch (err) {
                  // Silent catch
                }
                try {
                  localStorage.removeItem(k);
                } catch (err) {
                  // Silent catch
                }
              });
              if (targetWindow.updateAbilityLogDisplay) {
                try {
                  targetWindow.updateAbilityLogDisplay(targetDocument);
                } catch (err) {
                  // Silent catch
                }
              }
            } catch (err) {
              productionError('[MGTP] clear logs failed', err);
            }
          }
        },
        true
      );
      return;
    }
    setTimeout(waitUnified, 200);
  })();

  function rerenderRoomsUI() {
    try {
      // BUGFIX: Use getRoomStatusTabContent directly (not window.getRoomStatusTabContent) - same scope
      if (typeof getRoomStatusTabContent !== 'function') {
        return;
      }

      // Find any active rooms tab content areas (main or overlays)
      const candidates = targetDocument.querySelectorAll('[data-tab="rooms"], .mga-tab-content, .mga-overlay-content');
      let updated = false;

      candidates.forEach((c, idx) => {
        // Check if this element contains or is a rooms UI
        const list = c.querySelector('#room-status-list');
        const isRoomsTab = c.getAttribute && c.getAttribute('data-tab') === 'rooms';

        if (list || isRoomsTab) {
          const html = getRoomStatusTabContent();
          c.innerHTML = html;
          if (typeof setupRoomJoinButtons === 'function') {
            setupRoomJoinButtons();
            setupRoomsTabButtons();
          }
          updated = true;
        }
      });
    } catch (e) {
      if (typeof logDebug === 'function') {
        logDebug('ROOMS-UI', '❌ Render error:', e);
      }
    }
  }

  // ---------- Rooms via /api/rooms/{code}/info with Fallbacks ----------
  (function roomsInfo() {
    // CRITICAL: Detect correct window scope (Tampermonkey uses unsafeWindow)
    // This IIFE is in separate scope from main script, so we need to detect which window has our data
    const isUserscript = typeof unsafeWin !== 'undefined' && unsafeWin !== null;
    const correctWindow = isUserscript ? unsafeWin : targetWindow;

    // Get correct API base URL (handles Discord browser context)
    const globalScope = correctWindow;
    const getApiBase = globalScope.getGameApiBaseUrl || (() => location.origin);
    const apiBase = getApiBase();
    const API_V1 = name => `${apiBase}/api/rooms/${encodeURIComponent(name)}/info`;
    const TRACKED = correctWindow.UnifiedState?.data?.customRooms ||
      correctWindow.TRACKED_ROOMS || ['MG1', 'MG2', 'MG3', 'MG4', 'MG5', 'MG6', 'MG7', 'MG8', 'MG9', 'MG10', 'SLAY'];
    let extra = new Set();
    const counts = {};

    // Build reverse lookup: Discord room ID -> display name
    // This allows us to store counts by name (e.g., 'PLAY1') instead of by ID
    const roomIdToName = {};

    // Parse player count from various API response formats
    function parsePlayerCount(data) {
      if (!data) return 0;

      // Try multiple field names
      const count =
        data?.numPlayers ??
        data?.players?.online ??
        data?.players?.count ??
        data?.online ??
        data?.count ??
        data?.playerCount ??
        0;

      return Math.max(0, Number(count) || 0);
    }

    // Fetch using standard fetch API
    async function fetchWithFetch(url, name) {
      const r = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!r.ok) {
        throw new Error(`HTTP ${r.status}`);
      }

      const data = await r.json();
      return data;
    }

    // Fallback: Fetch using GM_xmlhttpRequest (bypasses CORS)
    async function fetchWithGM(url, name) {
      return new Promise((resolve, reject) => {
        if (!gmXhr) {
          reject(new Error('GM_xmlhttpRequest not available'));
          return;
        }

        gmXhr({
          method: 'GET',
          url: url,
          headers: { Accept: 'application/json' },
          timeout: 10000,
          onload: response => {
            if (response.status >= 200 && response.status < 300) {
              try {
                const data = JSON.parse(response.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error(`Parse error: ${e.message}`));
              }
            } else {
              reject(new Error(`HTTP ${response.status}`));
            }
          },
          onerror: error => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Timeout'))
        });
      });
    }

    async function fetchOne(roomIdOrName) {
      const roomDebugMode = correctWindow.UnifiedState?.data?.settings?.roomDebugMode;
      const isDiscordRoom = roomIdOrName.includes('i-') && roomIdOrName.includes('-gc-');

      try {
        let data = null;

        // Try /api/rooms/{code}/info endpoint (works for both simple codes and Discord IDs)
        try {
          const url1 = API_V1(roomIdOrName);
          data = await fetchWithFetch(url1, roomIdOrName);
          if (roomDebugMode) {
            productionLog(`[ROOMS] ✅ Fetch succeeded for ${roomIdOrName}:`, data);
          }
        } catch (e1) {
          // Try GM_xmlhttpRequest fallback if fetch fails
          try {
            const url1 = API_V1(roomIdOrName);
            if (roomDebugMode) {
              productionLog(`[ROOMS] 🔄 Retrying ${roomIdOrName} with GM_xmlhttpRequest`);
            }
            data = await fetchWithGM(url1, roomIdOrName);
            if (roomDebugMode) {
              productionLog(`[ROOMS] ✅ GM fetch succeeded for ${roomIdOrName}:`, data);
            }
          } catch (e2) {
            // Log error if Room Debug Mode is enabled
            if (roomDebugMode) {
              productionWarn(`[ROOMS] ❌ Failed to fetch ${roomIdOrName}:`, e1.message);
            }
            throw new Error(`All methods failed for ${roomIdOrName}`);
          }
        }

        // Parse the count from whichever API succeeded
        const online = parsePlayerCount(data);

        // CRITICAL: For Discord rooms, store by DISPLAY NAME, not ID
        // This allows UI to find counts by looking up 'PLAY1' instead of long ID
        let storageKey;
        if (isDiscordRoom && roomIdToName[roomIdOrName]) {
          storageKey = roomIdToName[roomIdOrName].toUpperCase();
          if (roomDebugMode && online > 0) {
            productionLog(`[ROOMS] 📊 Discord room ${roomIdToName[roomIdOrName]}: ${online} players`);
          }
        } else {
          storageKey = roomIdOrName.toUpperCase();
          if (roomDebugMode && online > 0) {
            productionLog(`[ROOMS] 📊 ${roomIdOrName}: ${online} players`);
          }
        }

        counts[storageKey] = online;
      } catch (e) {
        // Store failure as 0, using same key logic
        let storageKey;
        if (isDiscordRoom && roomIdToName[roomIdOrName]) {
          storageKey = roomIdToName[roomIdOrName].toUpperCase();
        } else {
          storageKey = roomIdOrName.toUpperCase();
        }
        counts[storageKey] = 0;

        // Log failures only in debug mode
        if (roomDebugMode) {
          productionWarn(
            `[ROOMS] ⚠️ ${isDiscordRoom ? 'Discord room' : 'Room'} ${roomIdOrName.substring(0, 30)}... failed:`,
            e.message
          );
        }
      }
    }

    // Track last poll time when UI was hidden (for reduced frequency)
    let lastTickWhenHidden = 0;

    // Cache room UI visibility check
    let cachedRoomsUIVisible = null;
    let lastUICheckTime = 0;

    async function tick() {
      const roomDebugMode = correctWindow.UnifiedState?.data?.settings?.roomDebugMode;

      // SMART POLLING: Reduce frequency when Rooms UI is closed (not skip entirely)
      // Cache the UI check - only re-query every 5 seconds
      const now = Date.now();
      if (!cachedRoomsUIVisible || now - lastUICheckTime > 5000) {
        cachedRoomsUIVisible =
          targetDocument.querySelector('.mga-sidebar[data-visible="true"] [data-tab="rooms"]') ||
          targetDocument.querySelector('#room-status-list') ||
          targetDocument.querySelector('[data-mga-popout="rooms"]');
        lastUICheckTime = now;
      }
      const roomsUIVisible = cachedRoomsUIVisible;

      // If UI not visible, only poll every 30 seconds instead of every 5 seconds
      if (!roomsUIVisible) {
        const now = Date.now();
        // Skip this tick if we polled less than 30 seconds ago while hidden
        if (lastTickWhenHidden > 0 && now - lastTickWhenHidden < 30000) {
          if (roomDebugMode) {
            const secondsSinceLastPoll = Math.floor((now - lastTickWhenHidden) / 1000);
            productionLog(`[ROOMS] ⏸️ Skipping tick - UI hidden (last poll ${secondsSinceLastPoll}s ago)`);
          }
          return;
        }
        lastTickWhenHidden = now;
        if (roomDebugMode) {
          productionLog('[ROOMS] 🔄 Polling while UI hidden (30s interval)');
        }
      } else {
        // Reset hidden timer when UI is visible
        lastTickWhenHidden = 0;
      }

      // Include Discord rooms from RoomRegistry for play1-play50 and country rooms
      const discordRoomIds =
        typeof correctWindow.RoomRegistry !== 'undefined' && correctWindow.RoomRegistry?.discord
          ? correctWindow.RoomRegistry.discord.map(r => r.id)
          : [];

      // CRITICAL: Build roomId -> name lookup for Discord rooms
      // This allows us to store counts by display name (e.g., 'PLAY1') instead of long ID
      if (correctWindow.RoomRegistry?.discord && Object.keys(roomIdToName).length === 0) {
        correctWindow.RoomRegistry.discord.forEach(room => {
          roomIdToName[room.id] = room.name;
        });
        if (roomDebugMode) {
          productionLog('[ROOMS] 🗺️ Built Discord room lookup map:', Object.keys(roomIdToName).length, 'rooms');
        }
      }

      const names = [...TRACKED, ...extra, ...discordRoomIds];

      if (roomDebugMode) {
        productionLog(
          `[ROOMS] 🔄 Tick running: ${names.length} total rooms (${TRACKED.length} MG/Custom, ${discordRoomIds.length} Discord)`
        );
      }

      // PERFORMANCE OPTIMIZATION: Batch room requests to avoid network spam
      // Process 10 rooms at a time with 200ms delay between batches
      try {
        const BATCH_SIZE = 10;
        const BATCH_DELAY = 200; // ms between batches

        for (let i = 0; i < names.length; i += BATCH_SIZE) {
          const batch = names.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(fetchOne));

          // Add delay between batches (except for last batch)
          if (i + BATCH_SIZE < names.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        }

        // Show sample of Discord room counts if debug mode enabled
        if (roomDebugMode) {
          const discordKeys = Object.keys(counts).filter(k => k.startsWith('PLAY'));
          if (discordKeys.length > 0) {
            productionLog(
              '[ROOMS] 📝 Sample Discord room counts:',
              discordKeys
                .slice(0, 5)
                .map(k => `${k}:${counts[k]}`)
                .join(', ')
            );
          }
        }
      } catch (e) {
        productionError('[ROOMS] ❌ Tick error:', e);
      }

      // write into UnifiedState so UI updates
      if (typeof correctWindow.UnifiedState !== 'undefined' && correctWindow.UnifiedState?.data) {
        correctWindow.UnifiedState.data.roomStatus = correctWindow.UnifiedState.data.roomStatus || {};
        // CRITICAL: Directly replace counts to ensure fresh data
        correctWindow.UnifiedState.data.roomStatus.counts = { ...counts };

        // ADDED: Persist to storage
        if (typeof targetWindow.MGA_saveJSON === 'function') {
          targetWindow.MGA_saveJSON('MGA_roomStatus', correctWindow.UnifiedState.data.roomStatus);
        }

        if (roomDebugMode) {
          productionLog(`[ROOMS] ✅ Updated ${Object.keys(counts).length} room counts in UnifiedState`);
        }

        // refresh any open rooms views
        if (typeof targetWindow.refreshSeparateWindowPopouts === 'function') {
          try {
            targetWindow.refreshSeparateWindowPopouts('rooms');
          } catch (err) {
            // Silent catch
          }
        }
        try {
          rerenderRoomsUI();
          // Force update room counts in any visible room UI
          targetDocument.querySelectorAll('.mga-tab-item[data-tab="rooms"]').forEach(tab => tab.click());
        } catch (err) {
          // Silent catch
        }
        // Inline rooms lists
        const list = targetDocument.getElementById('room-status-list');
        if (list) {
          // trigger the existing re-render path if available
          if (typeof targetWindow.updateRoomStatusUI === 'function') {
            targetWindow.updateRoomStatusUI();
          } else {
            // minimal DOM update: replace counts in .room-count els
            list.querySelectorAll('.room-row').forEach(row => {
              const code = (row.getAttribute('data-room') || '').toUpperCase();
              const span = row.querySelector('.room-count');
              if (span && code) {
                span.textContent = String(counts[code] ?? targetWindow.UnifiedState.data.roomStatus.counts[code] ?? 0);
              }
            });
          }
        }
      }
    }
    // PERFORMANCE OPTIMIZATION: Watch specific container instead of entire document
    // This reduces mutation callback frequency by 90%+
    const obs = new MutationObserver(() => {
      const inp = targetDocument.getElementById('room-search-input');
      if (inp && !inp.__mgtpBound) {
        inp.__mgtpBound = true;
        inp.addEventListener('input', () => {
          const q = (inp.value || '').trim().toUpperCase();
          extra = new Set(
            q
              ? q
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
              : []
          );
        });
      }
    });

    // Watch only the sidebar container instead of entire document
    // Falls back to document if sidebar not found yet
    const observeRoomSearch = () => {
      const sidebar = targetDocument.getElementById('mgh-sidebar') || targetDocument.querySelector('.mga-sidebar');
      const targetElement = sidebar || targetDocument.documentElement;

      obs.observe(targetElement, {
        subtree: true,
        childList: true,
        // OPTIMIZATION: Only watch childList changes, ignore attributes/characterData
        attributes: false,
        characterData: false
      });

      if (!sidebar) {
        // If sidebar not ready yet, retry in 1 second
        setTimeout(() => {
          obs.disconnect();
          observeRoomSearch();
        }, 1000);
      }
    };

    observeRoomSearch();

    // Wait for UnifiedState and RoomRegistry to be ready before starting polling
    function startPollingWhenReady() {
      const hasUnifiedState = typeof correctWindow.UnifiedState !== 'undefined' && correctWindow.UnifiedState?.data;
      const hasRoomRegistry = typeof correctWindow.RoomRegistry !== 'undefined' && correctWindow.RoomRegistry?.discord;

      if (hasUnifiedState && hasRoomRegistry) {
        // PERFORMANCE OPTIMIZATION: Increased interval from 5s to 10s
        // Room counts don't change that rapidly, 10s is still responsive
        setTimeout(tick, 1000); // First tick after 1 second
        setInterval(tick, 10000); // Then every 10 seconds (was 5s)
      } else {
        setTimeout(startPollingWhenReady, 500);
      }
    }

    startPollingWhenReady();

    // Expose diagnostic function for testing
    // Usage: testDiscordRoomFetch() or testDiscordRoomFetch('room-id')
    correctWindow.testDiscordRoomFetch = async function (roomId) {
      const testId = roomId || 'i-1425232387037462538-gc-1399110335469977781-1411124424676999308';
      const url = `${apiBase}/api/rooms/${encodeURIComponent(testId)}/info`;

      productionLog('[ROOMS TEST] Testing:', testId.substring(0, 40) + '...');
      productionLog('[ROOMS TEST] URL:', url);

      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          const text = await response.text();
          productionError('[ROOMS TEST] ❌ HTTP', response.status, '-', text);
          return;
        }

        const data = await response.json();
        productionLog('[ROOMS TEST] ✅ Success! Players:', data.numPlayers ?? 'NOT FOUND', '| Full data:', data);
      } catch (e) {
        productionError('[ROOMS TEST] ❌ Fetch failed:', e);
      }
    };
  })();

  // ==================== ENHANCED WEBSOCKET AUTO-RECONNECT SYSTEM ====================
  (function enhancedSocketReconnect() {
    const Native = targetWindow.WebSocket;
    if (!Native || Native.__mgtoolsPatched) return; // Prevent double-patching

    let attempts = 0;
    const MAX_ATTEMPTS = 6;
    let reconnectTimer = null;
    let userNotified = false;

    // Platform detection for context-aware reconnection
    const isDiscord =
      /discord|overlay|electron/i.test(navigator.userAgent) ||
      !!(targetWindow.DiscordNative || targetWindow.__discordApp);
    const isIframe = targetWindow !== targetWindow.top;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // ==================== DOCUMENT.HIDDEN OVERRIDE FOR COMPAT MODE ====================
    // The game checks document.hidden and refuses to reconnect when hidden
    // In compat mode (Discord/managed devices), we override this to always return false
    if (CompatibilityMode && CompatibilityMode.flags && CompatibilityMode.flags.wsReconnectWhenHidden) {
      try {
        const originalDescriptor =
          Object.getOwnPropertyDescriptor(Document.prototype, 'hidden') ||
          Object.getOwnPropertyDescriptor(targetDocument, 'hidden');

        if (originalDescriptor && originalDescriptor.get) {
          Object.defineProperty(targetDocument, 'hidden', {
            get: function () {
              // Always return false in compat mode to allow reconnection
              return false;
            },
            configurable: true
          });

          logInfo('COMPAT-WS', 'Overrode document.hidden to enable reconnection in hidden state');
        }

        // Also patch visibilityState
        const originalVisibilityDescriptor =
          Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState') ||
          Object.getOwnPropertyDescriptor(targetDocument, 'visibilityState');

        if (originalVisibilityDescriptor && originalVisibilityDescriptor.get) {
          Object.defineProperty(targetDocument, 'visibilityState', {
            get: function () {
              // Always return 'visible' in compat mode
              return 'visible';
            },
            configurable: true
          });
        }
      } catch (e) {
        logWarn('COMPAT-WS', 'Failed to override document.hidden', e);
      }
    }

    // Add CSS animations
    const style = targetDocument.createElement('style');
    style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
    targetDocument.head.appendChild(style);

    // User feedback: Visual toast notification
    function showReconnectToast(attemptNum, maxAttempts, nextWait) {
      let toast = targetDocument.getElementById('mga-reconnect-toast');

      const toastHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px;">🔄</div>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Connection Lost</div>
                        <div style="font-size: 12px; opacity: 0.9;">
                            Reconnecting... (${attemptNum}/${maxAttempts})
                            <br>Next attempt in ${Math.round(nextWait / 1000)}s
                        </div>
                    </div>
                </div>
            `;

      if (!toast) {
        toast = targetDocument.createElement('div');
        toast.id = 'mga-reconnect-toast';
        toast.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 2147483647;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
                    color: white; padding: 16px 24px; border-radius: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    font-size: 14px; font-weight: 500; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    animation: slideInRight 0.3s ease-out; max-width: 320px; pointer-events: auto;
                `;
        targetDocument.body.appendChild(toast);
      }

      toast.innerHTML = toastHTML;
      userNotified = true;

      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.style.animation = 'slideOutRight 0.3s ease-out';
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
    }

    // Show max attempts failure with manual reload button
    function showFailureToast() {
      const failToast = targetDocument.createElement('div');
      failToast.id = 'mga-reconnect-fail-toast';
      failToast.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 2147483647;
                background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95));
                color: white; padding: 16px 24px; border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); max-width: 320px;
            `;

      failToast.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px;">⚠️ Connection Failed</div>
                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px;">
                    Unable to reconnect after ${MAX_ATTEMPTS} attempts
                </div>
                <button onclick="location.reload()" style="
                    background: white; color: #dc2626; border: none; padding: 8px 16px;
                    border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; font-size: 13px;
                ">Reload Page</button>
            `;

      targetDocument.body.appendChild(failToast);
    }

    // Schedule reconnect with exponential backoff
    function scheduleReload(code, wasClean, reason) {
      // Handle version expired (4710) immediately - auto-refresh with notification
      if (code === 4710 || /version.?expired/i.test(reason || '')) {
        productionLog('[WebSocket] Version expired detected (code 4710) - auto-refreshing in 5 seconds');

        // Show friendly update notification with countdown
        let countdown = 5;
        const updateToast = targetDocument.createElement('div');
        updateToast.id = 'mga-update-toast';
        updateToast.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 2147483647;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
                    color: white; padding: 16px 24px; border-radius: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    font-size: 14px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    animation: slideInRight 0.3s ease-out; max-width: 320px;
                `;

        updateToast.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 24px;">🎮</div>
                        <div>
                            <div style="font-weight: 600; margin-bottom: 4px;">Game Update Available</div>
                            <div style="font-size: 12px; opacity: 0.9;">
                                Refreshing in <span id="mga-countdown">${countdown}</span>s...
                            </div>
                        </div>
                    </div>
                `;

        targetDocument.body.appendChild(updateToast);

        // Update countdown every second
        const countdownInterval = setInterval(() => {
          countdown--;
          const countdownEl = targetDocument.getElementById('mga-countdown');
          if (countdownEl) {
            countdownEl.textContent = countdown;
          }
          if (countdown <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);

        // Auto-refresh after 5 seconds
        setTimeout(() => {
          productionLog('[WebSocket] Auto-refreshing for game update...');
          targetWindow.location.reload();
        }, 5000);

        return;
      }

      // Only reconnect for 1006 (abnormal) or if reason mentions update
      if (wasClean && code !== 1006 && !/update/i.test(reason || '')) {
        productionLog('[WebSocket] Clean close detected - no reconnect needed');
        return;
      }

      // Clear any existing timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Check if max attempts exceeded
      if (attempts >= MAX_ATTEMPTS) {
        productionWarn(`[WebSocket] Max reconnect attempts (${MAX_ATTEMPTS}) reached - manual refresh required`);
        showFailureToast();
        return;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 15s, 15s
      const wait = Math.min(1000 * Math.pow(2, attempts), 15000);
      attempts++;

      productionLog(
        `[WebSocket] Reconnect attempt ${attempts}/${MAX_ATTEMPTS} in ${wait}ms (code: ${code}, reason: "${reason || 'none'}")`
      );

      // Show user feedback
      showReconnectToast(attempts, MAX_ATTEMPTS, wait);

      reconnectTimer = setTimeout(() => {
        try {
          // Add timestamp to force reload and bypass cache
          const u = new URL(location.href);
          u.searchParams.set('_mgtp', Date.now().toString());

          // Platform-specific reload strategy
          if (isDiscord && isIframe) {
            // Discord iframe: try parent reload first
            try {
              targetWindow.parent.location.reload();
            } catch (e) {
              // Fallback to self reload if parent is inaccessible
              location.replace(u.toString());
            }
          } else if (isMobile) {
            // Mobile: hard reload to clear any cached state
            location.href = u.toString();
          } else {
            // Desktop: use replace to avoid back button issues
            location.replace(u.toString());
          }
        } catch (e) {
          productionError('[WebSocket] Reload failed:', e);
          // Last resort: simple reload
          location.href = location.href + '?_t=' + Date.now();
        }
      }, wait);
    }

    // Patch WebSocket constructor
    targetWindow.WebSocket = function (url, protocols) {
      const ws = new Native(url, protocols);

      // Reset attempts on successful connection
      ws.addEventListener('open', () => {
        productionLog('[WebSocket] Connection established successfully');
        attempts = 0;
        userNotified = false;

        // Remove any reconnect toasts
        const toast = targetDocument.getElementById('mga-reconnect-toast');
        if (toast) toast.remove();
      });

      // Handle close events
      ws.addEventListener('close', e => {
        productionLog(`[WebSocket] Closed - Code: ${e.code}, Clean: ${e.wasClean}, Reason: "${e.reason || 'none'}"`);
        scheduleReload(e.code, e.wasClean, e.reason);
      });

      // Handle errors
      ws.addEventListener('error', e => {
        productionError('[WebSocket] Error detected:', e);
      });

      return ws;
    };

    // Preserve prototype and static properties
    Object.setPrototypeOf(targetWindow.WebSocket, Native);
    targetWindow.WebSocket.prototype = Native.prototype;
    targetWindow.WebSocket.__mgtoolsPatched = true;

    // Network state listeners for smarter reconnection
    targetWindow.addEventListener('online', () => {
      productionLog('[Network] Back online - reducing reconnect attempt counter');
      attempts = Math.max(0, attempts - 2); // Give extra chances when network returns

      // If we have a toast, update it
      const toast = targetDocument.getElementById('mga-reconnect-toast');
      if (toast) toast.remove();
    });

    targetWindow.addEventListener('offline', () => {
      productionWarn('[Network] Offline detected - pausing reconnection attempts');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Update toast if visible
      const toast = targetDocument.getElementById('mga-reconnect-toast');
      if (toast) {
        toast.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 24px;">📡</div>
                        <div>
                            <div style="font-weight: 600; margin-bottom: 4px;">Network Offline</div>
                            <div style="font-size: 12px; opacity: 0.9;">
                                Reconnection paused<br>Waiting for network...
                            </div>
                        </div>
                    </div>
                `;
      }
    });

    productionLog('✅ [WebSocket] Enhanced auto-reconnect system initialized (max attempts: ' + MAX_ATTEMPTS + ')');
  })();

  // ==================== DOM UPDATE DETECTION (BACKUP METHOD) ====================
  // BUGFIX v3.7.8: Re-enabled with smarter detection to avoid false positives
  (function () {
    let updateDetected = false; // Shared flag to prevent duplicate refreshes

    function checkForGameUpdatePopup() {
      if (updateDetected) return false;

      // Look for Chakra UI alert dialog (game's update modal)
      const popup = targetDocument.querySelector('section.chakra-modal__content[role="alertdialog"]');
      if (!popup) return false;

      // Ensure it's not an MGTools element
      if (popup.closest('.mga-overlay, .mgh-sidebar, .mgh-dock, .mga-popout')) {
        return false;
      }

      // Check for game update text in header
      const header = popup.querySelector('header.chakra-modal__header');
      if (header && /game update available/i.test(header.textContent)) {
        updateDetected = true;
        productionLog('[DOM] Game update popup detected - attempting auto-click CONTINUE button');

        // Find and click the CONTINUE button before reloading
        const continueBtn = popup.querySelector('button');
        if (continueBtn && /continue/i.test(continueBtn.textContent)) {
          productionLog('[DOM] Clicking CONTINUE button...');
          continueBtn.click();

          // Small delay to let the click process, then trigger reload
          setTimeout(() => {
            productionLog('[DOM] CONTINUE clicked - triggering refresh');
            // Trigger reload directly
            targetWindow.location.reload();
          }, 500);
        } else {
          // Fallback: if button not found, proceed with immediate reload
          productionLog('[DOM] CONTINUE button not found - proceeding with immediate refresh');
          targetWindow.location.reload();
        }
        return true;
      }

      return false;
    }

    // MutationObserver to watch for popup appearance
    const observer = new MutationObserver(() => {
      if (!updateDetected) {
        checkForGameUpdatePopup();
      }
    });

    observer.observe(targetDocument.body, { childList: true, subtree: true });

    // Periodic check as backup (every 10 seconds - performance optimized)
    setInterval(checkForGameUpdatePopup, 10000);

    productionLog('✅ [DOM] Game update popup monitor initialized');
  })();

  // ==================== ABILITY LOGS HARD CLEAR SYSTEM ====================
  const LOG_MAIN = 'MGA_petAbilityLogs';
  const LOG_ARCH = 'MGA_petAbilityLogs_archive';
  const FLAG = 'MGA_logs_manually_cleared';

  function gmGet(k, d = null) {
    try {
      const raw = gmGetValue ? gmGetValue(k, null) : null;
      if (raw == null) return d;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return d;
    }
  }
  function gmSet(k, v) {
    try {
      if (gmSetValue) gmSetValue(k, JSON.stringify(v));
    } catch (e) {
      // Silent catch
    }
  }

  // Enforce tombstone on read paths (localStorage + GM)
  try {
    const _get = Storage.prototype.getItem;
    if (!_get.__mgtoolsPatched) {
      Storage.prototype.getItem = function (k) {
        if ((k === LOG_MAIN || k === LOG_ARCH) && localStorage.getItem(FLAG) === 'true') return '[]';
        return _get.apply(this, arguments);
      };
      Storage.prototype.getItem.__mgtoolsPatched = true;
    }
  } catch (e) {
    // Silent catch
  }

  try {
    if (gmGetValue && !gmGetValue.__mgtoolsPatched) {
      const _gm = gmGetValue;
      targetWindow.GM_getValue = function (k, d) {
        if ((k === LOG_MAIN || k === LOG_ARCH) && localStorage.getItem(FLAG) === 'true') return '[]';
        return _gm.apply(this, arguments);
      };
      targetWindow.GM_getValue.__mgtoolsPatched = true;
    }
  } catch (e) {
    // Silent catch
  }

  try {
    if (gmSetValue && !gmSetValue.__mgtoolsPatched) {
      const _gm = gmSetValue;
      targetWindow.GM_setValue = function (k, v) {
        if (k === LOG_MAIN) {
          try {
            const arr = Array.isArray(v) ? v : typeof v === 'string' ? JSON.parse(v) : [];
            if (arr && arr.length) localStorage.removeItem(FLAG);
          } catch (err) {
            // Silent catch
          }
        }
        return _gm.apply(this, arguments);
      };
      targetWindow.GM_setValue.__mgtoolsPatched = true;
    }
  } catch (e) {
    // Silent catch
  }

  function hardClear() {
    try {
      localStorage.setItem(FLAG, 'true');
      gmSet(LOG_MAIN, []);
      gmSet(LOG_ARCH, []);
      try {
        localStorage.removeItem(LOG_MAIN);
        localStorage.removeItem(LOG_ARCH);
      } catch (e) {
        // Silent catch
      }
      if (targetWindow.UnifiedState?.data) targetWindow.UnifiedState.data.petAbilityLogs = [];
      if (Array.isArray(targetWindow.petAbilityLogs)) targetWindow.petAbilityLogs.length = 0;
    } catch (e) {
      productionError('[MGTools] hardClear logs failed', e);
    }
  }
  targetWindow.MGTOOLS_hardClearAbilityLogs = hardClear;

  targetDocument.addEventListener(
    'click',
    ev => {
      const t =
        ev.target &&
        ev.target.closest(
          '#clear-ability-logs,[data-role="clear-ability-logs"],[data-action="clear-ability-logs"],[data-mga-clear-logs],#mga-clear-logs'
        );
      if (t) {
        hardClear();
      }
    },
    true
  );

  productionLog('✅ [MGTP] Overlay system initialized successfully');
}
