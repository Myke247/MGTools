/**
 * UI Overlay System Module
 *
 * @module ui/overlay
 * @description Core user interface framework for MGTools
 * Handles CSS styling, dock UI, sidebar navigation, popout widgets, and overlay management
 *
 * @author MGTools Development Team
 * @version 1.0.0
 * @date 2025-10-25
 */

/* ============================================================================
 * PHASE 1: UNIFIED_STYLES CSS (~722 lines)
 * ============================================================================
 * Complete CSS styling system for MGTools UI
 * Includes dock, sidebar, popout, overlay, and theme styles
 */

/**
 * Google Fonts Import
 * @constant {string}
 * @description Currently empty - Google Fonts can be imported here if needed
 */
const googleFontsImport = '';

/**
 * UNIFIED_STYLES - Complete CSS styling system for MGTools UI
 * @constant {string}
 * @description Template literal containing all CSS styles for the entire UI system
 *
 * Includes:
 * - Hybrid Dock Styles (horizontal/vertical modes)
 * - Dock Size Variants (micro, mini, tiny, small, medium, large)
 * - Sidebar Styles (main sidebar + shop sidebar)
 * - Popout Widget Styles
 * - Original MGA Styles (buttons, inputs, overlays)
 * - Pet Management Styles
 * - Shop Item Styles
 * - Texture Animations
 * - Scrollbar Styles
 */
const UNIFIED_STYLES = `
      ${googleFontsImport}

      /* ==================== HYBRID DOCK STYLES ==================== */
      #mgh-dock {
          font-family: 'Inter', sans-serif;
          position: fixed;
          display: flex;
          gap: 6px;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 8px 12px;
          z-index: 999999;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          /* No transition for instant drag response */
      }

      #mgh-dock.horizontal {
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          flex-direction: row;
          border-radius: 16px;
      }

      #mgh-dock.vertical {
          left: 16px;
          top: 20px;
          transform: none;
          flex-direction: column;
          border-radius: 16px;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          overflow-x: hidden;
      }

      /* Custom scrollbar for vertical dock */
      #mgh-dock.vertical::-webkit-scrollbar {
          width: 4px;
      }

      #mgh-dock.vertical::-webkit-scrollbar-track {
          background: transparent;
      }

      #mgh-dock.vertical::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
      }

      #mgh-dock.vertical::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
      }

      /* Scroll indicators - gradient shadows at top/bottom when scrollable */
      #mgh-dock.vertical::before,
      #mgh-dock.vertical::after {
          content: '';
          position: sticky;
          display: block;
          left: 0;
          right: 0;
          height: 20px;
          pointer-events: none;
          z-index: 10;
      }

      #mgh-dock.vertical::before {
          top: 0;
          background: linear-gradient(to bottom, rgba(31, 41, 55, 0.9), transparent);
          margin-bottom: -20px;
      }

      #mgh-dock.vertical::after {
          bottom: 0;
          background: linear-gradient(to top, rgba(31, 41, 55, 0.9), transparent);
          margin-top: -20px;
      }

      .mgh-dock-item {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.57);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
      }

      .mgh-dock-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.1);
      }

      .mgh-dock-item.active {
          background: rgba(102, 126, 234, 0.3);
          border-color: #667eea;
      }

      .mgh-dock-item.flip-toggle {
          background: rgba(255, 255, 255, 0.08);
          font-size: 14px;
      }

      .mgh-dock-item.flip-toggle:hover {
          background: rgba(255, 255, 255, 0.12);
      }

      /* Optimized sizes for vertical mode */
      #mgh-dock.vertical .mgh-dock-item {
          width: 40px;
          height: 40px;
      }

      #mgh-dock.vertical .mgh-dock-item img {
          /* FIX: Match scriptwithicons sizing exactly */
          width: 24px;
          height: 24px;
      }

      #mgh-dock.vertical .mgh-dock-item {
          font-size: 20px;
      }

      /* ==================== DOCK SIZE VARIANTS ==================== */
      /* Micro size (0.50x scale - smallest) */
      #mgh-dock.dock-size-micro.horizontal .mgh-dock-item {
          width: 22px;
          height: 22px;
          font-size: 10px;
      }

      #mgh-dock.dock-size-micro.vertical .mgh-dock-item {
          width: 20px;
          height: 20px;
          font-size: 11px;
      }

      #mgh-dock.dock-size-micro .mgh-dock-item img {
          width: 12px;
          height: 12px;
      }

      /* Mini size (0.61x scale) */
      #mgh-dock.dock-size-mini.horizontal .mgh-dock-item {
          width: 27px;
          height: 27px;
          font-size: 12px;
      }

      #mgh-dock.dock-size-mini.vertical .mgh-dock-item {
          width: 25px;
          height: 25px;
          font-size: 13px;
      }

      #mgh-dock.dock-size-mini .mgh-dock-item img {
          width: 15px;
          height: 15px;
      }

      /* Tiny size (0.73x scale) */
      #mgh-dock.dock-size-tiny.horizontal .mgh-dock-item {
          width: 32px;
          height: 32px;
          font-size: 14px;
      }

      #mgh-dock.dock-size-tiny.vertical .mgh-dock-item {
          width: 30px;
          height: 30px;
          font-size: 15px;
      }

      #mgh-dock.dock-size-tiny .mgh-dock-item img {
          width: 18px;
          height: 18px;
      }

      /* Small size (0.86x scale) */
      #mgh-dock.dock-size-small.horizontal .mgh-dock-item {
          width: 38px;
          height: 38px;
          font-size: 16px;
      }

      #mgh-dock.dock-size-small.vertical .mgh-dock-item {
          width: 36px;
          height: 36px;
          font-size: 17px;
      }

      #mgh-dock.dock-size-small .mgh-dock-item img {
          width: 21px;
          height: 21px;
      }

      /* Medium size (1.0x scale - default, already defined above) */
      /* No additional CSS needed - uses base .mgh-dock-item styles */

      /* Large size (1.18x scale) */
      #mgh-dock.dock-size-large.horizontal .mgh-dock-item {
          width: 52px;
          height: 52px;
          font-size: 22px;
      }

      #mgh-dock.dock-size-large.vertical .mgh-dock-item {
          width: 48px;
          height: 48px;
          font-size: 24px;
      }

      #mgh-dock.dock-size-large .mgh-dock-item img {
          width: 28px;
          height: 28px;
      }

      .mgh-tooltip {
          position: absolute;
          background: rgba(10, 10, 10, 0.95);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          color: white;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.57);
          z-index: 10;
      }

      #mgh-dock.horizontal .mgh-tooltip {
          bottom: 56px;
          left: 50%;
          transform: translateX(-50%);
      }

      #mgh-dock.vertical .mgh-tooltip {
          left: 56px;
          top: 50%;
          transform: translateY(-50%);
      }

      .mgh-dock-item:hover .mgh-tooltip { opacity: 1; }

      .mgh-tail-group {
          display: flex;
          gap: 6px;
          transition: opacity 0.3s ease;
      }

      #mgh-dock.horizontal .mgh-tail-group {
          flex-direction: row;
      }

      #mgh-dock.vertical .mgh-tail-group {
          flex-direction: column;
      }

      /* ==================== SIDEBAR STYLES ==================== */
      #mgh-sidebar {
          font-family: 'Inter', sans-serif;
          position: fixed;
          left: -420px;
          top: 0;
          width: 400px;
          height: 100vh;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          z-index: 999998;
          transition: left 0.3s ease;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.6);
      }

      #mgh-sidebar.open { left: 0; }

      /* ==================== SHOP SIDEBAR STYLES ==================== */
      .mga-shop-sidebar {
          font-family: 'Inter', sans-serif;
          position: fixed;
          top: 0;
          width: 380px;
          height: 100vh;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          z-index: 999998;
          transition: left 0.3s ease, right 0.3s ease;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 24px rgba(0, 0, 0, 0.6);
      }

      .mga-shop-sidebar-left {
          left: -400px;
          border-right: 1px solid rgba(255, 255, 255, 0.15);
      }

      .mga-shop-sidebar-left.open {
          left: 0;
      }

      .mga-shop-sidebar-right {
          right: -400px;
          border-left: 1px solid rgba(255, 255, 255, 0.15);
      }

      .mga-shop-sidebar-right.open {
          right: 0;
      }

      .mga-shop-sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.57);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(20, 20, 20, 0.5);
      }

      .mgh-sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.57);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }

      .mgh-sidebar-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
      }

      .mgh-sidebar-close {
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.73);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s;
      }

      .mgh-sidebar-close:hover {
          background: rgba(255, 255, 255, 0.57);
          color: white;
      }

      .mgh-sidebar-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          color: white;
      }

      .mgh-sidebar-body::-webkit-scrollbar { width: 6px; }
      .mgh-sidebar-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.73);
          border-radius: 3px;
      }

      /* ==================== PRESERVE ORIGINAL MGA STYLES ==================== */
      .mga-btn {
          background: rgba(255, 255, 255, 0.57);
          border: 1px solid rgba(255, 255, 255, 0.73);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none !important;
      }

      .mga-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(74, 158, 255, 0.6);
          box-shadow: 0 0 12px rgba(74, 158, 255, 0.4);
      }

      .mga-input, .mga-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
      }

      .mga-input:focus, .mga-select:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(255, 255, 255, 0.08);
      }

      .mga-select option {
          background: rgba(20, 20, 20, 0.95);
          color: #ffffff;
          padding: 8px;
      }

      .mga-select option:hover {
          background: rgba(74, 158, 255, 0.3);
      }

      .mga-select optgroup {
          background: rgba(0, 0, 0, 0.5);
          color: #4a9eff;
          font-weight: bold;
          font-size: 11px;
          padding: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.57);
      }

      /* Shop item name colors */
      .shop-color-white { color: #ffffff !important; }
      .shop-color-green { color: #2afd23ff !important; }
      .shop-color-blue { color: #0084ffff !important; }
      .shop-color-yellow { color: #fced19ff !important; }
      .shop-color-purple { color: #774cb3 !important; }
      .shop-color-orange { color: #ff7300ff !important; }

      /* Rainbow text for celestial items */
      .shop-rainbow-text {
          background: linear-gradient(90deg,
              #ff0000, #ff7b00, #ffd800, #3cff2a, #00b5ff, #774cb3, #ff2ab7, #ff0000);
          background-size: 200% 100%;
          background-repeat: repeat;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent !important;
          animation: shopRainbowShift 3s linear infinite;
          font-weight: 700;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
      }

      @keyframes shopRainbowShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
      }

      /* ========== TEXTURE ANIMATIONS ========== */
      @keyframes textureSlowDrift {
          0%   { background-position: 0px 0px, 0 0; }
          100% { background-position: 200px 200px, 0 0; }
      }

      @keyframes hologramScan {
          0%   { background-position: 0 0, 0 0; }
          100% { background-position: 0 100%, 0 0; }
      }

      @keyframes energyPulse {
          0%   { background-position: 0% 0%, 0% 0%, 0% 0%, 0 0; }
          50%  { background-position: 100% 0%, 100% 100%, 0% 100%, 0 0; }
          100% { background-position: 0% 0%, 0% 0%, 0% 0%, 0 0; }
      }

      .mga-texture-animated {
          animation: textureSlowDrift 60s linear infinite;
      }

      /* Shop sprite sizing */
      .shop-sprite {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: contain;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.02);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
      }

      .shop-item.in-stock .shop-sprite {
          transform: scale(1.04);
          box-shadow: 0 4px 10px rgba(0, 255, 42, 0.07);
      }

      /* Original overlay styles preserved */
      .mga-overlay {
          position: fixed;
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.57);
          border-radius: 12px;
          padding: 20px;
          color: #ffffff;
          z-index: 10001;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      /* Popout widget styles */
      .mgh-popout {
          font-family: 'Inter', sans-serif;
          position: fixed;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          z-index: 1000000;
          min-width: 320px;
          width: 400px; /* Default width, resizable */
          height: 400px; /* Default height, resizable */
          display: flex;
          flex-direction: column;
          /* No transition for instant drag response */
      }

      .mgh-popout-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.57);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: grab;
          user-select: none;
          background: rgba(20, 20, 20, 0.5);
          flex-shrink: 0;
      }

      .mgh-popout-header:active {
          cursor: grabbing;
      }

      .mgh-popout-body {
          padding: 16px;
          color: white;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
      }

      /* ==================== PET MANAGEMENT STYLES ==================== */
      .mga-section {
          margin-bottom: 20px;
      }

      .mga-section-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.57);
      }

      .mga-pet-section-title {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
      }

      /* Active Pets Display */
      .mga-active-pets-display {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.57);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
      }

      .mga-active-pets-header {
          color: #93c5fd;
          font-size: 12px;
          margin-bottom: 8px;
          font-weight: 500;
      }

      .mga-active-pets-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
      }

      .mga-pet-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
      }

      .mga-pet-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.2s ease;
      }

      .mga-pet-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .mga-hunger-timer {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.48);
      }

      /* Pet Presets */
      .mga-presets-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }

      .mga-preset {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.57);
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s ease;
      }

      .mga-preset-clickable {
          cursor: pointer;
      }

      .mga-preset-clickable:hover {
          background: rgba(255, 255, 255, 0.55);
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.48);
      }

      .mga-preset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
      }

      .mga-preset-name {
          font-size: 13px;
          font-weight: 600;
          color: #93c5fd;
      }

      .mga-preset-pets {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
      }

      /* Empty State */
      .mga-empty-state {
          text-align: center;
          padding: 24px;
          color: rgba(255, 255, 255, 0.5);
      }

      .mga-empty-state-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.5;
      }

      .mga-empty-state-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
      }

      .mga-empty-state-description {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
      }

      /* Scrollable containers */
      .mga-scrollable {
          overflow-y: auto;
      }

      .mga-scrollable::-webkit-scrollbar {
          width: 6px;
      }

      .mga-scrollable::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
      }

      .mga-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.73);
          border-radius: 3px;
      }

      .mga-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
      }
  `;

/**
 * createUnifiedUI - Main UI creation function
 * Creates the hybrid dock and sidebar UI elements
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.targetDocument - Target document to create UI in
 * @param {Function} deps.productionLog - Logging function
 * @param {Function} deps.makeDockDraggable - Makes dock draggable
 * @param {Function} deps.openSidebarTab - Opens sidebar tab
 * @param {Function} deps.toggleShopWindows - Toggles shop windows
 * @param {Function} deps.openPopoutWidget - Opens popout widget
 * @param {Function} deps.checkVersion - Checks script version
 * @param {Function} deps.saveDockOrientation - Saves dock orientation
 * @param {Function} deps.loadDockOrientation - Loads dock orientation
 * @param {Function} deps.loadDockPosition - Loads dock position
 * @param {Function} deps.generateThemeStyles - Generates theme styles
 * @param {Function} deps.applyAccentToDock - Applies accent to dock
 * @param {Function} deps.applyAccentToSidebar - Applies accent to sidebar
 * @param {Function} deps.applyThemeToDock - Applies theme to dock
 * @param {Function} deps.applyThemeToSidebar - Applies theme to sidebar
 * @param {boolean} deps.isDiscordEnv - Whether running in Discord environment
 * @param {string} deps.UNIFIED_STYLES - CSS styles
 * @param {string} deps.CURRENT_VERSION - Current script version
 * @param {boolean} deps.IS_LIVE_BETA - Whether this is beta version
 * @param {Object} deps.UnifiedState - Unified state object
 */
