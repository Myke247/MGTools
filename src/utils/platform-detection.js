/**
 * Platform Detection Module
 * ==========================
 * Comprehensive platform and environment detection system.
 *
 * Systems included:
 * - Environment Detection - Detect game/Discord/standalone environments
 * - Platform Detection - Detect Discord/mobile/iframe/touch
 * - Layout Detection - Determine optimal UI layout
 * - Scale Factor Calculation - Responsive UI scaling
 *
 * @module utils/platform-detection
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/* ============================================================================
 * ENVIRONMENT DETECTION
 * ============================================================================ */

/**
 * Detect the current execution environment
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {Document} [dependencies.document] - Document object
 * @param {Function} [dependencies.productionLog] - Logger function
 * @returns {object} Environment information
 *
 * @example
 * const env = detectEnvironment({ targetWindow: window });
 */
export function detectEnvironment(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    productionLog = console.log
  } = dependencies;

  if (!targetWindow) {
    return { isGameEnvironment: false, isStandalone: true, gameReady: false };
  }

  const environment = {
    isGameEnvironment: false,
    isStandalone: false,
    isDiscordEmbed: false,
    gameReady: false,
    url: targetWindow.location.href,
    hasJotaiAtoms: !!((targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache)?.size > 0),
    hasMagicCircleConnection: !!(
      targetWindow.MagicCircle_RoomConnection && typeof targetWindow.MagicCircle_RoomConnection === 'object'
    ),
    domain: targetWindow.location.hostname,
    readyState: doc ? doc.readyState : 'unknown'
  };

  // DEBUG: Log environment details at start
  productionLog('🔍 [ENV-DEBUG] Detecting environment:', {
    domain: environment.domain,
    pathname: targetWindow.location.pathname,
    url: environment.url,
    hasAtoms: environment.hasJotaiAtoms,
    hasConnection: environment.hasMagicCircleConnection
  });

  // PRIORITY FIX: Check for game environment FIRST (before Discord check)
  // This ensures that when running inside game iframe in Discord, we detect game mode
  const gameHosts = ['magiccircle.gg', 'magicgarden.gg', 'starweaver.org', 'discordsays.com'];
  const isGameDomain = gameHosts.some(host => environment.domain.includes(host));
  const hasGamePath = targetWindow.location.pathname.includes('/r/');
  const isDiscordActivity = environment.domain.includes('discordsays.com');

  productionLog('🔍 [ENV-DEBUG] Game checks:', {
    isGameDomain,
    hasGamePath,
    isDiscordActivity,
    willEnterGameMode: isGameDomain && (hasGamePath || isDiscordActivity)
  });

  // Game environment: Regular game domains with /r/ path OR Discord Activities (no /r/ needed)
  if (isGameDomain && (hasGamePath || isDiscordActivity)) {
    // We're in the game environment (works in Discord iframes, standalone, and everywhere)
    const isInIframe = targetWindow.location !== targetWindow.parent.location;
    const isDiscordDesktopApp = targetWindow.DiscordNative !== undefined;

    productionLog('🎮 [ENV] Running in game environment:', environment.domain);
    if (isDiscordActivity) {
      productionLog('🎮 [DISCORD-ACTIVITY] Detected Discord Activity iframe!');
    }
    productionLog('🎮 [ENV] IsIframe:', isInIframe, '| DiscordNative:', isDiscordDesktopApp);
    environment.isGameEnvironment = true;
    environment.isStandalone = false;
    environment.gameReady =
      environment.hasJotaiAtoms && environment.hasMagicCircleConnection && doc && doc.readyState === 'complete';

    // Determine initialization strategy
    let initStrategy = 'unknown';
    if (environment.gameReady) {
      initStrategy = 'game-ready';
    } else {
      initStrategy = 'game-wait';
    }
    environment.initStrategy = initStrategy;

    return environment;
  }

  // Check if we're on Discord page (not in game iframe)
  const isDiscordDomain = environment.domain.includes('discord.com');
  if (isDiscordDomain) {
    environment.isDiscordEmbed = true;
    productionLog('🎮 [DISCORD] Running on Discord page - looking for game iframe...');

    // Try to find the game iframe
    if (doc) {
      const gameIframes = doc.querySelectorAll('iframe');
      let foundGameIframe = false;
      for (const iframe of gameIframes) {
        try {
          const iframeSrc = iframe.src || '';
          if (gameHosts.some(host => iframeSrc.includes(host))) {
            productionLog('✅ [DISCORD] Found game iframe:', iframeSrc);
            productionLog('💡 [DISCORD] Script should be running inside that iframe');
            foundGameIframe = true;
          }
        } catch (e) {
          // Cross-origin iframe, can't access
        }
      }

      if (foundGameIframe) {
        productionLog(
          '⚠️ [DISCORD] On Discord page - script will only run inside the game iframe, not on Discord page itself'
        );
      } else {
        productionLog('⚠️ [DISCORD] On Discord page but no game iframe found yet');
      }
    }

    // Skip initialization on Discord page - only run inside the iframe
    environment.isStandalone = false;
    environment.initStrategy = 'skip';
    return environment;
  }

  // Not a game domain or Discord - standalone mode
  environment.isGameEnvironment = false;
  environment.isStandalone = true;
  environment.gameReady = false;

  // Determine initialization strategy
  let initStrategy = 'unknown';
  if (environment.gameReady) {
    initStrategy = 'game-ready';
  } else if (environment.isGameEnvironment) {
    initStrategy = 'game-wait';
  } else {
    initStrategy = 'standalone';
  }

  environment.initStrategy = initStrategy;

  return environment;
}

