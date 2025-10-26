/**
 * UI MODULE - Version Badge & Branch Switcher
 * ====================================================================================
 * Pure UI layer for version display and branch switching (callback-based)
 *
 * @module ui/version-badge
 *
 * This module provides:
 * - Version badge rendering (current/available version display)
 * - Branch switcher UI (Stable/Beta toggle)
 * - Outdated version toast notifications
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
 * VERSION BADGE RENDERING
 * ====================================================================================
 */

/**
 * Render version badge in container
 * @param {HTMLElement} container - Parent element for badge
 * @param {Object} meta - Version metadata
 * @param {string} meta.currentVersion - Current version string
 * @param {string} meta.availableVersion - Available version string (optional)
 * @param {string} meta.branch - Current branch name ('Stable' or 'Live Beta')
 * @param {boolean} meta.isOutdated - Whether current version is outdated
 * @returns {HTMLElement} - Created badge element
 */
export function renderVersionBadge(container, meta = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.error('VERSION_UI', 'Invalid container provided to renderVersionBadge');
    return null;
  }

  const { currentVersion = 'Unknown', availableVersion = null, branch = 'Unknown', isOutdated = false } = meta;

  // Clear existing badge
  const existingBadge = qs('.mgtools-version-badge', container);
  if (existingBadge) {
    existingBadge.remove();
  }

  // Create badge container
  const badge = el('div', {
    className: 'mgtools-version-badge',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: isOutdated
        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      cursor: isOutdated ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    'data-version': currentVersion,
    'data-branch': branch
  });

  // Add hover effect for outdated versions
  if (isOutdated) {
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'translateY(-2px)';
      badge.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'translateY(0)';
      badge.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });
  }

  // Version icon
  const icon = el(
    'span',
    {
      style: { fontSize: '16px', lineHeight: '1' }
    },
    isOutdated ? '⚠️' : '✓'
  );

  // Version text
  const versionText = el(
    'span',
    {
      style: { fontWeight: '500' }
    },
    `v${currentVersion}`
  );

  // Branch badge
  const branchBadge = el(
    'span',
    {
      style: {
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        background: 'rgba(255, 255, 255, 0.25)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }
    },
    branch
  );

  // Assemble badge
  badge.appendChild(icon);
  badge.appendChild(versionText);
  badge.appendChild(branchBadge);

  // Add update indicator if outdated
  if (isOutdated && availableVersion) {
    const updateIndicator = el(
      'span',
      {
        style: {
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          background: 'rgba(255, 255, 255, 0.4)',
          animation: 'mgtools-pulse 2s infinite'
        }
      },
      `→ v${availableVersion}`
    );
    badge.appendChild(updateIndicator);
  }

  container.appendChild(badge);
  Logger.debug(
    'VERSION_UI',
    `Version badge rendered: v${currentVersion} (${branch})${isOutdated ? ' [OUTDATED]' : ''}`
  );

  return badge;
}

/* ====================================================================================
 * BRANCH SWITCHER HANDLERS
 * ====================================================================================
 */

/**
 * Wire up branch switch click handlers
 * @param {HTMLElement} container - Container with version badge
 * @param {Object} callbacks - Action callbacks
 * @param {Function} callbacks.onSwitch - Called when user clicks to switch branch
 * @returns {Function} - Cleanup function to remove handlers
 */
export function wireVersionSwitchHandlers(container, callbacks = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.error('VERSION_UI', 'Invalid container provided to wireVersionSwitchHandlers');
    return () => {};
  }

  const { onSwitch } = callbacks;

  if (typeof onSwitch !== 'function') {
    Logger.warn('VERSION_UI', 'No onSwitch callback provided to wireVersionSwitchHandlers');
    return () => {};
  }

  const badge = qs('.mgtools-version-badge', container);
  if (!badge) {
    Logger.warn('VERSION_UI', 'No version badge found in container');
    return () => {};
  }

  const currentBranch = badge.dataset.branch;
  const isOutdated = badge.style.background.includes('f093fb'); // Check for warning gradient

  // Only wire handler if version is outdated
  if (!isOutdated) {
    Logger.debug('VERSION_UI', 'Version is up-to-date, no switch handler needed');
    return () => {};
  }

  // Click handler for switching branches
  const handleClick = event => {
    event.preventDefault();
    event.stopPropagation();

    const targetBranch = currentBranch === 'Stable' ? 'Live Beta' : 'Stable';

    Logger.info('VERSION_UI', `User clicked to switch from ${currentBranch} to ${targetBranch}`);

    // Delegate action via callback
    onSwitch({
      from: currentBranch,
      to: targetBranch,
      currentVersion: badge.dataset.version
    });
  };

  badge.addEventListener('click', handleClick);
  badge.style.cursor = 'pointer';
  badge.title = 'Click to update to latest version';

  Logger.debug('VERSION_UI', 'Branch switch handler wired');

  // Return cleanup function
  return () => {
    badge.removeEventListener('click', handleClick);
    badge.style.cursor = 'default';
    badge.title = '';
    Logger.debug('VERSION_UI', 'Branch switch handler removed');
  };
}