function createUnifiedUI({
  targetDocument,
  productionLog,
  makeDockDraggable,
  openSidebarTab,
  toggleShopWindows,
  openPopoutWidget,
  checkVersion,
  saveDockOrientation,
  loadDockOrientation,
  loadDockPosition,
  generateThemeStyles,
  applyAccentToDock,
  applyAccentToSidebar,
  applyThemeToDock,
  applyThemeToSidebar,
  isDiscordEnv,
  UNIFIED_STYLES,
  CURRENT_VERSION,
  IS_LIVE_BETA,
  UnifiedState
}) {
  // Guard against duplicate UI creation
  if (targetDocument.getElementById('mgh-dock') || targetDocument.getElementById('mgh-sidebar')) {
    productionLog('🎨 UI already exists, skipping creation');
    return;
  }

  // Critical: Ensure body exists before creating UI
  if (!targetDocument.body) {
    console.error('[MGTools] ⚠️ Body not ready, retrying UI creation in 100ms...');
    setTimeout(
      () =>
        createUnifiedUI({
          targetDocument,
          productionLog,
          makeDockDraggable,
          openSidebarTab,
          toggleShopWindows,
          openPopoutWidget,
          checkVersion,
          saveDockOrientation,
          loadDockOrientation,
          loadDockPosition,
          generateThemeStyles,
          applyAccentToDock,
          applyAccentToSidebar,
          applyThemeToDock,
          applyThemeToSidebar,
          isDiscordEnv,
          UNIFIED_STYLES,
          CURRENT_VERSION,
          IS_LIVE_BETA,
          UnifiedState
        }),
      100
    );
    return;
  }

  productionLog('🎨 Creating Hybrid Dock UI...');

  // Add hybrid styles
  const styleSheet = targetDocument.createElement('style');
  styleSheet.textContent = UNIFIED_STYLES;
  targetDocument.head.appendChild(styleSheet);

  // Create hybrid dock
  const dock = targetDocument.createElement('div');
  dock.id = 'mgh-dock';
  dock.className = 'horizontal';

  // Primary tabs
  const primaryTabs = ['pets', 'abilities', 'seeds', 'values', 'timers', 'rooms', 'shop'];

  // Tail group tabs (Tools, Settings, Hotkeys, Protect, Notifications, Help)
  const tailTabs = ['tools', 'settings', 'hotkeys', 'protect', 'notifications', 'help'];

  // Icon mapping
  const icons = {
    pets: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANIAAADkCAMAAADaZIrAAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAACXBIWXMAAC4jAAAuIwF4pT92AAAC/VBMVEVHcEz5nVv5jGPnqWjcqnb3nlf6tGXC1apD6bJE6878nV33Z+H6t1P9jIDuzW+9mdig4V261+D+hFvsnKHx0VO0PL7ygrJD7pFs7HyP8syy5kGkNaS0y1quMbLlski6TOHR6Gdc6UfSapulr+/iSvxJQy/+4X//yIH+1Hn+24D86XD+8H20NMr923j943f8+3j+z4H6+mn+1oH86mf88G7+6H/+zHr96nj+xXn98XbV+2f/uH7G+2fj+2jv+2fy/XbjUvwtad/9zHP/wID91m40SS8reN0s35Bk+rIsht7kW/1Q97Vk+sVm+6dQ+KZl+rvo/Xb88WVp+423+2Zj+tCq/GtP98QtV+As34JOtfYskt9jeO9qY+/8wFaB+Pwt4J2e+2RR1vemRu1i+tyxRe1P9fT/3cos33Jx+2d+5vxS+JAs315P99T84Gn9tVZPxvZ6M+Fi+cor3raP+2Yw3jMs36na/Xb/fllBm+os38+7SOpl+3OA+2VO5vZ+1fz74VR17bRRjPjL/XVO9uT/rYCaSe0u394tRt8snt9S+Xgt30hh+un711Rg9/hvM+FBqupi+oNK4DAyNOHt2nj9qVf+jllqovNu/H5Rofgs3sP5zFFmjfEsqd9wtfaB/fLKXP1RcviA3SssyN9rSfHdS/jWVfx1xvhg+mX/18ksvd+HM+E/uellMuAstN9l3StUV/i/Yf1GMOHWyqqZ3SqHXe1ASS8t0+Cw3ixZ+FNAjeruTfxXMeCMRe7G3izWYv25/HWP/+D/4sr9m1hbSO/t03hBy+px+FL+zFeZ/HKDtv6I+VH861V6Re+q+VE/futf5flt+5t+dv1D6Zl27J/Z3SyB/ub0W/oveeKD/HHfzi1L8WBBbOyW8ElD4eeL/9KWNOFKRvD5+VSwZPx6mf7U+1RD6Hzo+1To2EPB+lO8OtpJWu0hLdOz6EVx6EUm2Kni50OyO9pYXjv/x6nM6UQfXNKQi1rJP+Zwc036d7TIsF7ox0VhtVmzqoypu5JHcExw1ESbAAAA/3RSTlMAnGIQIDx9/v7+vvzf/lv+/P7b+rp9uXxClpFP+bP3w/rC+7///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wAoptLHAAAycklEQVR42uSbPWtbaRbHR7alwtghBBfLEoZpolfulaLEV/eOkhgkfQBv4dKQygwBp7SKXTAYNQIVU1jkI0RfIODORIVtZNwH4cZgggs31hLM7G5gz9vzduXpdB0vex4pyxZT/Pid8z/PlaWffvp/r/n03FwmlVpcXFpa2qd6jwX/b2llcSWVymQepdPz/yswc3OpJ/3+EAtI6J/3Upt8sOB/EXExBWwPGW2BaICHiYb7QzG0r4HsOt485tpcST1KP0CedIZwCGmKaD+m6ZiPhurBeyXzoLDmM0/a7Xa/3Xeo4pboX8uRxQRQvV7veOXRwgMRtMg8TDTsUA2FR0+S9N175hEkzQNECNXrPQQqAmozVGcy2NqC19bW58+T5v6+bcmZpmMZpc1pJqBKPwQgdLQ8ARrh+YxvoILKcVVyuSAMG2FjM9S9F+s7U0uPftwMpdqq+h3GISQCEiaFZFe+0Wg4imiSWvDPdm+3twv1o6DmDFC7PxEkzYNlHFU0VFVVvtXQioylXWI63V1a+FGKlvsIBMkwMIo01MRCqtC7yoerUC0UWq1jsYQ4CLS9S3W6m7n3xQq5vTwZDAYTirqOIH22q6LnqCKWDBDyUGULnlHU291VRLv3LQqJEAgLgDqdieo6Q5XLNZ2uqzpImgiPt01AoKgnQKdQvUf3S7Q8UDWhTbQVHyUh4nDIqUGyu46ZpDyS1LMsQWV+iCPFNHH7Duao6YyR03aaKEuWoFZXs/621XanVL17Y3KItgaDaaRKUzmq6ARnnoqtSHiACM/qKkG9QCBhui9PmbbVdrhglSatKGcRVawAryhFVYdIgFYFCrvu9PQ+mRYg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',
    abilities:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23ffe59e"/><stop offset="1" stop-color="%23ffc75b"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><path d="M68 18 40 70h18l-6 38 38-58H74l6-32z" fill="%23fff7d6" stroke="%236b4b2a" stroke-width="6" stroke-linejoin="round"/></svg>',
    seeds:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23d3f8c6"/><stop offset="1" stop-color="%239be4a3"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><ellipse cx="64" cy="76" rx="20" ry="16" fill="%23a36b3a" stroke="%236b4b2a" stroke-width="6"/><path d="M64 60c0-12 10-22 22-22-3 12-11 20-22 22zM64 60c0-12-10-22-22-22 3 12 11 20 22 22z" fill="%239cd67f" stroke="%236b4b2a" stroke-width="6" stroke-linejoin="round"/></svg>',
    values:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23ffe59e"/><stop offset="1" stop-color="%23ffd24d"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><circle cx="64" cy="64" r="30" fill="%23ffd86a" stroke="%236b4b2a" stroke-width="6"/><path d="M64 44v40M52 54h24M52 74h24" stroke="%236b4b2a" stroke-width="8" stroke-linecap="round"/></svg>',
    timers:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23cde9ff"/><stop offset="1" stop-color="%2387d0ff"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><circle cx="64" cy="72" r="34" fill="%23fff" stroke="%236b4b2a" stroke-width="6"/><path d="M64 72V52M64 72l18 12" stroke="%236b4b2a" stroke-width="8" stroke-linecap="round"/><rect x="50" y="18" width="28" height="12" rx="6" fill="%23fff" stroke="%236b4b2a" stroke-width="6"/></svg>',
    rooms:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23ffe1f0"/><stop offset="1" stop-color="%23ffb6d9"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><path d="M28 70l36-26 36 26v30H28z" fill="%23fff" stroke="%236b4b2a" stroke-width="6" stroke-linejoin="round"/><rect x="54" y="74" width="20" height="26" rx="4" fill="%23ffd24d" stroke="%236b4b2a" stroke-width="6"/></svg>',
    shop: 'https://cdn.discordapp.com/emojis/1423011042744729700.webp',
    tools:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23e5e1ff"/><stop offset="1" stop-color="%23c7c2ff"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><path d="M46 86l36-36-8-8-36 36-2 14 10-6z" fill="%23fff" stroke="%236b4b2a" stroke-width="6" stroke-linejoin="round"/><rect x="68" y="34" width="14" height="14" rx="3" fill="%23ffd24d" stroke="%236b4b2a" stroke-width="6"/></svg>',
    settings:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23dff3ff"/><stop offset="1" stop-color="%23bfe6ff"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><circle cx="64" cy="64" r="20" fill="%23fff" stroke="%236b4b2a" stroke-width="6"/><path d="M64 30v12M64 86v12M30 64h12M86 64h12M42 42l8 8M78 78l8 8M86 42l-8 8M50 78l-8 8" stroke="%236b4b2a" stroke-width="6" stroke-linecap="round"/></svg>',
    hotkeys:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23fff2c4"/><stop offset="1" stop-color="%23ffd889"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><rect x="30" y="44" width="68" height="40" rx="10" fill="%23fff" stroke="%236b4b2a" stroke-width="6"/><text x="64" y="70" font-family="Arial,Helvetica,sans-serif" font-size="28" text-anchor="middle" fill="%236b4b2a">F</text></svg>',
    protect:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23e2ffe7"/><stop offset="1" stop-color="%23b7f5c3"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><path d="M64 26l32 10v22c0 24-16 36-32 44-16-8-32-20-32-44V36z" fill="%23fff" stroke="%236b4b2a" stroke-width="6" stroke-linejoin="round"/><path d="M46 62l12 12 24-24" fill="none" stroke="%2394d36b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    notifications:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23e3f0ff"/><stop offset="1" stop-color="%23c7dbff"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><path d="M40 82h48l-6-10V58a18 18 0 10-36 0v14z" fill="%23fff" stroke="%236b4b2a" stroke-width="6" stroke-linejoin="round"/><circle cx="84" cy="44" r="10" fill="%23ff6464" stroke="%236b4b2a" stroke-width="6"/></svg>',
    help: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%23f1e7ff"/><stop offset="1" stop-color="%23d9ccff"/></linearGradient></defs><rect x="12" y="12" width="104" height="104" rx="22" fill="url(%23g)" stroke="%236b4b2a" stroke-width="6"/><circle cx="64" cy="88" r="6" fill="%236b4b2a"/><path d="M48 54a16 16 0 1132 0c0 10-8 10-10 16" fill="none" stroke="%236b4b2a" stroke-width="8" stroke-linecap="round"/></svg>'
  };

  // Tooltip text with hotkey info
  const tooltipText = {
    pets: 'Pets • Alt+P • Shift+Click for widget',
    abilities: 'Abilities • Alt+A • Shift+Click for widget',
    seeds: 'Seeds • Alt+S • Shift+Click for widget',
    values: 'Values • Alt+V • Shift+Click for widget',
    timers: 'Timers • Shift+Click for widget',
    rooms: 'Rooms • Shift+Click for widget',
    shop: 'Shop • Alt+B',
    tools: 'Tools',
    settings: 'Settings • Alt+G',
    hotkeys: 'Hotkeys',
    protect: 'Crop Protection • Lock/unlock crops',
    notifications: 'Notifications',
    help: 'Help'
  };

  // Create primary dock items
  primaryTabs.forEach(tabName => {
    const item = targetDocument.createElement('div');
    item.className = 'mgh-dock-item';
    item.dataset.tab = tabName;

    const img = targetDocument.createElement('img');
    img.src = icons[tabName];
    // FIX: Match scriptwithicons sizing exactly
    img.style.height = '70%';

    // Add fallback for failed icon loads (especially shop icon)
    img.onerror = () => {
      img.style.display = 'none';
      const fallbackEmoji = targetDocument.createElement('span');
      const emojiMap = {
        pets: '🐾',
        abilities: '⚡',
        seeds: '🌱',
        values: '💎',
        timers: '⏱️',
        rooms: '🏠',
        shop: '🛒',
        tools: '🔧',
        settings: '⚙️',
        hotkeys: '⌨️',
        protect: '🔒',
        notifications: '🔔',
        help: '❓'
      };
      fallbackEmoji.textContent = emojiMap[tabName] || '📋';
      fallbackEmoji.style.fontSize = '24px';
      item.insertBefore(fallbackEmoji, item.firstChild);
    };

    item.appendChild(img);

    const tooltip = targetDocument.createElement('div');
    tooltip.className = 'mgh-tooltip';
    tooltip.innerHTML = tooltipText[tabName] || tabName.charAt(0).toUpperCase() + tabName.slice(1);

    item.appendChild(tooltip);

    item.addEventListener('click', e => {
      if (e.shiftKey) {
        openPopoutWidget(tabName);
      } else {
        // Special handling for shop - open slide-out windows instead of sidebar
        if (tabName === 'shop') {
          toggleShopWindows();
        } else {
          openSidebarTab(tabName);
        }
      }
    });

    dock.appendChild(item);
  });

  // Create tail group container
  const tailGroup = targetDocument.createElement('div');
  tailGroup.className = 'mgh-tail-group';
  tailGroup.style.display = 'none';

  tailTabs.forEach(tabName => {
    const item = targetDocument.createElement('div');
    item.className = 'mgh-dock-item';
    item.dataset.tab = tabName;

    const img = targetDocument.createElement('img');
    img.src = icons[tabName];
    // FIX: Match scriptwithicons sizing exactly
    img.style.height = '70%';

    // Add fallback for failed icon loads (especially shop icon)
    img.onerror = () => {
      img.style.display = 'none';
      const fallbackEmoji = targetDocument.createElement('span');
      const emojiMap = {
        pets: '🐾',
        abilities: '⚡',
        seeds: '🌱',
        values: '💎',
        timers: '⏱️',
        rooms: '🏠',
        shop: '🛒',
        tools: '🔧',
        settings: '⚙️',
        hotkeys: '⌨️',
        protect: '🔒',
        notifications: '🔔',
        help: '❓'
      };
      fallbackEmoji.textContent = emojiMap[tabName] || '📋';
      fallbackEmoji.style.fontSize = '24px';
      item.insertBefore(fallbackEmoji, item.firstChild);
    };

    item.appendChild(img);

    const tooltip = targetDocument.createElement('div');
    tooltip.className = 'mgh-tooltip';
    tooltip.innerHTML = tooltipText[tabName] || tabName.charAt(0).toUpperCase() + tabName.slice(1);

    item.appendChild(tooltip);

    item.addEventListener('click', e => {
      if (e.shiftKey) {
        openPopoutWidget(tabName);
      } else {
        openSidebarTab(tabName);
      }
    });

    tailGroup.appendChild(item);
  });

  // Version indicator (added to tail group)
  const versionIndicator = targetDocument.createElement('div');
  versionIndicator.className = 'mgh-dock-item version-indicator';
  versionIndicator.innerHTML = '●';
  versionIndicator.style.fontSize = '12px';
  versionIndicator.style.color = IS_LIVE_BETA ? '#ff9500' : '#00ff00'; // Orange for beta, green for stable
  versionIndicator.style.cursor = 'pointer';
  versionIndicator.title = `v${CURRENT_VERSION} (${IS_LIVE_BETA ? 'BETA' : 'STABLE'}) - Checking for updates... (click to refresh)`;

  // Click to manually refresh version check
  versionIndicator.addEventListener('click', e => {
    e.stopPropagation();
    versionIndicator.style.color = '#888';
    versionIndicator.title = `v${CURRENT_VERSION} - Checking for updates...`;
    checkVersion(versionIndicator);
  });

  tailGroup.appendChild(versionIndicator);

  // Tail trigger
  const tailTrigger = targetDocument.createElement('div');
  tailTrigger.className = 'mgh-dock-item tail-trigger';
  tailTrigger.innerHTML = '⋯';
  tailTrigger.addEventListener('mouseenter', () => (tailGroup.style.display = 'flex'));

  // Close tail group when mouse leaves the dock entirely
  dock.addEventListener('mouseleave', () => {
    tailGroup.style.display = 'none';
  });

  // Orientation toggle
  const flipToggle = targetDocument.createElement('div');
  flipToggle.className = 'mgh-dock-item flip-toggle';
  flipToggle.innerHTML = '↔';
  flipToggle.title = 'Toggle orientation';
  flipToggle.addEventListener('click', e => {
    e.stopPropagation();
    if (dock.classList.contains('horizontal')) {
      dock.classList.remove('horizontal');
      dock.classList.add('vertical');
      // In vertical mode: flip toggle at top, then tabs, tail trigger at bottom
      dock.insertBefore(flipToggle, dock.firstChild);
      saveDockOrientation('vertical');
    } else {
      dock.classList.remove('vertical');
      dock.classList.add('horizontal');
      // In horizontal mode: tabs first, tail trigger, then flip toggle at end
      dock.appendChild(flipToggle);
      saveDockOrientation('horizontal');
    }
  });

  // Add in horizontal order: tabs -> tailTrigger -> tailGroup -> flipToggle
  dock.appendChild(tailTrigger);
  dock.appendChild(tailGroup);
  dock.appendChild(flipToggle);

  // Check version after UI is created
  checkVersion(versionIndicator);

  // Make entire dock draggable (except when clicking icons)
  makeDockDraggable(dock);

  // Create sidebar
  const sidebar = targetDocument.createElement('div');
  sidebar.id = 'mgh-sidebar';

  const sidebarHeader = targetDocument.createElement('div');
  sidebarHeader.className = 'mgh-sidebar-header';

  const sidebarTitle = targetDocument.createElement('div');
  sidebarTitle.className = 'mgh-sidebar-title';
  sidebarTitle.textContent = 'MGTools';

  const sidebarClose = targetDocument.createElement('div');
  sidebarClose.className = 'mgh-sidebar-close';
  sidebarClose.innerHTML = '×';
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    targetDocument.querySelectorAll('.mgh-dock-item').forEach(item => {
      item.classList.remove('active');
    });
  });

  sidebarHeader.appendChild(sidebarTitle);
  sidebarHeader.appendChild(sidebarClose);

  const sidebarBody = targetDocument.createElement('div');
  sidebarBody.className = 'mgh-sidebar-body';

  sidebar.appendChild(sidebarHeader);
  sidebar.appendChild(sidebarBody);

  // Append to DOM
  targetDocument.body.appendChild(dock);
  targetDocument.body.appendChild(sidebar);

  // Discord Fix: Add MutationObserver to detect when React purges UI
  if (isDiscordEnv) {
    let uiRemovalCount = 0;
    const maxReinjections = 10; // Prevent infinite loops

    const observer = new MutationObserver(mutations => {
      const dockMissing = !targetDocument.body.contains(dock);
      const sidebarMissing = !targetDocument.body.contains(sidebar);

      if ((dockMissing || sidebarMissing) && uiRemovalCount < maxReinjections) {
        uiRemovalCount++;
        productionLog(`🔄 [DISCORD] UI purged by React (${uiRemovalCount}/${maxReinjections}), re-injecting...`);

        // Re-inject missing elements
        if (dockMissing && dock.parentNode !== targetDocument.body) {
          targetDocument.body.appendChild(dock);
        }
        if (sidebarMissing && sidebar.parentNode !== targetDocument.body) {
          targetDocument.body.appendChild(sidebar);
        }
      }
    });

    // Watch for removals in body
    observer.observe(targetDocument.body, {
      childList: true,
      subtree: false
    });

    productionLog('✅ [DISCORD] MutationObserver active for UI persistence');
  }

  // Restore saved orientation
  const savedOrientation = loadDockOrientation();
  if (savedOrientation === 'vertical') {
    dock.classList.remove('horizontal');
    dock.classList.add('vertical');
    dock.insertBefore(flipToggle, dock.firstChild);
  }

  // Restore saved position
  const savedPosition = loadDockPosition();
  if (savedPosition) {
    dock.style.left = savedPosition.left + 'px';
    dock.style.top = savedPosition.top + 'px';
    dock.style.transform = 'none';
    dock.style.bottom = 'auto';
    dock.style.right = 'auto';
  }

  // Store references
  UnifiedState.panels.dock = dock;
  UnifiedState.panels.sidebar = sidebar;
  UnifiedState.panels.sidebarBody = sidebarBody;

  // Apply theme to dock and sidebar immediately after creation
  setTimeout(() => {
    const currentTheme = generateThemeStyles();
    const isBlackTheme = currentTheme.gradientStyle && currentTheme.gradientStyle.startsWith('black-');
    if (isBlackTheme && currentTheme.accentColor) {
      applyAccentToDock(currentTheme);
      applyAccentToSidebar(currentTheme);
    } else {
      // Apply gradient theme for non-black themes
      applyThemeToDock(currentTheme);
      applyThemeToSidebar(currentTheme);
    }
  }, 100);

  productionLog('✅ Hybrid Dock UI created successfully');
}

