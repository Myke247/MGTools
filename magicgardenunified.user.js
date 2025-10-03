// ==UserScript==
// @name         MGTools
// @namespace    http://tampermonkey.net/
// @version      1.17.0
// @description  All-in-one assistant for Magic Garden with beautiful unified UI (Works on Discord!)
// @author       Unified Script
// @match        https://magiccircle.gg/r/*
// @match        https://magicgarden.gg/r/*
// @match        https://starweaver.org/r/*
// @match        https://discord.com/channels/*
// @match        https://canary.discord.com/channels/*
// @match        https://ptb.discord.com/channels/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== PRODUCTION MODE (MUST BE FIRST) ====================
    // Set to true to disable non-critical logging for performance
    const PRODUCTION = true; // OPTIMIZED: Enabled to dramatically improve FPS

    // Production-aware console logging - optimized as no-ops for performance
    const productionLog = PRODUCTION ? () => {} : console.log.bind(console);
    const productionWarn = PRODUCTION ? () => {} : console.warn.bind(console);
    // Keep errors enabled for critical issues
    const productionError = console.error.bind(console);

    // ==================== SELECTIVE CONTEXT ISOLATION ====================
    // Detect execution context and set up selective window/document references
    const isUserscript = typeof unsafeWindow !== 'undefined';
    const targetWindow = isUserscript ? unsafeWindow : window;
    const targetDocument = targetWindow.document;

    // Set context identifier for debugging (use window not targetWindow to avoid modifying page)
    window.MGA_CONTEXT = isUserscript ? 'userscript' : 'console';

    // GM API availability check
    function isGMApiAvailable() {
        return typeof GM_setValue !== 'undefined' && typeof GM_getValue !== 'undefined';
    }

    // SELECTIVE CONTEXT FUNCTIONS - Use these instead of direct document/window references
    function createMGAElement(tag, className) {
        const element = targetDocument.createElement(tag);
        if (className) element.className = className;
        return element;
    }

    function attachToMGAContext(element) {
        targetDocument.body.appendChild(element);
    }

    function isMGAEvent(event) {
        try {
            return event && event.target && event.target.closest &&
                   event.target.closest('.mga-panel, .mga-toggle-btn, .mga-overlay');
        } catch (error) {
            console.error('❌ [BASIC-DEBUG] Error in isMGAEvent:', error);
            return false;
        }
    }

    function checkForGameModals() {
        try {
            // Use regular document for game modal detection to avoid interference
            const modals = document.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]');
            // CRITICAL FIX: Exclude game drag overlays that are normal game UI, not blocking modals
            const overlays = document.querySelectorAll('[class*="overlay"]:not(.mga-overlay):not(.top-drag-overlay):not(.bottom-drag-overlay)');
            const popups = document.querySelectorAll('[class*="popup"]:not(.mga-panel)');

            // More comprehensive modal detection
            const mgcModals = document.querySelectorAll('[class*="MGC"], [class*="magic-circle"]');
            const saveDiscardButtons = document.querySelectorAll('button:not(.mga-btn)');

            const totalModalElements = modals.length + overlays.length + popups.length + mgcModals.length;

            // Check for excluded drag overlays
            const dragOverlays = document.querySelectorAll('.top-drag-overlay, .bottom-drag-overlay');

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

            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logModalEvent('MODAL_CHECK_PERFORMED', modalDetails);
            }

            // Log drag overlay exclusion
            if (dragOverlays.length > 0) {
                productionLog(`✅ [MODAL-CHECK] Excluding ${dragOverlays.length} game drag overlays (normal game UI, not blocking modals)`);
            }

            // DISABLED: False positive detection - game naturally has modal/overlay elements
            // This was blocking initialization and causing infinite retry loops
            if (false && totalModalElements > 0) {
                productionLog('⏳ [MODAL-CHECK] Game modal system active - deferring MGA interactions', modalDetails);
                if (window.MGA_DEBUG) {
                    window.MGA_DEBUG.logModalEvent('MODAL_SYSTEM_ACTIVE', modalDetails);
                }
                return false;
            }

            // SIMPLIFIED: Only block for actual modal/dialog containers, not individual buttons
            // If there are no modals/dialogs detected above, allow initialization
            productionLog(`✅ [MODAL-CHECK] No blocking modals detected - MGA initialization allowed`);

            return true;
        } catch (error) {
            console.error('❌ [MODAL-CHECK] Error in modal detection:', error);
            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logError(error, 'checkForGameModals');
            }
            return true; // Allow MGA operations if modal check fails
        }
    }

    // ==================== SCRIPT IDENTIFICATION ====================
    // DO NOT override console - causes issues in Tampermonkey sandbox

    productionLog('🔧 [CONTEXT] Script context:', window.MGA_CONTEXT);
    productionLog('🔧 [CONTEXT] GM API available:', isGMApiAvailable());
    productionLog('🔧 [CONTEXT] unsafeWindow available:', isUserscript);
    productionLog('🔧 [CONTEXT] Selective isolation enabled - game modals preserved');

    // Add manual debug export command
    productionLog('🛠️ [DEBUG] Manual debug export: Run "MGA_DEBUG.exportDebug()" in console anytime');
    productionLog('🛠️ [DEBUG] Auto-export will trigger in 30s if issues are detected');

    // Verify debug system is working
    setTimeout(() => {
        if (typeof window.MGA_DEBUG === 'undefined') {
            console.error('❌ [DEBUG-VERIFY] MGA_DEBUG is not defined! Debug system failed to initialize');
            productionLog('🔧 [FALLBACK] Basic logging will continue without full debug system');
        } else {
            productionLog('✅ [DEBUG-VERIFY] MGA_DEBUG is available and working');
            productionLog('🔧 [DEBUG-VERIFY] Available methods:', Object.keys(window.MGA_DEBUG));
        }
    }, 100);

    // Add modal system verification logging
    function logModalSystemStatus() {
        const initialModalCheck = checkForGameModals();
        productionLog('✅ [MODAL-SYSTEM] Modal isolation verification:', {
            gameModalsActive: !initialModalCheck,
            eventIsolationActive: typeof isMGAEvent === 'function',
            contextIsolationActive: typeof createMGAElement === 'function',
            targetDocumentAvailable: !!targetDocument,
            regularDocumentIntact: !!document
        });

        // Test event isolation function
        const testEvent = { target: document.body };
        const testMGAEvent = { target: { closest: () => null } };
        productionLog('🧪 [MODAL-SYSTEM] Event isolation test:', {
            gameEventBlocked: !isMGAEvent(testEvent),
            mgaEventAllowed: !isMGAEvent(testMGAEvent) // Should be false since closest returns null
        });
    }

    // Run modal system verification after a short delay
    setTimeout(logModalSystemStatus, 100);

    // ==================== COMPREHENSIVE DEBUG SYSTEM ====================

    function createDebugLogger() {
        const debugData = {
            timestamp: new Date().toISOString(),
            loadingStages: [],
            modalEvents: [],
            contextIssues: [],
            errorLogs: [],
            performanceMetrics: {
                scriptStart: performance.now(),
                domReady: null,
                gameReady: null,
                uiCreated: null,
                fullyLoaded: null
            }
        };

        // Enhanced logging functions
        function logStage(stage, details = {}) {
            const entry = {
                timestamp: performance.now(),
                stage,
                details,
                domState: document.readyState,
                gameElements: {
                    jotaiAtoms: !!(targetWindow && targetWindow.jotaiAtomCache),
                    magicCircle: !!(targetWindow && targetWindow.MagicCircle_RoomConnection),
                    canvas: !!document.querySelector('canvas'),
                    gameContainer: !!document.querySelector('#game-container, #app, .game-wrapper, main')
                }
            };
            debugData.loadingStages.push(entry);
            productionLog(`🐛 [DEBUG-STAGE] ${stage}:`, entry);
        }

        function logModalEvent(event, details = {}) {
            const entry = {
                timestamp: performance.now(),
                event,
                details,
                gameModals: document.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]').length,
                mgaElements: targetDocument.querySelectorAll('.mga-panel, .mga-toggle-btn').length
            };
            debugData.modalEvents.push(entry);
            productionLog(`🐛 [DEBUG-MODAL] ${event}:`, entry);
        }

        function logContextIssue(issue, details = {}) {
            const entry = {
                timestamp: performance.now(),
                issue,
                details,
                context: {
                    isUserscript,
                    targetWindow: targetWindow === window ? 'same' : 'different',
                    targetDocument: targetDocument === document ? 'same' : 'different',
                    gmApiAvailable: isGMApiAvailable()
                }
            };
            debugData.contextIssues.push(entry);
            productionLog(`🐛 [DEBUG-CONTEXT] ${issue}:`, entry);
        }

        function logError(error, context = '') {
            const entry = {
                timestamp: performance.now(),
                error: error.toString(),
                stack: error.stack,
                context
            };
            debugData.errorLogs.push(entry);
            console.error(`🐛 [DEBUG-ERROR] ${context}:`, entry);
        }

        // Store debug functions globally
        window.MGA_DEBUG = {
            logStage,
            logModalEvent,
            logContextIssue,
            logError,
            getData: () => debugData,
            exportDebug: () => {
                productionLog('🐛 [DEBUG-EXPORT] Complete debug data:', JSON.stringify(debugData, null, 2));
                return debugData;
            }
        };

        logStage('DEBUG_SYSTEM_INITIALIZED', {
            userAgent: navigator.userAgent,
            url: window.location.href,
            contextDetection: { isUserscript, targetWindow: targetWindow.constructor.name }
        });

        return window.MGA_DEBUG;
    }

    // Initialize debug system immediately with error handling
    let DEBUG;
    try {
        DEBUG = createDebugLogger();
        productionLog('✅ [DEBUG-INIT] Debug system initialized successfully');
    } catch (error) {
        console.error('❌ [DEBUG-INIT] Failed to initialize debug system:', error);
        // Create a minimal debug fallback
        window.MGA_DEBUG = {
            logStage: (stage, details) => productionLog(`🐛 [DEBUG-STAGE] ${stage}:`, details),
            logModalEvent: (event, details) => productionLog(`🐛 [DEBUG-MODAL] ${event}:`, details),
            logContextIssue: (issue, details) => productionLog(`🐛 [DEBUG-CONTEXT] ${issue}:`, details),
            logError: (error, context) => console.error(`🐛 [DEBUG-ERROR] ${context}:`, error),
            getData: () => ({ error: 'Debug system failed to initialize', fallback: true }),
            exportDebug: () => productionLog('🐛 [DEBUG-EXPORT] Debug system failed to initialize properly')
        };
        DEBUG = window.MGA_DEBUG;
    }

    // Add global error handler for comprehensive error logging
    window.addEventListener('error', (event) => {
        if (window.MGA_DEBUG) {
            window.MGA_DEBUG.logError(event.error || new Error(event.message), 'GLOBAL_ERROR_HANDLER');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        if (window.MGA_DEBUG) {
            window.MGA_DEBUG.logError(event.reason || new Error('Unhandled Promise Rejection'), 'UNHANDLED_REJECTION');
        }
    });

    // Auto-export debug data after 30 seconds if issues detected
    setTimeout(() => {
        if (window.MGA_DEBUG) {
            const debugData = window.MGA_DEBUG.getData();
            const hasErrors = debugData.errorLogs.length > 0;
            const hasModalIssues = debugData.modalEvents.some(e => e.event === 'MODAL_SYSTEM_ACTIVE');
            const uiNotCreated = !debugData.loadingStages.some(s => s.stage === 'CREATE_UI_COMPLETED');

            if (hasErrors || hasModalIssues || uiNotCreated) {
                productionLog('🚨 [AUTO-DEBUG] Issues detected - exporting debug data...');
                window.MGA_DEBUG.exportDebug();
                productionLog('📋 [AUTO-DEBUG] Copy the debug data above and paste it into mgdebug.txt');
            } else {
                productionLog('✅ [AUTO-DEBUG] No issues detected in first 30 seconds');
            }
        }
    }, 30000);

    // ==================== PROPER PAGE LOAD DETECTION ====================
    // Fix for document-idle timing issues - wait for complete page load
    let initializationStarted = false;

    function initializeWhenReady() {
        if (initializationStarted) return;
        initializationStarted = true;

        productionLog('🚀 Magic Garden Unified Assistant v1.6.0 - STORAGE FIX');
        productionLog('🔧 CRITICAL: Disabled data-destroying migration system');
        productionLog('🔧 Fixed: Now uses localStorage directly (100% reliable)');
        productionLog('🔧 Fixed: Active pets detection with retry logic');
        productionLog('✅ Seeds + Pet Presets will now SAVE and LOAD correctly!');
        productionLog('🔧 [TIMING] Page load state:', document.readyState);
        productionLog('🔧 [BASIC-DEBUG] Script execution started at:', new Date().toISOString());
        productionLog('🔧 [BASIC-DEBUG] Location:', window.location.href);
        productionLog('🔧 [BASIC-DEBUG] User Agent:', navigator.userAgent);

        // Proceed with initialization
        startMGAInitialization();
    }

    // CRITICAL FIX: Handle all readyState possibilities for Tampermonkey compatibility
    // document-idle means readyState is 'interactive' - not 'loading' or 'complete'
    productionLog('🔧 [INIT] Initial readyState:', document.readyState);

    // NEW: Add delay for Tampermonkey to let game load first
    const initDelay = isUserscript ? 3000 : 100; // 3 second delay for Tampermonkey, 100ms for console

    if (document.readyState === 'complete') {
        // Page is already fully loaded
        productionLog(`🔧 [INIT] Page already complete, initializing in ${initDelay}ms`);
        setTimeout(initializeWhenReady, initDelay);
    } else if (document.readyState === 'interactive') {
        // DOM is ready but resources still loading (document-idle state)
        // Wait for resources plus our delay
        productionLog(`🔧 [INIT] DOM interactive (document-idle), initializing in ${initDelay}ms...`);
        setTimeout(() => {
            initializeWhenReady();
        }, initDelay); // Delay to let game initialize
    } else {
        // readyState is 'loading' - wait for full page load
        productionLog('🔧 [INIT] DOM still loading, waiting for load event...');
        window.addEventListener('load', initializeWhenReady);

        // Backup: also listen for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            productionLog('🔧 [TIMING] DOM ready, waiting for complete load...');
        });
    }

    function startMGAInitialization() {
        productionLog('🚀 [TIMING] Starting MGA initialization with readyState:', document.readyState);

    // Detect other Magic Garden scripts
    setTimeout(() => {
        const hasMainScript = typeof window.loadJSON === 'function' ||
                             typeof window.petAbilityLogs !== 'undefined' ||
                             document.hidden === false;
        if (hasMainScript) {
            productionLog('📝 [COMPAT] Detected mainscript.txt is also running - compatibility mode enabled');
        } else {
            productionLog('📝 [COMPAT] No other Magic Garden scripts detected - running standalone');
        }
    }, 100);

    // ==================== IMMEDIATE IDLE PREVENTION ====================
    // CRITICAL: Apply idle prevention immediately before any game code runs
    (function() {
        productionLog('🚫 [IDLE-PREVENTION] Applying immediate anti-idle protection...');

        // Override document properties to prevent idle detection
        try {
            Object.defineProperty(document, "hidden", {
                value: false,
                writable: false,
                configurable: false
            });
            Object.defineProperty(document, "visibilityState", {
                value: "visible",
                writable: false,
                configurable: false
            });
            productionLog('✅ [IDLE-PREVENTION] Document properties overridden');
        } catch (e) {
            productionWarn('⚠️ [IDLE-PREVENTION] Could not override document properties:', e);
        }

        // Block idle detection events with capture phase (highest priority)
        document.addEventListener("visibilitychange", (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
        }, true);

        window.addEventListener("blur", (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
        }, true);

        window.addEventListener("focus", (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
        }, true);

        productionLog('✅ [IDLE-PREVENTION] Event listeners added with capture phase');
    })();

    // ==================== INITIALIZATION ====================
    /* CHECKPOINT removed: INITIALIZATION_START */

    // ==================== GLOBAL STYLES ====================
    const UNIFIED_STYLES = `
        .mga-panel {
            font-family: Arial, sans-serif;
            position: fixed;
            background: rgba(17, 24, 39, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0;
            color: #ffffff;
            z-index: 10000;
            min-width: 350px;
            min-height: 80px;
            max-width: 90vw;
            max-height: none;
            height: 450px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            /* Responsive text scaling via CSS variable */
            --panel-scale: 1;
            --base-font-size: 13px;
            font-size: calc(var(--base-font-size) * var(--panel-scale));
            /* Performance optimizations for smooth dragging */
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
        }

        .mga-header {
            background: rgba(74, 158, 255, 0.2);
            padding: 12px 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: grab;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Scale all text in panel responsively */
        .mga-panel *:not(svg):not(path) {
            font-size: inherit;
        }

        .mga-title {
            font-size: calc(16px * var(--panel-scale, 1));
            font-weight: 600;
            color: #4a9eff;
        }

        .mga-controls {
            display: flex;
            gap: 8px;
        }

        .mga-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: calc(13px * var(--panel-scale, 1));
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateZ(0);
            outline: none !important; /* Remove white outline/border */
        }

        .mga-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px) translateZ(0);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mga-btn:active {
            transform: translateY(0) translateZ(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .mga-btn:focus {
            outline: none !important; /* Remove white outline on focus */
            border-color: rgba(74, 158, 255, 0.5); /* Subtle blue border instead */
        }

        .mga-btn-sm {
            padding: 4px 8px;
            font-size: 12px;
            min-width: auto;
        }

        .mga-input, .mga-select {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mga-input:focus, .mga-select:focus {
            outline: none;
            border-color: #4a9eff;
            background: rgba(255, 255, 255, 0.12);
            box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
        }

        .mga-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .mga-select {
            cursor: pointer;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 16px;
            padding-right: 32px;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
        }

        .mga-select option {
            background: #111827;
            color: #ffffff;
            padding: 8px 12px;
        }

        .mga-select option:hover {
            background: #1f2937;
        }

        .mga-input:focus, .mga-select:focus {
            outline: none;
            border-color: #4a9eff;
            box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
        }

        .mga-content {
            flex: 1 1 auto;
            padding: 12px 16px;
            scroll-behavior: smooth;
            min-height: 0; /* Critical for flex scrolling */
            max-height: calc(100% - 100px); /* Restore max-height for proper scrolling */
            overflow-y: auto !important;
            overflow-x: hidden;
            position: relative;
        }

        .mga-content.mga-scrollable {
            overflow-y: auto !important;
            overflow-x: hidden !important;
        }

        .mga-tabs-container {
            position: relative;
            margin-bottom: 16px;
        }

        .mga-tabs {
            display: flex;
            overflow-x: auto;
            scroll-behavior: smooth;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
        }

        .mga-tabs::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
        }

        .mga-tab {
            flex: 0 0 auto; /* Prevent shrinking and allow natural sizing */
            min-width: fit-content; /* Allow tabs to size to their content */
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #ffffff;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px; /* Fixed size - responsive scaling via CSS var */
            display: flex;
            align-items: center;
            justify-content: flex-start; /* Align left for better text display */
            gap: 6px;
            text-align: left;
            transition: all 0.2s ease;
            min-height: 36px;
            white-space: nowrap;
            /* Never hide overflow or truncate text */
        }

        /* Tabs should scroll horizontally when panel is small, not shrink text */
        /* Font size controlled by panel scale variable for consistency */

        .mga-tab-popout {
            flex-shrink: 0; /* Prevent popout button from shrinking */
            opacity: 0.7;
            transition: opacity 0.2s ease;
            margin-left: auto; /* Push to right side of tab */
            font-size: 10px;
            line-height: 1;
            display: inline-block !important; /* Force visibility */
            visibility: visible !important; /* Force visibility */
            min-width: 16px; /* Ensure minimum clickable area */
            text-align: center;
        }

        .mga-tab-popout:hover {
            opacity: 1;
        }

        /* Ensure tab text spans display properly */
        .mga-tab span[data-icon] {
            display: inline-flex;
            align-items: center;
            white-space: nowrap;
        }

        .mga-tab-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            z-index: 10;
            transition: all 0.2s ease;
            opacity: 0;
            pointer-events: none;
        }

        .mga-tab-nav.visible {
            opacity: 1;
            pointer-events: auto;
        }

        .mga-tab-nav:hover {
            background: rgba(0, 0, 0, 0.8);
            transform: translateY(-50%) scale(1.1);
        }

        .mga-tab-nav.left {
            left: 4px;
        }

        .mga-tab-nav.right {
            right: 4px;
        }

        .mga-tab:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px) translateZ(0);
        }

        .mga-tab.active {
            background: rgba(74, 158, 255, 0.8);
            transform: translateZ(0);
            box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
        }

        .mga-tab-content {
            display: none;
        }

        .mga-tab-content.active {
            display: block;
        }

        /* Loading States */
        .mga-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: rgba(255, 255, 255, 0.7);
        }

        .mga-loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-top: 2px solid #4a9eff;
            border-radius: 50%;
            animation: mga-spin 1s linear infinite;
            margin-right: 8px;
        }

        @keyframes mga-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .mga-skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%);
            background-size: 200% 100%;
            animation: mga-skeleton-pulse 1.5s ease-in-out infinite;
            border-radius: 4px;
        }

        @keyframes mga-skeleton-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .mga-fade-in {
            animation: mga-fade-in 0.3s ease-out;
        }

        @keyframes mga-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Comprehensive Tooltip System */
        .mga-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            z-index: 30000;
            pointer-events: none;
            opacity: 0;
            /* BUGFIX: Only transition opacity, not position (prevents "sliding" effect) */
            transition: opacity 0.15s ease-in-out;
            max-width: 250px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .mga-tooltip.show {
            opacity: 1;
        }

        .mga-tooltip::after {
            content: '';
            position: absolute;
            top: -4px;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-bottom-color: rgba(0, 0, 0, 0.9);
        }

        .mga-tooltip.bottom::after {
            top: auto;
            bottom: -4px;
            border-bottom-color: transparent;
            border-top-color: rgba(0, 0, 0, 0.9);
        }

        .mga-tooltip.left::after {
            top: 50%;
            left: auto;
            right: -4px;
            transform: translateY(-50%);
            border-left-color: rgba(0, 0, 0, 0.9);
            border-bottom-color: transparent;
        }

        .mga-tooltip.right::after {
            top: 50%;
            left: -4px;
            transform: translateY(-50%);
            border-right-color: rgba(0, 0, 0, 0.9);
            border-bottom-color: transparent;
        }

        .mga-toggle-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4a9eff 0%, #9333ea 100%);
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: grab;
            z-index: 999998;
            box-shadow: 0 4px 20px rgba(74, 158, 255, 0.4);
            transition: box-shadow 0.3s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            /* Performance optimizations for smooth dragging */
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            will-change: transform;
        }

        .mga-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(74, 158, 255, 0.6);
        }

        .mga-dragging * {
            cursor: grabbing !important;
        }

        /* Universal invisible scrollbars - Single source of truth */
        .mga-scrollable {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
            scroll-behavior: smooth;
        }

        .mga-scrollable::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
        }

        /* Vertical scrolling variant */
        .mga-scrollable.vertical {
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* Horizontal scrolling variant */
        .mga-scrollable.horizontal {
            overflow-x: auto;
            overflow-y: hidden;
        }

        /* Both directions (default for backwards compatibility) */
        .mga-scrollable:not(.vertical):not(.horizontal) {
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* Value display refinements */
        .mga-value-display {
            padding: 12px;
        }

        .mga-value-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mga-value-row:last-child {
            border-bottom: none;
        }

        .mga-value-label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;
        }

        .mga-value-amount {
            color: #4a9eff;
            font-weight: 600;
            font-size: 14px;
        }

        .mga-value-updated {
            animation: mga-value-pulse 0.5s ease-in-out;
        }

        @keyframes mga-value-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
        }

        /* Responsive Popout Styles */
        .mga-popout-content {
            font-size: clamp(11px, 2.5vw, 16px);
            line-height: 1.4;
        }

        .mga-popout-content .mga-section-title {
            font-size: clamp(12px, 3vw, 18px);
            font-weight: 600;
        }

        .mga-popout-content .mga-btn {
            font-size: clamp(10px, 2.2vw, 14px);
            padding: clamp(4px, 1vw, 8px) clamp(6px, 2vw, 12px);
            border-radius: clamp(3px, 0.8vw, 6px);
        }

        .mga-popout-content .mga-label {
            font-size: clamp(10px, 2.3vw, 14px);
        }

        .mga-popout-content .mga-input,
        .mga-popout-content .mga-select {
            font-size: clamp(11px, 2.5vw, 15px);
            padding: clamp(4px, 1vw, 8px);
        }

        /* Prevent text from getting too small on very narrow windows */
        @media (max-width: 400px) {
            .mga-popout-content {
                font-size: 12px !important;
            }
            .mga-popout-content .mga-section-title {
                font-size: 14px !important;
            }
            .mga-popout-content .mga-btn {
                font-size: 11px !important;
            }
        }

        /* Prevent text from getting too large on very wide windows */
        @media (min-width: 800px) {
            .mga-popout-content {
                font-size: 14px !important;
            }
            .mga-popout-content .mga-section-title {
                font-size: 16px !important;
            }
        }

        /* Compact Active Pets Display for Popout Only */
        .mga-popout-content .mga-active-pets-display {
            padding: 6px 8px !important;
            margin-bottom: 8px !important;
        }

        .mga-popout-content .mga-active-pets-header {
            font-size: 10px !important;
            margin-bottom: 4px !important;
        }

        .mga-popout-content .mga-active-pets-list {
            gap: 3px !important;
        }

        .mga-popout-content .mga-pet-badge {
            font-size: 10px !important;
            padding: 2px 6px !important;
        }

        /* Compact Active Pets Display for In-Game Overlays Only */
        .mga-overlay-content-only .mga-active-pets-display {
            padding: 6px 8px !important;
            margin-bottom: 8px !important;
        }

        .mga-overlay-content-only .mga-active-pets-header {
            font-size: 10px !important;
            margin-bottom: 4px !important;
        }

        .mga-overlay-content-only .mga-active-pets-list {
            gap: 3px !important;
        }

        .mga-overlay-content-only .mga-pet-badge {
            font-size: 10px !important;
            padding: 2px 6px !important;
        }

        /* Removed problematic Pet Preset Card Styling - using clean compact version below */
















        /* Removed all problematic overlay-specific CSS with !important declarations - now using clean compact styling */

        /* Clean, Professional Pet Preset Styling */
        .mga-preset {
            background: rgba(30, 41, 59, 0.4);
            border: 1px solid rgba(100, 116, 139, 0.2);
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 6px;
            transition: background-color 0.15s ease;
            cursor: pointer;
        }

        .mga-preset:hover {
            background: rgba(30, 41, 59, 0.6);
            border-color: rgba(74, 158, 255, 0.3);
        }

        .mga-preset-clickable {
            cursor: pointer;
            user-select: none;
        }

        .mga-preset-clickable:hover {
            background: rgba(30, 41, 59, 0.7) !important;
            border-color: rgba(74, 158, 255, 0.5) !important;
        }

        /* Prevent hover conflicts when main HUD pets panel is open */
        .mga-overlay-content-only .mga-preset-clickable:hover {
            transition: none !important;
            transform: none !important;
        }

        .mga-preset-clickable:active {
            background: rgba(74, 158, 255, 0.3) !important;
            border-color: rgba(74, 158, 255, 0.7) !important;
            transform: translateY(0);
        }

        .mga-preset-header {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(100, 116, 139, 0.15);
        }

        .mga-preset-name {
            font-size: 13px;
            font-weight: 600;
            color: #4a9eff;
        }

        .mga-preset-pets {
            color: #e0e7ff;
            font-size: 11px;
            padding: 4px 8px;
            background: rgba(15, 23, 42, 0.3);
            border-radius: 4px;
            border-left: 2px solid #4a9eff;
            line-height: 1.4;
        }

        /* Active Pets Display */
        .mga-active-pets-display {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(74, 158, 255, 0.2);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
        }

        .mga-active-pets-header {
            color: #93c5fd;
            font-size: 12px;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .mga-active-pets-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .mga-pet-badge {
            background: rgba(74, 158, 255, 0.15);
            border: 1px solid rgba(74, 158, 255, 0.3);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            color: #93c5fd;
            display: inline-flex;
            align-items: center;
        }

        /* Presets Container */
        .mga-presets-container {
            max-height: none !important;
            height: auto !important;
            flex: 1 !important;
            overflow-y: auto !important;
            min-height: 200px !important;
        }

        /* Shop Overlay */
        #mga-shop-overlay {
            position: fixed;
            inset: 0;
            background: rgba(10, 10, 10, 0.5);
            display: none;
            z-index: 999998;
            pointer-events: none;
        }

        #mga-shop-overlay.active {
            display: block;
            pointer-events: auto;
        }

        /* Shop Item Color Coding */
        .shop-color-white { color: #ffffff !important; }
        .shop-color-green { color: #2afd23ff !important; }
        .shop-color-blue { color: #0084ffff !important; }
        .shop-color-yellow { color: #fced19ff !important; }
        .shop-color-purple { color: #774cb3 !important; }
        .shop-color-orange { color: #ff7300ff !important; }

        /* Rainbow text for celestial items */
        .shop-rainbow-text {
            background: linear-gradient(90deg,
                #ff0000, #ff7b00, #ffd800, #3cff2a, #00b5ff, #774cb3, #ff2ab7, #ff0000);
            background-size: 200% 100%;
            background-repeat: repeat;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            animation: shopRainbowShift 3s linear infinite;
            font-weight: 700;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        @keyframes shopRainbowShift {
            0%   { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }

        /* Shop sprite styling */
        .shop-sprite {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            object-fit: contain;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.02);
            transition: transform 0.12s ease, box-shadow 0.12s ease;
        }

        .shop-item.in-stock .shop-sprite {
            transform: scale(1.04);
            box-shadow: 0 4px 10px rgba(0, 255, 42, 0.07);
        }

        /* Enhanced shop item styling */
        .shop-item.in-stock {
            background: rgba(76, 255, 106, 0.29) !important;
            box-shadow: 0 6px 18px rgba(60, 180, 80, 0.06);
            border: 1px solid rgba(9, 255, 0, 0.12) !important;
        }

        /* Enhanced shop window styling */
        .mga-shop-window {
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                        0 8px 24px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
            backdrop-filter: blur(20px);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .mga-shop-window:hover {
            box-shadow: 0 24px 72px rgba(0, 0, 0, 0.6),
                        0 10px 30px rgba(0, 0, 0, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        }

        /* Shop item hover enhancements */
        .shop-item {
            transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .shop-item:hover {
            transform: translateX(2px);
        }

        .shop-item.in-stock:hover {
            background: rgba(76, 255, 106, 0.35) !important;
            box-shadow: 0 8px 24px rgba(60, 180, 80, 0.12);
        }

        /* Responsive design for mobile */
        @media (max-width: 768px) {
            .mga-shop-window {
                max-width: calc(100vw - 20px) !important;
                max-height: calc(100vh - 60px) !important;
                left: 10px !important;
                top: 30px !important;
                width: calc(100% - 20px) !important;
            }

            #mga-shop-overlay {
                padding: 10px;
            }

            .shop-sprite {
                width: 24px !important;
                height: 24px !important;
            }

            .shop-item {
                padding: 6px !important;
                font-size: 11px !important;
            }

            .buy-btn {
                padding: 3px 6px !important;
                font-size: 10px !important;
            }
        }

        /* Tablet responsive */
        @media (max-width: 1024px) and (min-width: 769px) {
            .mga-shop-window {
                max-width: 400px !important;
            }
        }

        /* Smooth overlay fade */
        #mga-shop-overlay {
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        #mga-shop-overlay.active {
            opacity: 1;
        }

        /* Checkbox styling */
        .show-available-only, .sort-by-value {
            cursor: pointer;
            width: 14px;
            height: 14px;
        }

        /* Close button enhancement */
        .shop-close-btn {
            transition: color 0.2s ease, transform 0.2s ease;
        }

        .shop-close-btn:hover {
            transform: scale(1.2);
        }

    `;

    /* CHECKPOINT removed: GLOBAL_STYLES_COMPLETE */

    // ==================== DEBUG SYSTEM ====================

    // Production flag to minimize script size by removing debug logs
    // NOTE: To enable production mode and remove ~500 console.log statements:
    // 1. Change PRODUCTION to true below
    // 2. Replace all 'productionLog(' with 'productionLog(' in the script
    // 3. Replace all 'productionWarn(' with 'productionWarn(' in the script
    // 4. Replace all 'console.error(' with 'productionError(' in the script
    // This can save ~100-150KB in script size for better performance
    const PRODUCTION = true; // OPTIMIZED: Enabled to dramatically improve FPS

    const DEBUG_FLAGS = {
        OVERLAY_LIFECYCLE: false,  // Disabled to reduce console spam
        HANDLER_SETUP: false,      // Disabled to reduce console spam
        THEME_APPLICATION: false,
        VALUE_CALCULATIONS: false,
        ABILITY_LOGS: false,
        BUTTON_INTERACTIONS: false,
        POP_OUT_DESIGN: false,
        ERROR_TRACKING: true,      // Keep error tracking enabled
        PERFORMANCE: false
    };

    // Note: productionLog, productionWarn, productionError are defined at top of file (line 26-29)

    // Optimized debugLog - no-op in production mode
    function debugLog(category, message, data = null) {
        if (!PRODUCTION && DEBUG_FLAGS[category]) {
            const timestamp = new Date().toLocaleTimeString();
            productionLog(`[MGA-DEBUG-${category}] ${timestamp} ${message}`, data || '');
        }
    }

    function debugError(category, message, error, context = {}) {
        if (DEBUG_FLAGS[category] || DEBUG_FLAGS.ERROR_TRACKING) {
            const timestamp = new Date().toLocaleTimeString();
            productionError(`[MGA-ERROR-${category}] ${timestamp} ${message}`, {
                error: error,
                context: context,
                stack: error?.stack
            });
        }
    }

    /* CHECKPOINT removed: DEBUG_SYSTEM_COMPLETE */

    // ==================== RESPONSIVE TEXT SCALING ====================
// Efficient, smooth text scaling using transform instead of recalculating fonts
function applyResponsiveTextScaling(overlay, width, height) {
    try {
        const baseWidth = 400;
        const baseHeight = 300;

        const widthScale = width / baseWidth;
        const heightScale = height / baseHeight;
        const scale = Math.min(widthScale, heightScale);

        // Clamp to reasonable values
        const clampedScale = Math.max(0.7, Math.min(1.3, scale));

        // Apply smooth GPU scaling to the overlay’s inner content
        let content = overlay.querySelector('.mga-content');
        if (content) {
            content.style.transformOrigin = "top left";
            content.style.transform = `scale(${clampedScale})`;
        }
    } catch (error) {
        debugError('OVERLAY_LIFECYCLE', 'Failed to apply transform-based scaling', error, {
            overlayId: overlay.id,
            width,
            height
        });
    }
}


    // ==================== UNIFIED STATE ====================
    // Global initialization mutex to prevent double initialization
    // Clear any stale flags from previous page load (refresh fix)
    // On normal refresh, these flags shouldn't persist, but Tampermonkey timing can cause race conditions
    const now = Date.now();
    const flagTimestamp = window._MGA_TIMESTAMP || 0;
    const flagAge = now - flagTimestamp;

    // If flags are older than 5 seconds, they're stale from a previous load
    if (flagAge > 5000) {
        productionLog('🔄 Detected stale initialization flags, clearing...');
        try {
            delete window._MGA_INITIALIZING;
        } catch (e) {
            window._MGA_INITIALIZING = undefined;
        }
        try {
            delete window._MGA_INITIALIZED;
        } catch (e) {
            window._MGA_INITIALIZED = undefined;
        }
        try {
            delete window._MGA_TIMESTAMP;
        } catch (e) {
            window._MGA_TIMESTAMP = undefined;
        }
    }

    const forceInit = targetWindow.location.search.includes('force=true') || window._MGA_FORCE_INIT;

    if ((window._MGA_INITIALIZING || window._MGA_INITIALIZED) && !forceInit) {
        productionLog('🔒 MGA already initializing or initialized, stopping duplicate execution');
        productionLog('💡 Use ?force=true in URL or MGA.forceInit() to re-initialize');
        return;
    }

    // Clear flags if forcing re-initialization
    if (forceInit) {
        productionLog('🔄 Force initialization requested - clearing existing flags');
        window._MGA_INITIALIZED = false;
        window._MGA_FORCE_INIT = false;
    }

    // Set flags with timestamp
    window._MGA_INITIALIZING = true;
    window._MGA_TIMESTAMP = now;

    // ==================== DEFERRED CONFLICT DETECTION ====================
    // Conflict detection moved to after game initialization to prevent loading stalls

    // ==================== DECOR CATALOG ====================
    // Decor items available in the hourly decoration shop
    const DECOR_ITEMS = [
        // Rocks
        { id: 'SmallRock', name: 'Small Garden Rock', category: 'Rocks' },
        { id: 'MediumRock', name: 'Medium Garden Rock', category: 'Rocks' },
        { id: 'LargeRock', name: 'Large Garden Rock', category: 'Rocks' },
        // Wood Items
        { id: 'WoodBench', name: 'Wood Bench', category: 'Wood' },
        { id: 'WoodArch', name: 'Wood Arch', category: 'Wood' },
        { id: 'WoodBridge', name: 'Wood Bridge', category: 'Wood' },
        { id: 'WoodLampPost', name: 'Wood Lamp Post', category: 'Wood' },
        { id: 'WoodOwl', name: 'Wood Owl', category: 'Wood' },
        { id: 'Birdhouse', name: 'Birdhouse', category: 'Wood' },
        // Stone Items
        { id: 'StoneBench', name: 'Stone Bench', category: 'Stone' },
        { id: 'StoneArch', name: 'Stone Arch', category: 'Stone' },
        { id: 'StoneBridge', name: 'Stone Bridge', category: 'Stone' },
        { id: 'StoneLampPost', name: 'Stone Lamp Post', category: 'Stone' },
        { id: 'StoneGnome', name: 'Stone Gnome', category: 'Stone' },
        { id: 'StoneWell', name: 'Stone Well', category: 'Stone' },
        // Other
        { id: 'Windmill', name: 'Windmill', category: 'Other' },
        { id: 'Fountain', name: 'Fountain', category: 'Other' },
        { id: 'MushroomRing', name: 'Mushroom Ring', category: 'Other' },
        { id: 'Scarecrow', name: 'Scarecrow', category: 'Other' },
        { id: 'Beehive', name: 'Beehive', category: 'Other' }
    ];

    const UnifiedState = {
        initialized: false,
        connectionStatus: false,
        panels: {
            main: null,
            toggle: null
        },
        activeTab: 'pets',
        // Interval Management System
        intervals: {
            autoDelete: null,
            heartbeat: null,
            activitySimulator: null,
            gameCheck: null,
            connectionCheck: null,
            autoSave: null
        },
        popoutWindows: new Set(), // Track all popout windows
        firebase: {
            app: null,
            database: null,
            reportInterval: null,
            unsubscribe: null
        },
        data: {
            petPresets: {},
            petPresetsOrder: [],  // Array to maintain preset display order
            petAbilityLogs: [],
            seedsToDelete: [],
            autoDeleteEnabled: false,
            inventoryValue: 0,
            gardenValue: 0,
            tileValue: 0,
            lastAbilityTimestamps: {},
            roomStatus: {
                counts: {}, // Store room counts {MG1: 3, MG2: 2, ...}
                currentRoom: null,
                reporterId: null
            },
            timers: {
                seed: null,
                egg: null,
                tool: null,
                lunar: null
            },
            settings: {
                opacity: 95,
                popoutOpacity: 50,
                theme: 'default',
                gradientStyle: 'blue-purple',
                effectStyle: 'none',
                compactMode: false,
                ultraCompactMode: false,
                useInGameOverlays: true,
                notifications: {
                    enabled: true,
                    volume: 0.3,
                    notificationType: 'epic',  // Options: 'simple', 'triple', 'alarm', 'epic', 'continuous'
                    requiresAcknowledgment: false,
                    continuousEnabled: false,  // Controls whether continuous option is available
                    watchedSeeds: ["Carrot", "Sunflower", "Moonbinder", "Dawnbinder", "Starweaver"],
                    watchedEggs: ["CommonEgg", "MythicalEgg"],
                    watchedDecor: [], // Decoration/hourly shop items
                    // Pet hunger notifications
                    petHungerEnabled: false,
                    petHungerThreshold: 25,  // Notify when hunger drops below this % (percentage of observed max)
                    petHungerSound: 'double',  // Different sound than shop notifications
                    // Ability trigger notifications
                    abilityNotificationsEnabled: false,
                    watchedAbilities: [],  // Legacy - kept for backward compatibility
                    watchedAbilityCategories: {  // Category-based notification control
                        xpBoost: true,
                        cropSizeBoost: true,
                        selling: true,
                        harvesting: true,
                        growthSpeed: true,
                        specialMutations: true,
                        other: true
                    },
                    abilityNotificationSound: 'single',  // 'single', 'double', 'triple', 'chime', 'alert', 'buzz', 'ding', 'chirp'
                    abilityNotificationVolume: 0.2,  // Separate volume for abilities (quieter by default)
                    // Weather event notifications
                    weatherNotificationsEnabled: false,
                    watchedWeatherEvents: ['Snow', 'Rain', 'AmberMoon', 'Dawn'],
                    // Shop UI Firebase integration toggle
                    shopFirebaseEnabled: false,
                    lastSeenTimestamps: {}
                },
                detailedTimestamps: true,  // Show HH:MM:SS 24-hour format instead of 12-hour AM/PM
                debugMode: false  // Enable debug logging for troubleshooting
            },
            hotkeys: {
                enabled: true,
                gameKeys: {
                    inventory: { name: 'Open Inventory', original: 'e', custom: null },
                    harvest: { name: 'Harvest/Select', original: ' ', custom: null },
                    selectLeft: { name: 'Select Left Crop', original: 'x', custom: null },
                    selectRight: { name: 'Select Right Crop', original: 'c', custom: null },
                    hotbar1: { name: 'Hotbar Slot 1', original: '1', custom: null },
                    hotbar2: { name: 'Hotbar Slot 2', original: '2', custom: null },
                    hotbar3: { name: 'Hotbar Slot 3', original: '3', custom: null },
                    hotbar4: { name: 'Hotbar Slot 4', original: '4', custom: null },
                    hotbar5: { name: 'Hotbar Slot 5', original: '5', custom: null },
                    hotbar6: { name: 'Hotbar Slot 6', original: '6', custom: null },
                    hotbar7: { name: 'Hotbar Slot 7', original: '7', custom: null },
                    hotbar8: { name: 'Hotbar Slot 8', original: '8', custom: null },
                    hotbar9: { name: 'Hotbar Slot 9', original: '9', custom: null },
                    teleportShop: { name: 'Teleport to Shop', original: 'shift+1', custom: null },
                    teleportGarden: { name: 'Teleport to Garden', original: 'shift+2', custom: null },
                    teleportSell: { name: 'Teleport to Sell', original: 'shift+3', custom: null }
                }
            },
            popouts: {
                overlays: new Map(), // Track in-game overlays
                windows: new Map()   // Track separate windows
            },
            // PAL4-style filter system
            filterMode: 'categories', // categories, byPet, custom
            abilityFilters: {
                xpBoost: true,
                cropSizeBoost: true,
                selling: true,
                harvesting: true,
                growthSpeed: true,
                specialMutations: true,
                other: true
            },
            customMode: {
                selectedAbilities: {}
            },
            petFilters: {
                selectedPets: {}
            }
        },
        atoms: {
            activePets: [], // Initialize as empty array to prevent null errors
            petAbility: null,
            inventory: null,
            currentCrop: null,
            friendBonus: 1,
            myGarden: null,
            quinoaData: null
        }
    };

    // Export UnifiedState for debugging and external access
    targetWindow.UnifiedState = UnifiedState;

    /* CHECKPOINT removed: UNIFIED_STATE_COMPLETE */

    // ==================== ROOM STATUS & FIREBASE ====================

    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyBfFW74PLBfLIpYj5dakmKar2wRpLu1ZOA",
        authDomain: "mg-rooms.firebaseapp.com",
        databaseURL: "https://mg-rooms-default-rtdb.firebaseio.com",
        projectId: "mg-rooms",
        storageBucket: "mg-rooms.firebasestorage.app",
        messagingSenderId: "175773159635",
        appId: "1:175773159635:web:6676c5a625c3fe1da74426"
    };

    const REPORT_INTERVAL = 5000; // Report room count every 5 seconds
    const TRACKED_ROOMS = ['MG1', 'MG2', 'MG3', 'MG4', 'MG5', 'MG6', 'MG7', 'MG8', 'MG9', 'MG10', 'SLAY'];

    // Get current room code from URL
    function getCurrentRoomCode() {
        try {
            const match = window.location.pathname.match(/\/r\/([^\/]+)/);
            return match ? match[1].toUpperCase() : null;
        } catch (err) {
            console.error('Failed to get room code:', err);
            return null;
        }
    }

    // Get actual player count from game's room state
    function getActualPlayerCount() {
        try {
            const roomState = targetWindow.MagicCircle_RoomConnection?.lastRoomStateJsonable;
            if (!roomState?.child?.data?.userSlots) {
                productionLog('[Room Status] No userSlots data available', {
                    hasRoomConnection: !!targetWindow.MagicCircle_RoomConnection,
                    hasRoomState: !!roomState,
                    hasChild: !!roomState?.child,
                    hasData: !!roomState?.child?.data
                });
                return null;
            }
            const userSlots = roomState.child.data.userSlots;
            const count = userSlots.filter(slot => slot !== null && slot !== undefined).length;
            productionLog('[Room Status] Player count:', count, 'userSlots:', userSlots);
            return count;
        } catch (err) {
            console.error('[Room Status] Failed to get player count:', err);
            return null;
        }
    }

    // Generate unique reporter ID
    function getReporterId() {
        if (!UnifiedState.data.roomStatus.reporterId) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                UnifiedState.data.roomStatus.reporterId = crypto.randomUUID();
            } else {
                UnifiedState.data.roomStatus.reporterId = 'reporter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
        }
        return UnifiedState.data.roomStatus.reporterId;
    }

    // Load Firebase SDK and initialize with authentication
    async function initializeFirebase() {
        try {
            productionLog('📡 Loading Firebase SDK...');

            // Import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
            const { getDatabase, ref, set, onValue, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const { getAuth, signInAnonymously, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');

            // Initialize Firebase app
            UnifiedState.firebase.app = initializeApp(FIREBASE_CONFIG);
            UnifiedState.firebase.database = getDatabase(UnifiedState.firebase.app);
            const auth = getAuth(UnifiedState.firebase.app);

            productionLog('✅ Firebase app initialized');

            // Return a promise that resolves when authenticated
            return new Promise((resolve) => {
                // Try to sign in anonymously
                signInAnonymously(auth)
                    .then(() => {
                        productionLog('🔐 Signing in anonymously...');
                    })
                    .catch((error) => {
                        console.error('❌ Anonymous sign-in failed:', error.code, error.message);
                        // If sign-in fails, still try to return functions (will fail on write if rules require auth)
                        productionWarn('⚠️ Continuing without authentication - writes may fail');
                        resolve({ ref, set, onValue, onDisconnect });
                    });

                // Listen for auth state changes
                let authResolved = false;
                onAuthStateChanged(auth, (user) => {
                    if (!authResolved) {
                        authResolved = true;
                        if (user) {
                            const uid = user.uid;
                            productionLog('✅ Authenticated with uid:', uid);
                            UnifiedState.data.roomStatus.reporterId = uid;
                        } else {
                            productionWarn('⚠️ No user authenticated');
                            // Generate fallback ID
                            UnifiedState.data.roomStatus.reporterId = getReporterId();
                        }
                        resolve({ ref, set, onValue, onDisconnect });
                    }
                });

                // Timeout fallback - if auth doesn't resolve in 5 seconds, proceed anyway
                setTimeout(() => {
                    if (!authResolved) {
                        productionWarn('⚠️ Auth timeout - proceeding without authentication');
                        authResolved = true;
                        UnifiedState.data.roomStatus.reporterId = getReporterId();
                        resolve({ ref, set, onValue, onDisconnect });
                    }
                }, 5000);
            });
        } catch (err) {
            console.error('❌ Firebase initialization failed:', err);
            return null;
        }
    }

    // Start reporting current room's player count
    async function startRoomReporting(firebase) {
        if (!firebase) return;

        const roomCode = getCurrentRoomCode();
        if (!roomCode) return;

        UnifiedState.data.roomStatus.currentRoom = roomCode;

        try {
            const { ref, set, onDisconnect } = firebase;
            const currentRoomRef = ref(UnifiedState.firebase.database, `roomCounts/${roomCode}`);

            // Report immediately - but only if we have actual data
            const count = getActualPlayerCount();
            if (count === null) {
                productionWarn(`[Room Status] No player data available yet for ${roomCode}, will retry on next interval`);
                // Don't report or update local state with invalid data
            } else {
                await set(currentRoomRef, {
                    count: count,
                    lastUpdate: Date.now(),
                    reporter: getReporterId()
                });

                // Update local state immediately so user sees their own room count
                if (!UnifiedState.data.roomStatus.counts) {
                    UnifiedState.data.roomStatus.counts = {};
                }
                UnifiedState.data.roomStatus.counts[roomCode] = count;

                productionLog(`📊 Reported ${count} players in ${roomCode}`);
            }

            // Set up onDisconnect cleanup
            await onDisconnect(currentRoomRef).remove();

            // Start interval reporting
            // Debounced reporting: Only update Firebase if count actually changed
            let lastReportedCount = count !== null ? count : -1; // Initialize with actual count or -1 if no data yet
            UnifiedState.firebase.reportInterval = setInterval(async () => {
                try {
                    const currentCount = getActualPlayerCount();

                    // Skip if we don't have valid data yet
                    if (currentCount === null) {
                        productionLog('[Room Status] Skipping report - no player data available yet');
                        return;
                    }

                    // Only report if count changed (80% network reduction)
                    if (currentCount === lastReportedCount) {
                        return;
                    }

                    const previousCount = lastReportedCount;
                    lastReportedCount = currentCount;
                    await set(currentRoomRef, {
                        count: currentCount,
                        lastUpdate: Date.now(),
                        reporter: getReporterId()
                    });

                    // Update local state immediately
                    UnifiedState.data.roomStatus.counts[roomCode] = currentCount;

                    productionLog(`[Room Status] Reported count: ${currentCount} (changed from ${previousCount})`);
                } catch (err) {
                    console.error('Failed to report room count:', err);
                }
            }, REPORT_INTERVAL);

        } catch (err) {
            console.error('Failed to start room reporting:', err);
        }
    }

    // Listen to all room counts
    function startRoomListener(firebase) {
        if (!firebase) return;

        try {
            const { ref, onValue } = firebase;
            const allRoomsRef = ref(UnifiedState.firebase.database, 'roomCounts');

            UnifiedState.firebase.unsubscribe = onValue(allRoomsRef, (snapshot) => {
                const roomData = snapshot.val() || {};
                productionLog('[Room Status] Received update from Firebase:', roomData);

                // Update room counts - use the highest count from fresh data to prevent flickering
                const counts = {};
                TRACKED_ROOMS.forEach(roomCode => {
                    if (roomData[roomCode]) {
                        const age = Date.now() - (roomData[roomCode].lastUpdate || 0);
                        const newCount = age < 30000 ? (roomData[roomCode].count || 0) : 0;

                        // Use the higher of the new count or existing count (prevents flickering from 6->0->6)
                        // Only accept decreases if the data is very fresh (< 3s old) - prevents stale 0 reports from overwriting real data
                        const existingCount = UnifiedState.data.roomStatus.counts[roomCode] || 0;
                        if (newCount >= existingCount || age < 3000) {
                            counts[roomCode] = newCount;
                        } else {
                            counts[roomCode] = existingCount;
                        }

                        productionLog(`[Room Status] ${roomCode}: ${counts[roomCode]} players (new: ${newCount}, existing: ${existingCount}, age: ${Math.round(age/1000)}s)`);
                    } else {
                        counts[roomCode] = 0;
                    }
                });

                UnifiedState.data.roomStatus.counts = counts;
                productionLog('[Room Status] Updated counts:', counts);

                // Update display if rooms tab is active
                updateRoomStatusDisplay();
            });

            productionLog('✅ Listening to all room counts');
        } catch (err) {
            console.error('Failed to start room listener:', err);
        }
    }

    // Update room status display
    function updateRoomStatusDisplay() {
        const roomList = document.getElementById('room-status-list');
        if (!roomList) return;

        const currentRoom = getCurrentRoomCode();
        const roomCounts = UnifiedState.data.roomStatus.counts;

        roomList.innerHTML = TRACKED_ROOMS.map(roomCode => {
            const count = roomCounts[roomCode] || 0;
            const displayCount = Math.min(count, 6);
            const isCurrentRoom = roomCode === currentRoom;

            let statusColor = '#94a3b8';
            if (count > 0) statusColor = '#4ade80';
            if (count >= 4) statusColor = '#fbbf24';
            if (count >= 6) statusColor = '#ef4444';

            const bgColor = isCurrentRoom ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)';
            const borderColor = isCurrentRoom ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)';

            return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <span style="font-weight: bold; color: ${isCurrentRoom ? '#60a5fa' : '#e5e7eb'}; font-size: 14px; min-width: 45px;">${roomCode}</span>
                        <span style="font-weight: bold; color: ${statusColor}; font-size: 13px; min-width: 50px;">${displayCount}/6 ${isCurrentRoom ? '(You)' : ''}</span>
                    </div>
                    <button class="mga-button room-join-btn" data-room="${roomCode}" style="padding: 6px 14px; font-size: 12px; background: ${isCurrentRoom ? '#666' : '#4a9eff'}; color: white; border: none; border-radius: 4px; cursor: ${isCurrentRoom ? 'not-allowed' : 'pointer'}; opacity: ${isCurrentRoom ? '0.5' : '1'};" ${isCurrentRoom ? 'disabled' : ''}>
                        ${isCurrentRoom ? 'Current' : 'Join'}
                    </button>
                </div>
            `;
        }).join('');

        // Re-attach event listeners
        setupRoomJoinButtons();

        // Update popout window if it exists
        refreshSeparateWindowPopouts('rooms');
    }

    // Setup join button handlers
    function setupRoomJoinButtons() {
        document.querySelectorAll('.room-join-btn:not([data-handler-attached])').forEach(btn => {
            btn.setAttribute('data-handler-attached', 'true');
            btn.addEventListener('click', () => {
                const roomCode = btn.getAttribute('data-room');
                const host = window.location.host;
                window.location.href = `https://${host}/r/${roomCode}`;
            });
        });

        // Setup room search input handler
        const searchInput = document.getElementById('room-search-input');
        if (searchInput && !searchInput.hasAttribute('data-handler-attached')) {
            searchInput.setAttribute('data-handler-attached', 'true');

            // FIX: Stop hotkey system from intercepting keypresses in search input
            searchInput.addEventListener('keydown', (e) => {
                e.stopPropagation(); // Prevent hotkey system from seeing these events
            }, true); // Use capture phase to intercept before hotkey system

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toUpperCase();
                const roomList = document.getElementById('room-status-list');

                if (query && !TRACKED_ROOMS.includes(query)) {
                    // Show searched room
                    const currentRoom = getCurrentRoomCode();
                    const roomCounts = UnifiedState.data.roomStatus?.counts || {};
                    const count = roomCounts[query] || 0;

                    roomList.innerHTML = `
                        <div style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-weight: bold; color: #e5e7eb; font-size: 14px;">${query}</span>
                                    <span style="color: ${count > 0 ? '#4ade80' : '#94a3b8'}; font-size: 13px;">${count > 0 ? `${count} online` : 'No data'}</span>
                                </div>
                                <button class="mga-button" onclick="window.location.href='https://${window.location.host}/r/${query}'"
                                    style="padding: 6px 14px; font-size: 12px; background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Join
                                </button>
                            </div>
                            <div style="font-size: 10px; color: #888; margin-top: 4px;">
                                ${count > 0 ? 'At least one MGTools user is in this room' : 'Room may be empty or no MGTools users reporting'}
                            </div>
                        </div>
                    `;
                } else {
                    // Show default tracked rooms
                    updateTabContent();
                }
            });
        }
    }

    // ==================== SIMPLE PET DETECTION ====================
    function getActivePetsFromRoomState() {
        productionLog('🔧 [DEBUG] getActivePetsFromRoomState() called - checking for pets...');
        try {
            // CORRECT path: Get the actual atom value that console shows
            const roomState = targetWindow.MagicCircle_RoomConnection?.lastRoomStateJsonable;
            // Reduced logging for performance
            // productionLog('🔧 [DEBUG] roomState available:', !!roomState, roomState?.child?.data ? 'data exists' : 'no data');
            if (!roomState?.child?.data) {
                productionLog('🐾 [SIMPLE-PETS] No room state data');
                return [];
            }

            // Debug: Log the actual structure (disabled for performance)
            // productionLog('🐾 [DEBUG] Actual roomState.child.data structure:', JSON.stringify(roomState.child.data, null, 2).substring(0, 500));
            // productionLog('🐾 [DEBUG] roomState.child.data keys:', Object.keys(roomState.child.data || {}));

            // Try multiple data sources in priority order
            let petData = null;

            // Source 1: Check if pet data is directly in child.data (field1, field2, field3 format)
            if (roomState.child.data.field1 !== undefined) {
                petData = roomState.child.data;
                productionLog('🐾 [SIMPLE-PETS] Found pet data in child.data directly');
            }

            // Source 2: No longer needed - using myPetSlotsAtom instead
            // Room state userSlots doesn't contain species info

            if (!petData) {
                if (UnifiedState.data.settings?.debugMode) {
                    productionLog('🐾 [SIMPLE-PETS] No pet data found in room state');
                }

                // FALLBACK: Use atom data if available
                if (window.activePets && window.activePets.length > 0) {
                    if (UnifiedState.data.settings?.debugMode) {
                        productionLog('🐾 [FALLBACK] Using pets from myPetSlotsAtom:', window.activePets);
                    }
                    return window.activePets;
                }

                if (UnifiedState.data.settings?.debugMode) {
                    productionLog('🐾 [SIMPLE-PETS] No pet data found in room state or atoms');
                }
                return [];
            }

            // Extract pets from field1, field2, field3 format (the actual console format)
            const pets = [];
            const fields = [petData.field1, petData.field2, petData.field3];
            fields.forEach((species, index) => {
                if (species && species !== '' && typeof species === 'string') {
                    pets.push({ petSpecies: species, slot: index + 1 });
                }
            });

            productionLog('🐾 [SIMPLE-PETS] Extracted pets:', pets);
            return pets;
        } catch (error) {
            productionLog('🐾 [SIMPLE-PETS] Error:', error.message);
            return [];
        }
    }

    function updateActivePetsFromRoomState() {
        // Removed excessive debug logging to improve performance
        // productionLog('🔧 [DEBUG] updateActivePetsFromRoomState() called');
        const roomPets = getActivePetsFromRoomState();
        const previousCount = UnifiedState.atoms.activePets?.length || 0;

        // CRITICAL BUGFIX: Don't overwrite if we already have better data from atom hook
        // The atom gives us FULL pet data with hunger, abilities, etc.
        // Room state only gives us petSpecies and slot - incomplete data!
        if (window.activePets && window.activePets.length > 0 &&
            window.activePets[0] && window.activePets[0].hunger !== undefined) {
            // We have full atom data with hunger - preserve it!
            productionLog('🐾 [SIMPLE-PETS] Preserving existing full pet data from atom (has hunger)');

            // Only update species info if it's missing
            roomPets.forEach((roomPet, index) => {
                if (window.activePets[index] && !window.activePets[index].petSpecies && roomPet.petSpecies) {
                    window.activePets[index].petSpecies = roomPet.petSpecies;
                    productionLog(`🐾 [SIMPLE-PETS] Added missing species ${roomPet.petSpecies} to slot ${index + 1}`);
                }
            });

            UnifiedState.atoms.activePets = window.activePets;
            return window.activePets; // Return the good data
        }

        // Only use room state data if we have NO atom data or it's incomplete
        UnifiedState.atoms.activePets = roomPets;
        window.activePets = roomPets; // Expose globally for debugging (use window to avoid modifying page)

        const newCount = roomPets.length;
        if (newCount !== previousCount) {
            productionLog(`🐾 [SIMPLE-PETS] Pet count changed: ${previousCount} → ${newCount}`);

            // Update UI if pets tab is active
            if (UnifiedState.activeTab === 'pets') {
                const context = document.getElementById('mga-tab-content');
                if (context && typeof updateActivePetsDisplay === 'function') {
                    updateActivePetsDisplay(context);
                }
            }
        }

        return roomPets;
    }

    // ==================== INTERVAL MANAGEMENT ====================
    function setManagedInterval(name, callback, delay) {
        // Clear existing interval if it exists
        if (UnifiedState.intervals[name]) {
            clearInterval(UnifiedState.intervals[name]);
        }

        // Set new interval and store reference
        UnifiedState.intervals[name] = setInterval(callback, delay);
        debugLog('PERFORMANCE', `Created managed interval: ${name} (${delay}ms)`);
        return UnifiedState.intervals[name];
    }

    function clearManagedInterval(name) {
        if (UnifiedState.intervals[name]) {
            clearInterval(UnifiedState.intervals[name]);
            UnifiedState.intervals[name] = null;
            debugLog('PERFORMANCE', `Cleared managed interval: ${name}`);
        }
    }

    function clearAllManagedIntervals() {
        Object.keys(UnifiedState.intervals).forEach(name => {
            clearManagedInterval(name);
        });
        debugLog('PERFORMANCE', 'Cleared all managed intervals');
    }

    function trackPopoutWindow(popoutWindow) {
        UnifiedState.popoutWindows.add(popoutWindow);

        // Add cleanup listener
        popoutWindow.addEventListener('beforeunload', () => {
            UnifiedState.popoutWindows.delete(popoutWindow);
        });
    }

    function closeAllPopoutWindows() {
        UnifiedState.popoutWindows.forEach(window => {
            try {
                window.close();
            } catch (e) {
                debugError('PERFORMANCE', 'Error closing popout window', e);
            }
        });
        UnifiedState.popoutWindows.clear();
    }

    /* CHECKPOINT removed: INTERVAL_MANAGEMENT_COMPLETE */

    // ==================== ENVIRONMENT DETECTION ====================
    function detectEnvironment() {
        const environment = {
            isGameEnvironment: false,
            isStandalone: false,
            isDiscordEmbed: false,
            gameReady: false,
            url: targetWindow.location.href,
            hasJotaiAtoms: !!((targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache)?.size > 0),
            hasMagicCircleConnection: !!(targetWindow.MagicCircle_RoomConnection && typeof targetWindow.MagicCircle_RoomConnection === 'object'),
            domain: targetWindow.location.hostname,
            readyState: document.readyState
        };

        // BUGFIX v1.11.5: Discord embed detection
        const isDiscordDomain = environment.domain.includes('discord.com');
        if (isDiscordDomain) {
            environment.isDiscordEmbed = true;
            productionLog('🎮 [DISCORD] Running on Discord - looking for game iframe...');

            // Try to find the game iframe
            const gameIframes = document.querySelectorAll('iframe');
            for (const iframe of gameIframes) {
                try {
                    const iframeSrc = iframe.src || '';
                    const gameHosts = ['magiccircle.gg', 'magicgarden.gg', 'starweaver.org'];
                    if (gameHosts.some(host => iframeSrc.includes(host))) {
                        productionLog('✅ [DISCORD] Found game iframe:', iframeSrc);
                        // Note: We can't directly access iframe content due to cross-origin
                        // The script needs to run inside the iframe itself
                        environment.isGameEnvironment = false;
                        environment.isStandalone = true; // Discord parent page is standalone
                        return environment;
                    }
                } catch (e) {
                    // Cross-origin iframe, can't access
                }
            }
            productionLog('⚠️ [DISCORD] No game iframe found yet - script should run in iframe');
            environment.isStandalone = true;
            return environment;
        }

        // Check if we're in a Magic Garden game environment
        const gameHosts = ['magiccircle.gg', 'magicgarden.gg', 'starweaver.org'];
        const isGameDomain = gameHosts.some(host => environment.domain.includes(host));
        const hasGamePath = targetWindow.location.pathname.includes('/r/');

        environment.isGameEnvironment = isGameDomain && hasGamePath;
        environment.isStandalone = !environment.isGameEnvironment;
        environment.gameReady = environment.hasJotaiAtoms && environment.hasMagicCircleConnection && document.readyState === 'complete';

        // Determine initialization strategy
        let initStrategy = 'unknown';
        if (environment.gameReady) {
            initStrategy = 'game-ready';
        } else if (environment.isGameEnvironment) {
            initStrategy = 'game-wait';
        } else {
            initStrategy = 'standalone';
        }

        environment.initStrategy = initStrategy;

        return environment;
    }

    function createDemoData() {
        // Create realistic demo data for standalone mode
        const demoData = {
            pets: [
                { petSpecies: 'Bunny', level: 15, abilities: ['Harvesting', 'Selling'], rarity: 'Common' },
                { petSpecies: 'Dragon', level: 32, abilities: ['Growth Speed', 'Special Mutations'], rarity: 'Legendary' },
                { petSpecies: 'Phoenix', level: 28, abilities: ['Selling', 'Harvesting'], rarity: 'Epic' },
                { petSpecies: 'Unicorn', level: 21, abilities: ['Growth Speed', 'Harvesting'], rarity: 'Rare' }
            ],
            inventory: {
                items: [
                    { species: 'Carrot', quantity: 145, value: 20 },
                    { species: 'Apple', quantity: 82, value: 73 },
                    { species: 'Banana', quantity: 23, value: 1750 },
                { species: 'Dragon Fruit', quantity: 7, value: 15000 },
                { species: 'Magic Beans', quantity: 3, value: 50000 }
            ],
            totalValue: 285450
        },
        garden: [
            { species: 'Carrot', quantity: 25, value: 15 },
            { species: 'Apple', quantity: 12, value: 65 },
            { species: 'Banana', quantity: 8, value: 1200 }
        ],
        totalValue: 295875,
        abilityLogs: [
            { timestamp: Date.now() - 300000, pet: 'Dragon', ability: 'Growth Speed', description: 'Reduced growth time by 15%' },
            { timestamp: Date.now() - 240000, pet: 'Bunny', ability: 'Harvesting', description: 'Extra harvest yield +2 items' },
            { timestamp: Date.now() - 180000, pet: 'Phoenix', ability: 'Selling', description: 'Increased selling price by 8%' },
            { timestamp: Date.now() - 120000, pet: 'Unicorn', ability: 'Growth Speed', description: 'Reduced growth time by 12%' },
            { timestamp: Date.now() - 60000, pet: 'Dragon', ability: 'Special Mutations', description: 'Triggered rare mutation chance' }
        ]
    };

    return demoData;
}

/* CHECKPOINT removed: ENVIRONMENT_DETECTION_COMPLETE */

// ==================== UTILITIES ====================
// MGA-specific storage functions using GM_setValue/GM_getValue for reliable persistence

// ==================== GM STORAGE SYSTEM ====================
// Reliable storage using Tampermonkey's GM API instead of unreliable localStorage

function MGA_loadJSON(key, fallback, autoRecover = true) {
    // CRITICAL: Ensure we never use MainScript keys
    if (key && !key.startsWith('MGA_')) {
        console.error(`❌ [MGA-ISOLATION] CRITICAL: Attempted to load with non-MGA key: ${key}`);
        console.error(`❌ [MGA-ISOLATION] This would conflict with MainScript! Adding MGA_ prefix.`);
        console.trace();
        key = 'MGA_' + key;
    }

    try {
        // Enhanced logging for critical operations
        if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') {
            productionLog(`📚 [GM-STORAGE] Attempting to load critical data: ${key}`);
        }

        // Enhanced GM API check before using GM_getValue
        if (!isGMApiAvailable()) {
            productionWarn(`⚠️ [GM-STORAGE] GM_getValue not available! Using localStorage fallback.`);
            try {
                const localVal = targetWindow.localStorage.getItem(key);
                if (localVal === null) return fallback;
                return JSON.parse(localVal);
            } catch (e) {
                console.error(`❌ [STORAGE] localStorage fallback failed for ${key}:`, e);
                return fallback;
            }
        }

        // Use GM_getValue for reliable cross-session storage
        const val = GM_getValue(key, null);

        if (val === null || val === undefined) {
            if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') {
                productionLog(`📝 [GM-STORAGE] No data found for critical key: ${key} - checking localStorage`);

                // Try localStorage as fallback
                try {
                    const localVal = targetWindow.localStorage.getItem(key);
                    if (localVal !== null) {
                        productionLog(`✅ [STORAGE-RECOVERY] Found data in localStorage for ${key}, copying to GM storage`);
                        const parsed = JSON.parse(localVal);
                        // Copy to GM storage for future use
                        GM_setValue(key, localVal);
                        productionLog(`✅ [STORAGE-RECOVERY] Successfully migrated ${key} from localStorage to GM storage`);
                        return parsed;
                    }
                } catch (e) {
                    console.error(`❌ [STORAGE-RECOVERY] Failed to recover ${key} from localStorage:`, e);
                }

                productionLog(`📝 [GM-STORAGE] No data found for ${key} - returning fallback`);
                productionLog(`📝 [GM-STORAGE] Fallback value:`, fallback);
            } else {
                productionLog(`📝 [GM-STORAGE] No data found for key: ${key}`);
            }
            return fallback;
        }

        // GM_getValue can return the actual object for JSON data, but let's handle both cases
        let parsed;
        if (typeof val === 'string') {
            if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') {
                productionLog(`📚 [GM-STORAGE] Raw string data found for ${key}, length:`, val.length);
                productionLog(`📚 [GM-STORAGE] Raw data preview:`, val.substring(0, 100));
            }

            // Check for obviously corrupted data patterns
            if (val.includes('undefined') || val.startsWith('undefined') || val === 'null') {
                productionWarn(`⚠️ [GM-STORAGE] Detected corrupted data for ${key}: ${val.substring(0, 50)}...`);
                if (autoRecover) {
                    productionLog(`🔧 [GM-STORAGE] Auto-removing corrupted data for ${key}`);
                    GM_setValue(key, null);
                }
                return fallback;
            }

            try {
                parsed = JSON.parse(val);
            } catch (parseError) {
                console.error(`❌ [GM-STORAGE] JSON parse failed for ${key}:`, parseError);
                console.error(`❌ [GM-STORAGE] Raw data (first 300 chars):`, val.substring(0, 300));

                if (autoRecover) {
                    productionWarn(`🔧 [GM-STORAGE] Auto-removing unparseable data for ${key} and returning fallback`);
                    GM_setValue(key, null);
                    productionLog(`✅ [GM-STORAGE] Corrupted data cleared for ${key}`);
                }
                return fallback;
            }
        } else {
            // Data is already parsed (GM can store objects directly)
            parsed = val;
        }

        // Check if parsed data is empty for critical keys and try localStorage recovery
        if ((key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') && parsed && typeof parsed === 'object') {
            const isEmpty = Array.isArray(parsed) ? parsed.length === 0 : Object.keys(parsed).length === 0;
            if (isEmpty) {
                productionLog(`📝 [GM-STORAGE] Empty data in GM storage for ${key} - checking localStorage`);
                try {
                    const localVal = targetWindow.localStorage.getItem(key);
                    if (localVal !== null) {
                        productionLog(`✅ [STORAGE-RECOVERY] Found data in localStorage for ${key}, copying to GM storage`);
                        const localParsed = JSON.parse(localVal);
                        // Copy to GM storage for future use
                        GM_setValue(key, localVal);
                        productionLog(`✅ [STORAGE-RECOVERY] Successfully migrated ${key} from localStorage to GM storage`);
                        parsed = localParsed;
                    } else {
                        productionLog(`📝 [STORAGE-RECOVERY] No data in localStorage either for ${key}`);
                    }
                } catch (e) {
                    console.error(`❌ [STORAGE-RECOVERY] Failed to recover ${key} from localStorage:`, e);
                }
            }
        }

        // Validate the parsed data structure for critical keys
        if (key === 'MGA_petPresets' && parsed && typeof parsed === 'object') {
            // Ensure pet presets have valid structure
            const validatedPresets = {};
            let hasValidPresets = false;

            for (const [presetName, preset] of Object.entries(parsed)) {
                if (Array.isArray(preset) && preset.every(pet =>
                    pet && typeof pet === 'object' && pet.id && pet.petSpecies
                )) {
                    validatedPresets[presetName] = preset;
                    hasValidPresets = true;
                } else {
                    productionWarn(`⚠️ [GM-STORAGE] Invalid pet preset '${presetName}' detected and skipped`);
                }
            }

            if (hasValidPresets) {
                productionLog(`✅ [GM-STORAGE] Successfully loaded ${key} with ${Object.keys(validatedPresets).length} valid presets:`, Object.keys(validatedPresets));
                return validatedPresets;
            } else {
                productionWarn(`⚠️ [GM-STORAGE] No valid presets found in ${key}, returning fallback`);
                if (autoRecover) {
                    GM_setValue(key, null);
                }
                return fallback;
            }
        }

        if (key === 'MGA_seedsToDelete' && parsed && Array.isArray(parsed)) {
            // Validate seeds array
            const validSeeds = parsed.filter(seed => typeof seed === 'string' && seed.trim().length > 0);
            if (validSeeds.length !== parsed.length) {
                productionWarn(`⚠️ [GM-STORAGE] Some invalid seeds detected in ${key}, filtered to ${validSeeds.length} valid seeds`);
                if (autoRecover && validSeeds.length > 0) {
                    // Save the cleaned version
                    productionLog(`🔧 [GM-STORAGE] Auto-saving cleaned seeds data`);
                    MGA_saveJSON(key, validSeeds);
                }
            }
            productionLog(`✅ [GM-STORAGE] Successfully loaded ${key}: ${validSeeds.length} seeds`);
            return validSeeds;
        }

        // General validation for other data types
        if (parsed === null || parsed === undefined) {
            productionWarn(`⚠️ [GM-STORAGE] Loaded null/undefined data for ${key}, returning fallback`);
            return fallback;
        }

        productionLog(`✅ [GM-STORAGE] Successfully loaded ${key}: ${typeof parsed} ${Array.isArray(parsed) ? `(${parsed.length} items)` : Object.keys(parsed || {}).length ? `(${Object.keys(parsed).length} keys)` : '(empty)'}`);
        return parsed;

    } catch (e) {
        console.error(`❌ [GM-STORAGE] Unexpected error loading ${key}:`, e);
        console.error(`❌ [GM-STORAGE] Error details:`, {
            name: e.name,
            message: e.message,
            gmApiAvailable: typeof GM_getValue !== 'undefined'
        });

        return fallback;
    }
}

function MGA_saveJSON(key, value, retryCount = 0) {
    // CRITICAL: Ensure we never use MainScript keys
    if (key && !key.startsWith('MGA_')) {
        console.error(`❌ [MGA-ISOLATION] CRITICAL: Attempted to save with non-MGA key: ${key}`);
        console.error(`❌ [MGA-ISOLATION] This would conflict with MainScript! Adding MGA_ prefix.`);
        console.trace();
        key = 'MGA_' + key;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 100;

    try {
        // Enhanced GM API availability check
        if (!isGMApiAvailable()) {
            productionWarn(`⚠️ [GM-STORAGE] GM_setValue not available! Falling back to localStorage.`);
            return MGA_saveJSON_localStorage_fallback(key, value);
        }

        // Enhanced logging for critical operations
        if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') {
            productionLog(`💾 [GM-STORAGE] Attempting to save critical data: ${key} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            productionLog(`💾 [GM-STORAGE] Data type:`, typeof value);
            productionLog(`💾 [GM-STORAGE] Data content:`, value);
        }

        // GM can store objects directly, but let's use JSON for consistency and debugging
        const jsonString = JSON.stringify(value);

        // Save using GM_setValue for reliable persistence
        GM_setValue(key, jsonString);
        productionLog(`💾 [GM-STORAGE] GM_setValue executed for ${key}`);

        // Enhanced verification with deep check
        const verification = GM_getValue(key, null);
        if (!verification) {
            console.error(`❌ [GM-STORAGE] Save verification failed for ${key} - no data retrieved!`);

            // Retry logic
            if (retryCount < MAX_RETRIES - 1) {
                productionLog(`🔄 [GM-STORAGE] Retrying save for ${key} in ${RETRY_DELAY}ms...`);
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(MGA_saveJSON(key, value, retryCount + 1));
                    }, RETRY_DELAY);
                });
            }

            // Final attempt failed - show user alert
            console.error(`❌ [GM-STORAGE] All retry attempts failed for ${key}`);
            if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') {
                alert(`⚠️ Failed to save ${key.replace('MGA_', '')}! Your changes may not persist.`);
            }
            return false;
        }

        // Deep verification for critical data
        if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete') {
            try {
                const parsedVerification = JSON.parse(verification);
                const originalKeys = Object.keys(value || {}).sort();
                const savedKeys = Object.keys(parsedVerification || {}).sort();

                if (JSON.stringify(originalKeys) !== JSON.stringify(savedKeys)) {
                    productionWarn(`⚠️ [GM-STORAGE] Data structure mismatch for ${key}, but save likely succeeded`);
                }

                productionLog(`✅ [GM-STORAGE] Critical data verification passed for ${key}`);
            } catch (e) {
                productionWarn(`⚠️ [GM-STORAGE] Could not deep verify ${key}, but data exists`);
            }
        }

        // Success logging
        if (key === 'MGA_petPresets') {
            productionLog('💾 [GM-STORAGE] ✅ Pet presets saved successfully');
        } else if (key.startsWith('MGA_')) {
            productionLog(`💾 [GM-STORAGE] ✅ Saved ${key}`);
        }

        return true;

    } catch (error) {
        console.error(`❌ [GM-STORAGE] Failed to save ${key}:`, error);
        console.error(`❌ [GM-STORAGE] Error details:`, {
            name: error.name,
            message: error.message,
            gmApiAvailable: typeof GM_setValue !== 'undefined',
            retryCount: retryCount
        });

        // BUGFIX: Auto-cleanup on storage quota errors (from v1.11.3)
        const errorString = ('' + error).toLowerCase();
        if (errorString.indexOf('quota') >= 0 || errorString.indexOf('exceeded') >= 0) {
            productionLog('🧹 [STORAGE-CLEANUP] Quota exceeded - auto-cleaning debug caches...');
            const dropKeys = ['console-history', 'mga-debug-cache', 'mga-temp-cache'];
            for (let i = 0; i < dropKeys.length; i++) {
                try {
                    localStorage.removeItem(dropKeys[i]);
                    productionLog(`🧹 [STORAGE-CLEANUP] Removed: ${dropKeys[i]}`);
                } catch (_e) {}
            }
            // Retry save after cleanup (one time only)
            if (retryCount === 0) {
                productionLog(`🔄 [STORAGE-CLEANUP] Retrying save after cleanup...`);
                return MGA_saveJSON(key, value, 1);
            }
        }

        // Retry on error
        if (retryCount < MAX_RETRIES - 1) {
            productionLog(`🔄 [GM-STORAGE] Retrying save for ${key} after error...`);
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(MGA_saveJSON(key, value, retryCount + 1));
                }, RETRY_DELAY);
            });
        }

        return false;
    }
}

// Fallback function for when GM API is not available
function MGA_saveJSON_localStorage_fallback(key, value) {
    try {
        const jsonString = JSON.stringify(value);
        localStorage.setItem(key, jsonString);

        // Simple verification
        const verification = localStorage.getItem(key);
        if (verification === jsonString) {
            productionLog(`💾 [FALLBACK] Successfully saved ${key} to localStorage`);
            return true;
        } else {
            console.error(`❌ [FALLBACK] localStorage save verification failed for ${key}`);
            return false;
        }
    } catch (error) {
        // Check if it's a quota exceeded error
        const isQuotaError = error.name === 'QuotaExceededError' ||
                           error.message.includes('quota') ||
                           error.message.includes('exceeded');

        if (isQuotaError) {
            console.error(`❌ [FALLBACK] localStorage quota exceeded for ${key}!`);
            console.error(`💡 [FALLBACK] Try clearing browser console history or other localStorage data`);
            console.error(`💡 [FALLBACK] In Chrome DevTools: Application > Storage > Clear site data`);

            // Alert user for critical data
            if (key === 'MGA_petPresets' || key === 'MGA_seedsToDelete' || key === 'MGA_data') {
                alert(`⚠️ localStorage quota exceeded!\n\nYour ${key.replace('MGA_', '')} cannot be saved.\n\nFix:\n1. Open DevTools (F12)\n2. Go to Application tab\n3. Click "Clear site data"\n4. Reload the page`);
            }
        } else {
            console.error(`❌ [FALLBACK] localStorage save failed for ${key}:`, error);
        }
        return false;
    }
}

// ==================== DATA MIGRATION SYSTEM ====================
// Migrate existing localStorage data to GM storage for better reliability

function MGA_migrateFromLocalStorage() {
    try {
        productionLog('🔄 [MIGRATION] Starting data migration from localStorage to GM storage...');

        // Check if migration has already been completed (handle both boolean and string values)
        const migrationComplete = GM_getValue('MGA_migration_completed', false);
        if (migrationComplete === true || migrationComplete === 'true') {
            productionLog('✅ [MIGRATION] Migration already completed, skipping...');
            return;
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
                GM_setValue('MGA_migration_completed', true);
                GM_setValue('MGA_migration_timestamp', Date.now());
                GM_setValue('MGA_migration_stats', {
                    migratedCount,
                    totalDataSize,
                    timestamp: Date.now()
                });

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
                const localStorageData = localStorage.getItem(key);
                if (localStorageData) {
                    // Data exists in localStorage, migrate it
                    GM_setValue(key, localStorageData);
                    migratedCount++;
                    totalDataSize += localStorageData.length;

                    productionLog(`📦 [MIGRATION] Migrated ${key} (${localStorageData.length} chars)`);

                    // Verify the migration worked
                    const verification = GM_getValue(key, null);
                    if (verification === localStorageData) {
                        productionLog(`✅ [MIGRATION] Successfully verified ${key}`);

                        // Only remove from localStorage after successful verification
                        localStorage.removeItem(key);
                        productionLog(`🗑️ [MIGRATION] Removed ${key} from localStorage`);
                    } else {
                        console.error(`❌ [MIGRATION] Verification failed for ${key} - keeping localStorage version`);
                    }
                } else {
                    // No data in localStorage for this key
                    productionLog(`📝 [MIGRATION] No data found for ${key} in localStorage`);
                }
            } catch (error) {
                console.error(`❌ [MIGRATION] Failed to migrate ${key}:`, error);
            }

            // Process next key with a small delay to avoid blocking
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => migrateKeys(keyIndex + 1));
            } else {
                setTimeout(() => migrateKeys(keyIndex + 1), 0);
            }
        };

        // Start migration
        migrateKeys();

        return { success: true, migratedCount, totalDataSize };

    } catch (error) {
        console.error(`❌ [MIGRATION] Migration process failed:`, error);
        return { success: false, error: error.message };
    }
}

// Function to check migration status for debugging
function MGA_getMigrationStatus() {
    const migrationComplete = GM_getValue('MGA_migration_completed', false);
    const migrationStats = GM_getValue('MGA_migration_stats', null);
    const migrationTimestamp = GM_getValue('MGA_migration_timestamp', null);

    return {
        completed: migrationComplete,
        stats: migrationStats,
        timestamp: migrationTimestamp ? new Date(migrationTimestamp).toISOString() : null
    };
}

// Export migration functions for debugging
targetWindow.MGA_migrateFromLocalStorage = MGA_migrateFromLocalStorage;
targetWindow.MGA_getMigrationStatus = MGA_getMigrationStatus;
targetWindow.MGA_saveJSON = MGA_saveJSON;
targetWindow.MGA_loadJSON = MGA_loadJSON;

// Export startIntervals for debugging and emergency use
targetWindow.startIntervals = startIntervals;

// ==================== COMPREHENSIVE DEBUG COLLECTION ====================
targetWindow.collectMGADebug = function() {
    productionLog('🔍 Starting comprehensive MGA debug collection...');

    const debugData = {
        timestamp: new Date().toISOString(),
        version: typeof GM_info !== 'undefined' ? (GM_info?.script?.version || 'Unknown') : 'Unknown',
        userAgent: navigator.userAgent,

        // Script State
        scriptState: {
            mainScriptDetected: (typeof MGAIsolationSystem !== 'undefined' ? MGAIsolationSystem?.mainScriptDetected : false) || false,
            protectedGlobals: (typeof MGAIsolationSystem !== 'undefined' ? MGAIsolationSystem?.protectedGlobals : []) || [],
            globalFunctions: {
                hasLoadJSON: typeof targetWindow.loadJSON !== 'undefined',
                hasSaveJSON: typeof targetWindow.saveJSON !== 'undefined',
                loadJSONOwner: (typeof targetWindow.loadJSON !== 'undefined' && targetWindow.loadJSON === MGA_loadJSON) ? 'MGA' : 'Other',
                saveJSONOwner: (typeof targetWindow.saveJSON !== 'undefined' && targetWindow.saveJSON === MGA_saveJSON) ? 'MGA' : 'Other'
            }
        },

        // Pet Hunger System
        petHungerSystem: {
            enabled: UnifiedState?.data?.settings?.notifications?.petHungerEnabled || false,
            threshold: UnifiedState?.data?.settings?.notifications?.petHungerThreshold || 25,
            activePets: UnifiedState?.atoms?.activePets?.map(pet => ({
                id: pet?.id,
                species: pet?.petSpecies,
                hunger: pet?.hunger,
                health: pet?.health,
                slot: pet?.slot
            })) || [],
            lastStates: (typeof lastPetHungerStates !== 'undefined') ? Object.keys(lastPetHungerStates || {}).map(id => ({
                petId: id,
                lastHunger: lastPetHungerStates[id]
            })) : []
        },

        // Shop System
        shopSystem: {
            firebaseEnabled: UnifiedState?.data?.settings?.notifications?.shopFirebaseEnabled || false,
            watchedSeeds: UnifiedState?.data?.settings?.notifications?.watchedSeeds || [],
            watchedEggs: UnifiedState?.data?.settings?.notifications?.watchedEggs || [],
            shopData: {
                globalShop: typeof targetWindow.globalShop !== 'undefined' ? 'Present' : 'Missing',
                quinoaData: UnifiedState?.atoms?.quinoaData ? 'Present' : 'Missing',
                seedTimer: UnifiedState?.data?.timers?.seed,
                eggTimer: UnifiedState?.data?.timers?.egg,
                toolTimer: UnifiedState?.data?.timers?.tool
            },
            lastCheck: new Date().toISOString()
        },

        // Weather System
        weatherSystem: {
            enabled: UnifiedState?.data?.settings?.notifications?.weatherNotificationsEnabled || false,
            watchedEvents: UnifiedState?.data?.settings?.notifications?.watchedWeatherEvents || [],
            currentWeather: targetWindow.roomState?.child?.data?.weather || targetWindow.roomState?.weather || 'Unknown',
            lastWeatherState: (typeof lastWeatherState !== 'undefined') ? lastWeatherState : null
        },

        // Performance Metrics
        performance: {
            memoryUsage: performance?.memory ? {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            } : 'Not available',
            intervals: {
                notificationInterval: (typeof notificationInterval !== 'undefined') ? 'Active' : 'Inactive',
                firebaseInterval: UnifiedState?.firebase?.reportInterval ? 'Active' : 'Inactive',
                timerManagerActive: (typeof timerManager !== 'undefined') ? (timerManager?.isRunning || false) : false,
                activeTimers: (typeof timerManager !== 'undefined') ? (timerManager?.activeTimers?.size || 0) : 0
            }
        },

        // Storage Status
        storageStatus: {
            gmApiAvailable: (typeof isGMApiAvailable !== 'undefined') ? isGMApiAvailable() : false,
            migrationStatus: (typeof MGA_getMigrationStatus !== 'undefined') ? MGA_getMigrationStatus() : 'N/A',
            storedData: (typeof GM_getValue !== 'undefined') ? {
                petPresets: GM_getValue('MGA_petPresets') ? 'Present' : 'Missing',
                seedsToDelete: GM_getValue('MGA_seedsToDelete') ? 'Present' : 'Missing',
                settings: GM_getValue('MGA_data') ? 'Present' : 'Missing'
            } : 'GM API not available'
        },

        // AutoFeed Protection
        autoFeedStatus: {
            autoFeedEnabled: targetWindow.autoFeedEnabled,
            autoFeedState: targetWindow.autoFeedState,
            autoFeedSkipFavorited: targetWindow.autoFeedSkipFavorited,
            protection: (typeof MGAIsolationSystem !== 'undefined') ? (MGAIsolationSystem?.isAutofeedProtected || false) : false
        },

        // Errors and Warnings
        recentErrors: []
    };

    productionLog('📊 Collecting performance data for 10 seconds...');
    productionLog('⏳ Monitoring for errors and performance issues...');

    // Note: Error capturing disabled due to browser security restrictions
    const errors = [];

    // Create performance monitor
    let frameCount = 0;
    let lastFrameTime = performance.now();
    const fpsData = [];

    function measureFPS() {
        const currentTime = performance.now();
        const delta = currentTime - lastFrameTime;
        if (delta > 0) {
            const fps = 1000 / delta;
            fpsData.push({
                time: new Date().toISOString(),
                fps: Math.round(fps),
                weather: window.roomState?.child?.data?.weather || window.roomState?.weather || 'None'
            });
        }
        lastFrameTime = currentTime;
        frameCount++;

        if (frameCount < 600) { // Run for ~10 seconds at 60fps
            requestAnimationFrame(measureFPS);
        } else {
            finishDebugCollection();
        }
    }

    requestAnimationFrame(measureFPS);

    function finishDebugCollection() {
        // Add collected data
        debugData.recentErrors = errors;
        debugData.performance.fpsAnalysis = {
            samples: fpsData.length,
            averageFPS: Math.round(fpsData.reduce((a, b) => a + b.fps, 0) / fpsData.length),
            minFPS: Math.min(...fpsData.map(d => d.fps)),
            maxFPS: Math.max(...fpsData.map(d => d.fps)),
            weatherDuringTest: [...new Set(fpsData.map(d => d.weather))]
        };

        // Create downloadable file
        const debugText = JSON.stringify(debugData, null, 2);
        const blob = new Blob([debugText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mga-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        productionLog('✅ Debug collection complete!');
        productionLog('📁 Debug file downloaded');
        productionLog('📊 Debug Summary:', {
            petHungerEnabled: debugData.petHungerSystem.enabled,
            activePets: debugData.petHungerSystem.activePets.length,
            weatherEnabled: debugData.weatherSystem.enabled,
            currentWeather: debugData.weatherSystem.currentWeather,
            averageFPS: debugData.performance.fpsAnalysis?.averageFPS,
            errors: debugData.recentErrors.length
        });

        // Also log to console for immediate viewing
        productionLog('🔍 Full Debug Data:', debugData);

        return debugData;
    }

    // Also set a timeout in case FPS monitoring doesn't complete
    setTimeout(() => {
        if (frameCount < 600) {
            productionLog('⏱️ Timeout reached, finishing collection early...');
            finishDebugCollection();
        }
    }, 12000);

    return 'Debug collection started... Will complete in 10 seconds.';
};

// ==================== MEMORY MANAGEMENT SYSTEM ====================
// Prevent memory leaks and accumulation that requires tab restarts

let mgaCleanupHandlers = [];
let mgaIntervals = [];
let mgaTimeouts = [];

// Register cleanup handler
function MGA_addCleanupHandler(handler) {
    if (typeof handler === 'function') {
        mgaCleanupHandlers.push(handler);
    }
}

// Register interval for automatic cleanup
function MGA_addInterval(interval) {
    mgaIntervals.push(interval);
    return interval;
}

// Register timeout for automatic cleanup
function MGA_addTimeout(timeout) {
    mgaTimeouts.push(timeout);
    return timeout;
}

// Clean up all MGA resources
function MGA_cleanup() {
    productionLog('🧹 [MEMORY] Starting MGA cleanup...');

    try {
        // Clear all intervals
        mgaIntervals.forEach(interval => {
            if (interval) {
                clearInterval(interval);
            }
        });
        productionLog(`🧹 [MEMORY] Cleared ${mgaIntervals.length} intervals`);
        mgaIntervals = [];

        // Clear all timeouts
        mgaTimeouts.forEach(timeout => {
            if (timeout) {
                clearTimeout(timeout);
            }
        });
        productionLog(`🧹 [MEMORY] Cleared ${mgaTimeouts.length} timeouts`);
        mgaTimeouts = [];

        // Run custom cleanup handlers
        mgaCleanupHandlers.forEach((handler, index) => {
            try {
                handler();
                productionLog(`🧹 [MEMORY] Executed cleanup handler ${index + 1}`);
            } catch (error) {
                console.error(`❌ [MEMORY] Cleanup handler ${index + 1} failed:`, error);
            }
        });

        // Clear event listeners
        if (window.MGA_Internal && window.MGA_Internal.eventListeners) {
            window.MGA_Internal.eventListeners.forEach(({ element, event, handler }) => {
                try {
                    element.removeEventListener(event, handler);
                } catch (error) {
                    productionWarn(`⚠️ [MEMORY] Failed to remove event listener:`, error);
                }
            });
            productionLog(`🧹 [MEMORY] Removed ${window.MGA_Internal.eventListeners.length} event listeners`);
            window.MGA_Internal.eventListeners = [];
        }

        // Clear large data structures
        if (window.UnifiedState) {
            // Save critical data before cleanup
            const criticalData = {
                petPresets: window.UnifiedState.data?.petPresets,
                seedsToDelete: window.UnifiedState.data?.seedsToDelete,
                settings: window.UnifiedState.data?.settings
            };

            // Save critical data
            Object.keys(criticalData).forEach(key => {
                if (criticalData[key] !== undefined) {
                    MGA_saveJSON(`MGA_${key}`, criticalData[key]);
                }
            });

            // Clear large arrays
            if (window.UnifiedState.data?.petAbilityLogs) {
                productionLog(`🧹 [MEMORY] Clearing ${window.UnifiedState.data.petAbilityLogs.length} pet ability logs from memory`);
                window.UnifiedState.data.petAbilityLogs = [];
            }
        }

        productionLog('✅ [MEMORY] MGA cleanup completed successfully');

    } catch (error) {
        console.error('❌ [MEMORY] MGA cleanup failed:', error);
    }
}

// Set up automatic cleanup on page unload
window.addEventListener('beforeunload', () => {
    productionLog('🔄 [MEMORY] Page unloading, starting cleanup...');
    MGA_cleanup();
});

// Set up cleanup on page hide (for mobile/tab switching)
window.addEventListener('pagehide', () => {
    productionLog('🔄 [MEMORY] Page hiding, starting cleanup...');
    MGA_cleanup();
});

// Export memory management functions
window.MGA_cleanup = MGA_cleanup;
window.MGA_addCleanupHandler = MGA_addCleanupHandler;
window.MGA_addInterval = MGA_addInterval;
window.MGA_addTimeout = MGA_addTimeout;

// ==================== MEMORY OPTIMIZATION SYSTEM ====================
// Smart memory management to reduce footprint while preserving user data

// Configuration for memory limits
const MGA_MemoryConfig = {
    maxLogsInMemory: 1000,        // Keep latest 1000 logs in memory
    maxLogsInStorage: 10000,      // Archive up to 10000 logs in storage
    saveDebounceMs: 2000,         // Debounce saves by 2 seconds
    domPoolSize: 50               // Pool size for DOM elements
};

// Debounced save system to reduce I/O operations
let saveTimeouts = new Map();
function MGA_debouncedSave(key, data) {
    // Clear existing timeout for this key
    if (saveTimeouts.has(key)) {
        clearTimeout(saveTimeouts.get(key));
    }

    // Set new debounced timeout
    const timeout = setTimeout(() => {
        try {
            MGA_saveJSON(key, data);
            productionLog(`💾 [MEMORY] Debounced save completed for ${key}`);
        } catch (error) {
            console.error(`❌ [MEMORY] Debounced save failed for ${key}:`, error);
        }
        saveTimeouts.delete(key);
    }, MGA_MemoryConfig.saveDebounceMs);

    saveTimeouts.set(key, timeout);
}

// Smart log management system
function MGA_manageLogMemory(logs) {
    if (!Array.isArray(logs) || logs.length <= MGA_MemoryConfig.maxLogsInMemory) {
        return logs; // No management needed
    }

    productionLog(`🧠 [MEMORY] Managing log memory: ${logs.length} logs, keeping ${MGA_MemoryConfig.maxLogsInMemory} in memory`);

    // Keep the most recent logs in memory
    const recentLogs = logs.slice(0, MGA_MemoryConfig.maxLogsInMemory);

    // Archive older logs to separate storage
    const archivedLogs = logs.slice(MGA_MemoryConfig.maxLogsInMemory);
    if (archivedLogs.length > 0) {
        // Save archived logs to separate storage key
        const existingArchive = MGA_loadJSON('MGA_petAbilityLogs_archive', []);
        const combinedArchive = [...archivedLogs, ...existingArchive].slice(0, MGA_MemoryConfig.maxLogsInStorage);
        MGA_debouncedSave('MGA_petAbilityLogs_archive', combinedArchive);
        productionLog(`📦 [MEMORY] Archived ${archivedLogs.length} logs to storage`);
    }

    return recentLogs;
}

// DOM element pooling for performance
const MGA_DOMPool = {
    pools: new Map(),

    getElement: function(tagName, className = '') {
        const key = `${tagName}:${className}`;
        if (!this.pools.has(key)) {
            this.pools.set(key, []);
        }

        const pool = this.pools.get(key);
        if (pool.length > 0) {
            const element = pool.pop();
            // Reset element state
            element.innerHTML = '';
            element.removeAttribute('style');
            element.className = className;
            return element;
        }

        // Create new element if pool is empty (using target context)
        const element = targetDocument.createElement(tagName);
        if (className) element.className = className;
        return element;
    },

    returnElement: function(element) {
        if (!element || !element.tagName) return;

        const key = `${element.tagName.toLowerCase()}:${element.className || ''}`;
        if (!this.pools.has(key)) {
            this.pools.set(key, []);
        }

        const pool = this.pools.get(key);
        if (pool.length < MGA_MemoryConfig.domPoolSize) {
            // Clean element before returning to pool
            element.innerHTML = '';
            element.removeAttribute('style');
            element.onclick = null;
            element.onmouseover = null;
            element.onmouseout = null;
            pool.push(element);
        }
    },

    cleanup: function() {
        productionLog('🧹 [MEMORY] Cleaning DOM element pools');
        this.pools.clear();
    }
};

// Add DOM pool cleanup to main cleanup handler
MGA_addCleanupHandler(() => {
    MGA_DOMPool.cleanup();
    // Clear save timeouts
    saveTimeouts.forEach(timeout => clearTimeout(timeout));
    saveTimeouts.clear();
});

// Function to retrieve all logs (memory + archived) when needed
function MGA_getAllLogs() {
    const memoryLogs = UnifiedState.data?.petAbilityLogs || [];
    const archivedLogs = MGA_loadJSON('MGA_petAbilityLogs_archive', []);

    // Combine and sort by timestamp (newest first)
    const allLogs = [...memoryLogs, ...archivedLogs];
    allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    productionLog(`📜 [MEMORY] Retrieved ${memoryLogs.length} memory logs + ${archivedLogs.length} archived logs = ${allLogs.length} total`);
    return allLogs;
}

// Export memory optimization functions
window.MGA_debouncedSave = MGA_debouncedSave;
window.MGA_manageLogMemory = MGA_manageLogMemory;
window.MGA_getAllLogs = MGA_getAllLogs;
window.MGA_DOMPool = MGA_DOMPool;

// ==================== DOM QUERY CACHE SYSTEM ====================
// Performance optimization: Cache frequently accessed DOM queries
const elementCache = new WeakMap();
const CACHE_DURATION = 1000; // 1 second cache

function getCachedElement(selector, context = document) {
    const now = Date.now();
    const key = `${selector}_${context.id || 'document'}`;

    let cached = elementCache.get(context);
    if (cached && cached[key] && now - cached[key].time < CACHE_DURATION) {
        return cached[key].element;
    }

    const element = context.querySelector(selector);
    if (!cached) cached = {};
    cached[key] = { element, time: now };
    elementCache.set(context, cached);

    return element;
}

function getCachedElements(selector, context = document) {
    const now = Date.now();
    const key = `${selector}_all_${context.id || 'document'}`;

    let cached = elementCache.get(context);
    if (cached && cached[key] && now - cached[key].time < CACHE_DURATION) {
        return cached[key].elements;
    }

    const elements = context.querySelectorAll(selector);
    if (!cached) cached = {};
    cached[key] = { elements, time: now };
    elementCache.set(context, cached);

    return elements;
}

// Invalidate cache for a specific context (useful after DOM changes)
function invalidateCache(context = document) {
    elementCache.delete(context);
}

window.MGA_DOMCache = { getCachedElement, getCachedElements, invalidateCache };

// ==================== NAMESPACE ISOLATION ====================
// Keep MGA functions completely isolated to prevent conflicts with MainScript.txt

// Export MGA functions to global scope for direct access (MGA_ prefix prevents conflicts)
window.MGA_loadJSON = MGA_loadJSON;
window.MGA_saveJSON = MGA_saveJSON;

// MainScript Conflict Detection and Protection
window.MGA_ConflictDetection = {
    mainScriptDetected: false,
    protectedGlobals: ['autoFeedEnabled', 'autoFeedState', 'autoFeedSkipFavorited', 'petAbilityLogs'],

    // Ensure MGA never accesses MainScript globals
    preventAccess: function() {
        if (!this.mainScriptDetected) return;

        // Create safe accessors that prevent MGA from accidentally touching MainScript variables
        this.protectedGlobals.forEach(globalVar => {
            if (window[globalVar] !== undefined) {
                productionLog(`🔒 [MGA-ISOLATION] Ensuring MGA cannot access MainScript global: ${globalVar}`);

                // Define a read-only accessor for debugging
                Object.defineProperty(window, `MGA_SAFE_${globalVar}`, {
                    get: function() {
                        productionWarn(`⚠️ [MGA-ISOLATION] MGA attempted to access MainScript global: ${globalVar}`);
                        productionWarn(`⚠️ [MGA-ISOLATION] This access was blocked to prevent interference`);
                        console.trace();
                        return undefined; // Always return undefined to MGA
                    },
                    configurable: false,
                    enumerable: false
                });
            }
        });

        // Specifically protect autofeed variables
        productionLog(`🔒 [MGA-ISOLATION] MainScript autofeed protection active`);
        productionLog(`🔒 [MGA-ISOLATION] MGA will not interfere with autofeed functionality`);
    },

    detectMainScript: function() {
        const hasMainScriptFunctions = typeof window.loadJSON === 'function' || typeof window.saveJSON === 'function';
        const hasMainScriptVars = typeof window.petAbilityLogs !== 'undefined' || typeof window.autoFeedEnabled !== 'undefined';
        const hasVisibilityOverride = document.hidden === false && typeof Object.getOwnPropertyDescriptor === 'function';

        this.mainScriptDetected = hasMainScriptFunctions || hasMainScriptVars || hasVisibilityOverride;

        if (this.mainScriptDetected) {
            // productionLog('🔍 [MGA-ISOLATION] MainScript.txt detected - enabling full isolation mode');
            productionLog('🔒 [MGA-ISOLATION] MGA will NOT modify global functions or MainScript variables');
            productionLog('📝 [MGA-ISOLATION] Protected variables:', this.protectedGlobals);
        } else {
            productionLog('📝 [MGA-ISOLATION] No MainScript detected - running in standalone mode');
        }

        return this.mainScriptDetected;
    },

    checkGlobalIntegrity: function() {
        if (!this.mainScriptDetected) return true;

        const violations = [];

        // Check if we accidentally modified protected globals
        this.protectedGlobals.forEach(globalVar => {
            if (window[globalVar] !== undefined) {
                // MainScript global exists - make sure we don't interfere
                // productionLog(`🔍 [MGA-ISOLATION] MainScript global '${globalVar}' is active - ensuring no interference`);
            }
        });

        // Check if global loadJSON/saveJSON are MainScript's versions
        if (window.loadJSON && window.loadJSON !== MGA_loadJSON) {
            productionLog('🔒 [MGA-ISOLATION] Global loadJSON belongs to MainScript - MGA using isolated MGA_loadJSON');
        }
        if (window.saveJSON && window.saveJSON !== MGA_saveJSON) {
            productionLog('🔒 [MGA-ISOLATION] Global saveJSON belongs to MainScript - MGA using isolated MGA_saveJSON');
        }

        return violations.length === 0;
    },

    createIsolationBarrier: function() {
        if (!this.mainScriptDetected) return;

        // Light protection - just store original values for monitoring
        this.protectedGlobals.forEach(globalVar => {
            if (window[globalVar] !== undefined) {
                const originalValue = window[globalVar];

                // Store original value for later comparison
                try {
                    Object.defineProperty(window, `_MGA_ORIGINAL_${globalVar}`, {
                        value: originalValue,
                        writable: true,
                        configurable: true
                    });
                    productionLog(`🛡️ [MGA-ISOLATION] Stored original value for MainScript global: ${globalVar}`);
                } catch (protectionError) {
                    productionWarn(`⚠️ [MGA-ISOLATION] Could not store original value for ${globalVar}:`, protectionError.message);
                }
            }
        });

        // Simple function protection - just save references without modifying
        if (window.loadJSON && window.loadJSON !== window.MGA_loadJSON) {
            productionLog(`🔒 [MGA-ISOLATION] MainScript loadJSON detected - storing reference`);
            window._MGA_MAINSCRIPT_loadJSON = window.loadJSON;
        }
        if (window.saveJSON && window.saveJSON !== window.MGA_saveJSON) {
            productionLog(`🔒 [MGA-ISOLATION] MainScript saveJSON detected - storing reference`);
            window._MGA_MAINSCRIPT_saveJSON = window.saveJSON;
        }
    },

    // New method to verify isolation integrity
    validateIsolation: function() {
        let violations = [];

        // Check that MGA never modified protected globals
        this.protectedGlobals.forEach(globalVar => {
            const original = window[`_MGA_ORIGINAL_${globalVar}`];
            const current = window[globalVar];

            if (original !== undefined && current !== original) {
                violations.push({
                    global: globalVar,
                    expected: original,
                    actual: current,
                    type: 'global_modification'
                });
            }
        });

        // Check that MGA uses its own storage functions
        if (window.MGA_loadJSON && window.loadJSON && window.MGA_loadJSON === window.loadJSON) {
            violations.push({
                issue: 'MGA_loadJSON is assigned to global loadJSON',
                type: 'function_collision'
            });
        }
        if (window.MGA_saveJSON && window.saveJSON && window.MGA_saveJSON === window.saveJSON) {
            violations.push({
                issue: 'MGA_saveJSON is assigned to global saveJSON',
                type: 'function_collision'
            });
        }

        if (violations.length > 0) {
            console.error(`❌ [MGA-ISOLATION] Isolation violations detected:`, violations);
            return false;
        }

        productionLog(`✅ [MGA-ISOLATION] Isolation validation passed - no violations detected`);
        return true;
    }
};

// NEVER set global window.loadJSON or window.saveJSON - this prevents conflicts
// MGA ALWAYS uses MGA_loadJSON and MGA_saveJSON exclusively

// ==================== SAVE OPERATION WRAPPER ====================
// Wrapper function to handle new MGA_saveJSON return format and provide user feedback

window.MGA_safeSave = function(key, value, options = {}) {
    const {
        showUserAlert = true,
        criticalData = false,
        description = key,
        silent = false
    } = options;

    // CRITICAL: Ensure we never use MainScript keys
    if (key && !key.startsWith('MGA_')) {
        console.error(`❌ [MGA-ISOLATION] CRITICAL: Attempted to save with non-MGA key: ${key}`);
        console.error(`❌ [MGA-ISOLATION] This would conflict with MainScript! Adding MGA_ prefix.`);
        console.trace();
        key = 'MGA_' + key;
    }

    try {
        // Simple synchronous save
        const success = MGA_saveJSON(key, value);

        if (success) {
            if (!silent) {
                productionLog(`✅ [MGA-SAFE-SAVE] Successfully saved ${description}`);
            }
            return { success: true };
        } else {
            // Save failed
            const errorMsg = `Failed to save ${description}`;
            console.error(`❌ [MGA-SAFE-SAVE] ${errorMsg}`);

            // REMOVED: Alert on save failure - causes modal spam
            // Save failures are logged to console instead

            return { success: false, error: 'save_failed' };
        }
    } catch (error) {
        console.error(`❌ [MGA-SAFE-SAVE] Exception during save of ${description}:`, error);
        return { success: false, error: error.message, exception: true };
    }
};

// Helper function for backward compatibility with legacy save calls
window.MGA_legacySave = function(key, value, description) {
    const result = MGA_safeSave(key, value, {
        description: description || key,
        showUserAlert: true,
        criticalData: key.includes('petPresets') || key.includes('seedsToDelete')
    });
    return result.success;
};

// Validation helper for critical data types
window.MGA_validateSaveData = function(key, value) {
    if (key === 'MGA_petPresets') {
        if (!value || typeof value !== 'object') {
            return { valid: false, error: 'Pet presets must be an object' };
        }
        for (const [presetName, preset] of Object.entries(value)) {
            if (!Array.isArray(preset)) {
                return { valid: false, error: `Preset '${presetName}' must be an array` };
            }
            if (!preset.every(pet => pet && pet.id && pet.petSpecies)) {
                return { valid: false, error: `Preset '${presetName}' contains invalid pet data` };
            }
        }
        return { valid: true };
    }

    if (key === 'MGA_seedsToDelete') {
        if (!Array.isArray(value)) {
            return { valid: false, error: 'Seeds to delete must be an array' };
        }
        if (!value.every(seed => typeof seed === 'string' && seed.trim())) {
            return { valid: false, error: 'All seeds must be non-empty strings' };
        }
        return { valid: true };
    }

    return { valid: true }; // Default: assume valid for other data types
};

// Diagnostic function for localStorage issues
window.MGA_debugStorage = function() {
    productionLog('🔍 [MGA-STORAGE] localStorage Diagnostic Report');
    productionLog('=====================================');

    try {
        // Check basic availability
        productionLog('📊 Basic Info:');
        productionLog('  localStorage available:', typeof localStorage !== 'undefined');
        productionLog('  Total items in localStorage:', localStorage.length);

        // Check MGA-specific keys
        const mgaKeys = Object.keys(localStorage).filter(k => k.startsWith('MGA_'));
        productionLog('  MGA-specific keys found:', mgaKeys.length);
        productionLog('  MGA keys:', mgaKeys);

        // Check each MGA key
        productionLog('\n📝 MGA Data Status:');
        mgaKeys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                const parsed = JSON.parse(value);
                productionLog(`  ${key}:`, {
                    exists: true,
                    size: value.length + ' chars',
                    type: typeof parsed,
                    itemCount: Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length
                });
            } catch (e) {
                productionLog(`  ${key}: ❌ Invalid JSON - ${e.message}`);
            }
        });

        // Check conflicts
        productionLog('\n⚠️ Potential Conflicts:');
        productionLog('  window.loadJSON defined by:', window.loadJSON === MGA_loadJSON ? 'MGA' : 'Other script');
        productionLog('  window.saveJSON defined by:', window.saveJSON === MGA_saveJSON ? 'MGA' : 'Other script');

        // Storage space test
        productionLog('\n💾 Storage Test:');
        const testKey = 'MGA_storageTest';
        const testData = { test: true, timestamp: Date.now() };
        try {
            MGA_saveJSON(testKey, testData);
            const retrieved = MGA_loadJSON(testKey, null);
            productionLog('  Storage test result:', retrieved && retrieved.test === true ? '✅ PASSED' : '❌ FAILED');
            localStorage.removeItem(testKey);
        } catch (e) {
            productionLog('  Storage test result: ❌ FAILED -', e.message);
        }

    } catch (error) {
        console.error('❌ [MGA-STORAGE] Diagnostic failed:', error);
    }
};

    function safeSendMessage(message) {
        try {
            // Check for connection availability
            if (!targetWindow.MagicCircle_RoomConnection) {
                productionWarn('⚠️ MagicCircle_RoomConnection not available');
                return false;
            }

            // Validate that sendMessage exists and is a function
            if (typeof targetWindow.MagicCircle_RoomConnection.sendMessage !== 'function') {
                productionWarn('⚠️ sendMessage is not a function or not available');
                return false;
            }

            // Send the message
            targetWindow.MagicCircle_RoomConnection.sendMessage(message);
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    }

    // ==================== PROPER GAME MESSAGE SENDER ====================
    function sendToGame(payloadObj) {
        const msg = { scopePath: ["Room", "Quinoa"], ...payloadObj };
        try {
            if (!targetWindow.MagicCircle_RoomConnection || !targetWindow.MagicCircle_RoomConnection.sendMessage) {
                productionWarn('⚠️ MagicCircle_RoomConnection not available for sendToGame');
                return false;
            }

            productionLog('🎮 sendToGame:', msg);
            targetWindow.MagicCircle_RoomConnection.sendMessage(msg);
            return true;
        } catch (error) {
            console.error('❌ sendToGame error:', error);
            return false;
        }
    }

    function hookAtom(atomPath, windowKey, callback, retryCount = 0) {
        const maxRetries = 20; // Max 10 seconds of retries

        // CRITICAL FIX: jotaiAtomCache is now an object with a .cache property
        const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
        if (!atomCache || !atomCache.get) {
            if (retryCount >= maxRetries) {
                productionWarn(`⚠️ [ATOM-HOOK] Gave up waiting for jotaiAtomCache for ${windowKey} after ${maxRetries} retries`);
                productionWarn(`⚠️ [ATOM-HOOK] Script will continue with reduced functionality`);
                return;
            }
            productionLog(`⏳ Waiting for jotaiAtomCache for ${windowKey}... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => hookAtom(atomPath, windowKey, callback, retryCount + 1), 500);
            return;
        }
        productionLog(`🔗 Attempting to hook atom: ${windowKey} at path: ${atomPath}`);

        try {
            const atom = atomCache.get(atomPath);
            if (!atom || !atom.read) {
                productionWarn(`❌ Could not find atom for ${atomPath}`);
                // List available atoms for debugging
                const allAtoms = Array.from(atomCache.keys());
                const petAtoms = allAtoms.filter(key => key.includes('Pet') || key.includes('pet') || key.includes('Slot'));
                productionLog('🔍 Pet-related atoms:', petAtoms);
                productionLog('🔍 All atoms (first 20):', allAtoms.slice(0, 20));
                return;
            }

            const originalRead = atom.read;
            atom.read = function(get) {
                const rawValue = originalRead.call(this, get);

                // Enhanced debugging for activePets
                if (windowKey === 'activePets' && UnifiedState.data.settings?.debugMode) {
                    productionLog(`🐾 [ATOM-DEBUG] ${windowKey} raw value:`, {
                        value: rawValue,
                        type: typeof rawValue,
                        isArray: Array.isArray(rawValue),
                        length: rawValue?.length,
                        firstItem: rawValue?.[0]
                    });
                }

                // Allow callback to transform the value before storing
                let finalValue = rawValue;
                if (callback) {
                    const callbackResult = callback(rawValue);
                    // If callback returns a value, use it; otherwise use raw value
                    if (callbackResult !== undefined) {
                        finalValue = callbackResult;
                        if (windowKey === 'activePets' && UnifiedState.data.settings?.debugMode) {
                            productionLog(`🐾 [ATOM-DEBUG] ${windowKey} transformed by callback:`, finalValue);
                        }
                    }
                }

                // Store the final (possibly transformed) value
                UnifiedState.atoms[windowKey] = finalValue;
                window[windowKey] = finalValue;

                if (windowKey === 'activePets' && UnifiedState.data.settings?.debugMode) {
                    productionLog(`🐾 [ATOM-DEBUG] ${windowKey} stored in UnifiedState:`, {
                        count: finalValue?.length || 0,
                        value: finalValue
                    });
                }

                return rawValue; // Return raw value to game
            };

            productionLog(`✅ hookAtom: Successfully hooked ${windowKey}`);

            // Don't force an initial read - it might trigger game modals
            // Instead, wait for the game to naturally read the atom
            // Or use the periodic check in updateActivePetsFromRoomState
        } catch (error) {
            console.error(`❌ Error hooking ${atomPath}:`, error);
        }
    }

    // ==================== DRAGGABLE & RESIZABLE ====================
    // OPTIMIZED MAIN HUD DRAGGING SYSTEM - Professional and smooth
    function makeDraggable(element, handle) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let animationFrame = null;
        let currentX = 0;
        let currentY = 0;

        handle.style.cursor = 'grab';

        handle.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            // Don't start drag if clicking resize handle
            if (e.target.classList && e.target.classList.contains('mga-resize-handle')) return;

            e.preventDefault();
            e.stopPropagation();

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            currentX = startX;
            currentY = startY;

            const rect = element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // Professional drag start effects with will-change for performance
            element.style.willChange = 'transform';
            element.style.transition = 'none';
            element.style.transform = 'scale(1.01)';
            element.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            element.style.zIndex = '999999';
            handle.style.cursor = 'grabbing';

            targetDocument.body.style.userSelect = 'none';

            debugLog('OVERLAY_LIFECYCLE', 'Started dragging main HUD', {
                elementClass: element.className,
                startPosition: { left: startLeft, top: startTop }
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // Once dragging, don't check for MGA events - keep tracking
            // This prevents losing the drag when mouse moves fast

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Enhanced boundary constraints with snap zones
            const snapZone = 15;
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            // Viewport constraints
            newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));

            // Snap to edges with visual feedback
            if (newLeft < snapZone) {
                newLeft = 0;
                element.style.borderLeft = '2px solid rgba(74, 158, 255, 0.5)';
            } else if (newLeft > window.innerWidth - element.offsetWidth - snapZone) {
                newLeft = window.innerWidth - element.offsetWidth;
                element.style.borderRight = '2px solid rgba(74, 158, 255, 0.5)';
            } else {
                element.style.borderLeft = '';
                element.style.borderRight = '';
            }

            if (newTop < snapZone) {
                newTop = 0;
                element.style.borderTop = '2px solid rgba(74, 158, 255, 0.5)';
            } else if (newTop > window.innerHeight - element.offsetHeight - snapZone) {
                newTop = window.innerHeight - element.offsetHeight;
                element.style.borderBottom = '2px solid rgba(74, 158, 255, 0.5)';
            } else {
                element.style.borderTop = '';
                element.style.borderBottom = '';
            }

            // Use direct positioning for more reliable movement
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                // Once dragging, don't need to check MGA event
                isDragging = false;

                // Clean up styles
                element.style.transition = 'all 0.2s ease';
                element.style.transform = 'scale(1)';
                element.style.boxShadow = 'var(--panel-shadow, 0 4px 12px rgba(0, 0, 0, 0.15))';
                element.style.zIndex = '';
                element.style.borderTop = '';
                element.style.borderBottom = '';
                element.style.borderLeft = '';
                element.style.borderRight = '';
                element.style.willChange = 'auto';

                handle.style.cursor = 'grab';
                targetDocument.body.style.userSelect = '';

                // Save position
                const finalPosition = {
                    left: element.style.left,
                    top: element.style.top
                };

                saveMainHUDPosition(finalPosition);

                debugLog('OVERLAY_LIFECYCLE', 'Finished dragging main HUD', {
                    elementClass: element.className,
                    finalPosition
                });
            }
        });
    }

    // Save main HUD position
    function saveMainHUDPosition(position) {
        try {
            MGA_saveJSON('MGA_mainHUDPosition', position);
            debugLog('OVERLAY_LIFECYCLE', 'Saved main HUD position', { position });
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to save main HUD position', error, { position });
        }
    }

    // Load main HUD position on startup
    function loadMainHUDPosition(element) {
        try {
            const savedPosition = MGA_loadJSON('MGA_mainHUDPosition', null);
            if (savedPosition && savedPosition.left && savedPosition.top) {
                const leftPx = parseInt(savedPosition.left);
                const topPx = parseInt(savedPosition.top);

                if (!isNaN(leftPx) && !isNaN(topPx) &&
                    leftPx >= 0 && topPx >= 0 &&
                    leftPx < window.innerWidth && topPx < window.innerHeight) {

                    element.style.left = savedPosition.left;
                    element.style.top = savedPosition.top;

                    debugLog('OVERLAY_LIFECYCLE', 'Restored main HUD position', { position: savedPosition });
                }
            }
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to load main HUD position', error);
        }
    }

    // ==================== UNIFIED RESIZE SYSTEM ====================
    function makeElementResizable(element, options = {}) {
    const {
        minWidth = 300,
        minHeight = 250,
        maxWidth = window.innerWidth * 0.9,
        maxHeight = window.innerHeight * 0.9,
        handleSize = 12,
        showHandleOnHover = true
    } = options;

    // Check if element already has a resize handle - remove it to prevent duplicates
    const existingHandle = element.querySelector('.mga-resize-handle');
    if (existingHandle) {
        existingHandle.remove();
    }

    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'mga-resize-handle';
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${handleSize}px;
        height: ${handleSize}px;
        cursor: se-resize;
        background: linear-gradient(-45deg, transparent 40%, rgba(74, 158, 255, 0.6) 50%, transparent 60%);
        border-radius: 0 0 4px 0;
        opacity: ${showHandleOnHover ? '0.3' : '0.6'};
        transition: opacity 0.2s ease;
        z-index: 10;
        pointer-events: auto;
    `;
    element.appendChild(resizeHandle);

    if (showHandleOnHover) {
        element.addEventListener('mouseenter', () => { resizeHandle.style.opacity = '0.8'; });
        element.addEventListener('mouseleave', () => {
            if (!element.hasAttribute('data-resizing')) {
                resizeHandle.style.opacity = '0.3';
            }
        });
    }

    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let rafId = null;

    const onMouseMove = (e) => {
        if (!isResizing) return;

        // Throttle with rAF for smoothness
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + (e.clientX - startX)));
            const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + (e.clientY - startY)));
            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
        });
    };

    const stopResizing = () => {
        if (!isResizing) return;
        isResizing = false;
        element.removeAttribute('data-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizeHandle.style.opacity = '0.3';

        // Unbind listeners safely
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', stopResizing);
    };

    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        element.setAttribute('data-resizing', 'true');

        startX = e.clientX;
        startY = e.clientY;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;

        document.body.style.cursor = 'se-resize';
        document.body.style.userSelect = 'none';

        // Bind move/up only for duration of resize
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', stopResizing);
    });

    return resizeHandle;
}


    // Legacy function for backward compatibility
    function makeResizable(element, handle) {
        // If a handle is provided, we're using the old system - just add simple resize
        if (handle) {
            return makeElementResizable(element, { showHandleOnHover: false });
        }
        return makeElementResizable(element);
    }

    // ==================== TOGGLE BUTTON DRAGGING ====================
    function makeToggleButtonDraggable(toggleBtn) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let clickStarted = false;
        let animationFrame = null;
        let currentX = 0;
        let currentY = 0;

        toggleBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            clickStarted = true;
            isDragging = false; // Don't start dragging immediately
            startX = e.clientX;
            startY = e.clientY;
            currentX = startX;
            currentY = startY;

            const rect = toggleBtn.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // Add will-change for better performance
            toggleBtn.style.willChange = 'transform';
            toggleBtn.style.cursor = 'grabbing';
        });

        document.addEventListener('pointermove', (e) => {
            if (!clickStarted) return;

            // Once dragging starts, don't check for MGA events to prevent dropping
            if (!isDragging) {
                // Only check isMGAEvent before drag starts
                if (!isMGAEvent(e)) {
                    return;
                }
            }

            currentX = e.clientX;
            currentY = e.clientY;

            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);

            // Only start dragging if mouse moved more than 3px (more responsive)
            if (!isDragging && (deltaX > 3 || deltaY > 3)) {
                isDragging = true;
                toggleBtn.style.transition = 'none';
                toggleBtn.style.boxShadow = '0 8px 32px rgba(74, 158, 255, 0.6)';
                toggleBtn.style.zIndex = '999999';
                // Capture pointer for reliable tracking
                toggleBtn.setPointerCapture(e.pointerId);
            }

            if (isDragging) {
                // Direct position update without transform
                const moveX = currentX - startX;
                const moveY = currentY - startY;

                let newLeft = startLeft + moveX;
                let newTop = startTop + moveY;

                // Constrain within viewport with padding
                const padding = 10;
                newLeft = Math.max(padding, Math.min(window.innerWidth - toggleBtn.offsetWidth - padding, newLeft));
                newTop = Math.max(padding, Math.min(window.innerHeight - toggleBtn.offsetHeight - padding, newTop));

                // Use direct positioning instead of transform for more reliable movement
                toggleBtn.style.right = '';
                toggleBtn.style.bottom = '';
                toggleBtn.style.left = `${newLeft}px`;
                toggleBtn.style.top = `${newTop}px`;
            }
        });

        document.addEventListener('pointerup', (e) => {
            if (clickStarted) {
                // Once drag is active, don't check MGA event
                if (!isDragging && !isMGAEvent(e)) {
                    return;
                }

                if (isDragging) {
                    // Release pointer capture
                    toggleBtn.releasePointerCapture(e.pointerId);

                    // Finish dragging
                    isDragging = false;
                    toggleBtn.style.transition = 'all 0.2s ease';
                    toggleBtn.style.boxShadow = '0 4px 20px rgba(74, 158, 255, 0.4)';
                    toggleBtn.style.zIndex = '999998';
                    toggleBtn.style.cursor = 'grab';
                    toggleBtn.style.willChange = 'auto';

                    // Save position (already applied directly)
                    const finalPosition = {
                        left: toggleBtn.style.left,
                        top: toggleBtn.style.top,
                        right: '', // Clear right positioning
                        bottom: '' // Clear bottom positioning
                    };
                    saveToggleButtonPosition(finalPosition);

                    debugLog('OVERLAY_LIFECYCLE', 'Toggle button dragged to new position', finalPosition);
                } else {
                    // This was a click, not a drag - trigger the toggle functionality
                    toggleBtn.style.willChange = 'auto';
                    toggleBtn.style.cursor = 'grab';

                    const panel = UnifiedState.panels.main;
                    const isCurrentlyVisible = panel.style.display !== 'none';
                    const newVisibility = !isCurrentlyVisible;

                    panel.style.display = newVisibility ? 'block' : 'none';

                    // Hide any stuck tooltips when panel is toggled
                    if (window.MGA_Tooltips && window.MGA_Tooltips.hide) {
                        window.MGA_Tooltips.hide();
                    }

                    // Save visibility state
                    UnifiedState.data.settings.panelVisible = newVisibility;
                    MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);

                    debugLog('OVERLAY_LIFECYCLE', `Panel toggled: ${newVisibility ? 'visible' : 'hidden'}`);
                }

                clickStarted = false;
            }
        });
    }

    // Save toggle button position
    function saveToggleButtonPosition(position) {
        try {
            MGA_saveJSON('MGA_toggleButtonPosition', position);
            debugLog('OVERLAY_LIFECYCLE', 'Saved toggle button position', { position });
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to save toggle button position', error, { position });
        }
    }

    // Load toggle button position on startup
    function loadToggleButtonPosition(toggleBtn) {
        try {
            const savedPosition = MGA_loadJSON('MGA_toggleButtonPosition', null);
            if (savedPosition) {
                if (savedPosition.left && savedPosition.top) {
                    const leftPx = parseInt(savedPosition.left);
                    const topPx = parseInt(savedPosition.top);

                    if (!isNaN(leftPx) && !isNaN(topPx) &&
                        leftPx >= 0 && topPx >= 0 &&
                        leftPx < window.innerWidth && topPx < window.innerHeight) {

                        toggleBtn.style.right = '';
                        toggleBtn.style.bottom = '';
                        toggleBtn.style.left = savedPosition.left;
                        toggleBtn.style.top = savedPosition.top;

                        debugLog('OVERLAY_LIFECYCLE', 'Restored toggle button position', { position: savedPosition });
                    }
                }
            }
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to load toggle button position', error);
        }
    }

    // ==================== UI CREATION ====================
    function createUnifiedUI() {
        productionLog('🎨 Creating Unified UI...');

        // Add styles
        const styleSheet = targetDocument.createElement('style');
        styleSheet.textContent = UNIFIED_STYLES;
        targetDocument.head.appendChild(styleSheet);

        // Create toggle button with enhanced persistence
        const toggleBtn = targetDocument.createElement('div');
        toggleBtn.className = 'mga-toggle-btn';
        toggleBtn.innerHTML = '🌱';
        toggleBtn.setAttribute('data-tooltip', 'MGTools - Click to toggle panel (Alt+M)');

        // Click/drag functionality is now handled by makeToggleButtonDraggable

        targetDocument.body.appendChild(toggleBtn);

        // Verify toggle button attachment
        productionLog('🔧 [UI-VERIFICATION] Toggle button attached to body:', !!targetDocument.querySelector('.mga-toggle-btn'));
        UnifiedState.panels.toggle = toggleBtn;

        // Load toggle button position
        loadToggleButtonPosition(toggleBtn);

        // Make toggle button draggable with special handling
        makeToggleButtonDraggable(toggleBtn);

        // Add window focus/blur handlers to maintain UI persistence
        window.addEventListener('focus', () => {
            // Restore panel visibility state when window regains focus
            const panel = UnifiedState.panels.main;
            const savedVisibility = UnifiedState.data.settings.panelVisible !== false; // Default to true
            panel.style.display = savedVisibility ? 'block' : 'none';

            if (UnifiedState.data.settings.debugMode) {
                productionLog(`🔄 Window focused - Panel restored to: ${savedVisibility ? 'visible' : 'hidden'}`);
            }
        });

        window.addEventListener('blur', () => {
            // Save current panel state before losing focus
            const panel = UnifiedState.panels.main;
            const currentVisibility = panel.style.display !== 'none';
            UnifiedState.data.settings.panelVisible = currentVisibility;
            MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);

            if (UnifiedState.data.settings.debugMode) {
                productionLog(`💾 Window blurred - Panel state saved: ${currentVisibility ? 'visible' : 'hidden'}`);
            }
        });

        // Create main panel
        const panel = targetDocument.createElement('div');
        panel.className = 'mga-panel';
        panel.style.display = 'block'; // Show panel by default
        panel.style.top = '50px';
        panel.style.left = '50%';
        panel.style.transform = 'translateX(-50%)';
        panel.style.width = '380px'; // Initial width, user can resize

        // Header
        const header = targetDocument.createElement('div');
        header.className = 'mga-header';
        header.innerHTML = `
            <div class="mga-title">
                <span>🌱</span>
                MGTools
            </div>
            <div class="mga-controls">
                <button class="mga-btn mga-btn-icon" onclick="this.closest('.mga-panel').style.display='none'; if(window.MGA_Tooltips && window.MGA_Tooltips.hide) window.MGA_Tooltips.hide();">✕</button>
            </div>
        `;
        panel.appendChild(header);

        // Shop button (above tabs)
        const shopButton = targetDocument.createElement('button');
        shopButton.className = 'mga-btn mga-shop-btn';
        shopButton.innerHTML = '🛒 Quick Shop';
        shopButton.style.cssText = `
            width: calc(100% - 24px);
            margin: 8px 12px;
            padding: 8px;
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(56, 142, 60, 0.3));
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #fff;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        shopButton.addEventListener('mouseenter', () => {
            shopButton.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.5), rgba(56, 142, 60, 0.5))';
            shopButton.style.transform = 'translateY(-1px)';
        });
        shopButton.addEventListener('mouseleave', () => {
            shopButton.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(56, 142, 60, 0.3))';
            shopButton.style.transform = 'translateY(0)';
        });
        shopButton.addEventListener('click', () => toggleShopWindows());
        panel.appendChild(shopButton);

        // Tabs container with navigation
        const tabsContainer = targetDocument.createElement('div');
        tabsContainer.className = 'mga-tabs-container';

        // Navigation buttons
        const leftNav = targetDocument.createElement('button');
        leftNav.className = 'mga-tab-nav left';
        leftNav.innerHTML = '‹';
        leftNav.title = 'Scroll tabs left';

        const rightNav = targetDocument.createElement('button');
        rightNav.className = 'mga-tab-nav right';
        rightNav.innerHTML = '›';
        rightNav.title = 'Scroll tabs right';

        // Tabs
        const tabs = targetDocument.createElement('div');
        tabs.className = 'mga-tabs mga-scrollable horizontal';
        tabs.innerHTML = `
            <div class="mga-tab active" data-tab="pets" data-tooltip="Manage pet loadouts and analyze optimal combinations">
                <span data-icon="🐾">🐾 Pets</span>
                <span class="mga-tab-popout" data-popout="pets" data-tooltip="Open pets in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="abilities" data-tooltip="Track pet abilities and performance logs">
                <span data-icon="⚡">⚡ Abilities</span>
                <span class="mga-tab-popout" data-popout="abilities" data-tooltip="Open abilities in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="seeds" data-tooltip="Mass seed deletion and inventory management">
                <span data-icon="S">Seeds</span>
                <span class="mga-tab-popout" data-popout="seeds" data-tooltip="Open seeds in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="values" data-tooltip="Resource dashboard with analytics and tracking">
                <span data-icon="💰">💰 Values</span>
                <span class="mga-tab-popout" data-popout="values" data-tooltip="Open values in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="timers" data-tooltip="Event timers and restock countdowns">
                <span data-icon="⏰">⏰ Timers</span>
                <span class="mga-tab-popout" data-popout="timers" data-tooltip="Open timers in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="rooms" data-tooltip="Live room player counts and quick join">
                <span data-icon="🎮">🎮 Rooms</span>
                <span class="mga-tab-popout" data-popout="rooms" data-tooltip="Open rooms in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="hotkeys" data-tooltip="Customize keyboard shortcuts">
                <span data-icon="⌨️">⌨️ Hotkeys</span>
                <span class="mga-tab-popout" data-popout="hotkeys" data-tooltip="Open hotkeys in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="notifications" data-tooltip="Configure alerts and sounds">
                <span data-icon="🔔">🔔 Alerts</span>
                <span class="mga-tab-popout" data-popout="notifications" data-tooltip="Open notifications in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="tools" data-tooltip="Crop highlighting and utilities">
                <span data-icon="🔧">🔧 Tools</span>
                <span class="mga-tab-popout" data-popout="tools" data-tooltip="Open tools in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="settings" data-tooltip="Appearance and general settings">
                <span data-icon="⚙️">⚙️ Settings</span>
                <span class="mga-tab-popout" data-popout="settings" data-tooltip="Open settings in separate window">↗️</span>
            </div>
            <div class="mga-tab" data-tab="help" data-tooltip="Keyboard shortcuts and user guide">
                <span data-icon="❓">❓ Help</span>
                <span class="mga-tab-popout" data-popout="help" data-tooltip="Open help in separate window">↗️</span>
            </div>
        `;

        // Assemble the structure
        tabsContainer.appendChild(leftNav);
        tabsContainer.appendChild(tabs);
        tabsContainer.appendChild(rightNav);
        panel.appendChild(tabsContainer);

        // Content area
        const content = targetDocument.createElement('div');
        content.className = 'mga-content mga-scrollable';
        content.innerHTML = '<div id="mga-tab-content"></div>';
        panel.appendChild(content);

        // Add MutationObserver to handle React re-renders (pets flash issue fix)
        const tabContentEl = content.querySelector('#mga-tab-content');
        if (tabContentEl) {
            let debounceTimer = null;
            let isUpdating = false;

            const observer = new MutationObserver((mutations) => {
                // Prevent infinite loops - ignore mutations we're causing
                if (isUpdating) return;

                // Check if this is a relevant mutation for pets tab
                const isRelevantMutation = mutations.some(mutation => {
                    return mutation.type === 'childList' &&
                           UnifiedState.activeTab === 'pets' &&
                           !mutation.target.classList?.contains('mga-active-pets-display') && // Ignore our own updates
                           (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0);
                });

                if (isRelevantMutation) {
                    // Clear existing debounce timer
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }

                    // Debounce to prevent spam - only update after mutations stop for 100ms
                    debounceTimer = setTimeout(() => {
                        if (UnifiedState.data.settings?.debugMode) {
                            productionLog('🔄 [REACT-INTERFERENCE] Detected React re-render, updating pets display');
                        }

                        isUpdating = true;
                        updateActivePetsDisplay(tabContentEl);

                        // Reset flag after update completes
                        setTimeout(() => {
                            isUpdating = false;
                        }, 100);
                    }, 100);
                }
            });

            observer.observe(tabContentEl, {
                childList: true,
                subtree: true
            });

            // Store observer for cleanup
            UnifiedState.mutationObserver = observer;
        }

        // Resize functionality will be added by makeElementResizable

        targetDocument.body.appendChild(panel);
        UnifiedState.panels.main = panel;

        // Verify UI attachment for debugging
        const uiElements = targetDocument.querySelectorAll('.mga-panel');
        productionLog('🔧 [UI-VERIFICATION] UI elements attached:', uiElements.length);
        productionLog('🔧 [UI-VERIFICATION] Panel in DOM:', !!targetDocument.querySelector('.mga-panel'));
        productionLog('🔧 [UI-VERIFICATION] Toggle button in DOM:', !!targetDocument.querySelector('.mga-toggle-btn'));

        if (uiElements.length === 0) {
            console.error('❌ [UI-VERIFICATION] CRITICAL: No UI elements found in DOM after attachment!');
            console.error('❌ [UI-VERIFICATION] Target body exists:', !!targetDocument.body);
            console.error('❌ [UI-VERIFICATION] Panel element exists:', !!panel);
        } else {
            productionLog('✅ [UI-VERIFICATION] UI successfully attached to DOM');
        }

        // Setup tab switching
        tabs.querySelectorAll('.mga-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Don't switch tabs if clicking on pop-out button
                if (e.target.classList.contains('mga-tab-popout')) {
                    e.stopPropagation();
                    return;
                }

                tabs.querySelectorAll('.mga-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                UnifiedState.activeTab = tab.dataset.tab;
                updateTabContent();
            });
        });

        // Setup pop-out functionality with TOGGLE behavior
        tabs.querySelectorAll('.mga-tab-popout').forEach(popoutBtn => {
            popoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabName = popoutBtn.dataset.popout;
                toggleTabPopout(tabName, popoutBtn);
            });
        });

        // Setup tab navigation buttons
        leftNav.addEventListener('click', () => {
            tabs.scrollBy({ left: -100, behavior: 'smooth' });
        });

        rightNav.addEventListener('click', () => {
            tabs.scrollBy({ left: 100, behavior: 'smooth' });
        });

        // Setup responsive tab behavior with navigation
        function checkTabOverflow() {
            const isOverflowing = tabs.scrollWidth > tabs.clientWidth;

            // Show/hide navigation buttons based on overflow
            leftNav.classList.toggle('visible', isOverflowing);
            rightNav.classList.toggle('visible', isOverflowing);

            // Ensure active tab is visible when overflowing
            const activeTab = tabs.querySelector('.mga-tab.active');
            if (activeTab && isOverflowing) {
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }

        // Listen for custom resize events
        tabs.addEventListener('checkTabOverflow', checkTabOverflow);

        // Initial check and setup resize observer
        checkTabOverflow();

        // Use ResizeObserver if available, otherwise fallback to window resize
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(checkTabOverflow);
            resizeObserver.observe(tabs);
            resizeObserver.observe(panel);
        } else {
            window.addEventListener('resize', checkTabOverflow);
        }

        // Make draggable and resizable with position restoration
        makeDraggable(panel, header);
        makeElementResizable(panel, {
            minWidth: 250,
            minHeight: 250,
            maxWidth: window.innerWidth,
            maxHeight: window.innerHeight,
            showHandleOnHover: false
        });

        // Load saved main HUD position
        setTimeout(() => loadMainHUDPosition(panel), 100);

        // Initial content
        updateTabContent();

        // Apply saved theme and ensure consistency
        applyTheme();
        ensureThemeConsistency();

        // Setup modal spam prevention
        setupModalSpamPrevention();

        // Show panel by default (override any saved hidden state for demo)
        panel.style.display = 'block';
        UnifiedState.data.settings.panelVisible = true;
        productionLog(`🔄 Panel initialized as visible for demo mode`);

        // Initialize dynamic scaling
        applyDynamicScaling(panel, panel.offsetWidth);

        // Add responsive scaling observer with throttling
        if (window.ResizeObserver) {
            let observerTimeout;
            const scalingObserver = new ResizeObserver(entries => {
                // Throttle observer to reduce frequent calls
                clearTimeout(observerTimeout);
                observerTimeout = setTimeout(() => {
                    for (let entry of entries) {
                        const width = entry.contentRect.width;
                        applyDynamicScaling(panel, width);
                    }
                }, 100); // Only update every 100ms
            });
            scalingObserver.observe(panel);
        }

        productionLog('✅ Unified UI created successfully!');
    }

    // Pop-out window functionality
    function openTabInPopout(tabName) {
        productionLog(`🔗 Opening ${tabName} tab in pop-out window...`);

        const tabTitles = {
            pets: '🐾 Pet Loadouts',
            abilities: '⚡ Abilities',
            seeds: '🌱 Seeds',
            values: '💰 Values',
            timers: '⏰ Timers',
            rooms: '🎮 Rooms',
            settings: '⚙️ Settings'
        };

        const title = `MGTools - ${tabTitles[tabName] || tabName}`;

        // Calculate window size based on tab content
        const windowFeatures = 'width=450,height=550,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';

        const popoutWindow = window.open('', `mga_popout_${tabName}`, windowFeatures);

        if (!popoutWindow) {
            productionWarn('⚠️ Pop-out blocked! Please allow popups for this site.');
            return;
        }

        // Track the popout window for cleanup
        trackPopoutWindow(popoutWindow);

        // BUGFIX: Store window reference in Map for real-time updates
        UnifiedState.data.popouts.windows.set(tabName, popoutWindow);

        // Add cleanup listener to remove from Map when window closes
        popoutWindow.addEventListener('beforeunload', () => {
            UnifiedState.data.popouts.windows.delete(tabName);
            debugLog('POPOUT_LIFECYCLE', `Removed ${tabName} from windows Map`);
        });

        // Get tab content based on tab name
        let content = '';
        switch(tabName) {
            case 'pets':
                content = getPetsPopoutContent();
                break;
            case 'abilities':
                content = getAbilitiesTabContent();
                break;
            case 'seeds':
                content = getSeedsTabContent();
                break;
            case 'shop':
                content = getShopTabContent();
                break;
            case 'values':
                content = getValuesTabContent();
                break;
            case 'timers':
                content = getTimersTabContent();
                break;
            case 'tools':
                content = getToolsTabContent();
                break;
            case 'rooms':
                content = getRoomStatusTabContent();
                break;
            case 'settings':
                content = getSettingsTabContent();
                break;
            case 'help':
                content = getHelpTabContent();
                break;
            default:
                content = '<p>Tab content not available</p>';
        }

        // Get current theme for pop-out window
        const currentTheme = UnifiedState.currentTheme || generateThemeStyles();

        // Create pop-out window HTML with dynamic theming
        const popoutHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        ${UNIFIED_STYLES}
        body {
            margin: 0;
            padding: 16px;
            background: ${currentTheme.background};
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            --panel-scale: 1;
            --base-font-size: 13px;
            --responsive-font-size: calc(var(--base-font-size) * var(--panel-scale));
            font-size: var(--responsive-font-size);
        }

        /* Removed universal font scaling to prevent oversized popout UI */
        .popout-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex-wrap: wrap;
            gap: 10px;
        }
        .popout-title {
            font-size: 18px;
            font-weight: 600;
            color: #4a9eff;
            flex-shrink: 0;
            min-width: 150px;
        }
        .popout-sync-notice {
            font-size: 12px;
            color: #888;
            font-style: italic;
            flex: 1 1 auto;
            text-align: center;
            min-width: 200px;
        }
        .refresh-btn {
            padding: 6px 12px;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex-shrink: 0;
        }
        .refresh-btn:hover {
            background: #3a8eef;
        }
    </style>
</head>
<body>
    <div class="popout-header">
        <div class="popout-title">${title}</div>
        <div class="popout-sync-notice">Note: This is a static snapshot. Click refresh to update.</div>
        <button class="refresh-btn" onclick="refreshPopoutContent('\${tabName}')">🔄 Refresh</button>
    </div>
    <div id="popout-content" class="mga-scrollable mga-popout-content" style="max-height: calc(100vh - 120px); overflow-y: auto;">
        ${content}
    </div>

    <script>
        // Store reference to main window
        const mainWindow = window.opener;

        function refreshPopoutContent(tabName) {
            if (!mainWindow || mainWindow.closed) {
                productionWarn('⚠️ Main window is closed. Cannot refresh content.');
                return;
            }

            // Get fresh content from main window
            let freshContent = '';
            switch(tabName) {
                case 'pets':
                    freshContent = mainWindow.MGA_Internal?.getPetsPopoutContent ? mainWindow.MGA_Internal?.getPetsPopoutContent() : 'Content unavailable';
                    break;
                case 'abilities':
                    freshContent = mainWindow.MGA_Internal?.getAbilitiesTabContent ? mainWindow.MGA_Internal?.getAbilitiesTabContent() : 'Content unavailable';
                    break;
                case 'seeds':
                    freshContent = mainWindow.MGA_Internal?.getSeedsTabContent ? mainWindow.MGA_Internal?.getSeedsTabContent() : 'Content unavailable';
                    break;
                case 'shop':
                    freshContent = mainWindow.MGA_Internal?.getShopTabContent ? mainWindow.MGA_Internal?.getShopTabContent() : 'Content unavailable';
                    break;
                case 'values':
                    freshContent = mainWindow.MGA_Internal?.getValuesTabContent ? mainWindow.MGA_Internal?.getValuesTabContent() : 'Content unavailable';
                    break;
                case 'timers':
                    freshContent = mainWindow.MGA_Internal?.getTimersTabContent ? mainWindow.MGA_Internal?.getTimersTabContent() : 'Content unavailable';
                    break;
                case 'tools':
                    freshContent = mainWindow.MGA_Internal?.getToolsTabContent ? mainWindow.MGA_Internal?.getToolsTabContent() : 'Content unavailable';
                    break;
                case 'rooms':
                    freshContent = mainWindow.MGA_Internal?.getRoomStatusTabContent ? mainWindow.MGA_Internal?.getRoomStatusTabContent() : 'Content unavailable';
                    break;
                case 'settings':
                    freshContent = mainWindow.MGA_Internal?.getSettingsTabContent ? mainWindow.MGA_Internal?.getSettingsTabContent() : 'Content unavailable';
                    break;
            }

            document.getElementById('popout-content').innerHTML = freshContent;

            // Rerun handlers if needed
            if (tabName === 'abilities' && mainWindow.setupAbilitiesTabHandlers) {
                mainWindow.setupAbilitiesTabHandlers.call(mainWindow);
                if (mainWindow.updateAbilityLogDisplay) {
                    mainWindow.updateAbilityLogDisplay.call(mainWindow);
                }
            } else if (tabName === 'pets') {
                // For pets popout, use special popout handlers instead of main tab handlers
                if (mainWindow.setupPetPopoutHandlers) {
                    mainWindow.setupPetPopoutHandlers.call(mainWindow, document);
                }
            } else if (tabName === 'seeds' && mainWindow.setupSeedsTabHandlers) {
                mainWindow.setupSeedsTabHandlers.call(mainWindow, document);
            } else if (tabName === 'values' && mainWindow.resourceDashboard) {
                mainWindow.resourceDashboard.setupDashboardHandlers(document);
            } else if (tabName === 'settings' && mainWindow.setupSettingsTabHandlers) {
                mainWindow.setupSettingsTabHandlers.call(mainWindow, document);
            } else if (tabName === 'rooms' && mainWindow.setupRoomJoinButtons) {
                mainWindow.setupRoomJoinButtons.call(mainWindow);
            }

            productionLog('Pop-out content refreshed for:', tabName);
        }

        // BUGFIX: Expose refresh function on window object for external access
        window.refreshPopoutContent = refreshPopoutContent;

        // Store the tab name for this popup window
        const currentTabName = '\${tabName}';

        // Auto-refresh every 5 seconds for dynamic tabs
        // BUGFIX: Added 'abilities' to auto-refresh list for real-time ability log updates
        if (['values', 'timers', 'rooms', 'abilities'].includes(currentTabName)) {
            // Use managed interval to prevent memory leaks
            if (window.opener && window.opener.setManagedInterval) {
                window.opener.setManagedInterval(
                    'popoutRefresh_' + currentTabName + '_' + Date.now(),
                    () => refreshPopoutContent(currentTabName),
                    5000
                );
            }
        }

        // Cleanup when window closes
        window.addEventListener('beforeunload', () => {
            productionLog('Pop-out window closing for:', currentTabName);
        });
    </script>
</body>
</html>
        `;

        productionLog('🌱 [WINDOW DEBUG] Content being written to separate window:', {
            tabName,
            contentLength: content.length,
            htmlLength: popoutHTML.length,
            contentPreview: content.substring(0, 200)
        });

        popoutWindow.document.open();
        popoutWindow.document.write(popoutHTML);
        popoutWindow.document.close();

        // Set up handlers for the pop-out content
        setTimeout(() => {
            try {
                switch(tabName) {
                    case 'abilities':
                        // Note: Handlers won't work perfectly in pop-out due to cross-window limitations
                        // Users should use refresh button for interactions
                        break;
                    case 'pets':
                        setupPetPopoutHandlers(popoutWindow.document);
                        break;
                    case 'seeds':
                        setupSeedsTabHandlers(popoutWindow.document);
                        break;
                    case 'shop':
                        setupShopTabHandlers(popoutWindow.document);
                        break;
                    case 'settings':
                        setupSettingsTabHandlers(popoutWindow.document);
                        break;
                    case 'tools':
                        setupToolsTabHandlers(popoutWindow.document);
                        break;
                    case 'rooms':
                        setupRoomJoinButtons();
                        break;
                    case 'hotkeys':
                        setupHotkeysTabHandlers(popoutWindow.document);
                        break;
                    case 'notifications':
                        setupNotificationsTabHandlers(popoutWindow.document);
                        break;
                    case 'help':
                        // Help tab doesn't need special handlers
                        break;
                }
            } catch (error) {
                productionWarn('Could not set up pop-out handlers:', error);
            }
        }, 100);

        productionLog(`✅ Pop-out window opened for ${tabName} tab`);
    }

    // Expose content functions in MGA namespace for pop-out windows (prevents conflicts)
    window.MGA_Internal = window.MGA_Internal || {};
    window.MGA_Internal.getPetsTabContent = getPetsTabContent;
    window.MGA_Internal.getPetsPopoutContent = getPetsPopoutContent;
    window.MGA_Internal.setupPetPopoutHandlers = setupPetPopoutHandlers;
    window.MGA_Internal.getAbilitiesTabContent = getAbilitiesTabContent;
    window.MGA_Internal.getSeedsTabContent = getSeedsTabContent;
    window.MGA_Internal.getValuesTabContent = getValuesTabContent;
    window.MGA_Internal.getTimersTabContent = getTimersTabContent;
    window.MGA_Internal.getToolsTabContent = getToolsTabContent;
    window.MGA_Internal.getRoomStatusTabContent = getRoomStatusTabContent;
    window.MGA_Internal.getSettingsTabContent = getSettingsTabContent;
    window.MGA_Internal.setupAbilitiesTabHandlers = setupAbilitiesTabHandlers;
    window.MGA_Internal.updateAbilityLogDisplay = updateAbilityLogDisplay;
    window.MGA_Internal.setupPetsTabHandlers = setupPetsTabHandlers;
    window.MGA_Internal.setupSeedsTabHandlers = setupSeedsTabHandlers;
    window.MGA_Internal.setupSettingsTabHandlers = setupSettingsTabHandlers;
    window.MGA_Internal.setupToolsTabHandlers = setupToolsTabHandlers;
    window.MGA_Internal.setupRoomJoinButtons = setupRoomJoinButtons;

    // Export storage functions
    window.MGA_Internal.MGA_loadJSON = MGA_loadJSON;
    window.MGA_Internal.MGA_saveJSON = MGA_saveJSON;

    // ==================== IN-GAME OVERLAY SYSTEM ====================

    function getContentForTab(tabName, isPopout = false) {
        switch(tabName) {
            case 'pets':
                return isPopout ? getPetsPopoutContent() : getPetsTabContent();
            case 'abilities':
                return getAbilitiesTabContent();
            case 'seeds':
                return getSeedsTabContent();
            case 'shop':
                return getShopTabContent();
            case 'values':
                return getValuesTabContent();
            case 'timers':
                return getTimersTabContent();
            case 'rooms':
                return getRoomStatusTabContent();
            case 'tools':
                return getToolsTabContent();
            case 'settings':
                return getSettingsTabContent();
            case 'hotkeys':
                return getHotkeysTabContent();
            case 'notifications':
                return getNotificationsTabContent();
            default:
                return '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">Content not available</div>';
        }
    }

    function setupOverlayHandlers(overlay, tabName) {
        try {
            debugLog('HANDLER_SETUP', `Setting up handlers for content-only overlay ${tabName}`, {
                overlayId: overlay.id
            });

            switch(tabName) {
                case 'abilities':
                    setupAbilitiesTabHandlers(overlay);
                    if (overlay) {
                        updateAbilityLogDisplay(overlay);
                        debugLog('ABILITY_LOGS', 'Populated ability logs for content-only overlay', {
                            logCount: UnifiedState.data.petAbilityLogs.length
                        });
                    }
                    break;
                case 'pets':
                    setupPetPopoutHandlers(overlay);  // Use popout handlers for overlays
                    break;
                case 'seeds':
                    setupSeedsTabHandlers(overlay);
                    break;
                case 'shop':
                    setupShopTabHandlers(overlay);
                    break;
                case 'settings':
                    setupSettingsTabHandlers();
                    break;
                case 'tools':
                    setupToolsTabHandlers(overlay);
                    break;
                case 'rooms':
                    setupRoomJoinButtons();
                    break;
                case 'hotkeys':
                    setupHotkeysTabHandlers(overlay);
                    break;
                case 'notifications':
                    setupNotificationsTabHandlers(overlay);
                    break;
            }
        } catch (error) {
            debugError('HANDLER_SETUP', 'Failed to set up content-only overlay handlers', error, {
                tabName,
                overlayId: overlay?.id
            });
        }
    }

    function createInGameOverlay(tabName) {
        debugLog('OVERLAY_LIFECYCLE', `Creating content-only overlay for ${tabName} tab`);

        // Check if overlay already exists
        if (UnifiedState.data.popouts.overlays.has(tabName)) {
            const existingOverlay = UnifiedState.data.popouts.overlays.get(tabName);
            if (existingOverlay && document.contains(existingOverlay)) {
                existingOverlay.style.display = 'block';
                existingOverlay.style.zIndex = '999999';
                debugLog('OVERLAY_LIFECYCLE', `Reused existing overlay for ${tabName}`);
                return existingOverlay;
            }
        }

        // Create content-only overlay container - NO HEADER, NO DECORATIONS
        const overlay = targetDocument.createElement('div');
        overlay.className = 'mga-overlay-content-only mga-scrollable';
        overlay.id = `mga-overlay-${tabName}`;

        // SMART POSITIONING - Avoid overlapping with existing overlays
        const gameViewport = getGameViewport();
        const smartPosition = findOptimalPosition(tabName, gameViewport);

        // PURE CONTENT DESIGN with PROPER RESIZING - Perfect match to target image (NO CHROME)
        overlay.style.cssText = `
            position: fixed;
            top: ${smartPosition.top}px;
            left: ${smartPosition.left}px;
            width: 240px;
            height: auto;
            min-height: 120px;
            max-height: 500px;
            padding: 10px 12px;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            z-index: 999998;
            overflow-y: auto;
            min-width: 180px;
            max-width: 450px;
            user-select: none;
            border-radius: 4px;
            backdrop-filter: blur(10px);
            cursor: grab;
            will-change: width, height, transform;
        `;

        // Apply theme - clean background with NO borders or shadows
        const popoutTheme = generateThemeStyles(UnifiedState.data.settings, true);
        overlay.style.background = popoutTheme.background;

        // Invisible scrollbars are now handled by the mga-scrollable class

        debugLog('POP_OUT_DESIGN', `Applied content-only theme for ${tabName}`, {
            background: popoutTheme.background,
            dimensions: `${overlay.style.width} x ${overlay.style.height}`
        });

        // NO HEADER - Content only design matching target image
        // Add simple close functionality via right-click context menu or ESC key

        // Add keyboard shortcut for closing (ESC key)
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                debugLog('POP_OUT_DESIGN', `Closing overlay ${tabName} via ESC key`);
                closeInGameOverlay(tabName);
            }
        });

        // Make overlay focusable for keyboard events
        overlay.tabIndex = -1;
        overlay.focus();

        // INVISIBLE DRAGGING - No chrome, entire overlay is draggable
        // Add subtle visual feedback on hover (skip for pets popouts to prevent stutter)
        overlay.addEventListener('mouseenter', () => {
            if (!overlay.hasAttribute('data-dragging') && !overlay.id.includes('mga-pets-popout') && !overlay.id.includes('pets')) {
                overlay.style.transform = 'scale(1.005)';
                overlay.style.transition = 'transform 0.15s ease';
            }
        });

        overlay.addEventListener('mouseleave', () => {
            if (!overlay.hasAttribute('data-dragging') && !overlay.id.includes('mga-pets-popout') && !overlay.id.includes('pets')) {
                overlay.style.transform = 'scale(1)';
            }
        });

        // Add content directly to overlay (no separate contentArea needed)
        // Add scrollbar styling for content-only design
        const contentHtml = `
            <style>
                /* TARGET IMAGE MATCH - Clean, readable styling */
                /* Section titles are now handled in the main visibility rules above */

                .mga-overlay-content-only .mga-section {
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .mga-overlay-content-only .mga-value-row {
                    display: flex !important;
                    justify-content: space-between !important;
                    margin: 3px 0 !important;
                    padding: 2px 0 !important;
                    line-height: 1.3 !important;
                }

                .mga-overlay-content-only .mga-value-label {
                    font-size: 12px !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    font-weight: 400 !important;
                    margin: 0 !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }

                .mga-overlay-content-only .mga-value-amount {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: #ffffff !important;
                    margin: 0 !important;
                    text-align: right;
                    min-width: 50px;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
                }

                /* HIGH CONTRAST TOTAL VALUE */
                .mga-overlay-content-only .mga-total-value {
                    border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
                    margin-top: 6px !important;
                    padding-top: 4px !important;
                }

                .mga-overlay-content-only .mga-total-value .mga-value-label {
                    font-weight: 500 !important;
                    color: rgba(255, 255, 255, 0.95) !important;
                    font-size: 13px !important;
                }

                .mga-overlay-content-only .mga-total-value .mga-value-amount {
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    color: #ffff00 !important;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                }

                /* Hide only truly unnecessary elements - KEEP buttons and checkboxes for functionality */
                .mga-overlay-content-only .mga-section-header,
                .mga-overlay-content-only .mga-input-group,
                .mga-overlay-content-only .mga-timer-controls {
                    display: none !important;
                }

                /* Keep section titles visible but make them smaller */
                .mga-overlay-content-only .mga-section-title {
                    display: block !important;
                    font-size: 11px !important;
                    margin-bottom: 4px !important;
                }

                /* Readable ability logs */
                .mga-overlay-content-only .mga-log-item {
                    margin: 2px 0 !important;
                    padding: 2px 0 !important;
                    font-size: 11px !important;
                    line-height: 1.3 !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }

                .mga-overlay-content-only .mga-log-time {
                    font-size: 10px !important;
                    color: rgba(255, 255, 255, 0.7) !important;
                }

                /* Readable pet loadouts */
                .mga-overlay-content-only .mga-pet-slot {
                    margin: 2px 0 !important;
                    padding: 3px !important;
                    font-size: 11px !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }
            </style>
        `;

        // Get and add content directly to overlay - PURE CONTENT ONLY
        const contentHTML = getContentForTab(tabName, true); // isPopout=true for overlays

        productionLog('🔍 [CONTENT DEBUG] Variables check:', {
            contentHtmlType: typeof contentHtml,
            contentHtmlLength: contentHtml?.length,
            contentHTMLType: typeof contentHTML,
            contentHTMLLength: contentHTML?.length,
            contentHtmlPreview: contentHtml?.substring(0, 100),
            contentHTMLPreview: contentHTML?.substring(0, 100)
        });

        // For ability logs, add a subtle drag indicator
        if (tabName === 'abilities') {
            const dragIndicator = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 11px; color: #4a9eff; font-weight: 600;">ABILITY LOGS</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.4); cursor: grab;" title="Click and drag to move">⣿⣿ drag</div>
                </div>
            `;
            overlay.innerHTML = contentHtml + dragIndicator + contentHTML;
        } else {
            overlay.innerHTML = contentHtml + contentHTML;
        }

        productionLog('🌱 [OVERLAY DEBUG] Content inserted:', {
            tabName,
            contentLength: contentHTML.length,
            overlayHTML: overlay.innerHTML.substring(0, 200)
        });

        // Apply invisible dragging to entire overlay surface
        makeEntireOverlayDraggable(overlay);

        // Add professional resize functionality
        addResizeHandleToOverlay(overlay);

        // Function now available globally - moved to global scope

        // Load saved position and dimensions
        loadOverlayPosition(overlay);
        loadOverlayDimensions(overlay);

        debugLog('POP_OUT_DESIGN', `Content added to overlay for ${tabName}`, {
            hasContent: !!contentHTML
        });

        // Add to DOM and track
        targetDocument.body.appendChild(overlay);
        UnifiedState.data.popouts.overlays.set(tabName, overlay);

        // Setup handlers for the content (now that overlay is in DOM)
        setTimeout(() => {
            setupOverlayHandlers(overlay, tabName);
        }, 100);

        debugLog('OVERLAY_LIFECYCLE', `Content-only overlay created for ${tabName}`, {
            dimensions: `${overlay.style.width} x ${overlay.style.height}`,
            overlayId: overlay.id
        });

        return overlay;
    }

    function updateOverlayContent(contentArea, tabName) {
        let content = '';
        switch(tabName) {
            case 'pets':
                content = getPetsPopoutContent();
                break;
            case 'abilities':
                content = getAbilitiesTabContent();
                break;
            case 'seeds':
                content = getSeedsTabContent();
                break;
            case 'shop':
                content = getShopTabContent();
                break;
            case 'values':
                content = getValuesTabContent();
                break;
            case 'timers':
                content = getTimersTabContent();
                break;
            case 'tools':
                content = getToolsTabContent();
                break;
            case 'rooms':
                content = getRoomStatusTabContent();
                break;
            case 'settings':
                content = getSettingsTabContent();
                break;
            case 'help':
                content = getHelpTabContent();
                break;
            default:
                content = '<p>Tab content not available</p>';
        }

        // Clear existing content except styles
        const styles = contentArea.querySelector('style');
        contentArea.innerHTML = '';
        if (styles) contentArea.appendChild(styles);

        const contentDiv = targetDocument.createElement('div');
        contentDiv.innerHTML = content;
        contentArea.appendChild(contentDiv);

        // Setup handlers if needed
        setTimeout(() => {
            try {
                // Find the parent overlay element
                const parentOverlay = contentArea.closest('.mga-overlay') || contentArea.parentElement;
                debugLog('HANDLER_SETUP', `Setting up handlers for ${tabName}`, {
                    overlayFound: !!parentOverlay,
                    overlayClass: parentOverlay?.className,
                    contentAreaClass: contentArea?.className
                });

                switch(tabName) {
                    case 'abilities':
                        setupAbilitiesTabHandlers(parentOverlay);
                        // Ensure ability logs are populated immediately
                        if (parentOverlay) {
                            updateAbilityLogDisplay(parentOverlay);
                            debugLog('ABILITY_LOGS', 'Populated ability logs for new overlay', {
                                logCount: UnifiedState.data.petAbilityLogs.length,
                                overlayId: parentOverlay?.id || 'no-id'
                            });

                            // Additional delayed refresh to ensure logs appear
                            setTimeout(() => {
                                updateAbilityLogDisplay(parentOverlay);
                                debugLog('ABILITY_LOGS', 'Secondary refresh for ability logs completed');
                            }, 500);
                        } else {
                            debugError('HANDLER_SETUP', 'Could not find parent overlay for ability logs setup',
                                new Error('Parent overlay not found'), { tabName, contentArea });
                        }
                        break;
                    case 'pets':
                        setupPetPopoutHandlers(overlay);  // Use popout handlers for overlays
                        break;
                    case 'seeds':
                        setupSeedsTabHandlers(overlay);
                        break;
                    case 'shop':
                        setupShopTabHandlers(overlay);
                        break;
                    case 'settings':
                        setupSettingsTabHandlers();
                        break;
                }
            } catch (error) {
                debugError('HANDLER_SETUP', 'Failed to set up overlay handlers', error, {
                    tabName,
                    contentArea: contentArea?.className,
                    hasContent: !!contentArea
                });
            }
        }, 100);
    }

    // INVISIBLE DRAGGING SYSTEM - Entire overlay surface is draggable
    function makeEntireOverlayDraggable(overlay) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let animationFrame = null;
        let dragStartTime = 0;

        debugLog('OVERLAY_LIFECYCLE', 'Setting up invisible dragging for entire overlay', {
            overlayId: overlay.id
        });

        overlay.addEventListener('mousedown', (e) => {
            // Don't start drag if clicking on interactive elements or resize handle
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' ||
                e.target.tagName === 'SELECT' || e.target.closest('.mga-btn') ||
                e.target.classList.contains('mga-resize-handle')) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            dragStartTime = Date.now();
            isDragging = false; // Start as false, will become true after movement threshold

            const rect = overlay.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (dragStartTime === 0) return;

            const timeDiff = Date.now() - dragStartTime;
            const mouseMoved = Math.abs(e.clientX - dragOffset.x) > 3 || Math.abs(e.clientY - dragOffset.y) > 3;

            // Start dragging after small movement threshold to prevent accidental drags
            if (!isDragging && mouseMoved && timeDiff > 50) {
                isDragging = true;
                overlay.setAttribute('data-dragging', 'true');

                // Professional drag start effects
                overlay.style.zIndex = '999999';
                overlay.style.transform = 'scale(1.02)';
                overlay.style.filter = 'brightness(1.1)';
                overlay.style.transition = 'transform 0.1s ease, filter 0.1s ease';
                overlay.classList.add('mga-dragging');
                targetDocument.body.style.userSelect = 'none';
                targetDocument.body.style.cursor = 'grabbing !important';

                debugLog('OVERLAY_LIFECYCLE', 'Started invisible dragging', { overlayId: overlay.id });
            }

            if (!isDragging) return;

            // Use RAF for smooth dragging performance
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            animationFrame = requestAnimationFrame(() => {
                const rect = overlay.getBoundingClientRect();
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                // Enhanced viewport constraints
                const gameViewport = getGameViewport();

                let constrainedX = Math.max(gameViewport.left,
                    Math.min(newX, gameViewport.right - rect.width));
                let constrainedY = Math.max(gameViewport.top,
                    Math.min(newY, gameViewport.bottom - rect.height));

                overlay.style.left = constrainedX + 'px';
                overlay.style.top = constrainedY + 'px';
            });
        });

        document.addEventListener('mouseup', () => {
            if (dragStartTime > 0) {
                dragStartTime = 0;

                if (isDragging) {
                    isDragging = false;
                    overlay.removeAttribute('data-dragging');
                    overlay.classList.remove('mga-dragging');

                    // Professional drag end effects
                    overlay.style.transform = 'scale(1)';
                    overlay.style.filter = 'brightness(1)';
                    overlay.style.zIndex = '999998';
                    overlay.style.transition = 'transform 0.2s ease, filter 0.2s ease';

                    targetDocument.body.style.userSelect = '';
                    targetDocument.body.style.cursor = '';

                    if (animationFrame) {
                        cancelAnimationFrame(animationFrame);
                        animationFrame = null;
                    }

                    // Save position to localStorage
                    saveOverlayPosition(overlay.id, {
                        left: overlay.style.left,
                        top: overlay.style.top
                    });

                    debugLog('OVERLAY_LIFECYCLE', 'Finished invisible dragging', {
                        overlayId: overlay.id,
                        position: { left: overlay.style.left, top: overlay.style.top }
                    });
                }
            }
        });
    }

    // Legacy draggable function for windowed overlays (to be replaced)
    function makeOverlayDraggable(overlay, header) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons

            isDragging = true;
            const rect = overlay.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            overlay.style.zIndex = '999999'; // Bring to front while dragging
            targetDocument.body.style.userSelect = 'none';
            // Ensure proper cursor during drag - use grabbing instead of move
            targetDocument.body.style.cursor = 'grabbing !important';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Constrain to game viewport
            const gameViewport = getGameViewport();
            const overlayRect = overlay.getBoundingClientRect();

            const constrainedX = Math.max(gameViewport.left,
                Math.min(newX, gameViewport.right - overlayRect.width));
            const constrainedY = Math.max(gameViewport.top,
                Math.min(newY, gameViewport.bottom - overlayRect.height));

            overlay.style.left = constrainedX + 'px';
            overlay.style.top = constrainedY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                targetDocument.body.style.userSelect = '';
                targetDocument.body.style.cursor = ''; // Reset cursor
                overlay.style.zIndex = '999998'; // Return to normal z-index
            }
        });
    }

    function constrainOverlayToViewport(overlay) {
        const observer = new ResizeObserver(() => {
            const gameViewport = getGameViewport();
            const rect = overlay.getBoundingClientRect();

            if (rect.right > gameViewport.right) {
                overlay.style.left = (gameViewport.right - rect.width) + 'px';
            }
            if (rect.bottom > gameViewport.bottom) {
                overlay.style.top = (gameViewport.bottom - rect.height) + 'px';
            }
            if (rect.left < gameViewport.left) {
                overlay.style.left = gameViewport.left + 'px';
            }
            if (rect.top < gameViewport.top) {
                overlay.style.top = gameViewport.top + 'px';
            }
        });

        observer.observe(overlay);

        // Also listen for window resize
        window.addEventListener('resize', () => {
            const gameViewport = getGameViewport();
            const rect = overlay.getBoundingClientRect();

            if (rect.right > gameViewport.right) {
                overlay.style.left = (gameViewport.right - rect.width) + 'px';
            }
            if (rect.bottom > gameViewport.bottom) {
                overlay.style.top = (gameViewport.bottom - rect.height) + 'px';
            }
        });
    }

    function getGameViewport() {
        // Try to find the game container or use window as fallback
        const gameContainer = document.querySelector('#game-container, #app, .game-wrapper, main') || targetDocument.body;
        const rect = gameContainer.getBoundingClientRect();

        return {
            top: Math.max(0, rect.top),
            left: Math.max(0, rect.left),
            right: Math.min(window.innerWidth, rect.right),
            bottom: Math.min(window.innerHeight, rect.bottom)
        };
    }

    // PROFESSIONAL RESIZE SYSTEM FOR POP-OUTS
    function addResizeHandleToOverlay(overlay) {
        productionLog('🔧 [RESIZE DEBUG] Adding resize handle to overlay:', overlay.id);
        debugLog('RESIZE', 'Adding resize handle to overlay', { overlayId: overlay.id });

        // Remove any existing resize handles first to prevent duplicates
        const existingHandle = overlay.querySelector('.mga-resize-handle');
        if (existingHandle) {
            existingHandle.remove();
            productionLog('🔧 [RESIZE DEBUG] Removed existing handle before adding new one');
        }

        // Use the unified resize system with overlay-specific options
        makeElementResizable(overlay, {
            minWidth: 180,
            minHeight: 120,
            maxWidth: 450,
            maxHeight: 500,
            showHandleOnHover: true
        });

        // Add save dimensions functionality
        const observer = new MutationObserver(() => {
            if (overlay.style.width && overlay.style.height) {
                saveOverlayDimensions(overlay.id, {
                    width: overlay.style.width,
                    height: overlay.style.height
                });
            }
        });

        observer.observe(overlay, {
            attributes: true,
            attributeFilter: ['style']
        });

        // Store observer for cleanup later if needed
        overlay._resizeObserver = observer;
    }

    function saveOverlayDimensions(overlayId, dimensions) {
        try {
            const savedDimensions = MGA_loadJSON('MGA_overlayDimensions', {});
            savedDimensions[overlayId] = dimensions;
            MGA_saveJSON('MGA_overlayDimensions', savedDimensions);

            debugLog('OVERLAY_LIFECYCLE', 'Saved overlay dimensions', {
                overlayId,
                dimensions
            });
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to save overlay dimensions', error, {
                overlayId,
                dimensions
            });
        }
    }


    function loadOverlayDimensions(overlay) {
        try {
            const savedDimensions = MGA_loadJSON('MGA_overlayDimensions', {});
            const dimensions = savedDimensions[overlay.id];

            if (dimensions && dimensions.width && dimensions.height) {
                const width = parseInt(dimensions.width);
                const height = parseInt(dimensions.height);

                if (!isNaN(width) && !isNaN(height)) {
                    overlay.style.width = dimensions.width;
                    overlay.style.height = dimensions.height;

                    // Apply responsive scaling for the loaded dimensions
                    applyResponsiveTextScaling(overlay, width, height);

                    debugLog('OVERLAY_LIFECYCLE', 'Restored overlay dimensions', {
                        overlayId: overlay.id,
                        dimensions
                    });
                }
            }
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to load overlay dimensions', error, {
                overlayId: overlay.id
            });
        }
    }

    // SMART POSITIONING SYSTEM - Professional collision avoidance
    function findOptimalPosition(tabName, gameViewport) {
        const overlayWidth = 240;
        const overlayHeight = 140;
        const margin = 15;
        const mainHudBuffer = 20; // Buffer around main HUD
        const snapGrid = 10; // Snap to 10px increments

        // Check if we have a saved position first
        const savedPositions = MGA_loadJSON('MGA_overlayPositions', {});
        const savedPosition = savedPositions[`mga-overlay-${tabName}`];

        if (savedPosition) {
            const leftPx = parseInt(savedPosition.left);
            const topPx = parseInt(savedPosition.top);

            if (!isNaN(leftPx) && !isNaN(topPx) &&
                leftPx >= gameViewport.left && topPx >= gameViewport.top &&
                leftPx + overlayWidth <= gameViewport.right &&
                topPx + overlayHeight <= gameViewport.bottom) {

                // Check for collisions with existing overlays and main HUD
                if (!hasCollisionAtPosition(leftPx, topPx, overlayWidth, overlayHeight)) {
                    debugLog('OVERLAY_LIFECYCLE', 'Using saved position with no collisions', {
                        tabName,
                        position: { left: leftPx, top: topPx }
                    });
                    return { left: leftPx, top: topPx };
                }
            }
        }

        // Define priority zones (in order of preference)
        const priorityZones = [
            // Zone 1: Right side of game viewport
            {
                name: 'rightSide',
                x: gameViewport.right - overlayWidth - margin,
                y: gameViewport.top + margin,
                maxX: gameViewport.right - margin,
                maxY: gameViewport.bottom - overlayHeight - margin,
                stepX: 0,
                stepY: overlayHeight + margin
            },
            // Zone 2: Left side if right is full
            {
                name: 'leftSide',
                x: gameViewport.left + margin,
                y: gameViewport.top + margin,
                maxX: gameViewport.left + overlayWidth + margin,
                maxY: gameViewport.bottom - overlayHeight - margin,
                stepX: 0,
                stepY: overlayHeight + margin
            },
            // Zone 3: Top area (cascade down)
            {
                name: 'topArea',
                x: gameViewport.left + margin + overlayWidth + margin,
                y: gameViewport.top + margin,
                maxX: gameViewport.right - overlayWidth - margin,
                maxY: gameViewport.top + overlayHeight * 3,
                stepX: overlayWidth + margin,
                stepY: 30
            },
            // Zone 4: Bottom area (cascade up)
            {
                name: 'bottomArea',
                x: gameViewport.left + margin,
                y: gameViewport.bottom - overlayHeight * 3,
                maxX: gameViewport.right - overlayWidth - margin,
                maxY: gameViewport.bottom - overlayHeight - margin,
                stepX: overlayWidth + margin,
                stepY: overlayHeight + margin
            }
        ];

        // Try each priority zone
        for (const zone of priorityZones) {
            const position = findPositionInZone(zone, overlayWidth, overlayHeight, snapGrid, mainHudBuffer);
            if (position) {
                debugLog('OVERLAY_LIFECYCLE', `Found optimal position in ${zone.name}`, {
                    tabName,
                    position,
                    zone: zone.name
                });
                return position;
            }
        }

        // Ultimate fallback with collision avoidance
        let fallbackX = gameViewport.left + margin;
        let fallbackY = gameViewport.top + margin;
        let attempts = 0;

        while (attempts < 20) {
            if (!hasCollisionAtPosition(fallbackX, fallbackY, overlayWidth, overlayHeight) &&
                !overlapsMainHUD(fallbackX, fallbackY, overlayWidth, overlayHeight)) {
                break;
            }
            fallbackX += 30;
            fallbackY += 30;

            // Wrap around if we go out of bounds
            if (fallbackX + overlayWidth > gameViewport.right) {
                fallbackX = gameViewport.left + margin;
                fallbackY += overlayHeight + margin;
            }
            if (fallbackY + overlayHeight > gameViewport.bottom) {
                fallbackY = gameViewport.top + margin;
            }
            attempts++;
        }

        debugLog('OVERLAY_LIFECYCLE', 'Using fallback positioning', {
            tabName,
            attempts,
            position: { left: fallbackX, top: fallbackY }
        });
        return {
            left: fallbackX,
            top: fallbackY
        };
    }

    function findPositionInZone(zone, overlayWidth, overlayHeight, snapGrid, mainHudBuffer) {
        let x = zone.x;
        let y = zone.y;

        while (y <= zone.maxY) {
            while (x <= zone.maxX) {
                // Snap to grid
                const snappedX = Math.round(x / snapGrid) * snapGrid;
                const snappedY = Math.round(y / snapGrid) * snapGrid;

                // Check bounds
                if (snappedX + overlayWidth <= zone.maxX &&
                    snappedY + overlayHeight <= zone.maxY) {

                    // Check collisions with existing overlays and main HUD
                    if (!hasCollisionAtPosition(snappedX, snappedY, overlayWidth, overlayHeight) &&
                        !overlapsMainHUD(snappedX, snappedY, overlayWidth, overlayHeight)) {
                        return { left: snappedX, top: snappedY };
                    }
                }

                x += zone.stepX || (overlayWidth + 15);
                if (zone.stepX === 0) break; // Single column zone
            }
            x = zone.x;
            y += zone.stepY || 30;
        }

        return null;
    }

    function overlapsMainHUD(x, y, width, height) {
        const mainHUD = targetDocument.querySelector('.mga-panel');
        if (!mainHUD) return false;

        const mainHudRect = mainHUD.getBoundingClientRect();
        const buffer = 20; // 20px buffer around main HUD

        // Expand main HUD rect by buffer
        const expandedRect = {
            left: mainHudRect.left - buffer,
            top: mainHudRect.top - buffer,
            right: mainHudRect.right + buffer,
            bottom: mainHudRect.bottom + buffer
        };

        // Check for overlap
        return !(x + width < expandedRect.left ||
                x > expandedRect.right ||
                y + height < expandedRect.top ||
                y > expandedRect.bottom);
    }

    function hasCollisionAtPosition(x, y, width, height) {
        const existingOverlays = Array.from(targetDocument.querySelectorAll('.mga-overlay-content-only'));
        const buffer = 5; // Minimum spacing between overlays

        for (const existingOverlay of existingOverlays) {
            const rect = existingOverlay.getBoundingClientRect();

            // Check for overlap with buffer
            if (!(x + width + buffer < rect.left ||
                  x - buffer > rect.right ||
                  y + height + buffer < rect.top ||
                  y - buffer > rect.bottom)) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }

    // OVERLAY POSITION PERSISTENCE SYSTEM
    function saveOverlayPosition(overlayId, position) {
        try {
            const savedPositions = MGA_loadJSON('MGA_overlayPositions', {});
            savedPositions[overlayId] = position;
            MGA_saveJSON('MGA_overlayPositions', savedPositions);

            debugLog('OVERLAY_LIFECYCLE', 'Saved overlay position', {
                overlayId,
                position
            });
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to save overlay position', error, {
                overlayId,
                position
            });
        }
    }

    function loadOverlayPosition(overlay) {
        try {
            const savedPositions = MGA_loadJSON('MGA_overlayPositions', {});
            const position = savedPositions[overlay.id];

            if (position) {
                // Validate position is still within viewport
                const gameViewport = getGameViewport();
                const leftPx = parseInt(position.left);
                const topPx = parseInt(position.top);

                if (!isNaN(leftPx) && !isNaN(topPx) &&
                    leftPx >= gameViewport.left && topPx >= gameViewport.top &&
                    leftPx < gameViewport.right && topPx < gameViewport.bottom) {

                    overlay.style.left = position.left;
                    overlay.style.top = position.top;

                    debugLog('OVERLAY_LIFECYCLE', 'Restored overlay position', {
                        overlayId: overlay.id,
                        position
                    });
                } else {
                    debugLog('OVERLAY_LIFECYCLE', 'Saved position out of bounds, using default', {
                        overlayId: overlay.id,
                        savedPosition: position,
                        viewport: gameViewport
                    });
                }
            }
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to load overlay position', error, {
                overlayId: overlay.id
            });
        }
    }

    // PROFESSIONAL MINIMIZE/MAXIMIZE FUNCTIONALITY
    function toggleOverlayMinimized(overlay, tabName) {
        const isMinimized = overlay.hasAttribute('data-minimized');
        const contentContainer = overlay.querySelector('.mga-content-container');

        if (isMinimized) {
            // EXPAND - Restore to normal state
            overlay.removeAttribute('data-minimized');
            overlay.style.height = 'auto';
            overlay.style.minHeight = '80px';
            overlay.style.maxHeight = '180px';
            overlay.style.overflow = 'visible'; // Allow resize handles to show

            if (contentContainer) {
                contentContainer.style.display = 'block';
                contentContainer.style.opacity = '1';
            }

            // Update minimize button
            const minimizeBtn = overlay.querySelector('.mga-drag-zone div:last-child');
            if (minimizeBtn) {
                minimizeBtn.innerHTML = '─';
                minimizeBtn.title = 'Minimize';
            }

            debugLog('OVERLAY_LIFECYCLE', `Expanded overlay ${tabName}`, {
                overlayId: overlay.id
            });

        } else {
            // MINIMIZE - Collapse to title bar only
            overlay.setAttribute('data-minimized', 'true');
            overlay.style.height = '18px';
            overlay.style.minHeight = '18px';
            overlay.style.maxHeight = '18px';
            overlay.style.overflow = 'visible'; // Allow resize handles to show

            if (contentContainer) {
                contentContainer.style.display = 'none';
                contentContainer.style.opacity = '0';
            }

            // Update minimize button to restore button
            const minimizeBtn = overlay.querySelector('.mga-drag-zone div:last-child');
            if (minimizeBtn) {
                minimizeBtn.innerHTML = '□';
                minimizeBtn.title = 'Restore';
            }

            debugLog('OVERLAY_LIFECYCLE', `Minimized overlay ${tabName}`, {
                overlayId: overlay.id
            });
        }

        // Save minimized state
        const overlayStates = MGA_loadJSON('MGA_overlayStates', {});
        overlayStates[overlay.id] = { minimized: !isMinimized };
        MGA_saveJSON('MGA_overlayStates', overlayStates);

        // Add smooth animation
        overlay.style.transition = 'height 0.2s ease, min-height 0.2s ease, max-height 0.2s ease';
        setTimeout(() => {
            overlay.style.transition = '';
        }, 200);
    }

    function loadOverlayState(overlay) {
        try {
            const overlayStates = MGA_loadJSON('MGA_overlayStates', {});
            const state = overlayStates[overlay.id];

            if (state && state.minimized) {
                // Apply minimized state without animation on startup
                overlay.setAttribute('data-minimized', 'true');
                overlay.style.height = '18px';
                overlay.style.minHeight = '18px';
                overlay.style.maxHeight = '18px';
                overlay.style.overflow = 'visible'; // Allow resize handles to show

                const contentContainer = overlay.querySelector('.mga-content-container');
                if (contentContainer) {
                    contentContainer.style.display = 'none';
                    contentContainer.style.opacity = '0';
                }

                const minimizeBtn = overlay.querySelector('.mga-drag-zone div:last-child');
                if (minimizeBtn) {
                    minimizeBtn.innerHTML = '□';
                    minimizeBtn.title = 'Restore';
                }

                debugLog('OVERLAY_LIFECYCLE', `Loaded minimized state for ${overlay.id}`);
            }
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to load overlay state', error, {
                overlayId: overlay.id
            });
        }
    }

    function closeInGameOverlay(tabName) {
        const overlay = UnifiedState.data.popouts.overlays.get(tabName);
        if (overlay && document.contains(overlay)) {
            overlay.remove();
        }
        UnifiedState.data.popouts.overlays.delete(tabName);

        // Update the corresponding pop-out button state
        updatePopoutButtonStateByTab(tabName, false);

        productionLog(`🗑️ Closed in-game overlay for ${tabName} tab`);
    }

    function updatePopoutButtonStateByTab(tabName, isActive) {
        const popoutBtn = targetDocument.querySelector(`[data-popout="${tabName}"]`);
        if (popoutBtn) {
            updatePopoutButtonState(popoutBtn, isActive);
        }
    }

    // NEW: Update function for pure content overlays
    function updatePureOverlayContent(overlay, tabName) {
        try {
            debugLog('OVERLAY_LIFECYCLE', `Updating pure overlay content for ${tabName}`, {
                overlayId: overlay.id
            });

            let content = '';
            switch(tabName) {
                case 'pets':
                    content = getPetsPopoutContent();  // Use popout version for overlays too
                    break;
                case 'abilities':
                    content = getAbilitiesTabContent();
                    break;
                case 'seeds':
                    content = getSeedsTabContent();
                    break;
                case 'values':
                    content = getValuesTabContent();
                    break;
                case 'timers':
                    content = getTimersTabContent();
                    break;
                case 'settings':
                    content = getSettingsTabContent();
                    break;
                default:
                    content = '<p>Tab content not available</p>';
            }

            // Create the full content with styles (matching createInGameOverlay structure)
            const contentHtml = `
            <style>
                /* TARGET IMAGE MATCH - Clean, readable styling */
                /* Section titles are now handled in the main visibility rules above */

                .mga-overlay-content-only .mga-section {
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .mga-overlay-content-only .mga-value-row {
                    display: flex !important;
                    justify-content: space-between !important;
                    margin: 3px 0 !important;
                    padding: 2px 0 !important;
                    line-height: 1.3 !important;
                }

                .mga-overlay-content-only .mga-value-label {
                    font-size: 12px !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    font-weight: 400 !important;
                    margin: 0 !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }

                .mga-overlay-content-only .mga-value-amount {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: #ffffff !important;
                    margin: 0 !important;
                    text-align: right;
                    min-width: 50px;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
                }

                /* HIGH CONTRAST TOTAL VALUE */
                .mga-overlay-content-only .mga-total-value {
                    border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
                    margin-top: 6px !important;
                    padding-top: 4px !important;
                }

                .mga-overlay-content-only .mga-total-value .mga-value-label {
                    font-weight: 500 !important;
                    color: rgba(255, 255, 255, 0.95) !important;
                    font-size: 13px !important;
                }

                .mga-overlay-content-only .mga-total-value .mga-value-amount {
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    color: #ffff00 !important;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                }

                /* Hide only truly unnecessary elements - KEEP buttons and checkboxes for functionality */
                .mga-overlay-content-only .mga-section-header,
                .mga-overlay-content-only .mga-input-group,
                .mga-overlay-content-only .mga-timer-controls {
                    display: none !important;
                }

                /* Keep section titles visible but make them smaller */
                .mga-overlay-content-only .mga-section-title {
                    display: block !important;
                    font-size: 11px !important;
                    margin-bottom: 4px !important;
                }

                /* Readable ability logs */
                .mga-overlay-content-only .mga-log-item {
                    margin: 2px 0 !important;
                    padding: 2px 0 !important;
                    font-size: 11px !important;
                    line-height: 1.3 !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }

                .mga-overlay-content-only .mga-log-time {
                    font-size: 10px !important;
                    color: rgba(255, 255, 255, 0.7) !important;
                }

                /* Readable pet loadouts */
                .mga-overlay-content-only .mga-pet-slot {
                    margin: 2px 0 !important;
                    padding: 3px !important;
                    font-size: 11px !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }
            </style>
        `;

            // Update overlay content
            productionLog('🔍 [PURE OVERLAY DEBUG] Variables check:', {
                contentHtmlType: typeof contentHtml,
                contentHtmlLength: contentHtml?.length,
                contentType: typeof content,
                contentLength: content?.length,
                contentHtmlPreview: contentHtml?.substring(0, 100),
                contentPreview: content?.substring(0, 100)
            });

            overlay.innerHTML = contentHtml + content;

            // Setup handlers for the overlay
            setupPureOverlayHandlers(overlay, tabName);

            // Re-add resize handle after content update (since innerHTML replaces everything)
            setTimeout(() => {
                if (!overlay.querySelector('.mga-resize-handle')) {
                    addResizeHandleToOverlay(overlay);
                    productionLog(`🔧 [RESIZE] Re-added missing resize handle to ${tabName} pure overlay`);
                }
            }, 50);

        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to update pure overlay content', error, {
                tabName,
                overlayId: overlay.id
            });
        }
    }

    function setupPureOverlayHandlers(overlay, tabName) {
        setTimeout(() => {
            try {
                productionLog(`🔧 [HANDLER-SETUP] Setting up handlers for ${tabName} overlay`);
                debugLog('HANDLER_SETUP', `Setting up pure overlay handlers for ${tabName}`, {
                    overlayId: overlay.id
                });

                switch(tabName) {
                    case 'abilities':
                        setupAbilitiesTabHandlers(overlay);
                        updateAbilityLogDisplay(overlay);
                        debugLog('ABILITY_LOGS', 'Set up ability logs for pure overlay', {
                            logCount: UnifiedState.data.petAbilityLogs.length,
                            overlayId: overlay.id
                        });
                        break;
                    case 'pets':
                        setupPetPopoutHandlers(overlay);  // Use popout handlers for overlays
                        break;
                    case 'seeds':
                        setupSeedsTabHandlers(overlay);
                        break;
                    case 'settings':
                        setupSettingsTabHandlers(overlay);
                        break;
                    case 'tools':
                        setupToolsTabHandlers(overlay);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                debugError('HANDLER_SETUP', 'Failed to set up pure overlay handlers', error, {
                    tabName,
                    overlayId: overlay.id
                });
            }
        }, 200);  // Increased from 100ms to 200ms to ensure DOM is fully updated
    }

    function refreshOverlayContent(tabName) {
        const overlay = UnifiedState.data.popouts.overlays.get(tabName);
        if (overlay && document.contains(overlay)) {
            // NEW: Handle pure content overlays (no .mga-overlay-content wrapper)
            if (overlay.className.includes('mga-overlay-content-only')) {
                updatePureOverlayContent(overlay, tabName);
                productionLog(`🔄 Refreshed pure overlay content for ${tabName} tab`);
            } else {
                // LEGACY: Handle old overlay structure if it exists
                const contentArea = overlay.querySelector('.mga-overlay-content');
                if (contentArea) {
                    updateOverlayContent(contentArea, tabName);
                    productionLog(`🔄 Refreshed legacy overlay content for ${tabName} tab`);
                }
            }
        }
    }

    // Rename original function to avoid conflicts
    function openTabInSeparateWindow(tabName) {
        productionLog(`🔗 Opening ${tabName} tab in separate window...`);

        const tabTitles = {
            pets: '🐾 Pets',
            abilities: '⚡ Abilities',
            seeds: '🌱 Seeds',
            values: '💰 Values',
            timers: '⏰ Timers',
            settings: '⚙️ Settings'
        };

        const title = `MGTools - ${tabTitles[tabName] || tabName}`;
        const windowFeatures = 'width=450,height=550,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';
        const popoutWindow = window.open('', `mga_popout_${tabName}`, windowFeatures);

        if (!popoutWindow) {
            productionWarn('⚠️ Pop-out blocked! Please allow popups for this site.');
            return;
        }

        // Track the popout window for cleanup
        trackPopoutWindow(popoutWindow);

        // BUGFIX: Store window reference in Map for real-time updates
        UnifiedState.data.popouts.windows.set(tabName, popoutWindow);

        // Add cleanup listener to remove from Map when window closes
        popoutWindow.addEventListener('beforeunload', () => {
            UnifiedState.data.popouts.windows.delete(tabName);
            debugLog('POPOUT_LIFECYCLE', `Removed ${tabName} from windows Map`);
        });

        // Get tab content based on tab name
        let content = '';
        switch(tabName) {
            case 'pets':
                content = getPetsPopoutContent();
                break;
            case 'abilities':
                content = getAbilitiesTabContent();
                break;
            case 'seeds':
                content = getSeedsTabContent();
                break;
            case 'shop':
                content = getShopTabContent();
                break;
            case 'values':
                content = getValuesTabContent();
                break;
            case 'timers':
                content = getTimersTabContent();
                break;
            case 'tools':
                content = getToolsTabContent();
                break;
            case 'rooms':
                content = getRoomStatusTabContent();
                break;
            case 'settings':
                content = getSettingsTabContent();
                break;
            case 'help':
                content = getHelpTabContent();
                break;
            default:
                content = '<p>Tab content not available</p>';
        }

        // Get current theme for pop-out window
        const currentTheme = UnifiedState.currentTheme || generateThemeStyles();

        // Create pop-out window HTML with dynamic theming
        const popoutHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        ${UNIFIED_STYLES}
        body {
            margin: 0;
            padding: 16px;
            background: ${currentTheme.background};
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            --panel-scale: 1;
            --base-font-size: 13px;
            --responsive-font-size: calc(var(--base-font-size) * var(--panel-scale));
            font-size: var(--responsive-font-size);
        }

        /* Removed universal font scaling to prevent oversized popout UI */
        .popout-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex-wrap: wrap;
            gap: 10px;
        }
        .popout-title {
            font-size: 18px;
            font-weight: 600;
            color: #4a9eff;
            flex-shrink: 0;
            min-width: 150px;
        }
        .popout-sync-notice {
            font-size: 12px;
            color: #888;
            font-style: italic;
            flex: 1 1 auto;
            text-align: center;
            min-width: 200px;
        }
        .refresh-btn {
            padding: 6px 12px;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex-shrink: 0;
        }
        .refresh-btn:hover {
            background: #3a8eef;
        }
    </style>
</head>
<body>
    <div class="popout-header">
        <div class="popout-title">${title}</div>
        <div class="popout-sync-notice">Click refresh to sync with main window</div>
        <button class="refresh-btn" onclick="refreshPopoutContent('${tabName}')">🔄 Refresh</button>
    </div>

    <div id="popout-content" class="mga-scrollable mga-popout-content" style="max-height: calc(100vh - 120px); overflow-y: auto;">
        ${content}
    </div>

    <script>
        // Store reference to main window
        const mainWindow = window.opener;

        function refreshPopoutContent(tabName) {
            if (!mainWindow || mainWindow.closed) {
                productionWarn('⚠️ Main window is closed. Cannot refresh content.');
                return;
            }

            // Get fresh content from main window
            let freshContent = '';
            switch(tabName) {
                case 'pets':
                    freshContent = mainWindow.MGA_Internal?.getPetsPopoutContent ? mainWindow.MGA_Internal?.getPetsPopoutContent() : 'Content unavailable';
                    break;
                case 'abilities':
                    freshContent = mainWindow.MGA_Internal?.getAbilitiesTabContent ? mainWindow.MGA_Internal?.getAbilitiesTabContent() : 'Content unavailable';
                    break;
                case 'seeds':
                    freshContent = mainWindow.MGA_Internal?.getSeedsTabContent ? mainWindow.MGA_Internal?.getSeedsTabContent() : 'Content unavailable';
                    break;
                case 'shop':
                    freshContent = mainWindow.MGA_Internal?.getShopTabContent ? mainWindow.MGA_Internal?.getShopTabContent() : 'Content unavailable';
                    break;
                case 'values':
                    freshContent = mainWindow.MGA_Internal?.getValuesTabContent ? mainWindow.MGA_Internal?.getValuesTabContent() : 'Content unavailable';
                    break;
                case 'timers':
                    freshContent = mainWindow.MGA_Internal?.getTimersTabContent ? mainWindow.MGA_Internal?.getTimersTabContent() : 'Content unavailable';
                    break;
                case 'tools':
                    freshContent = mainWindow.MGA_Internal?.getToolsTabContent ? mainWindow.MGA_Internal?.getToolsTabContent() : 'Content unavailable';
                    break;
                case 'rooms':
                    freshContent = mainWindow.MGA_Internal?.getRoomStatusTabContent ? mainWindow.MGA_Internal?.getRoomStatusTabContent() : 'Content unavailable';
                    break;
                case 'settings':
                    freshContent = mainWindow.MGA_Internal?.getSettingsTabContent ? mainWindow.MGA_Internal?.getSettingsTabContent() : 'Content unavailable';
                    break;
            }

            document.getElementById('popout-content').innerHTML = freshContent;

            // Rerun handlers if needed
            if (tabName === 'abilities' && mainWindow.setupAbilitiesTabHandlers) {
                mainWindow.setupAbilitiesTabHandlers.call(mainWindow);
                if (mainWindow.updateAbilityLogDisplay) {
                    mainWindow.updateAbilityLogDisplay.call(mainWindow);
                }
            } else if (tabName === 'pets') {
                // For pets popout, use special popout handlers instead of main tab handlers
                if (mainWindow.setupPetPopoutHandlers) {
                    mainWindow.setupPetPopoutHandlers.call(mainWindow, document);
                }
            } else if (tabName === 'seeds' && mainWindow.setupSeedsTabHandlers) {
                mainWindow.setupSeedsTabHandlers.call(mainWindow, document);
            } else if (tabName === 'values' && mainWindow.resourceDashboard) {
                mainWindow.resourceDashboard.setupDashboardHandlers(document);
            } else if (tabName === 'settings' && mainWindow.setupSettingsTabHandlers) {
                mainWindow.setupSettingsTabHandlers.call(mainWindow, document);
            }
        }

        // BUGFIX: Expose refresh function on window object for external access
        window.refreshPopoutContent = refreshPopoutContent;

        // Store the tab name for this popup window
        const currentTabName = '\${tabName}';

        // Auto-refresh every 30 seconds - Use managed interval to prevent memory leaks
        if (window.opener && window.opener.setManagedInterval) {
            window.opener.setManagedInterval(
                'popoutRefresh_' + currentTabName + '_' + Date.now(),
                () => refreshPopoutContent(currentTabName),
                30000
            );
        }

        // Cleanup when window closes
        window.addEventListener('beforeunload', () => {
            productionLog('Pop-out window closing for:', currentTabName);
        });
    </script>
</body>
</html>
        `;

        popoutWindow.document.open();
        popoutWindow.document.write(popoutHTML);
        popoutWindow.document.close();

        // Set up handlers for the separate window popout content
        setTimeout(() => {
            try {
                switch(tabName) {
                    case 'pets':
                        setupPetPopoutHandlers(popoutWindow.document);  // Use popout handlers
                        break;
                    case 'seeds':
                        setupSeedsTabHandlers(popoutWindow.document);
                        break;
                    case 'shop':
                        setupShopTabHandlers(popoutWindow.document);
                        break;
                    case 'settings':
                        setupSettingsTabHandlers(popoutWindow.document);
                        break;
                    case 'tools':
                        setupToolsTabHandlers(popoutWindow.document);
                        break;
                    case 'rooms':
                        setupRoomJoinButtons();
                        break;
                    case 'hotkeys':
                        setupHotkeysTabHandlers(popoutWindow.document);
                        break;
                    case 'notifications':
                        setupNotificationsTabHandlers(popoutWindow.document);
                        break;
                    case 'abilities':
                        // Abilities handlers are complex due to cross-window limitations
                        break;
                }
            } catch (error) {
                productionWarn('Could not set up separate window popout handlers:', error);
            }
        }, 100);

        productionLog(`✅ Separate window opened for ${tabName} tab`);
    }

    // TOGGLE FUNCTIONALITY - Professional pop-out management
    function toggleTabPopout(tabName, buttonElement) {
        const isOverlayMode = UnifiedState.data.settings.useInGameOverlays;

        if (isOverlayMode) {
            // Check if overlay already exists
            const existingOverlay = UnifiedState.data.popouts.overlays.get(tabName);

            if (existingOverlay && document.contains(existingOverlay)) {
                // CLOSE existing overlay
                closeInGameOverlay(tabName);
                updatePopoutButtonState(buttonElement, false);
                debugLog('OVERLAY_LIFECYCLE', `Toggled OFF: ${tabName} overlay closed`);
            } else {
                // OPEN new overlay
                createInGameOverlay(tabName);
                updatePopoutButtonState(buttonElement, true);
                debugLog('OVERLAY_LIFECYCLE', `Toggled ON: ${tabName} overlay opened`);
            }
        } else {
            // For separate windows, always open (can't easily detect if window is open)
            openTabInSeparateWindow(tabName);
            updatePopoutButtonState(buttonElement, true);
            debugLog('OVERLAY_LIFECYCLE', `Opened separate window for ${tabName}`);
        }
    }

    function updatePopoutButtonState(buttonElement, isActive) {
        if (isActive) {
            buttonElement.style.color = '#4CAF50';
            buttonElement.style.transform = 'scale(1.1)';
            buttonElement.style.opacity = '1';
            buttonElement.title = 'Click to close pop-out';
        } else {
            buttonElement.style.color = '';
            buttonElement.style.transform = '';
            buttonElement.style.opacity = '';
            buttonElement.title = 'Click to open in pop-out';
        }
    }

    // Legacy function - Update openTabInPopout to check overlay preference
    function openTabInPopout(tabName) {
        if (UnifiedState.data.settings.useInGameOverlays) {
            return createInGameOverlay(tabName);
        } else {
            return openTabInSeparateWindow(tabName);
        }
    }

    // ==================== TAB CONTENT CACHE SYSTEM ====================
    // Performance optimization: Cache static tab content to reduce regeneration
    const tabContentCache = new Map();
    const TAB_CACHE_DURATION = 30000; // 30 seconds for static tabs

    function getCachedTabContent(tabName, generator) {
        // Never cache dynamic tabs (they need real-time data)
        const dynamicTabs = ['pets', 'abilities', 'values', 'timers', 'rooms', 'hotkeys'];
        if (dynamicTabs.includes(tabName)) {
            return generator();
        }

        // Check cache for static tabs
        const cached = tabContentCache.get(tabName);
        const now = Date.now();

        if (cached && now - cached.timestamp < TAB_CACHE_DURATION) {
            return cached.content;
        }

        // Generate and cache
        const content = generator();
        tabContentCache.set(tabName, { content, timestamp: now });
        return content;
    }

    // Invalidate tab cache (call when settings change)
    function invalidateTabCache(tabName = null) {
        if (tabName) {
            tabContentCache.delete(tabName);
        } else {
            tabContentCache.clear();
        }
    }

    window.MGA_TabCache = { getCachedTabContent, invalidateTabCache };

    function updateTabContent() {
        const contentEl = getCachedElement('#mga-tab-content') || document.getElementById('mga-tab-content');

        // Preserve input state for pets tab to prevent typing interruption
        let preservedInputValue = '';
        let preservedInputFocused = false;
        let preservedCursorPosition = 0;
        if (UnifiedState.activeTab === 'pets') {
            const currentInput = document.getElementById('preset-name-input');
            if (currentInput) {
                preservedInputValue = currentInput.value;
                preservedInputFocused = document.activeElement === currentInput;
                preservedCursorPosition = currentInput.selectionStart || 0;
                if (UnifiedState.data.settings.debugMode) {
                    productionLog('🔒 Preserving input state:', { value: preservedInputValue, focused: preservedInputFocused, cursor: preservedCursorPosition });
                }
            }
        }

        // Add data attribute for CSS targeting
        contentEl.setAttribute('data-active', UnifiedState.activeTab);

        switch(UnifiedState.activeTab) {
            case 'pets':
                // 🔍 RENDER CYCLE DEBUG: Track pets tab content generation
                productionLog('🔄 [RENDER-CYCLE] Starting pets tab content generation', {
                    timestamp: new Date().toLocaleTimeString(),
                    activeTab: UnifiedState.activeTab,
                    atomActivePets: UnifiedState.atoms.activePets?.length || 0,
                    windowActivePets: window.activePets?.length || 0,
                    renderTrigger: 'updateTabContent'
                });

                const petsHtml = getPetsTabContent();
                productionLog('🔄 [RENDER-CYCLE] Generated pets HTML', {
                    htmlLength: petsHtml.length,
                    containsActivePets: petsHtml.includes('Active Pets'),
                    containsPetData: petsHtml.includes('mga-pet-'),
                    renderStage: 'html-generated'
                });

                contentEl.innerHTML = petsHtml;

                // Check what was actually rendered to DOM
                setTimeout(() => {
                    const activePetsElements = contentEl.querySelectorAll('.mga-pet-item');
                    productionLog('🔄 [RENDER-CYCLE] DOM render result', {
                        activePetsInDOM: activePetsElements.length,
                        elementsFound: activePetsElements.length > 0,
                        renderStage: 'dom-updated',
                        timestamp: new Date().toLocaleTimeString()
                    });
                }, 10);

                setupPetsTabHandlers();

                // Restore input state after HTML regeneration
                if (preservedInputValue || preservedInputFocused) {
                    setTimeout(() => {
                        const newInput = document.getElementById('preset-name-input');
                        if (newInput) {
                            newInput.value = preservedInputValue;
                            if (preservedInputFocused) {
                                newInput.focus();
                                // Set cursor to preserved position
                                newInput.setSelectionRange(preservedCursorPosition, preservedCursorPosition);
                                if (UnifiedState.data.settings.debugMode) {
                                    productionLog('✅ Restored input state:', { value: newInput.value, focused: document.activeElement === newInput });
                                }
                            }
                        }
                    }, 0);
                }
                break;
            case 'abilities':
                contentEl.innerHTML = getAbilitiesTabContent();
                setupAbilitiesTabHandlers();
                updateAbilityLogDisplay();
                break;
            case 'seeds':
                contentEl.innerHTML = getSeedsTabContent();
                setupSeedsTabHandlers(contentEl);
                break;
            case 'shop':
                contentEl.innerHTML = getShopTabContent();
                setupShopTabHandlers(contentEl);
                break;
            case 'values':
                contentEl.innerHTML = getValuesTabContent();
                setupValuesTabHandlers(contentEl);
                break;
            case 'timers':
                contentEl.innerHTML = getTimersTabContent();
                break;
            case 'rooms':
                contentEl.innerHTML = getRoomStatusTabContent();
                setupRoomJoinButtons();
                break;
            case 'tools':
                contentEl.innerHTML = getCachedTabContent('tools', getToolsTabContent);
                setupToolsTabHandlers(contentEl);
                break;
            case 'hotkeys':
                contentEl.innerHTML = getCachedTabContent('hotkeys', getHotkeysTabContent);
                setupHotkeysTabHandlers(contentEl);
                break;
            case 'notifications':
                contentEl.innerHTML = getCachedTabContent('notifications', getNotificationsTabContent);
                setupNotificationsTabHandlers(contentEl);
                break;
            case 'settings':
                contentEl.innerHTML = getCachedTabContent('settings', getSettingsTabContent);
                contentEl.setAttribute('data-tab', 'settings'); // Enable settings-specific scrolling
                setupSettingsTabHandlers();
                break;
            case 'help':
                contentEl.innerHTML = getCachedTabContent('help', getHelpTabContent);
                break;
        }
    }

    // ==================== TAB CONTENTS ====================
    // Simplified pets content for popouts - JUST preset selection
    function getPetsPopoutContent() {
        productionLog('🔍 [PETS DEBUG] getPetsPopoutContent() called');
        // Use multiple sources for pet data (same as updateActivePetsDisplay)
        const activePets = UnifiedState.atoms.activePets || window.activePets || [];
        const petPresets = UnifiedState.data.petPresets;
        productionLog('🔍 [PETS DEBUG] Data check:', {
            activePetsCount: activePets.length,
            presetsCount: Object.keys(petPresets).length,
            unifiedStateActivePets: UnifiedState.atoms.activePets?.length || 0,
            windowActivePets: window.activePets?.length || 0
        });

        if (Object.keys(petPresets).length === 0) {
            return `
                <div class="mga-section">
                    <div class="mga-section-title mga-pet-section-title">Active Pets</div>
                    <div class="mga-active-pets-display">
                        ${activePets.length > 0 ? `
                            <div style="color: #93c5fd; font-size: 12px; margin-bottom: 4px;">Currently Equipped:</div>
                            <div class="mga-active-pets-list">
                                ${activePets.map((p, index) => {
                                    const timeUntilHungry = calculateTimeUntilHungry(p);
                                    const timerText = formatHungerTimer(timeUntilHungry);
                                    const timerColor = timeUntilHungry === null ? '#999' :
                                                       timeUntilHungry <= 0 ? '#8B0000' :
                                                       timeUntilHungry < 5 * 60 * 1000 ? '#ff4444' :
                                                       timeUntilHungry < 15 * 60 * 1000 ? '#ffa500' : '#4caf50';
                                    return `
                                        <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                            <span class="mga-pet-badge">${p.petSpecies}</span>
                                            <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="mga-empty-state">
                                <div class="mga-empty-state-icon">—</div>
                                <div class="mga-empty-state-description">No pets currently active</div>
                            </div>
                        `}
                    </div>
                </div>
                <div class="mga-section">
                    <div class="mga-empty-state" style="padding: 40px 20px;">
                        <div class="mga-empty-state-icon">📋</div>
                        <div class="mga-empty-state-title">No Saved Presets</div>
                        <div class="mga-empty-state-description">
                            You haven't saved any pet loadout presets yet.<br>
                            Open the main HUD Pets tab to create presets from your current active pets.
                        </div>
                    </div>
                </div>
            `;
        }

        let html = `
            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Active Pets</div>
                <div class="mga-active-pets-display">
                    ${activePets.length > 0 ? `
                        <div class="mga-active-pets-header">Currently Equipped:</div>
                        <div class="mga-active-pets-list">
                            ${activePets.map((p, index) => {
                                const timeUntilHungry = calculateTimeUntilHungry(p);
                                const timerText = formatHungerTimer(timeUntilHungry);
                                const timerColor = timeUntilHungry === null ? '#999' :
                                                   timeUntilHungry <= 0 ? '#8B0000' :
                                                   timeUntilHungry < 5 * 60 * 1000 ? '#ff4444' :
                                                   timeUntilHungry < 15 * 60 * 1000 ? '#ffa500' : '#4caf50';
                                return `
                                    <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                        <span class="mga-pet-badge">${p.petSpecies}</span>
                                        <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="mga-empty-state">
                            <div class="mga-empty-state-icon">—</div>
                            <div class="mga-empty-state-description">No pets currently active</div>
                        </div>
                    `}
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Load Pet Preset</div>
        `;

        // Create clickable preset cards (consistent with main HUD structure) in order
        ensurePresetOrder();
        UnifiedState.data.petPresetsOrder.forEach(name => {
            if (petPresets[name]) {
                const pets = petPresets[name];
                const petList = pets.map(p => p.petSpecies).join(', ');
                html += `
                    <div class="mga-preset mga-preset-clickable" data-preset="${name}">
                        <div class="mga-preset-header">
                            <span class="mga-preset-name">${name}</span>
                        </div>
                        <div class="mga-preset-pets">${petList}</div>
                    </div>
                `;
            }
        });

        html += `</div>`;
        productionLog('🔍 [PETS DEBUG] Returning HTML:', { htmlLength: html.length, htmlPreview: html.substring(0, 200) });
        return html;
    }

    // Setup handlers specifically for pet popout preset buttons
    function setupPetPopoutHandlers(context = document) {
        // Find all preset cards
        const cards = context.querySelectorAll('.mga-preset-clickable[data-preset]');

        productionLog(`🔧 [PETS-HANDLERS] Setting up handlers for ${cards.length} preset cards`);

        // Set up preset card handlers - use cloneNode to ensure clean slate
        cards.forEach((presetCard, index) => {
            // Clone the node to remove ALL event listeners
            const newCard = presetCard.cloneNode(true);
            presetCard.parentNode.replaceChild(newCard, presetCard);

            // Attach fresh handler to the cloned card
            newCard.addEventListener('click', (e) => {
                productionLog(`🎯 [PETS-CLICK] Clicked preset #${index}: ${e.currentTarget.dataset.preset}`);
                const presetName = e.currentTarget.dataset.preset;

                if (!presetName || !UnifiedState.data.petPresets[presetName]) {
                    productionWarn('⚠️ Preset not found!');
                    return;
                }

                const preset = UnifiedState.data.petPresets[presetName];

                // Store current pets first
                (UnifiedState.atoms.activePets || []).forEach(p => {
                    safeSendMessage({
                        scopePath: ["Room", "Quinoa"],
                        type: "StorePet",
                        itemId: p.id
                    });
                });

                // Place preset pets with delay to prevent accidental clicks
                preset.forEach((p, i) => {
                    setTimeout(() => {
                        safeSendMessage({
                            scopePath: ["Room", "Quinoa"],
                            type: "PlacePet",
                            itemId: p.id,
                            position: { x: 17 + i * 2, y: 13 },
                            localTileIndex: 64,
                            tileType: "Boardwalk"
                        });
                    }, i * 50); // 50ms delay between each pet placement
                });

                // Update displays after all pets are placed (single refresh with retry)
                const refreshPetDisplays = () => {
                    productionLog('🔄 [PETS-REFRESH] Starting refresh...');
                    // Force update from room state
                    updateActivePetsFromRoomState();

                    // Get the actual window context, whether we're in main window or popout
                    const contextDoc = context.ownerDocument || context;
                    const contextWindow = contextDoc.defaultView || window;

                    // Check if this is a separate window popout
                    const isSeparateWindow = contextWindow !== window && contextWindow.refreshPopoutContent;

                    if (isSeparateWindow) {
                        // Refresh separate window popout
                        contextWindow.refreshPopoutContent('pets');
                    } else {
                        // It's an in-game overlay or main window - update all popouts
                        refreshSeparateWindowPopouts('pets');

                        // Update all overlays
                        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                            if (overlay && document.contains(overlay) && tabName === 'pets') {
                                if (overlay.className.includes('mga-overlay-content-only')) {
                                    updatePureOverlayContent(overlay, tabName);
                                }
                            }
                        });

                        // Update main tab if active
                        if (UnifiedState.activeTab === 'pets') {
                            updateTabContent();
                        }
                    }
                };

                // Single refresh after 2 seconds (gives game time to update)
                setTimeout(() => {
                    refreshPetDisplays();
                    productionLog('✅ [PETS-REFRESH] First refresh complete');

                    // Retry handler reattachment after a short delay to ensure reliability
                    setTimeout(() => {
                        const overlay = UnifiedState.data.popouts.overlays.get('pets');
                        if (overlay && document.contains(overlay)) {
                            productionLog('🔄 [PETS-HANDLERS] Reattaching handlers to ensure reliability');
                            setupPetPopoutHandlers(overlay);
                        }
                    }, 500);
                }, preset.length * 50 + 2000);

                // Visual feedback - gentle highlight, no transform (prevents stutter)
                // Temporarily disable pointer events to prevent hover conflicts
                e.currentTarget.style.pointerEvents = 'none';
                const originalBackground = e.currentTarget.style.background;
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                setTimeout(() => {
                    e.currentTarget.style.background = originalBackground;
                    e.currentTarget.style.pointerEvents = '';
                }, 200);

                productionLog(`✅ [PETS-SWAP] Loaded preset: ${presetName}`);
            });
        });

        // Add event delegation for preset action buttons (move-up, move-down, save, place, remove)
        const presetsContainer = context.querySelector('#presets-list');
        if (presetsContainer) {
            // Remove old listener if it exists
            if (presetsContainer._mgaClickHandler) {
                presetsContainer.removeEventListener('click', presetsContainer._mgaClickHandler);
            }

            // Create new handler
            presetsContainer._mgaClickHandler = (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;

                e.preventDefault();
                e.stopPropagation();

                const action = btn.dataset.action;
                const presetName = btn.dataset.preset;

                if (action === 'move-up') {
                    movePreset(presetName, 'up', context);
                } else if (action === 'move-down') {
                    movePreset(presetName, 'down', context);
                } else if (action === 'save') {
                    UnifiedState.data.petPresets[presetName] = (UnifiedState.atoms.activePets || []).slice(0, 3);
                    MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
                    refreshPresetsList(context);
                    refreshSeparateWindowPopouts('pets');
                } else if (action === 'place') {
                    placePetPreset(presetName);
                } else if (action === 'remove') {
                    delete UnifiedState.data.petPresets[presetName];
                    const saveSuccess = MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
                    if (!saveSuccess) {
                        console.error('❌ Failed to save after removing preset');
                        alert('⚠️ Failed to save changes! The preset removal may not persist.');
                    }
                    refreshPresetsList(context);
                    refreshSeparateWindowPopouts('pets');
                }
            };

            // Add the handler
            presetsContainer.addEventListener('click', presetsContainer._mgaClickHandler);
        }
    }

    function getPetsTabContent() {
        // Use multiple sources for pet data (same as updateActivePetsDisplay)
        const activePets = UnifiedState.atoms.activePets || window.activePets || [];
        const petPresets = UnifiedState.data.petPresets;

        productionLog('🐾 [PETS-TAB-CONTENT] Generating HTML with pets:', {
            unifiedStateActivePets: UnifiedState.atoms.activePets?.length || 0,
            windowActivePets: window.activePets?.length || 0,
            finalActivePets: activePets.length,
            activePetsData: activePets
        });

        let html = `
            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Active Pets</div>
                <div class="mga-active-pets-display">
                    ${activePets.length > 0 ? `
                        <div class="mga-active-pets-header">Currently Equipped:</div>
                        <div class="mga-active-pets-list">
                            ${activePets.map((p, index) => {
                                const timeUntilHungry = calculateTimeUntilHungry(p);
                                const timerText = formatHungerTimer(timeUntilHungry);
                                const timerColor = timeUntilHungry === null ? '#999' :
                                                   timeUntilHungry <= 0 ? '#8B0000' :
                                                   timeUntilHungry < 5 * 60 * 1000 ? '#ff4444' :
                                                   timeUntilHungry < 15 * 60 * 1000 ? '#ffa500' : '#4caf50';
                                return `
                                    <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                        <span class="mga-pet-badge">${p.petSpecies}</span>
                                        <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="mga-empty-state">
                            <div class="mga-empty-state-icon">—</div>
                            <div class="mga-empty-state-description">No pets currently active</div>
                        </div>
                    `}
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Quick Load Preset</div>
                <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: stretch;">
                    <select class="mga-select" id="preset-quick-select" style="flex: 1;">
                        <option value="">-- Select Preset --</option>
                        ${Object.keys(petPresets).map(name =>
                            `<option value="${name}">${name} (${petPresets[name].map(p => p.petSpecies).join(', ')})</option>`
                        ).join('')}
                    </select>
                    <button class="mga-btn" id="quick-load-btn" style="white-space: nowrap; min-width: 60px; flex-shrink: 0;">Load</button>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Create New Preset</div>
                <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: stretch;">
                    <input type="text" class="mga-input" id="preset-name-input" placeholder="Preset name..." style="flex: 1;">
                    <button class="mga-btn" id="add-preset-btn" style="white-space: nowrap; min-width: 60px; flex-shrink: 0;">Save Current</button>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title mga-pet-section-title">Manage Presets</div>
                <div id="presets-list" class="mga-scrollable mga-presets-container">
        `;

        // Display presets in order
        ensurePresetOrder();
        UnifiedState.data.petPresetsOrder.forEach(name => {
            if (petPresets[name]) {
                const pets = petPresets[name];
                html += `
                    <div class="mga-preset">
                        <div class="mga-preset-header">
                            <span class="mga-preset-name">${name}</span>
                        </div>
                        <div class="mga-preset-pets">${pets.map(p => p.petSpecies).join(', ')}</div>
                        <div class="mga-preset-actions">
                            <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                                <button class="mga-btn mga-btn-sm" data-action="move-up" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↑</button>
                                <button class="mga-btn mga-btn-sm" data-action="move-down" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↓</button>
                                <button class="mga-btn mga-btn-sm" data-action="save" data-preset="${name}">Save Current</button>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button class="mga-btn mga-btn-sm" data-action="place" data-preset="${name}">Place</button>
                                <button class="mga-btn mga-btn-sm" data-action="remove" data-preset="${name}">Remove</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        html += '</div></div>';

        return html;
    }

    function getAbilitiesTabContent() {
        const logs = UnifiedState.data.petAbilityLogs.slice(0, 30);
        const filterMode = UnifiedState.data.filterMode || 'categories';

        let html = `
            <div class="mga-section">
                <div class="mga-section-title">Filter Mode</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; gap: 2px;">
                        <button class="mga-btn mga-btn-sm ${filterMode === 'categories' ? 'active' : ''}" id="filter-mode-categories">Categories</button>
                        <button class="mga-btn mga-btn-sm ${filterMode === 'byPet' ? 'active' : ''}" id="filter-mode-bypet">By Pet</button>
                        <button class="mga-btn mga-btn-sm ${filterMode === 'custom' ? 'active' : ''}" id="filter-mode-custom">Custom</button>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="mga-btn mga-btn-sm" id="select-all-filters">All</button>
                        <button class="mga-btn mga-btn-sm" id="select-none-filters">None</button>
                    </div>
                </div>
                <div id="filter-mode-description" style="font-size: 11px; color: #aaa; margin-bottom: 8px;">
                    ${filterMode === 'categories' ? 'Filter by ability categories' :
                      filterMode === 'byPet' ? 'Filter by pet species' : 'Filter by individual abilities'}
                </div>

                <!-- Categories Mode -->
                <div id="category-filters" style="display: ${filterMode === 'categories' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.xpBoost ? 'checked' : ''} data-filter="xpBoost">
                        <span class="mga-label">💫 XP Boost</span>
                    </label>
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.cropSizeBoost ? 'checked' : ''} data-filter="cropSizeBoost">
                        <span class="mga-label">📈 Crop Size Boost</span>
                    </label>
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.selling ? 'checked' : ''} data-filter="selling">
                        <span class="mga-label">💰 Selling</span>
                    </label>
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.harvesting ? 'checked' : ''} data-filter="harvesting">
                        <span class="mga-label">🌾 Harvesting</span>
                    </label>
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.growthSpeed ? 'checked' : ''} data-filter="growthSpeed">
                        <span class="mga-label">🐢 Growth Speed</span>
                    </label>
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.specialMutations ? 'checked' : ''} data-filter="specialMutations">
                        <span class="mga-label">🌈✨ Special Mutations</span>
                    </label>
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" ${UnifiedState.data.abilityFilters.other ? 'checked' : ''} data-filter="other">
                        <span class="mga-label">🔧 Other</span>
                    </label>
                </div>

                <!-- By Pet Mode -->
                <div id="pet-filters" style="display: ${filterMode === 'byPet' ? 'block' : 'none'}; margin-bottom: 8px;">
                    <div id="pet-species-list" class="mga-scrollable" style="max-height: 150px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px;">
                        <div style="color: #888; text-align: center;">Loading pet species...</div>
                    </div>
                </div>

                <!-- Custom Mode -->
                <div id="custom-filters" style="display: ${filterMode === 'custom' ? 'block' : 'none'}; margin-bottom: 8px;">
                    <div id="individual-abilities-list" class="mga-scrollable" style="max-height: 150px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px;">
                        <div style="color: #888; text-align: center;">Loading individual abilities...</div>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                    <button class="mga-btn mga-btn-sm" id="clear-logs-btn">Clear Logs</button>
                    <button class="mga-btn mga-btn-sm" id="export-logs-btn">Export CSV</button>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Recent Ability Triggers</div>
                <div style="margin-bottom: 8px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="detailed-timestamps-checkbox" class="mga-checkbox"
                               ${UnifiedState.data.settings.detailedTimestamps ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🕐 Show detailed timestamps (HH:MM:SS)</span>
                    </label>
                    <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                        When enabled, shows detailed 24-hour format timestamps instead of 12-hour format.
                    </p>
                </div>
                <div id="ability-logs" class="mga-scrollable" style="max-height: 400px; overflow-y: auto;">
                    ${logs.length === 0 ? '<div style="color: #888; text-align: center; padding: 20px;">No ability logs yet. Ability logs will appear here when your pets trigger abilities in-game.</div>' : ''}
                </div>
            </div>
        `;

        return html;
    }

    function getSeedsTabContent() {
        debugLog('SEEDS_TAB', 'getSeedsTabContent() called - generating full content');
        productionLog('🔍 [SEEDS DEBUG] getSeedsTabContent() called - generating content');
        const seedGroups = [
            { name: "Common", color: "#fff", seeds: ["Carrot", "Strawberry", "Aloe"] },
            { name: "Uncommon", color: "#0f0", seeds: ["Apple", "Tulip", "Tomato", "Blueberry"] },
            { name: "Rare", color: "#0af", seeds: ["Daffodil", "Corn", "Watermelon", "Pumpkin"] },
            { name: "Legendary", color: "#ff0", seeds: ["Echeveria", "Coconut", "Banana", "Lily", "BurrosTail"] },
            { name: "Mythical", color: "#a0f", seeds: ["Mushroom", "Cactus", "Bamboo", "Grape"] },
            { name: "Divine", color: "orange", seeds: ["Sunflower", "Pepper", "Lemon", "PassionFruit", "DragonFruit", "Lychee"] },
            { name: "Celestial", color: "#ff69b4", seeds: ["Starweaver", "Moonbinder", "Dawnbinder"], protected: true }
        ];

        let html = `
            <div class="mga-section">
                <div class="mga-section-title">Quick Actions</div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <button class="mga-btn mga-btn-sm" id="select-all-seeds" style="background: #059669;">Select All</button>
                    <button class="mga-btn mga-btn-sm" id="select-none-seeds" style="background: #dc2626;">Select None</button>
                    <button class="mga-btn mga-btn-sm" id="select-common" style="background: #6b7280;">Common</button>
                    <button class="mga-btn mga-btn-sm" id="select-uncommon" style="background: #059669;">Uncommon</button>
                    <button class="mga-btn mga-btn-sm" id="select-rare" style="background: #0ea5e9;">Rare+</button>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Seed Management</div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap;">
                    <label class="mga-checkbox-group">
                        <input type="checkbox" class="mga-checkbox" id="auto-delete-checkbox">
                        <span class="mga-label">Auto-Delete</span>
                    </label>
                    <button class="mga-btn" id="delete-selected-btn" style="background: #dc2626;">Delete Selected</button>
                    <button class="mga-btn mga-btn-sm" id="calculate-value-btn" style="background: #f59e0b;">Calculate Value</button>
                </div>
                <div id="seed-value-display" style="display: none; margin-top: 8px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px;">
                    <div style="font-size: 13px; color: #f59e0b;">Selected Seeds Value: <span id="selected-seeds-value">0</span> 💰</div>
                </div>
            </div>
        `;

        // Seed ID mapping for checking saved state (same as setupSeedsTabHandlers)
        const seedIdMap = {
            "Carrot": "Carrot", "Strawberry": "Strawberry", "Aloe": "Aloe",
            "Blueberry": "Blueberry", "Apple": "Apple", "Tulip": "OrangeTulip",
            "Tomato": "Tomato", "Daffodil": "Daffodil", "Sunflower": "Sunflower", "Corn": "Corn",
            "Watermelon": "Watermelon", "Pumpkin": "Pumpkin", "Echeveria": "Echeveria",
            "Coconut": "Coconut", "Banana": "Banana", "Lily": "Lily",
            "BurrosTail": "BurrosTail", "Mushroom": "Mushroom", "Cactus": "Cactus",
            "Bamboo": "Bamboo", "Grape": "Grape", "Pepper": "Pepper",
            "Lemon": "Lemon", "PassionFruit": "PassionFruit", "DragonFruit": "DragonFruit",
            "Lychee": "Lychee", "Starweaver": "Starweaver", "Moonbinder": "Moonbinder", "Dawnbinder": "Dawnbinder"
        };

        productionLog('🔍 [SEEDS DEBUG] Applying saved state to checkboxes:', {
            savedSeedsToDelete: UnifiedState.data.seedsToDelete,
            savedSeedsCount: UnifiedState.data.seedsToDelete?.length || 0
        });

        seedGroups.forEach(group => {
            html += `
                <div class="mga-section">
                    <div class="mga-section-title" style="color: ${group.color}">${group.name}</div>
                    <div class="mga-grid">
            `;

            group.seeds.forEach(seed => {
                const isGroupProtected = group.protected === true;
                const isIndividuallyProtected = ['Starweaver', 'Moonbinder', 'Dawnbinder', 'Sunflower'].includes(seed);
                const isProtected = isGroupProtected || isIndividuallyProtected;
                const disabledAttr = isProtected ? 'disabled' : '';
                const protectedStyle = isProtected ? 'opacity: 0.5; cursor: not-allowed;' : '';
                const protectedLabel = isProtected ? ' 🔒' : '';

                // Check if this seed should be checked based on saved state
                const internalId = seedIdMap[seed] || seed;
                const isChecked = UnifiedState.data.seedsToDelete?.includes(internalId) || false;
                const checkedAttr = isChecked ? 'checked' : '';

                productionLog(`🔍 [SEEDS DEBUG] Seed ${seed} (${internalId}): checked=${isChecked}`);

                html += `
                    <label class="mga-checkbox-group" style="${protectedStyle}">
                        <input type="checkbox" class="mga-checkbox seed-checkbox" data-seed="${seed}" ${disabledAttr} ${checkedAttr}>
                        <span class="mga-label" style="color: ${group.color}">${seed}${protectedLabel}</span>
                    </label>
                `;
            });

            html += '</div></div>';
        });

        debugLog('SEEDS_TAB', 'getSeedsTabContent() returning HTML', { htmlLength: html.length });
        productionLog('🔍 [SEEDS DEBUG] Returning HTML:', { htmlLength: html.length, htmlPreview: html.substring(0, 200) });
        return html;
    }

    // ==================== DUAL SHOP WINDOWS ====================
    let shopWindowsOpen = false;
    let seedShopWindow = null;
    let eggShopWindow = null;
    let shopOverlay = null;

    // Shop sprite image map (Discord CDN URLs)
    const SHOP_IMAGE_MAP = {
        // Seeds
        "Carrot": "https://cdn.discordapp.com/emojis/1423010183574982669.webp",
        "Strawberry": "https://cdn.discordapp.com/emojis/1423010222724874330.webp",
        "Aloe": "https://cdn.discordapp.com/emojis/1423010259655590028.webp",
        "Blueberry": "https://cdn.discordapp.com/emojis/1423010283126784010.webp",
        "Apple": "https://cdn.discordapp.com/emojis/1423010302965846046.webp",
        "OrangeTulip": "https://cdn.discordapp.com/emojis/1423010324952514621.webp",
        "Tomato": "https://cdn.discordapp.com/emojis/1423010355109433478.webp",
        "Daffodil": "https://cdn.discordapp.com/emojis/1423010391356866654.webp",
        "Corn": "https://cdn.discordapp.com/emojis/1423010497648656566.webp",
        "Watermelon": "https://cdn.discordapp.com/emojis/1423010520067346515.webp",
        "Pumpkin": "https://cdn.discordapp.com/emojis/1423010546474549338.webp",
        "Echeveria": "https://cdn.discordapp.com/emojis/1423010587910078614.webp",
        "Coconut": "https://cdn.discordapp.com/emojis/1423010611721273444.webp",
        "Banana": "https://cdn.discordapp.com/emojis/1423010652582187089.webp",
        "Lily": "https://cdn.discordapp.com/emojis/1423010686388404407.webp",
        "BurrosTail": "https://cdn.discordapp.com/emojis/1423010714267942912.webp",
        "Mushroom": "https://cdn.discordapp.com/emojis/1423010734002012160.webp",
        "Cactus": "https://cdn.discordapp.com/emojis/1423010755267133531.webp",
        "Bamboo": "https://cdn.discordapp.com/emojis/1423010797830930552.webp",
        "Grape": "https://cdn.discordapp.com/emojis/1423010779522666616.webp",
        "Pepper": "https://cdn.discordapp.com/emojis/1423010818953580574.webp",
        "Lemon": "https://cdn.discordapp.com/emojis/1423010911144120330.webp",
        "PassionFruit": "https://cdn.discordapp.com/emojis/1423010934863171677.webp",
        "DragonFruit": "https://cdn.discordapp.com/emojis/1423010954991370271.webp",
        "Lychee": "https://cdn.discordapp.com/emojis/1423011007206396076.webp",
        "Sunflower": "https://cdn.discordapp.com/emojis/1423010976499765288.webp",
        "Starweaver": "https://cdn.discordapp.com/emojis/1423011042744729700.webp",
        "DawnCelestial": "https://cdn.discordapp.com/emojis/1423011097883185412.webp",
        "MoonCelestial": "https://cdn.discordapp.com/emojis/1423011077410525308.webp",
        // Eggs
        "CommonEgg": "https://cdn.discordapp.com/emojis/1423011628978540676.webp",
        "UncommonEgg": "https://cdn.discordapp.com/emojis/1423011627602804856.webp",
        "RareEgg": "https://cdn.discordapp.com/emojis/1423011625664905316.webp",
        "LegendaryEgg": "https://cdn.discordapp.com/emojis/1423011623089737739.webp",
        "MythicalEgg": "https://cdn.discordapp.com/emojis/1423011620828745899.webp"
    };

    // Color groups for item rarity/type
    const SHOP_COLOR_GROUPS = {
        white: ["CommonEgg", "Carrot", "Strawberry", "Aloe"],
        green: ["UncommonEgg", "Apple", "OrangeTulip", "Tomato", "Blueberry"],
        blue: ["RareEgg", "Daffodil", "Corn", "Watermelon", "Pumpkin"],
        yellow: ["LegendaryEgg", "Echeveria", "Coconut", "Banana", "Lily", "BurrosTail"],
        purple: ["MythicalEgg", "Mushroom", "Cactus", "Bamboo", "Grape"],
        orange: ["Pepper", "Lemon", "PassionFruit", "DragonFruit", "Lychee", "Sunflower"]
    };

    // Rainbow items (celestial seeds)
    const SHOP_RAINBOW_ITEMS = ["Starweaver", "DawnCelestial", "MoonCelestial"];

    // Shop prices (from in-game shop screenshots)
    const SHOP_PRICES = {
        // Seeds - Common tier
        "Carrot": 10,
        "Strawberry": 50,
        "Aloe": 125,
        // Seeds - Uncommon tier
        "Blueberry": 400,
        "Apple": 500,
        "OrangeTulip": 600,
        "Tomato": 600,
        // Seeds - Rare tier
        "Daffodil": 1000,
        "Corn": 1300,
        "Watermelon": 2500,
        "Pumpkin": 3600,
        // Seeds - Legendary tier
        "Echeveria": 4200,
        "Coconut": 6000,
        "Banana": 7500,
        "Lily": 30000,
        "BurrosTail": 93000,
        // Seeds - Mythical tier
        "Mushroom": 150000,
        "Cactus": 250000,
        "Bamboo": 400000,
        "Grape": 850000,
        // Seeds - Divine tier
        "Pepper": 3000000,
        "Lemon": 2000000,
        "PassionFruit": 2750000,
        "DragonFruit": 5000000,
        "Lychee": 25000000,
        "Sunflower": 350000000,
        // Seeds - Celestial tier
        "Starweaver": 3000000000,
        "DawnCelestial": 5000000000,
        "MoonCelestial": 50000000000,
        // Eggs
        "CommonEgg": 50000,
        "UncommonEgg": 500000,
        "RareEgg": 2500000,
        "LegendaryEgg": 10000000,
        "MythicalEgg": 50000000
    };

    // Format price with k/m/b notation and return color
    function formatShopPrice(price) {
        let formatted, color;
        if (price >= 1000000000) {
            formatted = (price / 1000000000).toFixed(price % 1000000000 === 0 ? 0 : 1) + 'b';
            color = '#4a9eff'; // Blue for billions
        } else if (price >= 1000000) {
            formatted = (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1) + 'm';
            color = '#ffd700'; // Gold for millions
        } else if (price >= 1000) {
            formatted = (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + 'k';
            color = '#999'; // Grey for thousands
        } else {
            formatted = price.toString();
            color = '#999'; // Grey for under 1000
        }
        return { formatted, color };
    }

    // Normalize string for comparison
    function normalizeShopKey(s) {
        return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Get text color class for an item
    function getShopItemColorClass(itemId) {
        const normalized = normalizeShopKey(itemId);

        // Check if rainbow item
        for (const rainbowItem of SHOP_RAINBOW_ITEMS) {
            if (normalized.includes(normalizeShopKey(rainbowItem))) {
                return 'shop-rainbow-text';
            }
        }

        // Check color groups
        for (const color in SHOP_COLOR_GROUPS) {
            const items = SHOP_COLOR_GROUPS[color];
            for (const item of items) {
                if (normalized === normalizeShopKey(item) || normalized.includes(normalizeShopKey(item))) {
                    return `shop-color-${color}`;
                }
            }
        }

        return '';
    }

    // Preload shop images for better performance
    (function preloadShopImages() {
        Object.values(SHOP_IMAGE_MAP).forEach(src => {
            if (!src) return;
            const img = new Image();
            img.src = src;
        });
    })();

    // Flash purchase feedback tooltip
    function flashPurchaseFeedback(el, message, duration = 1500) {
        // Clean up any stuck tooltips first
        try {
            const stuckTooltips = targetDocument.querySelectorAll('.mga-flash-tooltip');
            stuckTooltips.forEach(t => {
                if (t && t.parentNode) t.remove();
            });
        } catch (e) {}

        try {
            if (!el || !(el instanceof Element)) {
                console.warn('flashPurchaseFeedback: invalid element', el);
                showFloatingMsg(message, duration);
                return;
            }

            const rect = el.getBoundingClientRect();
            const msg = targetDocument.createElement('div');
            msg.className = 'mga-flash-tooltip';
            msg.textContent = message;
            msg.setAttribute('role', 'status');
            msg.style.cssText = 'position:fixed;pointer-events:none;padding:6px 10px;border-radius:8px;font-size:12px;background:rgba(0,0,0,.9);color:#fff;z-index:2147483647;transition:opacity 180ms ease,transform 220ms ease;opacity:0;transform:translateY(-6px);';

            if (rect && rect.width > 0 && rect.height > 0) {
                const left = rect.left + rect.width / 2;
                let top = rect.top - 10;

                if (top < 6) top = rect.bottom + 8;
                msg.style.left = `${Math.round(left)}px`;
                msg.style.top = `${Math.round(top)}px`;
                msg.style.transform += ' translateX(-50%)';
            } else {
                const left = window.innerWidth / 2;
                const top = 20;
                msg.style.left = `${Math.round(left)}px`;
                msg.style.top = `${Math.round(top)}px`;
                msg.style.transform += ' translateX(-50%)';
            }

            targetDocument.body.appendChild(msg);

            // Trigger animation
            requestAnimationFrame(() => {
                msg.style.opacity = '1';
                msg.style.transform = msg.style.transform.replace('translateY(-6px)', 'translateY(0)');
            });

            // Ensure removal with multiple fallbacks
            const removeMsg = () => {
                try {
                    if (msg && msg.parentNode) {
                        msg.style.opacity = '0';
                        msg.style.transform = msg.style.transform.replace('translateY(0)', 'translateY(-6px)');
                        setTimeout(() => {
                            try {
                                if (msg && msg.parentNode) msg.remove();
                            } catch (e) {}
                        }, 220);
                    }
                } catch (e) {
                    try {
                        if (msg && msg.parentNode) msg.remove();
                    } catch (_) {}
                }
            };

            setTimeout(removeMsg, duration);
        } catch (err) {
            console.error('flashPurchaseFeedback error:', err);
            try {
                showFloatingMsg(message, duration);
            } catch (e) {}
        }
    }

    function showFloatingMsg(msg, dur = 900) {
        const m = targetDocument.createElement('div');
        m.textContent = msg;
        m.style.cssText = 'position:fixed;left:50%;top:20px;transform:translateX(-50%);background:rgba(0,0,0,.9);color:#fff;padding:6px 10px;border-radius:8px;z-index:2147483647;';
        targetDocument.body.appendChild(m);
        setTimeout(() => m.remove(), dur);
    }

    // Create shop overlay
    function createShopOverlay() {
        if (shopOverlay) return shopOverlay;

        shopOverlay = targetDocument.createElement('div');
        shopOverlay.id = 'mga-shop-overlay';
        targetDocument.body.appendChild(shopOverlay);

        // Click outside to close
        shopOverlay.addEventListener('click', (e) => {
            if (e.target === shopOverlay) {
                toggleShopWindows();
            }
        });

        return shopOverlay;
    }

    function toggleShopWindows() {
        if (shopWindowsOpen) {
            // Close windows
            if (seedShopWindow) seedShopWindow.remove();
            if (eggShopWindow) eggShopWindow.remove();
            if (shopOverlay) shopOverlay.classList.remove('active');
            seedShopWindow = null;
            eggShopWindow = null;
            shopWindowsOpen = false;
        } else {
            // Open windows
            const overlay = createShopOverlay();
            overlay.classList.add('active');
            createShopWindows();
            shopWindowsOpen = true;
        }
    }

    function createShopWindows() {
        // Create seed shop window
        seedShopWindow = createShopWindow('seed', 'Seeds', 100);
        eggShopWindow = createShopWindow('egg', 'Eggs', 430);

        // Setup handlers
        setupShopWindowHandlers(seedShopWindow, 'seed');
        setupShopWindowHandlers(eggShopWindow, 'egg');
    }

    // Escape key handler to close shop windows
    targetDocument.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shopWindowsOpen) {
            toggleShopWindows();
        }
    });

    function createShopWindow(type, title, leftOffset) {
        const window = targetDocument.createElement('div');
        window.className = 'mga-shop-window';
        window.id = `mga-shop-${type}`;

        // Load saved position and size with validation
        const savedPositions = MGA_loadJSON('MGA_shopWindowPositions', {});
        const savedSizes = MGA_loadJSON('MGA_shopWindowSizes', {});
        let savedPos = savedPositions[type] || { left: leftOffset, top: 120 };
        let savedSize = savedSizes[type] || { width: 300, height: 500 };

        // Validate saved position is on screen
        if (savedPos.left < 0 || savedPos.left > window.innerWidth - 100) {
            savedPos.left = leftOffset;
        }
        if (savedPos.top < 0 || savedPos.top > window.innerHeight - 100) {
            savedPos.top = 120;
        }

        // Validate saved size is reasonable
        if (savedSize.width < 250 || savedSize.width > 800) {
            savedSize.width = 300;
        }
        if (savedSize.height < 300 || savedSize.height > 900) {
            savedSize.height = 500;
        }

        window.style.cssText = `
            position: fixed;
            top: ${savedPos.top}px;
            left: ${savedPos.left}px;
            width: ${savedSize.width}px;
            height: ${savedSize.height}px;
            background: rgba(17, 24, 39, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 12px;
            z-index: 999999;
            overflow-y: auto;
            color: #fff;
        `;

        window.innerHTML = `
            <div class="shop-window-header" style="padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: grab;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative;">
                    <h3 style="margin: 0; font-size: 14px;">🌱 ${title}</h3>
                    <button class="shop-close-btn" style="position: absolute; top: -4px; right: -4px; cursor: pointer; font-weight: 700; font-size: 16px; color: #cfcfcf; background: none; border: none; padding: 0 6px; transition: color 0.2s ease;">×</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                        <input type="checkbox" class="show-available-only" style="accent-color: #2afd23;">
                        <span>Show available only</span>
                    </label>
                    <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                        <input type="checkbox" class="sort-by-value" style="accent-color: #4a9eff;">
                        <span>Sort by Value</span>
                    </label>
                </div>
            </div>
            <div class="shop-items-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
        `;

        // Append to body (overlay is just a backdrop)
        targetDocument.body.appendChild(window);

        // Add close button handler
        const closeBtn = window.querySelector('.shop-close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.remove();
            // Update state
            if (type === 'seed') {
                seedShopWindow = null;
            } else {
                eggShopWindow = null;
            }
            // If both windows are closed, close overlay and update state
            if (!seedShopWindow && !eggShopWindow) {
                if (shopOverlay) shopOverlay.classList.remove('active');
                shopWindowsOpen = false;
            }
        });
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.color = '#ff5555';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.color = '#cfcfcf';
        });

        // Make draggable with type parameter for position saving
        makeShopWindowDraggable(window, window.querySelector('.shop-window-header'), type);

        // Make resizable with size saving
        makeElementResizable(window, {
            minWidth: 250,
            minHeight: 300,
            maxWidth: 600,
            maxHeight: 800,
            showHandleOnHover: true
        });

        // Save size on resize
        const resizeObserver = new ResizeObserver(() => {
            const sizes = MGA_loadJSON('MGA_shopWindowSizes', {});
            sizes[type] = {
                width: window.offsetWidth,
                height: window.offsetHeight
            };
            MGA_saveJSON('MGA_shopWindowSizes', sizes);
        });
        resizeObserver.observe(window);

        return window;
    }

    function makeShopWindowDraggable(element, handle, windowType) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        handle.style.cursor = 'grab';

        handle.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on interactive elements
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            // Allow dragging from labels and spans, but not if they contain an input
            if (e.target.tagName === 'LABEL' && e.target.querySelector('input')) return;
            // Don't start drag if clicking resize handle
            if (e.target.classList && e.target.classList.contains('mga-resize-handle')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = element.offsetLeft;
            startTop = element.offsetTop;
            handle.style.cursor = 'grabbing';
            element.style.zIndex = '9999999'; // Bring to front while dragging
        });

        targetDocument.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${startLeft + dx}px`;
            element.style.top = `${startTop + dy}px`;
        });

        targetDocument.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                handle.style.cursor = 'grab';
                element.style.zIndex = '999999'; // Reset z-index

                // Save position
                const positions = MGA_loadJSON('MGA_shopWindowPositions', {});
                positions[windowType] = {
                    left: element.offsetLeft,
                    top: element.offsetTop
                };
                MGA_saveJSON('MGA_shopWindowPositions', positions);
            }
        });
    }

    function setupShopWindowHandlers(window, type) {
        const itemsList = window.querySelector('.shop-items-list');
        const sortCheckbox = window.querySelector('.sort-by-value');
        const showAvailableCheckbox = window.querySelector('.show-available-only');

        const items = type === 'seed' ? SEED_SPECIES_SHOP : EGG_IDS_SHOP;

        function renderItems(sortByValue = false, showAvailableOnly = false) {
            itemsList.innerHTML = '';

            let itemsToRender = items.map(id => ({
                id,
                stock: getItemStock(id, type),
                value: getItemValue(id, type)
            }));

            // Filter by availability if checkbox is checked
            if (showAvailableOnly) {
                itemsToRender = itemsToRender.filter(item => item.stock > 0);
            }

            // Sort by value if checkbox is checked
            if (sortByValue) {
                itemsToRender.sort((a, b) => b.value - a.value);
            }

            // Render items
            itemsToRender.forEach(({ id, stock, value }) => {
                const itemEl = createShopItemElement(id, type, stock, value);
                itemsList.appendChild(itemEl);
            });

            // Show empty state if no items after filtering
            if (itemsToRender.length === 0 && showAvailableOnly) {
                itemsList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px; font-size: 12px;">No items in stock</div>';
            }
        }

        sortCheckbox.addEventListener('change', () => {
            renderItems(sortCheckbox.checked, showAvailableCheckbox.checked);
        });

        showAvailableCheckbox.addEventListener('change', () => {
            renderItems(sortCheckbox.checked, showAvailableCheckbox.checked);
        });

        renderItems();

        // Auto-refresh stock
        setInterval(() => renderItems(sortCheckbox.checked, showAvailableCheckbox.checked), 2000);
    }

    function createShopItemElement(id, type, stock, value) {
        const div = targetDocument.createElement('div');
        div.className = 'shop-item';
        if (stock > 0) div.classList.add('in-stock');

        div.style.cssText = `
            padding: 8px;
            background: ${stock > 0 ? 'rgba(76, 255, 106, 0.15)' : 'rgba(255,255,255,0.03)'};
            border: 1px solid ${stock > 0 ? 'rgba(9, 255, 0, 0.2)' : 'rgba(255,255,255,0.1)'};
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            transition: all 0.2s ease;
        `;

        const displayName = id.replace(/([A-Z])/g, ' $1').trim();
        const spriteUrl = SHOP_IMAGE_MAP[id] || '';
        const colorClass = getShopItemColorClass(id);
        const price = SHOP_PRICES[id] || 0;
        const priceData = formatShopPrice(price);

        div.innerHTML = `
            <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;">
                ${spriteUrl ? `<img src="${spriteUrl}" alt="${displayName}" class="shop-sprite" loading="lazy">` : ''}
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 2px;" class="${colorClass}">${displayName}</div>
                    <div style="font-size: 10px; color: #888;">Stock: ${stock} | <span style="color: ${priceData.color};">💰${priceData.formatted}</span></div>
                </div>
            </div>
            <div style="display: flex; gap: 4px;">
                <button class="buy-btn" data-amount="1" ${stock === 0 ? 'disabled' : ''}
                        style="padding: 4px 8px; font-size: 11px; background: rgba(74, 158, 255, 0.3); border: 1px solid rgba(74, 158, 255, 0.5); border-radius: 3px; color: #fff; cursor: ${stock > 0 ? 'pointer' : 'not-allowed'}; transition: all 0.15s ease;">1</button>
                <button class="buy-btn" data-amount="all" ${stock === 0 ? 'disabled' : ''}
                        style="padding: 4px 8px; font-size: 11px; background: rgba(76, 175, 80, 0.3); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 3px; color: #fff; cursor: ${stock > 0 ? 'pointer' : 'not-allowed'}; transition: all 0.15s ease;">All</button>
            </div>
        `;

        div.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.dataset.amount === 'all' ? stock : 1;
                buyItem(id, type, amount, div);
            });

            // Add hover effects
            if (stock > 0) {
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'translateY(-1px)';
                    btn.style.background = 'rgba(9, 255, 0, 0.1)';
                    btn.style.borderColor = 'rgba(9, 255, 0, 0.09)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = '';
                    const isAllButton = btn.dataset.amount === 'all';
                    btn.style.background = isAllButton ? 'rgba(76, 175, 80, 0.3)' : 'rgba(74, 158, 255, 0.3)';
                    btn.style.borderColor = isAllButton ? 'rgba(76, 175, 80, 0.5)' : 'rgba(74, 158, 255, 0.5)';
                });
            }
        });

        return div;
    }

    function buyItem(id, type, amount, itemEl) {
        const conn = targetWindow.MagicCircle_RoomConnection;
        if (!conn?.sendMessage) {
            alert('Connection not available');
            return;
        }

        try {
            for (let i = 0; i < amount; i++) {
                conn.sendMessage({
                    scopePath: ["Room", "Quinoa"],
                    type: type === 'seed' ? "PurchaseSeed" : "PurchaseEgg",
                    [type === 'seed' ? 'species' : 'eggId']: id
                });
            }

            const displayName = id.replace(/([A-Z])/g, ' $1').trim();
            flashPurchaseFeedback(itemEl, `Purchased x${amount} ${displayName}`);
            productionLog(`✅ Purchased ${amount}x ${id}`);
        } catch (e) {
            console.error('Purchase error:', e);
            alert('Purchase failed');
        }
    }

    function getItemStock(id, type) {
        try {
            const shop = targetWindow?.globalShop?.shops;
            if (!shop) return 0;

            const inventory = type === 'seed' ? shop.seed?.inventory : shop.egg?.inventory;
            if (!inventory) return 0;

            const item = inventory.find(i => {
                const itemId = type === 'seed' ? i.species : i.eggId;
                return itemId === id;
            });

            if (!item) return 0;

            const initial = item.initialStock || 0;
            const purchased = type === 'seed'
                ? (targetWindow.bought?.shopPurchases?.seed?.purchases?.[id] || 0)
                : (targetWindow.bought?.shopPurchases?.egg?.purchases?.[id] || 0);

            return Math.max(0, initial - purchased);
        } catch (e) {
            return 0;
        }
    }

    function getItemValue(id, type) {
        // Placeholder - you can integrate with your value system
        const valueMap = {
            // Seeds (approximate values)
            'MoonCelestial': 50000, 'DawnCelestial': 45000, 'Starweaver': 40000,
            'Lychee': 8000, 'DragonFruit': 7000, 'PassionFruit': 6000,
            'Sunflower': 5000, 'Lemon': 4000, 'Pepper': 3500,
            'Grape': 3000, 'Bamboo': 2500, 'Cactus': 2000,
            'Mushroom': 1800, 'BurrosTail': 1500, 'Lily': 1200,
            'Banana': 1000, 'Coconut': 900, 'Echeveria': 800,
            'Pumpkin': 600, 'Watermelon': 500, 'Corn': 400,
            'Daffodil': 300, 'Tomato': 250, 'OrangeTulip': 200,
            'Apple': 150, 'Blueberry': 100, 'Aloe': 80,
            'Strawberry': 60, 'Carrot': 40,
            // Eggs
            'MythicalEgg': 10000, 'LegendaryEgg': 5000, 'RareEgg': 1000,
            'UncommonEgg': 200, 'CommonEgg': 50
        };
        return valueMap[id] || 100;
    }

    function formatValue(value) {
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return value.toString();
    }

    const SEED_SPECIES_SHOP = ['Carrot', 'Strawberry', 'Aloe', 'Blueberry', 'Apple', 'OrangeTulip', 'Tomato', 'Daffodil',
                                'Corn', 'Watermelon', 'Pumpkin', 'Echeveria', 'Coconut', 'Banana', 'Lily', 'BurrosTail',
                                'Mushroom', 'Cactus', 'Bamboo', 'Grape', 'Pepper', 'Lemon', 'PassionFruit', 'DragonFruit',
                                'Lychee', 'Sunflower', 'Starweaver', 'DawnCelestial', 'MoonCelestial'];

    const EGG_IDS_SHOP = ['CommonEgg', 'UncommonEgg', 'RareEgg', 'LegendaryEgg', 'MythicalEgg'];

    // ==================== SHOP TAB (DEPRECATED - USING DUAL WINDOWS NOW) ====================
    function getShopTabContent() {
        const settings = UnifiedState.data.settings;

        return `
            <div class="mga-section">
                <div class="mga-section-title">🛒 Shop</div>
                <p style="font-size: 12px; color: #aaa; margin-bottom: 16px;">
                    Quick buy seeds and eggs. Stock updates automatically when shop resets.
                </p>

                <div style="margin-bottom: 20px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <input type="checkbox" id="shop-in-stock-only" class="mga-checkbox">
                        <span>Show only items in stock</span>
                    </label>
                </div>

                <div id="shop-seed-section" style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: #fff;">🌱 Seeds</h3>
                    <div id="shop-seed-list" style="display: grid; gap: 6px;"></div>
                </div>

                <div id="shop-egg-section">
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: #fff;">🥚 Eggs</h3>
                    <div id="shop-egg-list" style="display: grid; gap: 6px;"></div>
                </div>
            </div>
        `;
    }

    function setupShopTabHandlers(context) {
        if (!context) context = targetDocument;

        const inStockCheckbox = context.querySelector('#shop-in-stock-only');
        const seedList = context.querySelector('#shop-seed-list');
        const eggList = context.querySelector('#shop-egg-list');

        if (!seedList || !eggList) return;

        // Seed/Egg item definition
        const SEED_SPECIES = ['Carrot', 'Strawberry', 'Aloe', 'Blueberry', 'Apple', 'OrangeTulip', 'Tomato', 'Daffodil',
                              'Corn', 'Watermelon', 'Pumpkin', 'Echeveria', 'Coconut', 'Banana', 'Lily', 'BurrosTail',
                              'Mushroom', 'Cactus', 'Bamboo', 'Grape', 'Pepper', 'Lemon', 'PassionFruit', 'DragonFruit',
                              'Lychee', 'Sunflower', 'Starweaver', 'DawnCelestial', 'MoonCelestial'];

        const EGG_IDS = ['CommonEgg', 'UncommonEgg', 'RareEgg', 'LegendaryEgg', 'MythicalEgg'];

        // Create shop items
        function createShopItem(id, type) {
            const item = targetDocument.createElement('div');
            item.className = 'shop-item';
            item.dataset.itemId = id;
            item.dataset.itemType = type;
            item.style.cssText = `
                padding: 10px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                transition: all 0.2s ease;
            `;

            const displayName = id.replace(/([A-Z])/g, ' $1').trim();
            const stock = getItemStock(id, type);

            item.innerHTML = `
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 2px;">${displayName}</div>
                    <div class="stock-display" style="font-size: 11px; color: #888;">Stock: ${stock}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="mga-btn mga-btn-secondary buy-one" ${stock === 0 ? 'disabled' : ''}
                            style="padding: 6px 12px; font-size: 12px;">Buy 1</button>
                    <button class="mga-btn mga-btn-secondary buy-all" ${stock === 0 ? 'disabled' : ''}
                            style="padding: 6px 12px; font-size: 12px;">Buy All</button>
                </div>
            `;

            if (stock > 0) {
                item.style.background = 'rgba(76, 255, 106, 0.15)';
                item.style.borderColor = 'rgba(9, 255, 0, 0.2)';
            }

            // Event handlers
            item.querySelector('.buy-one').addEventListener('click', () => buyItem(id, type, 1, item));
            item.querySelector('.buy-all').addEventListener('click', () => buyItem(id, type, stock, item));

            return item;
        }

        function getItemStock(id, type) {
            try {
                const shop = targetWindow?.globalShop?.shops;
                if (!shop) return 0;

                const inventory = type === 'seed' ? shop.seed?.inventory : shop.egg?.inventory;
                if (!inventory) return 0;

                const item = inventory.find(i => {
                    const itemId = type === 'seed' ? i.species : i.eggId;
                    return itemId === id;
                });

                if (!item) return 0;

                const initial = item.initialStock || 0;
                const purchased = type === 'seed'
                    ? (targetWindow.bought?.shopPurchases?.seed?.purchases?.[id] || 0)
                    : (targetWindow.bought?.shopPurchases?.egg?.purchases?.[id] || 0);

                return Math.max(0, initial - purchased);
            } catch (e) {
                return 0;
            }
        }

        function buyItem(id, type, amount, itemEl) {
            const conn = targetWindow.MagicCircle_RoomConnection;
            if (!conn?.sendMessage) {
                alert('Connection not available');
                return;
            }

            try {
                for (let i = 0; i < amount; i++) {
                    conn.sendMessage({
                        scopePath: ["Room", "Quinoa"],
                        type: type === 'seed' ? "PurchaseSeed" : "PurchaseEgg",
                        [type === 'seed' ? 'species' : 'eggId']: id
                    });
                }

                // Update UI
                setTimeout(() => {
                    const newStock = getItemStock(id, type);
                    const stockDisplay = itemEl.querySelector('.stock-display');
                    if (stockDisplay) stockDisplay.textContent = `Stock: ${newStock}`;

                    const buttons = itemEl.querySelectorAll('button');
                    buttons.forEach(btn => btn.disabled = newStock === 0);

                    if (newStock === 0) {
                        itemEl.style.background = 'rgba(255,255,255,0.03)';
                        itemEl.style.borderColor = 'rgba(255,255,255,0.1)';
                    }

                    applyStockFilter();
                }, 100);

                productionLog(`✅ Purchased ${amount}x ${id}`);
            } catch (e) {
                console.error('Purchase error:', e);
                alert('Purchase failed');
            }
        }

        function applyStockFilter() {
            if (!inStockCheckbox) return;
            const showOnlyInStock = inStockCheckbox.checked;

            context.querySelectorAll('.shop-item').forEach(item => {
                const id = item.dataset.itemId;
                const type = item.dataset.itemType;
                const stock = getItemStock(id, type);
                item.style.display = (showOnlyInStock && stock === 0) ? 'none' : 'flex';
            });
        }

        // Initialize shop
        SEED_SPECIES.forEach(species => {
            seedList.appendChild(createShopItem(species, 'seed'));
        });

        EGG_IDS.forEach(eggId => {
            eggList.appendChild(createShopItem(eggId, 'egg'));
        });

        if (inStockCheckbox) {
            inStockCheckbox.addEventListener('change', applyStockFilter);
        }

        // Auto-refresh on shop update
        const refreshInterval = setInterval(() => {
            if (!context.querySelector('#shop-seed-list')) {
                clearInterval(refreshInterval);
                return;
            }

            context.querySelectorAll('.shop-item').forEach(item => {
                const id = item.dataset.itemId;
                const type = item.dataset.itemType;
                const newStock = getItemStock(id, type);
                const stockDisplay = item.querySelector('.stock-display');
                if (stockDisplay) stockDisplay.textContent = `Stock: ${newStock}`;

                const buttons = item.querySelectorAll('button');
                buttons.forEach(btn => btn.disabled = newStock === 0);

                if (newStock > 0) {
                    item.style.background = 'rgba(76, 255, 106, 0.15)';
                    item.style.borderColor = 'rgba(9, 255, 0, 0.2)';
                } else {
                    item.style.background = 'rgba(255,255,255,0.03)';
                    item.style.borderColor = 'rgba(255,255,255,0.1)';
                }
            });

            applyStockFilter();
        }, 2000);
    }

    function getValuesTabContent() {
        const valueManager = globalValueManager || initializeValueManager();
        const tileValue = valueManager.getTileValue();
        const gardenValue = valueManager.getGardenValue();
        const inventoryValue = valueManager.getInventoryValue();

        return `
            <div class="mga-section">
                <div class="mga-section-title">💰 Garden Values</div>
                <div class="mga-value-compact" style="
                    display: grid;
                    grid-template-columns: 1fr auto;
                    column-gap: 12px;
                    row-gap: 4px;
                    font-size: 13px;
                    line-height: 1.5;
                ">
                    <div class="overlay-label" style="text-align: left; color: #e5e7eb; white-space: nowrap;">Tile value:</div>
                    <div class="overlay-val" style="text-align: right; color: #4a9eff; font-weight: bold; min-width: 90px; word-break: keep-all;">${tileValue.toLocaleString()}</div>

                    <div class="overlay-label" style="text-align: left; color: #e5e7eb; white-space: nowrap;">Inventory value:</div>
                    <div class="overlay-val" style="text-align: right; color: #f59e0b; font-weight: bold; min-width: 90px; word-break: keep-all;">${inventoryValue.toLocaleString()}</div>

                    <div class="overlay-label" style="text-align: left; color: #e5e7eb; white-space: nowrap;">Garden value:</div>
                    <div class="overlay-val" style="text-align: right; color: #10b981; font-weight: bold; min-width: 90px; word-break: keep-all;">${gardenValue.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    function setupValuesTabHandlers(context = document) {
        // No handlers needed for values tab since refresh button was removed
    }

    function getTimersTabContent() {
        return `
            <div class="mga-section">
                <div class="mga-section-title">Restock Timers</div>
                <div class="mga-timer">
                    <div class="mga-timer-label">Seed Restock</div>
                    <div class="mga-timer-value" id="timer-seed">--:--</div>
                </div>
                <div class="mga-timer">
                    <div class="mga-timer-label">Egg Restock</div>
                    <div class="mga-timer-value" id="timer-egg">--:--</div>
                </div>
                <div class="mga-timer">
                    <div class="mga-timer-label">Tool Restock</div>
                    <div class="mga-timer-value" id="timer-tool">--:--</div>
                </div>
                <div class="mga-timer" style="background: rgba(147, 51, 234, 0.1); border-color: rgba(147, 51, 234, 0.3);">
                    <div class="mga-timer-label">Lunar Event</div>
                    <div class="mga-timer-value" id="timer-lunar" style="color: #9333ea;">--:--</div>
                </div>
            </div>
        `;
    }

    function getRoomStatusTabContent() {
        const currentRoom = getCurrentRoomCode();
        const roomCounts = UnifiedState.data.roomStatus?.counts || {};

        return `
            <div class="mga-section">
                <div class="mga-section-title">🎮 Live Room Status</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Real-time player counts for all Magic Garden rooms. Shows how many players are currently in each room. Click "Join" to navigate to that room instantly.
                </p>

                <div style="margin-bottom: 12px;">
                    <input type="text" id="room-search-input" placeholder="Search room (e.g., SLAY)..."
                        style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 4px; color: white; font-size: 12px;">
                </div>

                <div id="room-status-list" style="display: flex; flex-direction: column; gap: 8px;">
                    ${TRACKED_ROOMS.map(roomCode => {
                        const count = roomCounts[roomCode] || 0;
                        const displayCount = Math.min(count, 6);
                        const isCurrentRoom = roomCode === currentRoom;

                        // Color based on player count
                        let statusColor = '#94a3b8'; // Gray for empty
                        if (count > 0) statusColor = '#4ade80'; // Green for active
                        if (count >= 4) statusColor = '#fbbf24'; // Yellow for busy
                        if (count >= 6) statusColor = '#ef4444'; // Red for full

                        const bgColor = isCurrentRoom ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)';
                        const borderColor = isCurrentRoom ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)';

                        return `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 12px;
                                background: ${bgColor};
                                border: 1px solid ${borderColor};
                                border-radius: 6px;
                                transition: all 0.2s;
                            ">
                                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                                    <span style="
                                        font-weight: bold;
                                        color: ${isCurrentRoom ? '#60a5fa' : '#e5e7eb'};
                                        font-size: 14px;
                                        min-width: 45px;
                                    ">${roomCode}</span>
                                    <span style="
                                        font-weight: bold;
                                        color: ${statusColor};
                                        font-size: 13px;
                                        min-width: 50px;
                                    ">${displayCount}/6 ${isCurrentRoom ? '(You)' : ''}</span>
                                </div>
                                <button class="mga-button room-join-btn" data-room="${roomCode}" style="
                                    padding: 6px 14px;
                                    font-size: 12px;
                                    background: ${isCurrentRoom ? '#666' : '#4a9eff'};
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: ${isCurrentRoom ? 'not-allowed' : 'pointer'};
                                    opacity: ${isCurrentRoom ? '0.5' : '1'};
                                " ${isCurrentRoom ? 'disabled' : ''}>
                                    ${isCurrentRoom ? 'Current' : 'Join'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.3);">
                    <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                        <strong style="color: #60a5fa;">How it works:</strong><br>
                        • Player counts update automatically every 5 seconds<br>
                        • Shows actual players in each room (not just script users)<br>
                        • 🟢 Green (1-3) = Active  •  🟡 Yellow (4-5) = Busy  •  🔴 Red (6+) = Full<br>
                        • Your current room is highlighted in blue<br>
                        • Click "Join" to navigate to any room instantly
                    </div>
                </div>
            </div>
        `;
    }

    function getToolsTabContent() {
        return `
            <div class="mga-section">
                <div class="mga-section-title">Magic Garden Calculators</div>
                <div class="mga-tools-grid">
                    <div class="mga-tool-card" data-calculator="sell-price">
                        <div class="mga-tool-icon">💰</div>
                        <div class="mga-tool-name">Sell Price Calculator</div>
                        <div class="mga-tool-desc">Calculate optimal selling prices for items</div>
                    </div>
                    <div class="mga-tool-card" data-calculator="weight-probability">
                        <div class="mga-tool-icon">⚖️</div>
                        <div class="mga-tool-name">Weight Probability Calculator</div>
                        <div class="mga-tool-desc">Calculate weight-based probability outcomes</div>
                    </div>
                    <div class="mga-tool-card" data-calculator="pet-appearance-probability">
                        <div class="mga-tool-icon">🎲</div>
                        <div class="mga-tool-name">Pet Appearance Probability Calculator</div>
                        <div class="mga-tool-desc">Calculate probabilities for pet appearances</div>
                    </div>
                    <div class="mga-tool-card" data-calculator="ability-trigger-time">
                        <div class="mga-tool-icon">⏱️</div>
                        <div class="mga-tool-name">Ability Trigger Time Calculator</div>
                        <div class="mga-tool-desc">Calculate optimal timing for pet ability triggers</div>
                    </div>
                </div>
                <div class="mga-section-note" style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                    <strong>Note:</strong> Calculators will open in new popup windows. Make sure popup blockers are disabled for this site.
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">📚 Wiki Resources</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Quick access to Magic Garden wiki pages. Click any card to open in a popup window.
                </p>
                <div class="mga-wiki-grid">
                    <div class="mga-wiki-card" data-wiki="crops">
                        <div class="mga-wiki-icon">🌾</div>
                        <div class="mga-wiki-name">Crops</div>
                    </div>
                    <div class="mga-wiki-card" data-wiki="pets">
                        <div class="mga-wiki-icon">🐾</div>
                        <div class="mga-wiki-name">Pets</div>
                    </div>
                    <div class="mga-wiki-card" data-wiki="abilities">
                        <div class="mga-wiki-icon">⚡</div>
                        <div class="mga-wiki-name">Abilities</div>
                    </div>
                    <div class="mga-wiki-card" data-wiki="weather">
                        <div class="mga-wiki-icon">🌤️</div>
                        <div class="mga-wiki-name">Weather Events</div>
                    </div>
                    <div class="mga-wiki-card" data-wiki="multipliers">
                        <div class="mga-wiki-icon">📈</div>
                        <div class="mga-wiki-name">Multipliers</div>
                    </div>
                    <div class="mga-wiki-card" data-wiki="shops">
                        <div class="mga-wiki-icon">🏪</div>
                        <div class="mga-wiki-name">Shops</div>
                    </div>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🌱 Crop Highlighting</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Visual highlighting system for crops. Use Ctrl+H to clear highlights, Ctrl+Shift+H to toggle this panel.
                </p>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Highlight Species:
                    </label>
                    <select class="mga-select" id="highlight-species-select">
                        <option value="">Select species to highlight...</option>
                        <option value="Carrot">🥕 Carrot</option>
                        <option value="Strawberry">🍓 Strawberry</option>
                        <option value="Aloe">🌿 Aloe</option>
                        <option value="Apple">🍎 Apple</option>
                        <option value="Tulip">🌷 Tulip</option>
                        <option value="Tomato">🍅 Tomato</option>
                        <option value="Blueberry">🫐 Blueberry</option>
                        <option value="Daffodil">🌻 Daffodil</option>
                        <option value="Corn">🌽 Corn</option>
                        <option value="Watermelon">🍉 Watermelon</option>
                        <option value="Pumpkin">🎃 Pumpkin</option>
                        <option value="Echeveria">🌵 Echeveria</option>
                        <option value="Coconut">🥥 Coconut</option>
                        <option value="Banana">🍌 Banana</option>
                        <option value="Lily">🌺 Lily</option>
                        <option value="BurrosTail">🌿 BurrosTail</option>
                        <option value="Mushroom">🍄 Mushroom</option>
                        <option value="Cactus">🌵 Cactus</option>
                        <option value="Bamboo">🎋 Bamboo</option>
                        <option value="Grape">🍇 Grape</option>
                        <option value="Sunflower">🌻 Sunflower</option>
                        <option value="Pepper">🌶️ Pepper</option>
                        <option value="Lemon">🍋 Lemon</option>
                        <option value="PassionFruit">🥭 PassionFruit</option>
                        <option value="DragonFruit">🐉 DragonFruit</option>
                        <option value="Lychee">🍒 Lychee</option>
                        <option value="Starweaver">⭐ Starweaver</option>
                        <option value="Moonbinder">🌙 Moonbinder</option>
                        <option value="Dawnbinder">🌅 Dawnbinder</option>
                    </select>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Slot Index (0-2):
                    </label>
                    <input type="number" class="mga-input" id="highlight-slot-input"
                           min="0" max="2" value="0" style="width: 80px;">
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Hidden Species:
                    </label>
                    <select class="mga-select" id="hidden-species-select">
                        <option value="">None</option>
                        <option value="Carrot">🥕 Carrot</option>
                        <option value="Strawberry">🍓 Strawberry</option>
                        <option value="Aloe">🌿 Aloe</option>
                        <option value="Apple">🍎 Apple</option>
                        <option value="Tulip">🌷 Tulip</option>
                        <option value="Tomato">🍅 Tomato</option>
                        <option value="Blueberry">🫐 Blueberry</option>
                        <option value="Daffodil">🌻 Daffodil</option>
                        <option value="Corn">🌽 Corn</option>
                        <option value="Watermelon">🍉 Watermelon</option>
                        <option value="Pumpkin">🎃 Pumpkin</option>
                        <option value="Echeveria">🌵 Echeveria</option>
                        <option value="Coconut">🥥 Coconut</option>
                        <option value="Banana">🍌 Banana</option>
                        <option value="Lily">🌺 Lily</option>
                        <option value="BurrosTail">🌿 BurrosTail</option>
                        <option value="Mushroom">🍄 Mushroom</option>
                        <option value="Cactus">🌵 Cactus</option>
                        <option value="Bamboo">🎋 Bamboo</option>
                        <option value="Grape">🍇 Grape</option>
                        <option value="Sunflower">🌻 Sunflower</option>
                        <option value="Pepper">🌶️ Pepper</option>
                        <option value="Lemon">🍋 Lemon</option>
                        <option value="PassionFruit">🥭 PassionFruit</option>
                        <option value="DragonFruit">🐉 DragonFruit</option>
                        <option value="Lychee">🍒 Lychee</option>
                        <option value="Starweaver">⭐ Starweaver</option>
                        <option value="Moonbinder">🌙 Moonbinder</option>
                        <option value="Dawnbinder">🌅 Dawnbinder</option>
                    </select>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Hidden Scale (0.0 - 1.0):
                    </label>
                    <input type="number" class="mga-input" id="hidden-scale-input"
                           min="0" max="1" step="0.1" value="0.1" style="width: 80px;">
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="mga-btn" id="apply-highlighting-btn" style="background: #059669;">
                        ✨ Apply Highlighting
                    </button>
                    <button class="mga-btn mga-btn-sm" id="clear-highlighting-btn" style="background: #dc2626;">
                        🗑️ Clear All
                    </button>
                </div>
            </div>
            <style>
                .mga-tools-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }

                .mga-tool-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .mga-tool-card:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
                    border-color: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                .mga-tool-icon {
                    font-size: 2em;
                    margin-bottom: 8px;
                }

                .mga-tool-name {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: rgba(255,255,255,0.9);
                }

                .mga-tool-desc {
                    font-size: 0.85em;
                    color: rgba(255,255,255,0.6);
                    line-height: 1.3;
                }

                .mga-wiki-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 12px;
                }

                .mga-wiki-card {
                    background: linear-gradient(135deg, rgba(74, 158, 255, 0.08), rgba(74, 158, 255, 0.03));
                    border: 1px solid rgba(74, 158, 255, 0.2);
                    border-radius: 6px;
                    padding: 12px 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                }

                .mga-wiki-card:hover {
                    background: linear-gradient(135deg, rgba(74, 158, 255, 0.15), rgba(74, 158, 255, 0.08));
                    border-color: rgba(74, 158, 255, 0.4);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }

                .mga-wiki-icon {
                    font-size: 1.5em;
                    margin-bottom: 4px;
                }

                .mga-wiki-name {
                    font-size: 0.85em;
                    font-weight: 600;
                    color: rgba(255,255,255,0.9);
                }
            </style>
        `;
    }

    // ==================== AUDIO NOTIFICATION SYSTEM ====================

    // BUGFIX: Reuse single AudioContext to prevent memory leaks and browser audio conflicts
    let sharedAudioContext = null;

    function getAudioContext() {
        if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
            sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (sharedAudioContext.state === 'suspended') {
            sharedAudioContext.resume();
        }
        return sharedAudioContext;
    }

    // Play notification sound using Web Audio API
    function playNotificationSound(frequency = 800, duration = 200, volume = 0.3) {
        try {
            const audioContext = getAudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration/1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration/1000);

            productionLog(`🔊 [NOTIFICATIONS] Sound played for rare item!`);
        } catch (error) {
            console.error('❌ [NOTIFICATIONS] Failed to play notification sound:', error);
        }
    }

    // Play triple beep notification for rare items
    function playTripleBeepNotification(volume = 0.3) {
        playNotificationSound(1000, 250, volume);
        setTimeout(() => playNotificationSound(1000, 200, volume * 0.8), 300);
        setTimeout(() => playNotificationSound(1200, 150, volume * 0.6), 600);
    }

    // Play double beep notification for pet hunger (different from shop alerts)
    function playDoubleBeepNotification(volume = 0.3) {
        playNotificationSound(600, 200, volume);
        setTimeout(() => playNotificationSound(600, 200, volume * 0.9), 250);
    }

    // Play single beep for ability notifications (subtle)
    function playSingleBeepNotification(volume = 0.2) {
        playNotificationSound(500, 150, volume);
    }

    // Play chime notification - ascending notes (pleasant)
    function playChimeNotification(volume = 0.2) {
        playNotificationSound(500, 100, volume);
        setTimeout(() => playNotificationSound(800, 100, volume * 0.9), 120);
        setTimeout(() => playNotificationSound(1000, 120, volume * 0.8), 240);
    }

    // Play alert notification - urgent descending (attention-grabbing)
    function playAlertNotification(volume = 0.2) {
        playNotificationSound(1200, 150, volume);
        setTimeout(() => playNotificationSound(900, 150, volume * 0.9), 160);
    }

    // Play buzz notification - rapid pulsing (energetic)
    function playBuzzNotification(volume = 0.2) {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => playNotificationSound(300, 40, volume * (i % 2 === 0 ? 1 : 0.6)), i * 50);
        }
    }

    // Play ding notification - clean bell-like (clear)
    function playDingNotification(volume = 0.2) {
        playNotificationSound(2000, 180, volume);
    }

    // Play chirp notification - quick rising chirp (cute)
    function playChirpNotification(volume = 0.2) {
        playNotificationSound(400, 80, volume);
        setTimeout(() => playNotificationSound(800, 60, volume * 0.8), 85);
        setTimeout(() => playNotificationSound(1200, 40, volume * 0.6), 150);
    }

    // Play alarm siren notification (very loud and noticeable)
    function playAlarmNotification(volume = 0.5) {
        let count = 0;
        const interval = setInterval(() => {
            // Alternating high-low siren sound
            playNotificationSound(count % 2 === 0 ? 1500 : 800, 400, volume);
            count++;
            if (count >= 6) clearInterval(interval); // Play 6 times total
        }, 450);
    }

    // Play continuous warning sound (repeats until acknowledged)
    let continuousAlarmInterval = null;
    function startContinuousAlarm(volume = 0.4) {
        if (continuousAlarmInterval) return; // Already playing

        let tone = 800;
        continuousAlarmInterval = setInterval(() => {
            // Warbling effect
            tone = tone === 800 ? 1200 : 800;
            playNotificationSound(tone, 300, volume);
        }, 350);

        productionLog('🚨 [NOTIFICATIONS] Continuous alarm started - requires acknowledgment!');
    }

    function stopContinuousAlarm() {
        if (continuousAlarmInterval) {
            clearInterval(continuousAlarmInterval);
            continuousAlarmInterval = null;
            productionLog('✅ [NOTIFICATIONS] Continuous alarm stopped');
        }
    }

    // Play epic notification (multiple tones in sequence)
    function playEpicNotification(volume = 0.4) {
        const sequence = [
            [400, 100], [500, 100], [600, 100], [800, 150],
            [1000, 200], [1200, 150], [1000, 150], [1200, 200],
            [1500, 300], [1200, 100], [1500, 400]
        ];

        let delay = 0;
        sequence.forEach(([freq, dur]) => {
            setTimeout(() => playNotificationSound(freq, dur, volume), delay);
            delay += dur + 50;
        });
    }

    // Play selected notification type
    function playSelectedNotification() {
        const notifications = UnifiedState.data.settings.notifications;
        const volume = notifications.volume || 0.3;
        const type = notifications.notificationType || 'triple';

        productionLog(`🔊 [NOTIFICATIONS] Playing ${type} notification at ${Math.round(volume * 100)}% volume`);

        switch (type) {
            case 'simple':
                playNotificationSound(1000, 300, volume);
                break;
            case 'triple':
                playTripleBeepNotification(volume);
                break;
            case 'alarm':
                playAlarmNotification(volume);
                break;
            case 'epic':
                playEpicNotification(volume);
                break;
            case 'continuous':
                startContinuousAlarm(volume);
                break;
            default:
                playTripleBeepNotification(volume);
        }
    }

    // Normalize species names for case-insensitive matching
    function normalizeSpeciesName(name) {
        if (!name || typeof name !== 'string') return '';
        return name.trim().toLowerCase();
    }

    // Check if an item is on the watch list (case-insensitive for seeds)
    function isWatchedItem(itemId, type = 'seed') {
        const notifications = UnifiedState.data.settings.notifications;
        if (type === 'seed') {
            // Handle name variations for celestial seeds
            // Shop uses "DawnCelestial" and "MoonCelestial" but UI uses "Dawnbinder" and "Moonbinder"
            const nameMap = {
                'DawnCelestial': 'Dawnbinder',
                'MoonCelestial': 'Moonbinder'
            };
            const checkId = nameMap[itemId] || itemId;

            // Case-insensitive matching for seeds
            const normalizedItemId = normalizeSpeciesName(checkId);
            return notifications.watchedSeeds.some(watched =>
                normalizeSpeciesName(watched) === normalizedItemId
            );
        } else if (type === 'egg') {
            return notifications.watchedEggs.includes(itemId);
        }
        return false;
    }

    // Update last seen timestamp for an item
    function updateLastSeen(itemId) {
        const notifications = UnifiedState.data.settings.notifications;
        notifications.lastSeenTimestamps[itemId] = Date.now();
        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog(`📅 [NOTIFICATIONS] Updated last seen for ${itemId}`);
    }

    // Get time since last seen (in human readable format)
    function getTimeSinceLastSeen(itemId) {
        const notifications = UnifiedState.data.settings.notifications;

        // Map UI names to shop IDs for celestial seeds
        // UI shows "Moonbinder" but shop stores as "MoonCelestial"
        const reverseNameMap = {
            'Moonbinder': 'MoonCelestial',
            'Dawnbinder': 'DawnCelestial'
        };
        const lookupId = reverseNameMap[itemId] || itemId;

        const timestamp = notifications.lastSeenTimestamps[lookupId];
        if (!timestamp) return "Never seen";

        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Notification queue system for batching multiple notifications
    let notificationQueue = [];
    let currentNotificationModal = null;
    let notificationQueueTimer = null;
    const NOTIFICATION_BATCH_DELAY = 2000; // 2 seconds to batch notifications

    // Add notification to queue and show batched modal
    function queueNotification(message, requiresAcknowledgment = false) {
        notificationQueue.push({ message, requiresAcknowledgment, timestamp: Date.now() });

        // Clear existing timer and start new one
        if (notificationQueueTimer) {
            clearTimeout(notificationQueueTimer);
        }

        // If there's already a modal open, update it immediately
        if (currentNotificationModal) {
            updateNotificationModal();
            return;
        }

        // Otherwise, batch notifications for a short period
        notificationQueueTimer = setTimeout(() => {
            showBatchedNotificationModal();
        }, NOTIFICATION_BATCH_DELAY);
    }

    // Update existing notification modal with new notifications
    function updateNotificationModal() {
        if (!currentNotificationModal) return;

        const messageContainer = currentNotificationModal.querySelector('.notification-messages');
        if (messageContainer) {
            messageContainer.innerHTML = generateNotificationListHTML();
        }

        const countDisplay = currentNotificationModal.querySelector('.notification-count');
        if (countDisplay) {
            countDisplay.textContent = `${notificationQueue.length} Notification${notificationQueue.length > 1 ? 's' : ''}`;
        }
    }

    // Generate HTML for notification list
    function generateNotificationListHTML() {
        return notificationQueue.map((notif, index) => `
            <div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; border-left: 3px solid #fff;">
                <div style="font-size: 14px; margin-bottom: 5px;">${notif.message}</div>
                <div style="font-size: 10px; opacity: 0.8;">${new Date(notif.timestamp).toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    // Show batched notification modal
    function showBatchedNotificationModal() {
        if (notificationQueue.length === 0) return;

        // Ensure only one modal exists at a time - cleanup any existing modal
        if (currentNotificationModal) {
            dismissAllNotifications();
            // Wait a bit for the dismiss animation to complete
            setTimeout(() => showBatchedNotificationModal(), 350);
            return;
        }

        const hasAcknowledgmentRequired = notificationQueue.some(n => n.requiresAcknowledgment);

        // If only one notification and no acknowledgment required, use regular notification
        if (notificationQueue.length === 1 && !hasAcknowledgmentRequired) {
            const notif = notificationQueue[0];
            showVisualNotification(notif.message, notif.requiresAcknowledgment);
            notificationQueue = [];
            return;
        }

        // If multiple notifications but NONE require acknowledgment, show them as simple toasts
        if (!hasAcknowledgmentRequired) {
            // Show each notification as a simple non-blocking toast
            notificationQueue.forEach(notif => {
                showVisualNotification(notif.message, false);
            });
            notificationQueue = [];
            return;
        }

        // Create batched modal (only if acknowledgment is required)
        const notification = targetDocument.createElement('div');
        notification.className = 'mga-batched-notification';

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b 0%, #ff0000 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(255,0,0,0.4), 0 0 100px rgba(255,0,0,0.2);
            z-index: 9999999;
            font-weight: bold;
            animation: mga-modal-entrance 0.5s ease-out;
            border: 3px solid #ffffff;
            text-align: center;
            max-width: 500px;
            max-height: 400px;
            overflow-y: auto;
        `;

        notification.innerHTML = `
            <div class="notification-count" style="font-size: 20px; margin-bottom: 15px;">
                ${notificationQueue.length} Notification${notificationQueue.length > 1 ? 's' : ''}
            </div>
            <div class="notification-messages" style="text-align: left; margin-bottom: 20px; max-height: 200px; overflow-y: auto;">
                ${generateNotificationListHTML()}
            </div>
            <button class="acknowledge-all-btn" style="
                background: white;
                color: #ff0000;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                transition: all 0.2s;
            ">
                ACKNOWLEDGE ALL (${notificationQueue.length})
            </button>
        `;

        // Add button interactivity
        const ackButton = notification.querySelector('.acknowledge-all-btn');
        ackButton.onmouseover = () => {
            ackButton.style.transform = 'scale(1.05)';
            ackButton.style.boxShadow = '0 6px 15px rgba(0,0,0,0.4)';
        };
        ackButton.onmouseout = () => {
            ackButton.style.transform = 'scale(1)';
            ackButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        };
        ackButton.onclick = () => {
            dismissAllNotifications();
        };

        // Add backdrop
        const backdrop = targetDocument.createElement('div');
        backdrop.className = 'mga-notification-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999998;
            animation: fadeIn 0.3s ease-in;
        `;
        backdrop.onclick = () => {
            backdrop.style.animation = 'flash 0.3s ease-in-out';
        };

        targetDocument.body.appendChild(backdrop);
        targetDocument.body.appendChild(notification);

        currentNotificationModal = notification;

        // Stop continuous alarm if playing
        stopContinuousAlarm();
    }

    // Dismiss all notifications
    function dismissAllNotifications() {
        stopContinuousAlarm();

        if (currentNotificationModal) {
            const backdrop = targetDocument.querySelector('.mga-notification-backdrop');

            currentNotificationModal.style.animation = 'fadeOut 0.3s ease-out';
            if (backdrop) backdrop.style.animation = 'fadeOut 0.3s ease-out';

            setTimeout(() => {
                if (currentNotificationModal) currentNotificationModal.remove();
                if (backdrop) backdrop.remove();
                currentNotificationModal = null;
            }, 300);
        }

        notificationQueue = [];

        if (notificationQueueTimer) {
            clearTimeout(notificationQueueTimer);
            notificationQueueTimer = null;
        }
    }

    // Format timestamp based on user preference
    function formatTimestamp(timestamp) {
        // PERFORMANCE: Check cache first (cache key includes timestamp + settings mode)
        const cacheKey = `${timestamp}_${UnifiedState.data.settings.detailedTimestamps}`;
        if (MGA_AbilityCache.timestamps.has(cacheKey)) {
            return MGA_AbilityCache.timestamps.get(cacheKey);
        }

        const date = new Date(timestamp);
        let formatted;
        if (UnifiedState.data.settings.detailedTimestamps) {
            // Return HH:MM:SS format
            formatted = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else {
            // Return default H:MM AM/PM format
            formatted = date.toLocaleTimeString();
        }

        // PERFORMANCE: Cache result (cleared every minute via setInterval)
        MGA_AbilityCache.timestamps.set(cacheKey, formatted);

        return formatted;
    }

    // Show visual notification in game (legacy function, now routes through queue)
    function showVisualNotification(message, requiresAcknowledgment = false) {
        // Ensure only one modal exists at a time for acknowledgment-required notifications
        if (requiresAcknowledgment && currentNotificationModal) {
            dismissAllNotifications();
            // Wait a bit for the dismiss animation to complete
            setTimeout(() => showVisualNotification(message, requiresAcknowledgment), 350);
            return;
        }

        const notification = targetDocument.createElement('div');

        if (requiresAcknowledgment) {
            // Create persistent modal that requires acknowledgment
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ff6b6b 0%, #ff0000 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(255,0,0,0.4), 0 0 100px rgba(255,0,0,0.2);
                z-index: 9999999;
                font-weight: bold;
                font-size: 20px;
                animation: mga-modal-entrance 0.5s ease-out;
                border: 3px solid #ffffff;
                text-align: center;
                min-width: 400px;
            `;

            // Create message div
            const messageDiv = targetDocument.createElement('div');
            messageDiv.textContent = message;
            messageDiv.style.marginBottom = '20px';
            notification.appendChild(messageDiv);

            // Create acknowledge button
            const ackButton = targetDocument.createElement('button');
            ackButton.textContent = 'ACKNOWLEDGE (Stop Alarm)';
            ackButton.style.cssText = `
                background: white;
                color: #ff0000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                transition: all 0.2s;
            `;
            ackButton.onmouseover = () => {
                ackButton.style.transform = 'scale(1.05)';
                ackButton.style.boxShadow = '0 6px 15px rgba(0,0,0,0.4)';
            };
            ackButton.onmouseout = () => {
                ackButton.style.transform = 'scale(1)';
                ackButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            };
            ackButton.onclick = () => {
                stopContinuousAlarm();
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            };
            notification.appendChild(ackButton);

            // Add backdrop
            const backdrop = targetDocument.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999998;
                animation: fadeIn 0.3s ease-in;
            `;
            backdrop.onclick = () => {
                backdrop.style.animation = 'flash 0.3s ease-in-out';
            };
            targetDocument.body.appendChild(backdrop);

            // Append notification to body
            targetDocument.body.appendChild(notification);

            // Set as current modal for tracking
            currentNotificationModal = notification;

            // Link backdrop removal to button click
            ackButton.onclick = () => {
                stopContinuousAlarm();
                notification.style.animation = 'fadeOut 0.3s ease-out';
                backdrop.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    notification.remove();
                    backdrop.remove();
                    currentNotificationModal = null;
                }, 300);
            };

        } else {
            // Regular auto-dismiss notification
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 999999;
                font-weight: bold;
                font-size: 16px;
                animation: slideInRight 0.5s ease-out;
                border: 2px solid rgba(255,255,255,0.3);
            `;
            notification.textContent = message;

            // Remove after 5 seconds
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.5s ease-out';
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }

        // Add animation styles if not exists
        if (!targetDocument.getElementById('mga-notification-animations')) {
            const style = targetDocument.createElement('style');
            style.id = 'mga-notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                @keyframes mga-notification-pulse {
                    from { transform: translate(-50%, -50%) scale(1); }
                    to { transform: translate(-50%, -50%) scale(1.05); }
                }
                @keyframes mga-modal-entrance {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes flash {
                    0%, 100% { background: rgba(0, 0, 0, 0.7); }
                    50% { background: rgba(255, 0, 0, 0.3); }
                }
            `;
            targetDocument.head.appendChild(style);
        }

        targetDocument.body.appendChild(notification);
    }

    // Track current shop inventory and restock state
    let previousSeedInventory = [];
    let previousEggInventory = [];
    let previousDecorInventory = [];
    let previousSeedQuantities = {};
    let previousEggQuantities = {};
    let previousDecorQuantities = {};
    let lastRestockCheck = 0;
    let lastNotificationTime = 0;
    let lastSeedTimer = 999;
    let lastEggTimer = 999;
    let lastDecorTimer = 999;
    let lastSeedRestock = 0;
    let lastEggRestock = 0;
    let lastDecorRestock = 0;
    let seedRestockNotifiedItems = new Set(); // Track items notified during current restock
    let eggRestockNotifiedItems = new Set(); // Track items notified during current restock
    let decorRestockNotifiedItems = new Set(); // Track items notified during current restock
    let isFirstRun = true; // Track if this is the first check to notify for watched items already in stock
    const CHECK_INTERVAL = 2000; // Check every 2 seconds for better timing

    // Restock detection constants (same as Buy UI for maximum reliability)
    const SMALL_EDGE = 5;      // Timer at or below 5s means near restock
    const LARGE_EDGE = 180;    // Timer at or above 180s means just restocked
    const BIG_JUMP_DELTA = 60; // Timer jump of 60+ seconds indicates restock
    const NOTIFICATION_COOLDOWN = 30000; // 30 seconds between notifications for same item to prevent duplicates
    const RESTOCK_COOLDOWN = 30000; // 30 seconds cooldown after restock to catch all new items

    // Check for new watched items in shop
    function checkForWatchedItems() {
        const notifications = UnifiedState.data.settings.notifications;
        if (!notifications || !notifications.enabled) return;

        try {
            const now = Date.now();

            // Collect all detected items in this check cycle for batch notification
            const detectedItems = [];

            // Check every 5 seconds to catch items quickly
            if (now - lastRestockCheck < CHECK_INTERVAL) return;
            lastRestockCheck = now;

            // Get timer data - use both sources for reliability
            const quinoaData = UnifiedState.atoms.quinoaData || targetWindow?.globalShop;
            if (!quinoaData && !targetWindow?.globalShop) return; // No shop data available

            // Use targetWindow.globalShop as primary source, quinoaData as fallback
            const shopData = targetWindow?.globalShop || UnifiedState.atoms.quinoaData || quinoaData;
            const seedTimer = shopData?.shops?.seed?.secondsUntilRestock || 999;
            const eggTimer = shopData?.shops?.egg?.secondsUntilRestock || 999;
            const decorTimer = shopData?.shops?.decor?.secondsUntilRestock || 999;

            // Detect restock using robust edge-detection (same method as Buy UI)
            // Method 1: Timer was ≤5s and now ≥180s (actual reset moment)
            // Method 2: Timer jumped by ≥60s (big jump indicates restock)
            const seedRestocked =
                (lastSeedTimer <= SMALL_EDGE && seedTimer >= LARGE_EDGE) ||
                (seedTimer - lastSeedTimer >= BIG_JUMP_DELTA && lastSeedTimer > 0);

            const eggRestocked =
                (lastEggTimer <= SMALL_EDGE && eggTimer >= LARGE_EDGE) ||
                (eggTimer - lastEggTimer >= BIG_JUMP_DELTA && lastEggTimer > 0);

            const decorRestocked =
                (lastDecorTimer <= SMALL_EDGE && decorTimer >= LARGE_EDGE) ||
                (decorTimer - lastDecorTimer >= BIG_JUMP_DELTA && lastDecorTimer > 0);

            // Timer tracking (silent unless restock detected)

            if (seedRestocked) {
                productionLog(`🔄 [NOTIFICATIONS] SEED SHOP RESTOCKED! (Edge detection: ${lastSeedTimer}→${seedTimer})`);
                previousSeedInventory = []; // Clear for new cycle
                previousSeedQuantities = {}; // Clear quantity tracking
                seedRestockNotifiedItems.clear(); // Clear restock notification tracking
                lastSeedRestock = now;
            }

            if (eggRestocked) {
                productionLog(`🔄 [NOTIFICATIONS] EGG SHOP RESTOCKED! (Edge detection: ${lastEggTimer}→${eggTimer})`);
                previousEggInventory = []; // Clear for new cycle
                previousEggQuantities = {}; // Clear quantity tracking
                eggRestockNotifiedItems.clear(); // Clear restock notification tracking
                lastEggRestock = now;
            }

            if (decorRestocked) {
                productionLog(`🔄 [NOTIFICATIONS] DECOR SHOP RESTOCKED! (Edge detection: ${lastDecorTimer}→${decorTimer})`);
                previousDecorInventory = []; // Clear for new cycle
                previousDecorQuantities = {}; // Clear quantity tracking
                decorRestockNotifiedItems.clear(); // Clear restock notification tracking
                lastDecorRestock = now;
            }

            // Update last timer values
            lastSeedTimer = seedTimer;
            lastEggTimer = eggTimer;
            lastDecorTimer = decorTimer;

            // Check seed shop
            const currentSeeds = targetWindow?.globalShop?.shops?.seed?.inventory || [];
            const inStockSeeds = currentSeeds.filter(item => item.initialStock > 0);
            const currentSeedIds = inStockSeeds.map(item => item.species);

            // OPTIMIZED: Removed excessive debug logging

            // Track seed quantities (FIXED APPROACH)
            const currentSeedQuantities = {};
            inStockSeeds.forEach(item => {
                currentSeedQuantities[item.species] = item.initialStock;
            });

            // Initialize previous quantities if empty (first run)
            if (Object.keys(previousSeedQuantities).length === 0 && !seedRestocked) {
                productionLog(`🔧 [NOTIFICATIONS] Initializing previous seed quantities...`);
                Object.keys(currentSeedQuantities).forEach(seedId => {
                    previousSeedQuantities[seedId] = currentSeedQuantities[seedId];
                });
            }

            productionLog(`🛒 [NOTIFICATIONS] Current seed quantities:`, currentSeedQuantities, `| Previous:`, previousSeedQuantities);

            // Find seeds with increased quantities or new items (after restock)
            Object.keys(currentSeedQuantities).forEach(seedId => {
                const oldQuantity = previousSeedQuantities[seedId] || 0;
                const newQuantity = currentSeedQuantities[seedId];

                // Always log each seed being processed for debugging
                productionLog(`🔍 [NOTIFICATIONS] Processing seed: ${seedId} (${oldQuantity}→${newQuantity})`);

                // Determine if we should check for notification
                const quantityIncreased = newQuantity > oldQuantity;
                const isRestockWindow = seedRestocked && (now - lastSeedRestock) < RESTOCK_COOLDOWN;
                const alreadyNotifiedInRestock = seedRestockNotifiedItems.has(seedId);

                productionLog(`🔍 [NOTIFICATIONS] ${seedId} check logic: quantityIncreased=${quantityIncreased}, isRestockWindow=${isRestockWindow}, alreadyNotifiedInRestock=${alreadyNotifiedInRestock}`);

                // Only trigger notification if:
                // 1) First run and item is in stock, OR
                // 2) Quantity increased AND not in restock window, OR
                // 3) In restock window AND item hasn't been notified in this restock cycle, OR
                // 4) New item appears (oldQuantity was 0)
                const shouldCheck = (isFirstRun && newQuantity > 0) || (quantityIncreased && !isRestockWindow) || (isRestockWindow && !alreadyNotifiedInRestock) || (oldQuantity === 0 && newQuantity > 0);

                productionLog(`🔍 [NOTIFICATIONS] ${seedId} shouldCheck: ${shouldCheck}`);

                if (shouldCheck) {
                    productionLog(`🆕 [NOTIFICATIONS] Seed stock change: ${seedId} (${oldQuantity}→${newQuantity}) | Restock: ${seedRestocked} | RestockWindow: ${isRestockWindow}`);

                    // Update last seen for ANY seed that appears or increases
                    updateLastSeen(seedId);

                    // Check if it's a watched seed with detailed logging
                    const isWatched = isWatchedItem(seedId, 'seed');
                    productionLog(`🔍 [NOTIFICATIONS] Is ${seedId} watched? ${isWatched}`);
                    productionLog(`🔍 [NOTIFICATIONS] Watched list: [${notifications.watchedSeeds.join(', ')}]`);
                    productionLog(`🔍 [NOTIFICATIONS] Exact match check:`, notifications.watchedSeeds.map(w => ({
                        watched: w,
                        current: seedId,
                        exactMatch: w === seedId,
                        lowerMatch: w.toLowerCase() === seedId.toLowerCase()
                    })));

                    if (isWatched) {
                        // Check cooldown (1 minute per item, but allow Carrot for testing)
                        const itemKey = `seed_${seedId}`;
                        const lastNotified = notifications.lastSeenTimestamps[`notified_${itemKey}`] || 0;
                        const canNotify = (now - lastNotified) > NOTIFICATION_COOLDOWN;

                        productionLog(`🔍 [NOTIFICATIONS] ${seedId} cooldown check: lastNotified=${lastNotified}, now=${now}, diff=${now-lastNotified}, canNotify=${canNotify}`);

                        if (canNotify) {
                            productionLog(`🎉 [NOTIFICATIONS] RARE SEED DETECTED: ${seedId} (${newQuantity} in stock)`);
                            notifications.lastSeenTimestamps[`notified_${itemKey}`] = now;

                            // Track that we notified this item during restock
                            if (isRestockWindow) {
                                seedRestockNotifiedItems.add(seedId);
                            }

                            MGA_saveJSON('MGA_data', UnifiedState.data);

                            // Collect item for batch notification instead of notifying immediately
                            detectedItems.push({
                                type: 'seed',
                                id: seedId,
                                quantity: newQuantity,
                                icon: '🌱'
                            });
                        } else {
                            productionLog(`⏰ [NOTIFICATIONS] ${seedId} on cooldown, not notifying`);
                        }
                    } else {
                        productionLog(`❌ [NOTIFICATIONS] ${seedId} is not watched, skipping notification`);
                    }
                } else {
                    productionLog(`⏭️ [NOTIFICATIONS] ${seedId} shouldCheck=false, skipping`);
                }
            });

            productionLog(`✅ [NOTIFICATIONS] Finished checking seeds, moving to eggs...`);

            // Check egg shop
            // Declare variables OUTSIDE try block to fix scope issue
            let currentEggIds = [];
            let currentEggQuantities = {};

            try {
                productionLog(`🥚 [NOTIFICATIONS] === CHECKING EGG SHOP ===`);
                const currentEggs = targetWindow?.globalShop?.shops?.egg?.inventory || [];
                const inStockEggs = currentEggs.filter(item => item.initialStock > 0);
                currentEggIds = inStockEggs.map(item => item.eggId);

            // Always log current egg state for debugging (like seeds)
            productionLog(`🥚 [NOTIFICATIONS] Current eggs in shop: [${currentEggIds.join(', ')}] | Previous: [${previousEggInventory.join(', ')}]`);
            productionLog(`🥚 [NOTIFICATIONS] Raw egg inventory:`, currentEggs.map(e => `${e.eggId}(stock:${e.initialStock})`));

            // Debug egg shop structure
            if (currentEggs.length === 0) {
                productionLog(`🥚 [NOTIFICATIONS] No eggs found. Shop structure:`, {
                    hasGlobalShop: !!targetWindow?.globalShop,
                    hasShops: !!targetWindow?.globalShop?.shops,
                    hasEggShop: !!targetWindow?.globalShop?.shops?.egg,
                    hasEggInventory: !!targetWindow?.globalShop?.shops?.egg?.inventory,
                    eggInventoryLength: targetWindow?.globalShop?.shops?.egg?.inventory?.length || 0
                });
            }

            // Track egg quantities (FIXED APPROACH)
            // Use the variable declared outside try block
            inStockEggs.forEach(item => {
                currentEggQuantities[item.eggId] = item.initialStock;
            });

            // Initialize previous quantities if empty (first run)
            if (Object.keys(previousEggQuantities).length === 0 && !eggRestocked) {
                productionLog(`🔧 [NOTIFICATIONS] Initializing previous egg quantities...`);
                Object.keys(currentEggQuantities).forEach(eggId => {
                    previousEggQuantities[eggId] = currentEggQuantities[eggId];
                });
            }

            productionLog(`🥚 [NOTIFICATIONS] Current egg quantities:`, currentEggQuantities, `| Previous:`, previousEggQuantities);

            // Find eggs with increased quantities or new items (after restock)
            Object.keys(currentEggQuantities).forEach(eggId => {
                const oldQuantity = previousEggQuantities[eggId] || 0;
                const newQuantity = currentEggQuantities[eggId];

                // Always log each egg being processed for debugging (like seeds)
                productionLog(`🔍 [NOTIFICATIONS] Processing egg: ${eggId} (${oldQuantity}→${newQuantity})`);

                // Determine if we should check for notification
                const quantityIncreased = newQuantity > oldQuantity;
                const isRestockWindow = eggRestocked && (now - lastEggRestock) < RESTOCK_COOLDOWN;
                const alreadyNotifiedInRestock = eggRestockNotifiedItems.has(eggId);

                productionLog(`🔍 [NOTIFICATIONS] ${eggId} check logic: quantityIncreased=${quantityIncreased}, isRestockWindow=${isRestockWindow}, alreadyNotifiedInRestock=${alreadyNotifiedInRestock}`);

                // Only trigger notification if:
                // 1) First run and item is in stock, OR
                // 2) Quantity increased AND not in restock window, OR
                // 3) In restock window AND item hasn't been notified in this restock cycle, OR
                // 4) New item appears (oldQuantity was 0)
                const shouldCheck = (isFirstRun && newQuantity > 0) || (quantityIncreased && !isRestockWindow) || (isRestockWindow && !alreadyNotifiedInRestock) || (oldQuantity === 0 && newQuantity > 0);

                productionLog(`🔍 [NOTIFICATIONS] ${eggId} shouldCheck: ${shouldCheck}`);

                if (shouldCheck) {
                    productionLog(`🆕 [NOTIFICATIONS] Egg stock change: ${eggId} (${oldQuantity}→${newQuantity}) | Restock: ${eggRestocked} | RestockWindow: ${isRestockWindow}`);

                    // Update last seen for ANY egg that appears or increases
                    updateLastSeen(eggId);

                    // Check if it's a watched egg with detailed logging
                    const isWatched = isWatchedItem(eggId, 'egg');
                    productionLog(`🔍 [NOTIFICATIONS] Is ${eggId} watched? ${isWatched}`);
                    productionLog(`🔍 [NOTIFICATIONS] Watched list: [${notifications.watchedEggs.join(', ')}]`);
                    productionLog(`🔍 [NOTIFICATIONS] Exact match check:`, notifications.watchedEggs.map(w => ({
                        watched: w,
                        current: eggId,
                        exactMatch: w === eggId,
                        lowerMatch: w.toLowerCase() === eggId.toLowerCase()
                    })));

                    if (isWatched) {
                        // Check cooldown (1 minute per item, allow MythicalEgg/CommonEgg for testing)
                        const itemKey = `egg_${eggId}`;
                        const lastNotified = notifications.lastSeenTimestamps[`notified_${itemKey}`] || 0;
                        const canNotify = (now - lastNotified) > NOTIFICATION_COOLDOWN;

                        if (canNotify) {
                            productionLog(`🎉 [NOTIFICATIONS] RARE EGG DETECTED: ${eggId} (${newQuantity} in stock)`);
                            notifications.lastSeenTimestamps[`notified_${itemKey}`] = now;

                            // Track that we notified this item during restock
                            if (isRestockWindow) {
                                eggRestockNotifiedItems.add(eggId);
                            }

                            MGA_saveJSON('MGA_data', UnifiedState.data);

                            // Collect item for batch notification instead of notifying immediately
                            detectedItems.push({
                                type: 'egg',
                                id: eggId,
                                quantity: newQuantity,
                                icon: '🥚'
                            });
                        } else {
                            productionLog(`⏰ [NOTIFICATIONS] ${eggId} on cooldown, not notifying`);
                        }
                    } else {
                        productionLog(`❌ [NOTIFICATIONS] ${eggId} is not watched, skipping notification`);
                    }
                } else {
                    productionLog(`⏭️ [NOTIFICATIONS] ${eggId} shouldCheck=false, skipping`);
                }
            });

            productionLog(`✅ [NOTIFICATIONS] Finished checking all eggs`);

                // Update egg inventory and quantities INSIDE try block
                // CRITICAL FIX: Create copies instead of reference assignment
                previousEggInventory = [...currentEggIds];
                previousEggQuantities = {...currentEggQuantities};

            } catch (eggError) {
                console.error(`❌ [NOTIFICATIONS] Error checking eggs:`, eggError);
            }

            productionLog(`✅ [NOTIFICATIONS] Finished checking eggs, moving to decor...`);

            // Check decor shop (hourly resets)
            let currentDecorIds = [];
            let currentDecorQuantities = {};

            try {
                // Ensure watchedDecor exists (backwards compatibility)
                if (!notifications.watchedDecor) {
                    notifications.watchedDecor = [];
                }

                productionLog(`🎨 [NOTIFICATIONS] === CHECKING DECOR SHOP ===`);
                const currentDecor = targetWindow?.globalShop?.shops?.decor?.inventory || [];
                const inStockDecor = currentDecor.filter(item => item.initialStock > 0);
                currentDecorIds = inStockDecor.map(item => item.decorId);

                // Always log current decor state for debugging
                productionLog(`🎨 [NOTIFICATIONS] Current decor in shop: [${currentDecorIds.join(', ')}] | Previous: [${previousDecorInventory.join(', ')}]`);
                productionLog(`🎨 [NOTIFICATIONS] Raw decor inventory:`, currentDecor.map(d => `${d.decorId}(stock:${d.initialStock})`));

                // Debug decor shop structure
                if (currentDecor.length === 0) {
                    productionLog(`🎨 [NOTIFICATIONS] No decor found. Shop structure:`, {
                        hasGlobalShop: !!targetWindow?.globalShop,
                        hasShops: !!targetWindow?.globalShop?.shops,
                        hasDecorShop: !!targetWindow?.globalShop?.shops?.decor,
                        hasDecorInventory: !!targetWindow?.globalShop?.shops?.decor?.inventory,
                        decorInventoryLength: targetWindow?.globalShop?.shops?.decor?.inventory?.length || 0
                    });
                }

                // Track decor quantities
                inStockDecor.forEach(item => {
                    currentDecorQuantities[item.decorId] = item.initialStock;
                });

                // Initialize previous quantities if empty (first run)
                if (Object.keys(previousDecorQuantities).length === 0 && !decorRestocked) {
                    productionLog(`🔧 [NOTIFICATIONS] Initializing previous decor quantities...`);
                    Object.keys(currentDecorQuantities).forEach(decorId => {
                        previousDecorQuantities[decorId] = currentDecorQuantities[decorId];
                    });
                }

                productionLog(`🎨 [NOTIFICATIONS] Current decor quantities:`, currentDecorQuantities, `| Previous:`, previousDecorQuantities);

                // Find decor with increased quantities or new items (after restock)
                Object.keys(currentDecorQuantities).forEach(decorId => {
                    const oldQuantity = previousDecorQuantities[decorId] || 0;
                    const newQuantity = currentDecorQuantities[decorId];

                    // Always log each decor being processed for debugging
                    productionLog(`🔍 [NOTIFICATIONS] Processing decor: ${decorId} (${oldQuantity}→${newQuantity})`);

                    // Determine if we should check for notification
                    const quantityIncreased = newQuantity > oldQuantity;
                    const isRestockWindow = decorRestocked && (now - lastDecorRestock) < RESTOCK_COOLDOWN;
                    const alreadyNotifiedInRestock = decorRestockNotifiedItems.has(decorId);

                    productionLog(`🔍 [NOTIFICATIONS] ${decorId} check logic: quantityIncreased=${quantityIncreased}, isRestockWindow=${isRestockWindow}, alreadyNotifiedInRestock=${alreadyNotifiedInRestock}`);

                    const shouldCheck = (isFirstRun && newQuantity > 0) || (quantityIncreased && !isRestockWindow) || (isRestockWindow && !alreadyNotifiedInRestock) || (oldQuantity === 0 && newQuantity > 0);

                    productionLog(`🔍 [NOTIFICATIONS] ${decorId} shouldCheck: ${shouldCheck}`);

                    if (shouldCheck) {
                        productionLog(`🆕 [NOTIFICATIONS] Decor stock change: ${decorId} (${oldQuantity}→${newQuantity}) | Restock: ${decorRestocked} | RestockWindow: ${isRestockWindow}`);

                        // Update last seen for ANY decor that appears or increases
                        updateLastSeen(decorId);

                        // Check if it's a watched decor item
                        const isWatched = isWatchedItem(decorId, 'decor');
                        productionLog(`🔍 [NOTIFICATIONS] Is ${decorId} watched? ${isWatched}`);
                        productionLog(`🔍 [NOTIFICATIONS] Watched list: [${notifications.watchedDecor.join(', ')}]`);

                        if (isWatched) {
                            // Check cooldown (1 minute per item)
                            const itemKey = `decor_${decorId}`;
                            const lastNotified = notifications.lastSeenTimestamps[`notified_${itemKey}`] || 0;
                            const canNotify = (now - lastNotified) > NOTIFICATION_COOLDOWN;

                            if (canNotify) {
                                productionLog(`🎉 [NOTIFICATIONS] WATCHED DECOR DETECTED: ${decorId} (${newQuantity} in stock)`);
                                notifications.lastSeenTimestamps[`notified_${itemKey}`] = now;

                                // Track that we notified this item during restock
                                if (isRestockWindow) {
                                    decorRestockNotifiedItems.add(decorId);
                                }

                                MGA_saveJSON('MGA_data', UnifiedState.data);

                                // Collect item for batch notification
                                detectedItems.push({
                                    type: 'decor',
                                    id: decorId,
                                    quantity: newQuantity,
                                    icon: '🎨'
                                });
                            } else {
                                productionLog(`⏰ [NOTIFICATIONS] ${decorId} on cooldown, not notifying`);
                            }
                        } else {
                            productionLog(`❌ [NOTIFICATIONS] ${decorId} is not watched, skipping notification`);
                        }
                    } else {
                        productionLog(`⏭️ [NOTIFICATIONS] ${decorId} shouldCheck=false, skipping`);
                    }
                });

                productionLog(`✅ [NOTIFICATIONS] Finished checking all decor`);

                // Update decor inventory and quantities
                previousDecorInventory = [...currentDecorIds];
                previousDecorQuantities = {...currentDecorQuantities};

            } catch (decorError) {
                console.error(`❌ [NOTIFICATIONS] Error checking decor:`, decorError);
            }

            // Process batch notifications if any items were detected
            if (detectedItems.length > 0) {
                productionLog(`🎉 [NOTIFICATIONS] Batch detected: ${detectedItems.length} items`);

                // Play notification sound once for all items
                playSelectedNotification();

                // Create notification message based on number of items
                let notificationMessage;
                if (detectedItems.length === 1) {
                    const item = detectedItems[0];
                    notificationMessage = `${item.icon} Rare ${item.type} in shop: ${item.id}! (${item.quantity} available)`;
                } else {
                    notificationMessage = `🎉 Multiple items in stock:\n`;
                    detectedItems.forEach(item => {
                        notificationMessage += `${item.icon} ${item.id} (${item.quantity} available)\n`;
                    });
                }

                // Queue the batch notification
                queueNotification(notificationMessage.trim(), notifications.requiresAcknowledgment);
                productionLog(`📢 [NOTIFICATIONS] Batched notification sent for ${detectedItems.length} items`);
            }

            // Update previous seed inventory and quantities (seeds already succeeded if we got here)
            // CRITICAL FIX: Create copies instead of reference assignment
            previousSeedInventory = [...currentSeedIds];
            previousSeedQuantities = {...currentSeedQuantities};

            // Clear first run flag after first check completes
            if (isFirstRun) {
                productionLog(`✅ [NOTIFICATIONS] First run complete - will now only notify on changes`);
                isFirstRun = false;
            }

        } catch (error) {
            console.error('❌ [NOTIFICATIONS] Error checking for watched items:', error);
            console.error('Stack trace:', error.stack);
            // Don't let errors stop the notification system - it will try again next interval
        }
    }

    // ==================== EVENT-DRIVEN SHOP MONITORING ====================

    let shopWatcherInitialized = false;

    function initializeShopWatcher() {
        if (shopWatcherInitialized) return;

        productionLog('🔄 [SHOP-WATCHER] Initializing event-driven shop monitoring...');

        // Try to find and watch globalShop
        function watchShopData() {
            if (!targetWindow.globalShop) {
                productionWarn('⚠️ [SHOP-WATCHER] globalShop not found, will retry...');
                setTimeout(watchShopData, 5000);
                return;
            }

            productionLog('✅ [SHOP-WATCHER] Found globalShop, setting up watchers...');

            // Store original shop data
            let lastSeedData = JSON.stringify(targetWindow.globalShop?.shops?.seed || {});
            let lastEggData = JSON.stringify(targetWindow.globalShop?.shops?.egg || {});
            let lastDecorData = JSON.stringify(targetWindow.globalShop?.shops?.decor || {});

            // Create a proxy to intercept shop updates
            if (targetWindow.globalShop && targetWindow.globalShop.shops) {
                try {
                    const originalShops = targetWindow.globalShop.shops;

                    // Create proxies for seed, egg, and decor shops
                    const shopProxy = new Proxy(originalShops, {
                        set(target, property, value) {
                            const result = Reflect.set(target, property, value);

                            // Check if seed, egg, or decor shop data changed
                            if (property === 'seed') {
                                const newData = JSON.stringify(value);
                                if (newData !== lastSeedData) {
                                    productionLog('🔄 [SHOP-WATCHER] Seed shop data changed!');
                                    lastSeedData = newData;
                                    // Trigger immediate check
                                    setTimeout(() => checkForWatchedItems(), 0);
                                }
                            } else if (property === 'egg') {
                                const newData = JSON.stringify(value);
                                if (newData !== lastEggData) {
                                    productionLog('🔄 [SHOP-WATCHER] Egg shop data changed!');
                                    lastEggData = newData;
                                    // Trigger immediate check
                                    setTimeout(() => checkForWatchedItems(), 0);
                                }
                            } else if (property === 'decor') {
                                const newData = JSON.stringify(value);
                                if (newData !== lastDecorData) {
                                    productionLog('🔄 [SHOP-WATCHER] Decor shop data changed!');
                                    lastDecorData = newData;
                                    // Trigger immediate check
                                    setTimeout(() => checkForWatchedItems(), 0);
                                }
                            }

                            return result;
                        }
                    });

                    // Replace the shops object with our proxy
                    targetWindow.globalShop.shops = shopProxy;
                    productionLog('✅ [SHOP-WATCHER] Shop proxy installed successfully');

                } catch(e) {
                    productionWarn('⚠️ [SHOP-WATCHER] Could not create proxy:', e);
                    // Fall back to polling if proxy fails
                }
            }

            // Also watch for complete globalShop replacement
            let globalShopDescriptor = Object.getOwnPropertyDescriptor(targetWindow, 'globalShop');
            if (!globalShopDescriptor || globalShopDescriptor.configurable !== false) {
                Object.defineProperty(targetWindow, 'globalShop', {
                    get() {
                        return this._globalShop;
                    },
                    set(newValue) {
                        productionLog('🔄 [SHOP-WATCHER] globalShop replaced entirely!');
                        this._globalShop = newValue;

                        // Re-initialize watchers for the new shop
                        shopWatcherInitialized = false;
                        setTimeout(() => initializeShopWatcher(), 100);

                        // Trigger immediate check
                        setTimeout(() => checkForWatchedItems(), 0);
                    },
                    configurable: true
                });

                // Set initial value
                targetWindow._globalShop = targetWindow.globalShop;
                productionLog('✅ [SHOP-WATCHER] globalShop setter installed');
            }

            shopWatcherInitialized = true;
        }

        // Start watching
        watchShopData();

        // DISABLED: MutationObserver causes severe FPS lag - relying on Proxy and polling only
        // if (typeof MutationObserver !== 'undefined') {
        //     const observer = new MutationObserver((mutations) => {
        //         for (const mutation of mutations) {
        //             if (mutation.target.classList?.contains('shop') ||
        //                 mutation.target.id?.includes('shop') ||
        //                 mutation.target.textContent?.includes('Restock')) {
        //                 productionLog('🔄 [SHOP-WATCHER] Shop DOM changed, checking items...');
        //                 setTimeout(() => checkForWatchedItems(), 100);
        //                 break;
        //             }
        //         }
        //     });
        //     const gameContainer = targetDocument.querySelector('#game-container, .game-wrapper, body');
        //     if (gameContainer) {
        //         observer.observe(gameContainer, { childList: true, subtree: true, characterData: true });
        //     }
        // }
    }

    // ==================== PET HUNGER MONITORING ====================

    // Species max hunger values from wiki
    // Source: https://magicgarden.fandom.com/wiki/Pets
    const SPECIES_MAX_HUNGER = {
        'Worm': 500,
        'Snail': 1000,
        'Bee': 1500,
        'Chicken': 3000,
        'Bunny': 750,
        'Dragonfly': 250,
        'Pig': 50000,
        'Cow': 25000,
        'Turtle': 100000,
        'Goat': 20000,
        'Squirrel': 15000,
        'Capybara': 150000,
        'Butterfly': 25000,
        'Peacock': 100000
    };

    // Per-species hunger depletion times (milliseconds from full to 0)
    // Source: https://magicgarden.fandom.com/wiki/Pets
    const SPECIES_HUNGER_DEPLETION_TIME = {
        'Worm': 30 * 60 * 1000,
        'Snail': 60 * 60 * 1000,
        'Bee': 15 * 60 * 1000,
        'Chicken': 60 * 60 * 1000,
        'Bunny': 45 * 60 * 1000,
        'Dragonfly': 15 * 60 * 1000,
        'Pig': 60 * 60 * 1000,
        'Cow': 75 * 60 * 1000,
        'Turtle': 90 * 60 * 1000,
        'Goat': 60 * 60 * 1000,
        'Squirrel': 30 * 60 * 1000,
        'Capybara': 60 * 60 * 1000,
        'Butterfly': 30 * 60 * 1000,
        'Peacock': 60 * 60 * 1000
    };

    const HUNGER_BOOST_VALUES = {
        'Hunger Boost I': 0.12,   // 12% reduction per 100 STR
        'Hunger Boost II': 0.16   // 16% reduction per 100 STR
    };

    // Track previous hunger states for each pet
    let lastPetHungerStates = {};
    let petHungerLastAlertTime = {}; // BUGFIX: Track when we last alerted per pet (timestamp) for time-based throttle

    function checkPetHunger() {
        if (!UnifiedState.data.settings.notifications.petHungerEnabled) return;

        try {
            // BUGFIX: Use window.activePets which has the REAL atom data with full hunger values
            // UnifiedState.atoms.activePets might be stale or incomplete
            const activePets = window.activePets || UnifiedState.atoms.activePets || [];
            // Threshold is a PERCENTAGE (0-100)
            // Default: 25 = alert when pet drops below 25% full
            const thresholdPercent = UnifiedState.data.settings.notifications.petHungerThreshold || 25;

            activePets.forEach((pet) => {
                if (!pet || !pet.id) return;

                // BUGFIX: Check if hunger data exists before processing
                const currentHunger = pet.hunger !== undefined ? Number(pet.hunger) : null;
                if (currentHunger === null || isNaN(currentHunger)) {
                    productionLog(`⚠️ [PET-HUNGER] ${pet.petSpecies || 'Pet'} has no hunger data - skipping`);
                    return; // Skip this pet if no hunger data
                }

                const petName = pet.petSpecies || 'Pet';

                // BUGFIX: Different species have different max hunger values
                // Source: https://magicgarden.fandom.com/wiki/Pets
                // Lower hunger = hungrier (inverse system!)
                const estimatedMaxHunger = SPECIES_MAX_HUNGER[pet.petSpecies] || 100000;

                // Calculate percentage based on species max
                const hungerPercent = (currentHunger / estimatedMaxHunger) * 100;

                // Get previous hunger percentage for comparison
                const lastHunger = lastPetHungerStates[pet.id] ?? currentHunger;
                const lastPercent = (lastHunger / estimatedMaxHunger) * 100;

                // BUGFIX: Time-based throttle instead of boolean flag to allow re-alerting
                const ALERT_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes between alerts
                const now = Date.now();
                const lastAlertTime = petHungerLastAlertTime[pet.id] || 0;
                const timeSinceLastAlert = now - lastAlertTime;

                // Debug logging (only when enabled)
                if (UnifiedState.data.settings?.debugMode) {
                    productionLog(`🐾 [PET-HUNGER-DEBUG] ${petName} (ID: ${pet.id}): ${hungerPercent.toFixed(1)}% (hunger=${currentHunger}/${estimatedMaxHunger}), threshold=${thresholdPercent}%, lastPercent=${lastPercent.toFixed(1)}%, timeSinceLastAlert=${(timeSinceLastAlert/1000).toFixed(0)}s`);
                }

                // Critical thresholds that alert every 1 minute (more urgent than normal 5 min throttle)
                const CRITICAL_THROTTLE_MS = 60 * 1000; // 1 minute for critical alerts
                const isCritical = hungerPercent <= 1;
                const criticalNeedsAlert = isCritical && (timeSinceLastAlert >= CRITICAL_THROTTLE_MS || !lastAlertTime);

                // Alert if below threshold and enough time has passed since last alert
                const needsAlert = hungerPercent < thresholdPercent && hungerPercent > 1 &&
                                  (timeSinceLastAlert >= ALERT_THROTTLE_MS || !lastAlertTime);

                // Also alert if hunger DROPPED below threshold since last check (crossing behavior)
                const justCrossed = hungerPercent < thresholdPercent && lastPercent >= thresholdPercent;

                if (needsAlert || justCrossed || criticalNeedsAlert) {
                    const reason = isCritical ? 'CRITICAL hunger level' :
                                  justCrossed ? 'crossed threshold' :
                                  'below threshold (throttle expired)';
                    productionLog(`🐾 [PET-HUNGER] ${petName} is getting hungry! (${hungerPercent.toFixed(1)}% < ${thresholdPercent}%) - Reason: ${reason}`);

                    // Play different sound for pet hunger
                    const volume = UnifiedState.data.settings.notifications.volume || 0.3;
                    playDoubleBeepNotification(volume);

                    // Show visual notification with percentage
                    showNotificationToast(`⚠️ ${petName} needs feeding! Only ${Math.round(hungerPercent)}% full`, 'warning');

                    // Update last alert timestamp
                    petHungerLastAlertTime[pet.id] = now;
                }

                // Reset alert timestamp if pet is fed above threshold (allows immediate alert on next drop)
                if (hungerPercent >= thresholdPercent && lastAlertTime > 0) {
                    delete petHungerLastAlertTime[pet.id];
                    if (UnifiedState.data.settings?.debugMode) {
                        productionLog(`🐾 [PET-HUNGER-DEBUG] ${petName} fed above threshold, reset alert timer`);
                    }
                }

                // Store hunger value for next comparison
                lastPetHungerStates[pet.id] = currentHunger;
            });
        } catch (error) {
            console.error('❌ [PET-HUNGER] Error checking pet hunger:', error);
        }
    }

    // BUGFIX: Scan all active pets and alert for any currently below threshold
    // This is called when user enables pet hunger alerts
    function scanAndAlertHungryPets() {
        if (!UnifiedState.data.settings.notifications.petHungerEnabled) return;

        try {
            // BUGFIX: Use window.activePets which has the REAL atom data with full hunger values
            const activePets = window.activePets || UnifiedState.atoms.activePets || [];
            const thresholdPercent = UnifiedState.data.settings.notifications.petHungerThreshold || 25;
            const MAX_HUNGER = 100000;
            const now = Date.now();

            let hungryCount = 0;

            activePets.forEach((pet) => {
                if (!pet || !pet.id) return;

                // BUGFIX: Check if hunger data exists before processing
                const currentHunger = pet.hunger !== undefined ? Number(pet.hunger) : null;
                if (currentHunger === null || isNaN(currentHunger)) {
                    productionLog(`⚠️ [PET-HUNGER] ${pet.petSpecies || 'Pet'} has no hunger data in scan - skipping`);
                    return; // Skip this pet if no hunger data
                }

                // BUGFIX: Different species have different max hunger values
                // Source: https://magicgarden.fandom.com/wiki/Pets
                const estimatedMaxHunger = SPECIES_MAX_HUNGER[pet.petSpecies] || 100000;
                const hungerPercent = (currentHunger / estimatedMaxHunger) * 100;
                const petName = pet.petSpecies || 'Pet';

                // Alert for any pet currently below threshold
                if (hungerPercent < thresholdPercent) {
                    hungryCount++;
                    productionLog(`🐾 [PET-HUNGER] Initial scan: ${petName} needs feeding! (${hungerPercent.toFixed(1)}% < ${thresholdPercent}%)`);

                    // Show notification for this pet
                    showNotificationToast(`⚠️ ${petName} needs feeding! Only ${Math.round(hungerPercent)}% full`, 'warning');

                    // Mark with timestamp to enable time-based throttle
                    petHungerLastAlertTime[pet.id] = now;
                    lastPetHungerStates[pet.id] = currentHunger;
                }
            });

            if (hungryCount > 0) {
                // Play sound once for all hungry pets
                const volume = UnifiedState.data.settings.notifications.volume || 0.3;
                playDoubleBeepNotification(volume);
                productionLog(`🐾 [PET-HUNGER] Initial scan found ${hungryCount} hungry pet(s)`);
            } else {
                productionLog(`🐾 [PET-HUNGER] Initial scan: All pets are well-fed`);
            }
        } catch (error) {
            console.error('❌ [PET-HUNGER] Error scanning for hungry pets:', error);
        }
    }

    // Calculate time until pet becomes hungry (returns milliseconds)
    function calculateTimeUntilHungry(pet) {
        if (!pet || typeof pet.hunger === 'undefined') return null;

        const currentHunger = Number(pet.hunger) || 0;
        const maxHunger = SPECIES_MAX_HUNGER[pet.petSpecies] || 100000;
        const baseDepletionTime = SPECIES_HUNGER_DEPLETION_TIME[pet.petSpecies] || 60 * 60 * 1000;

        // If already hungry, return 0
        if (currentHunger <= 0) return 0;

        // Calculate total hunger reduction from all pets' Hunger Boost abilities
        let totalHungerReduction = 0;
        const activePets = window.activePets || UnifiedState.atoms.activePets || [];

        // DEBUG: Log active pets and their abilities (using console.log to bypass PRODUCTION mode)
        if (UnifiedState.data.settings?.debugMode) {
            console.log('🍖 [HUNGER-CALC] Calculating for pet:', pet.petSpecies);
            console.log('🍖 [HUNGER-CALC] Active pets:', activePets.length);
            activePets.forEach((p, i) => {
                console.log(`🍖 [HUNGER-CALC] Pet ${i}:`, {
                    species: p.petSpecies,
                    abilities: p.abilities,
                    strength: p.strength,
                    str: p.str
                });
            });
        }

        activePets.forEach(p => {
            if (p.abilities && Array.isArray(p.abilities)) {
                p.abilities.forEach(ability => {
                    if (UnifiedState.data.settings?.debugMode) {
                        console.log('🍖 [HUNGER-CALC] Checking ability:', ability);
                    }
                    // Ability can be either a string directly or an object with properties
                    const abilityType = typeof ability === 'string' ? ability : (ability.abilityType || ability.type || ability);
                    if (typeof abilityType === 'string') {
                        // Check for both "Hunger Boost" (with space) and "HungerBoost" (without space)
                        if (abilityType.includes('HungerBoost') || abilityType.includes('Hunger Boost')) {
                            // Hunger Boost I = 12% per 100 STR, Hunger Boost II = 16% per 100 STR
                            const reduction = abilityType.includes('II') ? HUNGER_BOOST_VALUES['Hunger Boost II'] : HUNGER_BOOST_VALUES['Hunger Boost I'];
                            const strength = (p.strength || p.str || 100) / 100;
                            totalHungerReduction += reduction * strength;

                            if (UnifiedState.data.settings?.debugMode) {
                                console.log(`🍖 [HUNGER-CALC] Found ${abilityType} on ${p.petSpecies}, STR: ${p.strength || p.str}, reduction: ${reduction}, strength mult: ${strength}`);
                            }
                        }
                    }
                });
            }
        });

        if (UnifiedState.data.settings?.debugMode && totalHungerReduction > 0) {
            console.log(`🍖 [HUNGER-CALC] Total hunger reduction: ${(totalHungerReduction * 100).toFixed(1)}%`);
        }

        // Cap reduction at 90% to avoid division by zero
        totalHungerReduction = Math.min(totalHungerReduction, 0.9);

        // Calculate time remaining: baseTime / (1 - reductions) * (current/max)
        const timeRemaining = (baseDepletionTime / Math.max(0.1, 1 - totalHungerReduction)) * (currentHunger / maxHunger);

        return Math.max(0, Math.round(timeRemaining));
    }

    // Format milliseconds as readable timer string (minutes only)
    function formatHungerTimer(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return 'Hungry!';

        const totalMinutes = Math.ceil(milliseconds / (60 * 1000));
        return `${totalMinutes}m`;
    }

    // Helper function to show toast notifications
    function showNotificationToast(message, type = 'info') {
        try {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'warning' ? 'rgba(255, 165, 0, 0.9)' : type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(33, 150, 243, 0.9)'};
                color: white;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                z-index: 2147483647;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                word-wrap: break-word;
                transition: opacity 0.3s ease;
            `;

            document.body.appendChild(toast);

            // Fade out and remove after 5 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        } catch (error) {
            console.error('❌ [TOAST] Error showing notification toast:', error);
        }
    }

    // ==================== WEATHER EVENT DETECTION ====================

    // Weather event tracking
    let lastWeatherState = null;

    function detectWeatherEvents() {
        if (!UnifiedState.data.settings.notifications.weatherNotificationsEnabled) return;

        try {
            // Check game state for weather (adjust based on actual game structure)
            const roomState = targetWindow?.MagicCircle_RoomConnection?.lastRoomStateJsonable;
            const currentWeather = roomState?.child?.data?.weather || roomState?.weather || null;

            if (currentWeather && currentWeather !== lastWeatherState) {
                const watchedEvents = UnifiedState.data.settings.notifications.watchedWeatherEvents || [];

                // Check if this is a watched weather event
                const eventMapping = {
                    'snow': 'Snow',
                    'rain': 'Rain',
                    'amber_moon': 'AmberMoon',
                    'ambermoon': 'AmberMoon',
                    'dawn': 'Dawn'
                };

                const mappedEvent = eventMapping[currentWeather.toLowerCase()] || currentWeather;

                if (watchedEvents.includes(mappedEvent)) {
                    productionLog(`🌤️ [WEATHER] ${mappedEvent} event detected!`);

                    // Play weather notification
                    const volume = UnifiedState.data.settings.notifications.volume || 0.3;
                    playTripleBeepNotification(volume);

                    // Show notification
                    showNotificationToast(`🌤️ Weather Event: ${mappedEvent}`, 'info');
                }

                lastWeatherState = currentWeather;
            }
        } catch (error) {
            console.error('❌ [WEATHER] Error detecting weather events:', error);
        }
    }

    function getHelpTabContent() {
        return `
            <div class="mga-section">
                <div class="mga-section-title">🚀 Getting Started</div>
                <div style="margin-bottom: 16px;">
                    <p style="margin-bottom: 8px;"><strong>Magic Garden Assistant</strong> is a comprehensive tool to help you manage your pets, track abilities, automate seed management, and monitor resources.</p>
                    <p style="margin-bottom: 8px;">Each tab provides different functionality - explore them using the navigation above or keyboard shortcuts below.</p>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">⌨️ Keyboard Shortcuts</div>
                <div class="mga-help-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; margin-bottom: 16px;">
                    <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                        <strong>Panel Control:</strong>
                    </div>
                    <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                        <code>Ctrl+M</code> - Toggle panel open/close<br>
                        <span style="opacity: 0.8;">💡 Tip: The blue icon is draggable</span>
                    </div>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🐾 Pet Management</div>
                <ul style="margin-left: 16px; margin-bottom: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Save Presets:</strong> Store your current pet setup with a custom name</li>
                    <li style="margin-bottom: 4px;"><strong>Load Presets:</strong> Quickly deploy saved pet configurations</li>
                    <li style="margin-bottom: 4px;"><strong>Reorder Presets:</strong> Use ↑↓ arrows or drag-and-drop to organize your preset list</li>
                </ul>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">⚡ Ability Tracking</div>
                <ul style="margin-left: 16px; margin-bottom: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Automatic Logging:</strong> All pet abilities are tracked automatically</li>
                    <li style="margin-bottom: 4px;"><strong>Filter by Category:</strong> View specific types of abilities (XP, Selling, etc.)</li>
                    <li style="margin-bottom: 4px;"><strong>Filter by Pet:</strong> See abilities from specific pet species</li>
                    <li style="margin-bottom: 4px;"><strong>Detailed Timestamps:</strong> Enable to show HH:MM:SS format timestamps</li>
                    <li style="margin-bottom: 4px;"><strong>Export Data:</strong> Download ability logs as CSV for analysis</li>
                </ul>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🌱 Seeds & Automation</div>
                <ul style="margin-left: 16px; margin-bottom: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Mass Deletion:</strong> Select multiple seed types for bulk deletion</li>
                    <li style="margin-bottom: 4px;"><strong>Auto-Delete:</strong> Automatically remove unwanted seeds as they appear</li>
                    <li style="margin-bottom: 4px;"><strong>Value Calculation:</strong> See total value of selected seeds before deletion</li>
                    <li style="margin-bottom: 4px;"><strong>Quick Selection:</strong> Use preset buttons for common seed types</li>
                </ul>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🔔 Notifications</div>
                <ul style="margin-left: 16px; margin-bottom: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Shop Monitoring:</strong> Get alerts when rare seeds/eggs appear</li>
                    <li style="margin-bottom: 4px;"><strong>Multiple Notifications:</strong> Single click dismisses all pending alerts</li>
                    <li style="margin-bottom: 4px;"><strong>Continuous Mode:</strong> Must be enabled via checkbox for persistent alerts</li>
                    <li style="margin-bottom: 4px;"><strong>Sound Types:</strong> Choose from beep, alarm, fanfare, or continuous alerts</li>
                </ul>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🎨 Customization</div>
                <ul style="margin-left: 16px; margin-bottom: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Themes:</strong> Switch between normal, dark, and other visual themes</li>
                    <li style="margin-bottom: 4px;"><strong>Compact Modes:</strong> Use compact or ultra-compact layouts to save space</li>
                    <li style="margin-bottom: 4px;"><strong>Overlays:</strong> Pop out tabs into separate in-game overlays</li>
                    <li style="margin-bottom: 4px;"><strong>Crop Highlighting:</strong> Visually highlight specific crops in your garden</li>
                </ul>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">❓ Troubleshooting</div>
                <ul style="margin-left: 16px; margin-bottom: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Crop Highlighting Not Working:</strong> Ensure the game is fully loaded before using highlighting</li>
                    <li style="margin-bottom: 4px;"><strong>Notifications Not Playing:</strong> Check volume settings and browser audio permissions</li>
                    <li style="margin-bottom: 4px;"><strong>Pet Presets Not Saving:</strong> Wait for success confirmation before switching tabs</li>
                    <li style="margin-bottom: 4px;"><strong>Performance Issues:</strong> Try compact mode or disable debug logging in settings</li>
                </ul>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">💡 Tips & Best Practices</div>
                <ul style="margin-left: 16px;">
                    <li style="margin-bottom: 4px;"><strong>Regular Backups:</strong> Export ability logs periodically for data safety</li>
                    <li style="margin-bottom: 4px;"><strong>Preset Organization:</strong> Use descriptive names and reorder presets by frequency of use</li>
                    <li style="margin-bottom: 4px;"><strong>Notification Management:</strong> Enable continuous mode only for critical alerts</li>
                    <li style="margin-bottom: 4px;"><strong>Resource Monitoring:</strong> Use the Values tab to track inventory and garden worth</li>
                </ul>
            </div>
        `;
    }

    function getHotkeysTabContent() {
        const hotkeys = UnifiedState.data.hotkeys;
        let currentlyRecording = null;

        return `
            <div class="mga-section">
                <div class="mga-section-title">🎮 Custom Hotkeys</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Click any key button to set a custom keybind. Press ESC to cancel.
                </p>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="hotkeys-enabled" class="mga-checkbox"
                               ${hotkeys.enabled ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>Enable custom hotkeys</span>
                    </label>
                </div>

                <div class="mga-section">
                    <div class="mga-section-title" style="font-size: 13px;">Game Controls</div>
                    ${Object.entries(hotkeys.gameKeys).map(([key, config]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                            <span style="font-size: 12px; flex: 1;">${config.name}</span>
                            <button class="hotkey-button" data-key="${key}" style="
                                padding: 4px 8px;
                                background: ${config.custom ? 'rgba(100, 255, 100, 0.2)' : 'rgba(74, 158, 255, 0.2)'};
                                border: 1px solid ${config.custom ? '#64ff64' : '#4a9eff'};
                                border-radius: 4px;
                                color: white;
                                font-size: 11px;
                                min-width: 80px;
                                cursor: pointer;
                            ">
                                ${config.custom ? `${config.original.toUpperCase()} → ${config.custom.toUpperCase()}` : config.original.toUpperCase()}
                            </button>
                            ${config.custom ? `
                                <button class="hotkey-reset" data-key="${key}" style="
                                    margin-left: 5px;
                                    padding: 2px 6px;
                                    background: rgba(255, 100, 100, 0.2);
                                    border: 1px solid #ff6464;
                                    border-radius: 3px;
                                    color: white;
                                    font-size: 10px;
                                    cursor: pointer;
                                ">↺</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button id="hotkeys-reset-all" class="mga-button" style="flex: 1;">
                        Reset All
                    </button>
                    <button id="hotkeys-export" class="mga-button" style="flex: 1;">
                        Export Config
                    </button>
                </div>
            </div>
        `;
    }

    function getNotificationsTabContent() {
        const settings = UnifiedState.data.settings;

        // Ensure new notification properties exist (for backwards compatibility with old saved data)
        if (!settings.notifications.petHungerEnabled && settings.notifications.petHungerEnabled !== false) {
            settings.notifications.petHungerEnabled = false;
        }
        if (!settings.notifications.petHungerThreshold) {
            settings.notifications.petHungerThreshold = 20;
        }
        if (!settings.notifications.abilityNotificationsEnabled && settings.notifications.abilityNotificationsEnabled !== false) {
            settings.notifications.abilityNotificationsEnabled = false;
        }
        if (!settings.notifications.watchedAbilities) {
            settings.notifications.watchedAbilities = [];
        }
        if (!settings.notifications.watchedAbilityCategories) {
            settings.notifications.watchedAbilityCategories = {
                xpBoost: true,
                cropSizeBoost: true,
                selling: true,
                harvesting: true,
                growthSpeed: true,
                specialMutations: true,
                other: true
            };
        }
        if (!settings.notifications.weatherNotificationsEnabled && settings.notifications.weatherNotificationsEnabled !== false) {
            settings.notifications.weatherNotificationsEnabled = false;
        }
        if (!settings.notifications.watchedDecor) {
            settings.notifications.watchedDecor = [];
        }
        if (!settings.notifications.watchedWeatherEvents) {
            settings.notifications.watchedWeatherEvents = ['Snow', 'Rain', 'AmberMoon', 'Dawn'];
        }
        if (!settings.notifications.abilityNotificationSound) {
            settings.notifications.abilityNotificationSound = 'single';
        }
        if (settings.notifications.abilityNotificationVolume === undefined) {
            settings.notifications.abilityNotificationVolume = 0.2;
        }
        // Ensure continuousEnabled is explicitly false if undefined
        if (settings.notifications.continuousEnabled === undefined || settings.notifications.continuousEnabled === null) {
            settings.notifications.continuousEnabled = false;
        }
        // Ensure debugMode exists
        if (settings.debugMode === undefined) {
            settings.debugMode = false;
        }

        return `
            <div class="mga-section">
                <div class="mga-section-title">🔔 Shop Alert Notifications</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Get audio and visual alerts when rare seeds or eggs appear in the shop.
                </p>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="notifications-enabled-checkbox" class="mga-checkbox"
                               ${settings.notifications.enabled ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🔊 Enable Notifications</span>
                    </label>
                </div>

                <div style="margin-bottom: 12px;">
                    <button id="notification-quick-toggle" class="mga-button" style="padding: 8px 16px; background: ${settings.notifications.enabled ? '#4a9eff' : '#666'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        ${settings.notifications.enabled ? '🔊 Turn OFF Notifications' : '🔇 Turn ON Notifications'}
                    </button>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Volume: ${Math.round(settings.notifications.volume * 100)}%
                    </label>
                    <input type="range" class="mga-slider" id="notification-volume-slider"
                           min="0" max="100" value="${settings.notifications.volume * 100}"
                           style="width: 100%; accent-color: #4a9eff;">
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="notification-continuous-checkbox" class="mga-checkbox"
                               ${settings.notifications.continuousEnabled ? 'checked' : ''}
                               style="accent-color: #ff9900;">
                        <span>⚠️ Enable Continuous Mode</span>
                    </label>
                    <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                        Allows selection of continuous notification type that plays until acknowledged.
                    </p>
                </div>
                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Notification Sound Type
                    </label>
                    <select class="mga-select" id="notification-type-select">
                        <option value="simple" ${settings.notifications.notificationType === 'simple' ? 'selected' : ''}>🔊 Simple Beep</option>
                        <option value="triple" ${settings.notifications.notificationType === 'triple' ? 'selected' : ''}>🔔 Triple Beep</option>
                        <option value="alarm" ${settings.notifications.notificationType === 'alarm' ? 'selected' : ''}>🚨 Alarm Siren</option>
                        <option value="epic" ${settings.notifications.notificationType === 'epic' ? 'selected' : ''}>🎵 Epic Fanfare</option>
                        <option value="continuous" ${settings.notifications.notificationType === 'continuous' ? 'selected' : ''} ${!settings.notifications.continuousEnabled ? 'disabled' : ''}>⚠️ Continuous (Until Acknowledged)</option>
                    </select>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="notification-acknowledgment-checkbox" class="mga-checkbox"
                               ${settings.notifications.requiresAcknowledgment ? 'checked' : ''}
                               style="accent-color: #ff4444;">
                        <span>🚨 Require acknowledgment (persistent alert)</span>
                    </label>
                    <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                        When enabled, notifications will show a modal that must be clicked to dismiss.
                    </p>
                </div>

                <div style="margin-bottom: 12px;">
                    <button class="mga-btn mga-btn-sm" id="test-notification-btn" style="background: #4a5568;">
                        🔔 Test Notification
                    </button>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px;">
                        Watched Seeds
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-carrot" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Carrot') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥕 Carrot</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-strawberry" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Strawberry') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍓 Strawberry</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-aloe" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Aloe') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌿 Aloe</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-blueberry" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Blueberry') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🫐 Blueberry</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-apple" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Apple') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍎 Apple</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-tulip" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Tulip') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌷 Tulip</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-tomato" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Tomato') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍅 Tomato</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-daffodil" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Daffodil') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌼 Daffodil</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-corn" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Corn') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌽 Corn</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-watermelon" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Watermelon') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍉 Watermelon</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-pumpkin" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Pumpkin') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🎃 Pumpkin</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-echeveria" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Echeveria') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🪴 Echeveria</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-coconut" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Coconut') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥥 Coconut</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-banana" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Banana') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍌 Banana</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-lily" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Lily') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌺 Lily</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-burrostail" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('BurrosTail') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌱 Burro's Tail</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-mushroom" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Mushroom') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍄 Mushroom</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-cactus" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Cactus') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌵 Cactus</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-bamboo" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Bamboo') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🎋 Bamboo</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-grape" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Grape') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍇 Grape</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-pepper" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Pepper') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌶️ Pepper</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-lemon" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Lemon') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍋 Lemon</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-passionfruit" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('PassionFruit') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🧡 PassionFruit</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-dragonfruit" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('DragonFruit') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🐉 DragonFruit</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-lychee" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Lychee') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🍇 Lychee</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-sunflower" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Sunflower') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌻 Sunflower</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-starweaver" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Starweaver') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>⭐ Starweaver</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-dawnbinder" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Dawnbinder') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌅 Dawnbinder</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-moonbinder" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes('Moonbinder') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌙 Moonbinder</span>
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px;">
                        Watched Eggs
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-common-egg" class="mga-checkbox"
                                   ${settings.notifications.watchedEggs.includes('CommonEgg') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥚 Common Egg</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-uncommon-egg" class="mga-checkbox"
                                   ${settings.notifications.watchedEggs.includes('UncommonEgg') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥚 Uncommon Egg</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-rare-egg" class="mga-checkbox"
                                   ${settings.notifications.watchedEggs.includes('RareEgg') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥚 Rare Egg</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-legendary-egg" class="mga-checkbox"
                                   ${settings.notifications.watchedEggs.includes('LegendaryEgg') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥚 Legendary Egg</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-mythical-egg" class="mga-checkbox"
                                   ${settings.notifications.watchedEggs.includes('MythicalEgg') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥚✨ Mythical Egg</span>
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px;">
                        Watched Decor (Hourly Shop)
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                        ${DECOR_ITEMS.map(decor => `
                            <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                                <input type="checkbox" id="watch-decor-${decor.id.toLowerCase()}" class="mga-checkbox"
                                       ${settings.notifications.watchedDecor.includes(decor.id) ? 'checked' : ''}
                                       style="accent-color: #4a9eff; transform: scale(0.8);">
                                <span>🎨 ${decor.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px; font-size: 12px;">
                        Last Seen
                    </label>
                    <div id="last-seen-display" style="font-size: 11px; color: #888; line-height: 1.3;">
                        Loading...
                    </div>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🐾 Pet Hunger Alerts</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Get notified when your pets' hunger drops below a threshold.
                </p>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="pet-hunger-enabled" class="mga-checkbox"
                               ${settings.notifications.petHungerEnabled ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🔊 Enable Pet Hunger Notifications</span>
                    </label>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Alert when hunger below: ${settings.notifications.petHungerThreshold || 20}%
                    </label>
                    <input type="range" class="mga-slider" id="pet-hunger-threshold"
                           min="5" max="50" step="5" value="${settings.notifications.petHungerThreshold || 20}"
                           style="width: 100%; accent-color: #ff9900;">
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">✨ Ability Trigger Alerts</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Get notified when your pets trigger abilities. Leave all unchecked to be notified for all abilities.
                </p>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="ability-notifications-enabled" class="mga-checkbox"
                               ${settings.notifications.abilityNotificationsEnabled ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🔊 Enable Ability Notifications</span>
                    </label>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Ability Sound Type
                    </label>
                    <select class="mga-select" id="ability-notification-sound-select"
                            style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white; font-size: 12px;">
                        <option value="single" ${settings.notifications.abilityNotificationSound === 'single' ? 'selected' : ''}>🔊 Single Beep (Subtle)</option>
                        <option value="double" ${settings.notifications.abilityNotificationSound === 'double' ? 'selected' : ''}>🔔 Double Beep</option>
                        <option value="triple" ${settings.notifications.abilityNotificationSound === 'triple' ? 'selected' : ''}>🎵 Triple Beep</option>
                        <option value="chime" ${settings.notifications.abilityNotificationSound === 'chime' ? 'selected' : ''}>🎐 Chime (Pleasant)</option>
                        <option value="alert" ${settings.notifications.abilityNotificationSound === 'alert' ? 'selected' : ''}>🚨 Alert (Urgent)</option>
                        <option value="buzz" ${settings.notifications.abilityNotificationSound === 'buzz' ? 'selected' : ''}>📳 Buzz (Energetic)</option>
                        <option value="ding" ${settings.notifications.abilityNotificationSound === 'ding' ? 'selected' : ''}>🔔 Ding (Clear)</option>
                        <option value="chirp" ${settings.notifications.abilityNotificationSound === 'chirp' ? 'selected' : ''}>🐦 Chirp (Cute)</option>
                    </select>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Ability Alert Volume: ${Math.round((settings.notifications.abilityNotificationVolume || 0.2) * 100)}%
                    </label>
                    <input type="range" class="mga-slider" id="ability-notification-volume-slider"
                           min="0" max="100" value="${(settings.notifications.abilityNotificationVolume || 0.2) * 100}"
                           style="width: 100%; accent-color: #9f7aea;">
                </div>

                <div style="margin-bottom: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <label class="mga-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                        📋 Which Abilities to Notify For
                    </label>
                    <p style="font-size: 11px; color: #888; margin-bottom: 8px;">
                        Select individual abilities that will trigger notifications. All abilities start enabled by default.
                    </p>

                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <button id="select-all-individual-abilities" class="mga-btn mga-btn-secondary" style="flex: 1; padding: 6px; font-size: 11px;">Select All</button>
                        <button id="select-none-individual-abilities" class="mga-btn mga-btn-secondary" style="flex: 1; padding: 6px; font-size: 11px;">Select None</button>
                    </div>

                    <input type="text" id="ability-search-box" placeholder="🔍 Search abilities..."
                           style="width: 100%; padding: 8px; margin-bottom: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 12px;">

                    <div id="individual-abilities-notification-list" style="display: grid; grid-template-columns: 1fr; gap: 4px; max-height: 400px; overflow-y: auto; padding: 4px;">
                        ${(() => {
                            // Comprehensive list of all abilities organized by category
                            const abilities = [
                                // XP Boosts
                                { name: 'XP Boost I', category: '💫 XP Boosts' },
                                { name: 'XP Boost II', category: '💫 XP Boosts' },
                                { name: 'XP Boost III', category: '💫 XP Boosts' },
                                { name: 'XP Boost IV', category: '💫 XP Boosts' },
                                { name: 'Hatch XP Boost', category: '💫 XP Boosts' },
                                // Crop Size Boosts (only I and II exist in game)
                                { name: 'Crop Size Boost I', category: '📈 Crop Size Boosts' },
                                { name: 'Crop Size Boost II', category: '📈 Crop Size Boosts' },
                                // Selling
                                { name: 'Sell Boost I', category: '💰 Selling' },
                                { name: 'Sell Boost II', category: '💰 Selling' },
                                { name: 'Sell Boost III', category: '💰 Selling' },
                                { name: 'Sell Boost IV', category: '💰 Selling' },
                                { name: 'Selling Refund', category: '💰 Selling' },
                                // Harvesting
                                { name: 'Double Harvest', category: '🌾 Harvesting' },
                                // Growth Speed
                                { name: 'Plant Growth Boost I', category: '🐢 Growth Speed' },
                                { name: 'Plant Growth Boost II', category: '🐢 Growth Speed' },
                                { name: 'Plant Growth Boost III', category: '🐢 Growth Speed' },
                                // Special Mutations
                                { name: 'Rainbow Mutation', category: '🌈 Special' },
                                { name: 'Gold Mutation', category: '🌈 Special' },
                                // Other
                                { name: 'Seed Finder I', category: '🔧 Other' },
                                { name: 'Seed Finder II', category: '🔧 Other' },
                                { name: 'Hunger Boost I', category: '🔧 Other' },
                                { name: 'Hunger Boost II', category: '🔧 Other' },
                                { name: 'Max Strength Boost I', category: '🔧 Other' },
                                { name: 'Max Strength Boost II', category: '🔧 Other' },
                                { name: 'Crop Eater', category: '🔧 Other' }
                            ];

                            const watchedAbilities = settings.notifications.watchedAbilities || [];

                            // Group abilities by category
                            const grouped = {};
                            abilities.forEach(ability => {
                                if (!grouped[ability.category]) grouped[ability.category] = [];
                                grouped[ability.category].push(ability.name);
                            });

                            let html = '';
                            Object.keys(grouped).sort().forEach(category => {
                                html += `<div class="ability-category-group" style="margin-bottom: 8px;">
                                    <div style="font-size: 11px; font-weight: 600; color: #aaa; margin-bottom: 4px; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">${category}</div>`;

                                grouped[category].forEach(abilityName => {
                                    const isChecked = watchedAbilities.length === 0 || watchedAbilities.includes(abilityName);
                                    html += `
                                        <label class="mga-checkbox-group ability-checkbox-item" data-ability="${abilityName}" style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; cursor: pointer; transition: background 0.2s; border-radius: 4px;">
                                            <input type="checkbox"
                                                   class="mga-checkbox individual-ability-checkbox"
                                                   data-ability-name="${abilityName}"
                                                   ${isChecked ? 'checked' : ''}
                                                   style="accent-color: #4a9eff;">
                                            <span style="font-size: 11px; color: #ddd;">${abilityName}</span>
                                        </label>`;
                                });
                                html += '</div>';
                            });

                            return html;
                        })()}
                    </div>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">🌤️ Weather Event Alerts</div>
                <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                    Get notified when weather events occur in the game.
                </p>

                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="weather-notifications-enabled" class="mga-checkbox"
                               ${settings.notifications.weatherNotificationsEnabled ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🔊 Enable Weather Notifications</span>
                    </label>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px;">
                        Watched Weather Events
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-snow" class="mga-checkbox"
                                   ${settings.notifications.watchedWeatherEvents.includes('Snow') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>❄️ Snow</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-rain" class="mga-checkbox"
                                   ${settings.notifications.watchedWeatherEvents.includes('Rain') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌧️ Rain</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-amber-moon" class="mga-checkbox"
                                   ${settings.notifications.watchedWeatherEvents.includes('AmberMoon') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌙 Amber Moon</span>
                        </label>
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-dawn" class="mga-checkbox"
                                   ${settings.notifications.watchedWeatherEvents.includes('Dawn') ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🌅 Dawn</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    function getSettingsTabContent() {
        const settings = UnifiedState.data.settings;

        return `
            <div class="mga-section">
                <div class="mga-section-title">Appearance</div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Main HUD Opacity: ${settings.opacity}%
                    </label>
                    <input type="range" class="mga-slider" id="opacity-slider"
                           min="0" max="100" value="${settings.opacity}"
                           style="width: 100%; accent-color: #4a9eff;">
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 4px;">
                        Pop-out Opacity: ${settings.popoutOpacity}%
                    </label>
                    <input type="range" class="mga-slider" id="popout-opacity-slider"
                           min="0" max="100" value="${settings.popoutOpacity}"
                           style="width: 100%; accent-color: #4a9eff;">
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px;">
                        Gradient Style
                    </label>
                    <select class="mga-select" id="gradient-select" style="margin-bottom: 8px;">
                        <option value="blue-purple" ${settings.gradientStyle === 'blue-purple' ? 'selected' : ''}>🌌 Blue-Purple</option>
                        <option value="green-blue" ${settings.gradientStyle === 'green-blue' ? 'selected' : ''}>🌊 Green-Blue</option>
                        <option value="red-orange" ${settings.gradientStyle === 'red-orange' ? 'selected' : ''}>🔥 Red-Orange</option>
                        <option value="purple-pink" ${settings.gradientStyle === 'purple-pink' ? 'selected' : ''}>💜 Purple-Pink</option>
                        <option value="gold-yellow" ${settings.gradientStyle === 'gold-yellow' ? 'selected' : ''}>👑 Gold-Yellow</option>
                        <option value="electric-neon" ${settings.gradientStyle === 'electric-neon' ? 'selected' : ''}>⚡ Electric Neon</option>
                        <option value="sunset-fire" ${settings.gradientStyle === 'sunset-fire' ? 'selected' : ''}>🌅 Sunset Fire</option>
                        <option value="emerald-cyan" ${settings.gradientStyle === 'emerald-cyan' ? 'selected' : ''}>💎 Emerald Cyan</option>
                        <option value="royal-gold" ${settings.gradientStyle === 'royal-gold' ? 'selected' : ''}>🏆 Royal Gold</option>
                        <option value="crimson-blaze" ${settings.gradientStyle === 'crimson-blaze' ? 'selected' : ''}>🔥 Crimson Blaze</option>
                        <option value="ocean-deep" ${settings.gradientStyle === 'ocean-deep' ? 'selected' : ''}>🌊 Ocean Deep</option>
                        <option value="forest-mystique" ${settings.gradientStyle === 'forest-mystique' ? 'selected' : ''}>🌲 Forest Mystique</option>
                        <option value="cosmic-purple" ${settings.gradientStyle === 'cosmic-purple' ? 'selected' : ''}>🌌 Cosmic Purple</option>
                        <option value="rainbow-burst" ${settings.gradientStyle === 'rainbow-burst' ? 'selected' : ''}>🌈 Rainbow Burst</option>
                        <option value="steel-blue" ${settings.gradientStyle === 'steel-blue' ? 'selected' : ''}>🛡️ Steel Blue</option>
                        <option value="chrome-silver" ${settings.gradientStyle === 'chrome-silver' ? 'selected' : ''}>⚪ Chrome Silver</option>
                        <option value="titanium-gray" ${settings.gradientStyle === 'titanium-gray' ? 'selected' : ''}>🌫️ Titanium Gray</option>
                        <option value="platinum-white" ${settings.gradientStyle === 'platinum-white' ? 'selected' : ''}>💍 Platinum White</option>
                    </select>
                </div>

                <div style="margin-bottom: 12px;">
                    <label class="mga-label" style="display: block; margin-bottom: 8px;">
                        Effect Style
                    </label>
                    <select class="mga-select" id="effect-select">
                        <option value="none" ${settings.effectStyle === 'none' ? 'selected' : ''}>✨ None</option>
                        <option value="metallic" ${settings.effectStyle === 'metallic' ? 'selected' : ''}>⚡ Metallic</option>
                        <option value="glass" ${settings.effectStyle === 'glass' ? 'selected' : ''}>💎 Glass</option>
                        <option value="neon" ${settings.effectStyle === 'neon' ? 'selected' : ''}>🌟 Neon Glow</option>
                        <option value="plasma" ${settings.effectStyle === 'plasma' ? 'selected' : ''}>🔥 Plasma</option>
                        <option value="aurora" ${settings.effectStyle === 'aurora' ? 'selected' : ''}>🌌 Aurora</option>
                        <option value="crystal" ${settings.effectStyle === 'crystal' ? 'selected' : ''}>💠 Crystal</option>
                        <option value="steel" ${settings.effectStyle === 'steel' ? 'selected' : ''}>🛡️ Steel</option>
                        <option value="chrome" ${settings.effectStyle === 'chrome' ? 'selected' : ''}>⚪ Chrome</option>
                        <option value="titanium" ${settings.effectStyle === 'titanium' ? 'selected' : ''}>🌫️ Titanium</option>
                    </select>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Quick Presets</div>
                <div class="mga-grid">
                    <button class="mga-btn mga-btn-sm" data-preset="gaming">🎮 Gaming</button>
                    <button class="mga-btn mga-btn-sm" data-preset="minimal">⚪ Minimal</button>
                    <button class="mga-btn mga-btn-sm" data-preset="vibrant">🌈 Vibrant</button>
                    <button class="mga-btn mga-btn-sm" data-preset="dark">⚫ Dark</button>
                    <button class="mga-btn mga-btn-sm" data-preset="luxury">✨ Luxury</button>
                    <button class="mga-btn mga-btn-sm" data-preset="steel">🛡️ Steel</button>
                    <button class="mga-btn mga-btn-sm" data-preset="chrome">⚪ Chrome</button>
                    <button class="mga-btn mga-btn-sm" data-preset="titanium">🌫️ Titanium</button>
                    <button class="mga-btn mga-btn-sm" data-preset="reset">🔄 Reset</button>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">UI Mode</div>
                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="ultra-compact-checkbox" class="mga-checkbox"
                               ${settings.ultraCompactMode ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>📱 Ultra-compact mode</span>
                    </label>
                    <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                        Maximum space efficiency with condensed layouts and smaller text.
                    </p>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Pop-out Behavior</div>
                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="use-overlays-checkbox" class="mga-checkbox"
                               ${settings.useInGameOverlays ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🎮 Use in-game overlays instead of separate windows</span>
                    </label>
                    <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                        When enabled, tabs will open as draggable overlays within the game window instead of separate browser windows.
                    </p>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Developer Options</div>
                <div style="margin-bottom: 12px;">
                    <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="debug-mode-checkbox" class="mga-checkbox"
                               ${settings.debugMode ? 'checked' : ''}
                               style="accent-color: #4a9eff;">
                        <span>🐛 Enable Debug Mode</span>
                    </label>
                    <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                        Shows detailed console logs for troubleshooting pet hunger, notifications, and more.
                    </p>
                </div>
            </div>

            <div class="mga-section">
                <div class="mga-section-title">Data Management</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="mga-btn mga-btn-sm" id="export-settings-btn">Export Settings</button>
                    <button class="mga-btn mga-btn-sm" id="import-settings-btn">Import Settings</button>
                    <button class="mga-btn mga-btn-sm" id="reset-loadouts-btn" style="background: #dc2626;">🔄 Reset Pet Loadouts</button>
                </div>
                <p style="font-size: 11px; color: #aaa; margin-top: 4px;">
                    Reset button will clear all saved pet loadouts while preserving other settings.
                </p>
            </div>
        `;
    }

    // Helper function to refresh separate window popouts
    function refreshSeparateWindowPopouts(tabName) {
        try{
            UnifiedState.data.popouts.windows.forEach((windowRef, popoutTabName) => {
                if (windowRef && !windowRef.closed && popoutTabName === tabName) {
                    // Force update pets data first for pets tab
                    if (tabName === 'pets') {
                        updateActivePetsFromRoomState();
                    }

                    // Trigger refresh in the separate window
                    if (windowRef.refreshPopoutContent) {
                        windowRef.refreshPopoutContent(tabName);
                        productionLog(`🔄 [POPOUT] Refreshed ${tabName} window popout`);
                    } else if (windowRef.location) {
                        // Fallback: force reload if refresh function not available
                        productionWarn(`⚠️ [POPOUT] No refresh function for ${tabName}, reloading window`);
                        windowRef.location.reload();
                    }
                }
            });
        } catch (error) {
            debugError('OVERLAY_LIFECYCLE', 'Failed to refresh separate window popouts', error, { tabName });
        }
    }

    // Place a pet preset - used by both main tab and popout Place buttons
    function placePetPreset(presetName) {
        const preset = UnifiedState.data.petPresets[presetName];
        if (!preset) {
            productionWarn(`[PETS] Preset "${presetName}" not found`);
            return;
        }

        // Store current pets
        (UnifiedState.atoms.activePets || []).forEach(p => {
            safeSendMessage({
                scopePath: ["Room", "Quinoa"],
                type: "StorePet",
                itemId: p.id
            });
        });

        // Place preset pets with delays
        preset.forEach((p, i) => {
            setTimeout(() => {
                safeSendMessage({
                    scopePath: ["Room", "Quinoa"],
                    type: "PlacePet",
                    itemId: p.id,
                    position: { x: 17 + i * 2, y: 13 },
                    localTileIndex: 64,
                    tileType: "Boardwalk"
                });
            }, i * 50);
        });

        // Update all displays after pets are placed (with backup refresh)
        const refreshAllPetDisplays = () => {
            // Force update from room state
            updateActivePetsFromRoomState();

            // Update main tab if active
            if (UnifiedState.activeTab === 'pets') {
                updateTabContent();
            }

            // Update overlays
            UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                if (overlay && document.contains(overlay) && tabName === 'pets') {
                    if (overlay.className.includes('mga-overlay-content-only')) {
                        updatePureOverlayContent(overlay, tabName);
                    }
                }
            });

            // Update separate window popouts
            refreshSeparateWindowPopouts('pets');
        };

        // First refresh after 1.5 seconds
        setTimeout(() => {
            refreshAllPetDisplays();
            productionLog(`✅ [PETS] Placed preset "${presetName}" and updated displays (first refresh)`);
        }, preset.length * 50 + 1500);

        // Backup refresh after 2.5 seconds to catch slow updates
        setTimeout(() => {
            refreshAllPetDisplays();
            productionLog(`✅ [PETS] Backup refresh for preset "${presetName}"`);
        }, preset.length * 50 + 2500);
    }

    // ==================== PETS UI HELPER FUNCTIONS ====================
    function updatePetPresetDropdown(context) {
        const select = context.querySelector('#preset-quick-select');
        if (!select) return;

        // Preserve current selection
        const currentValue = select.value;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">-- Select Preset --</option>';

        // Add all presets
        Object.keys(UnifiedState.data.petPresets).forEach(name => {
            const preset = UnifiedState.data.petPresets[name];
            const option = targetDocument.createElement('option');
            option.value = name;
            option.textContent = `${name} (${preset.map(p => p.petSpecies).join(', ')})`;
            select.appendChild(option);
        });

        // Restore selection if it still exists
        if (currentValue && UnifiedState.data.petPresets[currentValue]) {
            select.value = currentValue;
        }

        debugLog('PETS_UI', 'Updated preset dropdown without full refresh');
    }

    function updateActivePetsDisplay(context = document, retryCount = 0) {
        // Only log in debug mode to reduce console spam
        if (UnifiedState.data.settings?.debugMode) {
            productionLog('🐾 [ACTIVE-PETS] Updating display', {
                retryCount,
                unifiedStateActivePets: UnifiedState.atoms.activePets?.length || 0,
                windowActivePets: window.activePets?.length || 0,
                context: context === document ? 'document' : 'overlay'
            });
        }

        // Try multiple sources for pet data (React timing issue workaround)
        let activePets = UnifiedState.atoms.activePets || window.activePets || [];

        // If no pets found and this is first try, wait and retry (DOM timing fix)
        if (activePets.length === 0 && retryCount < 3) {
            if (UnifiedState.data.settings?.debugMode) {
                productionLog(`🐾 [ACTIVE-PETS] No pets found, retrying in ${100 * (retryCount + 1)}ms...`);
            }
            setTimeout(() => updateActivePetsDisplay(context, retryCount + 1), 100 * (retryCount + 1));
            return;
        }

        // Find all Active Pets display elements in the given context
        const activePetsDisplays = context.querySelectorAll('.mga-active-pets-display');

        activePetsDisplays.forEach(display => {
            const innerHTML = activePets.length > 0 ? `
                <div class="mga-active-pets-header">Currently Equipped:</div>
                <div class="mga-active-pets-list">
                    ${activePets.map((p, index) => {
                        const timeUntilHungry = calculateTimeUntilHungry(p);
                        const timerText = formatHungerTimer(timeUntilHungry);
                        const timerColor = timeUntilHungry === null ? '#999' :
                                           timeUntilHungry <= 0 ? '#8B0000' :
                                           timeUntilHungry < 5 * 60 * 1000 ? '#ff4444' :
                                           timeUntilHungry < 15 * 60 * 1000 ? '#ffa500' : '#4caf50';
                        return `
                            <div class="mga-pet-slot" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px;">
                                <span class="mga-pet-badge">${p.petSpecies}</span>
                                <span class="mga-hunger-timer" data-pet-index="${index}" style="font-size: 12px; color: ${timerColor}; font-weight: bold;">${timerText}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div class="mga-empty-state">
                    <div class="mga-empty-state-icon">—</div>
                    <div class="mga-empty-state-description">No pets currently active</div>
                </div>
            `;

            display.innerHTML = innerHTML;
        });

        if (UnifiedState.data.settings?.debugMode) {
            productionLog('🐾 [ACTIVE-PETS] Updated display elements:', {
                elementsFound: activePetsDisplays.length,
                activePetsCount: activePets.length
            });
        }
    }

    // Initialize preset order array if not exists
    function ensurePresetOrder() {
        if (!UnifiedState.data.petPresetsOrder || !Array.isArray(UnifiedState.data.petPresetsOrder)) {
            UnifiedState.data.petPresetsOrder = Object.keys(UnifiedState.data.petPresets);
        } else {
            // Ensure all existing presets are in the order array
            Object.keys(UnifiedState.data.petPresets).forEach(name => {
                if (!UnifiedState.data.petPresetsOrder.includes(name)) {
                    UnifiedState.data.petPresetsOrder.push(name);
                }
            });
            // Remove any presets from order array that no longer exist
            UnifiedState.data.petPresetsOrder = UnifiedState.data.petPresetsOrder.filter(name =>
                UnifiedState.data.petPresets.hasOwnProperty(name)
            );
        }
    }

    // Move preset up or down in the order
    function movePreset(presetName, direction, context) {
        productionLog(`🚨 [CRITICAL] movePreset called: ${presetName} ${direction}`);
        productionLog(`🚨 [CRITICAL] Current order:`, UnifiedState.data.petPresetsOrder);
        ensurePresetOrder();
        const currentIndex = UnifiedState.data.petPresetsOrder.indexOf(presetName);

        if (currentIndex === -1) return;

        let newIndex;
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < UnifiedState.data.petPresetsOrder.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return; // Can't move
        }

        // Swap elements
        const temp = UnifiedState.data.petPresetsOrder[currentIndex];
        UnifiedState.data.petPresetsOrder[currentIndex] = UnifiedState.data.petPresetsOrder[newIndex];
        UnifiedState.data.petPresetsOrder[newIndex] = temp;

        // Save the new order
        MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);

        // Force UI refresh after reorder
        productionLog(`🚨 [CRITICAL] Order after swap:`, UnifiedState.data.petPresetsOrder);

        // Refresh the preset list display
        refreshPresetsList(context);

        // Refresh popout windows
        refreshSeparateWindowPopouts('pets');

        // Also update main tab content if needed
        if (UnifiedState.activeTab === 'pets') {
            updateTabContent();
        }

        productionLog(`📋 [PET-PRESETS] Moved preset "${presetName}" ${direction}`);
    }

    // Refresh the presets list with new order
    // Helper function for drag and drop positioning
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.mga-preset:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function refreshPresetsList(context) {
        const presetsList = context.querySelector('#presets-list');
        if (!presetsList) return;

        // Clear current list
        presetsList.innerHTML = '';

        // Re-add presets in order
        ensurePresetOrder();
        UnifiedState.data.petPresetsOrder.forEach(name => {
            if (UnifiedState.data.petPresets[name]) {
                addPresetToList(context, name, UnifiedState.data.petPresets[name]);
            }
        });
    }

    function addPresetToList(context, name, preset) {
        const presetsList = context.querySelector('#presets-list');
        if (!presetsList) return;

        // Create new preset element
        const presetDiv = targetDocument.createElement('div');
        presetDiv.className = 'mga-preset';
        presetDiv.draggable = true;
        presetDiv.dataset.presetName = name;
        presetDiv.innerHTML = `
            <div class="mga-preset-header" style="cursor: move;">
                <span class="mga-preset-name">⋮⋮ ${name}</span>
            </div>
            <div class="mga-preset-pets">${preset.map(p => p.petSpecies).join(', ')}</div>
            <div class="mga-preset-actions">
                <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                    <button class="mga-btn mga-btn-sm" data-action="move-up" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↑</button>
                    <button class="mga-btn mga-btn-sm" data-action="move-down" data-preset="${name}" style="background: #6b7280; padding: 4px 8px;">↓</button>
                    <button class="mga-btn mga-btn-sm" data-action="save" data-preset="${name}">Save Current</button>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="mga-btn mga-btn-sm" data-action="place" data-preset="${name}">Place</button>
                    <button class="mga-btn mga-btn-sm" data-action="remove" data-preset="${name}">Remove</button>
                </div>
            </div>
        `;

        // Add drag-and-drop handlers
        presetDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', name);
            presetDiv.style.opacity = '0.5';
        });

        presetDiv.addEventListener('dragend', (e) => {
            presetDiv.style.opacity = '';
        });

        presetDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const afterElement = getDragAfterElement(presetsList, e.clientY);
            if (afterElement == null) {
                presetsList.appendChild(presetDiv);
            } else {
                presetsList.insertBefore(presetDiv, afterElement);
            }
        });

        presetDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedPresetName = e.dataTransfer.getData('text/plain');
            if (draggedPresetName && draggedPresetName !== name) {
                // Update order array based on current DOM order
                const newOrder = Array.from(presetsList.children).map(el => el.dataset.presetName).filter(Boolean);
                UnifiedState.data.petPresetsOrder = newOrder;
                MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);
                refreshPresetsList(context);
            }
        });

        // Add event handlers to new buttons
        presetDiv.querySelectorAll('[data-action]').forEach(btn => {
            btn.setAttribute('data-handler-setup', 'true');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.dataset.action;
                const presetName = e.target.dataset.preset;

                if (action === 'save') {
                    UnifiedState.data.petPresets[presetName] = (UnifiedState.atoms.activePets || []).slice(0, 3);

                    // Use safe save with user feedback for critical pet preset data
                    const result = MGA_safeSave('MGA_petPresets', UnifiedState.data.petPresets, {
                        description: `pet preset "${presetName}"`,
                        criticalData: true,
                        showUserAlert: true
                    });

                    if (result.success) {
                        productionLog(`✅ [PET-PRESETS] Successfully saved preset "${presetName}"`);
                    } else {
                        console.error(`❌ [PET-PRESETS] Failed to save preset "${presetName}":`, result.error);
                    }

                    updatePetPresetDropdown(context);
                    refreshSeparateWindowPopouts('pets');
                    debugLog('BUTTON_INTERACTIONS', `Saved preset: ${presetName} (from added element)`);
                } else if (action === 'place') {
                    // CRITICAL: Stop event propagation to prevent game clicks
                    e.stopPropagation();
                    e.preventDefault();

                    const preset = UnifiedState.data.petPresets[presetName];
                    if (!preset) return;

                    // Store current pets then place preset pets
                    (UnifiedState.atoms.activePets || []).forEach(p => {
                        safeSendMessage({
                            scopePath: ["Room", "Quinoa"],
                            type: "StorePet",
                            itemId: p.id
                        });
                    });

                    // CRITICAL FIX: Add delay between pet placements to prevent accidental clicks
                    preset.forEach((p, i) => {
                        setTimeout(() => {
                            safeSendMessage({
                                scopePath: ["Room", "Quinoa"],
                                type: "PlacePet",
                                itemId: p.id,
                                position: { x: 17 + i * 2, y: 13 },
                                localTileIndex: 64,
                                tileType: "Boardwalk"
                            });
                        }, i * 50); // 50ms delay between each pet placement
                    });

                    // Update pets display after all pets placed
                    setTimeout(() => {
                        // Force update pets from room state first
                        updateActivePetsFromRoomState();

                        // Then refresh the tab if it's active
                        if (UnifiedState.activeTab === 'pets') {
                            updateTabContent();
                        }

                        // Update all pet overlays after placing
                        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                            if (overlay && document.contains(overlay) && tabName === 'pets') {
                                if (overlay.className.includes('mga-overlay-content-only')) {
                                    updatePureOverlayContent(overlay, tabName);
                                    debugLog('OVERLAY_LIFECYCLE', 'Updated pure pets overlay after placing preset');
                                }
                            }
                        });

                        // Update separate window popouts
                        refreshSeparateWindowPopouts('pets');
                    }, preset.length * 50 + 1000); // Wait for all pets + extra time for game to update

                    debugLog('BUTTON_INTERACTIONS', `Placed preset: ${presetName} (from added element)`);
                } else if (action === 'remove') {
                    delete UnifiedState.data.petPresets[presetName];

                    // Remove from order array
                    ensurePresetOrder();
                    const orderIndex = UnifiedState.data.petPresetsOrder.indexOf(presetName);
                    if (orderIndex !== -1) {
                        UnifiedState.data.petPresetsOrder.splice(orderIndex, 1);
                        MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);
                    }

                    // Use safe save for critical pet preset removal
                    const result = MGA_safeSave('MGA_petPresets', UnifiedState.data.petPresets, {
                        description: `pet preset deletion "${presetName}"`,
                        criticalData: true,
                        showUserAlert: true
                    });

                    if (result.success) {
                        productionLog(`✅ [PET-PRESETS] Successfully removed preset "${presetName}"`);
                        presetDiv.remove();
                    } else {
                        console.error(`❌ [PET-PRESETS] Failed to remove preset "${presetName}":`, result.error);
                        // Restore the preset in memory since save failed
                        UnifiedState.data.petPresets[presetName] = UnifiedState.data.petPresets[presetName] || [];
                        // Also restore to order array
                        if (orderIndex !== -1 && !UnifiedState.data.petPresetsOrder.includes(presetName)) {
                            UnifiedState.data.petPresetsOrder.splice(orderIndex, 0, presetName);
                        }
                    }
                    updatePetPresetDropdown(context);
                    refreshSeparateWindowPopouts('pets');
                    debugLog('BUTTON_INTERACTIONS', `Removed preset: ${presetName} (from added element)`);
                } else if (action === 'move-up') {
                    productionLog(`🚨 [CRITICAL] Move up button clicked for ${presetName}`);
                    movePreset(presetName, 'up', context);
                } else if (action === 'move-down') {
                    productionLog(`🚨 [CRITICAL] Move down button clicked for ${presetName}`);
                    movePreset(presetName, 'down', context);
                }
            });
        });

        presetsList.appendChild(presetDiv);
        debugLog('PETS_UI', `Added preset ${name} to list without full refresh`);
    }

    // ==================== EVENT HANDLERS ====================
    function setupPetsTabHandlers(context = document) {
        productionLog('🚨 [CRITICAL] Setting up pet preset handlers');

        // Use event delegation on the parent container for all preset buttons
        const presetsContainer = context.querySelector('#presets-list');
        if (presetsContainer) {
            productionLog('🚨 [CRITICAL] Found presets container, adding delegation');

            // Remove old listener if it exists
            if (presetsContainer._mgaClickHandler) {
                presetsContainer.removeEventListener('click', presetsContainer._mgaClickHandler);
            }

            // Create new handler
            presetsContainer._mgaClickHandler = (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;

                e.preventDefault();
                e.stopPropagation();

                const action = btn.dataset.action;
                const presetName = btn.dataset.preset;

                productionLog(`🚨 [CRITICAL] Delegated click: action=${action}, preset=${presetName}`);

                if (action === 'move-up') {
                    productionLog(`🚨 [CRITICAL] Moving ${presetName} UP`);
                    movePreset(presetName, 'up', context);
                } else if (action === 'move-down') {
                    productionLog(`🚨 [CRITICAL] Moving ${presetName} DOWN`);
                    movePreset(presetName, 'down', context);
                } else if (action === 'save') {
                    productionLog(`🚨 [CRITICAL] Saving preset ${presetName}`);
                    UnifiedState.data.petPresets[presetName] = (UnifiedState.atoms.activePets || []).slice(0, 3);
                    MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
                    refreshPresetsList(context);
                } else if (action === 'place') {
                    productionLog(`🚨 [CRITICAL] Placing preset ${presetName}`);
                    placePetPreset(presetName);
                } else if (action === 'remove') {
                    productionLog(`🚨 [CRITICAL] Removing preset ${presetName}`);
                    delete UnifiedState.data.petPresets[presetName];
                    MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
                    refreshPresetsList(context);
                }
            };

            // Add the handler
            presetsContainer.addEventListener('click', presetsContainer._mgaClickHandler);
            productionLog('🚨 [CRITICAL] Event delegation handler attached successfully');
        } else {
            productionLog('🚨 [CRITICAL] ERROR: presets container not found!')
        }

        const input = context.querySelector('#preset-name-input');
        if (input) {
            // Comprehensive input isolation to prevent game key interference and modal detection

            let handlingEvent = false;

            // Add additional isolation layer for the input container
            // Note: Removed aggressive event blocking that was preventing UI interactions

            // Create input isolation system
            function createInputIsolation(inputElement) {
                // Prevent ALL game key interference when input is focused
                const isolateKeyEvent = (e) => {
                    if (document.activeElement === inputElement) {
                        // Stop all propagation to prevent game from receiving keys
                        e.stopImmediatePropagation();
                        e.stopPropagation();

                        // Handle special keys
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            inputElement.blur(); // Allow user to return to game
                            return;
                        }

                        // Allow Enter to submit
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const addBtn = context.querySelector('#add-preset-btn');
                            if (addBtn) addBtn.click();
                            return;
                        }

                        // For other keys, let the input handle them naturally
                        // but prevent game from seeing them
                    }
                };

                // Capture ALL key events before they reach the game
                ['keydown', 'keyup', 'keypress'].forEach(eventType => {
                    inputElement.addEventListener(eventType, isolateKeyEvent, {
                        capture: true,
                        passive: false
                    });
                });

                // Also isolate focus/blur events
                inputElement.addEventListener('focus', (e) => {
                    if (UnifiedState.data.settings.debugMode) {
                        productionLog('🔒 Input focused - Game keys isolated');
                    }
                    e.stopPropagation();
                });

                inputElement.addEventListener('blur', (e) => {
                    if (UnifiedState.data.settings.debugMode) {
                        productionLog('🔓 Input blurred - Game keys restored');
                    }
                    e.stopPropagation();
                });
            }

            // Apply input isolation
            createInputIsolation(input);

            // Existing click handlers with improved event handling
            input.addEventListener('mousedown', (e) => {
                if (handlingEvent) return;
                handlingEvent = true;
                e.stopPropagation();

                setTimeout(() => {
                    handlingEvent = false;
                }, 50);
            });

            input.addEventListener('click', (e) => {
                if (handlingEvent) return;
                e.stopPropagation();

                // Only select all if the input is empty or user clicked when not focused
                if (input.value === '' || document.activeElement !== input) {
                    setTimeout(() => {
                        input.focus();
                        input.select();
                    }, 0);
                }
            });
        }

        // Quick Load Button Handler
        const quickLoadBtn = context.querySelector('#quick-load-btn');
        if (quickLoadBtn && !quickLoadBtn.hasAttribute('data-handler-setup')) {
            quickLoadBtn.setAttribute('data-handler-setup', 'true');
            quickLoadBtn.addEventListener('click', () => {
                const select = context.querySelector('#preset-quick-select');
                const presetName = select.value;
                if (presetName && UnifiedState.data.petPresets[presetName]) {
                    const preset = UnifiedState.data.petPresets[presetName];

                    // Store current pets
                    (UnifiedState.atoms.activePets || []).forEach(p => {
                        safeSendMessage({
                            scopePath: ["Room", "Quinoa"],
                            type: "StorePet",
                            itemId: p.id
                        });
                    });

                    // Place preset pets
                    preset.forEach((p, i) => {
                        safeSendMessage({
                            scopePath: ["Room", "Quinoa"],
                            type: "PlacePet",
                            itemId: p.id,
                            position: { x: 17 + i * 2, y: 13 },
                            localTileIndex: 64,
                            tileType: "Boardwalk"
                        });
                    });

                    // Don't auto-reset dropdown - let user keep their selection

                    // Update popouts after game updates (changed from 100ms to 1000ms)
                    setTimeout(() => {
                        updateActivePetsFromRoomState();
                        refreshSeparateWindowPopouts('pets');
                        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                            if (overlay && document.contains(overlay) && tabName === 'pets') {
                                if (overlay.className.includes('mga-overlay-content-only')) {
                                    updatePureOverlayContent(overlay, tabName);
                                }
                            }
                        });
                    }, 1000);

                    debugLog('BUTTON_INTERACTIONS', `Quick loaded preset: ${presetName}`);
                }
            });
        }

        // Add/Save Preset Button Handler
        const addBtn = context.querySelector('#add-preset-btn');
        if (addBtn && !addBtn.hasAttribute('data-handler-setup')) {
            addBtn.setAttribute('data-handler-setup', 'true');
            addBtn.addEventListener('click', () => {
                const input = context.querySelector('#preset-name-input');
                const name = input.value.trim();
                if (name && UnifiedState.atoms.activePets && UnifiedState.atoms.activePets.length) {
                    UnifiedState.data.petPresets[name] = UnifiedState.atoms.activePets.slice(0, 3).map(p => ({
                        id: p.id,
                        petSpecies: p.petSpecies,
                        mutations: p.mutations || []
                    }));
                    MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
                    input.value = ''; // Clear input after successful add

                    // Add preset name to order array
                    ensurePresetOrder();
                    if (!UnifiedState.data.petPresetsOrder.includes(name)) {
                        UnifiedState.data.petPresetsOrder.push(name);
                        MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);
                    }

                    // Refresh preset list to show in correct order
                    refreshPresetsList(context);

                    // Update dropdown
                    updatePetPresetDropdown(context);

                    // Update popouts
                    refreshSeparateWindowPopouts('pets');
                    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                        if (overlay && document.contains(overlay) && tabName === 'pets') {
                            if (overlay.className.includes('mga-overlay-content-only')) {
                                updatePureOverlayContent(overlay, tabName);
                            }
                        }
                    });

                    debugLog('BUTTON_INTERACTIONS', `Created new preset: ${name} without full DOM refresh`);
                } else if (!name) {
                    input.focus(); // Focus input if name is empty
                }
            });
        }

        // Prevent duplicate event listeners by checking if already handled
        context.querySelectorAll('[data-action]').forEach(btn => {
            if (btn.hasAttribute('data-handler-setup')) {
                return; // Skip if already has event listener
            }
            btn.setAttribute('data-handler-setup', 'true');

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                debugLog('BUTTON_INTERACTIONS', `Button clicked: ${e.target.dataset.action}`, {
                    preset: e.target.dataset.preset,
                    buttonText: e.target.textContent
                });

                const action = e.target.dataset.action;
                const presetName = e.target.dataset.preset;

                if (action === 'save') {
                    UnifiedState.data.petPresets[presetName] = (UnifiedState.atoms.activePets || []).slice(0, 3);
                    MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);

                    // Update only the quick select dropdown without full refresh
                    updatePetPresetDropdown(context);

                    // Update all pet overlays (they need full updates for popouts)
                    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                        if (overlay && document.contains(overlay) && tabName === 'pets') {
                            if (overlay.className.includes('mga-overlay-content-only')) {
                                updatePureOverlayContent(overlay, tabName);
                                debugLog('OVERLAY_LIFECYCLE', 'Updated pure pets overlay after saving preset');
                            }
                        }
                    });

                    // Update separate window popouts
                    refreshSeparateWindowPopouts('pets');

                    debugLog('BUTTON_INTERACTIONS', `Saved preset: ${presetName} without full DOM refresh`);
                } else if (action === 'place') {
                    const preset = UnifiedState.data.petPresets[presetName];
                    if (!preset) return;

                    // Store current pets
                    (UnifiedState.atoms.activePets || []).forEach(p => {
                        safeSendMessage({
                            scopePath: ["Room", "Quinoa"],
                            type: "StorePet",
                            itemId: p.id
                        });
                    });

                    // Place preset pets
                    preset.forEach((p, i) => {
                        safeSendMessage({
                            scopePath: ["Room", "Quinoa"],
                            type: "PlacePet",
                            itemId: p.id,
                            position: { x: 17 + i * 2, y: 13 },
                            localTileIndex: 64,
                            tileType: "Boardwalk"
                        });
                    });

                    // Update pets display after placement (with delay for game to update)
                    setTimeout(() => {
                        // Force update pets from room state first
                        updateActivePetsFromRoomState();

                        // Update main tab if pets tab is active
                        if (UnifiedState.activeTab === 'pets') {
                            updateTabContent();
                        }

                        // Update all pet overlays after placing
                        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                            if (overlay && document.contains(overlay) && tabName === 'pets') {
                                if (overlay.className.includes('mga-overlay-content-only')) {
                                    updatePureOverlayContent(overlay, tabName);
                                    debugLog('OVERLAY_LIFECYCLE', 'Updated pure pets overlay after placing preset');
                                }
                            }
                        });

                        // Update separate window popouts
                        refreshSeparateWindowPopouts('pets');
                    }, 1000); // Increased from 100ms to 1000ms to give game time to update
                } else if (action === 'remove') {
                    delete UnifiedState.data.petPresets[presetName];
                    MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);

                    // Remove the preset element from DOM without full refresh
                    const presetElement = e.target.closest('.mga-preset');
                    if (presetElement) {
                        presetElement.remove();
                    }

                    // Update the dropdown
                    updatePetPresetDropdown(context);

                    // Update all pet overlays
                    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                        if (overlay && document.contains(overlay) && tabName === 'pets') {
                            if (overlay.className.includes('mga-overlay-content-only')) {
                                updatePureOverlayContent(overlay, tabName);
                                debugLog('OVERLAY_LIFECYCLE', 'Updated pure pets overlay after removing preset');
                            }
                        }
                    });

                    // Update separate window popouts
                    refreshSeparateWindowPopouts('pets');

                    debugLog('BUTTON_INTERACTIONS', `Removed preset: ${presetName} without full DOM refresh`);
                }
            });
        });

        // Handle popout preset buttons (simplified interface)
        context.querySelectorAll('[data-preset]').forEach(btn => {
            if (btn.hasAttribute('data-handler-setup')) return;
            btn.setAttribute('data-handler-setup', 'true');

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const presetName = e.target.dataset.preset;
                const preset = UnifiedState.data.petPresets[presetName];

                if (!preset || !preset.length) {
                    productionWarn(`⚠️ Preset "${presetName}" not found or empty!`);
                    return;
                }

                debugLog('BUTTON_INTERACTIONS', `Loading preset from popout: ${presetName}`, { preset });

                // Clear existing pets
                (UnifiedState.atoms.activePets || []).forEach(p => {
                    safeSendMessage({
                        scopePath: ["Room", "Quinoa"],
                        type: "RemovePet",
                        itemId: p.id
                    });
                });

                // Place preset pets
                preset.forEach((p, i) => {
                    safeSendMessage({
                        scopePath: ["Room", "Quinoa"],
                        type: "PlacePet",
                        itemId: p.id,
                        position: { x: 17 + i * 2, y: 13 },
                        localTileIndex: 64,
                        tileType: "Boardwalk"
                    });
                });

                // Update popouts after loading (changed from 100ms to 1000ms for game to update)
                setTimeout(() => {
                    updateActivePetsFromRoomState();
                    refreshSeparateWindowPopouts('pets');
                    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                        if (overlay && document.contains(overlay) && tabName === 'pets') {
                            if (overlay.className.includes('mga-overlay-content-only')) {
                                updatePureOverlayContent(overlay, tabName);
                            }
                        }
                    });
                }, 1000);
            });
        });

        // Pet management handlers will be added here when we detect actual Magic Garden pets
    }

    // ==================== MAGIC GARDEN PET HELPERS ====================
    // Pet helpers for actual Magic Garden pets (not generic fantasy pets)

    class ResourceDashboard {
        constructor() {
            this.resourceHistory = JSON.parse(localStorage.getItem('MGA_resourceHistory') || '[]');
            this.resourceAlerts = JSON.parse(localStorage.getItem('MGA_resourceAlerts') || '{}');

            // Initialize resource tracking if not exists
            if (!UnifiedState.data.resources) {
                UnifiedState.data.resources = {
                    coins: 0,
                    gems: 0,
                    seeds: {},
                    tiles: 0,
                    lastUpdate: Date.now()
                };
            }
        }

        updateResourceHistory() {
            try {
                const currentResources = {
                    timestamp: Date.now(),
                    coins: UnifiedState.atoms.coinCount || 0,
                    gems: UnifiedState.atoms.gems || 0,
                    seeds: Object.keys(UnifiedState.atoms.seedInventory || {}).length,
                    tiles: UnifiedState.atoms.tiles || 0
                };

                this.resourceHistory.push(currentResources);
                if (this.resourceHistory.length > 100) {
                    this.resourceHistory = this.resourceHistory.slice(-100);
                }
                localStorage.setItem('MGA_resourceHistory', JSON.stringify(this.resourceHistory));
            } catch (error) {
                console.error('Error updating resource history:', error);
            }
        }

        generateDashboard() {
            const latest = this.resourceHistory[this.resourceHistory.length - 1];
            if (!latest) {
                return `<div class="mga-section"><div class="mga-section-title">📊 Resource Dashboard</div><div style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">No resource data available yet.</div></div>`;
            }

            return `
                <div class="mga-section">
                    <div class="mga-section-title">📊 Resource Dashboard</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 15px 0;">
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="color: #F59E0B; font-size: 24px; font-weight: bold;">${latest.coins.toLocaleString()}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">💰 Coins</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="color: #8B5CF6; font-size: 24px; font-weight: bold;">${latest.gems.toLocaleString()}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">💎 Gems</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="color: #10B981; font-size: 24px; font-weight: bold;">${latest.seeds}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px;">🌱 Seeds</div>
                        </div>
                    </div>
                </div>
            `;
        }

        setupDashboardHandlers(context = document) {
            // Resource dashboard handlers
        }
    }

    // Create global instance
    window.resourceDashboard = new ResourceDashboard();

    function setupAbilitiesTabHandlers(context = document) {
        debugLog('ABILITY_LOGS', 'Setting up abilities tab handlers with context', {
            isDocument: context === document,
            className: context.className || 'unknown'
        });

        // Set up ability logs handlers
        const clearBtn = context.querySelector('#clear-ability-logs');
        if (clearBtn && !clearBtn.hasAttribute('data-handler-setup')) {
            clearBtn.setAttribute('data-handler-setup', 'true');
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all ability logs? This cannot be undone!')) {
                    UnifiedState.data.petAbilityLogs = [];
                    MGA_saveJSON('MGA_petAbilityLogs', []);
                    updateAbilityLogDisplay(context);
                }
            });
        }
    }

    // Duplicate function removed - using enhanced version later in file

    // ==================== LOADING STATE UTILITIES ====================
    window.MGA_LoadingStates = {
        show: (element, text = 'Loading...') => {
            if (!element) return;
            const loadingHtml = `
                <div class="mga-loading">
                    <div class="mga-loading-spinner"></div>
                    <span>${text}</span>
                </div>
            `;
            element.innerHTML = loadingHtml;
        },

        showSkeleton: (element, lines = 3) => {
            if (!element) return;
            const skeletonLines = Array(lines).fill(0).map(() =>
                `<div class="mga-skeleton" style="height: 20px; margin-bottom: 8px; width: ${Math.floor(Math.random() * 40 + 60)}%;"></div>`
            ).join('');
            element.innerHTML = `<div style="padding: 20px;">${skeletonLines}</div>`;
        },

        hide: (element, content, fadeIn = true) => {
            if (!element) return;
            element.innerHTML = content;
            if (fadeIn) {
                element.classList.add('mga-fade-in');
                setTimeout(() => element.classList.remove('mga-fade-in'), 300);
            }
        }
    };


    function setupAbilitiesTabHandlers(context = document) {
        debugLog('ABILITY_LOGS', 'Setting up abilities tab handlers with context', {
            isDocument: context === document,
            className: context.className || 'document'
        });

        // Filter mode switching
        const categoriesBtn = context.querySelector('#filter-mode-categories');
        const byPetBtn = context.querySelector('#filter-mode-bypet');
        const customBtn = context.querySelector('#filter-mode-custom');

        if (categoriesBtn && !categoriesBtn.hasAttribute('data-handler-setup')) {
            categoriesBtn.setAttribute('data-handler-setup', 'true');
            categoriesBtn.addEventListener('click', () => switchFilterMode('categories'));
        }
        if (byPetBtn && !byPetBtn.hasAttribute('data-handler-setup')) {
            byPetBtn.setAttribute('data-handler-setup', 'true');
            byPetBtn.addEventListener('click', () => switchFilterMode('byPet'));
        }
        if (customBtn && !customBtn.hasAttribute('data-handler-setup')) {
            customBtn.setAttribute('data-handler-setup', 'true');
            customBtn.addEventListener('click', () => switchFilterMode('custom'));
        }

        // All/None filter buttons (context-aware)
        const selectAllBtn = context.querySelector('#select-all-filters');
        const selectNoneBtn = context.querySelector('#select-none-filters');

        if (selectAllBtn && !selectAllBtn.hasAttribute('data-handler-setup')) {
            selectAllBtn.setAttribute('data-handler-setup', 'true');
            selectAllBtn.addEventListener('click', () => {
                const mode = UnifiedState.data.filterMode || 'categories';
                selectAllFilters(mode);
            });
        }

        if (selectNoneBtn && !selectNoneBtn.hasAttribute('data-handler-setup')) {
            selectNoneBtn.setAttribute('data-handler-setup', 'true');
            selectNoneBtn.addEventListener('click', () => {
                const mode = UnifiedState.data.filterMode || 'categories';
                selectNoneFilters(mode);
            });
        }

        // Category filter checkboxes - USE CONTEXT-AWARE SELECTORS
        context.querySelectorAll('#category-filters .mga-checkbox[data-filter]').forEach(checkbox => {
            if (!checkbox.hasAttribute('data-handler-setup')) {
                checkbox.setAttribute('data-handler-setup', 'true');
                checkbox.addEventListener('change', (e) => {
                    const filterKey = e.target.dataset.filter;
                    UnifiedState.data.abilityFilters[filterKey] = e.target.checked;
                    MGA_saveJSON('MGA_abilityFilters', UnifiedState.data.abilityFilters);

                    // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
                    updateAllLogVisibility();
                    debugLog('ABILITY_LOGS', `Filter ${filterKey} changed to ${e.target.checked}, updated visibility via CSS`);
                });
            }
        });

        // Basic action buttons
        const clearLogsBtn = context.querySelector('#clear-logs-btn');
        if (clearLogsBtn && !clearLogsBtn.hasAttribute('data-handler-setup')) {
            clearLogsBtn.setAttribute('data-handler-setup', 'true');
            clearLogsBtn.addEventListener('click', () => {
                // Clear both memory and archived logs
                UnifiedState.data.petAbilityLogs = [];
                MGA_saveJSON('MGA_petAbilityLogs', []);
                MGA_saveJSON('MGA_petAbilityLogs_archive', []);
                lastLogCount = 0; // Reset log count tracker
                updateTabContent();
                updateAllAbilityLogDisplays();
                productionLog('🗑️ [ABILITIES] Cleared all ability logs (memory + archive)');
            });
        }

        const exportLogsBtn = context.querySelector('#export-logs-btn');
        if (exportLogsBtn && !exportLogsBtn.hasAttribute('data-handler-setup')) {
            exportLogsBtn.setAttribute('data-handler-setup', 'true');
            exportLogsBtn.addEventListener('click', () => {
                exportAbilityLogs();
            });
        }

        // Detailed timestamps checkbox
        const detailedTimestampsCheckbox = context.querySelector('#detailed-timestamps-checkbox');
        if (detailedTimestampsCheckbox && !detailedTimestampsCheckbox.hasAttribute('data-handler-setup')) {
            detailedTimestampsCheckbox.setAttribute('data-handler-setup', 'true');
            detailedTimestampsCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.detailedTimestamps = e.target.checked;
                MGA_saveJSON('MGA_data', UnifiedState.data);

                // Clear timestamp cache and force full rebuild for timestamp format change
                MGA_AbilityCache.timestamps.clear();

                // BUGFIX: Force overlay refresh to show new timestamp format
                // Update all overlays first to ensure they show the new format
                UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                    if (tabName === 'abilities' && overlay && overlay.offsetParent !== null) {
                        updateAbilityLogDisplay(overlay);
                        debugLog('ABILITY_LOGS', 'Updated overlay with new timestamp format');
                    }
                });

                // Then update main displays
                updateAllAbilityLogDisplays(true);
                productionLog(`🕐 [ABILITIES] Detailed timestamps: ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }

        // Test Abilities button removed - function kept for potential debugging use

        // Initialize the current filter mode display
        const currentMode = UnifiedState.data.filterMode || 'categories';
        setTimeout(() => populateFilterModeContent(currentMode), 100);
    }

    // PERFORMANCE OPTIMIZATION: Caching for expensive operations
    const MGA_AbilityCache = {
        categories: new Map(),
        timestamps: new Map(),
        normalizedNames: new Map(),
        lastTimestampUpdate: 0
    };

    // Clear timestamp cache every minute (timestamps change over time)
    setInterval(() => {
        MGA_AbilityCache.timestamps.clear();
        MGA_AbilityCache.lastTimestampUpdate = Date.now();
    }, 60000);

    // Comprehensive ability categorization logic based on Pet Ability Logs 4
    function categorizeAbility(abilityType) {
        const cleanType = (abilityType || '').toLowerCase();

        // 💫 XP Boost (for pet experience)
        if (cleanType.includes('xp') && cleanType.includes('boost')) {
            return 'xp-boost';
        }
        if (cleanType.includes('hatch') && cleanType.includes('xp')) {
            return 'xp-boost';
        }

        // 📈 Crop Size Boost (for scaling crops)
        if (cleanType.includes('crop') && (cleanType.includes('size') || cleanType.includes('scale'))) {
            return 'crop-size-boost';
        }

        // 💰 Selling (for selling crops/pets)
        if (cleanType.includes('sell') && cleanType.includes('boost')) {
            return 'selling';
        }
        if (cleanType.includes('refund')) {
            return 'selling';
        }

        // 🌾 Harvesting (for harvesting crops)
        if (cleanType.includes('double') && cleanType.includes('harvest')) {
            return 'harvesting';
        }

        // 🐢 Growth Speed (plant and egg growth)
        if (cleanType.includes('growth') && cleanType.includes('boost')) {
            return 'growth-speed';
        }
        if (cleanType.includes('plant') && cleanType.includes('growth')) {
            return 'growth-speed';
        }
        if (cleanType.includes('egg') && cleanType.includes('growth')) {
            return 'growth-speed';
        }

        // 🌈✨ Special Mutations (Rainbow/Gold conversion)
        if (cleanType.includes('rainbow') || cleanType.includes('gold')) {
            return 'special-mutations';
        }

        // 🔧 Other (passive abilities, pet management, etc.)
        return 'other';
    }

    function updateAbilityLogDisplay(context = document) {
        const abilityLogs = context.querySelector('#ability-logs');
        if (!abilityLogs) {
            debugLog('ABILITY_LOGS', 'No ability logs element found in context', {
                isDocument: context === document,
                className: context.className || 'unknown'
            });
            return;
        }

        // Preserve drag state if this is a content-only overlay being updated
        const isOverlay = context.classList?.contains('mga-overlay-content-only');
        const isDragInProgress = context.getAttribute?.('data-dragging') === 'true';
        if (isOverlay && isDragInProgress) {
            debugLog('ABILITY_LOGS', 'Skipping content update during drag operation', {
                overlayId: context.id
            });
            return;
        }

        const logs = MGA_getAllLogs(); // Show all logs including archived - user requested 100% persistence
        const filteredLogs = logs.filter(log => {
            return shouldLogAbility(log.abilityType, log.petName);
        });

        debugLog('ABILITY_LOGS', 'Updating ability log display', {
            totalLogs: logs.length,
            filteredLogs: filteredLogs.length,
            filterMode: UnifiedState.data.filterMode
        });

        const htmlParts = [];
        filteredLogs.forEach((log, index) => {
            const category = categorizeAbilityToFilterKey(log.abilityType);
            const categoryData = {
                xpBoost: { icon: '💫', color: '#4a9eff', label: 'XP Boost' },
                cropSizeBoost: { icon: '📈', color: '#10b981', label: 'Crop Size' },
                selling: { icon: '💰', color: '#f59e0b', label: 'Selling' },
                harvesting: { icon: '🌾', color: '#84cc16', label: 'Harvesting' },
                growthSpeed: { icon: '🐢', color: '#06b6d4', label: 'Growth Speed' },
                specialMutations: { icon: '🌈✨', color: '#8b5cf6', label: 'Special' },
                other: { icon: '🔧', color: '#6b7280', label: 'Other' }
            };

            const catData = categoryData[category] || categoryData.other;
            const formattedTime = formatTimestamp(log.timestamp);
            const isRecent = (Date.now() - log.timestamp) < 10000; // Less than 10 seconds ago
            const displayAbilityName = normalizeAbilityName(log.abilityType);

            htmlParts.push(`
                <div class="mga-log-item ${isRecent ? 'mga-log-recent' : ''}" data-category="${category}" data-ability-type="${log.abilityType}" data-pet-name="${log.petName}" style="--category-color: ${catData.color}">
                    <div class="mga-log-header">
                        <span class="mga-log-icon">${catData.icon}</span>
                        <span class="mga-log-meta">
                            <span class="mga-log-pet" style="color: ${catData.color}; font-weight: 600;">${log.petName}</span>
                            <span class="mga-log-time">${formattedTime}</span>
                        </span>
                    </div>
                    <div class="mga-log-ability">${displayAbilityName}</div>
                    ${log.data && Object.keys(log.data).length > 0 ?
                        `<div class="mga-log-details">${formatLogData(log.data)}</div>` : ''}
                </div>
            `);
        });

        // PERFORMANCE: Use DocumentFragment for batch DOM updates
        const fragment = targetDocument.createDocumentFragment();
        const tempContainer = targetDocument.createElement('div');

        if (htmlParts.length === 0) {
            const mode = UnifiedState.data.filterMode || 'categories';
            const modeText = mode === 'categories' ? 'category filters' :
                            mode === 'byPet' ? 'pet filters' :
                            'custom filters';
            tempContainer.innerHTML = `<div class="mga-log-empty">
                <div style="color: #888; text-align: center; padding: 20px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
                    <div>No abilities match the current ${modeText}</div>
                    <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Try adjusting your filter settings</div>
                </div>
            </div>`;
        } else {
            tempContainer.innerHTML = htmlParts.join('');
            // Auto-scroll to newest if there are new entries
            setTimeout(() => {
                if (abilityLogs.scrollHeight > abilityLogs.clientHeight) {
                    abilityLogs.scrollTop = 0; // Scroll to top (newest entries)
                }
            }, 100);
        }

        // Move all children to fragment, then update DOM once
        while (tempContainer.firstChild) {
            fragment.appendChild(tempContainer.firstChild);
        }

        abilityLogs.innerHTML = '';
        abilityLogs.appendChild(fragment);

        // Add enhanced log styles if not already present
        if (!context.querySelector('#mga-log-styles')) {
            const logStyles = targetDocument.createElement('style');
            logStyles.id = 'mga-log-styles';
            logStyles.textContent = `
                .mga-log-item {
                    margin: 4px 0;
                    padding: 8px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.02);
                    border-left: 2px solid var(--category-color, #6b7280);
                    transition: all 0.2s ease;
                    font-size: 11px;
                    line-height: 1.3;
                }

                .mga-log-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateX(2px);
                }

                .mga-log-recent {
                    background: rgba(74, 158, 255, 0.1);
                    border-color: #4a9eff;
                    box-shadow: 0 0 8px rgba(74, 158, 255, 0.3);
                    animation: mgaLogPulse 2s ease-out;
                }

                @keyframes mgaLogPulse {
                    0% { box-shadow: 0 0 8px rgba(74, 158, 255, 0.6); }
                    100% { box-shadow: 0 0 8px rgba(74, 158, 255, 0.3); }
                }

                .mga-log-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 2px;
                }

                .mga-log-icon {
                    font-size: 12px;
                }

                .mga-log-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }

                .mga-log-pet {
                    font-weight: 600;
                    font-size: 11px;
                }

                .mga-log-time {
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-left: auto;
                }

                .mga-log-ability {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 10px;
                    margin: 2px 0 0 18px;
                }

                .mga-log-details {
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 2px 0 0 18px;
                    font-style: italic;
                }

                .mga-log-empty {
                    text-align: center;
                    padding: 20px;
                    color: #888;
                }
            `;
            (context.head || context.querySelector('head') || targetDocument.head).appendChild(logStyles);
        }
    }

    function formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) { // Less than 1 minute
            const seconds = Math.floor(diff / 1000);
            return `${seconds}s ago`;
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return new Date(timestamp).toLocaleDateString();
        }
    }

    function formatLogData(data) {
        if (!data || typeof data !== 'object') return '';

        const formatted = Object.entries(data)
            .filter(([key, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return formatted.length > 60 ? formatted.substring(0, 60) + '...' : formatted;
    }

    // Update ability logs across ALL overlays and contexts
    // OPTIMIZED: Track log count to skip unnecessary updates
    let lastLogCount = 0;

    function updateAllAbilityLogDisplays(force = false) {
        // OPTIMIZED: Skip if no new logs (unless forced by settings change)
        const currentLogCount = UnifiedState.data.petAbilityLogs?.length || 0;
        if (!force && currentLogCount === lastLogCount) {
            debugLog('ABILITY_LOGS', 'Skipping update - no new logs');
            return;
        }
        lastLogCount = currentLogCount;

        debugLog('ABILITY_LOGS', 'Updating ability logs across all contexts');

        // Update main document context
        updateAbilityLogDisplay(document);

        // OPTIMIZED: Only query DOM once and filter for visible overlays
        const allOverlays = targetDocument.querySelectorAll('.mga-overlay-content-only, .mga-overlay');
        allOverlays.forEach(overlay => {
            // Skip if hidden
            if (overlay.offsetParent === null) return;

            if (overlay.querySelector('#ability-logs')) {
                updateAbilityLogDisplay(overlay);
                debugLog('ABILITY_LOGS', 'Updated overlay ability logs', { overlayId: overlay.id });
            }
        });

        // BUGFIX: Update separate window pop-outs in real-time
        UnifiedState.data.popouts.windows.forEach((windowRef, tabName) => {
            if (windowRef && !windowRef.closed && tabName === 'abilities') {
                try {
                    // Method 1: Direct DOM manipulation (most reliable)
                    const popoutContent = windowRef.document?.getElementById('popout-content');
                    if (popoutContent) {
                        // Get fresh content from main window
                        const freshContent = getAbilitiesTabContent();
                        popoutContent.innerHTML = freshContent;

                        // Re-run handlers in the pop-out window context
                        if (typeof setupAbilitiesTabHandlers === 'function') {
                            setupAbilitiesTabHandlers.call(window, windowRef.document);
                        }
                        debugLog('ABILITY_LOGS', 'Updated pop-out via direct DOM manipulation');
                    } else {
                        debugLog('ABILITY_LOGS', 'Pop-out content element not found, trying fallback');

                        // Fallback: Try to call the refresh function if it exists
                        if (windowRef.refreshPopoutContent && typeof windowRef.refreshPopoutContent === 'function') {
                            windowRef.refreshPopoutContent('abilities');
                            debugLog('ABILITY_LOGS', 'Updated pop-out via refresh function');
                        }
                    }
                } catch (e) {
                    debugLog('ABILITY_LOGS', 'Error updating separate window:', e.message);

                    // Last resort: Force reload (disruptive but ensures fresh data)
                    try {
                        windowRef.location.reload();
                        debugLog('ABILITY_LOGS', 'Forced pop-out refresh via reload');
                    } catch (e2) {
                        // Window is truly dead, clean up reference
                        debugLog('ABILITY_LOGS', 'Window is dead, removing reference');
                        UnifiedState.data.popouts.windows.delete(tabName);
                    }
                }
            }
        });
    }

    // PERFORMANCE OPTIMIZATION: CSS-based filtering instead of DOM rebuild
    function updateLogVisibility(context = document) {
        const abilityLogs = context.querySelector('#ability-logs');
        if (!abilityLogs) return;

        const filterMode = UnifiedState.data.filterMode || 'categories';
        const logItems = abilityLogs.querySelectorAll('.mga-log-item');

        debugLog('ABILITY_LOGS', 'Updating log visibility via CSS', {
            filterMode,
            totalItems: logItems.length
        });

        logItems.forEach(item => {
            let shouldShow = false;

            if (filterMode === 'categories') {
                const category = item.dataset.category;
                shouldShow = UnifiedState.data.abilityFilters[category] || false;
            } else if (filterMode === 'byPet') {
                const petName = item.dataset.petName;
                shouldShow = UnifiedState.data.petFilters.selectedPets[petName] || false;
            } else if (filterMode === 'custom') {
                const abilityType = item.dataset.abilityType;
                shouldShow = UnifiedState.data.customAbilityFilters[abilityType] || false;
            }

            item.style.display = shouldShow ? '' : 'none';
        });
    }

    // Apply visibility update to all contexts
    function updateAllLogVisibility() {
        debugLog('ABILITY_LOGS', 'Updating log visibility across all contexts');

        updateLogVisibility(document);

        const allOverlays = targetDocument.querySelectorAll('.mga-overlay-content-only, .mga-overlay');
        allOverlays.forEach(overlay => {
            if (overlay.offsetParent === null) return;
            if (overlay.querySelector('#ability-logs')) {
                updateLogVisibility(overlay);
            }
        });
    }

    function addTestAbilities() {
        const testLogs = [
            // 💫 XP Boost
            { petName: 'Goat', abilityType: 'XP Boost I', timestamp: Date.now() - 1000 },
            { petName: 'Peacock', abilityType: 'XP Boost II', timestamp: Date.now() - 2000 },
            { petName: 'Pig', abilityType: 'Hatch XP Boost I', timestamp: Date.now() - 3000 },
            { petName: 'Goat', abilityType: 'Hatch XP Boost II', timestamp: Date.now() - 4000 },

            // 📈 Crop Size Boost
            { petName: 'Bee', abilityType: 'Crop Size Boost I', timestamp: Date.now() - 5000 },
            { petName: 'Butterfly', abilityType: 'Crop Size Boost II', timestamp: Date.now() - 6000 },

            // 💰 Selling
            { petName: 'Bunny', abilityType: 'Sell Boost I', timestamp: Date.now() - 7000 },
            { petName: 'Pig', abilityType: 'Sell Boost II', timestamp: Date.now() - 8000 },
            { petName: 'Squirrel', abilityType: 'Sell Boost III', timestamp: Date.now() - 9000 },
            { petName: 'Peacock', abilityType: 'Sell Boost IV', timestamp: Date.now() - 10000 },
            { petName: 'Capybara', abilityType: 'Crop Refund', timestamp: Date.now() - 11000 },
            { petName: 'Chicken', abilityType: 'Pet Refund I', timestamp: Date.now() - 12000 },

            // 🌾 Harvesting
            { petName: 'Capybara', abilityType: 'Double Harvest', timestamp: Date.now() - 13000 },

            // 🐢 Growth Speed
            { petName: 'Cow', abilityType: 'Plant Growth Boost I', timestamp: Date.now() - 14000 },
            { petName: 'Turtle', abilityType: 'Plant Growth Boost II', timestamp: Date.now() - 15000 },
            { petName: 'Chicken', abilityType: 'Egg Growth Boost I', timestamp: Date.now() - 16000 },
            { petName: 'Turtle', abilityType: 'Egg Growth Boost II', timestamp: Date.now() - 17000 },

            // 🌈✨ Special Mutations
            { petName: 'Test Pet', abilityType: 'Rainbow Granter', timestamp: Date.now() - 18000 },
            { petName: 'Test Pet', abilityType: 'Gold Granter', timestamp: Date.now() - 19000 },

            // 🔧 Other
            { petName: 'Snail', abilityType: 'Coin Finder I', timestamp: Date.now() - 20000 },
            { petName: 'Bunny', abilityType: 'Coin Finder II', timestamp: Date.now() - 21000 },
            { petName: 'Squirrel', abilityType: 'Coin Finder III', timestamp: Date.now() - 22000 },
            { petName: 'Worm', abilityType: 'Seed Finder I', timestamp: Date.now() - 23000 },
            { petName: 'Cow', abilityType: 'Seed Finder II', timestamp: Date.now() - 24000 },
            { petName: 'Butterfly', abilityType: 'Seed Finder III', timestamp: Date.now() - 25000 },
            { petName: 'Worm', abilityType: 'Crop Eater', timestamp: Date.now() - 26000 },
            { petName: 'Cow', abilityType: 'Hunger Boost I', timestamp: Date.now() - 27000 },
            { petName: 'Turtle', abilityType: 'Hunger Boost II', timestamp: Date.now() - 28000 },
            { petName: 'Pig', abilityType: 'Max Strength Boost I', timestamp: Date.now() - 29000 },
            { petName: 'Goat', abilityType: 'Max Strength Boost II', timestamp: Date.now() - 30000 }
        ];

        testLogs.forEach(log => {
            log.timeString = new Date(log.timestamp).toLocaleTimeString();
            UnifiedState.data.petAbilityLogs.unshift(log);
        });

        // Apply memory management to keep recent logs in memory, archive older ones
        UnifiedState.data.petAbilityLogs = MGA_manageLogMemory(UnifiedState.data.petAbilityLogs);

        // Use debounced save to reduce I/O operations
        MGA_debouncedSave('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
        productionLog('Added comprehensive test abilities covering all 7 categories!');
    }

    // PAL4 Filter System Functions
    function switchFilterMode(mode) {
        UnifiedState.data.filterMode = mode;
        MGA_saveJSON('MGA_filterMode', mode);

        // Update button states
        targetDocument.querySelectorAll('[id^="filter-mode-"]').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`filter-mode-${mode === 'byPet' ? 'bypet' : mode}`)?.classList.add('active');

        // Update description
        const descriptions = {
            categories: 'Filter by ability categories',
            byPet: 'Filter by pet species',
            custom: 'Filter by individual abilities'
        };
        const descEl = document.getElementById('filter-mode-description');
        if (descEl) descEl.textContent = descriptions[mode];

        // Show/hide appropriate filter sections
        document.getElementById('category-filters').style.display = mode === 'categories' ? 'grid' : 'none';
        document.getElementById('pet-filters').style.display = mode === 'byPet' ? 'block' : 'none';
        document.getElementById('custom-filters').style.display = mode === 'custom' ? 'block' : 'none';

        // Populate content for the selected mode
        populateFilterModeContent(mode);
        // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
        updateAllLogVisibility();
    }

    function populateFilterModeContent(mode) {
        if (mode === 'byPet') {
            populatePetSpeciesList();
        } else if (mode === 'custom') {
            populateIndividualAbilities();
        }
    }

    function populatePetSpeciesList() {
        const container = document.getElementById('pet-species-list');
        if (!container) return;

        const pets = getAllUniquePets();
        container.innerHTML = '';

        if (pets.length === 0) {
            container.innerHTML = '<div style="color: #888; text-align: center;">No pet species found in logs</div>';
            return;
        }

        pets.forEach(pet => {
            const label = targetDocument.createElement('label');
            label.className = 'mga-checkbox-group';
            label.style.display = 'block';
            label.style.marginBottom = '4px';

            const checkbox = targetDocument.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mga-checkbox';
            checkbox.checked = UnifiedState.data.petFilters.selectedPets[pet] || false;

            checkbox.addEventListener('change', (e) => {
                UnifiedState.data.petFilters.selectedPets[pet] = e.target.checked;
                MGA_saveJSON('MGA_petFilters', UnifiedState.data.petFilters);
                // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
                updateAllLogVisibility();
            });

            const span = targetDocument.createElement('span');
            span.className = 'mga-label';
            span.textContent = ` ${pet}`;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    function populateIndividualAbilities() {
        const container = document.getElementById('individual-abilities-list');
        if (!container) return;

        const abilities = getAllUniqueAbilities();
        container.innerHTML = '';

        if (abilities.length === 0) {
            container.innerHTML = '<div style="color: #888; text-align: center;">No individual abilities found in logs</div>';
            return;
        }

        abilities.forEach(ability => {
            const label = targetDocument.createElement('label');
            label.className = 'mga-checkbox-group';
            label.style.display = 'block';
            label.style.marginBottom = '4px';

            const checkbox = targetDocument.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mga-checkbox';
            checkbox.checked = UnifiedState.data.customMode.selectedAbilities[ability] || false;

            checkbox.addEventListener('change', (e) => {
                UnifiedState.data.customMode.selectedAbilities[ability] = e.target.checked;
                MGA_saveJSON('MGA_customMode', UnifiedState.data.customMode);
                // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
                updateAllLogVisibility();
            });

            const span = targetDocument.createElement('span');
            span.className = 'mga-label';
            span.textContent = ` ${normalizeAbilityName(ability)}`;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    function getAllUniquePets() {
        const pets = new Set();
        UnifiedState.data.petAbilityLogs.forEach(log => {
            if (log.petName && log.petName !== 'Test Pet') {
                pets.add(log.petName);
            }
        });
        return Array.from(pets).sort();
    }

    function getAllUniqueAbilities() {
        const abilities = new Set();
        UnifiedState.data.petAbilityLogs.forEach(log => {
            if (log.abilityType) {
                abilities.add(log.abilityType);
            }
        });
        return Array.from(abilities).sort();
    }

    function selectAllFilters(mode) {
        if (mode === 'categories') {
            Object.keys(UnifiedState.data.abilityFilters).forEach(key => {
                UnifiedState.data.abilityFilters[key] = true;
                const checkbox = targetDocument.querySelector(`[data-filter="${key}"]`);
                if (checkbox) checkbox.checked = true;
            });
            MGA_saveJSON('MGA_abilityFilters', UnifiedState.data.abilityFilters);
        } else if (mode === 'byPet') {
            const pets = getAllUniquePets();
            pets.forEach(pet => {
                UnifiedState.data.petFilters.selectedPets[pet] = true;
            });
            MGA_saveJSON('MGA_petFilters', UnifiedState.data.petFilters);
            populatePetSpeciesList();
        } else if (mode === 'custom') {
            const abilities = getAllUniqueAbilities();
            abilities.forEach(ability => {
                UnifiedState.data.customMode.selectedAbilities[ability] = true;
            });
            MGA_saveJSON('MGA_customMode', UnifiedState.data.customMode);
            populateIndividualAbilities();
        }
        // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
        updateAllLogVisibility();
    }

    function selectNoneFilters(mode) {
        if (mode === 'categories') {
            Object.keys(UnifiedState.data.abilityFilters).forEach(key => {
                UnifiedState.data.abilityFilters[key] = false;
                const checkbox = targetDocument.querySelector(`[data-filter="${key}"]`);
                if (checkbox) checkbox.checked = false;
            });
            MGA_saveJSON('MGA_abilityFilters', UnifiedState.data.abilityFilters);
        } else if (mode === 'byPet') {
            UnifiedState.data.petFilters.selectedPets = {};
            MGA_saveJSON('MGA_petFilters', UnifiedState.data.petFilters);
            populatePetSpeciesList();
        } else if (mode === 'custom') {
            UnifiedState.data.customMode.selectedAbilities = {};
            MGA_saveJSON('MGA_customMode', UnifiedState.data.customMode);
            populateIndividualAbilities();
        }
        // PERFORMANCE: Use CSS visibility toggle instead of DOM rebuild
        updateAllLogVisibility();
    }

    // Enhanced shouldLogAbility function matching PAL4 logic
    function shouldLogAbility(abilityType, petName = null) {
        // Filter out ProduceMutationBoost abilities - user doesn't want these logged
        if (abilityType && (
            abilityType.includes('ProduceMutationBoost') ||
            abilityType.includes('PetMutationBoost')
        )) {
            return false;
        }

        const mode = UnifiedState.data.filterMode || 'categories';

        if (mode === 'custom') {
            return UnifiedState.data.customMode.selectedAbilities[abilityType] || false;
        }

        if (mode === 'byPet') {
            if (!petName) return false;
            return UnifiedState.data.petFilters.selectedPets[petName] || false;
        }

        // Categories mode - use existing categorizeAbility logic
        const category = categorizeAbilityToFilterKey(abilityType);
        return UnifiedState.data.abilityFilters[category] || false;
    }

    // Normalize old ability names to current game names
    // This ensures old logged abilities display with their current in-game names
    function normalizeAbilityName(abilityType) {
        if (!abilityType) return abilityType;

        // PERFORMANCE: Check cache first
        if (MGA_AbilityCache.normalizedNames.has(abilityType)) {
            return MGA_AbilityCache.normalizedNames.get(abilityType);
        }

        // Known ability name changes:
        // "Produce Scale Boost" → "Crop Size Boost" (game renamed this ability)
        const normalized = abilityType.replace(/produce\s*scale\s*boost/gi, 'Crop Size Boost');

        // PERFORMANCE: Cache result
        MGA_AbilityCache.normalizedNames.set(abilityType, normalized);

        return normalized;
    }

    function categorizeAbilityToFilterKey(abilityType) {
        // PERFORMANCE: Check cache first
        if (MGA_AbilityCache.categories.has(abilityType)) {
            return MGA_AbilityCache.categories.get(abilityType);
        }

        const cleanType = (abilityType || '').toLowerCase();

        let category = 'other';
        if (cleanType.includes('xp') && cleanType.includes('boost')) category = 'xpBoost';
        else if (cleanType.includes('hatch') && cleanType.includes('xp')) category = 'xpBoost';
        else if (cleanType.includes('crop') && (cleanType.includes('size') || cleanType.includes('scale'))) category = 'cropSizeBoost';
        else if (cleanType.includes('sell') && cleanType.includes('boost')) category = 'selling';
        else if (cleanType.includes('refund')) category = 'selling';
        else if (cleanType.includes('double') && cleanType.includes('harvest')) category = 'harvesting';
        else if (cleanType.includes('growth') && cleanType.includes('boost')) category = 'growthSpeed';
        else if (cleanType.includes('rainbow') || cleanType.includes('gold')) category = 'specialMutations';

        // PERFORMANCE: Cache result
        MGA_AbilityCache.categories.set(abilityType, category);

        return category;
    }

    function setupSeedsTabHandlers(context = document) {
        // Seed ID mapping for initialization
        const seedIdMap = {
            "Carrot": "Carrot", "Strawberry": "Strawberry", "Aloe": "Aloe",
            "Blueberry": "Blueberry", "Apple": "Apple", "Tulip": "OrangeTulip",
            "Tomato": "Tomato", "Daffodil": "Daffodil", "Sunflower": "Sunflower", "Corn": "Corn",
            "Watermelon": "Watermelon", "Pumpkin": "Pumpkin", "Echeveria": "Echeveria",
            "Coconut": "Coconut", "Banana": "Banana", "Lily": "Lily",
            "BurrosTail": "BurrosTail", "Mushroom": "Mushroom", "Cactus": "Cactus",
            "Bamboo": "Bamboo", "Grape": "Grape", "Pepper": "Pepper",
            "Lemon": "Lemon", "PassionFruit": "PassionFruit", "DragonFruit": "DragonFruit",
            "Lychee": "Lychee", "Starweaver": "Starweaver", "Moonbinder": "Moonbinder", "Dawnbinder": "Dawnbinder"
        };

        context.querySelectorAll('.seed-checkbox').forEach(checkbox => {
            // Prevent duplicate event listeners
            if (checkbox.hasAttribute('data-handler-setup')) {
                return;
            }
            checkbox.setAttribute('data-handler-setup', 'true');

            // Initialize checkbox state based on saved seedsToDelete
            const seed = checkbox.dataset.seed;
            const internalId = seedIdMap[seed] || seed;
            if (UnifiedState.data.seedsToDelete.includes(internalId)) {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', (e) => {
                const seed = e.target.dataset.seed;

                // Prevent adding protected seeds to deletion list
                if (e.target.checked && ['Starweaver', 'Moonbinder', 'Dawnbinder', 'Sunflower'].includes(seed)) {
                    e.target.checked = false;
                    const seedType = seed === 'Sunflower' ? 'Divine' : 'Celestial';
                    productionWarn(`❌ ${seed} is a protected ${seedType} seed and cannot be deleted!`);
                    return;
                }

                // Map display name to internal ID for storage (using seedIdMap from function scope)
                const internalId = seedIdMap[seed] || seed;

                if (e.target.checked) {
                    if (!UnifiedState.data.seedsToDelete.includes(internalId)) {
                        UnifiedState.data.seedsToDelete.push(internalId);
                    }
                } else {
                    UnifiedState.data.seedsToDelete = UnifiedState.data.seedsToDelete.filter(s => s !== internalId);
                }

                // Use safe save for critical seed selection data
                const result = MGA_safeSave('MGA_seedsToDelete', UnifiedState.data.seedsToDelete, {
                    description: `seed selection for "${seed}"`,
                    criticalData: true,
                    showUserAlert: true
                });

                if (result.success) {
                    productionLog(`✅ [SEED-SELECTION] Successfully saved seed selection change for "${seed}"`);
                } else {
                    console.error(`❌ [SEED-SELECTION] Failed to save seed selection for "${seed}":`, result.error);
                }

                debugLog('BUTTON_INTERACTIONS', `Seed checkbox changed: ${seed}`, {
                    checked: e.target.checked,
                    seedsToDelete: UnifiedState.data.seedsToDelete
                });
            });
        });

        const autoDeleteCheckbox = context.querySelector('#auto-delete-checkbox');
        if (autoDeleteCheckbox && !autoDeleteCheckbox.hasAttribute('data-handler-setup')) {
            autoDeleteCheckbox.setAttribute('data-handler-setup', 'true');
            autoDeleteCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Confirmation dialog for enabling auto-delete
                    const selectedSeedsText = UnifiedState.data.seedsToDelete.length > 0 ? UnifiedState.data.seedsToDelete.join(', ') : 'No seeds currently selected';
                    const confirmMessage = `⚠️ WARNING: Auto-Delete will IRREVERSIBLY delete seeds!\n\nSelected seeds for auto-deletion:\n${selectedSeedsText}\n\nAuto-delete will continuously remove these seed types from your inventory as soon as they appear. This action cannot be undone.\n\nAre you sure you want to enable Auto-Delete?`;

                    if (!confirm(confirmMessage)) {
                        e.target.checked = false; // Uncheck the box if user cancels
                        return;
                    }
                }
                UnifiedState.data.autoDeleteEnabled = e.target.checked;
                MGA_saveJSON('MGA_autoDeleteEnabled', e.target.checked);
                if (e.target.checked) {
                    startAutoDelete();
                }
                debugLog('BUTTON_INTERACTIONS', `Auto-delete toggled: ${e.target.checked}`);
            });

            // Initialize checkbox state from saved settings
            autoDeleteCheckbox.checked = UnifiedState.data.autoDeleteEnabled;
            if (UnifiedState.data.autoDeleteEnabled) {
                startAutoDelete();
            }
        }

        const deleteSelectedBtn = context.querySelector('#delete-selected-btn');
        if (deleteSelectedBtn && !deleteSelectedBtn.hasAttribute('data-handler-setup')) {
            deleteSelectedBtn.setAttribute('data-handler-setup', 'true');
            deleteSelectedBtn.addEventListener('click', () => {
                deleteSelectedSeeds();
                debugLog('BUTTON_INTERACTIONS', 'Delete selected seeds button clicked', {
                    seedsToDelete: UnifiedState.data.seedsToDelete
                });
            });
        }

        // Select All Seeds Button
        const selectAllBtn = context.querySelector('#select-all-seeds');
        if (selectAllBtn && !selectAllBtn.hasAttribute('data-handler-setup')) {
            selectAllBtn.setAttribute('data-handler-setup', 'true');
            selectAllBtn.addEventListener('click', () => {
                context.querySelectorAll('.seed-checkbox').forEach(checkbox => {
                    const seed = checkbox.dataset.seed;

                    // Skip protected seeds
                    if (['Starweaver', 'Moonbinder', 'Dawnbinder', 'Sunflower'].includes(seed)) {
                        checkbox.checked = false;
                        return;
                    }

                    checkbox.checked = true;
                    // Map to internal ID for storage (using seedIdMap from function scope)
                    const internalId = seedIdMap[seed] || seed;
                    if (!UnifiedState.data.seedsToDelete.includes(internalId)) {
                        UnifiedState.data.seedsToDelete.push(internalId);
                    }
                });
                MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
                debugLog('BUTTON_INTERACTIONS', 'Selected all seeds');
            });
        }

        // Select None Seeds Button
        const selectNoneBtn = context.querySelector('#select-none-seeds');
        if (selectNoneBtn && !selectNoneBtn.hasAttribute('data-handler-setup')) {
            selectNoneBtn.setAttribute('data-handler-setup', 'true');
            selectNoneBtn.addEventListener('click', () => {
                context.querySelectorAll('.seed-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });
                UnifiedState.data.seedsToDelete = [];
                debugLog('BUTTON_INTERACTIONS', 'Deselected all seeds');
            });
        }

        // Select Common Seeds Button
        const selectCommonBtn = context.querySelector('#select-common');
        if (selectCommonBtn && !selectCommonBtn.hasAttribute('data-handler-setup')) {
            selectCommonBtn.setAttribute('data-handler-setup', 'true');
            selectCommonBtn.addEventListener('click', () => {
                const commonSeeds = ["Carrot", "Strawberry", "Aloe"];
                selectSeedsByList(context, commonSeeds);
                debugLog('BUTTON_INTERACTIONS', 'Selected common seeds');
            });
        }

        // Select Uncommon Seeds Button
        const selectUncommonBtn = context.querySelector('#select-uncommon');
        if (selectUncommonBtn && !selectUncommonBtn.hasAttribute('data-handler-setup')) {
            selectUncommonBtn.setAttribute('data-handler-setup', 'true');
            selectUncommonBtn.addEventListener('click', () => {
                const uncommonSeeds = ["Apple", "Tulip", "Tomato", "Blueberry"];
                selectSeedsByList(context, uncommonSeeds);
                debugLog('BUTTON_INTERACTIONS', 'Selected uncommon seeds');
            });
        }

        // Select Rare+ Seeds Button
        const selectRareBtn = context.querySelector('#select-rare');
        if (selectRareBtn && !selectRareBtn.hasAttribute('data-handler-setup')) {
            selectRareBtn.setAttribute('data-handler-setup', 'true');
            selectRareBtn.addEventListener('click', () => {
                const rareSeeds = ["Daffodil", "Corn", "Watermelon", "Pumpkin", "Echeveria", "Coconut", "Banana", "Lily", "BurrosTail", "Mushroom", "Cactus", "Bamboo", "Grape", "Pepper", "Lemon", "PassionFruit", "DragonFruit", "Lychee"];
                selectSeedsByList(context, rareSeeds);
                debugLog('BUTTON_INTERACTIONS', 'Selected rare+ seeds');
            });
        }

        // Calculate Value Button
        const calculateValueBtn = context.querySelector('#calculate-value-btn');
        if (calculateValueBtn && !calculateValueBtn.hasAttribute('data-handler-setup')) {
            calculateValueBtn.setAttribute('data-handler-setup', 'true');
            calculateValueBtn.addEventListener('click', () => {
                calculateSelectedSeedsValue(context);
                debugLog('BUTTON_INTERACTIONS', 'Calculate seeds value clicked');
            });
        }
    }

    // Helper function to select seeds by list
    function selectSeedsByList(context, seedList) {
        // First, clear all selections
        context.querySelectorAll('.seed-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        UnifiedState.data.seedsToDelete = [];

        // Then select the specified seeds (excluding protected seeds)
        context.querySelectorAll('.seed-checkbox').forEach(checkbox => {
            const seed = checkbox.dataset.seed;

            // Skip protected seeds
            if (['Starweaver', 'Moonbinder', 'Dawnbinder', 'Sunflower'].includes(seed)) {
                checkbox.checked = false;
                return;
            }

            if (seedList.includes(seed)) {
                checkbox.checked = true;
                UnifiedState.data.seedsToDelete.push(seed);
            }
        });
        MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
    }

    // Helper function to calculate selected seeds value
    function calculateSelectedSeedsValue(context) {
        const seedValues = {
            // Common seeds
            "Carrot": 10, "Strawberry": 12, "Aloe": 15,
            // Uncommon seeds
            "Apple": 25, "Tulip": 30, "Tomato": 35, "Blueberry": 40,
            // Rare seeds
            "Daffodil": 75, "Sunflower": 85, "Corn": 80, "Watermelon": 90, "Pumpkin": 100,
            // Legendary seeds
            "Echeveria": 200, "Coconut": 250, "Banana": 300, "Lily": 350, "BurrosTail": 400,
            // Mythical seeds
            "Mushroom": 500, "Cactus": 600, "Bamboo": 750, "Grape": 800,
            // Divine seeds
            "Pepper": 1000, "Lemon": 1200, "PassionFruit": 1500, "DragonFruit": 2000, "Lychee": 2500, "Sunflower": 3000,
            // Celestial seeds
            "Starweaver": 5000, "Moonbinder": 7500, "Dawnbinder": 10000
        };

        if (!UnifiedState.atoms.inventory || !UnifiedState.atoms.inventory.items) {
            return;
        }

        let totalValue = 0;
        const inventory = UnifiedState.atoms.inventory.items;

        UnifiedState.data.seedsToDelete.forEach(seedType => {
            const inventoryItem = inventory.find(item =>
                item && item.species && (item.species === seedType || item.species === seedType.replace('Tulip', 'OrangeTulip'))
            );

            if (inventoryItem) {
                const quantity = inventoryItem.quantity || 0;
                const unitValue = seedValues[seedType] || 1;
                totalValue += quantity * unitValue;
            }
        });

        // Show the value display
        const valueDisplay = context.querySelector('#seed-value-display');
        const valueSpan = context.querySelector('#selected-seeds-value');

        if (valueDisplay && valueSpan) {
            valueSpan.textContent = totalValue.toLocaleString();
            valueDisplay.style.display = 'block';

            // Hide after 5 seconds
            setTimeout(() => {
                valueDisplay.style.display = 'none';
            }, 5000);
        }

        debugLog('BUTTON_INTERACTIONS', `Calculated seeds value: ${totalValue}`, {
            selectedSeeds: UnifiedState.data.seedsToDelete,
            totalValue
        });
    }

    // Track current hotkey recording state
    let currentlyRecordingHotkey = null;

    function startRecordingHotkey(key, buttonElement) {
        if (currentlyRecordingHotkey) return; // Already recording

        currentlyRecordingHotkey = key;
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Press any key...';
        buttonElement.style.background = '#ff9900';

        // Add one-time key listener
        const recordHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Skip modifier-only keys
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

            // Allow ESC to cancel
            if (e.key === 'Escape') {
                stopRecordingHotkey(buttonElement, originalText);
                document.removeEventListener('keydown', recordHandler, true);
                return;
            }

            // Build key combination string
            let keyCombo = '';
            if (e.ctrlKey) keyCombo += 'ctrl+';
            if (e.altKey) keyCombo += 'alt+';
            if (e.shiftKey) keyCombo += 'shift+';

            // Handle special keys
            const keyName = e.key === ' ' ? 'space' : e.key.toLowerCase();
            keyCombo += keyName;

            // Check for conflicts
            const conflicts = [];
            Object.entries(UnifiedState.data.hotkeys.gameKeys).forEach(([k, config]) => {
                if (k !== key && config.custom && config.custom === keyCombo) {
                    conflicts.push(config.name);
                }
            });

            if (conflicts.length > 0) {
                alert(`Key "${keyCombo}" is already assigned to: ${conflicts.join(', ')}`);
                stopRecordingHotkey(buttonElement, originalText);
                document.removeEventListener('keydown', recordHandler, true);
                return;
            }

            // Save the new key
            UnifiedState.data.hotkeys.gameKeys[key].custom = keyCombo;
            MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);

            stopRecordingHotkey(buttonElement, null);
            updateTabContent(); // Refresh display to show new key and reset button
            document.removeEventListener('keydown', recordHandler, true);

            productionLog(`🎮 [HOTKEYS] Remapped ${key}: ${UnifiedState.data.hotkeys.gameKeys[key].original} → ${keyCombo}`);
        };

        document.addEventListener('keydown', recordHandler, true);
    }

    function stopRecordingHotkey(buttonElement, originalText) {
        if (!currentlyRecordingHotkey) return;

        if (originalText) {
            buttonElement.textContent = originalText;
        }
        buttonElement.style.background = '';
        currentlyRecordingHotkey = null;
    }

    // ==================== HOTKEY INTERCEPTION & SIMULATION ====================

    function isTypingInInput() {
        const active = document.activeElement;
        return active && (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.isContentEditable
        );
    }

    function parseKeyCombo(combo) {
        const parts = combo.toLowerCase().split('+');
        return {
            ctrl: parts.includes('ctrl'),
            alt: parts.includes('alt'),
            shift: parts.includes('shift'),
            key: parts[parts.length - 1] === 'space' ? ' ' : parts[parts.length - 1]
        };
    }

    function getProperKeyCode(key) {
        // Handle special keys
        const codeMap = {
            ' ': 'Space',
            'space': 'Space',
            'enter': 'Enter',
            'tab': 'Tab',
            'escape': 'Escape',
            'backspace': 'Backspace',
            'delete': 'Delete',
            'arrowup': 'ArrowUp',
            'arrowdown': 'ArrowDown',
            'arrowleft': 'ArrowLeft',
            'arrowright': 'ArrowRight',
            'home': 'Home',
            'end': 'End',
            'pageup': 'PageUp',
            'pagedown': 'PageDown',
            '-': 'Minus',
            '=': 'Equal',
            '[': 'BracketLeft',
            ']': 'BracketRight',
            ';': 'Semicolon',
            "'": 'Quote',
            ',': 'Comma',
            '.': 'Period',
            '/': 'Slash',
            '\\': 'Backslash',
            '`': 'Backquote'
        };

        const lowerKey = key.toLowerCase();

        // Check special keys map
        if (codeMap[lowerKey]) return codeMap[lowerKey];

        // F-keys
        if (/^f([1-9]|1[0-2])$/.test(lowerKey)) {
            return 'F' + lowerKey.substring(1);
        }

        // Numbers
        if (/^[0-9]$/.test(key)) {
            return 'Digit' + key;
        }

        // Letters
        if (/^[a-z]$/i.test(key)) {
            return 'Key' + key.toUpperCase();
        }

        // Fallback - just capitalize
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function matchesKeyCombo(event, combo) {
        const parsed = parseKeyCombo(combo);
        const eventKey = event.key.toLowerCase();

        return (
            event.ctrlKey === parsed.ctrl &&
            event.altKey === parsed.alt &&
            event.shiftKey === parsed.shift &&
            (eventKey === parsed.key || (parsed.key === ' ' && eventKey === ' '))
        );
    }

    // Track which remapped keys are currently held down
    const heldRemappedKeys = new Map(); // customKey → originalKey

    function simulateKeyDown(keyCombo) {
        const parsed = parseKeyCombo(keyCombo);

        // Create keydown event
        const downEvent = new KeyboardEvent('keydown', {
            key: parsed.key,
            code: getProperKeyCode(parsed.key),
            ctrlKey: parsed.ctrl,
            altKey: parsed.alt,
            shiftKey: parsed.shift,
            bubbles: true,
            cancelable: true,
            repeat: false // First press
        });

        // Dispatch to document (where game listens)
        document.dispatchEvent(downEvent);
    }

    function simulateKeyUp(keyCombo) {
        const parsed = parseKeyCombo(keyCombo);

        // Create keyup event
        const upEvent = new KeyboardEvent('keyup', {
            key: parsed.key,
            code: getProperKeyCode(parsed.key),
            ctrlKey: parsed.ctrl,
            altKey: parsed.alt,
            shiftKey: parsed.shift,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(upEvent);
    }

    function handleHotkeyPress(e) {
        // Skip if disabled, typing in input, recording a hotkey, or in room search
        const isRoomSearch = e.target && e.target.id === 'room-search-input';

        // CRITICAL: Skip simulated events to prevent infinite loops
        // Simulated events have isTrusted: false, real user keypresses have isTrusted: true
        if (!e.isTrusted) return;

        if (!UnifiedState.data.hotkeys.enabled || isTypingInInput() || currentlyRecordingHotkey || isRoomSearch) return;

        const isKeyDown = e.type === 'keydown';
        const isKeyUp = e.type === 'keyup';

        // STEP 1: Check each remapped key (custom → original)
        for (const [action, config] of Object.entries(UnifiedState.data.hotkeys.gameKeys)) {
            if (config.custom) {
                // Check if pressed key matches custom mapping
                if (matchesKeyCombo(e, config.custom)) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isKeyDown) {
                        // Only simulate keydown once per hold (ignore repeat events)
                        if (!e.repeat) {
                            simulateKeyDown(config.original);
                            heldRemappedKeys.set(config.custom, config.original);
                            if (UnifiedState.data.settings.debugMode) {
                                productionLog(`🎮 [HOTKEYS] Remapped keydown ${config.custom} → ${config.original} (${config.name})`);
                            }
                        }
                    } else if (isKeyUp) {
                        // Simulate keyup when released
                        simulateKeyUp(config.original);
                        heldRemappedKeys.delete(config.custom);
                        if (UnifiedState.data.settings.debugMode) {
                            productionLog(`🎮 [HOTKEYS] Remapped keyup ${config.custom} → ${config.original} (${config.name})`);
                        }
                    }
                    return false;
                }
            }
        }

        // STEP 2: Suppress original keys that have been remapped
        for (const [action, config] of Object.entries(UnifiedState.data.hotkeys.gameKeys)) {
            if (config.custom && matchesKeyCombo(e, config.original)) {
                // Original key has been remapped, suppress it
                e.preventDefault();
                e.stopPropagation();
                if (UnifiedState.data.settings.debugMode && !e.repeat) {
                    productionLog(`🚫 [HOTKEYS] Suppressed ${config.original} (remapped to ${config.custom} for ${config.name})`);
                }
                return false;
            }
        }
    }

    function handleHotkeyRelease(e) {
        // Just call the same handler - it checks e.type
        handleHotkeyPress(e);
    }

    // Install hotkey interceptor at highest priority
    function initializeHotkeySystem() {
        document.addEventListener('keydown', handleHotkeyPress, true);
        document.addEventListener('keyup', handleHotkeyRelease, true);
        productionLog('🎮 [HOTKEYS] Key interception system installed (keydown + keyup)');
    }

    function setupHotkeysTabHandlers(context = document) {
        // Enable/disable checkbox
        const enableCheckbox = context.querySelector('#hotkeys-enabled');
        if (enableCheckbox) {
            enableCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.hotkeys.enabled = e.target.checked;
                MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
                productionLog(`🎮 [HOTKEYS] ${e.target.checked ? 'Enabled' : 'Disabled'}`);
            });
        }

        // Hotkey buttons
        context.querySelectorAll('.hotkey-button').forEach(button => {
            button.addEventListener('click', function() {
                const key = this.dataset.key;
                startRecordingHotkey(key, this);
            });
        });

        // Reset buttons
        context.querySelectorAll('.hotkey-reset').forEach(button => {
            button.addEventListener('click', function() {
                const key = this.dataset.key;
                UnifiedState.data.hotkeys.gameKeys[key].custom = null;
                MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
                updateTabContent(); // Refresh display
                productionLog(`🎮 [HOTKEYS] Reset ${key} to default`);
            });
        });

        // Reset all button
        const resetAllBtn = context.querySelector('#hotkeys-reset-all');
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => {
                if (confirm('Reset all hotkeys to defaults?')) {
                    Object.keys(UnifiedState.data.hotkeys.gameKeys).forEach(key => {
                        UnifiedState.data.hotkeys.gameKeys[key].custom = null;
                    });
                    MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
                    updateTabContent();
                    productionLog('🎮 [HOTKEYS] Reset all hotkeys to defaults');
                }
            });
        }

        // Export button
        const exportBtn = context.querySelector('#hotkeys-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const exportData = {};
                Object.entries(UnifiedState.data.hotkeys.gameKeys).forEach(([key, config]) => {
                    if (config.custom) {
                        exportData[key] = config.custom;
                    }
                });
                const json = JSON.stringify(exportData, null, 2);
                navigator.clipboard.writeText(json);
                alert('Hotkey configuration copied to clipboard!');
            });
        }
    }

    function setupNotificationsTabHandlers(context = document) {
        // Notification enabled checkbox
        const notificationEnabledCheckbox = context.querySelector('#notifications-enabled-checkbox');
        if (notificationEnabledCheckbox && !notificationEnabledCheckbox.hasAttribute('data-handler-setup')) {
            notificationEnabledCheckbox.setAttribute('data-handler-setup', 'true');
            notificationEnabledCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.enabled = e.target.checked;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🔔 [NOTIFICATIONS] ${e.target.checked ? 'Enabled' : 'Disabled'} notifications`);

                // Update quick toggle button if it exists
                const quickToggle = context.querySelector('#notification-quick-toggle');
                if (quickToggle) {
                    updateQuickToggleButton(quickToggle, e.target.checked);
                }
            });
        }

        // Quick notification toggle button
        const quickToggleButton = context.querySelector('#notification-quick-toggle');
        if (quickToggleButton && !quickToggleButton.hasAttribute('data-handler-setup')) {
            quickToggleButton.setAttribute('data-handler-setup', 'true');
            quickToggleButton.addEventListener('click', () => {
                const newState = !UnifiedState.data.settings.notifications.enabled;
                UnifiedState.data.settings.notifications.enabled = newState;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🔔 [NOTIFICATIONS] Quick toggle: ${newState ? 'Enabled' : 'Disabled'} notifications`);

                // Update button appearance
                updateQuickToggleButton(quickToggleButton, newState);

                // Update checkbox if it exists
                if (notificationEnabledCheckbox) {
                    notificationEnabledCheckbox.checked = newState;
                }
            });
        }

        // Helper function to update quick toggle button
        function updateQuickToggleButton(button, enabled) {
            button.style.background = enabled ? '#4a9eff' : '#666';
            button.textContent = enabled ? '🔊 Turn OFF Notifications' : '🔇 Turn ON Notifications';
        }

        // Volume slider
        const volumeSlider = context.querySelector('#notification-volume-slider');
        if (volumeSlider && !volumeSlider.hasAttribute('data-handler-setup')) {
            volumeSlider.setAttribute('data-handler-setup', 'true');
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                UnifiedState.data.settings.notifications.volume = volume;
                // Update label
                const label = volumeSlider.previousElementSibling;
                label.textContent = `Volume: ${Math.round(volume * 100)}%`;
                MGA_saveJSON('MGA_data', UnifiedState.data);
            });
        }

        // Enable Continuous Mode checkbox
        const continuousCheckbox = context.querySelector('#notification-continuous-checkbox');
        if (continuousCheckbox && !continuousCheckbox.hasAttribute('data-handler-setup')) {
            continuousCheckbox.setAttribute('data-handler-setup', 'true');
            continuousCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.continuousEnabled = e.target.checked;

                // Update dropdown state
                const notificationTypeSelect = context.querySelector('#notification-type-select');
                if (notificationTypeSelect) {
                    const continuousOption = notificationTypeSelect.querySelector('option[value="continuous"]');
                    if (continuousOption) {
                        continuousOption.disabled = !e.target.checked;

                        // If unchecking and continuous is selected, change to epic
                        if (!e.target.checked && notificationTypeSelect.value === 'continuous') {
                            notificationTypeSelect.value = 'epic';
                            UnifiedState.data.settings.notifications.notificationType = 'epic';
                            productionLog(`🔊 [NOTIFICATIONS] Continuous mode disabled, reverted to epic`);
                        }
                    }
                }

                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`⚠️ [NOTIFICATIONS] Continuous mode enabled: ${e.target.checked}`);
            });
        }

        // Notification type selector
        const notificationTypeSelect = context.querySelector('#notification-type-select');
        if (notificationTypeSelect && !notificationTypeSelect.hasAttribute('data-handler-setup')) {
            notificationTypeSelect.setAttribute('data-handler-setup', 'true');
            notificationTypeSelect.addEventListener('change', (e) => {
                // Prevent selecting continuous if not enabled
                if (e.target.value === 'continuous' && !UnifiedState.data.settings.notifications.continuousEnabled) {
                    e.target.value = UnifiedState.data.settings.notifications.notificationType || 'epic';
                    productionWarn(`⚠️ [NOTIFICATIONS] Cannot select continuous mode - please enable it first`);
                    showVisualNotification('⚠️ Please enable Continuous Mode checkbox first', false);
                    return;
                }

                UnifiedState.data.settings.notifications.notificationType = e.target.value;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🔊 [NOTIFICATIONS] Sound type changed to: ${e.target.value}`);
            });
        }

        // Acknowledgment required checkbox
        const acknowledgmentCheckbox = context.querySelector('#notification-acknowledgment-checkbox');
        if (acknowledgmentCheckbox && !acknowledgmentCheckbox.hasAttribute('data-handler-setup')) {
            acknowledgmentCheckbox.setAttribute('data-handler-setup', 'true');
            acknowledgmentCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.requiresAcknowledgment = e.target.checked;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🚨 [NOTIFICATIONS] Require acknowledgment: ${e.target.checked}`);
            });
        }

        // Test notification button
        const testNotificationBtn = context.querySelector('#test-notification-btn');
        if (testNotificationBtn && !testNotificationBtn.hasAttribute('data-handler-setup')) {
            testNotificationBtn.setAttribute('data-handler-setup', 'true');
            testNotificationBtn.addEventListener('click', () => {
                const notifications = UnifiedState.data.settings.notifications;
                playSelectedNotification();
                queueNotification('🔔 Test notification - This is how alerts will look!', notifications.requiresAcknowledgment);
                productionLog(`🔔 [NOTIFICATIONS] Test notification played - Type: ${notifications.notificationType}, Volume: ${Math.round(notifications.volume * 100)}%, Acknowledgment: ${notifications.requiresAcknowledgment}`);
            });
        }

        // Seed watch checkboxes
        const seedWatchMap = {
            'watch-carrot': 'Carrot',
            'watch-strawberry': 'Strawberry',
            'watch-aloe': 'Aloe',
            'watch-blueberry': 'Blueberry',
            'watch-apple': 'Apple',
            'watch-tulip': 'Tulip',
            'watch-tomato': 'Tomato',
            'watch-daffodil': 'Daffodil',
            'watch-corn': 'Corn',
            'watch-watermelon': 'Watermelon',
            'watch-pumpkin': 'Pumpkin',
            'watch-echeveria': 'Echeveria',
            'watch-coconut': 'Coconut',
            'watch-banana': 'Banana',
            'watch-lily': 'Lily',
            'watch-burrostail': 'BurrosTail',
            'watch-mushroom': 'Mushroom',
            'watch-cactus': 'Cactus',
            'watch-bamboo': 'Bamboo',
            'watch-grape': 'Grape',
            'watch-pepper': 'Pepper',
            'watch-lemon': 'Lemon',
            'watch-passionfruit': 'PassionFruit',
            'watch-dragonfruit': 'DragonFruit',
            'watch-lychee': 'Lychee',
            'watch-sunflower': 'Sunflower',
            'watch-starweaver': 'Starweaver',
            'watch-dawnbinder': 'Dawnbinder',
            'watch-moonbinder': 'Moonbinder'
        };

        Object.entries(seedWatchMap).forEach(([checkboxId, seedId]) => {
            const checkbox = context.querySelector(`#${checkboxId}`);
            if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
                checkbox.setAttribute('data-handler-setup', 'true');
                checkbox.addEventListener('change', (e) => {
                    const notifications = UnifiedState.data.settings.notifications;
                    if (e.target.checked) {
                        if (!notifications.watchedSeeds.includes(seedId)) {
                            notifications.watchedSeeds.push(seedId);
                        }
                    } else {
                        notifications.watchedSeeds = notifications.watchedSeeds.filter(id => id !== seedId);
                    }
                    MGA_saveJSON('MGA_data', UnifiedState.data);
                    productionLog(`🌱 [NOTIFICATIONS] ${e.target.checked ? 'Added' : 'Removed'} ${seedId} to/from watch list`);
                    updateLastSeenDisplay();
                });
            }
        });

        // Egg watch checkboxes
        const eggWatchMap = {
            'watch-common-egg': 'CommonEgg',
            'watch-uncommon-egg': 'UncommonEgg',
            'watch-rare-egg': 'RareEgg',
            'watch-legendary-egg': 'LegendaryEgg',
            'watch-mythical-egg': 'MythicalEgg'
        };

        Object.entries(eggWatchMap).forEach(([checkboxId, eggId]) => {
            const checkbox = context.querySelector(`#${checkboxId}`);
            if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
                checkbox.setAttribute('data-handler-setup', 'true');
                checkbox.addEventListener('change', (e) => {
                    const notifications = UnifiedState.data.settings.notifications;
                    if (e.target.checked) {
                        if (!notifications.watchedEggs.includes(eggId)) {
                            notifications.watchedEggs.push(eggId);
                        }
                    } else {
                        notifications.watchedEggs = notifications.watchedEggs.filter(id => id !== eggId);
                    }
                    MGA_saveJSON('MGA_data', UnifiedState.data);
                    productionLog(`🥚 [NOTIFICATIONS] ${e.target.checked ? 'Added' : 'Removed'} ${eggId} to/from watch list`);
                    updateLastSeenDisplay();
                });
            }
        });

        // Decor watch checkboxes
        DECOR_ITEMS.forEach(decor => {
            const checkboxId = `watch-decor-${decor.id.toLowerCase()}`;
            const checkbox = context.querySelector(`#${checkboxId}`);
            if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
                checkbox.setAttribute('data-handler-setup', 'true');
                checkbox.addEventListener('change', (e) => {
                    const notifications = UnifiedState.data.settings.notifications;
                    if (e.target.checked) {
                        if (!notifications.watchedDecor.includes(decor.id)) {
                            notifications.watchedDecor.push(decor.id);
                        }
                    } else {
                        notifications.watchedDecor = notifications.watchedDecor.filter(id => id !== decor.id);
                    }
                    MGA_saveJSON('MGA_data', UnifiedState.data);
                    productionLog(`🎨 [NOTIFICATIONS] ${e.target.checked ? 'Added' : 'Removed'} ${decor.id} to/from watch list`);
                    updateLastSeenDisplay();
                });
            }
        });

        // Update last seen display function
        function updateLastSeenDisplay() {
            const lastSeenDisplay = context.querySelector('#last-seen-display');
            if (!lastSeenDisplay) return;

            const notifications = UnifiedState.data.settings.notifications;
            const allWatched = [...notifications.watchedSeeds, ...notifications.watchedEggs, ...notifications.watchedDecor];

            if (allWatched.length === 0) {
                lastSeenDisplay.innerHTML = 'No items being watched';
                return;
            }

            let html = '';
            allWatched.forEach(itemId => {
                const timeSince = getTimeSinceLastSeen(itemId);
                html += `<div>${itemId}: ${timeSince}</div>`;
            });

            lastSeenDisplay.innerHTML = html;
        }

        // Initial last seen update
        updateLastSeenDisplay();

        // Update last seen display every 30 seconds
        setInterval(updateLastSeenDisplay, 30000);

        // ==================== NEW NOTIFICATION HANDLERS ====================

        // Pet hunger enabled checkbox
        const petHungerCheckbox = context.querySelector('#pet-hunger-enabled');
        if (petHungerCheckbox && !petHungerCheckbox.hasAttribute('data-handler-setup')) {
            petHungerCheckbox.setAttribute('data-handler-setup', 'true');
            petHungerCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.petHungerEnabled = e.target.checked;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🐾 [PET-HUNGER] ${e.target.checked ? 'Enabled' : 'Disabled'} pet hunger notifications`);

                // BUGFIX: Scan for currently hungry pets when enabling alerts
                if (e.target.checked) {
                    // Delay slightly to ensure atoms are available
                    setTimeout(() => {
                        scanAndAlertHungryPets();
                    }, 500);
                }
            });
        }

        // Pet hunger threshold slider
        const petHungerThreshold = context.querySelector('#pet-hunger-threshold');
        if (petHungerThreshold && !petHungerThreshold.hasAttribute('data-handler-setup')) {
            petHungerThreshold.setAttribute('data-handler-setup', 'true');
            petHungerThreshold.addEventListener('input', (e) => {
                const threshold = parseInt(e.target.value);
                UnifiedState.data.settings.notifications.petHungerThreshold = threshold;
                // Update label
                const label = petHungerThreshold.previousElementSibling;
                label.textContent = `Alert when hunger below: ${threshold}%`;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🐾 [PET-HUNGER] Threshold set to ${threshold}%`);
            });
        }

        // Ability notifications enabled checkbox
        const abilityNotificationsCheckbox = context.querySelector('#ability-notifications-enabled');
        if (abilityNotificationsCheckbox && !abilityNotificationsCheckbox.hasAttribute('data-handler-setup')) {
            abilityNotificationsCheckbox.setAttribute('data-handler-setup', 'true');
            abilityNotificationsCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.abilityNotificationsEnabled = e.target.checked;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`✨ [ABILITY-NOTIFY] ${e.target.checked ? 'Enabled' : 'Disabled'} ability notifications`);
            });
        }

        // Ability notification sound type selector
        const abilityNotificationSoundSelect = context.querySelector('#ability-notification-sound-select');
        if (abilityNotificationSoundSelect && !abilityNotificationSoundSelect.hasAttribute('data-handler-setup')) {
            abilityNotificationSoundSelect.setAttribute('data-handler-setup', 'true');
            abilityNotificationSoundSelect.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.abilityNotificationSound = e.target.value;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`✨ [ABILITY-NOTIFY] Sound type changed to: ${e.target.value}`);
            });
        }

        // Ability notification volume slider
        const abilityVolumeSlider = context.querySelector('#ability-notification-volume-slider');
        if (abilityVolumeSlider && !abilityVolumeSlider.hasAttribute('data-handler-setup')) {
            abilityVolumeSlider.setAttribute('data-handler-setup', 'true');
            abilityVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                UnifiedState.data.settings.notifications.abilityNotificationVolume = volume;
                // Update label
                const label = abilityVolumeSlider.previousElementSibling;
                label.textContent = `Ability Alert Volume: ${Math.round(volume * 100)}%`;
                MGA_saveJSON('MGA_data', UnifiedState.data);
            });
        }

        // Individual ability checkboxes
        const individualAbilityCheckboxes = context.querySelectorAll('.individual-ability-checkbox');
        individualAbilityCheckboxes.forEach(checkbox => {
            if (!checkbox.hasAttribute('data-handler-setup')) {
                checkbox.setAttribute('data-handler-setup', 'true');
                checkbox.addEventListener('change', (e) => {
                    const abilityName = e.target.dataset.abilityName;
                    if (!UnifiedState.data.settings.notifications.watchedAbilities) {
                        UnifiedState.data.settings.notifications.watchedAbilities = [];
                    }

                    if (e.target.checked) {
                        // Add to watched list
                        if (!UnifiedState.data.settings.notifications.watchedAbilities.includes(abilityName)) {
                            UnifiedState.data.settings.notifications.watchedAbilities.push(abilityName);
                        }
                    } else {
                        // Remove from watched list
                        const index = UnifiedState.data.settings.notifications.watchedAbilities.indexOf(abilityName);
                        if (index > -1) {
                            UnifiedState.data.settings.notifications.watchedAbilities.splice(index, 1);
                        }
                    }

                    MGA_saveJSON('MGA_data', UnifiedState.data);
                    productionLog(`✨ [ABILITY-NOTIFY] ${abilityName}: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                });
            }
        });

        // Ability search box
        const abilitySearchBox = context.querySelector('#ability-search-box');
        if (abilitySearchBox && !abilitySearchBox.hasAttribute('data-handler-setup')) {
            abilitySearchBox.setAttribute('data-handler-setup', 'true');
            abilitySearchBox.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const items = context.querySelectorAll('.ability-checkbox-item');
                items.forEach(item => {
                    const abilityName = item.dataset.ability.toLowerCase();
                    item.style.display = abilityName.includes(query) ? 'flex' : 'none';
                });
            });
        }

        // Select All individual abilities button
        const selectAllIndividualAbilities = context.querySelector('#select-all-individual-abilities');
        if (selectAllIndividualAbilities && !selectAllIndividualAbilities.hasAttribute('data-handler-setup')) {
            selectAllIndividualAbilities.setAttribute('data-handler-setup', 'true');
            selectAllIndividualAbilities.addEventListener('click', () => {
                // Empty array means all abilities enabled (backward compatibility)
                UnifiedState.data.settings.notifications.watchedAbilities = [];

                // Update all checkboxes
                context.querySelectorAll('.individual-ability-checkbox').forEach(checkbox => {
                    checkbox.checked = true;
                });

                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog('✨ [ABILITY-NOTIFY] Enabled all abilities');
            });
        }

        // Select None individual abilities button
        const selectNoneIndividualAbilities = context.querySelector('#select-none-individual-abilities');
        if (selectNoneIndividualAbilities && !selectNoneIndividualAbilities.hasAttribute('data-handler-setup')) {
            selectNoneIndividualAbilities.setAttribute('data-handler-setup', 'true');
            selectNoneIndividualAbilities.addEventListener('click', () => {
                // Get all ability names
                const allAbilities = [];
                context.querySelectorAll('.individual-ability-checkbox').forEach(checkbox => {
                    allAbilities.push(checkbox.dataset.abilityName);
                });

                // Set watchedAbilities to opposite - if we want none, we list all then check against not-in-list
                // Actually, better approach: use a special flag or empty means all, populated means only those
                // For "none", we need a way to indicate "empty set of abilities"
                // Let's use: populated array with abilities = only those; empty array = all; null = none
                UnifiedState.data.settings.notifications.watchedAbilities = ['__NONE__']; // Special marker

                // Update all checkboxes
                context.querySelectorAll('.individual-ability-checkbox').forEach(checkbox => {
                    checkbox.checked = false;
                });

                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog('✨ [ABILITY-NOTIFY] Disabled all abilities');
            });
        }

        // Weather notifications enabled checkbox
        const weatherNotificationsCheckbox = context.querySelector('#weather-notifications-enabled');
        if (weatherNotificationsCheckbox && !weatherNotificationsCheckbox.hasAttribute('data-handler-setup')) {
            weatherNotificationsCheckbox.setAttribute('data-handler-setup', 'true');
            weatherNotificationsCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.notifications.weatherNotificationsEnabled = e.target.checked;
                MGA_saveJSON('MGA_data', UnifiedState.data);
                productionLog(`🌤️ [WEATHER] ${e.target.checked ? 'Enabled' : 'Disabled'} weather notifications`);
            });
        }

        // Weather event checkboxes
        const weatherEventMap = {
            'watch-snow': 'Snow',
            'watch-rain': 'Rain',
            'watch-amber-moon': 'AmberMoon',
            'watch-dawn': 'Dawn'
        };

        Object.entries(weatherEventMap).forEach(([checkboxId, eventName]) => {
            const checkbox = context.querySelector(`#${checkboxId}`);
            if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
                checkbox.setAttribute('data-handler-setup', 'true');
                checkbox.addEventListener('change', (e) => {
                    const watchedEvents = UnifiedState.data.settings.notifications.watchedWeatherEvents;
                    if (e.target.checked) {
                        if (!watchedEvents.includes(eventName)) {
                            watchedEvents.push(eventName);
                        }
                    } else {
                        const idx = watchedEvents.indexOf(eventName);
                        if (idx > -1) watchedEvents.splice(idx, 1);
                    }
                    MGA_saveJSON('MGA_data', UnifiedState.data);
                    productionLog(`🌤️ [WEATHER] ${e.target.checked ? 'Added' : 'Removed'} ${eventName} to/from watch list`);
                });
            }
        });
    }

    function setupSettingsTabHandlers(context = document) {
        // Opacity slider
        const opacitySlider = context.querySelector('#opacity-slider');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const opacity = parseInt(e.target.value);
                UnifiedState.data.settings.opacity = opacity;
                applyTheme();
                // Update label
                const label = opacitySlider.previousElementSibling;
                label.textContent = `Main HUD Opacity: ${opacity}%`;
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
            });
        }

        // Pop-out opacity slider
        const popoutOpacitySlider = context.querySelector('#popout-opacity-slider');
        if (popoutOpacitySlider) {
            popoutOpacitySlider.addEventListener('input', (e) => {
                const popoutOpacity = parseInt(e.target.value);
                UnifiedState.data.settings.popoutOpacity = popoutOpacity;
                syncThemeToAllWindows(); // Apply theme to pop-out windows only
                // Update label
                const label = popoutOpacitySlider.previousElementSibling;
                label.textContent = `Pop-out Opacity: ${popoutOpacity}%`;
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
            });
        }

        // Gradient select
        const gradientSelect = context.querySelector('#gradient-select');
        if (gradientSelect) {
            gradientSelect.addEventListener('change', (e) => {
                UnifiedState.data.settings.gradientStyle = e.target.value;
                applyTheme();
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
            });
        }

        // Effect select
        const effectSelect = context.querySelector('#effect-select');
        if (effectSelect) {
            effectSelect.addEventListener('change', (e) => {
                UnifiedState.data.settings.effectStyle = e.target.value;
                applyTheme();
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
            });
        }

        // Ultra-compact mode checkbox
        const ultraCompactCheckbox = context.querySelector('#ultra-compact-checkbox');
        if (ultraCompactCheckbox) {
            // Remove any existing listeners by cloning
            const newCheckbox = ultraCompactCheckbox.cloneNode(true);
            ultraCompactCheckbox.parentNode.replaceChild(newCheckbox, ultraCompactCheckbox);

            newCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                UnifiedState.data.settings.ultraCompactMode = e.target.checked;
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
                applyUltraCompactMode(e.target.checked);
                productionLog(`📱 Ultra-compact mode ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }

        // Overlay mode checkbox
        const overlayCheckbox = context.querySelector('#use-overlays-checkbox');
        if (overlayCheckbox) {
            overlayCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.useInGameOverlays = e.target.checked;
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
                productionLog(`🎮 Overlay mode ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }

        // Debug mode checkbox
        const debugModeCheckbox = context.querySelector('#debug-mode-checkbox');
        if (debugModeCheckbox) {
            debugModeCheckbox.addEventListener('change', (e) => {
                UnifiedState.data.settings.debugMode = e.target.checked;
                MGA_debouncedSave('MGA_settings', UnifiedState.data.settings);
                productionLog(`🐛 Debug mode ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
        }

        // Preset buttons
        context.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                applyPreset(preset);
            });
        });

        // Export/Import
        const exportBtn = context.querySelector('#export-settings-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = JSON.stringify(UnifiedState.data.settings, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const link = targetDocument.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'MGA_Settings.json';
                link.click();
            });
        }

        // Reset pet loadouts handler
        const resetLoadoutsBtn = context.querySelector('#reset-loadouts-btn');
        if (resetLoadoutsBtn) {
            resetLoadoutsBtn.addEventListener('click', () => {
                if (confirm('⚠️ Are you sure you want to reset all pet loadouts? This cannot be undone.')) {
                    UnifiedState.data.petPresets = {};
                    MGA_saveJSON('MGA_data', UnifiedState.data);
                    productionLog('🔄 Pet loadouts have been reset');
                    // Update the UI if we're in the pets tab
                    if (UnifiedState.activeTab === 'pets') {
                        updateTabContent();
                    }
                    productionLog('✅ Pet loadouts have been reset successfully!');
                }
            });
        }
    }

    function setupToolsTabHandlers(context = document) {
        // Calculator mapping
        const calculatorUrls = {
            'sell-price': 'https://daserix.github.io/magic-garden-calculator/#/sell-price-calculator',
            'weight-probability': 'https://daserix.github.io/magic-garden-calculator/#/weight-probability-calculator',
            'pet-appearance-probability': 'https://daserix.github.io/magic-garden-calculator/#/pet-appearance-probability-calculator',
            'ability-trigger-time': 'https://daserix.github.io/magic-garden-calculator/#/ability-trigger-time-calculator'
        };

        // Wiki mapping
        const wikiUrls = {
            'crops': 'https://magicgarden.fandom.com/wiki/Crops',
            'pets': 'https://magicgarden.fandom.com/wiki/Pets',
            'abilities': 'https://magicgarden.fandom.com/wiki/Abilities',
            'weather': 'https://magicgarden.fandom.com/wiki/Weather_Events',
            'multipliers': 'https://magicgarden.fandom.com/wiki/Multipliers',
            'shops': 'https://magicgarden.fandom.com/wiki/Shops'
        };

        // Add click handlers to all calculator cards
        const toolCards = context.querySelectorAll('.mga-tool-card');
        toolCards.forEach(card => {
            card.addEventListener('click', () => {
                const calculatorType = card.dataset.calculator;
                const url = calculatorUrls[calculatorType];
                if (url) {
                    openCalculatorPopup(url, calculatorType);
                } else {
                    productionWarn(`Calculator URL not found for: ${calculatorType}`);
                }
            });

            // Add hover effect class if not already present
            if (!card.classList.contains('mga-tool-interactive')) {
                card.classList.add('mga-tool-interactive');
            }
        });

        // Add click handlers to all wiki cards
        const wikiCards = context.querySelectorAll('.mga-wiki-card');
        wikiCards.forEach(card => {
            card.addEventListener('click', () => {
                const wikiType = card.dataset.wiki;
                const url = wikiUrls[wikiType];
                if (url) {
                    openWikiPopup(url, wikiType);
                } else {
                    productionWarn(`Wiki URL not found for: ${wikiType}`);
                }
            });

            // Add hover effect class if not already present
            if (!card.classList.contains('mga-wiki-interactive')) {
                card.classList.add('mga-wiki-interactive');
            }
        });

        // Crop highlighting handlers
        const applyHighlightingBtn = context.querySelector('#apply-highlighting-btn');
        if (applyHighlightingBtn) {
            applyHighlightingBtn.addEventListener('click', () => {
                applyCropHighlighting();
            });
        }

        const clearHighlightingBtn = context.querySelector('#clear-highlighting-btn');
        if (clearHighlightingBtn) {
            clearHighlightingBtn.addEventListener('click', () => {
                clearCropHighlighting();
            });
        }

        if (UnifiedState.data.settings.debugMode) {
            productionLog(`🧮 Set up handlers for ${toolCards.length} calculator tools and ${wikiCards.length} wiki resources`);
        }
    }

    function openCalculatorPopup(url, calculatorType) {
        // Calculate window dimensions and position
        const width = 1200;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        // Window features
        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;

        // Open the popup window
        const popupWindow = window.open(url, `mga_calculator_${calculatorType}`, features);

        // Check if popup was blocked
        if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
            // Popup was blocked, show alternative message
            const message = `
                <div style="padding: 20px; background: rgba(255,50,50,0.1); border: 1px solid rgba(255,100,100,0.3); border-radius: 5px; margin: 20px;">
                    <h3 style="color: #ff6b6b; margin-bottom: 10px;">⚠️ Popup Blocked</h3>
                    <p style="margin-bottom: 15px;">The calculator popup was blocked by your browser. Please allow popups for this site or open the calculator manually:</p>
                    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 3px; word-break: break-all;">
                        <a href="${url}" target="_blank" style="color: #4fc3f7;">${url}</a>
                    </div>
                    <p style="margin-top: 10px; font-size: 0.9em; color: rgba(255,255,255,0.6);">
                        Click the link above to open the calculator in a new tab.
                    </p>
                </div>
            `;

            // Show message in the Tools tab content area
            const contentEl = document.getElementById('mga-tab-content');
            if (contentEl && UnifiedState.activeTab === 'tools') {
                const existingContent = contentEl.innerHTML;
                contentEl.innerHTML = message + existingContent;

                // Remove the message after 10 seconds
                setTimeout(() => {
                    if (contentEl.innerHTML.includes(message)) {
                        contentEl.innerHTML = existingContent;
                    }
                }, 10000);
            }

            productionWarn(`Popup blocked for calculator: ${calculatorType}. URL: ${url}`);
        } else {
            // Popup opened successfully
            popupWindow.focus();
            productionLog(`✅ Opened calculator popup: ${calculatorType}`);
        }
    }

    function openWikiPopup(url, wikiType) {
        // Calculate window dimensions and position
        const width = 1000;
        const height = 900;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        // Window features
        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;

        // Open the popup window
        const popupWindow = window.open(url, `mga_wiki_${wikiType}`, features);

        // Check if popup was blocked
        if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
            // Popup was blocked, show alternative message
            const message = `
                <div style="padding: 20px; background: rgba(255,50,50,0.1); border: 1px solid rgba(255,100,100,0.3); border-radius: 5px; margin: 20px;">
                    <h3 style="color: #ff6b6b; margin-bottom: 10px;">⚠️ Popup Blocked</h3>
                    <p style="margin-bottom: 15px;">The wiki popup was blocked by your browser. Please allow popups for this site or open the wiki manually:</p>
                    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 3px; word-break: break-all;">
                        <a href="${url}" target="_blank" style="color: #4fc3f7;">${url}</a>
                    </div>
                    <p style="margin-top: 10px; font-size: 0.9em; color: rgba(255,255,255,0.6);">
                        Click the link above to open the wiki page in a new tab.
                    </p>
                </div>
            `;

            // Show message in the Tools tab content area
            const contentEl = document.getElementById('mga-tab-content');
            if (contentEl && UnifiedState.activeTab === 'tools') {
                const existingContent = contentEl.innerHTML;
                contentEl.innerHTML = message + existingContent;

                // Remove the message after 10 seconds
                setTimeout(() => {
                    if (contentEl.innerHTML.includes(message)) {
                        contentEl.innerHTML = existingContent;
                    }
                }, 10000);
            }

            productionWarn(`Popup blocked for wiki: ${wikiType}. URL: ${url}`);
        } else {
            // Popup opened successfully
            popupWindow.focus();
            productionLog(`✅ Opened wiki popup: ${wikiType}`);
        }
    }

    // ==================== CROP HIGHLIGHTING UTILITIES ====================
    // Initialize tile override storage
    window.__tileOverrides = window.__tileOverrides || {};
    window.__slotTargetOverrides = window.__slotTargetOverrides || {};

    // Tile-modifying hookAtom function (different from monitoring hookAtom)
    function hookAtomForTileOverrides(atomPath, windowKey) {
        const atom = targetWindow.jotaiAtomCache?.get(atomPath);
        if (!atom?.read) {
            productionWarn(`🔍 Could not find atom at path: ${atomPath}`);
            return;
        }

        if (!atom.__originalRead) {
            atom.__originalRead = atom.read;
            productionLog(`🔗 Hooked atom for tile overrides: ${atomPath}`);

            atom.read = (t) => {
                const value = atom.__originalRead(t);

                try {
                    const tileObjects = value?.garden?.tileObjects;

                    if (tileObjects != null) {
                        let overridesApplied = 0;
                        const applyOverrideToTile = (tileIndex, tileObj) => {
                            if (!tileObj || typeof tileObj !== 'object') return;

                            let wasModified = false;

                            // Species override
                            if (window.__tileOverrides[tileIndex] !== undefined) {
                                const oldSpecies = tileObj.species;
                                tileObj.species = window.__tileOverrides[tileIndex];
                                wasModified = true;
                                if (UnifiedState.data.settings.debugMode) {
                                    productionLog(`🔄 Tile ${tileIndex}: ${oldSpecies} → ${tileObj.species}`);
                                }
                            }

                            // Slot targetScale override
                            if (window.__slotTargetOverrides[tileIndex] !== undefined) {
                                const slots = tileObj.slots;
                                const slotOverrides = window.__slotTargetOverrides[tileIndex];
                                if (slots) {
                                    for (const [slotIdx, scale] of Object.entries(slotOverrides)) {
                                        if (slots[slotIdx] && typeof slots[slotIdx] === 'object') {
                                            const oldScale = slots[slotIdx].targetScale;
                                            slots[slotIdx].targetScale = scale;
                                            wasModified = true;
                                            if (UnifiedState.data.settings.debugMode) {
                                                productionLog(`🔄 Tile ${tileIndex} slot ${slotIdx}: scale ${oldScale} → ${scale}`);
                                            }
                                        }
                                    }
                                }
                            }

                            if (wasModified) overridesApplied++;
                        };

                        // Apply overrides to all tiles
                        if (Array.isArray(tileObjects)) {
                            tileObjects.forEach((tile, idx) => applyOverrideToTile(idx, tile));
                        } else if (tileObjects instanceof Map) {
                            tileObjects.forEach((tile, key) => applyOverrideToTile(key, tile));
                        } else if (typeof tileObjects === 'object') {
                            Object.keys(tileObjects).forEach(key => {
                                const idx = isFinite(key) ? Number(key) : key;
                                applyOverrideToTile(idx, tileObjects[key]);
                            });
                        }

                        if (overridesApplied > 0) {
                            productionLog(`🌱 Applied ${overridesApplied} tile overrides in atom read`);
                        }
                    }
                } catch (err) {
                    console.error('hookAtomForTileOverrides: error applying tile overrides', err);
                }

                // Expose full value for console inspection
                try { window[windowKey] = value; } catch (e) {}

                return value;
            };
        } else {
            productionLog(`⚠️ Atom already hooked: ${atomPath}`);
        }
    }

    // Tile override utility functions (MGA namespaced to prevent conflicts)
    window.MGA_Internal.setTileSpecies = function(index, species) {
        if (species == null) {
            delete window.__tileOverrides[index];
        } else {
            window.__tileOverrides[index] = species;
        }
    };

    window.MGA_Internal.setTileSlotTargetScale = function(tileIndex, slotIndex, targetScale) {
        if (!window.__slotTargetOverrides[tileIndex]) {
            window.__slotTargetOverrides[tileIndex] = {};
        }
        if (targetScale == null) {
            delete window.__slotTargetOverrides[tileIndex][slotIndex];
        } else {
            window.__slotTargetOverrides[tileIndex][slotIndex] = targetScale;
        }
    };

    window.MGA_Internal.removeTileOverrides = function(tileIndex) {
        delete window.__tileOverrides[tileIndex];
        delete window.__slotTargetOverrides[tileIndex];
    };

    window.MGA_Internal.removeAllTileOverrides = function() {
        window.__tileOverrides = {};
        window.__slotTargetOverrides = {};
    };

    // Advanced tile filtering functions
    window.applyToAllTilesExcept = function(skipSpecies = "Starweaver", slotIndex = 0, targetScale = 0.1, newSpecies = null) {
        const tileObjects = window.gardenInfo?.garden?.tileObjects;
        if (!tileObjects) return;

        const entries = Array.isArray(tileObjects) ? tileObjects.map((t,i)=>({tile:t,index:i})) :
                        tileObjects instanceof Map ? Array.from(tileObjects.entries()).map(([k,v])=>({tile:v,index:k})) :
                        Object.keys(tileObjects).map(k => ({tile: tileObjects[k], index: isFinite(k)?Number(k):k}));

        entries.forEach(({tile,index})=>{
            if (!tile || tile.species === skipSpecies) return;
            if (newSpecies != null) window.setTileSpecies(index, newSpecies);
            if (targetScale != null) window.setTileSlotTargetScale(index, slotIndex, targetScale);
        });
    };

    window.applyToAllTilesFiltered = function({
        skipSpecies = "Starweaver",
        slotIndex = 0,
        targetScale = 0.1,
        newSpecies = null,
        mutationFilter = null // function(slotMutations) => true/false
    } = {}) {
        const tileObjects = window.gardenInfo?.garden?.tileObjects;
        if (!tileObjects) return;

        const entries = Array.isArray(tileObjects) ? tileObjects.map((t,i)=>({tile:t,index:i})) :
                        tileObjects instanceof Map ? Array.from(tileObjects.entries()).map(([k,v])=>({tile:v,index:k})) :
                        Object.keys(tileObjects).map(k => ({tile: tileObjects[k], index: isFinite(k)?Number(k):k}));

        entries.forEach(({tile,index}) => {
            if (!tile || tile.species === skipSpecies) return;

            const slot = tile.slots?.[slotIndex];
            if (!slot) return;

            // Skip if mutationFilter is defined and returns false
            if (mutationFilter && !mutationFilter(slot.mutations)) return;

            if (newSpecies != null) window.setTileSpecies(index, newSpecies);
            if (targetScale != null) window.setTileSlotTargetScale(index, slotIndex, targetScale);
        });
    };

    // Main crop highlighting function
    window.highlightTilesByMutation = function({
        highlightSpecies = null,      // string or array of species
        highlightMutations = [],      // array of mutations to match
        slotIndex = 0,
        highlightScale = null,        // null = keep original
        hiddenSpecies = "Carrot",
        hiddenScale = 0.1
    } = {}) {
        const tileObjects = window.gardenInfo?.garden?.tileObjects;
        if (!tileObjects) return;

        const entries = Array.isArray(tileObjects)
            ? tileObjects.map((t,i)=>({tile:t,index:i}))
            : tileObjects instanceof Map
                ? Array.from(tileObjects.entries()).map(([k,v])=>({tile:v,index:k}))
                : Object.keys(tileObjects).map(k => ({tile: tileObjects[k], index: isFinite(k)?Number(k):k}));

        // Normalize species array
        const speciesArr = Array.isArray(highlightSpecies) ? highlightSpecies : (highlightSpecies ? [highlightSpecies] : []);

        entries.forEach(({tile,index}) => {
            if (!tile) return;

            const slot = tile.slots?.[slotIndex];
            if (!slot) return;

            const mutations = slot.mutations || [];

            // Highlight if species is in the array
            const matchesSpecies = speciesArr.length === 0 || speciesArr.includes(tile.species);
            const matchesMutations = !highlightMutations || highlightMutations.length === 0 || highlightMutations.includes(null) || highlightMutations.some(m => mutations.includes(m)) || highlightMutations.every(m => mutations.includes(m));

            if (matchesSpecies && matchesMutations) {
                if (highlightScale != null) window.setTileSlotTargetScale(index, slotIndex, highlightScale);
                if (highlightSpecies) window.setTileSpecies(index, tile.species); // keep species unchanged
            } else {
                if (hiddenScale != null) window.setTileSlotTargetScale(index, slotIndex, hiddenScale);
                window.setTileSpecies(index, hiddenSpecies);
            }
        });
    };

    // Initialize crop highlighting atoms hooks when utilities are loaded
    function initializeCropHighlightingAtoms() {
        if (!targetWindow.jotaiAtomCache) {
            // Wait for jotaiAtomCache to be available
            setTimeout(initializeCropHighlightingAtoms, 1000);
            return;
        }

        try {
            hookAtomForTileOverrides("/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myDataAtom", "gardenInfo");
            hookAtomForTileOverrides("/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom", "currentCrop");
            debugLog('CROP_HIGHLIGHT', 'Crop highlighting atom hooks initialized');
        } catch (error) {
            debugError('CROP_HIGHLIGHT', 'Failed to initialize crop highlighting atoms', error);
        }
    }

    // Track the last highlighted species for toggle functionality
    window.__lastHighlightedSpecies = null;

    // Initialize the crop highlighting atom hooks
    initializeCropHighlightingAtoms();

    // ==================== CROP HIGHLIGHTING SYSTEM ====================
    function applyCropHighlighting() {
        try {
            // Get values from UI
            const highlightSpecies = targetDocument.querySelector('#highlight-species-select')?.value || null;
            const slotIndex = parseInt(targetDocument.querySelector('#highlight-slot-input')?.value || '0');
            const hiddenSpecies = targetDocument.querySelector('#hidden-species-select')?.value || null;
            const hiddenScale = parseFloat(targetDocument.querySelector('#hidden-scale-input')?.value || '0.1');

            // Validate inputs
            if (!highlightSpecies) {
                productionWarn('🌱 No species selected for highlighting');
                return;
            }

            // Always clear previous highlights first
            if (typeof window.removeAllTileOverrides === 'function') {
                window.removeAllTileOverrides();
                debugLog('CROP_HIGHLIGHTING', 'Cleared previous tile overrides');
            } else {
                debugLog('CROP_HIGHLIGHTING', 'removeAllTileOverrides function not available');
            }

            // Apply new highlighting
            const config = {
                highlightSpecies: highlightSpecies,
                highlightMutations: [null], // Default to no mutation filter
                slotIndex: slotIndex,
                highlightScale: null, // Let the system decide
                hiddenSpecies: hiddenSpecies || null,
                hiddenScale: hiddenScale
            };

            if (typeof window.highlightTilesByMutation === 'function') {
                window.highlightTilesByMutation(config);
                productionLog(`🌱 Applied crop highlighting for ${highlightSpecies} (slot ${slotIndex})`);
                debugLog('CROP_HIGHLIGHTING', 'Applied highlighting configuration', config);
            } else {
                productionWarn('🌱 highlightTilesByMutation function not available');
                debugLog('CROP_HIGHLIGHTING', 'highlightTilesByMutation function not found in window object');
            }
        } catch (error) {
            debugError('CROP_HIGHLIGHTING', 'Failed to apply crop highlighting', error);
        }
    }

    function clearCropHighlighting() {
        try {
            if (typeof window.removeAllTileOverrides === 'function') {
                window.removeAllTileOverrides();
                productionLog('🌱 Cleared all crop highlighting');
                queueNotification('🧹 Cleared all crop highlighting', false);
                debugLog('CROP_HIGHLIGHTING', 'Cleared all tile overrides');
                return true;
            } else {
                productionWarn('🌱 removeAllTileOverrides function not available');
                queueNotification('⚠️ Cannot clear highlighting - game not fully loaded', false);
                debugLog('CROP_HIGHLIGHTING', 'removeAllTileOverrides function not found in window object');
                return false;
            }
        } catch (error) {
            debugError('CROP_HIGHLIGHTING', 'Failed to clear crop highlighting', error);
        }
    }

    // Debug function to check garden data availability
    function debugCropHighlighting() {
        productionLog('🔍 CROP HIGHLIGHTING DEBUG:');
        productionLog('  window.gardenInfo:', !!window.gardenInfo);
        productionLog('  window.currentCrop:', !!window.currentCrop);
        productionLog('  targetWindow.jotaiAtomCache:', !!targetWindow.jotaiAtomCache);

        if (window.gardenInfo?.garden?.tileObjects) {
            const tileObjects = window.gardenInfo.garden.tileObjects;
            const tileCount = Array.isArray(tileObjects) ? tileObjects.length :
                             tileObjects instanceof Map ? tileObjects.size :
                             Object.keys(tileObjects).length;
            productionLog('  Garden tiles available:', tileCount);

            // Show first few tiles for debugging
            if (Array.isArray(tileObjects) && tileObjects.length > 0) {
                productionLog('  Sample tile:', tileObjects[0]);
            }
        } else {
            productionLog('  ❌ No garden tile data available');
        }

        if (window.currentCrop && Array.isArray(window.currentCrop) && window.currentCrop.length > 0) {
            productionLog('  Current crop species:', window.currentCrop[0]?.species);
        } else {
            productionLog('  ❌ No current crop data available');
        }

        productionLog('  Available functions:');
        productionLog('    removeAllTileOverrides:', typeof window.removeAllTileOverrides);
        productionLog('    highlightTilesByMutation:', typeof window.highlightTilesByMutation);
        productionLog('    setTileSpecies:', typeof window.setTileSpecies);
    }

    // Improved manual highlighting with better debugging and error handling
    function applyCropHighlightingWithDebug() {
        productionLog('🌱 Starting crop highlighting...');
        debugCropHighlighting();

        try {
            // Get values from UI
            const highlightSpecies = targetDocument.querySelector('#highlight-species-select')?.value || null;
            const slotIndex = parseInt(targetDocument.querySelector('#highlight-slot-input')?.value || '0');
            const hiddenSpecies = targetDocument.querySelector('#hidden-species-select')?.value || 'Carrot';
            const hiddenScale = parseFloat(targetDocument.querySelector('#hidden-scale-input')?.value || '0.1');

            productionLog('🌱 Settings:', { highlightSpecies, slotIndex, hiddenSpecies, hiddenScale });

            // Validate inputs
            if (!highlightSpecies) {
                productionWarn('🌱 No species selected for highlighting');
                queueNotification('⚠️ Please select a species to highlight first', false);
                return false;
            }

            // Check if required game functions are available
            const hasRemoveOverrides = typeof window.removeAllTileOverrides === 'function';
            const hasHighlightFunction = typeof window.highlightTilesByMutation === 'function';

            productionLog('🌱 Function availability:', {
                removeAllTileOverrides: hasRemoveOverrides,
                highlightTilesByMutation: hasHighlightFunction
            });

            if (!hasHighlightFunction) {
                productionWarn('🌱 Crop highlighting function not available - game may not be loaded yet');
                queueNotification('⚠️ Crop highlighting not available - try again when fully loaded', false);
                return false;
            }

            // Always clear previous highlights first
            if (hasRemoveOverrides) {
                window.removeAllTileOverrides();
                productionLog('🌱 Cleared previous highlights');
            }

            // Apply new highlighting with array format
            const config = {
                highlightSpecies: [highlightSpecies], // Convert to array like working reference
                highlightMutations: [null], // Default to no mutation filter
                slotIndex: slotIndex,
                highlightScale: null, // Let the system decide
                hiddenSpecies: hiddenSpecies,
                hiddenScale: hiddenScale
            };

            productionLog('🌱 Applying config:', config);

            try {
                window.highlightTilesByMutation(config);
                productionLog(`✅ Applied crop highlighting for ${highlightSpecies} (slot ${slotIndex})`);
                queueNotification(`🌱 Highlighted all ${highlightSpecies} crops (slot ${slotIndex})`, false);

                // Force a re-render by triggering a small change
                setTimeout(() => {
                    productionLog('🔄 Forcing render update...');
                    try {
                        globalThis.dispatchEvent?.(new Event("visibilitychange"));
                    } catch (e) {
                        productionLog('Could not dispatch visibility change:', e);
                    }
                }, 100);

                return true;
            } catch (highlightError) {
                productionError('🌱 Error during highlighting:', highlightError);
                queueNotification(`❌ Crop highlighting failed: ${highlightError.message}`, false);
                return false;
            }

        } catch (error) {
            productionError('❌ Failed to apply crop highlighting:', error);
            queueNotification(`❌ Crop highlighting system error: ${error.message}`, false);
            return false;
        }
    }

    // Automatic highlighting with Ctrl+C (from working reference)
    function setupAutomaticCropHighlighting() {
        window.addEventListener('keydown', function (e) {
            // Ignore when typing in input fields
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

            // Ctrl (or Cmd) + C for automatic highlighting
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                try {
                    const cc = window.currentCrop;

                    window.removeAllTileOverrides(); // always clear first
                    productionLog('🌱 Ctrl+C: Cleared previous highlights');

                    if (cc && Array.isArray(cc) && cc.length > 0 && cc[0] && cc[0].species) {
                        const species = cc[0].species;

                        if (window.__lastHighlightedSpecies === species) {
                            // Same species pressed twice → just clear
                            productionLog(`🌱 Ctrl+C: Removed highlights (${species} was already highlighted)`);
                            window.__lastHighlightedSpecies = null;
                        } else {
                            // New species → highlight it after delay
                            setTimeout(() => {
                                window.highlightTilesByMutation({
                                    highlightSpecies: [species],
                                    highlightMutations: [null],
                                    slotIndex: 0,
                                    highlightScale: null,
                                    hiddenSpecies: "Carrot",
                                    hiddenScale: 0.1
                                });
                                productionLog(`✅ Ctrl+C: Highlighted current crop: ${species}`);
                                window.__lastHighlightedSpecies = species;
                            }, 350);
                        }
                    } else {
                        // currentCrop is null or invalid → just clear
                        productionLog('🌱 Ctrl+C: No current crop - highlights cleared');
                        window.__lastHighlightedSpecies = null;
                    }

                    e.preventDefault(); // block normal copy
                } catch (err) {
                    console.error('❌ Error handling Ctrl+C highlight action', err);
                }
            }
        });

        productionLog('🌱 Automatic crop highlighting installed (Ctrl+C)');
    }

    // Replace the original applyCropHighlighting with the debug version
    applyCropHighlighting = applyCropHighlightingWithDebug;

    // Install automatic highlighting
    setupAutomaticCropHighlighting();

    // ==================== GLOBAL DEBUGGING FUNCTIONS ====================
    // Make debugging functions globally accessible
    window.debugCropHighlighting = debugCropHighlighting;
    window.applyCropHighlightingWithDebug = applyCropHighlightingWithDebug;

    // BUGFIX: Add ability log verification command
    window.MGA_AbilityLogDebug = {
        checkLogs: function() {
            const allLogs = MGA_getAllLogs();
            const oldLogs = allLogs.filter(log =>
                log.abilityType && /produce\s*scale\s*boost/i.test(log.abilityType)
            );
            const newLogs = allLogs.filter(log =>
                log.abilityType && /crop\s*size\s*boost/i.test(log.abilityType)
            );

            console.log('=== ABILITY LOG VERIFICATION ===');
            console.log('Old "Produce Scale Boost" logs:', oldLogs.length);
            if (oldLogs.length > 0) {
                console.warn('⚠️ Found unmigrated logs - migration may need to run again');
                console.log('Sample old logs:', oldLogs.slice(0, 3));
            }
            console.log('New "Crop Size Boost" logs:', newLogs.length);
            console.log('Total logs:', allLogs.length);
            console.log('============================');

            return { oldCount: oldLogs.length, newCount: newLogs.length, total: allLogs.length };
        },
        listAllAbilities: function() {
            const allLogs = MGA_getAllLogs();
            const abilityTypes = [...new Set(allLogs.map(log => log.abilityType))].sort();
            console.log('=== ALL UNIQUE ABILITIES IN LOGS ===');
            abilityTypes.forEach((ability, i) => {
                const count = allLogs.filter(log => log.abilityType === ability).length;
                console.log(`${i + 1}. ${ability} (${count} logs)`);
            });
            console.log('===================================');
            return abilityTypes;
        }
    };

    window.MGA_CropDebug = {
        debug: debugCropHighlighting,
        apply: applyCropHighlightingWithDebug,
        clear: clearCropHighlighting,
        testHighlight: function(species = 'Aloe') {
            productionLog(`🧪 Testing highlight for ${species}...`);
            if (typeof window.removeAllTileOverrides === 'function') {
                window.removeAllTileOverrides();
            }
            setTimeout(() => {
                if (typeof window.highlightTilesByMutation === 'function') {
                    window.highlightTilesByMutation({
                        highlightSpecies: [species],
                        highlightMutations: [null],
                        slotIndex: 0,
                        highlightScale: null,
                        hiddenSpecies: "Carrot",
                        hiddenScale: 0.1
                    });
                    productionLog(`✅ Test highlight applied for ${species}`);
                } else {
                    console.error('❌ highlightTilesByMutation not available');
                }
            }, 100);
        },
        listAvailableSpecies: function() {
            if (window.gardenInfo?.garden?.tileObjects) {
                const tileObjects = window.gardenInfo.garden.tileObjects;
                const species = new Set();

                const entries = Array.isArray(tileObjects) ? tileObjects :
                               tileObjects instanceof Map ? Array.from(tileObjects.values()) :
                               Object.values(tileObjects);

                entries.forEach(tile => {
                    if (tile?.species) species.add(tile.species);
                });

                productionLog('🌱 Available species in your garden:', Array.from(species));
                return Array.from(species);
            } else {
                productionLog('❌ No garden data available');
                return [];
            }
        },
        checkFunctions: function() {
            productionLog('🔍 Crop highlighting function status:');
            productionLog('  removeAllTileOverrides:', typeof window.removeAllTileOverrides);
            productionLog('  highlightTilesByMutation:', typeof window.highlightTilesByMutation);
            productionLog('  setTileSpecies:', typeof window.setTileSpecies);
            productionLog('  setTileSlotTargetScale:', typeof window.setTileSlotTargetScale);
            productionLog('  gardenInfo available:', !!window.gardenInfo);
            productionLog('  currentCrop available:', !!window.currentCrop);
        },
        forceRefresh: function() {
            productionLog('🔄 Forcing multiple refresh attempts...');

            // Method 1: Visibility change
            try {
                globalThis.dispatchEvent?.(new Event("visibilitychange"));
                productionLog('✅ Triggered visibilitychange event');
            } catch (e) {
                productionLog('❌ Could not trigger visibilitychange');
            }

            // Method 2: Focus events
            try {
                window.dispatchEvent(new Event('focus'));
                window.dispatchEvent(new Event('blur'));
                window.dispatchEvent(new Event('focus'));
                productionLog('✅ Triggered focus/blur events');
            } catch (e) {
                productionLog('❌ Could not trigger focus events');
            }

            // Method 3: Resize event
            try {
                window.dispatchEvent(new Event('resize'));
                productionLog('✅ Triggered resize event');
            } catch (e) {
                productionLog('❌ Could not trigger resize');
            }

            // Method 4: Force re-hook atoms
            setTimeout(() => {
                productionLog('🔄 Re-hooking atoms...');
                if (targetWindow.jotaiAtomCache) {
                    hookAtomForTileOverrides("/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myDataAtom", "gardenInfo");
                    hookAtomForTileOverrides("/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom", "currentCrop");
                }
            }, 100);

            // Method 5: Mouse movement simulation
            try {
                const mouseEvent = new MouseEvent('mousemove', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: window.innerWidth / 2,
                    clientY: window.innerHeight / 2
                });
                document.dispatchEvent(mouseEvent);
                productionLog('✅ Triggered mouse movement');
            } catch (e) {
                productionLog('❌ Could not trigger mouse movement');
            }
        },
        inspectOverrides: function() {
            productionLog('🔍 Current tile overrides:');
            productionLog('  Species overrides:', window.__tileOverrides);
            productionLog('  Scale overrides:', window.__slotTargetOverrides);

            const speciesCount = Object.keys(window.__tileOverrides || {}).length;
            const scaleCount = Object.keys(window.__slotTargetOverrides || {}).length;
            productionLog(`  Total overrides: ${speciesCount} species, ${scaleCount} scales`);

            if (speciesCount > 0) {
                productionLog('📋 Sample species overrides:');
                Object.entries(window.__tileOverrides).slice(0, 5).forEach(([index, species]) => {
                    productionLog(`    Tile ${index} → ${species}`);
                });
            }
        },
        enableDebugMode: function() {
            UnifiedState.data.settings.debugMode = true;
            productionLog('🐛 Debug mode enabled - you will see detailed tile modification logs');
        },
        disableDebugMode: function() {
            UnifiedState.data.settings.debugMode = false;
            productionLog('🔇 Debug mode disabled');
        },
        strongRefresh: function() {
            productionLog('💪 Attempting strong refresh with multiple methods...');
            this.forceRefresh();

            // Wait and try again
            setTimeout(() => {
                productionLog('🔄 Second refresh wave...');
                this.forceRefresh();

                // Try direct garden access
                setTimeout(() => {
                    if (window.gardenInfo?.garden?.tileObjects) {
                        productionLog('🎯 Triggering direct garden re-read...');
                        const tileObjects = window.gardenInfo.garden.tileObjects;
                        const count = Array.isArray(tileObjects) ? tileObjects.length :
                                     tileObjects instanceof Map ? tileObjects.size :
                                     Object.keys(tileObjects).length;
                        productionLog(`📊 Garden has ${count} tiles - forcing re-process...`);

                        // Force a property access that might trigger re-rendering
                        try {
                            if (Array.isArray(tileObjects)) {
                                tileObjects.forEach((tile, idx) => {
                                    if (tile) {
                                        const _ = tile.species; // Force property access
                                        const __ = tile.slots; // Force slots access
                                    }
                                });
                            }
                            productionLog('✅ Forced tile property access complete');
                        } catch (e) {
                            productionLog('❌ Could not force tile access:', e);
                        }
                    }
                }, 200);
            }, 500);
        }
    };

    // Backward compatibility aliases to prevent conflicts with other scripts
    // These key functions are exposed with MGA_ prefix to coexist with other mods
    window.MGA_removeAllTileOverrides = window.MGA_Internal.removeAllTileOverrides;
    window.MGA_highlightTilesByMutation = window.highlightTilesByMutation;
    window.MGA_setTileSpecies = window.MGA_Internal.setTileSpecies;
    window.MGA_setTileSlotTargetScale = window.MGA_Internal.setTileSlotTargetScale;

    // For scripts that might still depend on the global names, check if they exist
    // If not (meaning no conflict), provide them. If they do exist, skip to avoid conflicts.
    if (typeof window.removeAllTileOverrides !== 'function') {
        window.removeAllTileOverrides = window.MGA_Internal.removeAllTileOverrides;
    }
    if (typeof window.setTileSpecies !== 'function') {
        window.setTileSpecies = window.MGA_Internal.setTileSpecies;
    }
    if (typeof window.setTileSlotTargetScale !== 'function') {
        window.setTileSlotTargetScale = window.MGA_Internal.setTileSlotTargetScale;
    }

    productionLog('🌱 Crop highlighting debugging tools installed:');
    productionLog('  • debugCropHighlighting() - Full diagnostic');
    productionLog('  • MGA_CropDebug.debug() - Same as above');
    productionLog('  • MGA_CropDebug.testHighlight("Aloe") - Test highlighting');
    productionLog('  • MGA_CropDebug.listAvailableSpecies() - See what you have');
    productionLog('  • MGA_CropDebug.checkFunctions() - Verify functions exist');
    productionLog('  • MGA_CropDebug.clear() - Clear all highlights');
    productionLog('  🔧 Advanced debugging:');
    productionLog('  • MGA_CropDebug.inspectOverrides() - See current overrides');
    productionLog('  • MGA_CropDebug.enableDebugMode() - Detailed tile logs');
    productionLog('  • MGA_CropDebug.forceRefresh() - Force game refresh');
    productionLog('  • MGA_CropDebug.strongRefresh() - Aggressive refresh');

    function applyPreset(preset) {
        const settings = UnifiedState.data.settings;

        switch (preset) {
            case 'gaming':
                settings.opacity = 85;
                settings.gradientStyle = 'red-orange';
                settings.effectStyle = 'neon';
                break;
            case 'minimal':
                settings.opacity = 70;
                settings.gradientStyle = 'blue-purple';
                settings.effectStyle = 'glass';
                break;
            case 'vibrant':
                settings.opacity = 95;
                settings.gradientStyle = 'purple-pink';
                settings.effectStyle = 'neon';
                break;
            case 'dark':
                settings.opacity = 90;
                settings.gradientStyle = 'blue-purple';
                settings.effectStyle = 'metallic';
                break;
            case 'luxury':
                settings.opacity = 88;
                settings.gradientStyle = 'gold-yellow';
                settings.effectStyle = 'metallic';
                break;
            case 'steel':
                settings.opacity = 92;
                settings.gradientStyle = 'steel-blue';
                settings.effectStyle = 'steel';
                break;
            case 'chrome':
                settings.opacity = 85;
                settings.gradientStyle = 'chrome-silver';
                settings.effectStyle = 'chrome';
                break;
            case 'titanium':
                settings.opacity = 90;
                settings.gradientStyle = 'titanium-gray';
                settings.effectStyle = 'titanium';
                break;
            case 'reset':
                settings.opacity = 95;
                settings.gradientStyle = 'blue-purple';
                settings.effectStyle = 'none';
                break;
        }

        applyTheme();
        updateTabContent(); // Refresh the settings tab
        MGA_saveJSON('MGA_settings', settings);
    }

    // Universal theme generation function with dual opacity support
    function generateThemeStyles(settings = UnifiedState.data.settings, isPopout = false) {
        // Use different opacity based on window type
        const opacity = isPopout ?
            (settings.popoutOpacity / 100) :
            (settings.opacity / 100);

        // Apply opacity boost for high levels to ensure true 100% opacity
        // This compensates for theme gradient multipliers and weak RGB values
        let effectiveOpacity = opacity;
        if (opacity > 0.8) {
            if (opacity === 1.0) {
                // Special overboost for true 100% opacity - creates truly solid panels
                effectiveOpacity = 1.8; // 80% overboost for solid appearance
            } else {
                // Regular boost for 80-99% range
                effectiveOpacity = Math.min(1.5, opacity * 1.5); // 50% boost, max 150%
            }
        }

        // Define gradient styles - ALL themes now use effectiveOpacity for true 100% support
        const gradients = {
            'blue-purple': 'linear-gradient(135deg, rgba(20, 20, 35, ' + effectiveOpacity + ') 0%, rgba(30, 30, 50, ' + effectiveOpacity + ') 100%)',
            'green-blue': 'linear-gradient(135deg, rgba(20, 35, 20, ' + effectiveOpacity + ') 0%, rgba(30, 40, 60, ' + effectiveOpacity + ') 100%)',
            'red-orange': 'linear-gradient(135deg, rgba(35, 20, 20, ' + effectiveOpacity + ') 0%, rgba(50, 35, 30, ' + effectiveOpacity + ') 100%)',
            'purple-pink': 'linear-gradient(135deg, rgba(35, 20, 35, ' + effectiveOpacity + ') 0%, rgba(50, 30, 45, ' + effectiveOpacity + ') 100%)',
            'gold-yellow': 'linear-gradient(135deg, rgba(35, 30, 20, ' + effectiveOpacity + ') 0%, rgba(45, 40, 25, ' + effectiveOpacity + ') 100%)',
            // New vibrant gradients - using effectiveOpacity for better high-level opacity
            'electric-neon': 'linear-gradient(135deg, rgba(0, 100, 255, ' + (effectiveOpacity * 0.3) + ') 0%, rgba(147, 51, 234, ' + (effectiveOpacity * 0.4) + ') 100%)',
            'sunset-fire': 'linear-gradient(135deg, rgba(255, 94, 77, ' + (effectiveOpacity * 0.3) + ') 0%, rgba(255, 154, 0, ' + (effectiveOpacity * 0.4) + ') 100%)',
            'emerald-cyan': 'linear-gradient(135deg, rgba(16, 185, 129, ' + (effectiveOpacity * 0.3) + ') 0%, rgba(6, 182, 212, ' + (effectiveOpacity * 0.4) + ') 100%)',
            'royal-gold': 'linear-gradient(135deg, rgba(139, 69, 19, ' + (effectiveOpacity * 0.4) + ') 0%, rgba(255, 215, 0, ' + (effectiveOpacity * 0.3) + ') 100%)',
            'crimson-blaze': 'linear-gradient(135deg, rgba(220, 38, 127, ' + (effectiveOpacity * 0.3) + ') 0%, rgba(249, 115, 22, ' + (effectiveOpacity * 0.4) + ') 100%)',
            'ocean-deep': 'linear-gradient(135deg, rgba(15, 23, 42, ' + (effectiveOpacity * 0.8) + ') 0%, rgba(30, 64, 175, ' + (effectiveOpacity * 0.6) + ') 100%)',
            'forest-mystique': 'linear-gradient(135deg, rgba(20, 83, 45, ' + (effectiveOpacity * 0.6) + ') 0%, rgba(34, 197, 94, ' + (effectiveOpacity * 0.4) + ') 100%)',
            'cosmic-purple': 'linear-gradient(135deg, rgba(88, 28, 135, ' + (effectiveOpacity * 0.6) + ') 0%, rgba(168, 85, 247, ' + (effectiveOpacity * 0.4) + ') 100%)',
            'rainbow-burst': 'linear-gradient(135deg, rgba(239, 68, 68, ' + (effectiveOpacity * 0.25) + ') 0%, rgba(245, 158, 11, ' + (effectiveOpacity * 0.25) + ') 25%, rgba(34, 197, 94, ' + (effectiveOpacity * 0.25) + ') 50%, rgba(59, 130, 246, ' + (effectiveOpacity * 0.25) + ') 75%, rgba(147, 51, 234, ' + (effectiveOpacity * 0.25) + ') 100%)',
            // Premium metallic themes - using effectiveOpacity for better high-level opacity
            'steel-blue': 'linear-gradient(135deg, rgba(30, 41, 59, ' + (effectiveOpacity * 0.9) + ') 0%, rgba(51, 65, 85, ' + (effectiveOpacity * 0.8) + ') 25%, rgba(71, 85, 105, ' + (effectiveOpacity * 0.7) + ') 50%, rgba(30, 58, 138, ' + (effectiveOpacity * 0.6) + ') 100%)',
            'chrome-silver': 'linear-gradient(135deg, rgba(203, 213, 225, ' + (effectiveOpacity * 0.4) + ') 0%, rgba(148, 163, 184, ' + (effectiveOpacity * 0.6) + ') 25%, rgba(100, 116, 139, ' + (effectiveOpacity * 0.8) + ') 50%, rgba(71, 85, 105, ' + (effectiveOpacity * 0.9) + ') 100%)',
            'titanium-gray': 'linear-gradient(135deg, rgba(55, 65, 81, ' + (effectiveOpacity * 0.9) + ') 0%, rgba(75, 85, 99, ' + (effectiveOpacity * 0.8) + ') 25%, rgba(107, 114, 128, ' + (effectiveOpacity * 0.7) + ') 50%, rgba(156, 163, 175, ' + (effectiveOpacity * 0.5) + ') 100%)',
            'platinum-white': 'linear-gradient(135deg, rgba(249, 250, 251, ' + (effectiveOpacity * 0.3) + ') 0%, rgba(229, 231, 235, ' + (effectiveOpacity * 0.4) + ') 25%, rgba(209, 213, 219, ' + (effectiveOpacity * 0.5) + ') 50%, rgba(156, 163, 175, ' + (effectiveOpacity * 0.6) + ') 100%)'
        };

        const background = gradients[settings.gradientStyle] || gradients['blue-purple'];

        // Generate effect styles for the current theme
        let boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
        let borderShadow = '';

        switch (settings.effectStyle) {
            case 'metallic':
                boxShadow = `
                    0 10px 40px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `;
                break;
            case 'neon':
                borderShadow = `0 0 20px rgba(74, 158, 255, ${effectiveOpacity * 0.6})`;
                boxShadow = `
                    0 10px 40px rgba(0, 0, 0, 0.5),
                    ${borderShadow}
                `;
                break;
            case 'plasma':
                borderShadow = `0 0 30px rgba(147, 51, 234, ${effectiveOpacity * 0.5})`;
                boxShadow = `
                    0 10px 40px rgba(0, 0, 0, 0.5),
                    ${borderShadow}
                `;
                break;
            case 'holographic':
                boxShadow = `
                    0 10px 40px rgba(0, 0, 0, 0.5),
                    0 0 40px rgba(255, 255, 255, ${effectiveOpacity * 0.1}),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
                break;
            case 'crystal':
                boxShadow = `
                    0 10px 40px rgba(0, 0, 0, 0.5),
                    0 0 20px rgba(255, 255, 255, ${effectiveOpacity * 0.1}),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `;
                break;
        }

        return {
            background,
            boxShadow,
            opacity: isPopout ? settings.popoutOpacity : settings.opacity, // Use correct opacity for window type
            effectiveOpacity: effectiveOpacity, // Include for proper backdrop filter calculations
            gradientStyle: settings.gradientStyle,
            effectStyle: settings.effectStyle,
            isPopout: isPopout // Track window type for special handling
        };
    }

    function applyThemeToElement(element, themeStyles) {
        if (!element || !themeStyles) return;

        const opacity = themeStyles.opacity / 100;

        // Handle true 0% opacity - completely transparent
        if (opacity === 0) {
            element.style.background = 'transparent';
            element.style.boxShadow = 'none';
            element.style.backdropFilter = 'none';
            element.style.border = 'none';
            productionLog('🔍 Applied true 0% opacity - completely transparent');
            return;
        }

        // Handle true 100% opacity - completely opaque
        if (opacity === 1.0 && themeStyles.effectiveOpacity) {
            // For 100% opacity, use the background but ensure it's truly opaque
            element.style.background = themeStyles.background.replace(/rgba\(([^)]+)\)/g, (match, rgbaValues) => {
                const values = rgbaValues.split(',');
                if (values.length === 4) {
                    // Replace alpha with 1.0 for true opacity
                    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 1.0)`;
                }
                return match;
            });
            element.style.boxShadow = themeStyles.boxShadow;
            element.style.backdropFilter = 'blur(15px)'; // Strong blur for 100% opacity
            element.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            productionLog('🎨 Applied true 100% opacity - completely opaque');
            return;
        }

        // Handle regular opacity ranges (1-99%)
        element.style.background = themeStyles.background;
        element.style.boxShadow = themeStyles.boxShadow;

        if (opacity > 0.05) { // Lower threshold for backdrop filter
            // Scale blur intensity with opacity for better visual effect
            const blurIntensity = Math.max(2, Math.min(12, 12 * opacity));
            element.style.backdropFilter = `blur(${blurIntensity}px)`;
        } else {
            element.style.backdropFilter = 'none';
        }

        element.style.border = `1px solid rgba(255, 255, 255, ${Math.max(0.05, opacity * 0.15)})`;

        // Set theme-aware CSS custom properties for dynamic elements
        const effectiveOpacity = themeStyles.effectiveOpacity || opacity;
        const accentColor = getAccentColorForTheme(themeStyles.gradientStyle, effectiveOpacity);

        element.style.setProperty('--theme-accent-bg', accentColor.background);
        element.style.setProperty('--theme-accent-border', accentColor.border);

        // Apply dynamic scaling if this is an overlay
        if (element.classList.contains('mga-overlay') || element.id && element.id.includes('overlay')) {
            const width = element.offsetWidth || 400;
            const scale = calculateScale(width);
            element.style.setProperty('--panel-scale', scale);
        }
    }

    function calculateScale(width) {
        // Same scaling logic as the main panel
        let scale = 1;
        if (width < 350) {
            scale = 0.8;
        } else if (width < 450) {
            scale = 0.85;
        } else if (width < 550) {
            scale = 0.9;
        } else if (width < 650) {
            scale = 0.95;
        } else if (width >= 800) {
            scale = 1.05;
        }
        return scale;
    }

    function getAccentColorForTheme(gradientStyle, opacity) {
        // Define accent colors based on the current theme
        const accentColors = {
            'blue-purple': {
                background: `linear-gradient(135deg, rgba(74, 158, 255, ${opacity * 0.1}) 0%, rgba(147, 51, 234, ${opacity * 0.1}) 100%)`,
                border: `rgba(74, 158, 255, ${opacity * 0.3})`
            },
            'green-blue': {
                background: `linear-gradient(135deg, rgba(34, 197, 94, ${opacity * 0.1}) 0%, rgba(59, 130, 246, ${opacity * 0.1}) 100%)`,
                border: `rgba(34, 197, 94, ${opacity * 0.3})`
            },
            'red-orange': {
                background: `linear-gradient(135deg, rgba(239, 68, 68, ${opacity * 0.1}) 0%, rgba(249, 115, 22, ${opacity * 0.1}) 100%)`,
                border: `rgba(239, 68, 68, ${opacity * 0.3})`
            },
            'purple-pink': {
                background: `linear-gradient(135deg, rgba(168, 85, 247, ${opacity * 0.1}) 0%, rgba(236, 72, 153, ${opacity * 0.1}) 100%)`,
                border: `rgba(168, 85, 247, ${opacity * 0.3})`
            },
            'gold-yellow': {
                background: `linear-gradient(135deg, rgba(255, 215, 0, ${opacity * 0.1}) 0%, rgba(245, 158, 11, ${opacity * 0.1}) 100%)`,
                border: `rgba(255, 215, 0, ${opacity * 0.3})`
            },
            'steel-blue': {
                background: `linear-gradient(135deg, rgba(30, 58, 138, ${opacity * 0.1}) 0%, rgba(51, 65, 85, ${opacity * 0.1}) 100%)`,
                border: `rgba(30, 58, 138, ${opacity * 0.3})`
            },
            'chrome-silver': {
                background: `linear-gradient(135deg, rgba(203, 213, 225, ${opacity * 0.1}) 0%, rgba(148, 163, 184, ${opacity * 0.1}) 100%)`,
                border: `rgba(203, 213, 225, ${opacity * 0.3})`
            },
            'titanium-gray': {
                background: `linear-gradient(135deg, rgba(107, 114, 128, ${opacity * 0.1}) 0%, rgba(156, 163, 175, ${opacity * 0.1}) 100%)`,
                border: `rgba(107, 114, 128, ${opacity * 0.3})`
            },
            'electric-neon': {
                background: `linear-gradient(135deg, rgba(0, 100, 255, ${opacity * 0.1}) 0%, rgba(147, 51, 234, ${opacity * 0.1}) 100%)`,
                border: `rgba(0, 100, 255, ${opacity * 0.3})`
            },
            'rainbow-burst': {
                background: `linear-gradient(135deg, rgba(239, 68, 68, ${opacity * 0.08}) 0%, rgba(245, 158, 11, ${opacity * 0.08}) 25%, rgba(34, 197, 94, ${opacity * 0.08}) 50%, rgba(59, 130, 246, ${opacity * 0.08}) 75%, rgba(147, 51, 234, ${opacity * 0.08}) 100%)`,
                border: `rgba(147, 51, 234, ${opacity * 0.3})`
            }
        };

        return accentColors[gradientStyle] || accentColors['blue-purple'];
    }

    function syncThemeToAllWindows() {
        // Generate theme styles specifically for pop-out windows
        const popoutThemeStyles = generateThemeStyles(UnifiedState.data.settings, true);
        if (!popoutThemeStyles) return;

        // Update all in-game overlays with pop-out opacity
        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
            if (overlay && document.contains(overlay)) {
                applyThemeToElement(overlay, popoutThemeStyles);
            }
        });

        // For pop-out windows, we'll implement a refresh system since we can't directly
        // communicate with them across window contexts. This is a limitation of
        // separate windows, but the themes will be applied when they're opened.

        // Store theme update timestamp for future reference
        UnifiedState.data.lastThemeUpdate = Date.now();
    }

    // Enhanced function to ensure themes are always current
    function ensureThemeConsistency() {
        // Apply theme to main panel if it exists but doesn't have the current theme
        const panel = UnifiedState.panels.main;
        if (panel) {
            const currentTheme = UnifiedState.currentTheme || generateThemeStyles();
            if (!UnifiedState.currentTheme) {
                UnifiedState.currentTheme = currentTheme;
            }
            applyThemeToElement(panel, currentTheme);
        }

        // Update all overlays
        syncThemeToAllWindows();
    }

    // Enhanced modal spam prevention with debouncing and queue system
    function setupModalSpamPrevention() {
        // Add modal spam protection to settings
        if (!UnifiedState.data.settings.modalSpamProtection) {
            UnifiedState.data.settings.modalSpamProtection = {
                enabled: true,
                cooldownMs: 500,
                queueLimit: 3,
                lastModalTime: 0,
                modalQueue: []
            };
        }

        const modalSettings = UnifiedState.data.settings.modalSpamProtection;

        // Note: Console.log filtering removed - cannot intercept logs from other userscripts (MGC)
        // MGC spam is from separate userscript and must be filtered at browser console level if needed

        // Enhanced modal prevention with debouncing
        const originalAlert = window.alert;
        const originalConfirm = window.confirm;

        window.alert = function(message) {
            if (!modalSettings.enabled) return originalAlert.call(window, message);

            const now = Date.now();
            if (now - modalSettings.lastModalTime < modalSettings.cooldownMs) {
                debugLog('MODAL_SPAM', 'Alert blocked due to cooldown', { message: message.substring(0, 50) });
                return;
            }

            modalSettings.lastModalTime = now;
            return originalAlert.call(window, message);
        };

        window.confirm = function(message) {
            if (!modalSettings.enabled) return originalConfirm.call(window, message);

            const now = Date.now();
            if (now - modalSettings.lastModalTime < modalSettings.cooldownMs) {
                debugLog('MODAL_SPAM', 'Confirm blocked due to cooldown', { message: message.substring(0, 50) });
                return false; // Default to false for safety
            }

            modalSettings.lastModalTime = now;
            return originalConfirm.call(window, message);
        };

        // Prevent multiple overlapping modal dialogs
        let activeModalCount = 0;
        const originalCreateElement = targetDocument.createElement;
        targetDocument.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);

            if (tagName.toLowerCase() === 'dialog' ||
                (element.className && element.className.includes('modal'))) {

                if (activeModalCount >= modalSettings.queueLimit) {
                    debugLog('MODAL_SPAM', 'Modal blocked due to queue limit');
                    return element; // Return but don't increment count
                }

                activeModalCount++;

                // Auto-cleanup modal count after 5 seconds
                setTimeout(() => {
                    if (activeModalCount > 0) activeModalCount--;
                }, 5000);
            }

            return element;
        };

        debugLog('MODAL_SPAM', 'Enhanced modal spam prevention initialized', {
            cooldownMs: modalSettings.cooldownMs,
            queueLimit: modalSettings.queueLimit
        });
    }

    function applyTheme() {
        const panel = UnifiedState.panels.main;
        if (!panel) return;

        const themeStyles = generateThemeStyles();
        applyThemeToElement(panel, themeStyles);

        // Store current theme for cross-window synchronization
        UnifiedState.currentTheme = themeStyles;

        // Update all existing overlays and pop-out windows
        syncThemeToAllWindows();
    }

    function applyUltraCompactMode(enabled) {
        const panel = UnifiedState.panels.main;
        if (!panel) return;

        if (enabled) {
            // Apply ultra-compact styles
            panel.style.cssText += `
                --mga-font-size: 11px;
                --mga-section-padding: 6px;
                --mga-header-padding: 8px 12px;
                --mga-button-padding: 4px 8px;
                --mga-input-padding: 4px 6px;
                --mga-tab-height: 32px;
                --mga-spacing: 4px;
                min-width: 250px;
                font-size: 11px;
            `;

            // Add ultra-compact class for specific styling
            panel.classList.add('mga-ultra-compact');

            // Reduce overall panel size
            const currentWidth = parseInt(panel.style.width) || 800;
            const currentHeight = parseInt(panel.style.height) || 600;
            panel.style.width = Math.max(250, currentWidth * 0.7) + 'px';
            panel.style.height = Math.max(300, currentHeight * 0.8) + 'px';

        } else {
            // Remove ultra-compact styles
            panel.classList.remove('mga-ultra-compact');

            // Restore normal CSS variables
            panel.style.cssText = panel.style.cssText.replace(/--mga-[^;]+;/g, '');

            // Restore normal size - remove restrictions
            panel.style.minWidth = '250px';
            panel.style.maxWidth = '';
            panel.style.fontSize = '13px';
        }

        // Force re-render of current tab to apply new styles
        if (UnifiedState.activeTab) {
            updateTabContent();
        }

        productionLog(`📱 Ultra-compact mode ${enabled ? 'applied' : 'removed'}`);
    }

    // Cache for scale calculations
    const scaleCache = new Map();

    function applyDynamicScaling(element, width) {
        // Don't override ultra-compact mode
        if (element.classList.contains('mga-ultra-compact')) {
            return;
        }

        // Use cached scale if available for this width range
        const widthRange = Math.floor(width / 50) * 50; // Round to nearest 50px
        let scale = scaleCache.get(widthRange);

        if (scale === undefined) {
            // Calculate scale only once per range
            scale = 1;
            if (width < 350) {
                scale = 0.8;
            } else if (width < 450) {
                scale = 0.85;
            } else if (width < 550) {
                scale = 0.9;
            } else if (width < 650) {
                scale = 0.95;
            } else if (width >= 800) {
                scale = 1.05;
            }
            scaleCache.set(widthRange, scale);
        }

        // Only update if scale changed (avoid string conversion cost)
        const elementId = element.id || 'default';
        const lastScale = element._lastScale;
        if (lastScale !== scale) {
            element._lastScale = scale;
            element.style.setProperty('--panel-scale', scale);
        }
    }

    function updateTabResponsiveness(element) {
        // This function was causing tabs to lose their popout buttons and text to truncate
        // Now we use horizontal scrolling with navigation arrows instead
        // Just handle scrolling the active tab into view if needed
        const tabs = element.querySelectorAll('.mga-tab');
        const tabsContainer = element.querySelector('.mga-tabs');

        if (!tabsContainer || tabs.length === 0) return;

        // Ensure active tab is visible by scrolling if necessary
        const activeTab = element.querySelector('.mga-tab.active');
        if (activeTab && tabsContainer.scrollWidth > tabsContainer.clientWidth) {
            const tabRect = activeTab.getBoundingClientRect();
            const containerRect = tabsContainer.getBoundingClientRect();

            if (tabRect.right > containerRect.right) {
                tabsContainer.scrollLeft += (tabRect.right - containerRect.right) + 10;
            } else if (tabRect.left < containerRect.left) {
                tabsContainer.scrollLeft -= (containerRect.left - tabRect.left) + 10;
            }
        }
    }

    // ==================== ABILITY MONITORING ====================
    // OPTIMIZED: Batch DOM updates and only update when necessary
    let pendingAbilityUpdates = false;

    // Helper function to get crop info from garden (only if unambiguous)
    function getGardenCropIfUnique() {
        const tileObjects = window.gardenInfo?.garden?.tileObjects;
        if (!tileObjects) return null;

        // Count unique species (only plants, not empty tiles)
        const speciesSet = new Set();
        const tiles = Object.values(tileObjects);

        tiles.forEach(tile => {
            if (tile?.species && tile.objectType === 'plant') {
                speciesSet.add(tile.species);
            }
        });

        // Only return if there's exactly ONE unique species (unambiguous)
        // If multiple crops, we can't know which one was affected
        if (speciesSet.size === 1) {
            return Array.from(speciesSet)[0];
        }

        return null; // Multiple crops or no crops - can't determine accurately
    }

    function monitorPetAbilities() {
        if (!UnifiedState.atoms.petAbility || !UnifiedState.atoms.activePets) return;

        let hasNewAbility = false;

        UnifiedState.atoms.activePets.forEach((pet, index) => {
            if (!pet || !pet.id) return;

            const abilityData = UnifiedState.atoms.petAbility[pet.id];
            if (!abilityData || !abilityData.lastAbilityTrigger) return;

            const trigger = abilityData.lastAbilityTrigger;
            const currentTimestamp = trigger.performedAt;

            // BUGFIX v1.11.4: Skip logging if pet is unfed (hunger = 0)
            // Game shows "feed your pet" notification but creates empty trigger
            if (!currentTimestamp || pet.hunger === 0) {
                productionLog(`🚫 [ABILITY-SKIP] Pet ${pet.petSpecies} unfed (hunger: ${pet.hunger}) - skipping ability log`);
                return;
            }

            // BUGFIX v1.11.4: Additional validation - skip if trigger has no valid ability ID
            // This prevents fake ability logs from unfed pet notifications
            if (!trigger.abilityId || trigger.abilityId === 'Unknown' || trigger.abilityId === '') {
                productionLog(`🚫 [ABILITY-SKIP] Invalid ability ID for ${pet.petSpecies} - likely unfed pet notification`);
                return;
            }

            // Check if this is a new trigger - use UnifiedState instead of window variables
            if (!UnifiedState.data.lastAbilityTimestamps) {
                UnifiedState.data.lastAbilityTimestamps = {};
            }

            const lastKnown = UnifiedState.data.lastAbilityTimestamps[pet.id];
            if (lastKnown === currentTimestamp) return;

            UnifiedState.data.lastAbilityTimestamps[pet.id] = currentTimestamp;
            hasNewAbility = true;

            // Save ability timestamps to prevent duplicate logging after refresh
            MGA_debouncedSave('MGA_lastAbilityTimestamps', UnifiedState.data.lastAbilityTimestamps);

            // BUGFIX: Enrich ability data with crop info if missing (only when unambiguous)
            let enrichedData = trigger.data ? { ...trigger.data } : {};

            // For granter abilities (Gold/Rainbow), try to add crop name if missing
            const abilityId = trigger.abilityId || '';
            if (abilityId.includes('Granter') && !enrichedData.cropName) {
                // Strategy 1: Check currentCrop (works for single-crop users)
                const currentCrop = window.currentCrop || UnifiedState.atoms.currentCrop;
                if (currentCrop && currentCrop[0]?.species) {
                    enrichedData.cropName = currentCrop[0].species;
                } else {
                    // Strategy 2: Check garden tiles (only if exactly ONE crop type exists)
                    // This prevents showing wrong crop when multiple crop types are growing
                    const uniqueCrop = getGardenCropIfUnique();
                    if (uniqueCrop) {
                        enrichedData.cropName = uniqueCrop;
                    }
                    // Otherwise: No crop name added (honest about uncertainty)
                }
            }

            const abilityLog = {
                petName: pet.petSpecies || `Pet ${index + 1}`,
                abilityType: trigger.abilityId || 'Unknown Ability',
                timestamp: currentTimestamp,
                timeString: formatTimestamp(currentTimestamp),
                data: Object.keys(enrichedData).length > 0 ? enrichedData : null
            };

            UnifiedState.data.petAbilityLogs.unshift(abilityLog);

            // Apply memory management to keep recent logs in memory, archive older ones
            UnifiedState.data.petAbilityLogs = MGA_manageLogMemory(UnifiedState.data.petAbilityLogs);

            // Use debounced save to reduce I/O operations during frequent ability triggers
            MGA_debouncedSave('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);

            // Check if we should notify for this ability
            if (UnifiedState.data.settings.notifications.abilityNotificationsEnabled) {
                const abilityType = trigger.abilityId || '';

                // Filter out ProduceMutationBoost/PetMutationBoost - these are passive and shouldn't trigger notifications
                if (abilityType && (
                    abilityType.includes('ProduceMutationBoost') ||
                    abilityType.includes('PetMutationBoost')
                )) {
                    return; // Skip notification for mutation boosts
                }

                // Check individual abilities list
                const watchedAbilities = UnifiedState.data.settings.notifications.watchedAbilities || [];

                // Logic:
                // - Empty array = all abilities enabled (default/backward compatible)
                // - ['__NONE__'] = no abilities enabled (user clicked "Select None")
                // - [...abilities] = only those specific abilities enabled
                let shouldNotify = false;

                if (watchedAbilities.length === 0) {
                    // Empty array means all abilities
                    shouldNotify = true;
                } else if (watchedAbilities.includes('__NONE__')) {
                    // Special marker means none
                    shouldNotify = false;
                } else {
                    // Check if this specific ability is in the list
                    shouldNotify = watchedAbilities.includes(abilityType);
                }

                if (shouldNotify) {
                    const displayAbilityName = normalizeAbilityName(abilityType);
                    productionLog(`🎯 [ABILITY-NOTIFY] ${abilityLog.petName} triggered ${displayAbilityName}`);

                    // Play ability notification sound based on settings
                    const abilityVolume = UnifiedState.data.settings.notifications.abilityNotificationVolume || 0.2;
                    const abilitySound = UnifiedState.data.settings.notifications.abilityNotificationSound || 'single';

                    switch (abilitySound) {
                        case 'single':
                            playSingleBeepNotification(abilityVolume);
                            break;
                        case 'double':
                            playDoubleBeepNotification(abilityVolume);
                            break;
                        case 'triple':
                            playTripleBeepNotification(abilityVolume);
                            break;
                        case 'chime':
                            playChimeNotification(abilityVolume);
                            break;
                        case 'alert':
                            playAlertNotification(abilityVolume);
                            break;
                        case 'buzz':
                            playBuzzNotification(abilityVolume);
                            break;
                        case 'ding':
                            playDingNotification(abilityVolume);
                            break;
                        case 'chirp':
                            playChirpNotification(abilityVolume);
                            break;
                        default:
                            playSingleBeepNotification(abilityVolume);
                    }

                    // Show toast
                    showNotificationToast(`✨ ${abilityLog.petName}: ${displayAbilityName}`, 'success');
                }
            }
        });

        // OPTIMIZED: Only update DOM if there's actually a new ability and page is visible
        if (hasNewAbility && document.visibilityState === 'visible' && !pendingAbilityUpdates) {
            pendingAbilityUpdates = true;
            // Batch all DOM updates in next animation frame
            requestAnimationFrame(() => {
                updateAllAbilityLogDisplays();

                if (UnifiedState.activeTab === 'abilities') {
                    updateTabContent();
                }

                // BUGFIX: Removed duplicate overlay update loop
                // updateAllAbilityLogDisplays() already handles all overlays at line 13548
                // Duplicate updates were causing race conditions when both tab and pop-up were open

                pendingAbilityUpdates = false;
            });
        }
    }

    function exportAbilityLogs() {
        const allLogs = MGA_getAllLogs();
        if (!allLogs.length) {
            productionWarn('⚠️ No logs to export!');
            return;
        }

        const headers = 'Date,Time,Pet Name,Ability Type,Details\r\n';
        const csvContent = allLogs.map(log => {
            const date = new Date(log.timestamp);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                log.petName,
                normalizeAbilityName(log.abilityType),
                JSON.stringify(log.data || '')
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        }).join('\r\n');

        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = targetDocument.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `MagicGarden_AbilityLogs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    // ==================== VALUE CALCULATIONS ====================
    const speciesValues = {
        Sunflower: 750000,
        Starweaver: 10000000,
        DawnCelestial: 11000000,
        MoonCelestial: 11000000,
        Lychee: 50000,
        DragonFruit: 24500,
        PassionFruit: 24500,
        Lemon: 10000,
        Pepper: 7220,
        Grape: 7085,
        Bamboo: 500000,
        Cactus: 287000,
        Mushroom: 160000,
        BurrosTail: 6000,
        Lily: 20123,
        Banana: 1750,
        Coconut: 302,
        Echeveria: 5520,
        Pumpkin: 3700,
        Watermelon: 2708,
        Corn: 36,
        Daffodil: 1090,
        Tomato: 27,
        OrangeTulip: 767,
        Apple: 73,
        Blueberry: 23,
        Aloe: 310,
        Strawberry: 14,
        Carrot: 20
    };

    // Mutation calculation matching FriendsScript logic
    const COLOR_MULT = {
        Gold: 25,
        Rainbow: 50
    };

    const WEATHER_MULT = {
        Wet: 2,
        Chilled: 2,
        Frozen: 10
    };

    const TIME_MULT = {
        Dawnlit: 2,
        Dawnbound: 3,
        Dawncharged: 3,  // Same as Dawnbound
        Amberlit: 5,
        Amberbound: 6,
        Ambercharged: 6  // Same as Amberbound
    };

    const WEATHER_TIME_COMBO = {
        "Wet+Dawnlit": 3,
        "Chilled+Dawnlit": 3,
        "Wet+Amberlit": 6,
        "Chilled+Amberlit": 6,
        "Frozen+Dawnlit": 11,
        "Frozen+Dawnbound": 12,
        "Frozen+Dawncharged": 12,  // Same as Dawnbound
        "Frozen+Amberlit": 14,
        "Frozen+Amberbound": 15,
        "Frozen+Ambercharged": 15  // Same as Amberbound
    };

    function calculateMutationMultiplier(mutations) {
        if (!mutations || !Array.isArray(mutations)) return 1;

        // Pick best color multiplier
        let color = 1;
        for (const m of mutations) {
            if (m === "Rainbow" && COLOR_MULT.Rainbow > color) color = COLOR_MULT.Rainbow;
            if (m === "Gold" && COLOR_MULT.Gold > color) color = COLOR_MULT.Gold;
        }

        // Pick best weather
        let weather = null;
        for (const m of mutations) {
            if (WEATHER_MULT[m]) {
                if (!weather || WEATHER_MULT[m] > WEATHER_MULT[weather]) {
                    weather = m;
                }
            }
        }

        // Pick best time
        let time = null;
        for (const m of mutations) {
            if (TIME_MULT[m]) {
                if (!time || TIME_MULT[m] > TIME_MULT[time]) {
                    time = m;
                }
            }
        }

        // Calculate weather+time multiplier
        let wt = 1;
        if (!weather && !time) wt = 1;
        else if (weather && !time) wt = WEATHER_MULT[weather];
        else if (!weather && time) wt = TIME_MULT[time];
        else {
            const combo = `${weather}+${time}`;
            wt = WEATHER_TIME_COMBO[combo] || Math.max(WEATHER_MULT[weather], TIME_MULT[time]);
        }

        return Math.round(color * wt);
    }

    // ==================== ENHANCED VALUE MANAGER ====================
    class ValueManager {
        constructor() {
            this.cache = {
                inventoryValue: { value: 0, lastUpdate: 0 },
                tileValue: { value: 0, lastUpdate: 0 },
                gardenValue: { value: 0, lastUpdate: 0 }
            };
            this.throttleMs = 100; // 100ms throttle for value calculations
            this.retryAttempts = 3;
            this.observer = null;

            this.initializeObserver();
            debugLog('VALUE_MANAGER', 'ValueManager initialized', { throttleMs: this.throttleMs });
        }

        initializeObserver() {
            // Create MutationObserver to detect game state changes
            if (typeof MutationObserver !== 'undefined') {
                this.observer = new MutationObserver((mutations) => {
                    let shouldUpdate = false;
                    mutations.forEach(mutation => {
                        // Check if changes are related to inventory or game state
                        if (mutation.target.className &&
                            (mutation.target.className.includes('inventory') ||
                             mutation.target.className.includes('garden') ||
                             mutation.target.className.includes('crop'))) {
                            shouldUpdate = true;
                        }
                    });

                    if (shouldUpdate) {
                        this.invalidateCache();
                        debugLog('VALUE_MANAGER', 'Game state change detected, invalidating cache');
                    }
                });

                // Observe body for any game-related changes
                this.observer.observe(targetDocument.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'data-value']
                });
            }
        }

        getTileValue(forceRefresh = false) {
            return this.getCachedValue('tileValue', forceRefresh, () => this.calculateTileValue());
        }

        getInventoryValue(forceRefresh = false) {
            return this.getCachedValue('inventoryValue', forceRefresh, () => this.calculateInventoryValue());
        }

        getGardenValue(forceRefresh = false) {
            return this.getCachedValue('gardenValue', forceRefresh, () => this.calculateGardenValue());
        }

        getCachedValue(type, forceRefresh, calculator) {
            const cached = this.cache[type];
            const now = Date.now();

            if (!forceRefresh && cached && (now - cached.lastUpdate) < this.throttleMs) {
                return cached.value;
            }

            // Calculate new value with retry mechanism
            let attempts = 0;
            let value = 0;

            while (attempts < this.retryAttempts) {
                try {
                    value = calculator();
                    break;
                } catch (error) {
                    attempts++;
                    debugError('VALUE_MANAGER', `Calculation failed for ${type}, attempt ${attempts}`, error);

                    if (attempts >= this.retryAttempts) {
                        // Use cached value if all retries fail
                        value = cached ? cached.value : 0;
                        debugLog('VALUE_MANAGER', `Using cached value for ${type} after ${attempts} failures`);
                    } else {
                        // Brief delay before retry
                        setTimeout(() => {}, 10 * attempts);
                    }
                }
            }

            // Update cache
            this.cache[type] = {
                value,
                lastUpdate: now
            };

            return value;
        }

        calculateTileValue() {
            const currentCrop = UnifiedState.atoms.currentCrop;
            const friendBonus = UnifiedState.atoms.friendBonus || 1;
            let tileValue = 0;

            if (currentCrop && currentCrop.length) {
                currentCrop.forEach(slot => {
                    if (slot && slot.species) {
                        const multiplier = calculateMutationMultiplier(slot.mutations);
                        const speciesVal = speciesValues[slot.species] || 0;
                        const scale = slot.targetScale || 1;
                        tileValue += Math.round(multiplier * speciesVal * scale * friendBonus);
                    }
                });
            }

            return tileValue;
        }

        calculateInventoryValue() {
            const inventory = UnifiedState.atoms.inventory;
            const friendBonus = UnifiedState.atoms.friendBonus || 1;
            let inventoryValue = 0;

            if (inventory && inventory.items) {
                inventory.items.forEach(item => {
                    if (item.itemType === 'Produce' && item.species) {
                        const multiplier = calculateMutationMultiplier(item.mutations);
                        const speciesVal = speciesValues[item.species] || 0;
                        const scale = item.scale || 1;
                        inventoryValue += Math.round(multiplier * speciesVal * scale * friendBonus);
                    }
                });
            }

            return inventoryValue;
        }

        calculateGardenValue() {
            const myGarden = UnifiedState.atoms.myGarden;
            const friendBonus = UnifiedState.atoms.friendBonus || 1;
            let gardenValue = 0;

            if (myGarden && myGarden.garden && myGarden.garden.tileObjects) {
                const now = Date.now();
                Object.values(myGarden.garden.tileObjects).forEach(tile => {
                    if (tile.objectType === 'plant' && tile.slots) {
                        tile.slots.forEach(slot => {
                            if (slot && slot.species && slot.endTime && now >= slot.endTime) {
                                const multiplier = calculateMutationMultiplier(slot.mutations);
                                const speciesVal = speciesValues[slot.species] || 0;
                                const scale = slot.targetScale || 1;
                                gardenValue += Math.round(multiplier * speciesVal * scale * friendBonus);
                            }
                        });
                    }
                });
            }

            return gardenValue;
        }

        updateAllValues(forceRefresh = false) {
            const tileValue = this.getTileValue(forceRefresh);
            const inventoryValue = this.getInventoryValue(forceRefresh);
            const gardenValue = this.getGardenValue(forceRefresh);

            // Store in UnifiedState
            UnifiedState.data.tileValue = tileValue;
            UnifiedState.data.inventoryValue = inventoryValue;
            UnifiedState.data.gardenValue = gardenValue;

            // Update UI if values tab is active
            this.updateValueDisplays();

            debugLog('VALUE_MANAGER', 'All values updated', {
                tileValue,
                inventoryValue,
                gardenValue,
                cached: Object.keys(this.cache).map(k => `${k}: ${Date.now() - this.cache[k].lastUpdate}ms ago`)
            });

            return { tileValue, inventoryValue, gardenValue };
        }

        updateValueDisplays() {
            // Update main window if values tab is active
            if (UnifiedState.activeTab === 'values') {
                updateTabContent();
            }

            // Update all overlay windows showing values tab
            UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                if (overlay && document.contains(overlay) && tabName === 'values') {
                    if (overlay.className.includes('mga-overlay-content-only')) {
                        updatePureOverlayContent(overlay, tabName);
                        debugLog('VALUE_MANAGER', 'Updated pure values overlay');
                    } else {
                        // Legacy overlay structure
                        const overlayContent = overlay.querySelector('.mga-overlay-content > div');
                        if (overlayContent) {
                            overlayContent.innerHTML = getValuesTabContent();
                            debugLog('VALUE_MANAGER', 'Updated legacy values overlay');
                        }
                    }
                }
            });

            // Update separate windows
            UnifiedState.data.popouts.windows.forEach((windowRef, tabName) => {
                if (windowRef && !windowRef.closed && tabName === 'values') {
                    try {
                        const freshContent = getValuesTabContent();
                        const contentElement = windowRef.document.getElementById('content');
                        if (contentElement) {
                            contentElement.innerHTML = freshContent;
                            // Set up dashboard handlers in the separate window
                            if (window.resourceDashboard) {
                                window.resourceDashboard.setupDashboardHandlers(windowRef.document);
                            }
                            debugLog('VALUE_MANAGER', 'Updated values in separate window');
                        }
                    } catch (error) {
                        debugError('VALUE_MANAGER', 'Failed to update separate window', error);
                    }
                }
            });
        }

        invalidateCache() {
            Object.keys(this.cache).forEach(key => {
                this.cache[key].lastUpdate = 0;
            });
        }

        getStatus() {
            const now = Date.now();
            return {
                cache: Object.keys(this.cache).reduce((acc, key) => {
                    const cached = this.cache[key];
                    acc[key] = {
                        value: cached.value,
                        age: now - cached.lastUpdate,
                        fresh: (now - cached.lastUpdate) < this.throttleMs
                    };
                    return acc;
                }, {}),
                throttleMs: this.throttleMs,
                retryAttempts: this.retryAttempts
            };
        }

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    }

    // Initialize global ValueManager
    let globalValueManager = null;

    function initializeValueManager() {
        if (!globalValueManager) {
            globalValueManager = new ValueManager();
        }
        return globalValueManager;
    }

    function updateValues() {
        // Use enhanced ValueManager instead of manual calculations
        const valueManager = globalValueManager || initializeValueManager();
        valueManager.updateAllValues();

        // Refresh Values tab if it's currently active
        if (UnifiedState.activeTab === 'values') {
            updateTabContent();
        }

        // Refresh any open Values overlays
        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
            if (overlay && document.contains(overlay) && tabName === 'values') {
                if (overlay.className.includes('mga-overlay-content-only')) {
                    updatePureOverlayContent(overlay, tabName);
                }
            }
        });

        // Refresh Values in separate window popouts
        refreshSeparateWindowPopouts('values');

        debugLog('VALUES_UPDATE', 'Values updated and UI refreshed');
    }

    // ==================== SEED DELETION ====================
    function deleteSelectedSeeds() {
        if (!UnifiedState.atoms.inventory || !UnifiedState.atoms.inventory.items || !UnifiedState.data.seedsToDelete.length) {
            productionWarn('⚠️ No seeds selected for deletion!');
            return;
        }

        // Confirmation dialog for manual deletion
        const selectedSeedsText = UnifiedState.data.seedsToDelete.join(', ');
        const confirmMessage = `⚠️ WARNING: This action is IRREVERSIBLE!\n\nYou are about to permanently delete the following seeds:\n${selectedSeedsText}\n\nThis cannot be undone. Are you sure you want to continue?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // seedsToDelete now contains internal IDs (e.g., "OrangeTulip"), so direct comparison works
        productionLog('🌱 [SEED-DELETE-DEBUG] Deletion attempt:', {
            seedsToDelete: UnifiedState.data.seedsToDelete,
            inventoryItems: UnifiedState.atoms.inventory.items?.map(item => ({species: item.species, quantity: item.quantity})) || 'No inventory',
            inventoryCount: UnifiedState.atoms.inventory.items?.length || 0
        });

        const itemsToDelete = UnifiedState.atoms.inventory.items.filter(item =>
            item && item.species && UnifiedState.data.seedsToDelete.includes(item.species)
        );

        productionLog('🌱 [SEED-DELETE-DEBUG] Items found for deletion:', itemsToDelete.map(item => ({species: item.species, quantity: item.quantity})));

        if (!itemsToDelete.length) {
            productionLog('🌱 [SEED-DELETE-DEBUG] No matching items found. Details:', {
                selectedSeeds: UnifiedState.data.seedsToDelete,
                availableSpecies: UnifiedState.atoms.inventory.items?.map(item => item.species) || []
            });
            productionWarn('⚠️ No matching seeds found in inventory!');
            return;
        }

        const summary = itemsToDelete.map(item => `${item.species}: ${item.quantity}`).join('\n');

        if (confirm(`Delete the following seeds?\n\n${summary}`)) {
            itemsToDelete.forEach(item => {
                const qty = item.quantity || 0;
                for (let i = 0; i < qty; i++) {
                    safeSendMessage({
                        scopePath: ["Room", "Quinoa"],
                        type: "Wish",
                        itemId: item.species
                    });
                }
            });

            // Clear selections
            UnifiedState.data.seedsToDelete = [];

            // Clear checkboxes in main panel
            targetDocument.querySelectorAll('.seed-checkbox').forEach(cb => cb.checked = false);

            // Update main tab content
            if (UnifiedState.activeTab === 'seeds') {
                updateTabContent();
            }

            // Update all seed overlays
            UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                if (overlay && document.contains(overlay) && tabName === 'seeds') {
                    if (overlay.className.includes('mga-overlay-content-only')) {
                        updatePureOverlayContent(overlay, tabName);
                        // Also clear checkboxes in overlay
                        overlay.querySelectorAll('.seed-checkbox').forEach(cb => cb.checked = false);
                        debugLog('OVERLAY_LIFECYCLE', 'Updated pure seeds overlay after deletion');
                    }
                }
            });

            // Update separate window popouts
            refreshSeparateWindowPopouts('seeds');
        }
    }

    function startAutoDelete() {
        if (!UnifiedState.data.autoDeleteEnabled) return;

        // Clear existing interval to prevent multiple intervals
        clearManagedInterval('autoDelete');

        // Use managed interval to prevent memory leaks
        setManagedInterval('autoDelete', () => {
            if (UnifiedState.data.autoDeleteEnabled && UnifiedState.data.seedsToDelete.length) {
                const inventory = UnifiedState.atoms.inventory;
                if (!inventory || !inventory.items) return;

                // seedsToDelete now contains internal IDs (e.g., "OrangeTulip"), so direct comparison works
                UnifiedState.data.seedsToDelete.forEach(seedToDelete => {
                    const matchingItems = inventory.items.filter(item =>
                        item && item.species && item.species === seedToDelete
                    );

                    matchingItems.forEach(item => {
                        const qty = item.quantity || 0;
                        for (let i = 0; i < qty; i++) {
                            safeSendMessage({
                                scopePath: ["Room", "Quinoa"],
                                type: "Wish",
                                itemId: seedToDelete
                            });
                        }
                    });
                });
            }
        }, 2000);
    }

    function stopAutoDelete() {
        clearManagedInterval('autoDelete');
        UnifiedState.data.autoDeleteEnabled = false;
        debugLog('PERFORMANCE', 'Auto-delete stopped and disabled');
    }

    // ==================== TIMERS ====================
    // ==================== ENHANCED TIMER MANAGER ====================
    class TimerManager {
        constructor() {
            this.activeTimers = new Map();
            this.isRunning = false;
            this.animationFrameId = null;
            this.lastHeartbeat = Date.now();
            this.heartbeatInterval = 1000; // 1 second heartbeat
            this.frozenThreshold = 3000; // 3 seconds to consider frozen

            // Initialize active timers storage
            if (!UnifiedState.data.activeTimers) {
                UnifiedState.data.activeTimers = {};
            }

            this.loadPersistedTimers();
            this.startHeartbeat();

            debugLog('TIMER_MANAGER', 'TimerManager initialized', {
                heartbeatInterval: this.heartbeatInterval,
                frozenThreshold: this.frozenThreshold
            });
        }

        startTimer(id, callback, interval = 1000) {
            if (this.activeTimers.has(id)) {
                this.stopTimer(id);
            }

            const timer = {
                id,
                callback,
                interval,
                lastRun: Date.now(),
                running: true,
                frozen: false
            };

            this.activeTimers.set(id, timer);
            UnifiedState.data.activeTimers[id] = {
                interval,
                lastRun: timer.lastRun,
                running: true
            };

            this.saveTimerState();

            if (!this.isRunning) {
                this.startMainLoop();
            }

            debugLog('TIMER_MANAGER', `Timer started: ${id}`, { interval });
            return timer;
        }

        stopTimer(id) {
            if (this.activeTimers.has(id)) {
                this.activeTimers.delete(id);
                delete UnifiedState.data.activeTimers[id];
                this.saveTimerState();
                debugLog('TIMER_MANAGER', `Timer stopped: ${id}`);
            }
        }

        pauseAll() {
            this.activeTimers.forEach((timer, id) => {
                timer.running = false;
                UnifiedState.data.activeTimers[id].running = false;
            });
            this.saveTimerState();
            debugLog('TIMER_MANAGER', 'All timers paused');
        }

        resumeAll() {
            this.activeTimers.forEach((timer, id) => {
                timer.running = true;
                timer.lastRun = Date.now(); // Reset to prevent immediate execution
                UnifiedState.data.activeTimers[id].running = true;
                UnifiedState.data.activeTimers[id].lastRun = timer.lastRun;
            });
            this.saveTimerState();
            debugLog('TIMER_MANAGER', 'All timers resumed');
        }

        startMainLoop() {
            if (this.isRunning) return;

            this.isRunning = true;
            const loop = (currentTime) => {
                if (!this.isRunning || this.activeTimers.size === 0) {
                    this.isRunning = false;
                    this.animationFrameId = null;
                    return;
                }

                this.processTimers(currentTime);
                this.animationFrameId = requestAnimationFrame(loop);
            };

            this.animationFrameId = requestAnimationFrame(loop);
            debugLog('TIMER_MANAGER', 'Main loop started');
        }

        processTimers(currentTime) {
            this.activeTimers.forEach((timer, id) => {
                if (!timer.running) return;

                const elapsed = currentTime - timer.lastRun;
                if (elapsed >= timer.interval) {
                    try {
                        timer.callback();
                        timer.lastRun = currentTime;
                        timer.frozen = false;
                        UnifiedState.data.activeTimers[id].lastRun = timer.lastRun;
                    } catch (error) {
                        debugError('TIMER_MANAGER', `Timer callback error for ${id}`, error);
                    }
                }
            });
        }

        startHeartbeat() {
            const heartbeat = () => {
                const now = Date.now();
                const timeSinceLastBeat = now - this.lastHeartbeat;

                // Detect if main loop is frozen
                if (this.isRunning && timeSinceLastBeat > this.frozenThreshold) {
                    debugLog('TIMER_MANAGER', 'Heartbeat detected frozen timers, restarting main loop', {
                        timeSinceLastBeat
                    });
                    this.restartMainLoop();
                }

                // Check individual timers for freezing
                this.checkForFrozenTimers(now);

                this.lastHeartbeat = now;
                setTimeout(heartbeat, this.heartbeatInterval);
            };

            // Start first heartbeat
            setTimeout(heartbeat, this.heartbeatInterval);
            debugLog('TIMER_MANAGER', 'Heartbeat monitor started');
        }

        checkForFrozenTimers(now) {
            this.activeTimers.forEach((timer, id) => {
                if (!timer.running) return;

                const timeSinceLastRun = now - timer.lastRun;
                const expectedRuns = Math.floor(timeSinceLastRun / timer.interval);

                if (expectedRuns > 2 && !timer.frozen) {
                    debugLog('TIMER_MANAGER', `Timer appears frozen: ${id}`, {
                        timeSinceLastRun,
                        expectedRuns,
                        interval: timer.interval
                    });
                    timer.frozen = true;
                    this.restartTimer(id);
                }
            });
        }

        restartTimer(id) {
            const timer = this.activeTimers.get(id);
            if (timer) {
                timer.lastRun = Date.now();
                timer.frozen = false;
                debugLog('TIMER_MANAGER', `Timer restarted: ${id}`);
            }
        }

        restartMainLoop() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.isRunning = false;
            setTimeout(() => this.startMainLoop(), 100); // Small delay before restart
        }

        saveTimerState() {
            try {
                MGA_saveJSON('MGA_timerStates', UnifiedState.data.activeTimers);
            } catch (error) {
                debugError('TIMER_MANAGER', 'Failed to save timer state', error);
            }
        }

        loadPersistedTimers() {
            try {
                const saved = MGA_loadJSON('MGA_timerStates', {});
                UnifiedState.data.activeTimers = { ...saved };
                debugLog('TIMER_MANAGER', 'Loaded persisted timer states', {
                    count: Object.keys(saved).length
                });
            } catch (error) {
                debugError('TIMER_MANAGER', 'Failed to load persisted timers', error);
            }
        }

        getStatus() {
            return {
                isRunning: this.isRunning,
                activeCount: this.activeTimers.size,
                frozenCount: Array.from(this.activeTimers.values()).filter(t => t.frozen).length,
                lastHeartbeat: this.lastHeartbeat
            };
        }
    }

    // Initialize global TimerManager
    let globalTimerManager = null;

    function initializeTimerManager() {
        if (!globalTimerManager) {
            globalTimerManager = new TimerManager();
        }
        return globalTimerManager;
    }

    function updateTimers() {
        // Update restock timers
        const quinoaData = UnifiedState.atoms.quinoaData;
        if (quinoaData && quinoaData.shops) {
            UnifiedState.data.timers.seed = (quinoaData.shops.seed && quinoaData.shops.seed.secondsUntilRestock) || null;
            UnifiedState.data.timers.egg = (quinoaData.shops.egg && quinoaData.shops.egg.secondsUntilRestock) || null;
            UnifiedState.data.timers.tool = (quinoaData.shops.tool && quinoaData.shops.tool.secondsUntilRestock) || null;
        }

        // Calculate lunar event
        const lunarResult = getSecondsToNextLunarEvent();
        UnifiedState.data.timers.lunar = lunarResult.secondsLeft;

        // Note: checkForWatchedItems() now runs on its own 5-second interval

        // Always update timer display (needed for pop-out windows to work independently)
        updateTimerDisplay();
    }

    function getSecondsToNextLunarEvent() {
        const eventZone = "America/Chicago";
        const lunarHours = [3, 7, 11, 15, 19, 23];

        // Get current time in Central Time Zone
        const now = new Date();
        const centralTime = new Date(now.toLocaleString('en-US', { timeZone: eventZone }));

        const currentHour = centralTime.getHours();
        const currentMin = centralTime.getMinutes();
        const currentSec = centralTime.getSeconds();

        // Find next lunar event hour
        let nextEventHour = null;
        for (const eventHour of lunarHours) {
            if (eventHour > currentHour || (eventHour === currentHour && currentMin === 0 && currentSec === 0)) {
                nextEventHour = eventHour;
                break;
            }
        }

        // If no event found today, get first event tomorrow
        if (nextEventHour === null) {
            nextEventHour = lunarHours[0];
        }

        // Create next event date in Central Time
        const nextEvent = new Date(centralTime);
        nextEvent.setHours(nextEventHour, 0, 0, 0);

        // If event is in the past today, move to tomorrow
        if (nextEvent <= centralTime) {
            nextEvent.setDate(nextEvent.getDate() + 1);
        }

        // Calculate seconds until event (precise calculation without manual adjustment)
        const secondsLeft = Math.max(0, Math.floor((nextEvent.getTime() - centralTime.getTime()) / 1000));

        return {
            secondsLeft: secondsLeft, // Precise calculation without manual adjustment
            eventDateLocal: nextEvent
        };
    }

    function updateTimerDisplay() {
        const formatTime = (seconds) => {
            if (seconds == null) return '--:--';
            const s = Math.max(0, Math.floor(seconds));
            const m = Math.floor(s / 60);
            const ss = s % 60;
            return `${m}:${String(ss).padStart(2, '0')}`;
        };

        const formatTimeHoursMinutes = (seconds) => {
            if (seconds == null) return '--:--';
            const totalMinutes = Math.floor(seconds / 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        };

        // Helper function to update timer elements across all contexts
        const updateTimerElement = (id, value) => {
            // Choose formatter based on timer type
            const formatter = (id === 'timer-lunar') ? formatTimeHoursMinutes : formatTime;
            const formattedValue = formatter(value);

            // Update main window
            const mainElement = document.getElementById(id);
            if (mainElement) {
                mainElement.textContent = formattedValue;
            }

            // Update in-game overlays
            UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                if (overlay && document.contains(overlay)) {
                    const overlayElement = overlay.querySelector(`#${id}`);
                    if (overlayElement) {
                        overlayElement.textContent = formattedValue;
                    }
                }
            });

            // Update all timer elements with this ID across all open windows
            // This catches pop-out windows that may contain timer elements
            try {
                const allElements = targetDocument.querySelectorAll(`#${id}`);
                allElements.forEach(el => {
                    el.textContent = formattedValue;
                });
            } catch (e) {
                // Ignore errors from closed windows
            }
        };

        // Update all timer types
        updateTimerElement('timer-seed', UnifiedState.data.timers.seed);
        updateTimerElement('timer-egg', UnifiedState.data.timers.egg);
        updateTimerElement('timer-tool', UnifiedState.data.timers.tool);
        updateTimerElement('timer-lunar', UnifiedState.data.timers.lunar);
    }

    // ==================== DEBUGGING UTILITIES ====================
    window.debugPets = function() {
        productionLog('🔍 [DEBUG] Debugging pets data...');
        productionLog('🐾 UnifiedState.atoms.activePets:', UnifiedState.atoms.activePets);
        productionLog('🐾 window.activePets:', window.activePets);

        // Try to access game's pet data directly
        if (targetWindow.MagicCircle_RoomConnection) {
            const roomState = targetWindow.MagicCircle_RoomConnection.lastRoomStateJsonable;
            productionLog('🎮 Room state pets:', roomState?.child?.data?.petSlots);
            productionLog('🎮 User slots:', roomState?.child?.data?.userSlots);
        }

        // Check jotai atoms
        if (targetWindow.jotaiAtomCache) {
            const allAtoms = Array.from(targetWindow.jotaiAtomCache.keys());
            const petAtoms = allAtoms.filter(key =>
                key.toLowerCase().includes('pet') ||
                key.toLowerCase().includes('slot') ||
                key.toLowerCase().includes('animal')
            );
            productionLog('🔍 Pet-related atoms found:', petAtoms);
        }

        productionLog('🏠 Presets saved:', Object.keys(UnifiedState.data.petPresets));
    };

    // Manual fallback to force update Active Pets display
    window.forceUpdateActivePets = function() {
        productionLog('🔧 [MANUAL] Force updating Active Pets display...');

        // Try to get pets from room state as fallback
        if (targetWindow.MagicCircle_RoomConnection) {
            const roomState = targetWindow.MagicCircle_RoomConnection.lastRoomStateJsonable;
            const petSlots = roomState?.child?.data?.petSlots;

            if (petSlots && Array.isArray(petSlots)) {
                // Convert room state format to our expected format
                const activePetsFromRoom = petSlots.filter(slot => slot && slot.item).map(slot => ({
                    id: slot.item.id,
                    petSpecies: slot.item.species || 'Unknown',
                    mutations: slot.item.mutations || []
                }));

                productionLog('🐾 [FALLBACK] Found pets in room state:', activePetsFromRoom);

                // Manually set the active pets data
                UnifiedState.atoms.activePets = activePetsFromRoom;
                window.activePets = activePetsFromRoom;

                // Force update displays
                updateActivePetsDisplay(document);
                UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                    if (overlay && document.contains(overlay) && tabName === 'pets') {
                        updateActivePetsDisplay(overlay);
                    }
                });

                productionLog('✅ [FALLBACK] Active pets display updated manually');
                return activePetsFromRoom;
            }
        }

        productionWarn('❌ [FALLBACK] Could not find pet data in room state');
        return null;
    };


    // ==================== INITIALIZATION ====================
    function initializeAtoms() {
        productionLog('🔗 [SIMPLE-ATOMS] Starting simple atom initialization...');

        // Start simple pet detection using room state
        productionLog('🐾 [SIMPLE-ATOMS] Setting up room state pet detection...');
        updateActivePetsFromRoomState(); // Get initial pets immediately

        // Set up periodic pet detection (reduced frequency to minimize console spam)
        setManagedInterval('petDetection', () => {
            updateActivePetsFromRoomState();

            // ALSO check window.activePets directly (set by atom hook)
            if (window.activePets && Array.isArray(window.activePets) && window.activePets.length > 0) {
                productionLog('🐾 [PERIODIC-CHECK] Found pets in window.activePets:', window.activePets);

                // Update UnifiedState
                if (!UnifiedState.atoms.activePets || UnifiedState.atoms.activePets.length !== window.activePets.length) {
                    UnifiedState.atoms.activePets = window.activePets;

                    // Force UI update
                    if (UnifiedState.activeTab === 'pets') {
                        const context = document.getElementById('mga-tab-content');
                        if (context) {
                            updateTabContent('pets', context);
                        }
                    }
                }
            }
        }, 30000); // Check every 30 seconds

        // Hook #1: Pet SPECIES data (for active pets display)
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/_archive/myPetSlotsAtom.ts/myPetSlotsAtom",
            "activePets",
            (petSlots) => {
                if (UnifiedState.data.settings?.debugMode) {
                    productionLog('🐾 [ATOM-DEBUG] myPetSlotsAtom raw value:', {
                        value: petSlots,
                        type: typeof petSlots,
                        isArray: Array.isArray(petSlots),
                        length: petSlots?.length,
                        valueIsArray: Array.isArray(petSlots?.value),
                        valueLength: petSlots?.value?.length
                    });
                }

                // Extract the actual array from the wrapper object
                const actualPetSlots = Array.isArray(petSlots) ? petSlots : petSlots?.value;

                // Extract active pets with species info
                if (Array.isArray(actualPetSlots)) {
                    // DEBUG: Log raw slot data to understand structure
                    if (UnifiedState.data.settings?.debugMode) {
                        console.log('🐾 [ATOM-DEBUG] Raw pet slots:', actualPetSlots);
                        actualPetSlots.forEach((slot, i) => {
                            console.log(`🐾 [ATOM-DEBUG] Slot ${i}:`, slot);
                        });
                    }

                    const activePets = actualPetSlots
                        .filter(slot => {
                            // Check if slot has pet data (handle multiple possible property names)
                            const hasPet = slot && (slot.petSpecies || slot.species || slot.petId || slot.id);
                            return hasPet;
                        })
                        .map((slot, index) => {
                            const extracted = {
                                id: slot.id || slot.petId || `pet_${index}`,
                                petSpecies: slot.petSpecies || slot.species || 'Unknown',
                                mutations: slot.mutations || [],
                                abilities: slot.abilities || [],
                                hunger: slot.hunger ?? slot.petHunger ?? slot.health ?? 100,  // Include hunger for pet hunger notifications
                                strength: slot.strength || slot.str || 100,  // Include strength for Hunger Boost calculations
                                str: slot.str || slot.strength || 100,       // Fallback property name
                                slot: index + 1
                            };

                            if (UnifiedState.data.settings?.debugMode) {
                                console.log(`🐾 [ATOM-DEBUG] Extracted pet ${index}:`, extracted);
                            }

                            return extracted;
                        });

                    if (UnifiedState.data.settings?.debugMode) {
                        productionLog('🐾 [PETS] Extracted active pets:', activePets);
                    }

                    const previousCount = UnifiedState.atoms.activePets?.length || 0;
                    const previousPets = UnifiedState.atoms.activePets || [];

                    // Check if pets changed (count OR species/abilities)
                    const petsChanged = activePets.length !== previousCount ||
                                       JSON.stringify(activePets.map(p => ({s: p.petSpecies, a: p.abilities}))) !==
                                       JSON.stringify(previousPets.map(p => ({s: p.petSpecies, a: p.abilities})));

                    if (petsChanged) {
                        if (UnifiedState.data.settings?.debugMode) {
                            console.log(`🐾 [PETS] Pets changed - updating displays`);
                        }

                        // Update UI if pets tab is active
                        if (UnifiedState.activeTab === 'pets') {
                            const context = document.getElementById('mga-tab-content');
                            if (context && typeof updateActivePetsDisplay === 'function') {
                                updateActivePetsDisplay(context);
                            }
                        }

                        // Update all pet overlays
                        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                            if (overlay && document.contains(overlay) && tabName === 'pets') {
                                updateActivePetsDisplay(overlay);
                            }
                        });
                    }

                    // CRITICAL: Return the extracted array so hookAtom stores it correctly
                    if (UnifiedState.data.settings?.debugMode) {
                        productionLog('🔄 [RENDER-CYCLE] Atom callback returning pets to hookAtom system:', {
                            petsCount: activePets.length,
                            petsList: activePets.map(p => p.petSpecies),
                            willUpdateUnifiedState: true,
                            willUpdateWindowActivePets: true
                        });
                    }
                    return activePets;
                } else {
                    if (UnifiedState.data.settings?.debugMode) {
                        productionLog('🐾 [EXTRACTION-ERROR] actualPetSlots is not an array:', actualPetSlots);
                    }
                    return [];
                }
            }
        );

        // Hook #2: Pet ABILITY data (for ability logs - monitoring handled by timer only)
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myPetSlotInfosAtom",
            "petAbility",
            null // Removed duplicate monitorPetAbilities() call to prevent double logging
        );

        // Hook inventory
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myInventoryAtom",
            "inventory",
            () => updateValues()
        );

        // Hook crop data
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom",
            "currentCrop",
            () => updateValues()
        );

        // Hook friend bonus from game (same as Slot,Inv,Garden script)
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/miscAtoms.ts/friendBonusMultiplierAtom",
            "friendBonus",
            (value) => {
                UnifiedState.atoms.friendBonus = value || 1;
                updateValues();
            }
        );

        // Hook garden data
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myDataAtom",
            "myGarden",
            () => updateValues()
        );

        // Hook quinoa data for timers and globalShop
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/_archive/quinoaDataAtom.ts/quinoaDataAtom",
            "quinoaData",
            (value) => {
                // Store quinoa data for timers
                UnifiedState.atoms.quinoaData = value;
                // Also make globalShop available for notifications (same as MainScript)
                targetWindow.globalShop = value;
                // Update timers
                updateTimers();
            }
        );

        productionLog('✅ [SIMPLE-ATOMS] Simple atom initialization complete');

        // CRITICAL: Check if window.activePets already exists after hooks are set up
        setTimeout(() => {
            if (window.activePets && Array.isArray(window.activePets) && window.activePets.length > 0) {
                productionLog('🐾 [INIT-CHECK] Found existing pets in window.activePets after hook setup:', window.activePets);
                UnifiedState.atoms.activePets = window.activePets;

                // Force UI update if on pets tab
                if (UnifiedState.activeTab === 'pets') {
                    const context = document.getElementById('mga-tab-content');
                    if (context) {
                        updateTabContent('pets', context);
                    }
                }
            } else {
                productionLog('🐾 [INIT-CHECK] No pets found in window.activePets yet');
            }
        }, 2000); // Wait 2 seconds for atoms to populate
    }

    // ==================== TURTLE TIMER (CROP GROWTH BOOST II) ====================
    // Calculates expected crop growth time with Turtle's Plant Growth Boost II ability

    function getCropHash(crop) {
        try {
            return JSON.stringify(crop);
        } catch (e) {
            return "__ref_changed__" + Date.now();
        }
    }

    function getTurtleExpectations(activePets) {
        const turtles = (activePets || []).filter(p =>
            p &&
            p.petSpecies === "Turtle" &&
            p.hunger > 0 &&
            p.abilities?.some(a => a === "PlantGrowthBoostII")
        );

        let expectedMinutesRemoved = 0;

        turtles.forEach(p => {
            const base =
                Math.min(Math.floor((p.xp || 0) / (100 * 3600) * 30), 30) +
                Math.floor((((p.targetScale || 1) - 1) / (2.5 - 1)) * 20 + 80) - 30;
            expectedMinutesRemoved += (base / 100 * 5) * 60 * (1 - Math.pow(1 - 0.27 * base / 100, 1/60));
        });

        return {
            expectedMinutesRemoved
        };
    }

    function estimateUntilLatestCrop(currentCrop, activePets) {
        if (!currentCrop || currentCrop.length === 0) return null;
        if (!activePets || getTurtleExpectations(activePets).expectedMinutesRemoved == 0) return null;

        const now = Date.now();
        const maxEndTime = Math.max(...currentCrop.map(c => c.endTime || 0));

        const remainingRealMinutes = (maxEndTime - now) / (1000 * 60);

        const { expectedMinutesRemoved } = getTurtleExpectations(activePets);

        const effectiveRate = expectedMinutesRemoved + 1;

        const expectedRealMinutes = remainingRealMinutes / effectiveRate;

        const hours = Math.floor(expectedRealMinutes / 60);
        const minutes = Math.floor(expectedRealMinutes % 60);

        return `${hours}h ${minutes}m`;
    }

    function insertTurtleEstimate() {
        const timeElement = Array.from(targetDocument.querySelectorAll("p"))
            .find(el => /^\d+h(?: \d+m)?(?: \d+s)?$|^\d+m(?: \d+s)?$|^\d+s$/.test(el.textContent.trim()));

        if (timeElement) {
            const existing = timeElement.nextElementSibling;
            if (existing && existing.dataset.estimate) {
                existing.remove();
            }

            const estimate = estimateUntilLatestCrop(
                targetWindow.currentCrop,
                targetWindow.activePets
            );

            if (estimate) {
                const estimateEl = targetDocument.createElement("p");
                estimateEl.dataset.estimate = "true";
                estimateEl.style.color = "lime";
                estimateEl.style.fontSize = "14px";
                estimateEl.style.fontWeight = "bold";
                estimateEl.style.marginTop = "-8px";

                estimateEl.textContent = estimate;

                timeElement.insertAdjacentElement("afterend", estimateEl);
            }
        }
    }

    // Hook currentCrop atom for turtle timer
    function initializeTurtleTimer() {
        productionLog('🐢 [TURTLE-TIMER] Initializing crop growth estimate...');

        // Hook currentCrop atom
        hookAtom(
            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myCurrentGrowSlotsAtom",
            "currentCrop",
            (value) => {
                const currentHash = getCropHash(value);

                if (currentHash !== globalThis.prevCropHash) {
                    globalThis.prevCropHash = currentHash;

                    // Update estimate when crop changes
                    requestAnimationFrame(() => insertTurtleEstimate());
                }

                return value;
            }
        );

        // Set up MutationObserver for dynamic updates
        let _observerScheduled = false;

        const observer = new MutationObserver(() => {
            if (!targetWindow.currentCrop || targetWindow.currentCrop.length === 0) return;

            if (_observerScheduled) return;
            _observerScheduled = true;

            requestAnimationFrame(() => {
                insertTurtleEstimate();
                _observerScheduled = false;
            });
        });

        observer.observe(targetDocument.body, {
            childList: true,
            subtree: true
        });

        productionLog('✅ [TURTLE-TIMER] Turtle timer initialized successfully');
    }

    function loadSavedData() {
        // Enhanced storage diagnostics
        productionLog('📦 [STORAGE] Starting comprehensive data loading with diagnostics...');

        // ==================== DATA MIGRATION ====================
        // CRITICAL: Migrate existing localStorage data to GM storage before loading
        productionLog('🔄 [STORAGE] Checking for data migration needs...');
        try {
            // MGA_migrateFromLocalStorage();
        } catch (migrationError) {
            console.error('❌ [MIGRATION] Migration failed, but continuing with initialization:', migrationError);
        }

        // Verify UnifiedState.data exists and is properly initialized
        if (!UnifiedState.data) {
            console.error('❌ [CRITICAL] UnifiedState.data is not initialized!');
            UnifiedState.data = {};
        }
        productionLog('✅ [STORAGE] UnifiedState.data initialized:', typeof UnifiedState.data);

        // Storage availability check (lightweight version - removed blocking I/O test)
        productionLog('📊 [STORAGE-DIAGNOSTICS] Basic localStorage info:', {
            available: typeof localStorage !== 'undefined',
            totalItems: localStorage.length,
            mgaKeys: Object.keys(localStorage).filter(k => k.startsWith('MGA_'))
        });

        // Load pet presets with enhanced debugging
        productionLog('📦 [STORAGE] Loading pet presets...');
        const rawPresets = localStorage.getItem('MGA_petPresets');
        productionLog('📦 [STORAGE] Raw pet presets from localStorage:', rawPresets ? rawPresets.substring(0, 200) + '...' : 'null');

        UnifiedState.data.petPresets = MGA_loadJSON('MGA_petPresets', {});
        productionLog('📦 [STORAGE] Loading pet presets, found:', Object.keys(UnifiedState.data.petPresets).length);
        productionLog('🔍 [STORAGE-DEBUG] Pet presets type check:', typeof UnifiedState.data.petPresets, 'keys:', Object.keys(UnifiedState.data.petPresets || {}));

        // Load pet presets order (for reordering feature)
        UnifiedState.data.petPresetsOrder = MGA_loadJSON('MGA_petPresetsOrder', []);
        ensurePresetOrder(); // Initialize order if needed
        productionLog('📦 [STORAGE] Pet presets order initialized:', UnifiedState.data.petPresetsOrder.length, 'items');

        // Verify presets loaded correctly
        if (Object.keys(UnifiedState.data.petPresets).length > 0) {
            productionLog('✅ [STORAGE-VERIFY] Pet presets loaded successfully:', Object.keys(UnifiedState.data.petPresets));
        } else {
            productionWarn('⚠️ [STORAGE-VERIFY] No pet presets found in storage');
            productionLog('   localStorage check:', localStorage.getItem('MGA_petPresets') ? 'Data exists' : 'No data');

            // Enhanced debugging - try to parse the raw data manually
            const rawData = localStorage.getItem('MGA_petPresets');
            if (rawData) {
                productionLog('   Raw data length:', rawData.length);
                productionLog('   Raw data preview:', rawData.substring(0, 100));
                try {
                    const parsed = JSON.parse(rawData);
                    productionLog('   Manual parse successful:', typeof parsed, Object.keys(parsed || {}));
                    console.error('❌ [STORAGE-ERROR] Data exists and parses correctly, but MGA_loadJSON failed!');
                } catch (parseError) {
                    console.error('❌ [STORAGE-ERROR] JSON parse error:', parseError.message);
                    productionLog('   Corrupted data - will be cleared on next save');
                }
            }
        }

        UnifiedState.data.petAbilityLogs = MGA_loadJSON('MGA_petAbilityLogs', []);

        // BUGFIX: One-time migration - normalize old "Produce Scale Boost" ability names to "Crop Size Boost"
        // This fixes "lost logs" issue when game renamed the ability
        let migrationNeeded = false;
        UnifiedState.data.petAbilityLogs = UnifiedState.data.petAbilityLogs.map(log => {
            if (log.abilityType && /produce\s*scale\s*boost/i.test(log.abilityType)) {
                migrationNeeded = true;
                return {
                    ...log,
                    abilityType: log.abilityType.replace(/produce\s*scale\s*boost/gi, 'Crop Size Boost')
                };
            }
            return log;
        });

        // Also migrate archived logs
        const archivedLogs = MGA_loadJSON('MGA_petAbilityLogs_archive', []);
        let archivedMigrationNeeded = false;
        const migratedArchive = archivedLogs.map(log => {
            if (log.abilityType && /produce\s*scale\s*boost/i.test(log.abilityType)) {
                archivedMigrationNeeded = true;
                return {
                    ...log,
                    abilityType: log.abilityType.replace(/produce\s*scale\s*boost/gi, 'Crop Size Boost')
                };
            }
            return log;
        });

        if (migrationNeeded) {
            MGA_saveJSON('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
            productionLog('✅ [MIGRATION] Migrated old "Produce Scale Boost" logs to "Crop Size Boost"');
        }

        if (archivedMigrationNeeded) {
            MGA_saveJSON('MGA_petAbilityLogs_archive', migratedArchive);
            productionLog('✅ [MIGRATION] Migrated archived "Produce Scale Boost" logs to "Crop Size Boost"');
        }

        productionLog('📦 [STORAGE] Loading pet ability logs, found:', UnifiedState.data.petAbilityLogs.length, 'entries');

        // Check if mainscript.txt pet ability logging is active
        if (window.petAbilityLogs && Array.isArray(window.petAbilityLogs)) {
            productionLog('📝 [COMPAT] Detected mainscript.txt pet ability logging system with', window.petAbilityLogs.length, 'entries');
            productionLog('📝 [COMPAT] Both systems will run independently with separate storage');
        }
        // BUGFIX: Load from MGA_data instead of MGA_settings (saves use MGA_data)
        const loadedData = MGA_loadJSON('MGA_data', null);

        if (loadedData && loadedData.settings) {
            // If MGA_data exists, use it (this is where saves go)
            UnifiedState.data.settings = loadedData.settings;
            productionLog('📦 [STORAGE] Loaded settings from MGA_data');
        } else {
            // Fallback to MGA_settings for backward compatibility
            UnifiedState.data.settings = MGA_loadJSON('MGA_settings', {
                opacity: 95,
                popoutOpacity: 50,
                theme: 'default',
                gradientStyle: 'blue-purple',
                effectStyle: 'none',
                compactMode: false,
                ultraCompactMode: false,
                useInGameOverlays: true,
                debugMode: false,
                aggressiveIdlePrevention: true,
                notifications: {
                    enabled: true,
                    volume: 0.3,
                    notificationType: 'epic',
                    requiresAcknowledgment: false,
                    continuousEnabled: false,
                    watchedSeeds: ["Carrot", "Sunflower", "Moonbinder", "Dawnbinder", "Starweaver"],
                    watchedEggs: ["CommonEgg", "MythicalEgg"],
                    lastSeenTimestamps: {}
                },
                detailedTimestamps: false
            });
            productionLog('📦 [STORAGE] Loaded settings from MGA_settings (fallback)');
        }

        // Ensure notifications object exists and has all required fields
        if (!UnifiedState.data.settings.notifications) {
            UnifiedState.data.settings.notifications = {};
        }

        // Set defaults for any missing notification fields
        const notifDefaults = {
            enabled: true,
            volume: 0.3,
            notificationType: 'epic',
            requiresAcknowledgment: false,
            continuousEnabled: false,
            watchedSeeds: ["Carrot", "Sunflower", "Moonbinder", "Dawnbinder", "Starweaver"],
            watchedEggs: ["CommonEgg", "MythicalEgg"],
            petHungerEnabled: false,
            petHungerThreshold: 25,
            petHungerSound: 'double',
            abilityNotificationsEnabled: false,
            watchedAbilities: [],
            watchedAbilityCategories: {
                xpBoost: true,
                cropSizeBoost: true,
                selling: true,
                harvesting: true,
                growthSpeed: true,
                specialMutations: true,
                other: true
            },
            abilityNotificationSound: 'single',
            abilityNotificationVolume: 0.2,
            weatherNotificationsEnabled: false,
            watchedWeatherEvents: ['Snow', 'Rain', 'AmberMoon', 'Dawn'],
            shopFirebaseEnabled: false,
            lastSeenTimestamps: {}
        };

        // Merge defaults with existing settings
        Object.keys(notifDefaults).forEach(key => {
            if (UnifiedState.data.settings.notifications[key] === undefined) {
                UnifiedState.data.settings.notifications[key] = notifDefaults[key];
            }
        });

        // Ensure watchedAbilityCategories exists and has all categories
        if (!UnifiedState.data.settings.notifications.watchedAbilityCategories) {
            UnifiedState.data.settings.notifications.watchedAbilityCategories = notifDefaults.watchedAbilityCategories;
        }

        // Ensure detailedTimestamps setting exists
        if (UnifiedState.data.settings.detailedTimestamps === undefined) {
            UnifiedState.data.settings.detailedTimestamps = false;
        }

        // Save merged settings
        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog('🔔 [NOTIFICATIONS] Ensured all notification settings have defaults');

        // Load hotkeys data
        const savedHotkeys = MGA_loadJSON('MGA_hotkeys', null);
        if (savedHotkeys) {
            // Merge saved hotkeys with defaults to handle new keys
            UnifiedState.data.hotkeys = {
                ...UnifiedState.data.hotkeys,
                ...savedHotkeys,
                gameKeys: {
                    ...UnifiedState.data.hotkeys.gameKeys,
                    ...savedHotkeys.gameKeys
                }
            };
            productionLog('🎮 [HOTKEYS] Loaded saved hotkey configuration');
        } else {
            productionLog('🎮 [HOTKEYS] Using default hotkey configuration');
        }

        // Load PAL4 filter system data
        UnifiedState.data.filterMode = MGA_loadJSON('MGA_filterMode', 'categories');
        UnifiedState.data.abilityFilters = MGA_loadJSON('MGA_abilityFilters', {
            xpBoost: true,
            cropSizeBoost: true,
            selling: true,
            harvesting: true,
            growthSpeed: true,
            specialMutations: true,
            other: true
        });
        UnifiedState.data.customMode = MGA_loadJSON('MGA_customMode', { selectedAbilities: {} });
        UnifiedState.data.petFilters = MGA_loadJSON('MGA_petFilters', { selectedPets: {} });

        // Load seed deletion settings with fallback
        const rawSeedsData = localStorage.getItem('MGA_seedsToDelete');
        const rawAutoDeleteData = localStorage.getItem('MGA_autoDeleteEnabled');

        UnifiedState.data.seedsToDelete = MGA_loadJSON('MGA_seedsToDelete', []);
        UnifiedState.data.autoDeleteEnabled = MGA_loadJSON('MGA_autoDeleteEnabled', false);
        productionLog('🔍 [STORAGE-DEBUG] Seeds type check:', typeof UnifiedState.data.seedsToDelete, 'length:', UnifiedState.data.seedsToDelete?.length || 0);

        productionLog('📦 [STORAGE] Loading seed deletion settings:', {
            seedsToDelete: UnifiedState.data.seedsToDelete.length + ' seeds',
            autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled,
            seeds: UnifiedState.data.seedsToDelete,
            rawSeedsToDeleteFromStorage: rawSeedsData,
            rawAutoDeleteFromStorage: rawAutoDeleteData,
            parsedSeedsData: rawSeedsData ? JSON.parse(rawSeedsData) : null,
            parsedAutoDeleteData: rawAutoDeleteData ? JSON.parse(rawAutoDeleteData) : null
        });

        // Verify seeds loaded correctly
        if (UnifiedState.data.seedsToDelete.length > 0) {
            productionLog('✅ [STORAGE-VERIFY] Seed selections loaded successfully:', UnifiedState.data.seedsToDelete);
        } else {
            productionWarn('⚠️ [STORAGE-VERIFY] No seed selections found in storage');
            productionLog('   localStorage check:', localStorage.getItem('MGA_seedsToDelete') ? 'Data exists' : 'No data');

            // Enhanced debugging for seeds
            const rawSeedsData = localStorage.getItem('MGA_seedsToDelete');
            if (rawSeedsData) {
                productionLog('   Raw seeds data length:', rawSeedsData.length);
                productionLog('   Raw seeds data preview:', rawSeedsData.substring(0, 100));
                try {
                    const parsed = JSON.parse(rawSeedsData);
                    productionLog('   Manual seeds parse successful:', typeof parsed, Array.isArray(parsed) ? parsed.length : 'not array');
                    console.error('❌ [STORAGE-ERROR] Seeds data exists and parses correctly, but MGA_loadJSON failed!');
                } catch (parseError) {
                    console.error('❌ [STORAGE-ERROR] Seeds JSON parse error:', parseError.message);
                    productionLog('   Corrupted seeds data - will be cleared on next save');
                }
            }
        }

        // Force save to ensure persistence
        setTimeout(() => {
            if (UnifiedState.data.seedsToDelete.length > 0 || UnifiedState.data.autoDeleteEnabled) {
                MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
                MGA_saveJSON('MGA_autoDeleteEnabled', UnifiedState.data.autoDeleteEnabled);
                productionLog('🔄 [STORAGE] Force-saved seed settings for persistence');
            }
        }, 1000);

        // Load persisted ability timestamps to prevent duplicate logging after refresh
        UnifiedState.data.lastAbilityTimestamps = MGA_loadJSON('MGA_lastAbilityTimestamps', {});

        // Clean up old ability timestamps (keep only last 24 hours to prevent memory bloat)
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        Object.keys(UnifiedState.data.lastAbilityTimestamps).forEach(petId => {
            if (UnifiedState.data.lastAbilityTimestamps[petId] < dayAgo) {
                delete UnifiedState.data.lastAbilityTimestamps[petId];
            }
        });

        // ==================== STORAGE LOADING SUMMARY ====================
        productionLog('📊 [STORAGE-SUMMARY] Data loading complete:', {
            petPresets: {
                loaded: Object.keys(UnifiedState.data.petPresets).length,
                presets: Object.keys(UnifiedState.data.petPresets),
                rawExists: !!rawPresets
            },
            abilityLogs: {
                loaded: UnifiedState.data.petAbilityLogs.length,
                rawExists: !!localStorage.getItem('MGA_petAbilityLogs')
            },
            seedSettings: {
                seedsToDelete: UnifiedState.data.seedsToDelete.length,
                autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled,
                rawSeedsExists: !!rawSeedsData,
                rawAutoDeleteExists: !!rawAutoDeleteData
            },
            settings: {
                loaded: Object.keys(UnifiedState.data.settings).length,
                rawExists: !!localStorage.getItem('MGA_settings')
            },
            allMgaKeys: Object.keys(localStorage).filter(k => k.startsWith('MGA_')),
            timestamp: new Date().toISOString()
        });

        // Persistence verification test
        setTimeout(() => {
            // productionLog('🔍 [STORAGE-VERIFICATION] Testing immediate save/load cycle...');
            const testKey = 'MGA_persistenceTest';
            const testData = { test: true, timestamp: Date.now() };

            try {
                MGA_saveJSON(testKey, testData);
                const retrieved = MGA_loadJSON(testKey, null);
                const success = retrieved && retrieved.test === true;

                productionLog('📊 [STORAGE-VERIFICATION] Persistence test result:', {
                    success: success,
                    saved: testData,
                    retrieved: retrieved,
                    matching: JSON.stringify(testData) === JSON.stringify(retrieved)
                });

                // Clean up test data
                localStorage.removeItem(testKey);

                if (!success) {
                    console.error('❌ [STORAGE-VERIFICATION] Persistence test FAILED - data may not be saving correctly');
                } else {
                    productionLog('✅ [STORAGE-VERIFICATION] Persistence test PASSED - storage is working correctly');
                }
            } catch (error) {
                console.error('❌ [STORAGE-VERIFICATION] Persistence test ERROR:', error);
            }
        }, 100);
    }

    function startIntervals() {
        productionLog('🚨🚨🚨 [CRITICAL] startIntervals() CALLED 🚨🚨🚨');

        // Mark that intervals have been started
        window._mgaIntervalsStarted = true;

        // Initialize event-driven shop watcher
        productionLog('🔄 Initializing event-driven shop monitoring...');
        initializeShopWatcher();

        // Initialize the enhanced TimerManager (make it global for debugging)
        window.timerManager = initializeTimerManager();

        // OPTIMIZED: Monitor abilities every 3 seconds (reduced from 2s for better FPS)
        productionLog('🚨 [CRITICAL] Setting up ability monitoring timer...');
        window.abilityMonitoringInterval = setInterval(() => {
            monitorPetAbilities();
        }, 3000);
        productionLog('🚨 [CRITICAL] Ability monitoring started with simple setInterval (3s)');

        // OPTIMIZED: Update timers every 2 seconds (reduced from 1s)
        window.timerManager.startTimer('timers', () => updateTimers(), 2000);

        // OPTIMIZED: Update values every 3 seconds (reduced from 2s)
        window.timerManager.startTimer('values', () => updateValues(), 3000);

        // Optimized notification timer with performance monitoring
        productionLog('🚨 [CRITICAL] Setting up optimized notification timer...');

        let notificationCheckCounter = 0;
        let skipNextChecks = 0;

        // Make notificationInterval global so we can check if it's running
        // OPTIMIZED: Increased to 10 seconds to dramatically reduce FPS impact
        window.notificationInterval = setInterval(() => {
            // Skip checks if we're in a performance-critical situation
            if (skipNextChecks > 0) {
                skipNextChecks--;
                productionLog('⏭️ [PERFORMANCE] Skipping notification checks to improve FPS');
                return;
            }

            // Check if we're in a weather event and should throttle
            const currentWeather = window.roomState?.child?.data?.weather || window.roomState?.weather || null;
            const isWeatherActive = currentWeather && currentWeather !== 'none' && currentWeather !== 'clear';

            notificationCheckCounter++;

            // OPTIMIZED: During weather events, only check every 2nd interval (20s instead of 10s)
            if (isWeatherActive && notificationCheckCounter % 2 !== 0) {
                productionLog('🌤️ [PERFORMANCE] Throttling checks during weather event:', currentWeather);
                return;
            }

            // Measure performance impact
            const startTime = performance.now();

            try {
                // Run checks with try-catch to prevent errors from breaking the interval
                try {
                    checkForWatchedItems();
                } catch (e) {
                    console.error('❌ Error in checkForWatchedItems:', e);
                }

                try {
                    checkPetHunger();
                } catch (e) {
                    console.error('❌ Error in checkPetHunger:', e);
                }

                // Only check weather if enabled and not already in weather event
                if (!isWeatherActive) {
                    try {
                        detectWeatherEvents();
                    } catch (e) {
                        console.error('❌ Error in detectWeatherEvents:', e);
                    }
                }

                // Check if we're taking too long
                const elapsed = performance.now() - startTime;
                if (elapsed > 50) { // If checks take more than 50ms
                    productionWarn(`⚠️ [PERFORMANCE] Notification checks took ${elapsed.toFixed(2)}ms - throttling next checks`);
                    skipNextChecks = 2; // Skip next 2 checks (20 seconds total)
                }

            } catch (error) {
                console.error('❌ [CRITICAL] Error in notification interval:', error);
            }
        }, 10000); // OPTIMIZED: Check every 10 seconds (reduced from 5s for better FPS)

        // Store interval reference for cleanup
        MGA_addInterval(notificationInterval);

        productionLog('🚨 [CRITICAL] Optimized notification timer started with performance monitoring');

        // HUNGER TIMER: Update hunger countdown timers every second
        productionLog('🍖 [HUNGER-TIMER] Setting up hunger timer updates...');
        window.hungerTimerInterval = setInterval(() => {
            try {
                // Update all hunger timer elements
                const timerElements = document.querySelectorAll('.mga-hunger-timer');
                const activePets = window.activePets || UnifiedState.atoms.activePets || [];

                if (UnifiedState.data.settings?.debugMode) {
                    console.log('🍖 [TIMER-UPDATE] Timer elements found:', timerElements.length);
                    console.log('🍖 [TIMER-UPDATE] Active pets:', activePets.length);
                    if (activePets.length > 0) {
                        activePets.forEach((p, i) => {
                            console.log(`🍖 [TIMER-UPDATE] Pet ${i}:`, {
                                species: p.petSpecies,
                                hunger: p.hunger,
                                abilities: p.abilities,
                                strength: p.strength,
                                str: p.str
                            });
                        });
                    }
                }

                if (timerElements.length > 0) {
                    timerElements.forEach(element => {
                        const petIndex = parseInt(element.dataset.petIndex);
                        if (petIndex >= 0 && petIndex < activePets.length) {
                            const pet = activePets[petIndex];
                            const timeUntilHungry = calculateTimeUntilHungry(pet);
                            const timerText = formatHungerTimer(timeUntilHungry);
                            const timerColor = timeUntilHungry === null ? '#999' :
                                               timeUntilHungry <= 0 ? '#8B0000' :
                                               timeUntilHungry < 5 * 60 * 1000 ? '#ff4444' :
                                               timeUntilHungry < 15 * 60 * 1000 ? '#ffa500' : '#4caf50';
                            element.textContent = timerText;
                            element.style.color = timerColor;
                        }
                    });
                }
            } catch (error) {
                console.error('❌ Error updating hunger timers:', error);
            }
        }, 1000); // Update every second

        MGA_addInterval(window.hungerTimerInterval);
        productionLog('🍖 [HUNGER-TIMER] Hunger timer updates started (1s interval)');

        debugLog('INTERVALS', 'All intervals started with TimerManager', {
            timerCount: timerManager.activeTimers.size,
            status: timerManager.getStatus()
        });

        // BUGFIX: Visibility-aware performance optimization (from v1.11.3)
        // Slower refresh when tab is hidden to save CPU/battery
        document.addEventListener('visibilitychange', function() {
            const hidden = document.hidden;
            productionLog(`👁️ [VISIBILITY] Tab ${hidden ? 'hidden' : 'visible'} - adjusting intervals`);

            // Adjust ability monitoring interval
            if (window.abilityMonitoringInterval) {
                clearInterval(window.abilityMonitoringInterval);
            }
            window.abilityMonitoringInterval = setInterval(() => {
                monitorPetAbilities();
            }, hidden ? 5000 : 3000); // 5s when hidden, 3s when visible

            // Adjust notification interval
            if (window.notificationInterval) {
                clearInterval(window.notificationInterval);
            }
            window.notificationInterval = setInterval(() => {
                // ... notification logic (same as above)
                if (skipNextChecks > 0) {
                    skipNextChecks--;
                    return;
                }
                const currentWeather = window.roomState?.child?.data?.weather || window.roomState?.weather || null;
                const isWeatherActive = currentWeather && currentWeather !== 'none' && currentWeather !== 'clear';
                notificationCheckCounter++;
                if (isWeatherActive && notificationCheckCounter % 2 !== 0) return;

                const startTime = performance.now();
                try {
                    try {
                        checkPetHunger();
                    } catch (hungerError) {
                        console.error('Error in checkPetHunger:', hungerError);
                    }
                } catch (error) {
                    console.error('Critical error in notification checks:', error);
                }

                const checkDuration = performance.now() - startTime;
                if (checkDuration > 50) {
                    productionLog(`⏱️ [PERFORMANCE] Notification checks took ${checkDuration.toFixed(2)}ms`);
                    skipNextChecks = 2;
                }
            }, hidden ? 20000 : 10000); // 20s when hidden, 10s when visible

            productionLog(`👁️ [VISIBILITY] Intervals adjusted for ${hidden ? 'background' : 'foreground'} mode`);
        }, { passive: true });
    }

    // ==================== NAVIGATION HELPERS ====================
    function handleTabNavigation(e, forward) {
        const focusableElements = getFocusableElements();
        const currentIndex = focusableElements.indexOf(e.target);

        if (currentIndex === -1) return;

        const nextIndex = forward
            ? (currentIndex + 1) % focusableElements.length
            : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

        focusableElements[nextIndex]?.focus();
    }

    function handleArrowNavigation(e, direction) {
        const focusable = getFocusableElements();
        const current = e.target;

        if (current.classList.contains('mga-btn') || current.classList.contains('mga-tab')) {
            const siblings = getSiblingsInDirection(current, direction);
            if (siblings.length > 0) {
                siblings[0].focus();
            }
        }
    }

    function getFocusableElements() {
        return Array.from(targetDocument.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null); // Only visible elements
    }

    function getSiblingsInDirection(element, direction) {
        const parent = element.parentElement;
        const siblings = Array.from(parent.children).filter(el =>
            el !== element && getFocusableElements().includes(el)
        );

        // Simple directional logic - could be enhanced with position calculations
        return siblings;
    }

    function openCommandPalette(e) {
        createCommandPalette();
    }

    function openQuickSearch(e) {
        createQuickSearchOverlay();
    }

    function handleEnterKey(e) {
        const target = e.target;
        if (target.classList.contains('mga-btn')) {
            target.click();
        }
    }

    function handleSpaceKey(e) {
        const target = e.target;
        if (target.classList.contains('mga-btn')) {
            target.click();
        }
    }

    function handleEscapeKey() {
        // Close any open modals/overlays in order of priority
        const commandPalette = targetDocument.querySelector('#mga-command-palette');
        if (commandPalette) {
            commandPalette.remove();
            return;
        }

        const searchOverlay = targetDocument.querySelector('#mga-search-overlay');
        if (searchOverlay) {
            searchOverlay.remove();
            return;
        }

        // Close focused popout
        targetDocument.querySelectorAll('.mga-overlay').forEach(overlay => {
            if (overlay.style.display !== 'none') {
                overlay.style.display = 'none';
            }
        });
    }

    function closeAllPopouts() {
        targetDocument.querySelectorAll('.mga-overlay').forEach(overlay => {
            overlay.style.display = 'none';
        });

        // Close separate windows
        UnifiedState.popoutWindows.forEach(window => {
            try { window.close(); } catch(e) {}
        });
        UnifiedState.popoutWindows.clear();
    }

    function refreshAllContent() {
        updateTabContent();
        refreshSeparateWindowPopouts();
        productionLog('🔄 All content refreshed');
    }

    function loadPresetByNumber(number) {
        const presets = Object.keys(UnifiedState.data.petPresets);
        if (presets[number - 1]) {
            const presetName = presets[number - 1];
            const preset = UnifiedState.data.petPresets[presetName];
            loadPetPreset(preset);
            productionLog(`🐾 Loaded preset ${number}: ${presetName}`);
        }
    }

    function createCommandPalette() {
        // Remove existing palette
        const existing = targetDocument.querySelector('#mga-command-palette');
        if (existing) existing.remove();

        const overlay = targetDocument.createElement('div');
        overlay.id = 'mga-command-palette';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 20000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 100px;
        `;

        const palette = targetDocument.createElement('div');
        palette.style.cssText = `
            background: #1f2937;
            border: 1px solid #4b5563;
            border-radius: 8px;
            width: 500px;
            max-height: 400px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        `;

        const input = targetDocument.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type a command...';
        input.style.cssText = `
            width: 100%;
            padding: 16px;
            background: transparent;
            border: none;
            color: white;
            font-size: 16px;
            outline: none;
        `;

        const commands = [
            { name: 'Open Pets', action: () => openTabInPopout('pets'), key: 'Alt+P' },
            { name: 'Open Values', action: () => openTabInPopout('values'), key: 'Alt+V' },
            { name: 'Open Abilities', action: () => openTabInPopout('abilities'), key: 'Alt+A' },
            { name: 'Open Seeds', action: () => openTabInPopout('seeds'), key: 'Alt+S' },
            { name: 'Open Settings', action: () => openTabInPopout('settings'), key: 'Alt+G' },
            { name: 'Close All Windows', action: () => closeAllPopouts(), key: 'Alt+W' },
            { name: 'Refresh All Content', action: () => refreshAllContent(), key: 'Alt+R' }
        ];

        const commandsList = targetDocument.createElement('div');
        commandsList.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
        `;

        const renderCommands = (filter = '') => {
            commandsList.innerHTML = '';
            const filtered = commands.filter(cmd =>
                cmd.name.toLowerCase().includes(filter.toLowerCase())
            );

            filtered.forEach((cmd, index) => {
                const item = targetDocument.createElement('div');
                item.style.cssText = `
                    padding: 12px 16px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    ${index === 0 ? 'background: #374151;' : ''}
                `;
                item.innerHTML = `
                    <span>${cmd.name}</span>
                    <span style="color: #9ca3af; font-size: 12px;">${cmd.key}</span>
                `;

                item.addEventListener('click', () => {
                    cmd.action();
                    overlay.remove();
                });

                commandsList.appendChild(item);
            });
        };

        input.addEventListener('input', (e) => {
            renderCommands(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
            } else if (e.key === 'Enter') {
                const firstCommand = commandsList.firstElementChild;
                if (firstCommand) firstCommand.click();
            }
        });

        renderCommands();
        palette.appendChild(input);
        palette.appendChild(commandsList);
        overlay.appendChild(palette);
        targetDocument.body.appendChild(overlay);

        input.focus();
    }

    function createQuickSearchOverlay() {
        // Remove existing search
        const existing = targetDocument.querySelector('#mga-search-overlay');
        if (existing) existing.remove();

        const overlay = targetDocument.createElement('div');
        overlay.id = 'mga-search-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1f2937;
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 16px;
            z-index: 15000;
            width: 300px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        `;

        const input = targetDocument.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search content...';
        input.style.cssText = `
            width: 100%;
            padding: 8px;
            background: #374151;
            border: 1px solid #4b5563;
            border-radius: 4px;
            color: white;
            outline: none;
        `;

        const results = targetDocument.createElement('div');
        results.style.cssText = `
            margin-top: 8px;
            max-height: 200px;
            overflow-y: auto;
        `;

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                results.innerHTML = '';
                return;
            }

            // Search through all content
            const searchResults = searchAllContent(query);
            results.innerHTML = searchResults.map(result => `
                <div style="padding: 8px; cursor: pointer; border-radius: 4px; margin: 4px 0;"
                     onmouseover="this.style.background='#374151'"
                     onmouseout="this.style.background='transparent'"
                     onclick="window.${result.action}">
                    <div style="color: #60a5fa; font-size: 12px;">${result.tab}</div>
                    <div style="color: white; font-size: 14px;">${result.title}</div>
                    <div style="color: #9ca3af; font-size: 11px;">${result.preview}</div>
                </div>
            `).join('');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
            }
        });

        overlay.appendChild(input);
        overlay.appendChild(results);
        targetDocument.body.appendChild(overlay);

        input.focus();
    }


    // ==================== CROP HIGHLIGHTING SYSTEM ====================
    // Ctrl+H clears highlights, UI in settings for crop highlighting
    function setupCropHighlightingSystem() {
        productionLog('🌱 [DEBUG] setupCropHighlightingSystem() called - setting up crop highlighting...');
        // FIRST: Verify crop highlighting utilities are installed
        if (typeof window.removeAllTileOverrides !== 'function') {
            debugLog('CROP_HIGHLIGHT', 'Crop highlighting utilities not available - they should have been installed earlier');
        } else {
            debugLog('CROP_HIGHLIGHT', 'Crop highlighting utilities confirmed available');
        }

        if (window.__cropHighlightInstalled) {
            debugLog('CROP_HIGHLIGHT', 'Crop highlighting system already installed');
            return;
        }

        function cropHighlightHandler(e) {
            // Ctrl+H clears all highlights
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                e.stopPropagation();

                try {
                    if (typeof window.removeAllTileOverrides === 'function') {
                        window.removeAllTileOverrides();
                        debugLog('CROP_HIGHLIGHT', 'Ctrl+H → cleared all tile highlights');
                    } else {
                        debugLog('CROP_HIGHLIGHT', 'removeAllTileOverrides function not available');
                    }
                } catch (err) {
                    debugError('CROP_HIGHLIGHT', 'Failed to clear highlights', err);
                }
            }
        }

        window.addEventListener("keydown", cropHighlightHandler, true);
        window.__cropHighlightInstalled = true;
        debugLog('CROP_HIGHLIGHT', 'Ctrl+H crop highlight hotkey installed');
    }

    // Crop highlighting function moved to settings section (line 5505) to avoid duplication

    function searchAllContent(query) {
        const results = [];
        const tabs = ['pets', 'abilities', 'seeds', 'values', 'timers', 'settings'];

        tabs.forEach(tab => {
            // Mock search results - in real implementation would search actual content
            if (tab.includes(query)) {
                results.push({
                    tab: tab.charAt(0).toUpperCase() + tab.slice(1),
                    title: `${tab.charAt(0).toUpperCase() + tab.slice(1)} Tab`,
                    preview: `Open the ${tab} management interface`,
                    action: `openTabInPopout('${tab}')`
                });
            }
        });

        return results;
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    function initializeKeyboardShortcuts() {
        const shortcuts = {
            // Panel Management
            'Alt+M': () => {
                const panel = UnifiedState.panels.main;
                if (panel) {
                    const isVisible = panel.style.display !== 'none';
                    panel.style.display = isVisible ? 'none' : 'block';

                    // Hide any stuck tooltips when panel is toggled via keyboard
                    if (window.MGA_Tooltips && window.MGA_Tooltips.hide) {
                        window.MGA_Tooltips.hide();
                    }

                    UnifiedState.data.settings.panelVisible = !isVisible;
                    productionLog(`🎮 MGA Keyboard shortcut: Panel ${isVisible ? 'hidden' : 'shown'}`);
                }
            },

            // Quick Tab Access
            'Alt+V': () => openTabInPopout('values'),
            'Alt+P': () => openTabInPopout('pets'),
            'Alt+A': () => openTabInPopout('abilities'),
            'Alt+T': () => openTabInPopout('timers'),
            'Alt+S': () => openTabInPopout('seeds'),
            'Alt+G': () => openTabInPopout('settings'),

            // Navigation
            'Tab': (e) => handleTabNavigation(e, true),
            'Shift+Tab': (e) => handleTabNavigation(e, false),
            'ArrowUp': (e) => handleArrowNavigation(e, 'up'),
            'ArrowDown': (e) => handleArrowNavigation(e, 'down'),
            'ArrowLeft': (e) => handleArrowNavigation(e, 'left'),
            'ArrowRight': (e) => handleArrowNavigation(e, 'right'),

            // Quick Actions
            'Ctrl+K': (e) => openCommandPalette(e),
            'Ctrl+F': (e) => openQuickSearch(e),
            'Ctrl+B': () => toggleShopWindows(),
            'Enter': (e) => handleEnterKey(e),
            'Space': (e) => handleSpaceKey(e),

            // Window Management
            'Escape': () => handleEscapeKey(),
            'Alt+W': () => closeAllPopouts(),
            'Alt+R': () => refreshAllContent(),

            // Quick Pet Actions
            'Shift+1': () => loadPresetByNumber(1),
            'Shift+2': () => loadPresetByNumber(2),
            'Shift+3': () => loadPresetByNumber(3),
            'Shift+4': () => loadPresetByNumber(4),
            'Shift+5': () => loadPresetByNumber(5),

            // Crop Highlighting
            'Ctrl+H': () => clearCropHighlighting(),
            'Ctrl+Shift+H': () => {
                // Open settings tab and focus on crop highlighting section
                UnifiedState.activeTab = 'settings';
                updateTabContent();
                setTimeout(() => {
                    const highlightSection = targetDocument.querySelector('#highlight-species-select');
                    if (highlightSection) {
                        highlightSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        highlightSection.focus();
                    }
                }, 100);
                productionLog('🌱 Opened crop highlighting settings');
            }
        };

        document.addEventListener('keydown', (e) => {
            // Skip if typing in input/textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                return;
            }

            const key = [];
            if (e.altKey) key.push('Alt');
            if (e.ctrlKey) key.push('Ctrl');
            if (e.shiftKey) key.push('Shift');

            // Special key handling
            if (e.key === 'Escape') key.push('Escape');
            else if (e.key === 'Tab') key.push('Tab');
            else if (e.key === 'Enter') key.push('Enter');
            else if (e.key === ' ') key.push('Space');
            else if (e.key.startsWith('Arrow')) key.push(e.key);
            else if (e.key.length === 1) key.push(e.key.toUpperCase());

            const shortcut = key.join('+');
            if (shortcuts[shortcut]) {
                e.preventDefault();
                shortcuts[shortcut](e);
            }
        });

        productionLog('⌨️ Keyboard shortcuts initialized:', Object.keys(shortcuts));
    }

    // ==================== LOCAL TELEPORT UTILITIES ====================
    // Install window.localTeleport function for client-side position updates
    function installLocalTeleport() {
        if (window.localTeleport && window.localTeleport.__installed) {
            debugLog('TELEPORT', 'localTeleport already installed');
            return;
        }

        window.localTeleport = async function localTeleport(x, y, opts = {}) {
            const timeout = typeof opts.timeout === "number" ? opts.timeout : 3000;

            // 1) Prefer built-in PlayerService if available (clean)
            try {
                const PS = targetWindow.PlayerService || (targetWindow.Quinoa && targetWindow.Quinoa.PlayerService) || null;
                if (PS && typeof PS.setPosition === "function") {
                    await PS.setPosition(x, y);
                    targetWindow.MagicCircle_RoomConnection.sendMessage({
                        "scopePath": [
                            "Room",
                            "Quinoa"
                        ],
                        "type": "PlayerPosition",
                        "position": {
                            "x": x,
                            "y": y
                        }
                    })
                    try { globalThis.__lastLocalTeleport = { x, y, at: Date.now() }; } catch (e) {}
                    return { ok: true, x, y, method: "PlayerService.setPosition" };
                }
            } catch (e) {
                // ignore and continue to fallback
            }

            // 2) Fallback: use jotai atom cache capture technique (captures store.set)
            try {
                const cache = targetWindow.jotaiAtomCache?.cache;
                if (!cache) return { ok: false, error: "jotaiAtomCache.cache not found" };

                // find positionAtom
                let positionAtom = null;
                for (const a of cache.values()) {
                    const lbl = a?.debugLabel || a?.label || "";
                    if (String(lbl) === "positionAtom") { positionAtom = a; break; }
                }
                if (!positionAtom) return { ok: false, error: 'positionAtom not found in atom cache' };

                // capture set by temporarily wrapping write functions
                let capturedSet = null;
                const patched = [];
                try {
                    for (const atom of cache.values()) {
                        if (!atom || typeof atom.write !== "function") continue;
                        const orig = atom.write;
                        // avoid double-wrap
                        if (atom.__lt_origWrite) { patched.push(atom); continue; }

                        atom.__lt_origWrite = orig;
                        atom.write = function(get, set, ...args) {
                            if (!capturedSet) {
                                capturedSet = set;
                                // restore patched writes immediately after capture (so we don't keep wrappers)
                                for (const p of patched) {
                                    if (p.__lt_origWrite) {
                                        try { p.write = p.__lt_origWrite; } catch (e) {}
                                        try { delete p.__lt_origWrite; } catch (e) {}
                                    }
                                }
                            }
                            return orig.call(this, get, set, ...args);
                        };
                        patched.push(atom);
                    }

                    // trigger the app to call writes (same trick used before)
                    try { globalThis.dispatchEvent?.(new Event("visibilitychange")); } catch (e) {}

                    // wait for capture (short loop)
                    const until = Date.now() + timeout;
                    while (!capturedSet && Date.now() < until) {
                        await new Promise(r => setTimeout(r, 40));
                    }
                } finally {
                    // restore any remaining patched atoms
                    for (const p of patched) {
                        if (p.__lt_origWrite) {
                            try { p.write = p.__lt_origWrite; } catch (e) {}
                            try { delete p.__lt_origWrite; } catch (e) {}
                        }
                    }
                }

                if (!capturedSet) return { ok: false, error: "Could not capture store.set from atom writes (timeout)" };

                // perform the local-only set (this does NOT send teleport packet)
                try {
                    capturedSet(positionAtom, { x, y });
                    try { globalThis.__lastLocalTeleport = { x, y, at: Date.now() }; } catch (e) {}
                    return { ok: true, x, y, method: "jotai-capture" };
                } catch (err) {
                    return { ok: false, error: "capturedSet failed: " + String(err) };
                }
            } catch (err) {
                return { ok: false, error: "unexpected error: " + String(err) };
            }
        };

        window.localTeleport.__installed = true;
        debugLog('TELEPORT', 'localTeleport(x,y) installed on window');
    }

    // ==================== TELEPORT SYSTEM ====================
    function initializeTeleportSystem() {
        productionLog('🚀 [DEBUG] initializeTeleportSystem() called - setting up teleport system...');
        // FIRST: Install window.localTeleport if not already installed
        if (typeof window.localTeleport !== 'function' || !window.localTeleport.__installed) {
            installLocalTeleport();
        }

        if (window.__altSlotTeleportInstalled) {
            debugLog('TELEPORT', 'Alt-slot teleport hotkeys already installed');
            return;
        }

        async function teleportHandler(e) {
            if (!e.altKey) return;
            const num = parseInt(e.key, 10);
            if (!(num >= 1 && num <= 6)) return;

            e.preventDefault();
            e.stopPropagation();

            try {
                const slots = targetWindow.MagicCircle_RoomConnection
                    ?.lastRoomStateJsonable?.child?.data?.userSlots;
                if (!Array.isArray(slots)) {
                    productionWarn("⚠️ userSlots not found in room state");
                    return;
                }

                const slot = slots[num - 1];
                const pos = slot?.position;
                if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
                    productionWarn(`⚠️ userSlots[${num - 1}] has no valid position`);
                    return;
                }

                productionLog(`🎯 TELEPORTING Alt+${num} to userSlots[${num - 1}] @ (${pos.x}, ${pos.y})`);

                let clientUpdateSuccess = false;
                let serverSyncSuccess = false;

                // Method 1: CLIENT-SIDE POSITION UPDATE (using jotai atom access)
                try {
                    productionLog(`🔧 CLIENT: Updating local position via jotai atoms...`);

                    // Method 1A: Try jotaiAtomCache for player position
                    if (targetWindow.jotaiAtomCache) {
                        productionLog(`🔍 CLIENT: Searching jotaiAtomCache for player position atom...`);

                        // Common player position atom paths to try
                        const playerPositionPaths = [
                            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/myPositionAtom",
                            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/myAtoms.ts/playerPositionAtom",
                            "/home/runner/work/magiccircle.gg/magiccircle.gg/client/src/games/Quinoa/atoms/playerAtoms.ts/myPositionAtom"
                        ];

                        let playerPositionAtom = null;
                        for (const atomPath of playerPositionPaths) {
                            const atom = targetWindow.jotaiAtomCache.get(atomPath);
                            if (atom) {
                                productionLog(`✅ CLIENT: Found player position atom at: ${atomPath}`);
                                playerPositionAtom = atom;
                                break;
                            }
                        }

                        // If we found the atom, try to use it
                        if (playerPositionAtom && playerPositionAtom.write) {
                            try {
                                // Try to get the jotai store from window
                                const store = targetWindow.jotaiStore || targetWindow.store;
                                if (store && store.set) {
                                    await store.set(playerPositionAtom, { x: pos.x, y: pos.y });
                                    clientUpdateSuccess = true;
                                    productionLog(`✅ CLIENT: jotai atom position update successful to (${pos.x}, ${pos.y})`);
                                } else {
                                    productionLog(`⚠️ CLIENT: Found atom but no jotai store available`);
                                }
                            } catch (atomError) {
                                productionLog(`❌ CLIENT: jotai atom update failed:`, atomError);
                            }
                        } else {
                            productionLog(`❌ CLIENT: No player position atom found in jotaiAtomCache`);

                            // Debug: List available atoms
                            if (UnifiedState.data.settings.debugMode) {
                                productionLog(`🔍 CLIENT: Available atoms in cache:`, Array.from(targetWindow.jotaiAtomCache.keys()).filter(key => key.includes('position') || key.includes('Position') || key.includes('player') || key.includes('Player')));
                            }
                        }
                    }

                    // Method 1B: Try direct Atoms access (from reference script)
                    if (!clientUpdateSuccess && window.Atoms?.player?.position?.set) {
                        await window.Atoms.player.position.set({ x: pos.x, y: pos.y });
                        clientUpdateSuccess = true;
                        productionLog(`✅ CLIENT: Atoms.player.position.set successful to (${pos.x}, ${pos.y})`);
                    }

                    // Method 1C: Fallback to existing localTeleport
                    if (!clientUpdateSuccess && typeof window.localTeleport === 'function') {
                        const res = await window.localTeleport(pos.x, pos.y);
                        if (res?.ok) {
                            clientUpdateSuccess = true;
                            productionLog(`✅ CLIENT: window.localTeleport successful to (${pos.x}, ${pos.y})`);
                        }
                    }

                    // Method 1D: Fallback to PlayerService
                    if (!clientUpdateSuccess) {
                        const PS = targetWindow.PlayerService || (targetWindow.Quinoa?.PlayerService);
                        if (PS?.setPosition) {
                            await PS.setPosition(pos.x, pos.y);
                            clientUpdateSuccess = true;
                            productionLog(`✅ CLIENT: PlayerService.setPosition successful to (${pos.x}, ${pos.y})`);
                        }
                    }

                    if (!clientUpdateSuccess) {
                        productionLog(`❌ CLIENT: All client-side position update methods failed`);
                        productionLog(`🔍 CLIENT: Available globals:`, {
                            jotaiAtomCache: !!targetWindow.jotaiAtomCache,
                            windowAtoms: !!window.Atoms,
                            localTeleport: typeof window.localTeleport,
                            PlayerService: !!(targetWindow.PlayerService || targetWindow.Quinoa?.PlayerService)
                        });
                    }

                } catch (error) {
                    productionLog(`❌ CLIENT: Client-side position update failed:`, error);
                }

                // Method 2: SERVER SYNC (using reference script pattern)
                try {
                    productionLog(`🌐 SERVER: Syncing position for multiplayer...`);

                    // Use the proven working pattern: sendToGame with "Teleport" type
                    const teleportSuccess = sendToGame({
                        type: "Teleport",
                        position: { x: pos.x, y: pos.y }
                    });

                    if (teleportSuccess) {
                        serverSyncSuccess = true;
                        productionLog(`✅ SERVER: Teleport message sent successfully`);
                    } else {
                        // Fallback to PlayerPosition message
                        productionLog(`🔄 SERVER: Trying PlayerPosition fallback...`);
                        const fallbackSuccess = sendToGame({
                            type: "PlayerPosition",
                            position: { x: pos.x, y: pos.y }
                        });

                        if (fallbackSuccess) {
                            serverSyncSuccess = true;
                            productionLog(`✅ SERVER: PlayerPosition fallback successful`);
                        }
                    }

                    if (!serverSyncSuccess) {
                        productionLog(`❌ SERVER: All server sync methods failed`);
                    }

                } catch (error) {
                    productionLog(`❌ SERVER: Server sync failed:`, error);
                }

                // FINAL STATUS REPORT
                productionLog(`🎯 TELEPORT RESULT for Alt+${num}:`);
                productionLog(`   👤 Client Update: ${clientUpdateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
                productionLog(`   🌐 Server Sync: ${serverSyncSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

                if (clientUpdateSuccess && serverSyncSuccess) {
                    productionLog(`🎉 COMPLETE SUCCESS: Player teleported to (${pos.x}, ${pos.y})!`);
                    debugLog('TELEPORT', `Complete teleport success for Alt+${num} to userSlots[${num - 1}] @ (${pos.x}, ${pos.y})`);
                } else if (clientUpdateSuccess) {
                    productionWarn(`⚠️ PARTIAL: You moved but others may not see it (server sync failed)`);
                } else if (serverSyncSuccess) {
                    productionWarn(`⚠️ PARTIAL: Server updated but you didn't move visually (client update failed)`);
                } else {
                    console.error(`❌ TOTAL FAILURE: Neither client nor server teleport worked`);
                }

            } catch (err) {
                console.error("❌ Alt-slot teleport error:", err);
                debugError('TELEPORT', 'Alt-slot teleport error', err);
            }
        }

        window.addEventListener("keydown", teleportHandler, true);
        window.__altSlotTeleportInstalled = true;
        productionLog('🚀 Alt+1..Alt+6 teleport hotkeys installed');
        debugLog('TELEPORT', 'Teleport system initialized successfully');
    }

    // ==================== STANDALONE INITIALIZATION ====================
    function initializeStandalone() {
        if (UnifiedState.initialized) {
            productionLog('⚠️ Magic Garden Unified Assistant already initialized, skipping...');
            return;
        }

        productionLog('🎮 Magic Garden Assistant - Demo Mode');
        productionLog('💡 Running in standalone mode with demo data');
        productionLog('📝 Note: This is a demonstration - no real game integration');

        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            productionLog('⏳ DOM not ready, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', initializeStandalone);
            return;
        }

        try {
            // Initialize demo data
            const demoData = createDemoData();

            // Populate UnifiedState with demo data
            UnifiedState.atoms.inventory = demoData.inventory;
            UnifiedState.atoms.myGarden = {
                garden: {
                    tileObjects: generateDemoTiles(demoData.garden.readyTiles)
                }
            };
            UnifiedState.atoms.friendBonus = 1.2; // Demo bonus
            UnifiedState.data.petAbilityLogs = demoData.abilityLogs;
            UnifiedState.data.timers = demoData.timers;

            // Load saved data (or use defaults)
            productionLog('💾 Loading saved settings...');
            loadSavedData();

            // Create UI with demo banner
            productionLog('🎨 Creating Demo UI...');
            createUnifiedUI();
            addDemoBanner();

            // Setup demo timers
            productionLog('⏰ Setting up demo timers...');
            setupDemoTimers();

            // Mark as initialized
            UnifiedState.initialized = true;
            productionLog('✅ Magic Garden Assistant Demo initialized successfully!');
            productionLog('🎯 Try the features - they work with realistic demo data');

        } catch (error) {
            console.error('❌ Failed to initialize demo mode:', error);
            debugError('STANDALONE_INIT', 'Demo initialization failed', error);
            UnifiedState.initialized = false;
        }
    }

    function generateDemoTiles(count) {
        const tiles = {};
        const species = ['Carrot', 'Apple', 'Banana', 'Lily', 'Dragon Fruit'];

        for (let i = 0; i < count; i++) {
            tiles[i] = {
                objectType: 'plant',
                slots: [{
                    species: species[i % species.length],
                    endTime: Date.now() - 1000, // Ready for harvest
                    targetScale: 1 + Math.random() * 0.5, // Random scale
                    mutations: i % 3 === 0 ? ['Gold'] : [] // Some have mutations
                }]
            };
        }

        return tiles;
    }

    function addDemoBanner() {
        // Add a demo mode banner to the main panel
        const panel = UnifiedState.panels.main;
        if (!panel) return;

        const banner = targetDocument.createElement('div');
        banner.style.cssText = `
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            color: white;
            text-align: center;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 600;
            position: relative;
            margin: -1px -1px 8px -1px;
            border-radius: 6px 6px 0 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        banner.innerHTML = '🎮 DEMO MODE - Showcasing full functionality with sample data';

        // Insert banner at the top of the panel
        const header = panel.querySelector('.mga-header');
        if (header) {
            panel.insertBefore(banner, header.nextSibling);
        }
    }

    function setupDemoTimers() {
        // Start demo timer countdown
        const timerManager = globalTimerManager || initializeTimerManager();

        timerManager.startTimer('demo-timer', 1000, () => {
            // Update demo timers
            if (UnifiedState.data.timers.seed > 0) UnifiedState.data.timers.seed--;
            if (UnifiedState.data.timers.egg > 0) UnifiedState.data.timers.egg--;
            if (UnifiedState.data.timers.tool > 0) UnifiedState.data.timers.tool--;

            // Update timer displays
            updateTimerDisplay();
        });
    }

    // ==================== WEBSOCKET INITIALIZATION ====================
    function initializeScript() {
        // DEBUG: Log initialization attempt
        if (window.MGA_DEBUG) {
            window.MGA_DEBUG.logStage('INITIALIZE_SCRIPT_CALLED', {
                initialized: UnifiedState.initialized,
                domState: document.readyState,
                retryAttempt: window.MGA_initRetryCount || 0
            });
        }

        if (UnifiedState.initialized) {
            productionLog('⚠️ Magic Garden Unified Assistant already initialized, skipping...');
            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logStage('ALREADY_INITIALIZED', { skipReason: 'UnifiedState.initialized is true' });
            }
            return;
        }

        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            productionLog('⏳ DOM not ready, waiting for DOMContentLoaded...');
            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logStage('DOM_NOT_READY', { domState: document.readyState });
            }
            document.addEventListener('DOMContentLoaded', initializeScript);
            return;
        }

        // REMOVED: Modal check - was causing false positives and infinite retry loops

        // Improved initialization timing to prevent splash screen stall
        productionLog('⏳ Waiting for game initialization to complete...');
        let retryCount = 0;
        const maxRetries = 3;
        // CRITICAL FIX: If game is already ready, don't delay! Only delay if we need to retry
        const gameAlreadyReady = (targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache) && targetWindow.MagicCircle_RoomConnection;
        const initialDelay = gameAlreadyReady ? 0 : 2000;

        const attemptInit = () => {
            // Check if game is ready
            const gameReadiness = {
                jotaiAtomCache: !!targetWindow.jotaiAtomCache,
                magicCircleConnection: !!targetWindow.MagicCircle_RoomConnection,
                jotaiType: typeof targetWindow.jotaiAtomCache,
                connectionType: typeof targetWindow.MagicCircle_RoomConnection
            };

            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logStage('GAME_READINESS_CHECK', {
                    retryCount,
                    maxRetries,
                    gameReadiness,
                    timestamp: performance.now()
                });
            }

            if (targetWindow.jotaiAtomCache && targetWindow.MagicCircle_RoomConnection) {
                productionLog('✅ Game ready, initializing script...');
                if (window.MGA_DEBUG) {
                    window.MGA_DEBUG.logStage('GAME_READY', gameReadiness);
                    // Safe performance metric setting
                    if (window.MGA_DEBUG.performanceMetrics) {
                        window.MGA_DEBUG.performanceMetrics.gameReady = performance.now();
                    }
                }
                continueInitialization();
            } else if (retryCount < maxRetries) {
                retryCount++;
                productionLog(`⏳ Game not ready (jotaiAtomCache: ${!!targetWindow.jotaiAtomCache}, RoomConnection: ${!!targetWindow.MagicCircle_RoomConnection}), retry ${retryCount}/${maxRetries} in 1s...`);
                if (window.MGA_DEBUG) {
                    window.MGA_DEBUG.logStage('GAME_NOT_READY_RETRYING', { retryCount, gameReadiness });
                }
                setTimeout(attemptInit, 1000);
            } else {
                productionWarn('⚠️ Max retries reached, initializing anyway...');
                if (window.MGA_DEBUG) {
                    window.MGA_DEBUG.logStage('MAX_RETRIES_REACHED', { retryCount, gameReadiness });
                }
                continueInitialization();
            }
        };

        setTimeout(attemptInit, initialDelay);

        // CRITICAL: Ensure intervals start even if initialization partially fails
        setTimeout(() => {
            if (typeof window.notificationInterval === 'undefined' || !window._mgaIntervalsStarted) {
                productionWarn('⚠️ [FAILSAFE] Intervals not started after 30s, forcing start...');
                try {
                    if (typeof startIntervals === 'function') {
                        startIntervals();
                        productionLog('✅ [FAILSAFE] Successfully started intervals');
                    } else {
                        console.error('❌ [FAILSAFE] startIntervals function not found!');
                    }
                } catch(e) {
                    console.error('❌ [FAILSAFE] Could not start intervals:', e);
                }
            } else {
                productionLog('✅ [FAILSAFE] Intervals already running, no action needed');
            }
        }, 30000); // Failsafe after 30 seconds

        function continueInitialization() {
            productionLog('🌱 Magic Garden Unified Assistant initializing...');
            productionLog('📊 Connection Status:', targetWindow.MagicCircle_RoomConnection ? '✅ Available' : '❌ Not found');

            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logStage('CONTINUE_INITIALIZATION', {
                    connectionStatus: !!targetWindow.MagicCircle_RoomConnection,
                    jotaiStatus: !!targetWindow.jotaiAtomCache,
                    domState: document.readyState,
                    timestamp: performance.now()
                });
            }

        // ==================== IDLE PREVENTION MOVED ====================
        // NOTE: Idle prevention code has been moved to line ~380 to execute immediately
        // This ensures the game doesn't kick users out while the script loads
        productionLog('📝 [IDLE-PREVENTION] Idle prevention already applied at script start');

        try {
            // Load saved data
            productionLog('💾 Loading saved data...');
            loadSavedData();

            // Initialize Firebase for room status tracking
            productionLog('📡 Initializing Firebase for room tracking...');
            initializeFirebase().then(firebase => {
                if (firebase) {
                    startRoomReporting(firebase);
                    startRoomListener(firebase);
                    productionLog('✅ Room tracking active');
                }
            }).catch(err => {
                console.error('Firebase initialization error:', err);
            });

            // Verify data loaded before UI creation
            // productionLog('🔍 [STARTUP-VERIFY] Data loaded before UI creation:', {
            //     petPresets: Object.keys(UnifiedState.data.petPresets).length,
            //     seedsToDelete: UnifiedState.data.seedsToDelete.length,
            //     autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled,
            //     dataLoaded: !!UnifiedState.data
            // });

            // Create UI
            // productionLog('🎨 Creating UI...');
            if (window.MGA_DEBUG) {
                window.MGA_DEBUG.logStage('CREATE_UI_STARTING', {
                    dataLoaded: !!UnifiedState.data,
                    petPresets: Object.keys(UnifiedState.data?.petPresets || {}).length,
                    targetDocumentReady: !!targetDocument.body
                });
            }

            try {
                createUnifiedUI();

                if (window.MGA_DEBUG) {
                    window.MGA_DEBUG.logStage('CREATE_UI_COMPLETED', {
                        uiElements: targetDocument.querySelectorAll('.mga-panel, .mga-toggle-btn').length,
                        mainPanelExists: !!targetDocument.querySelector('.mga-panel'),
                        toggleBtnExists: !!targetDocument.querySelector('.mga-toggle-btn')
                    });
                    // Safe performance metric setting
                    if (window.MGA_DEBUG.performanceMetrics) {
                        window.MGA_DEBUG.performanceMetrics.uiCreated = performance.now();
                    }
                }
            } catch (error) {
                console.error('❌ Error creating UI:', error);
                if (window.MGA_DEBUG) {
                    window.MGA_DEBUG.logError(error, 'createUnifiedUI');
                }
                productionWarn('⚠️ UI creation failed, but continuing with initialization...');
                // DON'T throw error - continue with intervals even if UI fails
            }

            // Verify UI reflects loaded data immediately after creation
            setTimeout(() => {
                const checkedSeeds = targetDocument.querySelectorAll('.seed-checkbox:checked');
                // productionLog('🔍 [UI-VERIFY] UI state after creation:', {
                //     checkedSeedsInUI: checkedSeeds.length,
                //     seedsInState: UnifiedState.data.seedsToDelete.length,
                //     matches: checkedSeeds.length === UnifiedState.data.seedsToDelete.length
                // });
            }, 100);

            // Initialize atom hooks
            productionLog('🔗 Initializing atom hooks...');
            initializeAtoms();

            // Initialize turtle timer
            productionLog('🐢 Initializing turtle timer...');
            initializeTurtleTimer();

            // Start monitoring intervals
            productionLog('⏱️ Starting monitoring intervals...');
            startIntervals();

            // Apply saved UI mode
            if (UnifiedState.data.settings.ultraCompactMode) {
                productionLog('📱 Applying saved ultra-compact mode...');
                applyUltraCompactMode(true);
            }

            // Initialize keyboard shortcuts
            initializeKeyboardShortcuts();

            // Force UI refresh to apply saved state (timing fix for data persistence)
            productionLog('🔄 Applying delayed UI refresh to ensure saved state is displayed...');
            setTimeout(() => {
                productionLog('🔄 [DATA-PERSISTENCE] Applying delayed UI refresh...');

                // Verify data before refreshing UI
                productionLog('📊 [DATA-PERSISTENCE] Current state:', {
                    petPresets: Object.keys(UnifiedState.data.petPresets).length,
                    seedsToDelete: UnifiedState.data.seedsToDelete.length,
                    autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled
                });

                // Update main tab content to reflect loaded data
                if (typeof updateTabContent === 'function') {
                    updateTabContent();
                    productionLog('✅ [DATA-PERSISTENCE] UI refreshed with saved state');
                }

                // Update any open popout overlays
                if (UnifiedState.data?.popouts?.overlays) {
                    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                        if (overlay && document.contains(overlay)) {
                            try {
                                const content = getContentForTab(tabName, true);
                                const contentEl = overlay.querySelector('.mga-overlay-content, .mga-content');
                                if (contentEl) {
                                    contentEl.innerHTML = content;
                                    // Set up handlers for the refreshed content
                                    if (tabName === 'seeds' && typeof setupSeedsTabHandlers === 'function') {
                                        setupSeedsTabHandlers(overlay);
                                    } else if (tabName === 'pets' && typeof setupPetsTabHandlers === 'function') {
                                        setupPetsTabHandlers(overlay);
                                    }
                                    productionLog(`✅ [DATA-PERSISTENCE] Refreshed ${tabName} overlay with saved state`);
                                }
                            } catch (error) {
                                productionWarn(`⚠️ [DATA-PERSISTENCE] Failed to refresh ${tabName} overlay:`, error);
                            }
                        }
                    });
                }
            }, 1000); // 1000ms delay to ensure all data loading is complete (increased for refresh stability)

            // Initialize teleport system
            initializeTeleportSystem();

            // Initialize crop highlighting system
            setupCropHighlightingSystem();

            // Initialize hotkey system
            initializeHotkeySystem();

            // Initialize tooltip system
            if (window.MGA_Tooltips) {
                window.MGA_Tooltips.init();
                productionLog('💬 Tooltip system initialized');
            }

            UnifiedState.initialized = true;
            window._MGA_INITIALIZED = true;
            try {
                delete window._MGA_INITIALIZING;
            } catch (e) {
                window._MGA_INITIALIZING = false;
            }
            window._MGA_TIMESTAMP = Date.now();  // Update timestamp on completion

            // NOW run conflict detection after game has loaded successfully
            // productionLog('🔍 [MGA-ISOLATION] Running post-initialization MainScript conflict detection...');
            if (window.MGA_ConflictDetection) {
                // Detect MainScript presence
                const mainScriptDetected = window.MGA_ConflictDetection.detectMainScript();

                // Only create barriers if MainScript is detected
                if (mainScriptDetected) {
                    productionLog('🔒 [MGA-ISOLATION] MainScript detected - creating protective barriers');
                    window.MGA_ConflictDetection.createIsolationBarrier();
                    window.MGA_ConflictDetection.preventAccess();
                }

                // Run integrity checks
                const integrityOk = window.MGA_ConflictDetection.checkGlobalIntegrity();
                const isolationOk = window.MGA_ConflictDetection.validateIsolation();

                if (integrityOk && isolationOk) {
                    productionLog('✅ [MGA-ISOLATION] Final integrity check passed - no conflicts detected');
                    if (mainScriptDetected) {
                        productionLog('✅ [MGA-ISOLATION] Complete isolation validated - MainScript protection active');
                    }
                } else {
                    productionWarn('⚠️ [MGA-ISOLATION] Final integrity check found potential conflicts');
                    if (!integrityOk) productionWarn('⚠️ [MGA-ISOLATION] Global integrity issues detected');
                    if (!isolationOk) productionWarn('⚠️ [MGA-ISOLATION] Isolation validation failed');
                }
            } else {
                productionWarn('⚠️ [MGA-ISOLATION] ConflictDetection not available - running without isolation');
            }

            productionLog('✅ Magic Garden Unified Assistant initialized successfully!');

            // Remove test UI after successful initialization
            const testUI = targetDocument.querySelector('div[style*="Test UI Active"]') ||
                          targetDocument.querySelector('div[style*="MGA Test UI"]') ||
                          Array.from(targetDocument.querySelectorAll('div')).find(div =>
                              div.textContent && div.textContent.includes('Test UI Active'));
            if (testUI) {
                testUI.remove();
                debugLog('UI_LIFECYCLE', 'Test UI removed after successful initialization');
            }

            // Check connection status periodically using managed interval
            setManagedInterval('connectionCheck', () => {
                const hasConnection = targetWindow.MagicCircle_RoomConnection &&
                                    typeof targetWindow.MagicCircle_RoomConnection.sendMessage === 'function';
                if (!UnifiedState.connectionStatus && hasConnection) {
                    productionLog('🔌 Game connection established!');
                    UnifiedState.connectionStatus = true;
                } else if (UnifiedState.connectionStatus && !hasConnection) {
                    productionWarn('⚠️ Game connection lost!');
                    UnifiedState.connectionStatus = false;
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Failed to initialize Magic Garden Unified Assistant:', error);
            console.error('Stack trace:', error.stack);
            UnifiedState.initialized = false; // Allow retry
        }
        } // End continueInitialization function
    }

    // ==================== ENVIRONMENT-AWARE INITIALIZATION ====================
    /* CHECKPOINT removed: ENVIRONMENT_INITIALIZATION_START */

    function initializeBasedOnEnvironment() {
        /* CHECKPOINT removed: DETECT_ENVIRONMENT_CALL */
        const environment = detectEnvironment();
        /* CHECKPOINT removed: DETECT_ENVIRONMENT_COMPLETE */

        productionLog('📊 Environment Analysis:', {
            domain: environment.domain,
            strategy: environment.initStrategy,
            isGame: environment.isGameEnvironment,
            hasAtoms: environment.hasJotaiAtoms,
            hasConnection: environment.hasMagicCircleConnection
        });

        switch (environment.initStrategy) {
            case 'game-ready':
                productionLog('✅ Game environment ready - initializing with full integration');
                initializeScript();
                break;

            case 'game-wait':
                productionLog('⏳ Game environment detected - waiting for game atoms...');
                waitForGameReady();
                break;

            case 'standalone':
                productionLog('🎮 Standalone environment - initializing demo mode');
                initializeStandalone();
                break;

            default:
                productionLog('❓ Unknown environment - attempting standalone mode');
                initializeStandalone();
                break;
        }
    }

    function waitForGameReady() {
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds at 500ms intervals

        const checkGameReady = () => {
            // More flexible game readiness check - be less strict about requirements
            const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
            const hasAtoms = atomCache && typeof atomCache === 'object';
            const hasConnection = targetWindow.MagicCircle_RoomConnection && typeof targetWindow.MagicCircle_RoomConnection === 'object';
            const hasBasicDom = targetDocument.body && document.readyState === 'complete';

            // Check for alternative game indicators if primary ones fail (use regular document for game detection)
            const hasGameElements = document.querySelector('canvas') ||
                                  document.querySelector('[class*="game"]') ||
                                  document.querySelector('[id*="game"]') ||
                                  document.querySelector('div[style*="position"]');

            // Additional check: verify atoms actually contain expected keys
            const atomsReady = hasAtoms && atomCache.size > 0;

            // Be more lenient - initialize if we have DOM ready and some game indicators
            if ((atomsReady && hasConnection && hasBasicDom) ||
                (hasBasicDom && hasGameElements && attempts >= 10)) {

                if (atomsReady && hasConnection) {
                    productionLog('✅ Game atoms and connection fully ready - switching to full mode');
                    productionLog('📊 [GAME-READY] Atoms count:', atomCache.size);
                } else {
                    productionLog('✅ Game elements detected, proceeding with reduced functionality mode');
                }

                initializeScript();
                return true;
            }

            // Debug logging for what's missing
            if (attempts % 8 === 0) { // Every 4 seconds
                productionLog('⏳ [GAME-WAIT] Still waiting...', {
                    hasAtoms,
                    atomsCount: hasAtoms ? atomCache.size : 0,
                    hasConnection,
                    hasBasicDom,
                    hasGameElements,
                    readyState: document.readyState,
                    attempt: attempts,
                    willProceedAt: attempts >= 10 ? 'Next check (fallback mode)' : `Attempt ${10 - attempts} more`
                });
            }

            return false;
        };

        if (!checkGameReady()) {
            // Use managed interval for game check
            setManagedInterval('gameCheck', () => {
                attempts++;

                if (checkGameReady() || attempts >= maxAttempts) {
                    clearManagedInterval('gameCheck');

                    if (attempts >= maxAttempts) {
                        productionLog('⚠️ Game readiness timeout - falling back to demo mode');
                        productionLog('💡 You can try MGA.init() later if the game loads');
                        initializeStandalone();
                    }
                }
            }, 500);
        }
    }

    // Start environment-based initialization
    /* CHECKPOINT removed: CALLING_MAIN_INITIALIZATION */
    try {
        initializeBasedOnEnvironment();
        /* CHECKPOINT removed: MAIN_INITIALIZATION_COMPLETE */
    } catch (error) {
        console.error('❌ MAIN_INITIALIZATION_FAILED:', error);
        console.error('🔧 This error caused the script to stop working');
    }

    // ==================== IMMEDIATE TEST INITIALIZATION ====================
    // Additional fallback for manual testing - only if initialization failed
    productionLog('🧪 Setting up fallback timer for manual testing...');
    setTimeout(() => {
        // Only run demo mode if game mode completely failed to initialize
        if (!UnifiedState.initialized && !window._MGA_INITIALIZING) {
            productionLog('🔧 Final fallback - trying demo mode');
            productionLog('💡 Use MGA.init() to force game mode initialization if needed');
            initializeStandalone();
        } else if (UnifiedState.initialized) {
            productionLog('✅ Game mode already initialized - skipping demo fallback');
        }
    }, 5000);

    // ==================== PUBLIC API ====================
    // Expose unified state for debugging
    window.MGA = {
        state: UnifiedState,

        // Manual controls
        showPanel: () => {
            if (UnifiedState.panels.main) {
                UnifiedState.panels.main.style.display = 'block';
            }
        },

        hidePanel: () => {
            if (UnifiedState.panels.main) {
                UnifiedState.panels.main.style.display = 'none';
            }
        },

        // Manual initialization - use if script doesn't auto-initialize
        init: () => {
            productionLog('🔄 Manual initialization requested...');
            UnifiedState.initialized = false; // Reset flag
            initializeScript();
        },

        // Recovery function for stuck initialization
        forceReinit: () => {
            productionLog('🔄 Force reinitialization requested...');
            try {
                delete window._MGA_INITIALIZING;
            } catch (e) {
                window._MGA_INITIALIZING = undefined;
            }
            try {
                delete window._MGA_INITIALIZED;
            } catch (e) {
                window._MGA_INITIALIZED = undefined;
            }
            try {
                delete window._MGA_TIMESTAMP;
            } catch (e) {
                window._MGA_TIMESTAMP = undefined;
            }
            window._MGA_FORCE_INIT = true;
            location.reload();
        },

        // Data persistence diagnostics
        checkPersistence: () => {
            productionLog('📊 Data Persistence Check:');
            productionLog('  Pet Presets in State:', Object.keys(UnifiedState.data.petPresets).length);
            productionLog('  Pet Presets in Storage:', localStorage.getItem('MGA_petPresets') ? 'EXISTS' : 'MISSING');
            productionLog('  Seeds in State:', UnifiedState.data.seedsToDelete.length);
            productionLog('  Seeds in Storage:', localStorage.getItem('MGA_seedsToDelete') ? 'EXISTS' : 'MISSING');

            if (localStorage.getItem('MGA_petPresets')) {
                productionLog('  Raw Presets:', localStorage.getItem('MGA_petPresets'));
            }
            if (localStorage.getItem('MGA_seedsToDelete')) {
                productionLog('  Raw Seeds:', localStorage.getItem('MGA_seedsToDelete'));
            }
        },

        // Pop-out functionality
        popout: {
            openTab: (tabName) => openTabInPopout(tabName),
            openSeparateWindow: (tabName) => openTabInSeparateWindow(tabName),
            createOverlay: (tabName) => createInGameOverlay(tabName),
            closeOverlay: (tabName) => closeInGameOverlay(tabName),
            refreshOverlay: (tabName) => refreshOverlayContent(tabName)
        },

        // Debug functions
        debug: {
            logState: () => productionLog('MGA State:', UnifiedState),
            logAtoms: () => productionLog('Atoms:', UnifiedState.atoms),
            logData: () => productionLog('Data:', UnifiedState.data),
            testTheming: () => {
                productionLog('🎨 Testing universal theming system...');
                productionLog('Current theme:', UnifiedState.currentTheme);
                productionLog('Active overlays:', UnifiedState.data.popouts.overlays.size);
                productionLog('Theme sync working:', !!UnifiedState.currentTheme);

                // Apply a test theme change
                const originalStyle = UnifiedState.data.settings.gradientStyle;
                UnifiedState.data.settings.gradientStyle = 'rainbow-burst';
                UnifiedState.data.settings.opacity = 75;
                applyTheme();

                productionLog('✅ Test theme applied! Check all windows for rainbow theme.');
                productionLog('💡 Open a pop-out or overlay to see the theme in action!');

                // Restore original after 5 seconds
                setTimeout(() => {
                    UnifiedState.data.settings.gradientStyle = originalStyle;
                    UnifiedState.data.settings.opacity = 95;
                    applyTheme();
                    productionLog('🔄 Original theme restored.');
                }, 5000);
            },

            checkConnection: () => {
                const hasConnection = targetWindow.MagicCircle_RoomConnection &&
                                    typeof targetWindow.MagicCircle_RoomConnection.sendMessage === 'function';
                productionLog('🔌 Connection Status:', hasConnection ? '✅ Available' : '❌ Not Available');
                productionLog('📡 RoomConnection Object:', targetWindow.MagicCircle_RoomConnection);
                return hasConnection;
            },

            testSendMessage: () => {
                productionLog('🧪 Testing safeSendMessage...');
                const result = safeSendMessage({
                    scopePath: ["Room"],
                    type: "Ping"
                });
                productionLog('Result:', result ? '✅ Success' : '❌ Failed');
                return result;
            },

            debugStorage: () => window.MGA_debugStorage(),

            // Test functions
            testAbilityLog: () => {
                UnifiedState.data.petAbilityLogs.unshift({
                    petName: 'Test Pet',
                    abilityType: 'Test Ability',
                    timestamp: Date.now(),
                    timeString: new Date().toLocaleTimeString(),
                    data: { test: true }
                });

                // Apply memory management for test logs too
                UnifiedState.data.petAbilityLogs = MGA_manageLogMemory(UnifiedState.data.petAbilityLogs);
                MGA_debouncedSave('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
                if (UnifiedState.activeTab === 'abilities') {
                    updateTabContent();
                }
                // Update all overlay windows showing abilities tab
                UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                    if (overlay && document.contains(overlay) && tabName === 'abilities') {
                        if (overlay.className.includes('mga-overlay-content-only')) {
                            // NEW: Pure content overlays - refresh entire overlay
                            updatePureOverlayContent(overlay, tabName);
                            debugLog('OVERLAY_LIFECYCLE', 'Updated pure abilities overlay after test ability');
                        } else {
                            // LEGACY: Old overlay structure
                            const overlayContent = overlay.querySelector('.mga-overlay-content > div');
                            if (overlayContent) {
                                overlayContent.innerHTML = getAbilitiesTabContent();
                                // Update ability log display within this overlay context
                                setTimeout(() => updateAbilityLogDisplay(overlay), 10);
                                // Re-add resize handle after content update
                                setTimeout(() => {
                                    if (!overlay.querySelector('.mga-resize-handle')) {
                                        addResizeHandleToOverlay(overlay);
                                        productionLog('🔧 [RESIZE] Re-added missing resize handle to ability logs overlay');
                                    }
                                }, 50);
                            }
                        }
                    }
                });
            },

            testTimer: () => {
                UnifiedState.data.timers = {
                    seed: 120,
                    egg: 240,
                    tool: 180,
                    lunar: 3600
                };
                if (UnifiedState.activeTab === 'timers') {
                    updateTimerDisplay();
                }
            },

            testValues: () => {
                UnifiedState.data.inventoryValue = 123456;
                UnifiedState.data.tileValue = 78900;
                UnifiedState.data.gardenValue = 456789;
                if (UnifiedState.activeTab === 'values') {
                    updateTabContent();
                }
            }
        },

        // Manual refresh functions
        refresh: {
            pets: () => {
                if (UnifiedState.activeTab === 'pets') {
                    // Use targeted updates instead of full DOM rebuild to prevent UI interruption
                    const context = document.getElementById('mga-tab-content');
                    if (context) {
                        updatePetPresetDropdown(context);
                        // Update popouts without touching main tab
                        refreshSeparateWindowPopouts('pets');
                        UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                            if (overlay && document.contains(overlay) && tabName === 'pets') {
                                if (overlay.className.includes('mga-overlay-content-only')) {
                                    updatePureOverlayContent(overlay, tabName);
                                }
                            }
                        });
                    }
                }
            },
            abilities: () => {
                if (UnifiedState.activeTab === 'abilities') updateTabContent();
            },
            seeds: () => {
                if (UnifiedState.activeTab === 'seeds') updateTabContent();
            },
            values: () => {
                updateValues();
                if (UnifiedState.activeTab === 'values') updateTabContent();
            },
            timers: () => {
                updateTimers();
                if (UnifiedState.activeTab === 'timers') updateTimerDisplay();
            },
            all: () => {
                updateTabContent();
                updateValues();
                updateTimers();
            }
        },

        // Export functions
        export: {
            petPresets: () => {
                const data = JSON.stringify(UnifiedState.data.petPresets, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const link = targetDocument.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'MGA_PetPresets.json';
                link.click();
            },

            abilityLogs: () => exportAbilityLogs(),

            allData: () => {
                const data = JSON.stringify({
                    petPresets: UnifiedState.data.petPresets,
                    petAbilityLogs: UnifiedState.data.petAbilityLogs,
                    settings: {
                        seedsToDelete: UnifiedState.data.seedsToDelete,
                        autoDeleteEnabled: UnifiedState.data.autoDeleteEnabled
                    }
                }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const link = targetDocument.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `MGA_AllData_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
            }
        },

        // Import functions
        import: {
            petPresets: (jsonString) => {
                try {
                    const data = JSON.parse(jsonString);
                    UnifiedState.data.petPresets = data;
                    MGA_saveJSON('MGA_petPresets', data);
                    if (UnifiedState.activeTab === 'pets') {
                        // Use targeted update to prevent UI interruption
                        const context = document.getElementById('mga-tab-content');
                        if (context) {
                            updatePetPresetDropdown(context);
                            refreshSeparateWindowPopouts('pets');
                        }
                    }
                    productionLog('✅ Pet presets imported successfully');
                } catch (e) {
                    console.error('❌ Failed to import pet presets:', e);
                }
            },

            allData: (jsonString) => {
                try {
                    const data = JSON.parse(jsonString);
                    if (data.petPresets) {
                        UnifiedState.data.petPresets = data.petPresets;
                        MGA_saveJSON('MGA_petPresets', data.petPresets);
                    }
                    if (data.petAbilityLogs) {
                        UnifiedState.data.petAbilityLogs = data.petAbilityLogs;
                        MGA_saveJSON('MGA_petAbilityLogs', data.petAbilityLogs);
                    }
                    if (data.settings) {
                        if (data.settings.seedsToDelete) {
                            UnifiedState.data.seedsToDelete = data.settings.seedsToDelete;
                        }
                        if (typeof data.settings.autoDeleteEnabled === 'boolean') {
                            UnifiedState.data.autoDeleteEnabled = data.settings.autoDeleteEnabled;
                        }
                    }
                    updateTabContent();
                    productionLog('✅ All data imported successfully');
                } catch (e) {
                    console.error('❌ Failed to import data:', e);
                }
            }
        },

        // Clear functions
        clear: {
            petPresets: () => {
                if (confirm('Clear all pet presets?')) {
                    UnifiedState.data.petPresets = {};
                    MGA_saveJSON('MGA_petPresets', {});
                    if (UnifiedState.activeTab === 'pets') {
                        // Use targeted update to prevent UI interruption
                        const context = document.getElementById('mga-tab-content');
                        if (context) {
                            updatePetPresetDropdown(context);
                            refreshSeparateWindowPopouts('pets');
                        }
                    }
                }
            },

            abilityLogs: () => {
                if (confirm('Clear all ability logs?')) {
                    UnifiedState.data.petAbilityLogs = [];
                    MGA_saveJSON('MGA_petAbilityLogs', []);
                    if (UnifiedState.activeTab === 'abilities') updateTabContent();

                    // Also update ability overlays
                    UnifiedState.data.popouts.overlays.forEach((overlay, tabName) => {
                        if (overlay && document.contains(overlay) && tabName === 'abilities') {
                            if (overlay.className.includes('mga-overlay-content-only')) {
                                // NEW: Pure content overlays - refresh entire overlay
                                updatePureOverlayContent(overlay, tabName);
                                debugLog('OVERLAY_LIFECYCLE', 'Updated pure abilities overlay after clearing logs');
                            } else {
                                // LEGACY: Old overlay structure
                                const overlayContent = overlay.querySelector('.mga-overlay-content > div');
                                if (overlayContent) {
                                    overlayContent.innerHTML = getAbilitiesTabContent();
                                    setTimeout(() => updateAbilityLogDisplay(overlay), 10);
                                    // Re-add resize handle after content update
                                    setTimeout(() => {
                                        if (!overlay.querySelector('.mga-resize-handle')) {
                                            addResizeHandleToOverlay(overlay);
                                            productionLog('🔧 [RESIZE] Re-added missing resize handle to ability logs overlay');
                                        }
                                    }, 50);
                                }
                            }
                        }
                    });
                }
            },

            allData: () => {
                if (confirm('Clear ALL saved data? This cannot be undone!')) {
                    UnifiedState.data.petPresets = {};
                    UnifiedState.data.petAbilityLogs = [];
                    UnifiedState.data.seedsToDelete = [];
                    UnifiedState.data.autoDeleteEnabled = false;
                    MGA_saveJSON('MGA_petPresets', {});
                    MGA_saveJSON('MGA_petAbilityLogs', []);
                    updateTabContent();
                }
            }
        },

        // Debug controls for development and testing
        debug: {
            forceInit: () => {
                productionLog('🔄 [DEBUG] Force re-initialization requested');
                window._MGA_FORCE_INIT = true;
                location.reload();
            },

            resetFlags: () => {
                productionLog('🔄 [DEBUG] Resetting initialization flags');
                window._MGA_INITIALIZED = false;
                try {
                    delete window._MGA_INITIALIZING;
                } catch (e) {
                    window._MGA_INITIALIZING = false;
                }
                window._MGA_FORCE_INIT = false;
                productionLog('✅ [DEBUG] Flags reset - you can now re-run the script');
            },

            checkPets: () => {
                productionLog('🐾 [DEBUG] Current pet state:');
                productionLog('• UnifiedState.atoms.activePets:', UnifiedState.atoms.activePets);
                productionLog('• window.activePets:', window.activePets);
                productionLog('• Room state pets:', getActivePetsFromRoomState());
                return {
                    unifiedState: UnifiedState.atoms.activePets,
                    windowPets: window.activePets,
                    roomState: getActivePetsFromRoomState()
                };
            },

            refreshPets: () => {
                productionLog('🔄 [DEBUG] Manually refreshing pets from room state');
                const pets = updateActivePetsFromRoomState();
                productionLog('✅ [DEBUG] Pets refreshed:', pets);
                return pets;
            },

            listIntervals: () => {
                productionLog('⏰ [DEBUG] Active managed intervals:');
                Object.entries(UnifiedState.intervals).forEach(([name, interval]) => {
                    productionLog(`• ${name}: ${interval ? 'Running' : 'Stopped'}`);
                });
                return UnifiedState.intervals;
            }
        }
    };

    // ==================== LOADING STATE UTILITIES ====================
    window.MGA_LoadingStates = {
        show: (element, text = 'Loading...') => {
            if (!element) return;
            const loadingHtml = `
                <div class="mga-loading">
                    <div class="mga-loading-spinner"></div>
                    <span>${text}</span>
                </div>
            `;
            element.innerHTML = loadingHtml;
        },

        showSkeleton: (element, lines = 3) => {
            if (!element) return;
            const skeletonLines = Array(lines).fill(0).map(() =>
                `<div class="mga-skeleton" style="height: 20px; margin-bottom: 8px; width: ${Math.floor(Math.random() * 40 + 60)}%;"></div>`
            ).join('');
            element.innerHTML = `<div style="padding: 20px;">${skeletonLines}</div>`;
        },

        hide: (element, content, fadeIn = true) => {
            if (!element) return;
            element.innerHTML = content;
            if (fadeIn) {
                element.classList.add('mga-fade-in');
                setTimeout(() => element.classList.remove('mga-fade-in'), 300);
            }
        },

        addToButton: (button, originalText) => {
            if (!button) return;
            button.disabled = true;
            button.innerHTML = `<div class="mga-loading-spinner" style="margin-right: 4px; width: 16px; height: 16px;"></div>Loading...`;
        },

        removeFromButton: (button, originalText) => {
            if (!button) return;
            button.disabled = false;
            button.innerHTML = originalText;
        }
    };

    // ==================== ERROR RECOVERY MECHANISMS ====================
    window.MGA_ErrorRecovery = {
        wrapFunction: (fn, fallback = null, context = 'Unknown') => {
            return function(...args) {
                try {
                    return fn.apply(this, args);
                } catch (error) {
                    debugError('ERROR_RECOVERY', `Error in ${context}`, error);

                    // Show user-friendly error message
                    const errorToast = targetDocument.createElement('div');
                    errorToast.style.cssText = `
                        position: fixed; top: 20px; right: 20px; z-index: 20000;
                        background: rgba(220, 38, 38, 0.95); color: white;
                        padding: 12px 20px; border-radius: 8px;
                        font-family: Arial, sans-serif; font-size: 13px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                        animation: mga-fade-in 0.3s ease-out;
                    `;
                    errorToast.innerHTML = `⚠️ Something went wrong in ${context}. Please try again.`;
                    targetDocument.body.appendChild(errorToast);

                    setTimeout(() => {
                        errorToast.style.animation = 'mga-fade-out 0.3s ease-in forwards';
                        setTimeout(() => targetDocument.body.removeChild(errorToast), 300);
                    }, 4000);

                    return fallback ? fallback.apply(this, args) : null;
                }
            };
        },

        safeAsync: async (asyncFn, fallback = null, context = 'Async Operation') => {
            try {
                return await asyncFn();
            } catch (error) {
                debugError('ERROR_RECOVERY', `Async error in ${context}`, error);
                return fallback;
            }
        },

        retryOperation: async (operation, maxRetries = 3, delay = 1000, context = 'Operation') => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    return await operation();
                } catch (error) {
                    if (i === maxRetries - 1) {
                        debugError('ERROR_RECOVERY', `Final retry failed for ${context}`, error);
                        throw error;
                    }
                    debugLog('ERROR_RECOVERY', `Retry ${i + 1}/${maxRetries} for ${context}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    };

    // ==================== PERFORMANCE OPTIMIZATIONS ====================
    window.MGA_Performance = {
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        batchDOMUpdates: (updates) => {
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                updates.forEach(update => {
                    if (typeof update === 'function') {
                        update(fragment);
                    }
                });
            });
        },

        optimizeScrolling: (element) => {
            if (!element) return;
            element.style.willChange = 'scroll-position';
            element.style.transform = 'translateZ(0)';
        }
    };

    // ==================== COMPREHENSIVE TOOLTIP SYSTEM ====================
    window.MGA_Tooltips = {
        tooltip: null,
        showTimeout: null,
        hideTimeout: null,
        currentEvent: null, // Store current mouse event for positioning

        init: () => {
            // Create tooltip element
            if (!window.MGA_Tooltips.tooltip) {
                window.MGA_Tooltips.tooltip = targetDocument.createElement('div');
                window.MGA_Tooltips.tooltip.className = 'mga-tooltip';
                targetDocument.body.appendChild(window.MGA_Tooltips.tooltip);
            }

            // Add event listeners to all elements with tooltip data
            document.addEventListener('mouseenter', window.MGA_Tooltips.handleMouseEnter, true);
            document.addEventListener('mouseleave', window.MGA_Tooltips.handleMouseLeave, true);
            document.addEventListener('mousemove', window.MGA_Tooltips.handleMouseMove, true);
        },

        handleMouseEnter: (e) => {
            const element = e.target?.closest?.('[data-tooltip]');
            if (!element) return;

            // Don't interfere with button interactions - check if target is a button or interactive element
            if (e.target && typeof e.target.matches === 'function' &&
                (e.target.matches('button, input, select, .mga-btn') || e.target.closest('button, .mga-btn'))) {
                return; // Skip tooltip for interactive elements to prevent hover interference
            }

            const text = element.dataset.tooltip;
            const delay = element.dataset.tooltipDelay || 500;

            // Store the event for positioning
            window.MGA_Tooltips.currentEvent = e;

            window.MGA_Tooltips.showTimeout = setTimeout(() => {
                window.MGA_Tooltips.show(element, text);
            }, parseInt(delay));
        },

        handleMouseLeave: (e) => {
            const element = e.target?.closest?.('[data-tooltip]');
            if (!element) return;

            clearTimeout(window.MGA_Tooltips.showTimeout);
            window.MGA_Tooltips.hide();
        },

        handleMouseMove: (e) => {
            // CRITICAL: Only handle MGA-related tooltip events
            if (!isMGAEvent(e)) {
                return;
            }

            // Don't interfere with button hover states
            if (e.target && typeof e.target.matches === 'function' &&
                (e.target.matches('button, input, select, .mga-btn') || e.target.closest('button, .mga-btn'))) {
                return;
            }

            // Update current event for positioning
            window.MGA_Tooltips.currentEvent = e;

            if (window.MGA_Tooltips.tooltip && window.MGA_Tooltips.tooltip.classList.contains('show')) {
                // Check if we're still over a tooltip element
                const tooltipElement = e.target?.closest?.('[data-tooltip]');
                if (!tooltipElement) {
                    window.MGA_Tooltips.hide();
                    return;
                }
                window.MGA_Tooltips.position(e);
            }
        },

        show: (element, text) => {
            const tooltip = window.MGA_Tooltips.tooltip;
            tooltip.textContent = text;

            // BUGFIX: Position immediately before showing to prevent flash at (0,0)
            if (window.MGA_Tooltips.currentEvent) {
                window.MGA_Tooltips.position(window.MGA_Tooltips.currentEvent);
            }

            tooltip.classList.add('show');
        },

        hide: () => {
            const tooltip = window.MGA_Tooltips.tooltip;
            tooltip.classList.remove('show');

            // BUGFIX: Reset position to prevent stuck tooltips
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
            window.MGA_Tooltips.currentEvent = null;
        },

        position: (e) => {
            const tooltip = window.MGA_Tooltips.tooltip;
            const rect = tooltip.getBoundingClientRect();
            const padding = 10;

            let x = e.clientX + padding;
            let y = e.clientY - rect.height - padding;

            // Adjust if tooltip goes off screen
            if (x + rect.width > window.innerWidth) {
                x = e.clientX - rect.width - padding;
            }
            if (y < 0) {
                y = e.clientY + padding;
            }

            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
        },

        addToElement: (element, text, options = {}) => {
            if (!element) return;
            element.setAttribute('data-tooltip', text);
            if (options.delay) element.setAttribute('data-tooltip-delay', options.delay);
        },

        removeFromElement: (element) => {
            if (!element) return;
            element.removeAttribute('data-tooltip');
            element.removeAttribute('data-tooltip-delay');
        }
    };

    // Add fade-out animation for error toasts
    const additionalStyles = `
        @keyframes mga-fade-out {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    const styleSheet = targetDocument.createElement('style');
    styleSheet.textContent = additionalStyles;
    targetDocument.head.appendChild(styleSheet);




    // ==================== AUTO-SAVE ====================
    // Auto-save data every 30 seconds using managed interval
    setManagedInterval('autoSave', () => {
        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        MGA_saveJSON('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
        MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
        MGA_saveJSON('MGA_autoDeleteEnabled', UnifiedState.data.autoDeleteEnabled);

        // Update resource tracking
        if (window.resourceDashboard) {
            window.resourceDashboard.updateResourceHistory();
        }
    }, 30000);

    // ==================== CLEANUP ====================
    window.addEventListener('beforeunload', () => {
        // Save all data before leaving - CRITICAL: Use immediate saves, not debounced!
        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        MGA_saveJSON('MGA_petAbilityLogs', UnifiedState.data.petAbilityLogs);
        MGA_saveJSON('MGA_seedsToDelete', UnifiedState.data.seedsToDelete);
        MGA_saveJSON('MGA_autoDeleteEnabled', UnifiedState.data.autoDeleteEnabled);

        // Clean up all managed intervals
        clearAllManagedIntervals();

        // Close all popout windows
        closeAllPopoutWindows();

        debugLog('PERFORMANCE', 'Cleanup completed on window unload');
    });

    // ==================== VERSION INFO ====================
    productionLog(
        "╔════════════════════════════════════════╗\n" +
        "║   🌱 Magic Garden Unified Assistant    ║\n" +
        "║            Version 1.3.2               ║\n" +
        "║                                        ║\n" +
        "║  🎮 Works in ANY browser console!     ║\n" +
        "║  • Game Mode: Full integration        ║\n" +
        "║  • Demo Mode: Standalone with samples ║\n" +
        "║                                        ║\n" +
        "║  Features:                             ║\n" +
        "║  • Pet Loadout Management             ║\n" +
        "║  • Ability Log Tracking               ║\n" +
        "║  • Seed Deletion & Auto-Delete        ║\n" +
        "║  • Value Calculations                 ║\n" +
        "║  • Restock & Event Timers            ║\n" +
        "║  • Theme Customization                ║\n" +
        "║  • Pop-out Windows                    ║\n" +
        "║                                        ║\n" +
        "║  Controls:                            ║\n" +
        "║  • window.MGA - Full API              ║\n" +
        "║  • MGA.showPanel() - Show UI          ║\n" +
        "║  • MGA.init() - Manual start          ║\n" +
        "║  • Alt+M - Toggle apanel               ║\n" +
        "║                                        ║\n" +
        "║  Debugging (if issues occur):         ║\n" +
        "║  • MGA.debug.debugStorage() - Storage ║\n" +
        "║  • MGA_debugStorage() - Same as above ║\n" +
        "╚════════════════════════════════════════╝"
    );

    // ==================== IMMEDIATE INITIALIZATION TEST ====================
    // Final safety initialization for testing - removed to prevent demo mode interference
    // Demo mode is only triggered by the 8-second fallback if game mode completely fails
    productionLog('🧪 Skipping 2-second fallback to prevent demo mode interference');

    // Final checkpoint - script execution complete
    /* CHECKPOINT removed: SCRIPT_EXECUTION_COMPLETE */
    productionLog('✅ Magic Garden Assistant script finished loading');

}
})();
