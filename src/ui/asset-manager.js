/**
 * Asset Manager Module
 * =====================================================================================
 * Compatibility-aware style and font loading system
 *
 * @module ui/asset-manager
 *
 * Features:
 * - addStyles() - Inject CSS with CSP compatibility (GM_addElement fallback)
 * - loadFonts() - Load Google Fonts with Discord/CSP workaround
 * - getIcon() - Get emoji icons for UI elements
 *
 * Dependencies:
 * - core/compat (CompatibilityMode)
 * - core/logging (Logger)
 */

/**
 * Asset management system for styles, fonts, and icons
 *
 * Provides CSP-aware asset loading with automatic fallback strategies
 * for restricted environments (Discord, Electron, webviews)
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.CompatibilityMode] - Compatibility mode system
 * @param {object} [dependencies.Logger] - Logging system
 * @param {object} [dependencies.GM_addElement] - Tampermonkey GM_addElement function
 * @param {object} [dependencies.GM_addStyle] - Tampermonkey GM_addStyle function
 * @param {Document} [dependencies.targetDocument] - Target document
 * @returns {object} AssetManager instance
 *
 * @example
 * import { createAssetManager } from './ui/asset-manager.js';
 * const assetManager = createAssetManager({ CompatibilityMode, Logger });
 * assetManager.addStyles('.my-class { color: red; }', 'my-styles');
 * assetManager.loadFonts();
 */
export function createAssetManager(dependencies = {}) {
  const {
    CompatibilityMode,
    Logger,
    GM_addElement: gmAddElement = typeof GM_addElement !== 'undefined' ? GM_addElement : null,
    GM_addStyle: gmAddStyle = typeof GM_addStyle !== 'undefined' ? GM_addStyle : null,
    targetDocument = typeof document !== 'undefined' ? document : null
  } = dependencies;

  /**
   * Add CSS styles to the page with CSP compatibility
   *
   * Strategy:
   * 1. If compat mode + GM_addElement available: Use GM_addElement (best CSP bypass)
   * 2. If compat mode + domOnlyStyles: Create inline <style> element
   * 3. Otherwise: Use GM_addStyle if available, or create <style> element
   *
   * @param {string} css - CSS content to inject
   * @param {string} [id] - Optional ID for the style element
   * @returns {void}
   *
   * @example
   * assetManager.addStyles('.my-class { color: red; }', 'my-custom-styles');
   */
  function addStyles(css, id) {
    // Discord Fix: Prefer GM_addElement for best CSP compatibility
    // GM_addElement bypasses CSP better than regular createElement
    if (gmAddElement && CompatibilityMode?.flags?.enabled) {
      try {
        const attrs = { textContent: css };
        if (id) attrs.id = id;
        gmAddElement('style', attrs);
        Logger?.debug('ASSETS', `Added styles via GM_addElement${id ? ` (${id})` : ''} (Discord-safe)`);
        return;
      } catch (e) {
        Logger?.warn('ASSETS', 'GM_addElement failed, falling back to standard method', e);
      }
    }

    if (CompatibilityMode?.flags?.domOnlyStyles) {
      // Inline styles only - inject into head with style element
      const style = targetDocument.createElement('style');
      style.textContent = css;
      if (id) style.id = id;
      targetDocument.head.appendChild(style);
      Logger?.debug('ASSETS', `Injected inline styles${id ? ` (${id})` : ''}`);
    } else {
      // Normal mode - use GM_addStyle if available
      if (gmAddStyle) {
        gmAddStyle(css);
      } else {
        const style = targetDocument.createElement('style');
        style.textContent = css;
        if (id) style.id = id;
        targetDocument.head.appendChild(style);
      }
      Logger?.debug('ASSETS', `Added styles${id ? ` (${id})` : ''}`);
    }
  }

  /**
   * Load fonts with Discord/CSP compatibility
   *
   * In compatibility mode (Discord, Electron, CSP violations):
   * - Uses system fonts only (no external Google Fonts)
   * - Injects fallback font-family rules
   *
   * In normal mode:
   * - Allows external Google Fonts
   * - CSP guard will prevent loading if needed
   *
   * @returns {void}
   *
   * @example
   * assetManager.loadFonts();
   */
  function loadFonts() {
    if (CompatibilityMode?.flags?.blockExternalFonts) {
      // Use system fonts only
      addStyles(
        `
          .mgtools-ui *, .mga-dock *, .mga-sidebar *, .mga-panel * {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                         Roboto, Helvetica, Arial, sans-serif !important;
          }
          .fancy-header, .mgtools-header {
            font-family: Georgia, "Times New Roman", serif !important;
            font-style: italic;
          }
        `,
        'mgtools-compat-fonts'
      );
      Logger?.info('ASSETS', 'Using system fonts (compat mode)');
    } else {
      // Normal font loading - Google Fonts
      // The CSP guard at the top of the file will prevent this in Discord anyway
      Logger?.debug('ASSETS', 'External fonts allowed (normal mode)');
    }
  }

  /**
   * Get icon emoji for UI elements
   *
   * Returns emoji fallbacks for icons - works in all environments
   * without external dependencies or CSP issues.
   *
   * @param {string} name - Icon name
   * @returns {string} Emoji icon
   *
   * @example
   * const icon = assetManager.getIcon('pet'); // Returns '🐾'
   */
  function getIcon(name) {
    // In compat mode or for simplicity, use emoji fallbacks
    const icons = {
      pet: '🐾',
      timer: '⏰',
      shop: '🛒',
      seeds: '🌱',
      values: '💎',
      abilities: '⚡',
      rooms: '🏠',
      tools: '🔧',
      settings: '⚙️',
      hotkeys: '⌨️',
      help: '❓',
      alert: '🔔',
      close: '✖️',
      refresh: '🔄',
      save: '💾',
      export: '📤',
      import: '📥'
    };
    return icons[name] || '📦';
  }

  // Return public API
  return {
    addStyles,
    loadFonts,
    getIcon
  };
}

/**
 * Initialize asset manager and load fonts
 *
 * Convenience function that creates an asset manager instance and
 * immediately loads fonts.
 *
 * @param {object} dependencies - Injected dependencies (see createAssetManager)
 * @returns {object} AssetManager instance
 *
 * @example
 * import { initializeAssetManager } from './ui/asset-manager.js';
 * const assetManager = initializeAssetManager({ CompatibilityMode, Logger });
 */
export function initializeAssetManager(dependencies = {}) {
  const assetManager = createAssetManager(dependencies);
  assetManager.loadFonts(); // Call font setup on initialization
  return assetManager;
}
