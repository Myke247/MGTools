/**
 * UI MODULE - Connection Status HUD
 * ====================================================================================
 * Pure UI layer for displaying connection status and providing reconnect controls
 *
 * @module ui/connection-status
 *
 * This module provides:
 * - Connection status HUD rendering (connected/reconnecting/offline/expired)
 * - Visual state updates (colors, icons, animations)
 * - Reconnect/refresh button handlers (callback-based)
 * - Connection state change toast notifications
 * - UI teardown for cleanup
 *
 * Dependencies: toast/DOM helpers from M7, Logger, CompatibilityMode (read-only)
 *
 * GUARANTEES:
 * - Zero network calls (no fetch/GM_xmlhttpRequest/WebSocket)
 * - Zero UnifiedState access (pure view layer)
 * - All actions delegated via callbacks
 * - CSP/Discord-safe inline CSS only
 */

import { toast, el, qs, qsa, ensureStyles } from './ui.js';
import { Logger } from '../core/logging.js';
import { CompatibilityMode } from '../core/compat.js';

/* ====================================================================================
 * CONNECTION STATUS STATES
 * ====================================================================================
 */

const CONNECTION_STATES = {
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  OFFLINE: 'offline',
  EXPIRED4710: 'expired4710' // Special state for expired sessions
};

const STATE_CONFIG = {
  [CONNECTION_STATES.CONNECTED]: {
    icon: '✓',
    text: 'Connected',
    color: '#10b981', // Green
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    pulse: false
  },
  [CONNECTION_STATES.RECONNECTING]: {
    icon: '⟳',
    text: 'Reconnecting...',
    color: '#f59e0b', // Amber
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    pulse: true
  },
  [CONNECTION_STATES.OFFLINE]: {
    icon: '✕',
    text: 'Offline',
    color: '#ef4444', // Red
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    pulse: false
  },
  [CONNECTION_STATES.EXPIRED4710]: {
    icon: '⚠',
    text: 'Session Expired',
    color: '#8b5cf6', // Purple
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    pulse: true
  }
};

/* ====================================================================================
 * CONNECTION STATUS RENDERING
 * ====================================================================================
 */

/**
 * Render connection status HUD in container
 * @param {HTMLElement} container - Parent element for HUD
 * @param {string} initialState - Initial connection state
 * @returns {HTMLElement} - Created HUD element
 */
export function renderConnectionStatus(container, initialState = CONNECTION_STATES.CONNECTED) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.error('CONN_UI', 'Invalid container provided to renderConnectionStatus');
    return null;
  }

  // Validate state
  const state = CONNECTION_STATES[initialState.toUpperCase()] || CONNECTION_STATES.OFFLINE;
  const config = STATE_CONFIG[state];

  // Clear existing HUD
  const existingHud = qs('.mgtools-connection-hud', container);
  if (existingHud) {
    existingHud.remove();
  }

  // Create HUD container
  const hud = el('div', {
    className: 'mgtools-connection-hud',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: config.gradient,
      color: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      fontWeight: '500'
    },
    'data-state': state
  });

  // Add pulse animation if needed
  if (config.pulse) {
    hud.style.animation = 'mgtools-pulse 2s infinite';
  }

  // Icon
  const icon = el('span', {
    className: 'mgtools-connection-icon',
    style: {
      fontSize: '14px',
      lineHeight: '1',
      display: 'inline-block'
    }
  }, config.icon);

  // Add rotation animation for reconnecting state
  if (state === CONNECTION_STATES.RECONNECTING) {
    icon.style.animation = 'mgtools-spin 1s linear infinite';
  }

  // Status text
  const statusText = el('span', {
    className: 'mgtools-connection-text',
    style: { letterSpacing: '0.3px' }
  }, config.text);

  // Assemble HUD
  hud.appendChild(icon);
  hud.appendChild(statusText);

  container.appendChild(hud);
  Logger.debug('CONN_UI', `Connection HUD rendered: ${state}`);

  // Inject animations if not already present
  injectConnectionAnimations();

  return hud;
}

