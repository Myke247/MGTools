/**
 * Version Checker Module
 * Handles version checking and update notifications for MGTools
 *
 * Features:
 * - Fetches version info from GitHub (stable and beta branches)
 * - Compares current version with GitHub versions
 * - Updates UI indicator with color-coded status
 * - Handles Discord CSP restrictions
 * - Click handlers for retry and install links
 *
 * @module VersionChecker
 */

/**
 * Compare two semantic version strings
 * @param {string} v1 - First version string (e.g., "1.2.3")
 * @param {string} v2 - Second version string (e.g., "1.2.4")
 * @param {object} dependencies - Injected dependencies
 * @returns {number} -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1, v2, dependencies = {}) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Check for MGTools version updates from GitHub
 * Updates the indicator element with version status and color-coded visual feedback
 *
 * @param {HTMLElement} indicatorElement - DOM element to update with version status
 * @param {object} dependencies - Injected dependencies
 * @param {string} dependencies.CURRENT_VERSION - Current script version
 * @param {boolean} dependencies.IS_LIVE_BETA - Whether running beta version
 * @param {string} dependencies.STABLE_DOWNLOAD_URL - URL to stable download
 * @param {string} dependencies.BETA_DOWNLOAD_URL - URL to beta download
 * @param {boolean} dependencies.isDiscordPage - Whether running on Discord
 * @param {Window} dependencies.window - Window object
 * @param {Console} dependencies.console - Console object for logging
 * @returns {Promise<void>}
 */