/**
 * ensureUIHealthy - Enhanced UI Health Check with Retry Logic
 * Ensures UI is visible and accessible, retries if needed
 * Helps fix issues where UI doesn't show in Tampermonkey/Chrome
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.targetDocument - Target document
 * @param {Function} deps.cleanupCorruptedDockPosition - Cleanup function
 * @param {Function} deps.createUnifiedUI - UI creation function
 * @param {Function} deps.showToast - Toast notification function
 */
function ensureUIHealthy({ targetDocument, cleanupCorruptedDockPosition, createUnifiedUI, showToast }) {
  const maxRetries = 5;
  let retryCount = 0;

  function checkAndRetry() {
    const dock = targetDocument.getElementById('mgh-dock');
    const sidebar = targetDocument.getElementById('mgh-sidebar');

    // Check both existence AND visibility (critical fix for hidden UI bug)
    const dockHidden = dock && (dock.style.display === 'none' || window.getComputedStyle(dock).display === 'none');
    const sidebarHidden =
      sidebar && (sidebar.style.display === 'none' || window.getComputedStyle(sidebar).display === 'none');

    if (!dock || !sidebar || dockHidden || sidebarHidden) {
      // Log the specific issue
      if (!dock) console.warn('[MGTools] Dock element missing');
      if (!sidebar) console.warn('[MGTools] Sidebar element missing');
      if (dockHidden) console.warn('[MGTools] Dock is hidden (display:none)');
      if (sidebarHidden) console.warn('[MGTools] Sidebar is hidden (display:none)');

      // Clear potentially corrupted localStorage state
      if (dockHidden || sidebarHidden) {
        console.warn('[MGTools] Clearing corrupted visibility state...');
        localStorage.removeItem('mgh_toolbar_visible');
      }
      retryCount++;
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // 1s, 2s, 4s, 5s, 5s

        setTimeout(() => {
          // Retry creating UI
          try {
            cleanupCorruptedDockPosition();
            createUnifiedUI();
            checkAndRetry(); // Check again after creation
          } catch (error) {
            console.error('[MGTools TEST] UI recreation failed:', error);
          }
        }, delay);
      } else {
        console.error('[MGTools TEST] UI failed to load. Please report this issue.');

        // Emergency notification
        try {
          const msg = targetDocument.createElement('div');
          msg.style.cssText =
            'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ff4444;color:white;padding:20px;border-radius:10px;z-index:999999;font-family:Arial,sans-serif;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
          msg.innerHTML =
            '<strong>⚠️ MGTools UI Failed to Load</strong><br><br>Please reload the page (F5)<br>or check browser console for details.<br><br><small>Test Version 3.8.9-TEST</small>';
          targetDocument.body.appendChild(msg);

          setTimeout(() => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
          }, 10000);
        } catch (e) {
          console.error('[MGTools TEST] Emergency notification failed:', e);
        }
      }
    } else {
      // UI confirmed healthy, no need for verbose logging

      // Show success toast
      setTimeout(() => {
        try {
          showToast('✅ MGTools TEST Loaded', 'UI Health Check Passed', 3000);
        } catch (e) {
          // Toast might not be ready yet, that's okay
        }
      }, 1000);
    }
  }

  // Initial check after a short delay to let DOM settle
  setTimeout(checkAndRetry, 500);
}

/**
 * setupToolbarToggle - Alt+M Toolbar Toggle
 * Press Alt+M to show/hide the entire MGTools toolbar
 * State is saved and restored across page reloads
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.targetDocument - Target document
 * @param {Document} deps.document - Document object for event listeners
 * @param {Function} deps.productionLog - Logging function
 * @param {Function} deps.showToast - Toast notification function
 * @param {string} deps.CURRENT_VERSION - Current script version
 */
function setupToolbarToggle({ targetDocument, document, productionLog, showToast, CURRENT_VERSION }) {
  // Prevent multiple installations
  if (window.__toolbarToggleInstalled) {
    return;
  }
  window.__toolbarToggleInstalled = true;

  // Version-based state reset to fix UI disappearance after updates
  const STORAGE_KEY = 'mgh_toolbar_visible';
  const VERSION_KEY = 'mgh_ui_version';

  const savedVersion = localStorage.getItem(VERSION_KEY);
  if (savedVersion !== CURRENT_VERSION) {
    // New version detected - reset UI visibility to prevent hidden state from carrying over
    productionLog(`📦 [UI-VERSION] Version change detected: ${savedVersion} → ${CURRENT_VERSION}`);
    productionLog('📦 [UI-VERSION] Resetting UI visibility state to default (visible)');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  }

  // Load saved visibility state (defaults to true if not set)
  let toolbarVisible = localStorage.getItem(STORAGE_KEY) !== 'false'; // default true

  // Apply initial state
  function applyVisibility(visible, showNotification = false) {
    const dock = targetDocument.getElementById('mgh-dock');
    const sidebar = targetDocument.getElementById('mgh-sidebar');

    if (dock) {
      dock.style.display = visible ? '' : 'none';
    }
    if (sidebar) {
      sidebar.style.display = visible ? '' : 'none';
    }

    // Save state
    localStorage.setItem(STORAGE_KEY, visible.toString());

    if (showNotification) {
      try {
        showToast(visible ? '🎨 Toolbar Shown' : '👻 Toolbar Hidden', 'Alt+M to toggle', 2000);
      } catch (e) {
        // Toast not ready, silent fail
      }
    }
  }

  // Apply saved state on load
  setTimeout(() => applyVisibility(toolbarVisible, false), 100);

  // Enhanced Alt+M listener with better reliability
  // Listen on BOTH document and targetDocument to catch all scenarios
  const toggleHandler = e => {
    // Check for Alt+M (case insensitive)
    if (e.altKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      e.stopPropagation();
      toolbarVisible = !toolbarVisible;
      applyVisibility(toolbarVisible, true);
      console.log(`[MGTools] Alt+M: Toolbar ${toolbarVisible ? 'shown' : 'hidden'}`);
    }
  };

  // Add listener to both document contexts for maximum reliability
  document.addEventListener('keydown', toggleHandler, { passive: false, capture: true });
  if (targetDocument !== document) {
    targetDocument.addEventListener('keydown', toggleHandler, { passive: false, capture: true });
  }
}

/**
 * setupDockSizeControl - Dock Size Control
 * Press Alt+= to increase dock size, Alt+- to decrease
 * Cycles through: Micro → Mini → Tiny → Small → Medium → Large
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.targetDocument - Target document
 * @param {Document} deps.document - Document object for event listeners
 * @param {Function} deps.resetDockPosition - Reset dock position function
 * @param {Function} deps.showToast - Toast notification function
 */
function setupDockSizeControl({ targetDocument, document, resetDockPosition, showToast }) {
  // Prevent multiple installations
  if (window.__dockSizeControlInstalled) {
    return;
  }
  window.__dockSizeControlInstalled = true;

  const STORAGE_KEY = 'mgh_dock_size';
  const SIZES = ['micro', 'mini', 'tiny', 'small', 'medium', 'large'];
  const SIZE_LABELS = {
    micro: 'Micro',
    mini: 'Mini',
    tiny: 'Tiny',
    small: 'Small',
    medium: 'Medium',
    large: 'Large'
  };

  // Load saved size (defaults to medium)
  let currentSize = localStorage.getItem(STORAGE_KEY) || 'medium';
  if (!SIZES.includes(currentSize)) {
    currentSize = 'medium';
  }

  // Apply size to dock
  function applyDockSize(size, showNotification = false) {
    const dock = targetDocument.getElementById('mgh-dock');
    if (!dock) return;

    // Remove all size classes
    SIZES.forEach(s => dock.classList.remove(`dock-size-${s}`));

    // Add new size class (except for medium which is default)
    if (size !== 'medium') {
      dock.classList.add(`dock-size-${size}`);
    }

    // Save state
    localStorage.setItem(STORAGE_KEY, size);
    currentSize = size;

    if (showNotification) {
      try {
        showToast(`📏 Dock Size: ${SIZE_LABELS[size]}`, 'Alt+= / Alt+- to adjust', 2000);
      } catch (e) {
        // Toast not ready, silent fail
      }
    }
  }

  // Apply saved size on load
  setTimeout(() => applyDockSize(currentSize, false), 150);

  // Hotkey handler for dock size and position
  const sizeHandler = e => {
    // Alt+= to increase size
    if (e.altKey && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      e.stopPropagation();
      const currentIndex = SIZES.indexOf(currentSize);
      const nextIndex = (currentIndex + 1) % SIZES.length;
      applyDockSize(SIZES[nextIndex], true);
      console.log(`[MGTools] Alt+=: Dock size → ${SIZE_LABELS[SIZES[nextIndex]]}`);
    } else if (e.altKey && (e.key === '-' || e.key === '_')) {
      // Alt+- to decrease size
      e.preventDefault();
      e.stopPropagation();
      const currentIndex = SIZES.indexOf(currentSize);
      const prevIndex = (currentIndex - 1 + SIZES.length) % SIZES.length;
      applyDockSize(SIZES[prevIndex], true);
      console.log(`[MGTools] Alt+-: Dock size → ${SIZE_LABELS[SIZES[prevIndex]]}`);
    } else if (e.altKey && (e.key === 'x' || e.key === 'X')) {
      // Alt+X to reset dock position
      e.preventDefault();
      e.stopPropagation();
      resetDockPosition();
      console.log(`[MGTools] Alt+X: Dock position reset to default`);
    }
  };

  // Add listener to both document contexts
  document.addEventListener('keydown', sizeHandler, { passive: false, capture: true });
  if (targetDocument !== document) {
    targetDocument.addEventListener('keydown', sizeHandler, { passive: false, capture: true });
  }
}

/**
 * saveDockPosition - Save dock position to localStorage
 *
 * @param {Object} position - Position object {left, top}
 */
function saveDockPosition(position) {
  try {
    // v3.8.7 - Always stringify for storage consistency
    const serialized = JSON.stringify(position);
    localStorage.setItem('mgh_dock_position', serialized);

    // v3.8.7 - Concise breadcrumb log
    console.log(`[DOCK-SAVE] left=${position.left}, top=${position.top}, typeof=string (len=${serialized.length})`);
  } catch (e) {
    console.warn('[DOCK-SAVE] Exception during save:', e);
  }
}

/**
 * resetDockPosition - Reset dock position to default
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.targetDocument - Target document
 * @param {Function} deps.showNotificationToast - Toast notification function
 */
function resetDockPosition({ targetDocument, showNotificationToast }) {
  try {
    const dock = targetDocument.getElementById('mgh-dock');
    if (!dock) {
      console.warn('[DOCK-RESET] Dock element not found');
      return;
    }

    // Clear saved position
    localStorage.removeItem('mgh_dock_position');
    console.log('[DOCK-RESET] Cleared saved position');

    // Calculate default position (right side of screen)
    const dockWidth = dock.offsetWidth || 380;
    const defaultLeft = window.innerWidth - dockWidth - 20;
    const defaultTop = 100;

    // Apply default position
    dock.style.left = `${defaultLeft}px`;
    dock.style.top = `${defaultTop}px`;
    dock.style.transform = 'none';
    dock.style.bottom = 'auto';
    dock.style.right = 'auto';

    console.log(`[DOCK-RESET] Reset to default position: left=${defaultLeft}, top=${defaultTop}`);

    // Show toast notification
    try {
      showNotificationToast('🏠 Dock Reset - Position reset to default', 'success');
    } catch (e) {
      // Toast not ready, silent fail
      console.log('[DOCK-RESET] Toast notification unavailable');
    }
  } catch (e) {
    console.warn('[DOCK-RESET] Exception during reset:', e);
  }
}

/**
 * cleanupCorruptedDockPosition - One-time cleanup to detect and clear corrupted dock position data
 */
function cleanupCorruptedDockPosition() {
  try {
    const saved = localStorage.getItem('mgh_dock_position');
    if (!saved) return;

    // v3.8.7 fix: Accept valid objects (storage layer may auto-parse JSON)
    if (typeof saved === 'object' && saved !== null) {
      // If it has valid shape {left, top}, keep it
      if (typeof saved.left === 'number' && typeof saved.top === 'number') {
        console.log('[DOCK-CLEANUP] Found valid object position, keeping it');
        return; // Valid object, no cleanup needed
      } else {
        console.log('[DOCK-CLEANUP] Detected invalid object shape, clearing');
        localStorage.removeItem('mgh_dock_position');
        return;
      }
    }

    // Check for corrupted string data
    if (typeof saved === 'string' && (saved === '[object Object]' || saved.startsWith('[object'))) {
      console.log('[DOCK-CLEANUP] Detected corrupted position data, clearing');
      localStorage.removeItem('mgh_dock_position');
      return;
    }

    // Try to parse to ensure it's valid JSON
    try {
      JSON.parse(saved);
      console.log('[DOCK-CLEANUP] Position data is valid');
    } catch (parseError) {
      console.log('[DOCK-CLEANUP] Invalid JSON in position data, clearing');
      localStorage.removeItem('mgh_dock_position');
    }
  } catch (e) {
    console.warn('[DOCK-CLEANUP] Error during cleanup:', e);
    localStorage.removeItem('mgh_dock_position');
  }
}

/* ============================================================================
 * MODULE EXPORTS
 * ============================================================================
 */

// End of Phase 2
// Total: ~895 lines of UI creation and management functions
// (Exports moved to end of file)
/**
 * openSidebarTab - Opens or switches to a sidebar tab
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.updateTabContent - Function to update tab content
 * @param {string} tabName - Name of the tab to open
 */
