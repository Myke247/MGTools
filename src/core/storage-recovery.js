/**
 * Storage Recovery & Backup System Module
 * Emergency data recovery, export/import, health checks, and migration utilities
 *
 * Features:
 * - Emergency storage scanning across GM storage, localStorage, targetWindow
 * - Pet preset export/import with JSON files
 * - Storage health checks (API availability, quota monitoring)
 * - Ability name normalization (fixes malformed roman numerals)
 * - Comprehensive diagnostic tools for debugging storage issues
 * - Data migration from localStorage to GM storage
 *
 * @module StorageRecovery
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';

/**
 * List of all known ability types for validation
 * @constant {string[]}
 */
export const KNOWN_ABILITY_TYPES = [
  // XP Boosts
  'XP Boost I',
  'XP Boost II',
  'XP Boost III',
  'Hatch XP Boost I',
  'Hatch XP Boost II',

  // Crop Size Boosts
  'Crop Size Boost I',
  'Crop Size Boost II',

  // Selling
  'Sell Boost I',
  'Sell Boost II',
  'Sell Boost III',
  'Coin Finder I',
  'Coin Finder II',

  // Harvesting
  'Harvesting',
  'Auto Harvest',

  // Growth Speed
  'Plant Growth Boost I',
  'Plant Growth Boost II',
  'Plant Growth Boost III',
  'Egg Growth Boost I',
  'Egg Growth Boost II',

  // Seeds
  'Seed Finder I',
  'Seed Finder II',
  'Special Mutations',

  // Other
  'Hunger Boost I',
  'Hunger Boost II',
  'Max Strength Boost I',
  'Max Strength Boost II'
];

/**
 * Normalize ability name (fix malformed roman numerals)
 * @param {string} name - Ability name to normalize
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - UnifiedState for settings access
 * @param {Function} dependencies.logDebug - Debug logging function
 * @returns {string} Normalized ability name
 */
export function normalizeAbilityName(name, dependencies = {}) {
  const { UnifiedState, logDebug = console.log.bind(console) } = dependencies;

  if (!name || typeof name !== 'string') return name;

  // Fix missing spaces before roman numerals
  const normalized = name
    .replace(/([a-z])III$/i, '$1 III') // "FinderIII" → "Finder III"
    .replace(/([a-z])II$/i, '$1 II') // "FinderII" → "Finder II"
    .replace(/([a-z])I$/i, '$1 I') // "FinderI" → "Finder I"
    .replace(/produce\s*scale\s*boost/gi, 'Crop Size Boost') // Game renamed this ability
    .trim();

  // Log normalization if name was changed
  if (normalized !== name && UnifiedState?.data?.settings?.debugMode) {
    logDebug('ABILITY-LOGS', `📝 Normalized ability name: "${name}" → "${normalized}"`);
  }

  return normalized;
}

/**
 * Check if ability type is known/valid
 * @param {string} abilityType - Ability type to check
 * @returns {boolean} True if known ability type
 */
export function isKnownAbilityType(abilityType) {
  if (!abilityType) return false;
  return KNOWN_ABILITY_TYPES.includes(abilityType);
}

/**
 * Emergency Storage Scanner - Checks ALL possible storage locations for lost data
 * @param {string} key - The storage key to search for (e.g., 'MGA_petPresets')
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.GM_getValue - GM getValue function
 * @param {Window} dependencies.window - Window object for localStorage
 * @param {Window} dependencies.targetWindow - Target window object
 * @returns {object} Report of what was found where
 */
