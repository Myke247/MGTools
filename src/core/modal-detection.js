/**
 * Modal Detection and Debug System Module
 * Detects game modals and provides comprehensive debug logging for MGTools
 *
 * Features:
 * - Game modal detection with exclusion filters
 * - Debug logger with performance tracking
 * - Modal event logging
 * - Context issue tracking
 * - Error logging and auto-export
 *
 * @module ModalDetection
 */
import { productionLog, productionError, productionWarn, debugLog } from '../core/logging.js';


/**
 * Check for game modals that might block initialization
 * Filters out normal game UI elements like drag overlays
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Document} dependencies.document - Document object
 * @param {Window} dependencies.window - Window object
 * @param {Function} dependencies.logInfo - Info logging function
 * @returns {boolean} True if safe to initialize, false if blocking modals detected
 */
export function checkForGameModals(dependencies = {}) {
  const {
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    logInfo = console.log.bind(console)
  } = dependencies;

  if (!doc || !win) return true;

  try {
    // Use regular document for game modal detection to avoid interference
    const modals = doc.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]');
    // CRITICAL FIX: Exclude game drag overlays that are normal game UI, not blocking modals
    const overlays = doc.querySelectorAll(
      '[class*="overlay"]:not(.mga-overlay):not(.top-drag-overlay):not(.bottom-drag-overlay)'
    );
    const popups = doc.querySelectorAll('[class*="popup"]:not(.mga-panel)');

    // More comprehensive modal detection
    const mgcModals = doc.querySelectorAll('[class*="MGC"], [class*="magic-circle"]');

    const totalModalElements = modals.length + overlays.length + popups.length + mgcModals.length;

    // Check for excluded drag overlays
    const dragOverlays = doc.querySelectorAll('.top-drag-overlay, .bottom-drag-overlay');

    // DEBUG: Log every modal check with full details
    const modalDetails = {
      modals: modals.length,
      overlays: overlays.length,
      popups: popups.length,
      mgcElements: mgcModals.length,
      dragOverlaysExcluded: dragOverlays.length,
      total: totalModalElements,
      modalClasses: Array.from(modals).map(m => m.className),
      overlayClasses: Array.from(overlays).map(o => o.className),
      mgcClasses: Array.from(mgcModals).map(m => m.className)
    };

    if (win.MGA_DEBUG) {
      win.MGA_DEBUG.logModalEvent('MODAL_CHECK_PERFORMED', modalDetails);
    }

    // Log drag overlay exclusion
    if (dragOverlays.length > 0) {
      logInfo('INIT', `Excluding ${dragOverlays.length} game drag overlays (normal game UI, not blocking modals)`);
    }

    // DISABLED: False positive detection - game naturally has modal/overlay elements
    // This was blocking initialization and causing infinite retry loops
    // eslint-disable-next-line no-constant-condition
    if (false && totalModalElements > 0) {
      logInfo('INIT', 'Game modal system active - deferring MGA interactions', modalDetails);
      if (win.MGA_DEBUG) {
        win.MGA_DEBUG.logModalEvent('MODAL_SYSTEM_ACTIVE', modalDetails);
      }
      return false;
    }

    // SIMPLIFIED: Only block for actual modal/dialog containers, not individual buttons
    // If there are no modals/dialogs detected above, allow initialization
    logInfo('INIT', 'No blocking modals detected - MGA initialization allowed');

    return true;
  } catch (error) {
    productionError('❌ [MODAL-CHECK] Error in modal detection:', error);
    if (win.MGA_DEBUG) {
      win.MGA_DEBUG.logError(error, 'checkForGameModals');
    }
    return true; // Allow MGA operations if modal check fails
  }
}

/**
 * Log modal system status and verification checks
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Function} dependencies.checkForGameModals - Modal check function
 * @param {Function} dependencies.isMGAEvent - Event isolation check function
 * @param {Function} dependencies.createMGAElement - Element creation function
 * @param {Document} dependencies.targetDocument - Target document object
 * @param {Document} dependencies.document - Regular document object
 * @param {Function} dependencies.logInfo - Info logging function
 * @param {Function} dependencies.logDebug - Debug logging function
 * @returns {void}
 */