function openSidebarTab(deps, tabName) {
  const { targetDocument, UnifiedState, updateTabContent } = deps;
  const sidebar = UnifiedState.panels.sidebar;
  const sidebarBody = UnifiedState.panels.sidebarBody;

  // Check if clicking the same tab that's already open
  const isAlreadyOpen = sidebar.classList.contains('open') && UnifiedState.activeTab === tabName;

  if (isAlreadyOpen) {
    // Close sidebar
    sidebar.classList.remove('open');
    targetDocument.querySelectorAll('.mgh-dock-item').forEach(item => {
      item.classList.remove('active');
    });
    return;
  }

  // Update title
  sidebar.querySelector('.mgh-sidebar-title').textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

  // Update UnifiedState FIRST (required for updateTabContent)
  UnifiedState.activeTab = tabName;

  // Create content container if it doesn't exist
  let contentEl = sidebarBody.querySelector('#mga-tab-content');
  if (!contentEl) {
    contentEl = targetDocument.createElement('div');
    contentEl.id = 'mga-tab-content';
    sidebarBody.innerHTML = '';
    sidebarBody.appendChild(contentEl);
  }

  // Call existing updateTabContent which handles all rendering
  updateTabContent();

  // Reset scroll position to top when opening a tab
  sidebarBody.scrollTop = 0;

  // Show sidebar
  sidebar.classList.add('open');

  // Update active state on dock items
  targetDocument.querySelectorAll('.mgh-dock-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // Mark shift hint as shown
  localStorage.setItem('mga_shift_hint_shown', 'true');
}

/**
 * openPopoutWidget - Opens a popout widget for a tab (legacy widget system)
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.makePopoutDraggable - Function to make popout draggable
 * @param {Function} deps.makeElementResizable - Function to make element resizable
 * @param {Function} deps.generateThemeStyles - Function to generate theme styles
 * @param {Function} deps.applyThemeToPopoutWidget - Function to apply theme to widget
 * @param {Function} deps.stopInventoryCounter - Function to stop inventory counter
 * @param {Function} deps.getCachedTabContent - Function to get cached content
 * @param {Object} deps.contentGetters - Object containing content getter functions
 * @param {Object} deps.handlerSetups - Object containing handler setup functions
 * @param {string} tabName - Name of the tab
 */
function openPopoutWidget(deps, tabName) {
  const {
    targetDocument,
    UnifiedState,
    makePopoutDraggable,
    makeElementResizable,
    generateThemeStyles,
    applyThemeToPopoutWidget,
    stopInventoryCounter,
    getCachedTabContent,
    contentGetters,
    handlerSetups
  } = deps;

  // Check if this widget is already open - if so, close it
  const existingPopout = targetDocument.querySelector(`.mgh-popout[data-tab="${tabName}"]`);
  if (existingPopout) {
    UnifiedState.data.popouts.widgets.delete(tabName); // Clean up tracking
    existingPopout.remove();
    return;
  }

  const popout = targetDocument.createElement('div');
  popout.className = 'mgh-popout';
  popout.dataset.tab = tabName; // Store tab name for toggle detection
  popout.style.top = '100px';
  popout.style.left = '100px';

  const header = targetDocument.createElement('div');
  header.className = 'mgh-popout-header';
  header.innerHTML = `
        <span>${tabName.charAt(0).toUpperCase() + tabName.slice(1)}</span>
        <span style="cursor: pointer; margin-left: auto; padding: 0 8px; font-size: 20px;">×</span>
    `;

  // Shared cleanup function for both X button and ESC key
  let escHandler = null; // Will be defined later
  const closePopout = () => {
    // Cleanup for shop popout
    if (tabName === 'shop') {
      stopInventoryCounter();
    }
    UnifiedState.data.popouts.widgets.delete(tabName);
    popout.remove();
    // Remove ESC key listener if it was added
    if (escHandler) {
      targetDocument.removeEventListener('keydown', escHandler);
    }
  };

  const closeBtn = header.querySelector('span:last-child');
  closeBtn.addEventListener('click', closePopout);

  const body = targetDocument.createElement('div');
  body.className = 'mgh-popout-body';

  // Create content container
  const contentEl = targetDocument.createElement('div');
  contentEl.id = 'mga-tab-content';
  body.appendChild(contentEl);

  popout.appendChild(header);
  popout.appendChild(body);

  // Make draggable
  makePopoutDraggable(deps, popout, header);

  // Render content BEFORE appending (so theme can see it)
  const prevTab = UnifiedState.activeTab;
  UnifiedState.activeTab = tabName;

  // Get the content element we just created
  const popoutContent = popout.querySelector('#mga-tab-content');

  // Generate content based on tab
  switch (tabName) {
    case 'pets':
      popoutContent.innerHTML = contentGetters.getPetsTabContent();
      handlerSetups.setupPetsTabHandlers(popout); // Pass popout context
      break;
    case 'abilities':
      popoutContent.innerHTML = contentGetters.getAbilitiesTabContent();
      handlerSetups.setupAbilitiesTabHandlers(popout);
      handlerSetups.updateAbilityLogDisplay(popout);
      break;
    case 'seeds':
      popoutContent.innerHTML = contentGetters.getSeedsTabContent();
      handlerSetups.setupSeedsTabHandlers(popout); // Pass popout context
      break;
    case 'shop':
      popoutContent.innerHTML = contentGetters.getShopTabContent();
      handlerSetups.setupShopTabHandlers(popout); // Pass popout context
      break;
    case 'values':
      popoutContent.innerHTML = contentGetters.getValuesTabContent();
      handlerSetups.setupValuesTabHandlers(popout); // Pass popout context
      break;
    case 'timers':
      popoutContent.innerHTML = contentGetters.getTimersTabContent();
      break;
    case 'rooms':
      popoutContent.innerHTML = contentGetters.getRoomStatusTabContent();
      handlerSetups.setupRoomJoinButtons(popout); // Pass popout context
      break;
    case 'tools':
      popoutContent.innerHTML = getCachedTabContent(deps, 'tools', contentGetters.getToolsTabContent);
      break;
    case 'settings':
      popoutContent.innerHTML = getCachedTabContent(deps, 'settings', contentGetters.getSettingsTabContent);
      handlerSetups.setupSettingsTabHandlers(popout); // Pass popout context
      break;
    case 'hotkeys':
      popoutContent.innerHTML = getCachedTabContent(deps, 'hotkeys', contentGetters.getHotkeysTabContent);
      handlerSetups.setupHotkeysTabHandlers(popout); // Pass popout context
      break;
    case 'notifications':
      popoutContent.innerHTML = getCachedTabContent(deps, 'notifications', contentGetters.getNotificationsTabContent);
      handlerSetups.setupNotificationsTabHandlers(popout); // Pass popout context
      break;
    case 'protect':
      popoutContent.innerHTML = getCachedTabContent(deps, 'protect', contentGetters.getProtectTabContent);
      // Wait for browser to parse HTML before attaching handlers
      requestAnimationFrame(() => {
        handlerSetups.setupProtectTabHandlers(popout); // Pass popout context
      });
      break;
    case 'help':
      popoutContent.innerHTML = getCachedTabContent(deps, 'help', contentGetters.getHelpTabContent);
      break;
  }

  UnifiedState.activeTab = prevTab; // Restore previous tab

  // NOW append to DOM
  targetDocument.body.appendChild(popout);

  // Apply theme to widget AFTER content is rendered
  const popoutThemeStyles = generateThemeStyles(UnifiedState.data.settings, true);
  if (popoutThemeStyles) {
    applyThemeToPopoutWidget(popout, popoutThemeStyles);
  }

  // Add ESC key handler to close popout
  escHandler = e => {
    if (e.key === 'Escape') {
      closePopout();
    }
  };
  targetDocument.addEventListener('keydown', escHandler);

  // Make resizable LAST
  makeElementResizable(popout, {
    minWidth: 320,
    minHeight: 200,
    maxWidth: 800,
    maxHeight: 900,
    handleSize: 14,
    showHandleOnHover: true
  });

  // Track widget for theme updates
  UnifiedState.data.popouts.widgets.set(tabName, popout);
}

/**
 * makePopoutDraggable - Makes a popout widget draggable
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document (for global event listeners)
 * @param {HTMLElement} popout - The popout element
 * @param {HTMLElement} handle - The drag handle element
 */
function makePopoutDraggable(deps, popout, handle) {
  const { targetDocument } = deps;
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  // Shared drag start logic
  const startDrag = (clientX, clientY, event) => {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    const rect = popout.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    handle.style.cursor = 'grabbing';
    event.preventDefault(); // Prevent text selection during drag
  };

  // Shared drag move logic
  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    popout.style.left = startLeft + deltaX + 'px';
    popout.style.top = startTop + deltaY + 'px';
  };

  // Shared drag end logic
  const endDrag = () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';
    }
  };

  // Mouse event handlers
  handle.addEventListener('mousedown', e => {
    startDrag(e.clientX, e.clientY, e);
  });

  targetDocument.addEventListener('mousemove', e => {
    handleDragMove(e.clientX, e.clientY);
  });

  targetDocument.addEventListener('mouseup', () => {
    endDrag();
  });

  // Touch event handlers
  handle.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY, e);
      }
    },
    { passive: false }
  );

  targetDocument.addEventListener(
    'touchmove',
    e => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
        e.preventDefault(); // Prevent scrolling while dragging
      }
    },
    { passive: false }
  );

  targetDocument.addEventListener('touchend', () => {
    endDrag();
  });

  targetDocument.addEventListener('touchcancel', () => {
    endDrag();
  });
}

/**
 * openTabInSeparateWindow - Opens a tab in a separate browser window
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.productionWarn - Production warning function
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.trackPopoutWindow - Function to track popout windows
 * @param {Object} deps.contentGetters - Object containing content getter functions
 * @param {Object} deps.handlerSetups - Object containing handler setup functions
 * @param {string} deps.UNIFIED_STYLES - Unified CSS styles
 * @param {string} tabName - Name of the tab
 */
function openTabInSeparateWindow(deps, tabName) {
  const {
    UnifiedState,
    productionLog,
    productionWarn,
    debugLog,
    trackPopoutWindow,
    contentGetters,
    handlerSetups,
    UNIFIED_STYLES
  } = deps;

  productionLog(`🔗 Opening ${tabName} tab in pop-out window...`);

  const tabTitles = {
    pets: '🐾 Pet Loadouts',
    abilities: '⚡ Abilities',
    seeds: '🌱 Seeds',
    values: '💰 Values',
    timers: '⏰ Timers',
    rooms: '🎮 Rooms',
    settings: '⚙️ Settings'
  };

  const title = `MGTools - ${tabTitles[tabName] || tabName}`;

  // Calculate window size based on tab content
  const windowFeatures =
    'width=450,height=550,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';

  const popoutWindow = window.open('', `mga_popout_${tabName}`, windowFeatures);

  if (!popoutWindow) {
    productionWarn('⚠️ Pop-out blocked! Please allow popups for this site.');
    return;
  }

  // Track the popout window for cleanup
  trackPopoutWindow(popoutWindow);

  // Store window reference in Map for real-time updates
  UnifiedState.data.popouts.windows.set(tabName, popoutWindow);

  // Add cleanup listener to remove from Map when window closes
  popoutWindow.addEventListener('beforeunload', () => {
    UnifiedState.data.popouts.windows.delete(tabName);
    debugLog('POPOUT_LIFECYCLE', `Removed ${tabName} from windows Map`);
  });

  // Get tab content based on tab name
  let content = '';
  switch (tabName) {
    case 'pets':
      content = contentGetters.getPetsPopoutContent();
      break;
    case 'abilities':
      content = contentGetters.getAbilitiesTabContent();
      break;
    case 'seeds':
      content = contentGetters.getSeedsTabContent();
      break;
    case 'shop':
      content = contentGetters.getShopTabContent();
      break;
    case 'values':
      content = contentGetters.getValuesTabContent();
      break;
    case 'timers':
      content = contentGetters.getTimersTabContent();
      break;
    case 'tools':
      content = contentGetters.getToolsTabContent();
      break;
    case 'rooms':
      content = contentGetters.getRoomStatusTabContent();
      break;
    case 'settings':
      content = contentGetters.getSettingsTabContent();
      break;
    case 'help':
      content = contentGetters.getHelpTabContent();
      break;
    default:
      content = '<p>Tab content not available</p>';
  }

  // Get current theme for pop-out window
  const currentTheme = UnifiedState.currentTheme || deps.generateThemeStyles();

  // Create pop-out window HTML with dynamic theming
  const popoutHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        ${UNIFIED_STYLES}
        body {
            margin: 0;
            padding: 16px;
            background: ${currentTheme.background};
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            --panel-scale: 1;
            --base-font-size: 13px;
            --responsive-font-size: calc(var(--base-font-size) * var(--panel-scale));
            font-size: var(--responsive-font-size);
        }

        /* Removed universal font scaling to prevent oversized popout UI */
        .popout-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.57);
            flex-wrap: wrap;
            gap: 10px;
        }
        .popout-title {
            font-size: 18px;
            font-weight: 600;
            color: #4a9eff;
            flex-shrink: 0;
            min-width: 150px;
        }
        .popout-sync-notice {
            font-size: 12px;
            color: #888;
            font-style: italic;
            flex: 1 1 auto;
            text-align: center;
            min-width: 200px;
        }
        .refresh-btn {
            padding: 6px 12px;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex-shrink: 0;
        }
        .refresh-btn:hover {
            background: #3a8eef;
        }
    </style>
</head>
<body>
    <div class="popout-header">
        <div class="popout-title">${title}</div>
        <div class="popout-sync-notice">Note: This is a static snapshot. Click refresh to update.</div>
        <button class="refresh-btn" onclick="refreshPopoutContent('\${tabName}')">🔄 Refresh</button>
    </div>
    <div id="popout-content">${content}</div>
    <script>
        // Store reference to main window
        const mainWindow = window.opener;

        function refreshPopoutContent(tabName) {
            if (!mainWindow || mainWindow.closed) {
                console.warn('⚠️ Main window is closed. Cannot refresh content.');
                return;
            }

            // Get fresh content from main window
            let freshContent = '';
            switch(tabName) {
                case 'pets':
                    freshContent = mainWindow.MGA_Internal?.getPetsPopoutContent ? mainWindow.MGA_Internal?.getPetsPopoutContent() : 'Content unavailable';
                    break;
                case 'abilities':
                    freshContent = mainWindow.MGA_Internal?.getAbilitiesTabContent ? mainWindow.MGA_Internal?.getAbilitiesTabContent() : 'Content unavailable';
                    break;
                case 'seeds':
                    freshContent = mainWindow.MGA_Internal?.getSeedsTabContent ? mainWindow.MGA_Internal?.getSeedsTabContent() : 'Content unavailable';
                    break;
                case 'shop':
                    freshContent = mainWindow.MGA_Internal?.getShopTabContent ? mainWindow.MGA_Internal?.getShopTabContent() : 'Content unavailable';
                    break;
                case 'values':
                    freshContent = mainWindow.MGA_Internal?.getValuesTabContent ? mainWindow.MGA_Internal?.getValuesTabContent() : 'Content unavailable';
                    break;
                case 'timers':
                    freshContent = mainWindow.MGA_Internal?.getTimersTabContent ? mainWindow.MGA_Internal?.getTimersTabContent() : 'Content unavailable';
                    break;
                case 'tools':
                    freshContent = mainWindow.MGA_Internal?.getToolsTabContent ? mainWindow.MGA_Internal?.getToolsTabContent() : 'Content unavailable';
                    break;
                case 'rooms':
                    freshContent = mainWindow.MGA_Internal?.getRoomStatusTabContent ? mainWindow.MGA_Internal?.getRoomStatusTabContent() : 'Content unavailable';
                    break;
                case 'settings':
                    freshContent = mainWindow.MGA_Internal?.getSettingsTabContent ? mainWindow.MGA_Internal?.getSettingsTabContent() : 'Content unavailable';
                    break;
            }

            document.getElementById('popout-content').innerHTML = freshContent;

            // Rerun handlers if needed
            if (tabName === 'abilities' && mainWindow.setupAbilitiesTabHandlers) {
                mainWindow.setupAbilitiesTabHandlers.call(mainWindow);
                if (mainWindow.updateAbilityLogDisplay) {
                    mainWindow.updateAbilityLogDisplay.call(mainWindow);
                }
            } else if (tabName === 'pets') {
                // For pets popout, use special popout handlers instead of main tab handlers
                if (mainWindow.setupPetPopoutHandlers) {
                    mainWindow.setupPetPopoutHandlers.call(mainWindow, document);
                }
            } else if (tabName === 'seeds' && mainWindow.setupSeedsTabHandlers) {
                mainWindow.setupSeedsTabHandlers.call(mainWindow, document);
            } else if (tabName === 'values' && mainWindow.resourceDashboard) {
                mainWindow.resourceDashboard.setupDashboardHandlers(document);
            } else if (tabName === 'settings' && mainWindow.setupSettingsTabHandlers) {
                mainWindow.setupSettingsTabHandlers.call(mainWindow, document);
            } else if (tabName === 'rooms' && mainWindow.setupRoomJoinButtons) {
                mainWindow.setupRoomJoinButtons.call(mainWindow);
            }

            console.log('Pop-out content refreshed for:', tabName);
        }

        // Expose refresh function on window object for external access
        window.refreshPopoutContent = refreshPopoutContent;

        // Store the tab name for this popup window
        const currentTabName = '\${tabName}';

        // Auto-refresh every 5 seconds for dynamic tabs
        if (['values', 'timers', 'rooms', 'abilities'].includes(currentTabName)) {
            // Use managed interval to prevent memory leaks
            if (window.opener && window.opener.setManagedInterval) {
                window.opener.setManagedInterval(
                    'popoutRefresh_' + currentTabName + '_' + Date.now(),
                    () => refreshPopoutContent(currentTabName),
                    5000
                );
            }
        }

        // Cleanup when window closes
        window.addEventListener('beforeunload', () => {
            console.log('Pop-out window closing for:', currentTabName);
        });
    </script>