export function emergencyStorageScan(key, dependencies = {}) {
  const {
    GM_getValue = null,
    window: win = typeof window !== 'undefined' ? window : null,
    targetWindow = null
  } = dependencies;

  const report = {
    key,
    timestamp: new Date().toISOString(),
    locations: {}
  };

  // Check GM storage
  try {
    if (typeof GM_getValue === 'function') {
      const gmValue = GM_getValue(key, null);
      if (gmValue) {
        const parsed = typeof gmValue === 'string' ? JSON.parse(gmValue) : gmValue;
        const itemCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length;
        report.locations.GM = {
          found: true,
          itemCount,
          dataType: Array.isArray(parsed) ? 'array' : typeof parsed,
          preview: JSON.stringify(parsed).substring(0, 200)
        };
      } else {
        report.locations.GM = { found: false };
      }
    }
  } catch (e) {
    report.locations.GM = { error: e.message };
  }

  // Check window.localStorage
  try {
    if (win && win.localStorage) {
      const lsValue = win.localStorage.getItem(key);
      if (lsValue) {
        try {
          const parsed = JSON.parse(lsValue);
          const itemCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length;
          report.locations.windowLocalStorage = {
            found: true,
            itemCount,
            dataType: Array.isArray(parsed) ? 'array' : typeof parsed,
            preview: lsValue.substring(0, 200)
          };
        } catch (parseErr) {
          report.locations.windowLocalStorage = {
            found: true,
            corrupted: true,
            rawValue: lsValue.substring(0, 200)
          };
        }
      } else {
        report.locations.windowLocalStorage = { found: false };
      }
    }
  } catch (e) {
    report.locations.windowLocalStorage = { error: e.message };
  }

  // Check targetWindow.localStorage (if different from window)
  try {
    if (targetWindow && targetWindow !== win && targetWindow.localStorage) {
      const tgValue = targetWindow.localStorage.getItem(key);
      if (tgValue) {
        try {
          const parsed = JSON.parse(tgValue);
          const itemCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length;
          report.locations.targetLocalStorage = {
            found: true,
            itemCount,
            dataType: Array.isArray(parsed) ? 'array' : typeof parsed,
            preview: tgValue.substring(0, 200)
          };
        } catch (parseErr) {
          report.locations.targetLocalStorage = {
            found: true,
            corrupted: true,
            rawValue: tgValue.substring(0, 200)
          };
        }
      } else {
        report.locations.targetLocalStorage = { found: false };
      }
    }
  } catch (e) {
    report.locations.targetLocalStorage = { error: e.message };
  }

  return report;
}

/**
 * Export pet presets to JSON file for backup
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - UnifiedState for data access
 * @param {Document} dependencies.document - Document for creating download link
 * @param {Window} dependencies.window - Window for URL.createObjectURL
 * @param {Function} dependencies.productionLog - Production log function
 * @param {Function} dependencies.alert - Alert function
 * @returns {void}
 */
export function exportPetPresets(dependencies = {}) {
  const {
    UnifiedState,
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    productionLog = console.log.bind(console),
    alert: alertFn = typeof alert !== 'undefined' ? alert : console.log.bind(console)
  } = dependencies;

  try {
    const presets = UnifiedState.data.petPresets || {};
    const presetCount = Object.keys(presets).length;

    if (presetCount === 0) {
      alertFn('⚠️ No pet presets to export!\n\nCreate some presets first.');
      return;
    }

    // Create export object with metadata
    const exportData = {
      version: '3.8.8',
      exportDate: new Date().toISOString(),
      presetCount,
      presets,
      presetsOrder: UnifiedState.data.petPresetsOrder || []
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = win.URL.createObjectURL(dataBlob);

    const link = doc.createElement('a');
    link.href = url;
    link.download = `mgtools-presets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    // Cleanup
    win.URL.revokeObjectURL(url);

    productionLog(`✅ [EXPORT] Successfully exported ${presetCount} pet presets`);
    alertFn(`✅ Exported ${presetCount} pet presets!\n\nFile saved to Downloads folder.`);
  } catch (error) {
    productionError('❌ [EXPORT] Failed to export presets:', error);
    alertFn(`❌ Export failed!\n\nError: ${error.message}`);
  }
}

/**
 * Import pet presets from JSON file
 * @param {object} dependencies - Injected dependencies
 * @param {object} dependencies.UnifiedState - UnifiedState for data access
 * @param {Document} dependencies.document - Document for file input
 * @param {Window} dependencies.window - Window for reload
 * @param {Function} dependencies.MGA_saveJSON - Save function
 * @param {Function} dependencies.productionLog - Production log function
 * @param {Function} dependencies.alert - Alert function
 * @param {Function} dependencies.confirm - Confirm function
 * @returns {void}
 */
export function importPetPresets(dependencies = {}) {
  const {
    UnifiedState,
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    MGA_saveJSON = () => {},
    productionLog = console.log.bind(console),
    alert: alertFn = typeof alert !== 'undefined' ? alert : console.log.bind(console),
    confirm: confirmFn = typeof confirm !== 'undefined' ? confirm : () => true
  } = dependencies;

  try {
    // Create file input
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async e => {
      try {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate import data
        if (!importData.presets || typeof importData.presets !== 'object') {
          throw new Error('Invalid preset file format');
        }

        const importCount = Object.keys(importData.presets).length;
        const currentCount = Object.keys(UnifiedState.data.petPresets || {}).length;

        // Ask for confirmation
        const confirmed = confirmFn(
          `📥 Import ${importCount} presets?\n\n` +
            `Current presets: ${currentCount}\n` +
            `Import date: ${importData.exportDate || 'Unknown'}\n` +
            `Version: ${importData.version || 'Unknown'}\n\n` +
            `⚠️ This will OVERWRITE your current presets!`
        );

        if (!confirmed) {
          productionLog('⏸️ [IMPORT] User cancelled import');
          return;
        }

        // Perform import
        UnifiedState.data.petPresets = importData.presets;
        UnifiedState.data.petPresetsOrder = importData.presetsOrder || [];

        // Save to storage
        MGA_saveJSON('MGA_petPresets', importData.presets);
        MGA_saveJSON('MGA_petPresetsOrder', importData.presetsOrder || []);

        productionLog(`✅ [IMPORT] Successfully imported ${importCount} pet presets`);
        alertFn(`✅ Imported ${importCount} presets!\n\nPage will reload to apply changes.`);

        // Reload to refresh UI
        setTimeout(() => win.location.reload(), 1000);
      } catch (error) {
        productionError('❌ [IMPORT] Failed to import presets:', error);
        alertFn(
          `❌ Import failed!\n\nError: ${error.message}\n\nMake sure you're importing a valid MGTools preset file.`
        );
      }
    };

    input.click();
  } catch (error) {
    productionError('❌ [IMPORT] Failed to create import dialog:', error);
    alertFn(`❌ Import failed!\n\nError: ${error.message}`);
  }
}

