/**
 * CONTROLLER MODULE - Keyboard Shortcuts
 * ====================================================================================
 * Manages keyboard shortcuts and hotkey handling
 *
 * @module controller/shortcuts
 *
 * This module provides:
 * - Keyboard shortcut registration and management
 * - Event listener lifecycle (start/stop)
 * - Modifier key detection (Ctrl, Alt, Shift)
 * - UI event emission for key actions
 *
 * Dependencies: Logger, CompatibilityMode (read-only), UI event bus (M7)
 *
 * GUARANTEES:
 * - No network calls
 * - No UnifiedState writes (read-only if needed)
 * - Event listeners properly attached/detached
 * - Lifecycle owned by caller (start/stop)
 */

import { Logger } from '../core/logging.js';
import { CompatibilityMode } from '../core/compat.js';
import { on, off, emit } from '../ui/ui.js';

/* ====================================================================================
 * SHORTCUT DEFINITIONS
 * ====================================================================================
 */

const SHORTCUTS = {
  // Help & Info
  SHOW_HELP: { key: '?', modifiers: { shift: true }, action: 'show-help', description: 'Show keyboard shortcuts help' },

  // Panel Navigation
  TOGGLE_MAIN_PANEL: { key: 'm', modifiers: {}, action: 'toggle-main-panel', description: 'Toggle main panel' },
  FOCUS_SEARCH: { key: '/', modifiers: {}, action: 'focus-search', description: 'Focus search field' },

  // Tab Switching
  TAB_PETS: { key: '1', modifiers: { alt: true }, action: 'switch-tab-pets', description: 'Switch to Pets tab' },
  TAB_ABILITIES: {
    key: '2',
    modifiers: { alt: true },
    action: 'switch-tab-abilities',
    description: 'Switch to Abilities tab'
  },
  TAB_SEEDS: { key: '3', modifiers: { alt: true }, action: 'switch-tab-seeds', description: 'Switch to Seeds tab' },
  TAB_VALUES: { key: '4', modifiers: { alt: true }, action: 'switch-tab-values', description: 'Switch to Values tab' },
  TAB_TIMERS: { key: '5', modifiers: { alt: true }, action: 'switch-tab-timers', description: 'Switch to Timers tab' },
  TAB_ROOMS: { key: '6', modifiers: { alt: true }, action: 'switch-tab-rooms', description: 'Switch to Rooms tab' },
  TAB_SHOP: { key: '7', modifiers: { alt: true }, action: 'switch-tab-shop', description: 'Switch to Shop tab' },
  TAB_SETTINGS: {
    key: '8',
    modifiers: { alt: true },
    action: 'switch-tab-settings',
    description: 'Switch to Settings tab'
  },

  // Quick Actions
  REFRESH_DATA: { key: 'r', modifiers: { ctrl: true }, action: 'refresh-data', description: 'Refresh data' },
  TOGGLE_COMPACT: { key: 'c', modifiers: { ctrl: true }, action: 'toggle-compact', description: 'Toggle compact mode' },

  // Escape
  CLOSE_MODAL: { key: 'Escape', modifiers: {}, action: 'close-modal', description: 'Close modal/popout' }
};

/* ====================================================================================
 * SHORTCUTS CONTROLLER
 * ====================================================================================
 */

export class ShortcutsController {
  constructor(options = {}) {
    this.enabled = true;
    this.shortcuts = { ...SHORTCUTS };
    this.listeners = [];
    this.boundHandleKeyDown = null;
    this.boundHandleKeyUp = null;

    Logger.info('SHORTCUTS', 'ShortcutsController initialized');
  }