</body>
</html>
        `;

  productionLog('🌱 [WINDOW DEBUG] Content being written to separate window:', {
    tabName,
    contentLength: content.length,
    htmlLength: popoutHTML.length,
    contentPreview: content.substring(0, 200)
  });

  popoutWindow.document.open();
  popoutWindow.document.write(popoutHTML);
  popoutWindow.document.close();

  // Set up handlers for the pop-out content
  setTimeout(() => {
    try {
      switch (tabName) {
        case 'abilities':
          // Note: Handlers won't work perfectly in pop-out due to cross-window limitations
          // Users should use refresh button for interactions
          break;
        case 'pets':
          handlerSetups.setupPetPopoutHandlers(popoutWindow.document);
          break;
        case 'seeds':
          handlerSetups.setupSeedsTabHandlers(popoutWindow.document);
          break;
        case 'shop':
          handlerSetups.setupShopTabHandlers(popoutWindow.document);
          break;
        case 'settings':
          handlerSetups.setupSettingsTabHandlers(popoutWindow.document);
          break;
        case 'tools':
          handlerSetups.setupToolsTabHandlers(popoutWindow.document);
          break;
        case 'rooms':
          handlerSetups.setupRoomJoinButtons();
          handlerSetups.setupRoomsTabButtons();
          break;
        case 'hotkeys':
          handlerSetups.setupHotkeysTabHandlers(popoutWindow.document);
          break;
        case 'notifications':
          handlerSetups.setupNotificationsTabHandlers(popoutWindow.document);
          break;
        case 'help':
          // Help tab doesn't need special handlers
          break;
      }
    } catch (error) {
      productionWarn('Could not set up pop-out handlers:', error);
    }
  }, 100);

  productionLog(`✅ Pop-out window opened for ${tabName} tab`);
}

/**
 * getContentForTab - Gets content for a specific tab
 * @param {Object} deps - Dependencies
 * @param {Object} deps.contentGetters - Object containing content getter functions
 * @param {string} tabName - Name of the tab
 * @param {boolean} isPopout - Whether this is for a popout (uses different content for pets)
 * @returns {string} HTML content for the tab
 */
function getContentForTab(deps, tabName, isPopout = false) {
  const { contentGetters } = deps;

  switch (tabName) {
    case 'pets':
      return isPopout ? contentGetters.getPetsPopoutContent() : contentGetters.getPetsTabContent();
    case 'abilities':
      return contentGetters.getAbilitiesTabContent();
    case 'seeds':
      return contentGetters.getSeedsTabContent();
    case 'shop':
      return contentGetters.getShopTabContent();
    case 'values':
      return contentGetters.getValuesTabContent();
    case 'timers':
      return contentGetters.getTimersTabContent();
    case 'rooms':
      return contentGetters.getRoomStatusTabContent();
    case 'tools':
      return contentGetters.getToolsTabContent();
    case 'settings':
      return contentGetters.getSettingsTabContent();
    case 'hotkeys':
      return contentGetters.getHotkeysTabContent();
    case 'notifications':
      return contentGetters.getNotificationsTabContent();
    default:
      return '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">Content not available</div>';
  }
}

/**
 * setupOverlayHandlers - Sets up event handlers for overlay content
 * @param {Object} deps - Dependencies
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Object} deps.handlerSetups - Object containing handler setup functions
 * @param {HTMLElement} overlay - The overlay element
 * @param {string} tabName - Name of the tab
 */
function setupOverlayHandlers(deps, overlay, tabName) {
  const { debugLog, debugError, UnifiedState, handlerSetups } = deps;

  try {
    debugLog('HANDLER_SETUP', `Setting up handlers for content-only overlay ${tabName}`, {
      overlayId: overlay.id
    });

    switch (tabName) {
      case 'abilities':
        handlerSetups.setupAbilitiesTabHandlers(overlay);
        if (overlay) {
          handlerSetups.updateAbilityLogDisplay(overlay);
          debugLog('ABILITY_LOGS', 'Populated ability logs for content-only overlay', {
            logCount: UnifiedState.data.petAbilityLogs.length
          });
        }
        break;
      case 'pets':
        handlerSetups.setupPetPopoutHandlers(overlay); // Use popout handlers for overlays
        break;
      case 'seeds':
        handlerSetups.setupSeedsTabHandlers(overlay);
        break;
      case 'shop':
        handlerSetups.setupShopTabHandlers(overlay);
        break;
      case 'settings':
        handlerSetups.setupSettingsTabHandlers(overlay);
        break;
      case 'tools':
        handlerSetups.setupToolsTabHandlers(overlay);
        break;
      case 'rooms':
        handlerSetups.setupRoomJoinButtons();
        handlerSetups.setupRoomsTabButtons();
        break;
      case 'hotkeys':
        handlerSetups.setupHotkeysTabHandlers(overlay);
        break;
      case 'notifications':
        handlerSetups.setupNotificationsTabHandlers(overlay);
        break;
    }
  } catch (error) {
    debugError('HANDLER_SETUP', 'Failed to set up content-only overlay handlers', error, {
      tabName,
      overlayId: overlay?.id
    });
  }
}

/**
 * createInGameOverlay - Creates a content-only in-game overlay (no header/chrome)
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.getGameViewport - Function to get game viewport
 * @param {Function} deps.findOptimalPosition - Function to find optimal position
 * @param {Function} deps.generateThemeStyles - Function to generate theme styles
 * @param {Function} deps.makeEntireOverlayDraggable - Function to make overlay draggable
 * @param {Function} deps.addResizeHandleToOverlay - Function to add resize handle
 * @param {Function} deps.loadOverlayPosition - Function to load saved position
 * @param {Function} deps.loadOverlayDimensions - Function to load saved dimensions
 * @param {Function} deps.getContentForTab - Function to get tab content
 * @param {Function} deps.setupOverlayHandlers - Function to setup handlers
 * @param {Function} deps.closeInGameOverlay - Function to close overlay
 * @param {string} tabName - Name of the tab
 * @returns {HTMLElement|null} The created overlay element or null if toggled off
 */
function createInGameOverlay(deps, tabName) {
  const {
    targetDocument,
    UnifiedState,
    debugLog,
    productionLog,
    getGameViewport,
    findOptimalPosition,
    generateThemeStyles,
    makeEntireOverlayDraggable,
    addResizeHandleToOverlay,
    loadOverlayPosition,
    loadOverlayDimensions,
    closeInGameOverlay
  } = deps;

  debugLog('OVERLAY_LIFECYCLE', `Creating content-only overlay for ${tabName} tab`);

  // Check if overlay already exists - toggle visibility
  if (UnifiedState.data.popouts.overlays.has(tabName)) {
    const existingOverlay = UnifiedState.data.popouts.overlays.get(tabName);
    if (existingOverlay && targetDocument.contains(existingOverlay)) {
      // Toggle: if visible, remove it; if hidden, show it
      if (existingOverlay.style.display !== 'none') {
        existingOverlay.remove();
        UnifiedState.data.popouts.overlays.delete(tabName);
        debugLog('OVERLAY_LIFECYCLE', `Toggled OFF: ${tabName} overlay removed`);
        return null;
      } else {
        existingOverlay.style.display = 'block';
        existingOverlay.style.zIndex = '999999';
        debugLog('OVERLAY_LIFECYCLE', `Toggled ON: ${tabName} overlay shown`);
        return existingOverlay;
      }
    }
  }

  // Create content-only overlay container - NO HEADER, NO DECORATIONS
  const overlay = targetDocument.createElement('div');
  overlay.className = 'mga-overlay-content-only mga-scrollable';
  overlay.id = `mga-overlay-${tabName}`;

  // SMART POSITIONING - Avoid overlapping with existing overlays
  const gameViewport = getGameViewport(deps);
  const smartPosition = findOptimalPosition(deps, tabName, gameViewport);

  // PURE CONTENT DESIGN with PROPER RESIZING - Perfect match to target image (NO CHROME)
  overlay.style.cssText = `
        position: fixed;
        top: ${smartPosition.top}px;
        left: ${smartPosition.left}px;
        width: 240px;
        height: 300px;
        min-height: 120px;
        max-height: 500px;
        padding: 10px 12px;
        color: #ffffff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        z-index: 999998;
        overflow-y: auto;
        min-width: 180px;
        max-width: 450px;
        user-select: none;
        border-radius: 4px;
        backdrop-filter: blur(10px);
        cursor: grab;
        will-change: width, height, transform;
    `;

  // Apply theme - clean background with textures support
  const popoutTheme = generateThemeStyles(UnifiedState.data.settings, true);

  // Layer texture over gradient if texture is enabled (same logic as applyThemeToElement)
  if (popoutTheme.texturePattern) {
    overlay.style.background = `${popoutTheme.texturePattern}, ${popoutTheme.background}`;
    overlay.style.backgroundSize = `${popoutTheme.textureBackgroundSize}, cover`;
    overlay.style.backgroundBlendMode = `${popoutTheme.textureBlendMode}, normal`;
  } else {
    overlay.style.background = popoutTheme.background;
    overlay.style.backgroundBlendMode = '';
  }

  // Invisible scrollbars are now handled by the mga-scrollable class

  debugLog('POP_OUT_DESIGN', `Applied content-only theme for ${tabName}`, {
    background: popoutTheme.background,
    dimensions: `${overlay.style.width} x ${overlay.style.height}`
  });

  // NO HEADER - Content only design matching target image
  // Add simple close functionality via right-click context menu or ESC key

  // Add keyboard shortcut for closing (ESC key)
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      debugLog('POP_OUT_DESIGN', `Closing overlay ${tabName} via ESC key`);
      closeInGameOverlay(deps, tabName);
    }
  });

  // Make overlay focusable for keyboard events
  overlay.tabIndex = -1;
  overlay.focus();

  // INVISIBLE DRAGGING - No chrome, entire overlay is draggable
  // Add subtle visual feedback on hover (skip for pets popouts to prevent stutter)
  overlay.addEventListener('mouseenter', () => {
    if (
      !overlay.hasAttribute('data-dragging') &&
      !overlay.id.includes('mga-pets-popout') &&
      !overlay.id.includes('pets')
    ) {
      overlay.style.transform = 'scale(1.005)';
      overlay.style.transition = 'transform 0.15s ease';
    }
  });

  overlay.addEventListener('mouseleave', () => {
    if (
      !overlay.hasAttribute('data-dragging') &&
      !overlay.id.includes('mga-pets-popout') &&
      !overlay.id.includes('pets')
    ) {
      overlay.style.transform = 'scale(1)';
    }
  });

  // Add content directly to overlay (no separate contentArea needed)
  // Add scrollbar styling for content-only design
  const contentHtml = `
        <style>
            /* TARGET IMAGE MATCH - Clean, readable styling */
            /* Section titles are now handled in the main visibility rules above */

            .mga-overlay-content-only .mga-section {
                margin: 0 !important;
                padding: 0 !important;
            }

            .mga-overlay-content-only .mga-value-row {
                display: flex !important;
                justify-content: space-between !important;
                margin: 3px 0 !important;
                padding: 2px 0 !important;
                line-height: 1.3 !important;
            }

            .mga-overlay-content-only .mga-value-label {
                font-size: 12px !important;
                color: rgba(255, 255, 255, 0.9) !important;
                font-weight: 400 !important;
                margin: 0 !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }

            .mga-overlay-content-only .mga-value-amount {
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #ffffff !important;
                margin: 0 !important;
                text-align: right;
                min-width: 50px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
            }

            /* HIGH CONTRAST TOTAL VALUE */
            .mga-overlay-content-only .mga-total-value {
                border-top: 1px solid rgba(255, 255, 255, 0.73) !important;
                margin-top: 6px !important;
                padding-top: 4px !important;
            }

            .mga-overlay-content-only .mga-total-value .mga-value-label {
                font-weight: 500 !important;
                color: rgba(255, 255, 255, 0.95) !important;
                font-size: 13px !important;
            }

            .mga-overlay-content-only .mga-total-value .mga-value-amount {
                font-size: 14px !important;
                font-weight: 700 !important;
                color: #ffff00 !important;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
            }

            /* Hide only truly unnecessary elements - KEEP buttons and checkboxes for functionality */
            .mga-overlay-content-only .mga-section-header,
            .mga-overlay-content-only .mga-input-group,
            .mga-overlay-content-only .mga-timer-controls {
                display: none !important;
            }

            /* Keep section titles visible but make them smaller */
            .mga-overlay-content-only .mga-section-title {
                display: block !important;
                font-size: 11px !important;
                margin-bottom: 4px !important;
            }

            /* Readable ability logs */
            .mga-overlay-content-only .mga-log-item {
                margin: 2px 0 !important;
                padding: 2px 0 !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                color: rgba(255, 255, 255, 0.9) !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }

            .mga-overlay-content-only .mga-log-time {
                font-size: 10px !important;
                color: rgba(255, 255, 255, 0.7) !important;
            }

            /* Readable pet loadouts */
            .mga-overlay-content-only .mga-pet-slot {
                margin: 2px 0 !important;
                padding: 3px !important;
                font-size: 11px !important;
                color: rgba(255, 255, 255, 0.9) !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }
        </style>
    `;

  // Get and add content directly to overlay - PURE CONTENT ONLY
  const contentHTML = getContentForTab(deps, tabName, true); // isPopout=true for overlays

  productionLog('🔍 [CONTENT DEBUG] Variables check:', {
    contentHtmlType: typeof contentHtml,
    contentHtmlLength: contentHtml?.length,
    contentHTMLType: typeof contentHTML,
    contentHTMLLength: contentHTML?.length,
    contentHtmlPreview: contentHtml?.substring(0, 100),
    contentHTMLPreview: contentHTML?.substring(0, 100)
  });

  // For ability logs, add a subtle drag indicator
  if (tabName === 'abilities') {
    const dragIndicator = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.57);">
                <div style="font-size: 11px; color: #4a9eff; font-weight: 600;">ABILITY LOGS</div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.4); cursor: grab;" title="Click and drag to move">⣿⣿ drag</div>
            </div>
        `;
    overlay.innerHTML = contentHtml + dragIndicator + contentHTML;
  } else {
    overlay.innerHTML = contentHtml + contentHTML;
  }

  productionLog('🌱 [OVERLAY DEBUG] Content inserted:', {
    tabName,
    contentLength: contentHTML.length,
    overlayHTML: overlay.innerHTML.substring(0, 200)
  });

  // Apply invisible dragging to entire overlay surface
  makeEntireOverlayDraggable(deps, overlay);

  // Add professional resize functionality
  addResizeHandleToOverlay(deps, overlay);

  // Load saved position and dimensions
  loadOverlayPosition(deps, overlay);
  loadOverlayDimensions(deps, overlay);

  debugLog('POP_OUT_DESIGN', `Content added to overlay for ${tabName}`, {
    hasContent: !!contentHTML
  });

  // Add to DOM and track
  targetDocument.body.appendChild(overlay);

  // After rendering notification checkboxes in widget, reload saved state
  if (tabName === 'notifications') {
    // Use already-loaded settings from UnifiedState (avoid double-load race condition)
    const notifications = UnifiedState.data?.settings?.notifications;
    if (notifications) {
      // Apply ability notification settings
      const abilityCheckbox = overlay.querySelector('#ability-notifications-enabled');
      if (abilityCheckbox) {
        abilityCheckbox.checked = notifications.abilityNotificationsEnabled || false;
      }

      // Apply category settings if category checkboxes exist
      if (notifications.watchedAbilityCategories) {
        Object.keys(notifications.watchedAbilityCategories).forEach(category => {
          const catCheckbox = overlay.querySelector(`#ability-cat-${category}`);
          if (catCheckbox) {
            catCheckbox.checked = notifications.watchedAbilityCategories[category];
          }
        });
      }

      // Apply individual ability checkboxes
      if (notifications.watchedAbilities) {
        const individualCheckboxes = overlay.querySelectorAll('.individual-ability-checkbox');
        individualCheckboxes.forEach(checkbox => {
          const abilityName = checkbox.dataset.abilityName;
          if (abilityName) {
            checkbox.checked = notifications.watchedAbilities.includes(abilityName);
          }
        });
      }

      productionLog(`✅ [WIDGET-STATE] Reloaded notification settings for ${tabName} widget`);
    }
  }
  UnifiedState.data.popouts.overlays.set(tabName, overlay);

  // Setup handlers for the content (now that overlay is in DOM)
  setTimeout(() => {
    setupOverlayHandlers(deps, overlay, tabName);
  }, 100);

  debugLog('OVERLAY_LIFECYCLE', `Content-only overlay created for ${tabName}`, {
    dimensions: `${overlay.style.width} x ${overlay.style.height}`,
    overlayId: overlay.id
  });

  return overlay;
}

