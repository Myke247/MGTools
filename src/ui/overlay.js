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
    setTimeout(() => createUnifiedUI({
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
    }), 100);
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
function ensureUIHealthy({
  targetDocument,
  cleanupCorruptedDockPosition,
  createUnifiedUI,
  showToast
}) {
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
function setupToolbarToggle({
  targetDocument,
  document,
  productionLog,
  showToast,
  CURRENT_VERSION
}) {
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
function setupDockSizeControl({
  targetDocument,
  document,
  resetDockPosition,
  showToast
}) {
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
function resetDockPosition({
  targetDocument,
  showNotificationToast
}) {
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

export {
  createUnifiedUI,
  ensureUIHealthy,
  setupToolbarToggle,
  setupDockSizeControl,
  saveDockPosition,
  resetDockPosition,
  cleanupCorruptedDockPosition
};

// End of Phase 2
// Total: ~895 lines of UI creation and management functions