export async function checkVersion(indicatorElement, dependencies = {}) {
  const {
    CURRENT_VERSION = '1.0.0',
    IS_LIVE_BETA = false,
    STABLE_DOWNLOAD_URL = 'https://github.com/Myke247/MGTools/raw/main/MGTools.user.js',
    BETA_DOWNLOAD_URL = 'https://github.com/Myke247/MGTools/raw/Live-Beta/MGTools.user.js',
    isDiscordPage = false,
    window: win = typeof window !== 'undefined' ? window : null,
    console: con = typeof console !== 'undefined' ? console : null
  } = dependencies;

  if (!win || !indicatorElement) return;

  // Skip version check on Discord to avoid CSP violations
  if (isDiscordPage) {
    const branchLabel = IS_LIVE_BETA ? 'BETA' : 'STABLE';
    indicatorElement.style.color = IS_LIVE_BETA ? '#ff9500' : '#00ff00'; // Orange for beta, green for stable

    const tooltipLines = [
      `CURRENT VERSION: v${CURRENT_VERSION} (${branchLabel})`,
      `STATUS: Version check disabled on Discord`,
      '',
      'Shift+Click: Install Stable',
      'Shift+Alt+Click: Install Beta'
    ];

    indicatorElement.title = tooltipLines.join('\n');
    indicatorElement.style.cursor = 'pointer';

    indicatorElement.addEventListener('click', e => {
      e.stopPropagation();
      if (e.shiftKey && e.altKey) {
        win.open(BETA_DOWNLOAD_URL, '_blank');
      } else if (e.shiftKey) {
        win.open(STABLE_DOWNLOAD_URL, '_blank');
      }
    });
    return;
  }

  // Fetch BOTH stable and beta versions
  const cacheBust = `?t=${Date.now()}`;

  /**
   * Fetch version string from GitHub for a specific branch
   * @param {string} branch - Branch name ('main' or 'Live-Beta')
   * @returns {Promise<string|null>} Version string or null if fetch failed
   */
  async function fetchVersion(branch) {
    const urls = [
      `https://raw.githubusercontent.com/Myke247/MGTools/${branch}/MGTools.user.js${cacheBust}`,
      `https://api.github.com/repos/Myke247/MGTools/contents/MGTools.user.js`
    ];

    for (const url of urls) {
      try {
        const isGitHubAPI = url.includes('api.github.com');
        const response = await win.fetch(url, {
          method: 'GET',
          cache: 'no-cache',
          headers: isGitHubAPI ? { Accept: 'application/vnd.github.v3.raw' } : {}
        });

        if (response.ok) {
          const text = await response.text();
          const match = text.match(/@version\s+([\d.]+)/);
          if (match) return match[1];
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  try {
    const [stableVersion, betaVersion] = await Promise.all([fetchVersion('main'), fetchVersion('Live-Beta')]);

    if (!stableVersion && !betaVersion) {
      // Both failed
      const branchLabel = IS_LIVE_BETA ? 'BETA' : 'STABLE';
      indicatorElement.style.color = IS_LIVE_BETA ? '#ff9500' : '#ffa500';

      const tooltipLines = [
        `CURRENT VERSION: v${CURRENT_VERSION} (${branchLabel})`,
        `STATUS: Version check failed`,
        '',
        'Click: Retry',
        'Shift+Click: Install Stable',
        'Shift+Alt+Click: Install Beta'
      ];

      indicatorElement.title = tooltipLines.join('\n');
      indicatorElement.style.cursor = 'pointer';

      const newIndicator = indicatorElement.cloneNode(true);
      indicatorElement.parentNode.replaceChild(newIndicator, indicatorElement);

      newIndicator.addEventListener('click', e => {
        e.stopPropagation();
        if (e.shiftKey && e.altKey) {
          win.open(BETA_DOWNLOAD_URL, '_blank');
        } else if (e.shiftKey) {
          win.open(STABLE_DOWNLOAD_URL, '_blank');
        } else {
          newIndicator.style.color = '#888';
          newIndicator.title = 'Checking for updates...';
          checkVersion(newIndicator, dependencies);
        }
      });
      return;
    }

    // Compare current version with the appropriate branch version
    const relevantVersion = IS_LIVE_BETA ? betaVersion : stableVersion;
    const versionComparison = compareVersions(CURRENT_VERSION, relevantVersion);

    // Determine color and status
    let color;
    let statusMsg;
    const branchLabel = IS_LIVE_BETA ? 'BETA' : 'STABLE';

    if (IS_LIVE_BETA) {
      // On Live Beta branch - use orange/yellow colors
      if (versionComparison === 0) {
        color = '#ff9500'; // Orange for up-to-date beta
        statusMsg = 'UP TO DATE';
      } else if (versionComparison > 0) {
        color = '#ffff00'; // Yellow for dev beta
        statusMsg = 'DEV VERSION';
      } else {
        color = '#ff00ff'; // Magenta for outdated beta
        statusMsg = 'UPDATE AVAILABLE';
      }
    } else {
      // On Stable branch - use green colors
      if (versionComparison === 0) {
        color = '#00ff00'; // Bright green for up-to-date stable
        statusMsg = 'UP TO DATE';
      } else if (versionComparison > 0) {
        color = '#90ee90'; // Light green for dev stable
        statusMsg = 'DEV VERSION';
      } else {
        color = '#ff0000'; // Red for outdated stable
        statusMsg = 'UPDATE AVAILABLE';
      }
    }

    // Build clear, easy-to-read tooltip
    const tooltipLines = [
      `CURRENT VERSION: v${CURRENT_VERSION} (${branchLabel})`,
      `STATUS: ${statusMsg}`,
      '',
      `GitHub Versions:`,
      IS_LIVE_BETA
        ? `  Your Branch (Beta): v${betaVersion || 'Loading...'}`
        : `  Your Branch (Stable): v${stableVersion || 'Loading...'}`,
      IS_LIVE_BETA
        ? `  Other Branch (Stable): v${stableVersion || 'Loading...'}`
        : `  Other Branch (Beta): v${betaVersion || 'Loading...'}`,
      '',
      'Click: Recheck',
      'Shift+Click: Install Stable',
      'Shift+Alt+Click: Install Beta'
    ];

    indicatorElement.style.color = color;
    indicatorElement.title = tooltipLines.join('\n');
    indicatorElement.style.cursor = 'pointer';

    // Add click handler
    const newIndicator = indicatorElement.cloneNode(true);
    indicatorElement.parentNode.replaceChild(newIndicator, indicatorElement);

    newIndicator.addEventListener('click', e => {
      e.stopPropagation();
      if (e.shiftKey && e.altKey) {
        win.open(BETA_DOWNLOAD_URL, '_blank');
      } else if (e.shiftKey) {
        win.open(STABLE_DOWNLOAD_URL, '_blank');
      } else {
        newIndicator.style.color = '#888';
        newIndicator.title = `v${CURRENT_VERSION} - Checking for updates...`;
        checkVersion(newIndicator, dependencies);
      }
    });
  } catch (e) {
    // Unexpected error
    const branchLabel = IS_LIVE_BETA ? 'BETA' : 'STABLE';
    indicatorElement.style.color = IS_LIVE_BETA ? '#ff9500' : '#ffa500';

    const tooltipLines = [
      `CURRENT VERSION: v${CURRENT_VERSION} (${branchLabel})`,
      `STATUS: Version check failed`,
      '',
      'Click: Retry',
      'Shift+Click: Install Stable',
      'Shift+Alt+Click: Install Beta'
    ];

    indicatorElement.title = tooltipLines.join('\n');
    indicatorElement.style.cursor = 'pointer';

    const newIndicator = indicatorElement.cloneNode(true);
    indicatorElement.parentNode.replaceChild(newIndicator, indicatorElement);

    newIndicator.addEventListener('click', e => {
      e.stopPropagation();
      if (e.shiftKey && e.altKey) {
        win.open(BETA_DOWNLOAD_URL, '_blank');
      } else if (e.shiftKey) {
        win.open(STABLE_DOWNLOAD_URL, '_blank');
      } else {
        newIndicator.style.color = '#888';
        newIndicator.title = 'Checking for updates...';
        checkVersion(newIndicator, dependencies);
      }
    });

    if (con) {
      con.log('[VERSION CHECK] Error:', e);
    }
  }
}