/* ====================================================================================
 * CONNECTION STATUS UPDATE
 * ====================================================================================
 */

/**
 * Update connection status HUD to new state
 * @param {HTMLElement} container - Container with HUD
 * @param {string} newState - New connection state
 * @returns {boolean} - Success status
 */
export function updateConnectionStatus(container, newState) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.error('CONN_UI', 'Invalid container provided to updateConnectionStatus');
    return false;
  }

  const hud = qs('.mgtools-connection-hud', container);
  if (!hud) {
    Logger.warn('CONN_UI', 'No connection HUD found, rendering new one');
    renderConnectionStatus(container, newState);
    return true;
  }

  // Validate state
  const state = CONNECTION_STATES[newState.toUpperCase()] || CONNECTION_STATES.OFFLINE;
  const config = STATE_CONFIG[state];
  const oldState = hud.dataset.state;

  // Update data attribute
  hud.dataset.state = state;

  // Update background gradient
  hud.style.background = config.gradient;

  // Update icon
  const icon = qs('.mgtools-connection-icon', hud);
  if (icon) {
    icon.textContent = config.icon;

    // Update rotation animation
    if (state === CONNECTION_STATES.RECONNECTING) {
      icon.style.animation = 'mgtools-spin 1s linear infinite';
    } else {
      icon.style.animation = '';
    }
  }

  // Update text
  const text = qs('.mgtools-connection-text', hud);
  if (text) {
    text.textContent = config.text;
  }

  // Update pulse animation
  if (config.pulse) {
    hud.style.animation = 'mgtools-pulse 2s infinite';
  } else {
    hud.style.animation = '';
  }

  Logger.info('CONN_UI', `Connection status updated: ${oldState} → ${state}`);

  return true;
}

/* ====================================================================================
 * CONNECTION HANDLERS (CALLBACK-BASED)
 * ====================================================================================
 */

/**
 * Attach reconnect/refresh button handlers to HUD
 * @param {HTMLElement} container - Container with HUD
 * @param {Object} callbacks - Action callbacks
 * @param {Function} callbacks.onReconnect - Called when user clicks reconnect
 * @param {Function} callbacks.onRefresh - Called when user clicks refresh
 * @returns {Function} - Cleanup function to remove handlers
 */
export function attachConnectionHandlers(container, callbacks = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.error('CONN_UI', 'Invalid container provided to attachConnectionHandlers');
    return () => {};
  }

  const { onReconnect, onRefresh } = callbacks;
  const hud = qs('.mgtools-connection-hud', container);

  if (!hud) {
    Logger.warn('CONN_UI', 'No connection HUD found to attach handlers');
    return () => {};
  }

  // Add action buttons
  const buttonsContainer = el('div', {
    className: 'mgtools-connection-buttons',
    style: {
      display: 'inline-flex',
      gap: '4px',
      marginLeft: '4px'
    }
  });

  // Reconnect button
  if (typeof onReconnect === 'function') {
    const reconnectBtn = el('button', {
      className: 'mgtools-connection-btn mgtools-reconnect-btn',
      title: 'Reconnect',
      style: {
        padding: '4px 8px',
        border: 'none',
        borderRadius: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }
    }, '↻');

    reconnectBtn.addEventListener('mouseenter', () => {
      reconnectBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });

    reconnectBtn.addEventListener('mouseleave', () => {
      reconnectBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    reconnectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Logger.info('CONN_UI', 'User clicked reconnect button');
      onReconnect({ timestamp: Date.now() });
    });

    buttonsContainer.appendChild(reconnectBtn);
  }

  // Refresh button
  if (typeof onRefresh === 'function') {
    const refreshBtn = el('button', {
      className: 'mgtools-connection-btn mgtools-refresh-btn',
      title: 'Refresh Page',
      style: {
        padding: '4px 8px',
        border: 'none',
        borderRadius: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }
    }, '⟳');

    refreshBtn.addEventListener('mouseenter', () => {
      refreshBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });

    refreshBtn.addEventListener('mouseleave', () => {
      refreshBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Logger.info('CONN_UI', 'User clicked refresh button');
      onRefresh({ timestamp: Date.now() });
    });

    buttonsContainer.appendChild(refreshBtn);
  }

  // Add buttons to HUD only if we have at least one
  if (buttonsContainer.children.length > 0) {
    hud.appendChild(buttonsContainer);
  }

  Logger.debug('CONN_UI', 'Connection handlers attached');

  // Return cleanup function
  return () => {
    const buttons = qs('.mgtools-connection-buttons', hud);
    if (buttons) {
      buttons.remove();
    }
    Logger.debug('CONN_UI', 'Connection handlers removed');
  };
}