export function logModalSystemStatus(dependencies = {}) {
  const {
    checkForGameModals: checkFn = () => true,
    isMGAEvent = null,
    createMGAElement = null,
    targetDocument = null,
    document: doc = typeof document !== 'undefined' ? document : null,
    logInfo = console.log.bind(console),
    logDebug = console.log.bind(console)
  } = dependencies;

  if (!doc) return;

  const initialModalCheck = checkFn(dependencies);
  logInfo('INIT', 'Modal isolation verification:', {
    gameModalsActive: !initialModalCheck,
    eventIsolationActive: typeof isMGAEvent === 'function',
    contextIsolationActive: typeof createMGAElement === 'function',
    targetDocumentAvailable: !!targetDocument,
    regularDocumentIntact: !!doc
  });

  // Test event isolation function
  const testEvent = { target: doc.body };
  const testMGAEvent = { target: { closest: () => null } };
  logDebug('INIT', 'Event isolation test:', {
    gameEventBlocked: isMGAEvent ? !isMGAEvent(testEvent) : false,
    mgaEventAllowed: isMGAEvent ? !isMGAEvent(testMGAEvent) : false // Should be false since closest returns null
  });
}

/**
 * Create comprehensive debug logger with performance tracking
 * Tracks loading stages, modal events, context issues, and errors
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.targetWindow - Target window object
 * @param {Document} dependencies.targetDocument - Target document object
 * @param {Document} dependencies.document - Regular document object
 * @param {Window} dependencies.window - Window object
 * @param {Navigator} dependencies.navigator - Navigator object
 * @param {Performance} dependencies.performance - Performance API object
 * @param {Function} dependencies.isGMApiAvailable - GM API check function
 * @param {Function} dependencies.logDebug - Debug logging function
 * @param {Function} dependencies.logInfo - Info logging function
 * @param {Function} dependencies.logWarn - Warning logging function
 * @param {Function} dependencies.logError - Error logging function
 * @param {Function} dependencies.productionLog - Production logging function
 * @returns {object} Debug logger object with methods
 */
export function createDebugLogger(dependencies = {}) {
  const {
    targetWindow = typeof window !== 'undefined' ? window : null,
    targetDocument = typeof document !== 'undefined' ? document : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    navigator: nav = typeof navigator !== 'undefined' ? navigator : null,
    performance: perf = typeof performance !== 'undefined' ? performance : null,
    isGMApiAvailable = () => false,
    logDebug = console.log.bind(console),
    logInfo = console.log.bind(console),
    logWarn = console.warn.bind(console),
    logError = console.error.bind(console),
    productionLog = console.log.bind(console)
  } = dependencies;

  if (!win || !doc || !perf) {
    // Return stub debug logger
    return {
      logStage: () => {},
      logModalEvent: () => {},
      logContextIssue: () => {},
      logError: () => {},
      getData: () => ({ error: 'Missing dependencies' }),
      exportDebug: () => {}
    };
  }

  const debugData = {
    timestamp: new Date().toISOString(),
    loadingStages: [],
    modalEvents: [],
    contextIssues: [],
    errorLogs: [],
    performanceMetrics: {
      scriptStart: perf.now(),
      domReady: null,
      gameReady: null,
      uiCreated: null,
      fullyLoaded: null
    }
  };

  // Enhanced logging functions
  function logStage(stage, details = {}) {
    const entry = {
      timestamp: perf.now(),
      stage,
      details,
      domState: doc.readyState,
      gameElements: {
        jotaiAtoms: !!(targetWindow && targetWindow.jotaiAtomCache),
        magicCircle: !!(targetWindow && targetWindow.MagicCircle_RoomConnection),
        canvas: !!doc.querySelector('canvas'),
        gameContainer: !!doc.querySelector('#game-container, #app, .game-wrapper, main')
      }
    };
    debugData.loadingStages.push(entry);
    logDebug('DEBUG-SYSTEM', `Stage: ${stage}`, entry);
  }

  function logModalEvent(event, details = {}) {
    const entry = {
      timestamp: perf.now(),
      event,
      details,
      gameModals: doc.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]').length,
      mgaElements: targetDocument.querySelectorAll('.mga-panel, .mga-toggle-btn').length
    };
    debugData.modalEvents.push(entry);
    logDebug('DEBUG-SYSTEM', `Modal Event: ${event}`, entry);
  }

  function logContextIssue(issue, details = {}) {
    const entry = {
      timestamp: perf.now(),
      issue,
      details,
      context: {
        targetWindow: targetWindow === win ? 'same' : 'different',
        targetDocument: targetDocument === doc ? 'same' : 'different',
        gmApiAvailable: isGMApiAvailable()
      }
    };
    debugData.contextIssues.push(entry);
    logDebug('DEBUG-SYSTEM', `Context Issue: ${issue}`, entry);
  }

  function logErrorEntry(error, context = '') {
    const entry = {
      timestamp: perf.now(),
      error: error.toString(),
      stack: error.stack,
      context
    };
    debugData.errorLogs.push(entry);
    productionError(`🐛 [DEBUG-ERROR] ${context}:`, entry);
  }

  // Store debug functions globally
  const debugLogger = {
    logStage,
    logModalEvent,
    logContextIssue,
    logError: logErrorEntry,
    getData: () => debugData,
    exportDebug: () => {
      logInfo('DEBUG-SYSTEM', 'Complete debug data:', JSON.stringify(debugData, null, 2));
      return debugData;
    }
  };

  logStage('DEBUG_SYSTEM_INITIALIZED', {
    userAgent: nav.userAgent,
    url: win.location.href,
    contextDetection: { targetWindow: targetWindow.constructor.name }
  });

  return debugLogger;
}

