/**
 * Early Initialization Traps
 *
 * Provides critical early-stage patches and traps that must execute before
 * the main game loads. These patches capture essential game data structures
 * and work around environment restrictions.
 *
 * Features:
 * - Early RoomConnection trap (captures scopePath for message sending)
 * - rcSend() utility for sending messages with correct scopePath
 * - CSP workaround for Discord/Electron environments (blocks external fonts)
 * - Diagnostic logging for troubleshooting initialization issues
 *
 * CRITICAL: This module is designed to execute IMMEDIATELY on script load,
 * before the game's MagicCircle_RoomConnection object is created.
 *
 * @module init/early-traps
 */

/**
 * Install early RoomConnection trap
 *
 * Captures the true scopePath from game messages by intercepting the
 * MagicCircle_RoomConnection object before the game initializes it.
 * This allows us to send properly formatted messages to the game server.
 *
 * Strategy:
 * - If RoomConnection already exists, patch it immediately
 * - Otherwise, create a property trap that patches it when created
 * - Hook into sendMessage() and dispatch() to capture scopePath
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.unsafeWindow] - Tampermonkey unsafeWindow
 * @param {Window} [dependencies.window] - Window object
 * @param {Console} [dependencies.console] - Console for logging
 * @param {object} [dependencies.Object] - Object constructor
 * @param {Function} [dependencies.Array] - Array constructor
 *
 * @example
 * installEarlyRoomConnectionTrap({ unsafeWindow, window, console });
 */
export function installEarlyRoomConnectionTrap(dependencies = {}) {
  /* eslint-disable no-use-before-define */
  const {
    unsafeWindow: unsafeWin, // Passed via dependencies - no default to avoid circular reference
    window: win = typeof window !== 'undefined' ? window : null,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {}, warn: () => {} },
    Object: ObjectClass = typeof Object !== 'undefined' ? Object : null,
    Array: ArrayClass = typeof Array !== 'undefined' ? Array : null
  } = dependencies;
  /* eslint-enable no-use-before-define */

  // Get unsafeWindow from global scope if not provided
  const unsafeWindow = unsafeWin || (typeof globalThis.unsafeWindow !== 'undefined' ? globalThis.unsafeWindow : null);

  const KEY = 'MagicCircle_RoomConnection';
  // CRITICAL: Use the ACTUAL page window, not sandbox
  const targetWin = unsafeWindow || win;

  if (!targetWin) {
    consoleFn.warn('[MGTools] No target window available for RoomConnection trap');
    return;
  }

  if (targetWin.__mg_rc_trap_installed) return;
  targetWin.__mg_rc_trap_installed = true;

  /**
   * Install hooks on RoomConnection instance
   * @param {object} rc - RoomConnection instance
   * @private
   */
  function installHooks(rc) {
    if (!rc || rc.__mg_scope_installed) return;
    rc.__mg_scope_installed = true;

    const setLast = sp => {
      if (ArrayClass.isArray(sp)) {
        targetWin.__mga_lastScopePath = sp.slice();
        // Debug only - uncomment if troubleshooting scopePath issues
        // consoleFn.log('[MGTools ScopePatch] captured scopePath', targetWin.__mga_lastScopePath);
      }
    };

    const origSend = rc.sendMessage?.bind(rc);
    if (origSend) {
      rc.sendMessage = function (msg) {
        try {
          setLast(msg?.scopePath);
        } catch (e) {
          // Silently ignore scopePath capture errors
        }
        return origSend(msg);
      };
    }

    const origDispatch = rc.dispatch?.bind(rc) || rc._dispatch?.bind(rc);
    if (origDispatch) {
      rc.dispatch = function (evt) {
        try {
          setLast(evt?.scopePath);
        } catch (e) {
          // Silently ignore scopePath capture errors
        }
        return origDispatch(evt);
      };
    }

    // Debug only - uncomment if troubleshooting scopePath issues
    // consoleFn.log('[MGTools ScopePatch] early RC trap installed');
  }

  // Check if RC already exists
  if (targetWin[KEY]) {
    try {
      installHooks(targetWin[KEY]);
    } catch (e) {
      consoleFn.warn('[MGTools ScopePatch] install now failed', e);
    }
    return;
  }

  // Set trap for future RC
  let _rc;
  ObjectClass.defineProperty(targetWin, KEY, {
    configurable: true,
    enumerable: true,
    get() {
      return _rc;
    },
    set(v) {
      _rc = v;
      try {
        installHooks(v);
      } catch (e) {
        consoleFn.warn('[MGTools ScopePatch] install on set failed', e);
      }
    }
  });
}