/* ====================================================================================
 * CONNECTION STATUS TOAST
 * ====================================================================================
 */

/**
 * Show toast notification for connection state changes
 * @param {string} state - Connection state
 * @param {Object} options - Additional options
 * @returns {number} - Toast ID
 */
export function showConnectionToast(state, options = {}) {
  const validState = CONNECTION_STATES[state.toUpperCase()] || CONNECTION_STATES.OFFLINE;
  const config = STATE_CONFIG[validState];

  let message = '';
  let toastType = 'info';
  let duration = 5000;

  switch (validState) {
    case CONNECTION_STATES.CONNECTED:
      message = 'Connection established';
      toastType = 'info';
      duration = 3000;
      break;

    case CONNECTION_STATES.RECONNECTING:
      message = 'Connection lost, attempting to reconnect...';
      toastType = 'warn';
      duration = 0; // Don't auto-dismiss
      break;

    case CONNECTION_STATES.OFFLINE:
      message = 'Connection offline. Check your network.';
      toastType = 'error';
      duration = 0; // Don't auto-dismiss
      break;

    case CONNECTION_STATES.EXPIRED4710:
      message = 'Session expired. Please refresh the page.';
      toastType = 'error';
      duration = 0; // Don't auto-dismiss
      break;
  }

  // Allow custom message override
  if (options.message) {
    message = options.message;
  }

  const toastId = toast[toastType](message, {
    duration,
    dismissible: true,
    icon: config.icon
  });

  Logger.info('CONN_UI', `Connection toast shown: ${validState} - "${message}"`);

  return toastId;
}

/* ====================================================================================
 * CONNECTION UI TEARDOWN
 * ====================================================================================
 */

/**
 * Safely remove connection HUD elements and handlers
 * @param {HTMLElement} container - Container with HUD
 */
export function teardownConnectionStatus(container) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.warn('CONN_UI', 'Invalid container provided to teardownConnectionStatus');
    return;
  }

  const hud = qs('.mgtools-connection-hud', container);
  if (hud) {
    // Remove all event listeners by cloning and replacing
    const clone = hud.cloneNode(true);
    hud.parentNode.replaceChild(clone, hud);
    clone.remove();
    Logger.debug('CONN_UI', 'Connection HUD removed');
  }

  Logger.debug('CONN_UI', 'Connection UI teardown complete');
}

/* ====================================================================================
 * ANIMATIONS
 * ====================================================================================
 */

let animationsInjected = false;

/**
 * Inject connection-specific animations
 */
function injectConnectionAnimations() {
  if (animationsInjected) return;

  const css = `
    @keyframes mgtools-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes mgtools-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;

  try {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    animationsInjected = true;
    Logger.debug('CONN_UI', 'Connection animations injected');
  } catch (error) {
    Logger.error('CONN_UI', 'Failed to inject connection animations', error);
  }
}

/* ====================================================================================
 * INITIALIZATION
 * ====================================================================================
 */

// Ensure base UI styles are loaded (from M7)
ensureStyles();

// Export connection states for external use
export { CONNECTION_STATES };

Logger.info('CONN_UI', 'Connection status UI module loaded');
