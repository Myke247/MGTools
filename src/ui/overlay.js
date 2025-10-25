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

/* ============================================================================
 * MODULE EXPORTS
 * ============================================================================
 */

export { UNIFIED_STYLES };

// End of Phase 1
// Next phases will add UI creation functions, sidebar/popout management,
// overlay system, and tab content caching
