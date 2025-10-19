/**
 * UI MODULE - Hotkey Help Overlay
 * ====================================================================================
 * Pure UI layer for displaying keyboard shortcuts help
 *
 * @module ui/hotkey-help
 *
 * This module provides:
 * - Hotkey help overlay rendering
 * - Categorized shortcut display
 * - Keyboard-accessible modal
 * - Clean teardown
 *
 * Dependencies: toast/DOM helpers from M7, Logger
 *
 * GUARANTEES:
 * - Zero network calls
 * - Zero state writes
 * - Pure view layer
 * - CSP/Discord-safe inline CSS only
 */

import { el, qs, ensureStyles } from './ui.js';
import { Logger } from '../core/logging.js';
import { formatShortcut, getShortcutsByCategory } from '../controller/shortcuts.js';

/* ====================================================================================
 * HOTKEY HELP OVERLAY
 * ====================================================================================
 */

let helpOverlay = null;

/**
 * Show hotkey help overlay
 * @param {Object} options - Display options
 * @returns {HTMLElement} - Created overlay element
 */
export function showHotkeyHelp(options = {}) {
  const {
    shortcuts = null
  } = options;

  // Remove existing overlay
  if (helpOverlay) {
    hideHotkeyHelp();
  }

  // Get shortcuts (use provided or default)
  const shortcutsByCategory = shortcuts || getShortcutsByCategory();

  // Create overlay
  helpOverlay = el('div', {
    className: 'mgtools-hotkey-help-overlay',
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99999999',
      animation: 'mgtools-fade-in 0.2s ease-out'
    }
  });

  // Create modal
  const modal = el('div', {
    className: 'mgtools-hotkey-help-modal',
    style: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '700px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  });

  // Title
  const title = el('h2', {
    style: {
      margin: '0 0 20px 0',
      fontSize: '24px',
      fontWeight: '600',
      color: '#333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, 'Keyboard Shortcuts');

  // Close button
  const closeBtn = el('button', {
    className: 'mgtools-hotkey-help-close',
    style: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '6px',
      background: '#f3f4f6',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s'
    }
  }, '✕ Close');

  closeBtn.addEventListener('click', hideHotkeyHelp);
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#e5e7eb';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#f3f4f6';
  });

  title.appendChild(closeBtn);

  // Shortcuts grid
  const grid = el('div', {
    style: {
      display: 'grid',
      gap: '24px'
    }
  });

  // Add categories
  for (const [category, categoryShortcuts] of Object.entries(shortcutsByCategory)) {
    const categorySection = el('div', {
      style: {
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '16px'
      }
    });

    const categoryTitle = el('h3', {
      style: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }
    }, category);

    const shortcutList = el('div', {
      style: {
        display: 'grid',
        gap: '8px'
      }
    });

    categoryShortcuts.forEach(shortcut => {
      const shortcutRow = el('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#f9fafb',
          borderRadius: '6px'
        }
      });

      const description = el('span', {
        style: {
          fontSize: '14px',
          color: '#374151'
        }
      }, shortcut.description);

      const keys = el('kbd', {
        style: {
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'white',
          border: '1px solid #d1d5db',
          fontSize: '13px',
          fontFamily: 'monospace',
          color: '#1f2937',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }
      }, formatShortcut(shortcut));

      shortcutRow.appendChild(description);
      shortcutRow.appendChild(keys);
      shortcutList.appendChild(shortcutRow);
    });

    categorySection.appendChild(categoryTitle);
    categorySection.appendChild(shortcutList);
    grid.appendChild(categorySection);
  }

  // Assemble modal
  modal.appendChild(title);
  modal.appendChild(grid);

  // Add to overlay
  helpOverlay.appendChild(modal);

  // Close on overlay click
  helpOverlay.addEventListener('click', (e) => {
    if (e.target === helpOverlay) {
      hideHotkeyHelp();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      hideHotkeyHelp();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Add to DOM
  document.body.appendChild(helpOverlay);

  Logger.info('HOTKEY_HELP', 'Hotkey help overlay shown');

  // Inject animations if not present
  injectHelpAnimations();

  return helpOverlay;
}

/**
 * Hide hotkey help overlay
 */
export function hideHotkeyHelp() {
  if (!helpOverlay) {
    return;
  }

  // Add fade-out animation
  helpOverlay.style.animation = 'mgtools-fade-out 0.2s ease-out';

  setTimeout(() => {
    if (helpOverlay && helpOverlay.parentNode) {
      helpOverlay.parentNode.removeChild(helpOverlay);
    }
    helpOverlay = null;
    Logger.info('HOTKEY_HELP', 'Hotkey help overlay hidden');
  }, 200);
}

/* ====================================================================================
 * ANIMATIONS
 * ====================================================================================
 */

let animationsInjected = false;

/**
 * Inject help overlay animations
 */
function injectHelpAnimations() {
  if (animationsInjected) return;

  const css = `
    @keyframes mgtools-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes mgtools-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    /* Scrollbar styling for help modal */
    .mgtools-hotkey-help-modal::-webkit-scrollbar {
      width: 8px;
    }

    .mgtools-hotkey-help-modal::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 4px;
    }

    .mgtools-hotkey-help-modal::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }

    .mgtools-hotkey-help-modal::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `;

  try {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    animationsInjected = true;
    Logger.debug('HOTKEY_HELP', 'Help overlay animations injected');
  } catch (error) {
    Logger.error('HOTKEY_HELP', 'Failed to inject animations', error);
  }
}

/* ====================================================================================
 * INITIALIZATION
 * ====================================================================================
 */

// Ensure base UI styles are loaded (from M7)
ensureStyles();

Logger.info('HOTKEY_HELP', 'Hotkey help UI module loaded');
