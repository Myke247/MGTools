/**
 * COMPATIBILITY MODULE
 * ====================================================================================
 * Browser compatibility, CSP handling, Discord workarounds, and context isolation
 *
 * @module core/compat
 *
 * This module provides:
 * - CSP Guard: Blocks Google Fonts in Discord/webview environments
 * - CompatibilityMode: Detects and handles restricted environments (Discord, CSP violations)
 * - Context Isolation: Provides correct window/document context for userscripts
 *
 * Dependencies: None (runs before other modules initialize)
 * Note: Uses console.* directly instead of logging module since this runs very early
 */

/* ====================================================================================
 * CSP GUARD - IMMEDIATE EXECUTION
 * ====================================================================================
 * Intercepts createElement to block external Google Fonts in Discord/restricted environments
 * This must run immediately on script load, before any other code executes.
 */

(function () {
  try {
    const isDiscord =
      /discord|overlay|electron/i.test(navigator.userAgent) || window.DiscordNative || window.__discordApp;
    if (isDiscord) {
      console.log('🛡️ [CSP] External font loads disabled in Discord context.');
    }
    const origCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function (tag) {
      const el = origCreateElement.call(this, tag);
      try {
        if (isDiscord && tag && tag.toLowerCase() === 'link') {
          const origSetAttribute = el.setAttribute;
          el.setAttribute = function (name, value) {
            if (name === 'href' && typeof value === 'string' && /fonts\.googleapis/i.test(value)) {
              console.log('🛡️ [CSP] Prevented external font link injection:', value);
              return;
            }
            return origSetAttribute.apply(this, arguments);
          };
        }
      } catch (_) {
        // Intentionally ignore setAttribute errors in restricted environments
      }
      return el;
    };
  } catch (_) {
    // Intentionally ignore createElement override errors
  }
})();

/* ====================================================================================
 * COMPATIBILITY MODE SYSTEM
 * ====================================================================================
 * Detects restricted environments (Discord, CSP violations) and adjusts behavior
 */

/**
 * Compatibility mode system for handling restricted environments
 * @namespace CompatibilityMode
 */
