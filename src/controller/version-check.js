/**
 * CONTROLLER MODULE - Version Check Controller
 * ====================================================================================
 * Orchestrates version checking by bridging M5 network layer with M8 UI layer
 *
 * @module controller/version-check
 *
 * This module provides:
 * - Version check orchestration (fetch + compare + UI update)
 * - Branch switching coordination
 * - Scheduled version checks (timer lifecycle management)
 *
 * Dependencies: CONFIG/compareVersions (M2), fetchLatestVersionMeta (M5),
 *               version-badge UI (M8), Logger (M3)
 *
 * GUARANTEES:
 * - No direct DOM manipulation (delegates to M8)
 * - No direct network calls (delegates to M5)
 * - No UnifiedState access
 * - Timer lifecycle returned as start/stop (caller owns timers)
 * - Behavior identical to original inline flow
 */

import { CONFIG, compareVersions } from '../utils/constants.js';
import { fetchLatestVersionMeta } from '../core/network.js';
import {
  renderVersionBadge,
  wireVersionSwitchHandlers,
  showVersionOutdatedToast,
  teardownVersionUI
} from '../ui/version-badge.js';
import { Logger } from '../core/logging.js';

/* ====================================================================================
 * VERSION CHECK ORCHESTRATION
 * ====================================================================================
 */

/**
 * Run a single version check
 * @param {Object} options - Version check options
 * @param {HTMLElement} options.badgeRoot - Container for version badge UI
 * @param {boolean} options.isLiveBeta - Whether running on Live Beta branch
 * @param {Function} options.onSwitchBranch - Callback when user switches branch
 * @returns {Promise<Object>} - Check result with status and metadata
 */
export async function runVersionCheck(options = {}) {
  const {
    badgeRoot = null,
    isLiveBeta = false,
    onSwitchBranch = null
  } = options;

  if (!badgeRoot || !(badgeRoot instanceof HTMLElement)) {
    Logger.error('VERSION_CHECK', 'Invalid badgeRoot provided to runVersionCheck');
    return { success: false, error: 'Invalid container' };
  }

  Logger.info('VERSION_CHECK', 'Running version check...');

  try {
    // Fetch latest version metadata from network (M5)
    const versionMeta = await fetchLatestVersionMeta();

    if (!versionMeta || !versionMeta.version) {
      Logger.warn('VERSION_CHECK', 'Failed to fetch version metadata');
      return { success: false, error: 'Fetch failed' };
    }

    const { version: availableVersion, branch: availableBranch } = versionMeta;
    const currentVersion = CONFIG.VERSION.CURRENT;
    const currentBranch = isLiveBeta ? 'Live Beta' : 'Stable';

    Logger.info('VERSION_CHECK', `Current: v${currentVersion} (${currentBranch}), Available: v${availableVersion} (${availableBranch})`);

    // Compare versions using M2 utility
    const comparison = compareVersions(currentVersion, availableVersion);
    const isOutdated = comparison < 0; // Current version is older

    // Render/update version badge UI (M8)
    renderVersionBadge(badgeRoot, {
      currentVersion,
      availableVersion,
      branch: currentBranch,
      isOutdated
    });

    // Wire up branch switch handlers if outdated (M8)
    if (isOutdated && typeof onSwitchBranch === 'function') {
      wireVersionSwitchHandlers(badgeRoot, {
        onSwitch: (switchData) => {
          Logger.info('VERSION_CHECK', `User initiating branch switch: ${switchData.from} → ${switchData.to}`);
          onSwitchBranch(switchData);
        }
      });

      // Show outdated toast notification (M8)
      showVersionOutdatedToast({
        currentVersion,
        availableVersion,
        branch: currentBranch,
        targetBranch: availableBranch
      });

      Logger.warn('VERSION_CHECK', `Version outdated: v${currentVersion} → v${availableVersion}`);
    } else if (isOutdated) {
      Logger.warn('VERSION_CHECK', 'Version outdated but no switch handler provided');
    } else {
      Logger.info('VERSION_CHECK', 'Version is up-to-date');
    }

    return {
      success: true,
      currentVersion,
      availableVersion,
      currentBranch,
      availableBranch,
      isOutdated,
      comparison
    };

  } catch (error) {
    Logger.error('VERSION_CHECK', 'Version check failed', error);
    return { success: false, error: error.message };
  }
}

/* ====================================================================================
 * SCHEDULED VERSION CHECKS
 * ====================================================================================
 */