/* ====================================================================================
 * OUTDATED VERSION TOAST
 * ====================================================================================
 */

/**
 * Show toast notification for outdated version
 * @param {Object} meta - Version metadata
 * @param {string} meta.currentVersion - Current version
 * @param {string} meta.availableVersion - Available version
 * @param {string} meta.branch - Current branch
 * @param {string} meta.targetBranch - Branch with latest version
 * @returns {number} - Toast ID
 */
export function showVersionOutdatedToast(meta = {}) {
  const {
    currentVersion = 'Unknown',
    availableVersion = 'Unknown',
    branch = 'Unknown',
    targetBranch = 'Unknown'
  } = meta;

  const message = `Update available! v${currentVersion} → v${availableVersion} (${targetBranch})`;

  const toastId = toast.warn(message, {
    duration: 10000, // 10 seconds
    dismissible: true,
    icon: '🔔'
  });

  Logger.info('VERSION_UI', `Outdated version toast shown: ${message}`);

  return toastId;
}

/* ====================================================================================
 * VERSION UI TEARDOWN
 * ====================================================================================
 */

/**
 * Safely remove version UI elements and handlers
 * @param {HTMLElement} container - Container with version badge
 */
export function teardownVersionUI(container) {
  if (!container || !(container instanceof HTMLElement)) {
    Logger.warn('VERSION_UI', 'Invalid container provided to teardownVersionUI');
    return;
  }

  const badge = qs('.mgtools-version-badge', container);
  if (badge) {
    // Remove all event listeners by cloning and replacing
    const clone = badge.cloneNode(true);
    badge.parentNode.replaceChild(clone, badge);
    clone.remove();
    Logger.debug('VERSION_UI', 'Version badge removed');
  }

  Logger.debug('VERSION_UI', 'Version UI teardown complete');
}

/* ====================================================================================
 * BRANCH SWITCHER MODAL (OPTIONAL ENHANCEMENT)
 * ====================================================================================
 */

/**
 * Render a branch switcher modal (optional, more explicit UI)
 * @param {Object} options - Modal options
 * @param {string} options.currentBranch - Current branch name
 * @param {string} options.targetBranch - Target branch name
 * @param {Function} options.onConfirm - Callback when user confirms switch
 * @param {Function} options.onCancel - Callback when user cancels
 * @returns {HTMLElement} - Modal element
 */
export function renderBranchSwitcherModal(options = {}) {
  const { currentBranch = 'Unknown', targetBranch = 'Unknown', onConfirm = () => {}, onCancel = () => {} } = options;

  // Modal overlay
  const overlay = el('div', {
    className: 'mgtools-modal-overlay',
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999999',
      animation: 'mgtools-fade-in 0.2s ease-out'
    }
  });

  // Modal content
  const modal = el('div', {
    className: 'mgtools-modal',
    style: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '400px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  });

  // Title
  const title = el(
    'h2',
    {
      style: {
        margin: '0 0 16px 0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#333'
      }
    },
    'Switch Branch?'
  );

  // Description
  const description = el(
    'p',
    {
      style: {
        margin: '0 0 24px 0',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#666'
      }
    },
    `You are currently on ${currentBranch}. Switch to ${targetBranch} to get the latest version?`
  );

  // Button container
  const buttonContainer = el('div', {
    style: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    }
  });

  // Cancel button
  const cancelBtn = el(
    'button',
    {
      style: {
        padding: '10px 20px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        background: 'white',
        color: '#666',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }
    },
    'Cancel'
  );

  cancelBtn.addEventListener('click', () => {
    overlay.remove();
    onCancel();
  });

  // Confirm button
  const confirmBtn = el(
    'button',
    {
      style: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
      }
    },
    'Switch Branch'
  );

  confirmBtn.addEventListener('click', () => {
    overlay.remove();
    onConfirm({ from: currentBranch, to: targetBranch });
  });

  // Assemble modal
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  modal.appendChild(title);
  modal.appendChild(description);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.remove();
      onCancel();
    }
  });

  document.body.appendChild(overlay);
  Logger.debug('VERSION_UI', 'Branch switcher modal rendered');

  return overlay;
}

/* ====================================================================================
 * INITIALIZATION
 * ====================================================================================
 */

// Ensure base UI styles are loaded (from M7)
ensureStyles();

Logger.info('VERSION_UI', 'Version badge UI module loaded');