/**
 * makeEntireOverlayDraggable - Makes the entire overlay surface draggable (invisible drag)
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.getGameViewport - Function to get game viewport
 * @param {Function} deps.saveOverlayPosition - Function to save overlay position
 * @param {HTMLElement} overlay - The overlay element
 */
function makeEntireOverlayDraggable(deps, overlay) {
  const { targetDocument, debugLog, getGameViewport, saveOverlayPosition } = deps;

  let isDragging = false;
  const dragOffset = { x: 0, y: 0 };
  let animationFrame = null;
  let dragStartTime = 0;

  debugLog('OVERLAY_LIFECYCLE', 'Setting up invisible dragging for entire overlay', {
    overlayId: overlay.id
  });

  overlay.addEventListener('mousedown', e => {
    // Don't start drag if clicking on interactive elements or resize handle
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'SELECT' ||
      e.target.closest('.mga-btn') ||
      e.target.classList.contains('mga-resize-handle')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    dragStartTime = Date.now();
    isDragging = false; // Start as false, will become true after movement threshold

    const rect = overlay.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
  });

  targetDocument.addEventListener('mousemove', e => {
    if (dragStartTime === 0) return;

    const timeDiff = Date.now() - dragStartTime;
    const mouseMoved = Math.abs(e.clientX - dragOffset.x) > 3 || Math.abs(e.clientY - dragOffset.y) > 3;

    // Start dragging after small movement threshold to prevent accidental drags
    if (!isDragging && mouseMoved && timeDiff > 50) {
      isDragging = true;
      overlay.setAttribute('data-dragging', 'true');

      // Professional drag start effects
      overlay.style.zIndex = '999999';
      overlay.style.transform = 'scale(1.02)';
      overlay.style.filter = 'brightness(1.1)';
      overlay.style.transition = 'transform 0.1s ease, filter 0.1s ease';
      overlay.classList.add('mga-dragging');
      targetDocument.body.style.userSelect = 'none';
      targetDocument.body.style.cursor = 'grabbing !important';

      debugLog('OVERLAY_LIFECYCLE', 'Started invisible dragging', { overlayId: overlay.id });
    }

    if (!isDragging) return;

    // Use RAF for smooth dragging performance
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(() => {
      const rect = overlay.getBoundingClientRect();
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Enhanced viewport constraints
      const gameViewport = getGameViewport(deps);

      const constrainedX = Math.max(gameViewport.left, Math.min(newX, gameViewport.right - rect.width));
      const constrainedY = Math.max(gameViewport.top, Math.min(newY, gameViewport.bottom - rect.height));

      overlay.style.left = constrainedX + 'px';
      overlay.style.top = constrainedY + 'px';
    });
  });

  targetDocument.addEventListener('mouseup', () => {
    if (dragStartTime > 0) {
      dragStartTime = 0;

      if (isDragging) {
        isDragging = false;
        overlay.removeAttribute('data-dragging');
        overlay.classList.remove('mga-dragging');

        // Professional drag end effects
        overlay.style.transform = 'scale(1)';
        overlay.style.filter = 'brightness(1)';
        overlay.style.zIndex = '999998';
        overlay.style.transition = 'transform 0.2s ease, filter 0.2s ease';

        targetDocument.body.style.userSelect = '';
        targetDocument.body.style.cursor = '';

        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }

        // Save position to localStorage
        saveOverlayPosition(deps, overlay.id, {
          left: overlay.style.left,
          top: overlay.style.top
        });

        debugLog('OVERLAY_LIFECYCLE', 'Finished invisible dragging', {
          overlayId: overlay.id,
          position: { left: overlay.style.left, top: overlay.style.top }
        });
      }
    }
  });
}

/**
 * getGameViewport - Gets the game viewport boundaries
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @returns {Object} Viewport boundaries {top, left, right, bottom}
 */
function getGameViewport(deps) {
  const { targetDocument } = deps;

  // Try to find the game container or use window as fallback
  const gameContainer =
    targetDocument.querySelector('#game-container, #app, .game-wrapper, main') || targetDocument.body;
  const rect = gameContainer.getBoundingClientRect();

  return {
    top: Math.max(0, rect.top),
    left: Math.max(0, rect.left),
    right: Math.min(window.innerWidth, rect.right),
    bottom: Math.min(window.innerHeight, rect.bottom)
  };
}

/**
 * addResizeHandleToOverlay - Adds resize functionality to an overlay
 * @param {Object} deps - Dependencies
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.makeElementResizable - Function to make element resizable
 * @param {Function} deps.MGA_loadJSON - Function to load JSON from storage
 * @param {Function} deps.MGA_saveJSON - Function to save JSON to storage
 * @param {HTMLElement} overlay - The overlay element
 */
function addResizeHandleToOverlay(deps, overlay) {
  const { productionLog, debugLog, makeElementResizable, MGA_loadJSON, MGA_saveJSON } = deps;

  productionLog('🔧 [RESIZE DEBUG] Adding resize handle to overlay:', overlay.id);
  debugLog('RESIZE', 'Adding resize handle to overlay', { overlayId: overlay.id });

  // Remove any existing resize handles first to prevent duplicates
  const existingHandle = overlay.querySelector('.mga-resize-handle');
  if (existingHandle) {
    existingHandle.remove();
    productionLog('🔧 [RESIZE DEBUG] Removed existing handle before adding new one');
  }

  // Use the unified resize system with overlay-specific options
  makeElementResizable(overlay, {
    minWidth: 180,
    minHeight: 120,
    maxWidth: 450,
    maxHeight: 500,
    showHandleOnHover: true
  });

  // Add save dimensions functionality
  const observer = new MutationObserver(() => {
    if (overlay.style.width && overlay.style.height) {
      saveOverlayDimensions(deps, overlay.id, {
        width: overlay.style.width,
        height: overlay.style.height
      });
    }
  });

  observer.observe(overlay, {
    attributes: true,
    attributeFilter: ['style']
  });

  // Store observer for cleanup later if needed
  overlay._resizeObserver = observer;
}

/**
 * saveOverlayDimensions - Saves overlay dimensions to localStorage
 * @param {Object} deps - Dependencies
 * @param {Function} deps.MGA_loadJSON - Function to load JSON from storage
 * @param {Function} deps.MGA_saveJSON - Function to save JSON to storage
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {string} overlayId - The overlay ID
 * @param {Object} dimensions - Dimensions {width, height}
 */
function saveOverlayDimensions(deps, overlayId, dimensions) {
  const { MGA_loadJSON, MGA_saveJSON, debugLog, debugError } = deps;

  try {
    const savedDimensions = MGA_loadJSON('MGA_overlayDimensions', {});
    savedDimensions[overlayId] = dimensions;
    MGA_saveJSON('MGA_overlayDimensions', savedDimensions);

    debugLog('OVERLAY_LIFECYCLE', 'Saved overlay dimensions', {
      overlayId,
      dimensions
    });
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to save overlay dimensions', error, {
      overlayId,
      dimensions
    });
  }
}

/**
 * loadOverlayDimensions - Loads saved overlay dimensions from localStorage
 * @param {Object} deps - Dependencies
 * @param {Function} deps.MGA_loadJSON - Function to load JSON from storage
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Function} deps.applyResponsiveTextScaling - Function to apply responsive scaling
 * @param {HTMLElement} overlay - The overlay element
 */
function loadOverlayDimensions(deps, overlay) {
  const { MGA_loadJSON, debugLog, debugError, applyResponsiveTextScaling } = deps;

  try {
    const savedDimensions = MGA_loadJSON('MGA_overlayDimensions', {});
    const dimensions = savedDimensions[overlay.id];

    if (dimensions && dimensions.width && dimensions.height) {
      const width = parseInt(dimensions.width);
      const height = parseInt(dimensions.height);

      if (!isNaN(width) && !isNaN(height)) {
        overlay.style.width = dimensions.width;
        overlay.style.height = dimensions.height;

        // Apply responsive scaling for the loaded dimensions
        applyResponsiveTextScaling(overlay, width, height);

        debugLog('OVERLAY_LIFECYCLE', 'Restored overlay dimensions', {
          overlayId: overlay.id,
          dimensions
        });
      }
    }
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to load overlay dimensions', error, {
      overlayId: overlay.id
    });
  }
}

/**
 * findOptimalPosition - Finds optimal position for overlay avoiding collisions
 * @param {Object} deps - Dependencies
 * @param {Function} deps.MGA_loadJSON - Function to load JSON from storage
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.hasCollisionAtPosition - Function to check collisions
 * @param {Function} deps.findPositionInZone - Function to find position in zone
 * @param {string} tabName - Name of the tab
 * @param {Object} gameViewport - Game viewport boundaries
 * @returns {Object} Position {left, top}
 */
function findOptimalPosition(deps, tabName, gameViewport) {
  const { MGA_loadJSON, debugLog, hasCollisionAtPosition, findPositionInZone } = deps;

  const overlayWidth = 240;
  const overlayHeight = 140;
  const margin = 15;
  const mainHudBuffer = 20; // Buffer around main HUD
  const snapGrid = 10; // Snap to 10px increments

  // Check if we have a saved position first
  const savedPositions = MGA_loadJSON('MGA_overlayPositions', {});
  const savedPosition = savedPositions[`mga-overlay-${tabName}`];

  if (savedPosition) {
    const leftPx = parseInt(savedPosition.left);
    const topPx = parseInt(savedPosition.top);

    if (
      !isNaN(leftPx) &&
      !isNaN(topPx) &&
      leftPx >= gameViewport.left &&
      topPx >= gameViewport.top &&
      leftPx + overlayWidth <= gameViewport.right &&
      topPx + overlayHeight <= gameViewport.bottom
    ) {
      // Check for collisions with existing overlays and main HUD
      if (!hasCollisionAtPosition(deps, leftPx, topPx, overlayWidth, overlayHeight)) {
        debugLog('OVERLAY_LIFECYCLE', 'Using saved position with no collisions', {
          tabName,
          position: { left: leftPx, top: topPx }
        });
        return { left: leftPx, top: topPx };
      }
    }
  }

  // Define priority zones (in order of preference)
  const priorityZones = [
    // Zone 1: Right side of game viewport
    {
      name: 'rightSide',
      x: gameViewport.right - overlayWidth - margin,
      y: gameViewport.top + margin,
      maxX: gameViewport.right - margin,
      maxY: gameViewport.bottom - overlayHeight - margin,
      stepX: 0,
      stepY: overlayHeight + margin
    },
    // Zone 2: Left side if right is full
    {
      name: 'leftSide',
      x: gameViewport.left + margin,
      y: gameViewport.top + margin,
      maxX: gameViewport.left + overlayWidth + margin,
      maxY: gameViewport.bottom - overlayHeight - margin,
      stepX: 0,
      stepY: overlayHeight + margin
    },
    // Zone 3: Top area (cascade down)
    {
      name: 'topArea',
      x: gameViewport.left + margin + overlayWidth + margin,
      y: gameViewport.top + margin,
      maxX: gameViewport.right - overlayWidth - margin,
      maxY: gameViewport.top + overlayHeight * 3,
      stepX: overlayWidth + margin,
      stepY: 30
    },
    // Zone 4: Bottom area (cascade up)
    {
      name: 'bottomArea',
      x: gameViewport.left + margin,
      y: gameViewport.bottom - overlayHeight * 3,
      maxX: gameViewport.right - overlayWidth - margin,
      maxY: gameViewport.bottom - overlayHeight - margin,
      stepX: overlayWidth + margin,
      stepY: overlayHeight + margin
    }
  ];

  // Try each priority zone
  for (const zone of priorityZones) {
    const position = findPositionInZone(deps, zone, overlayWidth, overlayHeight, snapGrid, mainHudBuffer);
    if (position) {
      debugLog('OVERLAY_LIFECYCLE', `Found optimal position in ${zone.name}`, {
        tabName,
        position,
        zone: zone.name
      });
      return position;
    }
  }

  // Ultimate fallback with collision avoidance
  let fallbackX = gameViewport.left + margin;
  let fallbackY = gameViewport.top + margin;
  let attempts = 0;

  while (attempts < 20) {
    if (!hasCollisionAtPosition(deps, fallbackX, fallbackY, overlayWidth, overlayHeight)) {
      debugLog('OVERLAY_LIFECYCLE', 'Using fallback position (no collision found)', {
        tabName,
        position: { left: fallbackX, top: fallbackY },
        attempts
      });
      return { left: fallbackX, top: fallbackY };
    }
    fallbackX += 30;
    fallbackY += 30;
    attempts++;
  }

  // Last resort - just place it at margin
  debugLog('OVERLAY_LIFECYCLE', 'Using last resort position (all attempts had collisions)', {
    tabName,
    position: { left: margin, top: margin }
  });
  return { left: margin, top: margin };
}

/**
 * findPositionInZone - Finds a valid position within a zone
 * @param {Object} deps - Dependencies
 * @param {Function} deps.hasCollisionAtPosition - Function to check collisions
 * @param {Function} deps.overlapsMainHUD - Function to check HUD overlap
 * @param {Object} zone - Zone definition
 * @param {number} overlayWidth - Overlay width
 * @param {number} overlayHeight - Overlay height
 * @param {number} snapGrid - Grid snap size
 * @param {number} mainHudBuffer - Buffer around main HUD
 * @returns {Object|null} Position {left, top} or null if not found
 */
function findPositionInZone(deps, zone, overlayWidth, overlayHeight, snapGrid, mainHudBuffer) {
  const { hasCollisionAtPosition, overlapsMainHUD } = deps;

  let x = zone.x;
  let y = zone.y;

  while (y <= zone.maxY) {
    while (x <= zone.maxX) {
      // Snap to grid
      const snappedX = Math.round(x / snapGrid) * snapGrid;
      const snappedY = Math.round(y / snapGrid) * snapGrid;

      // Check bounds
      if (snappedX + overlayWidth <= zone.maxX && snappedY + overlayHeight <= zone.maxY) {
        // Check collisions with existing overlays and main HUD
        if (
          !hasCollisionAtPosition(deps, snappedX, snappedY, overlayWidth, overlayHeight) &&
          !overlapsMainHUD(deps, snappedX, snappedY, overlayWidth, overlayHeight)
        ) {
          return { left: snappedX, top: snappedY };
        }
      }

      x += zone.stepX || overlayWidth + 15;
      if (zone.stepX === 0) break; // Single column zone
    }
    x = zone.x;
    y += zone.stepY || 30;
  }

  return null;
}

/**
 * overlapsMainHUD - Checks if position overlaps with main HUD
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @returns {boolean} True if overlaps
 */
function overlapsMainHUD(deps, x, y, width, height) {
  const { targetDocument } = deps;

  const mainHUD = targetDocument.querySelector('.mga-panel');
  if (!mainHUD) return false;

  const mainHudRect = mainHUD.getBoundingClientRect();
  const buffer = 20; // 20px buffer around main HUD

  // Expand main HUD rect by buffer
  const expandedRect = {
    left: mainHudRect.left - buffer,
    top: mainHudRect.top - buffer,
    right: mainHudRect.right + buffer,
    bottom: mainHudRect.bottom + buffer
  };

  // Check for overlap
  return !(
    x + width < expandedRect.left ||
    x > expandedRect.right ||
    y + height < expandedRect.top ||
    y > expandedRect.bottom
  );
}

/**
 * hasCollisionAtPosition - Checks if position collides with existing overlays
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @returns {boolean} True if collision detected
 */
function hasCollisionAtPosition(deps, x, y, width, height) {
  const { targetDocument } = deps;

  const existingOverlays = Array.from(targetDocument.querySelectorAll('.mga-overlay-content-only'));
  const buffer = 5; // Minimum spacing between overlays

  for (const existingOverlay of existingOverlays) {
    const rect = existingOverlay.getBoundingClientRect();

    // Check for overlap with buffer
    if (
      !(
        x + width + buffer < rect.left ||
        x - buffer > rect.right ||
        y + height + buffer < rect.top ||
        y - buffer > rect.bottom
      )
    ) {
      return true; // Collision detected
    }
  }
  return false; // No collision
}

/**
 * saveOverlayPosition - Saves overlay position to localStorage
 * @param {Object} deps - Dependencies
 * @param {Function} deps.MGA_loadJSON - Function to load JSON from storage
 * @param {Function} deps.MGA_saveJSON - Function to save JSON to storage
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {string} overlayId - The overlay ID
 * @param {Object} position - Position {left, top}
 */