/**
 * Comprehensive storage health check on startup
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.GM_setValue - GM setValue function
 * @param {Function} dependencies.GM_getValue - GM getValue function
 * @param {Function} dependencies.GM_deleteValue - GM deleteValue function
 * @param {Window} dependencies.window - Window object
 * @param {Navigator} dependencies.navigator - Navigator object
 * @returns {object} Health report
 */
export function performStorageHealthCheck(dependencies = {}) {
  const {
    GM_setValue = null,
    GM_getValue = null,
    GM_deleteValue = null,
    window: win = typeof window !== 'undefined' ? window : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null
  } = dependencies;

  const report = {
    timestamp: new Date().toISOString(),
    gmAvailable: false,
    localStorageAvailable: false,
    writeTest: {},
    quotaCheck: {},
    issues: []
  };

  // Check GM API availability
  try {
    if (typeof GM_setValue === 'function' && typeof GM_getValue === 'function') {
      report.gmAvailable = true;

      // Test GM write/read
      const testKey = 'MGA_health_check_test';
      const testValue = { test: true, timestamp: Date.now() };
      GM_setValue(testKey, JSON.stringify(testValue));
      const retrieved = GM_getValue(testKey, null);

      if (retrieved) {
        report.writeTest.GM = 'PASS';
        if (typeof GM_deleteValue === 'function') {
          GM_deleteValue(testKey); // Cleanup
        }
      } else {
        report.writeTest.GM = 'FAIL';
        report.issues.push('GM_setValue/GM_getValue not working properly');
      }
    } else {
      report.issues.push('GM API not available - will use localStorage fallback');
    }
  } catch (e) {
    report.writeTest.GM = 'ERROR: ' + e.message;
    report.issues.push('GM API error: ' + e.message);
  }

  // Check localStorage availability
  try {
    if (win && typeof win.localStorage !== 'undefined') {
      report.localStorageAvailable = true;

      // Test localStorage write/read
      const testKey = 'MGA_health_check_test';
      const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
      win.localStorage.setItem(testKey, testValue);
      const retrieved = win.localStorage.getItem(testKey);

      // Parse and compare objects to handle serialization differences
      try {
        const retrievedObj = JSON.parse(retrieved);
        const testObj = JSON.parse(testValue);
        if (retrievedObj && retrievedObj.test === testObj.test) {
          report.writeTest.localStorage = 'PASS';
          win.localStorage.removeItem(testKey); // Cleanup
        } else {
          report.writeTest.localStorage = 'FAIL';
          report.issues.push('localStorage read/write mismatch');
        }
      } catch (e) {
        // If parsing fails but string matches, still pass
        if (retrieved === testValue) {
          report.writeTest.localStorage = 'PASS';
          win.localStorage.removeItem(testKey);
        } else {
          report.writeTest.localStorage = 'FAIL';
          report.issues.push('localStorage read/write mismatch');
        }
      }

      // Estimate quota usage (if available)
      if (nav && 'storage' in nav && 'estimate' in nav.storage) {
        nav.storage.estimate().then(estimate => {
          const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(2);
          report.quotaCheck = {
            used: estimate.usage,
            quota: estimate.quota,
            percentUsed,
            warning: percentUsed > 80
          };

          if (percentUsed > 80) {
            report.issues.push(`Storage ${percentUsed}% full - may cause save failures`);
          }
        });
      }
    } else {
      report.issues.push('localStorage not available');
    }
  } catch (e) {
    report.writeTest.localStorage = 'ERROR: ' + e.message;
    report.issues.push('localStorage error: ' + e.message);
  }

  return report;
}

