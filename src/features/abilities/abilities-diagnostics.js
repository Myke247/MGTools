/**
 * Abilities Diagnostic Tools
 *
 * Provides diagnostic utilities for debugging ability log storage issues:
 * - Comprehensive storage diagnostics
 * - Log fingerprinting for identification
 * - Multi-source inspection (GM storage, localStorage, memory, etc.)
 * - Malformed ability name detection
 * - Unknown ability type validation
 *
 * Used primarily for debugging storage persistence issues when logs
 * don't clear properly or appear in unexpected locations.
 *
 * @module features/abilities/abilities-diagnostics
 */
import { productionLog, productionError, productionWarn, debugLog } from '../../core/logging.js';

import { normalizeAbilityName, isKnownAbilityType } from './abilities-data.js';

/**
 * Diagnose ability log storage across all locations
 *
 * Comprehensive diagnostic tool that inspects ALL storage locations
 * where ability logs might exist:
 * - GM storage (Tampermonkey) - main + archive
 * - window.localStorage - main + archive
 * - targetWindow.localStorage - main + archive (if different from window)
 * - MGA_data nested logs
 * - Compatibility array (window.petAbilityLogs)
 * - Memory (UnifiedState)
 *
 * Features:
 * - Log fingerprinting for duplicate detection
 * - Malformed name detection (missing spaces)
 * - Unknown ability type validation
 * - Before/after comparison support
 * - Detailed console reporting
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - State object
 * @param {Function} [dependencies.GM_getValue] - Tampermonkey GM function
 * @param {Window} [dependencies.window] - Window object
 * @param {Window} [dependencies.targetWindow] - Target window
 * @param {Function} [dependencies.logDebug] - Debug logging
 * @param {Console} [dependencies.console] - Console for output
 * @param {object} [dependencies.Date] - Date constructor
 * @returns {object} Diagnostic report with sources, summary, and totals
 *
 * @example
 * const report = MGA_diagnoseAbilityLogStorage({ UnifiedState, GM_getValue, window });
 * productionLog(report.summary); // { totalLocationsWithLogs: 3, totals: {...}, suspectSources: [...] }
 */
export function MGA_diagnoseAbilityLogStorage(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    GM_getValue, // Passed via dependencies - no default to avoid circular reference
    window: win = typeof window !== 'undefined' ? window : null,
    targetWindow = typeof window !== 'undefined' && window.targetWindow ? window.targetWindow : null,
    logDebug = typeof window !== 'undefined' && window.logDebug ? window.logDebug : () => {},
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {} },
    Date: DateClass = typeof Date !== 'undefined' ? Date : null
  } = dependencies;

  logDebug('ABILITY-LOGS', '🔍 Starting comprehensive ability log storage diagnostic...');

  const report = {
    timestamp: new DateClass().toISOString(),
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
          const normalizedAbility = normalizeAbilityName(abilityType, dependencies);
          const isKnown = isKnownAbilityType(normalizedAbility);
          const isMalformed = abilityType !== normalizedAbility;

          return {
            ability: abilityType,
            normalizedAbility: isMalformed ? normalizedAbility : null,
            isKnown,
            isMalformed,
            pet: l.petName || l.petSpecies || 'unknown',
            timestamp: l.timestamp,
            time: new DateClass(l.timestamp).toLocaleString(),
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
      } else {
        return { exists: true, count: 'not-an-array', logs: [] };
      }
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
  if (typeof win?.petAbilityLogs !== 'undefined') {
    report.sources.compatibilityArray = {
      count: Array.isArray(win.petAbilityLogs) ? win.petAbilityLogs.length : 'not-an-array',
      sample: Array.isArray(win.petAbilityLogs) ? win.petAbilityLogs.slice(0, 3) : null
    };
  }

  // 6. Current memory state
  const memoryLogs = (UnifiedState?.data?.petAbilityLogs || []).map(l => {
    const abilityType = l.abilityType || 'unknown';
    const normalizedAbility = normalizeAbilityName(abilityType, dependencies);
    const isKnown = isKnownAbilityType(normalizedAbility);
    const isMalformed = abilityType !== normalizedAbility;

    return {
      ability: abilityType,
      normalizedAbility: isMalformed ? normalizedAbility : null,
      isKnown,
      isMalformed,
      pet: l.petName || l.petSpecies || 'unknown',
      timestamp: l.timestamp,
      time: new DateClass(l.timestamp).toLocaleString(),
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

  // Output report
  consoleFn.log('🔍 ========== ABILITY LOGS STORAGE DIAGNOSTIC ==========');
  consoleFn.log('📊 Summary:', report.summary);
  consoleFn.log('');

  // Show counts for each storage location
  consoleFn.log('📁 GM Storage:');
  consoleFn.log('  Main:', report.sources.gmStorage.main.count, 'logs');
  consoleFn.log('  Archive:', report.sources.gmStorage.archive.count, 'logs');

  consoleFn.log('📁 Window localStorage:');
  consoleFn.log('  Main:', report.sources.windowLocalStorage.main.count, 'logs');
  consoleFn.log('  Archive:', report.sources.windowLocalStorage.archive.count, 'logs');
  consoleFn.log('  Clear flag:', report.sources.windowLocalStorage.clearFlag);

  if (report.sources.targetWindowLocalStorage) {
    consoleFn.log('📁 Target Window localStorage:');
    consoleFn.log('  Main:', report.sources.targetWindowLocalStorage.main.count, 'logs');
    consoleFn.log('  Archive:', report.sources.targetWindowLocalStorage.archive.count, 'logs');
  }

  if (report.sources.mgaDataNested) {
    consoleFn.log('📁 MGA_data nested:', report.sources.mgaDataNested);
  }

  if (report.sources.compatibilityArray) {
    consoleFn.log('📁 Compatibility array:', report.sources.compatibilityArray);
  }

  consoleFn.log('💾 Memory:', report.sources.memory.unifiedState.count, 'logs');
  consoleFn.log('');

  // DETAILED LOG LISTING - Show individual logs from each source
  consoleFn.log('📋 ========== DETAILED LOG LISTING ==========');

  const showLogs = (title, logs) => {
    if (logs && logs.length > 0) {
      consoleFn.log(`\n${title}:`);
      logs.forEach((log, i) => {
        const prefix = log.isMalformed ? '⚠️ MALFORMED' : log.isKnown ? '✅' : '❓ UNKNOWN';
        consoleFn.log(`  ${i + 1}. ${prefix} [${log.fingerprint}]`);
        consoleFn.log(`     ${log.ability} - ${log.pet}`);
        if (log.isMalformed) {
          consoleFn.log(`     → Should be: "${log.normalizedAbility}"`);
        }
        consoleFn.log(`     ${log.time}`);
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

  consoleFn.log('\n=======================================================');
  consoleFn.log('💡 TIPS:');
  consoleFn.log('  • Look for logs with identical fingerprints across multiple storage locations');
  consoleFn.log('  • If a log persists after clear, check which storage still contains it');
  if (totalMalformed > 0) {
    consoleFn.log(`  • ⚠️ Found ${totalMalformed} MALFORMED ability name(s) - missing spaces before roman numerals`);
    consoleFn.log('  • Malformed logs may not clear properly. Enable Debug Mode and click "Clear Logs".');
  }
  if (totalUnknown > 0) {
    consoleFn.log(`  • ❓ Found ${totalUnknown} UNKNOWN ability type(s) - not in known abilities list`);
  }
  consoleFn.log('=======================================================');

  logDebug('ABILITY-LOGS', '✅ Diagnostic complete - see console for full report');

  return report;
}