/* ============================================================================
 * PLATFORM DETECTION
 * ============================================================================ */

/**
 * Create platform detection object
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @param {Navigator} [dependencies.navigator] - Navigator object
 * @returns {object} Platform detection API
 *
 * @example
 * const platform = createPlatformDetection({ targetWindow: window });
 */
export function createPlatformDetection(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null
  } = dependencies;

  if (!targetWindow || !nav) {
    return {
      isDiscord: false,
      isMobile: false,
      isIframe: false,
      isTouch: false,
      getLayout: () => 'desktop',
      getScaleFactor: () => 1.0,
      getSafeArea: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
    };
  }

  const MGA_Platform = {
    // Platform detection
    isDiscord:
      /discord|overlay|electron/i.test(nav.userAgent) || !!(targetWindow.DiscordNative || targetWindow.__discordApp),

    isMobile:
      /Mobile|Android|iPhone|iPad|iPod/i.test(nav.userAgent) || targetWindow.matchMedia?.('(max-width: 768px)').matches,

    isIframe: targetWindow !== targetWindow.top,

    isTouch: 'ontouchstart' in targetWindow || nav.maxTouchPoints > 0,

    /**
     * Get current layout mode
     *
     * @returns {string} Layout mode ('mobile' | 'discord' | 'desktop')
     *
     * @example
     * const layout = MGA_Platform.getLayout();
     */
    getLayout() {
      if (this.isMobile) return 'mobile';
      if (this.isDiscord) return 'discord';
      return 'desktop';
    },

    /**
     * Get UI scale factor based on platform
     *
     * @returns {number} Scale factor (0.85 - 1.0)
     *
     * @example
     * const scale = MGA_Platform.getScaleFactor();
     */
    getScaleFactor() {
      if (this.isMobile) return 0.85; // Smaller UI for mobile
      if (this.isDiscord) return 0.95; // Slightly smaller for Discord
      return 1.0; // Full size for desktop
    },

    /**
     * Get safe area insets for mobile devices
     *
     * @returns {object} Safe area insets
     *
     * @example
     * const safeArea = MGA_Platform.getSafeArea();
     */
    getSafeArea() {
      if (!this.isMobile) {
        return { top: 0, bottom: 0, left: 0, right: 0 };
      }

      // Try to get safe area from CSS env variables
      const computedStyle = targetWindow.getComputedStyle?.(targetWindow.document.documentElement);
      if (computedStyle) {
        return {
          top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
          bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
          left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
          right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0')
        };
      }

      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
  };

  return MGA_Platform;
}

/* ============================================================================
 * BROWSER & USER AGENT UTILITIES
 * ============================================================================ */

/**
 * Get browser information
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Navigator} [dependencies.navigator] - Navigator object
 * @returns {object} Browser information
 *
 * @example
 * const browser = getBrowserInfo({ navigator });
 */
export function getBrowserInfo(dependencies = {}) {
  const { navigator: nav = typeof navigator !== 'undefined' ? navigator : null } = dependencies;

  if (!nav) {
    return { name: 'unknown', version: 'unknown', userAgent: '' };
  }

  const userAgent = nav.userAgent;
  let browserName = 'unknown';
  let browserVersion = 'unknown';

  // Detect browser
  if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'unknown';
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent: userAgent
  };
}

/**
 * Check if browser supports specific features
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} [dependencies.targetWindow] - Target window object
 * @returns {object} Feature support flags
 *
 * @example
 * const features = checkBrowserFeatures({ targetWindow: window });
 */
export function checkBrowserFeatures(dependencies = {}) {
  const { targetWindow = typeof window !== 'undefined' ? window : null } = dependencies;

  if (!targetWindow) {
    return {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      webWorkers: false,
      serviceWorkers: false,
      webSockets: false
    };
  }

  return {
    localStorage: typeof targetWindow.localStorage !== 'undefined',
    sessionStorage: typeof targetWindow.sessionStorage !== 'undefined',
    indexedDB: typeof targetWindow.indexedDB !== 'undefined',
    webWorkers: typeof targetWindow.Worker !== 'undefined',
    serviceWorkers: 'serviceWorker' in targetWindow.navigator,
    webSockets: typeof targetWindow.WebSocket !== 'undefined'
  };
}

/* ============================================================================
 * EXPORTS
 * ============================================================================ */

export const PlatformDetection = {
  detectEnvironment,
  createPlatformDetection,
  getBrowserInfo,
  checkBrowserFeatures
};