/**
 * Send message via RoomConnection with automatic scopePath
 *
 * Waits for scopePath to be captured by the early trap, then sends the
 * message with the correct scopePath attached. Includes retry logic and
 * fallback to known working scopePath structure.
 *
 * @param {object} payload - Message payload object
 * @param {object} options - Send options
 * @param {number} [options.retries=10] - Maximum retry attempts
 * @param {number} [options.delay=120] - Delay between retries (ms)
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.unsafeWindow] - Tampermonkey unsafeWindow
 * @param {Window} [dependencies.window] - Window object
 * @param {Console} [dependencies.console] - Console for logging
 * @param {Function} [dependencies.setTimeout] - setTimeout function
 * @param {Function} [dependencies.Promise] - Promise constructor
 * @param {Function} [dependencies.Array] - Array constructor
 * @returns {Promise<void>}
 *
 * @example
 * await rcSend({ type: 'harvest', slotId: 5 }, { retries: 10, delay: 120 });
 */
export async function rcSend(payload, options = {}, dependencies = {}) {
  /* eslint-disable no-use-before-define */
  const {
    unsafeWindow: unsafeWin, // Passed via dependencies - no default to avoid circular reference
    window: win = typeof window !== 'undefined' ? window : null,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: setTimeoutFn = typeof setTimeout !== 'undefined' ? setTimeout : null,
    Promise: PromiseClass = typeof Promise !== 'undefined' ? Promise : null,
    Array: ArrayClass = typeof Array !== 'undefined' ? Array : null
  } = dependencies;
  /* eslint-enable no-use-before-define */

  // Get unsafeWindow from global scope if not provided
  const unsafeWindow = unsafeWin || (typeof globalThis.unsafeWindow !== 'undefined' ? globalThis.unsafeWindow : null);

  const { retries = 10, delay = 120 } = options;
  const targetWin = unsafeWindow || win;

  if (!targetWin) {
    consoleFn.warn('[MGTools] No target window available for rcSend');
    return;
  }

  if (!payload || typeof payload !== 'object') {
    consoleFn.warn('[MGTools] rcSend invalid payload:', payload);
    return;
  }

  // Wait for scopePath to be captured
  for (let i = 0; i <= retries; i++) {
    const sp = targetWin.__mga_lastScopePath;
    if (ArrayClass.isArray(sp)) {
      payload.scopePath = sp.slice();
      break;
    }
    if (i === retries) {
      // FALLBACK: Use known working scopePath structure
      payload.scopePath = ['Room'];
      consoleFn.warn('[MGTools] Using fallback scopePath ["Room"]');
    }
    await new PromiseClass(r => setTimeoutFn(r, delay));
  }

  try {
    targetWin.MagicCircle_RoomConnection?.sendMessage(payload);
    // Debug only - uncomment if troubleshooting message sending
    // consoleFn.log('[MGTools] Sent with scopePath:', payload.scopePath);
  } catch (e) {
    consoleFn.error('[MGTools] rcSend error', e);
  }
}