function saveOverlayPosition(deps, overlayId, position) {
  const { MGA_loadJSON, MGA_saveJSON, debugLog, debugError } = deps;

  try {
    const savedPositions = MGA_loadJSON('MGA_overlayPositions', {});
    savedPositions[overlayId] = position;
    MGA_saveJSON('MGA_overlayPositions', savedPositions);

    debugLog('OVERLAY_LIFECYCLE', 'Saved overlay position', {
      overlayId,
      position
    });
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to save overlay position', error, {
      overlayId,
      position
    });
  }
}

/**
 * loadOverlayPosition - Loads saved overlay position from localStorage
 * @param {Object} deps - Dependencies
 * @param {Function} deps.MGA_loadJSON - Function to load JSON from storage
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Function} deps.getGameViewport - Function to get game viewport
 * @param {HTMLElement} overlay - The overlay element
 */
function loadOverlayPosition(deps, overlay) {
  const { MGA_loadJSON, debugLog, debugError, getGameViewport } = deps;

  try {
    const savedPositions = MGA_loadJSON('MGA_overlayPositions', {});
    const position = savedPositions[overlay.id];

    if (position) {
      // Validate position is still within viewport
      const gameViewport = getGameViewport(deps);
      const leftPx = parseInt(position.left);
      const topPx = parseInt(position.top);

      if (
        !isNaN(leftPx) &&
        !isNaN(topPx) &&
        leftPx >= gameViewport.left &&
        topPx >= gameViewport.top &&
        leftPx < gameViewport.right &&
        topPx < gameViewport.bottom
      ) {
        overlay.style.left = position.left;
        overlay.style.top = position.top;

        debugLog('OVERLAY_LIFECYCLE', 'Restored overlay position', {
          overlayId: overlay.id,
          position
        });
      } else {
        debugLog('OVERLAY_LIFECYCLE', 'Saved position out of bounds, using default', {
          overlayId: overlay.id,
          savedPosition: position,
          viewport: gameViewport
        });
      }
    }
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to load overlay position', error, {
      overlayId: overlay.id
    });
  }
}

/**
 * closeInGameOverlay - Closes an in-game overlay
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document (for DOM queries)
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.updatePopoutButtonStateByTab - Function to update button state
 * @param {string} tabName - Name of the tab
 */
function closeInGameOverlay(deps, tabName) {
  const { targetDocument, UnifiedState, productionLog, updatePopoutButtonStateByTab } = deps;

  const overlay = UnifiedState.data.popouts.overlays.get(tabName);
  if (overlay && targetDocument.contains(overlay)) {
    overlay.remove();
  }
  UnifiedState.data.popouts.overlays.delete(tabName);

  // Update the corresponding pop-out button state
  updatePopoutButtonStateByTab(deps, tabName, false);

  productionLog(`🗑️ Closed in-game overlay for ${tabName} tab`);
}

/**
 * updatePopoutButtonStateByTab - Updates popout button state for a tab
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Function} deps.updatePopoutButtonState - Function to update button state
 * @param {string} tabName - Name of the tab
 * @param {boolean} isActive - Whether the popout is active
 */
function updatePopoutButtonStateByTab(deps, tabName, isActive) {
  const { targetDocument, updatePopoutButtonState } = deps;

  const popoutBtn = targetDocument.querySelector(`[data-popout="${tabName}"]`);
  if (popoutBtn) {
    updatePopoutButtonState(deps, popoutBtn, isActive);
  }
}

/**
 * updatePureOverlayContent - Updates content of a pure content overlay
 * @param {Object} deps - Dependencies
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Object} deps.contentGetters - Object containing content getter functions
 * @param {Function} deps.setupPureOverlayHandlers - Function to setup handlers
 * @param {Function} deps.addResizeHandleToOverlay - Function to add resize handle
 * @param {HTMLElement} overlay - The overlay element
 * @param {string} tabName - Name of the tab
 */
function updatePureOverlayContent(deps, overlay, tabName) {
  const { productionLog, debugLog, debugError, contentGetters, setupPureOverlayHandlers, addResizeHandleToOverlay } =
    deps;

  try {
    debugLog('OVERLAY_LIFECYCLE', `Updating pure overlay content for ${tabName}`, {
      overlayId: overlay.id
    });

    let content = '';
    switch (tabName) {
      case 'pets':
        content = contentGetters.getPetsPopoutContent(); // Use popout version for overlays too
        break;
      case 'abilities':
        content = contentGetters.getAbilitiesTabContent();
        break;
      case 'seeds':
        content = contentGetters.getSeedsTabContent();
        break;
      case 'values':
        content = contentGetters.getValuesTabContent();
        break;
      case 'timers':
        content = contentGetters.getTimersTabContent();
        break;
      case 'settings':
        content = contentGetters.getSettingsTabContent();
        break;
      default:
        content = '<p>Tab content not available</p>';
    }

    // Create the full content with styles (matching createInGameOverlay structure)
    const contentHtml = `
        <style>
            /* TARGET IMAGE MATCH - Clean, readable styling */
            /* Section titles are now handled in the main visibility rules above */

            .mga-overlay-content-only .mga-section {
                margin: 0 !important;
                padding: 0 !important;
            }

            .mga-overlay-content-only .mga-value-row {
                display: flex !important;
                justify-content: space-between !important;
                margin: 3px 0 !important;
                padding: 2px 0 !important;
                line-height: 1.3 !important;
            }

            .mga-overlay-content-only .mga-value-label {
                font-size: 12px !important;
                color: rgba(255, 255, 255, 0.9) !important;
                font-weight: 400 !important;
                margin: 0 !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }

            .mga-overlay-content-only .mga-value-amount {
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #ffffff !important;
                margin: 0 !important;
                text-align: right;
                min-width: 50px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
            }

            /* HIGH CONTRAST TOTAL VALUE */
            .mga-overlay-content-only .mga-total-value {
                border-top: 1px solid rgba(255, 255, 255, 0.73) !important;
                margin-top: 6px !important;
                padding-top: 4px !important;
            }

            .mga-overlay-content-only .mga-total-value .mga-value-label {
                font-weight: 500 !important;
                color: rgba(255, 255, 255, 0.95) !important;
                font-size: 13px !important;
            }

            .mga-overlay-content-only .mga-total-value .mga-value-amount {
                font-size: 14px !important;
                font-weight: 700 !important;
                color: #ffff00 !important;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
            }

            /* Hide only truly unnecessary elements - KEEP buttons and checkboxes for functionality */
            .mga-overlay-content-only .mga-section-header,
            .mga-overlay-content-only .mga-input-group,
            .mga-overlay-content-only .mga-timer-controls {
                display: none !important;
            }

            /* Keep section titles visible but make them smaller */
            .mga-overlay-content-only .mga-section-title {
                display: block !important;
                font-size: 11px !important;
                margin-bottom: 4px !important;
            }

            /* Readable ability logs */
            .mga-overlay-content-only .mga-log-item {
                margin: 2px 0 !important;
                padding: 2px 0 !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                color: rgba(255, 255, 255, 0.9) !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }

            .mga-overlay-content-only .mga-log-time {
                font-size: 10px !important;
                color: rgba(255, 255, 255, 0.7) !important;
            }

            /* Readable pet loadouts */
            .mga-overlay-content-only .mga-pet-slot {
                margin: 2px 0 !important;
                padding: 3px !important;
                font-size: 11px !important;
                color: rgba(255, 255, 255, 0.9) !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }
        </style>
    `;

    // Update overlay content
    productionLog('🔍 [PURE OVERLAY DEBUG] Variables check:', {
      contentHtmlType: typeof contentHtml,
      contentHtmlLength: contentHtml?.length,
      contentType: typeof content,
      contentLength: content?.length,
      contentHtmlPreview: contentHtml?.substring(0, 100),
      contentPreview: content?.substring(0, 100)
    });

    overlay.innerHTML = contentHtml + content;

    // Setup handlers for the overlay
    setupPureOverlayHandlers(deps, overlay, tabName);

    // Re-add resize handle after content update (since innerHTML replaces everything)
    setTimeout(() => {
      if (!overlay.querySelector('.mga-resize-handle')) {
        addResizeHandleToOverlay(deps, overlay);
        productionLog(`🔧 [RESIZE] Re-added missing resize handle to ${tabName} pure overlay`);
      }
    }, 50);
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to update pure overlay content', error, {
      tabName,
      overlayId: overlay.id
    });
  }
}

/**
 * setupPureOverlayHandlers - Sets up handlers for pure content overlays
 * @param {Object} deps - Dependencies
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Object} deps.handlerSetups - Object containing handler setup functions
 * @param {HTMLElement} overlay - The overlay element
 * @param {string} tabName - Name of the tab
 */
function setupPureOverlayHandlers(deps, overlay, tabName) {
  const { productionLog, debugLog, debugError, UnifiedState, handlerSetups } = deps;

  setTimeout(() => {
    try {
      productionLog(`🔧 [HANDLER-SETUP] Setting up handlers for ${tabName} overlay`);
      debugLog('HANDLER_SETUP', `Setting up pure overlay handlers for ${tabName}`, {
        overlayId: overlay.id
      });

      switch (tabName) {
        case 'abilities':
          handlerSetups.setupAbilitiesTabHandlers(overlay);
          handlerSetups.updateAbilityLogDisplay(overlay);
          debugLog('ABILITY_LOGS', 'Set up ability logs for pure overlay', {
            logCount: UnifiedState.data.petAbilityLogs.length,
            overlayId: overlay.id
          });
          break;
        case 'pets':
          handlerSetups.setupPetPopoutHandlers(overlay); // Use popout handlers for overlays
          break;
        case 'seeds':
          handlerSetups.setupSeedsTabHandlers(overlay);
          break;
        case 'settings':
          handlerSetups.setupSettingsTabHandlers(overlay);
          break;
        case 'tools':
          handlerSetups.setupToolsTabHandlers(overlay);
          break;
        default:
          break;
      }
    } catch (error) {
      debugError('HANDLER_SETUP', 'Failed to set up pure overlay handlers', error, {
        tabName,
        overlayId: overlay.id
      });
    }
  }, 200); // Increased from 100ms to 200ms to ensure DOM is fully updated
}

/**
 * refreshOverlayContent - Refreshes content of an overlay
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document (for DOM queries)
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.updatePureOverlayContent - Function to update pure overlay
 * @param {Function} deps.updateOverlayContent - Function to update legacy overlay
 * @param {string} tabName - Name of the tab
 */
function refreshOverlayContent(deps, tabName) {
  const { targetDocument, UnifiedState, productionLog, updatePureOverlayContent, updateOverlayContent } = deps;

  const overlay = UnifiedState.data.popouts.overlays.get(tabName);
  if (overlay && targetDocument.contains(overlay)) {
    // Handle pure content overlays (no .mga-overlay-content wrapper)
    if (overlay.className.includes('mga-overlay-content-only')) {
      updatePureOverlayContent(deps, overlay, tabName);
      productionLog(`🔄 Refreshed pure overlay content for ${tabName} tab`);
    } else {
      // LEGACY: Handle old overlay structure if it exists
      const contentArea = overlay.querySelector('.mga-overlay-content');
      if (contentArea) {
        updateOverlayContent(deps, contentArea, tabName);
        productionLog(`🔄 Refreshed legacy overlay content for ${tabName} tab`);
      }
    }
  }
}

/**
 * updateOverlayContent - Updates content of a legacy overlay (with header)
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Object} deps.contentGetters - Object containing content getter functions
 * @param {Object} deps.handlerSetups - Object containing handler setup functions
 * @param {HTMLElement} contentArea - The content area element
 * @param {string} tabName - Name of the tab
 */
function updateOverlayContent(deps, contentArea, tabName) {
  const { targetDocument, debugLog, debugError, UnifiedState, contentGetters, handlerSetups } = deps;

  let content = '';
  switch (tabName) {
    case 'pets':
      content = contentGetters.getPetsPopoutContent();
      break;
    case 'abilities':
      content = contentGetters.getAbilitiesTabContent();
      break;
    case 'seeds':
      content = contentGetters.getSeedsTabContent();
      break;
    case 'shop':
      content = contentGetters.getShopTabContent();
      break;
    case 'values':
      content = contentGetters.getValuesTabContent();
      break;
    case 'timers':
      content = contentGetters.getTimersTabContent();
      break;
    case 'tools':
      content = contentGetters.getToolsTabContent();
      break;
    case 'rooms':
      content = contentGetters.getRoomStatusTabContent();
      break;
    case 'settings':
      content = contentGetters.getSettingsTabContent();
      break;
    case 'help':
      content = contentGetters.getHelpTabContent();
      break;
    default:
      content = '<p>Tab content not available</p>';
  }

  // Clear existing content except styles
  const styles = contentArea.querySelector('style');
  contentArea.innerHTML = '';
  if (styles) contentArea.appendChild(styles);

  const contentDiv = targetDocument.createElement('div');
  contentDiv.innerHTML = content;
  contentArea.appendChild(contentDiv);

  // Setup handlers if needed
  setTimeout(() => {
    try {
      // Find the parent overlay element
      const parentOverlay = contentArea.closest('.mga-overlay') || contentArea.parentElement;
      debugLog('HANDLER_SETUP', `Setting up handlers for ${tabName}`, {
        overlayFound: !!parentOverlay,
        overlayClass: parentOverlay?.className,
        contentAreaClass: contentArea?.className
      });

      switch (tabName) {
        case 'abilities':
          handlerSetups.setupAbilitiesTabHandlers(parentOverlay);
          // Ensure ability logs are populated immediately
          if (parentOverlay) {
            handlerSetups.updateAbilityLogDisplay(parentOverlay);
            debugLog('ABILITY_LOGS', 'Populated ability logs for new overlay', {
              logCount: UnifiedState.data.petAbilityLogs.length,
              overlayId: parentOverlay?.id || 'no-id'
            });

            // Additional delayed refresh to ensure logs appear
            setTimeout(() => {
              handlerSetups.updateAbilityLogDisplay(parentOverlay);
              debugLog('ABILITY_LOGS', 'Secondary refresh for ability logs completed');
            }, 500);
          } else {
            debugError(
              'HANDLER_SETUP',
              'Could not find parent overlay for ability logs setup',
              new Error('Parent overlay not found'),
              { tabName, contentArea }
            );
          }
          break;
        case 'pets':
          handlerSetups.setupPetPopoutHandlers(parentOverlay); // Use popout handlers for overlays
          break;
        case 'seeds':
          handlerSetups.setupSeedsTabHandlers(parentOverlay);
          break;
        case 'shop':
          handlerSetups.setupShopTabHandlers(parentOverlay);
          break;
        case 'settings':
          handlerSetups.setupSettingsTabHandlers(parentOverlay);
          break;
        case 'notifications':
          handlerSetups.setupNotificationsTabHandlers(parentOverlay);
          break;
      }
    } catch (error) {
      debugError('HANDLER_SETUP', 'Failed to set up overlay handlers', error, {
        tabName,
        contentArea
      });
    }
  }, 100);
}

/**
 * toggleTabPopout - Toggles a tab popout (overlay or window based on settings)
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Document} deps.targetDocument - Target document (for DOM queries)
 * @param {Function} deps.debugLog - Debug logging function
 * @param {Function} deps.closeInGameOverlay - Function to close overlay
 * @param {Function} deps.createInGameOverlay - Function to create overlay
 * @param {Function} deps.openTabInSeparateWindow - Function to open separate window
 * @param {Function} deps.updatePopoutButtonState - Function to update button state
 * @param {string} tabName - Name of the tab
 * @param {HTMLElement} buttonElement - The button element that triggered the toggle
 */
function toggleTabPopout(deps, tabName, buttonElement) {
  const {
    UnifiedState,
    targetDocument,
    debugLog,
    closeInGameOverlay,
    createInGameOverlay,
    openTabInSeparateWindow,
    updatePopoutButtonState
  } = deps;

  const isOverlayMode = UnifiedState.data.settings.useInGameOverlays;

  if (isOverlayMode) {
    // Check if overlay already exists
    const existingOverlay = UnifiedState.data.popouts.overlays.get(tabName);

    if (existingOverlay && targetDocument.contains(existingOverlay)) {
      // CLOSE existing overlay
      closeInGameOverlay(deps, tabName);
      updatePopoutButtonState(deps, buttonElement, false);
      debugLog('OVERLAY_LIFECYCLE', `Toggled OFF: ${tabName} overlay closed`);
    } else {
      // OPEN new overlay
      createInGameOverlay(deps, tabName);
      updatePopoutButtonState(deps, buttonElement, true);
      debugLog('OVERLAY_LIFECYCLE', `Toggled ON: ${tabName} overlay opened`);
    }
  } else {
    // For separate windows, always open (can't easily detect if window is open)
    openTabInSeparateWindow(deps, tabName);
    updatePopoutButtonState(deps, buttonElement, true);
    debugLog('OVERLAY_LIFECYCLE', `Opened separate window for ${tabName}`);
  }
}

/**
 * updatePopoutButtonState - Updates visual state of a popout button
 * @param {Object} deps - Dependencies (not used but kept for consistency)
 * @param {HTMLElement} buttonElement - The button element
 * @param {boolean} isActive - Whether the popout is active
 */