/**
 * Schedule periodic version checks
 * @param {Object} options - Scheduling options
 * @param {HTMLElement} options.badgeRoot - Container for version badge UI
 * @param {number} options.intervalMs - Check interval in milliseconds (default: 1 hour)
 * @param {boolean} options.isLiveBeta - Whether running on Live Beta branch
 * @param {Function} options.onSwitchBranch - Callback when user switches branch
 * @param {boolean} options.runImmediately - Run first check immediately (default: true)
 * @returns {Object} - Timer control object with start() and stop() methods
 */
export function scheduleVersionChecks(options = {}) {
  const {
    badgeRoot = null,
    intervalMs = 60 * 60 * 1000, // 1 hour default
    isLiveBeta = false,
    onSwitchBranch = null,
    runImmediately = true
  } = options;

  if (!badgeRoot || !(badgeRoot instanceof HTMLElement)) {
    Logger.error('VERSION_CHECK', 'Invalid badgeRoot provided to scheduleVersionChecks');
    return { start: () => {}, stop: () => {} };
  }

  let intervalId = null;
  let isRunning = false;

  /**
   * Start scheduled checks
   */
  const start = () => {
    if (isRunning) {
      Logger.warn('VERSION_CHECK', 'Version checks already running');
      return;
    }

    Logger.info('VERSION_CHECK', `Scheduling version checks every ${intervalMs}ms`);

    // Run immediately if requested
    if (runImmediately) {
      runVersionCheck({
        badgeRoot,
        isLiveBeta,
        onSwitchBranch
      }).catch(error => {
        Logger.error('VERSION_CHECK', 'Initial version check failed', error);
      });
    }

    // Schedule periodic checks
    intervalId = setInterval(() => {
      runVersionCheck({
        badgeRoot,
        isLiveBeta,
        onSwitchBranch
      }).catch(error => {
        Logger.error('VERSION_CHECK', 'Scheduled version check failed', error);
      });
    }, intervalMs);

    isRunning = true;
    Logger.debug('VERSION_CHECK', 'Version check scheduler started');
  };

  /**
   * Stop scheduled checks
   */
  const stop = () => {
    if (!isRunning) {
      Logger.warn('VERSION_CHECK', 'Version checks not running');
      return;
    }

    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    isRunning = false;
    Logger.debug('VERSION_CHECK', 'Version check scheduler stopped');
  };

  return { start, stop };
}

/* ====================================================================================
 * MANUAL VERSION REFRESH
 * ====================================================================================
 */

/**
 * Force a version check and reload if update available
 * @param {Object} options - Refresh options
 * @param {HTMLElement} options.badgeRoot - Container for version badge UI
 * @param {boolean} options.isLiveBeta - Whether running on Live Beta branch
 * @param {Function} options.onUpdateAvailable - Callback when update is available
 * @returns {Promise<boolean>} - True if update available, false otherwise
 */
export async function checkAndPromptUpdate(options = {}) {
  const {
    badgeRoot = null,
    isLiveBeta = false,
    onUpdateAvailable = null
  } = options;

  Logger.info('VERSION_CHECK', 'Manual version refresh requested');

  const result = await runVersionCheck({
    badgeRoot,
    isLiveBeta,
    onSwitchBranch: (switchData) => {
      Logger.info('VERSION_CHECK', `Manual update: ${switchData.from} → ${switchData.to}`);
      if (typeof onUpdateAvailable === 'function') {
        onUpdateAvailable(switchData);
      }
    }
  });

  if (result.success && result.isOutdated) {
    Logger.info('VERSION_CHECK', 'Update available via manual check');
    return true;
  } else if (result.success) {
    Logger.info('VERSION_CHECK', 'No update available');
    return false;
  } else {
    Logger.error('VERSION_CHECK', 'Manual version check failed');
    return false;
  }
}

/* ====================================================================================
 * BRANCH DETECTION HELPER
 * ====================================================================================
 */

/**
 * Detect current branch from script metadata or URL
 * @returns {Object} - Branch detection result
 */
export function detectCurrentBranch() {
  // Check GM_info metadata if available
  if (typeof GM_info !== 'undefined' && GM_info?.script?.updateURL) {
    const isLiveBeta = GM_info.script.updateURL.includes('Live-Beta');
    return {
      isLiveBeta,
      branch: isLiveBeta ? 'Live Beta' : 'Stable',
      source: 'GM_info'
    };
  }

  // Check CONFIG version string
  const currentVersion = CONFIG.VERSION.CURRENT;
  if (currentVersion.includes('beta') || currentVersion.includes('Beta')) {
    return {
      isLiveBeta: true,
      branch: 'Live Beta',
      source: 'version_string'
    };
  }

  // Default to stable
  return {
    isLiveBeta: false,
    branch: 'Stable',
    source: 'default'
  };
}

/* ====================================================================================
 * INITIALIZATION
 * ====================================================================================
 */

Logger.info('VERSION_CHECK', 'Version check controller module loaded');
