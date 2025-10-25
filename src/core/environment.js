/**
 * Environment Detection Module
 * Detects execution environment, platform, and device capabilities for MGTools
 *
 * Features:
 * - Game environment detection (game domains, Discord activities)
 * - Platform detection (Discord, mobile, iframe, touch)
 * - Device capability detection (layout mode, scale factor)
 * - Responsive style application
 * - Platform-specific optimizations (fetch timeout, animation duration)
 *
 * @module Environment
 */

/**
 * Detect execution environment and game readiness state
 * Determines if running in game environment, Discord embed, or standalone mode
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window object (unsafeWindow or window)
 * @param {Document} dependencies.document - Document object
 * @param {Window} dependencies.window - Window object
 * @param {Function} dependencies.productionLog - Production logging function
 * @returns {object} Environment detection result with flags and initialization strategy
 */
export function detectEnvironment(dependencies = {}) {
  const {
    targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : typeof window !== 'undefined' ? window : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    productionLog = console.log.bind(console)
  } = dependencies;

  if (!targetWindow || !doc || !win) {
    return {
      isGameEnvironment: false,
      isStandalone: true,
      isDiscordEmbed: false,
      gameReady: false,
      url: '',
      hasJotaiAtoms: false,
      hasMagicCircleConnection: false,
      domain: '',
      readyState: 'loading',
      initStrategy: 'error'
    };
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
    readyState: doc.readyState
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
    const isInIframe = win.location !== win.parent.location;
    const isDiscordDesktopApp = win.DiscordNative !== undefined;

    productionLog('🎮 [ENV] Running in game environment:', environment.domain);
    if (isDiscordActivity) {
      productionLog('🎮 [DISCORD-ACTIVITY] Detected Discord Activity iframe!');
    }
    productionLog('🎮 [ENV] IsIframe:', isInIframe, '| DiscordNative:', isDiscordDesktopApp);
    environment.isGameEnvironment = true;
    environment.isStandalone = false;
    environment.gameReady =
      environment.hasJotaiAtoms && environment.hasMagicCircleConnection && doc.readyState === 'complete';

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

    // Try to find the game iframe (gameHosts already includes discordsays.com)
    const gameIframes = doc.querySelectorAll('iframe');
    let foundGameIframe = false;
    for (const iframe of gameIframes) {
      try {
        const iframeSrc = iframe.src || '';
        // gameHosts includes all game domains plus discordsays.com
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

/**
 * Create platform detection and configuration object
 * Detects platform type, device capabilities, and provides platform-specific utilities
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object
 * @param {Navigator} dependencies.navigator - Navigator object
 * @param {Document} dependencies.document - Document object
 * @param {Function} dependencies.productionLog - Production logging function
 * @returns {object} Platform detection object with methods and properties
 */
export function createPlatformDetection(dependencies = {}) {
  const {
    window: win = typeof window !== 'undefined' ? window : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    productionLog = console.log.bind(console)
  } = dependencies;

  if (!win || !nav || !doc) {
    // Return stub object if dependencies are missing
    return {
      isDiscord: false,
      isMobile: false,
      isIframe: false,
      isTouch: false,
      getLayout: () => 'desktop',
      getScaleFactor: () => 1.0,
      applyResponsiveStyles: () => {},
      getFetchTimeout: () => 5000,
      getAnimationDuration: () => 300
    };
  }

  const platform = {
    // Platform detection
    isDiscord: /discord|overlay|electron/i.test(nav.userAgent) || !!(win.DiscordNative || win.__discordApp),

    isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(nav.userAgent) || win.matchMedia?.('(max-width: 768px)').matches,

    isIframe: win !== win.top,

    isTouch: 'ontouchstart' in win || nav.maxTouchPoints > 0,

    // Get current layout mode
    getLayout() {
      if (this.isMobile) return 'mobile';
      if (this.isDiscord) return 'discord';
      return 'desktop';
    },

    // Get UI scale factor based on platform
    getScaleFactor() {
      if (this.isMobile) return 0.85; // Smaller UI for mobile
      if (this.isDiscord) return 0.95; // Slightly smaller for Discord
      return 1.0; // Full size for desktop
    },

    // Apply responsive styles based on platform
    applyResponsiveStyles() {
      const layout = this.getLayout();
      const scale = this.getScaleFactor();

      const root = doc.documentElement;
      root.style.setProperty('--mga-scale', scale.toString());
      root.style.setProperty('--mga-layout', layout);
      root.setAttribute('data-mga-platform', layout);

      productionLog(`[Platform] Detected: ${layout} (scale: ${scale}, touch: ${this.isTouch})`);
    },

    // Get optimized fetch timeout based on platform
    getFetchTimeout() {
      if (this.isMobile) return 8000; // Longer timeout for mobile networks
      if (this.isDiscord) return 6000; // Medium timeout for Discord
      return 5000; // Fast timeout for desktop
    },

    // Get UI animation duration based on platform
    getAnimationDuration() {
      if (this.isMobile) return 200; // Faster animations on mobile
      return 300; // Standard animations on desktop
    }
  };

  return platform;
}

/**
 * Initialize platform detection with responsive updates
 * Sets up platform detection, applies initial styles, and configures resize handler
 *
 * @param {object} platformObject - Platform detection object from createPlatformDetection()
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object
 * @param {Navigator} dependencies.navigator - Navigator object
 * @param {Function} dependencies.productionLog - Production logging function
 * @returns {void}
 */
export function initializePlatformDetection(platformObject, dependencies = {}) {
  const {
    window: win = typeof window !== 'undefined' ? window : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null,
    productionLog = console.log.bind(console)
  } = dependencies;

  if (!platformObject || !win || !nav) return;

  // Initialize platform detection
  platformObject.applyResponsiveStyles();

  // Re-apply on resize (debounced)
  let resizeTimer;
  win.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-check mobile status (window size may have changed)
      platformObject.isMobile =
        /Mobile|Android|iPhone|iPad|iPod/i.test(nav.userAgent) || win.matchMedia?.('(max-width: 768px)').matches;
      platformObject.applyResponsiveStyles();
    }, 250);
  });

  // Platform-specific initialization
  if (platformObject.isDiscord) {
    productionLog('[Platform] Discord mode: External resources restricted, using bundled assets');
  }

  if (platformObject.isMobile) {
    productionLog('[Platform] Mobile mode: Touch-optimized UI enabled');
  }

  if (platformObject.isTouch) {
    productionLog('[Platform] Touch device detected: Increasing button tap targets');
  }
}