  /**
   * Check if modifiers match
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} modifiers - Required modifiers
   * @returns {boolean} - True if modifiers match
   */
  _modifiersMatch(event, modifiers = {}) {
    const ctrl = modifiers.ctrl || false;
    const alt = modifiers.alt || false;
    const shift = modifiers.shift || false;
    const meta = modifiers.meta || false;

    return event.ctrlKey === ctrl && event.altKey === alt && event.shiftKey === shift && event.metaKey === meta;
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} event - Keyboard event
   */
  _handleKeyDown(event) {
    if (!this.enabled) return;

    // Don't intercept if user is typing in input/textarea
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)
    ) {
      // Allow escape key even in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    // Check all registered shortcuts
    for (const [name, shortcut] of Object.entries(this.shortcuts)) {
      const keyMatches = event.key === shortcut.key || event.code === shortcut.key;
      const modifiersMatch = this._modifiersMatch(event, shortcut.modifiers);

      if (keyMatches && modifiersMatch) {
        Logger.debug('SHORTCUTS', `Shortcut triggered: ${name} (${shortcut.action})`);

        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();

        // Emit UI event for this action
        emit(`shortcut:${shortcut.action}`, {
          name,
          key: shortcut.key,
          modifiers: shortcut.modifiers,
          description: shortcut.description
        });

        break;
      }
    }
  }

  /**
   * Handle keyup event
   * @param {KeyboardEvent} event - Keyboard event
   */
  _handleKeyUp(event) {
    // Reserved for future use (e.g., key combinations that need keyup)
  }

  /**
   * Start listening for keyboard shortcuts
   */
  start() {
    if (this.boundHandleKeyDown) {
      Logger.warn('SHORTCUTS', 'Shortcuts already started');
      return;
    }

    this.boundHandleKeyDown = this._handleKeyDown.bind(this);
    this.boundHandleKeyUp = this._handleKeyUp.bind(this);

    document.addEventListener('keydown', this.boundHandleKeyDown, true);
    document.addEventListener('keyup', this.boundHandleKeyUp, true);

    Logger.info('SHORTCUTS', 'Keyboard shortcuts started');
  }

  /**
   * Stop listening for keyboard shortcuts
   */
  stop() {
    if (!this.boundHandleKeyDown) {
      Logger.warn('SHORTCUTS', 'Shortcuts not running');
      return;
    }

    document.removeEventListener('keydown', this.boundHandleKeyDown, true);
    document.removeEventListener('keyup', this.boundHandleKeyUp, true);

    this.boundHandleKeyDown = null;
    this.boundHandleKeyUp = null;

    Logger.info('SHORTCUTS', 'Keyboard shortcuts stopped');
  }

  /**
   * Enable shortcuts
   */
  enable() {
    this.enabled = true;
    Logger.debug('SHORTCUTS', 'Shortcuts enabled');
  }

  /**
   * Disable shortcuts
   */
  disable() {
    this.enabled = false;
    Logger.debug('SHORTCUTS', 'Shortcuts disabled');
  }

  /**
   * Register a new shortcut
   * @param {string} name - Shortcut name
   * @param {Object} config - Shortcut configuration
   */
  register(name, config) {
    this.shortcuts[name] = config;
    Logger.debug('SHORTCUTS', `Registered shortcut: ${name}`);
  }

  /**
   * Unregister a shortcut
   * @param {string} name - Shortcut name
   */
  unregister(name) {
    delete this.shortcuts[name];
    Logger.debug('SHORTCUTS', `Unregistered shortcut: ${name}`);
  }

  /**
   * Get all registered shortcuts
   * @returns {Object} - Shortcuts map
   */
  getShortcuts() {
    return { ...this.shortcuts };
  }
}

/* ====================================================================================
 * HELPER FUNCTIONS
 * ====================================================================================
 */

/**
 * Format shortcut for display
 * @param {Object} shortcut - Shortcut config
 * @returns {string} - Formatted shortcut string
 */
export function formatShortcut(shortcut) {
  const parts = [];

  if (shortcut.modifiers.ctrl) parts.push('Ctrl');
  if (shortcut.modifiers.alt) parts.push('Alt');
  if (shortcut.modifiers.shift) parts.push('Shift');
  if (shortcut.modifiers.meta) parts.push('Cmd');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

/**
 * Get shortcuts grouped by category
 * @returns {Object} - Shortcuts grouped by category
 */
export function getShortcutsByCategory() {
  return {
    'Help & Info': [SHORTCUTS.SHOW_HELP],
    'Panel Navigation': [SHORTCUTS.TOGGLE_MAIN_PANEL, SHORTCUTS.FOCUS_SEARCH],
    'Tab Switching': [
      SHORTCUTS.TAB_PETS,
      SHORTCUTS.TAB_ABILITIES,
      SHORTCUTS.TAB_SEEDS,
      SHORTCUTS.TAB_VALUES,
      SHORTCUTS.TAB_TIMERS,
      SHORTCUTS.TAB_ROOMS,
      SHORTCUTS.TAB_SHOP,
      SHORTCUTS.TAB_SETTINGS
    ],
    'Quick Actions': [SHORTCUTS.REFRESH_DATA, SHORTCUTS.TOGGLE_COMPACT],
    Navigation: [SHORTCUTS.CLOSE_MODAL]
  };
}

/* ====================================================================================
 * INITIALIZATION
 * ====================================================================================
 */

Logger.info('SHORTCUTS', 'Shortcuts controller module loaded');