/**
 * Comprehensive ability logs diagnostic system
 * Identifies persistent ability log sources across all storage locations
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.GM_getValue - GM getValue function
 * @param {Window} dependencies.window - Window object
 * @param {Window} dependencies.targetWindow - Target window object
 * @param {object} dependencies.UnifiedState - UnifiedState for memory access
 * @param {Function} dependencies.logDebug - Debug logging function
 * @param {Function} dependencies.normalizeAbilityName - Normalization function
 * @param {Function} dependencies.isKnownAbilityType - Validation function
 * @returns {object} Diagnostic report
 */
export function diagnoseAbilityLogStorage(dependencies = {}) {
  const {
    GM_getValue = null,
    window: win = typeof window !== 'undefined' ? window : null,
    targetWindow = null,
    UnifiedState,
    logDebug = console.log.bind(console),
    normalizeAbilityName: normalizeFn = normalizeAbilityName,
    isKnownAbilityType: isKnownFn = isKnownAbilityType
  } = dependencies;

  logDebug('ABILITY-LOGS', '🔍 Starting comprehensive ability log storage diagnostic...');

  const report = {
    timestamp: new Date().toISOString(),
    sources: {}
  };

  // Helper to safely get storage
  const safeGet = (fn, label) => {
    try {
      return fn();
    } catch (e) {
      logDebug('ABILITY-LOGS', `  ❌ ${label}: Error - ${e.message}`);
      return null;
    }
  };

  // Helper to parse and count logs with detailed fingerprinting
  const parseAndCount = (raw, _label) => {
    if (!raw) return { exists: false, count: 0, logs: [] };
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const count = Array.isArray(parsed) ? parsed.length : 0;

      if (Array.isArray(parsed)) {
        // Create detailed log fingerprints for identification
        const logs = parsed.map(l => {
          const abilityType = l.abilityType || 'unknown';
          const normalizedAbility = normalizeFn(abilityType, dependencies);
          const isKnown = isKnownFn(normalizedAbility);
          const isMalformed = abilityType !== normalizedAbility;

          return {
            ability: abilityType,
            normalizedAbility: isMalformed ? normalizedAbility : null,
            isKnown,
            isMalformed,
            pet: l.petName || l.petSpecies || 'unknown',
            timestamp: l.timestamp,
            time: new Date(l.timestamp).toLocaleString(),
            // Create a unique fingerprint for this log
            fingerprint: `${abilityType}_${l.petName}_${l.timestamp}`.substring(0, 50)
          };
        });

        const malformedCount = logs.filter(l => l.isMalformed).length;
        const unknownCount = logs.filter(l => !l.isKnown).length;

        return {
          exists: true,
          count,
          logs,
          malformedCount,
          unknownCount
        };
      }
      return { exists: true, count: 'not-an-array', logs: [] };
    } catch (e) {
      return { exists: true, count: 'parse-error', logs: [], error: e.message };
    }
  };

  // 1. GM Storage (Tampermonkey)
  const gmMain = safeGet(() => (GM_getValue ? GM_getValue('MGA_petAbilityLogs', null) : null), 'GM Main');
  const gmArchive = safeGet(() => (GM_getValue ? GM_getValue('MGA_petAbilityLogs_archive', null) : null), 'GM Archive');
  report.sources.gmStorage = {
    main: parseAndCount(gmMain, 'GM Main'),
    archive: parseAndCount(gmArchive, 'GM Archive')
  };

  // 2. Window localStorage
  const lsMain = safeGet(() => win?.localStorage?.getItem('MGA_petAbilityLogs'), 'LS Main');
  const lsArchive = safeGet(() => win?.localStorage?.getItem('MGA_petAbilityLogs_archive'), 'LS Archive');
  const lsClearFlag = safeGet(() => win?.localStorage?.getItem('MGA_logs_manually_cleared'), 'LS Clear Flag');
  report.sources.windowLocalStorage = {
    main: parseAndCount(lsMain, 'LS Main'),
    archive: parseAndCount(lsArchive, 'LS Archive'),
    clearFlag: lsClearFlag
  };

  // 3. TargetWindow localStorage (if different from window)
  if (targetWindow && targetWindow !== win) {
    const tgMain = safeGet(() => targetWindow.localStorage?.getItem('MGA_petAbilityLogs'), 'TG Main');
    const tgArchive = safeGet(() => targetWindow.localStorage?.getItem('MGA_petAbilityLogs_archive'), 'TG Archive');
    report.sources.targetWindowLocalStorage = {
      main: parseAndCount(tgMain, 'TG Main'),
      archive: parseAndCount(tgArchive, 'TG Archive')
    };
  }

  // 4. MGA_data nested logs
  const mgaData = safeGet(() => (GM_getValue ? GM_getValue('MGA_data', null) : null), 'MGA_data');
  if (mgaData) {
    try {
      const parsed = typeof mgaData === 'string' ? JSON.parse(mgaData) : mgaData;
      const nestedLogs = parsed?.petAbilityLogs;
      report.sources.mgaDataNested = {
        logs: parseAndCount(nestedLogs, 'MGA_data nested')
      };
    } catch (e) {
      report.sources.mgaDataNested = { error: e.message };
    }
  }

  // 5. Window compatibility array
  if (win && typeof win.petAbilityLogs !== 'undefined') {
    report.sources.compatibilityArray = {
      count: Array.isArray(win.petAbilityLogs) ? win.petAbilityLogs.length : 'not-an-array',
      sample: Array.isArray(win.petAbilityLogs) ? win.petAbilityLogs.slice(0, 3) : null
    };
  }

  // 6. Current memory state
  const memoryLogs = (UnifiedState.data?.petAbilityLogs || []).map(l => {
    const abilityType = l.abilityType || 'unknown';
    const normalizedAbility = normalizeFn(abilityType, dependencies);
    const isKnown = isKnownFn(normalizedAbility);
    const isMalformed = abilityType !== normalizedAbility;

    return {
      ability: abilityType,
      normalizedAbility: isMalformed ? normalizedAbility : null,
      isKnown,
      isMalformed,
      pet: l.petName || l.petSpecies || 'unknown',
      timestamp: l.timestamp,
      time: new Date(l.timestamp).toLocaleString(),
      fingerprint: `${abilityType}_${l.petName}_${l.timestamp}`.substring(0, 50)
    };
  });

  report.sources.memory = {
    unifiedState: {
      count: memoryLogs.length,
      sample: memoryLogs // Now includes all logs with fingerprints
    }
  };

  // Calculate total across all sources
  const totals = {
    gmMain: report.sources.gmStorage.main.count || 0,
    gmArchive: report.sources.gmStorage.archive.count || 0,
    lsMain: report.sources.windowLocalStorage.main.count || 0,
    lsArchive: report.sources.windowLocalStorage.archive.count || 0,
    memory: report.sources.memory.unifiedState.count
  };

  report.summary = {
    totalLocationsWithLogs: Object.values(totals).filter(c => c > 0).length,
    totals,
    suspectSources: Object.entries(totals)
      .filter(([_k, v]) => v > 0)
      .map(([k]) => k)
  };

  // Output report to console
  productionLog('🔍 ========== ABILITY LOGS STORAGE DIAGNOSTIC ==========');
  productionLog('📊 Summary:', report.summary);
  productionLog('');

  // Show counts for each storage location
  productionLog('📁 GM Storage:');
  productionLog('  Main:', report.sources.gmStorage.main.count, 'logs');
  productionLog('  Archive:', report.sources.gmStorage.archive.count, 'logs');

  productionLog('📁 Window localStorage:');
  productionLog('  Main:', report.sources.windowLocalStorage.main.count, 'logs');
  productionLog('  Archive:', report.sources.windowLocalStorage.archive.count, 'logs');
  productionLog('  Clear flag:', report.sources.windowLocalStorage.clearFlag);

  if (report.sources.targetWindowLocalStorage) {
    productionLog('📁 Target Window localStorage:');
    productionLog('  Main:', report.sources.targetWindowLocalStorage.main.count, 'logs');
    productionLog('  Archive:', report.sources.targetWindowLocalStorage.archive.count, 'logs');
  }

  if (report.sources.mgaDataNested) {
    productionLog('📁 MGA_data nested:', report.sources.mgaDataNested);
  }

  if (report.sources.compatibilityArray) {
    productionLog('📁 Compatibility array:', report.sources.compatibilityArray);
  }

  productionLog('💾 Memory:', report.sources.memory.unifiedState.count, 'logs');
  productionLog('');

  // DETAILED LOG LISTING - Show individual logs from each source
  productionLog('📋 ========== DETAILED LOG LISTING ==========');

  const showLogs = (title, logs) => {
    if (logs && logs.length > 0) {
      productionLog(`\n${title}:`);
      logs.forEach((log, i) => {
        const prefix = log.isMalformed ? '⚠️ MALFORMED' : log.isKnown ? '✅' : '❓ UNKNOWN';
        productionLog(`  ${i + 1}. ${prefix} [${log.fingerprint}]`);
        productionLog(`     ${log.ability} - ${log.pet}`);
        if (log.isMalformed) {
          productionLog(`     → Should be: "${log.normalizedAbility}"`);
        }
        productionLog(`     ${log.time}`);
      });
    }
  };

  showLogs('GM Storage (Main)', report.sources.gmStorage.main.logs);
  showLogs('GM Storage (Archive)', report.sources.gmStorage.archive.logs);
  showLogs('Window localStorage (Main)', report.sources.windowLocalStorage.main.logs);
  showLogs('Window localStorage (Archive)', report.sources.windowLocalStorage.archive.logs);
  if (report.sources.targetWindowLocalStorage) {
    showLogs('TargetWindow localStorage (Main)', report.sources.targetWindowLocalStorage.main.logs);
    showLogs('TargetWindow localStorage (Archive)', report.sources.targetWindowLocalStorage.archive.logs);
  }
  if (report.sources.mgaDataNested?.logs?.logs) {
    showLogs('MGA_data nested', report.sources.mgaDataNested.logs.logs);
  }
  showLogs('Memory (UnifiedState)', report.sources.memory.unifiedState.sample);

  // Count total malformed and unknown logs
  const allSources = [
    report.sources.gmStorage.main,
    report.sources.gmStorage.archive,
    report.sources.windowLocalStorage.main,
    report.sources.windowLocalStorage.archive
  ];
  if (report.sources.targetWindowLocalStorage) {
    allSources.push(report.sources.targetWindowLocalStorage.main);
    allSources.push(report.sources.targetWindowLocalStorage.archive);
  }

  const totalMalformed = allSources.reduce((sum, src) => sum + (src.malformedCount || 0), 0);
  const totalUnknown = allSources.reduce((sum, src) => sum + (src.unknownCount || 0), 0);

  productionLog('\n=======================================================');
  productionLog('💡 TIPS:');
  productionLog('  • Look for logs with identical fingerprints across multiple storage locations');
  productionLog('  • If a log persists after clear, check which storage still contains it');
  if (totalMalformed > 0) {
    productionLog(`  • ⚠️ Found ${totalMalformed} MALFORMED ability name(s) - missing spaces before roman numerals`);
    productionLog('  • Malformed logs may not clear properly. Enable Debug Mode and click "Clear Logs".');
  }
  if (totalUnknown > 0) {
    productionLog(`  • ❓ Found ${totalUnknown} UNKNOWN ability type(s) - not in known abilities list`);
  }
  productionLog('=======================================================');

  logDebug('ABILITY-LOGS', '✅ Diagnostic complete - see console for full report');

  return report;
}