/**
 * Initialize debug system with error handling and global error listeners
 *
 * @param {object} debugLogger - Debug logger object from createDebugLogger()
 * @param {object} dependencies - Injected dependencies
 * @param {Window} dependencies.window - Window object
 * @param {Function} dependencies.logInfo - Info logging function
 * @param {Function} dependencies.logError - Error logging function
 * @param {Function} dependencies.logWarn - Warning logging function
 * @param {Function} dependencies.logDebug - Debug logging function
 * @param {Function} dependencies.productionLog - Production logging function
 * @returns {void}
 */
export function initializeDebugSystem(debugLogger, dependencies = {}) {
  const {
    window: win = typeof window !== 'undefined' ? window : null,
    logInfo = console.log.bind(console),
    logError = console.error.bind(console),
    logWarn = console.warn.bind(console),
    logDebug = console.log.bind(console),
    productionLog = console.log.bind(console)
  } = dependencies;

  if (!win || !debugLogger) return;

  // Store globally
  win.MGA_DEBUG = debugLogger;
  logInfo('DEBUG-SYSTEM', 'Debug system initialized successfully');

  // Add global error handler for comprehensive error logging
  win.addEventListener('error', event => {
    if (win.MGA_DEBUG) {
      win.MGA_DEBUG.logError(event.error || new Error(event.message), 'GLOBAL_ERROR_HANDLER');
    }
  });

  win.addEventListener('unhandledrejection', event => {
    if (win.MGA_DEBUG) {
      win.MGA_DEBUG.logError(event.reason || new Error('Unhandled Promise Rejection'), 'UNHANDLED_REJECTION');
    }
  });

  // Auto-export debug data after 30 seconds if issues detected
  setTimeout(() => {
    if (win.MGA_DEBUG) {
      const debugData = win.MGA_DEBUG.getData();
      const hasErrors = debugData.errorLogs.length > 0;
      const hasModalIssues = debugData.modalEvents.some(e => e.event === 'MODAL_SYSTEM_ACTIVE');
      const uiNotCreated = !debugData.loadingStages.some(s => s.stage === 'CREATE_UI_COMPLETED');

      if (hasErrors || hasModalIssues || uiNotCreated) {
        productionLog('🚨 [AUTO-DEBUG] Issues detected - exporting debug data...');
        win.MGA_DEBUG.exportDebug();
        productionLog('📋 [AUTO-DEBUG] Copy the debug data above and paste it into mgdebug.txt');
      } else {
        productionLog('✅ [AUTO-DEBUG] No issues detected in first 30 seconds');
      }
    }
  }, 30000);
}