export const CompatibilityMode = {
  flags: {
    enabled: false,
    blockExternalFonts: false,
    blockExternalBeacons: false,
    wsReconnectWhenHidden: false,
    strictNoEvalDynamicImport: false,
    inlineAssetsOnly: false,
    uiReducedMode: false,
    domOnlyStyles: false,
    bypassCSPNetworking: false
  },

  detectionComplete: false,
  cspViolations: [],
  detectionReason: null,

  detect() {
    // Check for user override first
    try {
      const disabled = localStorage.getItem('mgtools_compat_disabled');
      if (disabled === 'true') {
        console.log('[COMPAT] Compatibility mode disabled by user');
        this.detectionComplete = true;
        return;
      }

      const forced = localStorage.getItem('mgtools_compat_forced');
      if (forced === 'true') {
        this.enableCompat('user-forced');
        this.detectionComplete = true;
        return;
      }
    } catch (e) {
      console.warn('[COMPAT] Unable to check localStorage for compat settings', e);
    }

    // 1. Discord embed detection (enhanced)
    const host = window.location.host;
    const isDiscordEmbed =
      host.includes('discordsays.com') ||
      host.includes('discordactivities.com') ||
      host.includes('discord.gg') ||
      host.includes('discord.com') ||
      // Check for Discord SDK presence
      typeof window.DiscordSDK !== 'undefined' ||
      typeof window.__DISCORD__ !== 'undefined' ||
      typeof window.DiscordNative !== 'undefined';

    if (isDiscordEmbed) {
      this.enableCompat('discord-embed');
      this.detectionComplete = true;
      return;
    }

    // 2. CSP violation listener (500ms window) with duplicate prevention
    const originalError = console.error.bind(console);
    const self = this;
    const seenCSPMessages = new Set();

    console.error = function (...args) {
      const msg = args.join(' ');

      // Check for CSP-related errors
      if (
        (msg.includes('Content Security Policy') ||
          msg.includes('Refused to load') ||
          msg.includes('violates the following')) &&
        !msg.includes('mgtools')
      ) {
        // Ignore our own CSP issues

        // Skip duplicate CSP violations to reduce console spam
        if (seenCSPMessages.has(msg)) {
          return; // Silently skip duplicate
        }
        seenCSPMessages.add(msg);

        self.cspViolations.push(msg);
        if (self.cspViolations.length >= 2 && !self.flags.enabled) {
          self.enableCompat('csp-violations');
        }
      }
      return originalError.apply(console, args);
    };

    // 3. Test storage availability
    setTimeout(() => {
      if (!this.flags.enabled) {
        try {
          const testKey = '__mgtools_compat_test_' + Date.now();
          GM_setValue(testKey, 'test');
          GM_deleteValue(testKey);
        } catch (e) {
          this.enableCompat('storage-failed');
        }
      }

      this.detectionComplete = true;
      if (this.flags.enabled) {
        console.log('[COMPAT] Compatibility mode ACTIVE', {
          reason: this.detectionReason,
          violations: this.cspViolations.length
        });
      } else {
        console.log('[COMPAT] Compatibility mode not needed, running in normal mode');
      }
    }, 500);
  },

  enableCompat(reason) {
    if (this.flags.enabled) return; // Already enabled

    console.log(`[COMPAT] Enabling compatibility mode: ${reason}`);

    // Discord Fix: Add detailed Discord-specific logging
    const isDiscordReason = reason.includes('discord') || reason.includes('csp');
    if (isDiscordReason) {
      console.log('🎮 [DISCORD] Compatibility mode activated for Discord environment');
      console.log('   📋 [DISCORD] Features enabled:');
      console.log('      • Inline styles only (no external CSS)');
      console.log('      • System fonts (no Google Fonts CDN)');
      console.log('      • GM_xmlhttpRequest for network requests');
      console.log('      • DOM mutation observer for UI persistence');
    }

    this.detectionReason = reason;
    this.flags.enabled = true;
    this.flags.blockExternalFonts = true;
    this.flags.blockExternalBeacons = true;
    this.flags.wsReconnectWhenHidden = true;
    this.flags.strictNoEvalDynamicImport = true;
    this.flags.inlineAssetsOnly = true;
    this.flags.uiReducedMode = true;
    this.flags.domOnlyStyles = true;
    this.flags.bypassCSPNetworking = true;

    // Save preference
    try {
      localStorage.setItem('mgtools_compat_mode', 'true');
      localStorage.setItem('mgtools_compat_reason', reason);
    } catch (e) {
      // Ignore localStorage errors in restricted environments
    }
  },

  disableCompat() {
    this.flags.enabled = false;
    Object.keys(this.flags).forEach(key => {
      if (key !== 'enabled') this.flags[key] = false;
    });

    try {
      localStorage.setItem('mgtools_compat_disabled', 'true');
      localStorage.removeItem('mgtools_compat_mode');
    } catch (e) {}

    console.log('[COMPAT] Compatibility mode disabled');
  },

  isEnabled() {
    return this.flags.enabled;
  }
};

// Initialize compatibility detection immediately on module load
CompatibilityMode.detect();

/* ====================================================================================
 * CONTEXT ISOLATION
 * ====================================================================================
 * Provides correct window/document context for userscript vs browser console environments
 */

/**
 * Detect if running in userscript environment (Tampermonkey/Greasemonkey)
 * @type {boolean}
 */
export const isUserscript = typeof unsafeWindow !== 'undefined';

/**
 * Correct window context - uses unsafeWindow for userscripts to access page context,
 * falls back to regular window for console paste or browser extension environments
 * @type {Window}
 */
export const targetWindow = isUserscript ? unsafeWindow : window;

/**
 * Correct document context - derived from targetWindow
 * @type {Document}
 */
export const targetDocument = targetWindow.document;

/* ====================================================================================
 * LEGACY COMPATIBILITY EXPORTS
 * ====================================================================================
 * These are used throughout the codebase for accessing the page context
 */

// Log context detection
console.log('[COMPAT] Context isolation initialized:', {
  isUserscript,
  targetWindowType: targetWindow.constructor.name,
  sameAsWindow: targetWindow === window
});

/* ====================================================================================
 * GLOBAL EXPORTS (for IIFE/window access)
 * ====================================================================================
 * In the bundled version, these will be assigned to window object for global access.
 * This will be handled by the main index.js entry point.
 *
 * The following will be available globally:
 * - window.CompatibilityMode
 * - window.isUserscript
 * - window.targetWindow
 * - window.targetDocument
 */
