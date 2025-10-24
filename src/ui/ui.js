/**
 * UI FRAMEWORK MODULE - Toast System & DOM Helpers
 * ====================================================================================
 * Pure UI layer for MGTools with no network/state dependencies
 *
 * @module ui/ui
 *
 * This module provides:
 * - Toast notification system (info/warn/error with queue management)
 * - Lightweight event bus for UI-level events
 * - Minimal DOM helpers (create elements, query selectors)
 * - CSP/Discord-safe inline CSS (no external fonts/assets)
 *
 * Dependencies: Logger, CompatibilityMode (read-only)
 *
 * GUARANTEES:
 * - Zero network calls (no fetch/GM_xmlhttpRequest/WebSocket)
 * - Zero UnifiedState access (pure view layer)
 * - Safe in CSP/Discord environments
 * - Minimal, composable API
 */

import { Logger } from '../core/logging.js';
import { CompatibilityMode } from '../core/compat.js';

/* ====================================================================================
 * STYLE INJECTION
 * ====================================================================================
 */

let stylesInjected = false;

/**
 * Inject minimal CSS for toasts and UI overlays
 * Safe for CSP/Discord (inline CSS only, no external assets)
 */
export function ensureStyles() {
  if (stylesInjected) return;

  const css = `
    /* MGTools Toast Container */
    .mgtools-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Individual Toast */
    .mgtools-toast {
      pointer-events: auto;
      min-width: 280px;
      max-width: 400px;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: mgtools-toast-slide-in 0.3s ease-out;
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
      position: relative;
    }

    .mgtools-toast.mgtools-toast-hiding {
      opacity: 0;
      transform: translateX(20px);
    }

    /* Toast Types */
    .mgtools-toast.mgtools-toast-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .mgtools-toast.mgtools-toast-warn {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .mgtools-toast.mgtools-toast-error {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: #333;
    }

    /* Toast Icon */
    .mgtools-toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      font-size: 20px;
      line-height: 1;
    }

    /* Toast Content */
    .mgtools-toast-content {
      flex: 1;
      word-wrap: break-word;
    }

    /* Toast Close Button */
    .mgtools-toast-close {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border: none;
      background: none;
      color: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      padding: 0;
    }

    .mgtools-toast-close:hover {
      opacity: 1;
    }

    /* Animations */
    @keyframes mgtools-toast-slide-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Discord Compatibility: Higher z-index for iframe contexts */
    .mgtools-discord-context .mgtools-toast-container {
      z-index: 9999999;
    }
  `;

  try {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    stylesInjected = true;
    Logger.debug('UI', 'Toast styles injected');
  } catch (error) {
    Logger.error('UI', 'Failed to inject toast styles', error);
  }
}

/* ====================================================================================
 * TOAST SYSTEM
 * ====================================================================================
 */

let toastContainer = null;
const toastQueue = [];
let toastIdCounter = 0;

/**
 * Ensure toast container exists in DOM
 * @returns {HTMLElement} - Toast container element
 */
function ensureToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  ensureStyles();

  toastContainer = document.createElement('div');
  toastContainer.className = 'mgtools-toast-container';

  // Add Discord context class if in Discord
  if (CompatibilityMode?.flags?.isDiscordEmbed) {
    toastContainer.classList.add('mgtools-discord-context');
  }

  document.body.appendChild(toastContainer);
  Logger.debug('UI', 'Toast container created');

  return toastContainer;
}

/**
 * Create and show a toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Toast options
 * @returns {number} - Toast ID for manual dismissal
 */
function createToast(message, options = {}) {
  const { type = 'info', duration = 5000, dismissible = true, icon = null } = options;

  const toastId = ++toastIdCounter;
  const container = ensureToastContainer();

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `mgtools-toast mgtools-toast-${type}`;
  toast.dataset.toastId = toastId;

  // Icon (default icons for each type)
  const defaultIcons = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  };

  const toastIcon = document.createElement('span');
  toastIcon.className = 'mgtools-toast-icon';
  toastIcon.textContent = icon || defaultIcons[type] || 'ℹ️';

  // Content
  const content = document.createElement('div');
  content.className = 'mgtools-toast-content';
  content.textContent = message;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'mgtools-toast-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close');

  if (dismissible) {
    closeBtn.addEventListener('click', () => {
      dismissToast(toastId);
    });
  } else {
    closeBtn.style.display = 'none';
  }

  // Assemble toast
  toast.appendChild(toastIcon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);

  // Add to container
  container.appendChild(toast);

  // Track in queue
  toastQueue.push({ id: toastId, element: toast, timeout: null });

  // Auto-dismiss after duration
  if (duration > 0) {
    const timeoutId = setTimeout(() => {
      dismissToast(toastId);
    }, duration);

    const toastData = toastQueue.find(t => t.id === toastId);
    if (toastData) {
      toastData.timeout = timeoutId;
    }
  }

  Logger.debug('UI', `Toast created: ${type} - "${message}"`);
  emit('toast:created', { id: toastId, type, message });

  return toastId;
}