/**
 * Migrate existing localStorage data to GM storage for better reliability
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.GM_setValue - GM setValue function
 * @param {Function} dependencies.GM_getValue - GM getValue function
 * @param {Window} dependencies.window - Window object for localStorage
 * @param {Function} dependencies.productionLog - Production log function
 * @param {Function} dependencies.requestIdleCallback - requestIdleCallback function
 * @returns {object} Migration result
 */
export function migrateFromLocalStorage(dependencies = {}) {
  const {
    GM_setValue = null,
    GM_getValue = null,
    window: win = typeof window !== 'undefined' ? window : null,
    productionLog = console.log.bind(console),
    requestIdleCallback: ric = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : null
  } = dependencies;

  try {
    productionLog('🔄 [MIGRATION] Starting data migration from localStorage to GM storage...');

    // Check if migration has already been completed (handle both boolean and string values)
    const migrationComplete = GM_getValue ? GM_getValue('MGA_migration_completed', false) : false;
    if (migrationComplete === true || migrationComplete === 'true') {
      productionLog('✅ [MIGRATION] Migration already completed, skipping...');
      return { success: true, alreadyCompleted: true };
    }

    // List of keys to migrate
    const keysToMigrate = [
      'MGA_petPresets',
      'MGA_seedsToDelete',
      'MGA_autoDeleteEnabled',
      'MGA_petAbilityLogs',
      'MGA_settings',
      'MGA_mainHUDPosition',
      'MGA_toggleButtonPosition',
      'MGA_overlayDimensions',
      'MGA_overlayPositions',
      'MGA_overlayStates',
      'MGA_abilityFilters',
      'MGA_petFilters',
      'MGA_customMode',
      'MGA_filterMode',
      'MGA_timerStates'
    ];

    let migratedCount = 0;
    let totalDataSize = 0;

    // Use requestIdleCallback to avoid blocking the main thread during migration
    const migrateKeys = (keyIndex = 0) => {
      if (keyIndex >= keysToMigrate.length) {
        // Migration complete
        if (GM_setValue) {
          GM_setValue('MGA_migration_completed', true);
          GM_setValue('MGA_migration_timestamp', Date.now());
          GM_setValue('MGA_migration_stats', {
            migratedCount,
            totalDataSize,
            timestamp: Date.now()
          });
        }

        productionLog(`✅ [MIGRATION] Data migration completed!`);
        productionLog(`📊 [MIGRATION] Statistics:`, {
          migratedKeys: migratedCount,
          totalDataSize: totalDataSize + ' chars',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const key = keysToMigrate[keyIndex];
      try {
        const localStorageData = win?.localStorage?.getItem(key);
        if (localStorageData && GM_setValue && GM_getValue) {
          // Data exists in localStorage, migrate it
          GM_setValue(key, localStorageData);
          migratedCount += 1;
          totalDataSize += localStorageData.length;

          productionLog(`📦 [MIGRATION] Migrated ${key} (${localStorageData.length} chars)`);

          // Verify the migration worked
          const verification = GM_getValue(key, null);
          if (verification === localStorageData) {
            productionLog(`✅ [MIGRATION] Successfully verified ${key}`);

            // Only remove from localStorage after successful verification
            win.localStorage.removeItem(key);
            productionLog(`🗑️ [MIGRATION] Removed ${key} from localStorage`);
          } else {
            productionError(`❌ [MIGRATION] Verification failed for ${key} - keeping localStorage version`);
          }
        } else {
          // No data in localStorage for this key
          productionLog(`📝 [MIGRATION] No data found for ${key} in localStorage`);
        }
      } catch (error) {
        productionError(`❌ [MIGRATION] Failed to migrate ${key}:`, error);
      }

      // Process next key with a small delay to avoid blocking
      if (ric) {
        ric(() => migrateKeys(keyIndex + 1));
      } else {
        setTimeout(() => migrateKeys(keyIndex + 1), 0);
      }
    };

    // Start migration
    migrateKeys();

    return { success: true, migratedCount, totalDataSize };
  } catch (error) {
    productionError(`❌ [MIGRATION] Migration process failed:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get migration status for debugging
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.GM_getValue - GM getValue function
 * @returns {object} Migration status
 */
export function getMigrationStatus(dependencies = {}) {
  const { GM_getValue = null } = dependencies;

  const migrationComplete = GM_getValue ? GM_getValue('MGA_migration_completed', false) : false;
  const migrationStats = GM_getValue ? GM_getValue('MGA_migration_stats', null) : null;
  const migrationTimestamp = GM_getValue ? GM_getValue('MGA_migration_timestamp', null) : null;

  return {
    completed: migrationComplete,
    stats: migrationStats,
    timestamp: migrationTimestamp ? new Date(migrationTimestamp).toISOString() : null
  };
}