function updatePopoutButtonState(deps, buttonElement, isActive) {
  if (isActive) {
    buttonElement.style.color = '#4CAF50';
    buttonElement.style.transform = 'scale(1.1)';
    buttonElement.style.opacity = '1';
    buttonElement.title = 'Click to close pop-out';
  } else {
    buttonElement.style.color = '';
    buttonElement.style.transform = '';
    buttonElement.style.opacity = '';
    buttonElement.title = 'Click to open in pop-out';
  }
}

/**
 * openTabInPopout - Legacy wrapper function for opening tab in popout
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.createInGameOverlay - Function to create overlay
 * @param {Function} deps.openTabInSeparateWindow - Function to open separate window
 * @param {string} tabName - Name of the tab
 * @returns {HTMLElement|Window} The created overlay or window
 */
function openTabInPopout(deps, tabName) {
  const { UnifiedState, createInGameOverlay, openTabInSeparateWindow } = deps;

  if (UnifiedState.data.settings.useInGameOverlays) {
    return createInGameOverlay(deps, tabName);
  } else {
    return openTabInSeparateWindow(deps, tabName);
  }
}

/**
 * refreshSeparateWindowPopouts - Refreshes content in separate window popouts
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.productionWarn - Production warning function
 * @param {Function} deps.debugError - Debug error logging function
 * @param {Function} deps.updateActivePetsFromRoomState - Function to update pets from room state
 * @param {string} tabName - Name of the tab to refresh
 */
function refreshSeparateWindowPopouts(deps, tabName) {
  const { UnifiedState, productionLog, productionWarn, debugError, updateActivePetsFromRoomState } = deps;

  try {
    UnifiedState.data.popouts.windows.forEach((windowRef, popoutTabName) => {
      if (windowRef && !windowRef.closed && popoutTabName === tabName) {
        // Force update pets data first for pets tab
        if (tabName === 'pets') {
          updateActivePetsFromRoomState();
        }

        // Trigger refresh in the separate window
        if (windowRef.refreshPopoutContent) {
          windowRef.refreshPopoutContent(tabName);
          productionLog(`🔄 [POPOUT] Refreshed ${tabName} window popout`);
        } else if (windowRef.location) {
          // Fallback: force reload if refresh function not available
          productionWarn(`⚠️ [POPOUT] No refresh function for ${tabName}, reloading window`);
          windowRef.location.reload();
        }
      }
    });
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to refresh separate window popouts', error, { tabName });
  }
}

/**
 * closeAllPopouts - Closes all popout windows and overlays
 * @param {Object} deps - Dependencies
 * @param {Document} deps.targetDocument - Target document
 * @param {Object} deps.UnifiedState - Global state object
 */
function closeAllPopouts(deps) {
  const { targetDocument, UnifiedState } = deps;

  targetDocument.querySelectorAll('.mga-overlay').forEach(overlay => {
    overlay.style.display = 'none';
  });

  // Close separate windows
  UnifiedState.popoutWindows.forEach(window => {
    try {
      window.close();
    } catch (e) {
      // Ignore errors closing windows
    }
  });
  UnifiedState.popoutWindows.clear();
}

/**
 * getPetsPopoutContent - Gets simplified pets content for popouts
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.calculateTimeUntilHungry - Function to calculate hunger time
 * @param {Function} deps.formatHungerTimer - Function to format hunger timer
 * @param {Function} deps.ensurePresetOrder - Function to ensure preset order
 * @returns {string} HTML content for pets popout
 */
function getPetsPopoutContent(deps) {
  const { UnifiedState, calculateTimeUntilHungry, formatHungerTimer, ensurePresetOrder } = deps;

  // Use multiple sources for pet data (same as updateActivePetsDisplay)
  const activePets = UnifiedState.atoms.activePets || window.activePets || [];
  const petPresets = UnifiedState.data.petPresets;

  if (Object.keys(petPresets).length === 0) {
    return `
            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Active Pets</div>
                <div class="mga-active-pets-display">
                    ${
                      activePets.length > 0
                        ? `
                        <div style="color: #93c5fd; font-size: 12px; margin-bottom: 4px;">Currently Equipped:</div>
                        <div class="mga-active-pets-list">
                            ${activePets
                              .map((p, index) => {
                                const timeUntilHungry = calculateTimeUntilHungry(p);
                                const timerText = formatHungerTimer(timeUntilHungry);
                                const timerColor =
                                  timeUntilHungry === null
                                    ? '#999'
                                    : timeUntilHungry <= 0
                                      ? '#8B0000'
                                      : timeUntilHungry < 5 * 60 * 1000
                                        ? '#ff4444'
                                        : timeUntilHungry < 15 * 60 * 1000
                                          ? '#ffa500'
                                          : '#4caf50';
                                return `
                                    <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                        <span class="mga-pet-badge">${p.petSpecies}</span>
                                        <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                    </div>
                                `;
                              })
                              .join('')}
                        </div>
                    `
                        : `
                        <div class="mga-empty-state">
                            <div class="mga-empty-state-icon">—</div>
                            <div class="mga-empty-state-description">No pets currently active</div>
                        </div>
                    `
                    }
                </div>
            </div>
            <div class="mga-section">
                <div class="mga-empty-state" style="padding: 40px 20px;">
                    <div class="mga-empty-state-icon">📋</div>
                    <div class="mga-empty-state-title">No Saved Presets</div>
                    <div class="mga-empty-state-description">
                        You haven't saved any pet loadout presets yet.<br>
                        Open the main HUD Pets tab to create presets from your current active pets.
                    </div>
                </div>
            </div>
        `;
  }

  let html = `
        <div class="mga-section">
            <div class="mga-section-title mga-pet-section-title">Active Pets</div>
            <div class="mga-active-pets-display">
                ${
                  activePets.length > 0
                    ? `
                    <div class="mga-active-pets-header">Currently Equipped:</div>
                    <div class="mga-active-pets-list">
                        ${activePets
                          .map((p, index) => {
                            const timeUntilHungry = calculateTimeUntilHungry(p);
                            const timerText = formatHungerTimer(timeUntilHungry);
                            const timerColor =
                              timeUntilHungry === null
                                ? '#999'
                                : timeUntilHungry <= 0
                                  ? '#8B0000'
                                  : timeUntilHungry < 5 * 60 * 1000
                                    ? '#ff4444'
                                    : timeUntilHungry < 15 * 60 * 1000
                                      ? '#ffa500'
                                      : '#4caf50';
                            return `
                                <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                    <span class="mga-pet-badge">${p.petSpecies}</span>
                                    <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                </div>
                            `;
                          })
                          .join('')}
                    </div>
                `
                    : `
                    <div class="mga-empty-state">
                        <div class="mga-empty-state-icon">—</div>
                        <div class="mga-empty-state-description">No pets currently active</div>
                    </div>
                `
                }
            </div>
        </div>

        <div class="mga-section">
            <div class="mga-section-title">Load Pet Preset</div>
    `;

  // Create clickable preset cards (consistent with main HUD structure) in order
  ensurePresetOrder();
  UnifiedState.data.petPresetsOrder.forEach(name => {
    if (petPresets[name]) {
      const pets = petPresets[name];
      const petList = pets.map(p => p.petSpecies).join(', ');
      html += `
                <div class="mga-preset mga-preset-clickable" data-preset="${name}">
                    <div class="mga-preset-header">
                        <span class="mga-preset-name">${name}</span>
                    </div>
                    <div class="mga-preset-pets">${petList}</div>
                </div>
            `;
    }
  });

  html += `</div>`;
  return html;
}

/**
 * setupPetPopoutHandlers - Sets up handlers specifically for pet popout preset buttons
 * @param {Object} deps - Dependencies
 * @param {Object} deps.UnifiedState - Global state object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.productionWarn - Production warning function
 * @param {Function} deps.safeSendMessage - Function to safely send messages
 * @param {Function} deps.updateActivePetsFromRoomState - Function to update pets from room state
 * @param {Function} deps.refreshSeparateWindowPopouts - Function to refresh window popouts
 * @param {Function} deps.updatePureOverlayContent - Function to update overlay content
 * @param {Function} deps.updateTabContent - Function to update tab content
 * @param {Document} context - Document context (default: document)
 */
function setupPetPopoutHandlers(deps, context = document) {
  const {
    UnifiedState,
    productionLog,
    productionWarn,
    safeSendMessage,
    updateActivePetsFromRoomState,
    refreshSeparateWindowPopouts,
    updatePureOverlayContent,
    updateTabContent
  } = deps;

  // Find all preset cards
  const cards = context.querySelectorAll('.mga-preset-clickable[data-preset]');

  // Set up preset card handlers - use cloneNode to ensure clean slate
  cards.forEach((presetCard, index) => {
    // Clone the node to remove ALL event listeners
    const newCard = presetCard.cloneNode(true);
    presetCard.parentNode.replaceChild(newCard, presetCard);

    // Attach fresh handler to the cloned card
    newCard.addEventListener('click', e => {
      const presetName = e.currentTarget.dataset.preset;

      if (!presetName || !UnifiedState.data.petPresets[presetName]) {
        productionWarn('⚠️ Preset not found!');
        return;
      }

      const preset = UnifiedState.data.petPresets[presetName];
      const maxSlots = 3;

      // Native swap approach - works even with full inventory!
      let delay = 0;

      for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
        const desiredPet = preset[slotIndex];

        // Capture delay value in closure to prevent race conditions
        ((currentDelay, slot) => {
          setTimeout(() => {
            // Read FRESH state inside timeout (not stale reference)
            const currentPets = UnifiedState.atoms.activePets || window.activePets || [];
            const currentPet = currentPets[slot];

            if (currentPet && desiredPet) {
              // Check if desired pet is already equipped
              if (currentPet.id === desiredPet.id) {
                if (UnifiedState.data.settings?.debugMode) {
                  productionLog(`[PET-SWAP] Slot ${slot + 1}: Already equipped (${currentPet.id}), skipping`);
                }
                return; // Skip swap, pet already in place
              }

              // Both exist: Use native SwapPet (no inventory space needed!)
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`[PET-SWAP] Slot ${slot + 1}: Swapping ${currentPet.id} → ${desiredPet.id}`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'SwapPet',
                petSlotId: currentPet.id,
                petInventoryId: desiredPet.id
              });
            } else if (!currentPet && desiredPet) {
              // Empty slot: Place new pet
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`[PET-SWAP] Slot ${slot + 1}: Placing ${desiredPet.id} (empty slot)`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'PlacePet',
                itemId: desiredPet.id,
                position: { x: 17 + slot * 2, y: 13 },
                localTileIndex: 64,
                tileType: 'Boardwalk'
              });
            } else if (currentPet && !desiredPet) {
              // Remove excess pet (preset has fewer pets)
              if (UnifiedState.data.settings?.debugMode) {
                productionLog(`[PET-SWAP] Slot ${slot + 1}: Storing ${currentPet.id} (no preset pet)`);
              }

              safeSendMessage({
                scopePath: ['Room', 'Quinoa'],
                type: 'StorePet',
                itemId: currentPet.id
              });
            }
          }, currentDelay);
        })(delay, slotIndex);

        // Increase delay: 100ms → 200ms for better network latency tolerance
        delay += 200;
      }

      // Update displays after all pets are placed (single refresh with retry)
      const refreshPetDisplays = () => {
        // Force update from room state
        updateActivePetsFromRoomState();

        // Get the actual window context, whether we're in main window or popout
        const contextDoc = context.ownerDocument || context;
        const contextWindow = contextDoc.defaultView || window;

        // Check if this is a separate window popout
        const isSeparateWindow = contextWindow !== window && contextWindow.refreshPopoutContent;

        if (isSeparateWindow) {
          // Refresh separate window popout
          contextWindow.refreshPopoutContent('pets');
        } else {
          // It's an in-game overlay or main window - update all popouts
          refreshSeparateWindowPopouts(deps, 'pets');

          // Update all overlays
          UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
            if (overlay && document.contains(overlay) && tabName === 'pets') {
              if (overlay.className.includes('mga-overlay-content-only')) {
                updatePureOverlayContent(deps, overlay, tabName);
              }
            }
          });

          // Update main tab if active
          if (UnifiedState.activeTab === 'pets') {
            updateTabContent();
          }
        }
      };

      // Refresh after all pet swaps complete (with extra 200ms buffer for final network update)
      setTimeout(refreshPetDisplays, delay + 200);

      productionLog(`🐾 Loading pet preset: ${presetName}`);
    });
  });
}

// ==================== EXPORTS ====================

/**
 * Tab content cache storage
 * Maps tab names to cached content with timestamps
 */
const tabContentCache = new Map();

/**
 * Cache duration for static tabs (30 seconds)
 */
const TAB_CACHE_DURATION = 30000;

/**
 * Dynamic tabs that should never be cached (always show real-time data)
 */
const DYNAMIC_TABS = [
  'pets',
  'abilities',
  'seeds',
  'shop',
  'values',
  'timers',
  'rooms',
  'hotkeys',
  'settings',
  'notifications',
  'protect'
];

/**
 * getCachedTabContent - Get cached tab content or generate new content
 *
 * This function implements an intelligent caching strategy:
 * - Dynamic tabs are never cached (always generate fresh content)
 * - Static tabs are cached for TAB_CACHE_DURATION
 * - Expired cache entries are automatically regenerated
 *
 * @param {Object} deps - Dependencies (currently unused, for future expansion)
 * @param {string} tabName - Name of the tab to get content for
 * @param {Function} generator - Function to generate tab content if not cached
 * @returns {HTMLElement|string} The tab content (from cache or freshly generated)
 *
 * @example
 * const content = getCachedTabContent(deps, 'info', () => generateInfoTab());
 */
function getCachedTabContent(deps, tabName, generator) {
  // Never cache dynamic tabs (they need real-time data)
  if (DYNAMIC_TABS.includes(tabName)) {
    return generator();
  }

  // Check cache for static tabs
  const cached = tabContentCache.get(tabName);
  const now = Date.now();

  if (cached && now - cached.timestamp < TAB_CACHE_DURATION) {
    return cached.content;
  }

  // Generate and cache
  const content = generator();
  tabContentCache.set(tabName, { content, timestamp: now });
  return content;
}

/**
 * invalidateTabCache - Invalidate tab cache entries
 *
 * Call this function when settings change or when you need to force
 * regeneration of cached tab content.
 *
 * @param {Object} deps - Dependencies (currently unused, for future expansion)
 * @param {string|null} tabName - Specific tab to invalidate, or null to clear all
 *
 * @example
 * // Invalidate a specific tab
 * invalidateTabCache(deps, 'info');
 *
 * // Clear all cached tabs
 * invalidateTabCache(deps, null);
 */
function invalidateTabCache(deps, tabName = null) {
  if (tabName) {
    tabContentCache.delete(tabName);
  } else {
    tabContentCache.clear();
  }
}

/**
 * getTabCacheStats - Get cache statistics (utility function)
 *
 * @param {Object} deps - Dependencies (currently unused)
 * @returns {Object} Cache statistics including size and entries
 */
function getTabCacheStats(deps) {
  return {
    size: tabContentCache.size,
    entries: Array.from(tabContentCache.keys()),
    duration: TAB_CACHE_DURATION
  };
}

// ==================== EXPORTS ====================
// All UI Overlay functions (Phases 2-5)

export {
  // Phase 2: Main UI Creation (7 functions)
  createUnifiedUI,
  ensureUIHealthy,
  setupToolbarToggle,
  setupDockSizeControl,
  saveDockPosition,
  resetDockPosition,
  cleanupCorruptedDockPosition,

  // Phase 3: Sidebar & Popout Management (12 functions)
  openSidebarTab,
  openPopoutWidget,
  makePopoutDraggable,
  openTabInSeparateWindow,
  toggleTabPopout,
  updatePopoutButtonState,
  updatePopoutButtonStateByTab,
  openTabInPopout,
  refreshSeparateWindowPopouts,
  closeAllPopouts,
  getPetsPopoutContent,
  setupPetPopoutHandlers,

  // Phase 4: In-Game Overlay System (9 functions)
  createInGameOverlay,
  makeEntireOverlayDraggable,
  closeInGameOverlay,
  updatePureOverlayContent,
  setupPureOverlayHandlers,
  refreshOverlayContent,
  updateOverlayContent,
  setupOverlayHandlers,
  getContentForTab,

  // Position & Dimension Management (10 functions)
  getGameViewport,
  addResizeHandleToOverlay,
  saveOverlayDimensions,
  loadOverlayDimensions,
  findOptimalPosition,
  findPositionInZone,
  overlapsMainHUD,
  hasCollisionAtPosition,
  saveOverlayPosition,
  loadOverlayPosition,

  // Phase 5: Tab Content Cache (5 exports)
  getCachedTabContent,
  invalidateTabCache,
  getTabCacheStats,
  DYNAMIC_TABS,
  TAB_CACHE_DURATION,

  // CSS Styles
  UNIFIED_STYLES
};