/**
 * Install CSP guard for Discord/Electron environments
 *
 * Prevents external Google Fonts from loading in Discord/Electron environments
 * where CSP (Content Security Policy) blocks external resources. This avoids
 * console errors and failed network requests.
 *
 * Strategy:
 * - Override Document.prototype.createElement
 * - Intercept <link> element creation
 * - Block setAttribute for Google Fonts URLs
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.window] - Window object
 * @param {Document} [dependencies.document] - Document object
 * @param {Console} [dependencies.console] - Console for logging
 *
 * @example
 * installCSPGuard({ window, document, console });
 */
export function installCSPGuard(dependencies = {}) {
  const {
    window: win = typeof window !== 'undefined' ? window : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {} }
  } = dependencies;

  if (!doc || !win) {
    return;
  }

  try {
    const isDiscord =
      /discord|overlay|electron/i.test(win.navigator?.userAgent || '') ||
      win.DiscordNative ||
      win.__discordApp;

    if (isDiscord) {
      consoleFn.log('🛡️ [CSP] External font loads disabled in Discord context.');
    }

    const origCreateElement = doc.constructor.prototype.createElement;
    doc.constructor.prototype.createElement = function (tag) {
      const el = origCreateElement.call(this, tag);
      try {
        if (isDiscord && tag && tag.toLowerCase() === 'link') {
          const origSetAttribute = el.setAttribute;
          el.setAttribute = function (name, value) {
            if (name === 'href' && typeof value === 'string' && /fonts\.googleapis/i.test(value)) {
              consoleFn.log('🛡️ [CSP] Prevented external font link injection:', value);
              return;
            }
            return origSetAttribute.apply(this, arguments);
          };
        }
      } catch (e) {
        // Intentionally ignore setAttribute errors in restricted environments
      }
      return el;
    };
  } catch (e) {
    // Intentionally ignore createElement override errors
  }
}

/**
 * Log diagnostic information about script loading
 *
 * Outputs critical diagnostic information to help troubleshoot initialization
 * issues. This runs immediately when the script loads.
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Console} [dependencies.console] - Console for logging
 * @param {Window} [dependencies.window] - Window object
 * @param {object} [dependencies.Date] - Date constructor
 * @param {object} [dependencies.navigator] - Navigator object
 *
 * @example
 * logDiagnostics({ console, window, Date, navigator });
 */
export function logDiagnostics(dependencies = {}) {
  const {
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {}, error: () => {} },
    window: win = typeof window !== 'undefined' ? window : null,
    Date: DateClass = typeof Date !== 'undefined' ? Date : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null
  } = dependencies;

  consoleFn.error('🚨🚨🚨 MGTOOLS LOADING - IF YOU SEE THIS, SCRIPT IS RUNNING 🚨🚨🚨');
  consoleFn.log('[MGTOOLS-DEBUG] 1. Script file loaded');
  consoleFn.log('[MGTOOLS-DEBUG] ⚡ VERSION: 2.0.0 - Pet auto-favorite fixes + Micro/Mini dock sizes');
  consoleFn.log('[MGTOOLS-DEBUG] 🕐 Load Time:', new DateClass().toISOString());
  consoleFn.log('[MGTOOLS-DEBUG] 2. Location:', win?.location?.href || 'unknown');
  consoleFn.log('[MGTOOLS-DEBUG] 3. Navigator:', nav?.userAgent || 'unknown');
  consoleFn.log('[MGTOOLS-DEBUG] 4. Window type:', win === win?.top ? 'TOP' : 'IFRAME');
}

/**
 * Install all early traps and guards
 *
 * Convenience function that installs all early initialization traps:
 * - Diagnostic logging
 * - CSP guard
 * - Early RoomConnection trap
 *
 * @param {object} dependencies - Injected dependencies (see individual functions)
 *
 * @example
 * installAllEarlyTraps({ unsafeWindow, window, document, console });
 */
export function installAllEarlyTraps(dependencies = {}) {
  logDiagnostics(dependencies);
  installCSPGuard(dependencies);
  installEarlyRoomConnectionTrap(dependencies);
}