/**
 * Dismiss a toast by ID
 * @param {number} toastId - Toast ID to dismiss
 */
function dismissToast(toastId) {
  const toastData = toastQueue.find(t => t.id === toastId);
  if (!toastData) return;

  // Clear timeout
  if (toastData.timeout) {
    clearTimeout(toastData.timeout);
  }

  // Add hiding animation
  toastData.element.classList.add('mgtools-toast-hiding');

  // Remove from DOM after animation
  setTimeout(() => {
    if (toastData.element.parentNode) {
      toastData.element.parentNode.removeChild(toastData.element);
    }

    // Remove from queue
    const index = toastQueue.findIndex(t => t.id === toastId);
    if (index !== -1) {
      toastQueue.splice(index, 1);
    }

    Logger.debug('UI', `Toast dismissed: ${toastId}`);
    emit('toast:dismissed', { id: toastId });
  }, 200);
}

/**
 * Dismiss all active toasts
 */
function dismissAllToasts() {
  const toastIds = toastQueue.map(t => t.id);
  toastIds.forEach(id => dismissToast(id));
  Logger.debug('UI', 'All toasts dismissed');
}

/**
 * Toast API
 */
export const toast = {
  /**
   * Show info toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {number} - Toast ID
   */
  info(message, options = {}) {
    return createToast(message, { ...options, type: 'info' });
  },

  /**
   * Show warning toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {number} - Toast ID
   */
  warn(message, options = {}) {
    return createToast(message, { ...options, type: 'warn' });
  },

  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {number} - Toast ID
   */
  error(message, options = {}) {
    return createToast(message, { ...options, type: 'error' });
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    dismissAllToasts();
  },

  /**
   * Dismiss specific toast
   * @param {number} toastId - Toast ID to dismiss
   */
  dismiss(toastId) {
    dismissToast(toastId);
  }
};

/* ====================================================================================
 * UI EVENT BUS
 * ====================================================================================
 */

const eventHandlers = new Map();

/**
 * Subscribe to UI event
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function on(event, handler) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, []);
  }
  eventHandlers.get(event).push(handler);
  Logger.debug('UI', `Event handler registered: ${event}`);
}

/**
 * Unsubscribe from UI event
 * @param {string} event - Event name
 * @param {Function} handler - Event handler to remove
 */
export function off(event, handler) {
  if (!eventHandlers.has(event)) return;

  const handlers = eventHandlers.get(event);
  const index = handlers.indexOf(handler);
  if (index !== -1) {
    handlers.splice(index, 1);
    Logger.debug('UI', `Event handler removed: ${event}`);
  }

  // Clean up empty handler arrays
  if (handlers.length === 0) {
    eventHandlers.delete(event);
  }
}

/**
 * Emit UI event
 * @param {string} event - Event name
 * @param {*} payload - Event payload
 */
export function emit(event, payload) {
  if (!eventHandlers.has(event)) return;

  const handlers = eventHandlers.get(event);
  handlers.forEach(handler => {
    try {
      handler(payload);
    } catch (error) {
      Logger.error('UI', `Error in event handler for "${event}"`, error);
    }
  });

  Logger.debug('UI', `Event emitted: ${event}`, payload);
}

/* ====================================================================================
 * DOM HELPERS
 * ====================================================================================
 */

/**
 * Create DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {...(Node|string)} children - Child nodes or text
 * @returns {HTMLElement} - Created element
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  // Append children
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Query selector helper
 * @param {string} selector - CSS selector
 * @param {Element} root - Root element (default: document)
 * @returns {Element|null} - Matched element
 */
export function qs(selector, root = document) {
  try {
    return root.querySelector(selector);
  } catch (error) {
    Logger.error('UI', `Invalid selector: "${selector}"`, error);
    return null;
  }
}

/**
 * Query selector all helper
 * @param {string} selector - CSS selector
 * @param {Element} root - Root element (default: document)
 * @returns {NodeList} - Matched elements
 */
export function qsa(selector, root = document) {
  try {
    return root.querySelectorAll(selector);
  } catch (error) {
    Logger.error('UI', `Invalid selector: "${selector}"`, error);
    return [];
  }
}

/* ====================================================================================
 * INITIALIZATION
 * ====================================================================================
 */

// Auto-inject styles on module load (safe, idempotent)
if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  ensureStyles();
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', ensureStyles);
}

Logger.info('UI', 'UI framework module loaded');
